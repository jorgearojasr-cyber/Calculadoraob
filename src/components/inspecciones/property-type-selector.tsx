"use client";

import { Building2, Check, Hammer, Home } from "lucide-react";
import type { InspectionPropertyType } from "@/generated/prisma/client";

// Mismo estilo de botón que la lista de opciones plana de QuestionStep
// (src/components/module/question-step.tsx, rama SELECT sin imágenes) —
// no se reutiliza ese componente directamente porque no soporta un ícono
// por opción en esa rama, y acá sí lo pedimos explícitamente (Fase 2,
// punto 2: nada de emoji, iconografía Lucide). Mismas clases/tokens,
// ningún color ni patrón nuevo.
const OPTIONS: { value: InspectionPropertyType; label: string; icon: typeof Home }[] = [
  { value: "CASA", label: "Casa", icon: Home },
  { value: "DEPARTAMENTO", label: "Departamento", icon: Building2 },
  { value: "AMPLIACION", label: "Ampliación", icon: Hammer },
];

export function PropertyTypeSelector({
  value,
  onSelect,
}: {
  value: InspectionPropertyType | null;
  onSelect: (value: InspectionPropertyType) => void;
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
            className={`flex items-center justify-between text-left rounded-xl px-5 py-4 border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${
              selected ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-ink-muted flex-shrink-0" />
              <span className="font-medium text-[15px]">{option.label}</span>
            </span>
            {selected && <Check className="w-4 h-4 text-safety flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
