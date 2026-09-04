"use client";

import { Lightbulb } from "lucide-react";

// Fase Pre-Producción — "Ayudas referenciales" (2026-09-04): componente
// compartido para el patrón "valor de referencia + acción explícita para
// aplicarlo" usado en varios pasos del configurador integral de Piscina
// (Estructura, Pintura, Excavación, Borde). Regla de producto (sección 2
// del pedido): una referencia NUNCA se aplica sola — el usuario debe
// presionar el botón conscientemente, y el campo queda editable después
// exactamente igual que si lo hubiera tipeado a mano (mismo setValue de
// siempre, sin bloquear el input).
//
// Deliberadamente NO reutiliza `Tip` de volume-step.tsx (ese es solo texto,
// sin acción) ni inventa un mecanismo de "aplicar y bloquear" — un solo
// componente chico, sin estado propio, para no duplicar este patrón visual
// a mano en cada paso.
export function ReferenceHint({
  text,
  actionLabel,
  onApply,
}: {
  text: string;
  actionLabel: string;
  onApply: () => void;
}) {
  return (
    <div className="mt-2 flex items-start gap-2.5 rounded-xl px-4 py-3 bg-safety-tint/50 border border-safety/20">
      <Lightbulb className="w-4 h-4 text-safety flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-ink-muted">{text}</p>
        <button
          type="button"
          onClick={onApply}
          className="mt-1.5 text-xs font-semibold text-safety hover:underline"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
