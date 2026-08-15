import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InspectionNotAvailable } from "@/components/inspecciones/inspection-not-available";
import { ResumenResultadoGlobal, type ResultadoGlobal, type SeverityCounts } from "@/components/inspecciones/resumen-resultado-global";
import { ResumenCompletitudBanner } from "@/components/inspecciones/resumen-completitud-banner";
import { ResumenEspacioCard } from "@/components/inspecciones/resumen-espacio-card";
import { ResumenHallazgoCard, type ResumenHallazgo } from "@/components/inspecciones/resumen-hallazgo-card";
import { ResumenPendientes, type ResumenPendiente } from "@/components/inspecciones/resumen-pendientes";
import { ResumenFotos, type ResumenFotoGrupo } from "@/components/inspecciones/resumen-fotos";
import { ResumenAutoBlock } from "@/components/inspecciones/resumen-auto-block";
import { computeProgress } from "@/lib/inspecciones/progress";
import type { InspectionPropertyType, InspectionCaseStatus, InspectionSeverity } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const PROPERTY_TYPE_LABELS: Record<InspectionPropertyType, string> = {
  CASA: "Casa",
  DEPARTAMENTO: "Departamento",
  AMPLIACION: "Ampliación",
};

const STATUS_LABELS: Record<InspectionCaseStatus, string> = {
  DRAFT: "Borrador",
  IN_PROGRESS: "En curso",
  CLOSED: "Cerrada",
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric" });

// Fase 8 — Resumen profesional de una inspección. Vista de SOLO
// LECTURA: no persiste ningún "resumen" en base de datos, todo se
// deriva en cada carga a partir de InspectionCase -> ... -> InspectionPhoto
// (mismo criterio ya usado por computeProgress/sumProgress, ver
// docs/... — un resumen guardado aparte se desincroniza apenas cambia un
// check; uno derivado nunca puede quedar desactualizado).
//
// Ownership: mismo patrón exacto que [id]/page.tsx — sin sesión,
// redirige a login; sin ser el dueño (o el caso no existe), muestra
// <InspectionNotAvailable /> con el mismo mensaje genérico, sin revelar
// si el id existe.
export default async function InspeccionResumenPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=%2Finspecciones%2F${params.id}%2Fresumen`);

  const insCase = await prisma.inspectionCase.findUnique({
    where: { id: params.id },
    include: {
      photos: { where: { spaceId: null, elementId: null, observationId: null }, orderBy: { createdAt: "asc" } },
      spaces: {
        orderBy: { order: "asc" },
        include: {
          photos: { orderBy: { createdAt: "asc" } },
          elements: {
            orderBy: { order: "asc" },
            include: {
              photos: { orderBy: { createdAt: "asc" } },
              checks: {
                orderBy: { checklistItem: { order: "asc" } },
                include: {
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
      },
    },
  });
  if (!insCase || insCase.userId !== session.user.id) return <InspectionNotAvailable />;

  // Misma resolución de TechnicalArticle vía slug libre (no FK) que
  // [id]/page.tsx — una sola consulta por los slugs distintos presentes
  // en TODO el caso, no una por pregunta.
  const articleSlugs = Array.from(
    new Set(
      insCase.spaces.flatMap((s) =>
        s.elements.flatMap((el) =>
          el.checks.map((c) => c.checklistItem.technicalArticleSlug).filter((slug): slug is string => slug !== null)
        )
      )
    )
  );
  const articles = articleSlugs.length
    ? await prisma.technicalArticle.findMany({ where: { slug: { in: articleSlugs } }, select: { slug: true, title: true, content: true } })
    : [];
  const articleBySlug = new Map(articles.map((a) => [a.slug, { title: a.title, content: a.content }]));

  const allChecks = insCase.spaces.flatMap((s) => s.elements.flatMap((el) => el.checks));

  const resultado: ResultadoGlobal = {
    ok: allChecks.filter((c) => c.status === "OK").length,
    observation: allChecks.filter((c) => c.status === "OBSERVATION").length,
    notApplicable: allChecks.filter((c) => c.status === "NOT_APPLICABLE").length,
    pending: allChecks.filter((c) => c.status === null).length,
    total: allChecks.length,
  };

  const severityCounts: SeverityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const hallazgos: ResumenHallazgo[] = [];
  for (const space of insCase.spaces) {
    for (const element of space.elements) {
      for (const check of element.checks) {
        const technicalArticle = check.checklistItem.technicalArticleSlug
          ? articleBySlug.get(check.checklistItem.technicalArticleSlug) ?? null
          : null;
        for (const obs of check.observations) {
          // Fase 10N — la severidad del resultado global cuenta SOLO
          // hallazgos vigentes (check.status === "OBSERVATION"), misma
          // definición ya establecida en Fase 7B/8/9B — un hallazgo
          // histórico (check vuelto a OK/No aplica) no debe inflar este
          // conteo, aunque sigue intacto y visible en su propia sección
          // más abajo.
          if (check.status === "OBSERVATION") {
            severityCounts[obs.severity as InspectionSeverity] += 1;
          }
          hallazgos.push({
            id: obs.id,
            spaceName: space.name,
            elementName: element.name,
            question: check.questionSnapshot,
            comment: obs.comment,
            severity: obs.severity,
            recommendation: obs.recommendation,
            photos: obs.photos.map((p) => ({ id: p.id, url: p.url })),
            vigente: check.status === "OBSERVATION",
            technicalArticle,
          });
        }
      }
    }
  }
  const hallazgosVigentes = hallazgos.filter((h) => h.vigente);
  const hallazgosHistoricos = hallazgos.filter((h) => !h.vigente);

  const pendientes: ResumenPendiente[] = [];
  for (const space of insCase.spaces) {
    for (const element of space.elements) {
      for (const check of element.checks) {
        if (check.status !== null) continue;
        pendientes.push({
          id: check.id,
          spaceId: space.id,
          spaceName: space.name,
          elementName: element.name,
          question: check.questionSnapshot,
          technicalArticle: check.checklistItem.technicalArticleSlug
            ? articleBySlug.get(check.checklistItem.technicalArticleSlug) ?? null
            : null,
        });
      }
    }
  }

  const fotoGrupos: ResumenFotoGrupo[] = [
    { label: "Generales de la inspección", photos: insCase.photos.map((p) => ({ id: p.id, url: p.url })) },
    ...insCase.spaces
      .filter((s) => s.photos.length > 0)
      .map((s) => ({ label: s.name, photos: s.photos.map((p) => ({ id: p.id, url: p.url })) })),
    ...insCase.spaces.flatMap((s) =>
      s.elements
        .filter((el) => el.photos.length > 0)
        .map((el) => ({ label: `${s.name} — ${el.name}`, photos: el.photos.map((p) => ({ id: p.id, url: p.url })) }))
    ),
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 grid gap-5">
      <Link
        href={`/inspecciones/${insCase.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la inspección
      </Link>

      {/* Fase 9B — descarga del informe PDF, derivado de los mismos
          datos que este resumen web (sin persistencia adicional, ver
          src/lib/inspecciones-report.ts). Dos variantes según la
          especificación de Fase 9A. */}
      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/inspecciones/${insCase.id}/pdf/resumen`}
          target="_blank"
          className="min-h-11 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white bg-ink"
        >
          Descargar resumen (PDF)
        </a>
        <a
          href={`/api/inspecciones/${insCase.id}/pdf/detallado`}
          target="_blank"
          className="min-h-11 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-ink border border-ink"
        >
          Descargar informe detallado (PDF)
        </a>
      </div>

      {/* A. Información general (Fase 8, sección 3) — solo campos que
          InspectionCase realmente almacena hoy. `estado` se muestra tal
          cual viene de la BD (hoy siempre "Borrador": ningún flujo lo
          transiciona todavía — ver informe Fase 8, sección C) y NO se usa
          como indicador de completitud; para eso está
          <ResumenCompletitudBanner />, derivado de los checks reales. */}
      <div className="rounded-2xl p-6 bg-white border border-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl font-semibold tracking-tight">{insCase.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-concrete text-ink-muted">
                {STATUS_LABELS[insCase.estado]}
              </span>
            </div>
            <p className="text-sm text-ink-muted mt-1">{PROPERTY_TYPE_LABELS[insCase.tipoInmueble]}</p>
            {insCase.direccion && (
              <p className="text-sm text-ink-muted mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {insCase.direccion}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">Fecha</p>
            <p className="font-medium mt-0.5">{insCase.fecha ? dateFormatter.format(insCase.fecha) : "No registrada"}</p>
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">Espacios</p>
            <p className="font-medium mt-0.5">{insCase.spaces.length}</p>
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">Puntos revisados</p>
            <p className="font-medium mt-0.5">{resultado.total}</p>
          </div>
          {(insCase.bedroomCount !== null || insCase.bathroomCount !== null) && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">Dormitorios / Baños</p>
              <p className="font-medium mt-0.5">
                {insCase.bedroomCount ?? "—"} / {insCase.bathroomCount ?? "—"}
              </p>
            </div>
          )}
        </div>

        {insCase.observacionesGenerales && (
          <p className="mt-4 pt-4 border-t border-border text-sm text-ink-muted">{insCase.observacionesGenerales}</p>
        )}
      </div>

      {/* B. Completitud (Fase 8, sección 12) */}
      <ResumenCompletitudBanner pending={resultado.pending} total={resultado.total} />

      {/* C. Resultado global + severidades (Fase 8, secciones 4/5) — datos
          objetivos, calculados por código. */}
      {/* Fase 10N — `totalObservations` ahora refleja solo vigentes (antes
          contaba también históricas), consistente con `severityCounts`:
          si todos los hallazgos fueron revertidos, este bloque
          directamente no se muestra (ver `totalObservations > 0` dentro
          de ResumenResultadoGlobal), en vez de mostrar "Severidad (2)"
          con las 4 categorías en 0. */}
      <ResumenResultadoGlobal resultado={resultado} severityCounts={severityCounts} totalObservations={hallazgosVigentes.length} />

      {/* Fase 10B — texto compuesto automáticamente a partir de los datos
          reales del caso (sin ningún servicio externo), deliberadamente
          separado del bloque anterior para no mezclar datos objetivos
          con texto generado. Bajo demanda, nada se persiste en
          InspectionCase. */}
      <ResumenAutoBlock caseId={insCase.id} />

      {/* D. Resumen por espacio (Fase 8, sección 6) */}
      {insCase.spaces.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">Espacios</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {insCase.spaces.map((space) => {
              const checks = space.elements.flatMap((el) => el.checks);
              return (
                <ResumenEspacioCard
                  key={space.id}
                  caseId={insCase.id}
                  spaceId={space.id}
                  name={space.name}
                  progress={computeProgress(checks.map((c) => c.status))}
                  resultado={{
                    ok: checks.filter((c) => c.status === "OK").length,
                    observation: checks.filter((c) => c.status === "OBSERVATION").length,
                    notApplicable: checks.filter((c) => c.status === "NOT_APPLICABLE").length,
                    pending: checks.filter((c) => c.status === null).length,
                    total: checks.length,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* E. Puntos pendientes (Fase 8, sección 11) */}
      <ResumenPendientes caseId={insCase.id} pendientes={pendientes} />

      {/* F. Observaciones — vigentes primero, luego históricas (Fase 8,
          secciones 7/19) — misma lógica de vigencia que Fase 7B. */}
      {hallazgosVigentes.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
            Hallazgos vigentes ({hallazgosVigentes.length})
          </p>
          <div className="grid gap-3">
            {hallazgosVigentes.map((h) => (
              <ResumenHallazgoCard key={h.id} hallazgo={h} />
            ))}
          </div>
        </div>
      )}

      {hallazgosHistoricos.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
            Hallazgos anteriores — no vigentes ({hallazgosHistoricos.length})
          </p>
          <div className="grid gap-3">
            {hallazgosHistoricos.map((h) => (
              <ResumenHallazgoCard key={h.id} hallazgo={h} />
            ))}
          </div>
        </div>
      )}

      {/* G. Fotografías generales / de espacio / de elemento (Fase 8,
          sección 8) — las de observación ya se muestran arriba, junto a
          cada hallazgo. */}
      <ResumenFotos grupos={fotoGrupos} />
    </div>
  );
}
