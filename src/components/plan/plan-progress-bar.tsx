// Barra de progreso compartida entre el catálogo (/planificar) y el
// interior de un plan (/plan/[slug]) — mismo tratamiento visual en los dos
// lugares (Design Spec v1.0, sección J): altura 5-6px, fondo ds-muted,
// relleno ds-orange-600, radius pill. Puramente presentacional: recibe
// `completed`/`total` ya resueltos por el caller desde datos reales
// (ProjectPlanPhaseCompletion) — nunca calcula ni asume progreso.
export function PlanProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <p className="font-body text-sm font-semibold text-ds-navy-900">
          {completed} de {total} {total === 1 ? "etapa completada" : "etapas completadas"}
        </p>
        <span className="font-body text-xs font-semibold text-ds-text-secondary shrink-0">{pct}%</span>
      </div>
      <div className="h-[6px] rounded-full bg-ds-muted overflow-hidden">
        <div className="h-full rounded-full bg-ds-orange-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
