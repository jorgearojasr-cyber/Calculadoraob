import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCategoryIcon } from "@/lib/category-icons";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCategoryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { modules: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Categorías</h1>
        <Link
          href="/admin/categorias/nueva"
          className="rounded-full px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 bg-ink"
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-muted font-mono uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Orden</th>
              <th className="px-4 py-3 font-medium">Ícono</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Módulos</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.icon);
              return (
                <tr key={category.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-ink-muted">{category.order}</td>
                  <td className="px-4 py-3">
                    <Icon className="w-4 h-4 text-blueprint" />
                  </td>
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 font-mono text-ink-muted">{category.slug}</td>
                  <td className="px-4 py-3">{category._count.modules}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/categorias/${category.id}`}
                        className="text-xs font-medium text-blueprint hover:underline"
                      >
                        Editar
                      </Link>
                      <DeleteButton
                        confirmMessage={`¿Eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`}
                        onDelete={deleteCategoryAction.bind(null, category.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
