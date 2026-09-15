import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import { getPopularTasks } from "@/lib/popular-tasks";

// Home ObraBien V2 (2026-09-14, punto 8 del pedido) — "Calculadoras
// populares". Reutiliza getPopularTasks() (la misma fuente ya curada y
// real que usaba PopularTasksCarousel dentro del Hero anterior — ver
// lib/popular-tasks.ts) en vez de declarar una lista nueva, para no
// duplicar lógica.
//
// Se excluye "construir-una-piscina" acá a propósito: esa tarea enlaza a
// /grupos/piscinas (selector de forma), y esta fase ya le da a la piscina
// su propio espacio, más apropiado, en PlanFeaturedSection
// (/plan/construir-una-piscina) — mostrarla también acá sería redundante
// y, en una sección llamada "calculadoras", confunde el plan por etapas
// con una calculadora de una pasada. `piscina-integral` (Module
// published:false) nunca estuvo en CURATED_TASK_SLUGS, así que no
// requiere ningún filtro adicional para no aparecer acá.
export async function PopularCalculatorsSection() {
  const allTasks = await getPopularTasks();
  const tasks = allTasks.filter((t) => t.slug !== "construir-una-piscina");
  if (tasks.length === 0) return null;

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-10 py-6 sm:py-8">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[18px] sm:text-[20px] font-bold text-[#10203A]" style={{ letterSpacing: "-0.02em" }}>
          Calculadoras populares
        </h2>
        <Link href="/#empezar" className="text-[13px] sm:text-sm font-bold text-action inline-flex items-center gap-1 flex-shrink-0">
          Ver todas
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {tasks.slice(0, 6).map((task) => (
          <ProjectCard
            key={task.id}
            href={task.href}
            title={task.name}
            categoryLabel={task.groupName}
            imageUrl={task.image}
            stepCount={task.stepCount}
          />
        ))}
      </div>
    </section>
  );
}
