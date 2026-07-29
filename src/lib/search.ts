import { prisma } from "@/lib/prisma";

export type SearchResult = {
  type: "module" | "category" | "task";
  id: string;
  name: string;
  description: string;
  href: string;
  categoryName: string;
};

// Minúsculas + sin tildes/diacríticos, para tolerar variaciones de acentos
// (ej. "pintura" encuentra "Pintura" aunque el usuario no tipee la tilde,
// y viceversa) sin depender de la extensión unaccent de Postgres.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Palabras de relleno frecuentes en preguntas naturales ("¿Cuántos
// ladrillos necesito para un muro?") que no aportan ningún contenido
// buscable — sin filtrarlas, el AND estricto por token falla apenas el
// usuario escribe una pregunta en vez de una lista de palabras clave.
const STOPWORDS = new Set([
  "cuanto", "cuantos", "cuanta", "cuantas", "que", "como", "cual", "cuales",
  "de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas",
  "para", "con", "y", "o", "en", "por", "al", "es", "mi", "necesito", "quiero",
]);

function tokenize(value: string): string[] {
  const all = normalize(value).split(/\s+/).filter(Boolean);
  const meaningful = all.filter((t) => !STOPWORDS.has(t));
  // Si TODO era relleno (raro, pero posible con una query de 1 palabra que
  // coincide con una stopword), no nos quedamos sin tokens para buscar.
  return meaningful.length > 0 ? meaningful : all;
}

// Peso por campo para el fallback por tokens — menor = mejor/más relevante.
// "name" pesa más que "searchKeywords", que a su vez pesa más que
// "description", tal como pide la regla de ranking.
const FIELD_WEIGHT = { name: 1, keywords: 2, description: 3 } as const;

// Fallback cuando la frase completa no aparece literal en ningún campo
// (ver scoreMatch): la query se separa en tokens y CADA token debe
// aparecer en AL MENOS UNO de los 3 campos — no necesariamente el mismo
// campo ni en el mismo orden — para que "circuito electrico" encuentre un
// módulo con "circuito" en el name y "eléctrico" solo en la descripción.
// Si algún token no aparece en ningún campo, no hay match (AND estricto).
// El score se arma con el mejor (menor) peso de campo por token,
// promediado, y se desplaza a partir de 5 para que siempre rankee por
// debajo de una coincidencia de frase literal (scores 0-4).
function tokenScore(query: string, name: string, description: string, keywords?: string | null): number | null {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;

  const normalizedName = normalize(name);
  const normalizedDescription = normalize(description);
  const normalizedKeywords = keywords ? normalize(keywords) : "";

  let totalWeight = 0;
  for (const token of tokens) {
    const weights: number[] = [];
    if (normalizedName.includes(token)) weights.push(FIELD_WEIGHT.name);
    if (normalizedKeywords.includes(token)) weights.push(FIELD_WEIGHT.keywords);
    if (normalizedDescription.includes(token)) weights.push(FIELD_WEIGHT.description);
    if (weights.length === 0) return null; // este token no aparece en ningun campo -> sin match
    totalWeight += Math.min(...weights);
  }

  return 5 + totalWeight / tokens.length / 10;
}

// Coincidencia de frase completa (substring/prefijo/exacta) contra un solo
// campo a la vez — nombre exacto/prefijo pesa mucho más que un match
// perdido en la descripción o en las palabras clave.
function phraseScore(query: string, name: string, description: string, keywords?: string | null): number | null {
  const normalizedQuery = normalize(query);
  const normalizedName = normalize(name);

  if (normalizedName === normalizedQuery) return 0;
  if (normalizedName.startsWith(normalizedQuery)) return 1;
  if (normalizedName.includes(normalizedQuery)) return 2;
  if (keywords && normalize(keywords).includes(normalizedQuery)) return 3;
  if (normalize(description).includes(normalizedQuery)) return 4;
  return null;
}

// Corre SIEMPRE los dos caminos (frase completa y tokens) y se queda con
// el mejor score de los dos — nunca uno excluye al otro. Como los rangos
// no se solapan (frase: 0-4, tokens: 5+), la frase gana automáticamente
// cuando ambos matchean, sin necesitar lógica de desempate aparte: un
// match pobre por un lado nunca pisa uno mejor del otro lado.
function scoreMatch(query: string, name: string, description: string, keywords?: string | null): number | null {
  const phrase = phraseScore(query, name, description, keywords);
  const tokens = tokenScore(query, name, description, keywords);
  if (phrase === null) return tokens;
  if (tokens === null) return phrase;
  return Math.min(phrase, tokens);
}

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
        category: { select: { slug: true, name: true } },
      },
    }),
    prisma.category.findMany({
      select: { id: true, slug: true, name: true, description: true },
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
        group: { select: { name: true } },
        moduleLinks: { select: { moduleId: true } },
      },
    }),
  ]);

  // Categoría y ProjectGroup son taxonomías paralelas (Categoría = "por
  // material" en /categorias, ProjectGroup = "qué quieres construir" en
  // /grupos, con fotos vía TaskPhotoCard). Cuando una categoría tiene un
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
    scored.push({
      score,
      result: {
        type: "task",
        id: task.id,
        name: task.name,
        description: task.description ?? "",
        href: `/empezar/${task.slug}`,
        categoryName: task.group.name,
      },
    });
  }

  for (const { moduleId, score, result } of moduleScored) {
    if (suppressedModuleIds.has(moduleId)) continue;
    scored.push({ score, result });
  }

  for (const category of categories) {
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
      },
    });
  }

  scored.sort((a, b) => a.score - b.score || a.result.name.localeCompare(b.result.name, "es"));

  return scored.map((s) => s.result);
}
