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
    <div className="mb-3 rounded-ds-card p-4 bg-white border border-ds-border flex flex-wrap items-end gap-3">
      <label className="grid gap-1.5">
        <span className="font-body text-sm font-semibold text-ds-navy-900">{label}</span>
        <div className="flex items-center gap-2 rounded-ds-input px-3 py-2 border-[1.5px] border-ds-border focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all">
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-20 bg-transparent outline-none font-display text-lg text-ds-navy-900"
          />
          {unit && <span className="font-body text-xs font-semibold text-ds-text-secondary">{unit}</span>}
        </div>
      </label>
      <button
        type="button"
        onClick={handleRecalculate}
        disabled={!hasChanged || isPending}
        className="rounded-xl px-5 font-body text-sm font-bold text-white bg-ds-orange-600 hover:bg-ds-orange-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ height: 44 }}
      >
        {isPending ? "Recalculando…" : "Recalcular"}
      </button>
    </div>
  );
}
