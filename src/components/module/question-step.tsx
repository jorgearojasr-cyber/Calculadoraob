"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUp, Building2, Car, Check, ExternalLink, Home, Sparkles, TreePine, Warehouse } from "lucide-react";
import type { WizardAnswers, WizardQuestion } from "./types";
import { checkRangeWarning, parseTypicalRange } from "@/lib/range-hint";
import { GasConfirmationGate } from "./gas-confirmation-gate";
import { CollapsibleHelp } from "./collapsible-help";
import { ImageOptionCard } from "./image-option-card";
import { NotSureHelper } from "./not-sure-helper";
import { PreselectedConfirmation } from "./preselected-confirmation";

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
// UX-001 (2026-08-03, revisión de BUG-004): además del texto de siempre,
// cada entrada trae una plantilla para cuando esta pregunta llega YA
// respondida por query param (ej. ?tipo=estacionamiento, ver
// `presetQuery` en ProjectTaskModule/ProjectPlanPhaseModule — hoy solo
// usado por estos mismos 2 módulos). En ese caso no tiene sentido
// mostrar "¿No sabes cuál elegir?" sugiriendo una opción DISTINTA a la
// que el usuario ya trae elegida — se reemplaza por una confirmación de
// lo detectado. `{opcion}` se reemplaza por la etiqueta real de la
// opción preseleccionada (no hardcodeada), para que seguir funcionando
// si en el futuro se linkea otro valor de `tipo=` a esta misma pregunta.
const NOT_SURE_HELPERS: Record<
  string,
  { description: string; recommendedOptionKey: string; preselectedConfirmationTemplate: string }
> = {
  "radier/uso": {
    description:
      "Para la mayoría de las casas y ampliaciones, el radier de patio o terraza es la opción más común.",
    recommendedOptionKey: "patio_terraza",
    preselectedConfirmationTemplate: "Detectamos que quieres construir este radier para: {opcion}. Puedes cambiar esta selección si lo deseas.",
  },
  "pintura/que-vas-a-pintar": {
    description: "En la mayoría de los casos, se comienza pintando los muros interiores.",
    recommendedOptionKey: "muro-interior",
    preselectedConfirmationTemplate: "Detectamos que quieres pintar: {opcion}. Puedes cambiar esta selección si lo deseas.",
  },
};

export function QuestionStep({
  question,
  initialValue,
  onAnswer,
  onSkip,
  moduleSlug,
  allQuestions,
  answers,
}: {
  question: WizardQuestion;
  initialValue: string | number | undefined;
  onAnswer: (value: string | number) => void;
  // Presente solo para preguntas NUMBER marcadas opcionales (ver
  // OPTIONAL_QUESTION_KEYS en module-wizard.tsx) — avanza sin registrar
  // respuesta, en vez de exigir un número > 0 como Siguiente.
  onSkip?: () => void;
  moduleSlug?: string;
  // Todas las preguntas del módulo + respuestas dadas hasta ahora — solo
  // se usan para armar el banner "Te recomendamos X" de una pregunta
  // NUMBER con defaultSource LOOKUP (ver más abajo). Opcionales porque la
  // mayoría de las preguntas no las necesita.
  allQuestions?: WizardQuestion[];
  answers?: WizardAnswers;
}) {
  const [textValue, setTextValue] = useState(
    initialValue !== undefined ? String(initialValue) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const isNumber = question.type === "NUMBER";

  // Recomendación editable (ver conversación 2026-07-30, caso Radier/
  // espesor): si esta pregunta NUMBER tiene un valor sugerido según otra
  // respuesta ya dada (defaultSource LOOKUP), arma "Te recomendamos X cm
  // para [opción elegida]" en vez de mostrar un campo en blanco sin
  // contexto. Genérico para cualquier módulo que use el mismo patrón, no
  // solo Radier. Se calcula una sola vez al valor sugerido original —no
  // cambia si el usuario edita el campo después.
  const recommendation = useMemo(() => {
    if (!isNumber || question.defaultSource?.type !== "LOOKUP" || !allQuestions || !answers) return null;
    const { questionKey, table } = question.defaultSource;
    const dependencyAnswer = answers[questionKey];
    if (dependencyAnswer === undefined) return null;
    const suggestedValue = table[String(dependencyAnswer)];
    if (suggestedValue === undefined) return null;
    const dependencyQuestion = allQuestions.find((q) => q.key === questionKey);
    const dependencyLabel =
      dependencyQuestion?.options.find((o) => o.key === dependencyAnswer)?.label ?? String(dependencyAnswer);
    return { value: suggestedValue, dependencyLabel };
  }, [isNumber, question.defaultSource, allQuestions, answers]);

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
    // UX-001: si esta pregunta ya llegó respondida (ver `initialValue`,
    // seteado en categorias/[slug]/[moduleSlug]/page.tsx desde ?tipo= u
    // otro query param) y coincide con una opción real, mostramos la
    // confirmación de detección en vez de "¿No sabes cuál elegir?".
    const preselectedOption =
      initialValue !== undefined ? question.options.find((o) => o.key === initialValue) : undefined;

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
          // El wizard usa un contenedor angosto (max-w-2xl, pensado para 1
          // columna) en pasos sin diagrama/resumen — 3+ columnas ahí
          // dejaba cada tarjeta demasiado angosta para foto 16:9 + label
          // (bug real: el radio tapaba texto envuelto a 3 líneas,
          // verificado visualmente con las 4 opciones reales de Radier).
          // 2 columnas es lo que entra cómodo a ese ancho.
          <div className="grid gap-3 mt-6 sm:grid-cols-2">
            {question.options.map((option) => (
              <ImageOptionCard
                key={option.key}
                option={option}
                icon={moduleSlug ? OPTION_ICONS[`${moduleSlug}/${question.key}/${option.key}`] : undefined}
                selected={initialValue === option.key}
                onSelect={() => onAnswer(option.key)}
                forceCover={question.options.length <= 2}
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
                  aria-pressed={selected}
                  className={`flex items-center justify-between text-left rounded-xl px-5 py-4 border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${
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
        {hasImageOptions && notSureHelper && preselectedOption && (
          <PreselectedConfirmation
            text={notSureHelper.preselectedConfirmationTemplate.replace("{opcion}", preselectedOption.label)}
          />
        )}
        {hasImageOptions && notSureHelper && !preselectedOption && (
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
      {recommendation && (
        <div className="mt-3 flex items-start gap-2 rounded-xl px-4 py-3 bg-safety-tint border border-safety/30">
          <Sparkles className="w-4 h-4 text-safety flex-shrink-0 mt-0.5" />
          <p className="text-sm text-ink-muted">
            Te recomendamos <span className="font-semibold text-ink">{recommendation.value} {question.unit}</span>{" "}
            para <span className="font-semibold text-ink">{recommendation.dependencyLabel}</span> — puedes
            ajustarlo si tienes otra especificación.
          </p>
        </div>
      )}
      <div className="mt-6 flex items-center gap-3 rounded-2xl px-5 py-4 bg-white border-[1.5px] border-ink focus-within:ring-2 focus-within:ring-action/70 focus-within:ring-offset-1">
        <input
          type="text"
          inputMode={isNumber ? "decimal" : "text"}
          autoFocus
          aria-label={question.label}
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
