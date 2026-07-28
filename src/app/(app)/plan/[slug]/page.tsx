import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanView, type PlanPhaseData } from "@/components/plan/plan-view";

export default async function ProjectPlanPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { justCompleted?: string };
}) {
  const plan = await prisma.projectPlan.findUnique({
    where: { slug: params.slug },
    include: {
      phases: {
        orderBy: { order: "asc" },
        include: {
          moduleLinks: {
            orderBy: { order: "asc" },
            include: { module: { include: { category: true } } },
          },
        },
      },
    },
  });

  if (!plan) notFound();

  const session = await getServerSession(authOptions);
  let completedPhaseIds = new Set<string>();
  if (session?.user?.id) {
    const completions = await prisma.projectPlanPhaseCompletion.findMany({
      where: {
        userId: session.user.id,
        phaseId: { in: plan.phases.map((p) => p.id) },
        completed: true,
      },
      select: { phaseId: true },
    });
    completedPhaseIds = new Set(completions.map((c) => c.phaseId));
  }

  const phases: PlanPhaseData[] = plan.phases.map((phase) => ({
    id: phase.id,
    name: phase.name,
    completed: completedPhaseIds.has(phase.id),
    links: phase.moduleLinks.map((link) => {
      // plan/phase van como query params propios (no se mezclan con
      // presetQuery, que es contenido de la fase) — así el wizard sabe
      // desde qué plan se abrió y, al guardar, puede redirigir de vuelta acá
      // en vez de dejar al usuario en /proyectos/[id] sin salida.
      const query = new URLSearchParams(link.presetQuery ?? "");
      query.set("plan", plan.slug);
      query.set("phase", phase.id);
      return {
        label: link.label,
        moduleName: link.module.name,
        href: `/categorias/${link.module.category.slug}/${link.module.slug}?${query.toString()}`,
      };
    }),
  }));

  return (
    <div className="max-w-3xl mx-auto px-6 pt-8 pb-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      <p className="font-mono text-xs uppercase tracking-wider mt-6 mb-2 text-safety">Plan de fases</p>
      <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-2">{plan.title}</h1>
      <p className="text-sm text-ink-muted mb-8">{plan.description}</p>

      <PlanView planSlug={plan.slug} phases={phases} justCompletedPhaseId={searchParams.justCompleted} />
    </div>
  );
}
