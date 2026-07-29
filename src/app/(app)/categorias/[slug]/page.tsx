import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCategoryIcon } from "@/lib/category-icons";

export const revalidate = 3600;

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  // Los módulos de "Cálculos especiales" (ProjectGroup herramientas-avanzadas)
  // ya se sacaron de la exploración de Home, pero "Por material" listaba
  // TODOS los módulos publicados de la categoría sin ese filtro — mismos
  // 17 módulos (Escalera, Fundación, etc.) seguían apareciendo completos
  // acá. Se excluyen acá también, con el mismo criterio.
  const advancedGroup = await prisma.projectGroup.findUnique({
    where: { slug: "herramientas-avanzadas" },
    include: { tasks: { include: { moduleLinks: { select: { moduleId: true } } } } },
  });
  const advancedModuleIds = new Set<string>();
  if (advancedGroup) {
    for (const task of advancedGroup.tasks) {
      for (const link of task.moduleLinks) advancedModuleIds.add(link.moduleId);
    }
  }

  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: { modules: { where: { published: true }, orderBy: { name: "asc" } } },
  });

  if (!category) notFound();

  const visibleModules = category.modules.filter((m) => !advancedModuleIds.has(m.id));
  const hiddenAdvancedCount = category.modules.length - visibleModules.length;
  // Categorías donde TODOS los módulos son de Cálculos especiales (ej. Acero y
  // Enfierradura, Excavaciones) quedarían vacías con el filtro — en vez de
  // ocultarlas del todo (nadie que busque "fierro" o "excavación"
  // encontraría nada), se dejan visibles con un link directo al grupo.
  const onlyHasAdvanced = visibleModules.length === 0 && hiddenAdvancedCount > 0;

  const Icon = getCategoryIcon(category.icon);

  return (
    <div>
      <header className="max-w-6xl mx-auto px-6 pt-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-8 pb-16">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-navy/[0.07]">
            <Icon className="w-7 h-7 text-navy" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{category.name}</h1>
            <p className="text-sm text-ink-muted">{category.description}</p>
          </div>
        </div>

        {onlyHasAdvanced ? (
          <div className="rounded-2xl p-10 text-center bg-white border border-border">
            <p className="text-ink-muted mb-3">
              Estos cálculos están en Cálculos especiales — piezas puntuales de un proyecto, no el diseño estructural
              completo.
            </p>
            <Link
              href="/grupos/herramientas-avanzadas"
              className="inline-flex items-center gap-1 text-sm font-medium text-safety hover:underline"
            >
              Ver Cálculos especiales
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : visibleModules.length === 0 ? (
          <div className="rounded-2xl p-10 text-center bg-white border border-border">
            <p className="text-ink-muted">
              Todavía no hay calculadoras publicadas en esta categoría. Vuelve pronto.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleModules.map((mod) => (
                <Link
                  key={mod.id}
                  href={`/categorias/${category.slug}/${mod.slug}`}
                  className="group relative text-left rounded-2xl p-5 transition-all hover:-translate-y-0.5 bg-white border border-border hover:border-safety/40"
                >
                  <h3 className="font-semibold text-[15px] mb-1">{mod.name}</h3>
                  <p className="text-xs text-ink-muted">{mod.description}</p>
                  <ChevronRight className="w-4 h-4 absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity text-safety" />
                </Link>
              ))}
            </div>
            {hiddenAdvancedCount > 0 && (
              <Link
                href="/grupos/herramientas-avanzadas"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
              >
                +{hiddenAdvancedCount} {hiddenAdvancedCount === 1 ? "cálculo más" : "cálculos más"} en Cálculos
                especiales
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </>
        )}
      </section>
    </div>
  );
}
