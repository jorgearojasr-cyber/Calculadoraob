import type { ReactNode } from "react";
import { Check } from "lucide-react";

export type ImageOption = {
  key: string;
  label: string;
  description: string | null;
  imageUrl: string | null;
};

// Variante visual de una pregunta SELECT: foto 16:9 + ícono + título +
// descripción, radio button de selección, borde naranjo + check cuando
// está seleccionada. Reutilizable — QuestionStep la activa automáticamente
// cuando TODAS las opciones de la pregunta traen imageUrl (ver
// Question.hasImageOptions), así que cualquier módulo futuro que cargue
// fotos por Question.imageUrl la obtiene gratis, sin tocar este archivo.
// Los íconos son puramente decorativos y se pasan por afuera (ver
// ICONS_BY_OPTION_KEY en question-step.tsx) porque no hay ningún dato de
// usuario en juego, solo estética.
//
// Layout 16:9 (spec "ObraBien Calculadora - Flujo rediseñado", 2026-08-01,
// regla de imagen para toda pantalla de selección): en listas de 3+
// opciones, miniatura 16:9 a la izquierda en mobile, portada de ancho
// completo arriba en desktop; en listas de 2 opciones, portada de ancho
// completo en ambos anchos (`forceCover`, lo decide el caller según
// `question.options.length` — este componente solo dibuja). Mismo
// markup en los dos casos, solo cambian las clases responsive (evita
// duplicar el layout en dos variantes de JSX). Si el módulo todavía no
// tiene foto real (imageUrl null), el espacio queda con el fondo
// #E7EBF2 y la tarjeta NO cambia de alto — mismo bloque, sin imagen
// adentro.
export function ImageOptionCard({
  option,
  icon,
  selected,
  onSelect,
  forceCover = false,
}: {
  option: ImageOption;
  icon?: ReactNode;
  selected: boolean;
  onSelect: () => void;
  forceCover?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`text-left rounded-2xl border-2 p-3 transition-colors flex gap-4 items-stretch focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${
        forceCover ? "flex-col" : "flex-row sm:flex-col"
      } ${selected ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"}`}
    >
      <div
        className={`aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-[#E7EBF2] ${
          forceCover ? "w-full" : "w-28 sm:w-full"
        }`}
      >
        {option.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={option.imageUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      {/* items-start (no items-center): en columnas angostas (4 por fila
          en desktop, ver forceCover=false) un label que envuelve a 2-3
          líneas hacía que el radio quedara centrado a media altura,
          tapando el texto — bug real encontrado al verificar visualmente
          Radier/uso con las 4 opciones reales. */}
      <div className="flex-1 min-w-0 flex items-start gap-3">
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-display font-semibold text-[15px] leading-snug">{option.label}</span>
          </div>
          {option.description && (
            <p className="text-sm text-ink-muted leading-snug">{option.description}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selected ? "border-safety bg-safety" : "border-border bg-white"
            }`}
          >
            {selected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
          </div>
        </div>
      </div>
    </button>
  );
}
