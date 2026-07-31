// Rutas del wizard de un módulo (preguntas o resultado) — el header del
// sitio (TopNav/MobileTopBar) se oculta ahí a favor del WizardHeader propio
// del módulo (ver conversación 2026-07-30, ajuste de header tras el
// rediseño de pasos con diagrama). Requiere 2 segmentos después de
// /categorias (categoría + módulo) — /categorias/[slug] solo (el listado
// de la categoría) NO cuenta como wizard y conserva el nav del sitio.
export function isWizardRoute(pathname: string | null): boolean {
  return /^\/categorias\/[^/]+\/[^/]+/.test(pathname ?? "");
}
