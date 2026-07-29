import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanView, type PlanPhaseData } from "@/components/plan/plan-view";

// Labels que representan una elección de FORMA (no cualquier label de
// ProjectPlanPhaseModule) — solo estos participan en la propagación
// ?shape= entre fases. Otros labels (ej. "Radier (base)", "Pastelones" en
// "Terminar el entorno") no son una forma y no deben ensuciar la URL con
// un valor sin sentido para ese query param.
const SHAPE_LABELS = new Set(["rectangular", "circular"]);

export default async function ProjectPlanPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { justCompleted?: string; shape?: string };
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

  // Caso puntual (no una feature genérica de "memoria entre fases"): si el
  // usuario ya guardó la Piscina rectangular de este mismo plan, se deriva
  // el perímetro para prellenar el largo del Sendero en "Terminar el
  // entorno" — editable, y si no hay dato guardado (guardó la Circular, o
  // nada), el módulo de Sendero sigue funcionando suelto como siempre.
  const rectangularPoolLink = plan.phases
    .flatMap((phase) => phase.moduleLinks)
    .find((link) => link.module.slug === "piscina-rectangular-hormigon-armado");

  let poolPerimeterMeters: number | null = null;
  if (session?.user?.id && rectangularPoolLink) {
    const savedPool = await prisma.savedProject.findFirst({
      where: { userId: session.user.id, planId: plan.id, moduleId: rectangularPoolLink.module.id },
      orderBy: { createdAt: "desc" },
      select: { result: true },
    });
    // result.variables está keyado por Variable.key (el nombre corto usado en
    // el DSL de fórmulas, ej. "largo"), no por Question.key (el nombre largo
    // usado en el wizard/URL, ej. "largo-de-la-piscina-metros") — son
    // entidades distintas en el schema (ver Variable.source: {type:
    // "QUESTION", questionKey: "..."}).
    const variables = (savedPool?.result as { variables?: Record<string, unknown> } | undefined)?.variables;
    const largo = Number(variables?.["largo"]);
    const ancho = Number(variables?.["ancho"]);
    if (Number.isFinite(largo) && Number.isFinite(ancho)) {
      poolPerimeterMeters = 2 * (largo + ancho);
    }
  }

  // Propagación de forma (Rectangular/Circular) entre fases — ver
  // diagnóstico de "Construir una piscina". Si llega ?shape=rectangular (ya
  // sea desde /grupos/piscinas al entrar, o desde el redirect de
  // ResultScreen al completar una fase anterior), cualquier fase cuyos
  // links tengan un label que calce con esa forma se colapsa a ESE único
  // link — PlanView ya renderiza el botón único "Calcular esta fase" en
  // vez del selector cuando links.length === 1, así que no hace falta
  // tocar ese componente. Sin el query param, el comportamiento es
  // idéntico al de hoy (se listan todos los links de la fase).
  const shapeParam = searchParams.shape?.toLowerCase();

  const phases: PlanPhaseData[] = plan.phases.map((phase) => {
    const matchingLink =
      shapeParam && SHAPE_LABELS.has(shapeParam)
        ? phase.moduleLinks.find((link) => link.label?.toLowerCase() === shapeParam)
        : undefined;
    const linksToShow = matchingLink ? [matchingLink] : phase.moduleLinks;

    return {
      id: phase.id,
      name: phase.name,
      completed: completedPhaseIds.has(phase.id),
      links: linksToShow.map((link) => {
        // plan/phase van como query params propios (no se mezclan con
        // presetQuery, que es contenido de la fase) — así el wizard sabe
        // desde qué plan se abrió y, al guardar, puede redirigir de vuelta acá
        // en vez de dejar al usuario en /proyectos/[id] sin salida.
        const query = new URLSearchParams(link.presetQuery ?? "");
        query.set("plan", plan.slug);
        query.set("phase", phase.id);
        // El propio label del link (si es de tipo forma) viaja de vuelta en
        // la URL, para que el redirect de ResultScreen al guardar (ver
        // handleSaveProject) pueda reenviarlo a la fase siguiente.
        if (link.label && SHAPE_LABELS.has(link.label.toLowerCase())) {
          query.set("shape", link.label.toLowerCase());
        }
        if (link.module.slug === "hacer-un-sendero" && poolPerimeterMeters !== null) {
          query.set("largo-del-sendero-metros", String(poolPerimeterMeters));
        }
        return {
          label: link.label,
          moduleName: link.module.name,
          href: `/categorias/${link.module.category.slug}/${link.module.slug}?${query.toString()}`,
        };
      }),
    };
  });

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
