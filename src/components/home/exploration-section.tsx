import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ExplorationToggle } from "./exploration-toggle";

// Selección curada a mano (no hay datos reales de popularidad todavía) —
// deliberadamente son las tareas cuyo módulo ya tiene ModuleGuide completo,
// para que "Popular" también signifique "con guía práctica lista". Estas 6
// coinciden con las 6 fotos reales disponibles (ver TASK_IMAGES en
// exploration-toggle.tsx) — "construir-una-piscina" se agregó para parejar
// la grilla de 2 columnas en mobile (5 dejaba un hueco) y usa la foto de
// Piscina rectangular, pero enlaza al selector de forma en /grupos/piscinas
// en vez de al módulo directo (ver TASK_HREF_OVERRIDES).
const CURATED_TASK_SLUGS = [
  "construir-un-radier",
  "pintar-una-habitacion",
  "instalar-ceramica",
  "cambiar-o-instalar-un-wc",
  "instalar-un-enchufe-reemplazo",
  "construir-una-piscina",
];

export async function ExplorationSection() {
  const [groups, categories, popularTasksRaw] = await Promise.all([
    prisma.projectGroup.findMany({
      // "Cálculos especiales" (slug real "herramientas-avanzadas") queda
      // fuera de la fila de exploración de Home a propósito — cada cálculo
      // ahí es solo una pieza del proyecto (ej. Pilar/columna no incluye
      // enfierradura/estribos), y mostrarlo junto a los demás grupos daba
      // una falsa sensación de completitud. Sigue existiendo y siendo
      // indexado en /buscar para quien lo busca a propósito, y accesible
      // por URL directa en /grupos/herramientas-avanzadas (con disclaimer
      // reforzado ahí, ver ese page.tsx).
      where: { tasks: { some: {} }, slug: { not: "herramientas-avanzadas" } },
      orderBy: { order: "asc" },
      include: { tasks: { orderBy: { order: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.projectTask.findMany({
      where: { slug: { in: CURATED_TASK_SLUGS } },
      include: { group: { select: { name: true, slug: true } } },
    }),
  ]);

  const popularTasks = CURATED_TASK_SLUGS.map((slug) =>
    popularTasksRaw.find((t) => t.slug === slug)
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  if (groups.length === 0 && categories.length === 0) return null;

  return (
    <Suspense fallback={null}>
      <ExplorationToggle groups={groups} categories={categories} popularTasks={popularTasks} />
    </Suspense>
  );
}
