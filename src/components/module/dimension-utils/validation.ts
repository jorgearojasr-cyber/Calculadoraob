import type { WizardQuestion } from "../types";

// Validación de envío de un grupo de campos de medida — pertenece al
// framework: tanto QuestionGroupStep (grid fijo) como FoundationStep
// exigen la MISMA regla al enviar el paso ("cada NUMBER debe ser un
// número mayor que 0; cada SELECT debe tener una opción elegida"), con
// los mismos 2 mensajes de error. Antes era el mismo loop duplicado en
// ambos archivos (FoundationStep nunca ejercitaba la rama SELECT porque
// sus preguntas son todas NUMBER, pero la regla en sí era idéntica).
export function parseAnswers(
  questions: WizardQuestion[],
  values: Record<string, string>
): { parsed: Record<string, number | string>; error: null } | { parsed: null; error: string } {
  const parsed: Record<string, number | string> = {};
  for (const question of questions) {
    const raw = values[question.key] ?? "";
    // Campo SELECT usado como dimensión (ej. espesor de Losa/Muro): la
    // respuesta es la key de la opción elegida, no un número — se valida
    // que exista, no que sea parseable.
    if (question.type === "SELECT") {
      if (!raw) return { parsed: null, error: "Completa todos los campos." };
      parsed[question.key] = raw;
      continue;
    }
    // Campo TEXT dentro de un grupo de medidas (ej. "tramos-json", el
    // desglose de Área personalizada — ver dimension-utils/tramos.ts): es
    // metadata auxiliar para consumo interno, nunca la respuesta principal
    // que el usuario está completando en este paso. Se acepta tal cual,
    // incluso vacío (queda "" cuando el modo activo no es "tramos" — ver
    // handleAreaChange en question-group-step/index.tsx, que SIEMPRE
    // incluye esta key, vacía o no, para poder sobrescribir un valor
    // previo si el usuario cambia de modo después de haber usado "Área
    // personalizada"). calculateModuleAction (ver actions.ts) trata un
    // TEXT vacío como "no respondida" (se omite, no lanza error) — un
    // campo TEXT en este contexto nunca debe bloquear el envío del grupo.
    // Mismo criterio de fondo que "Consumo eléctrico" (que se salta este
    // archivo entero) — acá SÍ pasa por este loop compartido, así que
    // necesita su propio caso explícito.
    if (question.type === "TEXT") {
      parsed[question.key] = raw;
      continue;
    }
    const num = Number(raw.replace(",", "."));
    if (!raw || !Number.isFinite(num) || num <= 0) {
      return { parsed: null, error: "Completa todos los campos con un número mayor que 0." };
    }
    parsed[question.key] = num;
  }
  return { parsed, error: null };
}
