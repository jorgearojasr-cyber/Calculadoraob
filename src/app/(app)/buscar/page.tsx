import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LayoutGrid, SearchX } from "lucide-react";
import { searchContent } from "@/lib/search";
import { ProjectCard } from "@/components/project-card";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q ?? "").trim();

  if (!query) redirect("/");

  const results = await searchContent(query);

  // Coincidencia inequívoca: salta directo al resultado en vez de mostrar
  // una lista de un solo elemento.
  if (results.length === 1) redirect(results[0].href);

  return (
    <div className="max-w-3xl mx-auto px-6 pt-8 pb-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      <h1 className="font-display text-2xl font-semibold tracking-tight mt-6 mb-1">
        Resultados para &quot;{query}&quot;
      </h1>

      {results.length === 0 ? (
        <div className="mt-8 rounded-2xl p-10 text-center bg-white border border-border">
          <SearchX className="w-8 h-8 mx-auto mb-3 text-ink-faint" />
          <p className="text-ink-muted mb-4">
            No encontramos nada para &quot;{query}&quot;, prueba con otro término o explora las categorías.
          </p>
          <Link
            href="/#categorias"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-ink"
          >
            <LayoutGrid className="w-4 h-4" />
            Ver todas las categorías
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-muted mb-6">
            {results.length} resultado{results.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) =>
              result.type === "category" ? (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  className="group relative text-left rounded-2xl p-5 transition-all hover:-translate-y-0.5 bg-white border border-border hover:border-safety/40"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium mb-1.5 text-safety">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Categoría
                  </div>
                  <h3 className="font-semibold text-[15px] mb-1">{result.name}</h3>
                  <p className="text-xs text-ink-muted">{result.description}</p>
                </Link>
              ) : (
                <ProjectCard
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  title={result.name}
                  categoryLabel={result.categoryName}
                  imageUrl={result.imageUrl}
                  stepCount={result.stepCount}
                />
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
