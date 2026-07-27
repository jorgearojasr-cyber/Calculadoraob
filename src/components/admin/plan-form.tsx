"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { FormState } from "@/app/admin/planes/actions";

type PlanFormAction = (state: FormState, formData: FormData) => Promise<FormState>;

export function PlanForm({
  action,
  initial,
  submitLabel,
}: {
  action: PlanFormAction;
  initial?: { title: string; slug: string; description: string };
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await action({}, formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 max-w-lg">
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Título</span>
        <input
          name="title"
          defaultValue={initial?.title}
          required
          placeholder='Ej: "Construir una bodega o ampliación"'
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Slug</span>
        <input
          name="slug"
          defaultValue={initial?.slug}
          placeholder="Se genera del título si lo dejas vacío"
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink font-mono text-sm"
        />
        <span className="text-xs text-ink-muted">Define la URL: /plan/&lt;slug&gt;</span>
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Descripción</span>
        <input
          name="description"
          defaultValue={initial?.description}
          required
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        />
      </label>

      {error && <p className="text-sm text-safety">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full px-6 py-2.5 text-sm font-semibold text-white bg-ink disabled:opacity-50"
        >
          {isPending ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
