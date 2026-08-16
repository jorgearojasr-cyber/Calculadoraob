"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadInspectionCoverPhotoAction } from "@/app/(app)/inspecciones/[id]/actions";

const FOCUS_RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";

// Fase 11K — foto de portada opcional del caso (docs/FASE11J...,
// sección E). Un solo slot con semántica de REEMPLAZO (no de agregar
// varias, a diferencia de <PhotoUpload/>) — por eso es un componente
// aparte y no una variante de aquel. Nunca bloquea la creación de una
// inspección: se ofrece siempre desde la cabecera del caso ya creado.
export function CoverPhotoUpload({ caseId, initialUrl }: { caseId: string; initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set("photo", file);

    startUpload(async () => {
      const result = await uploadInspectionCoverPhotoAction(caseId, formData);
      if (!result.url) {
        setError(result.error ?? "No se pudo subir la foto.");
      } else {
        setUrl(result.url);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  return (
    <div>
      {url ? (
        <div className="relative w-full h-40 sm:h-48 rounded-2xl overflow-hidden bg-concrete border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- URL de Vercel Blob, mismo patrón que photo-upload.tsx */}
          <img src={url} alt="Foto principal de la inspección" className="w-full h-full object-cover" />
          <label
            className={`absolute bottom-2.5 right-2.5 min-h-11 inline-flex items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold bg-ink/80 text-white cursor-pointer ${FOCUS_RING} ${
              isUploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
              className="sr-only"
            />
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            {isUploading ? "Subiendo…" : "Cambiar foto"}
          </label>
        </div>
      ) : (
        <label
          className={`min-h-11 flex flex-col items-center justify-center gap-1.5 w-full py-6 rounded-2xl border border-dashed border-border bg-white text-ink-muted cursor-pointer hover:border-ink ${FOCUS_RING} ${
            isUploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
            className="sr-only"
          />
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          <span className="text-xs font-medium">{isUploading ? "Subiendo…" : "Agregar foto de la vivienda (opcional)"}</span>
        </label>
      )}
      {error && <p className="mt-1.5 text-xs text-safety">{error}</p>}
    </div>
  );
}
