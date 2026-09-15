"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, FolderKanban, ShoppingCart, Images, User, LogIn, ClipboardCheck } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AssistantWidget, type AssistantGroup } from "@/components/assistant/assistant-widget";

type NavUser = { name: string | null; email: string | null } | null;

// DOCUMENTACIÓN — Cimientos de arquitectura (2026-09-14, punto 6 del
// pedido) + Home ObraBien V2 (2026-09-14, punto 14 del pedido).
//
// Estructura (5 slots, ninguno viene del registro central):
//   1. "Inicio" (/) — navegación estructural, no una feature.
//   2. "Herramientas" (/#empezar) — MISMO ancla y comportamiento que el
//      slot 2 tenía antes bajo el label "Proyectos" (investigado antes de
//      tocarlo, punto 14 del pedido: es el ancla al selector "por
//      proyecto/material" del Home, idéntico a "Calculadoras" en
//      TopNav/drawer). Se renombra únicamente el label — el label
//      "Proyectos" era confuso porque el slot 4 ya se llama "Mis
//      proyectos" y lleva a algo distinto (SavedProject); no se cambia el
//      href ni se rompe ningún comportamiento existente.
//   3. FAB central — AssistantWidget ("Preguntar ahora"), no es un link.
//      Comportamiento intacto (fuera de alcance del punto 14 — no se
//      reubica ni se convierte en "Nuevo proyecto" en esta fase).
//   4. "Proyectos" (/proyectos) — SavedProject, requiere sesión
//      (protegido por middleware.ts, no por esta UI). Antes decía "Mis
//      proyectos"; se acorta a "Proyectos" para acercarse a la
//      composición objetivo del mockup (Inicio/Herramientas/+/Proyectos/
//      Perfil, punto 14 del pedido) sin cambiar destino ni protección.
//   5. "Perfil" — abre un popover propio (no una ruta) con: Lista de
//      compras, Galería de proyectos, Inspecciones (solo si `user` existe)
//      o "Ingresar" (si no hay sesión). Sin cambios en esta fase.
//
// "Profesionales" NO se agrega como slot nuevo — sigue sin funcionalidad
// real (área `profesionales` en product-features.ts, `status:"planned"`,
// ver PLANNED_FEATURES); el punto 14 pide explícitamente no crear accesos
// inexistentes. La reorganización de "Proyectos" cuando Profesionales
// exista de verdad queda para una fase futura, tal como anticipaba la
// documentación anterior.
//
// Lista de compras sigue sin migrar al registro central (ver
// product-feature-registry.md, "qué se evaluó y no se migró") — exclusiva
// del popover de Perfil, sin cambios acá.
export function BottomNav({ user, assistantGroups }: { user: NavUser; assistantGroups: AssistantGroup[] }) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[10px] font-medium ${
      active ? "text-safety" : "text-white/60"
    }`;

  return (
    <>
      {profileOpen && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setProfileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-ink/20"
        />
      )}

      {profileOpen && (
        <div className="md:hidden fixed bottom-20 right-4 z-50 rounded-2xl bg-white border border-border shadow-lg p-3 min-w-[180px]">
          {user ? (
            <>
              <p className="text-xs text-ink-muted px-2 pb-2 truncate">{user.name ?? user.email}</p>
              <Link
                href="/lista-compras"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg hover:bg-concrete transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Lista de compras
              </Link>
              <Link
                href="/galeria"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg hover:bg-concrete transition-colors"
              >
                <Images className="w-4 h-4" />
                Galería de proyectos
              </Link>
              <Link
                href="/inspecciones"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg hover:bg-concrete transition-colors"
              >
                <ClipboardCheck className="w-4 h-4" />
                Inspecciones
              </Link>
              <SignOutButton className="w-full text-left text-sm font-medium px-2 py-2 rounded-lg hover:bg-concrete transition-colors" />
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg hover:bg-concrete transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Ingresar
            </Link>
          )}
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-navy border-t border-navy-border flex items-stretch px-2 pb-[env(safe-area-inset-bottom)]">
        <Link href="/" className={itemClass(pathname === "/")}>
          <Home className="w-5 h-5" />
          Inicio
        </Link>
        <Link href="/#empezar" className={itemClass(false)}>
          <Wrench className="w-5 h-5" />
          Herramientas
        </Link>

        <div className="flex-1 flex items-center justify-center">
          <AssistantWidget groups={assistantGroups} variant="fab" />
        </div>

        <Link href="/proyectos" className={itemClass(pathname.startsWith("/proyectos"))}>
          <FolderKanban className="w-5 h-5" />
          Proyectos
        </Link>
        <button onClick={() => setProfileOpen((v) => !v)} className={itemClass(profileOpen)}>
          <User className="w-5 h-5" />
          Perfil
        </button>
      </nav>
    </>
  );
}
