"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSavedProjectAction } from "../actions";
import { PENDING_PROJECT_KEY, type PendingProject } from "@/lib/pending-project";
import type { CalculateModuleResult } from "@/app/categorias/[slug]/[moduleSlug]/actions";

export default function GuardarPendientePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(PENDING_PROJECT_KEY);
    if (!raw) {
      router.replace("/proyectos");
      return;
    }

    const pending = JSON.parse(raw) as PendingProject;

    createSavedProjectAction({
      moduleId: pending.moduleId,
      moduleName: pending.moduleName,
      answersSummary: pending.answersSummary,
      result: pending.result as CalculateModuleResult,
    }).then((response) => {
      window.localStorage.removeItem(PENDING_PROJECT_KEY);
      if (response.error) {
        setError(response.error);
        return;
      }
      router.replace(`/proyectos/${response.id}`);
    });
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-concrete text-ink font-body flex items-center justify-center px-6">
      <p className="text-sm text-ink-muted">
        {error ? `No pudimos guardar tu proyecto: ${error}` : "Guardando tu proyecto…"}
      </p>
    </div>
  );
}
