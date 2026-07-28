import Link from "next/link";
import { FileCheck2, Zap, ShoppingCart, ShieldCheck } from "lucide-react";
import { SearchBar } from "./search-bar";
import { HeroIllustration } from "./hero-illustration";

const SUGGESTIONS = [
  { label: "Radier de casa", href: "/categorias/hormigon/radier" },
  { label: "Pintar 3 piezas", href: "/categorias/pintura/pintura" },
  { label: "Piscina 6x3", href: "/categorias/piscinas/piscina-rectangular-hormigon-armado" },
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

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex items-start gap-2.5">
                <b.icon className="w-4 h-4 text-safety flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{b.title}</p>
                  <p className="text-xs text-ink-muted">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <HeroIllustration />
      </div>
    </section>
  );
}
