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
      {/* bg-safety-hover (azul profundo), no bg-safety — el chip vive
          principalmente sobre el sidebar oscuro, que ahora es azul obra
          (bg-safety); un chip del mismo tono se perdería contra el fondo. */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-safety-hover flex-shrink-0">
        <LogoMark className="w-4 h-4 text-white" />
      </div>
      <span className={`font-display text-lg font-semibold tracking-tight ${textClassName}`}>
        ObraBien
      </span>
    </Link>
  );
}
