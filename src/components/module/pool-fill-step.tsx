"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { WizardQuestion } from "./types";
import { formatQuantity } from "@/lib/format-number";
import { PoolConfiguratorLayout } from "./pool-configurator-layout";

// Paso "Llenado" del configurador integral de Piscina (Fase C7, 2026-09-04)
// -- EXCLUSIVO de "piscina-integral", mismo criterio ya aprobado para
// PoolEquipmentStep: geometría/UI propia, sin ilustración a propósito (el
// foco es el método de medición, no un dibujo).
//
// Basado en la investigación técnica aprobada: el diámetro de manguera/
// llave NO determina un caudal fijo (varía más de 2x según presión y largo
// real) -- la app NUNCA pregunta diámetro. El único dato que pide es el
// caudal REAL medido por el propio usuario con un balde de 10 L y un
// cronómetro -- aritmética exacta sobre un valor medido, no una suposición.
//
// Totalmente opcional (sección 18-22 del pedido): si el usuario responde
// "No", ninguna otra pregunta de este paso se muestra, y el grupo LLENADO
// del ResultScreen queda vacío -- mismo comportamiento ya usado para
// "Interior" con "Sin calcular" en ambas superficies.
const FILL_STEP_GROUP = "fill";

export function isFillStepGroup(stepGroup: string | null | undefined): boolean {
  return stepGroup === FILL_STEP_GROUP;
}

type SiNo = "si" | "no";

function findQuestion(questions: WizardQuestion[], key: string): WizardQuestion | undefined {
  return questions.find((q) => q.key === key);
}

function toNum(v: string | number | undefined): number | null {
  if (v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toNumOrNull(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const ESTIMAR_OPTIONS: { key: SiNo; label: string }[] = [
  { key: "si", label: "Sí" },
  { key: "no", label: "No" },
];

export function PoolFillStep({
  questions,
  initialValues,
  onAnswer,
  onSaveForLater,
}: {
  questions: WizardQuestion[];
  initialValues: Record<string, string | number | undefined>;
  onAnswer: (values: Record<string, string | number>) => void;
  onSaveForLater?: () => void;
}) {
  const initStr = (key: string) => (initialValues[key] !== undefined ? String(initialValues[key]) : "");

  const [estimar, setEstimar] = useState<SiNo | undefined>(
    (initialValues["llenado-estimar"] as SiNo | undefined) ?? undefined
  );
  const [segundos, setSegundos] = useState(initStr("llenado-segundos-balde"));
  const [error, setError] = useState<string | null>(null);

  // Volumen de agua YA respondido/calculado desde Medidas/Equipamiento --
  // mismas keys literales que usa PoolEquipmentStep, mismo cálculo exacto
  // (nunca se recalcula en paralelo el resultado real, solo se refleja acá
  // como preview antes de enviar).
  const forma = initialValues["que-forma-tendra-tu-piscina"];
  const isCircular = forma === "circular";
  const largo = toNum(initialValues["largo-interior-metros"]);
  const ancho = toNum(initialValues["ancho-interior-metros"]);
  const profundidadRect = toNum(initialValues["profundidad-interior-metros"]);
  const diametro = toNum(initialValues["diametro-interior-metros"]);
  const profundidadCirc = toNum(initialValues["profundidad-interior-metros-circular"]);

  const aguaVolumenM3 = isCircular
    ? diametro !== null && profundidadCirc !== null
      ? Math.PI * (diametro / 2) ** 2 * profundidadCirc
      : null
    : largo !== null && ancho !== null && profundidadRect !== null
      ? largo * ancho * profundidadRect
      : null;
  const aguaVolumenLitros = aguaVolumenM3 !== null ? aguaVolumenM3 * 1000 : null;

  // Mismas fórmulas EXACTAS que fase-c7-piscina-integral-llenado.ts (ver ese
  // archivo para la versión que realmente calcula ResultScreen) -- este
  // preview nunca sustituye al motor.
  const segundosN = toNumOrNull(segundos);
  const caudalLMin = segundosN !== null && segundosN > 0 ? 10 / (segundosN / 60) : null;
  const tiempoHoras =
    caudalLMin !== null && aguaVolumenLitros !== null ? aguaVolumenLitros / (caudalLMin * 60) : null;

  const estimarQ = findQuestion(questions, "llenado-estimar");
  const segundosQ = findQuestion(questions, "llenado-segundos-balde");

  const handleSubmit = () => {
    if (!estimar) {
      setError("Elige si quieres estimar el tiempo de llenado.");
      return;
    }
    if (estimar === "no") {
      setError(null);
      onAnswer({ "llenado-estimar": "no" });
      return;
    }
    if (segundosN === null || segundosN <= 0) {
      setError("Ingresa cuántos segundos demora en llenar el balde de 10 L (mayor que 0).");
      return;
    }
    setError(null);
    onAnswer({ "llenado-estimar": "si", "llenado-segundos-balde": segundosN });
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8">
      <PoolConfiguratorLayout activeBlock="Llenado" />

      <div className="grid gap-5">
        <div>
          <p className="text-sm font-medium mb-2">
            {estimarQ?.label ?? "¿Quieres estimar cuánto demorará en llenarse?"}
          </p>
          <div className="grid gap-2">
            {ESTIMAR_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setEstimar(opt.key)}
                className={`text-left rounded-xl px-4 py-3 border transition-colors ${
                  estimar === opt.key ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
                }`}
              >
                <span className="font-medium text-[14px]">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {estimar === "si" && (
          <div>
            <p className="text-sm font-medium mb-1.5">
              {segundosQ?.label ?? "¿Cuántos segundos demora tu llave en llenar un balde de 10 litros?"}
            </p>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-border focus-within:border-ink">
              <input
                type="text"
                inputMode="decimal"
                value={segundos}
                onChange={(e) => setSegundos(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-faint"
              />
              <span className="font-mono text-xs text-ink-muted flex-shrink-0">s</span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {segundosQ?.helpText ??
                "Abre la llave como la usarías para llenar la piscina, mide cuánto demora en llenar un balde de 10 L e ingresa ese tiempo."}
            </p>

            {caudalLMin !== null && (
              <div className="mt-4 rounded-2xl bg-concrete px-5 py-4">
                <p className="text-sm text-ink-muted">Caudal medido:</p>
                <p className="font-display text-2xl font-semibold text-ink mt-1">
                  {formatQuantity(caudalLMin)} L/min
                </p>
                {tiempoHoras !== null && (
                  <p className="text-sm text-ink-muted mt-2">
                    Con {aguaVolumenLitros !== null ? formatQuantity(Math.round(aguaVolumenLitros)) : "—"} L de
                    agua, tu piscina demoraría aproximadamente{" "}
                    <span className="font-semibold text-ink">{formatQuantity(tiempoHoras)} horas</span> en
                    llenarse a este caudal.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-safety">{error}</p>}

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="w-full rounded-full px-6 py-4 text-base font-semibold text-white flex items-center justify-center gap-2 bg-action"
        >
          Ver resultado
          <ArrowRight className="w-4 h-4" />
        </button>
        {onSaveForLater && (
          <button
            type="button"
            onClick={onSaveForLater}
            className="mt-3 w-full text-center text-sm font-medium text-ink-muted hover:text-ink underline underline-offset-4"
          >
            Guardar y seguir después
          </button>
        )}
      </div>
    </div>
  );
}
