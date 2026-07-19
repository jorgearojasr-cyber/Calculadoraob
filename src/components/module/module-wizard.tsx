"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuestionStep } from "./question-step";
import { ResultScreen } from "./result-screen";
import type { WizardAnswers, WizardQuestion } from "./types";
import { calculateModuleAction } from "@/app/categorias/[slug]/[moduleSlug]/actions";
import type { CalculationResult } from "@/lib/formula-engine";

export function ModuleWizard({
  moduleId,
  moduleName,
  categorySlug,
  categoryName,
  questions,
}: {
  moduleId: string;
  moduleName: string;
  categorySlug: string;
  categoryName: string;
  questions: WizardQuestion[];
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [results, setResults] = useState<CalculationResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentQuestion = questions[stepIndex];

  const handleAnswer = (value: string | number) => {
    const nextAnswers = { ...answers, [currentQuestion.key]: value };
    setAnswers(nextAnswers);
    setError(null);

    if (stepIndex < questions.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }

    startTransition(async () => {
      try {
        const { results } = await calculateModuleAction(moduleId, nextAnswers);
        setResults(results);
      } catch {
        setError("No pudimos calcular con esos datos. Revisa las respuestas e inténtalo de nuevo.");
      }
    });
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    setStepIndex(stepIndex - 1);
  };

  const handleRestart = () => {
    setAnswers({});
    setResults(null);
    setError(null);
    setStepIndex(0);
  };

  const answersSummary = useMemo(() => {
    return questions.map((question) => {
      const raw = answers[question.key];
      if (question.type === "SELECT") {
        const option = question.options.find((o) => o.key === raw);
        return { label: question.label, value: option?.label ?? "—" };
      }
      return { label: question.label, value: raw ? `${raw} ${question.unit ?? ""}`.trim() : "—" };
    });
  }, [questions, answers]);

  return (
    <div className="max-w-xl mx-auto px-6 pt-8 pb-20">
      <Link
        href={`/categorias/${categorySlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="w-4 h-4" />
        {categoryName}
      </Link>

      <p className="font-mono text-xs uppercase tracking-wider mt-6 mb-2 text-blueprint">
        {moduleName}
      </p>

      {!results && (
        <>
          <div className="flex items-center gap-2 mb-8">
            <span className="font-mono text-xs text-ink-faint">
              {String(stepIndex + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
            </span>
            <div className="h-1 flex-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-blueprint transition-all"
                style={{ width: `${((stepIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <QuestionStep
            key={currentQuestion.id}
            question={currentQuestion}
            initialValue={answers[currentQuestion.key]}
            onAnswer={handleAnswer}
          />

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

      {results && (
        <ResultScreen
          moduleName={moduleName}
          categoryName={categoryName}
          answersSummary={answersSummary}
          results={results}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
