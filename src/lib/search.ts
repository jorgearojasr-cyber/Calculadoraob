import { prisma } from "@/lib/prisma";
import { TASK_IMAGES } from "@/lib/popular-tasks";
import { getSearchableFeatures, PRODUCT_AREAS } from "@/lib/product-features";
import { normalize, scoreMatch } from "./search-scoring";

// Reexportados por compatibilidad — otros módulos (ver lib/calculators.ts)
// seguían importándolos desde acá antes de la extracción a
// search-scoring.ts (Design Spec v1.0, Parte 2, 2026-09-15).
export { normalize, scoreMatch };

export type SearchResult = {
  type: "module" | "category" | "task" | "feature";
  id: string;
  name: string;
  description: string;
  href: string;
  categoryName: string;
  // Solo poblado para "module"/"task" (tarjetas de proyecto/calculadora,
  // ver ProjectCard) — "category"/"feature" no representan un cálculo, no
  // tienen imagen ni cantidad de pasos.
  imageUrl: string | null;
  stepCount: number | null;
};

// Cimientos de arquitectura (2026-09-14) — antes esta lista vivía acá mismo
// (fase de saneamiento, rama saneamiento-navegacion-guias): un array
// FEATURES local con Inspecciones/Regularización/Guías/Biblioteca a mano.
// Se saca a `src/lib/product-features.ts` (el registro central de features
// standalone) para que el buscador y el menú (TopNav/MobileTopBar) lean la
// MISMA fuente — ver ese archivo para el porqué y qué NO es. `getSearchableFeatures()`
// ya filtra `status:"available" && showInSearch`, así que acá no hace falta
// repetir ese chequeo. Las keywords y el comportamiento de búsqueda
// (scoreMatch, frase + tokens) quedan IDÉNTICOS a como estaban.

export async function searchContent(rawQuery: string): Promise<SearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const [modules, categories, groups, tasks] = await Promise.all([
    prisma.module.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        searchKeywords: true,
        imageUrl: true,
        _count: { select: { questions: true } },
        category: { select: { slug: true, name: true } },
      },
    }),
    prisma.category.findMany({
      // Saneamiento (2026-09-14): antes traía TODAS las categorías, sin
      // importar si tenían algún módulo publicado — una categoría vacía
      // (ej. "Quinchos", 0 módulos; o "Fierros", con módulos pero los 4 sin
      // publicar) aparecía como resultado de búsqueda igual que cualquier
      // otra, y llevaba a /categorias/[slug] mostrando "Todavía no hay
      // calculadoras publicadas". Mismo criterio y misma causa raíz que el
      // fix de exploration-section.tsx (Home) — se corrige acá también
      // porque es una fuente de datos independiente, no la misma consulta.
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        modules: { where: { published: true }, select: { id: true }, take: 1 },
      },
    }),
    prisma.projectGroup.findMany({
      where: { tasks: { some: {} } },
      select: { slug: true, name: true },
    }),
    prisma.projectTask.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        imageUrl: true,
        group: { select: { name: true } },
        moduleLinks: {
          orderBy: { order: "asc" },
          select: {
            moduleId: true,
            imageUrl: true,
            module: { select: { imageUrl: true, _count: { select: { questions: true } } } },
          },
        },
      },
    }),
  ]);

  // Categoría y ProjectGroup son taxonomías paralelas (Categoría = "por
  // material" en /categorias, ProjectGroup = "qué quieres construir" en
  // /grupos, con fotos vía ProjectCard). Cuando una categoría tiene un
  // grupo homónimo, el resultado de búsqueda lleva a /grupos en vez de
  // /categorias — evita que buscar "piscina" caiga en el listado de texto
  // plano cuando ya existe la versión con fotos para lo mismo.
  const groupSlugByName = new Map(groups.map((g) => [normalize(g.name), g.slug]));

  const scored: { result: SearchResult; score: number }[] = [];

  const moduleScored: { moduleId: string; score: number; result: SearchResult }[] = [];
  for (const mod of modules) {
    const score = scoreMatch(query, mod.name, mod.description, mod.searchKeywords);
    if (score === null) continue;
    moduleScored.push({
      moduleId: mod.id,
      score,
      result: {
        type: "module",
        id: mod.id,
        name: mod.name,
        description: mod.description,
        href: `/categorias/${mod.category.slug}/${mod.slug}`,
        categoryName: mod.category.name,
        imageUrl: mod.imageUrl,
        stepCount: mod._count.questions,
      },
    });
  }

  // ProjectTask: no tiene searchKeywords propio (solo name/description),
  // así que el 3er argumento de scoreMatch queda undefined. El href
  // siempre es /empezar/[slug] — esa ruta ya resuelve sola si es un solo
  // módulo (redirect directo), un plan, una quickGuide, o un selector de
  // 2+ opciones (ver empezar/[taskSlug]/page.tsx), así que no hace falta
  // duplicar esa lógica acá.
  //
  // Deduplicación: cuando una tarea con EXACTAMENTE 1 moduleLink matchea
  // la query, se suprime el resultado del módulo que enlaza (mostrar los
  // dos sería el mismo cálculo repetido dos veces con nombres distintos —
  // el caso común, ~35 de ~40 tareas). Con 2+ links (ej. Piscina,
  // Excavación circular) NO se suprime nada: la tarea lleva al selector y
  // cada módulo es una opción realmente distinta que alguien puede buscar
  // por su nombre específico ("piscina circular").
  const suppressedModuleIds = new Set<string>();
  for (const task of tasks) {
    const score = scoreMatch(query, task.name, task.description ?? "");
    if (score === null) continue;
    if (task.moduleLinks.length === 1) {
      suppressedModuleIds.add(task.moduleLinks[0].moduleId);
    }
    const firstLink = task.moduleLinks[0];
    scored.push({
      score,
      result: {
        type: "task",
        id: task.id,
        name: task.name,
        description: task.description ?? "",
        href: `/empezar/${task.slug}`,
        categoryName: task.group.name,
        // TASK_IMAGES (curada a mano, Fase 7) tiene prioridad — mismas 6
        // fotos ya aprobadas y visibles en el carrusel de Home; sin esto,
        // un resultado de búsqueda para esas mismas tareas mostraría
        // placeholder en vez de la foto real ya disponible.
        imageUrl: TASK_IMAGES[task.slug] ?? task.imageUrl ?? firstLink?.imageUrl ?? firstLink?.module.imageUrl ?? null,
        stepCount: firstLink?.module._count.questions ?? null,
      },
    });
  }

  for (const { moduleId, score, result } of moduleScored) {
    if (suppressedModuleIds.has(moduleId)) continue;
    scored.push({ score, result });
  }

  for (const category of categories) {
    // Sin módulos publicados: no se ofrece como resultado (ver comentario
    // en la query de arriba) — la categoría sigue existiendo en BD, solo
    // no se anuncia como destino navegable mientras esté vacía.
    if (category.modules.length === 0) continue;
    const score = scoreMatch(query, category.name, category.description);
    if (score === null) continue;
    const matchingGroupSlug = groupSlugByName.get(normalize(category.name));
    scored.push({
      score,
      result: {
        type: "category",
        id: category.id,
        name: category.name,
        description: category.description,
        href: matchingGroupSlug ? `/grupos/${matchingGroupSlug}` : `/categorias/${category.slug}`,
        categoryName: category.name,
        imageUrl: null,
        stepCount: null,
      },
    });
  }

  for (const feature of getSearchableFeatures()) {
    const score = scoreMatch(query, feature.name, feature.description, feature.keywords);
    if (score === null) continue;
    scored.push({
      score,
      result: {
        type: "feature",
        id: feature.id,
        name: feature.name,
        description: feature.description,
        // `href` es requerido en runtime para toda feature con
        // status:"available" (getSearchableFeatures ya filtró por eso) —
        // el "!" documenta esa garantía en vez de forzar el tipo entero a
        // no-opcional (ver comentario en product-features.ts).
        href: feature.href!,
        categoryName: PRODUCT_AREAS[feature.area].label,
        imageUrl: null,
        stepCount: null,
      },
    });
  }

  scored.sort((a, b) => a.score - b.score || a.result.name.localeCompare(b.result.name, "es"));

  return scored.map((s) => s.result);
}
