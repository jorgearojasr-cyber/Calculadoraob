import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NormsDisclaimer } from "@/components/module/norms-disclaimer";
import { PricedResults } from "@/components/module/priced-results";
import { RenameProject } from "@/components/proyectos/rename-project";
import { PhotoUpload } from "@/components/proyectos/photo-upload";
import { ProgressEditor } from "@/components/proyectos/progress-editor";
import { PlanProgressBar } from "@/components/plan/plan-progress-bar";
import type { CalculateModuleResult } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";
import type { AnswerSummaryItem } from "../actions";

// Ver nota en proyectos/page.tsx — mismo criterio, un SavedProject
// individual es aún más específico del usuario.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SavedProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const project = await prisma.savedProject.findUnique({
    where: { id: params.id },
    include: {
      module: { include: { category: true } },
      photos: { select: { id: true, status: true }, orderBy: { createdAt: "asc" } },
      plan: { select: { slug: true, title: true, phases: { select: { id: true } } } },
    },
  });

  if (!project || project.userId !== session.user.id) notFound();

  const answers = project.answers as unknown as AnswerSummaryItem[];
  const result = project.result as unknown as CalculateModuleResult;

  // Sección 11 (Parte 6): SavedProject.planId/phaseId solo existen cuando el
  // cálculo se guardó desde una fase de /plan/[slug] (ver
  // ResultScreen.handleSaveProject) — relación REAL, no inferida. Cuando
  // existe, se resuelve el progreso REAL de ESE plan (mismo mecanismo que
  // /plan/[slug]: ProjectPlanPhaseCompletion), nunca el progressPercent de
  // este SavedProject (son conceptos distintos, ver PlanProgressBar vs.
  // ProgressEditor más abajo).
  let planProgress: { completed: number; total: number } | null = null;
  if (project.plan) {
    const completions = await prisma.projectPlanPhaseCompletion.count({
      where: {
        userId: session.user.id,
        completed: true,
        phase: { planId: project.planId! },
      },
    });
    planProgress = { completed: completions, total: project.plan.phases.length };
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 pt-8 pb-16">
      <Link href="/proyectos" className="inline-flex items-center gap-1.5 font-body text-sm text-ds-text-secondary hover:text-ds-navy-900">
        <ArrowLeft className="w-4 h-4" />
        Mis proyectos
      </Link>

      <p className="font-body text-xs font-semibold uppercase tracking-wider mt-6 mb-2 text-ds-orange-600">
        {project.module.category.name} · {project.module.name}
      </p>

      <RenameProject id={project.id} initialName={project.name} />

      {project.plan && (
        <Link
          href={`/plan/${project.plan.slug}`}
          className="mt-4 flex items-center gap-2 font-body text-sm font-semibold text-ds-navy-900 hover:text-ds-orange-600 transition-colors"
        >
          Parte del plan: {project.plan.title}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}

      <div className="mt-6 rounded-ds-card p-5 bg-white border border-ds-border">
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-ds-text-tertiary mb-3">Tu avance</p>
        <ProgressEditor id={project.id} initialValue={project.progressPercent} />
      </div>

      {planProgress && planProgress.total > 0 && (
        <div className="mt-3 rounded-ds-card p-5 bg-white border border-ds-border">
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-ds-text-tertiary mb-3">
            Progreso del plan
          </p>
          <PlanProgressBar completed={planProgress.completed} total={planProgress.total} />
        </div>
      )}

      {result.infoResults.length > 0 && (
        <div className="grid gap-3 mt-8 mb-3">
          {result.infoResults.map((info) => (
            <div key={info.key} className="rounded-ds-card p-5 bg-white border border-ds-border">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-body font-semibold text-[15px] text-ds-navy-900">{info.label}</span>
                <span className="font-display text-lg font-bold text-ds-navy-900 whitespace-nowrap">
                  {String(info.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <PricedResults results={result.results} />
      </div>

      <NormsDisclaimer norms={result.norms} />

      <PhotoUpload savedProjectId={project.id} initialPhotos={project.photos} />

      <div className="mt-8 rounded-ds-card p-5 bg-white border border-ds-border">
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-ds-text-tertiary mb-3">
          Con estos datos respondiste
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-body text-sm">
          {answers.map((item) => (
            <div key={item.label} className="contents">
              <dt className="text-ds-text-secondary">{item.label}</dt>
              <dd className="font-semibold text-ds-navy-900 text-right">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-6 font-body text-xs text-ds-text-tertiary">
        Guardado el{" "}
        {project.createdAt.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}.
        Este resultado es un snapshot: no se recalcula aunque el módulo cambie después.
      </p>
    </div>
  );
}
