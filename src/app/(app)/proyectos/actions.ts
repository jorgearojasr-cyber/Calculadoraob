"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CalculateModuleResult } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";

export type AnswerSummaryItem = { label: string; value: string };

export async function createSavedProjectAction(input: {
  moduleId: string;
  moduleName: string;
  answersSummary: AnswerSummaryItem[];
  result: CalculateModuleResult;
  name?: string;
}): Promise<{ id: string; error?: undefined } | { error: string; id?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const defaultName = `${input.moduleName} - ${new Date().toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
  })}`;

  const project = await prisma.savedProject.create({
    data: {
      userId: session.user.id,
      moduleId: input.moduleId,
      name: input.name?.trim() || defaultName,
      answers: input.answersSummary,
      result: input.result,
      progressPercent: 0,
    },
  });

  revalidatePath("/proyectos");
  return { id: project.id };
}

export async function updateProgressAction(
  id: string,
  progressPercent: number
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const project = await prisma.savedProject.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) return { error: "Proyecto no encontrado." };

  const clamped = Math.max(0, Math.min(100, Math.round(progressPercent)));
  await prisma.savedProject.update({ where: { id }, data: { progressPercent: clamped } });

  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${id}`);
  return {};
}

export async function renameProjectAction(id: string, name: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const trimmed = name.trim();
  if (!trimmed) return { error: "El nombre no puede estar vacío." };

  const project = await prisma.savedProject.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) return { error: "Proyecto no encontrado." };

  await prisma.savedProject.update({ where: { id }, data: { name: trimmed } });

  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${id}`);
  return {};
}
