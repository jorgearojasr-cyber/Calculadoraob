"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { PhaseForm } from "./phase-form";
import {
  createPhaseAction,
  updatePhaseAction,
  deletePhaseAction,
  movePhaseAction,
  type PhaseInput,
} from "@/app/admin/planes/actions";

type Phase = {
  id: string;
  name: string;
  moduleLinks: {
    id: string;
    label: string | null;
    presetQuery: string | null;
    moduleId: string;
    module: { name: string };
  }[];
};

export function PhasesManager({
  planId,
  phases,
  modules,
}: {
  planId: string;
  phases: Phase[];
  modules: { id: string; name: string }[];
}) {
  const [mode, setMode] = useState<"list" | "creating" | string>("list");
  const [isPending, startTransition] = useTransition();
  const [moveError, setMoveError] = useState<string | null>(null);

  const handleMove = (id: string, direction: "up" | "down") => {
    setMoveError(null);
    startTransition(async () => {
      const result = await movePhaseAction(id, direction);
      if (result?.error) setMoveError(result.error);
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar la fase "${name}"?`)) return;
    startTransition(async () => {
      await deletePhaseAction(id);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Fases</h2>
        {mode === "list" && (
          <button
            onClick={() => setMode("creating")}
            className="rounded-full px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 bg-ink"
          >
            <Plus className="w-4 h-4" />
            Nueva fase
          </button>
        )}
      </div>

      <p className="text-xs text-ink-muted mb-4">
        El orden importa: así se muestran las fases en el plan, de arriba hacia abajo.
      </p>

      {moveError && <p className="text-sm text-safety mb-3">{moveError}</p>}

      {mode === "creating" && (
        <div className="mb-6">
          <PhaseForm
            submitLabel="Crear fase"
            modules={modules}
            onCancel={() => setMode("list")}
            onSubmit={async (input: PhaseInput) => {
              const result = await createPhaseAction(planId, input);
              if (!result.error) setMode("list");
              return result;
            }}
          />
        </div>
      )}

      <div className="grid gap-3">
        {phases.length === 0 && mode !== "creating" && (
          <p className="text-sm text-ink-muted rounded-xl p-5 bg-white border border-border">
            Todavía no hay fases.
          </p>
        )}

        {phases.map((phase, index) =>
          mode === phase.id ? (
            <div key={phase.id}>
              <PhaseForm
                submitLabel="Guardar cambios"
                modules={modules}
                onCancel={() => setMode("list")}
                initial={{
                  name: phase.name,
                  moduleLinks: phase.moduleLinks.map((l) => ({
                    id: l.id,
                    moduleId: l.moduleId,
                    label: l.label ?? "",
                    presetQuery: l.presetQuery ?? "",
                  })),
                }}
                onSubmit={async (input: PhaseInput) => {
                  const result = await updatePhaseAction(phase.id, input);
                  if (!result.error) setMode("list");
                  return result;
                }}
              />
            </div>
          ) : (
            <div key={phase.id} className="rounded-xl p-4 bg-white border border-border flex items-start gap-4">
              <div className="flex flex-col gap-1 pt-0.5">
                <button
                  onClick={() => handleMove(phase.id, "up")}
                  disabled={index === 0 || isPending}
                  className="text-ink-muted hover:text-ink disabled:opacity-20"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMove(phase.id, "down")}
                  disabled={index === phases.length - 1 || isPending}
                  className="text-ink-muted hover:text-ink disabled:opacity-20"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1">
                <span className="font-medium text-[15px]">{phase.name}</span>
                <p className="text-xs text-ink-muted mt-1">
                  {phase.moduleLinks
                    .map((l) => (l.label ? `${l.label} (${l.module.name})` : l.module.name))
                    .join(" · ")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMode(phase.id)}
                  className="text-xs font-medium text-navy hover:underline inline-flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(phase.id, phase.name)}
                  className="text-xs font-medium text-safety hover:underline inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
