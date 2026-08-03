"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Category, ProjectGroup, ProjectTask } from "@/generated/prisma/client";
import { GroupCard } from "./group-card";
import { GroupChip } from "./group-chip";
import { CategoryGrid } from "./category-grid";
import { RegularizationFeaturedCard } from "./regularization-featured-card";

type Group = ProjectGroup & { tasks: ProjectTask[] };

// Fusiona lo que antes eran 3 secciones separadas de la Home
// (CategoryOverviewGrid, PopularProjects, ProjectGroupsSection) y la grilla
// técnica (CategorySection) en una sola vista con toggle, para que el
// usuario no tenga que decidir entre 2-3 formas distintas de "explorar" que
// en el fondo llevan al mismo contenido.
//
// "Proyectos más buscados" se mudó al carrusel dentro del Hero
// (rediseño de Home 2026-08-05, ver PopularTasksCarousel) — ya no vive
// acá, así que este componente dejó de recibir/mostrar popularTasks.
export function ExplorationToggle({
  groups,
  categories,
}: {
  groups: Group[];
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const initialView = searchParams.get("vista") === "material" ? "material" : "proyecto";
  const [view, setView] = useState<"proyecto" | "material">(initialView);

  return (
    <section
      id="empezar"
      // scroll-mt compensa el header fijo (MobileTopBar h-14=56px /
      // TopNav desktop ~73.5px) — sin esto, un link a "/#empezar" desde
      // otra página deja el título tapado detrás del header (BUG-001,
      // auditoría funcional 02-ago-2026).
      className="bg-white border-t border-dashed border-[#D8DEE8] px-4 sm:px-10 py-[18px] sm:py-[30px] pb-6 sm:pb-10 flex flex-col gap-3 sm:gap-4 scroll-mt-16 md:scroll-mt-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2
          className="text-[19px] sm:text-2xl font-bold text-[#10203A]"
          style={{ letterSpacing: "-0.02em" }}
        >
          {view === "proyecto" ? "¿Qué quieres construir?" : "Categorías técnicas"}
        </h2>

        <div className="inline-flex rounded-full border border-[#E4E8EF] bg-white p-1">
          <button
            onClick={() => setView("proyecto")}
            className={`h-11 sm:h-9 flex items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors ${
              view === "proyecto" ? "bg-[#002152] text-white" : "text-[#5B6577] hover:text-[#10203A]"
            }`}
          >
            Por proyecto
          </button>
          <button
            onClick={() => setView("material")}
            className={`h-11 sm:h-9 flex items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors ${
              view === "material" ? "bg-[#002152] text-white" : "text-[#5B6577] hover:text-[#10203A]"
            }`}
          >
            Por material
          </button>
        </div>
      </div>

      {view === "proyecto" ? (
        <div className="grid gap-8 sm:gap-10">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:flex-wrap">
            {groups.map((group) => (
              <GroupChip key={group.id} slug={group.slug} name={group.name} icon={group.icon} />
            ))}
          </div>

          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[10px] sm:gap-[14px]">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-[#5B6577] mb-6">
            Para quien ya sabe exactamente qué necesita — navega directo por rubro técnico.
          </p>
          <CategoryGrid categories={categories} />
        </div>
      )}

      <div className="mt-3 sm:mt-[14px]">
        <RegularizationFeaturedCard />
      </div>
    </section>
  );
}
