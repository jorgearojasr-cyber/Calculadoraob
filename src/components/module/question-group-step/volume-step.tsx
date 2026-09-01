"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import type { WizardQuestion } from "../types";
import { formatQuantity } from "@/lib/format-number";
import { DiagramV2 } from "@/lib/diagram-v2";
import { RadierIllustration } from "../radier-illustration";
import { CollapsibleHelp } from "../collapsible-help";
import { PoolExcavationIllustration } from "../pool-excavation-illustration";
import { PoolStructureIllustration } from "../pool-structure-illustration";
import { PoolConfiguratorIllustration } from "../pool-configurator-illustration";
import { PoolConfiguratorLayout } from "../pool-configurator-layout";
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
  structureDims,
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
  // Piscina Paso 2 (espesores) — SOLO presente cuando `diagram.shape` es
  // "pool-structure-*" (ver module-visual-config.ts,
  // `sourceDimensionKeys`): largo/ancho/profundidad o diámetro/profundidad
  // ya respondidos en el Paso 1 (stepGroup ANTERIOR), resueltos por
  // QuestionGroupStep desde `initialValues` — nunca se duplica la
  // pregunta ni se crea estado nuevo acá.
  structureDims?: { primary: number | null; secondary: number | null; depth: number | null };
}) {
  // QuestionOption.numericValue siempre se guarda en METROS (convención,
  // ver comentario en el schema) para que sea consistente con el resto de
  // los campos al calcular volumen/superficie. Pero para MOSTRAR el
  // espesor en el diagrama, estas opciones son convencionalmente "10cm"/
  // "15cm"/"20cm" — mostrar "0,10 m" ahí se sentiría desconectado de lo
  // que el usuario eligió. Si el campo de profundidad es un SELECT, se
  // muestra en cm (numericValue × 100) en vez del valor crudo en metros.
  const depthIsSelect = questions[diagram.secondaryLabel ? 2 : 1]?.type === "SELECT";
  // BUG (hallado en Fase 2, Radier): DiagramV2 NO normaliza unidades entre
  // ejes — espera que largo/ancho/profundidad lleguen ya en la MISMA
  // escala numérica (ver `D = profundidad ?? 1.2` en DiagramV2.tsx, usado
  // directo como geometría). Para un campo de profundidad tipo NUMBER
  // medido en cm (hoy, único caso: Radier "espesor_cm" — largo/ancho de
  // Radier son NUMBER en metros), el valor tipeado (ej. "8") se pasaba
  // crudo, como si fueran 8 METROS de espesor en vez de 0,08 — el espesor
  // terminaba dibujándose más grande que el largo/ancho. Se agrega esta
  // conversión igual que ya existía para el caso SELECT (numericValue en
  // metros × 100 para mostrar cm) — acá es al revés: NUMBER en cm ÷ 100
  // para la geometría en metros. Verificado que ningún otro módulo con
  // diagrama profundidad tiene esta combinación (NUMBER + unit "cm" en el
  // campo de profundidad): los demás son SELECT (Muro, Losa) o NUMBER en
  // metros (Piscina circular, Excavación circular, Jardinera, Cadena/Viga
  // vía su campo "largo") — cambio sin impacto fuera de Radier.
  const depthUnitIsCm = !depthIsSelect && questions[diagram.secondaryLabel ? 2 : 1]?.unit === "cm";
  const toDiagramDepth = (question: WizardQuestion, raw: string | undefined) => {
    const raw_ = toFieldNum(question, raw);
    if (raw_ === null) return undefined;
    if (depthIsSelect) return raw_ * 100; // metros -> cm (mostrar)
    if (depthUnitIsCm) return raw_ / 100; // cm tipeado -> metros (geometría)
    return raw_;
  };
  const diagramDepthUnit = depthIsSelect || depthUnitIsCm ? "cm" : undefined;

  const isCircular =
    diagram.shape === "circle-with-depth" ||
    diagram.shape === "pit-circle-with-depth" ||
    diagram.shape === "pool-structure-circle-with-depth" ||
    diagram.shape === "pool-integral-medidas-circ-with-depth" ||
    diagram.shape === "pool-integral-estructura-circ-with-depth";
  // Fase 5 (Radier) — "slab-with-depth" reusa TODO el resto de este
  // componente (campos, cotas, labels, toDiagramDepth) igual que
  // "rectangle-with-depth"; la única diferencia es qué `kind` recibe
  // DiagramV2 más abajo (ver ese archivo, math/scale-engine.ts
  // compressedSlabRatios y render/solid-3d.tsx SlabSolid).
  const isSlab = diagram.shape === "slab-with-depth";
  // Fase B (2026-08-31) — mismo patrón que isSlab, pero para las 2
  // ilustraciones nuevas standalone (ninguna toca DiagramV2):
  // "pit-*" = Excavación (terreno + hueco), aplicado GLOBALMENTE al
  // módulo (también se usa suelto en Herramientas avanzadas, fuera del
  // plan de Piscinas — ver module-visual-config.ts).
  // "pool-structure-*" = Piscina Paso 2 (espesores) — SOLO estos 2
  // stepGroups, exclusivos de Piscina rectangular/circular.
  const isPit = diagram.shape === "pit-with-depth" || diagram.shape === "pit-circle-with-depth";
  const isPoolStructure =
    diagram.shape === "pool-structure-with-depth" || diagram.shape === "pool-structure-circle-with-depth";
  // Fase C1 (2026-08-31) — EXCLUSIVO del Module nuevo "piscina-integral"
  // (configurador integral): mismo patrón isSlab/isPit/isPoolStructure,
  // pero con 2 estados propios ("medidas"/"estructura") dentro de UN solo
  // componente `PoolConfiguratorIllustration` — ver
  // module-visual-config.ts para el detalle de cada shape. Ningún otro
  // módulo (incluidos los standalone de Piscina) usa estos shapes.
  const isIntegralMedidas =
    diagram.shape === "pool-integral-medidas-rect-with-depth" ||
    diagram.shape === "pool-integral-medidas-circ-with-depth";
  const isIntegralEstructura =
    diagram.shape === "pool-integral-estructura-rect-with-depth" ||
    diagram.shape === "pool-integral-estructura-circ-with-depth";
  // Piscina Paso 1 (dimensiones interiores) — se identifica exclusivamente
  // por `waterFill` (ver auditoría Fase B, sección 6): confirmado que hoy
  // SOLO las 2 entradas de Piscina rectangular/circular lo activan, así
  // que es un gate seguro y ya existente (no requiere shape nuevo) para
  // mover la ilustración antes de los inputs en mobile sin tocar
  // Fundación/Pilar/Jardinera/Muro (que no lo usan). El diagrama en sí
  // sigue siendo el DiagramV2 box/cylinder de siempre, sin cambios.
  const isPoolStep1 = Boolean(diagram.waterFill);
  // Gate único de "ilustración antes de los inputs en mobile" — reemplaza
  // el antiguo `isSlab &&` puntual; cada shape nuevo llega acá por su
  // propio dato explícito, ninguno afecta a los módulos no mencionados.
  const showIllustrationFirst = isSlab || isPit || isPoolStructure || isPoolStep1 || isIntegralMedidas || isIntegralEstructura;
  // Paso 2 de espesores: 2 cifras de espesor no arman un volumen real
  // (useVolumePreview asume largo×ancho×profundidad o cilindro) — se
  // sigue calculando por debajo (sin costo funcional) pero no se muestra
  // la caja de resultado, que hoy tampoco existe en este paso (era un
  // grid plano sin preview). Igual criterio para el configurador integral
  // (Fase C1): "Medidas" y "Estructura" no muestran una caja de resultado
  // en vivo — los resultados básicos de C1 solo aparecen en el resultado
  // final del wizard.
  const showResultBox = !isPoolStructure && !isIntegralMedidas && !isIntegralEstructura;
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

  // Espesor en CM crudo (sin convertir a metros) — mismo criterio ya usado
  // por el bloque `isSlab` de más abajo para RadierIllustration: estos 2
  // campos de Piscina Paso 2 son NUMBER con unit "cm", así que
  // `toDiagramDepth` (pensado para geometría real de DiagramV2) los
  // convertiría a metros — no queremos eso, PoolStructureIllustration
  // espera el valor real en cm tal cual el usuario lo tipeó.
  const rawCm = (question: WizardQuestion, raw: string | undefined): number | null => {
    if (question.type === "SELECT") {
      const opt = question.options.find((o) => o.key === raw);
      return opt?.numericValue !== undefined && opt.numericValue !== null ? opt.numericValue * 100 : null;
    }
    return toFieldNum(question, raw);
  };

  // Ilustración compartida entre el bloque mobile (antes de los inputs) y
  // la columna desktop — un solo cálculo, sin duplicar la lógica de
  // ternarios en 2 lugares (ver `showIllustrationFirst` más arriba).
  const illustrationNode = isSlab ? (
    <RadierIllustration
      largo={toFieldNum(questions[0], values[questions[0].key])}
      ancho={secondaryQuestion ? toFieldNum(secondaryQuestion, values[secondaryQuestion.key]) : null}
      espesor={rawCm(depthQuestion, values[depthQuestion.key])}
      largoUnit={questions[0].unit ?? "m"}
      anchoUnit={secondaryQuestion?.unit ?? "m"}
      espesorUnit={diagramDepthUnit ?? depthQuestion.unit ?? "cm"}
    />
  ) : isPit ? (
    isCircular ? (
      <PoolExcavationIllustration
        shape="circular"
        diametro={toFieldNum(questions[0], values[questions[0].key])}
        profundidad={toDiagramDepth(depthQuestion, values[depthQuestion.key]) ?? null}
        diametroUnit={questions[0].unit ?? "m"}
        profundidadUnit={diagramDepthUnit ?? depthQuestion.unit ?? "m"}
      />
    ) : (
      <PoolExcavationIllustration
        shape="rectangular"
        largo={toFieldNum(questions[0], values[questions[0].key])}
        ancho={secondaryQuestion ? toFieldNum(secondaryQuestion, values[secondaryQuestion.key]) : null}
        profundidad={toDiagramDepth(depthQuestion, values[depthQuestion.key]) ?? null}
        largoUnit={questions[0].unit ?? "m"}
        anchoUnit={secondaryQuestion?.unit ?? "m"}
        profundidadUnit={diagramDepthUnit ?? depthQuestion.unit ?? "m"}
      />
    )
  ) : isPoolStructure ? (
    isCircular ? (
      <PoolStructureIllustration
        shape="circular"
        diametro={structureDims?.primary ?? null}
        profundidad={structureDims?.depth ?? null}
        espesorMuroCm={rawCm(questions[0], values[questions[0].key])}
        espesorFondoCm={rawCm(depthQuestion, values[depthQuestion.key])}
      />
    ) : (
      <PoolStructureIllustration
        shape="rectangular"
        largo={structureDims?.primary ?? null}
        ancho={structureDims?.secondary ?? null}
        profundidad={structureDims?.depth ?? null}
        espesorMuroCm={rawCm(questions[0], values[questions[0].key])}
        espesorFondoCm={rawCm(depthQuestion, values[depthQuestion.key])}
      />
    )
  ) : isIntegralMedidas ? (
    isCircular ? (
      <PoolConfiguratorIllustration
        state="medidas"
        shape="circular"
        diametro={toFieldNum(questions[0], values[questions[0].key])}
        profundidad={toDiagramDepth(depthQuestion, values[depthQuestion.key]) ?? null}
      />
    ) : (
      <PoolConfiguratorIllustration
        state="medidas"
        shape="rectangular"
        largo={toFieldNum(questions[0], values[questions[0].key])}
        ancho={secondaryQuestion ? toFieldNum(secondaryQuestion, values[secondaryQuestion.key]) : null}
        profundidad={toDiagramDepth(depthQuestion, values[depthQuestion.key]) ?? null}
      />
    )
  ) : isIntegralEstructura ? (
    isCircular ? (
      <PoolConfiguratorIllustration
        state="estructura"
        shape="circular"
        diametro={structureDims?.primary ?? null}
        profundidad={structureDims?.depth ?? null}
        espesorMuroCm={rawCm(questions[0], values[questions[0].key])}
        espesorFondoCm={rawCm(depthQuestion, values[depthQuestion.key])}
      />
    ) : (
      <PoolConfiguratorIllustration
        state="estructura"
        shape="rectangular"
        largo={structureDims?.primary ?? null}
        ancho={structureDims?.secondary ?? null}
        profundidad={structureDims?.depth ?? null}
        espesorMuroCm={rawCm(questions[0], values[questions[0].key])}
        espesorFondoCm={rawCm(depthQuestion, values[depthQuestion.key])}
      />
    )
  ) : isCircular ? (
    <DiagramV2
      kind="cylinder"
      diametro={toFieldNum(questions[0], values[questions[0].key]) ?? undefined}
      profundidad={toDiagramDepth(depthQuestion, values[depthQuestion.key])}
      labels={{ diametro: capitalize(diagram.primaryLabel), profundidad: capitalize(diagram.depthLabel!) }}
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
      profundidadDisplay={depthUnitIsCm ? (toFieldNum(depthQuestion, values[depthQuestion.key]) ?? undefined) : undefined}
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
  );

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

  // Fase C1.1 (2026-09-01) — EXCLUSIVO de "piscina-integral": la relación
  // 1fr/1.15fr de siempre (≈46.5%/53.5%) se sentía como un wizard genérico
  // con la ilustración de relleno; el configurador integral la usa como
  // protagonista real. Ratio propio, gateado por isIntegralMedidas/
  // isIntegralEstructura (los únicos 2 estados de este módulo que llegan
  // acá), sin tocar el ratio compartido por el resto de los módulos con
  // VolumeStep (Radier, Fundación, Piscina standalone, Excavación...).
  const isIntegral = isIntegralMedidas || isIntegralEstructura;
  return (
    <div
      className={`bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8 grid md:gap-10 md:items-start ${
        isIntegral ? "md:grid-cols-[1fr_1.4fr]" : "md:grid-cols-[1fr_1.15fr]"
      }`}
    >
      <div className="order-1">
        {/* Fase C1 (2026-08-31) — EXCLUSIVO de "piscina-integral": header de
            bloque en vez del <h2> genérico de groupLabel, ver
            pool-configurator-layout.tsx. Ausente en todo el resto de los
            módulos (poolConfiguratorBlockLabel es undefined), que siguen
            mostrando su groupLabel de siempre, sin cambios. */}
        {diagram.poolConfiguratorBlockLabel ? (
          <PoolConfiguratorLayout activeBlock={diagram.poolConfiguratorBlockLabel} />
        ) : (
          diagram.groupLabel && (
            <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight mb-2">{diagram.groupLabel}</h2>
          )
        )}
        {diagram.groupHelpText && (
          <p className={`text-sm text-ink-muted ${diagram.groupHelpTextDetail ? "mb-2" : "mb-5"}`}>{diagram.groupHelpText}</p>
        )}
        {/* Fase B.1 (2026-08-31, Excavación): contenido técnico adicional
            (holgura, moldaje, sistema constructivo) que alargaba demasiado
            la explicación siempre visible en mobile, empujando la
            ilustración fuera de la primera pantalla — se muestra colapsado
            detrás de "¿Cómo medir?", mismo componente `CollapsibleHelp` ya
            usado en el resto del framework para helpText largo, sin
            mecanismo nuevo. Ausente (`undefined`) en todo módulo que no lo
            declare explícitamente en su DiagramConfig — cero cambio para
            Radier/Pilar/Fundación/Jardinera/Muro/Piscina. */}
        {diagram.groupHelpTextDetail && (
          <div className="mb-5">
            <CollapsibleHelp label="¿Cómo medir?" ariaLabel="Más información sobre cómo medir">
              <p className="text-sm text-ink-muted">{diagram.groupHelpTextDetail}</p>
            </CollapsibleHelp>
          </div>
        )}

        {/* Radier ("Calculadora de radier rediseñada", 2026-08-30, aprobado
            por Jorge) + Fase B (2026-08-31, Excavación/Piscinas): en
            mobile, la ilustración va DESPUÉS del título/texto explicativo
            y ANTES de los inputs — instancia separada, md:hidden, que
            reusa `illustrationNode` (mismos `values`/`structureDims` que
            la columna derecha, sin duplicar estado). En desktop queda
            oculta acá porque la columna derecha (más abajo, hidden solo
            cuando `showIllustrationFirst`) ya la muestra en su lugar de
            siempre. Ningún módulo fuera de este gate agrega este bloque
            (Fundación/Pilar/Jardinera/Muro no matchean ningún shape ni
            waterFill). */}
        {showIllustrationFirst && (
          <div className="md:hidden mb-5 rounded-2xl bg-[#F3F7FB] p-4">
            {illustrationNode}
          </div>
        )}

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

        {/* Fase B (2026-08-31): Piscina Paso 2 (espesores) no arma un
            volumen/superficie real con solo 2 espesores — este paso nunca
            tuvo una caja de resultado (era un grid plano sin preview) y no
            gana una inventada acá. El resto de los módulos con VolumeStep
            (Excavación, Pilar, Piscina Paso 1, Fundación, Jardinera,
            Radier) la siguen mostrando exactamente igual que antes. */}
        {showResultBox && (
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
            {/* Radier ("Calculadora de radier rediseñada", 2026-08-30,
                revisión de Jorge): el diseño final aprobado no incluye la
                fórmula secundaria ("6 × 3 × 0,08 m") bajo Superficie/
                Volumen — se oculta SOLO cuando isSlab; el resto de los
                módulos (Excavación, Pilar, Piscina, Fundación, etc.) la
                siguen mostrando exactamente igual que antes. No se toca el
                cálculo de `formulaText` en useVolumePreview, solo su
                render acá. */}
            {formulaText && !isSlab && <p className="col-span-2 mt-1 text-xs text-ink-muted">{formulaText}</p>}
          </div>
        )}

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

      {/* Radier ("Calculadora de radier rediseñada", 2026-08-30, aprobado
          por Jorge) + Fase B (2026-08-31): en mobile esta columna se
          oculta completa cuando `showIllustrationFirst` (la ilustración ya
          se mostró más arriba, entre el texto explicativo y los inputs)
          — evita mostrarla dos veces. En desktop no cambia nada: sigue
          siendo la columna derecha de siempre, mismo `order-2`, mismo
          slot visual — ningún módulo fuera del gate toca esta clase. */}
      <div className={`${showIllustrationFirst ? "hidden md:block" : ""} order-2 mb-6 md:mb-0 rounded-2xl bg-[#F3F7FB] p-5 md:p-6`}>
        {/* Radier ("Calculadora de radier rediseñada", 2026-08-30, revisión
            de Jorge) + Fase B: el diseño final aprobado no incluye este
            título/explicación en la tarjeta de ilustración cuando ya hay
            una ilustración dedicada (`showIllustrationFirst`). El resto de
            los módulos (Fundación, Pilar, Jardinera, Muro) lo sigue
            mostrando exactamente igual que antes. */}
        {!showIllustrationFirst && (
          <div className="hidden md:block mb-4">
            <p className="font-semibold text-sm">Así se ve con tus medidas</p>
            <p className="text-sm text-ink-muted mt-1">
              Mismo diagrama y mismos valores: el {isCircular ? "diámetro" : "ancho"} extra va al dibujo, no a agrandar
              el texto.
            </p>
          </div>
        )}
        {illustrationNode}
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
