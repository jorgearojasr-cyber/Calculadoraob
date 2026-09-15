import Link from "next/link";
import { ArrowLeft, ArrowRight, Map as MapIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";

// Home ObraBien V2 (2026-09-14, punto 9/15 del pedido) — índice mínimo
// real de PLANIFICA. Lee `ProjectPlan` desde la BD (no hardcodea el plan
// de la piscina): hoy solo existe un plan real sembrado
// (construir-una-piscina, ver docs/product-feature-registry.md), pero esta
// página no asume eso — si mañana se agrega un segundo ProjectPlan, esta
// lista lo muestra solo, sin tocar código. No se toca `ProjectPlan` ni sus
// fases/módulos (NO TOCAR, punto 20 del pedido) — solo se lee.
export const dynamic = "force-dynamic";

export default async function PlanificarPage() {
  // Orden determinista (cierre QA, 2026-09-14) — mismo criterio que
  // PlanFeaturedSection: createdAt + id como desempate, sin campos nuevos.
  const plans = await prisma.projectPlan.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: { phases: { select: { id: true } } },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-10 pt-6 pb-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      <p className="font-mono text-xs uppercase tracking-wider mt-6 mb-2 text-safety">Planifica</p>
      <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2 text-[#10203A]">
        Planes de construcción por etapas
      </h1>
      <p className="text-sm text-[#5B6577] mb-8">
        Proyectos compuestos divididos en fases, para avanzar paso a paso en vez de calcular todo de una vez.
      </p>

      {plans.length === 0 ? (
        <div className="rounded-2xl p-8 bg-white border border-[#E4E8EF]">
          <p className="text-sm text-[#5B6577]">Todavía no hay planes de construcción disponibles.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/plan/${plan.slug}`}
              className="flex flex-col gap-3 rounded-2xl p-5 bg-white border border-[#E4E8EF] hover:border-[#002152]/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-navy/[0.07]">
                <MapIcon className="w-5 h-5 text-navy" />
              </div>
              <div>
                <h2 className="font-semibold text-[16px] text-[#10203A]">{plan.title}</h2>
                <p className="text-sm text-[#5B6577] mt-1">{plan.description}</p>
              </div>
              <span className="text-xs font-medium text-[#5B6577]">
                {plan.phases.length} {plan.phases.length === 1 ? "etapa" : "etapas"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-action mt-1">
                Ver plan
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
