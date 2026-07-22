import Link from "next/link";
import { BlueprintTick } from "./blueprint-tick";
import { SearchBar } from "./search-bar";

const SUGGESTIONS = [
  { label: "Radier de casa", href: "/categorias/hormigon/radier" },
  { label: "Pintar 3 piezas", href: "/categorias/pintura/pintura" },
  { label: "Piscina 6x3", href: "/categorias/piscinas/piscina-rectangular-hormigon-armado" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="blueprint-bg absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 relative">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-6 font-mono bg-white border border-border text-safety">
            <BlueprintTick className="w-3 h-3" />
            Base de conocimiento técnico validado
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            ¿Qué quieres
            <br />
            construir hoy?
          </h1>
          <p className="mt-5 text-lg text-ink-muted">
            Calcula materiales, cantidades y costos de cualquier proyecto de construcción,
            sin necesitar experiencia técnica. Solo responde y nosotros calculamos.
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

          <div className="mt-10 flex items-center gap-6">
            <a href="#como-funciona" className="text-sm font-medium underline underline-offset-4 text-ink-muted">
              Ver cómo funciona
            </a>
            <a href="#categorias" className="text-sm font-medium underline underline-offset-4 text-ink-faint">
              Ver categorías técnicas
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
