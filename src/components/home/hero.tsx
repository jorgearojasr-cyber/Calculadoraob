import Image from "next/image";
import Link from "next/link";
import { Layers, PaintBucket, Grid3x3, Zap, Bath, MoreHorizontal } from "lucide-react";
import { SearchBar } from "./search-bar";
import { PopularTasksCarousel } from "./popular-tasks-carousel";
import { getPopularTasks } from "@/lib/popular-tasks";

// Reconstrucción del Hero según "Home ObraBien Calcula — Especificación
// de UI" (handoff a desarrollo, versión definitiva 1-ago-2026). Fiel a
// los valores exactos del documento (colores, tipografía, radios,
// sombras, breakpoints) — por eso aparecen tantos valores arbitrarios
// de Tailwind (bg-[...], text-[Npx], etc.) en vez de los tokens de
// marca (ink/border/safety-tint/etc.): la decisión de producto fue no
// tocar los tokens globales de la app y resolver la fidelidad visual
// solo dentro de los componentes de Home (ver decisión 2026-08-05).
//
// Los tokens de marca (`safety` #002152, `action` #FF4E00) SÍ coinciden
// con los de la especificación (`--marino`/`--naranjo`) — esos dos se
// siguen usando normalmente.
//
// Escena maestro+casa: el asset actual (maestro-obrabien.png) ya trae
// el personaje Y la casa en una sola ilustración, con el mensaje "Te
// acompaño paso a paso en tu proyecto" caligrafiado dentro del PNG (ver
// decisión de producto 2026-08-05 — se usa el asset actual tal cual,
// sin generar uno nuevo). En mobile, la especificación pide masking esa
// caligrafía (queda fuera de campo) para reemplazarla por texto real
// (accesibilidad) — el degradado de máscara está calibrado para ese
// asset específico.
const QUICK_ACCESS = [
  { label: "Radier", href: "/empezar/construir-un-radier", icon: Layers },
  { label: "Pintar", href: "/empezar/pintar-una-habitacion", icon: PaintBucket },
  { label: "Cerámica", href: "/empezar/instalar-ceramica", icon: Grid3x3 },
  { label: "Electricidad", href: "/empezar/instalar-un-enchufe-reemplazo", icon: Zap },
  { label: "Baño", href: "/empezar/cambiar-o-instalar-un-wc", icon: Bath },
];

export async function Hero() {
  const popularTasks = await getPopularTasks();

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #F1F5FB 0%, #F7F9FC 58%, #FFFFFF 100%)" }}
    >
      {/* Retícula decorativa — 56x56, opacidad .045, color marino */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#002152 1px, transparent 1px), linear-gradient(90deg, #002152 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          opacity: 0.045,
        }}
      />
      {/* Halo naranja decorativo */}
      <div
        className="absolute pointer-events-none w-[620px] h-[620px] right-[-120px] top-[-140px]"
        style={{ background: "radial-gradient(circle, rgba(255,78,0,.10) 0%, transparent 68%)" }}
      />

      <div className="relative max-w-[1440px] mx-auto">
        {/* ---------- MOBILE (<640) ---------- */}
        <div className="sm:hidden px-[18px] pt-3 pb-5">
          <div className="relative flex justify-end pt-1">
            <div
              className="relative w-[458px] flex-shrink-0 aspect-[1580/996] mr-[-96px] mb-[-4px]"
              style={{
                mixBlendMode: "multiply",
                // 22%/36%, tal cual la especificación — verificados contra
                // este PNG específico en un navegador real (Chrome), no solo
                // con capturas: la caligrafía original queda completamente
                // oculta y el texto real no se superpone. (Nota: una primera
                // verificación con html2canvas mostró la caligrafía
                // duplicada, pero era un falso positivo — esa librería no
                // soporta mask-image/-webkit-mask-image, así que ignoraba la
                // máscara por completo. No hizo falta recalibrar nada.)
                maskImage: "linear-gradient(90deg, rgba(0,0,0,0) 22%, #000 36%)",
                WebkitMaskImage: "linear-gradient(90deg, rgba(0,0,0,0) 22%, #000 36%)",
              }}
            >
              <Image
                src="/images/brand/maestro-obrabien.png"
                alt=""
                fill
                className="object-contain"
                sizes="458px"
                priority
              />
            </div>
            {/* Velo que funde la casa contra el fondo del Hero mobile */}
            <div
              className="absolute inset-y-0 right-0 left-[54%] pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, rgba(243,247,252,0) 0%, rgba(243,247,252,.72) 46%, rgba(243,247,252,.9) 100%)",
              }}
            />
            <div className="absolute left-0 top-9 w-[136px]">
              <p
                className="italic text-[#002152]"
                style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, lineHeight: 1.24, letterSpacing: "-0.01em" }}
              >
                Te acompaño paso a paso en tu proyecto
              </p>
              <div className="mt-1.5 w-[78px] h-[3px] rounded-[2px] bg-action" />
            </div>
          </div>

          <div className="pt-[18px] flex flex-col gap-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-medium px-[11px] py-[6px] rounded-[6px] text-[#1F6B4A] bg-[#E4F2E9]">
                100% GRATIS
              </span>
              <span className="text-[11px] px-3 py-[6px] rounded-[20px] bg-white border border-[#E1E5EC] text-[#5B6577]">
                Sin registros
              </span>
            </div>

            <h1
              className="text-[#10203A] font-extrabold"
              style={{ fontSize: 34, lineHeight: 1.05, letterSpacing: "-0.028em" }}
            >
              Calcula, aprende y construye <span className="text-action">gratis.</span>
            </h1>

            <p className="text-[15px] leading-[1.5] text-[#4A5568]">
              Cuánto material comprar para tu proyecto, en minutos.
            </p>

            <SearchBar placeholder="¿Qué quieres hacer?" size="mobile" />

            <div className="flex gap-2 overflow-x-auto -mx-[18px] px-[18px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {QUICK_ACCESS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 text-[14px] font-semibold px-4 py-[11px] rounded-full text-[#002152] border border-[#E3E8EF]"
                  style={{ backgroundColor: "rgba(255,255,255,.85)" }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              <Link
                href="/#empezar"
                className="flex-shrink-0 inline-flex items-center gap-1.5 text-[14px] font-semibold px-4 py-[11px] rounded-full text-[#5B6577] border border-dashed border-[#C9D1DD]"
              >
                <MoreHorizontal className="w-4 h-4" />
                Más
              </Link>
            </div>
          </div>
        </div>

        {/* ---------- TABLET / DESKTOP (>=640) ---------- */}
        <div className="hidden sm:grid lg:grid-cols-[1fr_minmax(420px,46vw)] xl:grid-cols-[1fr_770px] items-end gap-2 px-10 pt-[34px] pb-0">
          <div className="max-w-[700px] pb-[30px] flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-[10px]">
              <span className="font-mono text-xs font-medium px-[11px] py-[6px] rounded-[6px] text-[#1F6B4A] bg-[#E4F2E9]">
                100% GRATIS
              </span>
              <span className="text-[13px] px-3 py-[6px] rounded-[20px] bg-white border border-[#E1E5EC] text-[#5B6577]">
                Sin registros para cálculos básicos
              </span>
            </div>

            <h1
              className="text-[#10203A] font-extrabold lg:text-[52px] xl:text-[62px]"
              style={{ lineHeight: 1.02, letterSpacing: "-0.032em" }}
            >
              Calcula, aprende y construye <span className="text-action">gratis.</span>
            </h1>

            <p className="text-[19px] leading-[1.5] text-[#4A5568] max-w-[520px]">
              Herramientas gratuitas para calcular materiales, cantidades y costos de tu proyecto.
              Fácil, rápido y sin complicaciones.
            </p>

            <SearchBar placeholder="¿Qué proyecto quieres hacer?" size="desktop" />

            <div className="flex flex-col gap-[9px]">
              <p className="font-mono text-[11px] uppercase text-[#7A8496]" style={{ letterSpacing: "0.12em" }}>
                Accesos rápidos
              </p>
              <div className="flex flex-wrap gap-3">
                {QUICK_ACCESS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="inline-flex items-center gap-2 text-[15px] font-semibold px-[18px] py-[11px] rounded-full text-[#002152] border border-[#E3E8EF] transition-colors hover:border-[#002152]/30"
                    style={{ backgroundColor: "rgba(255,255,255,.82)" }}
                  >
                    <item.icon className="w-[17px] h-[17px]" />
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/#empezar"
                  className="inline-flex items-center gap-2 text-[15px] font-semibold px-[18px] py-[11px] rounded-full text-[#5B6577] border border-dashed border-[#C9D1DD] transition-colors hover:text-[#002152]"
                >
                  <MoreHorizontal className="w-[17px] h-[17px]" />
                  Más
                </Link>
              </div>
            </div>
          </div>

          <div className="relative hidden sm:flex items-end justify-center h-[300px] sm:h-[360px] lg:h-[460px] xl:h-[540px]">
            <div
              className="relative w-full lg:w-[118%] xl:w-[884px] aspect-[1580/996] mb-[-6px]"
              style={{ mixBlendMode: "multiply" }}
            >
              <Image
                src="/images/brand/maestro-obrabien.png"
                alt="Maestro de ObraBien: te acompaño paso a paso en tu proyecto"
                fill
                className="object-contain"
                sizes="(max-width: 1279px) 46vw, 884px"
                priority
              />
            </div>
            {/* Velo que manda la casa al fondo — el personaje queda fuera de su zona activa */}
            <div
              className="absolute pointer-events-none"
              style={{
                inset: "0 -40px 0 44%",
                background:
                  "linear-gradient(90deg, rgba(246,249,253,0) 0%, rgba(246,249,253,.7) 32%, rgba(246,249,253,.88) 100%)",
              }}
            />
            {/* Sombra de piso */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[520px] h-[30px] pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgba(0,33,82,.14) 0%, transparent 70%)" }}
            />
          </div>
        </div>

        <PopularTasksCarousel tasks={popularTasks} />
      </div>
    </section>
  );
}
