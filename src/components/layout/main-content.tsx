"use client";

import { usePathname } from "next/navigation";
import { isWizardRoute } from "@/lib/is-wizard-route";

// `pt-14 lg:pt-[72px]` compensa la altura fija de MobileTopBar/TopNav — en
// el wizard esos headers no se renderizan (ver top-nav.tsx/mobile-top-bar.tsx),
// así que ese padding dejaría un hueco vacío arriba si se mantuviera fijo.
//
// Design Spec v1.0 (2026-09-15, punto 16 del pedido): el quiebre
// mobile→desktop pasa de `md` (768px) a `lg` (1024px) — MobileTopBar/
// BottomNav siguen visibles en tablet (768-1024), TopNav (72px de alto)
// recién entra en `lg`. `pb-20 lg:pb-0` compensa a BottomNav (64px +
// safe-area) por el mismo rango ampliado.
export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const topPadding = isWizardRoute(pathname) ? "" : "pt-14 lg:pt-[72px]";
  return <main className={`${topPadding} pb-20 lg:pb-0`}>{children}</main>;
}
