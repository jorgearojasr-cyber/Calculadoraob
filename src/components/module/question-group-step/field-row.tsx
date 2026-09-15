"use client";

import { useId } from "react";
import { ArrowLeftRight, ArrowUpDown } from "lucide-react";

// Fila de campo de VolumeStep (ícono de eje + label + sublabel + input) —
// componente de NIVEL SUPERIOR a propósito: definirlo dentro de VolumeStep
// lo recreaba como un tipo de componente nuevo en cada tecla (cada
// setValue re-renderiza VolumeStep), lo que a su vez desmontaba y volvía a
// montar los 3 inputs en cada letra — el usuario perdía foco/cursor a
// mitad de escribir. Bug real encontrado al verificar "actualización en
// vivo" en el navegador (2026-07-30), no solo un detalle de estilo.
// Exportado para reutilizarlo en componentes específicos de un módulo con
// geometría propia (ver FoundationStep) — mismo campo de medida (ícono +
// label + input/selector) sin duplicar el markup.
export function FieldRow({
  icon,
  label,
  subLabel,
  value,
  unit,
  autoFocus,
  onChange,
  onEnter,
  onFocus,
  onBlur,
  rangeWarning,
  selectOptions,
}: {
  icon: "horizontal" | "vertical";
  label: string;
  subLabel?: string;
  value: string;
  unit: string | null;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onEnter: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  rangeWarning?: string | null;
  // Presente solo cuando la pregunta real es un SELECT (ej. espesor de
  // Losa/Muro: opciones técnicas fijas, no un NUMBER libre) — en vez del
  // input de texto, se muestra una fila de opciones seleccionables. Ver
  // decisión de producto, Fase 4 (2026-08-02): "el framework también
  // soportará campos numéricos y campos de selección".
  selectOptions?: { key: string; label: string }[];
}) {
  // Accesibilidad (Fase B, 2026-08-02): asocia el label visible con su
  // input/grupo de opciones vía htmlFor/id (antes eran <p>/<span> sueltos,
  // sin relación programática) — no cambia nada visualmente, `<label>`
  // toma el mismo estilo que el `<p>` que reemplaza.
  const fieldId = useId();
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="w-8 h-8 rounded-full bg-ds-muted flex items-center justify-center flex-shrink-0 text-ds-text-secondary">
          {icon === "horizontal" ? <ArrowLeftRight className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4" />}
        </span>
        <div>
          <label htmlFor={selectOptions ? undefined : fieldId} className="block font-body font-bold text-[15px] text-ds-navy-900 leading-tight">
            {label}
          </label>
          {subLabel && <p className="font-body text-xs text-ds-text-secondary leading-tight">{subLabel}</p>}
        </div>
      </div>
      {selectOptions ? (
        <div className="flex flex-wrap gap-2" onFocus={onFocus} onBlur={onBlur} role="group" aria-label={label}>
          {selectOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={value === option.key}
              onClick={() => {
                onFocus?.();
                onChange(option.key);
              }}
              className={`rounded-xl px-4 py-3 font-body text-[15px] font-semibold border-[1.5px] transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-orange-600 ${
                value === option.key
                  ? "border-ds-orange-600 bg-ds-orange-100/40 text-ds-navy-900"
                  : "border-ds-border bg-white text-ds-text-secondary hover:shadow-ds-card-elevated"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        // Design Spec v1.0, Parte 3, punto 9-10: radio ds-input, borde
        // ds-border, focus orange-600 + halo orange-100, unidad visible.
        <div className="flex items-center gap-3 rounded-ds-input bg-white border-[1.5px] border-ds-border px-4 py-3 focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all">
          <input
            id={fieldId}
            type="text"
            inputMode="decimal"
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onEnter()}
            onFocus={(e) => {
              e.target.select();
              onFocus?.();
            }}
            onBlur={onBlur}
            placeholder="0"
            className="w-full bg-transparent outline-none font-display text-xl text-ds-navy-900 placeholder:text-ds-text-tertiary"
          />
          {unit && <span className="font-body text-sm font-semibold text-ds-text-secondary">{unit}</span>}
        </div>
      )}
      {rangeWarning && <p className="mt-2 font-body text-sm text-amber-600">{rangeWarning}</p>}
    </div>
  );
}
