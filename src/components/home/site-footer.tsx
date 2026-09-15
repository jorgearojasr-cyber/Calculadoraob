import Link from "next/link";
import { Download } from "lucide-react";

// Design Spec v1.0 (2026-09-15, punto 9 del pedido): Biblioteca y Acerca de
// nosotros bajaron del primer nivel del header desktop (máx. 5 links) — se
// agregan acá como su "solución secundaria" para un visitante SIN sesión
// (UserMenu cubre el caso con sesión, en cualquier página; el footer solo
// vive en el Home, pero es la superficie de menor cambio disponible para
// alguien sin cuenta).
export function SiteFooter() {
  return (
    <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col items-center gap-4 sm:gap-3 text-center sm:text-left">
      <nav className="flex items-center gap-5 text-xs font-semibold text-ds-text-secondary">
        <Link href="/galeria" className="hover:text-ds-navy-900 transition-colors">
          Biblioteca
        </Link>
        <Link href="/acerca-de" className="hover:text-ds-navy-900 transition-colors">
          Acerca de nosotros
        </Link>
      </nav>
      <div className="w-full flex flex-wrap items-center justify-center sm:justify-between gap-2 text-xs text-ink-faint">
        <span>© {new Date().getFullYear()} ObraBien Calcula</span>
        <div className="flex items-center gap-1.5 font-mono">
          <Download className="w-3.5 h-3.5" />
          Exporta tus resultados en cualquier momento
        </div>
      </div>
    </footer>
  );
}
