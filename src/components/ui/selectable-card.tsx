import { Check } from "lucide-react";

// Design Spec v1.0 — Parte 3 (Flujo de calculadora/wizard), 2026-09-15,
// punto 8 del pedido. Componente genérico para una opción seleccionable
// dentro de un wizard (título solo, o título + descripción) — usado hoy
// por QuestionStep en la lista de opciones SELECT sin foto (la variante
// CON foto sigue siendo ImageOptionCard, con su propio layout de imagen
// 16:9; se le aplicaron los mismos tokens de color/selección por
// separado, ver ese archivo, en vez de forzarlo a esta forma genérica y
// arriesgar romper su estructura real).
//
// Semántica: <button aria-pressed> — ya era el patrón usado acá antes de
// esta fase (selección única, no un grupo de checkboxes), se preserva en
// vez de reinterpretarlo como radiogroup.
//
// Estados del Spec: DEFAULT (borde ds-border, fondo blanco), HOVER
// (sombra ds-card-elevated), SELECTED (borde 1.5px orange-600, fondo
// orange-100 tenue, check visible), ACTIVE (scale .98), DISABLED (fondo
// ds-muted, texto tertiary, sin bajar opacidad general del bloque).
export function SelectableCard({
  label,
  description,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  description?: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex items-center justify-between gap-3 text-left rounded-ds-card px-5 py-4 border-[1.5px] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-orange-600 ${
        disabled
          ? "border-ds-border bg-ds-muted text-ds-text-tertiary cursor-not-allowed"
          : selected
            ? "border-ds-orange-600 bg-ds-orange-100/40 hover:shadow-ds-card-elevated active:scale-[0.98]"
            : "border-ds-border bg-white hover:shadow-ds-card-elevated active:scale-[0.98]"
      }`}
    >
      <span className="min-w-0">
        <span className={`block font-body font-bold text-[15px] leading-snug ${disabled ? "text-ds-text-tertiary" : "text-ds-navy-900"}`}>
          {label}
        </span>
        {description && (
          <span className={`block text-[13px] leading-snug mt-0.5 ${disabled ? "text-ds-text-tertiary" : "text-ds-text-secondary"}`}>
            {description}
          </span>
        )}
      </span>
      <span
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          selected ? "border-ds-orange-600 bg-ds-orange-600" : "border-ds-border bg-white"
        }`}
      >
        {selected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
      </span>
    </button>
  );
}
