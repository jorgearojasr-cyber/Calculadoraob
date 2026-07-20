import { CheckCircle2, Share2, Sparkles, Users, type LucideIcon } from "lucide-react";

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-xs text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Icon className="w-6 h-6 mb-3 text-safety" />
                <h3 className="font-semibold text-[15px] mb-1">{step.label}</h3>
                <p className="text-xs text-ink-muted">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
