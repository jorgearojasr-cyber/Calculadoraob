import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PlanForm } from "@/components/admin/plan-form";
import { PhasesManager } from "@/components/admin/phases-manager";
import { updateProjectPlanAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditPlanPage({ params }: { params: { id: string } }) {
  const [plan, modules] = await Promise.all([
    prisma.projectPlan.findUnique({
      where: { id: params.id },
      include: {
        phases: {
          orderBy: { order: "asc" },
          include: { moduleLinks: { orderBy: { order: "asc" }, include: { module: true } } },
        },
      },
    }),
    prisma.module.findMany({ orderBy: { name: "asc" }, include: { category: true } }),
  ]);

  if (!plan) notFound();

  return (
    <div>
      <Link
        href="/admin/planes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Planes de fases
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-6">Editar plan: {plan.title}</h1>

      <PlanForm
        action={updateProjectPlanAction.bind(null, plan.id)}
        initial={{ title: plan.title, slug: plan.slug, description: plan.description }}
        submitLabel="Guardar cambios"
      />

      <div className="mt-10 border-t border-border pt-8">
        <PhasesManager
          planId={plan.id}
          phases={plan.phases}
          modules={modules.map((m) => ({ id: m.id, name: `${m.category.name} · ${m.name}` }))}
        />
      </div>
    </div>
  );
}
