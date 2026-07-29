"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { WizardQuestion } from "./types";
import { checkRangeWarning, parseTypicalRange } from "@/lib/range-hint";
import { EquipmentChecklistStep } from "./equipment-checklist-step";
import { GasConfirmationGate } from "./gas-confirmation-gate";
import { CollapsibleHelp } from "./collapsible-help";

// Caso especial: en vez de pedir el Watt total como número directo, se
// reemplaza por una lista de equipos comunes preseleccionables (ver
// equipment-checklist-step.tsx) — el tipo de la pregunta en la base sigue
// siendo NUMBER, solo cambia cómo se ingresa el valor.
const EQUIPMENT_CHECKLIST_KEY = "suma-la-potencia-total-de-los-equipos-que-iran-conectados-watts";

// Nivel 4 de disclaimer (dirección visual 2026-07-28): SOLO estos 2
// módulos de Gas, que ya tenían checkbox de confirmación SEC obligatorio
// antes de ver el resultado — no generalizar a otros módulos con
// reinforcedWarning:true.
const GAS_LEVEL4_MODULE_SLUGS = new Set(["caneria-de-gas-visible", "instalar-un-calefon-a-gas"]);

export function QuestionStep({
  question,
  initialValue,
  onAnswer,
  moduleSlug,
}: {
  question: WizardQuestion;
  initialValue: string | number | undefined;
  onAnswer: (value: string | number) => void;
  moduleSlug?: string;
}) {
  const [textValue, setTextValue] = useState(
    initialValue !== undefined ? String(initialValue) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const isNumber = question.type === "NUMBER";

  const typicalRange = useMemo(
    () => (isNumber ? parseTypicalRange(question.helpText, question.key) : null),
    [isNumber, question.helpText, question.key]
  );
  const rangeWarning = useMemo(() => {
    if (!typicalRange) return null;
    const num = Number(textValue.replace(",", "."));
    if (!textValue || !Number.isFinite(num) || num <= 0) return null;
    return checkRangeWarning(num, typicalRange);
  }, [typicalRange, textValue]);

  if (question.key === EQUIPMENT_CHECKLIST_KEY) {
    return <EquipmentChecklistStep question={question} initialValue={initialValue} onAnswer={onAnswer} />;
  }

  if (question.type === "SELECT" && question.options.length === 1) {
    const option = question.options[0];
    const checked = initialValue === option.key;
    const isGasLevel4 = !!moduleSlug && GAS_LEVEL4_MODULE_SLUGS.has(moduleSlug);
    return (
      <div>
        {isGasLevel4 && <GasConfirmationGate />}
        <h2 className="font-display text-[19px] font-semibold tracking-tight mb-2">
          {question.label}
        </h2>
        {question.helpText && <p className="text-sm text-ink-muted mb-6">{question.helpText}</p>}
        <label className="mt-6 flex items-start gap-3 rounded-xl px-5 py-4 border border-border bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onAnswer(e.target.checked ? option.key : "")}
            className="mt-1 w-4 h-4 flex-shrink-0"
          />
          <span className="text-[15px] leading-snug">{option.label}</span>
        </label>
        <button
          onClick={() => onAnswer(option.key)}
          disabled={!checked}
          className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-action disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Ver resultado
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (question.type === "SELECT") {
    return (
      <div>
        <h2 className="font-display text-[19px] font-semibold tracking-tight mb-2">
          {question.label}
        </h2>
        {question.helpText && (
          <div className="mb-6">
            <CollapsibleHelp label="Cómo elegir" ariaLabel="Más detalle para elegir esta opción">
              <p className="text-sm text-ink-muted">{question.helpText}</p>
            </CollapsibleHelp>
          </div>
        )}
        <div className="grid gap-3 mt-6">
          {question.options.map((option) => {
            const selected = initialValue === option.key;
            return (
              <button
                key={option.key}
                onClick={() => onAnswer(option.key)}
                className={`flex items-center justify-between text-left rounded-xl px-5 py-4 border transition-colors ${
                  selected
                    ? "border-safety bg-safety-tint"
                    : "border-border bg-white hover:border-ink"
                }`}
              >
                <span className="font-medium text-[15px]">{option.label}</span>
                {selected ? (
                  <Check className="w-4 h-4 text-safety" />
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
      <h2 className="font-display text-[19px] font-semibold tracking-tight mb-2">
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
      {!error && rangeWarning && <p className="mt-2 text-sm text-amber-600">{rangeWarning}</p>}
      <button
        onClick={handleSubmit}
        className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-action"
      >
        Siguiente
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
