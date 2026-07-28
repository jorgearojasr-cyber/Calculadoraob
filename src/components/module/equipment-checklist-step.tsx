"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { WizardQuestion } from "./types";

// Lista de equipos comunes con potencia típica de referencia (práctica
// general no verificada contra ficha técnica — son valores aproximados,
// varían según marca/modelo real del equipo).
const COMMON_EQUIPMENT = [
  { id: "microondas", label: "Microondas", watts: 1200 },
  { id: "hervidor-electrico", label: "Hervidor eléctrico", watts: 1800 },
  { id: "plancha", label: "Plancha", watts: 1200 },
  { id: "secador-de-pelo", label: "Secador de pelo", watts: 1800 },
  { id: "lavadora", label: "Lavadora", watts: 500 },
  { id: "refrigerador", label: "Refrigerador (funcionamiento normal, no arranque)", watts: 150 },
  { id: "aire-acondicionado", label: "Aire acondicionado (split pequeño)", watts: 1000 },
  { id: "estufa-electrica", label: "Estufa eléctrica", watts: 1500 },
  { id: "horno-electrico", label: "Horno eléctrico", watts: 2000 },
  { id: "televisor", label: "Televisor", watts: 100 },
  { id: "computador", label: "Computador", watts: 200 },
  { id: "ampolletas", label: "Ampolletas/luces (grupo, ej. 5 ampolletas LED)", watts: 50 },
] as const;

export function EquipmentChecklistStep({
  question,
  initialValue,
  onAnswer,
}: {
  question: WizardQuestion;
  initialValue: string | number | undefined;
  onAnswer: (value: number) => void;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [otherChecked, setOtherChecked] = useState(initialValue !== undefined);
  const [otherWatts, setOtherWatts] = useState(initialValue !== undefined ? String(initialValue) : "");
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => {
    const fromList = COMMON_EQUIPMENT.reduce((sum, eq) => sum + (checked[eq.id] ? eq.watts : 0), 0);
    const otherNum = Number(otherWatts.replace(",", "."));
    const fromOther = otherChecked && Number.isFinite(otherNum) && otherNum > 0 ? otherNum : 0;
    return fromList + fromOther;
  }, [checked, otherChecked, otherWatts]);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
    setError(null);
  };

  const handleSubmit = () => {
    if (total <= 0) {
      setError("Marca al menos un equipo, o ingresa un valor en \"Otro equipo\".");
      return;
    }
    setError(null);
    onAnswer(total);
  };

  return (
    <div>
      <h2 className="font-display text-[19px] font-semibold tracking-tight mb-2">
        {question.label}
      </h2>
      <p className="text-sm text-ink-muted mb-6">
        Estos son valores típicos de referencia — revisa la etiqueta de tu equipo si quieres un dato más exacto.
      </p>

      <div className="grid gap-2">
        {COMMON_EQUIPMENT.map((eq) => (
          <label
            key={eq.id}
            className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border cursor-pointer transition-colors ${
              checked[eq.id] ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
            }`}
          >
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!checked[eq.id]}
                onChange={() => toggle(eq.id)}
                className="w-4 h-4 flex-shrink-0"
              />
              <span className="text-[15px]">{eq.label}</span>
            </span>
            <span className="font-mono text-xs text-ink-muted shrink-0">~{eq.watts}W</span>
          </label>
        ))}

        <label
          className={`flex items-center gap-3 rounded-xl px-4 py-3 border cursor-pointer transition-colors ${
            otherChecked ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
          }`}
        >
          <input
            type="checkbox"
            checked={otherChecked}
            onChange={(e) => {
              setOtherChecked(e.target.checked);
              setError(null);
            }}
            className="w-4 h-4 flex-shrink-0"
          />
          <span className="text-[15px]">Otro equipo (ingresar Watts manualmente)</span>
        </label>

        {otherChecked && (
          <div className="ml-4 flex items-center gap-3 rounded-2xl px-5 py-4 bg-white border-[1.5px] border-ink">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={otherWatts}
              onChange={(e) => {
                setOtherWatts(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="0"
              className="w-full bg-transparent outline-none text-2xl font-display placeholder:text-ink-faint"
            />
            <span className="font-mono text-sm text-ink-muted">W</span>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl px-5 py-4 bg-concrete border border-border flex items-center justify-between">
        <span className="text-sm text-ink-muted">Potencia total</span>
        <span className="font-display text-xl font-semibold flex items-center gap-1.5">
          {total > 0 && <Check className="w-4 h-4 text-safety" />}
          {total} W
        </span>
      </div>

      {error && <p className="mt-2 text-sm text-safety">{error}</p>}

      <button
        onClick={handleSubmit}
        className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-ink"
      >
        Siguiente
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
