import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PreviewPanel } from "@/components/admin/preview-panel";
import { validateModuleForPublish } from "@/lib/module-validation";
import type { WizardQuestion } from "@/components/module/types";

export const dynamic = "force-dynamic";

export default async function ModulePreviewPage({ params }: { params: { id: string } }) {
  const mod = await prisma.module.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!mod) notFound();

  const issues = await validateModuleForPublish(mod.id);

  const questions = mod.questions.map((question) => ({
    id: question.id,
    key: question.key,
    label: question.label,
    type: question.type,
    unit: question.unit,
    helpText: question.helpText,
    options: question.options.map((option) => ({ key: option.key, label: option.label })),
    stepGroup: question.stepGroup,
    visibleIfQuestionKey: question.visibleIfQuestionKey,
    visibleIfValues: question.visibleIfValues,
    defaultSource: question.defaultSource as WizardQuestion["defaultSource"],
  }));

  return (
    <PreviewPanel
      moduleId={mod.id}
      moduleName={mod.name}
      categorySlug={mod.category.slug}
      categoryName={mod.category.name}
      questions={questions}
      published={mod.published}
      issues={issues}
    />
  );
}
