"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuestionStep } from "./question-step";
import { QuestionGroupStep } from "./question-group-step";
import { ConditionalRevealStep } from "./conditional-reveal-step";
import { ResultScreen } from "./result-screen";
import type { WizardAnswers, WizardQuestion } from "./types";
import { calculateModuleAction, type CalculateModuleResult } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";

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
  moduleName,
  categorySlug,
  categoryName,
  questions,
  initialAnswers,
}: {
  moduleId: string;
  moduleName: string;
  categorySlug: string;
  categoryName: string;
  questions: WizardQuestion[];
  initialAnswers?: WizardAnswers;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(initialAnswers ?? {});
  const [calculation, setCalculation] = useState<CalculateModuleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        const result = await calculateModuleAction(moduleId, nextAnswers);
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

  const handleBack = () => {
    if (stepIndex === 0) return;
    setStepIndex(stepIndex - 1);
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
      .map((question) => {
        const raw = answers[question.key];
        if (question.type === "SELECT") {
          const option = question.options.find((o) => o.key === raw);
          return { label: question.label, value: option?.label ?? "—" };
        }
        return { label: question.label, value: raw ? `${raw} ${question.unit ?? ""}`.trim() : "—" };
      });
  }, [questions, answers]);

  const isConditionalReveal =
    currentGroup?.length === 2 && currentGroup[0].type === "SELECT" && currentGroup[1].type === "NUMBER";

  const stepInitialValues = useMemo(
    () => (currentGroup ? withSuggestedDefaults(currentGroup, answers) : answers),
    [currentGroup, answers]
  );

  return (
    <div className="max-w-xl mx-auto px-6 pt-8 pb-20">
      <Link
        href={`/categorias/${categorySlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="w-4 h-4" />
        {categoryName}
      </Link>

      <p className="font-mono text-xs uppercase tracking-wider mt-6 mb-2 text-safety">
        {moduleName}
      </p>

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
          ) : currentGroup.length > 1 ? (
            <QuestionGroupStep
              key={currentGroup.map((q) => q.id).join("-")}
              questions={currentGroup}
              initialValues={stepInitialValues}
              onAnswer={handleGroupAnswer}
            />
          ) : (
            <QuestionStep
              key={currentGroup[0].id}
              question={currentGroup[0]}
              initialValue={stepInitialValues[currentGroup[0].key]}
              onAnswer={handleAnswer}
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
        />
      )}
    </div>
  );
}
