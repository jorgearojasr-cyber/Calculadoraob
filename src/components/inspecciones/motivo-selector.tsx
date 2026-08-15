"use client";

import { CheckCircle2, ClipboardCheck, Hammer } from "lucide-react";
import type { InspectionMotivo } from "@/generated/prisma/client";

// Fase 11B — primer paso del wizard (docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md,
// sección 1/2). El motivo no cambia qué se revisa técnicamente, solo el
// tono del informe más adelante — nunca se convierte en una conclusión
// legal ("apto para firmar"), ver informe de Fase 11B.
const OPTIONS: { value: InspectionMotivo; label: string; description: string; icon: typeof ClipboardCheck }[] = [
  {
    value: "RECEPCION_PRE_FIRMA",
    label: "Recepción antes de firmar",
    description: "Vas a revisar la vivienda antes de aceptar la entrega.",
    icon: ClipboardCheck,
  },
  {
    value: "POST_RECEPCION",
    label: "Ya recibí la vivienda y quiero revisar",
    description: "Ya te entregaron la vivienda y quieres dejar constancia de su estado.",
    icon: CheckCircle2,
  },
  {
    value: "REVISION_AMPLIACION",
    label: "Revisar una ampliación",
    description: "Vas a revisar una obra nueva o ampliación específica.",
    icon: Hammer,
  },
];

export function MotivoSelector({
  value,
  onSelect,
}: {
  value: InspectionMotivo | null;
  onSelect: (value: InspectionMotivo) => void;
}) {
  return (
    <div className="grid gap-3">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            aria-pressed={selected}
            className={`flex items-start gap-3 text-left rounded-xl px-5 py-4 border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${
              selected ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
            }`}
          >
            <Icon className="w-5 h-5 text-ink-muted flex-shrink-0 mt-0.5" />
            <span>
              <span className="block font-medium text-[15px]">{option.label}</span>
              <span className="block text-sm text-ink-muted mt-0.5">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
