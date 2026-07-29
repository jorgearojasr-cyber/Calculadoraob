import { ArrowRight, CheckCircle2, Share2, Sparkles, Users, type LucideIcon } from "lucide-react";

const STEPS: { label: string; desc: string; icon: LucideIcon }[] = [
  { label: "Responde", desc: "Preguntas simples, sin jerga técnica", icon: Users },
  { label: "Calcula", desc: "El sistema aplica las reglas por ti", icon: Sparkles },
  { label: "Resultado", desc: "Materiales, cantidades y pérdidas", icon: CheckCircle2 },
  { label: "Comparte", desc: "Descarga o envía tu lista", icon: Share2 },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">Proceso</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight mb-10">
          Cuatro pasos, cero jerga técnica
        </h2>
        {/* 4 en fila desde sm (640px), no recién en md (768px) — tarjetas
            compactas (padding/gap reducidos) para que quepan legibles en
            anchos intermedios. En mobile (2x2) el conector punteado se
            oculta: cruzar filas distintas no comunica un flujo lineal. */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="rounded-2xl border border-border bg-white p-4 relative">
                <div className="relative inline-block mb-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center bg-safety-tint text-safety font-mono text-xs font-semibold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className="hidden sm:block absolute top-1/2 left-full w-3 md:w-4 -translate-y-1/2 border-t border-dashed border-border" />
                  )}
                </div>
                <Icon className="w-5 h-5 mb-2 text-safety" />
                <h3 className="font-semibold text-sm mb-1">{step.label}</h3>
                <p className="text-xs text-ink-muted leading-snug">{step.desc}</p>
                <ArrowRight className="w-3.5 h-3.5 mt-3 text-ink-faint" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
