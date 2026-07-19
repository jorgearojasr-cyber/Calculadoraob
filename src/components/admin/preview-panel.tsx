"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { ModuleWizard } from "@/components/module/module-wizard";
import { publishModuleAction, unpublishModuleAction } from "@/app/admin/modulos/actions";
import type { WizardQuestion } from "@/components/module/types";

export function PreviewPanel({
  moduleId,
  moduleName,
  categorySlug,
  categoryName,
  questions,
  published,
  issues,
}: {
  moduleId: string;
  moduleName: string;
  categorySlug: string;
  categoryName: string;
  questions: WizardQuestion[];
  published: boolean;
  issues: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [wizardKey, setWizardKey] = useState(0);

  const canPublish = issues.length === 0;

  const handlePublish = () => {
    setError(null);
    startTransition(async () => {
      const result = await publishModuleAction(moduleId);
      if (result?.error) setError(result.error);
    });
  };

  const handleUnpublish = () => {
    setError(null);
    startTransition(async () => {
      await unpublishModuleAction(moduleId);
    });
  };

  return (
    <div>
      <div
        className={`rounded-xl p-5 border mb-6 ${
          canPublish ? "bg-[#E6F4EA] border-[#B7DFC1]" : "bg-[#FDEDE6] border-[#F3C7B1]"
        }`}
      >
        <div className="flex items-start gap-3">
          {canPublish ? (
            <CheckCircle2 className="w-5 h-5 text-[#1E7A34] flex-shrink-0 mt-0.5" />
          ) : (
            <TriangleAlert className="w-5 h-5 text-safety flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            {canPublish ? (
              <p className="text-sm font-medium text-[#1E7A34]">Listo para publicar.</p>
            ) : (
              <>
                <p className="text-sm font-medium text-safety mb-1">
                  Falta esto antes de poder publicar:
                </p>
                <ul className="text-sm text-safety list-disc list-inside">
                  {issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {published ? (
              <button
                onClick={handleUnpublish}
                disabled={isPending}
                className="rounded-full px-4 py-2 text-sm font-medium border border-ink disabled:opacity-50 whitespace-nowrap"
              >
                {isPending ? "Guardando…" : "Despublicar"}
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={isPending || !canPublish}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-ink disabled:opacity-40 whitespace-nowrap"
              >
                {isPending ? "Guardando…" : "Publicar módulo"}
              </button>
            )}
            {error && <p className="text-xs text-safety max-w-[220px] text-right">{error}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Vista previa</h2>
        <button
          onClick={() => setWizardKey((k) => k + 1)}
          className="text-xs font-medium text-ink-muted hover:text-ink"
        >
          Reiniciar vista previa
        </button>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-ink-muted rounded-xl p-5 bg-white border border-border">
          Agrega al menos una pregunta para poder probar el módulo aquí.
        </p>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <ModuleWizard
            key={wizardKey}
            moduleId={moduleId}
            moduleName={moduleName}
            categorySlug={categorySlug}
            categoryName={categoryName}
            questions={questions}
          />
        </div>
      )}
    </div>
  );
}
