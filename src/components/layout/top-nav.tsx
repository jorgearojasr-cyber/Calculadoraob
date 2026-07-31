"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { UserMenu, type NavUser } from "./user-menu";
import { isWizardRoute } from "@/lib/is-wizard-route";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", match: (p: string) => p === "/" },
  { href: "/#empezar", label: "Calculadoras", match: () => false },
  { href: "/guias", label: "Guías y consejos", match: (p: string) => p.startsWith("/guias") },
  { href: "/galeria", label: "Biblioteca", match: (p: string) => p.startsWith("/galeria") },
  { href: "/acerca-de", label: "Acerca de nosotros", match: (p: string) => p.startsWith("/acerca-de") },
];

// Rutas donde el nav se muestra "simplificado" — solo el logo, sin ítems
// ni botones de sesión, para no mostrar "Iniciar sesión" redundante
// estando ya en /login, o "Comenzar gratis" estando ya en /registro.
const SIMPLIFIED_ROUTES = new Set(["/login", "/registro"]);

export function TopNav({ isAdmin, user }: { isAdmin: boolean; user: NavUser }) {
  const pathname = usePathname();
  const isSimplified = SIMPLIFIED_ROUTES.has(pathname);

  // El wizard de un módulo trae su propio WizardHeader (logo + progreso) —
  // el nav del sitio no debe competir con eso arriba (ver conversación
  // 2026-07-30).
  if (isWizardRoute(pathname)) return null;

  return (
    <header className="hidden md:flex fixed inset-x-0 top-0 h-16 z-30 items-center bg-white border-b border-border px-6">
      <Link href="/" className="flex-shrink-0">
        <Logo />
      </Link>

      {!isSimplified && (
        <>
          <nav className="flex items-center gap-1 ml-10">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    active ? "border-safety text-ink" : "border-transparent text-ink-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <UserMenu user={user} isAdmin={isAdmin} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium border border-border text-ink hover:border-ink transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-action"
                >
                  Comenzar gratis
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
}
