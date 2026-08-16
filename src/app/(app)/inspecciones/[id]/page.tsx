import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InspectionCaseHeader } from "@/components/inspecciones/inspection-case-header";
import { InspectionSpaceCard } from "@/components/inspecciones/inspection-space-card";
import { SpaceDetailView } from "@/components/inspecciones/space-detail-view";
import { PhotoUpload } from "@/components/inspecciones/photo-upload";
import { InspectionNotAvailable } from "@/components/inspecciones/inspection-not-available";
import { computeProgress, sumProgress } from "@/lib/inspecciones/progress";
import { parseKnowledgeContent } from "@/lib/inspecciones-knowledge";

export const dynamic = "force-dynamic";

// Ownership (Fase 7B, Corrección 3): sin sesión, redirige a login; con
// sesión pero sin ser el dueño del caso (o el caso no existe), se
// muestra <InspectionNotAvailable /> — mismo mensaje genérico en ambos
// casos, a propósito, para no revelar si el id existe pero pertenece a
// otro usuario. Reemplaza el `return null` (página en blanco) anterior,
// que Fase 7A marcó como mala UX de error aunque no filtraba datos.
//
// Navegación entre espacios (Fase 3): NO son sub-rutas — se resuelve con
// `?space=<id>` en esta misma URL (decisión ya documentada en el diseño
// aprobado de Fase 1/Parte 2: evita multiplicar page.tsx por cada espacio,
// y esta pantalla ya es "estado interno navegable" de una sola inspección
// persistente). Sin `space`, se ve la lista de espacios (comportamiento de
// Fase 2); con `space`, se ve el checklist de ese espacio.
export default async function InspeccionDetallePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { space?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=%2Finspecciones%2F${params.id}`);

  const insCase = await prisma.inspectionCase.findUnique({
    where: { id: params.id },
    include: {
      spaces: {
        orderBy: { order: "asc" },
        include: { elements: { include: { checks: { select: { status: true } } } } },
      },
      // Fotos "generales de la inspección" (Fase 4, punto 2) — las
      // únicas SIN ningún otro FK de nivel seteado (ver PhotoUploadContext,
      // "exactamente un nivel por foto"). `kind: "GENERAL"` las separa
      // explícitamente de la portada (Fase 11K, `kind: "COVER"`, ver abajo)
      // — antes de esta fase toda foto de nivel `case` era GENERAL, así
      // que este filtro no excluye nada de los casos ya existentes.
      photos: { where: { spaceId: null, elementId: null, observationId: null, kind: "GENERAL" }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!insCase || insCase.userId !== session.user.id) return <InspectionNotAvailable />;

  // Fase 11K — portada opcional, resuelta aparte para no mezclar su
  // ciclo de vida (reemplazo, no lista) con las fotos generales de
  // arriba. `findFirst` porque la invariante "a lo más 1 COVER" se aplica
  // en la Server Action, no en el schema.
  const coverPhoto = await prisma.inspectionPhoto.findFirst({
    where: { caseId: params.id, kind: "COVER" },
    select: { url: true },
  });

  const selectedSpaceId = searchParams.space;
  const selectedSpaceIndex = selectedSpaceId ? insCase.spaces.findIndex((s) => s.id === selectedSpaceId) : -1;

  // El id de `?space=` viene del cliente sin garantía — si no calza con
  // NINGÚN espacio de ESTE caso (ownership ya verificado arriba), se cae
  // al mismo listado de siempre en vez de intentar resolverlo suelto.
  if (selectedSpaceId && selectedSpaceIndex !== -1) {
    const space = await prisma.inspectionSpace.findUniqueOrThrow({
      where: { id: selectedSpaceId },
      include: {
        photos: { orderBy: { createdAt: "asc" } },
        elements: {
          orderBy: { order: "asc" },
          include: {
            photos: { orderBy: { createdAt: "asc" } },
            checks: {
              orderBy: { checklistItem: { order: "asc" } },
              include: {
                // Piloto Fase 5B — solo se necesita el slug para resolver
                // contra TechnicalArticle más abajo; no se trae el modelo
                // completo (no hay @relation, es una referencia libre).
                checklistItem: { select: { technicalArticleSlug: true } },
                observations: {
                  orderBy: { createdAt: "asc" },
                  include: { photos: { orderBy: { createdAt: "asc" } } },
                },
              },
            },
          },
        },
      },
    });

    const prevSpace = insCase.spaces[selectedSpaceIndex - 1] ?? null;
    const nextSpace = insCase.spaces[selectedSpaceIndex + 1] ?? null;

    // Piloto Fase 5B — technicalArticleSlug es una referencia libre (no
    // FK), así que se resuelve acá con una consulta aparte en vez de un
    // include anidado. Solo 5 preguntas del catálogo real tienen slug por
    // ahora; el resto navega con technicalArticle: null sin romper nada.
    const articleSlugs = Array.from(
      new Set(
        space.elements.flatMap((el) =>
          el.checks
            .map((c) => c.checklistItem.technicalArticleSlug)
            .filter((slug): slug is string => slug !== null)
        )
      )
    );
    const articles = articleSlugs.length
      ? await prisma.technicalArticle.findMany({
          where: { slug: { in: articleSlugs } },
          select: { slug: true, title: true, content: true },
        })
      : [];
    // Fase 11B — piloto "guía primero" (docs/FASE11A..., sección 7): se
    // parsean acá también queRevisar/comoRevisarlo/condicionesCorrectas/
    // senalesDeProblema para armar el bloque de guía; comoRevisarlo y
    // senalesDeProblema solo existen hoy en los 2 artículos de Piso, en
    // el resto quedan en null y no cambia nada.
    const articleBySlug = new Map(
      articles.map((a) => [a.slug, { title: a.title, content: a.content, ...parseKnowledgeContent(a.content) }])
    );

    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <SpaceDetailView
          caseId={insCase.id}
          spaceId={space.id}
          spaceName={space.name}
          spacePhotos={space.photos.map((p) => ({ id: p.id, url: p.url }))}
          elements={space.elements.map((el) => ({
            id: el.id,
            name: el.name,
            photos: el.photos.map((p) => ({ id: p.id, url: p.url })),
            checks: el.checks.map((c) => ({
              id: c.id,
              questionSnapshot: c.questionSnapshot,
              status: c.status,
              notApplicableReason: c.notApplicableReason,
              technicalArticle: c.checklistItem.technicalArticleSlug
                ? articleBySlug.get(c.checklistItem.technicalArticleSlug) ?? null
                : null,
              observations: c.observations.map((o) => ({
                id: o.id,
                comment: o.comment,
                severity: o.severity,
                recommendation: o.recommendation,
                status: o.status,
                photos: o.photos.map((p) => ({ id: p.id, url: p.url })),
              })),
            })),
          }))}
          prev={prevSpace ? { id: prevSpace.id, name: prevSpace.name } : null}
          next={nextSpace ? { id: nextSpace.id, name: nextSpace.name } : null}
        />
      </div>
    );
  }

  const spaceProgresses = insCase.spaces.map((space) => ({
    id: space.id,
    name: space.name,
    progress: computeProgress(space.elements.flatMap((el) => el.checks.map((c) => c.status))),
  }));
  const totalChecks = spaceProgresses.reduce((acc, s) => acc + s.progress.total, 0);
  const overallProgress = totalChecks > 0 ? sumProgress(spaceProgresses.map((s) => s.progress)) : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 grid gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href="/inspecciones" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink w-fit">
          <ArrowLeft className="w-4 h-4" />
          Mis inspecciones
        </Link>
        {/* Fase 8 — punto de entrada al resumen profesional; solo visible
            una vez que hay algo que resumir. */}
        {totalChecks > 0 && (
          <Link
            href={`/inspecciones/${insCase.id}/resumen`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-safety w-fit"
          >
            Ver resumen
          </Link>
        )}
      </div>

      <InspectionCaseHeader
        caseId={insCase.id}
        name={insCase.name}
        tipoInmueble={insCase.tipoInmueble}
        direccion={insCase.direccion}
        estado={insCase.estado}
        progress={overallProgress}
        coverPhotoUrl={coverPhoto?.url ?? null}
      />

      <div className="rounded-2xl p-5 bg-white border border-border">
        <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">Fotos generales</p>
        <PhotoUpload
          caseId={insCase.id}
          context={{ level: "case" }}
          initialPhotos={insCase.photos.map((p) => ({ id: p.id, url: p.url }))}
        />
      </div>

      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">Espacios</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {spaceProgresses.map((space) => (
            <InspectionSpaceCard
              key={space.id}
              href={`/inspecciones/${insCase.id}?space=${space.id}`}
              name={space.name}
              progress={space.progress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
