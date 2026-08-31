"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { formatQuantity } from "@/lib/format-number";
import { toNum } from "./dimension-utils/parsing";
import { parseAreaFromRawDims } from "./dimension-utils/area";
import { PinturaIllustration } from "./pintura-illustration";
import { SubmitActions } from "./question-group-step/submit-actions";
import type { DiagramConfig } from "./module-visual-config";

// Paso de medidas de Pintura — componente STANDALONE ("Calculadora de
// PINTURA rediseñada", 2026-08-30, aprobado por Jorge). Reemplaza el uso
// de AreaInputToggle (compartido con Muro de bloques y Pintar fachada
// exterior, ambos con enableDeduction: true) SOLO para el módulo Pintura
// — ver `standaloneAreaStep` en module-visual-config.ts, presente
// únicamente en la entrada "pintura". AreaInputToggle.tsx NO fue tocado:
// esos otros dos módulos siguen usando exactamente el mismo componente y
// comportamiento de siempre, sin este archivo de por medio.
//
// Diferencia de comportamiento respecto a AreaInputToggle (intencional,
// confirmada por Jorge): el bloque de vanos y la tarjeta de resultado
// bruta/vanos/neta están disponibles en AMBOS modos ("largo × alto" y
// "m² directo") — antes (y todavía, en AreaInputToggle) el modo "m²
// directo" no ofrecía descuento de vanos en ningún módulo.
type DeductionRow = { ancho: string; alto: string };
type AreaMode = "dims" | "area";

export function PinturaAreaStep({
  diagram,
  initialArea,
  error,
  handleSubmit,
  onSaveForLater,
  onAreaChange,
}: {
  diagram: DiagramConfig;
  initialArea?: string;
  error: string | null;
  handleSubmit: () => void;
  onSaveForLater?: () => void;
  onAreaChange: (areaM2: number | null) => void;
}) {
  // Mismo criterio que AreaInputToggle: si ya hay una respuesta previa
  // (ej. "Editar respuestas"), abre directo en "m² directo" con ese valor
  // precargado, en vez del tab "largo × alto" vacío por defecto.
  const [mode, setMode] = useState<AreaMode>(initialArea ? "area" : "dims");
  const [primary, setPrimary] = useState(""); // largo
  const [secondary, setSecondary] = useState(""); // alto
  const [area, setArea] = useState(initialArea ?? "");
  const [deductions, setDeductions] = useState<DeductionRow[]>([]);

  const primaryLabel = diagram.primaryLabel; // "largo"
  const secondaryLabel = diagram.secondaryLabel ?? "alto";
  const deductionLabel = diagram.deductionLabel ?? "Puertas y ventanas a descontar";

  const grossArea = mode === "dims" ? parseAreaFromRawDims(primary, secondary) : toNum(area);

  const validDeductions = deductions
    .map((row) => ({ ancho: toNum(row.ancho) ?? 0, alto: toNum(row.alto) ?? 0 }))
    .filter((v) => v.ancho > 0 && v.alto > 0);
  const deductionTotal = validDeductions.reduce((sum, v) => sum + v.ancho * v.alto, 0);

  const netArea = grossArea !== null ? Math.max(0, grossArea - deductionTotal) : null;

  useEffect(() => {
    onAreaChange(netArea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netArea]);

  const updateDeduction = (index: number, patch: Partial<DeductionRow>) => {
    setDeductions((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const deductionBlock = (
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
              onFocus={(e) => e.target.select()}
              placeholder="Ancho"
              aria-label={`Ancho de la puerta o ventana ${i + 1}`}
              className="w-20 min-w-0 flex-1 rounded-lg px-3 py-1.5 text-sm bg-white border border-border outline-none focus:border-ink"
            />
            <span className="text-ink-faint text-sm flex-shrink-0">×</span>
            <input
              type="text"
              inputMode="decimal"
              value={row.alto}
              onChange={(e) => updateDeduction(i, { alto: e.target.value })}
              onFocus={(e) => e.target.select()}
              placeholder="Alto"
              aria-label={`Alto de la puerta o ventana ${i + 1}`}
              className="w-20 min-w-0 flex-1 rounded-lg px-3 py-1.5 text-sm bg-white border border-border outline-none focus:border-ink"
            />
            <span className="font-mono text-xs text-ink-muted flex-shrink-0">m</span>
            <button
              type="button"
              onClick={() => setDeductions((prev) => prev.filter((_, idx) => idx !== i))}
              aria-label={`Quitar puerta o ventana ${i + 1}`}
              className="text-ink-muted hover:text-safety flex-shrink-0"
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
  );

  // Tarjeta de resultado — diseño aprobado ("Calculadora de PINTURA
  // rediseñada"): 3 celdas (Superficie bruta − Vanos = Superficie neta)
  // con "Superficie neta" en cápsula naranja, en AMBOS modos. Sin vanos
  // todavía (deductionTotal === 0), colapsa a una sola celda — mismo
  // criterio que ya usaba AreaInputToggle para no mostrar un desglose de
  // "0 m² de vanos" que no aporta información.
  const resultCard =
    deductionTotal > 0 ? (
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-2xl bg-concrete px-3 py-4 text-center">
        <div>
          <p className="text-xs text-ink-muted">Superficie bruta</p>
          <p className="font-display text-lg font-semibold text-ink">{grossArea !== null ? formatQuantity(grossArea) : "—"} m²</p>
        </div>
        <span className="text-ink-faint text-base">−</span>
        <div>
          <p className="text-xs text-ink-muted">Vanos</p>
          <p className="font-display text-lg font-semibold text-ink">{formatQuantity(deductionTotal)} m²</p>
        </div>
        <span className="text-ink-faint text-base">=</span>
        <div className="rounded-xl bg-[#FFE4D6] px-2 py-2">
          <p className="text-xs font-medium text-[#E04500]">Superficie neta</p>
          <p className="font-display text-lg font-semibold text-[#E04500]">{netArea !== null ? formatQuantity(netArea) : "—"} m²</p>
        </div>
      </div>
    ) : (
      <div className="mt-4 rounded-2xl bg-concrete px-5 py-4 text-center">
        <p className="text-sm text-ink-muted">Superficie</p>
        <p className="font-display text-2xl font-semibold text-ink">{grossArea !== null ? `${formatQuantity(grossArea)} m²` : "—"}</p>
      </div>
    );

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
          {/* Ilustración en mobile: ANTES de los inputs (diseño aprobado)
              — instancia separada, oculta en desktop (md:hidden), donde la
              columna de abajo (md:order-2) ya la muestra en su lugar de
              siempre. Ningún `order` explícito hace falta acá: en mobile
              el orden natural del DOM ya la deja primera. */}
          <div className="md:hidden mb-5 rounded-2xl bg-[#F3F7FB] p-4">
            <PinturaIllustration largo={toNum(primary)} alto={toNum(secondary)} vanos={validDeductions} />
          </div>

          <div className="md:order-1">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium capitalize">{primaryLabel}</span>
                <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-4 py-3 focus-within:ring-2 focus-within:ring-action/70 focus-within:ring-offset-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="w-full bg-transparent outline-none font-display text-xl placeholder:text-ink-faint"
                  />
                  <span className="font-mono text-sm text-ink-muted">m</span>
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
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="w-full bg-transparent outline-none font-display text-xl placeholder:text-ink-faint"
                  />
                  <span className="font-mono text-sm text-ink-muted">m</span>
                </div>
              </label>
            </div>

            {deductionBlock}
            {resultCard}
          </div>

          {/* Ilustración en desktop: columna derecha de siempre. */}
          <div className="hidden md:block order-2 mb-6 md:mb-0 rounded-2xl bg-[#F3F7FB] p-5 md:p-6">
            <PinturaIllustration largo={toNum(primary)} alto={toNum(secondary)} vanos={validDeductions} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8">
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

          {deductionBlock}
          {resultCard}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-safety">{error}</p>}

      <SubmitActions onSubmit={handleSubmit} onSaveForLater={onSaveForLater} />
    </div>
  );
}
