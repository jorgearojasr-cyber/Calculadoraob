"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { WizardQuestion } from "./types";

// Lista curada de artefactos comunes en una vivienda chilena, con Watts y
// horas de uso al día DE REFERENCIA (editables) — estimación general de
// mercado según fichas técnicas típicas de electrodomésticos vendidos en
// Chile (Sodimac/Falabella/Cyber) y guías de eficiencia energética
// residencial, NO un dato verificado por fabricante/modelo específico. El
// usuario debe corregir el Watt con el dato real de su equipo (etiqueta o
// manual) si lo tiene a mano — por eso ambos campos quedan editables, nunca
// fijos. Las horas de uso son un punto de partida más subjetivo todavía
// (varía mucho por hogar) — pensadas solo para no dejar el campo en blanco.
type ApplianceDef = {
  id: string;
  label: string;
  watts: number;
  hoursPerDay: number;
  hasQuantity?: boolean;
  quantityDefault?: number;
  quantityLabel?: string;
};

const APPLIANCES: ApplianceDef[] = [
  {
    id: "iluminacion",
    label: "Iluminación (ampolletas LED)",
    watts: 9,
    hoursPerDay: 5,
    hasQuantity: true,
    quantityDefault: 8,
    quantityLabel: "Cantidad de ampolletas",
  },
  { id: "refrigerador", label: "Refrigerador", watts: 150, hoursPerDay: 24 },
  { id: "microondas", label: "Microondas", watts: 1200, hoursPerDay: 0.2 },
  { id: "lavadora", label: "Lavadora", watts: 500, hoursPerDay: 0.3 },
  { id: "televisor", label: "Televisor", watts: 100, hoursPerDay: 4 },
  { id: "computador", label: "Computador", watts: 200, hoursPerDay: 4 },
  { id: "calefactor", label: "Calefactor eléctrico", watts: 1500, hoursPerDay: 4 },
  { id: "aire-acondicionado", label: "Aire acondicionado / split", watts: 1000, hoursPerDay: 3 },
  { id: "hervidor", label: "Hervidor eléctrico", watts: 1800, hoursPerDay: 0.15 },
  { id: "plancha", label: "Plancha", watts: 1200, hoursPerDay: 0.2 },
  { id: "secador-pelo", label: "Secador de pelo", watts: 1800, hoursPerDay: 0.15 },
];

const DAYS_PER_MONTH = 30;

type ItemState = {
  checked: boolean;
  watts: string;
  hours: string;
  quantity: string;
};

export type ConsumptionBreakdownItem = {
  label: string;
  watts: number;
  hoursPerDay: number;
  kwhMes: number;
};

function toNum(raw: string): number {
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function ApplianceConsumptionStep({
  detailQuestion,
  totalQuestion,
  onAnswer,
}: {
  detailQuestion: WizardQuestion;
  totalQuestion: WizardQuestion;
  onAnswer: (values: Record<string, string | number>) => void;
}) {
  const [items, setItems] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(
      APPLIANCES.map((a) => [
        a.id,
        {
          checked: false,
          watts: String(a.watts),
          hours: String(a.hoursPerDay),
          quantity: String(a.quantityDefault ?? 1),
        },
      ])
    )
  );
  const [error, setError] = useState<string | null>(null);

  const update = (id: string, patch: Partial<ItemState>) => {
    setItems((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    setError(null);
  };

  const breakdown = useMemo(() => {
    const result: ConsumptionBreakdownItem[] = [];
    for (const appliance of APPLIANCES) {
      const state = items[appliance.id];
      if (!state.checked) continue;
      const quantity = appliance.hasQuantity ? toNum(state.quantity) || 1 : 1;
      const watts = toNum(state.watts) * quantity;
      const hours = toNum(state.hours);
      if (watts <= 0 || hours <= 0) continue;
      const kwhMes = (watts * hours * DAYS_PER_MONTH) / 1000;
      result.push({ label: appliance.label, watts, hoursPerDay: hours, kwhMes });
    }
    return result;
  }, [items]);

  const totalKwh = useMemo(
    () => Math.round(breakdown.reduce((sum, b) => sum + b.kwhMes, 0) * 100) / 100,
    [breakdown]
  );

  const handleSubmit = () => {
    if (breakdown.length === 0) {
      setError("Marca al menos un artefacto y confirma sus Watts y horas de uso.");
      return;
    }
    setError(null);
    onAnswer({
      [detailQuestion.key]: JSON.stringify(breakdown),
      [totalQuestion.key]: totalKwh,
    });
  };

  return (
    <div>
      <h2 className="font-display text-[19px] font-extrabold text-ds-navy-900 tracking-tight mb-2">
        ¿Qué artefactos usas y cuánto?
      </h2>
      <p className="font-body text-sm text-ds-text-secondary mb-6">
        Los Watts y las horas de uso son valores de referencia — edítalos con el dato real de tu equipo
        (etiqueta o manual) si lo tienes a mano.
      </p>

      <div className="grid gap-2">
        {APPLIANCES.map((appliance) => {
          const state = items[appliance.id];
          const checked = state.checked;
          const itemKwh = checked
            ? (toNum(state.watts) *
                (appliance.hasQuantity ? toNum(state.quantity) || 1 : 1) *
                toNum(state.hours) *
                DAYS_PER_MONTH) /
              1000
            : 0;
          return (
            <div
              key={appliance.id}
              className={`rounded-ds-card border-[1.5px] transition-all ${
                checked ? "border-ds-orange-600 bg-ds-orange-100/40" : "border-ds-border bg-white"
              }`}
            >
              <label className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => update(appliance.id, { checked: e.target.checked })}
                    className="w-4 h-4 flex-shrink-0 accent-ds-orange-600"
                  />
                  <span className="font-body text-[15px] text-ds-navy-900">{appliance.label}</span>
                </span>
                <span className="font-body text-xs font-semibold text-ds-text-secondary shrink-0">~{appliance.watts}W</span>
              </label>

              {checked && (
                <div className="px-4 pb-4 grid gap-3 sm:grid-cols-3">
                  {appliance.hasQuantity && (
                    <div>
                      <span className="block font-body text-xs font-semibold text-ds-text-secondary mb-1">
                        {appliance.quantityLabel}
                      </span>
                      <div className="flex items-center gap-2 rounded-ds-input bg-white border border-ds-border px-3 py-2 focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={state.quantity}
                          onChange={(e) => update(appliance.id, { quantity: e.target.value })}
                          onFocus={(e) => e.target.select()}
                          className="w-full bg-transparent outline-none font-display text-base text-ds-navy-900"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="block font-body text-xs font-semibold text-ds-text-secondary mb-1">
                      Watts {appliance.hasQuantity ? "(por unidad)" : ""}
                    </span>
                    <div className="flex items-center gap-2 rounded-ds-input bg-white border border-ds-border px-3 py-2 focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={state.watts}
                        onChange={(e) => update(appliance.id, { watts: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        className="w-full bg-transparent outline-none font-display text-base text-ds-navy-900"
                      />
                      <span className="font-body text-xs font-semibold text-ds-text-secondary">W</span>
                    </div>
                  </div>
                  <div>
                    <span className="block font-body text-xs font-semibold text-ds-text-secondary mb-1">Horas al día</span>
                    <div className="flex items-center gap-2 rounded-ds-input bg-white border border-ds-border px-3 py-2 focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={state.hours}
                        onChange={(e) => update(appliance.id, { hours: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        className="w-full bg-transparent outline-none font-display text-base text-ds-navy-900"
                      />
                      <span className="font-body text-xs font-semibold text-ds-text-secondary">h/día</span>
                    </div>
                  </div>
                  <p className="sm:col-span-3 font-body text-xs text-ds-text-tertiary">
                    ≈ {itemKwh.toFixed(1)} kWh/mes
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-ds-card px-5 py-4 bg-ds-muted border border-ds-border flex items-center justify-between">
        <span className="font-body text-sm text-ds-text-secondary">Consumo total</span>
        <span className="font-display text-xl font-extrabold text-ds-navy-900">{totalKwh} kWh/mes</span>
      </div>

      {error && <p className="mt-2 font-body text-sm text-danger">{error}</p>}

      <button
        onClick={handleSubmit}
        className="mt-6 rounded-xl px-6 font-body text-[15px] font-bold text-white flex items-center gap-2 bg-ds-orange-600 hover:bg-ds-orange-700 active:scale-[0.98] transition-all"
        style={{ height: 48 }}
      >
        Siguiente
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
