"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/unique-slug";

export type QuestionOptionInput = { id?: string; label: string };

export type QuestionInput = {
  label: string;
  helpText: string;
  type: "NUMBER" | "SELECT" | "TEXT";
  unit: string;
  options: QuestionOptionInput[];
  // Id de otra pregunta del mismo módulo con la que esta debe mostrarse en
  // el mismo paso del wizard. null/undefined = sin agrupar.
  groupWithQuestionId?: string | null;
};

// Resuelve groupWithQuestionId a un valor de stepGroup compartido. Si la
// pregunta objetivo todavía no tiene grupo, le asigna uno nuevo (su propio
// id) para que ambas preguntas queden agrupadas.
async function resolveStepGroup(
  moduleId: string,
  groupWithQuestionId: string | null | undefined
): Promise<string | null> {
  if (!groupWithQuestionId) return null;

  const target = await prisma.question.findUnique({ where: { id: groupWithQuestionId } });
  if (!target || target.moduleId !== moduleId) return null;

  if (target.stepGroup) return target.stepGroup;

  await prisma.question.update({ where: { id: target.id }, data: { stepGroup: target.id } });
  return target.id;
}

async function revalidateModulePaths(moduleId: string) {
  const mod = await prisma.module.findUnique({ where: { id: moduleId }, include: { category: true } });
  revalidatePath(`/admin/modulos/${moduleId}/preguntas`);
  revalidatePath(`/admin/modulos/${moduleId}/variables`);
  revalidatePath(`/admin/modulos/${moduleId}/formulas`);
  revalidatePath(`/admin/modulos/${moduleId}/preview`);
  if (mod) revalidatePath(`/categorias/${mod.category.slug}/${mod.slug}`);
}

export async function createQuestionAction(
  moduleId: string,
  input: QuestionInput
): Promise<{ error?: string }> {
  const label = input.label.trim();
  if (!label) return { error: "El texto de la pregunta es obligatorio." };
  if (input.type === "SELECT" && input.options.filter((o) => o.label.trim()).length < 1) {
    return { error: "Una pregunta de selección necesita al menos 1 opción." };
  }

  const existingKeys = (await prisma.question.findMany({ where: { moduleId }, select: { key: true } })).map(
    (q) => q.key
  );
  const key = uniqueSlug(label, existingKeys);
  const maxOrder = await prisma.question.aggregate({ where: { moduleId }, _max: { order: true } });
  const order = (maxOrder._max.order ?? -1) + 1;

  const optionKeys: string[] = [];
  const optionsData =
    input.type === "SELECT"
      ? input.options
          .filter((o) => o.label.trim())
          .map((o, i) => {
            const optKey = uniqueSlug(o.label.trim(), optionKeys);
            optionKeys.push(optKey);
            return { key: optKey, label: o.label.trim(), order: i };
          })
      : [];

  const stepGroup =
    input.type === "NUMBER" ? await resolveStepGroup(moduleId, input.groupWithQuestionId) : null;

  await prisma.question.create({
    data: {
      moduleId,
      key,
      label,
      helpText: input.helpText.trim() || null,
      type: input.type,
      unit: input.type === "NUMBER" ? input.unit.trim() || null : null,
      order,
      stepGroup,
      options: { create: optionsData },
    },
  });

  await revalidateModulePaths(moduleId);
  return {};
}

export async function updateQuestionAction(
  questionId: string,
  input: QuestionInput
): Promise<{ error?: string }> {
  const label = input.label.trim();
  if (!label) return { error: "El texto de la pregunta es obligatorio." };
  if (input.type === "SELECT" && input.options.filter((o) => o.label.trim()).length < 1) {
    return { error: "Una pregunta de selección necesita al menos 1 opción." };
  }

  const question = await prisma.question.findUniqueOrThrow({
    where: { id: questionId },
    include: { options: true },
  });

  const keptIds = new Set(input.options.filter((o) => o.id).map((o) => o.id));
  const toDelete = question.options.filter((o) => !keptIds.has(o.id));
  const existingKeys = question.options.map((o) => o.key);

  const stepGroup =
    input.type === "NUMBER" ? await resolveStepGroup(question.moduleId, input.groupWithQuestionId) : null;

  await prisma.$transaction([
    prisma.question.update({
      where: { id: questionId },
      data: {
        label,
        helpText: input.helpText.trim() || null,
        type: input.type,
        unit: input.type === "NUMBER" ? input.unit.trim() || null : null,
        stepGroup,
      },
    }),
    ...toDelete.map((o) => prisma.questionOption.delete({ where: { id: o.id } })),
    ...input.options
      .filter((o) => o.label.trim())
      .map((o, i) => {
        if (o.id) {
          return prisma.questionOption.update({
            where: { id: o.id },
            data: { label: o.label.trim(), order: i },
          });
        }
        const optKey = uniqueSlug(o.label.trim(), existingKeys);
        existingKeys.push(optKey);
        return prisma.questionOption.create({
          data: { questionId, key: optKey, label: o.label.trim(), order: i },
        });
      }),
  ]);

  await revalidateModulePaths(question.moduleId);
  return {};
}

export async function deleteQuestionAction(questionId: string): Promise<{ error?: string }> {
  const question = await prisma.question.delete({ where: { id: questionId } });
  await revalidateModulePaths(question.moduleId);
  return {};
}

export async function moveQuestionAction(
  questionId: string,
  direction: "up" | "down"
): Promise<{ error?: string }> {
  const question = await prisma.question.findUniqueOrThrow({ where: { id: questionId } });
  const siblings = await prisma.question.findMany({
    where: { moduleId: question.moduleId },
    orderBy: { order: "asc" },
  });
  const index = siblings.findIndex((q) => q.id === questionId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return {};

  const other = siblings[swapIndex];
  await prisma.$transaction([
    prisma.question.update({ where: { id: question.id }, data: { order: other.order } }),
    prisma.question.update({ where: { id: other.id }, data: { order: question.order } }),
  ]);

  await revalidateModulePaths(question.moduleId);
  return {};
}
