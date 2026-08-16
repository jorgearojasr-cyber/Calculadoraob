import Link from "next/link";
import { Plus } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InspectionEmptyState } from "@/components/inspecciones/inspection-empty-state";
import { InspectionList, type InspectionListItem } from "@/components/inspecciones/inspection-list";
import { computeProgress, sumProgress } from "@/lib/inspecciones/progress";

export const dynamic = "force-dynamic";

// "Mis inspecciones" — mismo patrón de sesión y estructura de página que
// /proyectos (ProyectosPage): redirige a login (igual que el resto del
// módulo Inspecciones) en vez de una pantalla en blanco, porque esta es
// la puerta de entrada del módulo, no un detalle privado individual.
export default async function InspeccionesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Finspecciones");

  const cases = await prisma.inspectionCase.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      spaces: { include: { elements: { include: { checks: { select: { status: true } } } } } },
      // Fase 11K (docs/FASE11J..., sección E) — a lo más 1 fila por caso
      // (invariante aplicada en la Server Action), `take: 1` es solo una
      // salvaguarda defensiva adicional, no la fuente de la invariante.
      photos: { where: { kind: "COVER" }, select: { url: true }, take: 1 },
    },
  });

  const items: InspectionListItem[] = cases.map((c) => {
    const spaceProgresses = c.spaces.map((space) =>
      computeProgress(space.elements.flatMap((el) => el.checks.map((check) => check.status)))
    );
    const total = spaceProgresses.reduce((acc, p) => acc + p.total, 0);
    return {
      id: c.id,
      name: c.name,
      tipoInmueble: c.tipoInmueble,
      direccion: c.direccion,
      fecha: c.fecha,
      createdAt: c.createdAt,
      estado: c.estado,
      progress: total > 0 ? sumProgress(spaceProgresses) : null,
      coverPhotoUrl: c.photos[0]?.url ?? null,
    };
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8 gap-4">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Mis inspecciones</h1>
        {items.length > 0 && (
          <Link
            href="/inspecciones/nueva"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white bg-action flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nueva
          </Link>
        )}
      </div>

      {items.length === 0 ? <InspectionEmptyState /> : <InspectionList items={items} />}
    </div>
  );
}
