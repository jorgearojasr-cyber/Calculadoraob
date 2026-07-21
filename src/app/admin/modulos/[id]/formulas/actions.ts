"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/unique-slug";
import { Prisma } from "@/generated/prisma/client";
import {
  applyModifiers,
  compileCondition,
  compileExpression,
  type BuilderCondition,
  type BuilderOp,
  type BuilderTerm,
  type RoundingMode,
} from "@/lib/formula-builder";

export type FormulaInput = {
  label: string;
  unit: string;
  terms: BuilderTerm[];
  ops: BuilderOp[];
  condition: BuilderCondition;
  lossFactorKey: string | null;
  rounding: RoundingMode;
  note: string;
  materialLabelTemplate: string;
};

async function revalidateModulePaths(moduleId: string) {
  const mod = await prisma.module.findUnique({ where: { id: moduleId }, include: { category: true } });
  revalidatePath(`/admin/modulos/${moduleId}/formulas`);
  revalidatePath(`/admin/modulos/${moduleId}/materiales`);
  revalidatePath(`/admin/modulos/${moduleId}/preview`);
  if (mod) revalidatePath(`/categorias/${mod.category.slug}/${mod.slug}`);
}

async function buildExpressionAndCondition(moduleId: string, input: FormulaInput) {
  const terms = input.terms;
  if (terms.length === 0) throw new Error("La fórmula necesita al menos un término.");
  if (terms.some((t) => t.kind === "variable" && !t.variableKey)) {
    throw new Error("Elige una variable para cada término de la fórmula.");
  }
  if (terms.some((t) => t.kind === "formula" && !t.formulaKey)) {
    throw new Error("Elige una fórmula para cada término que referencia otro resultado.");
  }
  if (input.ops.length !== terms.length - 1) {
    throw new Error("La fórmula tiene un operador faltante entre términos.");
  }

  const [variables, formulas] = await Promise.all([
    prisma.variable.findMany({ where: { moduleId } }),
    prisma.formula.findMany({ where: { moduleId }, select: { key: true } }),
  ]);
  const variablesByKey = Object.fromEntries(variables.map((v) => [v.key, v]));
  const formulaKeys = new Set(formulas.map((f) => f.key));
  if (terms.some((t) => t.kind === "formula" && !formulaKeys.has(t.formulaKey))) {
    throw new Error("La fórmula referenciada no existe en este módulo.");
  }

  const baseExpression = compileExpression(terms, input.ops);
  const expression = applyModifiers(baseExpression, input.lossFactorKey, input.rounding);

  let condition = null;
  if (input.condition && input.condition.variableKey) {
    const variable = variablesByKey[input.condition.variableKey];
    condition = compileCondition(input.condition, variable?.valueType);
  }

  return { expression, condition };
}

export async function createFormulaAction(
  moduleId: string,
  input: FormulaInput
): Promise<{ error?: string }> {
  const label = input.label.trim();
  const unit = input.unit.trim();
  if (!label) return { error: "El nombre de la fórmula es obligatorio." };
  if (!unit) return { error: "La unidad es obligatoria." };

  let expression, condition;
  try {
    ({ expression, condition } = await buildExpressionAndCondition(moduleId, input));
  } catch (error) {
    return { error: (error as Error).message };
  }

  const existingKeys = (await prisma.formula.findMany({ where: { moduleId }, select: { key: true } })).map(
    (f) => f.key
  );
  const key = uniqueSlug(label, existingKeys);
  const maxOrder = await prisma.formula.aggregate({ where: { moduleId }, _max: { order: true } });

  await prisma.formula.create({
    data: {
      moduleId,
      key,
      label,
      unit,
      expression,
      condition: condition ?? undefined,
      note: input.note.trim() || null,
      materialLabelTemplate: input.materialLabelTemplate.trim() || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await revalidateModulePaths(moduleId);
  return {};
}

export async function updateFormulaAction(
  formulaId: string,
  input: FormulaInput
): Promise<{ error?: string }> {
  const label = input.label.trim();
  const unit = input.unit.trim();
  if (!label) return { error: "El nombre de la fórmula es obligatorio." };
  if (!unit) return { error: "La unidad es obligatoria." };

  const formula = await prisma.formula.findUniqueOrThrow({ where: { id: formulaId } });

  let expression, condition;
  try {
    ({ expression, condition } = await buildExpressionAndCondition(formula.moduleId, input));
  } catch (error) {
    return { error: (error as Error).message };
  }

  await prisma.formula.update({
    where: { id: formulaId },
    data: {
      label,
      unit,
      expression,
      condition: condition ?? Prisma.JsonNull,
      note: input.note.trim() || null,
      materialLabelTemplate: input.materialLabelTemplate.trim() || null,
    },
  });

  await revalidateModulePaths(formula.moduleId);
  return {};
}

export async function deleteFormulaAction(formulaId: string): Promise<{ error?: string }> {
  const formula = await prisma.formula.delete({ where: { id: formulaId } });
  await revalidateModulePaths(formula.moduleId);
  return {};
}

export async function moveFormulaAction(
  formulaId: string,
  direction: "up" | "down"
): Promise<{ error?: string }> {
  const formula = await prisma.formula.findUniqueOrThrow({ where: { id: formulaId } });
  const siblings = await prisma.formula.findMany({
    where: { moduleId: formula.moduleId },
    orderBy: { order: "asc" },
  });
  const index = siblings.findIndex((f) => f.id === formulaId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return {};

  const other = siblings[swapIndex];
  await prisma.$transaction([
    prisma.formula.update({ where: { id: formula.id }, data: { order: other.order } }),
    prisma.formula.update({ where: { id: other.id }, data: { order: formula.order } }),
  ]);

  await revalidateModulePaths(formula.moduleId);
  return {};
}

export async function createLossFactorAction(
  moduleId: string,
  input: { label: string; percentage: number }
): Promise<{ error?: string }> {
  const label = input.label.trim();
  if (!label) return { error: "El nombre del factor de pérdida es obligatorio." };
  if (!Number.isFinite(input.percentage)) return { error: "El porcentaje no es válido." };

  const existingKeys = (
    await prisma.lossFactor.findMany({ where: { moduleId }, select: { key: true } })
  ).map((f) => f.key);
  const key = uniqueSlug(label, existingKeys);

  await prisma.lossFactor.create({
    data: { moduleId, key, label, percentage: input.percentage / 100 },
  });

  await revalidateModulePaths(moduleId);
  return {};
}

export async function deleteLossFactorAction(id: string): Promise<{ error?: string }> {
  const factor = await prisma.lossFactor.delete({ where: { id } });
  await revalidateModulePaths(factor.moduleId);
  return {};
}
