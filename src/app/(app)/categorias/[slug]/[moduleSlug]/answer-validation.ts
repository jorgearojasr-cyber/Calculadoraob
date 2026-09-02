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

// Único caso real hoy: "Preparación bajo losa" del configurador integral
// de Piscina ("piscina-integral") -- ver fase-c3-piscina-integral-
// excavacion.ts. Su propio helpText documenta el 0 como valor válido
// ("si no corresponde, déjalo en 0 cm"), a diferencia de cualquier otra
// pregunta NUMBER del catálogo (largo, ancho, profundidad, capacidad de
// camión...), donde 0 sigue sin sentido y debe seguir rechazándose.
const ZERO_ALLOWED_BY_MODULE_AND_KEY = new Set([moduleQuestionKey("piscina-integral", "excavacion-preparacion-losa-cm")]);

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
