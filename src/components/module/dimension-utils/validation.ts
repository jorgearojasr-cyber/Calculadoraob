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
    const num = Number(raw.replace(",", "."));
    if (!raw || !Number.isFinite(num) || num <= 0) {
      return { parsed: null, error: "Completa todos los campos con un número mayor que 0." };
    }
    parsed[question.key] = num;
  }
  return { parsed, error: null };
}
