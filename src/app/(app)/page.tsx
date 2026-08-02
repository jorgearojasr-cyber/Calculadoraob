import { Hero } from "@/components/home/hero";
import { ExplorationSection } from "@/components/home/exploration-section";
import { LearnSection } from "@/components/home/learn-section";
import { TrustSection } from "@/components/home/trust-section";
import { RecentProjects } from "@/components/home/recent-projects";
import { SiteFooter } from "@/components/home/site-footer";

// Home rediseñada según "Home ObraBien Calcula — Especificación de UI"
// (2026-08-05): Hero (con el carrusel de "Proyectos más buscados"
// dentro) → Explora ("Todas las categorías", con Regularización
// reposicionada al final de esa sección, ver ExplorationToggle) →
// Aprende → Confianza → Tus proyectos (solo con sesión) → Footer. Ver
// docs/home-especificacion-ui-auditoria.md para el detalle etapa por
// etapa.
export default async function Home() {
  return (
    <div>
      <Hero />
      <ExplorationSection />
      <LearnSection />
      <TrustSection />
      <RecentProjects />
      <SiteFooter />
    </div>
  );
}
