import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuleWizard } from "@/components/module/module-wizard";

export default async function ModulePage({
  params,
}: {
  params: { slug: string; moduleSlug: string };
}) {
  const mod = await prisma.module.findFirst({
    where: { slug: params.moduleSlug, published: true, category: { slug: params.slug } },
    include: {
      category: true,
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!mod) notFound();

  const questions = mod.questions.map((question) => ({
    id: question.id,
    key: question.key,
    label: question.label,
    type: question.type,
    unit: question.unit,
    helpText: question.helpText,
    options: question.options.map((option) => ({ key: option.key, label: option.label })),
  }));

  return (
    <div className="min-h-screen w-full bg-concrete text-ink font-body">
      <ModuleWizard
        moduleId={mod.id}
        moduleName={mod.name}
        categorySlug={mod.category.slug}
        categoryName={mod.category.name}
        questions={questions}
      />
    </div>
  );
}
