"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUp, Building2, Car, ExternalLink, Home, Sparkles, TreePine, Warehouse } from "lucide-react";
import type { WizardAnswers, WizardQuestion } from "./types";
import { checkRangeWarning, parseTypicalRange } from "@/lib/range-hint";
import { GasConfirmationGate } from "./gas-confirmation-gate";
import { CollapsibleHelp } from "./collapsible-help";
import { ImageOptionCard } from "./image-option-card";
import { NotSureHelper } from "./not-sure-helper";
import { PreselectedConfirmation } from "./preselected-confirmation";
import { SelectableCard } from "@/components/ui/selectable-card";

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
        <h2 className="font-display text-[19px] font-extrabold text-ds-navy-900 tracking-tight mb-2">
          {question.label}
        </h2>
        {question.helpText && <p className="font-body text-sm text-ds-text-secondary mb-6">{question.helpText}</p>}
        <label className="mt-6 flex items-start gap-3 rounded-ds-card px-5 py-4 border-[1.5px] border-ds-border bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onAnswer(e.target.checked ? option.key : "")}
            className="mt-1 w-4 h-4 flex-shrink-0 accent-ds-orange-600"
          />
          <span className="font-body text-[15px] leading-snug text-ds-navy-900">{option.label}</span>
        </label>
        <button
          onClick={() => onAnswer(option.key)}
          disabled={!checked}
          className="mt-6 rounded-xl px-6 font-body text-[15px] font-bold text-white flex items-center gap-2 bg-ds-orange-600 hover:bg-ds-orange-700 active:scale-[0.98] transition-all disabled:bg-ds-muted disabled:text-ds-text-tertiary disabled:cursor-not-allowed"
          style={{ height: 48 }}
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
        <h2 className="font-display text-[19px] font-extrabold text-ds-navy-900 tracking-tight mb-2">
          {question.label}
        </h2>
        {question.helpText && (
          <div className="mb-6">
            <CollapsibleHelp label="Cómo elegir" ariaLabel="Más detalle para elegir esta opción">
              <p className="font-body text-sm text-ds-text-secondary">{question.helpText}</p>
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
            {question.options.map((option) => (
              <SelectableCard
                key={option.key}
                label={option.label}
                selected={initialValue === option.key}
                onSelect={() => onAnswer(option.key)}
              />
            ))}
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
      <h2 className="font-display text-[19px] font-extrabold text-ds-navy-900 tracking-tight mb-2">
        {question.label}
      </h2>
      {question.helpText && <p className="font-body text-sm text-ds-text-secondary mb-6">{question.helpText}</p>}
      {recommendation && (
        <div className="mt-3 flex items-start gap-2 rounded-xl px-4 py-3 bg-ds-orange-100/50 border border-ds-orange-600/30">
          <Sparkles className="w-[18px] h-[18px] text-ds-orange-600 flex-shrink-0 mt-0.5" />
          <p className="font-body text-[13px] text-ds-text-secondary">
            Te recomendamos <span className="font-bold text-ds-navy-900">{recommendation.value} {question.unit}</span>{" "}
            para <span className="font-bold text-ds-navy-900">{recommendation.dependencyLabel}</span> — puedes
            ajustarlo si tienes otra especificación.
          </p>
        </div>
      )}
      {/* Design Spec v1.0, Parte 3, punto 9-10: radio ds-input (10px),
          borde ds-border, focus orange-600 + halo orange-100, unidad
          visible junto al input sin confundirse con placeholder. Parsing/
          validación/onChange intactos. */}
      <div className="mt-6 flex items-center gap-3 rounded-ds-input px-5 py-4 bg-white border-[1.5px] border-ds-border focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all">
        <input
          type="text"
          inputMode={isNumber ? "decimal" : "text"}
          autoFocus
          aria-label={question.label}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          onFocus={(e) => isNumber && e.target.select()}
          placeholder={isNumber ? "0" : ""}
          className="w-full bg-transparent outline-none text-2xl font-display text-ds-navy-900 placeholder:text-ds-text-tertiary"
        />
        {question.unit && <span className="font-body text-sm font-semibold text-ds-text-secondary">{question.unit}</span>}
      </div>
      {question.key === CNE_PRICE_QUESTION_KEY && (
        <a
          href={CNE_TARIFF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-body text-sm font-medium text-ds-orange-600 hover:underline"
        >
          Consulta el proceso tarifario vigente en la CNE
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
      {error && <p className="mt-2 font-body text-sm text-danger">{error}</p>}
      {!error && rangeWarning && <p className="mt-2 font-body text-sm text-amber-600">{rangeWarning}</p>}
      <div className="mt-6 flex items-center gap-4">
        {/* Design Spec v1.0, punto 13: PrimaryButton — 48px alto, radio
            12px, 15/700, orange-600 → orange-700 hover, active scale .98. */}
        <button
          onClick={handleSubmit}
          className="rounded-xl px-6 font-body text-[15px] font-bold text-white flex items-center gap-2 bg-ds-orange-600 hover:bg-ds-orange-700 active:scale-[0.98] transition-all"
          style={{ height: 48 }}
        >
          Siguiente
          <ArrowRight className="w-4 h-4" />
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="font-body text-sm font-semibold text-ds-text-secondary hover:text-ds-navy-900 underline underline-offset-4"
          >
            Omitir
          </button>
        )}
      </div>
    </div>
  );
}
