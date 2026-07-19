import { prisma } from "@/lib/prisma";

/**
 * Un material solo puede asociarse a este módulo a través de una fórmula
 * (Formula.materialId) — el editor de admin siempre pide la fórmula al mismo
 * tiempo que el material (ver tab Materiales), así que "material sin fórmula"
 * no es un estado alcanzable y no hace falta validarlo por separado.
 */
export async function validateModuleForPublish(moduleId: string): Promise<string[]> {
  const [questionCount, formulaCount] = await Promise.all([
    prisma.question.count({ where: { moduleId } }),
    prisma.formula.count({ where: { moduleId } }),
  ]);

  const issues: string[] = [];
  if (questionCount === 0) issues.push("Agrega al menos una pregunta.");
  if (formulaCount === 0) issues.push("Agrega al menos una fórmula.");
  return issues;
}
