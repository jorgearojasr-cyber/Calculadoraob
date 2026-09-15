"use client";

import { ArrowRight } from "lucide-react";

// Botón "Siguiente" (ancho completo, grande) + "Guardar y seguir después"
// como link secundario debajo — solo para pasos con diagrama (ver
// conversación 2026-07-30). Los grupos sin diagrama no reciben
// onSaveForLater y siguen con el botón chico de siempre (ver más abajo).
// Exportado por el mismo motivo que FieldRow (ver FoundationStep).
export function SubmitActions({
  onSubmit,
  onSaveForLater,
}: {
  onSubmit: () => void;
  onSaveForLater?: () => void;
}) {
  // Design Spec v1.0 — Parte 3B (cierre wide steps), 2026-09-15: PrimaryButton
  // (48px, radio 12px, orange-600 → orange-700 hover, active scale .98) +
  // link secundario. Mismos callbacks, mismo comportamiento.
  return (
    <div className="mt-6">
      <button
        onClick={onSubmit}
        className="w-full rounded-xl px-6 font-body text-[15px] font-bold text-white flex items-center justify-center gap-2 bg-ds-orange-600 hover:bg-ds-orange-700 active:scale-[0.98] transition-all"
        style={{ height: 48 }}
      >
        Siguiente
        <ArrowRight className="w-4 h-4" />
      </button>
      {onSaveForLater && (
        <button
          type="button"
          onClick={onSaveForLater}
          className="mt-3 w-full text-center font-body text-sm font-semibold text-ds-text-secondary hover:text-ds-navy-900 underline underline-offset-4"
        >
          Guardar y seguir después
        </button>
      )}
    </div>
  );
}
