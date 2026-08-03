"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { DiagramV2 } from "@/lib/diagram-v2";
import { formatQuantity } from "@/lib/format-number";
import { toNum } from "./dimension-utils/parsing";
import { capitalize } from "./dimension-utils/formatting";
import { parseAreaFromRawDims } from "./dimension-utils/area";

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
  tileSizeCm,
  orientationHint,
  roofSlopeFactor,
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
  // Retícula de modulación con tamaño real de pieza (ver DiagramV2) — ya
  // resuelta por el caller (QuestionGroupStep) desde una respuesta previa
  // (ej. tamaño de cerámica elegido en un paso anterior).
  tileSizeCm?: { width: number; height: number };
  // Pista de orientación (recto/diagonal) cuando no hay tamaño de pieza.
  orientationHint?: "recto" | "diagonal";
  // Techumbres (Fase 4 Grupo 5) — mismo factor real que ya usa el motor de
  // fórmulas (ver ROOF_SLOPE_FACTORS en question-group-step.tsx), ya
  // resuelto por el caller desde una respuesta previa (pendiente del
  // techo). Dibuja un plano inclinado ilustrativo junto al rectángulo de
  // planta y muestra ambas superficies reales debajo.
  roofSlopeFactor?: number;
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
  // Campo activo del diagrama (ver `activeField`, spec aprobada) — solo
  // "largo"/"ancho" existen acá, el modo "m² directo" no tiene diagrama.
  const [activeInput, setActiveInput] = useState<"largo" | "ancho" | null>(null);

  const grossArea = mode === "dims" ? parseAreaFromRawDims(primary, secondary) : toNum(area);

  const deductionTotal = deductions.reduce((sum, row) => {
    const a = toNum(row.ancho);
    const h = toNum(row.alto);
    return sum + (a !== null && h !== null ? a * h : 0);
  }, 0);

  const computedArea =
    mode === "dims" && grossArea !== null
      ? Math.max(0, grossArea - deductionTotal)
      : grossArea;

  useEffect(() => {
    const dims =
      mode === "dims" && toNum(primary) !== null && toNum(secondary) !== null
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
          aria-pressed={mode === "dims"}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${
            mode === "dims" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
          }`}
        >
          {primaryLabel} × {secondaryLabel}
        </button>
        <button
          type="button"
          onClick={() => setMode("area")}
          aria-pressed={mode === "area"}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${
            mode === "area" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
          }`}
        >
          m² directo
        </button>
      </div>

      {mode === "dims" ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8 grid md:grid-cols-[1fr_1.15fr] md:gap-10 md:items-center">
          <div className="order-2 mb-6 md:mb-0">
            <DiagramV2
              kind="rect2d"
              largo={toNum(primary) ?? undefined}
              ancho={toNum(secondary) ?? undefined}
              labels={{ largo: capitalize(primaryLabel), ancho: capitalize(secondaryLabel) }}
              unit={unit}
              activeField={activeInput ?? undefined}
              tileSizeCm={tileSizeCm}
              orientationHint={tileSizeCm ? undefined : orientationHint}
              roofSlopeFactor={roofSlopeFactor}
              voids={
                enableDeduction
                  ? deductions
                      .map((row) => ({ ancho: toNum(row.ancho) ?? 0, alto: toNum(row.alto) ?? 0 }))
                      .filter((v) => v.ancho > 0 && v.alto > 0)
                  : undefined
              }
            />
            {/* Nota de honestidad — spec Fase 4 (2026-08-02): "los diagramas
                deben ser explicativos, no planos técnicos" — cuando la
                posición de un dato no existe (acá, dónde está cada vano),
                se avisa en vez de fingir precisión. */}
            {enableDeduction && deductions.some((d) => toNum(d.ancho) && toNum(d.alto)) && (
              <p className="mt-2 text-center text-xs text-ink-faint">
                Representación esquemática. La ubicación de puertas y ventanas es ilustrativa.
              </p>
            )}
            {/* Mismo criterio de honestidad: la orientación es real (el
                usuario la eligió), pero las líneas NO representan piezas
                reales — no hay tamaño de pieza conocido en estos módulos. */}
            {!tileSizeCm && orientationHint && (
              <p className="mt-2 text-center text-xs text-ink-faint">
                Representación esquemática de la orientación — no representa el tamaño real de las piezas.
              </p>
            )}
            {roofSlopeFactor && computedArea !== null && (
              <p className="mt-2 text-center text-xs text-ink-muted">
                Superficie proyectada: {formatQuantity(computedArea)} m² · Superficie real del techo:{" "}
                {formatQuantity(computedArea * roofSlopeFactor)} m²
              </p>
            )}
          </div>
          <div className="order-1">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium capitalize">{primaryLabel}</span>
              <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-4 py-3 focus-within:ring-2 focus-within:ring-action/70 focus-within:ring-offset-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  onFocus={() => setActiveInput("largo")}
                  onBlur={() => setActiveInput((prev) => (prev === "largo" ? null : prev))}
                  placeholder="0"
                  className="w-full bg-transparent outline-none font-display text-xl placeholder:text-ink-faint"
                />
                <span className="font-mono text-sm text-ink-muted">{unit}</span>
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium capitalize">{secondaryLabel}</span>
              <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-4 py-3 focus-within:ring-2 focus-within:ring-action/70 focus-within:ring-offset-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                  onFocus={() => setActiveInput("ancho")}
                  onBlur={() => setActiveInput((prev) => (prev === "ancho" ? null : prev))}
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
                      aria-label={`Ancho de la puerta o ventana ${i + 1}`}
                      className="w-24 rounded-lg px-3 py-1.5 text-sm bg-white border border-border outline-none focus:border-ink"
                    />
                    <span className="text-ink-faint text-sm">×</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.alto}
                      onChange={(e) => updateDeduction(i, { alto: e.target.value })}
                      placeholder="Alto"
                      aria-label={`Alto de la puerta o ventana ${i + 1}`}
                      className="w-24 rounded-lg px-3 py-1.5 text-sm bg-white border border-border outline-none focus:border-ink"
                    />
                    <span className="font-mono text-xs text-ink-muted">{unit}</span>
                    <button
                      type="button"
                      onClick={() => setDeductions((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label={`Quitar puerta o ventana ${i + 1}`}
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
          <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-5 py-4 focus-within:ring-2 focus-within:ring-action/70 focus-within:ring-offset-1">
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
