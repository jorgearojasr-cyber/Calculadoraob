"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CATEGORY_ICON_NAMES } from "@/lib/category-icons";
import type { FormState } from "@/app/admin/categorias/actions";

type CategoryFormAction = (state: FormState, formData: FormData) => Promise<FormState>;

export function CategoryForm({
  action,
  initial,
  submitLabel,
}: {
  action: CategoryFormAction;
  initial?: {
    name: string;
    slug: string;
    description: string;
    icon: string;
    tag: string;
    order: number;
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
        <span className="font-medium">Ícono</span>
        <select
          name="icon"
          defaultValue={initial?.icon ?? CATEGORY_ICON_NAMES[0]}
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        >
          {CATEGORY_ICON_NAMES.map((iconName) => (
            <option key={iconName} value={iconName}>
              {iconName}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Etiqueta (opcional)</span>
        <input
          name="tag"
          defaultValue={initial?.tag}
          placeholder='Ej: "Más usado"'
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Orden</span>
        <input
          type="number"
          name="order"
          defaultValue={initial?.order ?? 0}
          className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink w-32"
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
