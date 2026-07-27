import { prisma } from "@/lib/prisma";
import { PhotoModerationQueue } from "@/components/admin/photo-moderation-queue";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const photos = await prisma.projectPhoto.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { email: true, name: true } }, module: { select: { name: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-2">Fotos pendientes</h1>
      <p className="text-xs text-ink-muted mb-6">
        Fotos subidas por usuarios tras guardar un proyecto. Ninguna se muestra públicamente hasta que la
        apruebes aquí.
      </p>

      <PhotoModerationQueue
        photos={photos.map((p) => ({
          id: p.id,
          url: p.url,
          moduleName: p.module.name,
          uploaderLabel: p.user.name || p.user.email,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
