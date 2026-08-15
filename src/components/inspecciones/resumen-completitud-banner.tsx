import { CheckCircle2, CircleDashed } from "lucide-react";

// Fase 8, sección 12 — deliberadamente SEPARADO del resultado global: si
// se mezclara "100% de progreso" con "sin observaciones" en un solo
// indicador, una inspección completa con hallazgos podría leerse como
// "todo bien". Este banner solo informa si QUEDAN checks sin responder
// (`pending`, derivado, nunca `InspectionCase.estado` — ese campo hoy no
// se actualiza automáticamente en ningún flujo, ver informe de Fase 8).
export function ResumenCompletitudBanner({ pending, total }: { pending: number; total: number }) {
  if (total === 0) return null;

  if (pending === 0) {
    return (
      <div className="rounded-2xl p-4 bg-success-tint border border-success-border flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
        <p className="text-sm font-medium text-success">
          Inspección completa — los {total} puntos del checklist fueron revisados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 bg-caution-tint border border-caution-border flex items-center gap-3">
      <CircleDashed className="w-5 h-5 text-[#8A620D] flex-shrink-0" />
      <p className="text-sm font-medium text-[#8A620D]">
        {pending} punto{pending > 1 ? "s" : ""} pendiente{pending > 1 ? "s" : ""} de {total} — la inspección todavía no está completa.
      </p>
    </div>
  );
}
