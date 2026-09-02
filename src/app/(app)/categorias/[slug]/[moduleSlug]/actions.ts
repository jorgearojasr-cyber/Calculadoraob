"use server";

import { prisma } from "@/lib/prisma";
import {
  calculateModule,
  type Answers,
  type CalculationResult,
  type DslValue,
  type InfoResult,
} from "@/lib/formula-engine";
import { isNumberAnswerInvalid } from "./answer-validation";

export type NormSummary = {
  id: string;
  code: string;
  title: string;
  scope: string;
  verificationStatus: "CITADO" | "PRACTICA_GENERAL_NO_VERIFICADA";
  note: string | null;
  reinforcedWarning: boolean;
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
      if (isNumberAnswerInvalid(mod.slug, question.key, num)) {
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

  const { results, infoResults, variables, evaluatedFormulaKeys, appliedLossFactorKeys } =
    calculateModule({
      variables: mod.variables,
      formulas: mod.formulas,
      lossFactors: mod.lossFactors,
      answers: cleanAnswers,
    });

  // Solo las normas de la rama realmente ejecutada: fórmulas evaluadas
  // (condición verdadera), variables resueltas y pérdidas aplicadas — no
  // las de todas las ramas del módulo (ej. la cita del fiscal industrial
  // no debe aparecer si el usuario eligió el artesanal).
  const evaluatedFormulas = new Set(evaluatedFormulaKeys);
  const appliedLossFactors = new Set(appliedLossFactorKeys);
  const normSources = [
    ...mod.variables.filter((v) => variables[v.key] !== undefined && variables[v.key] !== null),
    ...mod.formulas.filter((f) => evaluatedFormulas.has(f.key)),
    ...mod.lossFactors.filter((lf) => appliedLossFactors.has(lf.key)),
  ];

  const normsById = new Map<string, NormSummary>();
  for (const source of normSources) {
    if (source.norm) {
      normsById.set(source.norm.id, {
        id: source.norm.id,
        code: source.norm.code,
        title: source.norm.title,
        scope: source.norm.scope,
        verificationStatus: source.norm.verificationStatus,
        note: source.norm.note,
        reinforcedWarning: source.norm.reinforcedWarning,
      });
    }
  }

  return { results, infoResults, variables, norms: Array.from(normsById.values()) };
}
