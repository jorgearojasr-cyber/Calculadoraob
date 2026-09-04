// Fase Pre-Producción Final (2026-09-04) — "46 pasos" en /grupos/piscinas
// (y en el mismo cálculo del carrusel de Home) resultó ser Module._count
// .questions: el conteo crudo de filas Question en BD, no de pasos reales
// de UX. Para la mayoría de los módulos (preguntas mayormente lineales, sin
// mucha rama condicional) ese conteo SÍ aproxima bien los pasos reales, y
// se sigue usando tal cual. piscina-integral es la excepción: 46 Question
// repartidas en muchas ramas condicionales (forma, terminaciones,
// excavación, entorno, equipamiento, costos) de las que un usuario real solo
// ve un subconjunto pequeño según sus respuestas — mostrar "46 pasos" ahí
// es engañoso.
//
// En vez de inventar una métrica nueva (ej. contar Question.stepGroup
// distintos), se prefiere no mostrar ningún número para los slugs listados
// acá — ProjectCard ya maneja stepCount=null omitiendo el texto (mismo
// comportamiento ya usado para tareas sin dato real de pasos).
const HIDE_RAW_QUESTION_STEPCOUNT_SLUGS = new Set(["piscina-integral"]);

export function getDisplayStepCount(
  moduleSlug: string | undefined,
  rawQuestionCount: number | null | undefined
): number | null {
  if (rawQuestionCount == null) return null;
  if (moduleSlug && HIDE_RAW_QUESTION_STEPCOUNT_SLUGS.has(moduleSlug)) return null;
  return rawQuestionCount;
}
