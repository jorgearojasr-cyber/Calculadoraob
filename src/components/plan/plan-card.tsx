import Link from "next/link";
import { ArrowRight, Map as MapIcon } from "lucide-react";
import { PlanProgressBar } from "./plan-progress-bar";

// Tarjeta de plan para el catálogo /planificar — Design Spec v1.0, sección
// J.4: radius ds-card, borde ds-border, sombra card-rest, título Manrope,
// descripción Source Sans, badge de fases, CTA discreto. Genérico (no sabe
// nada de "piscina" ni de ningún plan específico): cualquier ProjectPlan
// futuro se pinta igual, sin tocar este componente.
export function PlanCard({
  slug,
  title,
  description,
  phaseCount,
  // Progreso real del usuario para ESTE plan — solo se pasa cuando existe
  // sesión Y al menos una fase completada (ver planificar/page.tsx). Sin
  // este prop, la tarjeta no muestra ningún progreso — nunca un "0%"
  // fabricado para un plan que el usuario no ha empezado.
  progress,
}: {
  slug: string;
  title: string;
  description: string;
  phaseCount: number;
  progress?: { completed: number; total: number };
}) {
  return (
    <Link
      href={`/plan/${slug}`}
      className="group flex flex-col gap-3 rounded-ds-card p-5 bg-white border border-ds-border shadow-ds-card-rest hover:shadow-ds-card-elevated hover:border-ds-navy-900/20 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-ds-navy-100 shrink-0">
          <MapIcon className="w-5 h-5 text-ds-navy-900" strokeWidth={2} />
        </div>
        {phaseCount > 0 && (
          <span className="font-body text-[11px] font-semibold text-ds-text-secondary bg-ds-muted px-2.5 py-1 rounded-full shrink-0">
            {phaseCount} {phaseCount === 1 ? "etapa" : "etapas"}
          </span>
        )}
      </div>

      <div className="flex-1">
        <h2 className="font-display font-bold text-[17px] text-ds-navy-900">{title}</h2>
        <p className="font-body text-sm text-ds-text-secondary mt-1 line-clamp-2">{description}</p>
      </div>

      {progress && <PlanProgressBar completed={progress.completed} total={progress.total} />}

      <span className="inline-flex items-center gap-1.5 font-body text-sm font-bold text-ds-orange-600 group-hover:text-ds-orange-700">
        Ver plan
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </Link>
  );
}
