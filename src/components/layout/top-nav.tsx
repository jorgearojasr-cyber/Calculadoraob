"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { UserMenu, type NavUser } from "./user-menu";
import { isWizardRoute } from "@/lib/is-wizard-route";
import { getMenuFeatures } from "@/lib/product-features";
import { SearchBar } from "@/components/home/search-bar";

// Design Spec v1.0 (OBRABIEN.CL, fase "Implementación Design Spec v1.0",
// 2026-09-15, punto 9 del pedido) — el header desktop pasa de 6 ítems
// (Inicio/Calculadoras/Guías y consejos/Inspecciones/Biblioteca/Acerca de
// nosotros) a exactamente 5: Inicio/Calculadoras/Planificar/Aprender/
// Inspecciones. Biblioteca y Acerca de nosotros se movieron a UserMenu
// (con sesión) y SiteFooter (sin sesión, en el Home) — ver esos archivos.
//
// "Planificar" es nuevo acá (antes no estaba en ningún nav — el Home V2 ya
// le dio una ruta real, /planificar, ver esa fase) — estructural, igual
// criterio que "Calculadoras": no viene del registro central porque
// PLANIFICA no tiene FeatureEntry (tiene su propio modelo Prisma real,
// ProjectPlan — ver product-features.ts).
//
// "Aprender" es el mismo feature `guias` del registro (href /guias, MISMA
// fuente que el buscador/drawer/Home), solo con el label del Design Spec
// en este nav puntual — no se le cambia el `name` real en
// product-features.ts (ese sigue siendo "Guías y consejos", usado en
// /guias, el buscador, etc.).
const STRUCTURAL_NAV_BEFORE = [{ href: "/", label: "Inicio", match: (p: string) => p === "/" }];
// Design Spec v1.0 — Parte 2 (Calculadoras/Herramientas), 2026-09-15,
// punto 17 del pedido: "Calculadoras" pasa de ancla (`/#empezar`) a la
// ruta canónica real `/calculadoras` (ver esa página para la decisión de
// arquitectura completa).
const CALCULADORAS_NAV_ITEM = {
  href: "/calculadoras",
  label: "Calculadoras",
  match: (p: string) => p.startsWith("/calculadoras"),
};
const PLANIFICAR_NAV_ITEM = { href: "/planificar", label: "Planificar", match: (p: string) => p.startsWith("/planificar") || p.startsWith("/plan/") };
const NAV_LABEL_OVERRIDES: Record<string, string> = { guias: "Aprender" };
// Solo Aprender + Inspecciones entran en el header desktop (5 links máx.,
// punto 9 del pedido) — Regularización ya no estaba (showInMenu:false,
// decisión previa) y Biblioteca se mueve a UserMenu/Footer.
const DESKTOP_FEATURE_IDS = new Set(["guias", "inspecciones"]);

function buildNavItems() {
  const featureItems = getMenuFeatures()
    .filter((feature) => DESKTOP_FEATURE_IDS.has(feature.id))
    .map((feature) => ({
      href: feature.href!,
      label: NAV_LABEL_OVERRIDES[feature.id] ?? feature.name,
      match: (p: string) => p.startsWith(feature.href!),
    }));
  return [STRUCTURAL_NAV_BEFORE[0], CALCULADORAS_NAV_ITEM, PLANIFICAR_NAV_ITEM, ...featureItems];
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
    // Design Spec v1.0, punto 16: el quiebre mobile→desktop pasa de `md`
    // (768px) a `lg` (1024px) — en la franja 768-1024 (tablet) el sitio
    // sigue mostrando MobileTopBar + BottomNav, no este header. Cambio
    // acotado a los 3 componentes de navegación (este archivo,
    // mobile-top-bar.tsx, bottom-nav.tsx) + main-content.tsx (que
    // compensa su padding/breakpoint) — NO es un cambio global del
    // breakpoint `md` de Tailwind, que sigue significando 768px en el
    // resto del sitio (fuera de alcance de esta fase).
    <header className="hidden lg:flex fixed inset-x-0 top-0 z-30 items-center h-[72px] bg-white border-b border-ds-border px-6">
      <div className="flex-shrink-0">
        <Logo />
      </div>

      {!isSimplified && (
        <>
          <nav className="flex items-center gap-[22px] ml-8 whitespace-nowrap">
            {navItems.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pb-[3px] font-body text-[14px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    active ? "border-ds-orange-600 text-ds-orange-600" : "border-transparent text-ds-text-secondary hover:text-ds-navy-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-6 flex-shrink-0">
            <SearchBar placeholder="¿Qué necesitas hacer?" size="compact" />
          </div>

          <div className="ml-auto flex items-center gap-2.5 flex-shrink-0">
            {user ? (
              <UserMenu user={user} isAdmin={isAdmin} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-ds-input px-4 flex items-center font-body text-[14px] font-semibold text-ds-navy-900 border border-ds-border hover:border-ds-navy-700 transition-colors whitespace-nowrap"
                  style={{ height: 34 }}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="rounded-ds-input px-4 flex items-center font-body text-[14px] font-bold text-white bg-ds-orange-600 hover:bg-ds-orange-700 transition-colors whitespace-nowrap"
                  style={{ height: 34 }}
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
