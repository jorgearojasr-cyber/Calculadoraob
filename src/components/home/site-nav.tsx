import { Ruler } from "lucide-react";

export function SiteNav() {
  return (
    <header className="max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md flex items-center justify-center bg-ink">
          <Ruler className="w-4 h-4 text-concrete" />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">ObraBien</span>
      </div>
      <nav className="hidden md:flex items-center gap-8 text-sm text-ink-muted">
        <a href="#categorias" className="hover:text-ink transition-colors">
          Categorías
        </a>
        <a href="#como-funciona" className="hover:text-ink transition-colors">
          Cómo funciona
        </a>
        <a href="#confianza" className="hover:text-ink transition-colors">
          Confianza
        </a>
      </nav>
      <button className="text-sm font-medium px-4 py-2 rounded-full border border-ink">
        Ingresar
      </button>
    </header>
  );
}
