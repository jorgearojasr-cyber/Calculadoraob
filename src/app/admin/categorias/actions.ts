"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export type FormState = { error?: string };

function readCategoryForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const tag = String(formData.get("tag") ?? "").trim();
  const order = Number(formData.get("order") ?? 0);

  if (!name || !description || !icon) {
    throw new Error("Nombre, descripción e ícono son obligatorios.");
  }

  return {
    name,
    slug: slugInput ? slugify(slugInput) : slugify(name),
    description,
    icon,
    tag: tag || null,
    order: Number.isFinite(order) ? order : 0,
  };
}

export async function createCategoryAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  let data;
  try {
    data = readCategoryForm(formData);
  } catch (error) {
    return { error: (error as Error).message };
  }

  try {
    await prisma.category.create({ data });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `Ya existe una categoría con el slug "${data.slug}".` };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/admin/categorias");
  redirect("/admin/categorias");
}

export async function updateCategoryAction(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  let data;
  try {
    data = readCategoryForm(formData);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const existing = await prisma.category.findUniqueOrThrow({ where: { id } });

  try {
    await prisma.category.update({ where: { id }, data });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `Ya existe una categoría con el slug "${data.slug}".` };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/admin/categorias");
  revalidatePath(`/categorias/${existing.slug}`);
  if (existing.slug !== data.slug) revalidatePath(`/categorias/${data.slug}`);
  redirect("/admin/categorias");
}

export async function deleteCategoryAction(id: string): Promise<{ error?: string }> {
  const category = await prisma.category.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { modules: true } } },
  });

  if (category._count.modules > 0) {
    return {
      error: `No se puede eliminar: tiene ${category._count.modules} módulo(s) asociado(s). Reasígnalos o elimínalos primero.`,
    };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/admin/categorias");
  revalidatePath(`/categorias/${category.slug}`);
  return {};
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
