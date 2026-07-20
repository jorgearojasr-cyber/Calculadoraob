"use server";

import { prisma } from "@/lib/prisma";
import {
  calculateModule,
  type Answers,
  type CalculationResult,
  type DslValue,
  type InfoResult,
} from "@/lib/formula-engine";

export type NormSummary = {
  id: string;
  code: string;
  title: string;
  scope: string;
  verificationStatus: "CITADO" | "PRACTICA_GENERAL_NO_VERIFICADA";
  note: string | null;
};

export type CalculateModuleResult = {
  results: CalculationResult[];
  infoResults: InfoResult[];
  variables: Record<string, DslValue>;
  norms: NormSummary[];
};

export async function calculateModuleAction(
  moduleId: string,
  answers: Answers
): Promise<CalculateModuleResult> {
  const mod = await prisma.module.findUniqueOrThrow({
    where: { id: moduleId },
    include: {
      questions: { include: { options: true } },
      variables: { include: { norm: true } },
      formulas: { include: { material: true, norm: true } },
      lossFactors: { include: { norm: true } },
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

  const { results, infoResults, variables } = calculateModule({
    variables: mod.variables,
    formulas: mod.formulas,
    lossFactors: mod.lossFactors,
    answers: cleanAnswers,
  });

  const normsById = new Map<string, NormSummary>();
  for (const source of [...mod.variables, ...mod.formulas, ...mod.lossFactors]) {
    if (source.norm) {
      normsById.set(source.norm.id, {
        id: source.norm.id,
        code: source.norm.code,
        title: source.norm.title,
        scope: source.norm.scope,
        verificationStatus: source.norm.verificationStatus,
        note: source.norm.note,
      });
    }
  }

  return { results, infoResults, variables, norms: Array.from(normsById.values()) };
}
