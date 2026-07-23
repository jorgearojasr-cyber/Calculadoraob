import Link from "next/link";
import { ArrowLeft, Gauge } from "lucide-react";
import { prisma } from "@/lib/prisma";

// Índice de las guías prácticas ya redactadas (ModuleGuide) — navegable sin
// pasar por el asistente de cálculo. Solo lista módulos que realmente
// tienen guía, no todo el catálogo.
export default async function GuiasPage() {
  const guides = await prisma.moduleGuide.findMany({
    include: { module: { include: { category: true } } },
    orderBy: { module: { name: "asc" } },
  });

  return (
    <div className="max-w-4xl mx-auto px-6 pt-8 pb-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6">
        <ArrowLeft className="w-4 h-4" />
        Inicio
      </Link>

      <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">Guías y consejos</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Aprende antes de construir</h1>
      <p className="text-ink-muted mb-8">
        Consejos prácticos, errores comunes y experiencia de obra para los proyectos que ya tienen guía completa.
      </p>

      {guides.length === 0 ? (
        <div className="rounded-2xl p-10 text-center bg-white border border-border">
          <p className="text-ink-muted">Todavía no hay guías publicadas.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guias/${guide.module.slug}`}
              className="rounded-2xl p-5 bg-white border border-border hover:border-safety/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="font-semibold text-[15px]">{guide.module.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-ink-muted shrink-0">
                  <Gauge className="w-3.5 h-3.5" />
                  {guide.difficulty}
                </span>
              </div>
              <p className="text-xs text-ink-faint mb-2">{guide.module.category.name}</p>
              <p className="text-sm text-ink-muted line-clamp-2">{guide.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
