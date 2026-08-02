import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Share2,
  Sparkles,
  Users,
  ListChecks,
  AlertTriangle,
  MessageSquareQuote,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

// Rediseño de Home (2026-08-01, aprobado): fusiona lo que antes eran
// HowItWorks + LearnBanner en una sola sección — ambas respondían la
// misma pregunta implícita del usuario ("¿cómo uso esto / qué más
// puedo aprender acá?") de forma redundante y consecutiva.
const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: "Responde", icon: Users },
  { label: "Calcula", icon: Sparkles },
  { label: "Resultado", icon: CheckCircle2 },
  { label: "Comparte", icon: Share2 },
];

const GUIDE_ITEMS: { label: string; desc: string; icon: LucideIcon }[] = [
  { label: "Guías paso a paso", desc: "Instrucciones claras para cada proyecto", icon: ListChecks },
  { label: "Errores comunes", desc: "Aprende lo que debes evitar", icon: AlertTriangle },
  { label: "Consejos de maestros", desc: "Experiencia real de obra", icon: MessageSquareQuote },
  { label: "Listas de compra", desc: "Lleva todo lo que necesitas", icon: ShoppingCart },
];

export function LearnSection() {
  return (
    <section id="como-funciona" className="max-w-6xl mx-auto px-4 sm:px-10 py-8 sm:py-12">
      <p
        className="font-mono text-[11px] uppercase mb-2 text-[#5B6577]"
        style={{ letterSpacing: "0.08em" }}
      >
        Aprende
      </p>
      <h2
        className="font-display text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-[#10203A]"
        style={{ letterSpacing: "-0.02em" }}
      >
        Más que cálculos, te enseñamos a construir mejor
      </h2>

      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="rounded-xl sm:rounded-2xl border border-[#E4E8EF] bg-white p-2 sm:p-4 relative">
              <div className="relative inline-block mb-1.5 sm:mb-2">
                <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center bg-safety-tint text-safety font-mono text-[9px] sm:text-xs font-semibold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="absolute top-1/2 left-full w-2 sm:w-4 -translate-y-1/2 border-t border-dashed border-[#D8DEE8]" />
                )}
              </div>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-safety" />
              <p className="font-semibold text-[11px] sm:text-sm leading-tight text-[#10203A]">{step.label}</p>
            </div>
          );
        })}
      </div>

      <Link
        href="/guias"
        className="block rounded-3xl p-5 sm:p-8 bg-concrete border border-[#E4E8EF] hover:border-[#002152]/30 transition-colors"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-4 flex-wrap">
          <h3 className="font-display text-lg sm:text-xl font-bold text-[#10203A]" style={{ letterSpacing: "-0.015em" }}>
            Guías y consejos
          </h3>
          <span className="text-sm font-medium text-[#5B6577] inline-flex items-center gap-1.5 flex-shrink-0">
            Ver todas
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {GUIDE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <Icon className="w-5 h-5 mb-2 text-safety" />
                <p className="font-semibold text-sm mb-0.5 text-[#10203A]">{item.label}</p>
                <p className="text-xs text-[#5B6577]">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </Link>
    </section>
  );
}
