import { Download } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-wrap items-center justify-center sm:justify-between gap-2 text-xs text-ink-faint text-center sm:text-left">
      <span>© {new Date().getFullYear()} ObraBien Calcula</span>
      <div className="flex items-center gap-1.5 font-mono">
        <Download className="w-3.5 h-3.5" />
        Exporta tus resultados en cualquier momento
      </div>
    </footer>
  );
}
