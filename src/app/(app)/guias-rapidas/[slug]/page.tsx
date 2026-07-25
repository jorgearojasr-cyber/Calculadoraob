import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { QuickGuideSection, type QuickGuideData } from "@/components/quick-guide/quick-guide-section";

export default async function QuickGuidePage({ params }: { params: { slug: string } }) {
  const guide = await prisma.quickGuide.findUnique({ where: { slug: params.slug } });

  if (!guide) notFound();

  const data: QuickGuideData = {
    shortDescription: guide.shortDescription,
    tools: guide.tools,
    estimatedTime: guide.estimatedTime,
    difficulty: guide.difficulty,
    peopleNeeded: guide.peopleNeeded,
    steps: guide.steps,
    tips: guide.tips,
    commonMistakes: guide.commonMistakes,
    masterTip: guide.masterTip,
    faqs: guide.faqs as QuickGuideData["faqs"],
    reinforcedWarning: guide.reinforcedWarning,
    reinforcedWarningText: guide.reinforcedWarningText,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pt-8 pb-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6">
        <ArrowLeft className="w-4 h-4" />
        Inicio
      </Link>

      <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">Guía rápida</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-6">{guide.title}</h1>

      <QuickGuideSection guide={data} />
    </div>
  );
}
