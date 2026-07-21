import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NormsDisclaimer } from "@/components/module/norms-disclaimer";
import { PricedResults } from "@/components/module/priced-results";
import { RenameProject } from "@/components/proyectos/rename-project";
import type { CalculateModuleResult } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";
import type { AnswerSummaryItem } from "../actions";

export default async function SavedProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const project = await prisma.savedProject.findUnique({
    where: { id: params.id },
    include: { module: { include: { category: true } } },
  });

  if (!project || project.userId !== session.user.id) notFound();

  const answers = project.answers as unknown as AnswerSummaryItem[];
  const result = project.result as unknown as CalculateModuleResult;

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <Link href="/proyectos" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="w-4 h-4" />
        Mis proyectos
      </Link>

      <p className="font-mono text-xs uppercase tracking-wider mt-6 mb-2 text-safety">
        {project.module.category.name} · {project.module.name}
      </p>

      <RenameProject id={project.id} initialName={project.name} />

      {result.infoResults.length > 0 && (
        <div className="grid gap-3 mt-8 mb-3">
          {result.infoResults.map((info) => (
            <div key={info.key} className="rounded-2xl p-5 bg-white border border-border">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium text-[15px]">{info.label}</span>
                <span className="font-display text-lg font-semibold whitespace-nowrap">
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

      <div className="mt-8 rounded-2xl p-5 bg-white border border-border">
        <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
          Con estos datos respondiste
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {answers.map((item) => (
            <div key={item.label} className="contents">
              <dt className="text-ink-muted">{item.label}</dt>
              <dd className="font-medium text-right">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-6 text-xs text-ink-faint">
        Guardado el{" "}
        {project.createdAt.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}.
        Este resultado es un snapshot: no se recalcula aunque el módulo cambie después.
      </p>
    </div>
  );
}
