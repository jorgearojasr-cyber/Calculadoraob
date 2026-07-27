"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { approvePhotoAction, rejectPhotoAction } from "@/app/admin/fotos/actions";

type Photo = {
  id: string;
  url: string;
  moduleName: string;
  uploaderLabel: string;
  createdAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

export function PhotoModerationQueue({ photos: initialPhotos }: { photos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [isPending, startTransition] = useTransition();

  const handleDecide = (id: string, action: "approve" | "reject") => {
    startTransition(async () => {
      await (action === "approve" ? approvePhotoAction(id) : rejectPhotoAction(id));
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    });
  };

  if (photos.length === 0) {
    return (
      <p className="text-sm text-ink-muted rounded-xl p-5 bg-white border border-border">
        No hay fotos pendientes de revisión.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => (
        <div key={photo.id} className="rounded-xl border border-border bg-white overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt="" className="w-full h-48 object-cover" />
          <div className="p-3">
            <p className="text-sm font-medium">{photo.moduleName}</p>
            <p className="text-xs text-ink-muted mt-0.5">
              {photo.uploaderLabel} · {dateFormatter.format(new Date(photo.createdAt))}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => handleDecide(photo.id, "approve")}
                disabled={isPending}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white bg-success flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                Aprobar
              </button>
              <button
                onClick={() => handleDecide(photo.id, "reject")}
                disabled={isPending}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-safety border border-safety flex items-center gap-1 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Rechazar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
