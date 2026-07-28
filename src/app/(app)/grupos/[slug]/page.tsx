import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ListChecks, Clock, HelpCircle as HelpCircleIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCategoryIcon } from "@/lib/category-icons";
import { pluralizeUnit } from "@/lib/pluralize";
import { GROUP_ICON_CHIP_CLASS } from "@/lib/group-colors";
import { GroupChip } from "@/components/home/group-chip";

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
            include: { module: { include: { guide: true } } },
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
          <p className="text-sm text-ink-muted">
            {total} {pluralizeUnit(total, "cálculo")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
        {group.tasks.map((task) => (
          <Link
            key={task.id}
            href={`/empezar/${task.slug}`}
            className="flex items-center justify-between gap-3 rounded-2xl p-5 bg-white border border-border hover:border-safety/40 hover:-translate-y-0.5 transition-all"
          >
            <span className="font-semibold text-[15px]">{task.name}</span>
            <ChevronRight className="w-4 h-4 text-ink-faint flex-shrink-0 md:hidden" />
          </Link>
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
