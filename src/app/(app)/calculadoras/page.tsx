import { prisma } from "@/lib/prisma";
import { CalculatorsExplorer } from "@/components/calculators/calculators-explorer";
import type { CalculatorModule } from "@/lib/calculators";

// Design Spec v1.0 — Parte 2 (Calculadoras/Herramientas), 2026-09-15.
// Nueva ruta canónica /calculadoras (punto 16 del pedido) — ninguna ruta
// existente ofrecía esta experiencia: /categorias/[slug] es el detalle de
// UNA categoría, /grupos/[slug] es "por proyecto" (con fotos, otra
// taxonomía), /buscar mezcla Module con Category/ProjectTask/features
// standalone. Esta pantalla es el catálogo completo con buscador local +
// chips que pedía el Spec, así que se documenta acá la decisión: se creó
// como índice real, no se reutilizó ninguna ruta existente porque ninguna
// cumplía el rol.
export const revalidate = 3600;

export default async function CalculadorasPage() {
  // Mismo criterio que /categorias/[slug] (punto 20 del pedido — "Cálculos
  // especiales" son piezas puntuales de diseño estructural, no el objetivo
  // de una persona sin conocimiento técnico buscando "qué calculadora
  // necesito") — se excluyen acá también para no duplicar ni contradecir
  // ese comportamiento ya aprobado.
  const advancedGroup = await prisma.projectGroup.findUnique({
    where: { slug: "herramientas-avanzadas" },
    include: { tasks: { include: { moduleLinks: { select: { moduleId: true } } } } },
  });
  const advancedModuleIds = new Set<string>();
  if (advancedGroup) {
    for (const task of advancedGroup.tasks) {
      for (const link of task.moduleLinks) advancedModuleIds.add(link.moduleId);
    }
  }

  // `published: true` es la única fuente de verdad de qué se muestra —
  // piscina-integral (published:false) queda excluida automáticamente acá,
  // sin ningún caso especial (punto 9 del pedido: no se toca su estado).
  const modules = await prisma.module.findMany({
    where: { published: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      imageUrl: true,
      category: { select: { slug: true, name: true } },
    },
  });

  const calculators: CalculatorModule[] = modules
    .filter((m) => !advancedModuleIds.has(m.id))
    .map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      description: m.description,
      imageUrl: m.imageUrl,
      categorySlug: m.category.slug,
      categoryName: m.category.name,
    }));

  return (
    <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 sm:px-10 pt-6 sm:pt-10 pb-10 sm:pb-14">
      <p className="font-body text-[12px] font-bold uppercase mb-1.5 text-ds-text-tertiary" style={{ letterSpacing: "0.08em" }}>
        Herramientas
      </p>
      <h1 className="font-display text-[26px] sm:text-[32px] font-extrabold text-ds-navy-900 mb-1.5" style={{ letterSpacing: "-0.02em" }}>
        Calculadoras
      </h1>
      <p className="font-body text-[14px] sm:text-[15px] text-ds-text-secondary mb-6 sm:mb-8 max-w-[520px]">
        Estima materiales y costos de forma fácil y confiable.
      </p>

      <CalculatorsExplorer calculators={calculators} />
    </div>
  );
}
