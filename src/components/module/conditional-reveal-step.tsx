"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { WizardQuestion } from "./types";
import { checkRangeWarning, parseTypicalRange } from "@/lib/range-hint";
import { SelectableCard } from "@/components/ui/selectable-card";

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

  const typicalRange = useMemo(
    () => parseTypicalRange(numberQuestion.helpText, numberQuestion.key),
    [numberQuestion.helpText, numberQuestion.key]
  );
  const rangeWarning = useMemo(() => {
    if (!typicalRange) return null;
    const num = Number(numberValue.replace(",", "."));
    if (!numberValue || !Number.isFinite(num) || num <= 0) return null;
    return checkRangeWarning(num, typicalRange);
  }, [typicalRange, numberValue]);

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
      <h2 className="font-display text-[19px] font-extrabold text-ds-navy-900 tracking-tight mb-2">
        {selectQuestion.label}
      </h2>
      {selectQuestion.helpText && <p className="font-body text-sm text-ds-text-secondary mb-6">{selectQuestion.helpText}</p>}

      <div className="grid gap-3 mt-6">
        {selectQuestion.options.map((option) => (
          <SelectableCard
            key={option.key}
            label={option.label}
            selected={selected === option.key}
            onSelect={() => handleSelect(option.key)}
          />
        ))}
      </div>

      {isRevealed && (
        <div className="mt-6">
          <h3 className="font-display text-xl font-extrabold text-ds-navy-900 tracking-tight mb-2">{numberQuestion.label}</h3>
          {numberQuestion.helpText && (
            <p className="font-body text-sm text-ds-text-secondary mb-3">{numberQuestion.helpText}</p>
          )}
          <div className="flex items-center gap-3 rounded-ds-input px-5 py-4 bg-white border-[1.5px] border-ds-border focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={numberValue}
              onChange={(e) => setNumberValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitNumber()}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className="w-full bg-transparent outline-none text-2xl font-display text-ds-navy-900 placeholder:text-ds-text-tertiary"
            />
            {numberQuestion.unit && <span className="font-body text-sm font-semibold text-ds-text-secondary">{numberQuestion.unit}</span>}
          </div>
          {error && <p className="mt-2 font-body text-sm text-danger">{error}</p>}
          {!error && rangeWarning && <p className="mt-2 font-body text-sm text-amber-600">{rangeWarning}</p>}
          <button
            onClick={handleSubmitNumber}
            className="mt-6 rounded-xl px-6 font-body text-[15px] font-bold text-white flex items-center gap-2 bg-ds-orange-600 hover:bg-ds-orange-700 active:scale-[0.98] transition-all"
            style={{ height: 48 }}
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
