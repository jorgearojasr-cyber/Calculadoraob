import { formatQuantity } from "./format-number";
import type { CalculationResult, InfoResult } from "./formula-engine";
import type { NormSummary } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";

// Convierte "¿Cómo vas a colocar el hormigón?" en "cómo vas a colocar el
// hormigón" para que, encadenado en una lista, se lea como una frase y no
// como un formulario.
function toNaturalClause(label: string): string {
  return label.trim().replace(/^¿/, "").replace(/\?$/, "").replace(/^./, (c) => c.toLowerCase());
}

function buildCharacteristics(answersSummary: { label: string; value: string }[]): string {
  return answersSummary
    .filter((item) => item.value && item.value !== "—")
    .map((item) => `${toNaturalClause(item.label)}: ${item.value}`)
    .join(", ");
}

function buildMaterialsList(results: CalculationResult[]): string {
  return results.map((r) => `${formatQuantity(r.value)} ${r.unit} de ${r.label.toLowerCase()}`).join(", ");
}

// Heurística de género gramatical español a partir de la primera palabra
// del nombre del módulo (ej. "Viga" -> "una", "Radier" -> "un") — no es
// perfecta para todos los casos, pero cubre la gran mayoría.
function inferArticle(moduleName: string): "un" | "una" {
  const firstWord = moduleName.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (/(ción|sión|dad|tud)$/.test(firstWord)) return "una";
  return firstWord.endsWith("a") ? "una" : "un";
}

export function buildCalculationPrompt(input: {
  moduleName: string;
  categoryName: string;
  answersSummary: { label: string; value: string }[];
  results: CalculationResult[];
  infoResults?: InfoResult[];
  norms?: NormSummary[];
}): string {
  const characteristics = buildCharacteristics(input.answersSummary);
  const materials = buildMaterialsList(input.results);
  const hasReinforcedWarning = (input.norms ?? []).some((n) => n.reinforcedWarning);

  const paragraphs: string[] = [];

  const article = inferArticle(input.moduleName);
  paragraphs.push(
    `Voy a hacer ${article} ${input.moduleName.toLowerCase()}${characteristics ? ` con estas características: ${characteristics}` : ""}.`
  );

  paragraphs.push(
    materials
      ? `Ya calculé los materiales que necesito: ${materials}.`
      : "Ya calculé los datos de este trabajo con ObraBien Calcula."
  );

  if (hasReinforcedWarning) {
    paragraphs.push(
      "Ten en cuenta que este es un elemento estructural/regulado — no reemplaces el criterio de un profesional habilitado."
    );
  }

  paragraphs.push(
    "Con esta información, dame una guía paso a paso de cómo ejecutar este trabajo en la obra, pensada para alguien sin experiencia previa en construcción. Incluye: orden de los pasos, herramientas que voy a necesitar, tiempos de espera/fraguado si aplica, y errores comunes que debería evitar."
  );

  return paragraphs.join("\n\n");
}
