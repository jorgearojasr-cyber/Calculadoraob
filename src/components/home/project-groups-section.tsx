import { prisma } from "@/lib/prisma";
import { ProjectGroupBlock } from "./project-group-block";

export async function ProjectGroupsSection() {
  // Solo grupos con al menos una tarea sembrada — un grupo sin contenido
  // real (ej. "Reparar" hoy) queda en la base de datos pero no aparece en
  // la Home hasta que se le agregue una tarea.
  const groups = await prisma.projectGroup.findMany({
    where: { tasks: { some: {} } },
    orderBy: { order: "asc" },
    include: { tasks: { orderBy: { order: "asc" } } },
  });

  if (groups.length === 0) return null;

  return (
    <section id="empezar" className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">Empieza aquí</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight">¿Qué quieres construir?</h2>
      </div>

      <div className="grid gap-10">
        {groups.map((group) => (
          <ProjectGroupBlock key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}
