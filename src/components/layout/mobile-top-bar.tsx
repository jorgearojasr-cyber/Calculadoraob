"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { NavUser } from "./user-menu";
import { isWizardRoute } from "@/lib/is-wizard-route";

// Mejora UX/Auth flow (2026-09-16, punto 6 del pedido) — el drawer
// pasa a mostrar exactamente el set de opciones pedido, ordenado igual en
// ambos estados de sesión: Inicio/Herramientas primero, luego el ítem que
// cambia según sesión (Aprender siempre presente), y el bloque de cuenta
// separado visualmente abajo. Antes esta lista se armaba dinámicamente
// desde `getMenuFeatures()` (Guías + Inspecciones + Biblioteca) — se
// reemplaza por una lista fija más corta a pedido explícito del punto 6
// ("no duplicar opciones innecesariamente"): Inspecciones ya es
// alcanzable desde la tarjeta "Revisar tu obra" del Home y desde el popover
// de Perfil en BottomNav; Biblioteca desde ese mismo popover. "Acerca de
// ObraBien" se mantiene solo en el estado sin sesión (mismo criterio ya
// usado en UserMenu de desktop: para un usuario con sesión, no compite en
// el primer nivel).
const LOGGED_OUT_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/calculadoras", label: "Herramientas" },
  { href: "/guias", label: "Aprender" },
  { href: "/acerca-de", label: "Acerca de ObraBien" },
];

const LOGGED_IN_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/calculadoras", label: "Herramientas" },
  { href: "/proyectos", label: "Mis proyectos" },
  { href: "/guias", label: "Aprender" },
];

const SIMPLIFIED_ROUTES = new Set(["/login", "/registro"]);

export function MobileTopBar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isSimplified = SIMPLIFIED_ROUTES.has(pathname);
  const drawerLinks = user ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS;

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
            // Auditoría de accesibilidad (2026-09-16, punto 9 del pedido) —
            // el botón controla la visibilidad del drawer pero no lo
            // comunicaba: aria-expanded/aria-controls agregados, sin cambiar
            // comportamiento ni apariencia.
            aria-expanded={open}
            aria-controls="mobile-menu-drawer"
            className="p-2 -mr-2 text-ds-navy-900 rounded-lg hover:bg-ds-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-orange-600 focus-visible:ring-offset-2"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
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
          id="mobile-menu-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="lg:hidden fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-white shadow-ds-modal p-5 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <Logo />
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="p-1 text-ds-text-secondary hover:text-ds-navy-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-orange-600 focus-visible:ring-offset-2 rounded"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <nav className="grid gap-1 mb-6">
            {drawerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === item.href ? "page" : undefined}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-ds-navy-900 hover:bg-ds-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-orange-600 focus-visible:ring-offset-2"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mejora UX/Auth flow (2026-09-16, punto 6 del pedido) — "separar
              visualmente 'Iniciar sesión'": además del border-t ya
              existente, ahora es un bloque con fondo propio (bg-ds-muted)
              en vez de mezclarse con el resto de los links del nav. */}
          <div className="pt-4 mt-1 border-t border-ds-border">
            {user ? (
              <div className="rounded-xl bg-ds-muted p-3 grid gap-2">
                <p className="text-xs uppercase tracking-wide text-ds-text-tertiary font-bold px-1">Mi cuenta</p>
                <p className="text-sm font-medium px-1 truncate text-ds-navy-900">{user.name ?? user.email}</p>
                <SignOutButton className="text-left text-sm font-medium px-1 py-1 text-ds-text-secondary hover:text-ds-navy-900 transition-colors" />
              </div>
            ) : (
              <div className="rounded-xl bg-ds-muted p-3">
                {/* Auditoría de accesibilidad (2026-09-16, punto 10 del
                    pedido) — texto blanco sobre bg-ds-orange-600 mide
                    3.62:1, por debajo del mínimo AA de texto normal (4.5:1)
                    a este tamaño (14px semibold no califica como "texto
                    grande" WCAG). bg-ds-orange-700 en reposo mide 4.65:1
                    (cumple); hover aclara a orange-600 en vez de oscurecer
                    — mismo naranja corporativo, un paso de la escala. */}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-full px-4 py-2.5 text-sm font-semibold text-center text-white bg-ds-orange-700 hover:bg-ds-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-orange-600 focus-visible:ring-offset-2"
                >
                  Iniciar sesión
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
