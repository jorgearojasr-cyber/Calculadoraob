import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuleForm } from "@/components/admin/module-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { updateModuleAction, deleteModuleAction } from "../actions";

export default async function ModuleGeneralPage({ params }: { params: { id: string } }) {
  const [mod, categories] = await Promise.all([
    prisma.module.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { questions: true, variables: true, formulas: true, lossFactors: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!mod) notFound();

  return (
    <div>
      <div className="rounded-xl p-5 bg-white border border-border mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-ink-muted text-xs mb-1">Versión</p>
          <p className="font-mono">{mod.version}</p>
        </div>
        <div>
          <p className="text-ink-muted text-xs mb-1">Preguntas</p>
          <p className="font-mono">{mod._count.questions}</p>
        </div>
        <div>
          <p className="text-ink-muted text-xs mb-1">Variables</p>
          <p className="font-mono">{mod._count.variables}</p>
        </div>
        <div>
          <p className="text-ink-muted text-xs mb-1">Fórmulas</p>
          <p className="font-mono">{mod._count.formulas}</p>
        </div>
      </div>

      <ModuleForm
        action={updateModuleAction.bind(null, mod.id)}
        categories={categories}
        initial={{
          name: mod.name,
          slug: mod.slug,
          description: mod.description,
          categoryId: mod.categoryId,
          searchKeywords: mod.searchKeywords,
        }}
        submitLabel="Guardar cambios"
      />

      <div className="mt-10 pt-6 border-t border-border">
        <p className="text-sm font-medium mb-2">Zona de peligro</p>
        <DeleteButton
          confirmMessage={`¿Eliminar el módulo "${mod.name}"? Se eliminará también todo su contenido (preguntas, variables, fórmulas). Esta acción no se puede deshacer.`}
          onDelete={deleteModuleAction.bind(null, mod.id)}
        />
      </div>
    </div>
  );
}
