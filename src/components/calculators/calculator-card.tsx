import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Hammer } from "lucide-react";
import type { CalculatorModule } from "@/lib/calculators";

// Design Spec v1.0 — Parte 2 (Calculadoras/Herramientas), 2026-09-15,
// puntos 6/7/15 del pedido. Componente nuevo (no ProjectCard): la
// semántica visual es distinta a propósito — ProjectCard es una tarjeta
// de "proyecto" con imagen 16:9 dominante + "N pasos" (usada en Home,
// /buscar, /categorias, /grupos); CalculatorCard es una fila de catálogo
// compacta en mobile (64px, chevron, sin "N pasos" — el objetivo acá es
// ENCONTRAR la herramienta, no verla como un proyecto). Modificar
// ProjectCard para forzar este layout habría roto esas otras 4
// superficies (punto 15 del pedido) — se creó este componente aparte en
// su lugar, con API simple y tipada.
//
// `variant`: "row" (mobile, lista vertical) | "card" (desktop, grilla 3
// columnas) — mismo dato, mismo sistema de bordes/radios/sombras
// (ds-card, ds-card-rest/elevated), sin crear un segundo lenguaje visual.
export function CalculatorCard({
  calculator,
  variant,
}: {
  calculator: CalculatorModule;
  variant: "row" | "card";
}) {
  if (variant === "row") {
    return (
      <Link
        href={`/categorias/${calculator.categorySlug}/${calculator.slug}`}
        className="flex items-center gap-3 rounded-ds-card px-3 bg-white border border-ds-border shadow-ds-card-rest hover:shadow-ds-card-elevated active:scale-[0.99] transition-all"
        style={{ minHeight: 64 }}
      >
        <div className="relative w-10 h-10 flex-shrink-0 rounded-[10px] overflow-hidden bg-ds-muted">
          {calculator.imageUrl ? (
            <Image src={calculator.imageUrl} alt="" fill className="object-cover" sizes="40px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Hammer className="w-4 h-4 text-ds-text-tertiary" strokeWidth={1.8} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 py-2.5">
          <h3 className="font-body font-bold text-[13px] text-ds-navy-900 leading-tight truncate">
            {calculator.name}
          </h3>
          <p className="font-body text-[11px] text-ds-text-secondary leading-snug line-clamp-1">
            {calculator.description}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0 text-ds-text-tertiary" />
      </Link>
    );
  }

  return (
    <Link
      href={`/categorias/${calculator.categorySlug}/${calculator.slug}`}
      className="group flex flex-col rounded-ds-card overflow-hidden bg-white border border-ds-border shadow-ds-card-rest hover:shadow-ds-card-elevated transition-all"
    >
      <div className="relative w-full aspect-[16/10] shrink-0 overflow-hidden bg-ds-muted">
        {calculator.imageUrl ? (
          <Image
            src={calculator.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 45vw, 380px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Hammer className="w-7 h-7 text-ds-text-tertiary" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <span className="font-body text-[11px] font-bold uppercase text-ds-text-tertiary" style={{ letterSpacing: "0.06em" }}>
          {calculator.categoryName}
        </span>
        <h3 className="font-display font-extrabold text-[15px] text-ds-navy-900 leading-snug line-clamp-2">
          {calculator.name}
        </h3>
        <p className="font-body text-[13px] text-ds-text-secondary leading-snug line-clamp-2">
          {calculator.description}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-ds-orange-600 group-hover:gap-1.5 transition-all">
          Calcular
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}
