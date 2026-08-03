import { CheckCircle2 } from "lucide-react";

// UX-001 (2026-08-03, revisión de BUG-004): reemplaza a NotSureHelper
// cuando la pregunta ya llegó respondida por query param (?tipo=...) —
// mismo criterio de reutilización que NotSureHelper (keyed por
// moduleSlug/questionKey en NOT_SURE_HELPERS, ver question-step.tsx): un
// módulo futuro con el mismo patrón no necesita tocar este archivo.
export function PreselectedConfirmation({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-2xl p-4 bg-safety-tint border border-safety/30 flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-safety flex-shrink-0 mt-0.5" />
      <p className="text-sm text-ink">{text}</p>
    </div>
  );
}
