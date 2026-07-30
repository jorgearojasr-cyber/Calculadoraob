"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUp, Building2, Car, Check, ExternalLink, Home, TreePine, Warehouse } from "lucide-react";
import type { WizardQuestion } from "./types";
import { checkRangeWarning, parseTypicalRange } from "@/lib/range-hint";
import { GasConfirmationGate } from "./gas-confirmation-gate";
import { CollapsibleHelp } from "./collapsible-help";
import { ImageOptionCard } from "./image-option-card";
import { NotSureHelper } from "./not-sure-helper";

// Consumo eléctrico: link clickeable a la tarifa oficial de la CNE, debajo
// del campo de precio del kWh — el valor exacto depende de la distribuidora
// y comuna de cada usuario, esto solo ayuda a ubicar la fuente oficial.
const CNE_PRICE_QUESTION_KEY = "precio-kwh";
const CNE_TARIFF_URL = "https://www.cne.cl/tarificacion/electrica/";

// Nivel 4 de disclaimer (dirección visual 2026-07-28): SOLO estos 2
// módulos de Gas, que ya tenían checkbox de confirmación SEC obligatorio
// antes de ver el resultado — no generalizar a otros módulos con
// reinforcedWarning:true.
const GAS_LEVEL4_MODULE_SLUGS = new Set(["caneria-de-gas-visible", "instalar-un-calefon-a-gas"]);

// Íconos decorativos para la variante ImageOptionCard, keyed por
// "moduleSlug/questionKey/optionKey" — no es dato de usuario, solo
// estética, así que vive acá en vez de en la base de datos (mismo criterio
// que DIMENSION_DIAGRAMS en question-group-step.tsx). Una opción sin
// entrada acá simplemente no muestra ícono.
const OPTION_ICONS: Record<string, ReactNode> = {
  "radier/uso/patio_terraza": <TreePine className="w-4 h-4 text-ink-muted flex-shrink-0" />,
  "radier/uso/antepiso_interior": <Home className="w-4 h-4 text-ink-muted flex-shrink-0" />,
  "radier/uso/estacionamiento": <Car className="w-4 h-4 text-ink-muted flex-shrink-0" />,
  "radier/uso/bodega_industrial": <Warehouse className="w-4 h-4 text-ink-muted flex-shrink-0" />,
  "pintura/que-vas-a-pintar/muro-interior": <Home className="w-4 h-4 text-ink-muted flex-shrink-0" />,
  "pintura/que-vas-a-pintar/muro-exterior": <Building2 className="w-4 h-4 text-ink-muted flex-shrink-0" />,
  "pintura/que-vas-a-pintar/cielo": <ArrowUp className="w-4 h-4 text-ink-muted flex-shrink-0" />,
};

// Caja "¿No sabes cuál elegir?" opcional debajo de una pregunta con
// ImageOptionCard, keyed por "moduleSlug/questionKey" — mismo criterio que
// OPTION_ICONS: contenido editorial fijo, no vale la pena una columna en
// la base de datos todavía para una sola pregunta.
const NOT_SURE_HELPERS: Record<
  string,
  { description: string; recommendedOptionKey: string }
> = {
  "radier/uso": {
    description:
      "Para la mayoría de las casas y ampliaciones, el radier de patio o terraza es la opción más común.",
    recommendedOptionKey: "patio_terraza",
  },
  "pintura/que-vas-a-pintar": {
    description: "En la mayoría de los casos, se comienza pintando los muros interiores.",
    recommendedOptionKey: "muro-interior",
  },
};

export function QuestionStep({
  question,
  initialValue,
  onAnswer,
  onSkip,
  moduleSlug,
}: {
  question: WizardQuestion;
  initialValue: string | number | undefined;
  onAnswer: (value: string | number) => void;
  // Presente solo para preguntas NUMBER marcadas opcionales (ver
  // OPTIONAL_QUESTION_KEYS en module-wizard.tsx) — avanza sin registrar
  // respuesta, en vez de exigir un número > 0 como Siguiente.
  onSkip?: () => void;
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
    // Variante visual con foto: opt-in automático cuando TODAS las opciones
    // traen imageUrl (cargado por script, ver ImageOptionCard) — no hace
    // falta ningún flag adicional en la pregunta.
    const hasImageOptions =
      question.options.length > 0 && question.options.every((o) => o.imageUrl);
    const notSureKey = moduleSlug ? `${moduleSlug}/${question.key}` : null;
    const notSureHelper = notSureKey ? NOT_SURE_HELPERS[notSureKey] : undefined;

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
        {hasImageOptions ? (
          <div className="grid gap-3 mt-6">
            {question.options.map((option) => (
              <ImageOptionCard
                key={option.key}
                option={option}
                icon={moduleSlug ? OPTION_ICONS[`${moduleSlug}/${question.key}/${option.key}`] : undefined}
                selected={initialValue === option.key}
                onSelect={() => onAnswer(option.key)}
              />
            ))}
          </div>
        ) : (
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
        )}
        {hasImageOptions && notSureHelper && (
          <NotSureHelper
            description={notSureHelper.description}
            recommendedLabel={
              question.options.find((o) => o.key === notSureHelper.recommendedOptionKey)?.label ??
              notSureHelper.recommendedOptionKey
            }
            onSelectRecommended={() => onAnswer(notSureHelper.recommendedOptionKey)}
          />
        )}
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
      {question.key === CNE_PRICE_QUESTION_KEY && (
        <a
          href={CNE_TARIFF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-safety hover:underline"
        >
          Consulta el proceso tarifario vigente en la CNE
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
      {error && <p className="mt-2 text-sm text-safety">{error}</p>}
      {!error && rangeWarning && <p className="mt-2 text-sm text-amber-600">{rangeWarning}</p>}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSubmit}
          className="rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-action"
        >
          Siguiente
          <ArrowRight className="w-4 h-4" />
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-sm font-medium text-ink-muted hover:text-ink underline underline-offset-4"
          >
            Omitir
          </button>
        )}
      </div>
    </div>
  );
}
