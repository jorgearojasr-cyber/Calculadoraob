import { AlertTriangle } from "lucide-react";
import type { RegularizationRuleResult } from "@/lib/regularization-rules";
import { RECEPCION_YA_TIENE_LABEL } from "./types";

// Extraído de RegularizationEntry (pantalla efímera post-wizard) y
// RegularizationRulesView (panel persistente en /regularizacion/[id]) —
// ambas mostraban el mismo bloque de reglas con el mismo tratamiento
// destacado para "Ya cuenta con recepción municipal" (diseño aprobado
// 2026-08-04); una sola copia evita que las dos vistas diverjan con el
// tiempo.
export function RegularizationRulesList({ rules }: { rules: RegularizationRuleResult[] }) {
  const highlighted = rules.find((r) => r.label === RECEPCION_YA_TIENE_LABEL);
  const rest = rules.filter((r) => r.label !== RECEPCION_YA_TIENE_LABEL);

  return (
    <>
      {highlighted && (
        <div className="rounded-2xl p-5 mb-4 bg-caution-tint border border-caution-border flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-caution flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink mb-1">{highlighted.label}</p>
            <p className="text-sm text-ink-muted">{highlighted.message}</p>
          </div>
        </div>
      )}
      {rest.length === 0 && !highlighted ? (
        <p className="text-sm text-ink-muted">No hay observaciones adicionales para este caso.</p>
      ) : (
        <div className="grid gap-3">
          {rest.map((rule) => (
            <div key={rule.label} className="rounded-xl px-4 py-3 bg-concrete">
              <p className="text-sm font-semibold text-ink mb-1">{rule.label}</p>
              <p className="text-sm text-ink-muted">{rule.message}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
