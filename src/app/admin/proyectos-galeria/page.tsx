import { prisma } from "@/lib/prisma";
import { ShowcaseModerationQueue } from "@/components/admin/showcase-moderation-queue";

export const dynamic = "force-dynamic";

export default async function AdminProyectosGaleriaPage() {
  const showcases = await prisma.projectShowcase.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-2">
        Proyectos de la galería pendientes
      </h1>
      <p className="text-xs text-ink-muted mb-6">
        Publicaciones completas (título, relato, fotos antes/después) enviadas a /galeria/nueva. Ninguna se
        muestra públicamente hasta que la apruebes aquí.
      </p>

      <ShowcaseModerationQueue
        showcases={showcases.map((s) => ({
          id: s.id,
          title: s.title,
          story: s.story,
          coverUrl: s.photosAfter[0] || s.photosBefore[0] || null,
          uploaderLabel: s.user.name || s.user.email,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
