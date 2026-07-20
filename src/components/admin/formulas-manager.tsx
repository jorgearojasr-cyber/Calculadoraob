"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { FormulaForm } from "./formula-form";
import { describeExpression, type BuilderCondition, type BuilderOp, type BuilderTerm, type RoundingMode, ROUNDING_LABELS } from "@/lib/formula-builder";
import {
  createFormulaAction,
  updateFormulaAction,
  deleteFormulaAction,
  moveFormulaAction,
  createLossFactorAction,
  deleteLossFactorAction,
  type FormulaInput,
} from "@/app/admin/modulos/[id]/formulas/actions";

type VariableOption = { key: string; label: string; valueType: "NUMBER" | "TEXT" };
type LossFactorOption = { id: string; key: string; label: string; percentage: number };

type FormulaRow = {
  id: string;
  key: string;
  label: string;
  unit: string;
  note: string | null;
  builder: {
    terms: BuilderTerm[];
    ops: BuilderOp[];
    condition: BuilderCondition;
    lossFactorKey: string | null;
    rounding: RoundingMode;
  } | null;
};

export function FormulasManager({
  moduleId,
  formulas,
  variables,
  lossFactors,
}: {
  moduleId: string;
  formulas: FormulaRow[];
  variables: VariableOption[];
  lossFactors: LossFactorOption[];
}) {
  const [mode, setMode] = useState<"list" | "creating" | string>("list");
  const [isPending, startTransition] = useTransition();
  const [moveError, setMoveError] = useState<string | null>(null);
  const [lfLabel, setLfLabel] = useState("");
  const [lfPercentage, setLfPercentage] = useState("");
  const [lfError, setLfError] = useState<string | null>(null);
  const [showLossFactorForm, setShowLossFactorForm] = useState(false);

  const variableLabels = Object.fromEntries(variables.map((v) => [v.key, v.label]));
  const lossFactorLabels = Object.fromEntries(lossFactors.map((f) => [f.key, f.label]));
  const formulaLabels = Object.fromEntries(formulas.map((f) => [f.key, f.label]));

  const handleMove = (id: string, direction: "up" | "down") => {
    setMoveError(null);
    startTransition(async () => {
      const result = await moveFormulaAction(id, direction);
      if (result?.error) setMoveError(result.error);
    });
  };

  const handleDelete = (id: string, label: string) => {
    if (!window.confirm(`¿Eliminar la fórmula "${label}"?`)) return;
    startTransition(async () => {
      await deleteFormulaAction(id);
    });
  };

  const handleCreateLossFactor = () => {
    setLfError(null);
    startTransition(async () => {
      const result = await createLossFactorAction(moduleId, {
        label: lfLabel,
        percentage: Number(lfPercentage),
      });
      if (result?.error) setLfError(result.error);
      else {
        setLfLabel("");
        setLfPercentage("");
        setShowLossFactorForm(false);
      }
    });
  };

  const handleDeleteLossFactor = (id: string, label: string) => {
    if (!window.confirm(`¿Eliminar el factor de pérdida "${label}"?`)) return;
    startTransition(async () => {
      await deleteLossFactorAction(id);
    });
  };

  return (
    <div className="grid gap-10">
      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-xl font-semibold tracking-tight">Factores de pérdida</h2>
          {!showLossFactorForm && (
            <button
              onClick={() => setShowLossFactorForm(true)}
              className="text-xs font-medium text-navy inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo factor
            </button>
          )}
        </div>
        <p className="text-xs text-ink-muted mb-3">
          Un porcentaje que las fórmulas pueden aplicar sobre su resultado (ej: pérdida de material).
        </p>

        {showLossFactorForm && (
          <div className="rounded-xl p-4 bg-white border border-border flex items-end gap-3 mb-3">
            <label className="grid gap-1 text-sm">
              <span className="text-xs font-medium">Nombre</span>
              <input
                value={lfLabel}
                onChange={(e) => setLfLabel(e.target.value)}
                className="rounded-md px-2 py-1.5 bg-white border border-border outline-none w-56"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-xs font-medium">Porcentaje (%)</span>
              <input
                type="number"
                value={lfPercentage}
                onChange={(e) => setLfPercentage(e.target.value)}
                className="rounded-md px-2 py-1.5 bg-white border border-border outline-none w-24"
              />
            </label>
            <button
              onClick={handleCreateLossFactor}
              disabled={isPending}
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-white bg-ink disabled:opacity-50"
            >
              Crear
            </button>
            <button onClick={() => setShowLossFactorForm(false)} className="text-xs text-ink-muted">
              Cancelar
            </button>
            {lfError && <p className="text-xs text-safety">{lfError}</p>}
          </div>
        )}

        {lossFactors.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no hay factores de pérdida.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lossFactors.map((f) => (
              <span
                key={f.key}
                className="text-xs font-mono px-3 py-1.5 rounded-full bg-white border border-border inline-flex items-center gap-2"
              >
                {f.label} ({Math.round(f.percentage * 100)}%)
                <button onClick={() => handleDeleteLossFactor(f.id, f.label)} className="text-ink-muted hover:text-safety">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">Fórmulas</h2>
          {mode === "list" && (
            <button
              onClick={() => setMode("creating")}
              className="rounded-full px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 bg-ink"
            >
              <Plus className="w-4 h-4" />
              Nueva fórmula
            </button>
          )}
        </div>

        {moveError && <p className="text-sm text-safety mb-3">{moveError}</p>}

        {mode === "creating" && (
          <div className="mb-6">
            <FormulaForm
              variables={variables}
              formulas={formulas.map((f) => ({ key: f.key, label: f.label }))}
              lossFactors={lossFactors}
              submitLabel="Crear fórmula"
              onCancel={() => setMode("list")}
              onSubmit={async (input: FormulaInput) => {
                const result = await createFormulaAction(moduleId, input);
                if (!result.error) setMode("list");
                return result;
              }}
            />
          </div>
        )}

        <div className="grid gap-3">
          {formulas.length === 0 && mode !== "creating" && (
            <p className="text-sm text-ink-muted rounded-xl p-5 bg-white border border-border">
              Todavía no hay fórmulas.
            </p>
          )}

          {formulas.map((formula, index) =>
            mode === formula.id ? (
              <div key={formula.id}>
                <FormulaForm
                  variables={variables}
                  formulas={formulas.filter((f) => f.id !== formula.id).map((f) => ({ key: f.key, label: f.label }))}
                  lossFactors={lossFactors}
                  submitLabel="Guardar cambios"
                  decompileFailed={!formula.builder}
                  initial={
                    formula.builder
                      ? { label: formula.label, unit: formula.unit, note: formula.note ?? "", ...formula.builder }
                      : { label: formula.label, unit: formula.unit, note: formula.note ?? "", terms: [{ kind: "constant", value: 0 }], ops: [], condition: null, lossFactorKey: null, rounding: "none" }
                  }
                  onCancel={() => setMode("list")}
                  onSubmit={async (input: FormulaInput) => {
                    const result = await updateFormulaAction(formula.id, input);
                    if (!result.error) setMode("list");
                    return result;
                  }}
                />
              </div>
            ) : (
              <div key={formula.id} className="rounded-xl p-4 bg-white border border-border flex items-start gap-4">
                <div className="flex flex-col gap-1 pt-0.5">
                  <button
                    onClick={() => handleMove(formula.id, "up")}
                    disabled={index === 0 || isPending}
                    className="text-ink-muted hover:text-ink disabled:opacity-20"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(formula.id, "down")}
                    disabled={index === formulas.length - 1 || isPending}
                    className="text-ink-muted hover:text-ink disabled:opacity-20"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[15px]">{formula.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-concrete text-ink-muted">
                      {formula.unit}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-ink-muted">
                    {formula.builder
                      ? describeExpression(formula.builder.terms, formula.builder.ops, variableLabels, formulaLabels)
                      : "(fórmula avanzada, no editable visualmente)"}
                    {formula.builder?.lossFactorKey && (
                      <> · pérdida: {lossFactorLabels[formula.builder.lossFactorKey] ?? formula.builder.lossFactorKey}</>
                    )}
                    {formula.builder?.rounding && formula.builder.rounding !== "none" && (
                      <> · {ROUNDING_LABELS[formula.builder.rounding]}</>
                    )}
                  </p>
                  {formula.builder?.condition && (
                    <p className="text-xs text-ink-muted mt-0.5">
                      Solo si {variableLabels[formula.builder.condition.variableKey] ?? formula.builder.condition.variableKey} ={" "}
                      {formula.builder.condition.value}
                    </p>
                  )}
                  {formula.note && <p className="text-xs text-ink-muted mt-1 italic">{formula.note}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMode(formula.id)}
                    className="text-xs font-medium text-navy hover:underline inline-flex items-center gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(formula.id, formula.label)}
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
      </section>
    </div>
  );
}
