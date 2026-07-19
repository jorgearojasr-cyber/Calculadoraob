import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CategoryForm } from "@/components/admin/category-form";
import { createCategoryAction } from "../actions";

export default function NewCategoryPage() {
  return (
    <div>
      <Link
        href="/admin/categorias"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Categorías
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-6">Nueva categoría</h1>
      <CategoryForm action={createCategoryAction} submitLabel="Crear categoría" />
    </div>
  );
}
