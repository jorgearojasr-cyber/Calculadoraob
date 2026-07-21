import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuleWizard } from "@/components/module/module-wizard";

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: { slug: string; moduleSlug: string };
  searchParams: { tipo?: string };
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

  // Preselección opcional (?tipo=<option-key>) de la primera pregunta si es
  // de selección — usada por links "Calcular cantidad de X" desde otros
  // módulos que ya conocen la respuesta recomendada, sin saltarse el paso.
  const firstQuestion = mod.questions[0];
  const initialAnswers =
    firstQuestion?.type === "SELECT" &&
    searchParams.tipo &&
    firstQuestion.options.some((o) => o.key === searchParams.tipo)
      ? { [firstQuestion.key]: searchParams.tipo }
      : undefined;

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
  }));

  return (
    <ModuleWizard
      moduleId={mod.id}
      moduleName={mod.name}
      categorySlug={mod.category.slug}
      categoryName={mod.category.name}
      questions={questions}
      initialAnswers={initialAnswers}
    />
  );
}
