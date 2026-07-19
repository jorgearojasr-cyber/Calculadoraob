import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";
import { updateCategoryAction } from "../actions";

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const category = await prisma.category.findUnique({ where: { id: params.id } });
  if (!category) notFound();

  return (
    <div>
      <Link
        href="/admin/categorias"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Categorías
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-6">
        Editar categoría: {category.name}
      </h1>
      <CategoryForm
        action={updateCategoryAction.bind(null, category.id)}
        initial={{
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          tag: category.tag ?? "",
          order: category.order,
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
