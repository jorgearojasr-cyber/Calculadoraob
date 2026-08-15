"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { uploadInspectionPhotoAction, deleteInspectionPhotoAction } from "@/app/(app)/inspecciones/[id]/actions";
import type { PhotoUploadContext } from "@/lib/inspecciones/photos";

const FOCUS_RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";

export type InspectionPhotoItem = { id: string; url: string };

// Componente genérico reutilizado en los 4 niveles de asociación (caso /
// espacio / elemento / observación, ver PhotoUploadContext) — no exige
// una observación (Fase 4, punto 2). `capture="environment"` en el
// input sugiere la cámara trasera en celulares sin impedir elegir de la
// galería (atributo HTML estándar, sin librería nueva).
//
// Sube apenas se elige un archivo (sin botón "Subir" aparte) — menos
// toques para un inspector encadenando fotos en terreno, mismo criterio
// de "menos fricción" ya aplicado en el resto del checklist (Fase 3/3.1).
export function PhotoUpload({
  caseId,
  context,
  initialPhotos,
  compact,
}: {
  caseId: string;
  context: PhotoUploadContext;
  initialPhotos: InspectionPhotoItem[];
  // Grilla de thumbnails más chica dentro de element/observation (ya
  // anidados dentro de otras tarjetas) — mismo componente, solo cambia
  // el tamaño de la miniatura.
  compact?: boolean;
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set("photo", file);

    startUpload(async () => {
      const result = await uploadInspectionPhotoAction(caseId, context, formData);
      if (!result.id) {
        setError(result.error ?? "No se pudo subir la foto.");
      } else {
        setPhotos((prev) => [...prev, { id: result.id, url: result.url }]);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const handleDelete = (photoId: string) => {
    const prevPhotos = photos;
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setDeletingId(photoId);
    startUpload(async () => {
      const result = await deleteInspectionPhotoAction(photoId);
      if (!result.success) {
        setPhotos(prevPhotos);
        setError(result.error ?? "No se pudo eliminar la foto.");
      }
      setDeletingId(null);
    });
  };

  const thumbSize = compact ? "w-16 h-16" : "w-20 h-20";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {photos.map((photo) => (
        <div key={photo.id} className={`relative ${thumbSize} rounded-lg overflow-hidden bg-concrete border border-border flex-shrink-0`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- URL de Vercel Blob, mismo patrón que galeria/page.tsx */}
          <img src={photo.url} alt="Fotografía de inspección" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => handleDelete(photo.id)}
            disabled={deletingId === photo.id}
            aria-label="Eliminar fotografía"
            className={`absolute top-1 right-1 w-6 h-6 rounded-full bg-ink/70 text-white flex items-center justify-center disabled:opacity-50 ${FOCUS_RING}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <label
        className={`min-h-11 ${thumbSize} rounded-lg border border-dashed border-border bg-white flex flex-col items-center justify-center gap-1 text-ink-muted cursor-pointer hover:border-ink flex-shrink-0 ${
          isUploading ? "opacity-50 pointer-events-none" : ""
        } ${FOCUS_RING}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handleFileChange}
          disabled={isUploading}
          className="sr-only"
        />
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        <span className="text-[10px] font-medium leading-none">{isUploading ? "Subiendo…" : "Agregar"}</span>
      </label>

      {error && <p className="w-full text-xs text-safety">{error}</p>}
    </div>
  );
}
