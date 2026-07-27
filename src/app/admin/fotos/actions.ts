"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function revalidatePhotoPaths(photo: { savedProjectId: string | null; moduleId: string }) {
  revalidatePath("/admin/fotos");
  if (photo.savedProjectId) revalidatePath(`/proyectos/${photo.savedProjectId}`);
  const mod = await prisma.module.findUnique({ where: { id: photo.moduleId }, include: { category: true } });
  if (mod) revalidatePath(`/categorias/${mod.category.slug}/${mod.slug}`);
}

export async function approvePhotoAction(id: string): Promise<{ error?: string }> {
  const photo = await prisma.projectPhoto.update({ where: { id }, data: { status: "APPROVED" } });
  await revalidatePhotoPaths(photo);
  return {};
}

export async function rejectPhotoAction(id: string): Promise<{ error?: string }> {
  const photo = await prisma.projectPhoto.update({ where: { id }, data: { status: "REJECTED" } });
  await revalidatePhotoPaths(photo);
  return {};
}
