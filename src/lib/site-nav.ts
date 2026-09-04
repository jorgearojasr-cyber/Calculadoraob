// Fase Pre-Producción Final (2026-09-04) — fuente única de las 6 secciones
// públicas principales del sitio, compartida entre el nav de desktop
// (top-nav.tsx) y el drawer del menú hamburguesa de mobile
// (mobile-top-bar.tsx). Antes cada uno tenía su propio array hardcodeado
// (NAV_ITEMS / DRAWER_LINKS) y quedaron desincronizados: el drawer de
// mobile solo mostraba 3 de las 6 (perdía Inicio, Calculadoras e
// Inspecciones), sin ninguna razón de producto para la diferencia — un
// desalineamiento accidental, no una decisión de diseño.
export type SiteNavItem = { href: string; label: string };

export const SITE_NAV_ITEMS: SiteNavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/#empezar", label: "Calculadoras" },
  { href: "/guias", label: "Guías y consejos" },
  { href: "/inspecciones", label: "Inspecciones" },
  { href: "/galeria", label: "Biblioteca" },
  { href: "/acerca-de", label: "Acerca de nosotros" },
];

// Mismo criterio de "activo" que ya usaba cada entrada de TopNav antes de
// esta fase (match por prefijo, exacto solo para "/", siempre inactivo
// para el ancla "/#empezar" ya que no se refleja en pathname).
export function isSiteNavItemActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/#empezar") return false;
  return pathname.startsWith(href);
}
