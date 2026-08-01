"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

const MIN_YEAR = 1900;

// Paso 2 del wizard de Regularización — diseño de UX cerrado y aprobado
// 2026-08-01 (2 rondas de revisión). Deliberadamente NO reutiliza
// QuestionStep tal cual: el campo numérico normal de QuestionStep no
// tiene una salida "No lo sé" visible desde el inicio (solo un link
// "Omitir" al final, y ese patrón fue evaluado y descartado acá por baja
// descubribilidad). Tampoco usa ConditionalRevealStep — ese componente
// asume una sola opción de "revelar" (options[1]) y este paso necesita la
// forma inversa. Es un componente nuevo, chico, sin modificar ningún
// componente compartido existente (ver decisión de arquitectura
// 2026-08-01).
//
// Mecánica de interacción (ajustada 2026-08-01, segunda ronda): "No lo
// sé" NO avanza automáticamente — solo actualiza el estado local
// (anioConstruccion -> null, limpia el año escrito, limpia el error), y
// el usuario avanza con "Continuar", igual que el resto de los pasos
// NUMBER del wizard. Ningún paso del wizard auto-avanza al elegir "No lo
// sé".
export function RegularizationYearStep({
  initialValue,
  onAnswer,
}: {
  initialValue: number | null | undefined;
  onAnswer: (anioConstruccion: number | null) => void;
}) {
  const [textValue, setTextValue] = useState(
    typeof initialValue === "number" ? String(initialValue) : ""
  );
  const [noSabe, setNoSabe] = useState(initialValue === null);
  const [error, setError] = useState<string | null>(null);

  const handleChangeYear = (value: string) => {
    setTextValue(value);
    setNoSabe(false);
    setError(null);
  };

  const handleToggleNoSabe = () => {
    setNoSabe(true);
    setTextValue("");
    setError(null);
  };

  const handleSubmit = () => {
    if (noSabe) {
      onAnswer(null);
      return;
    }
    const currentYear = new Date().getFullYear();
    const year = Number(textValue);
    if (!textValue.trim() || !Number.isInteger(year) || year < MIN_YEAR || year > currentYear) {
      setError(`Ingresa un año entre ${MIN_YEAR} y ${currentYear}, o elige "No lo sé".`);
      return;
    }
    setError(null);
    onAnswer(year);
  };

  return (
    <div>
      <h2 className="font-display text-[19px] font-semibold tracking-tight mb-2">
        ¿En qué año se construyó?
      </h2>
      <p className="text-sm text-ink-muted mb-6">
        No hace falta el dato exacto — un año aproximado es suficiente. Esto nos ayuda a orientarte
        sobre qué vía de regularización podría aplicar.
      </p>

      <div
        className={`flex items-center gap-3 rounded-2xl px-5 py-4 bg-white border-[1.5px] ${
          noSabe ? "border-border opacity-50" : "border-ink"
        }`}
      >
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          disabled={noSabe}
          value={textValue}
          onChange={(e) => handleChangeYear(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="0"
          className="w-full bg-transparent outline-none text-2xl font-display placeholder:text-ink-faint disabled:cursor-not-allowed"
        />
      </div>

      <button
        type="button"
        onClick={handleToggleNoSabe}
        className={`mt-3 text-sm font-medium underline underline-offset-4 ${
          noSabe ? "text-safety" : "text-ink-muted hover:text-ink"
        }`}
      >
        No lo sé
      </button>

      {error && <p className="mt-2 text-sm text-safety">{error}</p>}

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSubmit}
          className="rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-action"
        >
          Continuar
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
