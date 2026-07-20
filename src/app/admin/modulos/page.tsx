import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteModuleAction } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const dynamic = "force-dynamic";

export default async function AdminModulesPage() {
  const modules = await prisma.module.findMany({
    orderBy: { updatedAt: "desc" },
    include: { category: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Módulos</h1>
        <Link
          href="/admin/modulos/nuevo"
          className="rounded-full px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 bg-ink"
        >
          <Plus className="w-4 h-4" />
          Nuevo módulo
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-muted font-mono uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Última edición</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {modules.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  Todavía no hay módulos. Crea el primero.
                </td>
              </tr>
            )}
            {modules.map((mod) => (
              <tr key={mod.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/modulos/${mod.id}`} className="hover:underline">
                    {mod.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-muted">{mod.category.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full font-mono ${
                      mod.published ? "bg-[#E6F4EA] text-[#1E7A34]" : "bg-[#F1EFE9] text-ink-muted"
                    }`}
                  >
                    {mod.published ? "Publicado" : "Borrador"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                  {dateFormatter.format(mod.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/modulos/${mod.id}`}
                      className="text-xs font-medium text-navy hover:underline"
                    >
                      Editar
                    </Link>
                    <DeleteButton
                      confirmMessage={`¿Eliminar el módulo "${mod.name}"? Se eliminará también todo su contenido (preguntas, variables, fórmulas). Esta acción no se puede deshacer.`}
                      onDelete={deleteModuleAction.bind(null, mod.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
