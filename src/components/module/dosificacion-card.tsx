import { formatQuantity } from "@/lib/format-number";
import { pluralizeUnit } from "@/lib/pluralize";
import { CollapsibleHelp } from "./collapsible-help";
import type { CalculationResult } from "@/lib/formula-engine";

// Fase 4 (Radier) — tarjeta de "dosificación referencial estimada": una
// proporción práctica de preparación en obra (X por cada saco de cemento),
// distinta de "materiales totales" (cuánto comprar para todo el proyecto,
// ver PricedResults) y de "preparación por carga de betonera" (ver
// RecipeCard) — las 3 conviven pero responden preguntas distintas. Genérico
// a propósito, sin nada de Radier hardcodeado (mismo criterio que
// RecipeCard): cualquier módulo futuro con el mismo patrón "referencia por
// unidad base + items" lo reutiliza agregando su propia entrada en
// module-visual-config.ts.
//
// Color ámbar (`caution`, ya existente en la paleta para "no verificado
// contra norma"/estimado) a propósito distinto del marino (`navy`, dato
// protagonista) y del naranjo de marca (`action`, reservado para CTAs) —
// para que el usuario asocie de un vistazo: marino = resultado principal,
// ámbar = referencia práctica para preparar.
export function DosificacionCard({
  title,
  subtitle,
  baseLabel,
  baseValue,
  baseUnit,
  items,
  tip,
  disclaimer,
  sourceLabel,
}: {
  title: string;
  subtitle: string;
  // La unidad base de la proporción (ej. "1 saco de cemento de 25 kg") —
  // texto fijo, no un CalculationResult, porque siempre vale exactamente 1.
  baseLabel: string;
  baseValue: string;
  baseUnit: string;
  items: CalculationResult[];
  tip: string;
  disclaimer: string;
  sourceLabel: string;
}) {
  return (
    <div className="rounded-ds-card p-5 mb-3 bg-ds-orange-100/40 border border-ds-orange-600/25">
      <p className="font-body text-xs font-semibold uppercase tracking-wider text-ds-orange-700 mb-0.5">{title}</p>
      <p className="font-body text-xs text-ds-text-secondary mb-4">{subtitle}</p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p className="font-body text-xs text-ds-text-secondary">{baseLabel}</p>
          <p className="font-display text-lg font-bold text-ds-navy-900 tabular-nums">
            {baseValue} <span className="text-xs font-body font-medium text-ds-text-secondary">{baseUnit}</span>
          </p>
        </div>
        {items.map((item) => (
          <div key={item.key}>
            <p className="font-body text-xs text-ds-text-secondary">{item.label}</p>
            <p className="font-display text-lg font-bold text-ds-navy-900 tabular-nums">
              {formatQuantity(item.value)}{" "}
              <span className="text-xs font-body font-medium text-ds-text-secondary">
                {pluralizeUnit(item.value, item.unit)}
              </span>
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 pt-3 border-t border-ds-orange-600/20 font-body text-xs text-ds-text-secondary">💡 {tip}</p>
      <p className="mt-2 font-body text-[11px] text-ds-text-tertiary">⚠️ {disclaimer}</p>

      <div className="mt-3 pt-3 border-t border-ds-orange-600/20 flex flex-wrap items-center justify-between gap-2">
        <p className="font-body text-[11px] text-ds-text-tertiary">Fuente técnica: {sourceLabel}</p>
        {items.some((item) => item.note) && (
          <CollapsibleHelp label="¿Cómo se obtiene esta referencia?" ariaLabel="Cómo se obtiene la dosificación referencial">
            <div className="grid gap-1.5">
              {items.map(
                (item) =>
                  item.note && (
                    <p key={item.key} className="font-body text-xs text-ds-text-secondary">
                      <span className="font-semibold">{item.label}:</span> {item.note}
                    </p>
                  )
              )}
            </div>
          </CollapsibleHelp>
        )}
      </div>
    </div>
  );
}
