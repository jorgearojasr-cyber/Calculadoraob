"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PopularTaskCard } from "@/lib/popular-tasks";

// Carrusel "Proyectos más buscados" — especificación de UI de Home
// (§3.7 desktop, §4.4 mobile, §6 comportamiento del carrusel,
// 2026-08-05). Vive dentro de la banda del Hero (mismo fondo
// degradado), justo antes del separador punteado que abre "Todas las
// categorías".
//
// El paso de avance (ancho de tarjeta + gap) y el agrupamiento del
// indicador se MIDEN en el DOM en vez de hardcodear 288/186 — la
// tarjeta cambia de ancho entre mobile y desktop (186 vs 288), así que
// un valor fijo se habría desincronizado en alguno de los dos anchos.
const INDICATOR_COUNT = 3;
const GAP_PX = 16;

export function PopularTasksCarousel({ tasks }: { tasks: PopularTaskCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const getStep = useCallback(() => {
    const track = trackRef.current;
    const firstCard = track?.querySelector("a");
    if (!firstCard) return 300;
    return firstCard.getBoundingClientRect().width + GAP_PX;
  }, []);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollLeft(track.scrollLeft > 2);
    setCanScrollRight(track.scrollLeft < track.scrollWidth - track.clientWidth - 2);
    // La especificación describe el índice activo como
    // round(scrollLeft/(288+16)) agrupando de a dos tarjetas — esa fórmula
    // asume que el track scrollea ~4-5 pasos de tarjeta completos. Con 6
    // tarjetas y un viewport ancho, caben ~4-5 a la vez y el rango de
    // scroll real es de apenas 1-2 pasos, así que esa fórmula nunca llega
    // a la última barra (bug real encontrado en la verificación visual,
    // 2026-08-05). En su lugar, se usa el progreso proporcional real del
    // scroll (0 al llegar al final) — misma intención del indicador
    // (mostrar avance dentro del track), robusto sin importar cuántas
    // tarjetas quepan a la vez.
    const maxScroll = track.scrollWidth - track.clientWidth;
    const progress = maxScroll > 0 ? track.scrollLeft / maxScroll : 0;
    setActiveIndex(Math.round(progress * (INDICATOR_COUNT - 1)));
  }, []);

  useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByStep = (direction: 1 | -1) => {
    trackRef.current?.scrollBy({ left: direction * getStep(), behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByStep(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByStep(-1);
    }
  };

  if (tasks.length === 0) return null;

  return (
    <div className="mt-[-4px] px-4 sm:px-10 pt-2 sm:pt-0 pb-5 sm:pb-[34px] flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[18px] sm:text-[22px] font-bold text-[#10203A]" style={{ letterSpacing: "-0.02em" }}>
          Proyectos más buscados
        </h2>
        <Link href="/#empezar" className="text-[13px] sm:text-[15px] font-bold text-action flex-shrink-0">
          Ver todos →
        </Link>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          role="region"
          aria-label="Proyectos más buscados"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 [scroll-snap-type:x_mandatory] [scroll-behavior:smooth] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={task.href}
              className="flex-none w-[186px] sm:w-[288px] rounded-[20px] sm:rounded-[22px] bg-white border border-[#EEF1F6] overflow-hidden [scroll-snap-align:start] focus-visible:outline focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
              style={{ boxShadow: "0 10px 24px rgba(16,32,58,.10)" }}
            >
              <div className="relative w-full h-[124px] sm:h-[150px] bg-[#EEF1F6]">
                {task.image && (
                  <Image
                    src={task.image}
                    alt={task.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 186px, 288px"
                  />
                )}
                <span
                  className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 text-[11px] sm:text-xs font-bold px-2.5 sm:px-[11px] py-1.5 rounded-full text-[#10203A]"
                  style={{ backgroundColor: "rgba(255,255,255,.94)" }}
                >
                  {task.groupName}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-3 sm:px-4 sm:pt-[14px] sm:pb-[15px]">
                <p className="text-[16px] sm:text-[18px] font-bold" style={{ lineHeight: 1.22 }}>
                  {task.name}
                </p>
                <div className="mt-auto pt-2.5 flex items-center justify-between">
                  <span className="font-mono text-[11px] sm:text-xs text-[#7A8496]">
                    {task.stepCount !== null ? `${task.stepCount} pasos` : ""}
                  </span>
                  <span className="text-[14px] font-bold text-action">Calcular →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div
          className="hidden lg:block absolute inset-y-0 right-0 w-[110px] pointer-events-none transition-opacity duration-150"
          style={{
            background: "linear-gradient(90deg, rgba(250,251,253,0) 0%, rgba(250,251,253,.9) 62%)",
            opacity: canScrollRight ? 1 : 0,
          }}
        />

        <button
          type="button"
          aria-label="Ver proyectos anteriores"
          onClick={() => scrollByStep(-1)}
          className="hidden lg:flex absolute left-[10px] top-1/2 -mt-[23px] w-[46px] h-[46px] rounded-full bg-white border border-[#E3E8EF] items-center justify-center transition-opacity duration-150"
          style={{ boxShadow: "0 8px 20px rgba(16,32,58,.14)", opacity: canScrollLeft ? 1 : 0, pointerEvents: canScrollLeft ? "auto" : "none" }}
        >
          <ChevronLeft className="w-[19px] h-[19px] text-[#002152]" />
        </button>
        <button
          type="button"
          aria-label="Ver más proyectos"
          onClick={() => scrollByStep(1)}
          className="hidden lg:flex absolute right-[10px] top-1/2 -mt-[23px] w-[46px] h-[46px] rounded-full bg-white border border-[#E3E8EF] items-center justify-center transition-opacity duration-150"
          style={{ boxShadow: "0 8px 20px rgba(16,32,58,.14)", opacity: canScrollRight ? 1 : 0, pointerEvents: canScrollRight ? "auto" : "none" }}
        >
          <ChevronRight className="w-[19px] h-[19px] text-[#002152]" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: INDICATOR_COUNT }).map((_, i) => (
          <span
            key={i}
            className="h-1 rounded-[2px] transition-all duration-200"
            style={{ width: i === activeIndex ? 26 : 10, backgroundColor: i === activeIndex ? "#FF4E00" : "#D8DEE8" }}
          />
        ))}
      </div>
    </div>
  );
}
