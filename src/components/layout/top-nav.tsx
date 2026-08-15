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
  { href: "/inspecciones", label: "Inspecciones", match: (p: string) => p.startsWith("/inspecciones") },
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
    <header className="hidden md:flex fixed inset-x-0 top-0 z-30 items-center bg-white border-b border-border py-3.5 px-10">
      <div className="flex-shrink-0">
        <Logo />
      </div>

      {!isSimplified && (
        <>
          <nav className="flex items-center gap-7 ml-[34px]">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pb-[3px] text-[15px] border-b-2 transition-colors ${
                    active
                      ? "border-action text-action font-bold"
                      : "border-transparent text-ink-muted font-medium hover:text-ink"
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
                  className="rounded-[10px] px-[18px] py-2.5 text-[15px] font-semibold text-safety border border-border hover:border-ink transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="rounded-[10px] px-5 py-[11px] text-[15px] font-bold text-white bg-action hover:bg-action-hover transition-colors"
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
