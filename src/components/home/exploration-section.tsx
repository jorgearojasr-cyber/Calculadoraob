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
    prisma.category.findMany({
      orderBy: { order: "asc" },
      // Saneamiento (2026-09-14, auditoría de producto): antes traía TODAS
      // las categorías sin importar si tenían algún módulo publicado — una
      // categoría vacía (ej. "Quinchos", 0 módulos; o "Fierros", con
      // módulos pero los 4 sin publicar) aparecía en "Por material" como
      // una tarjeta normal, y llevaba a un callejón sin salida ("Todavía
      // no hay calculadoras publicadas en esta categoría"). No se borra
      // ninguna categoría de la BD — solo se deja de anunciar como
      // navegable mientras esté vacía (ver filtro justo debajo).
      include: { modules: { where: { published: true }, select: { id: true }, take: 1 } },
    }),
  ]);

  // Filtro aplicado acá (no en la query, que ya trajo el `include` solo
  // para decidir esto) — el resultado sigue siendo estructuralmente un
  // `Category[]` para ExplorationToggle/CategoryGrid (el campo `modules`
  // de más no rompe esa asignación, TypeScript no hace excess-property
  // checking sobre una variable filtrada, solo sobre un literal).
  const categoriesWithContent = categories.filter((category) => category.modules.length > 0);

  if (groups.length === 0 && categoriesWithContent.length === 0) return null;

  return (
    <Suspense fallback={null}>
      <ExplorationToggle groups={groups} categories={categoriesWithContent} />
    </Suspense>
  );
}
