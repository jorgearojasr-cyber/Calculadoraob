"use client";

import { useEffect, useState, useTransition } from "react";

// Campo editable genérico en la pantalla de RESULTADO que dispara un
// recálculo completo en el servidor (misma calculateModuleAction que usa
// el wizard) sin volver atrás — ej. ajustar el espesor de Radier y que
// todo lo que depende de él (volumen, camiones, sacos/arena/gravilla/
// agua) recalcule. El mecanismo es genérico (moduleId se resuelve afuera,
// acá solo se recibe el callback), pero por ahora solo se conecta en
// Radier — ver RECALCULATE_FIELDS en module-wizard.tsx.
export function RecalculateField({
  label,
  unit,
  value,
  onRecalculate,
}: {
  label: string;
  unit: string | null;
  value: number;
  onRecalculate: (newValue: number) => Promise<void>;
}) {
  const [inputValue, setInputValue] = useState(String(value));
  const [isPending, startTransition] = useTransition();

  // Resincroniza el input con el valor confirmado por el servidor después
  // de un recálculo exitoso — solo reacciona a `value` (prop, la fuente
  // de verdad tras el recálculo), nunca pisa lo que el usuario esté
  // tipeando en medio de una edición.
  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const parsed = Number(inputValue.replace(",", "."));
  const isValid = Number.isFinite(parsed) && parsed > 0;
  const hasChanged = isValid && parsed !== value;

  const handleRecalculate = () => {
    if (!hasChanged) return;
    startTransition(async () => {
      await onRecalculate(parsed);
    });
  };

  return (
    <div className="mb-3 rounded-2xl p-4 bg-white border border-border flex flex-wrap items-end gap-3">
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 border-[1.5px] border-ink">
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-20 bg-transparent outline-none font-display text-lg"
          />
          {unit && <span className="font-mono text-xs text-ink-muted">{unit}</span>}
        </div>
      </label>
      <button
        type="button"
        onClick={handleRecalculate}
        disabled={!hasChanged || isPending}
        className="rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-action disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? "Recalculando…" : "Recalcular"}
      </button>
    </div>
  );
}
