import Link from "next/link";
import { ListChecks, AlertTriangle, MessageSquareQuote, ShoppingCart, type LucideIcon } from "lucide-react";

const ITEMS: { label: string; desc: string; icon: LucideIcon }[] = [
  { label: "Guías paso a paso", desc: "Instrucciones claras para cada proyecto", icon: ListChecks },
  { label: "Errores comunes", desc: "Aprende lo que debes evitar", icon: AlertTriangle },
  { label: "Consejos de maestros", desc: "Experiencia real de obra", icon: MessageSquareQuote },
  { label: "Listas de compra", desc: "Lleva todo lo que necesitas", icon: ShoppingCart },
];

// Banner puramente descriptivo — cada ítem referencia contenido real ya
// construido (ModuleGuide, hoy solo en algunos módulos; ver /guias) o una
// ruta real (Lista de compras). Sin cifras ni afirmaciones inventadas.
export function LearnBanner() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <Link
        href="/guias"
        className="block rounded-3xl p-8 bg-safety-tint border border-safety-border hover:border-safety/50 transition-colors"
      >
        <h2 className="font-display text-2xl font-semibold tracking-tight mb-6">
          Más que cálculos, te enseñamos a construir mejor
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <Icon className="w-5 h-5 mb-2 text-safety" />
                <p className="font-semibold text-sm mb-0.5">{item.label}</p>
                <p className="text-xs text-ink-muted">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </Link>
    </section>
  );
}
