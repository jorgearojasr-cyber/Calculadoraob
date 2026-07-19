"use server";

import { prisma } from "@/lib/prisma";
import { calculateModule, type Answers, type CalculationResult, type DslValue } from "@/lib/formula-engine";

export type CalculateModuleResult = {
  results: CalculationResult[];
  variables: Record<string, DslValue>;
};

export async function calculateModuleAction(
  moduleId: string,
  answers: Answers
): Promise<CalculateModuleResult> {
  const mod = await prisma.module.findUniqueOrThrow({
    where: { id: moduleId },
    include: {
      questions: { include: { options: true } },
      variables: true,
      formulas: { include: { material: true } },
      lossFactors: true,
    },
  });

  const cleanAnswers: Answers = {};
  for (const question of mod.questions) {
    const raw = answers[question.key];
    if (raw === undefined) continue;

    if (question.type === "NUMBER") {
      const num = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(num) || num <= 0) {
        throw new Error(`Respuesta inválida para "${question.label}".`);
      }
      cleanAnswers[question.key] = num;
      continue;
    }

    if (question.type === "TEXT") {
      const text = String(raw).trim();
      if (!text) {
        throw new Error(`Respuesta inválida para "${question.label}".`);
      }
      cleanAnswers[question.key] = text;
      continue;
    }

    const validKeys = question.options.map((option) => option.key);
    if (!validKeys.includes(String(raw))) {
      throw new Error(`Respuesta inválida para "${question.label}".`);
    }
    cleanAnswers[question.key] = String(raw);
  }

  return calculateModule({
    variables: mod.variables,
    formulas: mod.formulas,
    lossFactors: mod.lossFactors,
    answers: cleanAnswers,
  });
}
