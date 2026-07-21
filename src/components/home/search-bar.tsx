"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Layers, LayoutGrid, Search } from "lucide-react";
import { searchSuggestionsAction } from "./search-actions";
import type { SearchResult } from "@/lib/search";

export function SearchBar() {
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

  return (
    <div className="mt-8 relative" ref={containerRef}>
      <div className="flex items-center gap-3 rounded-2xl px-5 py-4 shadow-sm bg-white border-[1.5px] border-ink">
        <Search className="w-5 h-5 flex-shrink-0 text-ink-muted" />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Ej: radier, pintura, piscina..."
          className="w-full bg-transparent outline-none text-base placeholder:text-ink-faint"
          autoComplete="off"
        />
        <button
          onClick={submitSearch}
          className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 bg-safety"
        >
          Calcular
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl shadow-lg bg-white border border-border overflow-hidden">
          {results.map((result, index) => {
            const Icon = result.type === "module" ? Layers : LayoutGrid;
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
                    {result.type === "category" ? "Categoría" : result.categoryName} · {result.description}
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
