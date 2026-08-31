import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanView, type PlanPhaseData, type PoolShape } from "@/components/plan/plan-view";
import { SHAPE_LABELS } from "@/lib/plan-shape";

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
  // usuario ya guardó la Piscina rectangular o circular de este mismo plan,
  // se derivan sus medidas reales para poder calcular el área EXACTA del
  // contorno en la Fase 3 (ver ContornoAreaField en plan-view.tsx). Sin
  // dato guardado (ninguna forma guardada aún), poolShape queda null y la
  // Fase 3 sigue funcionando exactamente como antes (largo/ancho manual).
  const userId = session?.user?.id;
  const poolLinks = plan.phases
    .flatMap((phase) => phase.moduleLinks)
    .filter(
      (link) =>
        link.module.slug === "piscina-rectangular-hormigon-armado" ||
        link.module.slug === "piscina-circular-hormigon-armado"
    );

  let poolShape: PoolShape | null = null;
  if (userId) {
    for (const link of poolLinks) {
      const savedPool = await prisma.savedProject.findFirst({
        where: { userId, planId: plan.id, moduleId: link.module.id },
        orderBy: { createdAt: "desc" },
        select: { result: true },
      });
      // result.variables está keyado por Variable.key (el nombre corto usado
      // en el DSL de fórmulas, ej. "largo"), no por Question.key (el nombre
      // largo usado en el wizard/URL) — entidades distintas en el schema
      // (ver Variable.source: {type: "QUESTION", questionKey: "..."}).
      const variables = (savedPool?.result as { variables?: Record<string, unknown> } | undefined)?.variables;
      if (!variables) continue;
      // FASE A — Piscinas (auditoría, sección 9): espesor-muro-cm ya existe
      // como Variable en ambos módulos de piscina (ver Fase 2, "Espesor de
      // los muros"). Se lee acá para que el contorno de Fase 3 se calcule
      // desde la cara exterior real del muro, no desde el espejo de agua.
      // Fallback seguro: si no existe o no es un número válido (proyecto
      // guardado antes de esta fase, o dato corrupto), `espesorMuroM` queda
      // `undefined` y `computeContornoArea` lo trata como 0 — exactamente
      // el comportamiento que ya existía antes de este cambio, sin NaN.
      const espesorMuroCm = Number(variables["espesor-muro-cm"]);
      const espesorMuroM = Number.isFinite(espesorMuroCm) && espesorMuroCm > 0 ? espesorMuroCm / 100 : undefined;
      if (link.module.slug === "piscina-rectangular-hormigon-armado") {
        const largo = Number(variables["largo"]);
        const ancho = Number(variables["ancho"]);
        if (Number.isFinite(largo) && largo > 0 && Number.isFinite(ancho) && ancho > 0) {
          poolShape = { kind: "rectangular", largo, ancho, espesorMuroM };
          break;
        }
      } else {
        const diametro = Number(variables["diametro"]);
        if (Number.isFinite(diametro) && diametro > 0) {
          poolShape = { kind: "circular", radio: diametro / 2, espesorMuroM };
          break;
        }
      }
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
        return {
          label: link.label,
          moduleName: link.module.name,
          moduleSlug: link.module.slug,
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

      <PlanView
        planSlug={plan.slug}
        phases={phases}
        justCompletedPhaseId={searchParams.justCompleted}
        poolShape={poolShape}
      />
    </div>
  );
}
