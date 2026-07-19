"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/unique-slug";

async function revalidateModulePaths(moduleId: string) {
  const mod = await prisma.module.findUnique({ where: { id: moduleId }, include: { category: true } });
  revalidatePath(`/admin/modulos/${moduleId}/materiales`);
  revalidatePath(`/admin/modulos/${moduleId}/preview`);
  if (mod) revalidatePath(`/categorias/${mod.category.slug}/${mod.slug}`);
}

export async function linkMaterialAction(
  moduleId: string,
  input: { formulaId: string; materialId?: string; newMaterial?: { name: string; unit: string } }
): Promise<{ error?: string }> {
  if (!input.formulaId) return { error: "Elige la fórmula que calcula la cantidad." };

  let materialId = input.materialId;

  if (!materialId) {
    const name = input.newMaterial?.name.trim();
    const unit = input.newMaterial?.unit.trim();
    if (!name || !unit) return { error: "Escribe el nombre y la unidad del material nuevo." };

    const existingKeys = (await prisma.material.findMany({ select: { key: true } })).map((m) => m.key);
    const key = uniqueSlug(name, existingKeys);
    const material = await prisma.material.create({ data: { key, name, unit } });
    materialId = material.id;
  }

  await prisma.formula.update({ where: { id: input.formulaId }, data: { materialId } });

  await revalidateModulePaths(moduleId);
  return {};
}

export async function unlinkMaterialAction(
  moduleId: string,
  formulaId: string
): Promise<{ error?: string }> {
  await prisma.formula.update({ where: { id: formulaId }, data: { materialId: null } });
  await revalidateModulePaths(moduleId);
  return {};
}

export async function updateMaterialAction(
  moduleId: string,
  materialId: string,
  input: { name: string; unit: string }
): Promise<{ error?: string }> {
  const name = input.name.trim();
  const unit = input.unit.trim();
  if (!name || !unit) return { error: "El nombre y la unidad son obligatorios." };

  await prisma.material.update({ where: { id: materialId }, data: { name, unit } });
  await revalidateModulePaths(moduleId);
  return {};
}
