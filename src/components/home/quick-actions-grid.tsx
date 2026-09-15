import { Calculator, Map as MapIcon, ClipboardCheck, ShieldCheck, BookOpen, FolderKanban, type LucideIcon } from "lucide-react";
import { getHomeFeatures } from "@/lib/product-features";
import { ActionCard } from "@/components/ui/action-card";

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
//
// Design Spec v1.0 (2026-09-15, punto 11 del pedido) — copy actualizado al
// texto exacto del Spec para Revisar/Regularizar/Mis proyectos. Planificar
// mantiene la descripción ya validada en la fase anterior ("Pasos y etapas
// de tu proyecto") en vez del copy sugerido en el Spec ("Presupuesto y
// tiempos") — el propio punto 11 permite explícitamente esa excepción: "o
// el copy exacto aprobado/real si la implementación actual ya usa la
// variante validada".
const STRUCTURAL_ACTIONS: Record<"calcular" | "planificar" | "mis-proyectos", QuickAction> = {
  calcular: {
    id: "calcular",
    label: "Calcular",
    description: "Materiales y costos",
    // Design Spec v1.0 — Parte 2 (Calculadoras/Herramientas), 2026-09-15,
    // punto 19 del pedido: apunta a la nueva ruta canónica /calculadoras
    // en vez del ancla al Home — única actualización de enlace en Home,
    // sin tocar su estética.
    href: "/calculadoras",
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
    description: "Todo en un lugar",
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
  inspecciones: { label: "Revisar tu obra", description: "Inspecciones", icon: ClipboardCheck },
  regularizacion: { label: "Regularizar", description: "Ley del Mono", icon: ShieldCheck },
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

  // Orden fijo pedido por el punto 4/11 (no es el `order` del registro,
  // que gobierna el menú — el orden visual de la grilla del Home es una
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
    <section className="max-w-3xl lg:max-w-6xl mx-auto px-4 sm:px-10 pb-6 sm:pb-10">
      <p className="font-body font-bold text-[12px] uppercase mb-2.5 sm:mb-3 text-ds-text-tertiary" style={{ letterSpacing: "0.08em" }}>
        Todo en un solo lugar
      </p>
      {/* Design Spec v1.0, punto 11: 1×6 en desktop — se habilita en `lg`
          porque el contenedor de esta sección pasa a max-w-6xl desde ese
          breakpoint (ver más abajo), dando a cada ActionCard ~180px de
          ancho, suficiente para mantener el min-height/padding del Spec
          sin perder legibilidad. Entre `sm` y `lg` (contenedor angosto
          todavía) se mantiene 3 columnas × 2 filas. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => (
          <ActionCard key={action.id} href={action.href} label={action.label} description={action.description} icon={action.icon} />
        ))}
      </div>
    </section>
  );
}
