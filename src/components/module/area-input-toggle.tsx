"use client";

import { useEffect, useState } from "react";
import { MeasureDiagram } from "./measure-diagram";

export type AreaInputMode = "dims" | "area";

// Componente compartido: permite elegir entre ingresar largo×ancho (calcula
// m² automáticamente, con el diagrama de medida y su resumen en vivo) o
// ingresar la superficie en m² directamente (sin diagrama, un solo campo).
// Todavía no está conectado al wizard dinámico (Question/stepGroup) — es un
// bloque de UI autocontenido, pensado para reemplazar in situ los grupos de
// preguntas largo×ancho módulo por módulo en una migración posterior.
export function AreaInputToggle({
  primaryLabel = "largo",
  secondaryLabel = "ancho",
  unit = "m",
  initialMode = "dims",
  onAreaChange,
}: {
  primaryLabel?: string;
  secondaryLabel?: string;
  unit?: string;
  initialMode?: AreaInputMode;
  // Se llama cada vez que cambia el área resultante — null mientras los
  // campos relevantes del modo activo no formen un número válido (>0).
  onAreaChange: (areaM2: number | null) => void;
}) {
  const [mode, setMode] = useState<AreaInputMode>(initialMode);
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [area, setArea] = useState("");

  const toNumber = (raw: string) => {
    const num = Number(raw.replace(",", "."));
    return Number.isFinite(num) && num > 0 ? num : null;
  };

  const computedArea =
    mode === "dims"
      ? (() => {
          const p = toNumber(primary);
          const s = toNumber(secondary);
          return p !== null && s !== null ? p * s : null;
        })()
      : toNumber(area);

  useEffect(() => {
    onAreaChange(computedArea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedArea]);

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
        <>
          <div className="mb-5 rounded-2xl p-4 bg-white border border-border">
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
        </>
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
