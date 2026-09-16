import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";

// Preparación para dominio propio (calcula.obrabien.cl) — no existía
// ningún sitemap.ts antes de esta fase. Solo incluye páginas públicas e
// indexables con datos reales — mismos criterios de "published"/"con
// contenido real" ya usados en otras partes del código (ver comentarios
// puntuales abajo), nunca hardcodeados a mano. Explícitamente fuera:
// módulos unpublished (incluido piscina-integral), categorías/grupos sin
// contenido, /admin, /proyectos y cualquier SavedProject de usuario,
// /login, /registro, /buscar, /inspecciones, /regularizacion,
// /zzdiagramv2test (mismo criterio que robots.ts).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/calculadoras`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/planificar`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/guias`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/galeria`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${base}/acerca-de`, changeFrequency: "monthly", priority: 0.2 },
  ];

  // Módulos published:true — misma condición que ya filtra /calculadoras,
  // /buscar y /guias (ver search.ts, calculators.ts, guias/page.tsx). Cada
  // uno vive en /categorias/[category.slug]/[module.slug].
  const modules = await prisma.module.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
  });
  const moduleRoutes: MetadataRoute.Sitemap = modules.map((m) => ({
    url: `${base}/categorias/${m.category.slug}/${m.slug}`,
    lastModified: m.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Categorías con al menos 1 módulo published — mismo criterio que ya usa
  // Home (sección Explora) para no listar categorías vacías (ej.
  // "Quinchos", "Fierros" hoy).
  const categories = await prisma.category.findMany({
    where: { modules: { some: { published: true } } },
    select: { slug: true },
  });
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/categorias/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // Guías de módulo (ModuleGuide) — solo las de módulos published (mismo
  // filtro que guias/page.tsx), en /guias/[module.slug].
  const guides = await prisma.moduleGuide.findMany({
    where: { module: { published: true } },
    select: { updatedAt: true, module: { select: { slug: true } } },
  });
  const guideRoutes: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${base}/guias/${g.module.slug}`,
    lastModified: g.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Guías rápidas (QuickGuide) — sin flag de publicación en el modelo
  // (todas las existentes son públicas por diseño), en /guias-rapidas/[slug].
  const quickGuides = await prisma.quickGuide.findMany({ select: { slug: true, updatedAt: true } });
  const quickGuideRoutes: MetadataRoute.Sitemap = quickGuides.map((q) => ({
    url: `${base}/guias-rapidas/${q.slug}`,
    lastModified: q.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  // Grupos (ProjectGroup) — "herramientas-avanzadas" ("Cálculos
  // especiales") se excluye a propósito: ya está fuera de la exploración
  // principal de Home (ver Home "Explora"/exploration-section.tsx), mismo
  // criterio de contenido no-primario se aplica acá.
  const groups = await prisma.projectGroup.findMany({
    where: { slug: { not: "herramientas-avanzadas" } },
    select: { slug: true },
  });
  const groupRoutes: MetadataRoute.Sitemap = groups.map((g) => ({
    url: `${base}/grupos/${g.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // ProjectPlan — planes de fases reales (hoy solo "construir-una-piscina").
  const plans = await prisma.projectPlan.findMany({ select: { slug: true, updatedAt: true } });
  const planRoutes: MetadataRoute.Sitemap = plans.map((p) => ({
    url: `${base}/plan/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...moduleRoutes,
    ...categoryRoutes,
    ...guideRoutes,
    ...quickGuideRoutes,
    ...groupRoutes,
    ...planRoutes,
  ];
}
