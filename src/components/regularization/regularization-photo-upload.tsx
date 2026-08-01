"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import {
  uploadRegularizationPhotoAction,
  deleteRegularizationPhotoAction,
} from "@/app/(app)/regularizacion/[id]/actions";
import { STALE_SESSION_ERROR, STALE_SESSION_MESSAGE } from "@/lib/stale-session";
import { MAX_PHOTOS_PER_KIND } from "@/lib/regularization-photos";
import type { RegularizationPhotoKind } from "@/generated/prisma/client";

export type RegularizationPhotoItem = { id: string; kind: RegularizationPhotoKind; url: string };

const KIND_LABELS: Record<RegularizationPhotoKind, string> = {
  FACHADA: "Fachada",
  POSTERIOR: "Posterior",
  COSTADO: "Costado",
  INTERIOR: "Interior",
  TECHUMBRE: "Techumbre",
  FUNDACION: "Fundación",
  OTRO: "Otro",
};

const KIND_ORDER: RegularizationPhotoKind[] = [
  "FACHADA",
  "POSTERIOR",
  "COSTADO",
  "INTERIOR",
  "TECHUMBRE",
  "FUNDACION",
  "OTRO",
];

// Reutiliza el mecanismo de subida de PhotoUpload (proyectos/) — input +
// FormData + Server Action + Vercel Blob — sin su modelo (sin
// status/moderación, sin límite total: el límite es por categoría, ver
// MAX_PHOTOS_PER_KIND). Múltiples fotos por categoría (Opción A,
// decisión confirmada 2026-08-02).
export function RegularizationPhotoUpload({
  caseId,
  initialPhotos,
}: {
  caseId: string;
  initialPhotos: RegularizationPhotoItem[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [kind, setKind] = useState<RegularizationPhotoKind>("FACHADA");
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const kindCount = photos.filter((p) => p.kind === kind).length;
  const atLimit = kindCount >= MAX_PHOTOS_PER_KIND;

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return setError("Elige una foto primero.");
    setError(null);

    const formData = new FormData();
    formData.set("photo", file);

    startTransition(async () => {
      const result = await uploadRegularizationPhotoAction(caseId, kind, formData);
      if (result.error) {
        if (result.error === STALE_SESSION_ERROR) setSessionError(STALE_SESSION_MESSAGE);
        else setError(result.error);
        return;
      }
      if (result.id && result.url) {
        setPhotos((prev) => [...prev, { id: result.id!, kind, url: result.url! }]);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const handleDelete = (photoId: string) => {
    const prevPhotos = photos;
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    startTransition(async () => {
      const result = await deleteRegularizationPhotoAction(caseId, photoId);
      if (result.error) {
        setPhotos(prevPhotos);
        if (result.error === STALE_SESSION_ERROR) setSessionError(STALE_SESSION_MESSAGE);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8">
      <h2 className="font-display text-lg font-semibold tracking-tight mb-4">Fotos</h2>

      {sessionError && (
        <div className="rounded-2xl p-4 mb-4 bg-safety-tint border border-safety/30 text-sm text-safety">
          {sessionError}{" "}
          <Link href={`/login?callbackUrl=%2Fregularizacion%2F${caseId}`} className="font-semibold underline">
            Iniciar sesión
          </Link>
        </div>
      )}

      <div className="grid gap-4 mb-5">
        {KIND_ORDER.map((k) => {
          const kindPhotos = photos.filter((p) => p.kind === k);
          if (kindPhotos.length === 0) return null;
          return (
            <div key={k}>
              <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-2">{KIND_LABELS[k]}</p>
              <div className="grid gap-1.5">
                {kindPhotos.map((photo) => (
                  <div key={photo.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink-muted truncate">{photo.url || "Subida en proceso..."}</span>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      disabled={isPending}
                      className="text-xs font-medium text-safety underline flex-shrink-0 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl p-4 bg-concrete grid gap-3">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as RegularizationPhotoKind)}
          className="rounded-lg border border-border px-3 py-2 text-sm bg-white"
        >
          {KIND_ORDER.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>

        {atLimit ? (
          <p className="text-sm text-ink-muted">
            Ya subiste el máximo de {MAX_PHOTOS_PER_KIND} fotos para {KIND_LABELS[kind]}.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
            <button
              onClick={handleUpload}
              disabled={isPending}
              className="rounded-full px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 bg-ink disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              {isPending ? "Subiendo…" : "Subir foto"}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-safety">{error}</p>}
      </div>
    </div>
  );
}
