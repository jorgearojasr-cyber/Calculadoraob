import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCategoryIcon } from "@/lib/category-icons";
import { ProgressEditor } from "@/components/proyectos/progress-editor";

export default async function ProyectosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const projects = await prisma.savedProject.findMany({
    where: { userId: session.user.id },
    include: { module: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-8">
        Mis proyectos
      </h1>

      {projects.length === 0 && (
        <p className="text-sm text-ink-muted">
          Todavía no has guardado ningún proyecto. Calcula un módulo y usa &quot;Guardar como
          proyecto&quot; en el resultado.
        </p>
      )}

      <div className="grid gap-3">
        {projects.map((project) => {
          const Icon = getCategoryIcon(project.module.category.icon);
          return (
            <Link
              key={project.id}
              href={`/proyectos/${project.id}`}
              className="block rounded-2xl p-5 bg-white border border-border hover:border-safety/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-navy/[0.07] flex-shrink-0">
                  <Icon className="w-6 h-6 text-navy" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[15px] truncate">{project.name}</p>
                  <p className="text-xs text-ink-muted mt-0.5 truncate">
                    {project.module.category.name} · {project.module.name} ·{" "}
                    {project.createdAt.toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-3 max-w-xs">
                    <ProgressEditor id={project.id} initialValue={project.progressPercent} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
