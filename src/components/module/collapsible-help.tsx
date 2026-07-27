"use client";

import { useState } from "react";
import { Info } from "lucide-react";

// Mismo patrón usado para el helpText de preguntas largas (icono (i) que
// alterna el detalle) — ver QuestionGroupStep. Extraído acá para
// reutilizarlo en cualquier bloque de texto largo que deba mostrarse
// colapsado por defecto (ej. disclaimers de norma técnica).
export function CollapsibleHelp({
  label,
  ariaLabel,
  labelClassName,
  children,
}: {
  label: string;
  ariaLabel: string;
  labelClassName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <p className={`text-xs font-medium ${labelClassName ?? ""}`}>{label}</p>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={ariaLabel}
          aria-expanded={open}
          className="shrink-0 text-ink-faint hover:text-ink"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && <div className="mt-1.5">{children}</div>}
    </div>
  );
}
