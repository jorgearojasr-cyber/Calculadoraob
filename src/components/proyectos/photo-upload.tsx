"use client";

import { useRef, useState, useTransition } from "react";
import { Camera } from "lucide-react";
import { uploadProjectPhotoAction } from "@/app/(app)/proyectos/[id]/actions";
import { MAX_PHOTOS_PER_PROJECT } from "@/lib/project-photos";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En revisión",
  APPROVED: "Aprobada — visible para otros",
  REJECTED: "No aprobada",
};

export function PhotoUpload({
  savedProjectId,
  initialPhotos,
}: {
  savedProjectId: string;
  initialPhotos: { id: string; status: "PENDING" | "APPROVED" | "REJECTED" }[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Elige una foto primero.");
      return;
    }
    setError(null);
    setDone(false);

    const formData = new FormData();
    formData.set("photo", file);

    startTransition(async () => {
      const result = await uploadProjectPhotoAction(savedProjectId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setDone(true);
      setPhotos((prev) => [...prev, { id: `temp-${Date.now()}`, status: "PENDING" }]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  if (photos.length >= MAX_PHOTOS_PER_PROJECT) {
    return (
      <div className="mt-8 rounded-ds-card p-5 bg-white border border-ds-border">
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-ds-text-tertiary mb-3">Fotos de tu obra</p>
        <ul className="grid gap-1.5 font-body text-sm">
          {photos.map((photo) => (
            <li key={photo.id} className="text-ds-text-secondary">
              {STATUS_LABELS[photo.status]}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-ds-card p-5 bg-white border border-ds-border">
      <p className="font-body text-xs font-semibold uppercase tracking-wider text-ds-text-tertiary mb-2">Fotos de tu obra</p>
      <p className="font-body text-sm text-ds-text-secondary mb-3">
        ¿Tienes una foto de tu obra terminada? Compártela para ayudar a otros a visualizar el resultado
        (opcional). Se revisa antes de mostrarse.
      </p>

      {photos.length > 0 && (
        <ul className="grid gap-1.5 font-body text-sm mb-3">
          {photos.map((photo) => (
            <li key={photo.id} className="text-ds-text-secondary">
              {STATUS_LABELS[photo.status]}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="font-body text-sm text-ds-text-secondary"
        />
        <button
          onClick={handleUpload}
          disabled={isPending}
          className="rounded-xl px-4 font-body text-sm font-semibold text-white flex items-center gap-1.5 bg-ds-navy-900 hover:bg-ds-navy-700 transition-colors disabled:opacity-50"
          style={{ height: 40 }}
        >
          <Camera className="w-4 h-4" />
          {isPending ? "Subiendo…" : "Subir foto"}
        </button>
      </div>

      {error && <p className="mt-2 font-body text-sm text-danger">{error}</p>}
      {done && !error && <p className="mt-2 font-body text-sm text-ds-success-600">¡Gracias! Tu foto quedó en revisión.</p>}
    </div>
  );
}
