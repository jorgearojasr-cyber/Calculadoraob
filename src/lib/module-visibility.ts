// Fase C7.3 (2026-09-04) — gate mínimo para poder probar piscina-integral en
// Vercel Preview (QA de producto real, navegación completa incl. categoría)
// sin tocar Module.published en la BD, que debe permanecer en `false` hasta
// aprobación explícita de producción.
//
// Vercel Preview compila con NODE_ENV=production, igual que producción real
// — por eso NO se puede usar `NODE_ENV !== "production"` para detectar
// Preview (eso ya se evaluó y se descartó en la fase de diagnóstico previa a
// C7.1). Solo `VERCEL_ENV === "preview"` distingue Preview de producción real
// en Vercel; en local no existe VERCEL_ENV, así que ahí se sigue usando
// NODE_ENV (development/test) como ya hacía el bypass local de fases
// anteriores.
//
// Deliberadamente restringido a un slug específico (no "todo módulo
// unpublished se vuelve visible"): exponer en Preview cualquier módulo aún no
// terminado sería un efecto colateral no deseado de este fix puntual.
const PREVIEW_ENABLED_SLUGS = new Set(["piscina-integral"]);

export interface VisibilityEnv {
  nodeEnv: string | undefined;
  vercelEnv: string | undefined;
}

function currentEnv(): VisibilityEnv {
  return { nodeEnv: process.env.NODE_ENV, vercelEnv: process.env.VERCEL_ENV };
}

function isLocalDevOrTest(env: VisibilityEnv): boolean {
  return env.nodeEnv !== "production";
}

function isVercelPreview(env: VisibilityEnv): boolean {
  return env.vercelEnv === "preview";
}

/**
 * ¿Debe mostrarse este módulo en el entorno actual? `published: true` siempre
 * gana; si no, solo los slugs en PREVIEW_ENABLED_SLUGS son visibles, y solo
 * en local development/test o en Vercel Preview — nunca en producción real.
 */
export function isModuleVisible(
  module: { slug: string; published: boolean },
  env: VisibilityEnv = currentEnv()
): boolean {
  if (module.published) return true;
  if (!PREVIEW_ENABLED_SLUGS.has(module.slug)) return false;
  return isLocalDevOrTest(env) || isVercelPreview(env);
}

/**
 * Slugs no publicados que deben tratarse como visibles en el entorno actual
 * — usado por las páginas de categoría/módulo para construir un `where` de
 * Prisma (`OR: [{ published: true }, { slug: { in: getExtraVisibleSlugs() } }]`)
 * sin duplicar la condición de entorno en cada página.
 */
export function getExtraVisibleSlugs(env: VisibilityEnv = currentEnv()): string[] {
  if (isLocalDevOrTest(env) || isVercelPreview(env)) return Array.from(PREVIEW_ENABLED_SLUGS);
  return [];
}
