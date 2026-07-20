import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    <div className="min-h-screen w-full bg-concrete text-ink font-body">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-ink-muted hover:text-ink">
          ← ObraBien Calcula
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mt-4 mb-8">
          Mis proyectos
        </h1>

        {projects.length === 0 && (
          <p className="text-sm text-ink-muted">
            Todavía no has guardado ningún proyecto. Calcula un módulo y usa &quot;Guardar como
            proyecto&quot; en el resultado.
          </p>
        )}

        <div className="grid gap-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/proyectos/${project.id}`}
              className="block rounded-2xl p-5 bg-white border border-border hover:border-ink transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-[15px]">{project.name}</p>
                  <p className="text-xs text-ink-muted mt-1">
                    {project.module.category.name} · {project.module.name} ·{" "}
                    {project.createdAt.toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <ProgressEditor id={project.id} initialValue={project.progressPercent} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
