"use client";

import { useState } from "react";
import Link from "next/link";
import type { Category, ProjectGroup, ProjectTask } from "@/generated/prisma/client";
import { ProjectGroupBlock } from "./project-group-block";
import { CategoryGrid } from "./category-grid";

type PopularTask = ProjectTask & { group: { name: string } };
type Group = ProjectGroup & { tasks: ProjectTask[] };

// Fusiona lo que antes eran 3 secciones separadas de la Home
// (CategoryOverviewGrid, PopularProjects, ProjectGroupsSection) y la grilla
// técnica (CategorySection) en una sola vista con toggle, para que el
// usuario no tenga que decidir entre 2-3 formas distintas de "explorar" que
// en el fondo llevan al mismo contenido.
export function ExplorationToggle({
  groups,
  categories,
  popularTasks,
}: {
  groups: Group[];
  categories: Category[];
  popularTasks: PopularTask[];
}) {
  const [view, setView] = useState<"proyecto" | "material">("proyecto");

  return (
    <section id="empezar" className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">Explora</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            {view === "proyecto" ? "¿Qué quieres construir?" : "Categorías técnicas"}
          </h2>
        </div>

        <div className="inline-flex rounded-full border border-border bg-white p-1">
          <button
            onClick={() => setView("proyecto")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              view === "proyecto" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            Por proyecto
          </button>
          <button
            onClick={() => setView("material")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              view === "material" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            Por material
          </button>
        </div>
      </div>

      {view === "proyecto" ? (
        <div className="grid gap-10">
          {popularTasks.length > 0 && (
            <div>
              <p className="text-xs text-ink-muted mb-3">Proyectos destacados</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {popularTasks.map((task) => (
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
            </div>
          )}

          {groups.map((group) => (
            <ProjectGroupBlock key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div>
          <p className="text-sm text-ink-muted mb-6">
            Para quien ya sabe exactamente qué necesita — navega directo por rubro técnico.
          </p>
          <CategoryGrid categories={categories} />
        </div>
      )}
    </section>
  );
}
