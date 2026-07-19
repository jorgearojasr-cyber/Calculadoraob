"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export type FormState = { error?: string };

function readModuleForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();

  if (!name || !description || !categoryId) {
    throw new Error("Nombre, descripción y categoría son obligatorios.");
  }

  return {
    name,
    slug: slugInput ? slugify(slugInput) : slugify(name),
    description,
    categoryId,
  };
}

export async function createModuleAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  let data;
  try {
    data = readModuleForm(formData);
  } catch (error) {
    return { error: (error as Error).message };
  }

  let category;
  let created;
  try {
    category = await prisma.category.findUniqueOrThrow({ where: { id: data.categoryId } });
    created = await prisma.module.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        published: false, // los módulos nuevos siempre nacen en borrador
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `Ya existe un módulo con el slug "${data.slug}".` };
    }
    throw error;
  }

  revalidatePath("/admin/modulos");
  revalidatePath(`/categorias/${category.slug}`);
  redirect(`/admin/modulos/${created.id}/preguntas`);
}

export async function updateModuleAction(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  let data;
  try {
    data = readModuleForm(formData);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const existing = await prisma.module.findUniqueOrThrow({
    where: { id },
    include: { category: true },
  });

  let newCategory;
  try {
    newCategory = await prisma.category.findUniqueOrThrow({ where: { id: data.categoryId } });
    await prisma.module.update({ where: { id }, data });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `Ya existe un módulo con el slug "${data.slug}".` };
    }
    throw error;
  }

  revalidatePath("/admin/modulos");
  revalidatePath(`/admin/modulos/${id}`);
  revalidatePath(`/categorias/${existing.category.slug}`);
  if (existing.category.slug !== newCategory.slug) revalidatePath(`/categorias/${newCategory.slug}`);
  revalidatePath(`/categorias/${newCategory.slug}/${data.slug}`);
  redirect(`/admin/modulos/${id}`);
}

export async function publishModuleAction(id: string): Promise<{ error?: string }> {
  const { validateModuleForPublish } = await import("@/lib/module-validation");
  const issues = await validateModuleForPublish(id);
  if (issues.length > 0) {
    return { error: `No se puede publicar: ${issues.join(" ")}` };
  }

  const mod = await prisma.module.update({
    where: { id },
    data: { published: true },
    include: { category: true },
  });

  revalidatePath("/admin/modulos");
  revalidatePath(`/admin/modulos/${id}`);
  revalidatePath(`/categorias/${mod.category.slug}`);
  revalidatePath(`/categorias/${mod.category.slug}/${mod.slug}`);
  return {};
}

export async function unpublishModuleAction(id: string): Promise<{ error?: string }> {
  const mod = await prisma.module.update({
    where: { id },
    data: { published: false },
    include: { category: true },
  });

  revalidatePath("/admin/modulos");
  revalidatePath(`/admin/modulos/${id}`);
  revalidatePath(`/categorias/${mod.category.slug}`);
  revalidatePath(`/categorias/${mod.category.slug}/${mod.slug}`);
  return {};
}

export async function deleteModuleAction(id: string): Promise<{ error?: string }> {
  const mod = await prisma.module.findUniqueOrThrow({ where: { id }, include: { category: true } });
  await prisma.module.delete({ where: { id } });

  revalidatePath("/admin/modulos");
  revalidatePath(`/categorias/${mod.category.slug}`);
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
