"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, FolderKanban, ShieldCheck, LogIn } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

type SidebarUser = { name: string | null; email: string | null; image: string | null } | null;

export function Sidebar({
  isAdmin,
  user,
}: {
  isAdmin: boolean;
  user: SidebarUser;
}) {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? "bg-navy-light text-white" : "text-white/65 hover:bg-navy-light/60 hover:text-white"
    }`;

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-navy px-4 py-6 z-30">
      <div className="px-2 mb-8">
        <Logo />
      </div>

      <nav className="flex flex-col gap-1">
        <Link href="/" className={linkClass(pathname === "/")}>
          <Home className="w-4 h-4" />
          Inicio
        </Link>
        <Link href="/#categorias" className={linkClass(pathname.startsWith("/categorias"))}>
          <LayoutGrid className="w-4 h-4" />
          Categorías
        </Link>
        {user && (
          <Link href="/proyectos" className={linkClass(pathname.startsWith("/proyectos"))}>
            <FolderKanban className="w-4 h-4" />
            Mis proyectos
          </Link>
        )}
        {isAdmin && (
          <>
            <div className="h-px bg-navy-border my-2" />
            <Link href="/admin" className={linkClass(false)}>
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          </>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-navy-border">
        {user ? (
          <div className="flex items-center gap-2.5 px-2">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-navy-light flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{user.name ?? user.email}</p>
              <SignOutButton className="text-xs text-white/50 hover:text-white/80 transition-colors" />
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 px-2 text-sm font-medium text-white/80 hover:text-white"
          >
            <LogIn className="w-4 h-4" />
            Ingresar
          </Link>
        )}
      </div>
    </aside>
  );
}
