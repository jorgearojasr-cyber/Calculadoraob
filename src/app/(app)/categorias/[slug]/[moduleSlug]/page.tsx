import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuleWizard } from "@/components/module/module-wizard";
import type { WizardQuestion } from "@/components/module/types";
import type { ModuleGuideData } from "@/components/module/guide-section";

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: { slug: string; moduleSlug: string };
  searchParams: { tipo?: string; plan?: string; phase?: string; [key: string]: string | string[] | undefined };
}) {
  const mod = await prisma.module.findFirst({
    where: { slug: params.moduleSlug, published: true, category: { slug: params.slug } },
    include: {
      category: true,
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
      guide: true,
    },
  });

  if (!mod) notFound();

  // Cálculos especiales (grupo herramientas-avanzadas) — el mismo criterio de
  // membresía que ya usa /grupos/herramientas-avanzadas para decidir el
  // disclaimer reforzado ahí. Antes ese aviso solo vivía en la página del
  // grupo: un usuario que llegaba directo al módulo (búsqueda, link
  // directo, /empezar con un solo link) nunca lo veía. Un módulo puede
  // aparecer en 2+ tareas de grupos distintos en teoría, así que basta con
  // que UNA lo vincule a herramientas-avanzadas para mostrar el aviso.
  const advancedLink = await prisma.projectTaskModule.findFirst({
    where: { moduleId: mod.id, task: { group: { slug: "herramientas-avanzadas" } } },
    select: { id: true },
  });
  const isAdvancedMode = advancedLink !== null;

  const approvedPhotos = await prisma.projectPhoto.findMany({
    where: { moduleId: mod.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true },
  });

  // Preselección opcional (?tipo=<option-key>) de la primera pregunta si es
  // de selección — usada por links "Calcular cantidad de X" desde otros
  // módulos que ya conocen la respuesta recomendada, sin saltarse el paso.
  const firstQuestion = mod.questions[0];
  const initialAnswers: Record<string, string | number> = {};
  if (
    firstQuestion?.type === "SELECT" &&
    searchParams.tipo &&
    firstQuestion.options.some((o) => o.key === searchParams.tipo)
  ) {
    initialAnswers[firstQuestion.key] = searchParams.tipo;
  }

  // Prellenado adicional por key exacto de pregunta (ej. el perímetro de la
  // piscina calculado en /plan/[slug]/page.tsx para la fase de Sendero) —
  // el usuario puede editarlo o ignorarlo; si no viene, el módulo funciona
  // exactamente igual que hoy (uso suelto, sin plan).
  for (const question of mod.questions) {
    if (initialAnswers[question.key] !== undefined) continue;
    const raw = searchParams[question.key];
    if (typeof raw !== "string") continue;
    if (question.type === "NUMBER") {
      const num = Number(raw);
      if (!Number.isNaN(num)) initialAnswers[question.key] = num;
    } else if (question.type === "SELECT" && question.options.some((o) => o.key === raw)) {
      initialAnswers[question.key] = raw;
    }
  }

  const questions = mod.questions.map((question) => ({
    id: question.id,
    key: question.key,
    label: question.label,
    type: question.type,
    unit: question.unit,
    helpText: question.helpText,
    options: question.options.map((option) => ({
      key: option.key,
      label: option.label,
      description: option.description,
      imageUrl: option.imageUrl,
    })),
    stepGroup: question.stepGroup,
    visibleIfQuestionKey: question.visibleIfQuestionKey,
    visibleIfValues: question.visibleIfValues,
    hiddenDefaultValue: question.hiddenDefaultValue,
    defaultSource: question.defaultSource as WizardQuestion["defaultSource"],
  }));

  const guide: ModuleGuideData | null = mod.guide
    ? {
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
      }
    : null;

  // Presente solo cuando se llega desde /plan/[slug] (ver plan-view.tsx) —
  // permite que ResultScreen redirija de vuelta al plan al guardar, en vez
  // de dejar al usuario en /proyectos/[id] sin salida hacia la fase siguiente.
  const planContext =
    searchParams.plan && searchParams.phase
      ? { slug: searchParams.plan, phaseId: searchParams.phase }
      : undefined;

  return (
    <ModuleWizard
      moduleId={mod.id}
      moduleSlug={mod.slug}
      moduleName={mod.name}
      categoryName={mod.category.name}
      questions={questions}
      initialAnswers={initialAnswers}
      guide={guide}
      approvedPhotos={approvedPhotos}
      planContext={planContext}
      isAdvancedMode={isAdvancedMode}
    />
  );
}
