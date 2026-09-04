import Link from "next/link";
import { notFound } from "next/navigation";
import { ListChecks, Clock, HelpCircle as HelpCircleIcon, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCategoryIcon } from "@/lib/category-icons";
import { pluralizeUnit } from "@/lib/pluralize";
import { GROUP_ICON_CHIP_CLASS, getGroupCountLabel } from "@/lib/group-colors";
import { GroupChip } from "@/components/home/group-chip";
import { ProjectCard } from "@/components/project-card";
import { TASK_IMAGES } from "@/lib/popular-tasks";
import { getDisplayStepCount } from "@/lib/module-step-count";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const group = await prisma.projectGroup.findUnique({
    where: { slug },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        include: {
          moduleLinks: {
            orderBy: { order: "asc" },
            include: { module: { include: { guide: true, _count: { select: { questions: true } } } } },
          },
        },
      },
    },
  });

  if (!group || group.tasks.length === 0) notFound();

  const otherGroups = await prisma.projectGroup.findMany({
    where: { tasks: { some: {} }, slug: { not: slug } },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, name: true, icon: true },
  });

  // Módulos distintos alcanzables desde las tareas de este grupo (una tarea
  // sin moduleLinks — resuelta por quickGuide o plan en su lugar — no aporta
  // ningún módulo, así que no cuenta ni para el total ni para "con guía").
  const moduleMap = new Map<string, { id: string; name: string; slug: string; guide: unknown }>();
  for (const task of group.tasks) {
    for (const link of task.moduleLinks) {
      moduleMap.set(link.module.id, link.module);
    }
  }
  const modules = Array.from(moduleMap.values());
  const modulesWithGuide = modules.filter(
    (m): m is typeof m & { guide: NonNullable<(typeof modules)[number]["guide"]> } => m.guide !== null
  );

  const Icon = getCategoryIcon(group.icon);
  const total = group.tasks.length;
  const countLabel = getGroupCountLabel(group.slug) ?? `${total} ${pluralizeUnit(total, "cálculo")}`;

  // Fase 1 de homogeneización visual (07-ago-2026): toda tarea se muestra
  // con la misma ProjectCard, con o sin foto (el placeholder de la tarjeta
  // reemplaza la antigua distinción "photo" vs "plain" con layouts
  // distintos). Si una tarea tiene 2+ moduleLinks (ej. "Construir una
  // piscina" -> Rectangular/Circular), cada link se muestra como su propia
  // tarjeta, porque cada opción es un cálculo distinto con su propia foto e
  // cantidad de pasos, no la tarea genérica.
  type TaskCard = { key: string; href: string; imageUrl: string | null; title: string; stepCount: number | null };

  const taskCards: TaskCard[] = group.tasks.flatMap((task): TaskCard[] => {
    if (task.moduleLinks.length > 1) {
      return task.moduleLinks.map((link) => ({
        key: link.id,
        // La forma elegida (label, ej. "Rectangular"/"Circular") viaja como
        // ?shape= para que /empezar/[taskSlug] la propague al plan — antes
        // las 2 tarjetas apuntaban al mismo href y la elección no llegaba a
        // ningún lado (ver diagnóstico de "Construir una piscina").
        href: link.label ? `/empezar/${task.slug}?shape=${encodeURIComponent(link.label.toLowerCase())}` : `/empezar/${task.slug}`,
        // Sin foto propia del link/módulo, cae a la foto de la tarea
        // completa (TASK_IMAGES, ya aprobada) antes que al placeholder —
        // menos preciso que una foto por forma, pero más útil que nada.
        imageUrl: link.imageUrl ?? link.module.imageUrl ?? TASK_IMAGES[task.slug] ?? null,
        title: link.module.name,
        stepCount: getDisplayStepCount(link.module.slug, link.module._count.questions),
      }));
    }
    const singleLink = task.moduleLinks[0];
    return [
      {
        key: task.id,
        href: `/empezar/${task.slug}`,
        // TASK_IMAGES (curada a mano, Fase 7) tiene prioridad — mismas 6
        // fotos ya aprobadas y visibles en el carrusel de Home.
        imageUrl: TASK_IMAGES[task.slug] ?? task.imageUrl ?? singleLink?.imageUrl ?? singleLink?.module.imageUrl ?? null,
        title: task.name,
        stepCount: getDisplayStepCount(singleLink?.module.slug, singleLink?.module._count.questions),
      },
    ];
  });

  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-20">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink transition-colors">
        ← Inicio
      </Link>

      <div className="flex items-center gap-3 mt-4 mb-8">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${GROUP_ICON_CHIP_CLASS}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-tight">{group.name}</h1>
          <p className="text-sm text-ink-muted">{countLabel}</p>
        </div>
      </div>

      {/* Disclaimer reforzado (mismo tratamiento visual que el nivel 4 de
          NormsDisclaimer) — este grupo ya no aparece en la exploración de
          Home a propósito (ver exploration-section.tsx): cada cálculo acá
          es solo una pieza del proyecto completo, no el diseño estructural
          total (renombrado de "Modo profesional" a "Cálculos especiales"
          para dejar más claro que calculan cantidad, no ejecutan/diseñan). */}
      {group.slug === "herramientas-avanzadas" && (
        <div className="mb-8 rounded-2xl p-4 bg-danger-tint border-2 border-danger">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="w-6 h-6 flex-shrink-0 mt-0.5 text-danger" strokeWidth={2.75} />
            <div className="text-sm text-ink-muted">
              <p className="font-semibold text-danger">
                Estos cálculos son piezas sueltas, no un diseño estructural completo.
              </p>
              <p className="mt-1">
                Por ejemplo, un cálculo de hormigón acá no incluye el diseño de armadura/refuerzo — eso requiere
                un profesional certificado. Úsalos junto con la especificación de tu plano o maestro/constructor,
                no en su reemplazo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2 columnas ya desde mobile (no 1) — con la imagen 16:9 a ancho
          completo de un mobile de 375px, la tarjeta ocuparía casi toda la
          pantalla y obligaría a scroll excesivo para ver más de una opción. */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        {taskCards.map((card) => (
          <ProjectCard
            key={card.key}
            href={card.href}
            title={card.title}
            categoryLabel={group.name}
            imageUrl={card.imageUrl}
            stepCount={card.stepCount}
          />
        ))}
      </div>

      {modulesWithGuide.length > 0 && (
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-wider mb-1 text-safety">Guías prácticas</p>
          <p className="text-sm text-ink-muted mb-4">
            {modulesWithGuide.length} de {modules.length} módulos de este grupo tienen guía
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {modulesWithGuide.map((m) => {
              const guide = m.guide as {
                estimatedTime: string;
                stepByStepSummary: string[];
                faqs: { question: string; answer: string }[];
              };
              return (
                <Link
                  key={m.id}
                  href={`/guias/${m.slug}`}
                  className="rounded-2xl p-4 bg-white border border-border hover:border-safety/40 transition-colors"
                >
                  <p className="font-semibold text-[15px] mb-2">{m.name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <ListChecks className="w-3.5 h-3.5" />
                      {guide.stepByStepSummary.length} pasos
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {guide.estimatedTime}
                    </span>
                    {guide.faqs.length > 0 && (
                      <span className="flex items-center gap-1">
                        <HelpCircleIcon className="w-3.5 h-3.5" />
                        Con FAQ
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-ink-muted mb-3">Otras categorías</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap">
          {otherGroups.map((g) => (
            <GroupChip key={g.id} slug={g.slug} name={g.name} icon={g.icon} />
          ))}
        </div>
      </div>
    </div>
  );
}
