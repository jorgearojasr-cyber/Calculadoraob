"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, ShoppingCart, ShieldCheck } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

export type NavUser = { name: string | null; email: string | null; image: string | null } | null;

export function UserMenu({ user, isAdmin }: { user: NonNullable<NavUser>; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 hover:bg-concrete transition-colors"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-safety flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium max-w-[120px] truncate">{user.name ?? user.email}</span>
      </button>

      {open && (
        <>
          <button
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
          />
          <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl bg-white border border-border shadow-lg p-2 min-w-[200px]">
            <Link
              href="/proyectos"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-concrete transition-colors"
            >
              <FolderKanban className="w-4 h-4 text-ink-muted" />
              Mis proyectos
            </Link>
            <Link
              href="/lista-compras"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-concrete transition-colors"
            >
              <ShoppingCart className="w-4 h-4 text-ink-muted" />
              Listas de compras
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-concrete transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-ink-muted" />
                Admin
              </Link>
            )}
            <div className="h-px bg-border my-1.5" />
            <SignOutButton className="w-full text-left text-sm font-medium px-3 py-2 rounded-lg hover:bg-concrete transition-colors" />
          </div>
        </>
      )}
    </div>
  );
}
