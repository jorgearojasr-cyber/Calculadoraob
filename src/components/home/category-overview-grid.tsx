import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCategoryIcon } from "@/lib/category-icons";

// Grilla compacta de categorías con conteo real de tareas activas por
// ProjectGroup (no un número de ejemplo) — cada tarjeta ancla a su bloque
// correspondiente más abajo en "Empieza aquí", donde viven las tareas.
export async function CategoryOverviewGrid() {
  const groups = await prisma.projectGroup.findMany({
    where: { tasks: { some: {} } },
    orderBy: { order: "asc" },
    include: { _count: { select: { tasks: true } } },
  });

  if (groups.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 pt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Explora por categoría</h2>
        <a href="#empezar" className="text-sm font-medium text-safety hover:underline">
          Ver todas →
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {groups.map((group) => {
          const Icon = getCategoryIcon(group.icon);
          const anchor = group.tone === "avanzado" ? "modo-profesional" : `grupo-${group.slug}`;
          return (
            <Link
              key={group.id}
              href={`#${anchor}`}
              className="rounded-2xl p-4 bg-white border border-border hover:border-safety/40 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-navy/[0.07] mb-3">
                <Icon className="w-5 h-5 text-navy" />
              </div>
              <p className="font-semibold text-sm mb-0.5">{group.name}</p>
              <p className="text-xs text-ink-muted">
                {group._count.tasks} {group._count.tasks === 1 ? "proyecto" : "proyectos"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
