"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Calculator, Layers, LayoutGrid, Search } from "lucide-react";
import { searchSuggestionsAction } from "./search-actions";
import type { SearchResult } from "@/lib/search";

// Design Spec v1.0 (OBRABIEN.CL, fase "Implementación Design Spec v1.0",
// 2026-09-15, punto 13 del pedido) — restyle del buscador del Home:
// altura 46px, radio 14px (ds-card), ícono 18px, placeholder 14px
// text-tertiary, focus border orange-600 1.5px + halo 3px orange-100. El
// Spec da una sola especificación (no distingue mobile/desktop como el
// restyle anterior de 2026-08-05) — "mobile" y "desktop" ahora comparten
// las mismas medidas del Spec; se mantienen como nombres de prop por
// compatibilidad con los consumidores existentes (Hero sigue pasando
// size="mobile"). Se agrega la variante "compact" (nueva, punto 9 del
// pedido: "buscador visible" en el header desktop) — pill más angosta sin
// botón "Buscar" visible (solo ícono + input + Enter), mismo componente y
// MISMA lógica de búsqueda real (searchSuggestionsAction/goToResult/
// submitSearch), sin duplicar ningún sistema de búsqueda nuevo.
export function SearchBar({
  placeholder = "¿Qué proyecto quieres hacer?",
  size = "desktop",
}: {
  placeholder?: string;
  size?: "mobile" | "desktop" | "compact";
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setHighlightedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      const found = await searchSuggestionsAction(trimmed);
      if (requestId !== requestIdRef.current) return; // respuesta obsoleta, llegó otra tecla después
      setResults(found);
      setIsOpen(true);
    }, 250);
  }

  function goToResult(result: SearchResult) {
    setIsOpen(false);
    router.push(result.href);
  }

  function submitSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (isOpen && results.length > 0) {
        setHighlightedIndex((i) => (i + 1) % results.length);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (isOpen && results.length > 0) {
        setHighlightedIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (isOpen && highlightedIndex >= 0 && results[highlightedIndex]) {
        goToResult(results[highlightedIndex]);
      } else {
        submitSearch();
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const isCompact = size === "compact";

  return (
    <div className={isCompact ? "relative w-[220px]" : "relative"} ref={containerRef}>
      <div
        className={
          isCompact
            ? "flex items-center gap-2 rounded-full h-[38px] px-3.5 bg-ds-muted border border-ds-border focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all"
            : "flex items-center gap-2.5 rounded-ds-card h-[46px] pl-4 pr-2 bg-white border-[1.5px] border-ds-border focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all"
        }
        style={!isCompact ? { boxShadow: "0 14px 30px rgba(0,33,82,.10)" } : undefined}
      >
        <Search className="flex-shrink-0 text-ds-text-tertiary w-[18px] h-[18px]" strokeWidth={1.8} />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none whitespace-nowrap font-body text-[14px] text-ds-navy-900 placeholder:text-ds-text-tertiary"
          autoComplete="off"
        />
        {!isCompact && (
          <button
            onClick={submitSearch}
            className="flex-shrink-0 rounded-[10px] px-4 h-[34px] text-[14px] font-bold text-white flex items-center gap-1.5 bg-ds-orange-600 hover:bg-ds-orange-700 active:scale-[0.97] transition-all"
          >
            Buscar
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-ds-card shadow-ds-modal bg-white border border-ds-border overflow-hidden">
          {results.map((result, index) => {
            const Icon = result.type === "module" ? Layers : result.type === "task" ? Calculator : LayoutGrid;
            return (
              <button
                key={`${result.type}-${result.id}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToResult(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                  index === highlightedIndex ? "bg-ds-muted" : "bg-white"
                }`}
              >
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-ds-navy-900" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate text-ds-navy-900">{result.name}</span>
                  <span className="block text-xs text-ds-text-secondary truncate">
                    {result.type === "category" ? "Categoría" : result.categoryName}
                    {result.description ? ` · ${result.description}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
