"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { NavUser } from "./user-menu";
import { isWizardRoute } from "@/lib/is-wizard-route";
import { getMenuFeatures } from "@/lib/product-features";

// Mismos ítems que no caben en las 4 pestañas fijas del BottomNav
// (Inicio/Proyectos/Mis proyectos/Perfil ya cubren lo demás) + los
// botones de sesión, espejo del lado derecho del TopNav de desktop.
//
// Cimientos de arquitectura (2026-09-14) — antes este array tenía las
// mismas 5 entradas hardcodeadas acá Y por separado en TopNav.tsx
// (exactamente el problema que motivó esta fase: agregar/quitar una
// feature obligaba a acordarse de tocar los 2 archivos). Ahora
// Guías/Inspecciones/Biblioteca vienen de `getMenuFeatures()` — la MISMA
// fuente que ya consume TopNav.tsx y el buscador — y solo "Calculadoras"
// (ancla al Home, no una feature) y "Acerca de nosotros" (página estática
// informativa, no una feature) se quedan hardcodeadas acá, igual criterio
// que en TopNav.tsx (ver ese archivo: "mantenerlos fuera del registry
// cuando corresponda").
function buildDrawerLinks() {
  const featureLinks = getMenuFeatures().map((feature) => ({ href: feature.href!, label: feature.name }));
  return [
    // Design Spec v1.0 — Parte 2, 2026-09-15: ruta canónica real en vez
    // del ancla al Home (ver top-nav.tsx para la misma decisión).
    { href: "/calculadoras", label: "Calculadoras" },
    ...featureLinks,
    { href: "/acerca-de", label: "Acerca de nosotros" },
  ];
}

const SIMPLIFIED_ROUTES = new Set(["/login", "/registro"]);

export function MobileTopBar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isSimplified = SIMPLIFIED_ROUTES.has(pathname);
  const drawerLinks = buildDrawerLinks();

  // Mismo criterio que TopNav (desktop): el wizard trae su propio header.
  if (isWizardRoute(pathname)) return null;

  return (
    <>
      {/* Design Spec v1.0, punto 7: altura 56px, padding lateral 16px,
          íconos 20px, borde inferior 1px, SIN sombra (se retira la sombra
          agregada en el polish visual anterior). Punto 16: quiebre a `lg`
          (1024px) en vez de `md` (768px) — ver nota extensa en
          top-nav.tsx sobre por qué es un cambio acotado a estos 3
          componentes de navegación, no al breakpoint `md` global. */}
      <header className="lg:hidden fixed inset-x-0 top-0 h-14 z-30 flex items-center justify-between bg-white border-b border-ds-border px-4">
        <Logo />
        {!isSimplified && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="p-2 -mr-2 text-ds-navy-900 rounded-lg hover:bg-ds-muted transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </header>

      {open && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-ink/40"
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="lg:hidden fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-white shadow-ds-modal p-5 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <Logo />
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="p-1 text-ink-faint hover:text-ink">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="grid gap-1 mb-6">
            {drawerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-concrete transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-border">
            {user ? (
              <div className="grid gap-2">
                <p className="text-sm font-medium px-3 truncate">{user.name ?? user.email}</p>
                <SignOutButton className="text-left text-sm font-medium px-3 py-2 rounded-xl hover:bg-concrete transition-colors" />
              </div>
            ) : (
              <div className="grid gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-2.5 text-sm font-medium text-center border border-border text-ink"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-center text-white bg-action"
                >
                  Comenzar gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
