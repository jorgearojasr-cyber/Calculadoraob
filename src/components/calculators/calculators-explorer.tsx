"use client";

import { useMemo, useState } from "react";
import { Search, X, LayoutGrid } from "lucide-react";
import { CALCULATOR_CHIPS, filterCalculators, type CalculatorChipId, type CalculatorModule } from "@/lib/calculators";
import { CalculatorCard } from "./calculator-card";

// Design Spec v1.0 — Parte 2, 2026-09-15, puntos 3/11 del pedido.
// Filtro 100% local (sin Server Action por tecla — ver filterCalculators
// en lib/calculators.ts, mismo algoritmo de score que el buscador
// global) sobre la lista de módulos publicados ya cargada por el
// servidor (page.tsx). search + chip se combinan (AND): el chip acota
// por categoría, la búsqueda ordena/filtra por texto dentro de ese
// subconjunto.
export function CalculatorsExplorer({ calculators }: { calculators: CalculatorModule[] }) {
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<CalculatorChipId | "todas">("todas");

  const results = useMemo(() => filterCalculators(calculators, query, chip), [calculators, query, chip]);

  function clearAll() {
    setQuery("");
    setChip("todas");
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 rounded-ds-card h-[46px] pl-4 pr-2 bg-white border-[1.5px] border-ds-border focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all">
        <Search className="flex-shrink-0 text-ds-text-tertiary w-[18px] h-[18px]" strokeWidth={1.8} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar calculadora"
          className="w-full bg-transparent outline-none font-body text-[14px] text-ds-navy-900 placeholder:text-ds-text-tertiary"
          autoComplete="off"
        />
        {query.length > 0 && (
          <button
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="flex-shrink-0 p-1.5 rounded-full text-ds-text-tertiary hover:bg-ds-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mt-3 -mx-4 px-4 sm:-mx-10 sm:px-10 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setChip("todas")}
          className={`flex-shrink-0 h-9 flex items-center justify-center rounded-full px-4 font-body text-[13px] font-semibold border transition-colors whitespace-nowrap ${
            chip === "todas" ? "bg-ds-navy-900 border-ds-navy-900 text-white" : "bg-white border-ds-border text-ds-text-secondary hover:text-ds-navy-900"
          }`}
        >
          Todas
        </button>
        {CALCULATOR_CHIPS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChip(c.id)}
            className={`flex-shrink-0 h-9 flex items-center justify-center rounded-full px-4 font-body text-[13px] font-semibold border transition-colors whitespace-nowrap ${
              chip === c.id ? "bg-ds-navy-900 border-ds-navy-900 text-white" : "bg-white border-ds-border text-ds-text-secondary hover:text-ds-navy-900"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="mt-8 rounded-ds-card-lg p-10 text-center bg-white border border-ds-border">
          <LayoutGrid className="w-7 h-7 mx-auto mb-3 text-ds-text-tertiary" strokeWidth={1.8} />
          <p className="font-body text-ds-text-secondary mb-4">No encontramos una calculadora para esa búsqueda.</p>
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-body text-sm font-bold text-white bg-ds-orange-600 hover:bg-ds-orange-700 transition-colors"
          >
            Ver todas las calculadoras
          </button>
        </div>
      ) : (
        <>
          {/* Mobile/tablet: lista vertical (Design Spec, punto 12: "No usar
              grilla de 2 columnas en mobile"). Desktop (lg+): grilla 3
              columnas con CalculatorCard variant="card". */}
          <div className="mt-4 grid gap-2.5 lg:hidden">
            {results.map((c) => (
              <CalculatorCard key={c.id} calculator={c} variant="row" />
            ))}
          </div>
          <div className="mt-4 hidden lg:grid lg:grid-cols-3 gap-5">
            {results.map((c) => (
              <CalculatorCard key={c.id} calculator={c} variant="card" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
