"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import type { QuestionInput, QuestionOptionInput } from "@/app/admin/modulos/[id]/preguntas/actions";

type QuestionType = "NUMBER" | "SELECT" | "TEXT";

const TYPE_LABELS: Record<QuestionType, string> = {
  NUMBER: "Número",
  SELECT: "Selección única",
  TEXT: "Texto corto",
};

export function QuestionForm({
  initial,
  numberQuestions = [],
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: {
    label: string;
    helpText: string;
    type: QuestionType;
    unit: string;
    options: QuestionOptionInput[];
    groupWithQuestionId?: string | null;
  };
  numberQuestions?: { id: string; label: string }[];
  onSubmit: (input: QuestionInput) => Promise<{ error?: string }>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [helpText, setHelpText] = useState(initial?.helpText ?? "");
  const [type, setType] = useState<QuestionType>(initial?.type ?? "NUMBER");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [options, setOptions] = useState<QuestionOptionInput[]>(
    initial?.options ?? [{ label: "" }, { label: "" }]
  );
  const [groupWithQuestionId, setGroupWithQuestionId] = useState<string>(
    initial?.groupWithQuestionId ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, label: value } : o)));
  };

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit({
        label,
        helpText,
        type,
        unit,
        options,
        groupWithQuestionId: type === "NUMBER" ? groupWithQuestionId || null : null,
      });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="rounded-xl p-5 bg-white border border-border grid gap-4">
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Texto de la pregunta</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder='Ej: "¿Cuánto mide de largo?"'
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Texto de ayuda (opcional)</span>
        <input
          value={helpText}
          onChange={(e) => setHelpText(e.target.value)}
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Tipo de respuesta</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {type === "NUMBER" && (
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Unidad (opcional)</span>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder='Ej: "m", "cm", "m²"'
            className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink w-40"
          />
        </label>
      )}

      {type === "NUMBER" && numberQuestions.length > 0 && (
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Mostrar en el mismo paso que (opcional)</span>
          <select
            value={groupWithQuestionId}
            onChange={(e) => setGroupWithQuestionId(e.target.value)}
            className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
          >
            <option value="">Ninguna — paso propio</option>
            {numberQuestions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-ink-muted">
            Ambas preguntas se mostrarán juntas en la misma pantalla del wizard.
          </span>
        </label>
      )}

      {type === "SELECT" && (
        <div className="grid gap-2">
          <span className="text-sm font-medium">Opciones</span>
          {options.map((option, index) => (
            <div key={option.id ?? index} className="flex items-center gap-2">
              <input
                value={option.label}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Opción ${index + 1}`}
                className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink flex-1"
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
                className="text-ink-muted hover:text-safety disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOptions((prev) => [...prev, { label: "" }])}
            className="text-xs font-medium text-navy inline-flex items-center gap-1 w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar opción
          </button>
        </div>
      )}

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
