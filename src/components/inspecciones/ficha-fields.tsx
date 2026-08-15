"use client";

import { Minus, Plus } from "lucide-react";

// Fase 11B — bloques reutilizables para las fichas de Casa/Departamento/
// Ampliación (docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md, secciones
// 3/4/5). Mismo lenguaje visual que SpaceSelectionStep (contador con
// +/-, checkbox en card), separado en piezas chicas porque estas fichas
// necesitan preguntas específicas (ej. living-comedor integrado/separado)
// que SpaceSelectionStep no modela.

export function FichaCounter({
  label,
  value,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-5 py-4 border border-border bg-white">
      <span className="font-medium text-[15px]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Quitar ${label}`}
          className="w-8 h-8 rounded-full border border-ink flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="font-display text-lg font-semibold w-6 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Agregar ${label}`}
          className="w-8 h-8 rounded-full border border-ink flex items-center justify-center"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function FichaCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl px-5 py-4 border border-border bg-white cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 flex-shrink-0"
      />
      <span className="font-medium text-[15px]">{label}</span>
    </label>
  );
}

export function FichaToggle({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-xl px-5 py-4 border border-border bg-white">
      <span className="font-medium text-[15px] block mb-3">{label}</span>
      <div className="flex gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium border transition-colors ${
                selected ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
