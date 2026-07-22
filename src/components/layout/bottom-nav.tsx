"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Plus, FolderKanban, ShoppingCart, User, LogIn } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

type NavUser = { name: string | null; email: string | null } | null;

export function BottomNav({ user }: { user: NavUser }) {
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
        <Link href="/#categorias" className={itemClass(pathname.startsWith("/categorias"))}>
          <LayoutGrid className="w-5 h-5" />
          Categorías
        </Link>

        <div className="flex-1 flex items-center justify-center">
          <Link
            href="/#empezar"
            aria-label="Nuevo cálculo"
            className="w-12 h-12 -mt-6 rounded-full bg-safety text-white flex items-center justify-center shadow-lg border-4 border-concrete"
          >
            <Plus className="w-6 h-6" />
          </Link>
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
