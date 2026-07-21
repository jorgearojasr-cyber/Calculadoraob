"use client";

import { useState } from "react";
import { formatQuantity } from "@/lib/format-number";
import type { CalculationResult } from "@/lib/formula-engine";

const currencyFormatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

function parsePrice(raw: string): number | null {
  const num = Number(raw.replace(",", "."));
  return raw !== "" && Number.isFinite(num) && num > 0 ? num : null;
}

// Renderiza las líneas de resultado de un módulo (usado tanto en el wizard
// en vivo como en el detalle de un proyecto guardado). Las líneas con
// materialName (vinculadas a una entidad Material real, no variables
// informativas) obtienen un campo opcional de precio unitario: es solo
// para este cálculo puntual, nunca se persiste como precio de referencia.
export function PricedResults({
  results,
  onPricesChange,
}: {
  results: CalculationResult[];
  onPricesChange?: (results: CalculationResult[]) => void;
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

  return (
    <div className="grid gap-3">
      {rows.map(({ result, priceStr, subtotal }) => (
        <div key={result.key} className="rounded-2xl p-5 bg-white border border-border">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-medium text-[15px]">{result.label}</span>
            <span className="font-display text-xl font-semibold whitespace-nowrap">
              {formatQuantity(result.value)}{" "}
              <span className="text-sm font-body text-ink-muted">{result.unit}</span>
            </span>
          </div>
          {result.materialName && (
            <p className="mt-1 text-xs font-medium text-ink-muted">{result.materialName}</p>
          )}
          {result.note && <p className="mt-2 text-xs text-ink-muted">{result.note}</p>}

          {result.materialName && (
            <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-3">
              <label className="text-xs text-ink-muted flex items-center gap-2">
                Precio unitario ($)
                <input
                  type="text"
                  inputMode="decimal"
                  value={priceStr}
                  onChange={(e) => handlePriceChange(result.key, e.target.value)}
                  placeholder="0"
                  className="w-24 rounded-lg px-2 py-1 border border-border text-sm outline-none focus:border-ink"
                />
              </label>
              {subtotal !== null && (
                <span className="ml-auto text-sm font-semibold">
                  Subtotal: ${currencyFormatter.format(subtotal)}
                </span>
              )}
            </div>
          )}
        </div>
      ))}

      {anyPriced && (
        <div className="rounded-2xl p-5 bg-navy/[0.04] border border-navy/20">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-semibold text-[15px]">Total aproximado</span>
            <span className="font-display text-xl font-bold whitespace-nowrap">
              ${currencyFormatter.format(total)}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Total aproximado (solo materiales con precio ingresado)
          </p>
        </div>
      )}
    </div>
  );
}
