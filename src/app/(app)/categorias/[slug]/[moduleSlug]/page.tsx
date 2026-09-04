import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuleWizard } from "@/components/module/module-wizard";
import type { WizardQuestion } from "@/components/module/types";
import type { ModuleGuideData } from "@/components/module/guide-section";
import { SHAPE_LABELS } from "@/lib/plan-shape";
import { getExtraVisibleSlugs } from "@/lib/module-visibility";

// Sprint UX "Construir una piscina" (03-ago-2026), ítem 4: resuelve — server
// side, antes de renderizar el wizard — a qué fase se debe continuar si el
// usuario guarda desde acá (ver planContext.nextPhase, consumido por
// ResultScreen para el botón principal "Continuar con: <fase>"). Mismo
// criterio de resolución de forma que ya usa plan/[slug]/page.tsx (?shape=
// o único link disponible); si la fase siguiente tiene 2+ links y ninguno
// calza con la forma ya elegida (ej. Fase 3 "Terminar el entorno", que no
// usa forma), se devuelve el nombre sin `href` — ResultScreen cae de vuelta
// a /plan/[slug] en ese caso, igual que el flujo de hoy, en vez de duplicar
// el selector de módulos acá.
async function resolveNextPhase(
  planSlug: string,
  phaseId: string,
  shape: string | undefined
): Promise<{ name: string; href: string | null } | undefined> {
  const plan = await prisma.projectPlan.findUnique({
    where: { slug: planSlug },
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
  if (!plan) return undefined;

  const currentIndex = plan.phases.findIndex((p) => p.id === phaseId);
  if (currentIndex === -1) return undefined;
  const nextPhase = plan.phases[currentIndex + 1];
  if (!nextPhase) return undefined;

  const shapeParam = shape?.toLowerCase();
  const matchingLink =
    shapeParam && SHAPE_LABELS.has(shapeParam)
      ? nextPhase.moduleLinks.find((link) => link.label?.toLowerCase() === shapeParam)
      : undefined;
  const resolvedLink = matchingLink ?? (nextPhase.moduleLinks.length === 1 ? nextPhase.moduleLinks[0] : undefined);

  if (!resolvedLink) return { name: nextPhase.name, href: null };

  const query = new URLSearchParams(resolvedLink.presetQuery ?? "");
  query.set("plan", plan.slug);
  query.set("phase", nextPhase.id);
  if (resolvedLink.label && SHAPE_LABELS.has(resolvedLink.label.toLowerCase())) {
    query.set("shape", resolvedLink.label.toLowerCase());
  }

  return {
    name: nextPhase.name,
    href: `/categorias/${resolvedLink.module.category.slug}/${resolvedLink.module.slug}?${query.toString()}`,
  };
}

// Fase 4, sprint UX V1.2 (04-ago-2026): contraparte de resolveNextPhase
// para el botón "Volver" del header en el primer paso del wizard. Antes,
// llegar acá desde una fase de un Plan mostraba "← Inicio" igual que un
// módulo suelto — no había forma de volver a la fase anterior ni al plan.
// A diferencia de resolveNextPhase, siempre devuelve un href resoluble
// (nunca null): si es la primera fase del plan, o si la fase anterior
// tiene 2+ módulos y ninguno calza con la forma actual, el destino cae a
// /plan/[slug] en vez de dejar al header sin nada que mostrar.
async function resolvePreviousPhase(
  planSlug: string,
  phaseId: string,
  shape: string | undefined
): Promise<{ label: string; href: string } | undefined> {
  const plan = await prisma.projectPlan.findUnique({
    where: { slug: planSlug },
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
  if (!plan) return undefined;

  const currentIndex = plan.phases.findIndex((p) => p.id === phaseId);
  if (currentIndex === -1) return undefined;

  if (currentIndex === 0) {
    return { label: `Volver al plan: ${plan.title}`, href: `/plan/${plan.slug}` };
  }

  const previousPhase = plan.phases[currentIndex - 1];
  const shapeParam = shape?.toLowerCase();
  const matchingLink =
    shapeParam && SHAPE_LABELS.has(shapeParam)
      ? previousPhase.moduleLinks.find((link) => link.label?.toLowerCase() === shapeParam)
      : undefined;
  const resolvedLink = matchingLink ?? (previousPhase.moduleLinks.length === 1 ? previousPhase.moduleLinks[0] : undefined);

  if (!resolvedLink) {
    return { label: `Volver a: ${previousPhase.name}`, href: `/plan/${plan.slug}` };
  }

  const query = new URLSearchParams(resolvedLink.presetQuery ?? "");
  query.set("plan", plan.slug);
  query.set("phase", previousPhase.id);
  if (resolvedLink.label && SHAPE_LABELS.has(resolvedLink.label.toLowerCase())) {
    query.set("shape", resolvedLink.label.toLowerCase());
  }

  return {
    label: `Volver a: ${previousPhase.name}`,
    href: `/categorias/${resolvedLink.module.category.slug}/${resolvedLink.module.slug}?${query.toString()}`,
  };
}

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: { slug: string; moduleSlug: string };
  searchParams: {
    tipo?: string;
    plan?: string;
    phase?: string;
    shape?: string;
    "area-inicial"?: string;
    [key: string]: string | string[] | undefined;
  };
}) {
  // Fase C7.3 — permite abrir piscina-integral por URL directa en Vercel
  // Preview/local aunque published=false, sin tocar la fila en la BD (ver
  // module-visibility.ts). En producción real getExtraVisibleSlugs()
  // devuelve [] y el `where` queda igual que antes (solo published=true).
  const extraSlugs = getExtraVisibleSlugs();
  const mod = await prisma.module.findFirst({
    where: {
      slug: params.moduleSlug,
      category: { slug: params.slug },
      ...(extraSlugs.length > 0 ? { OR: [{ published: true }, { slug: { in: extraSlugs } }] } : { published: true }),
    },
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
      numericValue: option.numericValue,
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
  // `nextPhase` (sprint UX 03-ago-2026, ítem 4) se resuelve acá para que
  // ResultScreen pueda ofrecer "Continuar con: <fase siguiente>" como acción
  // principal, en vez de que guardar sea la única acción disponible.
  const planContext =
    searchParams.plan && searchParams.phase
      ? {
          slug: searchParams.plan,
          phaseId: searchParams.phase,
          shape: searchParams.shape,
          nextPhase: await resolveNextPhase(searchParams.plan, searchParams.phase, searchParams.shape),
          previousPhase: await resolvePreviousPhase(searchParams.plan, searchParams.phase, searchParams.shape),
        }
      : undefined;

  // Precarga de área (ver Fase 3 de "Construir una piscina", plan/[slug]/
  // page.tsx) — solo un número parseable, cualquier otro valor se ignora
  // en vez de romper la página.
  const areaInicialRaw = searchParams["area-inicial"];
  const areaInicialNum = areaInicialRaw ? Number(areaInicialRaw) : NaN;
  const forcedInitialArea = Number.isFinite(areaInicialNum) && areaInicialNum > 0 ? areaInicialNum : undefined;

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
      forcedInitialArea={forcedInitialArea}
    />
  );
}
