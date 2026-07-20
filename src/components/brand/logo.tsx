import Link from "next/link";
import { LogoMark } from "./logo-mark";

export function Logo({
  href = "/",
  textClassName = "text-concrete",
}: {
  href?: string;
  textClassName?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-navy-light flex-shrink-0">
        <LogoMark className="w-4 h-4 text-safety" />
      </div>
      <span className={`font-display text-lg font-semibold tracking-tight ${textClassName}`}>
        ObraBien
      </span>
    </Link>
  );
}
