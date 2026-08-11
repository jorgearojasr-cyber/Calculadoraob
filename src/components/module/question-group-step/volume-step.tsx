"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import type { WizardQuestion } from "../types";
import { formatQuantity } from "@/lib/format-number";
import { DiagramV2 } from "@/lib/diagram-v2";
import type { DiagramConfig } from "../module-visual-config";
import { FieldRow } from "./field-row";
import { SubmitActions } from "./submit-actions";
import { capitalize } from "../dimension-utils/formatting";
import { toFieldNum } from "../dimension-utils/parsing";
import { useVolumePreview, type VolumeField } from "./hooks/useVolumePreview";

// Mismo motivo que FieldRow: nivel superior para no recrear el tipo de
// componente en cada render de VolumeStep.
function Tip({ text, className = "" }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 bg-concrete ${className}`}>
      <Lightbulb className="w-4 h-4 text-ink-muted flex-shrink-0 mt-0.5" />
      <p className="text-sm text-ink-muted">{text}</p>
    </div>
  );
}

// Paso de VOLUMEN (diagrama caja/cilindro con profundidad) — ver
// conversación 2026-07-30. Mismo patrón de campo en mobile y desktop
// (ícono de eje + label + sublabel, input a la derecha); en desktop el
// diagrama va en su propia columna con subtítulo + tip debajo. Volumen en
// vivo = largo×ancho×profundidad (caja) o π×(diámetro/2)²×profundidad
// (cilindro) — solo una vista previa mientras el usuario escribe, el
// cálculo real (con pérdidas, esponjamiento, etc.) lo hace el resultado
// final del wizard como siempre.
export function VolumeStep({
  questions,
  diagram,
  values,
  setValue,
  error,
  rangeWarnings,
  handleSubmit,
  onSaveForLater,
  focusFieldKey,
}: {
  questions: WizardQuestion[];
  diagram: DiagramConfig;
  values: Record<string, string>;
  setValue: (key: string, value: string) => void;
  error: string | null;
  rangeWarnings: Record<string, string | null>;
  handleSubmit: () => void;
  onSaveForLater?: () => void;
  // BUG-003: ver QuestionGroupStep — campo puntual a autoenfocar en vez del
  // primero por defecto, cuando se llegó acá vía "Cambiar".
  focusFieldKey?: string | null;
}) {
  // QuestionOption.numericValue siempre se guarda en METROS (convención,
  // ver comentario en el schema) para que sea consistente con el resto de
  // los campos al calcular volumen/superficie. Pero para MOSTRAR el
  // espesor en el diagrama, estas opciones son convencionalmente "10cm"/
  // "15cm"/"20cm" — mostrar "0,10 m" ahí se sentiría desconectado de lo
  // que el usuario eligió. Si el campo de profundidad es un SELECT, se
  // muestra en cm (numericValue × 100) en vez del valor crudo en metros.
  const depthIsSelect = questions[diagram.secondaryLabel ? 2 : 1]?.type === "SELECT";
  const toDiagramDepth = (question: WizardQuestion, raw: string | undefined) => {
    const meters = toFieldNum(question, raw);
    if (meters === null) return undefined;
    return depthIsSelect ? meters * 100 : meters;
  };
  const diagramDepthUnit = depthIsSelect ? "cm" : undefined;

  const isCircular = diagram.shape === "circle-with-depth";
  const secondaryQuestion = diagram.secondaryLabel ? questions[1] : undefined;
  const depthQuestion = questions[diagram.secondaryLabel ? 2 : 1];

  // dimField vincula cada input con el campo de DiagramV2 que resalta en
  // naranjo mientras se escribe (ver `activeField`, spec aprobada) — no
  // es lo mismo que `label` (texto real, ej. "diámetro"), es el slot fijo
  // que espera la API ("largo"/"ancho"/"profundidad"/"diametro").
  const fields: VolumeField[] = [
    { question: questions[0], label: diagram.primaryLabel, subLabel: diagram.primarySubLabel, axis: "h", dimField: isCircular ? "diametro" : "largo" },
    ...(secondaryQuestion
      ? [{ question: secondaryQuestion, label: diagram.secondaryLabel!, subLabel: diagram.secondarySubLabel, axis: "h" as const, dimField: "ancho" as const }]
      : []),
    { question: depthQuestion, label: diagram.depthLabel!, subLabel: diagram.depthSubLabel, axis: "v", dimField: "profundidad" },
  ];

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeField = fields.find((f) => f.question.key === activeKey)?.dimField;

  const { volume, area, formulaText } = useVolumePreview({
    fields,
    values,
    isCircular,
    showArea: diagram.showArea,
  });

  // Un tip POR CAMPO (Fase 1, sprint UX V1.2, 04-ago-2026) — antes se
  // mostraba solo el primer helpText no nulo de todo el grupo, así que un
  // campo con su propio helpText (ej. espesor) quedaba tapado si otro
  // campo del mismo grupo (largo/ancho) ya tenía uno. Se dedupea por texto
  // (no por campo) porque largo/ancho comparten literalmente el mismo
  // helpText de rango — mostrarlo dos veces sería ruido, no información
  // nueva. Patrón pensado para ser reutilizable por cualquier módulo
  // futuro con VolumeStep (Losa, Muro, Fundación, Piscinas), sin tocar
  // nada específico de Radier en este componente.
  const tips = Array.from(new Set(fields.map((f) => f.question.helpText).filter((t): t is string => Boolean(t))));

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8 grid md:grid-cols-[1fr_1.15fr] md:gap-10 md:items-start">
      <div className="order-1">
        {diagram.groupLabel && (
          <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight mb-2">{diagram.groupLabel}</h2>
        )}
        {diagram.groupHelpText && <p className="text-sm text-ink-muted mb-5">{diagram.groupHelpText}</p>}

        <div className="grid gap-4">
          {fields.map((f, i) => (
            <FieldRow
              key={f.question.id}
              icon={f.axis === "h" ? "horizontal" : "vertical"}
              label={capitalize(f.label)}
              subLabel={f.subLabel}
              value={values[f.question.key]}
              unit={f.question.unit}
              autoFocus={focusFieldKey ? f.question.key === focusFieldKey : i === 0}
              onChange={(v) => setValue(f.question.key, v)}
              onEnter={handleSubmit}
              onFocus={() => setActiveKey(f.question.key)}
              onBlur={() => setActiveKey((prev) => (prev === f.question.key ? null : prev))}
              rangeWarning={rangeWarnings[f.question.key]}
              selectOptions={
                f.question.type === "SELECT"
                  ? f.question.options.map((o) => ({ key: o.key, label: o.label }))
                  : undefined
              }
            />
          ))}
        </div>

        <div className={`mt-4 rounded-2xl bg-concrete px-5 py-4 ${area !== null ? "grid grid-cols-2 gap-4" : ""}`}>
          {area !== null && (
            <div>
              <p className="text-sm text-ink-muted">{diagram.areaResultLabel ?? "Superficie"}</p>
              <p className="font-display text-2xl font-semibold text-ink">{formatQuantity(area)} m²</p>
            </div>
          )}
          <div>
            <p className="text-sm text-ink-muted">{diagram.volumeResultLabel ?? "Volumen"}</p>
            <p className="font-display text-2xl font-semibold text-ink">
              {volume !== null ? `${formatQuantity(volume)} m³` : "—"}
            </p>
          </div>
          {formulaText && <p className="col-span-2 mt-1 text-xs text-ink-muted">{formulaText}</p>}
        </div>

        {tips.length > 0 && (
          <div className="mt-4 md:hidden grid gap-2">
            {tips.map((t) => (
              <Tip key={t} text={t} />
            ))}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-safety">{error}</p>}

        <SubmitActions onSubmit={handleSubmit} onSaveForLater={onSaveForLater} />
      </div>

      <div className="order-2 mb-6 md:mb-0 rounded-2xl bg-[#F3F7FB] p-5 md:p-6">
        <div className="hidden md:block mb-4">
          <p className="font-semibold text-sm">Así se ve con tus medidas</p>
          <p className="text-sm text-ink-muted mt-1">
            Mismo diagrama y mismos valores: el {isCircular ? "diámetro" : "ancho"} extra va al dibujo, no a agrandar
            el texto.
          </p>
        </div>
        {isCircular ? (
          <DiagramV2
            kind="cylinder"
            diametro={toFieldNum(questions[0], values[questions[0].key]) ?? undefined}
            profundidad={toDiagramDepth(depthQuestion, values[depthQuestion.key])}
            labels={{
              diametro: capitalize(diagram.primaryLabel),
              profundidad: capitalize(diagram.depthLabel!),
            }}
            unit={questions[0].unit ?? "m"}
            units={{ diametro: questions[0].unit ?? undefined, profundidad: diagramDepthUnit ?? depthQuestion.unit ?? undefined }}
            activeField={activeField}
            waterFill={diagram.waterFill}
          />
        ) : (
          <DiagramV2
            kind="box"
            largo={toFieldNum(questions[0], values[questions[0].key]) ?? undefined}
            ancho={secondaryQuestion ? (toFieldNum(secondaryQuestion, values[secondaryQuestion.key]) ?? undefined) : undefined}
            profundidad={toDiagramDepth(depthQuestion, values[depthQuestion.key])}
            labels={{
              largo: capitalize(diagram.primaryLabel),
              ancho: diagram.secondaryLabel ? capitalize(diagram.secondaryLabel) : undefined,
              profundidad: capitalize(diagram.depthLabel!),
            }}
            unit={questions[0].unit ?? "m"}
            units={{
              largo: questions[0].unit ?? undefined,
              ancho: secondaryQuestion?.unit ?? undefined,
              profundidad: diagramDepthUnit ?? depthQuestion.unit ?? undefined,
            }}
            activeField={activeField}
            waterFill={diagram.waterFill}
          />
        )}
        {tips.length > 0 && (
          <div className="hidden md:block mt-4 grid gap-2">
            {tips.map((t) => (
              <Tip key={t} text={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
