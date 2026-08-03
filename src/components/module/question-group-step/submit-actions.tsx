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
  return (
    <div className="mt-6">
      <button
        onClick={onSubmit}
        className="w-full rounded-full px-6 py-4 text-base font-semibold text-white flex items-center justify-center gap-2 bg-action"
      >
        Siguiente
        <ArrowRight className="w-4 h-4" />
      </button>
      {onSaveForLater && (
        <button
          type="button"
          onClick={onSaveForLater}
          className="mt-3 w-full text-center text-sm font-medium text-ink-muted hover:text-ink underline underline-offset-4"
        >
          Guardar y seguir después
        </button>
      )}
    </div>
  );
}
