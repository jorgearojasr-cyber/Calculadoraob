"use client";

import { usePathname } from "next/navigation";
import { isWizardRoute } from "@/lib/is-wizard-route";

// `pt-14 md:pt-16` compensa la altura fija de MobileTopBar/TopNav — en el
// wizard esos headers no se renderizan (ver top-nav.tsx/mobile-top-bar.tsx),
// así que ese padding dejaría un hueco vacío arriba si se mantuviera fijo.
export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const topPadding = isWizardRoute(pathname) ? "" : "pt-14 md:pt-16";
  return <main className={`${topPadding} pb-20 md:pb-0`}>{children}</main>;
}
