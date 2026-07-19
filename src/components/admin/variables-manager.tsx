"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { LookupGrid } from "./lookup-grid";
import { createDirectVariableAction, deleteVariableAction } from "@/app/admin/modulos/[id]/variables/actions";
import type { LookupColumnInput } from "@/app/admin/modulos/[id]/variables/actions";

type Question = {
  id: string;
  key: string;
  label: string;
  type: "NUMBER" | "SELECT" | "TEXT";
  options: { key: string; label: string }[];
};

type Variable = {
  id: string;
  key: string;
  label: string;
  valueType: "NUMBER" | "TEXT";
  source: unknown;
};

function isDirect(v: Variable): v is Variable & { source: { type: "QUESTION"; questionKey: string } } {
  return (v.source as { type?: string })?.type === "QUESTION";
}

function isLookup(
  v: Variable
): v is Variable & { source: { type: "LOOKUP"; questionKey: string; table: Record<string, unknown> } } {
  return (v.source as { type?: string })?.type === "LOOKUP";
}

export function VariablesManager({
  moduleId,
  questions,
  variables,
}: {
  moduleId: string;
  questions: Question[];
  variables: Variable[];
}) {
  const [creatingDirect, setCreatingDirect] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newQuestionId, setNewQuestionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [startingGridFor, setStartingGridFor] = useState<string | null>(null);

  const questionsByKey = Object.fromEntries(questions.map((q) => [q.key, q]));
  const directVariables = variables.filter(isDirect);
  const lookupVariables = variables.filter(isLookup);

  const lookupByQuestionKey = new Map<string, typeof lookupVariables>();
  for (const v of lookupVariables) {
    const list = lookupByQuestionKey.get(v.source.questionKey) ?? [];
    list.push(v);
    lookupByQuestionKey.set(v.source.questionKey, list);
  }

  const selectQuestions = questions.filter((q) => q.type === "SELECT");
  const questionsWithoutGrid = selectQuestions.filter(
    (q) => !lookupByQuestionKey.has(q.key) && q.key !== startingGridFor
  );

  const handleCreateDirect = () => {
    setError(null);
    startTransition(async () => {
      const result = await createDirectVariableAction(moduleId, {
        label: newLabel,
        questionId: newQuestionId,
      });
      if (result?.error) setError(result.error);
      else {
        setCreatingDirect(false);
        setNewLabel("");
        setNewQuestionId("");
      }
    });
  };

  const handleDelete = (id: string, label: string) => {
    if (!window.confirm(`¿Eliminar la variable "${label}"? Las fórmulas que la usen dejarán de funcionar.`))
      return;
    startTransition(async () => {
      await deleteVariableAction(id);
    });
  };

  return (
    <div className="grid gap-10">
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Variables directas</h2>
            <p className="text-xs text-ink-muted mt-1">
              El valor es la respuesta tal cual (útil para preguntas numéricas, o para comparar en
              condiciones).
            </p>
          </div>
          {!creatingDirect && (
            <button
              onClick={() => setCreatingDirect(true)}
              className="rounded-full px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 bg-ink"
            >
              <Plus className="w-4 h-4" />
              Nueva variable directa
            </button>
          )}
        </div>

        {creatingDirect && (
          <div className="rounded-xl p-5 bg-white border border-border grid gap-3 mb-4 max-w-md">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Nombre de la variable</span>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Viene de la pregunta</span>
              <select
                value={newQuestionId}
                onChange={(e) => setNewQuestionId(e.target.value)}
                className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
              >
                <option value="">Selecciona una pregunta</option>
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            </label>
            {error && <p className="text-sm text-safety">{error}</p>}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateDirect}
                disabled={isPending}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-ink disabled:opacity-50"
              >
                {isPending ? "Guardando…" : "Crear variable"}
              </button>
              <button onClick={() => setCreatingDirect(false)} className="text-sm text-ink-muted hover:text-ink">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {directVariables.length === 0 ? (
          <p className="text-sm text-ink-muted rounded-xl p-5 bg-white border border-border">
            Todavía no hay variables directas.
          </p>
        ) : (
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-ink-muted font-mono uppercase tracking-wider">
                  <th className="px-4 py-2 font-medium">Variable</th>
                  <th className="px-4 py-2 font-medium">Pregunta origen</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {directVariables.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium">{v.label || v.key}</td>
                    <td className="px-4 py-2 text-ink-muted">
                      {questionsByKey[v.source.questionKey]?.label ?? v.source.questionKey}
                    </td>
                    <td className="px-4 py-2 text-ink-muted">{v.valueType === "NUMBER" ? "Número" : "Texto"}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDelete(v.id, v.label || v.key)}
                        className="text-xs font-medium text-safety hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight mb-1">Tablas de valores por opción</h2>
        <p className="text-xs text-ink-muted mb-4">
          Define constantes distintas según la opción elegida en una pregunta de selección (ej: el
          espesor según el uso del radier).
        </p>

        <div className="grid gap-4">
          {Array.from(lookupByQuestionKey.entries()).map(([questionKey, vars]) => {
            const question = questionsByKey[questionKey];
            if (!question) return null;
            const initialColumns: LookupColumnInput[] = vars.map((v) => ({
              id: v.id,
              label: v.label || v.key,
              valueType: v.valueType,
              cells: Object.fromEntries(
                Object.entries(v.source.table).map(([k, val]) => [k, String(val)])
              ),
            }));
            return (
              <LookupGrid
                key={questionKey}
                moduleId={moduleId}
                question={question}
                initialColumns={initialColumns}
              />
            );
          })}

          {startingGridFor && questionsByKey[startingGridFor] && (
            <LookupGrid moduleId={moduleId} question={questionsByKey[startingGridFor]} initialColumns={[]} />
          )}
        </div>

        {questionsWithoutGrid.length > 0 && (
          <div className="mt-4">
            <label className="text-xs font-medium text-ink-muted mr-2">Nueva tabla según:</label>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) setStartingGridFor(e.target.value);
              }}
              className="rounded-lg px-3 py-1.5 text-sm bg-white border border-border outline-none"
            >
              <option value="" disabled>
                Elige una pregunta de selección
              </option>
              {questionsWithoutGrid.map((q) => (
                <option key={q.id} value={q.key}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>
    </div>
  );
}
