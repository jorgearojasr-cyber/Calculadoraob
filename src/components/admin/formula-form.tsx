"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import type { BuilderCondition, BuilderOp, BuilderTerm, RoundingMode } from "@/lib/formula-builder";
import { OP_SYMBOLS, ROUNDING_LABELS } from "@/lib/formula-builder";
import type { FormulaInput } from "@/app/admin/modulos/[id]/formulas/actions";

type VariableOption = { key: string; label: string; valueType: "NUMBER" | "TEXT" };
type LossFactorOption = { key: string; label: string; percentage: number };
type FormulaOption = { key: string; label: string };

const OPS: BuilderOp[] = ["+", "-", "*", "/"];

function emptyTerm(): BuilderTerm {
  return { kind: "constant", value: 0 };
}

export function FormulaForm({
  variables,
  formulas,
  lossFactors,
  initial,
  decompileFailed,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  variables: VariableOption[];
  formulas: FormulaOption[];
  lossFactors: LossFactorOption[];
  initial?: {
    label: string;
    unit: string;
    note: string;
    materialLabelTemplate: string;
    terms: BuilderTerm[];
    ops: BuilderOp[];
    condition: BuilderCondition;
    lossFactorKey: string | null;
    rounding: RoundingMode;
  };
  decompileFailed?: boolean;
  onSubmit: (input: FormulaInput) => Promise<{ error?: string }>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [materialLabelTemplate, setMaterialLabelTemplate] = useState(initial?.materialLabelTemplate ?? "");
  const [terms, setTerms] = useState<BuilderTerm[]>(initial?.terms ?? [emptyTerm()]);
  const [ops, setOps] = useState<BuilderOp[]>(initial?.ops ?? []);
  const [conditionEnabled, setConditionEnabled] = useState(!!initial?.condition);
  const [conditionVariableKey, setConditionVariableKey] = useState(initial?.condition?.variableKey ?? "");
  const [conditionValue, setConditionValue] = useState(initial?.condition?.value ?? "");
  const [lossFactorKey, setLossFactorKey] = useState(initial?.lossFactorKey ?? "");
  const [rounding, setRounding] = useState<RoundingMode>(initial?.rounding ?? "none");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const variablesByKey = Object.fromEntries(variables.map((v) => [v.key, v]));

  const updateTerm = (index: number, patch: Partial<BuilderTerm>) => {
    setTerms((prev) => prev.map((t, i) => (i === index ? ({ ...t, ...patch } as BuilderTerm) : t)));
  };

  const addTerm = () => {
    setTerms((prev) => [...prev, emptyTerm()]);
    setOps((prev) => [...prev, "+"]);
  };

  const removeTerm = (index: number) => {
    setTerms((prev) => prev.filter((_, i) => i !== index));
    setOps((prev) => prev.filter((_, i) => (index === 0 ? i !== 0 : i !== index - 1)));
  };

  const updateOp = (index: number, op: BuilderOp) => {
    setOps((prev) => prev.map((o, i) => (i === index ? op : o)));
  };

  const handleSubmit = () => {
    setError(null);
    const condition: BuilderCondition = conditionEnabled
      ? { variableKey: conditionVariableKey, value: conditionValue }
      : null;
    if (conditionEnabled && !conditionVariableKey) {
      setError("Elige la variable de la condición.");
      return;
    }
    startTransition(async () => {
      const result = await onSubmit({
        label,
        unit,
        note,
        terms,
        ops,
        condition,
        lossFactorKey: lossFactorKey || null,
        rounding,
        materialLabelTemplate,
      });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="rounded-xl p-5 bg-white border border-border grid gap-4">
      {decompileFailed && (
        <p className="text-xs text-safety">
          Esta fórmula se creó de otra forma y no se pudo cargar en el builder visual. Si la guardas
          ahora, se reemplazará por lo que armes aquí.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Nombre</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder='Ej: "Cemento"'
            className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Unidad</span>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder='Ej: "m³", "bolsa", "litro"'
            className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
          />
        </label>
      </div>

      <div className="grid gap-1.5 text-sm">
        <span className="font-medium">Expresión</span>
        <div className="flex flex-wrap items-center gap-2 rounded-lg p-3 bg-concrete border border-border">
          {terms.map((term, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && (
                <select
                  value={ops[i - 1]}
                  onChange={(e) => updateOp(i - 1, e.target.value as BuilderOp)}
                  className="rounded-md px-2 py-1.5 text-sm bg-white border border-border outline-none"
                >
                  {OPS.map((op) => (
                    <option key={op} value={op}>
                      {OP_SYMBOLS[op]}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={term.kind}
                onChange={(e) => {
                  const kind = e.target.value;
                  if (kind === "variable") updateTerm(i, { kind: "variable", variableKey: "" });
                  else if (kind === "formula") updateTerm(i, { kind: "formula", formulaKey: "" });
                  else updateTerm(i, { kind: "constant", value: 0 });
                }}
                className="rounded-md px-2 py-1.5 text-sm bg-white border border-border outline-none"
              >
                <option value="variable">Variable</option>
                <option value="formula">Resultado de otra fórmula</option>
                <option value="constant">Número fijo</option>
              </select>
              {term.kind === "variable" ? (
                <select
                  value={term.variableKey}
                  onChange={(e) => updateTerm(i, { variableKey: e.target.value })}
                  className="rounded-md px-2 py-1.5 text-sm bg-white border border-border outline-none min-w-[140px]"
                >
                  <option value="">Elige variable</option>
                  {variables.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </select>
              ) : term.kind === "formula" ? (
                <select
                  value={term.formulaKey}
                  onChange={(e) => updateTerm(i, { formulaKey: e.target.value })}
                  className="rounded-md px-2 py-1.5 text-sm bg-white border border-border outline-none min-w-[140px]"
                >
                  <option value="">Elige fórmula</option>
                  {formulas.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={term.value}
                  onChange={(e) => updateTerm(i, { value: Number(e.target.value) })}
                  className="rounded-md px-2 py-1.5 text-sm bg-white border border-border outline-none w-24"
                />
              )}
              {terms.length > 1 && (
                <button onClick={() => removeTerm(i)} className="text-ink-muted hover:text-safety">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTerm}
            className="text-xs font-medium text-navy inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar término
          </button>
        </div>
        <p className="text-xs text-ink-muted">
          Se calcula de izquierda a derecha, sin paréntesis (ej: A × B ÷ C se calcula como (A × B) ÷ C).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Factor de pérdida (opcional)</span>
          <select
            value={lossFactorKey}
            onChange={(e) => setLossFactorKey(e.target.value)}
            className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
          >
            <option value="">Ninguno</option>
            {lossFactors.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label} ({Math.round(f.percentage * 100)}%)
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Redondeo</span>
          <select
            value={rounding}
            onChange={(e) => setRounding(e.target.value as RoundingMode)}
            className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
          >
            {Object.entries(ROUNDING_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={conditionEnabled}
            onChange={(e) => setConditionEnabled(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="font-medium">Aplicar solo si...</span>
        </label>
        {conditionEnabled && (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={conditionVariableKey}
              onChange={(e) => setConditionVariableKey(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm bg-white border border-border outline-none"
            >
              <option value="">Elige variable</option>
              {variables.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-ink-muted">=</span>
            <input
              value={conditionValue}
              onChange={(e) => setConditionValue(e.target.value)}
              placeholder={
                conditionVariableKey && variablesByKey[conditionVariableKey]?.valueType === "NUMBER"
                  ? "Ej: 10"
                  : "Ej: manual"
              }
              className="rounded-lg px-3 py-2 text-sm bg-white border border-border outline-none w-40"
            />
          </div>
        )}
      </div>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Nota para el resultado (opcional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder='Ej: "Despacho mínimo habitual: 3 m³."'
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Plantilla de nombre de material (opcional)</span>
        <input
          value={materialLabelTemplate}
          onChange={(e) => setMaterialLabelTemplate(e.target.value)}
          placeholder='Ej: "Perfil estructural {tipo-perfil-label} {medida-angulo-raw}x{medida-angulo-raw} x {espesor-angulo-raw}mm (piezas de 6m)"'
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink font-mono text-xs"
        />
        <p className="text-xs text-ink-muted">
          Si se llena, reemplaza el nombre del material fijo en el resultado. Usa{" "}
          <code className="font-mono">{"{clave-de-variable}"}</code> para insertar el valor ya
          resuelto de cualquier variable del módulo (útil cuando el nombre depende de varias
          selecciones, ej. medida + espesor). Variables disponibles:{" "}
          {variables.map((v) => v.key).join(", ") || "ninguna todavía"}.
        </p>
      </label>

      {error && <p className="text-sm text-safety">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-ink disabled:opacity-50"
        >
          {isPending ? "Guardando…" : submitLabel}
        </button>
        <button onClick={onCancel} className="text-sm text-ink-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </div>
  );
}
