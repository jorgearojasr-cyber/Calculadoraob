import Link from "next/link";
import { Calculator, Map as MapIcon, ClipboardCheck, ShieldCheck, BookOpen, FolderKanban, type LucideIcon } from "lucide-react";
import { getHomeFeatures } from "@/lib/product-features";

type QuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

// Home ObraBien V2 (2026-09-14, punto 4 del pedido) — grilla "¿Qué quieres
// hacer?", el reemplazo directo de la vieja sección "Todas las categorías"
// como primer contacto post-Hero.
//
// "Calcular" y "Planificar" NO vienen del registro central
// (src/lib/product-features.ts) a propósito — igual que "Inicio"/
// "Calculadoras"/"Acerca de" en TopNav, son estructurales: CALCULA está
// representado por el sistema `Module` (no tiene FeatureEntry, ver
// PRODUCT_AREAS.calcula) y PLANIFICA por `ProjectPlan` (ídem,
// PRODUCT_AREAS.planifica) — ambos documentados en product-feature-registry.md
// como áreas "sin entrada en PRODUCT_FEATURES por tener su propio modelo
// Prisma real". "Mis proyectos" tampoco está en el registro por el mismo
// motivo que en BottomNav (navegación estructural ligada a sesión, no una
// "feature descubrible").
//
// Revisar/Regularizar/Aprender SÍ vienen de getHomeFeatures() (registro
// central) — Regularización activó showInHome:true en esta fase (sin
// tocar showInMenu, que sigue en false) precisamente para poder aparecer
// acá sin duplicar su definición.
const STRUCTURAL_ACTIONS: Record<"calcular" | "planificar" | "mis-proyectos", QuickAction> = {
  calcular: {
    id: "calcular",
    label: "Calcular",
    description: "Materiales y costos",
    href: "/#empezar",
    icon: Calculator,
  },
  planificar: {
    id: "planificar",
    label: "Planificar",
    description: "Pasos y etapas de tu proyecto",
    href: "/planificar",
    icon: MapIcon,
  },
  "mis-proyectos": {
    id: "mis-proyectos",
    label: "Mis proyectos",
    description: "Todo en un solo lugar",
    // Ruta ya protegida por middleware.ts (matcher /proyectos) — sin
    // sesión, redirige a /login como hoy. No se agrega ninguna
    // verificación nueva acá.
    href: "/proyectos",
    icon: FolderKanban,
  },
};

// Ícono/descripción corta por feature del registro — separado del
// registro central porque `FeatureEntry.description` está pensada para
// el buscador (una oración completa), no para una tarjeta de 2-3
// palabras como pide el punto 6 del pedido ("microdescripción").
const HOME_FEATURE_CARD_COPY: Record<string, { label: string; description: string; icon: LucideIcon }> = {
  inspecciones: { label: "Revisar tu obra", description: "Inspecciones y checklist", icon: ClipboardCheck },
  regularizacion: { label: "Regularizar", description: "Ley del Mono y trámites", icon: ShieldCheck },
  guias: { label: "Aprender", description: "Guías y consejos", icon: BookOpen },
};

export function QuickActionsGrid() {
  const homeFeatures = getHomeFeatures();

  const featureActions: QuickAction[] = homeFeatures
    .filter((f) => HOME_FEATURE_CARD_COPY[f.id] && f.href)
    .map((f) => {
      const copy = HOME_FEATURE_CARD_COPY[f.id];
      return { id: f.id, label: copy.label, description: copy.description, href: f.href as string, icon: copy.icon };
    });

  const byId = new Map(featureActions.map((a) => [a.id, a]));

  // Orden fijo pedido por el punto 4 (no es el `order` del registro, que
  // gobierna el menú — el orden visual de la grilla del Home es una
  // decisión de producto propia de esta fase).
  const actions: QuickAction[] = [
    STRUCTURAL_ACTIONS.calcular,
    STRUCTURAL_ACTIONS.planificar,
    byId.get("inspecciones"),
    byId.get("regularizacion"),
    byId.get("guias"),
    STRUCTURAL_ACTIONS["mis-proyectos"],
  ].filter((a): a is QuickAction => Boolean(a));

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-10 pb-6 sm:pb-10">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={action.href}
              className="flex flex-col gap-2.5 rounded-2xl p-4 sm:p-5 bg-white border border-[#E4E8EF] hover:border-[#002152]/30 transition-colors min-h-[132px]"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-navy/[0.07]">
                <Icon className="w-5 h-5 text-navy" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-[#10203A] leading-tight">{action.label}</h3>
                <p className="text-xs text-[#5B6577] mt-0.5">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
