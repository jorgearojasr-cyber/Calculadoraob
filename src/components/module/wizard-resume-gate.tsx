"use client";

// BUG-007: se muestra en vez del paso actual del asistente cuando existe un
// borrador autoguardado (ver wizard-draft.ts) — nunca se restaura solo, el
// usuario decide. Estilo de botones consistente con SubmitActions
// (primario bg-action) y con el botón secundario ya usado en
// result-screen.tsx (outline border-ink).
export function WizardResumeGate({ onResume, onDiscard }: { onResume: () => void; onDiscard: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8 text-center">
      <p className="font-display text-xl md:text-2xl font-semibold tracking-tight mb-2">
        Encontramos un cálculo sin terminar.
      </p>
      <p className="text-sm text-ink-muted mb-6">¿Quieres continuar donde quedaste?</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={onResume}
          className="rounded-full px-6 py-3 text-sm font-semibold text-white bg-action"
        >
          Continuar
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-full px-6 py-3 text-sm font-medium border border-ink"
        >
          Comenzar de nuevo
        </button>
      </div>
    </div>
  );
}
