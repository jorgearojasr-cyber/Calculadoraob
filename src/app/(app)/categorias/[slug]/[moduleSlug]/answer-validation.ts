// Fase C3.1 (2026-09-01) -- lógica de validación de respuestas NUMBER
// extraída de actions.ts a un módulo propio SIN "use server": Next.js
// exige que todo export de un archivo "use server" sea una función async
// (server action), así que una función pura como esta no puede vivir ahí
// sin romper esa regla -- y separarla también permite testearla en
// aislamiento, sin montar Prisma/DB (ver answer-validation.test.ts).
//
// Scope real de la excepción de cero: Module + Question.key, no key sola
// -- `Question.key` es único POR Module (`@@unique([moduleId, key])` en
// el schema), no globalmente, así que otro Module podría reutilizar a
// futuro la misma key con semántica distinta (ej. otro "Preparación bajo
// losa" que sí deba exigir > 0) y heredaría esta excepción sin querer si
// solo se comparara por key.
function moduleQuestionKey(moduleSlug: string, questionKey: string): string {
  return `${moduleSlug}::${questionKey}`;
}

// Fase C6 (2026-09-02) -- Costos del configurador integral de Piscina:
// las 10 preguntas NUMBER de precio unitario ($/m³, $/L, $/viaje, etc.)
// son el segundo caso real de "0 válido" -- a diferencia de una medida
// física (largo, ancho, profundidad...), un precio en $0 tiene sentido
// real (sección 19/49 del pedido C6: "permitir 0 si el usuario quiere
// indicar que la partida no tiene costo para él", distinto de dejarla
// vacía/sin responder). Mismo scope Module+Question que el caso de
// "Preparación bajo losa" -- no se amplía la excepción a todo el
// catálogo de precios (ningún otro módulo usa este mecanismo).
const ZERO_ALLOWED_BY_MODULE_AND_KEY = new Set([
  moduleQuestionKey("piscina-integral", "excavacion-preparacion-losa-cm"),
  moduleQuestionKey("piscina-integral", "costos-precio-hormigon-m3"),
  moduleQuestionKey("piscina-integral", "costos-precio-retiro-viaje"),
  moduleQuestionKey("piscina-integral", "costos-precio-pintura-litro"),
  moduleQuestionKey("piscina-integral", "costos-precio-ceramica-interior-m2"),
  moduleQuestionKey("piscina-integral", "costos-precio-membrana-m2"),
  moduleQuestionKey("piscina-integral", "costos-precio-base-entorno-m3"),
  moduleQuestionKey("piscina-integral", "costos-precio-radier-terminado-m3"),
  moduleQuestionKey("piscina-integral", "costos-precio-ceramica-entorno-m2"),
  moduleQuestionKey("piscina-integral", "costos-precio-porcelanato-entorno-m2"),
  moduleQuestionKey("piscina-integral", "costos-precio-pastelon-unidad"),
]);

/**
 * true si `num` es una respuesta NUMBER inválida para esta Question de
 * este Module — `num <= 0` rechazado por defecto (comportamiento
 * genérico sin cambios para todo el catálogo), salvo el único par
 * Module+key explícitamente permitido, donde solo se rechaza `num < 0`.
 */
export function isNumberAnswerInvalid(moduleSlug: string, questionKey: string, num: number): boolean {
  if (!Number.isFinite(num)) return true;
  const allowsZero = ZERO_ALLOWED_BY_MODULE_AND_KEY.has(moduleQuestionKey(moduleSlug, questionKey));
  return allowsZero ? num < 0 : num <= 0;
}
