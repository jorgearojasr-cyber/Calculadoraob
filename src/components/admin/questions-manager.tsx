"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { QuestionForm } from "./question-form";
import {
  createQuestionAction,
  updateQuestionAction,
  deleteQuestionAction,
  moveQuestionAction,
  type QuestionInput,
} from "@/app/admin/modulos/[id]/preguntas/actions";

type Question = {
  id: string;
  label: string;
  helpText: string | null;
  type: "NUMBER" | "SELECT" | "TEXT";
  unit: string | null;
  options: { id: string; key: string; label: string }[];
};

const TYPE_LABELS: Record<Question["type"], string> = {
  NUMBER: "Número",
  SELECT: "Selección única",
  TEXT: "Texto corto",
};

export function QuestionsManager({ moduleId, questions }: { moduleId: string; questions: Question[] }) {
  const [mode, setMode] = useState<"list" | "creating" | string>("list");
  const [isPending, startTransition] = useTransition();
  const [moveError, setMoveError] = useState<string | null>(null);

  const handleMove = (id: string, direction: "up" | "down") => {
    setMoveError(null);
    startTransition(async () => {
      const result = await moveQuestionAction(id, direction);
      if (result?.error) setMoveError(result.error);
    });
  };

  const handleDelete = (id: string, label: string) => {
    if (!window.confirm(`¿Eliminar la pregunta "${label}"? También se eliminan sus opciones.`)) return;
    startTransition(async () => {
      await deleteQuestionAction(id);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Preguntas</h2>
        {mode === "list" && (
          <button
            onClick={() => setMode("creating")}
            className="rounded-full px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 bg-ink"
          >
            <Plus className="w-4 h-4" />
            Nueva pregunta
          </button>
        )}
      </div>

      <p className="text-xs text-ink-muted mb-4">
        El orden importa: así se muestran las preguntas en el wizard, una a la vez.
      </p>

      {moveError && <p className="text-sm text-safety mb-3">{moveError}</p>}

      {mode === "creating" && (
        <div className="mb-6">
          <QuestionForm
            submitLabel="Crear pregunta"
            onCancel={() => setMode("list")}
            onSubmit={async (input: QuestionInput) => {
              const result = await createQuestionAction(moduleId, input);
              if (!result.error) setMode("list");
              return result;
            }}
          />
        </div>
      )}

      <div className="grid gap-3">
        {questions.length === 0 && mode !== "creating" && (
          <p className="text-sm text-ink-muted rounded-xl p-5 bg-white border border-border">
            Todavía no hay preguntas.
          </p>
        )}

        {questions.map((question, index) =>
          mode === question.id ? (
            <div key={question.id}>
              <QuestionForm
                submitLabel="Guardar cambios"
                onCancel={() => setMode("list")}
                initial={{
                  label: question.label,
                  helpText: question.helpText ?? "",
                  type: question.type,
                  unit: question.unit ?? "",
                  options: question.options.map((o) => ({ id: o.id, label: o.label })),
                }}
                onSubmit={async (input: QuestionInput) => {
                  const result = await updateQuestionAction(question.id, input);
                  if (!result.error) setMode("list");
                  return result;
                }}
              />
            </div>
          ) : (
            <div
              key={question.id}
              className="rounded-xl p-4 bg-white border border-border flex items-start gap-4"
            >
              <div className="flex flex-col gap-1 pt-0.5">
                <button
                  onClick={() => handleMove(question.id, "up")}
                  disabled={index === 0 || isPending}
                  className="text-ink-muted hover:text-ink disabled:opacity-20"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMove(question.id, "down")}
                  disabled={index === questions.length - 1 || isPending}
                  className="text-ink-muted hover:text-ink disabled:opacity-20"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[15px]">{question.label}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-concrete text-ink-muted">
                    {TYPE_LABELS[question.type]}
                  </span>
                  {question.unit && (
                    <span className="text-[10px] font-mono text-ink-muted">{question.unit}</span>
                  )}
                </div>
                {question.helpText && <p className="text-xs text-ink-muted mb-1">{question.helpText}</p>}
                {question.type === "SELECT" && (
                  <p className="text-xs text-ink-muted">
                    Opciones: {question.options.map((o) => o.label).join(", ")}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMode(question.id)}
                  className="text-xs font-medium text-navy hover:underline inline-flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(question.id, question.label)}
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
