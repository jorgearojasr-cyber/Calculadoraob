"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { WizardQuestion } from "./types";

export function QuestionGroupStep({
  questions,
  initialValues,
  onAnswer,
}: {
  questions: WizardQuestion[];
  initialValues: Record<string, string | number | undefined>;
  onAnswer: (values: Record<string, number>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      questions.map((q) => [q.key, initialValues[q.key] !== undefined ? String(initialValues[q.key]) : ""])
    )
  );
  const [error, setError] = useState<string | null>(null);

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const parsed: Record<string, number> = {};
    for (const question of questions) {
      const raw = values[question.key] ?? "";
      const num = Number(raw.replace(",", "."));
      if (!raw || !Number.isFinite(num) || num <= 0) {
        setError("Completa todos los campos con un número mayor que 0.");
        return;
      }
      parsed[question.key] = num;
    }
    setError(null);
    onAnswer(parsed);
  };

  return (
    <div>
      <div className="grid gap-5">
        {questions.map((question, i) => (
          <div key={question.id}>
            <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight mb-2">
              {question.label}
            </h2>
            {question.helpText && <p className="text-sm text-ink-muted mb-3">{question.helpText}</p>}
            <div className="flex items-center gap-3 rounded-2xl px-5 py-4 bg-white border-[1.5px] border-ink">
              <input
                type="text"
                inputMode="decimal"
                autoFocus={i === 0}
                value={values[question.key]}
                onChange={(e) => setValue(question.key, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="0"
                className="w-full bg-transparent outline-none text-2xl font-display placeholder:text-ink-faint"
              />
              {question.unit && <span className="font-mono text-sm text-ink-muted">{question.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-safety">{error}</p>}

      <button
        onClick={handleSubmit}
        className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-ink"
      >
        Siguiente
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
