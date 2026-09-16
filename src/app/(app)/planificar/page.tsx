import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanCard } from "@/components/plan/plan-card";

// Home ObraBien V2 (2026-09-14, punto 9/15 del pedido) — índice mínimo
// real de PLANIFICA. Lee `ProjectPlan` desde la BD (no hardcodea el plan
// de la piscina): hoy solo existe un plan real sembrado
// (construir-una-piscina, ver docs/product-feature-registry.md), pero esta
// página no asume eso — si mañana se agrega un segundo ProjectPlan, esta
// lista lo muestra solo, sin tocar código. No se toca `ProjectPlan` ni sus
// fases/módulos (NO TOCAR, punto 20 del pedido) — solo se lee.
//
// Design Spec v1.0, Parte 5 (cierre pre-commit): restyle a ds-* tokens +
// progreso real por usuario en cada tarjeta (solo si hay sesión Y al menos
// una fase completada para ESE plan — nunca un "0%" para un plan que el
// usuario no ha empezado, ver PlanCard).
export const dynamic = "force-dynamic";

export default async function PlanificarPage() {
  // Orden determinista (cierre QA, 2026-09-14) — mismo criterio que
  // PlanFeaturedSection: createdAt + id como desempate, sin campos nuevos.
  const plans = await prisma.projectPlan.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: { phases: { select: { id: true } } },
  });

  const session = await getServerSession(authOptions);
  const allPhaseIds = plans.flatMap((plan) => plan.phases.map((phase) => phase.id));
  const completedByPhaseId = new Set<string>();
  if (session?.user?.id && allPhaseIds.length > 0) {
    const completions = await prisma.projectPlanPhaseCompletion.findMany({
      where: { userId: session.user.id, phaseId: { in: allPhaseIds }, completed: true },
      select: { phaseId: true },
    });
    for (const c of completions) completedByPhaseId.add(c.phaseId);
  }

  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-10 pt-6 pb-16">
      <Link href="/" className="inline-flex items-center gap-1.5 font-body text-sm text-ds-text-secondary hover:text-ds-navy-900">
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      <p className="font-body text-xs font-semibold uppercase tracking-wider mt-6 mb-2 text-ds-orange-600">Planifica</p>
      <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-ds-navy-900">
        Planifica tu proyecto
      </h1>
      <p className="font-body text-sm text-ds-text-secondary mb-8">
        Avanza paso a paso desde la idea hasta la ejecución.
      </p>

      {plans.length === 0 ? (
        <div className="rounded-ds-card p-8 bg-white border border-ds-border">
          <p className="font-body text-sm text-ds-text-secondary">Todavía no hay planes de construcción disponibles.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const completed = plan.phases.filter((p) => completedByPhaseId.has(p.id)).length;
            return (
              <PlanCard
                key={plan.id}
                slug={plan.slug}
                title={plan.title}
                description={plan.description}
                phaseCount={plan.phases.length}
                progress={completed > 0 ? { completed, total: plan.phases.length } : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
