"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function approveShowcaseAction(id: string): Promise<{ error?: string }> {
  const showcase = await prisma.projectShowcase.update({ where: { id }, data: { status: "APPROVED" } });
  revalidatePath("/admin/proyectos-galeria");
  revalidatePath("/galeria");
  revalidatePath(`/galeria/${showcase.id}`);
  return {};
}

export async function rejectShowcaseAction(id: string): Promise<{ error?: string }> {
  const showcase = await prisma.projectShowcase.update({ where: { id }, data: { status: "REJECTED" } });
  revalidatePath("/admin/proyectos-galeria");
  revalidatePath("/galeria");
  revalidatePath(`/galeria/${showcase.id}`);
  return {};
}
