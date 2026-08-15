"use client";

import { Minus, Plus } from "lucide-react";
import type { InspectionSpaceTemplate } from "@/generated/prisma/client";

// Características del inmueble = selección de qué InspectionSpace se van
// a generar (ver diseño aprobado Fase 1, Parte 3: "la configuración
// inicial ES la selección de espacios, no una tabla de booleanos
// aparte") — 100% data-driven desde `templates`, sin ningún nombre de
// espacio hardcodeado acá. Si el catálogo de un tipo de inmueble crece
// (ej. se agrega "Logia" a Casa), este componente no cambia.
export function SpaceSelectionStep({
  templates,
  counts,
  onChange,
}: {
  templates: InspectionSpaceTemplate[];
  counts: Record<string, number>;
  onChange: (templateKey: string, count: number) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="rounded-2xl p-5 bg-caution-tint border border-caution-border">
        <p className="text-sm text-ink">
          Todavía no hay catálogo de espacios configurado para este tipo de inmueble.
        </p>
        <p className="text-sm text-ink-muted mt-1">
          Vuelve a intentarlo más adelante, cuando se agregue el catálogo correspondiente.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {templates.map((template) => {
        const count = counts[template.key] ?? 0;
        if (template.repeatable) {
          return (
            <div
              key={template.key}
              className="flex items-center justify-between gap-4 rounded-xl px-5 py-4 border border-border bg-white"
            >
              <span className="font-medium text-[15px]">{template.label}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onChange(template.key, Math.max(0, count - 1))}
                  disabled={count <= 0}
                  aria-label={`Quitar ${template.label}`}
                  className="w-8 h-8 rounded-full border border-ink flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-display text-lg font-semibold w-6 text-center">{count}</span>
                <button
                  type="button"
                  onClick={() => onChange(template.key, count + 1)}
                  aria-label={`Agregar ${template.label}`}
                  className="w-8 h-8 rounded-full border border-ink flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        }

        const checked = count > 0;
        return (
          <label
            key={template.key}
            className="flex items-center gap-3 rounded-xl px-5 py-4 border border-border bg-white cursor-pointer"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(template.key, e.target.checked ? 1 : 0)}
              className="w-4 h-4 flex-shrink-0"
            />
            <span className="font-medium text-[15px]">{template.label}</span>
          </label>
        );
      })}
    </div>
  );
}
