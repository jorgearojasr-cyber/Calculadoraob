"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { UserMenu, type NavUser } from "./user-menu";
import { isWizardRoute } from "@/lib/is-wizard-route";
import { getMenuFeatures } from "@/lib/product-features";

// Cimientos de arquitectura (2026-09-14) — antes este array tenía las 6
// entradas hardcodeadas a mano (mismo problema que motivó toda esta fase:
// Guías/Inspecciones/Biblioteca vivían acá Y por separado en el drawer
// mobile). Ahora se arma en 2 partes:
//   - STRUCTURAL_NAV_ITEMS: navegación del sitio en sí, no son "features de
//     producto" (Inicio es la home; Calculadoras es un ancla al Home, no
//     una ruta propia; Acerca de nosotros es una página informativa
//     estática) — quedan acá tal cual, no tiene sentido forzarlas por el
//     registro (ver punto 5 del pedido: "mantenerlos fuera del registry
//     cuando corresponda").
//   - Lo que viene de `getMenuFeatures()` (Guías, Inspecciones, Biblioteca
//     hoy — Regularización queda fuera, showInMenu:false, decisión ya
//     tomada) se inserta DESPUÉS de "Guías y consejos" en su posición
//     original... en realidad se arma en el orden exacto que ya tenían
//     (ver `order` en product-features.ts, alineado a propósito con este
//     mismo orden visual) y se intercala en el índice correcto más abajo,
//     así el resultado final es EXACTAMENTE la misma lista y el mismo
//     orden que antes, solo que 3 de los 6 ítems ahora vienen de una
//     fuente compartida con el buscador y el drawer mobile.
const STRUCTURAL_NAV_BEFORE = [{ href: "/", label: "Inicio", match: (p: string) => p === "/" }];
const STRUCTURAL_NAV_AFTER_FEATURES = [
  { href: "/acerca-de", label: "Acerca de nosotros", match: (p: string) => p.startsWith("/acerca-de") },
];
// "Calculadoras" es un ancla (`/#empezar`), no una ruta con `pathname` propio
// que resaltar — mismo comportamiento de `match` que ya tenía (`() => false`).
const CALCULADORAS_NAV_ITEM = { href: "/#empezar", label: "Calculadoras", match: () => false };

function buildNavItems() {
  const featureItems = getMenuFeatures().map((feature) => ({
    href: feature.href!,
    label: feature.name,
    match: (p: string) => p.startsWith(feature.href!),
  }));
  return [...STRUCTURAL_NAV_BEFORE, CALCULADORAS_NAV_ITEM, ...featureItems, ...STRUCTURAL_NAV_AFTER_FEATURES];
}

// Rutas donde el nav se muestra "simplificado" — solo el logo, sin ítems
// ni botones de sesión, para no mostrar "Iniciar sesión" redundante
// estando ya en /login, o "Comenzar gratis" estando ya en /registro.
const SIMPLIFIED_ROUTES = new Set(["/login", "/registro"]);

export function TopNav({ isAdmin, user }: { isAdmin: boolean; user: NavUser }) {
  const pathname = usePathname();
  const isSimplified = SIMPLIFIED_ROUTES.has(pathname);
  const navItems = buildNavItems();

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
            {navItems.map((item) => {
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
