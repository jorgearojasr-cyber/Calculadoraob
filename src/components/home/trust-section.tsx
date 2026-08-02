import {
  Construction,
  Layers,
  ShieldCheck,
  Users,
  FileCheck2,
  Zap,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

// Rediseño de Home (2026-08-01, aprobado): pasa de bg-navy (bloque
// oscuro y serio) a un tratamiento claro — el objetivo es sentirse
// como un asistente cercano, no como una ficha técnica. Además, suma
// los 4 "beneficios" que antes vivían en el Hero (100% gratis, rápido,
// ahorra dinero, confiable) — decían básicamente lo mismo que esta
// sección en un lugar distinto de la misma página; unificarlos en un
// solo bloque de confianza evita repetir el mensaje dos veces.
const TRUST_ITEMS: { label: string; icon: LucideIcon }[] = [
  { label: "100% gratis", icon: FileCheck2 },
  { label: "Rápido y fácil", icon: Zap },
  { label: "Ahorra dinero", icon: ShoppingCart },
  { label: "Normas chilenas", icon: ShieldCheck },
  { label: "Rendimientos reales", icon: Layers },
  { label: "Factores de pérdida", icon: Construction },
  { label: "Experiencia de maestros", icon: Users },
];

export function TrustSection() {
  return (
    <section id="confianza" className="max-w-6xl mx-auto px-4 sm:px-10 py-10 sm:py-16">
      <div
        className="rounded-3xl p-6 sm:p-10 grid md:grid-cols-2 gap-6 sm:gap-10 items-center"
        style={{ backgroundColor: "#EDF3FA", border: "1px solid #D8E3F1" }}
      >
        <div>
          <ShieldCheck className="w-7 h-7 mb-4 text-safety" />
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-3 text-[#10203A]" style={{ letterSpacing: "-0.015em" }}>
            Cálculos basados en información real de obra
          </h2>
          <p className="text-sm text-[#5B6577]">
            Cada fórmula está construida sobre normas chilenas de construcción, buenas
            prácticas de la industria, factores reales de pérdida de material y décadas
            de experiencia de maestros de obra. No adivinamos: calculamos.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-xl p-3 bg-white border border-[#E4E8EF]">
                <Icon className="w-4 h-4 mb-2 text-safety" />
                <p className="text-xs font-medium text-[#10203A]">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
