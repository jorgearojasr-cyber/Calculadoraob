// Fuente única de verdad para la URL pública y metadata base del sitio —
// Fase "Preparación para dominio propio" (2026-09-16). Antes de esta fase
// no existía ningún archivo equivalente (verificado: sin metadataBase, sin
// site-config, sin URL hardcodeada en ningún componente) — se crea acá
// porque metadata (layout), robots.ts y sitemap.ts necesitan la MISMA URL
// base, y repetirla en 3 lugares sería el tipo de duplicación que se pidió
// evitar.
//
// calcula.obrabien.cl es el dominio DEFINIDO para esta plataforma (decisión
// de producto de esta fase) — el código ya está preparado para él, pero el
// dominio todavía NO está conectado en Vercel/DNS (fase deliberadamente
// solo de código, ver instrucciones). Hasta que el dominio esté activo, la
// production URL real sigue siendo calculadoraob.vercel.app — eso no
// depende de este archivo, es una decisión de infraestructura (DNS +
// configuración de Vercel), no de código.
export const siteConfig = {
  name: "ObraBien",
  title: "ObraBien — Calcula, planifica y construye mejor",
  description:
    "Calcula materiales y costos de tu proyecto de construcción, planifica por etapas, revisa tu obra y guarda tus proyectos — todo gratis, sin necesitar experiencia técnica.",
  url: "https://calcula.obrabien.cl",
} as const;
