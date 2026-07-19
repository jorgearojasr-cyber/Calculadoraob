import { Construction, Layers, ShieldCheck, Users, type LucideIcon } from "lucide-react";

const TRUST_ITEMS: { label: string; icon: LucideIcon }[] = [
  { label: "Normas chilenas", icon: ShieldCheck },
  { label: "Rendimientos reales", icon: Layers },
  { label: "Factores de pérdida", icon: Construction },
  { label: "Experiencia de maestros", icon: Users },
];

export function TrustSection() {
  return (
    <section id="confianza" className="max-w-6xl mx-auto px-6 py-16">
      <div className="rounded-3xl p-10 grid md:grid-cols-2 gap-10 items-center bg-ink text-concrete">
        <div>
          <ShieldCheck className="w-7 h-7 mb-4 text-safety" />
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-3">
            Cálculos basados en información real de obra
          </h2>
          <p className="text-sm text-[#B5B1A7]">
            Cada fórmula está construida sobre normas chilenas de construcción, buenas
            prácticas de la industria, factores reales de pérdida de material y décadas
            de experiencia de maestros de obra. No adivinamos: calculamos.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-xl p-4 bg-white/[0.06] border border-white/[0.12]"
              >
                <Icon className="w-4 h-4 mb-2 text-safety" />
                <p className="text-xs font-medium">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
