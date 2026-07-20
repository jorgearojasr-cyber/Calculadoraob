"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ className = "hover:text-ink transition-colors" }: { className?: string }) {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className={className}>
      Cerrar sesión
    </button>
  );
}
