"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { NavUser } from "./user-menu";
import { isWizardRoute } from "@/lib/is-wizard-route";

// Mismos ítems que no caben en las 4 pestañas fijas del BottomNav
// (Inicio/Proyectos/Mis proyectos/Perfil ya cubren lo demás) + los
// botones de sesión, espejo del lado derecho del TopNav de desktop —
// mismo orden que NAV_ITEMS ahí (sin "Inicio", que ya cubre la pestaña
// fija del BottomNav).
//
// "Calculadoras" e "Inspecciones" (auditoría 2026-09-14, corrección
// pedida por Jorge): antes solo vivían en el TopNav de desktop —
// "Inspecciones" ni siquiera estaba acá, solo dentro del submenú
// "Perfil" del BottomNav Y solo para usuarios con sesión iniciada, así
// que un visitante mobile anónimo no tenía NINGUNA forma de llegar sin
// escribir la URL a mano. Decisión de producto: visible para cualquiera,
// sin login, en ambos anchos — igual que ya se veía en desktop. Sigue
// existiendo además dentro de "Perfil" (ver BottomNav) como acceso
// adicional para quien ya inició sesión — no se quitó de ahí, esto solo
// agrega el acceso principal.
const DRAWER_LINKS = [
  { href: "/#empezar", label: "Calculadoras" },
  { href: "/guias", label: "Guías y consejos" },
  { href: "/inspecciones", label: "Inspecciones" },
  { href: "/galeria", label: "Biblioteca" },
  { href: "/acerca-de", label: "Acerca de nosotros" },
];

const SIMPLIFIED_ROUTES = new Set(["/login", "/registro"]);

export function MobileTopBar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isSimplified = SIMPLIFIED_ROUTES.has(pathname);

  // Mismo criterio que TopNav (desktop): el wizard trae su propio header.
  if (isWizardRoute(pathname)) return null;

  return (
    <>
      <header className="md:hidden fixed inset-x-0 top-0 h-14 z-30 flex items-center justify-between bg-white border-b border-border px-4">
        <Logo />
        {!isSimplified && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="p-2 -mr-2 text-ink"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </header>

      {open && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-ink/40"
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="md:hidden fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-white shadow-lg p-5 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <Logo />
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="p-1 text-ink-faint hover:text-ink">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="grid gap-1 mb-6">
            {DRAWER_LINKS.map((item) => (
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
