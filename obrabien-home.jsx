import React, { useState } from "react";
import {
  Search, ArrowRight, Layers, Grid3x3, LayoutGrid, PaintBucket,
  Construction, Warehouse, Waves, Flame, Droplets, Zap, Trees,
  Ruler, CheckCircle2, Download, Share2, ShieldCheck, Users,
  ChevronRight, Sparkles
} from "lucide-react";

const CATEGORIES = [
  { name: "Hormigón", desc: "Radieres, fundaciones, muros", icon: Layers, tag: "Más usado" },
  { name: "Cerámica", desc: "Pisos, revestimientos, pegado", icon: Grid3x3 },
  { name: "Albañilería", desc: "Ladrillos, bloques, mortero", icon: LayoutGrid },
  { name: "Pintura", desc: "Interior, exterior, rendimiento", icon: PaintBucket },
  { name: "Fierros", desc: "Enfierradura, mallas, traslapos", icon: Construction },
  { name: "Techumbres", desc: "Estructura, cubierta, aislación", icon: Warehouse },
  { name: "Yeso Cartón", desc: "Tabiques, cielos, planchas", icon: LayoutGrid },
  { name: "Excavaciones", desc: "Volumen de tierra a mover", icon: Construction },
  { name: "Piscinas", desc: "Hormigón, revestimiento, filtrado", icon: Waves },
  { name: "Quinchos", desc: "Estructura, techo, terminaciones", icon: Flame },
  { name: "Impermeabilización", desc: "Techos, muros, fundaciones", icon: Droplets },
  { name: "Electricidad", desc: "Cableado, ductos, tableros", icon: Zap },
  { name: "Gas", desc: "Cañerías, artefactos, ventilación", icon: Flame },
  { name: "Agua", desc: "Cañerías, arranques, estanques", icon: Droplets },
  { name: "Paisajismo", desc: "Pasto, tierra de hoja, riego", icon: Trees },
];

const STEPS = [
  { label: "Responde", desc: "Preguntas simples, sin jerga técnica", icon: Users },
  { label: "Calcula", desc: "El sistema aplica las reglas por ti", icon: Sparkles },
  { label: "Resultado", desc: "Materiales, cantidades y pérdidas", icon: CheckCircle2 },
  { label: "Comparte", desc: "Descarga o envía tu lista", icon: Share2 },
];

function BlueprintTick({ className = "" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none">
      <path d="M1 8H5M11 8H15M8 1V5M8 11V15" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export default function ObraBienHome() {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "#F5F4F1",
        color: "#1C1B19",
        fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
        .obrabien-display { font-family: 'Space Grotesk', ui-sans-serif, sans-serif; }
        .obrabien-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .blueprint-bg {
          background-image:
            linear-gradient(rgba(36,81,176,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(36,81,176,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      {/* Nav */}
      <header className="max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "#1C1B19" }}>
            <Ruler className="w-4 h-4" style={{ color: "#F5F4F1" }} />
          </div>
          <span className="obrabien-display text-lg font-semibold tracking-tight">ObraBien</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm" style={{ color: "#6B6862" }}>
          <a href="#categorias" className="hover:text-current transition-colors">Categorías</a>
          <a href="#como-funciona" className="hover:text-current transition-colors">Cómo funciona</a>
          <a href="#confianza" className="hover:text-current transition-colors">Confianza</a>
        </nav>
        <button
          className="text-sm font-medium px-4 py-2 rounded-full border"
          style={{ borderColor: "#1C1B19" }}
        >
          Ingresar
        </button>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="blueprint-bg absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 relative">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-6 obrabien-mono"
              style={{ background: "#FFFFFF", border: "1px solid #E4E1D8", color: "#2451B0" }}
            >
              <BlueprintTick className="w-3 h-3" />
              Base de conocimiento técnico validado
            </div>
            <h1 className="obrabien-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              ¿Qué quieres
              <br />
              construir hoy?
            </h1>
            <p className="mt-5 text-lg" style={{ color: "#6B6862" }}>
              Calcula materiales, cantidades y costos de cualquier proyecto de construcción,
              sin necesitar experiencia técnica. Solo responde y nosotros calculamos.
            </p>

            {/* Search */}
            <div className="mt-8 relative">
              <div
                className="flex items-center gap-3 rounded-2xl px-5 py-4 shadow-sm"
                style={{ background: "#FFFFFF", border: "1.5px solid #1C1B19" }}
              >
                <Search className="w-5 h-5 flex-shrink-0" style={{ color: "#6B6862" }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej: cuánto hormigón necesito para un radier de 40m²"
                  className="w-full bg-transparent outline-none text-base placeholder:text-[#9A968C]"
                />
                <button
                  className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5"
                  style={{ background: "#2451B0" }}
                >
                  Calcular
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Radier de casa", "Pintar 3 piezas", "Piscina 6x3"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="text-xs px-3 py-1.5 rounded-full obrabien-mono"
                    style={{ background: "#FFFFFF", border: "1px solid #E4E1D8", color: "#6B6862" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 flex items-center gap-6">
              <button
                className="rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2"
                style={{ background: "#1C1B19" }}
              >
                Explorar categorías
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="text-sm font-medium underline underline-offset-4" style={{ color: "#6B6862" }}>
                Ver cómo funciona
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section id="categorias" className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="obrabien-mono text-xs uppercase tracking-wider mb-2" style={{ color: "#2451B0" }}>
              Categorías
            </p>
            <h2 className="obrabien-display text-3xl font-semibold tracking-tight">
              Cada obra tiene su cálculo
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.slice(0, visibleCount).map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                className="group relative text-left rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{ background: "#FFFFFF", border: "1px solid #E4E1D8" }}
              >
                {cat.tag && (
                  <span
                    className="absolute top-4 right-4 text-[10px] obrabien-mono px-2 py-0.5 rounded-full"
                    style={{ background: "#FDEDE6", color: "#E8622C" }}
                  >
                    {cat.tag}
                  </span>
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#F5F4F1" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#2451B0" }} />
                </div>
                <h3 className="font-semibold text-[15px] mb-1">{cat.name}</h3>
                <p className="text-xs" style={{ color: "#6B6862" }}>{cat.desc}</p>
                <ChevronRight
                  className="w-4 h-4 absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "#2451B0" }}
                />
              </button>
            );
          })}
        </div>

        {visibleCount < CATEGORIES.length && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setVisibleCount(CATEGORIES.length)}
              className="text-sm font-medium px-6 py-2.5 rounded-full border inline-flex items-center gap-1.5"
              style={{ borderColor: "#1C1B19" }}
            >
              Ver todas las categorías
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-16" style={{ background: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto px-6">
          <p className="obrabien-mono text-xs uppercase tracking-wider mb-2" style={{ color: "#2451B0" }}>
            Proceso
          </p>
          <h2 className="obrabien-display text-3xl font-semibold tracking-tight mb-10">
            Cuatro pasos, cero jerga técnica
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="obrabien-mono text-xs" style={{ color: "#9A968C" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="h-px flex-1" style={{ background: "#E4E1D8" }} />
                  </div>
                  <Icon className="w-6 h-6 mb-3" style={{ color: "#2451B0" }} />
                  <h3 className="font-semibold text-[15px] mb-1">{step.label}</h3>
                  <p className="text-xs" style={{ color: "#6B6862" }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Confianza */}
      <section id="confianza" className="max-w-6xl mx-auto px-6 py-16">
        <div
          className="rounded-3xl p-10 grid md:grid-cols-2 gap-10 items-center"
          style={{ background: "#1C1B19", color: "#F5F4F1" }}
        >
          <div>
            <ShieldCheck className="w-7 h-7 mb-4" style={{ color: "#E8622C" }} />
            <h2 className="obrabien-display text-2xl font-semibold tracking-tight mb-3">
              Cálculos basados en información real de obra
            </h2>
            <p className="text-sm" style={{ color: "#B5B1A7" }}>
              Cada fórmula está construida sobre normas chilenas de construcción, buenas
              prácticas de la industria, factores reales de pérdida de material y décadas
              de experiencia de maestros de obra. No adivinamos: calculamos.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Normas chilenas", icon: ShieldCheck },
              { label: "Rendimientos reales", icon: Layers },
              { label: "Factores de pérdida", icon: Construction },
              { label: "Experiencia de maestros", icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-xl p-4"
                  style={{ background: "rgba(245,244,241,0.06)", border: "1px solid rgba(245,244,241,0.12)" }}
                >
                  <Icon className="w-4 h-4 mb-2" style={{ color: "#E8622C" }} />
                  <p className="text-xs font-medium">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between text-xs" style={{ color: "#9A968C" }}>
        <span>© 2026 ObraBien Calcula</span>
        <div className="flex items-center gap-1.5 obrabien-mono">
          <Download className="w-3.5 h-3.5" />
          Exporta tus resultados en cualquier momento
        </div>
      </footer>
    </div>
  );
}
