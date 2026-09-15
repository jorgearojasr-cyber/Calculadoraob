"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, FolderKanban, ShoppingCart, Images, User, LogIn, ClipboardCheck } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AssistantWidget, type AssistantGroup } from "@/components/assistant/assistant-widget";

type NavUser = { name: string | null; email: string | null } | null;

// DOCUMENTACIÓN — Cimientos de arquitectura (2026-09-14, punto 6 del
// pedido): esta fase NO aplica todavía la nueva BottomNav visual del mockup
// (Inicio / Herramientas / [+] / Profesionales / Perfil) — se deja
// documentado acá qué hay hoy y qué debería migrar en la futura fase
// visual, sin tocar la estructura ni el comportamiento actual.
//
// Estructura actual (5 slots, ninguno viene del registro central):
//   1. "Inicio" (/) — navegación estructural, no una feature.
//   2. "Proyectos" (/#empezar) — pese al label, es el mismo ancla al
//      selector "por proyecto/material" del Home que "Calculadoras" en
//      TopNav/drawer — no es "Mis proyectos" (eso es el slot 4). Nombre
//      confuso heredado, fuera de alcance de esta fase (sería un cambio
//      visual/de copy, no de arquitectura).
//   3. FAB central — AssistantWidget ("Preguntar ahora"), no es un link.
//   4. "Mis proyectos" (/proyectos) — SavedProject, requiere sesión
//      (protegido por middleware.ts, no por esta UI).
//   5. "Perfil" — abre un popover propio (no una ruta) con: Lista de
//      compras, Galería de proyectos, Inspecciones (solo si `user` existe)
//      o "Ingresar" (si no hay sesión).
//
// Mapeo hacia la futura BottomNav (Inicio / Herramientas / Nuevo proyecto /
// Profesionales / Perfil), a evaluar en la fase visual:
//   - "Inicio" se mantiene igual.
//   - "Herramientas" reemplazaría al slot 2 actual ("Proyectos") — probable
//     candidato para mostrar ahí Calculadoras + las features del registro
//     (getMenuFeatures(), ya usado por TopNav/drawer) en vez de un solo
//     ancla al Home.
//   - El FAB central probablemente se conserva o se reubica como "Nuevo
//     proyecto" — a decidir en esa fase, no acá.
//   - "Profesionales" es un slot NUEVO sin funcionalidad real todavía (área
//     `profesionales` en product-features.ts, `status:"planned"` — ver
//     PLANNED_FEATURES) — NO se agrega ningún link ni placeholder público
//     en esta fase, tal como pide el punto 6 del pedido.
//   - "Perfil" — el popover actual (Lista de compras/Galería/Inspecciones/
//     sesión) tendría que revisarse: Inspecciones y Galería ya son
//     features del registro central (mostradas también en TopNav/drawer),
//     así que este popover hoy duplica esos 2 links como "acceso
//     adicional para logueados" — decisión ya tomada explícitamente en el
//     fix de navegación mobile anterior (no se quita de acá, es
//     intencional). Lista de compras NO se migró al registro en esta fase
//     (ver product-feature-registry.md, sección "qué se evaluó y no se
//     migró") — sigue siendo exclusiva de este popover.
//
// No se crearon tipos/helpers nuevos para BottomNav en esta fase — el
// pedido los pide "solo si son realmente necesarios", y no hay ningún
// dato repetido en otro lado que migrar todavía (a diferencia de
// TopNav/MobileTopBar, que sí compartían Guías/Inspecciones/Biblioteca
// entre sí antes de esta fase).
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
          <Compass className="w-5 h-5" />
          Proyectos
        </Link>

        <div className="flex-1 flex items-center justify-center">
          <AssistantWidget groups={assistantGroups} variant="fab" />
        </div>

        <Link href="/proyectos" className={itemClass(pathname.startsWith("/proyectos"))}>
          <FolderKanban className="w-5 h-5" />
          Mis proyectos
        </Link>
        <button onClick={() => setProfileOpen((v) => !v)} className={itemClass(profileOpen)}>
          <User className="w-5 h-5" />
          Perfil
        </button>
      </nav>
    </>
  );
}
