"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { saveLookup2TableAction, type Lookup2ColumnInput } from "@/app/admin/modulos/[id]/variables/actions";

type Question = { id: string; key: string; label: string; options: { key: string; label: string }[] };

export function Lookup2Grid({
  moduleId,
  primaryQuestion,
  secondaryQuestion,
  initialColumns,
}: {
  moduleId: string;
  primaryQuestion: Question;
  secondaryQuestion: Question;
  initialColumns: Lookup2ColumnInput[];
}) {
  const [columns, setColumns] = useState<Lookup2ColumnInput[]>(
    initialColumns.length > 0 ? initialColumns : [{ label: "", valueType: "TEXT", cells: {} }]
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateColumn = (index: number, patch: Partial<Lookup2ColumnInput>) => {
    setColumns((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    setSaved(false);
  };

  const updateCell = (index: number, compoundKey: string, value: string) => {
    setColumns((prev) =>
      prev.map((c, i) => (i === index ? { ...c, cells: { ...c.cells, [compoundKey]: value } } : c))
    );
    setSaved(false);
  };

  const removeColumn = (index: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveLookup2TableAction(moduleId, primaryQuestion.id, secondaryQuestion.id, columns);
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  };

  return (
    <div className="rounded-xl p-5 bg-white border border-border">
      <p className="text-sm font-medium mb-1">
        Según: {primaryQuestion.label} × {secondaryQuestion.label}
      </p>
      <p className="text-xs text-ink-muted mb-4">
        Cada columna es una variable; cada fila combina una opción de &quot;{primaryQuestion.label}&quot; con
        una de &quot;{secondaryQuestion.label}&quot;. Completa el valor para cada combinación.
      </p>

      <div className="overflow-x-auto">
        <table className="text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 text-xs text-ink-muted font-mono">{primaryQuestion.label}</th>
              <th className="text-left px-3 py-2 text-xs text-ink-muted font-mono">{secondaryQuestion.label}</th>
              {columns.map((col, i) => (
                <th key={i} className="px-3 py-2 min-w-[140px]">
                  <div className="flex items-center gap-1">
                    <input
                      value={col.label}
                      onChange={(e) => updateColumn(i, { label: e.target.value })}
                      placeholder="Nombre variable"
                      className="rounded-md px-2 py-1 text-xs font-medium bg-concrete border border-border outline-none focus:border-ink w-full"
                    />
                    <button onClick={() => removeColumn(i)} className="text-ink-muted hover:text-safety">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <select
                    value={col.valueType}
                    onChange={(e) => updateColumn(i, { valueType: e.target.value as "NUMBER" | "TEXT" })}
                    className="mt-1 rounded-md px-2 py-1 text-xs bg-white border border-border outline-none w-full"
                  >
                    <option value="NUMBER">Número</option>
                    <option value="TEXT">Texto</option>
                  </select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {primaryQuestion.options.map((primaryOption) =>
              secondaryQuestion.options.map((secondaryOption, secondaryIndex) => {
                const compoundKey = `${primaryOption.key}|${secondaryOption.key}`;
                return (
                  <tr key={compoundKey} className="border-t border-border">
                    <td className="px-3 py-2 text-xs text-ink-muted whitespace-nowrap">
                      {secondaryIndex === 0 ? primaryOption.label : ""}
                    </td>
                    <td className="px-3 py-2 text-xs text-ink-muted whitespace-nowrap">
                      {secondaryOption.label}
                    </td>
                    {columns.map((col, i) => (
                      <td key={i} className="px-3 py-2">
                        <input
                          value={col.cells[compoundKey] ?? ""}
                          onChange={(e) => updateCell(i, compoundKey, e.target.value)}
                          className="rounded-md px-2 py-1 text-sm bg-white border border-border outline-none focus:border-ink w-full"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => setColumns((prev) => [...prev, { label: "", valueType: "TEXT", cells: {} }])}
          className="text-xs font-medium text-navy inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar columna
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full px-4 py-1.5 text-xs font-semibold text-white bg-ink disabled:opacity-50"
        >
          {isPending ? "Guardando…" : columns.length === 0 ? "Quitar tabla" : "Guardar tabla"}
        </button>
        {saved && <span className="text-xs text-success">Guardado</span>}
      </div>

      {error && <p className="text-sm text-safety mt-2">{error}</p>}
    </div>
  );
}
