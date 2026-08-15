import { Check, CircleDashed, TriangleAlert, X } from "lucide-react";
import type { InspectionSeverity } from "@/generated/prisma/client";

// Fase 8, sección 4/5/12 — mismos 4 estados reales de
// InspectionAnswerStatus (más `null` = pendiente) y las 4 severidades
// reales de InspectionSeverity. No se inventan categorías ni se
// convierte el conteo en una "nota" o "porcentaje de riesgo" — solo se
// muestran los números tal cual, y los mismos tokens de color ya usados
// en checklist-item-row.tsx (StatusPill/SEVERITY_TONE), no una paleta
// nueva.
export type ResultadoGlobal = {
  ok: number;
  observation: number;
  notApplicable: number;
  pending: number;
  total: number;
};

export type SeverityCounts = Record<InspectionSeverity, number>;

const SEVERITY_LABELS: Record<InspectionSeverity, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

// Mismo criterio de contraste ya documentado en checklist-item-row.tsx
// (OBSERVATION_TEXT) — reutilizado acá tal cual, no un tono nuevo.
const OBSERVATION_TEXT = "text-[#8A620D]";
const SEVERITY_TONE: Record<InspectionSeverity, string> = {
  LOW: `bg-caution-tint ${OBSERVATION_TEXT}`,
  MEDIUM: `bg-caution-tint ${OBSERVATION_TEXT}`,
  HIGH: "bg-danger-tint text-danger",
  CRITICAL: "bg-danger-tint text-danger",
};

export function ResumenResultadoGlobal({
  resultado,
  severityCounts,
  totalObservations,
}: {
  resultado: ResultadoGlobal;
  severityCounts: SeverityCounts;
  totalObservations: number;
}) {
  return (
    <div className="rounded-2xl p-6 bg-white border border-border grid gap-5">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">Resultado global</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ResultChip icon={Check} label="OK" value={resultado.ok} tone="bg-success-tint text-success" />
          <ResultChip icon={TriangleAlert} label="Observación" value={resultado.observation} tone={`bg-caution-tint ${OBSERVATION_TEXT}`} />
          <ResultChip icon={X} label="No aplica" value={resultado.notApplicable} tone="bg-concrete text-ink-muted" />
          <ResultChip icon={CircleDashed} label="Pendientes" value={resultado.pending} tone="bg-white text-ink-muted border border-border" />
        </div>
      </div>

      {totalObservations > 0 && (
        <div className="pt-5 border-t border-border">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
            Severidad de las observaciones ({totalObservations})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(SEVERITY_LABELS) as InspectionSeverity[]).map((sev) => (
              <div key={sev} className={`rounded-xl px-3 py-2.5 ${SEVERITY_TONE[sev]}`}>
                <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">{SEVERITY_LABELS[sev]}</p>
                <p className="font-display text-lg font-semibold">{severityCounts[sev]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Check;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${tone}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">{label}</p>
      </div>
      <p className="font-display text-lg font-semibold mt-0.5">{value}</p>
    </div>
  );
}
