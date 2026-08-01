"use client";

import { useState, useTransition } from "react";
import { WizardHeader } from "@/components/module/wizard-header";
import { QuestionStep } from "@/components/module/question-step";
import type { WizardQuestion } from "@/components/module/types";
import { RegularizationYearStep } from "./regularization-year-step";
import type { RegularizationWizardAnswers } from "./types";
import { createRegularizationCaseAction } from "@/app/(app)/regularizacion/actions";
import type { RegularizationRuleResult } from "@/lib/regularization-rules";

// Orquestador del wizard inicial de Regularización — arquitectura
// aprobada 2026-08-01. Los 5 pasos son fijos y conocidos en código (a
// diferencia de ModuleWizard, no vienen de una tabla Question), así que
// no hay detección de forma ni agrupamiento dinámico por stepGroup — cada
// paso se renderiza explícitamente según stepIndex. NO evalúa las reglas
// (delegado a evaluateRegularizationRules, invocado por la Server
// Action), NO conoce avalúo fiscal/documentos/recintos (fases
// posteriores), NO decide navegación (expone onComplete, quien lo use
// decide la pantalla siguiente).

const STEP_TIPO: WizardQuestion = {
  id: "tipoConstruccion",
  key: "tipoConstruccion",
  label: "¿Qué construiste?",
  type: "SELECT",
  unit: null,
  helpText: null,
  options: [
    { key: "AMPLIACION", label: "Ampliación", description: null, imageUrl: null },
    { key: "SEGUNDO_PISO", label: "Segundo piso", description: null, imageUrl: null },
    { key: "TERRAZA_CERRADA", label: "Terraza cerrada", description: null, imageUrl: null },
    { key: "QUINCHO", label: "Quincho", description: null, imageUrl: null },
    { key: "BODEGA", label: "Bodega", description: null, imageUrl: null },
    { key: "ESTACIONAMIENTO_TECHADO", label: "Estacionamiento techado", description: null, imageUrl: null },
    { key: "VIVIENDA_COMPLETA", label: "Vivienda completa", description: null, imageUrl: null },
    { key: "OTRO", label: "Otro", description: null, imageUrl: null },
  ],
  stepGroup: null,
  visibleIfQuestionKey: null,
  visibleIfValues: [],
  hiddenDefaultValue: null,
  defaultSource: null,
};

const RECEPCION_OPTION_TO_VALUE: Record<string, boolean | null> = { si: true, no: false, no_se: null };
const STEP_RECEPCION: WizardQuestion = {
  id: "recepcionMunicipal",
  key: "recepcionMunicipal",
  label: "¿Esta construcción cuenta con recepción municipal?",
  type: "SELECT",
  unit: null,
  helpText: null,
  options: [
    { key: "si", label: "Sí", description: null, imageUrl: null },
    { key: "no", label: "No", description: null, imageUrl: null },
    { key: "no_se", label: "No estoy seguro", description: null, imageUrl: null },
  ],
  stepGroup: null,
  visibleIfQuestionKey: null,
  visibleIfValues: [],
  hiddenDefaultValue: null,
  defaultSource: null,
};

const STEP_M2: WizardQuestion = {
  id: "m2Estimados",
  key: "m2Estimados",
  label: "¿Cuántos m² aproximados tiene lo construido?",
  type: "NUMBER",
  unit: "m²",
  helpText: "No hace falta una medición exacta — un estimado sirve para esta primera evaluación.",
  options: [],
  stepGroup: null,
  visibleIfQuestionKey: null,
  visibleIfValues: [],
  hiddenDefaultValue: null,
  defaultSource: null,
};

const STEP_MATERIAL: WizardQuestion = {
  id: "material",
  key: "material",
  label: "¿De qué material está construido principalmente?",
  type: "SELECT",
  unit: null,
  helpText: null,
  options: [
    { key: "MADERA", label: "Madera", description: null, imageUrl: null },
    { key: "ALBANILERIA", label: "Albañilería", description: null, imageUrl: null },
    { key: "METALCON", label: "Metalcón", description: null, imageUrl: null },
    { key: "HORMIGON", label: "Hormigón", description: null, imageUrl: null },
    { key: "MIXTA", label: "Mixta", description: null, imageUrl: null },
    { key: "OTRO", label: "Otro", description: null, imageUrl: null },
  ],
  stepGroup: null,
  visibleIfQuestionKey: null,
  visibleIfValues: [],
  hiddenDefaultValue: null,
  defaultSource: null,
};

const STEP_COUNT = 5;

export type RegularizationWizardResult = { caseId: string; rules: RegularizationRuleResult[] };

export function RegularizationWizard({ onComplete }: { onComplete: (result: RegularizationWizardResult) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<RegularizationWizardAnswers>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const finish = (finalAnswers: Required<RegularizationWizardAnswers>) => {
    setError(null);
    startTransition(async () => {
      const result = await createRegularizationCaseAction(finalAnswers);
      if (!result.caseId) {
        setError(result.error ?? "No se pudo crear el caso.");
        return;
      }
      onComplete(result);
    });
  };

  const handleTipo = (value: string | number) => {
    const next = { ...answers, tipoConstruccion: value as RegularizationWizardAnswers["tipoConstruccion"] };
    setAnswers(next);
    setStepIndex(1);
  };

  const handleAnio = (anioConstruccion: number | null) => {
    setAnswers((prev) => ({ ...prev, anioConstruccion }));
    setStepIndex(2);
  };

  const handleRecepcion = (value: string | number) => {
    const next = { ...answers, recepcionMunicipal: RECEPCION_OPTION_TO_VALUE[String(value)] };
    setAnswers(next);
    setStepIndex(3);
  };

  const handleM2 = (value: string | number) => {
    const next = { ...answers, m2Estimados: Number(value) };
    setAnswers(next);
    setStepIndex(4);
  };

  const handleMaterial = (value: string | number) => {
    const next: RegularizationWizardAnswers = {
      ...answers,
      material: value as RegularizationWizardAnswers["material"],
    };
    setAnswers(next);
    // Último paso — todas las respuestas están completas acá.
    finish(next as Required<RegularizationWizardAnswers>);
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8">
      <WizardHeader moduleName="Regulariza tu Vivienda" step={{ index: stepIndex, total: STEP_COUNT }} />

      {stepIndex === 0 && <QuestionStep question={STEP_TIPO} initialValue={answers.tipoConstruccion} onAnswer={handleTipo} />}
      {stepIndex === 1 && <RegularizationYearStep initialValue={answers.anioConstruccion} onAnswer={handleAnio} />}
      {stepIndex === 2 && (
        <QuestionStep
          question={STEP_RECEPCION}
          initialValue={
            answers.recepcionMunicipal === true ? "si" : answers.recepcionMunicipal === false ? "no" : undefined
          }
          onAnswer={handleRecepcion}
        />
      )}
      {stepIndex === 3 && <QuestionStep question={STEP_M2} initialValue={answers.m2Estimados} onAnswer={handleM2} />}
      {stepIndex === 4 && (
        <QuestionStep question={STEP_MATERIAL} initialValue={answers.material} onAnswer={handleMaterial} />
      )}

      {isPending && <p className="mt-4 text-sm text-ink-muted">Guardando...</p>}
      {error && <p className="mt-4 text-sm text-safety">{error}</p>}

      {stepIndex > 0 && !isPending && (
        <button
          onClick={goBack}
          className="mt-8 text-sm font-medium underline underline-offset-4 text-ink-muted"
        >
          Volver
        </button>
      )}
    </div>
  );
}
