"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, FolderPlus, RotateCcw, Sparkles } from "lucide-react";
import { buildCalculationPrompt } from "@/lib/prompt-generator";
import type { CalculationResult, InfoResult } from "@/lib/formula-engine";
import type { CalculateModuleResult, NormSummary } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";
import { createSavedProjectAction } from "@/app/(app)/proyectos/actions";
import { PENDING_PROJECT_KEY } from "@/lib/pending-project";
import { NormsDisclaimer } from "./norms-disclaimer";
import { PricedResults } from "./priced-results";
import { GuideSection, type ModuleGuideData } from "./guide-section";

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
}) {
  const router = useRouter();
  const [promptOpen, setPromptOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [pricedResults, setPricedResults] = useState<CalculationResult[]>(results);

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
      });

      if (response.error) {
        window.localStorage.setItem(
          PENDING_PROJECT_KEY,
          JSON.stringify({ moduleId, moduleName, answersSummary, result })
        );
        router.push(`/login?callbackUrl=${encodeURIComponent("/proyectos/guardar-pendiente")}`);
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
      <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-6">
        Esto es lo que necesitas
      </h2>

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

      <PricedResults results={results} onPricesChange={setPricedResults} />

      <NormsDisclaimer norms={norms} />

      {guide && <GuideSection guide={guide} />}

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
          onClick={() => setPromptOpen((v) => !v)}
          className="rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-safety"
        >
          <Sparkles className="w-4 h-4" />
          Generar prompt para IA
        </button>
        <button
          onClick={handleSaveProject}
          disabled={saveState === "saving"}
          className="rounded-full px-6 py-3 text-sm font-medium border border-ink flex items-center gap-2 disabled:opacity-50"
        >
          <FolderPlus className="w-4 h-4" />
          {saveState === "saving" ? "Guardando…" : "Guardar como proyecto"}
        </button>
        <button
          onClick={onRestart}
          className="rounded-full px-6 py-3 text-sm font-medium border border-ink flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Calcular otro radier
        </button>
      </div>
      {saveState === "error" && (
        <p className="mt-3 text-sm text-safety">No pudimos guardar el proyecto. Inténtalo de nuevo.</p>
      )}

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
