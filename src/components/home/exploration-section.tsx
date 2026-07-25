import { prisma } from "@/lib/prisma";
import { ExplorationToggle } from "./exploration-toggle";

// Selección curada a mano (no hay datos reales de popularidad todavía) —
// deliberadamente son las tareas cuyo módulo ya tiene ModuleGuide completo,
// para que "Popular" también signifique "con guía práctica lista".
const CURATED_TASK_SLUGS = [
  "construir-un-radier",
  "pintar-una-habitacion",
  "levantar-un-muro",
  "construir-una-piscina",
  "construir-un-quincho",
];

export async function ExplorationSection() {
  const [groups, categories, popularTasksRaw] = await Promise.all([
    prisma.projectGroup.findMany({
      where: { tasks: { some: {} } },
      orderBy: { order: "asc" },
      include: { tasks: { orderBy: { order: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.projectTask.findMany({
      where: { slug: { in: CURATED_TASK_SLUGS } },
      include: { group: { select: { name: true } } },
    }),
  ]);

  const popularTasks = CURATED_TASK_SLUGS.map((slug) =>
    popularTasksRaw.find((t) => t.slug === slug)
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  if (groups.length === 0 && categories.length === 0) return null;

  return <ExplorationToggle groups={groups} categories={categories} popularTasks={popularTasks} />;
}
