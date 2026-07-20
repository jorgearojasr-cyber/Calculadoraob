import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCategoryIcon } from "@/lib/category-icons";

export async function RecentProjects() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">
          Últimos proyectos
        </p>
        <div className="rounded-2xl p-8 bg-white border border-border flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-ink-muted">
            Inicia sesión para guardar tus cálculos y verlos aquí.
          </p>
          <Link
            href="/login"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-ink flex items-center gap-2 flex-shrink-0"
          >
            Ingresar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  const projects = await prisma.savedProject.findMany({
    where: { userId: session.user.id },
    include: { module: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">
            Últimos proyectos
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            {projects.length === 0 ? "Todavía no tienes nada guardado" : "Retoma donde quedaste"}
          </h2>
        </div>
        {projects.length > 0 && (
          <Link
            href="/proyectos"
            className="text-sm font-medium text-ink-muted hover:text-ink inline-flex items-center gap-1.5 flex-shrink-0"
          >
            Ver todos
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl p-8 bg-white border border-border">
          <p className="text-sm text-ink-muted">
            Calcula algo y usa &quot;Guardar como proyecto&quot; en el resultado para verlo aquí.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {projects.map((project) => {
            const Icon = getCategoryIcon(project.module.category.icon);
            return (
              <Link
                key={project.id}
                href={`/proyectos/${project.id}`}
                className="rounded-2xl p-5 bg-white border border-border hover:border-ink transition-colors"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-navy/[0.06]">
                  <Icon className="w-5 h-5 text-navy" />
                </div>
                <h3 className="font-semibold text-[15px] mb-1">{project.name}</h3>
                <p className="text-xs text-ink-muted mb-4">
                  {project.module.category.name} · {project.module.name}
                </p>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-safety transition-all"
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] font-mono text-ink-faint">
                  {project.progressPercent}% de avance
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
