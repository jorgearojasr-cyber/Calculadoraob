"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/unique-slug";
import type { DslValue, VariableSource } from "@/lib/formula-engine";

async function revalidateModulePaths(moduleId: string) {
  const mod = await prisma.module.findUnique({ where: { id: moduleId }, include: { category: true } });
  revalidatePath(`/admin/modulos/${moduleId}/variables`);
  revalidatePath(`/admin/modulos/${moduleId}/formulas`);
  revalidatePath(`/admin/modulos/${moduleId}/preview`);
  if (mod) revalidatePath(`/categorias/${mod.category.slug}/${mod.slug}`);
}

export async function createDirectVariableAction(
  moduleId: string,
  input: { label: string; questionId: string }
): Promise<{ error?: string }> {
  const label = input.label.trim();
  if (!label) return { error: "El nombre de la variable es obligatorio." };
  if (!input.questionId) return { error: "Elige la pregunta de origen." };

  const question = await prisma.question.findUniqueOrThrow({ where: { id: input.questionId } });
  const existingKeys = (await prisma.variable.findMany({ where: { moduleId }, select: { key: true } })).map(
    (v) => v.key
  );
  const key = uniqueSlug(label, existingKeys);
  const valueType = question.type === "NUMBER" ? "NUMBER" : "TEXT";
  const source: VariableSource = { type: "QUESTION", questionKey: question.key };

  const maxOrder = await prisma.variable.aggregate({ where: { moduleId }, _max: { order: true } });

  await prisma.variable.create({
    data: {
      moduleId,
      key,
      label,
      valueType,
      source,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await revalidateModulePaths(moduleId);
  return {};
}

export async function deleteVariableAction(variableId: string): Promise<{ error?: string }> {
  const variable = await prisma.variable.delete({ where: { id: variableId } });
  await revalidateModulePaths(variable.moduleId);
  return {};
}

export type LookupColumnInput = {
  id?: string;
  label: string;
  valueType: "NUMBER" | "TEXT";
  cells: Record<string, string>;
};

export async function saveLookupTableAction(
  moduleId: string,
  questionId: string,
  columns: LookupColumnInput[]
): Promise<{ error?: string }> {
  if (columns.some((c) => !c.label.trim())) {
    return { error: "Cada columna de la tabla necesita un nombre." };
  }

  const question = await prisma.question.findUniqueOrThrow({
    where: { id: questionId },
    include: { options: { orderBy: { order: "asc" } } },
  });

  const allVariables = await prisma.variable.findMany({ where: { moduleId } });
  const existingForQuestion = allVariables.filter((v) => {
    const source = v.source as unknown as VariableSource;
    return source.type === "LOOKUP" && source.questionKey === question.key;
  });

  const keptIds = new Set(columns.filter((c) => c.id).map((c) => c.id));
  const toDelete = existingForQuestion.filter((v) => !keptIds.has(v.id));
  const existingKeys = allVariables.map((v) => v.key);
  const maxOrder = Math.max(-1, ...allVariables.map((v) => v.order));

  await prisma.$transaction([
    ...toDelete.map((v) => prisma.variable.delete({ where: { id: v.id } })),
    ...columns.map((col, i) => {
      const table: Record<string, DslValue> = {};
      for (const option of question.options) {
        const raw = col.cells[option.key] ?? "";
        table[option.key] = col.valueType === "NUMBER" ? Number(raw) || 0 : raw;
      }
      const source: VariableSource = { type: "LOOKUP", questionKey: question.key, table };

      if (col.id) {
        return prisma.variable.update({
          where: { id: col.id },
          data: { label: col.label.trim(), valueType: col.valueType, source },
        });
      }

      const key = uniqueSlug(col.label.trim(), existingKeys);
      existingKeys.push(key);
      return prisma.variable.create({
        data: {
          moduleId,
          key,
          label: col.label.trim(),
          valueType: col.valueType,
          source,
          order: maxOrder + 1 + i,
        },
      });
    }),
  ]);

  await revalidateModulePaths(moduleId);
  return {};
}
