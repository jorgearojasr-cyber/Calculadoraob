"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, FolderKanban, ShoppingCart, Images, User, ClipboardCheck } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AssistantWidget, type AssistantGroup } from "@/components/assistant/assistant-widget";

type NavUser = { name: string | null; email: string | null } | null;

// DOCUMENTACIÓN — Cimientos de arquitectura (2026-09-14, punto 6 del
// pedido) + Home ObraBien V2 (2026-09-14, punto 14 del pedido).
//
// Estructura (5 slots, ninguno viene del registro central):
//   1. "Inicio" (/) — navegación estructural, no una feature.
//   2. "Herramientas" (/calculadoras) — Design Spec v1.0, Parte 2
//      (2026-09-15, punto 18 del pedido): pasa del ancla `/#empezar` a la
//      ruta canónica real /calculadoras, ahora que esa pantalla existe
//      (mismo cambio que TopNav/drawer, ver top-nav.tsx). Antes de esta
//      fase apuntaba al selector "por proyecto/material" del Home bajo el
//      label "Proyectos" (fase Home ObraBien V2, 2026-09-14).
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

  // Polish visual (2026-09-14) + Design Spec v1.0 (2026-09-15, punto 8 del
  // pedido): barra clara (bg-white), activo en ds-orange-600 bold, inactivo
  // en ds-text-tertiary, íconos 20px, labels 10px. Mismos hrefs y
  // comportamiento, cero cambios de arquitectura ni de rutas.
  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 flex-1 text-[10px] font-bold transition-colors ${
      active ? "text-ds-orange-600" : "text-ds-text-tertiary font-semibold"
    }`;

  return (
    <>
      {profileOpen && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setProfileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-ink/20"
        />
      )}

      {/* Mejora UX/Auth flow (2026-09-16): este popover ahora solo puede
          abrirse con sesión activa (ver botón "Perfil" más abajo) — se
          quita la rama `!user` que quedó inalcanzable. */}
      {profileOpen && user && (
        <div className="lg:hidden fixed bottom-20 right-4 z-50 rounded-2xl bg-white border border-ds-border shadow-ds-modal p-3 min-w-[180px]">
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
        </div>
      )}

      {/* Design Spec v1.0, punto 8: altura 64px (+ safe area) — antes la
          altura era implícita (py-2 por ítem); ahora se fija explícita en
          la barra y los ítems solo centran su contenido. Punto 16: oculta
          desde `lg` (1024px), no `md` (768px) — ver nota en top-nav.tsx. */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-ds-border flex items-stretch px-2"
        style={{ height: 64, paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -6px 20px rgba(16,32,58,.06)" }}
      >
        <Link href="/" className={itemClass(pathname === "/")}>
          <Home className="w-5 h-5" />
          Inicio
        </Link>
        <Link href="/calculadoras" className={itemClass(pathname.startsWith("/calculadoras"))}>
          <Wrench className="w-5 h-5" />
          Herramientas
        </Link>

        {/* AssistantWidget variant="fab" ya se autoposiciona (-mt-6 para
            elevarse sobre la barra, aro border-concrete + shadow-lg propios
            para leerse "recortado" sobre el fondo) — no se envuelve en un
            wrapper adicional acá para no duplicar ese offset. El aro claro
            ya combina con la barra ahora blanca (antes contrastaba contra
            bg-navy), así que sigue viéndose integrado sin tocar el
            componente compartido con fab-desktop. */}
        <div className="flex-1 flex items-center justify-center">
          <AssistantWidget groups={assistantGroups} variant="fab" />
        </div>

        <Link href="/proyectos" className={itemClass(pathname.startsWith("/proyectos"))}>
          <FolderKanban className="w-5 h-5" />
          Proyectos
        </Link>
        {/* Mejora UX/Auth flow (2026-09-16, punto 7 del pedido) — "Perfil:
            sin sesión → login". Antes, sin sesión, tocar "Perfil" abría el
            mismo popover pero con un único ítem ("Ingresar") — un paso
            extra sin aportar nada. Ahora, sin sesión, es un link directo a
            /login (mismo destino final, un tap menos). Con sesión se
            mantiene el popover existente sin cambios. */}
        {user ? (
          <button onClick={() => setProfileOpen((v) => !v)} className={itemClass(profileOpen)}>
            <User className="w-5 h-5" />
            Perfil
          </button>
        ) : (
          <Link href="/login" className={itemClass(false)}>
            <User className="w-5 h-5" />
            Perfil
          </Link>
        )}
      </nav>
    </>
  );
}
