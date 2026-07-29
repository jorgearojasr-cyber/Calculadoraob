import type { ReactNode } from "react";
import { Check } from "lucide-react";

export type ImageOption = {
  key: string;
  label: string;
  description: string | null;
  imageUrl: string | null;
};

// Variante visual de una pregunta SELECT: foto a la izquierda, ícono +
// título + descripción a la derecha, radio button de selección, borde
// naranjo + check cuando está seleccionada. Reutilizable — QuestionStep la
// activa automáticamente cuando TODAS las opciones de la pregunta traen
// imageUrl (ver Question.hasImageOptions), así que cualquier módulo futuro
// que cargue fotos por Question.imageUrl la obtiene gratis, sin tocar este
// archivo. Los íconos son puramente decorativos y se pasan por afuera
// (ver ICONS_BY_OPTION_KEY en question-step.tsx) porque no hay ningún dato
// de usuario en juego, solo estética.
export function ImageOptionCard({
  option,
  icon,
  selected,
  onSelect,
}: {
  option: ImageOption;
  icon?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-stretch gap-4 text-left rounded-2xl border-2 p-3 transition-colors ${
        selected ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
      }`}
    >
      {option.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={option.imageUrl}
          alt=""
          className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl object-cover border border-border"
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-display font-semibold text-[15px] leading-snug">{option.label}</span>
        </div>
        {option.description && (
          <p className="text-sm text-ink-muted leading-snug">{option.description}</p>
        )}
      </div>
      <div className="flex-shrink-0 self-center">
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            selected ? "border-safety bg-safety" : "border-border bg-white"
          }`}
        >
          {selected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}
