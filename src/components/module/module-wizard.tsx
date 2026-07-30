"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { QuestionStep } from "./question-step";
import { QuestionGroupStep, hasAreaToggle } from "./question-group-step";
import { ConditionalRevealStep } from "./conditional-reveal-step";
import { ApplianceConsumptionStep } from "./appliance-consumption-step";
import { ResultScreen } from "./result-screen";
import { pluralizeUnit } from "@/lib/pluralize";
import type { WizardAnswers, WizardQuestion } from "./types";
import type { ModuleGuideData } from "./guide-section";
import { calculateModuleAction, type CalculateModuleResult } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";

// Módulos donde el resultado permite editar una pregunta NUMBER ya
// contestada y recalcular todo sin volver atrás en el wizard (ver
// RecalculateField en result-screen.tsx) — mecanismo genérico, pero por
// ahora solo conectado en Radier (espesor). Cualquier otro módulo con una
// pregunta NUMBER editable en el wizard podría sumarse acá sin tocar
// ResultScreen ni la Server Action.
const RECALCULATE_FIELDS: Record<string, string> = {
  radier: "espesor-cm",
};

// Preguntas NUMBER que el usuario puede dejar en blanco y avanzar igual
// (ver botón "Omitir" en QuestionStep) — hoy solo el precio del kWh en
// Consumo eléctrico: si se omite, la Formula condicionada con
// {op:"defined",...} sobre esa Variable simplemente no se calcula y la
// tarjeta de costo no aparece (el consumo en kWh sí se muestra siempre).
const OPTIONAL_QUESTION_KEYS: Record<string, string[]> = {
  "consumo-electrico": ["precio-kwh"],
};

function isQuestionVisible(question: WizardQuestion, answers: WizardAnswers): boolean {
  if (!question.visibleIfQuestionKey) return true;
  const answer = answers[question.visibleIfQuestionKey];
  return answer !== undefined && question.visibleIfValues.includes(String(answer));
}

// Preguntas con el mismo stepGroup se agrupan en un solo paso del wizard,
// en el orden en que aparece cada grupo por primera vez. Preguntas con
// visibleIfQuestionKey se excluyen si esa condición no se cumple con las
// respuestas actuales.
function buildSteps(questions: WizardQuestion[], answers: WizardAnswers): WizardQuestion[][] {
  const visible = questions.filter((q) => isQuestionVisible(q, answers));
  const steps: WizardQuestion[][] = [];
  const groupIndex = new Map<string, number>();

  for (const question of visible) {
    if (question.stepGroup) {
      const existingIndex = groupIndex.get(question.stepGroup);
      if (existingIndex !== undefined) {
        steps[existingIndex].push(question);
        continue;
      }
      groupIndex.set(question.stepGroup, steps.length);
    }
    steps.push([question]);
  }

  return steps;
}

// Antes de calcular: cualquier pregunta que haya quedado OCULTA por
// visibleIf (nunca se le mostró al usuario) pero tenga hiddenDefaultValue
// configurado, se rellena con ese valor — para que las fórmulas/lookups
// que dependen de su respuesta sigan resolviendo igual que antes, en vez
// de quedar sin valor. Ej.: "colocacion" oculta cuando metodo_hormigon
// es "manual" asume "manual_carretilla".
function withHiddenDefaults(questions: WizardQuestion[], answers: WizardAnswers): WizardAnswers {
  const result = { ...answers };
  for (const question of questions) {
    if (!question.hiddenDefaultValue) continue;
    if (isQuestionVisible(question, answers)) continue;
    result[question.key] = question.hiddenDefaultValue;
  }
  return result;
}

// Precarga (editable) el valor sugerido de una pregunta NUMBER aún sin
// responder, vía defaultSource.table, si la pregunta de la que depende ya
// fue contestada. No pisa una respuesta que el usuario ya dio.
function withSuggestedDefaults(questions: WizardQuestion[], answers: WizardAnswers): WizardAnswers {
  const result: WizardAnswers = { ...answers };
  for (const question of questions) {
    if (result[question.key] !== undefined) continue;
    if (question.defaultSource?.type !== "LOOKUP") continue;
    const dependencyAnswer = answers[question.defaultSource.questionKey];
    if (dependencyAnswer === undefined) continue;
    const suggested = question.defaultSource.table[String(dependencyAnswer)];
    if (suggested !== undefined) result[question.key] = suggested;
  }
  return result;
}

export function ModuleWizard({
  moduleId,
  moduleSlug,
  moduleName,
  categoryName,
  questions,
  initialAnswers,
  guide,
  approvedPhotos,
  planContext,
  isAdvancedMode,
  forcedInitialArea,
}: {
  moduleId: string;
  // Usado solo para gatillar el nivel 4 de disclaimer de Gas (ver
  // gas-confirmation-gate.tsx) — no se generaliza a ningún otro tratamiento.
  // Opcional: la vista previa de /admin no lo pasa (no aplica ahí).
  moduleSlug?: string;
  moduleName: string;
  categoryName: string;
  questions: WizardQuestion[];
  initialAnswers?: WizardAnswers;
  guide?: ModuleGuideData | null;
  approvedPhotos?: { id: string; url: string }[];
  // Presente cuando el módulo se abrió desde una fase de /plan/[slug] — ver
  // ResultScreen para el redirect de vuelta al plan al guardar. `shape`
  // (Rectangular/Circular) viaja solo si el link de esta fase era de ese
  // tipo — ver SHAPE_LABELS en plan/[slug]/page.tsx.
  planContext?: { slug: string; phaseId: string; shape?: string };
  // Cálculos especiales (grupo herramientas-avanzadas, ver page.tsx) — antes
  // el encuadre de "esto es una pieza suelta, no el proyecto completo"
  // solo vivía en /grupos/herramientas-avanzadas; un usuario que llegaba
  // directo al módulo (búsqueda, link directo, /empezar) nunca lo veía.
  // No duplica el aviso de NormsDisclaimer (ver result-screen.tsx): ese es
  // específico del cálculo y aparece al final: este es genérico del
  // módulo y aparece antes de la primera pregunta.
  isAdvancedMode?: boolean;
  // Precarga el AreaInputToggle del primer step con esta área ya calculada
  // (modo "m² directo") — usado por la Fase 3 de "Construir una piscina"
  // para pasar el área del contorno de la piscina (ver plan/[slug]/page.tsx
  // y ContornoAreaField en plan-view.tsx). Solo se aplica mientras el
  // usuario no haya respondido ya ese step (ver stepIndex===0 más abajo) —
  // así "Volver" no pisa un valor que el usuario ya editó.
  forcedInitialArea?: number;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(initialAnswers ?? {});
  const [calculation, setCalculation] = useState<CalculateModuleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // history.length > 1 es la heurística estándar para "hay a dónde volver
  // en esta pestaña" — cubre los 3 puntos de entrada reales (buscador,
  // /grupos/[slug], /plan/[slug]) y cualquier otro link interno. Si el
  // módulo se abrió en pestaña nueva o por link pegado directo, history
  // arranca en 1 y el botón no se muestra (el link "Inicio" de arriba
  // sigue siendo el respaldo). Se calcula en useEffect porque
  // window.history no existe en el render de servidor.
  const [canGoBack, setCanGoBack] = useState(false);
  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  const steps = useMemo(() => buildSteps(questions, answers), [questions, answers]);
  const currentGroup = steps[stepIndex];

  const advanceOrCalculate = (nextAnswers: WizardAnswers) => {
    setAnswers(nextAnswers);
    setError(null);

    // steps/stepIndex del render actual reflejan las respuestas ANTERIORES a
    // esta; recalculamos con nextAnswers para decidir el próximo paso
    // correctamente cuando esta respuesta cambia qué preguntas son visibles.
    const nextSteps = buildSteps(questions, nextAnswers);
    const currentGroupFirstKey = currentGroup[0].key;
    const currentPosition = nextSteps.findIndex((group) => group.some((q) => q.key === currentGroupFirstKey));
    const nextIndex = (currentPosition === -1 ? stepIndex : currentPosition) + 1;

    if (nextIndex < nextSteps.length) {
      setStepIndex(nextIndex);
      return;
    }

    startTransition(async () => {
      try {
        const result = await calculateModuleAction(moduleId, withHiddenDefaults(questions, nextAnswers));
        setCalculation(result);
      } catch {
        setError("No pudimos calcular con esos datos. Revisa las respuestas e inténtalo de nuevo.");
      }
    });
  };

  const handleAnswer = (value: string | number) => {
    advanceOrCalculate({ ...answers, [currentGroup[0].key]: value });
  };

  const handleGroupAnswer = (values: Record<string, string | number>) => {
    advanceOrCalculate({ ...answers, ...values });
  };

  const handleSkip = () => {
    advanceOrCalculate(answers);
  };

  // Recalcula desde la pantalla de RESULTADO (ver RecalculateField) sin
  // pasar por steps ni stepIndex — misma calculateModuleAction que usa el
  // wizard, con las respuestas ya guardadas + el patch. Actualiza answers
  // además de calculation para que "Con estos datos respondiste" y
  // "Guardar como proyecto" reflejen el valor nuevo, no el original.
  const handleRecalculate = async (patch: WizardAnswers) => {
    const nextAnswers = { ...answers, ...patch };
    const result = await calculateModuleAction(moduleId, withHiddenDefaults(questions, nextAnswers));
    setCalculation(result);
    setAnswers(nextAnswers);
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    setStepIndex(stepIndex - 1);
  };

  // "Editar respuestas" desde el resultado (ver ResultScreen): a
  // diferencia de handleRestart, NO limpia `answers` — solo vuelve a
  // mostrar el wizard desde el primer paso, que ya prellena cada pregunta
  // con lo respondido antes vía stepInitialValues/withSuggestedDefaults
  // (mismo mecanismo que ya usa cada paso, no hace falta nada nuevo).
  // Coexiste con RecalculateField: ese es para ajustar un solo campo sin
  // salir del resultado; esto es para cambiar cualquier respuesta.
  const handleEditAnswers = () => {
    setCalculation(null);
    setError(null);
    setStepIndex(0);
  };

  const handleRestart = () => {
    setAnswers({});
    setCalculation(null);
    setError(null);
    setStepIndex(0);
  };

  const answersSummary = useMemo(() => {
    return questions
      .filter((question) => isQuestionVisible(question, answers))
      // Respuestas TEXT que son un blob JSON (ej. el desglose de Consumo
      // eléctrico, ver appliance-consumption-step.tsx) son para consumo
      // interno del cálculo, no algo legible para mostrar acá — regla
      // genérica por forma de la respuesta, no por módulo puntual.
      .filter((question) => {
        const raw = answers[question.key];
        return !(question.type === "TEXT" && typeof raw === "string" && /^[[{]/.test(raw.trim()));
      })
      .map((question) => {
        const raw = answers[question.key];
        if (question.type === "SELECT") {
          const option = question.options.find((o) => o.key === raw);
          return { label: question.label, value: option?.label ?? "—" };
        }
        if (!raw) return { label: question.label, value: "—" };
        const unit = question.unit ? pluralizeUnit(Number(raw), question.unit) : "";
        return { label: question.label, value: `${raw} ${unit}`.trim() };
      });
  }, [questions, answers]);

  const isConditionalReveal =
    currentGroup?.length === 2 && currentGroup[0].type === "SELECT" && currentGroup[1].type === "NUMBER";

  // Consumo eléctrico: paso de 2 preguntas (detalle JSON del desglose +
  // total en kWh) respondidas juntas por un único componente a medida —
  // mismo criterio que isConditionalReveal para saltarse QuestionGroupStep
  // por completo en este caso especial.
  const isApplianceConsumption = currentGroup?.length === 2 && currentGroup[0].key === "consumo-detalle-json";

  const stepInitialValues = useMemo(
    () => (currentGroup ? withSuggestedDefaults(currentGroup, answers) : answers),
    [currentGroup, answers]
  );

  const recalculateQuestionKey = moduleSlug ? RECALCULATE_FIELDS[moduleSlug] : undefined;
  const recalculateQuestion = recalculateQuestionKey
    ? questions.find((q) => q.key === recalculateQuestionKey)
    : undefined;
  const recalculateField =
    recalculateQuestion && answers[recalculateQuestion.key] !== undefined
      ? {
          questionKey: recalculateQuestion.key,
          label: recalculateQuestion.label,
          unit: recalculateQuestion.unit,
          value: Number(answers[recalculateQuestion.key]),
        }
      : undefined;

  return (
    <div className="max-w-2xl mx-auto px-6 pt-8 pb-20">
      {/* Antes apuntaba a /categorias/[categorySlug] (breadcrumb fijo a la
          categoría padre) — pero varias rutas llevan a un módulo sin pasar
          nunca por esa pantalla (buscador, /empezar, /guias, /plan,
          /galeria), así que el link mentía sobre de dónde "volvía" el
          usuario. Apunta a Inicio, igual que el resto de los "volver" de
          la app (ver /grupos/[slug]). */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="w-4 h-4" />
        Inicio
      </Link>

      <p className="font-mono text-xs uppercase tracking-wider mt-6 mb-2 text-safety">
        {moduleName}
      </p>

      {isAdvancedMode && !calculation && stepIndex === 0 && (
        <div className="mb-6 rounded-2xl p-4 bg-danger-tint border-2 border-danger">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-danger" strokeWidth={2.75} />
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-danger">Cálculos especiales: </span>
              este cálculo es una pieza suelta de tu proyecto, no un diseño estructural completo. Úsalo
              junto con la especificación de tu plano o maestro/constructor, no en su reemplazo.
            </p>
          </div>
        </div>
      )}

      {!calculation && (
        <>
          <div className="flex items-center gap-2 mb-8">
            <span className="font-mono text-xs text-ink-faint">
              {String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
            </span>
            <div className="h-1 flex-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-safety transition-all"
                style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {isConditionalReveal ? (
            <ConditionalRevealStep
              key={currentGroup.map((q) => q.id).join("-")}
              selectQuestion={currentGroup[0]}
              numberQuestion={currentGroup[1]}
              initialValues={stepInitialValues}
              onAnswer={handleGroupAnswer}
            />
          ) : isApplianceConsumption ? (
            <ApplianceConsumptionStep
              key={currentGroup.map((q) => q.id).join("-")}
              detailQuestion={currentGroup[0]}
              totalQuestion={currentGroup[1]}
              onAnswer={handleGroupAnswer}
            />
          ) : currentGroup.length > 1 || hasAreaToggle(currentGroup[0].stepGroup) ? (
            <QuestionGroupStep
              key={currentGroup.map((q) => q.id).join("-")}
              questions={currentGroup}
              initialValues={stepInitialValues}
              onAnswer={handleGroupAnswer}
              forcedInitialArea={
                forcedInitialArea !== undefined &&
                stepIndex === 0 &&
                hasAreaToggle(currentGroup[0].stepGroup) &&
                !currentGroup.some((q) => stepInitialValues[q.key])
                  ? forcedInitialArea
                  : undefined
              }
            />
          ) : (
            <QuestionStep
              key={currentGroup[0].id}
              question={currentGroup[0]}
              initialValue={stepInitialValues[currentGroup[0].key]}
              onAnswer={handleAnswer}
              onSkip={
                moduleSlug && OPTIONAL_QUESTION_KEYS[moduleSlug]?.includes(currentGroup[0].key)
                  ? handleSkip
                  : undefined
              }
              moduleSlug={moduleSlug}
            />
          )}

          {isPending && <p className="mt-6 text-sm text-ink-muted">Calculando…</p>}
          {error && <p className="mt-6 text-sm text-safety">{error}</p>}

          {stepIndex > 0 && !isPending && (
            <button
              onClick={handleBack}
              className="mt-8 text-sm font-medium underline underline-offset-4 text-ink-muted"
            >
              Volver a la pregunta anterior
            </button>
          )}
          {/* Paso 1: no hay pregunta anterior DENTRO del módulo, pero antes
              la única salida si el usuario entró al módulo equivocado era
              el link "Inicio" de arriba (te saca de todo el contexto).
              router.back() vuelve exactamente a la pantalla real de origen
              (buscador, /grupos/[slug], /plan/[slug], etc.) — no se puede
              armar un href fijo porque hay demasiados puntos de entrada
              distintos (ver comentario del link "Inicio" más arriba). Sin
              historial detectable (pestaña nueva, link pegado), no se
              muestra nada acá y "Inicio" sigue siendo el respaldo. */}
          {stepIndex === 0 && canGoBack && !isPending && (
            <button
              onClick={() => router.back()}
              className="mt-8 text-sm font-medium underline underline-offset-4 text-ink-muted"
            >
              Volver
            </button>
          )}
        </>
      )}

      {calculation && (
        <ResultScreen
          moduleId={moduleId}
          moduleName={moduleName}
          categoryName={categoryName}
          answersSummary={answersSummary}
          results={calculation.results}
          infoResults={calculation.infoResults}
          norms={calculation.norms}
          variables={calculation.variables}
          onRestart={handleRestart}
          guide={guide}
          approvedPhotos={approvedPhotos ?? []}
          planContext={planContext}
          recalculateField={recalculateField}
          onRecalculate={handleRecalculate}
          onEditAnswers={handleEditAnswers}
        />
      )}
    </div>
  );
}
