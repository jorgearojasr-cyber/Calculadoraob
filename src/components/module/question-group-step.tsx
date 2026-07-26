"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { WizardQuestion } from "./types";
import { checkRangeWarning, parseTypicalRange } from "@/lib/range-hint";
import { MeasureDiagram } from "./measure-diagram";

// Piloto de diagramas de medida — solo estos 3 grupos de preguntas, por
// stepGroup. No generalizar sin revisar el resto de estepGroups primero.
const PILOT_DIAGRAMS: Record<
  string,
  {
    shape: "rectangle" | "rectangle-with-depth";
    primaryKey: string;
    primaryLabel: string;
    secondaryKey: string;
    secondaryLabel: string;
    depthKey?: string;
    depthLabel?: string;
  }
> = {
  "ducha-dims": {
    shape: "rectangle",
    primaryKey: "ancho-de-la-ducha-metros",
    primaryLabel: "ancho",
    secondaryKey: "profundidad-de-la-ducha-metros",
    secondaryLabel: "profundidad",
  },
  "sendero-dims": {
    shape: "rectangle",
    primaryKey: "largo-del-sendero-metros",
    primaryLabel: "largo",
    secondaryKey: "ancho-del-sendero-metros",
    secondaryLabel: "ancho",
  },
  // Piscina rectangular (largo/ancho/profundidad, 3 campos) queda fuera:
  // con 3 campos apilados, el layout en 375px ya llena el viewport sin
  // margen (scrollHeight == innerHeight); cualquier diagrama, incluso solo
  // largo x ancho, empuja "Siguiente" fuera de la vista. Se prioriza el
  // requisito de no romper el layout mobile sobre el diagrama en este caso.
};

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

  const stepGroup = questions[0]?.stepGroup;
  const diagram = stepGroup ? PILOT_DIAGRAMS[stepGroup] : undefined;

  const rangeWarnings: Record<string, string | null> = {};
  for (const question of questions) {
    const range = parseTypicalRange(question.helpText, question.key);
    const raw = values[question.key] ?? "";
    const num = Number(raw.replace(",", "."));
    rangeWarnings[question.key] =
      range && raw && Number.isFinite(num) && num > 0 ? checkRangeWarning(num, range) : null;
  }

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
      {diagram && (
        <div className="mb-5 rounded-2xl p-4 bg-white border border-border">
          <MeasureDiagram
            shape={diagram.shape}
            primaryLabel={diagram.primaryLabel}
            secondaryLabel={diagram.secondaryLabel}
            depthLabel={diagram.depthLabel}
          />
        </div>
      )}
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
            {rangeWarnings[question.key] && (
              <p className="mt-2 text-sm text-amber-600">{rangeWarnings[question.key]}</p>
            )}
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
