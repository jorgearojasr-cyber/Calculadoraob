import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteProjectPlanAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const plans = await prisma.projectPlan.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { phases: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Planes de fases</h1>
        <Link
          href="/admin/planes/nuevo"
          className="rounded-full px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 bg-ink"
        >
          <Plus className="w-4 h-4" />
          Nuevo plan
        </Link>
      </div>

      <p className="text-xs text-ink-muted mb-4">
        Un plan agrupa una secuencia de fases (ej. Bodega: base → estructura → techo), cada una vinculada a
        uno o más módulos. Visible en /plan/&lt;slug&gt;.
      </p>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-muted font-mono uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Fases</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                  Todavía no hay planes. Crea el primero.
                </td>
              </tr>
            )}
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/planes/${plan.id}`} className="hover:underline">
                    {plan.title}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-ink-muted">{plan.slug}</td>
                <td className="px-4 py-3">{plan._count.phases}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/planes/${plan.id}`}
                      className="text-xs font-medium text-navy hover:underline"
                    >
                      Editar
                    </Link>
                    <DeleteButton
                      confirmMessage={`¿Eliminar el plan "${plan.title}"? Se eliminarán también sus fases. Esta acción no se puede deshacer.`}
                      onDelete={deleteProjectPlanAction.bind(null, plan.id)}
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
