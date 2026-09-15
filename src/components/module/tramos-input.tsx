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
              className={`rounded-ds-card border p-4 ${
                tramo.tipo === "resta" ? "border-ds-orange-600/40 bg-ds-orange-100/30" : "border-ds-border bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="inline-flex rounded-full border border-ds-border bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => updateTramo(tramo.id, { tipo: "suma" })}
                    aria-pressed={tramo.tipo === "suma"}
                    className={`rounded-full px-3 py-1 font-body text-xs font-bold transition-colors ${
                      tramo.tipo === "suma" ? "bg-ds-navy-900 text-white" : "text-ds-text-secondary hover:text-ds-navy-900"
                    }`}
                  >
                    + Suma
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTramo(tramo.id, { tipo: "resta" })}
                    aria-pressed={tramo.tipo === "resta"}
                    className={`rounded-full px-3 py-1 font-body text-xs font-bold transition-colors ${
                      tramo.tipo === "resta" ? "bg-ds-orange-600 text-white" : "text-ds-text-secondary hover:text-ds-navy-900"
                    }`}
                  >
                    − Resta
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeTramo(tramo.id)}
                  aria-label={`Quitar tramo ${i + 1}`}
                  className="text-ds-text-secondary hover:text-danger"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="grid gap-1.5 mb-3">
                <span className="font-body text-xs font-semibold text-ds-text-secondary">Etiqueta (opcional)</span>
                <input
                  type="text"
                  value={tramo.etiqueta}
                  onChange={(e) => updateTramo(tramo.id, { etiqueta: e.target.value })}
                  placeholder={`Ej. ${tramo.tipo === "resta" ? "Hueco columna" : "Living"}`}
                  className="w-full rounded-ds-input px-3 py-1.5 font-body text-sm bg-white border border-ds-border outline-none focus:border-ds-orange-600 focus:ring-[3px] focus:ring-ds-orange-100 transition-all"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5">
                  <span className="font-body text-sm font-semibold text-ds-text-secondary">Largo</span>
                  <div className="flex items-center gap-2 rounded-ds-input bg-white border-[1.5px] border-ds-border px-3 py-2 focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={tramo.largo}
                      onChange={(e) => updateTramo(tramo.id, { largo: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      aria-label={`Largo del tramo ${i + 1}`}
                      className="w-full bg-transparent outline-none font-display text-lg text-ds-navy-900 placeholder:text-ds-text-tertiary"
                    />
                    <span className="font-body text-xs font-semibold text-ds-text-secondary">m</span>
                  </div>
                </label>
                <label className="grid gap-1.5">
                  <span className="font-body text-sm font-semibold text-ds-text-secondary">Ancho</span>
                  <div className="flex items-center gap-2 rounded-ds-input bg-white border-[1.5px] border-ds-border px-3 py-2 focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={tramo.ancho}
                      onChange={(e) => updateTramo(tramo.id, { ancho: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      aria-label={`Ancho del tramo ${i + 1}`}
                      className="w-full bg-transparent outline-none font-display text-lg text-ds-navy-900 placeholder:text-ds-text-tertiary"
                    />
                    <span className="font-body text-xs font-semibold text-ds-text-secondary">m</span>
                  </div>
                </label>
              </div>

              {area !== null && (
                <p className="mt-2 font-body text-xs text-ds-text-secondary">
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
          className="font-body text-xs font-bold text-ds-navy-900 inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar tramo que suma
        </button>
        <button
          type="button"
          onClick={() => addTramo("resta")}
          className="font-body text-xs font-bold text-ds-orange-600 inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar tramo que resta
        </button>
      </div>

      <div className="mt-4 rounded-ds-card bg-ds-muted px-5 py-4 text-center">
        <p className="font-body text-sm text-ds-text-secondary">Superficie total</p>
        <p className="font-display text-2xl font-extrabold text-ds-navy-900">
          {tramos.length > 0 ? `${formatQuantity(total)} m²` : "—"}
        </p>
      </div>
    </div>
  );
}
