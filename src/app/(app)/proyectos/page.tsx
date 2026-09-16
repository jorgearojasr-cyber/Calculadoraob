import Link from "next/link";
import type { Metadata } from "next";
import { Calculator, MapIcon, ShoppingCart } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCategoryIcon } from "@/lib/category-icons";
import { ProjectCard } from "@/components/proyectos/project-card";
import { summarizePersistedResult } from "@/lib/project-summary";
import { projectDateLabel } from "@/lib/project-date-label";
import type { CalculateModuleResult } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";

// Preparación para dominio propio — datos privados del usuario
// (SavedProject), nunca deben indexarse. robots.ts ya bloquea /proyectos
// para crawlers; este noindex es defensa en profundidad (sección 20 del
// pedido), sin cambiar auth ni la lógica de la página.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Design Spec v1.0, Parte 6 (Mis proyectos) — catálogo real de SavedProject
// del usuario. Ordenado por `updatedAt` (más reciente primero): a
// diferencia de `createdAt`, refleja también renombrar/ajustar avance/
// marcar lista de compras — responde mejor "¿cuál fue el último que
// trabajé?" que el orden de creación. Sin tabs (Activos/Completados/
// Favoritos): el modelo no tiene ningún campo de estado o favorito real
// para clasificar — se investigó explícitamente antes de esta fase, ver
// reporte de arquitectura.
export default async function ProyectosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const projects = await prisma.savedProject.findMany({
    where: { userId: session.user.id },
    include: { module: { include: { category: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-10 pt-6 pb-16">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2 text-ds-orange-600">Proyectos</p>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-ds-navy-900">
            Mis proyectos
          </h1>
          <p className="font-body text-sm text-ds-text-secondary">
            Tus cálculos y proyectos guardados en un solo lugar.
          </p>
        </div>
        {projects.length > 0 && (
          <Link
            href="/lista-compras"
            className="hidden sm:inline-flex items-center gap-1.5 font-body text-sm font-semibold text-ds-navy-900 border-[1.5px] border-ds-border hover:border-ds-navy-900/40 rounded-xl px-4 shrink-0 transition-colors"
            style={{ height: 40 }}
          >
            <ShoppingCart className="w-4 h-4" />
            Lista de compras
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-ds-card p-8 bg-white border border-ds-border text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-ds-muted mx-auto mb-4">
            <Calculator className="w-6 h-6 text-ds-text-tertiary" />
          </div>
          <p className="font-display text-lg font-bold text-ds-navy-900 mb-1.5">Aún no tienes proyectos guardados.</p>
          <p className="font-body text-sm text-ds-text-secondary mb-6 max-w-sm mx-auto">
            Cuando guardes un cálculo aparecerá aquí para que puedas volver a revisarlo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/calculadoras"
              className="inline-flex items-center gap-2 rounded-xl px-6 font-body text-[15px] font-bold text-white bg-ds-orange-600 hover:bg-ds-orange-700 active:scale-[0.98] transition-all"
              style={{ height: 48 }}
            >
              <Calculator className="w-4 h-4" />
              Explorar calculadoras
            </Link>
            <Link
              href="/planificar"
              className="inline-flex items-center gap-2 rounded-xl px-6 font-body text-[15px] font-semibold text-ds-navy-900 border-[1.5px] border-ds-border hover:border-ds-navy-900/40 transition-colors"
              style={{ height: 48 }}
            >
              <MapIcon className="w-4 h-4" />
              Planificar un proyecto
            </Link>
          </div>
        </div>
      ) : (
        <>
          <Link
            href="/lista-compras"
            className="sm:hidden inline-flex items-center gap-1.5 font-body text-sm font-semibold text-ds-navy-900 border-[1.5px] border-ds-border rounded-xl px-4 mb-4"
            style={{ height: 40 }}
          >
            <ShoppingCart className="w-4 h-4" />
            Lista de compras
          </Link>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((project) => {
              const Icon = getCategoryIcon(project.module.category.icon);
              const result = project.result as unknown as CalculateModuleResult;
              return (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  categoryName={project.module.category.name}
                  moduleName={project.module.name}
                  dateLabel={projectDateLabel(project.createdAt, project.updatedAt)}
                  resultSummary={summarizePersistedResult(result?.results)}
                  progressPercent={project.progressPercent}
                  inShoppingList={project.inShoppingList}
                  Icon={Icon}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
