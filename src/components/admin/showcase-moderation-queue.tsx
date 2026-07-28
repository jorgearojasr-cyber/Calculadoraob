"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { approveShowcaseAction, rejectShowcaseAction } from "@/app/admin/proyectos-galeria/actions";

type Showcase = {
  id: string;
  title: string;
  story: string;
  coverUrl: string | null;
  uploaderLabel: string;
  createdAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

export function ShowcaseModerationQueue({ showcases: initialShowcases }: { showcases: Showcase[] }) {
  const [showcases, setShowcases] = useState(initialShowcases);
  const [isPending, startTransition] = useTransition();

  const handleDecide = (id: string, action: "approve" | "reject") => {
    startTransition(async () => {
      await (action === "approve" ? approveShowcaseAction(id) : rejectShowcaseAction(id));
      setShowcases((prev) => prev.filter((s) => s.id !== id));
    });
  };

  if (showcases.length === 0) {
    return (
      <p className="text-sm text-ink-muted rounded-xl p-5 bg-white border border-border">
        No hay proyectos pendientes de revisión.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {showcases.map((s) => (
        <div key={s.id} className="rounded-xl border border-border bg-white overflow-hidden">
          {s.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- URL de Vercel Blob
            <img src={s.coverUrl} alt="" className="w-full h-48 object-cover" />
          )}
          <div className="p-3">
            <p className="text-sm font-semibold">{s.title}</p>
            <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{s.story}</p>
            <p className="text-xs text-ink-faint mt-1">
              {s.uploaderLabel} · {dateFormatter.format(new Date(s.createdAt))}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => handleDecide(s.id, "approve")}
                disabled={isPending}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white bg-success flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                Aprobar
              </button>
              <button
                onClick={() => handleDecide(s.id, "reject")}
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
