"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Circle, Calculator } from "lucide-react";
import { togglePhaseCompletionAction } from "@/app/(app)/plan/[slug]/actions";
import { STALE_SESSION_ERROR, STALE_SESSION_MESSAGE } from "@/lib/stale-session";

export type PlanPhaseLink = { label: string | null; href: string; moduleName: string };
export type PlanPhaseData = {
  id: string;
  name: string;
  completed: boolean;
  links: PlanPhaseLink[];
};

// Piloto de "Plan de fases": progreso simple sin lógica de dependencia
// entre fases (se pueden completar en cualquier orden) — deliberadamente
// simple hasta validar el patrón con un solo caso real.
export function PlanView({ planSlug, phases }: { planSlug: string; phases: PlanPhaseData[] }) {
  const [completedIds, setCompletedIds] = useState(
    new Set(phases.filter((p) => p.completed).map((p) => p.id))
  );
  const [, startTransition] = useTransition();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const router = useRouter();

  const completedCount = completedIds.size;

  const handleToggle = (phaseId: string, checked: boolean) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(phaseId);
      else next.delete(phaseId);
      return next;
    });

    startTransition(async () => {
      const result = await togglePhaseCompletionAction(planSlug, phaseId, checked);
      if (result.error) {
        setCompletedIds((prev) => {
          const next = new Set(prev);
          if (checked) next.delete(phaseId);
          else next.add(phaseId);
          return next;
        });
        if (result.error === STALE_SESSION_ERROR) {
          setSessionError(STALE_SESSION_MESSAGE);
        } else {
          router.push(`/login?callbackUrl=${encodeURIComponent(`/plan/${planSlug}`)}`);
        }
      }
    });
  };

  return (
    <div>
      {sessionError && (
        <div className="rounded-2xl p-4 mb-4 bg-safety-tint border border-safety/30 text-sm text-safety">
          {sessionError}{" "}
          <Link href={`/login?callbackUrl=${encodeURIComponent(`/plan/${planSlug}`)}`} className="font-semibold underline">
            Iniciar sesión
          </Link>
        </div>
      )}
      <div className="rounded-2xl p-5 bg-white border border-border mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">
            {completedCount} de {phases.length} fases completadas
          </p>
          <span className="text-xs text-ink-muted">
            {Math.round((completedCount / phases.length) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-safety transition-all"
            style={{ width: `${(completedCount / phases.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3">
        {phases.map((phase) => {
          const isDone = completedIds.has(phase.id);
          return (
            <div key={phase.id} className="rounded-2xl p-5 bg-white border border-border">
              <div className="flex items-start gap-3">
                <label className="flex items-center gap-2 cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={(e) => handleToggle(phase.id, e.target.checked)}
                    className="w-4 h-4"
                    aria-label={`Marcar "${phase.name}" como lista`}
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[15px]">{phase.name}</h3>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-safety-tint text-safety">
                        <Check className="w-3 h-3" />
                        Completada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-concrete text-ink-faint">
                        <Circle className="w-3 h-3" />
                        Pendiente
                      </span>
                    )}
                  </div>

                  {phase.links.length === 1 ? (
                    <Link
                      href={phase.links[0].href}
                      className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white bg-ink"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Calcular esta fase
                    </Link>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {phase.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-ink"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          {link.label ?? link.moduleName}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
