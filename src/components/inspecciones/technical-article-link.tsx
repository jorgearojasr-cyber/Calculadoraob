"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

const FOCUS_RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";

// Piloto Fase 5B: visualización MÍNIMA para probar que
// InspectionChecklistItem.technicalArticleSlug realmente resuelve a un
// TechnicalArticle real y que el inspector puede llegar a él desde la
// pregunta — no es la biblioteca completa (eso queda fuera de esta
// fase). Contenido en `content` es Markdown plano; se muestra tal cual
// (whitespace-pre-wrap) sin parser de Markdown, para no agregar una
// dependencia nueva solo para este piloto.
export function TechnicalArticleLink({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`min-h-11 inline-flex items-center gap-1.5 px-1 text-xs font-medium text-safety ${FOCUS_RING}`}
      >
        <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
        {title}
        {open ? <ChevronUp className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />}
      </button>
      {open && (
        <div className="mt-2 rounded-lg p-3 bg-safety-tint border border-safety/20 text-xs text-ink whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
}
