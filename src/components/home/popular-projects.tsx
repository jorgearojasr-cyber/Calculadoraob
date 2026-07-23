import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Selección curada a mano (no hay datos reales de popularidad todavía) —
// deliberadamente son las tareas cuyo módulo ya tiene ModuleGuide completo,
// para que "Popular" también signifique "con guía práctica lista".
const CURATED_TASK_SLUGS = [
  "construir-un-radier",
  "pintar-una-habitacion",
  "levantar-un-muro",
  "construir-una-piscina",
  "construir-un-quincho",
];

export async function PopularProjects() {
  const tasks = await prisma.projectTask.findMany({
    where: { slug: { in: CURATED_TASK_SLUGS } },
    include: { group: { select: { name: true } } },
  });

  const ordered = CURATED_TASK_SLUGS.map((slug) => tasks.find((t) => t.slug === slug)).filter(
    (t): t is NonNullable<typeof t> => Boolean(t)
  );

  if (ordered.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 pt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Proyectos destacados</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ordered.map((task) => (
          <Link
            key={task.id}
            href={`/empezar/${task.slug}`}
            className="rounded-2xl p-4 bg-white border border-border hover:border-safety/40 hover:-translate-y-0.5 transition-all"
          >
            <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-safety-tint text-safety mb-2">
              {task.group.name}
            </span>
            <p className="font-semibold text-sm">{task.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
