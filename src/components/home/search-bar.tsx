"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Calculator, Layers, LayoutGrid, Search } from "lucide-react";
import { searchSuggestionsAction } from "./search-actions";
import type { SearchResult } from "@/lib/search";

// Restyle fiel a la especificación de UI de Home (2026-08-05) — dos
// variantes exactas (mobile/desktop) en vez de una sola clase
// responsive, porque padding/radio/sombra/tamaño de ícono cambian todos
// juntos entre ambas, no solo el tamaño de texto.
export function SearchBar({
  placeholder = "¿Qué proyecto quieres hacer?",
  size = "desktop",
}: {
  placeholder?: string;
  size?: "mobile" | "desktop";
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

  const isMobile = size === "mobile";

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={
          isMobile
            ? "flex items-center gap-[9px] rounded-[18px] pl-[18px] pr-[10px] py-[10px] bg-white border-[1.5px] border-[#D5DCE7]"
            : "flex items-center gap-3 rounded-[24px] pl-7 pr-[17px] py-[17px] bg-white border-[1.5px] border-[#D5DCE7]"
        }
        style={{
          boxShadow: isMobile ? "0 14px 30px rgba(0,33,82,.14)" : "0 20px 46px rgba(0,33,82,.16)",
        }}
      >
        <Search
          className="flex-shrink-0 text-[#5B6577]"
          style={{ width: isMobile ? 19 : 22, height: isMobile ? 19 : 22 }}
          strokeWidth={2}
        />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none whitespace-nowrap text-[#10203A] placeholder:text-[#8A93A2]"
          style={{ fontSize: isMobile ? 16 : 21 }}
          autoComplete="off"
        />
        <button
          onClick={submitSearch}
          className={
            isMobile
              ? "flex-shrink-0 rounded-[12px] px-[22px] py-[14px] text-[16px] font-bold text-white flex items-center gap-2 bg-action"
              : "flex-shrink-0 rounded-2xl px-[38px] py-[18px] text-[18px] font-bold text-white flex items-center gap-[9px] bg-action"
          }
          style={{ boxShadow: "0 10px 24px rgba(255,78,0,.32)" }}
        >
          Buscar
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl shadow-lg bg-white border border-border overflow-hidden">
          {results.map((result, index) => {
            const Icon = result.type === "module" ? Layers : result.type === "task" ? Calculator : LayoutGrid;
            return (
              <button
                key={`${result.type}-${result.id}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToResult(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                  index === highlightedIndex ? "bg-concrete" : "bg-white"
                }`}
              >
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-safety" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{result.name}</span>
                  <span className="block text-xs text-ink-muted truncate">
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
