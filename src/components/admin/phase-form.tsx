"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import type { PhaseInput, PhaseModuleLinkInput } from "@/app/admin/planes/actions";

export function PhaseForm({
  initial,
  modules,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: { name: string; moduleLinks: PhaseModuleLinkInput[] };
  modules: { id: string; name: string }[];
  onSubmit: (input: PhaseInput) => Promise<{ error?: string }>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [moduleLinks, setModuleLinks] = useState<PhaseModuleLinkInput[]>(
    initial?.moduleLinks ?? [{ moduleId: "", label: "", presetQuery: "" }]
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateLink = (index: number, patch: Partial<PhaseModuleLinkInput>) => {
    setModuleLinks((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeLink = (index: number) => {
    setModuleLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit({ name, moduleLinks });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="rounded-xl p-5 bg-white border border-border grid gap-4">
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Nombre de la fase</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Ej: "1. Hacer la base"'
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        />
      </label>

      <div className="grid gap-2">
        <span className="text-sm font-medium">Módulos de esta fase</span>
        <p className="text-xs text-ink-muted -mt-1">
          Normalmente 1 módulo. Si agregas 2+, el usuario verá un selector (útil cuando hay más de una
          forma de calcular la fase) — en ese caso cada módulo necesita una etiqueta que los distinga.
        </p>
        {moduleLinks.map((link, index) => (
          <div key={link.id ?? index} className="grid grid-cols-[1fr_auto] gap-2 items-start">
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                value={link.moduleId}
                onChange={(e) => updateLink(index, { moduleId: e.target.value })}
                className="rounded-lg px-3 py-2 text-sm bg-white border border-border outline-none focus:border-ink"
              >
                <option value="">Elige un módulo</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <input
                value={link.label}
                onChange={(e) => updateLink(index, { label: e.target.value })}
                placeholder="Etiqueta (opcional si es el único)"
                className="rounded-lg px-3 py-2 text-sm bg-white border border-border outline-none focus:border-ink"
              />
              <input
                value={link.presetQuery}
                onChange={(e) => updateLink(index, { presetQuery: e.target.value })}
                placeholder="Query opcional, ej: tipo=bodega"
                className="rounded-lg px-3 py-2 text-sm bg-white border border-border outline-none focus:border-ink font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() => removeLink(index)}
              disabled={moduleLinks.length <= 1}
              className="text-ink-muted hover:text-safety disabled:opacity-30 mt-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setModuleLinks((prev) => [...prev, { moduleId: "", label: "", presetQuery: "" }])}
          className="text-xs font-medium text-navy inline-flex items-center gap-1 w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar módulo
        </button>
      </div>

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
