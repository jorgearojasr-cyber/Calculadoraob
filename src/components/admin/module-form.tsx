"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { FormState } from "@/app/admin/modulos/actions";

type ModuleFormAction = (state: FormState, formData: FormData) => Promise<FormState>;

export function ModuleForm({
  action,
  categories,
  initial,
  submitLabel,
}: {
  action: ModuleFormAction;
  categories: { id: string; name: string }[];
  initial?: {
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    searchKeywords?: string | null;
  };
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
        <span className="font-medium">Nombre</span>
        <input
          name="name"
          defaultValue={initial?.name}
          required
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Slug</span>
        <input
          name="slug"
          defaultValue={initial?.slug}
          placeholder="Se genera del nombre si lo dejas vacío"
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink font-mono text-sm"
        />
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

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Categoría</span>
        <select
          name="categoryId"
          defaultValue={initial?.categoryId}
          required
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        >
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Palabras clave de búsqueda (opcional)</span>
        <input
          name="searchKeywords"
          defaultValue={initial?.searchKeywords ?? ""}
          placeholder="Ej: radier patio piso hormigón cemento"
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        />
        <span className="text-xs text-ink-muted">
          Términos extra para que el buscador de la Home encuentre este módulo aunque no coincidan con el nombre.
        </span>
      </label>

      <p className="text-xs text-ink-muted">
        Publicar o despublicar este módulo se hace desde la pestaña &quot;Vista previa&quot;.
      </p>

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
