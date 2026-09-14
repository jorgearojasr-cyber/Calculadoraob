"use client";

import { useEffect, useState } from "react";
import { DiagramV2 } from "@/lib/diagram-v2";
import { formatQuantity } from "@/lib/format-number";
import { toNum } from "./dimension-utils/parsing";
import { capitalize } from "./dimension-utils/formatting";
import { parseAreaFromRawDims } from "./dimension-utils/area";
import {
  calcTotalArea,
  createEmptyTramo,
  tramosToRecords,
  validateTramos,
  type TramoInput,
  type TramoRecord,
} from "./dimension-utils/tramos";
import { TramosInput } from "./tramos-input";
import { TramosIllustration } from "./tramos-illustration";

export type AreaInputMode = "dims" | "area" | "tramos";

// Componente compartido: permite elegir entre ingresar largo×ancho (calcula
// m² automáticamente, con el diagrama de medida y su resumen en vivo),
// ingresar la superficie en m² directamente, o construirla con "Área
// personalizada" (Fase 3, 2026-09-14): sumar y restar tramos rectangulares
// con etiqueta libre — ver dimension-utils/tramos.ts.
//
// "Área personalizada" GENERALIZA Y REEMPLAZA el descuento de vanos que
// antes vivía inline en modo largo×ancho (`enableDeduction`): un tramo
// "resta" cubre el mismo caso (puerta/ventana descontada), pero con
// etiqueta y sin estar atado a un único rectángulo exterior — además el
// desglose se PERSISTE (antes se perdía al recargar/editar, ver
// question-group-step/index.tsx → handleAreaChange). onAreaChange sigue
// entregando el área NETA final en los 3 modos — igual contrato que
// siempre, más un 3er parámetro opcional con el desglose de tramos (null
// en los otros 2 modos) para que el caller lo persista.
export function AreaInputToggle({
  primaryLabel = "largo",
  secondaryLabel = "ancho",
  unit = "m",
  initialMode = "dims",
  initialPrimary,
  initialSecondary,
  initialArea,
  initialTramos,
  tileSizeCm,
  orientationHint,
  roofSlopeFactor,
  onAreaChange,
}: {
  primaryLabel?: string;
  secondaryLabel?: string;
  unit?: string;
  initialMode?: AreaInputMode;
  // Prellenado opcional (editable) del modo "dims" — ej. el perímetro de la
  // piscina derivado en /plan/[slug]/page.tsx para el largo del Sendero.
  initialPrimary?: string;
  initialSecondary?: string;
  // Prellenado opcional (editable) del modo "m² directo".
  initialArea?: string;
  // Prellenado opcional (editable) del modo "Área personalizada" — ej. al
  // reabrir vía "Cambiar" una respuesta ya dada con tramos (ver
  // question-group-step/index.tsx). Sin esto, arranca con 1 tramo "suma"
  // vacío, como siempre.
  initialTramos?: TramoInput[];
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
  // planta y muestra ambas superficies reales debajo — solo en modo "dims".
  roofSlopeFactor?: number;
  // Se llama cada vez que cambia el área NETA resultante o los campos del
  // modo activo. `dims` trae los valores CRUDOS (tal como los tecleó el
  // usuario, sin redondear) de largo/ancho cuando el modo activo es "dims"
  // y ambos son números válidos — null en los otros 2 modos. `tramos` trae
  // el desglose (ya parseado y con área por tramo) SOLO en modo "Área
  // personalizada" — null en los otros 2. El consumidor decide qué hacer
  // con cada uno; ver question-group-step.tsx (handleAreaChange).
  onAreaChange: (
    areaM2: number | null,
    dims: { primary: string; secondary: string } | null,
    tramos: TramoRecord[] | null
  ) => void;
}) {
  const [mode, setMode] = useState<AreaInputMode>(initialMode);
  const [primary, setPrimary] = useState(initialPrimary ?? "");
  const [secondary, setSecondary] = useState(initialSecondary ?? "");
  const [area, setArea] = useState(initialArea ?? "");
  const [tramos, setTramos] = useState<TramoInput[]>(() => initialTramos ?? [createEmptyTramo("suma")]);
  // Campo activo del diagrama (ver `activeField`, spec aprobada) — solo
  // "largo"/"ancho" existen acá, los otros 2 modos no tienen ese diagrama.
  const [activeInput, setActiveInput] = useState<"largo" | "ancho" | null>(null);

  const tramoRecords = tramosToRecords(tramos);
  const tramosTotal = calcTotalArea(tramoRecords);
  const tramosError = tramos.length > 0 ? validateTramos(tramoRecords) : null;

  const dimsArea = mode === "dims" ? parseAreaFromRawDims(primary, secondary) : null;
  const directArea = mode === "area" ? toNum(area) : null;
  const computedArea = mode === "dims" ? dimsArea : mode === "area" ? directArea : tramosTotal;

  useEffect(() => {
    const dims =
      mode === "dims" && toNum(primary) !== null && toNum(secondary) !== null
        ? { primary, secondary }
        : null;
    onAreaChange(computedArea, dims, mode === "tramos" ? tramoRecords : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedArea, mode, primary, secondary, tramoRecords]);

  return (
    <div>
      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-full border border-border bg-white p-1">
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
        <button
          type="button"
          onClick={() => setMode("tramos")}
          aria-pressed={mode === "tramos"}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${
            mode === "tramos" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
          }`}
        >
          Área personalizada
        </button>
      </div>

      {mode === "dims" && (
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
            />
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
                    onFocus={(e) => {
                      e.target.select();
                      setActiveInput("largo");
                    }}
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
                    onFocus={(e) => {
                      e.target.select();
                      setActiveInput("ancho");
                    }}
                    onBlur={() => setActiveInput((prev) => (prev === "ancho" ? null : prev))}
                    placeholder="0"
                    className="w-full bg-transparent outline-none font-display text-xl placeholder:text-ink-faint"
                  />
                  <span className="font-mono text-sm text-ink-muted">{unit}</span>
                </div>
              </label>
            </div>

            {/* Caja de superficie siempre visible, igual al patrón de los
                módulos migrados a pregunta combinada (ver COMBINED_AREA_QUESTION
                en question-group-step.tsx). */}
            <div className="mt-4 rounded-2xl bg-concrete px-5 py-4 text-center">
              <p className="text-sm text-ink-muted">Superficie</p>
              <p className="font-display text-2xl font-semibold text-ink">
                {computedArea !== null ? `${formatQuantity(computedArea)} m²` : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {mode === "area" && (
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Superficie</span>
          <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-5 py-4 focus-within:ring-2 focus-within:ring-action/70 focus-within:ring-offset-1">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={area}
              onChange={(e) => setArea(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className="w-full bg-transparent outline-none font-display text-2xl placeholder:text-ink-faint"
            />
            <span className="font-mono text-sm text-ink-muted">m²</span>
          </div>
        </label>
      )}

      {mode === "tramos" && (
        <div>
          <TramosIllustration tramos={tramoRecords} />
          <div className="mt-4">
            <TramosInput tramos={tramos} onChange={setTramos} />
          </div>
          {tramosError && (
            <p className="mt-3 text-sm text-safety">{tramosError}</p>
          )}
        </div>
      )}
    </div>
  );
}
