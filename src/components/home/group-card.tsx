import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ProjectGroup, ProjectTask } from "@/generated/prisma/client";
import { getCategoryIcon } from "@/lib/category-icons";
import { pluralizeUnit } from "@/lib/pluralize";
import { GROUP_ICON_CHIP_CLASS } from "@/lib/group-colors";

type Group = ProjectGroup & { tasks: ProjectTask[] };

// Cuántas tareas se muestran en la vista previa cerrada: 2 en mobile
// (oculta la 3ra con `hidden md:flex`), 3 en desktop. El "+X más" del pie
// se calcula sobre la base mobile (2) — en desktop, técnicamente hay 1
// menos "de más" de lo que dice el texto, pero es preferible eso a que el
// número cambie de significado según el viewport.
const MOBILE_PREVIEW_COUNT = 2;
const DESKTOP_PREVIEW_COUNT = 3;

function TaskRow({ task, hideOnMobile }: { task: ProjectTask; hideOnMobile?: boolean }) {
  return (
    <Link
      href={`/empezar/${task.slug}`}
      className={`${hideOnMobile ? "hidden md:flex" : "flex"} items-center justify-between gap-3 rounded-xl px-4 py-3 bg-white border border-border hover:border-safety/40 transition-colors`}
    >
      <span className="text-sm font-medium">{task.name}</span>
      <ChevronRight className="w-4 h-4 text-ink-faint flex-shrink-0" />
    </Link>
  );
}

// Tarjeta cerrada de un grupo en la Home — vista previa de 2-3 tareas con
// un pie que lleva al detalle completo en /grupos/[slug]. "Modo profesional"
// (tone === "avanzado") usa el mismo shell pero con banda azulada propia y
// vista previa como píldoras en vez de filas, igual que antes.
export function GroupCard({ group }: { group: Group }) {
  const Icon = getCategoryIcon(group.icon);
  const isAdvanced = group.tone === "avanzado";
  const total = group.tasks.length;
  const hasMore = total > DESKTOP_PREVIEW_COUNT;
  const moreCount = total - MOBILE_PREVIEW_COUNT;

  if (isAdvanced) {
    // Colapso propio: 4 píldoras en mobile, 6 en desktop.
    const preview = group.tasks.slice(0, 6);
    return (
      <div className="rounded-2xl p-5 bg-navy/[0.04] border border-navy/20">
        <div className="flex items-center gap-2.5 mb-4">
          <Icon className="w-4 h-4 text-navy" />
          <h3 className="text-sm font-semibold text-navy">{group.name}</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-ink-faint">
            Para maestros y contratistas
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {preview.map((task, i) => (
            <Link
              key={task.id}
              href={`/empezar/${task.slug}`}
              className={`${i >= 4 ? "hidden md:inline-flex" : "inline-flex"} text-xs font-medium px-3 py-2 rounded-full border border-navy/20 bg-white text-ink-muted hover:border-navy/40 hover:text-ink transition-colors`}
            >
              {task.name}
            </Link>
          ))}
        </div>
        {total > 6 && (
          <Link
            href={`/grupos/${group.slug}`}
            className="mt-4 inline-block text-sm font-medium text-navy hover:underline"
          >
            Ver las {total}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 bg-white border border-border">
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${GROUP_ICON_CHIP_CLASS}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <h3 className="font-display text-lg font-semibold tracking-tight flex-1">{group.name}</h3>
        <span className="text-xs text-ink-muted flex-shrink-0">
          {total} {pluralizeUnit(total, "cálculo")}
        </span>
      </div>

      <div className="grid gap-2">
        {group.tasks.slice(0, DESKTOP_PREVIEW_COUNT).map((task, i) => (
          <TaskRow key={task.id} task={task} hideOnMobile={i === 2} />
        ))}
      </div>

      {hasMore && (
        <Link
          href={`/grupos/${group.slug}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-safety hover:underline"
        >
          Ver las {total} opciones · +{moreCount} más
        </Link>
      )}
    </div>
  );
}
