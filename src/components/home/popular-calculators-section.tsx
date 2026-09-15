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
    <section className="max-w-3xl lg:max-w-6xl mx-auto py-5 sm:py-7">
      <div className="flex items-baseline justify-between mb-3 sm:mb-4 px-4 sm:px-10">
        <h2 className="font-display text-[17px] sm:text-[19px] font-extrabold text-ds-navy-900" style={{ letterSpacing: "-0.02em" }}>
          Calculadoras populares
        </h2>
        {/* Design Spec v1.0 — Parte 2, 2026-09-15: apunta a /calculadoras
            (antes /#empezar), la nueva pantalla dedicada. */}
        <Link href="/calculadoras" className="text-[13px] sm:text-sm font-bold text-action inline-flex items-center gap-1 flex-shrink-0">
          Ver todas
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Mobile: scroll horizontal (tarjetas de ancho fijo, mismo patrón que
          PopularTasksCarousel) en vez de grilla 2-col — evita comprimir el
          título y la imagen 16:9 de ProjectCard en ~170px. Desktop: grilla
          de 4 columnas (Design Spec v1.0, punto 15) desde `lg`, donde el
          contenedor ya pasa a max-w-6xl — entre `sm` y `lg` se mantienen 3
          columnas (contenedor todavía angosto). ProjectCard en sí no se
          modifica (componente compartido con /buscar, /categorias, etc). */}
      <div className="flex sm:hidden gap-3 overflow-x-auto pb-1 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tasks.slice(0, 6).map((task) => (
          <ProjectCard
            key={task.id}
            href={task.href}
            title={task.name}
            categoryLabel={task.groupName}
            imageUrl={task.image}
            stepCount={task.stepCount}
            className="flex-none w-[168px]"
          />
        ))}
      </div>

      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-4 px-10">
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
