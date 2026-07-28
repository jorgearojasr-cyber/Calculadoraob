import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GaleriaPage() {
  const showcases = await prisma.projectShowcase.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, photosAfter: true, photosBefore: true },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-20">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h1 className="font-display text-[22px] font-semibold tracking-tight">Proyectos terminados</h1>
        <Link
          href="/galeria/nueva"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white bg-action flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Publicar el tuyo
        </Link>
      </div>
      <p className="text-sm text-ink-muted mb-8">
        Obras reales terminadas por otras personas que usaron ObraBien Calcula.
      </p>

      {showcases.length === 0 ? (
        <p className="text-sm text-ink-muted rounded-2xl p-8 bg-white border border-border text-center">
          Todavía no hay proyectos publicados. ¡Sé el primero!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showcases.map((s) => {
            const cover = s.photosAfter[0] || s.photosBefore[0];
            return (
              <Link
                key={s.id}
                href={`/galeria/${s.id}`}
                className="rounded-2xl overflow-hidden bg-white border border-border group"
              >
                <div className="relative w-full aspect-[4/3] bg-concrete overflow-hidden">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element -- URL de Vercel Blob, mismo patrón que photo-moderation-queue.tsx
                    <img
                      src={cover}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                    />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-display text-[15px] font-semibold">{s.title}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
