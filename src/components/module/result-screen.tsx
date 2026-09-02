"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Copy, FolderPlus, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { buildCalculationPrompt, buildRestartLabel } from "@/lib/prompt-generator";
import type { CalculationResult, InfoResult } from "@/lib/formula-engine";
import type { CalculateModuleResult, NormSummary } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";
import { createSavedProjectAction } from "@/app/(app)/proyectos/actions";
import { togglePhaseCompletionAction } from "@/app/(app)/plan/[slug]/actions";
import { PENDING_PROJECT_KEY } from "@/lib/pending-project";
import { NormsDisclaimer } from "./norms-disclaimer";
import { PricedResults, computeApproxTotal } from "./priced-results";
import { ResultHero } from "./result-hero";
import { GuideSection, type ModuleGuideData } from "./guide-section";
import { PhotoGallery } from "./photo-gallery";
import { RecalculateField } from "./recalculate-field";
import { LiveSummaryPanel, type SummaryItem } from "./live-summary-panel";
import { ExecutionAdvisorPanel } from "./execution-advisor-panel";
import { getExecutionAdvisorReport, type InformeEjecucionUI } from "@/lib/execution-advisor/action";
import { RecipeCard } from "./recipe-card";
import { DosificacionCard } from "./dosificacion-card";
import { RefuerzoCard } from "./refuerzo-card";
import { TechnicalNotesSection } from "./technical-notes-section";
import type { RecipeGroupConfig, DosificacionGroupConfig, RefuerzoConfig, ResultGroupConfig } from "./module-visual-config";
import { formatQuantity } from "@/lib/format-number";
import { pluralizeUnit } from "@/lib/pluralize";
import type { WizardAnswers } from "./types";

// Aplica el precio de referencia (sugerencia editable) como unitPrice
// inicial a cada línea de resultado que aún no tiene uno propio. `previous`
// trae los precios YA ingresados por el usuario en el cálculo anterior
// (keyed por Formula.key, que es estable — no cambia al recalcular con un
// valor de pregunta distinto), para que un recálculo (ver
// RecalculateField) no borre un precio ya tipeado aunque la cantidad haya
// cambiado.
function seedPrices(results: CalculationResult[], previous: CalculationResult[]): CalculationResult[] {
  const previousPriceByKey = new Map(previous.map((r) => [r.key, r.unitPrice]));
  return results.map((r) => {
    if (!r.materialName) return r;
    const preserved = previousPriceByKey.get(r.key);
    const unitPrice = preserved != null ? preserved : r.unitPrice ?? r.referencePrice ?? null;
    return { ...r, unitPrice };
  });
}

export function ResultScreen({
  moduleId,
  moduleSlug,
  moduleName,
  categoryName,
  answersSummary,
  answers,
  results,
  infoResults,
  norms,
  variables,
  onRestart,
  guide,
  approvedPhotos,
  planContext,
  recalculateField,
  onRecalculate,
  onEditAnswers,
  onEditField,
  heroResultKey,
  recipeGroups,
  dosificacionGroups,
  excludeFromListKeys,
  consolidateNotesKeys,
  refuerzoConfig,
  heroPosition,
  resultGroups,
  secondaryHeroResultKeys,
}: {
  moduleId: string;
  // Asesor de Ejecución (Fase 0/4, 04-ago-2026): junto con `answers`, es
  // lo mínimo que hace falta para poder pedir el informe del asesor
  // (ver getExecutionAdvisorReport) — decisión de arquitectura: ResultScreen
  // NO recibe el motor ni el loader, solo estos 2 datos ya existentes en
  // ModuleWizard, pasados hacia abajo (data threading, sin tocar ningún
  // componente del wizard). Opcional: la vista previa de /admin no lo pasa.
  moduleSlug?: string;
  moduleName: string;
  categoryName: string;
  answersSummary: SummaryItem[];
  // Respuestas crudas (WizardAnswers, keyed por Question.key) — a
  // diferencia de `answersSummary` (formateado para mostrar, con labels
  // en vez de option keys), esto es lo que el Asesor de Ejecución
  // necesita para comparar respuestas reales contra las reglas cargadas.
  answers?: WizardAnswers;
  results: CalculationResult[];
  infoResults: InfoResult[];
  norms: NormSummary[];
  variables: CalculateModuleResult["variables"];
  onRestart: () => void;
  guide?: ModuleGuideData | null;
  approvedPhotos?: { id: string; url: string }[];
  // Sprint UX "Construir una piscina" (03-ago-2026), ítem 4: `nextPhase`
  // (opcional, ya resuelto server-side) habilita el botón principal
  // "Continuar con: <fase>" — ver handleSaveProject. Sin `nextPhase` (fase
  // sin continuación, ej. la última del plan, o módulo usado fuera de un
  // plan) el comportamiento queda idéntico al de siempre: un solo botón
  // "Guardar como proyecto".
  planContext?: { slug: string; phaseId: string; shape?: string; nextPhase?: { name: string; href: string | null } };
  // Campo opcional editable desde el resultado (ej. espesor de Radier) que
  // dispara un recálculo completo vía onRecalculate — ver
  // RECALCULATE_FIELDS en module-wizard.tsx. Ninguno de los dos viene
  // seteado para la mayoría de los módulos, así que RecalculateField no se
  // renderiza.
  recalculateField?: { questionKey: string; label: string; unit: string | null; value: number };
  onRecalculate?: (patch: Record<string, string | number>) => Promise<void>;
  // Vuelve al wizard desde el primer paso, con `answers` intacto (cada
  // pregunta se prellena sola vía stepInitialValues) — a diferencia de
  // onRestart, que empieza de cero. Transversal a los 57 módulos.
  onEditAnswers: () => void;
  // Salta directo al paso de una pregunta puntual (ver LiveSummaryPanel,
  // "Cambiar" en una línea de "Con estos datos calculamos") — a
  // diferencia de onEditAnswers, no vuelve al paso 1.
  onEditField: (questionKey: string) => void;
  // Fuerza qué Formula.key ocupa la tarjeta hero (ver HERO_RESULT_KEYS en
  // module-wizard.tsx) — usado cuando el dato más relevante para el
  // usuario no es el primer resultado priced (ej. Piscina: volumen de agua
  // antes que hormigón). Sin este prop, se mantiene el criterio de
  // siempre (primer resultado no-secundario CON materialName).
  heroResultKey?: string;
  // Fase 9B (04-ago-2026): grupos "cantidad base + ingredientes" que se
  // pintan como RecipeCard en vez de aparecer en la lista genérica de
  // PricedResults (ver RECIPE_GROUPS en module-visual-config.ts). Sin
  // este prop (la mayoría de los módulos), el comportamiento es idéntico
  // al de siempre — ningún resultado se saca de la lista genérica.
  recipeGroups?: RecipeGroupConfig[];
  // Ver DosificacionGroupConfig — igual criterio que recipeGroups, pero
  // renderizado ANTES de la lista genérica (ver jerarquía visual: hormigón
  // recomendado -> dosificación -> volumen -> materiales -> betonera).
  dosificacionGroups?: DosificacionGroupConfig[];
  // Ver EXCLUDE_FROM_LIST_KEYS — Formula.key que nunca deben aparecer en
  // la lista genérica (ej. un resultado ya mostrado en su propia tarjeta
  // hero, para no duplicarlo).
  excludeFromListKeys?: string[];
  // Ver CONSOLIDATE_NOTES_KEYS — Formula.key cuya nota individual se oculta
  // de su tarjeta (ver PricedResults' suppressNoteForKeys) y se muestra en
  // cambio consolidada en un solo TechnicalNotesSection, más abajo.
  consolidateNotesKeys?: string[];
  // Ver RefuerzoConfig — arma la RefuerzoCard a partir de 2 InfoResult
  // (estado + explicación) más una nota estática. Sin este prop (la
  // mayoría de los módulos), no se renderiza nada nuevo.
  refuerzoConfig?: RefuerzoConfig;
  // Ver HERO_POSITIONS — dónde va ResultHero. Default "top" (comportamiento
  // de siempre); "beforeMaterials" lo mueve justo antes de la lista de
  // materiales (después de dosificación/refuerzo, ver jerarquía de Radier).
  heroPosition?: "top" | "beforeMaterials";
  // Fase C4.2 (2026-09-02) — ver RESULT_GROUPS en module-visual-config.ts.
  // Sin este prop (la mayoría de los módulos), la lista genérica de
  // PricedResults sigue siendo una sola lista plana, sin cambios.
  resultGroups?: ResultGroupConfig[];
  // Fase C4.2 — ver SECONDARY_HERO_RESULT_KEYS. Sin este prop, no se
  // renderiza ninguna tarjeta adicional.
  secondaryHeroResultKeys?: string[];
}) {
  const router = useRouter();
  const [promptOpen, setPromptOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // "saving-next"/"saving-plan" distinguen cuál de los 2 botones disparó el
  // guardado (sprint UX 03-ago-2026, ítem 4) — solo para mostrar el label de
  // "Guardando…" en el botón correcto; ambos quedan deshabilitados mientras
  // cualquiera de los dos está en curso.
  const [saveState, setSaveState] = useState<"idle" | "saving-next" | "saving-plan" | "error">("idle");
  const isSaving = saveState === "saving-next" || saveState === "saving-plan";

  // Asesor de Ejecución (Fase 4, 04-ago-2026): se evalúa UNA sola vez acá,
  // al montar la pantalla de resultado, con el objeto de respuestas ya
  // completo — nunca desde el wizard (ver decisión de Fase 0). Para los
  // ~56 módulos sin Asesor configurado, getExecutionAdvisorReport
  // devuelve null y el panel no renderiza nada — no hace falta un
  // `if (moduleSlug === "excavacion")` acá, la ausencia de datos ya
  // resuelve el caso genérico.
  const [informeEjecucion, setInformeEjecucion] = useState<InformeEjecucionUI | null>(null);
  useEffect(() => {
    if (!moduleSlug || !answers) return;
    let cancelado = false;
    getExecutionAdvisorReport(moduleSlug, answers).then((informe) => {
      if (!cancelado) setInformeEjecucion(informe);
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleSlug]);
  // Precarga el precio de referencia (sugerencia editable) como unitPrice
  // inicial, para que lo que se ve en pantalla sea lo mismo que se guarda
  // si el usuario no lo edita.
  const [seededResults, setSeededResults] = useState<CalculationResult[]>(() => seedPrices(results, []));
  const [pricedResults, setPricedResults] = useState<CalculationResult[]>(seededResults);

  // Si `results` cambia de referencia (un recálculo real, ver
  // RecalculateField), vuelve a sembrar seededResults/pricedResults con
  // las cantidades nuevas — preservando cualquier precio ya tipeado por
  // Formula.key (ver seedPrices). Sin esto, ambos quedarían congelados con
  // las cantidades del primer cálculo para siempre.
  const pricedResultsRef = useRef(pricedResults);
  useEffect(() => {
    pricedResultsRef.current = pricedResults;
  }, [pricedResults]);

  const resultsRef = useRef(results);
  useEffect(() => {
    if (results === resultsRef.current) return;
    resultsRef.current = results;
    const next = seedPrices(results, pricedResultsRef.current);
    setSeededResults(next);
    setPricedResults(next);
  }, [results]);

  const prompt = buildCalculationPrompt({ moduleName, categoryName, answersSummary, results, infoResults, norms });

  // Mismo criterio que el "featured" de PricedResults (ver ese archivo):
  // el primer resultado no-secundario es el dato protagonista. Si ese
  // resultado no tiene materialName (algún módulo sin materiales físicos,
  // ej. solo entrega una cantidad informativa), no se arma la tarjeta
  // protagonista — ResultHero asume un material real.
  const heroResult = heroResultKey
    ? (pricedResults.find((r) => r.key === heroResultKey) ?? null)
    : (pricedResults.find((r) => !r.isSecondary) ?? null);
  const otherMaterialNames = pricedResults
    .filter((r) => !r.isSecondary && r.materialName && r.key !== heroResult?.key)
    .map((r) => r.materialName!.toLowerCase());
  const { total: approxTotal, anyPriced } = computeApproxTotal(pricedResults);
  // Con heroResultKey explícito, el módulo decidió a propósito destacar un
  // resultado informativo (sin materialName/precio) — no se exige
  // materialName como en el criterio genérico.
  const showsHero = heroResultKey ? Boolean(heroResult) : Boolean(heroResult?.materialName);
  // PricedResults agranda el primer resultado no-secundario de su propia
  // lista (ver `featured` ahí) — solo hay que ocultar ese agrandado cuando
  // es EXACTAMENTE el mismo dato que ya se ve gigante en ResultHero. Con
  // heroResultKey (Piscina: hero=volumen de agua, primero de la lista=
  // hormigón), son dos resultados distintos — hormigón no se duplica en
  // ningún lado, así que conserva su propio destaque en la lista.
  const firstListResult = pricedResults.find((r) => !r.isSecondary);
  const hidesFeaturedInList = showsHero && heroResult?.key === firstListResult?.key;

  // Fase 9B: arma cada RecipeCard con los resultados reales (sin volver a
  // calcular nada, solo mirar seededResults por key) y descarta el grupo
  // completo si el resultado primario no existe (ej. camino premezclado
  // de Radier, donde estas Formula ni se calculan por su `condition`) —
  // así no hace falta ningún chequeo de moduleSlug acá, la ausencia de
  // datos ya resuelve el caso genérico, mismo criterio que ya usa
  // ExecutionAdvisorPanel más abajo.
  const recipeSections = (recipeGroups ?? [])
    .map((group) => ({
      group,
      primary: seededResults.find((r) => r.key === group.primaryKey),
      items: group.itemKeys.map((k) => seededResults.find((r) => r.key === k)).filter((r) => r !== undefined),
    }))
    .filter((section) => section.primary !== undefined);
  // Mismo criterio que recipeSections, para la DosificacionCard (ver
  // comentario de dosificacionGroups) — un grupo sin resultado base
  // (ej. camino premezclado, donde dosif_* ni se calculan) se descarta solo.
  const dosificacionSections = (dosificacionGroups ?? [])
    .map((group) => ({
      group,
      items: group.itemKeys.map((k) => seededResults.find((r) => r.key === k)).filter((r): r is CalculationResult => r !== undefined),
    }))
    .filter((section) => section.items.length === section.group.itemKeys.length);

  // Fase 5 (Radier): arma la RefuerzoCard a partir de 2 InfoResult (estado
  // + explicación, ver RefuerzoConfig) — se descarta sola si el módulo no
  // configuró refuerzoConfig o si esas keys no vinieron en infoResults.
  const refuerzoData = refuerzoConfig
    ? {
        estado: infoResults.find((i) => i.key === refuerzoConfig.estadoKey)?.value,
        explicacion: infoResults.find((i) => i.key === refuerzoConfig.explicacionKey)?.value,
      }
    : null;

  const recipeKeys = new Set([
    ...recipeSections.flatMap((s) => [s.group.primaryKey, ...s.group.itemKeys]),
    ...dosificacionSections.flatMap((s) => s.group.itemKeys),
    ...(excludeFromListKeys ?? []),
  ]);
  const listResults = recipeKeys.size > 0 ? seededResults.filter((r) => !recipeKeys.has(r.key)) : seededResults;

  // Fase C4.2 — resultados de la tarjeta secundaria (ver
  // secondaryHeroResultKeys/SECONDARY_HERO_RESULT_KEYS), en el orden
  // declarado por el módulo, descartando los que no calcularon (mismo
  // criterio de "ausencia de datos resuelve el caso" que recipeSections).
  const secondaryHeroResults = (secondaryHeroResultKeys ?? [])
    .map((key) => seededResults.find((r) => r.key === key))
    .filter((r): r is CalculationResult => r !== undefined);

  // Fase C4.2 — arma cada sección de `resultGroups` filtrando listResults
  // por sus keys (preserva el orden de Formula.order que ya trae
  // listResults, el grupo no reordena) y descarta la sección si quedó
  // vacía (ej. "Interior" cuando el usuario eligió "Sin calcular" para
  // ambas superficies). `ungroupedResults` es la red de seguridad:
  // cualquier Formula.key de listResults que no aparezca en NINGÚN grupo
  // (una Formula nueva agregada sin clasificar) sigue mostrándose, en vez
  // de desaparecer en silencio.
  const groupedSections = (resultGroups ?? [])
    .map((group) => ({ group, items: listResults.filter((r) => group.keys.includes(r.key)) }))
    .filter((section) => section.items.length > 0);
  const groupedKeysSet = new Set((resultGroups ?? []).flatMap((g) => g.keys));
  const ungroupedResults = resultGroups ? listResults.filter((r) => !groupedKeysSet.has(r.key)) : listResults;
  // Nota: se probó ocultar infoResults[0] de la lista de abajo (ya que se
  // repite en el subtítulo de ResultHero), pero en módulos donde
  // infoResults[0] es solo la mitad de un par relacionado (ej. Piscina:
  // "Espesor de los muros" / "Espesor del fondo", ambos eco de respuestas
  // del usuario, no una recomendación como el tipo de hormigón de Radier)
  // esconder solo uno de los dos se ve incoherente — se probó en vivo con
  // Piscina circular durante la Fase 3. Se prefiere la pequeña duplicación
  // (mismo dato en el subtítulo Y en su tarjeta) antes que esa asimetría.

  // Consumo eléctrico: la Variable "consumo_detalle_json" (si existe en este
  // módulo) trae el desglose por artefacto como JSON — no pasa por el motor
  // de fórmulas (que no soporta listas/arrays), se parsea acá directo para
  // mostrar una tabla. En cualquier otro módulo esta variable no existe y
  // consumptionBreakdown queda null, sin afectar nada.
  const consumptionBreakdownRaw = variables["consumo_detalle_json"];
  const consumptionBreakdown: { label: string; watts: number; hoursPerDay: number; kwhMes: number }[] | null =
    typeof consumptionBreakdownRaw === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(consumptionBreakdownRaw);
            return Array.isArray(parsed) ? parsed : null;
          } catch {
            return null;
          }
        })()
      : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // PricedResults reconstruye el array COMPLETO a partir de lo que recibe
  // en `results` (ver ese archivo) — como acá le pasamos `listResults`
  // (sin los resultados de recipeGroups, ver más abajo), no se puede usar
  // setPricedResults directo: perdería esos resultados de `pricedResults`
  // para siempre (rompería el total guardado y el proyecto guardado). Se
  // actualiza por key, dejando intactos los que PricedResults nunca vio
  // (siempre es un no-op cuando no hay recipeGroups — mismo resultado que
  // setPricedResults directo).
  const handlePricesChange = (updatedVisible: CalculationResult[]) => {
    const byKey = new Map(updatedVisible.map((r) => [r.key, r]));
    setPricedResults((prev) => prev.map((r) => byKey.get(r.key) ?? r));
  };

  // `destination` (sprint UX 03-ago-2026, ítem 4): "next-phase" salta
  // directo al módulo de la fase siguiente (ver planContext.nextPhase.href,
  // ya resuelto server-side) cuando es posible; "plan" es el comportamiento
  // de siempre (vuelve a /plan/[slug] con el banner "Sigue con: <fase>").
  // Si nextPhase.href es null (fase siguiente ambigua, 2+ módulos posibles,
  // ver resolveNextPhase en page.tsx) "next-phase" cae al mismo destino que
  // "plan" — evita duplicar acá el selector de módulos de plan-view.tsx.
  const handleSaveProject = async (destination: "next-phase" | "plan" = "plan") => {
    setSaveState(destination === "next-phase" ? "saving-next" : "saving-plan");
    const result: CalculateModuleResult = { results: pricedResults, infoResults, variables, norms };

    try {
      const response = await createSavedProjectAction({
        moduleId,
        moduleName,
        answersSummary,
        result,
        planContext: planContext ? { planSlug: planContext.slug, phaseId: planContext.phaseId } : undefined,
      });

      if (response.error) {
        window.localStorage.setItem(
          PENDING_PROJECT_KEY,
          JSON.stringify({ moduleId, moduleName, answersSummary, result })
        );
        router.push(`/login?callbackUrl=${encodeURIComponent("/proyectos/guardar-pendiente")}`);
        return;
      }

      // Si el módulo se abrió desde una fase de un plan, guardar la
      // fórmula ES la señal natural de "fase lista" — marca la fase.
      if (planContext) {
        await togglePhaseCompletionAction(planContext.slug, planContext.phaseId, true);

        if (destination === "next-phase" && planContext.nextPhase?.href) {
          router.push(planContext.nextPhase.href);
          return;
        }

        // Destino de siempre: vuelve al plan (con la fase siguiente
        // resaltada) en vez de dejar al usuario en /proyectos/[id] sin un
        // camino de vuelta.
        const shapeQuery = planContext.shape ? `&shape=${encodeURIComponent(planContext.shape)}` : "";
        router.push(`/plan/${planContext.slug}?justCompleted=${planContext.phaseId}${shapeQuery}`);
        return;
      }

      router.push(`/proyectos/${response.id}`);
    } catch {
      setSaveState("error");
    }
  };

  // Fase 5 (Radier): ResultHero puede ir arriba de todo (default, resto de
  // los módulos) o justo antes de "Materiales" (ver HERO_POSITIONS) — se
  // arma UNA vez acá y se inserta en el punto que corresponda, para no
  // duplicar el JSX.
  const heroElement = showsHero && heroResult && (
    <ResultHero
      moduleName={moduleName}
      result={heroResult}
      otherMaterialNames={otherMaterialNames}
      primaryInfo={infoResults[0] ?? null}
      total={anyPriced ? approxTotal : null}
    />
  );

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">Resultado</p>
      <h2 className="font-display text-[22px] font-semibold tracking-tight mb-6">
        Esto es lo que necesitas
      </h2>

      {heroPosition !== "beforeMaterials" && heroElement}

      {/* Fase C4.2 — tarjeta secundaria de datos destacados (ver
          secondaryHeroResultKeys) justo debajo del hero: hoy solo volumen
          de agua en Piscina (m³ + L), preparado para sumar más KPIs sin
          rediseño (ver informe C4.2, sección "no ampliar el alcance a un
          dashboard de KPIs todavía"). Ausente para el resto de los
          módulos. */}
      {secondaryHeroResults.length > 0 && (
        <div className="rounded-2xl p-5 mb-3 bg-white border border-border">
          <div className="grid gap-2">
            {secondaryHeroResults.map((r) => {
              // Fase C4.2 (ajuste final de presentación) — SOLO en esta
              // tarjeta (secondaryHeroResultKeys), los litros se muestran
              // redondeados al entero más cercano (ej. "42.412 L" en vez
              // de "42.411,5 L"). No toca `r.value` (el motor/`results`
              // real sigue con el decimal completo, disponible para
              // cualquier otro consumidor — proyecto guardado, prompt de
              // IA, etc.), no agrega parámetros a `formatQuantity` (queda
              // igual para los otros 56 módulos) — es puramente el
              // redondeo de DISPLAY de este bloque, gateado por
              // `r.unit === "L"` (genérico a cualquier módulo futuro que
              // use secondaryHeroResultKeys con litros, no hardcodeado a
              // Piscina).
              const displayValue = r.unit === "L" ? Math.round(r.value) : r.value;
              return (
                <div key={r.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-medium text-[15px]">{r.label}</span>
                  <span className="font-display text-lg font-semibold text-right">
                    {formatQuantity(displayValue)} <span className="text-sm font-body text-ink-muted">{pluralizeUnit(displayValue, r.unit)}</span>
                  </span>
                </div>
              );
            })}
          </div>
          {secondaryHeroResults[0]?.note && (
            <p className="mt-2 text-xs text-ink-faint">{secondaryHeroResults[0].note}</p>
          )}
        </div>
      )}

      {recalculateField && onRecalculate && (
        <RecalculateField
          label={recalculateField.label}
          unit={recalculateField.unit}
          value={recalculateField.value}
          onRecalculate={(newValue) => onRecalculate({ [recalculateField.questionKey]: newValue })}
        />
      )}

      {/* Fase 5 (Radier): "estado"/"explicación" del refuerzo se consumen
          por separado (ver refuerzoData + RefuerzoCard, más abajo) — se
          sacan del bloque genérico de infoResults para no mostrarlas dos
          veces. Ningún otro módulo usa estas keys, así que este filtro es
          un no-op para el resto. */}
      {infoResults.filter(
        (info) => info.key !== refuerzoConfig?.estadoKey && info.key !== refuerzoConfig?.explicacionKey
      ).length > 0 && (
        <div className="grid gap-3 mb-3">
          {infoResults
            .filter((info) => info.key !== refuerzoConfig?.estadoKey && info.key !== refuerzoConfig?.explicacionKey)
            .map((info) => (
              <div key={info.key} className="rounded-2xl p-5 bg-white border border-border">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-medium text-[15px]">{info.label}</span>
                  <span className="font-display text-lg font-semibold text-right">
                    {String(info.value)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {consumptionBreakdown && consumptionBreakdown.length > 0 && (
        <div className="rounded-2xl p-5 mb-3 bg-white border border-border">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
            Desglose por artefacto
          </p>
          <div className="grid gap-2">
            {[...consumptionBreakdown]
              .sort((a, b) => b.kwhMes - a.kwhMes)
              .map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{item.label}</span>
                  <span className="font-mono text-ink-muted shrink-0">{item.kwhMes.toFixed(1)} kWh/mes</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {dosificacionSections.map(({ group, items }) => (
        <DosificacionCard
          key={group.title}
          title={group.title}
          subtitle={group.subtitle}
          baseLabel={group.baseLabel}
          baseValue={group.baseValue}
          baseUnit={group.baseUnit}
          items={items}
          tip={group.tip}
          disclaimer={group.disclaimer}
          sourceLabel={group.sourceLabel}
        />
      ))}

      {refuerzoConfig && refuerzoData?.estado !== undefined && refuerzoData?.explicacion !== undefined && (
        <RefuerzoCard
          title={refuerzoConfig.title}
          materialLabel={refuerzoConfig.materialLabel}
          estado={String(refuerzoData.estado)}
          explicacion={String(refuerzoData.explicacion)}
          nota={refuerzoConfig.nota}
        />
      )}

      {heroPosition === "beforeMaterials" && heroElement}

      {resultGroups ? (
        // Fase C4.2 — en vez de UNA lista plana con los 15-20 resultados
        // de C1-C4 mezclados (el hallazgo principal de la auditoría
        // global), cada `resultGroups` section es su propia PricedResults
        // con un encabezado propio — mismo componente, mismos datos, sin
        // "hideFeatured"/tratamiento gigante repetido por sección (ya hay
        // UN protagonista, el hero de arriba) y sin total por sección
        // (Costos no existe todavía, no hay nada que sumar). Funciona
        // igual en mobile/desktop: son encabezados + tarjetas, no una
        // interacción nueva — un usuario ubica la partida por el
        // encabezado, sin tener que abrir/cerrar nada.
        <>
          {groupedSections.map(({ group, items }) => (
            <div key={group.title} className="mb-5">
              <p className="font-mono text-xs uppercase tracking-wider text-ink-faint mb-2">{group.title}</p>
              <PricedResults
                results={items}
                onPricesChange={handlePricesChange}
                hideFeatured
                hideTotal
                suppressNoteForKeys={consolidateNotesKeys}
              />
            </div>
          ))}
          {ungroupedResults.length > 0 && (
            <PricedResults
              results={ungroupedResults}
              onPricesChange={handlePricesChange}
              hideFeatured={hidesFeaturedInList}
              hideTotal={showsHero && anyPriced}
              suppressNoteForKeys={consolidateNotesKeys}
            />
          )}
        </>
      ) : (
        <PricedResults
          results={listResults}
          onPricesChange={handlePricesChange}
          hideFeatured={hidesFeaturedInList}
          hideTotal={showsHero && anyPriced}
          suppressNoteForKeys={consolidateNotesKeys}
        />
      )}

      {consolidateNotesKeys && (
        <TechnicalNotesSection results={listResults.filter((r) => consolidateNotesKeys.includes(r.key))} />
      )}

      {recipeSections.map(({ group, primary, items }) => (
        <RecipeCard key={group.primaryKey} title={group.title} primary={primary!} items={items} />
      ))}

      {informeEjecucion && <ExecutionAdvisorPanel informe={informeEjecucion} />}

      <NormsDisclaimer norms={norms} />

      {guide && <GuideSection guide={guide} />}

      <PhotoGallery photos={approvedPhotos ?? []} />

      <div className="mt-8">
        <LiveSummaryPanel items={answersSummary} onEditItem={onEditField} title="Con estos datos calculamos" />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {/* Sprint UX "Construir una piscina" (03-ago-2026), ítem 4: con
            nextPhase resuelta, la acción principal pasa a ser "Continuar con
            la fase siguiente" (para que el plan se sienta un proyecto
            continuo, no cálculos sueltos) y "Guardar proyecto" queda como
            acción secundaria — mismo guardado de siempre, solo cambia el
            destino final. Sin nextPhase (última fase del plan, o módulo
            usado fuera de un plan) el botón único de siempre no cambia. */}
        {planContext?.nextPhase ? (
          <>
            <button
              onClick={() => handleSaveProject("next-phase")}
              disabled={isSaving}
              className="rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-action disabled:opacity-50"
            >
              {saveState === "saving-next" ? (
                "Guardando…"
              ) : (
                <>
                  Continuar con: {planContext.nextPhase.name}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              onClick={() => handleSaveProject("plan")}
              disabled={isSaving}
              className="rounded-full px-6 py-3 text-sm font-medium border border-ink flex items-center gap-2 disabled:opacity-50"
            >
              <FolderPlus className="w-4 h-4" />
              {saveState === "saving-plan" ? "Guardando…" : "Guardar proyecto"}
            </button>
          </>
        ) : (
          <button
            onClick={() => handleSaveProject("plan")}
            disabled={isSaving}
            className="rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-action disabled:opacity-50"
          >
            <FolderPlus className="w-4 h-4" />
            {saveState === "saving-plan" ? "Guardando…" : "Guardar como proyecto"}
          </button>
        )}
        <button
          onClick={onEditAnswers}
          className="rounded-full px-6 py-3 text-sm font-medium border border-ink flex items-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          Editar respuestas
        </button>
        <button
          onClick={onRestart}
          className="rounded-full px-6 py-3 text-sm font-medium text-ink-muted flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {buildRestartLabel(moduleName)}
        </button>
      </div>
      {saveState === "error" && (
        <p className="mt-3 text-sm text-safety">No pudimos guardar el proyecto. Inténtalo de nuevo.</p>
      )}

      <p className="mt-4 text-xs text-ink-faint">
        Copia este prompt y pégalo en tu IA favorita (ChatGPT, Claude, Gemini) para recibir consejos
        personalizados sobre tu proyecto.
      </p>
      <button
        onClick={() => setPromptOpen((v) => !v)}
        className="mt-1.5 text-sm font-medium text-ink-muted hover:text-ink flex items-center gap-1.5"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Generar prompt para IA
      </button>

      {promptOpen && (
        <div className="mt-4 rounded-2xl p-5 bg-white border border-border">
          <p className="text-xs text-ink-muted mb-3">
            Copia este texto y pégalo en ChatGPT, Claude, Gemini o Copilot si quieres profundizar.
            ObraBien no envía nada a ninguna IA por ti.
          </p>
          <textarea
            readOnly
            value={prompt}
            rows={8}
            className="w-full rounded-xl p-3 text-sm font-mono bg-concrete border border-border outline-none"
          />
          <button
            onClick={handleCopy}
            className="mt-3 rounded-full px-4 py-2 text-sm font-medium border border-ink inline-flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado" : "Copiar prompt"}
          </button>
        </div>
      )}
    </div>
  );
}
