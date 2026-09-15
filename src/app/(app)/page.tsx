import { Hero } from "@/components/home/hero";
import { QuickActionsGrid } from "@/components/home/quick-actions-grid";
import { RecentProjects } from "@/components/home/recent-projects";
import { PopularCalculatorsSection } from "@/components/home/popular-calculators-section";
import { PlanFeaturedSection } from "@/components/home/plan-featured-section";
import { ExplorationSection } from "@/components/home/exploration-section";
import { SiteFooter } from "@/components/home/site-footer";

// Home ObraBien V2 (2026-09-14) — reemplaza la composición de "Home
// ObraBien Calcula — Especificación de UI" (2026-08-05, ver
// docs/home-especificacion-ui-auditoria.md para esa versión anterior).
//
// Nueva estructura, más corta (punto 11 del pedido): Hero compacto →
// "¿Qué quieres hacer?" (6 tarjetas: Calcular/Planificar/Revisar tu
// obra/Regularizar/Aprender/Mis proyectos) → Continúa tu proyecto (solo
// con sesión y proyectos reales) → Calculadoras populares (datos reales,
// getPopularTasks()) → Planifica tu proyecto (tarjeta destacada al
// ProjectPlan real) → Explora / "¿Qué quieres construir?" (la superficie
// real de calculadoras por proyecto/material, reutilizada sin cambios —
// es el destino de la tarjeta "Calcular" vía #empezar) → Footer.
//
// Se retiran de la composición (NO se borran los archivos, ver punto 11
// del pedido — "no eliminar componentes reutilizables si hay dudas"):
// LearnSection (pasos "Responde/Calcula/Resultado/Comparte" + bloque de
// Guías — redundante con la nueva tarjeta "Aprender") y TrustSection
// (bloque institucional "Cálculos basados en información real de obra" —
// el bloque largo que pedía reducirse/eliminarse explícitamente).
export default async function Home() {
  return (
    <div>
      <Hero />
      <QuickActionsGrid />
      <RecentProjects />
      <PopularCalculatorsSection />
      <PlanFeaturedSection />
      <ExplorationSection />
      <SiteFooter />
    </div>
  );
}
