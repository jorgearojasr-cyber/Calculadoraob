"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { MeasureDiagram } from "./measure-diagram";
import { formatQuantity } from "@/lib/format-number";

export type AreaInputMode = "dims" | "area";

type DeductionRow = { ancho: string; alto: string };

// Componente compartido: permite elegir entre ingresar largo×ancho (calcula
// m² automáticamente, con el diagrama de medida y su resumen en vivo) o
// ingresar la superficie en m² directamente (sin diagrama, un solo campo).
//
// Descuento de vanos (puertas/ventanas): con `enableDeduction`, en modo
// largo×ancho aparece una lista de "vanos" (ancho×alto cada uno, agregar/
// quitar libremente) que se resta del área bruta — generaliza el patrón
// que Pintura resolvía con preguntas fijas (cuántas puertas 0-3-"más de 3"
// + un campo de área personalizada de respaldo): acá no hay tope de 3 ni
// caso especial, se puede agregar cualquier cantidad de vanos y cada uno
// se ve reflejado al toque. El modo "m² directo" nunca pide vanos — el
// usuario ya está dando el área neta final. onAreaChange siempre entrega
// el área NETA (bruta − vanos en modo dims; el valor tal cual en modo
// área directa) — igual que el "area-final" que antes calculaba Pintura
// en el DSL con coalesce(area-directa, area-neta).
export function AreaInputToggle({
  primaryLabel = "largo",
  secondaryLabel = "ancho",
  unit = "m",
  initialMode = "dims",
  enableDeduction = false,
  deductionLabel = "Puertas y ventanas a descontar",
  initialPrimary,
  initialSecondary,
  initialArea,
  onAreaChange,
}: {
  primaryLabel?: string;
  secondaryLabel?: string;
  unit?: string;
  initialMode?: AreaInputMode;
  enableDeduction?: boolean;
  deductionLabel?: string;
  // Prellenado opcional (editable) del modo "dims" — ej. el perímetro de la
  // piscina derivado en /plan/[slug]/page.tsx para el largo del Sendero.
  initialPrimary?: string;
  initialSecondary?: string;
  // Prellenado opcional (editable) del modo "m² directo".
  initialArea?: string;
  // Se llama cada vez que cambia el área NETA resultante o los campos del
  // modo activo. `dims` trae los valores CRUDOS (tal como los tecleó el
  // usuario, sin redondear) de largo/ancho cuando el modo activo es "dims"
  // y ambos son números válidos — null en modo "m² directo" (ahí no existen
  // dims individuales reales que dar, solo el área). El consumidor decide
  // qué hacer con cada uno; ver question-group-step.tsx para el caso de uso
  // (preservar el par real en vez de reconstruir un cuadrado ficticio).
  onAreaChange: (
    areaM2: number | null,
    dims: { primary: string; secondary: string } | null
  ) => void;
}) {
  const [mode, setMode] = useState<AreaInputMode>(initialMode);
  const [primary, setPrimary] = useState(initialPrimary ?? "");
  const [secondary, setSecondary] = useState(initialSecondary ?? "");
  const [area, setArea] = useState(initialArea ?? "");
  const [deductions, setDeductions] = useState<DeductionRow[]>([]);

  const toNumber = (raw: string) => {
    const num = Number(raw.replace(",", "."));
    return Number.isFinite(num) && num > 0 ? num : null;
  };

  const grossArea =
    mode === "dims"
      ? (() => {
          const p = toNumber(primary);
          const s = toNumber(secondary);
          return p !== null && s !== null ? p * s : null;
        })()
      : toNumber(area);

  const deductionTotal = deductions.reduce((sum, row) => {
    const a = toNumber(row.ancho);
    const h = toNumber(row.alto);
    return sum + (a !== null && h !== null ? a * h : 0);
  }, 0);

  const computedArea =
    mode === "dims" && grossArea !== null
      ? Math.max(0, grossArea - deductionTotal)
      : grossArea;

  useEffect(() => {
    const dims =
      mode === "dims" && toNumber(primary) !== null && toNumber(secondary) !== null
        ? { primary, secondary }
        : null;
    onAreaChange(computedArea, dims);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedArea, mode, primary, secondary]);

  const updateDeduction = (index: number, patch: Partial<DeductionRow>) => {
    setDeductions((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div>
      <div className="mb-4 inline-flex rounded-full border border-border bg-white p-1">
        <button
          type="button"
          onClick={() => setMode("dims")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "dims" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
          }`}
        >
          {primaryLabel} × {secondaryLabel}
        </button>
        <button
          type="button"
          onClick={() => setMode("area")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "area" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
          }`}
        >
          m² directo
        </button>
      </div>

      {mode === "dims" ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8 lg:grid lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:items-center">
          <div className="order-1 lg:order-2 mb-6 lg:mb-0">
            <MeasureDiagram
              shape="rectangle"
              primaryLabel={primaryLabel}
              secondaryLabel={secondaryLabel}
              primaryValue={primary}
              secondaryValue={secondary}
              primaryUnit={unit}
              secondaryUnit={unit}
            />
          </div>
          <div className="order-2 lg:order-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium capitalize">{primaryLabel}</span>
              <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-4 py-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent outline-none font-display text-xl placeholder:text-ink-faint"
                />
                <span className="font-mono text-sm text-ink-muted">{unit}</span>
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium capitalize">{secondaryLabel}</span>
              <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-4 py-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent outline-none font-display text-xl placeholder:text-ink-faint"
                />
                <span className="font-mono text-sm text-ink-muted">{unit}</span>
              </div>
            </label>
          </div>

          {enableDeduction && (
            <div className="mt-5">
              <p className="text-sm font-medium mb-2">{deductionLabel} (opcional)</p>
              <div className="grid gap-2">
                {deductions.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.ancho}
                      onChange={(e) => updateDeduction(i, { ancho: e.target.value })}
                      placeholder="Ancho"
                      className="w-24 rounded-lg px-3 py-1.5 text-sm bg-white border border-border outline-none focus:border-ink"
                    />
                    <span className="text-ink-faint text-sm">×</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.alto}
                      onChange={(e) => updateDeduction(i, { alto: e.target.value })}
                      placeholder="Alto"
                      className="w-24 rounded-lg px-3 py-1.5 text-sm bg-white border border-border outline-none focus:border-ink"
                    />
                    <span className="font-mono text-xs text-ink-muted">{unit}</span>
                    <button
                      type="button"
                      onClick={() => setDeductions((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-ink-muted hover:text-safety"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDeductions((prev) => [...prev, { ancho: "", alto: "" }])}
                className="mt-2 text-xs font-medium text-navy inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar puerta o ventana
              </button>
            </div>
          )}

          {/* Caja de superficie siempre visible, igual al patrón de los
              módulos migrados a pregunta combinada (ver COMBINED_AREA_QUESTION
              en question-group-step.tsx) — antes esto no existía acá: solo se
              mostraba una línea bruto/neto, y solo si ya había vanos con
              valores. */}
          <div className="mt-4 rounded-2xl bg-concrete px-5 py-4 text-center">
            <p className="text-sm text-ink-muted">
              {enableDeduction && deductionTotal > 0 ? "Superficie neta" : "Superficie"}
            </p>
            <p className="font-display text-2xl font-semibold text-ink">
              {computedArea !== null ? `${formatQuantity(computedArea)} m²` : "—"}
            </p>
            {enableDeduction && deductionTotal > 0 && grossArea !== null && (
              <p className="mt-1 text-xs text-ink-muted">
                {formatQuantity(grossArea)} m² brutos − {formatQuantity(deductionTotal)} m² de vanos
              </p>
            )}
          </div>
          </div>
        </div>
      ) : (
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Superficie</span>
          <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-5 py-4">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent outline-none font-display text-2xl placeholder:text-ink-faint"
            />
            <span className="font-mono text-sm text-ink-muted">m²</span>
          </div>
        </label>
      )}
    </div>
  );
}
