import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ProjectGroup, ProjectTask } from "@/generated/prisma/client";
import { getCategoryIcon } from "@/lib/category-icons";
import { pluralizeUnit } from "@/lib/pluralize";
import { getGroupIconClasses } from "@/lib/group-colors";

type Group = ProjectGroup & { tasks: ProjectTask[] };

// Fila compacta de un grupo en "Todas las categorías" (Home) — ícono +
// nombre + contador + flecha, sin vista previa de tareas (eso ya se ve
// en las fotos de "Proyectos más buscados" arriba y en /grupos/[slug],
// que es adonde lleva toda la fila). Antes esto era una tarjeta con 2-3
// tareas de vista previa (ver historial), pero ocupaba demasiado alto
// para lo que aportaba — la mayoría del tiempo el usuario igual termina
// en /grupos/[slug] para ver el detalle completo con fotos.
export function GroupCard({ group }: { group: Group }) {
  const Icon = getCategoryIcon(group.icon);
  const total = group.tasks.length;

  return (
    <Link
      href={`/grupos/${group.slug}`}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-white border border-border hover:border-safety/40 hover:-translate-y-0.5 transition-all"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${getGroupIconClasses(group.slug)}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <span className="font-semibold text-[15px] flex-1 truncate">{group.name}</span>
      <span className="text-xs text-ink-muted flex-shrink-0">
        {total} {pluralizeUnit(total, "cálculo")}
      </span>
      <ChevronRight className="w-4 h-4 text-ink-faint flex-shrink-0" />
    </Link>
  );
}
