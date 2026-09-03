"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { WizardQuestion } from "./types";
import { formatQuantity } from "@/lib/format-number";
import { PoolConfiguratorLayout } from "./pool-configurator-layout";

// Paso "Equipamiento" del configurador integral de Piscina (Fase C5,
// 2026-09-02) -- EXCLUSIVO de "piscina-integral", mismo criterio ya
// aprobado para PoolExcavationStep/PoolEnvironmentStep: geometría/UI
// propia que no encaja en QuestionGroupStep genérico.
//
// Alcance DELIBERADAMENTE acotado (sección 1 del pedido C5): esto NO es
// diseño hidráulico. El usuario responde UNA sola pregunta nueva (tiempo
// de recirculación, 6h/8h, sin default silencioso) -- Bomba/Filtro/
// Skimmers/Retornos NO son preguntas, son criterios de selección fijos
// (mismo texto que ya quedó en fase-c5-piscina-integral-equipamiento.ts
// como InfoResult), así que este componente los muestra tal cual, sin
// pedirle nada al usuario sobre ellos.
//
// Sin ilustración propia a propósito (sección 18 del pedido: "no dar una
// falsa sensación de diseño hidráulico" dibujando bomba/filtro/tuberías)
// -- el foco queda en el panel, igual que el resto de los pasos ya
// concentra su explicación en texto + preview numérico, no en el dibujo.
const EQUIPMENT_STEP_GROUP = "equipment";

export function isEquipmentStepGroup(stepGroup: string | null | undefined): boolean {
  return stepGroup === EQUIPMENT_STEP_GROUP;
}

type Horas = "6" | "8";

function findQuestion(questions: WizardQuestion[], key: string): WizardQuestion | undefined {
  return questions.find((q) => q.key === key);
}

function toNum(v: string | number | undefined): number | null {
  if (v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const HORAS_OPTIONS: { key: Horas; label: string }[] = [
  { key: "6", label: "6 horas" },
  { key: "8", label: "8 horas" },
];

// Criterios fijos -- MISMO texto exacto que fase-c5-piscina-integral-
// equipamiento.ts (Variables "equipamiento-bomba-criterio"/"-skimmers-
// criterio"/"-retornos-criterio"). No son preguntas, así que no hay
// Question.label que leer -- se muestran tal cual, igual que cualquier
// criterio informativo fijo del catálogo (ver RefuerzoCard para el
// precedente de texto fijo mostrado sin pregunta asociada).
const BOMBA_CRITERIO =
  "Selecciona una bomba cuya curva de funcionamiento entregue al menos el caudal objetivo, considerando la altura manométrica y las pérdidas de carga de la instalación.";
const FILTRO_CRITERIO = "Selecciona un filtro cuyo caudal nominal admisible sea igual o superior al caudal objetivo.";
const SKIMMERS_CRITERIO =
  "Definir según diseño hidráulico. La cantidad y ubicación dependen de la superficie, geometría, circulación y condiciones de la piscina.";
const RETORNOS_CRITERIO = "Definir según diseño hidráulico. La cantidad y ubicación deben definirse según el sistema de circulación.";

export function PoolEquipmentStep({
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
  const [horas, setHoras] = useState<Horas | undefined>(
    (initialValues["equipamiento-tiempo-recirculacion-h"] as Horas | undefined) ?? undefined
  );
  const [error, setError] = useState<string | null>(null);

  // Dimensiones ya respondidas en Medidas -- mismas keys literales que
  // usan VolumeStep/PoolExcavationStep/PoolEnvironmentStep, leídas del
  // mismo `initialValues` acumulado. Volumen de agua calculado EN VIVO
  // acá solo como preview -- MISMA fórmula exacta que fase-c4-2-piscina-
  // integral-consolidacion.ts ("agua-volumen-m3-rect"/"-circ"), el
  // resultado real que llega a ResultScreen lo sigue calculando el motor
  // contra esos mismos Formula rows (sección 3 del pedido C5: nunca se
  // recalcula el agua en paralelo, esto es puramente un espejo del MISMO
  // cálculo para mostrarlo antes de enviar).
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

  const caudalM3h = aguaVolumenM3 !== null && horas ? aguaVolumenM3 / Number(horas) : null;

  const horasQ = findQuestion(questions, "equipamiento-tiempo-recirculacion-h");

  const handleSubmit = () => {
    if (!horas) {
      setError("Elige el tiempo de recirculación considerado (6 u 8 horas).");
      return;
    }
    setError(null);
    onAnswer({ "equipamiento-tiempo-recirculacion-h": horas });
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8">
      <PoolConfiguratorLayout activeBlock="Equipamiento" />

      <div className="rounded-2xl bg-concrete px-5 py-4 mb-5">
        <p className="text-sm text-ink-muted">Volumen de agua de tu piscina:</p>
        <p className="font-display text-2xl font-semibold text-ink mt-1">
          {aguaVolumenM3 !== null ? `${formatQuantity(aguaVolumenM3)} m³` : "—"}
          {aguaVolumenLitros !== null && (
            <span className="text-base font-body text-ink-muted"> ({formatQuantity(Math.round(aguaVolumenLitros))} L)</span>
          )}
        </p>
        {caudalM3h !== null && (
          <p className="text-sm text-ink-muted mt-2">Caudal de recirculación estimado: {formatQuantity(caudalM3h)} m³/h</p>
        )}
      </div>

      <div className="grid gap-5">
        <div>
          <p className="text-sm font-medium mb-2">{horasQ?.label ?? "Tiempo de recirculación considerado"}</p>
          <div className="grid gap-2">
            {HORAS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setHoras(opt.key)}
                className={`text-left rounded-xl px-4 py-3 border transition-colors ${
                  horas === opt.key ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
                }`}
              >
                <span className="font-medium text-[14px]">{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            {horasQ?.helpText ??
              "Es el tiempo considerado para hacer pasar aproximadamente todo el volumen de agua por el sistema de filtración."}
          </p>
        </div>

        {/* Criterios de selección -- sin cifra inventada (sección 1/28 del
            pedido C5): Bomba, Skimmers y Retornos son SIEMPRE el mismo
            texto informativo, sin importar las respuestas anteriores.
            Filtro sí muestra el caudal objetivo (mismo valor de arriba),
            porque es el criterio real de selección de un filtro. */}
        <div className="grid gap-3">
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-sm font-semibold mb-1">Bomba</p>
            <p className="text-xs text-ink-muted">{BOMBA_CRITERIO}</p>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-sm font-semibold mb-1">Filtro</p>
            {caudalM3h !== null && (
              <p className="text-sm font-medium mb-1">Caudal nominal mínimo: ≥ {formatQuantity(caudalM3h)} m³/h</p>
            )}
            <p className="text-xs text-ink-muted">{FILTRO_CRITERIO}</p>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-sm font-semibold mb-1">Skimmers</p>
            <p className="text-xs text-ink-muted">{SKIMMERS_CRITERIO}</p>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-sm font-semibold mb-1">Retornos</p>
            <p className="text-xs text-ink-muted">{RETORNOS_CRITERIO}</p>
          </div>
        </div>
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
