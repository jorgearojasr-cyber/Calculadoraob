import { formatQuantity } from "./format-number";
import type { CalculationResult } from "./formula-engine";

export function buildCalculationPrompt(input: {
  moduleName: string;
  categoryName: string;
  answersSummary: { label: string; value: string }[];
  results: CalculationResult[];
}): string {
  const lines: string[] = [];

  lines.push(
    `Estoy calculando materiales para un proyecto de "${input.moduleName}" (categoría ${input.categoryName}) usando ObraBien Calcula.`
  );
  lines.push("");
  lines.push("Datos del proyecto:");
  for (const item of input.answersSummary) {
    lines.push(`- ${item.label}: ${item.value}`);
  }
  lines.push("");
  lines.push("Resultado del cálculo:");
  for (const result of input.results) {
    lines.push(`- ${result.label}: ${formatQuantity(result.value)} ${result.unit}`);
  }
  lines.push("");
  lines.push(
    "¿Puedes revisar si estas cantidades son razonables, darme recomendaciones adicionales y advertirme sobre errores comunes para este tipo de trabajo?"
  );

  return lines.join("\n");
}
