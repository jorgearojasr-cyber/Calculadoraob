"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { QuestionStep } from "./question-step";
import { QuestionGroupStep, hasAreaToggle, hasDiagram } from "./question-group-step";
import { ConditionalRevealStep } from "./conditional-reveal-step";
import { ApplianceConsumptionStep } from "./appliance-consumption-step";
import { FoundationStep, isFoundationStepGroup } from "./foundation-step";
import { InteriorTerminationStep, isInteriorTerminationStepGroup, getInteriorActiveKeys } from "./interior-termination-step";
import { PoolExcavationStep, isExcavationStepGroup } from "./pool-excavation-step";
import { PoolEnvironmentStep, isEnvironmentStepGroup } from "./pool-environment-step";
import { PoolEquipmentStep, isEquipmentStepGroup } from "./pool-equipment-step";
import { PoolCostsStep, isCostsStepGroup } from "./pool-costs-step";
import { getCostsActiveKeys } from "./pool-costs-active-keys";
import { ResultScreen } from "./result-screen";
import { WizardHeader } from "./wizard-header";
import { WizardResumeGate } from "./wizard-resume-gate";
import { LiveSummaryPanel, type SummaryItem } from "./live-summary-panel";
import { pluralizeUnit } from "@/lib/pluralize";
import type { WizardAnswers, WizardQuestion } from "./types";
import type { ModuleGuideData } from "./guide-section";
import { calculateModuleAction, type CalculateModuleResult } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";
import { readWizardDraft, writeWizardDraft, clearWizardDraft, type WizardDraft } from "./wizard-draft";

// Configuración por módulo (recálculo, hero, preguntas opcionales) — ver
// module-visual-config.ts, el registro único (Fase de consolidación,
// 2026-08-02) que reemplaza los mapas que antes vivían dispersos acá.
import {
  RECALCULATE_FIELDS,
  HERO_RESULT_KEYS,
  OPTIONAL_QUESTION_KEYS,
  RECIPE_GROUPS,
  DOSIFICACION_GROUPS,
  EXCLUDE_FROM_LIST_KEYS,
  CONSOLIDATE_NOTES_KEYS,
  REFUERZO_CONFIG,
  HERO_POSITIONS,
  RESULT_GROUPS,
  SECONDARY_HERO_RESULT_KEYS,
  COSTOS_CONFIG,
} from "./module-visual-config";

function isQuestionVisible(question: WizardQuestion, answers: WizardAnswers): boolean {
  if (!question.visibleIfQuestionKey) return true;
  const answer = answers[question.visibleIfQuestionKey];
  return answer !== undefined && question.visibleIfValues.includes(String(answer));
}

// Preguntas con el mismo stepGroup se agrupan en un solo paso del wizard,
// en el orden en que aparece cada grupo por primera vez. Preguntas con
// visibleIfQuestionKey se excluyen si esa condición no se cumple con las
// respuestas actuales.
function buildSteps(questions: WizardQuestion[], answers: WizardAnswers): WizardQuestion[][] {
  const visible = questions.filter((q) => isQuestionVisible(q, answers));
  const steps: WizardQuestion[][] = [];
  const groupIndex = new Map<string, number>();

  for (const question of visible) {
    if (question.stepGroup) {
      const existingIndex = groupIndex.get(question.stepGroup);
      if (existingIndex !== undefined) {
        steps[existingIndex].push(question);
        continue;
      }
      groupIndex.set(question.stepGroup, steps.length);
    }
    steps.push([question]);
  }

  return steps;
}

// Antes de calcular: cualquier pregunta que haya quedado OCULTA por
// visibleIf (nunca se le mostró al usuario) pero tenga hiddenDefaultValue
// configurado, se rellena con ese valor — para que las fórmulas/lookups
// que dependen de su respuesta sigan resolviendo igual que antes, en vez
// de quedar sin valor. Ej.: "colocacion" oculta cuando metodo_hormigon
// es "manual" asume "manual_carretilla".
function withHiddenDefaults(questions: WizardQuestion[], answers: WizardAnswers): WizardAnswers {
  const result = { ...answers };
  for (const question of questions) {
    if (!question.hiddenDefaultValue) continue;
    if (isQuestionVisible(question, answers)) continue;
    result[question.key] = question.hiddenDefaultValue;
  }
  return result;
}

// Precarga (editable) el valor sugerido de una pregunta NUMBER aún sin
// responder, vía defaultSource.table, si la pregunta de la que depende ya
// fue contestada. No pisa una respuesta que el usuario ya dio.
function withSuggestedDefaults(questions: WizardQuestion[], answers: WizardAnswers): WizardAnswers {
  const result: WizardAnswers = { ...answers };
  for (const question of questions) {
    if (result[question.key] !== undefined) continue;
    if (question.defaultSource?.type !== "LOOKUP") continue;
    const dependencyAnswer = answers[question.defaultSource.questionKey];
    if (dependencyAnswer === undefined) continue;
    const suggested = question.defaultSource.table[String(dependencyAnswer)];
    if (suggested !== undefined) result[question.key] = suggested;
  }
  return result;
}

export function ModuleWizard({
  moduleId,
  moduleSlug,
  moduleName,
  categoryName,
  questions,
  initialAnswers,
  guide,
  approvedPhotos,
  planContext,
  isAdvancedMode,
  forcedInitialArea,
}: {
  moduleId: string;
  // Usado solo para gatillar el nivel 4 de disclaimer de Gas (ver
  // gas-confirmation-gate.tsx) — no se generaliza a ningún otro tratamiento.
  // Opcional: la vista previa de /admin no lo pasa (no aplica ahí).
  moduleSlug?: string;
  moduleName: string;
  categoryName: string;
  questions: WizardQuestion[];
  initialAnswers?: WizardAnswers;
  guide?: ModuleGuideData | null;
  approvedPhotos?: { id: string; url: string }[];
  // Presente cuando el módulo se abrió desde una fase de /plan/[slug] — ver
  // ResultScreen para el redirect de vuelta al plan al guardar. `shape`
  // (Rectangular/Circular) viaja solo si el link de esta fase era de ese
  // tipo — ver SHAPE_LABELS en src/lib/plan-shape.ts. `nextPhase` (sprint UX
  // 03-ago-2026) ya viene resuelto desde el server (page.tsx) — `href: null`
  // significa "existe fase siguiente pero no se pudo resolver un único
  // módulo" (ver resolveNextPhase), y ausente del todo significa "es la
  // última fase del plan".
  planContext?: {
    slug: string;
    phaseId: string;
    shape?: string;
    nextPhase?: { name: string; href: string | null };
    // Fase 4, sprint UX V1.2 (04-ago-2026): contraparte de nextPhase para
    // el botón "Volver" del header en el primer paso — a diferencia de
    // nextPhase, siempre viene resuelto con un href navegable (ver
    // resolvePreviousPhase en page.tsx: nunca deja al header sin destino).
    previousPhase?: { label: string; href: string };
  };
  // Cálculos especiales (grupo herramientas-avanzadas, ver page.tsx) — antes
  // el encuadre de "esto es una pieza suelta, no el proyecto completo"
  // solo vivía en /grupos/herramientas-avanzadas; un usuario que llegaba
  // directo al módulo (búsqueda, link directo, /empezar) nunca lo veía.
  // No duplica el aviso de NormsDisclaimer (ver result-screen.tsx): ese es
  // específico del cálculo y aparece al final: este es genérico del
  // módulo y aparece antes de la primera pregunta.
  isAdvancedMode?: boolean;
  // Precarga el AreaInputToggle del primer step con esta área ya calculada
  // (modo "m² directo") — usado por la Fase 3 de "Construir una piscina"
  // para pasar el área del contorno de la piscina (ver plan/[slug]/page.tsx
  // y ContornoAreaField en plan-view.tsx). Solo se aplica mientras el
  // usuario no haya respondido ya ese step (ver stepIndex===0 más abajo) —
  // así "Volver" no pisa un valor que el usuario ya editó.
  forcedInitialArea?: number;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  // BUG-003 (auditoría funcional 02-ago-2026): "Cambiar" en un campo
  // específico del panel resumen saltaba al paso correcto pero el foco
  // quedaba siempre en el primer input del grupo, no en el campo que el
  // usuario quiso editar. Se limpia en cualquier otra navegación
  // (avanzar/volver/reiniciar) para que solo aplique al salto inmediato
  // que originó "Cambiar" — así un focusFieldKey viejo nunca compite con
  // el autoFocus por defecto de un paso al que se llegó de otra forma.
  const [focusFieldKey, setFocusFieldKey] = useState<string | null>(null);
  const [answers, setAnswers] = useState<WizardAnswers>(initialAnswers ?? {});
  const [calculation, setCalculation] = useState<CalculateModuleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // history.length > 1 es la heurística estándar para "hay a dónde volver
  // en esta pestaña" — cubre los 3 puntos de entrada reales (buscador,
  // /grupos/[slug], /plan/[slug]) y cualquier otro link interno. Si el
  // módulo se abrió en pestaña nueva o por link pegado directo, history
  // arranca en 1 y el botón no se muestra (el link "Inicio" de arriba
  // sigue siendo el respaldo). Se calcula en useEffect porque
  // window.history no existe en el render de servidor.
  const [canGoBack, setCanGoBack] = useState(false);
  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  // BUG-007 (auditoría funcional 02-ago-2026, Grupo 4B): recargar la
  // página o volver con "atrás" del navegador durante un asistente en
  // progreso perdía todo, sin aviso. Decisión de arquitectura del usuario:
  // localStorage únicamente, un solo borrador por módulo (unifica con
  // "Guardar y seguir después", que antes usaba su propia clave/forma —
  // ver wizard-draft.ts). `resumeDraft` es un borrador de origen
  // "autosave" a la espera de que el usuario confirme si quiere
  // retomarlo (ver WizardResumeGate) — nunca se aplica solo.
  const [resumeDraft, setResumeDraft] = useState<WizardDraft | null>(null);
  // Evita que el efecto de autosave (más abajo) escriba un borrador ANTES
  // de que este efecto de restauración haya terminado de revisar si ya
  // había uno — de lo contrario, en el primer render ambos efectos leen
  // `resumeDraft` como null todavía (el setState de abajo recién aplica en
  // el próximo render) y el autosave podría pisar el borrador que se
  // acaba de detectar. Un ref se lee al tiro, sin esperar un re-render.
  const restoreCheckedRef = useRef(false);

  useEffect(() => {
    if (!moduleSlug) {
      restoreCheckedRef.current = true;
      return;
    }
    const draft = readWizardDraft(moduleSlug, moduleId);
    if (draft) {
      if (draft.savedVia === "explicit") {
        // "Guardar y seguir después": comportamiento ya aprobado, sin
        // cambios — se retoma sin preguntar. No pisa un initialAnswers
        // real (ej. ?tipo= o un prellenado de plan) si el usuario entra
        // de nuevo por un link con datos propios.
        setAnswers((prev) => ({ ...draft.answers, ...prev }));
        setStepIndex(draft.stepIndex);
        clearWizardDraft(moduleSlug);
      } else {
        // "autosave": nunca se restaura solo — se le pregunta al usuario.
        setResumeDraft(draft);
      }
    }
    restoreCheckedRef.current = true;
    // Solo al montar: initialAnswers/answers cambian con cada respuesta y
    // no deben re-disparar esta lectura de localStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleSlug]);

  // Autoguardado silencioso en cada respuesta — a diferencia de "Guardar y
  // seguir después" (acción explícita del usuario), esto corre solo,
  // protegiendo contra recarga/"atrás" accidental. Se detiene apenas hay
  // cálculo (el asistente ya terminó, no hay nada que proteger) o mientras
  // haya un resumeDraft pendiente de decisión (no pisar ese borrador antes
  // de que el usuario elija Continuar/Comenzar de nuevo).
  useEffect(() => {
    if (!moduleSlug) return;
    if (!restoreCheckedRef.current) return;
    if (calculation) return;
    if (resumeDraft) return;
    if (Object.keys(answers).length === 0) return;
    writeWizardDraft(moduleSlug, { moduleId, stepIndex, answers, savedVia: "autosave" });
  }, [moduleSlug, moduleId, calculation, resumeDraft, stepIndex, answers]);

  const handleResumeDraft = () => {
    if (!resumeDraft || !moduleSlug) return;
    setAnswers((prev) => ({ ...resumeDraft.answers, ...prev }));
    setStepIndex(resumeDraft.stepIndex);
    clearWizardDraft(moduleSlug);
    setResumeDraft(null);
  };

  const handleDiscardDraft = () => {
    if (!moduleSlug) return;
    clearWizardDraft(moduleSlug);
    setResumeDraft(null);
  };

  const handleSaveForLater = moduleSlug
    ? () => {
        writeWizardDraft(moduleSlug, { moduleId, stepIndex, answers, savedVia: "explicit" });
        router.push("/");
      }
    : undefined;

  const steps = useMemo(() => buildSteps(questions, answers), [questions, answers]);
  const currentGroup = steps[stepIndex];

  const advanceOrCalculate = (nextAnswers: WizardAnswers) => {
    setAnswers(nextAnswers);
    setError(null);
    setFocusFieldKey(null);

    // steps/stepIndex del render actual reflejan las respuestas ANTERIORES a
    // esta; recalculamos con nextAnswers para decidir el próximo paso
    // correctamente cuando esta respuesta cambia qué preguntas son visibles.
    const nextSteps = buildSteps(questions, nextAnswers);
    const currentGroupFirstKey = currentGroup[0].key;
    const currentPosition = nextSteps.findIndex((group) => group.some((q) => q.key === currentGroupFirstKey));
    const nextIndex = (currentPosition === -1 ? stepIndex : currentPosition) + 1;

    if (nextIndex < nextSteps.length) {
      setStepIndex(nextIndex);
      return;
    }

    startTransition(async () => {
      try {
        const result = await calculateModuleAction(moduleId, withHiddenDefaults(questions, nextAnswers));
        setCalculation(result);
        // Asistente terminado: el borrador autoguardado ya cumplió su
        // propósito (proteger contra recarga/"atrás" a mitad de camino),
        // no debe seguir ofreciéndose para retomar tras llegar al resultado.
        if (moduleSlug) clearWizardDraft(moduleSlug);
      } catch {
        setError("No pudimos calcular con esos datos. Revisa las respuestas e inténtalo de nuevo.");
      }
    });
  };

  const handleAnswer = (value: string | number) => {
    advanceOrCalculate({ ...answers, [currentGroup[0].key]: value });
  };

  const handleGroupAnswer = (values: Record<string, string | number>) => {
    advanceOrCalculate({ ...answers, ...values });
  };

  const handleSkip = () => {
    advanceOrCalculate(answers);
  };

  // Recalcula desde la pantalla de RESULTADO (ver RecalculateField) sin
  // pasar por steps ni stepIndex — misma calculateModuleAction que usa el
  // wizard, con las respuestas ya guardadas + el patch. Actualiza answers
  // además de calculation para que "Con estos datos respondiste" y
  // "Guardar como proyecto" reflejen el valor nuevo, no el original.
  const handleRecalculate = async (patch: WizardAnswers) => {
    const nextAnswers = { ...answers, ...patch };
    const result = await calculateModuleAction(moduleId, withHiddenDefaults(questions, nextAnswers));
    setCalculation(result);
    setAnswers(nextAnswers);
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    setFocusFieldKey(null);
    setStepIndex(stepIndex - 1);
  };

  // "Editar respuestas" desde el resultado (ver ResultScreen): a
  // diferencia de handleRestart, NO limpia `answers` — solo vuelve a
  // mostrar el wizard desde el primer paso, que ya prellena cada pregunta
  // con lo respondido antes vía stepInitialValues/withSuggestedDefaults
  // (mismo mecanismo que ya usa cada paso, no hace falta nada nuevo).
  // Coexiste con RecalculateField: ese es para ajustar un solo campo sin
  // salir del resultado; esto es para cambiar cualquier respuesta.
  const handleEditAnswers = () => {
    setCalculation(null);
    setError(null);
    setFocusFieldKey(null);
    setStepIndex(0);
  };

  // Salta directo al paso donde vive `questionKey` (ver LiveSummaryPanel,
  // "Cambiar" en una línea del resumen) — a diferencia de handleEditAnswers
  // (siempre vuelve al paso 1), esto respeta en qué paso está la pregunta.
  // Genérico: usa el mismo `steps` (agrupado por stepGroup) que ya arma
  // buildSteps(), no una lista aparte. BUG-003: además de saltar al paso
  // correcto, recuerda qué campo puntual se pidió editar para que el paso
  // (si agrupa varios campos) autoenfoque ese campo, no siempre el primero.
  const handleEditField = (questionKey: string) => {
    const targetIndex = steps.findIndex((group) => group.some((q) => q.key === questionKey));
    if (targetIndex === -1) return;
    setCalculation(null);
    setError(null);
    setFocusFieldKey(questionKey);
    setStepIndex(targetIndex);
  };

  const handleRestart = () => {
    setAnswers({});
    setCalculation(null);
    setError(null);
    setFocusFieldKey(null);
    setStepIndex(0);
    if (moduleSlug) clearWizardDraft(moduleSlug);
  };

  // `SummaryItem[]` — mismo dato de siempre (label/value por pregunta
  // respondida), ahora con `questionKey` (para que LiveSummaryPanel pueda
  // pedir "salta a esta pregunta" vía handleEditField) y `answered`
  // (para distinguir "Pendiente" de una respuesta real, ver
  // LiveSummaryPanel) — se usa tanto durante el wizard como en el
  // resultado, un solo cómputo para los dos.
  const answersSummary: SummaryItem[] = useMemo(() => {
    // Fase C2.1 (2026-09-01) -- las 13 Questions de "interior-termination"
    // (piscina-integral) no tienen visibleIfQuestionKey (ver
    // interior-termination-step.tsx: la condición real es compuesta —
    // depende de 2 keys distintas — y el schema no la puede expresar en
    // una sola Question), así que el filtro genérico de arriba las deja
    // pasar TODAS. `getInteriorActiveKeys` es la misma lógica condicional
    // real que ese componente usa para decidir qué renderizar — acá se
    // reutiliza (no se duplica a mano) solo para ocultar del resumen las
    // ramas no vigentes (otro material, o el fondo cuando "misma
    // terminación" está activo). Gateado por stepGroup: no afecta a
    // ningún otro módulo, que no tiene preguntas con ese stepGroup.
    const interiorActive = getInteriorActiveKeys(answers);
    // Fase C6.1 (2026-09-02) -- mismo principio que interiorActive, esta
    // vez para las 10 preguntas de precio de Costos (piscina-integral):
    // varias dependen de una condición compuesta (OR entre 2 keys, o
    // terminación+base-existente) que `visibleIfQuestionKey` no puede
    // expresar. `getCostsActiveKeys` es la MISMA función que usa
    // PoolCostsStep para decidir qué precio pedir — sección 8 del pedido
    // C6.1: "CostsStep y TU PROYECTO deben provenir de la misma lógica",
    // nunca una matriz de condiciones duplicada acá. Gateado por
    // stepGroup "costs": no afecta a ningún otro módulo.
    const costsActive = getCostsActiveKeys(answers);
    return questions
      .filter((question) => isQuestionVisible(question, answers))
      .filter((question) => !isInteriorTerminationStepGroup(question.stepGroup) || interiorActive.has(question.key))
      .filter((question) => !isCostsStepGroup(question.stepGroup) || costsActive.has(question.key))
      // Respuestas TEXT que son un blob JSON (ej. el desglose de Consumo
      // eléctrico, ver appliance-consumption-step.tsx) son para consumo
      // interno del cálculo, no algo legible para mostrar acá — regla
      // genérica por forma de la respuesta, no por módulo puntual.
      .filter((question) => {
        const raw = answers[question.key];
        return !(question.type === "TEXT" && typeof raw === "string" && /^[[{]/.test(raw.trim()));
      })
      .map((question) => {
        const raw = answers[question.key];
        // Fase C6.1 -- una pregunta de precio de Costos que SÍ aplica
        // (pasó el filtro de arriba) pero no fue respondida no es una
        // configuración incompleta: es opcional por diseño (sección 9/10
        // del pedido). `optional` la saca del conteo "N de N respondidas"
        // y `pendingLabel` reemplaza el genérico "Pendiente" (que
        // sugeriría un error) por un texto coherente con esa semántica.
        if (isCostsStepGroup(question.stepGroup)) {
          if (raw === undefined || raw === "") {
            return {
              questionKey: question.key,
              label: question.label,
              value: "—",
              answered: false,
              optional: true,
              pendingLabel: "Sin precio ingresado",
            };
          }
          const unit = question.unit ? pluralizeUnit(Number(raw), question.unit) : "";
          return { questionKey: question.key, label: question.label, value: `${raw} ${unit}`.trim(), answered: true, optional: true };
        }
        if (question.type === "SELECT") {
          const option = question.options.find((o) => o.key === raw);
          return { questionKey: question.key, label: question.label, value: option?.label ?? "—", answered: raw !== undefined };
        }
        if (raw === undefined || raw === "") {
          return { questionKey: question.key, label: question.label, value: "—", answered: false };
        }
        const unit = question.unit ? pluralizeUnit(Number(raw), question.unit) : "";
        return { questionKey: question.key, label: question.label, value: `${raw} ${unit}`.trim(), answered: true };
      });
  }, [questions, answers]);

  const isConditionalReveal =
    currentGroup?.length === 2 && currentGroup[0].type === "SELECT" && currentGroup[1].type === "NUMBER";

  // Consumo eléctrico: paso de 2 preguntas (detalle JSON del desglose +
  // total en kWh) respondidas juntas por un único componente a medida —
  // mismo criterio que isConditionalReveal para saltarse QuestionGroupStep
  // por completo en este caso especial.
  const isApplianceConsumption = currentGroup?.length === 2 && currentGroup[0].key === "consumo-detalle-json";

  // Fundación (base + cuello): geometría propia, ver foundation-step.tsx —
  // mismo criterio que isConditionalReveal/isApplianceConsumption para
  // saltarse QuestionGroupStep con un componente a medida.
  const isFoundationGroup = Boolean(currentGroup) && isFoundationStepGroup(currentGroup[0]?.stepGroup);

  // Fase C2 (2026-09-01) -- Interior (terminación de muros/fondo) del
  // configurador integral de Piscina: mismo criterio que isFoundationGroup,
  // geometría/UI propia (2 superficies × 4 terminaciones condicionales +
  // toggle "misma terminación") que no encaja en QuestionGroupStep.
  const isInteriorTermination = Boolean(currentGroup) && isInteriorTerminationStepGroup(currentGroup[0]?.stepGroup);

  // Fase C3 (2026-09-01) -- Excavación automática del configurador
  // integral de Piscina: mismo criterio que isInteriorTermination/
  // isFoundationGroup, geometría/UI propia (dimensiones del hoyo
  // derivadas, sin pedirlas de nuevo) que no encaja en QuestionGroupStep.
  const isExcavation = Boolean(currentGroup) && isExcavationStepGroup(currentGroup[0]?.stepGroup);

  // Fase C4 (2026-09-02) -- Entorno/Borde del configurador integral de
  // Piscina: mismo criterio que isExcavation/isInteriorTermination,
  // geometría/UI propia (área del entorno derivada, sin pedir de nuevo
  // largo/ancho/diámetro) que no encaja en QuestionGroupStep.
  const isEnvironment = Boolean(currentGroup) && isEnvironmentStepGroup(currentGroup[0]?.stepGroup);

  // Fase C5 (2026-09-02) -- Equipamiento hidráulico básico del
  // configurador integral de Piscina: mismo criterio que
  // isEnvironment/isExcavation, geometría/UI propia (sin ilustración a
  // propósito, ver PoolEquipmentStep) que no encaja en QuestionGroupStep.
  const isEquipment = Boolean(currentGroup) && isEquipmentStepGroup(currentGroup[0]?.stepGroup);

  // Fase C6 (2026-09-02) -- Costos del configurador integral de Piscina:
  // mismo criterio que isEquipment/isEnvironment, geometría/UI propia
  // (ver PoolCostsStep) que no encaja en QuestionGroupStep.
  const isCosts = Boolean(currentGroup) && isCostsStepGroup(currentGroup[0]?.stepGroup);

  const stepInitialValues = useMemo(
    () => (currentGroup ? withSuggestedDefaults(currentGroup, answers) : answers),
    [currentGroup, answers]
  );

  const recalculateQuestionKey = moduleSlug ? RECALCULATE_FIELDS[moduleSlug] : undefined;
  const recalculateQuestion = recalculateQuestionKey
    ? questions.find((q) => q.key === recalculateQuestionKey)
    : undefined;
  const recalculateField =
    recalculateQuestion && answers[recalculateQuestion.key] !== undefined
      ? {
          questionKey: recalculateQuestion.key,
          label: recalculateQuestion.label,
          unit: recalculateQuestion.unit,
          value: Number(answers[recalculateQuestion.key]),
        }
      : undefined;

  // Pasos con diagrama, o cualquier paso con el resumen en vivo visible,
  // van a 2 columnas (ver QuestionGroupStep) — el ancho angosto de siempre
  // (pensado para 1 sola columna) los dejaba apretados.
  const showSummaryPanel = !calculation && stepIndex > 0;
  const isWideStep =
    !calculation &&
    (showSummaryPanel ||
      isFoundationGroup ||
      isInteriorTermination ||
      isExcavation ||
      isEnvironment ||
      isEquipment ||
      isCosts ||
      (Boolean(currentGroup) && hasDiagram(currentGroup[0]?.stepGroup)));

  // Fase C1.1 (2026-09-01) — EXCLUSIVO de "piscina-integral": 3 ajustes
  // opt-in, gateados por moduleSlug, que no tocan ningún otro módulo:
  // (a) más ancho de página para dar protagonismo real a la ilustración
  // (VolumeStep ya usa un ratio de columnas propio para este módulo, ver
  // volume-step.tsx); (b) "Paso X de Y" + barra segmentada de WizardHeader
  // ocultos porque PoolConfiguratorLayout ya muestra su propio tracker
  // "Medidas → Estructura" en el mismo paso (2 indicadores de progreso a
  // la vez era redundante/confuso, ver captura mobile); (c) "Tu proyecto"
  // pasa a lg:280px (antes 300px) para ceder ese margen extra a la
  // ilustración, sin desaparecer ni cambiar de comportamiento.
  const isPiscinaIntegral = moduleSlug === "piscina-integral";

  // Fila "← Inicio / ← Atrás / ← Volver al paso N" (ver WizardHeader) —
  // antes era un link suelto siempre a "/", fijo en el primer paso;
  // ahora refleja de dónde vuelve realmente el usuario en cada momento
  // del flujo, mismo criterio en todos los módulos.
  //
  // Fase 4, sprint UX V1.2 (04-ago-2026): en el primer paso, si el módulo
  // se abrió desde una fase de un Plan (planContext.previousPhase, ya
  // resuelto server-side en page.tsx), el "volver" apunta a la fase
  // anterior (o al plan, si es la primera fase) en vez de a "Inicio" — antes
  // ese caso perdía por completo el contexto de plan al volver atrás.
  const back = calculation
    ? { label: `Volver al paso ${steps.length}`, onClick: handleEditAnswers }
    : stepIndex === 0
      ? planContext?.previousPhase
        ? { label: planContext.previousPhase.label, href: planContext.previousPhase.href }
        : { label: "Inicio", href: "/" }
      : { label: "Atrás", onClick: handleBack };

  return (
    <div
      className={`mx-auto px-6 pt-8 pb-20 ${
        isWideStep ? (isPiscinaIntegral ? "max-w-5xl" : "max-w-4xl") : "max-w-2xl"
      }`}
    >
      <WizardHeader
        moduleName={moduleName}
        step={!calculation && !isPiscinaIntegral ? { index: stepIndex, total: steps.length } : undefined}
        back={back}
        resultMode={Boolean(calculation)}
      />

      {/* BUG-007: borrador autoguardado a la espera de confirmación — se
          muestra en vez del contenido del paso hasta que el usuario elija
          Continuar o Comenzar de nuevo (ver WizardResumeGate). */}
      {!calculation && resumeDraft && (
        <WizardResumeGate onResume={handleResumeDraft} onDiscard={handleDiscardDraft} />
      )}

      {isAdvancedMode && !calculation && !resumeDraft && stepIndex === 0 && (
        <div className="mb-6 rounded-2xl p-4 bg-danger-tint border-2 border-danger">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-danger" strokeWidth={2.75} />
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-danger">Cálculos especiales: </span>
              este cálculo es una pieza suelta de tu proyecto, no un diseño estructural completo. Úsalo
              junto con la especificación de tu plano o maestro/constructor, no en su reemplazo.
            </p>
          </div>
        </div>
      )}

      {/* El panel "Tu proyecto" se vuelve columna lateral recién en lg
          (1024px), un peldaño DESPUÉS del split diagrama/formulario (md,
          768px) — ver Fase B responsive, 2026-08-02. No es una
          inconsistencia: son 2 regiones visuales distintas con
          necesidades de espacio distintas. A los 768px el contenido del
          paso (formulario + diagrama) ya tiene prioridad de espacio;
          sumarle una tercera columna de 300px ahí lo dejaba apretado
          (probado en vivo). El criterio queda así, documentado una sola
          vez acá: contenido del paso -> md; panel secundario persistente
          -> lg, aplicado igual en TODOS los módulos, no una excepción
          puntual. */}
      {!calculation && !resumeDraft && (
        <div
          className={
            showSummaryPanel
              ? `lg:grid lg:gap-8 lg:items-start ${
                  isPiscinaIntegral ? "lg:grid-cols-[1fr_260px]" : "lg:grid-cols-[1fr_300px]"
                }`
              : undefined
          }
        >
        <div>
          {isConditionalReveal ? (
            <ConditionalRevealStep
              key={currentGroup.map((q) => q.id).join("-")}
              selectQuestion={currentGroup[0]}
              numberQuestion={currentGroup[1]}
              initialValues={stepInitialValues}
              onAnswer={handleGroupAnswer}
            />
          ) : isApplianceConsumption ? (
            <ApplianceConsumptionStep
              key={currentGroup.map((q) => q.id).join("-")}
              detailQuestion={currentGroup[0]}
              totalQuestion={currentGroup[1]}
              onAnswer={handleGroupAnswer}
            />
          ) : isFoundationGroup ? (
            <FoundationStep
              key={currentGroup.map((q) => q.id).join("-")}
              questions={currentGroup}
              initialValues={stepInitialValues}
              onAnswer={handleGroupAnswer}
              onSaveForLater={handleSaveForLater}
              focusFieldKey={focusFieldKey}
            />
          ) : isInteriorTermination ? (
            <InteriorTerminationStep
              key={currentGroup.map((q) => q.id).join("-")}
              questions={currentGroup}
              initialValues={stepInitialValues}
              onAnswer={handleGroupAnswer}
              onSaveForLater={handleSaveForLater}
            />
          ) : isExcavation ? (
            <PoolExcavationStep
              key={currentGroup.map((q) => q.id).join("-")}
              questions={currentGroup}
              initialValues={stepInitialValues}
              onAnswer={handleGroupAnswer}
              onSaveForLater={handleSaveForLater}
            />
          ) : isEnvironment ? (
            <PoolEnvironmentStep
              key={currentGroup.map((q) => q.id).join("-")}
              questions={currentGroup}
              initialValues={stepInitialValues}
              onAnswer={handleGroupAnswer}
              onSaveForLater={handleSaveForLater}
            />
          ) : isEquipment ? (
            <PoolEquipmentStep
              key={currentGroup.map((q) => q.id).join("-")}
              questions={currentGroup}
              initialValues={stepInitialValues}
              onAnswer={handleGroupAnswer}
              onSaveForLater={handleSaveForLater}
            />
          ) : isCosts ? (
            <PoolCostsStep
              key={currentGroup.map((q) => q.id).join("-")}
              questions={currentGroup}
              initialValues={stepInitialValues}
              moduleId={moduleId}
              onAnswer={handleGroupAnswer}
              onSaveForLater={handleSaveForLater}
            />
          ) : currentGroup.length > 1 || hasAreaToggle(currentGroup[0].stepGroup) ? (
            <QuestionGroupStep
              key={currentGroup.map((q) => q.id).join("-")}
              questions={currentGroup}
              initialValues={stepInitialValues}
              onAnswer={handleGroupAnswer}
              focusFieldKey={focusFieldKey}
              forcedInitialArea={
                forcedInitialArea !== undefined &&
                stepIndex === 0 &&
                hasAreaToggle(currentGroup[0].stepGroup) &&
                !currentGroup.some((q) => stepInitialValues[q.key])
                  ? forcedInitialArea
                  : undefined
              }
              onSaveForLater={handleSaveForLater}
            />
          ) : (
            <QuestionStep
              key={currentGroup[0].id}
              question={currentGroup[0]}
              initialValue={stepInitialValues[currentGroup[0].key]}
              onAnswer={handleAnswer}
              onSkip={
                moduleSlug && OPTIONAL_QUESTION_KEYS[moduleSlug]?.includes(currentGroup[0].key)
                  ? handleSkip
                  : undefined
              }
              moduleSlug={moduleSlug}
              allQuestions={questions}
              answers={answers}
            />
          )}

          {isPending && <p className="mt-6 text-sm text-ink-muted">Calculando…</p>}
          {error && <p className="mt-6 text-sm text-safety">{error}</p>}

          {/* "Volver a la pregunta anterior" (stepIndex > 0) se sacó de acá:
              ahora es el mismo "← Atrás" del WizardHeader (ver `back` más
              arriba) — dos botones para la misma acción era duplicado. */}
          {/* Paso 1: no hay pregunta anterior DENTRO del módulo, pero antes
              la única salida si el usuario entró al módulo equivocado era
              el link "Inicio" de arriba (te saca de todo el contexto).
              router.back() vuelve exactamente a la pantalla real de origen
              (buscador, /grupos/[slug], /plan/[slug], etc.) — no se puede
              armar un href fijo porque hay demasiados puntos de entrada
              distintos (ver comentario del link "Inicio" más arriba). Sin
              historial detectable (pestaña nueva, link pegado), no se
              muestra nada acá y "Inicio" sigue siendo el respaldo. */}
          {stepIndex === 0 && canGoBack && !isPending && (
            <button
              onClick={() => router.back()}
              className="mt-8 text-sm font-medium underline underline-offset-4 text-ink-muted"
            >
              Volver
            </button>
          )}
        </div>

        {showSummaryPanel && (
          <div className="mt-8 lg:mt-0">
            <LiveSummaryPanel items={answersSummary} onEditItem={handleEditField} />
          </div>
        )}
        </div>
      )}

      {calculation && (
        <ResultScreen
          moduleId={moduleId}
          moduleSlug={moduleSlug}
          moduleName={moduleName}
          categoryName={categoryName}
          answersSummary={answersSummary}
          answers={answers}
          results={calculation.results}
          infoResults={calculation.infoResults}
          norms={calculation.norms}
          variables={calculation.variables}
          onRestart={handleRestart}
          guide={guide}
          approvedPhotos={approvedPhotos ?? []}
          planContext={planContext}
          recalculateField={recalculateField}
          onRecalculate={handleRecalculate}
          onEditAnswers={handleEditAnswers}
          onEditField={handleEditField}
          heroResultKey={moduleSlug ? HERO_RESULT_KEYS[moduleSlug] : undefined}
          recipeGroups={moduleSlug ? RECIPE_GROUPS[moduleSlug] : undefined}
          dosificacionGroups={moduleSlug ? DOSIFICACION_GROUPS[moduleSlug] : undefined}
          excludeFromListKeys={moduleSlug ? EXCLUDE_FROM_LIST_KEYS[moduleSlug] : undefined}
          resultGroups={moduleSlug ? RESULT_GROUPS[moduleSlug] : undefined}
          secondaryHeroResultKeys={moduleSlug ? SECONDARY_HERO_RESULT_KEYS[moduleSlug] : undefined}
          costosConfig={moduleSlug ? COSTOS_CONFIG[moduleSlug] : undefined}
          consolidateNotesKeys={moduleSlug ? CONSOLIDATE_NOTES_KEYS[moduleSlug] : undefined}
          refuerzoConfig={moduleSlug ? REFUERZO_CONFIG[moduleSlug] : undefined}
          heroPosition={moduleSlug ? HERO_POSITIONS[moduleSlug] : undefined}
        />
      )}
    </div>
  );
}
