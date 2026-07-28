import Link from "next/link";
import { LogoMark } from "./logo-mark";

export function Logo({
  href = "/",
  variant = "light",
}: {
  href?: string;
  // "light": casa marino + "OBRA" marino, para fondos claros (admin, etc.).
  // "dark": casa blanca + "OBRA" blanco, para el chrome oscuro del sidebar
  // (bg-navy) — la casa real usa trazo marino, invisible sobre marino.
  variant?: "light" | "dark";
}) {
  const houseColor = variant === "dark" ? "text-white" : "text-safety";
  const obraColor = variant === "dark" ? "text-white" : "text-safety";

  return (
    <Link href={href} className="flex items-center gap-2">
      <LogoMark className={`w-7 h-[17px] flex-shrink-0 ${houseColor}`} />
      <span className="font-display text-lg font-extrabold tracking-tight uppercase">
        <span className={obraColor}>Obra</span>
        <span className="text-action">Bien</span>
      </span>
    </Link>
  );
}
