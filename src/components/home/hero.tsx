import Image from "next/image";
import Link from "next/link";
import { FileCheck2, Zap, ShoppingCart, ShieldCheck } from "lucide-react";
import { SearchBar } from "./search-bar";
import { HeroIllustration } from "./hero-illustration";

// Textos genéricos a propósito: el flujo real no usa ninguna medida o
// cantidad específica (el usuario igual ingresa las suyas), así que un
// label tipo "Piscina 6x3" o "Pintar 3 piezas" prometía algo que el
// resultado no cumplía — ver auditoría 2026-07-29. Radier y Pintar
// enlazan directo a un único módulo genérico (cubren casa/bodega/
// estacionamiento/etc., o muro exterior/interior/cielo, vía su propia
// primera pregunta) — un href fijo ahí SÍ representa bien "elegir
// después adentro". Piscina NO tiene ese módulo genérico único: son 2
// módulos separados (rectangular/circular) sin selector interno
// compartido, así que iba directo a Rectangular sin dar la opción real
// de elegir forma — bug reportado 2026-07-30. Apunta en cambio a
// /grupos/piscinas, la pantalla de selección con fotos (mismo patrón ya
// usado para la tarjeta "Construir una piscina" en exploration-toggle.tsx).
const SUGGESTIONS = [
  { label: "Radier", href: "/categorias/hormigon/radier" },
  { label: "Pintar", href: "/categorias/pintura/pintura" },
  { label: "Piscina", href: "/grupos/piscinas" },
];

const BENEFITS = [
  {
    icon: FileCheck2,
    title: "100% gratis",
    description: "Siempre gratis para cálculos básicos.",
  },
  {
    icon: Zap,
    title: "Rápido y fácil",
    description: "Resultados confiables en segundos.",
  },
  {
    icon: ShoppingCart,
    title: "Ahorra dinero",
    description: "Compra solo lo necesario y evita desperdicios.",
  },
  {
    icon: ShieldCheck,
    title: "Confiable",
    description: "Basado en dosificaciones de uso común en Chile.",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="blueprint-bg absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-16 relative grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-success-tint text-success">
              100% GRATIS
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-white border border-border text-ink-muted">
              Sin registros para cálculos básicos
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-ink">
            Calcula, aprende y
            <br />
            construye <span className="text-action">gratis.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-muted max-w-lg">
            La app gratuita que te ayuda a calcular materiales, cantidades y costos para los
            proyectos de tu casa. Fácil, rápido y sin complicaciones.
          </p>

          <SearchBar />
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="text-xs px-3 py-1.5 rounded-full font-mono bg-white border border-border text-ink-muted hover:border-safety/40 hover:text-ink transition-colors"
              >
                {s.label}
              </Link>
            ))}
          </div>

          {/* Aspect-ratio calzado exacto con la foto original (2094x751) —
              object-cover nunca recorta, solo escala, así que la huincha
              (borde izquierdo) y el nivel (borde derecho) quedan siempre
              completos sin importar el ancho del contenedor. */}
          <div className="mt-8 relative w-full aspect-[2094/751] rounded-2xl overflow-hidden">
            <Image
              src="/images/hero/hero-herramientas.png"
              alt="Huincha de medir, nivel, lápiz y plano arquitectónico enrollado sobre una mesa"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5">
            {BENEFITS.map((b, i) => {
              // Fondo del círculo alterna celeste/durazno/blanco (blanco lleva
              // borde para no perderse contra el fondo de la sección) — el
              // ícono se mantiene siempre en marino, sin variar por beneficio:
              // estos 4 representan garantías unificadas de la app, no rubros
              // distintos, así que la variedad vive en el fondo, no en el ícono.
              const bg = ["bg-safety-tint", "bg-peach", "bg-white", "bg-safety-tint"][i % 4];
              return (
                <div key={b.title} className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bg} ${
                      bg === "bg-white" ? "border border-border" : ""
                    }`}
                  >
                    <b.icon className="w-5 h-5 text-safety" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{b.title}</p>
                    <p className="text-xs text-ink-muted">{b.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <HeroIllustration />
      </div>
    </section>
  );
}
