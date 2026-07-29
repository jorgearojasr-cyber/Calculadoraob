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
        {/* Siempre 4 en fila, incluido mobile (375px) — decisión explícita
            del dueño de producto de no colapsar a 2x2, con tarjetas mas
            compactas (padding/texto/icono mas chicos en la base, crecen
            desde sm) para que quepan sin overflow horizontal. El conector
            punteado ahora esta siempre visible (ya no depende de un
            breakpoint donde antes podia colapsar a 2 filas). */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="rounded-xl sm:rounded-2xl border border-border bg-white p-2 sm:p-4 relative">
                <div className="relative inline-block mb-1.5 sm:mb-3">
                  <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center bg-safety-tint text-safety font-mono text-[9px] sm:text-xs font-semibold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className="absolute top-1/2 left-full w-2 sm:w-4 -translate-y-1/2 border-t border-dashed border-border" />
                  )}
                </div>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2 text-safety" />
                <h3 className="font-semibold text-[11px] sm:text-sm mb-0.5 sm:mb-1 leading-tight">{step.label}</h3>
                <p className="text-[10px] sm:text-xs text-ink-muted leading-snug">{step.desc}</p>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-1.5 sm:mt-3 text-ink-faint" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
