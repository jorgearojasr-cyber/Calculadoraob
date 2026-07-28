"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { createShowcaseAction } from "@/app/(app)/galeria/actions";
import { MAX_SHOWCASE_PHOTOS_PER_SIDE } from "@/lib/project-showcase";

export function ShowcaseForm({ savedProjects }: { savedProjects: { id: string; name: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createShowcaseAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/galeria");
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5">
      <div>
        <label className="block text-sm font-semibold mb-1.5" htmlFor="title">
          Título
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="Ej: Radier del patio trasero"
          className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-border outline-none focus:border-ink"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" htmlFor="story">
          Tu historia
        </label>
        <textarea
          id="story"
          name="story"
          required
          rows={5}
          placeholder="Cuéntanos cómo lo hiciste, qué aprendiste, cuánto te demoraste…"
          className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-border outline-none focus:border-ink resize-none"
        />
      </div>

      {savedProjects.length > 0 && (
        <div>
          <label className="block text-sm font-semibold mb-1.5" htmlFor="savedProjectId">
            Vincular a un proyecto calculado (opcional)
          </label>
          <select
            id="savedProjectId"
            name="savedProjectId"
            className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-border outline-none focus:border-ink"
          >
            <option value="">Ninguno</option>
            {savedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-1.5" htmlFor="photosBefore">
          Fotos de antes (mínimo 1, máximo {MAX_SHOWCASE_PHOTOS_PER_SIDE})
        </label>
        <input
          id="photosBefore"
          name="photosBefore"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
          className="text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" htmlFor="photosAfter">
          Fotos de después (mínimo 1, máximo {MAX_SHOWCASE_PHOTOS_PER_SIDE})
        </label>
        <input
          id="photosAfter"
          name="photosAfter"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
          className="text-sm"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 bg-action disabled:opacity-50"
      >
        <Camera className="w-4 h-4" />
        {isPending ? "Publicando…" : "Publicar proyecto"}
      </button>
    </form>
  );
}
