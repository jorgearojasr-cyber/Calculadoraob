import Link from "next/link";
import { TriangleAlert } from "lucide-react";

// ⚠️ SEGURIDAD: /admin no tiene autenticación todavía (decisión temporal).
// Toda la ruta vive bajo el segmento /admin a propósito, para que un
// middleware de auth (matcher: ["/admin/:path*"]) pueda protegerla más
// adelante sin reestructurar nada. NO DESPLEGAR A PRODUCCIÓN sin ese
// middleware — cualquiera con la URL puede editar/borrar la base de
// conocimiento tal como está hoy.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-concrete text-ink font-body">
      <div className="bg-safety text-white text-xs font-mono px-6 py-2 flex items-center gap-2">
        <TriangleAlert className="w-3.5 h-3.5 flex-shrink-0" />
        Panel sin autenticación — no desplegar así a producción.
      </div>

      <header className="max-w-6xl mx-auto px-6 pt-6 flex items-center gap-8">
        <Link href="/admin" className="font-display text-lg font-semibold tracking-tight">
          ObraBien Admin
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-muted">
          <Link href="/admin" className="hover:text-ink transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/categorias" className="hover:text-ink transition-colors">
            Categorías
          </Link>
          <Link href="/admin/modulos" className="hover:text-ink transition-colors">
            Módulos
          </Link>
        </nav>
        <Link href="/" className="ml-auto text-sm text-ink-muted hover:text-ink transition-colors">
          Ver sitio →
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
