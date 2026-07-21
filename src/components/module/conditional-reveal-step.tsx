"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { WizardQuestion } from "./types";

// Combina una pregunta SELECT con una pregunta NUMBER que solo se revela
// (dentro del mismo paso) si se elige la segunda opción del SELECT — ej.
// "¿Sabes el dato exacto?" -> "No lo sé" (avanza directo) / "Sí, lo tengo"
// (revela el campo numérico).
export function ConditionalRevealStep({
  selectQuestion,
  numberQuestion,
  initialValues,
  onAnswer,
}: {
  selectQuestion: WizardQuestion;
  numberQuestion: WizardQuestion;
  initialValues: Record<string, string | number | undefined>;
  onAnswer: (values: Record<string, string | number>) => void;
}) {
  const [selected, setSelected] = useState<string | undefined>(
    initialValues[selectQuestion.key] as string | undefined
  );
  const [numberValue, setNumberValue] = useState(
    initialValues[numberQuestion.key] !== undefined ? String(initialValues[numberQuestion.key]) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const revealOptionKey = selectQuestion.options[1]?.key;
  const isRevealed = selected === revealOptionKey;

  const handleSelect = (key: string) => {
    setSelected(key);
    setError(null);
    if (key !== revealOptionKey) {
      onAnswer({ [selectQuestion.key]: key });
    }
  };

  const handleSubmitNumber = () => {
    const num = Number(numberValue.replace(",", "."));
    if (!numberValue || !Number.isFinite(num) || num <= 0) {
      setError("Ingresa un número mayor que 0.");
      return;
    }
    setError(null);
    onAnswer({ [selectQuestion.key]: selected!, [numberQuestion.key]: num });
  };

  return (
    <div>
      <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-2">
        {selectQuestion.label}
      </h2>
      {selectQuestion.helpText && <p className="text-sm text-ink-muted mb-6">{selectQuestion.helpText}</p>}

      <div className="grid gap-3 mt-6">
        {selectQuestion.options.map((option) => {
          const isSelected = selected === option.key;
          return (
            <button
              key={option.key}
              onClick={() => handleSelect(option.key)}
              className={`flex items-center justify-between text-left rounded-xl px-5 py-4 border transition-colors ${
                isSelected ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
              }`}
            >
              <span className="font-medium text-[15px]">{option.label}</span>
              {isSelected ? (
                <Check className="w-4 h-4 text-safety" />
              ) : (
                <ArrowRight className="w-4 h-4 text-ink-faint" />
              )}
            </button>
          );
        })}
      </div>

      {isRevealed && (
        <div className="mt-6">
          <h3 className="font-display text-xl font-semibold tracking-tight mb-2">{numberQuestion.label}</h3>
          {numberQuestion.helpText && (
            <p className="text-sm text-ink-muted mb-3">{numberQuestion.helpText}</p>
          )}
          <div className="flex items-center gap-3 rounded-2xl px-5 py-4 bg-white border-[1.5px] border-ink">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={numberValue}
              onChange={(e) => setNumberValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitNumber()}
              placeholder="0"
              className="w-full bg-transparent outline-none text-2xl font-display placeholder:text-ink-faint"
            />
            {numberQuestion.unit && <span className="font-mono text-sm text-ink-muted">{numberQuestion.unit}</span>}
          </div>
          {error && <p className="mt-2 text-sm text-safety">{error}</p>}
          <button
            onClick={handleSubmitNumber}
            className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-ink"
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
