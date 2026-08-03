"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { WizardQuestion } from "../types";
import { checkRangeWarning, parseTypicalRange } from "@/lib/range-hint";
import { formatQuantity } from "@/lib/format-number";
import { AreaInputToggle } from "../area-input-toggle";
import { DiagramV2 } from "@/lib/diagram-v2";
// Configuración visual por módulo (diagramas, layout combinado) — ver
// module-visual-config.ts, el registro único (Fase de consolidación,
// 2026-08-02) que reemplaza los mapas que antes vivían dispersos acá.
import {
  DIMENSION_DIAGRAMS,
  COMBINED_AREA_QUESTION,
  ROOF_SLOPE_FACTORS,
  parseTileSizeCm,
} from "../module-visual-config";
import { VolumeStep } from "./volume-step";
import { SubmitActions } from "./submit-actions";
// Lógica común del framework (unidades, parsing, formateo, validación,
// área) — ver dimension-utils/, Fase de consolidación (2026-08-02).
import { toNum } from "../dimension-utils/parsing";
import { capitalize, round2 } from "../dimension-utils/formatting";
import { parseAnswers } from "../dimension-utils/validation";
import { parseAreaFromRawDims } from "../dimension-utils/area";

// Migración completa a Diagram System V2 (ver conversación 2026-08-02) —
// lenguaje visual congelado y aprobado; TODOS los módulos con diagrama
// renderizan con este sistema. shape -> kind: "rectangle" -> "rect2d",
// "rectangle-with-depth" -> "box", "circle" -> "circle2d",
// "circle-with-depth" -> "cylinder".

// Usado por ModuleWizard para decidir si un paso de UNA sola pregunta
// (sin pareja) también debe rutearse por QuestionGroupStep en vez de
// QuestionStep — caso de los módulos que antes solo pedían m² directo y
// ahora también pueden alternar a largo×ancho.
export function hasAreaToggle(stepGroup: string | null | undefined): boolean {
  return Boolean(stepGroup && DIMENSION_DIAGRAMS[stepGroup]?.allowAreaToggle);
}

// Usado por ModuleWizard para ensanchar el contenedor del wizard solo en
// pasos con diagrama (ver conversación 2026-07-30) — a 2 columnas, el
// ancho angosto de siempre (max-w-2xl, pensado para 1 columna) dejaba el
// diagrama y los inputs apretados.
export function hasDiagram(stepGroup: string | null | undefined): boolean {
  return Boolean(stepGroup && DIMENSION_DIAGRAMS[stepGroup]);
}

export function QuestionGroupStep({
  questions,
  initialValues,
  onAnswer,
  forcedInitialArea,
  onSaveForLater,
  focusFieldKey,
}: {
  questions: WizardQuestion[];
  initialValues: Record<string, string | number | undefined>;
  // Puede incluir strings además de numbers: un grupo con un campo SELECT
  // usado como dimensión (ver espesor de Losa/Muro, toFieldNum más arriba)
  // responde con la key de la opción elegida, no un número.
  onAnswer: (values: Record<string, number | string>) => void;
  // Fuerza el AreaInputToggle (ver useAreaToggle más abajo) a abrir en modo
  // "m² directo" con este valor precargado, sin importar cuántas preguntas
  // tenga el grupo (1 o 2) — usado por la Fase 3 de "Construir una piscina"
  // para precargar el área del contorno ya calculada (ver plan/[slug]/page.tsx).
  // Sin esto, el comportamiento es idéntico al de siempre.
  forcedInitialArea?: number;
  // Link secundario bajo "Siguiente", solo en pasos con diagrama (ver
  // conversación 2026-07-30) — ausente en grupos sin diagrama, que
  // conservan el botón de siempre.
  onSaveForLater?: () => void;
  // BUG-003: key de la pregunta que se pidió editar puntualmente vía
  // "Cambiar" en el panel resumen (ver ModuleWizard.handleEditField) — si
  // está presente y pertenece a este grupo, ese campo recibe el autoFocus
  // en vez del primero por defecto.
  focusFieldKey?: string | null;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      questions.map((q) => [q.key, initialValues[q.key] !== undefined ? String(initialValues[q.key]) : ""])
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [openHelp, setOpenHelp] = useState<Record<string, boolean>>({});
  // Campo activo (ver `activeField`, spec aprobada) — solo aplica al
  // diagrama 2D (rect2d/circle2d) de este componente; VolumeStep tiene el
  // suyo propio, aislado.
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // BUG-006 (auditoría funcional 02-ago-2026): antes `error` solo se
    // limpiaba dentro de handleSubmit al reintentar con éxito, así que el
    // mensaje "Completa todos los campos..." quedaba visible en pantalla
    // aunque el usuario ya hubiera corregido todos los campos, hasta que
    // volvía a apretar "Siguiente". Se limpia acá, al primer cambio de
    // cualquier campo — si al reintentar sigue habiendo un error real,
    // handleSubmit lo vuelve a mostrar con el mensaje correcto.
    setError(null);
  };

  const stepGroup = questions[0]?.stepGroup;
  const diagram = stepGroup ? DIMENSION_DIAGRAMS[stepGroup] : undefined;

  // Layout compacto para grupos de 3+ campos: los pasos apilados con
  // heading grande + helpText siempre visible llenaban el viewport de
  // 375px sin margen (por eso Piscina rectangular y Escalera quedaron
  // sin diagrama en su momento). En compacto: labels más chicos, menos
  // espaciado, 2 columnas en desktop, y helpText detrás de un ícono (i).
  const compact = questions.length >= 3;
  // Pares de 2 campos con diagrama (largo/ancho, etc.) van lado a lado
  // aunque no tengan allowAreaToggle — es puramente el layout de las
  // mismas 2 preguntas ya agrupadas en este paso, no cambia cómo se
  // guardan ni se usan sus valores en las fórmulas. Los grupos que sí
  // tienen allowAreaToggle ni pasan por acá (los renderiza AreaInputToggle
  // más abajo); esto es para los que se quedaron con el grid fijo.
  const sideBySide = questions.length === 2 && Boolean(diagram);
  // Los 9 módulos auditados contra el mockup (ver COMBINED_AREA_QUESTION):
  // largo+ancho (siempre questions[0]/[1], mismo orden posicional que usa
  // el diagrama) se combinan en una sola pregunta con superficie en vivo;
  // un 3er campo (profundidad/alto), si existe, se queda como pregunta
  // aparte de todos modos.
  const combined = stepGroup ? COMBINED_AREA_QUESTION[stepGroup] : undefined;
  const pairedQuestions = combined ? questions.slice(0, 2) : [];
  const extraQuestions = combined ? questions.slice(2) : questions;
  // Grupos de exactamente 3 campos con diagrama de caja/cilindro 3D y SIN
  // el layout combinado (ej. Excavación): las 3 medidas van en una sola
  // fila en tablet/desktop, apiladas en mobile — mismo criterio que ya
  // aplicaba sideBySide para pares de 2. Los grupos combinados (Piscina
  // rectangular, Jardinera) NO entran acá: mantienen su layout ya auditado
  // (2 campos bajo un título + superficie en vivo, 3er campo aparte).
  const threeInRow = !combined && questions.length === 3 && Boolean(diagram);
  const areaValue = combined
    ? parseAreaFromRawDims(values[pairedQuestions[0]?.key], values[pairedQuestions[1]?.key])
    : null;
  // El helpText también se colapsa fuera del modo compacto cuando es
  // largo (caso Escalera: 2 campos que repiten un helpText de ~95
  // caracteres cada uno) — regla por largo, no por módulo puntual.
  const isHelpCollapsed = (q: WizardQuestion) =>
    Boolean(q.helpText) && (compact || (q.helpText?.length ?? 0) > 80);

  const rangeWarnings: Record<string, string | null> = {};
  for (const question of questions) {
    const range = parseTypicalRange(question.helpText, question.key);
    const raw = values[question.key] ?? "";
    const num = Number(raw.replace(",", "."));
    rangeWarnings[question.key] =
      range && raw && Number.isFinite(num) && num > 0 ? checkRangeWarning(num, range) : null;
  }

  const handleSubmit = () => {
    const result = parseAnswers(questions, values);
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    setError(null);
    onAnswer(result.parsed);
  };

  // El diagrama vincula sus campos (primario/secundario) con `questions`
  // en ese mismo orden posicional — así fueron auditados al armar
  // DIMENSION_DIAGRAMS. Los grupos con profundidad (depthLabel) nunca
  // llegan hasta acá: los renderiza VolumeStep más arriba.
  const diagramSecondaryQuestion = diagram?.secondaryLabel ? questions[1] : undefined;
  // Campo activo del diagrama 2D (ver `activeField`, spec aprobada) —
  // solo el primario/secundario existen acá (los grupos con profundidad
  // van por VolumeStep, que tiene su propio activeField aislado).
  const diagramActiveField: "largo" | "ancho" | "diametro" | undefined = !diagram
    ? undefined
    : activeKey === questions[0]?.key
      ? diagram.shape === "circle"
        ? "diametro"
        : "largo"
      : diagramSecondaryQuestion && activeKey === diagramSecondaryQuestion.key
        ? "ancho"
        : undefined;

  // AreaInputToggle reemplaza el grid de campos fijo cuando el stepGroup
  // está auditado como seguro para "m² directo" (ver allowAreaToggle
  // arriba). Dos casos:
  // - Grupo de 2 preguntas (largo+ancho ya existentes): en modo m², como
  //   no hay largo/ancho reales que ingresar, se reparte la superficie en
  //   un cuadrado equivalente (lado = √área) para llenar ambas preguntas
  //   sin tocar la fórmula del módulo (que sigue multiplicando las dos) —
  //   matemáticamente da el área correcta; ningún otro cálculo del módulo
  //   depende del largo/ancho por separado en los pares marcados
  //   allowAreaToggle, así que el cuadrado ficticio es inofensivo.
  // - Grupo de 1 sola pregunta (módulos que antes solo pedían m² directo,
  //   o Pintura consolidado): el área calculada se guarda tal cual en esa
  //   única pregunta — no hace falta el truco del cuadrado.
  const useAreaToggle = diagram?.allowAreaToggle && questions.length <= 2;

  // Tamaño de pieza real, si el módulo lo pregunta antes de este paso (ver
  // tileSizeQuestionKey) — `initialValues` ya trae todas las respuestas
  // previas del wizard (no solo las de este grupo), así que la key queda
  // disponible aunque la pregunta viva en un paso separado.
  const tileSizeCm = diagram?.tileSizeQuestionKey
    ? parseTileSizeCm(initialValues[diagram.tileSizeQuestionKey] as string | undefined)
    : null;

  // Pista de orientación — misma lógica de lectura que tileSizeCm, pero sin
  // parseo: el valor de la opción ("recto"/"diagonal") ya coincide con lo
  // que espera orientationHint.
  const orientationHintValue = diagram?.orientationQuestionKey
    ? (initialValues[diagram.orientationQuestionKey] as "recto" | "diagonal" | undefined)
    : undefined;

  // Techumbres — mismo criterio de lectura, mapeado a un factor real vía
  // ROOF_SLOPE_FACTORS (ver comentario ahí).
  const roofSlopeFactor = diagram?.slopeQuestionKey
    ? ROOF_SLOPE_FACTORS[initialValues[diagram.slopeQuestionKey] as string]
    : undefined;

  const handleAreaChange = (
    area: number | null,
    dims: { primary: string; secondary: string } | null
  ) => {
    if (questions.length === 1) {
      setValues({ [questions[0].key]: area !== null ? String(round2(area)) : "" });
      return;
    }
    if (dims) {
      // Modo "largo × ancho": preserva el par real que tecleó el usuario en
      // vez de reconstruir un cuadrado ficticio — bug corregido (antes se
      // perdía la asimetría real incluso viniendo de este modo).
      setValues({ [questions[0].key]: dims.primary, [questions[1].key]: dims.secondary });
      return;
    }
    // Modo "m² directo": no hay dims individuales reales que preservar —
    // reparte el área en un cuadrado equivalente (da el m² correcto para la
    // fórmula, aunque el par individual mostrado sea ficticio).
    const side = area !== null ? String(round2(Math.sqrt(area))) : "";
    setValues({ [questions[0].key]: side, [questions[1].key]: side });
  };

  // Pasos de VOLUMEN (diagrama con profundidad: caja o cilindro) — layout
  // propio (ícono+label+sublabel+input por campo, resultado en vivo, tip),
  // el mismo en mobile y desktop (ver conversación 2026-07-30). Tiene
  // prioridad sobre `combined`: antes Piscina rectangular/Jardinera
  // combinaban largo+ancho con un cuadro de ÁREA en vivo — ahora, como
  // cualquier otro módulo de volumen, muestran los 3 campos por separado
  // con un cuadro de VOLUMEN en vivo (coherente con Excavación/Pilar).
  if (diagram?.depthLabel) {
    return (
      <VolumeStep
        questions={questions}
        diagram={diagram}
        values={values}
        setValue={setValue}
        error={error}
        rangeWarnings={rangeWarnings}
        handleSubmit={handleSubmit}
        onSaveForLater={onSaveForLater}
        focusFieldKey={focusFieldKey}
      />
    );
  }

  if (useAreaToggle) {
    return (
      <div>
        {questions.length === 1 && questions[0].helpText && (
          <p className="text-sm text-ink-muted mb-3">{questions[0].helpText}</p>
        )}
        <AreaInputToggle
          primaryLabel={diagram!.primaryLabel}
          secondaryLabel={diagram!.secondaryLabel}
          // El campo m² directo siempre muestra "m²" (fijo dentro del
          // componente); este `unit` es solo para los campos largo/ancho
          // en modo dims, que son longitudes — nunca la unidad de la
          // pregunta original (que para los grupos de 1 sola pregunta es
          // "m²", la unidad del ÁREA, no de una longitud).
          unit={questions.length === 2 ? questions[0].unit ?? "m" : "m"}
          // Para un grupo de 1 sola pregunta, lo único que existe es el área
          // combinada (nunca hubo largo/ancho reales guardados por separado
          // — ver handleAreaChange) — si ya hay una respuesta previa (ej.
          // "Editar respuestas" en Pintura), abre directo en "m² directo"
          // con ese valor precargado, en vez del tab "largo × ancho" vacío
          // por defecto.
          initialMode={
            forcedInitialArea !== undefined || (questions.length === 1 && values[questions[0].key])
              ? "area"
              : "dims"
          }
          enableDeduction={diagram!.enableDeduction}
          deductionLabel={diagram!.deductionLabel}
          tileSizeCm={tileSizeCm ?? undefined}
          orientationHint={orientationHintValue}
          roofSlopeFactor={roofSlopeFactor}
          initialPrimary={questions.length === 2 ? values[questions[0].key] || undefined : undefined}
          initialSecondary={questions.length === 2 ? values[questions[1].key] || undefined : undefined}
          initialArea={
            forcedInitialArea !== undefined
              ? String(forcedInitialArea)
              : questions.length === 1
                ? values[questions[0].key] || undefined
                : undefined
          }
          onAreaChange={handleAreaChange}
        />

        {error && <p className="mt-4 text-sm text-safety">{error}</p>}

        <SubmitActions onSubmit={handleSubmit} onSaveForLater={onSaveForLater} />
      </div>
    );
  }

  return (
    <div
      className={
        diagram
          ? "bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8 grid md:grid-cols-[1fr_1.15fr] md:gap-10 md:items-center"
          : undefined
      }
    >
      {diagram && (
        <div className="order-2 mb-6 md:mb-0">
          {diagram.shape === "circle" ? (
            <DiagramV2
              kind="circle2d"
              diametro={toNum(values[questions[0].key]) ?? undefined}
              labels={{ diametro: capitalize(diagram.primaryLabel) }}
              unit={questions[0].unit ?? "m"}
              activeField={diagramActiveField}
            />
          ) : (
            <DiagramV2
              kind="rect2d"
              largo={toNum(values[questions[0].key]) ?? undefined}
              ancho={diagramSecondaryQuestion ? (toNum(values[diagramSecondaryQuestion.key]) ?? undefined) : undefined}
              labels={{
                largo: capitalize(diagram.primaryLabel),
                ancho: diagram.secondaryLabel ? capitalize(diagram.secondaryLabel) : undefined,
              }}
              unit={questions[0].unit ?? "m"}
              units={{ largo: questions[0].unit ?? undefined, ancho: diagramSecondaryQuestion?.unit ?? undefined }}
              activeField={diagramActiveField}
              tileSizeCm={tileSizeCm ?? undefined}
              orientationHint={orientationHintValue}
              roofSlopeFactor={roofSlopeFactor}
            />
          )}
          {orientationHintValue && (
            <p className="text-xs text-ink-faint mt-2">
              Representación esquemática. La orientación es ilustrativa.
            </p>
          )}
          {roofSlopeFactor && diagram.shape !== "circle" && (() => {
            const L = toNum(values[questions[0].key]);
            const A = diagramSecondaryQuestion ? toNum(values[diagramSecondaryQuestion.key]) : null;
            if (!L || !A) return null;
            const areaProjected = L * A;
            return (
              <p className="text-xs text-ink-muted mt-2 text-center">
                Superficie proyectada: {areaProjected.toFixed(2)} m² · Superficie real del techo:{" "}
                {(areaProjected * roofSlopeFactor).toFixed(2)} m²
              </p>
            );
          })()}
        </div>
      )}
      <div className={diagram ? "order-1" : undefined}>
      {combined && (
        <div className="mb-5">
          <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight">{combined.label}</h2>
          <p className="text-sm text-ink-muted mt-2 mb-4">{combined.helpText}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {pairedQuestions.map((question, i) => (
              <div key={question.id}>
                <label htmlFor={`field-${question.id}`} className="block text-sm font-medium text-ink-muted mb-1.5">
                  {capitalize(i === 0 ? diagram?.primaryLabel ?? question.label : diagram?.secondaryLabel ?? question.label)}
                </label>
                <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-5 py-4 focus-within:ring-2 focus-within:ring-action/70 focus-within:ring-offset-1">
                  <input
                    id={`field-${question.id}`}
                    type="text"
                    inputMode="decimal"
                    autoFocus={focusFieldKey ? question.key === focusFieldKey : i === 0}
                    value={values[question.key]}
                    onChange={(e) => setValue(question.key, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    onFocus={() => setActiveKey(question.key)}
                    onBlur={() => setActiveKey((prev) => (prev === question.key ? null : prev))}
                    placeholder="0"
                    className="w-full bg-transparent outline-none font-display placeholder:text-ink-faint text-2xl"
                  />
                  {question.unit && <span className="font-mono text-sm text-ink-muted">{question.unit}</span>}
                </div>
                {rangeWarnings[question.key] && (
                  <p className="mt-2 text-sm text-amber-600">{rangeWarnings[question.key]}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-concrete px-5 py-4 text-center">
            <p className="text-sm text-ink-muted">{combined.areaLabel}</p>
            <p className="font-display text-2xl font-semibold text-ink">
              {areaValue !== null ? `${formatQuantity(areaValue)} m²` : "—"}
            </p>
          </div>
        </div>
      )}
      {extraQuestions.length > 0 && (
      <div
        className={
          threeInRow
            ? "grid gap-3 md:grid-cols-3"
            : compact
              ? "grid gap-3 md:grid-cols-2"
              : sideBySide
                ? "grid gap-5 md:grid-cols-2"
                : "grid gap-5"
        }
      >
        {extraQuestions.map((question, i) => {
          const collapsedHelp = isHelpCollapsed(question);
          return (
            <div key={question.id}>
              <div className="flex items-center gap-1.5 mb-2">
                {compact ? (
                  <span className="font-semibold text-[15px]">{question.label}</span>
                ) : (
                  <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
                    {question.label}
                  </h2>
                )}
                {collapsedHelp && (
                  <button
                    type="button"
                    onClick={() => setOpenHelp((prev) => ({ ...prev, [question.key]: !prev[question.key] }))}
                    aria-label={`Más información sobre ${question.label}`}
                    aria-expanded={!!openHelp[question.key]}
                    className="shrink-0 text-ink-faint hover:text-ink"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                )}
              </div>
              {question.helpText && (!collapsedHelp || openHelp[question.key]) && (
                <p className="text-sm text-ink-muted mb-2">{question.helpText}</p>
              )}
              <div
                className={`flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink focus-within:ring-2 focus-within:ring-action/70 focus-within:ring-offset-1 ${
                  compact ? "px-4 py-3" : "px-5 py-4"
                }`}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus={focusFieldKey ? question.key === focusFieldKey : !combined && i === 0}
                  aria-label={question.label}
                  value={values[question.key]}
                  onChange={(e) => setValue(question.key, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  onFocus={() => setActiveKey(question.key)}
                  onBlur={() => setActiveKey((prev) => (prev === question.key ? null : prev))}
                  placeholder="0"
                  className={`w-full bg-transparent outline-none font-display placeholder:text-ink-faint ${
                    compact ? "text-xl" : "text-2xl"
                  }`}
                />
                {question.unit && <span className="font-mono text-sm text-ink-muted">{question.unit}</span>}
              </div>
              {rangeWarnings[question.key] && (
                <p className="mt-2 text-sm text-amber-600">{rangeWarnings[question.key]}</p>
              )}
            </div>
          );
        })}
      </div>
      )}

      {error && <p className="mt-4 text-sm text-safety">{error}</p>}

      <SubmitActions onSubmit={handleSubmit} onSaveForLater={diagram ? onSaveForLater : undefined} />
      </div>
    </div>
  );
}
