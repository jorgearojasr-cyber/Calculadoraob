"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, FolderPlus, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { buildCalculationPrompt, buildRestartLabel } from "@/lib/prompt-generator";
import type { CalculationResult, InfoResult } from "@/lib/formula-engine";
import type { CalculateModuleResult, NormSummary } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";
import { createSavedProjectAction } from "@/app/(app)/proyectos/actions";
import { togglePhaseCompletionAction } from "@/app/(app)/plan/[slug]/actions";
import { PENDING_PROJECT_KEY } from "@/lib/pending-project";
import { NormsDisclaimer } from "./norms-disclaimer";
import { PricedResults } from "./priced-results";
import { GuideSection, type ModuleGuideData } from "./guide-section";
import { PhotoGallery } from "./photo-gallery";
import { RecalculateField } from "./recalculate-field";

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
}: {
  moduleId: string;
  moduleName: string;
  categoryName: string;
  answersSummary: { label: string; value: string }[];
  results: CalculationResult[];
  infoResults: InfoResult[];
  norms: NormSummary[];
  variables: CalculateModuleResult["variables"];
  onRestart: () => void;
  guide?: ModuleGuideData | null;
  approvedPhotos?: { id: string; url: string }[];
  planContext?: { slug: string; phaseId: string; shape?: string };
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
}) {
  const router = useRouter();
  const [promptOpen, setPromptOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProject = async () => {
    setSaveState("saving");
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
      // fórmula ES la señal natural de "fase lista" — marca la fase y
      // vuelve al plan (con la fase siguiente resaltada) en vez de dejar
      // al usuario en /proyectos/[id] sin un camino de vuelta.
      if (planContext) {
        await togglePhaseCompletionAction(planContext.slug, planContext.phaseId, true);
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

      <PricedResults results={seededResults} onPricesChange={setPricedResults} />

      <NormsDisclaimer norms={norms} />

      {guide && <GuideSection guide={guide} />}

      <PhotoGallery photos={approvedPhotos ?? []} />

      <div className="mt-8 rounded-2xl p-5 bg-white border border-border">
        <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
          Con estos datos respondiste
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {answersSummary.map((item) => (
            <div key={item.label} className="contents">
              <dt className="text-ink-muted">{item.label}</dt>
              <dd className="font-medium text-right">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          onClick={handleSaveProject}
          disabled={saveState === "saving"}
          className="rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-action disabled:opacity-50"
        >
          <FolderPlus className="w-4 h-4" />
          {saveState === "saving" ? "Guardando…" : "Guardar como proyecto"}
        </button>
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
