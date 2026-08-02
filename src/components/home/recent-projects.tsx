import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCategoryIcon } from "@/lib/category-icons";

// Rediseño de Home (2026-08-01, aprobado): para un visitante sin sesión
// esta sección ya no muestra nada — es contenido 100% para el usuario
// recurrente, y un CTA de login acá competía con el buscador del Hero
// justo frente al visitante que el rediseño prioriza (los "primeros 5
// segundos"). "Iniciar sesión" ya existe en el nav.
export async function RecentProjects() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  const projects = await prisma.savedProject.findMany({
    where: { userId: session.user.id },
    include: { module: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-10 py-10 sm:py-16">
      <div className="flex items-end justify-between mb-6 sm:mb-8">
        <div>
          <p
            className="font-mono text-[11px] uppercase mb-2 text-[#5B6577]"
            style={{ letterSpacing: "0.08em" }}
          >
            Últimos proyectos
          </p>
          <h2 className="font-display text-3xl font-bold text-[#10203A]" style={{ letterSpacing: "-0.02em" }}>
            {projects.length === 0 ? "Todavía no tienes nada guardado" : "Retoma donde quedaste"}
          </h2>
        </div>
        {projects.length > 0 && (
          <Link
            href="/proyectos"
            className="text-sm font-medium text-[#5B6577] hover:text-[#10203A] inline-flex items-center gap-1.5 flex-shrink-0"
          >
            Ver todos
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl p-8 bg-white border border-[#E4E8EF]">
          <p className="text-sm text-[#5B6577]">
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
                className="rounded-2xl p-5 bg-white border border-[#E4E8EF] hover:border-[#002152]/30 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-navy/[0.06]">
                  <Icon className="w-5 h-5 text-navy" />
                </div>
                <h3 className="font-semibold text-[15px] mb-1 text-[#10203A]">{project.name}</h3>
                <p className="text-xs text-[#5B6577]">
                  {project.module.category.name} · {project.module.name}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
