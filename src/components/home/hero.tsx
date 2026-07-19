import { ArrowRight, Search } from "lucide-react";
import { BlueprintTick } from "./blueprint-tick";

const SUGGESTIONS = ["Radier de casa", "Pintar 3 piezas", "Piscina 6x3"];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="blueprint-bg absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 relative">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-6 font-mono bg-white border border-border text-blueprint">
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

          {/* Buscador (visual, la búsqueda funcional llega en Fase 2) */}
          <div className="mt-8 relative">
            <div className="flex items-center gap-3 rounded-2xl px-5 py-4 shadow-sm bg-white border-[1.5px] border-ink">
              <Search className="w-5 h-5 flex-shrink-0 text-ink-muted" />
              <input
                placeholder="Ej: cuánto hormigón necesito para un radier de 40m²"
                className="w-full bg-transparent outline-none text-base placeholder:text-ink-faint"
                disabled
              />
              <button
                className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 bg-blueprint opacity-60 cursor-not-allowed"
                disabled
              >
                Calcular
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <span
                  key={s}
                  className="text-xs px-3 py-1.5 rounded-full font-mono bg-white border border-border text-ink-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center gap-6">
            <a
              href="#categorias"
              className="rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-ink"
            >
              Explorar categorías
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#como-funciona" className="text-sm font-medium underline underline-offset-4 text-ink-muted">
              Ver cómo funciona
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
