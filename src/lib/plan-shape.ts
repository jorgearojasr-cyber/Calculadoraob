// Labels que representan una elección de FORMA (no cualquier label de
// ProjectPlanPhaseModule) — solo estos participan en la propagación
// ?shape= entre fases de un plan. Otros labels (ej. "Radier (base)",
// "Pastelones" en "Terminar el entorno") no son una forma y no deben
// ensuciar la URL con un valor sin sentido para ese query param.
// Compartido entre plan/[slug]/page.tsx y categorias/[slug]/[moduleSlug]/
// page.tsx (este último lo usa para resolver la fase SIGUIENTE al guardar,
// ver planContext.nextPhase) — antes solo vivía duplicado en el primero.
export const SHAPE_LABELS = new Set(["rectangular", "circular"]);
