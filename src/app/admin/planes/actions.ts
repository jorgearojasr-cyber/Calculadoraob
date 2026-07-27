"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export type FormState = { error?: string };

function readPlanForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !description) {
    throw new Error("Título y descripción son obligatorios.");
  }

  return { title, slug: slugInput ? slugify(slugInput) : slugify(title), description };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function createProjectPlanAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  let data;
  try {
    data = readPlanForm(formData);
  } catch (error) {
    return { error: (error as Error).message };
  }

  let plan;
  try {
    plan = await prisma.projectPlan.create({ data });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `Ya existe un plan con el slug "${data.slug}".` };
    }
    throw error;
  }

  revalidatePath("/admin/planes");
  redirect(`/admin/planes/${plan.id}`);
}

export async function updateProjectPlanAction(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  let data;
  try {
    data = readPlanForm(formData);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const existing = await prisma.projectPlan.findUniqueOrThrow({ where: { id } });

  try {
    await prisma.projectPlan.update({ where: { id }, data });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `Ya existe un plan con el slug "${data.slug}".` };
    }
    throw error;
  }

  revalidatePath("/admin/planes");
  revalidatePath(`/admin/planes/${id}`);
  revalidatePath(`/plan/${existing.slug}`);
  if (existing.slug !== data.slug) revalidatePath(`/plan/${data.slug}`);
  return {};
}

export async function deleteProjectPlanAction(id: string): Promise<{ error?: string }> {
  const plan = await prisma.projectPlan.delete({ where: { id } });
  revalidatePath("/admin/planes");
  revalidatePath(`/plan/${plan.slug}`);
  return {};
}

export type PhaseModuleLinkInput = {
  id?: string;
  moduleId: string;
  label: string;
  presetQuery: string;
};

export type PhaseInput = {
  name: string;
  moduleLinks: PhaseModuleLinkInput[];
};

async function revalidatePlanPaths(planId: string) {
  const plan = await prisma.projectPlan.findUnique({ where: { id: planId } });
  revalidatePath(`/admin/planes/${planId}`);
  if (plan) revalidatePath(`/plan/${plan.slug}`);
}

function validatePhaseInput(input: PhaseInput): string | null {
  if (!input.name.trim()) return "El nombre de la fase es obligatorio.";
  if (input.moduleLinks.length === 0) return "Agrega al menos un módulo a la fase.";
  if (input.moduleLinks.some((link) => !link.moduleId)) return "Elige un módulo para cada línea.";
  if (input.moduleLinks.length > 1 && input.moduleLinks.some((link) => !link.label.trim())) {
    return "Con 2+ módulos en la misma fase, cada uno necesita una etiqueta para distinguirlos.";
  }
  return null;
}

export async function createPhaseAction(planId: string, input: PhaseInput): Promise<{ error?: string }> {
  const validationError = validatePhaseInput(input);
  if (validationError) return { error: validationError };

  const maxOrder = await prisma.projectPlanPhase.aggregate({ where: { planId }, _max: { order: true } });

  await prisma.projectPlanPhase.create({
    data: {
      planId,
      name: input.name.trim(),
      order: (maxOrder._max.order ?? -1) + 1,
      moduleLinks: {
        create: input.moduleLinks.map((link, i) => ({
          moduleId: link.moduleId,
          label: link.label.trim() || null,
          presetQuery: link.presetQuery.trim() || null,
          order: i,
        })),
      },
    },
  });

  await revalidatePlanPaths(planId);
  return {};
}

export async function updatePhaseAction(phaseId: string, input: PhaseInput): Promise<{ error?: string }> {
  const validationError = validatePhaseInput(input);
  if (validationError) return { error: validationError };

  const phase = await prisma.projectPlanPhase.findUniqueOrThrow({
    where: { id: phaseId },
    include: { moduleLinks: true },
  });

  const keptIds = new Set(input.moduleLinks.filter((l) => l.id).map((l) => l.id));
  const toDelete = phase.moduleLinks.filter((l) => !keptIds.has(l.id));

  await prisma.$transaction([
    prisma.projectPlanPhase.update({ where: { id: phaseId }, data: { name: input.name.trim() } }),
    ...toDelete.map((l) => prisma.projectPlanPhaseModule.delete({ where: { id: l.id } })),
    ...input.moduleLinks.map((link, i) => {
      const data = {
        moduleId: link.moduleId,
        label: link.label.trim() || null,
        presetQuery: link.presetQuery.trim() || null,
        order: i,
      };
      if (link.id) {
        return prisma.projectPlanPhaseModule.update({ where: { id: link.id }, data });
      }
      return prisma.projectPlanPhaseModule.create({ data: { ...data, phaseId } });
    }),
  ]);

  await revalidatePlanPaths(phase.planId);
  return {};
}

export async function deletePhaseAction(phaseId: string): Promise<{ error?: string }> {
  const phase = await prisma.projectPlanPhase.delete({ where: { id: phaseId } });
  await revalidatePlanPaths(phase.planId);
  return {};
}

export async function movePhaseAction(
  phaseId: string,
  direction: "up" | "down"
): Promise<{ error?: string }> {
  const phase = await prisma.projectPlanPhase.findUniqueOrThrow({ where: { id: phaseId } });
  const siblings = await prisma.projectPlanPhase.findMany({
    where: { planId: phase.planId },
    orderBy: { order: "asc" },
  });
  const index = siblings.findIndex((p) => p.id === phaseId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return {};

  const other = siblings[swapIndex];
  await prisma.$transaction([
    prisma.projectPlanPhase.update({ where: { id: phase.id }, data: { order: other.order } }),
    prisma.projectPlanPhase.update({ where: { id: other.id }, data: { order: phase.order } }),
  ]);

  await revalidatePlanPaths(phase.planId);
  return {};
}
