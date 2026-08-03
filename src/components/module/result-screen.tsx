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
  moduleName,
  categoryName,
  answersSummary,
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
}: {
  moduleId: string;
  moduleName: string;
  categoryName: string;
  answersSummary: SummaryItem[];
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

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">Resultado</p>
      <h2 className="font-display text-[22px] font-semibold tracking-tight mb-6">
        Esto es lo que necesitas
      </h2>

      {showsHero && heroResult && (
        <ResultHero
          moduleName={moduleName}
          result={heroResult}
          otherMaterialNames={otherMaterialNames}
          primaryInfo={infoResults[0] ?? null}
          total={anyPriced ? approxTotal : null}
        />
      )}

      {recalculateField && onRecalculate && (
        <RecalculateField
          label={recalculateField.label}
          unit={recalculateField.unit}
          value={recalculateField.value}
          onRecalculate={(newValue) => onRecalculate({ [recalculateField.questionKey]: newValue })}
        />
      )}

      {infoResults.length > 0 && (
        <div className="grid gap-3 mb-3">
          {infoResults.map((info) => (
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

      <PricedResults
        results={seededResults}
        onPricesChange={setPricedResults}
        hideFeatured={hidesFeaturedInList}
        hideTotal={showsHero && anyPriced}
      />

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
