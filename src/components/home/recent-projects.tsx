import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCategoryIcon } from "@/lib/category-icons";

// Home ObraBien V2 (2026-09-14, punto 7 del pedido): para un visitante sin
// sesión, o con sesión pero sin proyectos guardados, esta sección se omite
// por completo (ni siquiera el estado vacío) — el punto 7 pide
// explícitamente no mostrar un "big empty state" acá. Antes (rediseño
// 2026-08-01) sí se mostraba un estado vacío con sesión; ese caso ahora
// también retorna null. Solo datos reales de SavedProject, nunca progreso
// inventado (no existe ningún campo de progreso confiable en el modelo,
// así que no se agrega ninguno).
export async function RecentProjects() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  const projects = await prisma.savedProject.findMany({
    where: { userId: session.user.id },
    include: { module: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  if (projects.length === 0) return null;

  return (
    <section className="max-w-3xl lg:max-w-6xl mx-auto px-4 sm:px-10 py-6 sm:py-8">
      <div className="flex items-end justify-between mb-4 sm:mb-5">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#10203A]" style={{ letterSpacing: "-0.02em" }}>
          Continúa tu proyecto
        </h2>
        <Link
          href="/proyectos"
          className="text-sm font-medium text-[#5B6577] hover:text-[#10203A] inline-flex items-center gap-1.5 flex-shrink-0"
        >
          Ver mis proyectos
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
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
    </section>
  );
}
