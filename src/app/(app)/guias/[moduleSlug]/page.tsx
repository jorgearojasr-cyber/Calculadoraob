import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { GuideSection, type ModuleGuideData } from "@/components/module/guide-section";

export default async function GuiaDetailPage({ params }: { params: { moduleSlug: string } }) {
  const mod = await prisma.module.findUnique({
    where: { slug: params.moduleSlug },
    include: { guide: true, category: true },
  });

  if (!mod || !mod.guide) notFound();

  const guide: ModuleGuideData = {
    summary: mod.guide.summary,
    tools: mod.guide.tools,
    estimatedTime: mod.guide.estimatedTime,
    difficulty: mod.guide.difficulty,
    recommendedPeople: mod.guide.recommendedPeople,
    tipsBeforeStart: mod.guide.tipsBeforeStart,
    commonMistakes: mod.guide.commonMistakes,
    safetyRecommendations: mod.guide.safetyRecommendations,
    bestPractice: mod.guide.bestPractice,
    masterTip: mod.guide.masterTip,
    faqs: mod.guide.faqs as ModuleGuideData["faqs"],
    stepByStepSummary: mod.guide.stepByStepSummary,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pt-8 pb-16">
      <Link href="/guias" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6">
        <ArrowLeft className="w-4 h-4" />
        Guías y consejos
      </Link>

      <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">{mod.category.name}</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-6">{mod.name}</h1>

      <GuideSection guide={guide} />

      <Link
        href={`/categorias/${mod.category.slug}/${mod.slug}`}
        className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white bg-safety"
      >
        Ir a la calculadora
      </Link>
    </div>
  );
}
