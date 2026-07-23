import Link from "next/link";
import { getCategoryIcon } from "@/lib/category-icons";
import type { ProjectGroup, ProjectTask } from "@/generated/prisma/client";

export function ProjectGroupBlock({
  group,
}: {
  group: ProjectGroup & { tasks: ProjectTask[] };
}) {
  const Icon = getCategoryIcon(group.icon);
  const isAdvanced = group.tone === "avanzado";

  if (isAdvanced) {
    return (
      <div id="modo-profesional" className="pt-8 border-t border-border scroll-mt-24">
        <div className="flex items-center gap-2.5 mb-4">
          <Icon className="w-4 h-4 text-ink-faint" />
          <h3 className="text-sm font-semibold text-ink-muted">{group.name}</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-concrete text-ink-faint">
            Para maestros y contratistas
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {group.tasks.map((task) => (
            <Link
              key={task.id}
              href={`/empezar/${task.slug}`}
              className="text-xs font-medium px-3 py-2 rounded-full border border-border bg-white text-ink-muted hover:border-ink hover:text-ink transition-colors"
            >
              {task.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id={`grupo-${group.slug}`} className="scroll-mt-24">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-navy/[0.07]">
          <Icon className="w-4.5 h-4.5 text-navy" />
        </div>
        <h3 className="font-display text-lg font-semibold tracking-tight">{group.name}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {group.tasks.map((task) => (
          <Link
            key={task.id}
            href={`/empezar/${task.slug}`}
            className="group relative rounded-2xl p-5 bg-white border border-border hover:border-safety/40 hover:-translate-y-0.5 transition-all"
          >
            <span className="font-semibold text-[15px]">{task.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
