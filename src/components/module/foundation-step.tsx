"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import type { WizardQuestion } from "./types";
import { formatQuantity } from "@/lib/format-number";
import { FieldRow } from "./question-group-step/field-row";
import { SubmitActions } from "./question-group-step/submit-actions";
import { DiagramV2 } from "@/lib/diagram-v2";
import { toNum } from "./dimension-utils/parsing";
import { toMeters } from "./dimension-utils/units";
import { parseAnswers } from "./dimension-utils/validation";

// Componente específico de Fundación (cimiento corrido) — Fase 4,
// decisión de producto (2026-08-02): "no quiero forzarla dentro del
// patrón de una caja simple... una excepción justificada por la
// geometría, no por el módulo". Una fundación real son 2 secciones
// rectangulares distintas (base ancha + cuello angosto encima), no un
// solo box de 3 dimensiones — por eso no reutiliza VolumeStep. Sí
// reutiliza el mismo motor de diagramas (DiagramV2, kind="steppedBox",
// ver src/lib/diagram-v2/DiagramV2.tsx) y los mismos subcomponentes de
// campo (FieldRow/SubmitActions) que el resto de los pasos con diagrama —
// nada de esto es lógica de cálculo nueva, solo la vista de 5 campos en
// vez de 3.
//
// El stepGroup que activa este componente se fusionó a mano (ver
// prisma/merge-fundacion.ts): "largo" + el grupo "base" (ancho_base,
// alto_base) + el grupo "cuello" (ancho_cuello, alto_cuello) ahora
// comparten el mismo stepGroup, en ese orden — este componente asume
// exactamente esa forma (5 preguntas: largo, ancho_base, alto_base,
// ancho_cuello, alto_cuello).
const FUNDACION_STEP_GROUP = "cmrvizbv10000csse7oy2pha3";

export function isFoundationStepGroup(stepGroup: string | null | undefined): boolean {
  return stepGroup === FUNDACION_STEP_GROUP;
}

export function FoundationStep({
  questions,
  initialValues,
  onAnswer,
  onSaveForLater,
  focusFieldKey,
}: {
  questions: WizardQuestion[];
  initialValues: Record<string, string | number | undefined>;
  onAnswer: (values: Record<string, number>) => void;
  onSaveForLater?: () => void;
  // BUG-003: ver QuestionGroupStep — campo puntual a autoenfocar (de los 5)
  // en vez de "Largo" por defecto, cuando se llegó acá vía "Cambiar".
  focusFieldKey?: string | null;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.key, initialValues[q.key] !== undefined ? String(initialValues[q.key]) : ""]))
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const [largoQ, anchoBaseQ, altoBaseQ, anchoCuelloQ, altoCuelloQ] = questions;

  // Mismo criterio que VolumeStep: convierte cada campo a metros según su
  // propia unidad antes de calcular el volumen en vivo — Fundación mezcla
  // largo (m) con las 4 medidas de sección (cm). toNum/toMeters son la
  // lógica compartida del framework (ver dimension-utils/); esta fila
  // compone ambas para un campo puntual (valor crudo + su unidad).
  const toFieldMeters = (question: WizardQuestion, raw: string | undefined) => toMeters(toNum(raw), question.unit);

  const largoM = toFieldMeters(largoQ, values[largoQ.key]);
  const anchoBaseM = toFieldMeters(anchoBaseQ, values[anchoBaseQ.key]);
  const altoBaseM = toFieldMeters(altoBaseQ, values[altoBaseQ.key]);
  const anchoCuelloM = toFieldMeters(anchoCuelloQ, values[anchoCuelloQ.key]);
  const altoCuelloM = toFieldMeters(altoCuelloQ, values[altoCuelloQ.key]);
  const allValid = [largoM, anchoBaseM, altoBaseM, anchoCuelloM, altoCuelloM].every((n) => n !== null);
  // Vista previa: base + cuello como 2 prismas apilados (mismo largo) —
  // solo para mostrar mientras el usuario escribe; el cálculo real (con
  // pérdidas, etc.) lo hace el motor de fórmulas como siempre.
  const volume =
    allValid ? largoM! * (anchoBaseM! * altoBaseM! + anchoCuelloM! * altoCuelloM!) : null;

  const tip = questions.map((q) => q.helpText).find(Boolean);

  const handleSubmit = () => {
    const result = parseAnswers(questions, values);
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    setError(null);
    // Fundación no tiene preguntas SELECT (las 5 son NUMBER) — parseAnswers
    // es genérico para todo el framework (también valida SELECT, ver
    // dimension-utils/validation.ts), así que en runtime `result.parsed`
    // acá siempre son números; el cast solo ajusta el tipo a lo que ya es
    // cierto para este componente, sin cambiar su prop pública `onAnswer`.
    onAnswer(result.parsed as Record<string, number>);
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8 grid md:grid-cols-[1fr_1.15fr] md:gap-10 md:items-start">
      <div className="order-1">
        <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight mb-2">¿Qué medidas tiene la fundación?</h2>
        <p className="text-sm text-ink-muted mb-5">
          La fundación tiene 2 secciones: la base (más ancha, en el fondo) y el cuello (más angosto, hasta el nivel del terreno).
        </p>

        <div className="grid gap-4">
          <FieldRow
            icon="horizontal"
            label="Largo"
            value={values[largoQ.key]}
            unit={largoQ.unit}
            autoFocus={focusFieldKey ? largoQ.key === focusFieldKey : true}
            onChange={(v) => setValue(largoQ.key, v)}
            onEnter={handleSubmit}
            onFocus={() => setActiveKey(largoQ.key)}
            onBlur={() => setActiveKey((prev) => (prev === largoQ.key ? null : prev))}
          />
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint -mb-1">Base</p>
          <div className="grid gap-3 md:grid-cols-2">
            <FieldRow
              icon="horizontal"
              label="Ancho base"
              value={values[anchoBaseQ.key]}
              unit={anchoBaseQ.unit}
              autoFocus={anchoBaseQ.key === focusFieldKey}
              onChange={(v) => setValue(anchoBaseQ.key, v)}
              onEnter={handleSubmit}
              onFocus={() => setActiveKey(anchoBaseQ.key)}
              onBlur={() => setActiveKey((prev) => (prev === anchoBaseQ.key ? null : prev))}
            />
            <FieldRow
              icon="vertical"
              label="Alto base"
              value={values[altoBaseQ.key]}
              unit={altoBaseQ.unit}
              autoFocus={altoBaseQ.key === focusFieldKey}
              onChange={(v) => setValue(altoBaseQ.key, v)}
              onEnter={handleSubmit}
              onFocus={() => setActiveKey(altoBaseQ.key)}
              onBlur={() => setActiveKey((prev) => (prev === altoBaseQ.key ? null : prev))}
            />
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint -mb-1">Cuello</p>
          <div className="grid gap-3 md:grid-cols-2">
            <FieldRow
              icon="horizontal"
              label="Ancho cuello"
              value={values[anchoCuelloQ.key]}
              unit={anchoCuelloQ.unit}
              autoFocus={anchoCuelloQ.key === focusFieldKey}
              onChange={(v) => setValue(anchoCuelloQ.key, v)}
              onEnter={handleSubmit}
              onFocus={() => setActiveKey(anchoCuelloQ.key)}
              onBlur={() => setActiveKey((prev) => (prev === anchoCuelloQ.key ? null : prev))}
            />
            <FieldRow
              icon="vertical"
              label="Alto cuello"
              value={values[altoCuelloQ.key]}
              unit={altoCuelloQ.unit}
              autoFocus={altoCuelloQ.key === focusFieldKey}
              onChange={(v) => setValue(altoCuelloQ.key, v)}
              onEnter={handleSubmit}
              onFocus={() => setActiveKey(altoCuelloQ.key)}
              onBlur={() => setActiveKey((prev) => (prev === altoCuelloQ.key ? null : prev))}
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-concrete px-5 py-4">
          <p className="text-sm text-ink-muted">Volumen de hormigón</p>
          <p className="font-display text-2xl font-semibold text-ink">{volume !== null ? `${formatQuantity(volume)} m³` : "—"}</p>
        </div>

        {tip && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 bg-concrete md:hidden">
            <Lightbulb className="w-4 h-4 text-ink-muted flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink-muted">{tip}</p>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-safety">{error}</p>}

        <SubmitActions onSubmit={handleSubmit} onSaveForLater={onSaveForLater} />
      </div>

      <div className="order-2 mb-6 md:mb-0 rounded-2xl bg-[#F3F7FB] p-5 md:p-6">
        <div className="hidden md:block mb-4">
          <p className="font-semibold text-sm">Así se ve con tus medidas</p>
          <p className="text-sm text-ink-muted mt-1">Base y cuello son 2 secciones reales — el diagrama muestra ambas.</p>
        </div>
        <DiagramV2
          kind="steppedBox"
          labels={{}}
          steppedBox={{
            largo: toNum(values[largoQ.key]) ?? undefined,
            anchoBase: toNum(values[anchoBaseQ.key]) ?? undefined,
            altoBase: toNum(values[altoBaseQ.key]) ?? undefined,
            anchoCuello: toNum(values[anchoCuelloQ.key]) ?? undefined,
            altoCuello: toNum(values[altoCuelloQ.key]) ?? undefined,
          }}
          steppedLabels={{ largo: "Largo", anchoBase: "Ancho base", altoBase: "Alto base", anchoCuello: "Ancho cuello", altoCuello: "Alto cuello" }}
          steppedUnits={{
            largo: largoQ.unit ?? undefined,
            anchoBase: anchoBaseQ.unit ?? undefined,
            altoBase: altoBaseQ.unit ?? undefined,
            anchoCuello: anchoCuelloQ.unit ?? undefined,
            altoCuello: altoCuelloQ.unit ?? undefined,
          }}
          activeSteppedField={
            activeKey === largoQ.key
              ? "largo"
              : activeKey === anchoBaseQ.key
                ? "anchoBase"
                : activeKey === altoBaseQ.key
                  ? "altoBase"
                  : activeKey === anchoCuelloQ.key
                    ? "anchoCuello"
                    : activeKey === altoCuelloQ.key
                      ? "altoCuello"
                      : undefined
          }
        />
        {tip && (
          <div className="hidden md:flex mt-4 items-start gap-2.5 rounded-xl px-4 py-3 bg-concrete">
            <Lightbulb className="w-4 h-4 text-ink-muted flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink-muted">{tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}
