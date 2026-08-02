import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ExplorationToggle } from "./exploration-toggle";

// "Proyectos más buscados" se mudó al carrusel dentro del Hero (ver
// PopularTasksCarousel + lib/popular-tasks.ts) — esta sección ya no lo
// calcula ni lo pasa a ExplorationToggle.
export async function ExplorationSection() {
  const [groups, categories] = await Promise.all([
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
  ]);

  if (groups.length === 0 && categories.length === 0) return null;

  return (
    <Suspense fallback={null}>
      <ExplorationToggle groups={groups} categories={categories} />
    </Suspense>
  );
}
