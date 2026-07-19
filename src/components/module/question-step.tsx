"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { WizardQuestion } from "./types";

export function QuestionStep({
  question,
  initialValue,
  onAnswer,
}: {
  question: WizardQuestion;
  initialValue: string | number | undefined;
  onAnswer: (value: string | number) => void;
}) {
  const [textValue, setTextValue] = useState(
    initialValue !== undefined ? String(initialValue) : ""
  );
  const [error, setError] = useState<string | null>(null);

  if (question.type === "SELECT") {
    return (
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-2">
          {question.label}
        </h2>
        {question.helpText && <p className="text-sm text-ink-muted mb-6">{question.helpText}</p>}
        <div className="grid gap-3 mt-6">
          {question.options.map((option) => {
            const selected = initialValue === option.key;
            return (
              <button
                key={option.key}
                onClick={() => onAnswer(option.key)}
                className={`flex items-center justify-between text-left rounded-xl px-5 py-4 border transition-colors ${
                  selected
                    ? "border-blueprint bg-[#EEF2FB]"
                    : "border-border bg-white hover:border-ink"
                }`}
              >
                <span className="font-medium text-[15px]">{option.label}</span>
                {selected ? (
                  <Check className="w-4 h-4 text-blueprint" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-ink-faint" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const isNumber = question.type === "NUMBER";

  const handleSubmit = () => {
    if (isNumber) {
      const num = Number(textValue.replace(",", "."));
      if (!textValue || !Number.isFinite(num) || num <= 0) {
        setError("Ingresa un número mayor que 0.");
        return;
      }
      setError(null);
      onAnswer(num);
      return;
    }

    if (!textValue.trim()) {
      setError("Este campo es obligatorio.");
      return;
    }
    setError(null);
    onAnswer(textValue.trim());
  };

  return (
    <div>
      <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-2">
        {question.label}
      </h2>
      {question.helpText && <p className="text-sm text-ink-muted mb-6">{question.helpText}</p>}
      <div className="mt-6 flex items-center gap-3 rounded-2xl px-5 py-4 bg-white border-[1.5px] border-ink">
        <input
          type="text"
          inputMode={isNumber ? "decimal" : "text"}
          autoFocus
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={isNumber ? "0" : ""}
          className="w-full bg-transparent outline-none text-2xl font-display placeholder:text-ink-faint"
        />
        {question.unit && <span className="font-mono text-sm text-ink-muted">{question.unit}</span>}
      </div>
      {error && <p className="mt-2 text-sm text-safety">{error}</p>}
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
