"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Mismo patrón usado para el helpText de preguntas largas (icono que
// alterna el detalle) — ver QuestionGroupStep. Extraído acá para
// reutilizarlo en cualquier bloque de texto largo que deba mostrarse
// colapsado por defecto (ej. disclaimers de norma técnica).
//
// Design Spec v1.0, sección I.7 (Parte 4): tratamiento tipo "acordeón" —
// chevron 14px que rota al abrir, fondo ds-bg cuando está abierto, texto
// secundario 12px. Mismo componente/API (label/ariaLabel/children) usado
// por PricedResults, RecipeCard, DosificacionCard, NormsDisclaimer,
// TechnicalNotesSection — ningún caller cambió su forma de invocarlo.
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
    <div className={open ? "rounded-ds-input bg-ds-bg -mx-2 px-2 py-1.5" : ""}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="flex items-center gap-1.5 w-full text-left"
      >
        <p className={`font-body text-xs font-semibold flex-1 ${labelClassName ?? "text-ds-text-secondary"}`}>{label}</p>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-ds-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-1.5 font-body text-xs text-ds-text-secondary">{children}</div>}
    </div>
  );
}
