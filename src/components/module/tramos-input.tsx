"use client";

import { Plus, X } from "lucide-react";
import { formatQuantity } from "@/lib/format-number";
import { toNum } from "./dimension-utils/parsing";
import {
  calcTotalArea,
  createEmptyTramo,
  tramosToRecords,
  type TramoInput,
  type TramoTipo,
} from "./dimension-utils/tramos";

// UI de "Área personalizada" (Fase 3, 2026-09-14) — lista de tramos
// rectangulares que se suman/restan para construir la superficie total.
// Reemplaza y generaliza la UI de "vanos" que antes vivía inline dentro de
// AreaInputToggle (enableDeduction): acá cada tramo es una pieza completa
// (no un hueco dentro de un rectángulo exterior fijo), con su propia
// etiqueta opcional y su propio tipo suma/resta — sin tope de cantidad,
// igual criterio que vanos ("agregar/quitar libremente").
export function TramosInput({
  tramos,
  onChange,
}: {
  tramos: TramoInput[];
  onChange: (tramos: TramoInput[]) => void;
}) {
  const records = tramosToRecords(tramos);
  const total = calcTotalArea(records);

  const updateTramo = (id: string, patch: Partial<TramoInput>) => {
    onChange(tramos.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const removeTramo = (id: string) => {
    onChange(tramos.filter((t) => t.id !== id));
  };

  const addTramo = (tipo: TramoTipo) => {
    onChange([...tramos, createEmptyTramo(tipo)]);
  };

  return (
    <div>
      <div className="grid gap-3">
        {tramos.map((tramo, i) => {
          const area = toNum(tramo.largo) !== null && toNum(tramo.ancho) !== null
            ? (toNum(tramo.largo) as number) * (toNum(tramo.ancho) as number)
            : null;
          return (
            <div
              key={tramo.id}
              className={`rounded-2xl border p-4 ${
                tramo.tipo === "resta" ? "border-safety/40 bg-safety-tint/40" : "border-border bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="inline-flex rounded-full border border-border bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => updateTramo(tramo.id, { tipo: "suma" })}
                    aria-pressed={tramo.tipo === "suma"}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      tramo.tipo === "suma" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    + Suma
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTramo(tramo.id, { tipo: "resta" })}
                    aria-pressed={tramo.tipo === "resta"}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      tramo.tipo === "resta" ? "bg-safety text-white" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    − Resta
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeTramo(tramo.id)}
                  aria-label={`Quitar tramo ${i + 1}`}
                  className="text-ink-muted hover:text-safety"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="grid gap-1.5 mb-3">
                <span className="text-xs font-medium text-ink-muted">Etiqueta (opcional)</span>
                <input
                  type="text"
                  value={tramo.etiqueta}
                  onChange={(e) => updateTramo(tramo.id, { etiqueta: e.target.value })}
                  placeholder={`Ej. ${tramo.tipo === "resta" ? "Hueco columna" : "Living"}`}
                  className="w-full rounded-lg px-3 py-1.5 text-sm bg-white border border-border outline-none focus:border-ink"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">Largo</span>
                  <div className="flex items-center gap-2 rounded-xl bg-white border-[1.5px] border-ink px-3 py-2 focus-within:ring-2 focus-within:ring-action/70 focus-within:ring-offset-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={tramo.largo}
                      onChange={(e) => updateTramo(tramo.id, { largo: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      aria-label={`Largo del tramo ${i + 1}`}
                      className="w-full bg-transparent outline-none font-display text-lg placeholder:text-ink-faint"
                    />
                    <span className="font-mono text-xs text-ink-muted">m</span>
                  </div>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">Ancho</span>
                  <div className="flex items-center gap-2 rounded-xl bg-white border-[1.5px] border-ink px-3 py-2 focus-within:ring-2 focus-within:ring-action/70 focus-within:ring-offset-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={tramo.ancho}
                      onChange={(e) => updateTramo(tramo.id, { ancho: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      aria-label={`Ancho del tramo ${i + 1}`}
                      className="w-full bg-transparent outline-none font-display text-lg placeholder:text-ink-faint"
                    />
                    <span className="font-mono text-xs text-ink-muted">m</span>
                  </div>
                </label>
              </div>

              {area !== null && (
                <p className="mt-2 text-xs text-ink-muted">
                  {tramo.tipo === "resta" ? "Se resta: " : "Se suma: "}
                  {formatQuantity(area)} m²
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addTramo("suma")}
          className="text-xs font-medium text-navy inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar tramo que suma
        </button>
        <button
          type="button"
          onClick={() => addTramo("resta")}
          className="text-xs font-medium text-safety inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar tramo que resta
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-concrete px-5 py-4 text-center">
        <p className="text-sm text-ink-muted">Superficie total</p>
        <p className="font-display text-2xl font-semibold text-ink">
          {tramos.length > 0 ? `${formatQuantity(total)} m²` : "—"}
        </p>
      </div>
    </div>
  );
}
