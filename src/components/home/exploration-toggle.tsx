"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Category, ProjectGroup, ProjectTask } from "@/generated/prisma/client";
import { GroupCard } from "./group-card";
import { GroupChip } from "./group-chip";
import { CategoryGrid } from "./category-grid";
import { getGroupIconClasses } from "@/lib/group-colors";

// Foto real por tarea destacada — mismo set que CURATED_TASK_SLUGS en
// exploration-section.tsx. Si una tarea no tiene foto en el mapa, la tarjeta
// cae de vuelta al layout de solo texto (sin romper si se agrega una tarea
// curada nueva sin foto todavía).
const TASK_IMAGES: Record<string, string> = {
  "cambiar-o-instalar-un-wc": "/images/categorias/wc.png",
  "instalar-un-enchufe-reemplazo": "/images/categorias/enchufe.png",
  "construir-un-radier": "/images/categorias/radier.png",
  "pintar-una-habitacion": "/images/categorias/pintar-muro.png",
  "instalar-ceramica": "/images/categorias/ceramica.png",
  "construir-una-piscina": "/images/categorias/piscina.png",
};

// Excepciones de destino: "Construir una piscina" tiene 2 formas
// (Rectangular/Circular) sin una foto/módulo único que represente a
// "piscina en general" — en vez de /empezar/[slug] (que ahora redirige
// directo al plan de 3 fases), esta tarjeta lleva al selector de forma con
// fotos que ya vive en /grupos/piscinas (el grupo "Piscinas" solo tiene
// esta tarea, así que esa página ES el selector, sin nada más alrededor).
const TASK_HREF_OVERRIDES: Record<string, string> = {
  "construir-una-piscina": "/grupos/piscinas",
};

type PopularTask = ProjectTask & { group: { name: string; slug: string } };
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
  const searchParams = useSearchParams();
  const initialView = searchParams.get("vista") === "material" ? "material" : "proyecto";
  const [view, setView] = useState<"proyecto" | "material">(initialView);

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
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap">
            {groups.map((group) => (
              <GroupChip key={group.id} slug={group.slug} name={group.name} icon={group.icon} />
            ))}
          </div>

          {popularTasks.length > 0 && (
            <div>
              <p className="text-xs text-ink-muted mb-3">Proyectos más buscados</p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {popularTasks.map((task) => {
                  const image = TASK_IMAGES[task.slug];
                  return (
                    <Link
                      key={task.id}
                      href={TASK_HREF_OVERRIDES[task.slug] ?? `/empezar/${task.slug}`}
                      className="group rounded-2xl overflow-hidden bg-white border border-border hover:border-safety/40 hover:-translate-y-0.5 transition-all"
                    >
                      {image && (
                        <div className="relative w-full aspect-[4/3] bg-concrete">
                          <Image
                            src={image}
                            alt={task.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 20vw"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <span
                          className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full mb-2 ${getGroupIconClasses(task.group.slug)}`}
                        >
                          {task.group.name}
                        </span>
                        <p className="font-semibold text-sm">{task.name}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-ink-muted mb-3">Todas las categorías</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </div>
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
