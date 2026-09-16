"use client";

import { useState } from "react";
import { formatQuantity } from "@/lib/format-number";
import { pluralizeUnit } from "@/lib/pluralize";
import { CollapsibleHelp } from "./collapsible-help";
import type { CalculationResult } from "@/lib/formula-engine";

const currencyFormatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

function parsePrice(raw: string): number | null {
  const num = Number(raw.replace(",", "."));
  return raw !== "" && Number.isFinite(num) && num > 0 ? num : null;
}

// Mismo cálculo que hacía PricedResults internamente (líneas con
// materialName y unitPrice > 0), expuesto para que ResultHero pueda
// mostrar el mismo "Total aproximado" en la tarjeta protagonista sin
// duplicar la suma en dos lugares.
export function computeApproxTotal(results: CalculationResult[]): { total: number; anyPriced: boolean } {
  let total = 0;
  let anyPriced = false;
  for (const result of results) {
    if (!result.materialName || result.unitPrice == null || result.unitPrice <= 0) continue;
    total += result.value * result.unitPrice;
    anyPriced = true;
  }
  return { total, anyPriced };
}

// Renderiza las líneas de resultado de un módulo (usado tanto en el wizard
// en vivo como en el detalle de un proyecto guardado). Las líneas con
// materialName (vinculadas a una entidad Material real, no variables
// informativas) obtienen un campo opcional de precio unitario: es solo
// para este cálculo puntual, nunca se persiste como precio de referencia.
export function PricedResults({
  results,
  onPricesChange,
  hideFeatured,
  hideTotal,
  suppressNoteForKeys,
}: {
  results: CalculationResult[];
  onPricesChange?: (results: CalculationResult[]) => void;
  // Cuando ResultScreen ya muestra el primer resultado en su propia
  // tarjeta protagonista (ver ResultHero), este mismo dato no necesita
  // repetirse agrandado acá — se ve como cualquier otra línea de la
  // lista, pero sigue apareciendo (no se oculta el ítem).
  hideFeatured?: boolean;
  // Mismo criterio: si ResultHero ya muestra "Total aproximado" (mismo
  // computeApproxTotal), este footer quedaría duplicado más abajo.
  hideTotal?: boolean;
  // Fase 5 (Radier): oculta el "¿Cómo calculamos esta cantidad?" de estos
  // Formula.key puntuales — para cuando el caller ya muestra esas mismas
  // notas consolidadas en otro lugar (ver TechnicalNotesSection), evitando
  // la duplicación. Sin este prop (la mayoría de los módulos), cada
  // resultado sigue mostrando su propia nota colapsable como siempre.
  suppressNoteForKeys?: string[];
}) {
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      results
        .filter((r) => r.materialName)
        .map((r) => [r.key, r.unitPrice != null ? String(r.unitPrice) : ""])
    )
  );

  const handlePriceChange = (key: string, value: string) => {
    const next = { ...prices, [key]: value };
    setPrices(next);
    onPricesChange?.(
      results.map((r) => (r.materialName ? { ...r, unitPrice: parsePrice(next[r.key] ?? "") } : r))
    );
  };

  let total = 0;
  let anyPriced = false;

  const rows = results.map((result) => {
    const priceStr = prices[result.key] ?? "";
    const priceNum = result.materialName ? parsePrice(priceStr) : null;
    const subtotal = priceNum !== null ? result.value * priceNum : null;
    if (subtotal !== null) {
      total += subtotal;
      anyPriced = true;
    }
    return { result, priceStr, subtotal };
  });

  // Agrupa cada resultado secundario (isSecondary) bajo el resultado
  // principal no-secundario inmediatamente anterior en el orden, para
  // renderizarlo anidado y más chico dentro de la misma tarjeta.
  type Row = (typeof rows)[number];
  const groups: { primary: Row; secondaries: Row[] }[] = [];
  for (const row of rows) {
    if (row.result.isSecondary && groups.length > 0) {
      groups[groups.length - 1].secondaries.push(row);
    } else {
      groups.push({ primary: row, secondaries: [] });
    }
  }

  return (
    <div className="grid gap-3">
      {groups.map(({ primary: { result, priceStr, subtotal }, secondaries }, groupIndex) => {
        // Dirección visual 2026-07-28: el primer resultado no-secundario de
        // cada módulo se destaca a escala 40-44px en color de marca — único
        // elemento de esa escala en toda la pantalla. El resto de los
        // resultados (y todos los secundarios) mantienen el tratamiento
        // previo. Ver discusión: módulos multi-material (ej. Hormigón) no
        // tienen "un" resultado obvio, así que se usa el primero de la lista
        // como criterio simple y consistente entre los 57 módulos.
        const featured = groupIndex === 0 && !hideFeatured;
        return (
        <div
          key={result.key}
          className={`rounded-ds-card p-5 border ${featured ? "bg-ds-orange-100/40 border-ds-orange-600/30" : "bg-white border-ds-border"}`}
        >
          {featured ? (
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <span className="font-body font-semibold text-[15px] text-ds-navy-900">{result.label}</span>
              <span className="font-display text-[36px] sm:text-[40px] font-extrabold leading-none text-ds-orange-700 text-right tabular-nums">
                {formatQuantity(result.value)}{" "}
                <span className="text-base font-body font-medium text-ds-orange-700/80">
                  {pluralizeUnit(result.value, result.unit)}
                </span>
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="font-body font-semibold text-[15px] text-ds-navy-900">{result.label}</span>
              <span className="font-display text-xl font-bold text-right tabular-nums text-ds-navy-900">
                {formatQuantity(result.value)}{" "}
                <span className="text-sm font-body font-medium text-ds-text-secondary">
                  {pluralizeUnit(result.value, result.unit)}
                </span>
              </span>
            </div>
          )}
          {result.materialName && (
            <p className="mt-1 font-body text-xs font-semibold text-ds-text-secondary">{result.materialName}</p>
          )}
          {/* Fase 2 (Radier): la nota técnica (fuente, dosificación,
              fórmula) queda colapsada por defecto — la tarjeta prioriza
              material + cantidad + unidad, la explicación queda a un
              clic, sin perder el dato ni la fuente. Cambio en un
              componente compartido (usado por ~57 módulos), puramente
              aditivo: antes el texto era siempre visible, ahora sigue
              existiendo igual, solo colapsado hasta que se pide. */}
          {result.note && !suppressNoteForKeys?.includes(result.key) && (
            <div className="mt-2">
              <CollapsibleHelp label="¿Cómo calculamos esta cantidad?" ariaLabel={`Cómo se calcula ${result.label}`}>
                <p className="font-body text-xs text-ds-text-secondary">{result.note}</p>
              </CollapsibleHelp>
            </div>
          )}

          {result.materialName && (
            <div className="mt-3 pt-3 border-t border-ds-border">
              <div className="flex flex-wrap items-center gap-3">
                <label className="font-body text-xs font-semibold text-ds-text-secondary flex items-center gap-2">
                  Precio unitario ($)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={priceStr}
                    onChange={(e) => handlePriceChange(result.key, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="w-24 rounded-ds-input px-2 py-1.5 border border-ds-border font-body text-sm text-ds-navy-900 outline-none focus:border-ds-orange-600 focus:ring-[3px] focus:ring-ds-orange-100 transition-all"
                  />
                </label>
                {subtotal !== null && (
                  <span className="ml-auto font-body text-sm font-bold text-ds-navy-900 tabular-nums">
                    Subtotal: ${currencyFormatter.format(subtotal)}
                  </span>
                )}
              </div>
              {result.referencePriceNote && (
                <p className="mt-1.5 font-body text-[11px] text-ds-text-tertiary">{result.referencePriceNote}</p>
              )}
            </div>
          )}

          {secondaries.length > 0 && (
            <div className="mt-3 pt-3 border-t border-ds-border/70 grid gap-2">
              {secondaries.map(({ result: sec }) => (
                <div key={sec.key}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="font-body text-xs text-ds-text-secondary">{sec.label}</span>
                    <span className="font-body text-sm font-semibold text-ds-text-secondary text-right tabular-nums">
                      {formatQuantity(sec.value)}{" "}
                    <span className="text-xs">{pluralizeUnit(sec.value, sec.unit)}</span>
                    </span>
                  </div>
                  {sec.note && <p className="mt-1 font-body text-xs text-ds-text-tertiary">{sec.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        );
      })}

      {anyPriced && !hideTotal && (
        <div className="rounded-ds-card p-5 bg-ds-navy-900 text-white">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-body font-semibold text-[15px]">Total aproximado</span>
            <span className="font-display text-xl font-extrabold whitespace-nowrap tabular-nums">
              ${currencyFormatter.format(total)}
            </span>
          </div>
          <p className="mt-1 font-body text-xs text-white/60">
            Total aproximado (solo materiales con precio ingresado)
          </p>
        </div>
      )}
    </div>
  );
}
