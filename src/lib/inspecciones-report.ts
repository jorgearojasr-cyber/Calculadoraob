import { prisma } from "@/lib/prisma";
import type { InspectionPropertyType, InspectionCaseStatus, InspectionSeverity, InspectionAnswerStatus } from "@/generated/prisma/client";

// Fase 9B — modelo de presentación NORMALIZADO, derivado en un solo
// lugar desde InspectionCase (fuente de verdad, ver Fase 9A sección A/D)
// y reutilizado tanto por el informe PDF resumido como el detallado
// (`/api/inspecciones/[id]/pdf/resumen` y `/detallado`), evitando
// duplicar la lógica de derivación entre ambos (regla explícita de Fase
// 9B, punto 3). No se persiste nada nuevo — se recalcula en cada
// llamada, mismo criterio que `/inspecciones/[id]/resumen` (Fase 8).

export type ReportPhoto = { id: string; url: string };

export type ReportHallazgo = {
  id: string;
  spaceName: string;
  elementName: string;
  question: string;
  comment: string;
  severity: InspectionSeverity;
  recommendation: string | null;
  photos: ReportPhoto[];
  vigente: boolean;
  technicalArticleTitle: string | null;
};

export type ReportPendiente = {
  id: string;
  spaceName: string;
  elementName: string;
  question: string;
};

export type ReportCheckLine = { id: string; question: string; status: InspectionAnswerStatus | null };

export type ReportElement = {
  id: string;
  name: string;
  checks: ReportCheckLine[];
  photos: ReportPhoto[];
};

export type ReportCounts = { ok: number; observation: number; notApplicable: number; pending: number; total: number };

export type ReportSpace = {
  id: string;
  name: string;
  counts: ReportCounts;
  photos: ReportPhoto[];
  elements: ReportElement[];
};

export type SeverityCounts = Record<InspectionSeverity, number>;

export type InspectionReportData = {
  caseId: string;
  name: string;
  tipoInmueble: InspectionPropertyType;
  direccion: string | null;
  fecha: Date | null;
  estado: InspectionCaseStatus;
  bedroomCount: number | null;
  bathroomCount: number | null;
  observacionesGenerales: string | null;
  ownerLabel: string;
  generatedAt: Date;
  resultado: ReportCounts;
  // Solo hallazgos VIGENTES — mostrar severidad histórica en el resumen
  // ejecutivo confundiría "condición actual" con "ya resuelto/cambiado"
  // (Fase 9A, sección G).
  severityCounts: SeverityCounts;
  spaces: ReportSpace[];
  hallazgosVigentes: ReportHallazgo[];
  hallazgosHistoricos: ReportHallazgo[];
  pendientes: ReportPendiente[];
  fotosGenerales: ReportPhoto[];
};

// Ownership resuelto ACÁ, no en el caller — mismo criterio que
// loadCheckWithOwnership en [id]/actions.ts: nunca se confía en un
// caseId sin verificar contra la sesión. Devuelve null tanto si el caso
// no existe como si pertenece a otro usuario (misma ambigüedad
// deliberada que <InspectionNotAvailable />, Fase 7B).
export async function loadInspectionReportData(caseId: string, userId: string): Promise<InspectionReportData | null> {
  const insCase = await prisma.inspectionCase.findUnique({
    where: { id: caseId },
    include: {
      user: { select: { name: true, email: true } },
      // Fase 11K — `kind: "GENERAL"` excluye la portada (`COVER`), que
      // tiene su propio ciclo de vida (reemplazo, no lista) y no debería
      // aparecer mezclada en "fotos generales" del informe. Ver
      // docs/FASE11J..., sección E — PDF/resumen quedan deliberadamente
      // sin portada en esta fase (ver informe Fase 11K).
      photos: { where: { spaceId: null, elementId: null, observationId: null, kind: "GENERAL" }, orderBy: { createdAt: "asc" } },
      spaces: {
        orderBy: { order: "asc" },
        include: {
          photos: { orderBy: { createdAt: "asc" } },
          elements: {
            // Fase 18A (DT-02) — ver mismo comentario en [id]/page.tsx:
            // `id` desempata elementos históricos con `order=0` sin migrar
            // datos.
            orderBy: [{ order: "asc" }, { id: "asc" }],
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
  if (!insCase || insCase.userId !== userId) return null;

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
    ? await prisma.technicalArticle.findMany({ where: { slug: { in: articleSlugs } }, select: { slug: true, title: true } })
    : [];
  const titleBySlug = new Map(articles.map((a) => [a.slug, a.title]));

  const allChecks = insCase.spaces.flatMap((s) => s.elements.flatMap((el) => el.checks));
  const resultado: ReportCounts = {
    ok: allChecks.filter((c) => c.status === "OK").length,
    observation: allChecks.filter((c) => c.status === "OBSERVATION").length,
    notApplicable: allChecks.filter((c) => c.status === "NOT_APPLICABLE").length,
    pending: allChecks.filter((c) => c.status === null).length,
    total: allChecks.length,
  };

  const severityCounts: SeverityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const hallazgos: ReportHallazgo[] = [];
  const pendientes: ReportPendiente[] = [];
  const spaces: ReportSpace[] = [];

  for (const space of insCase.spaces) {
    const spaceCounts: ReportCounts = { ok: 0, observation: 0, notApplicable: 0, pending: 0, total: 0 };
    const elements: ReportElement[] = [];

    for (const element of space.elements) {
      const checkLines: ReportCheckLine[] = [];
      for (const check of element.checks) {
        spaceCounts.total += 1;
        if (check.status === "OK") spaceCounts.ok += 1;
        else if (check.status === "OBSERVATION") spaceCounts.observation += 1;
        else if (check.status === "NOT_APPLICABLE") spaceCounts.notApplicable += 1;
        else spaceCounts.pending += 1;

        checkLines.push({ id: check.id, question: check.questionSnapshot, status: check.status });

        const technicalArticleTitle = check.checklistItem.technicalArticleSlug
          ? titleBySlug.get(check.checklistItem.technicalArticleSlug) ?? null
          : null;

        if (check.status === null) {
          pendientes.push({ id: check.id, spaceName: space.name, elementName: element.name, question: check.questionSnapshot });
        }

        for (const obs of check.observations) {
          severityCountsMaybeAdd(severityCounts, obs.severity, check.status === "OBSERVATION");
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
            technicalArticleTitle,
          });
        }
      }
      elements.push({ id: element.id, name: element.name, checks: checkLines, photos: element.photos.map((p) => ({ id: p.id, url: p.url })) });
    }

    spaces.push({ id: space.id, name: space.name, counts: spaceCounts, photos: space.photos.map((p) => ({ id: p.id, url: p.url })), elements });
  }

  // Vigentes primero, ordenados por severidad descendente (Fase 9A,
  // sección K) — el hallazgo más urgente de cada lista aparece primero.
  const severityRank: Record<InspectionSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const bySeverity = (a: ReportHallazgo, b: ReportHallazgo) => severityRank[a.severity] - severityRank[b.severity];
  const hallazgosVigentes = hallazgos.filter((h) => h.vigente).sort(bySeverity);
  const hallazgosHistoricos = hallazgos.filter((h) => !h.vigente).sort(bySeverity);

  return {
    caseId: insCase.id,
    name: insCase.name,
    tipoInmueble: insCase.tipoInmueble,
    direccion: insCase.direccion,
    fecha: insCase.fecha,
    estado: insCase.estado,
    bedroomCount: insCase.bedroomCount,
    bathroomCount: insCase.bathroomCount,
    observacionesGenerales: insCase.observacionesGenerales,
    ownerLabel: insCase.user.name ?? insCase.user.email,
    generatedAt: new Date(),
    resultado,
    severityCounts,
    spaces,
    hallazgosVigentes,
    hallazgosHistoricos,
    pendientes,
    fotosGenerales: insCase.photos.map((p) => ({ id: p.id, url: p.url })),
  };
}

function severityCountsMaybeAdd(counts: SeverityCounts, severity: InspectionSeverity, vigente: boolean) {
  // Fase 9A, sección G — la distribución de severidad del resumen
  // ejecutivo cuenta SOLO hallazgos vigentes (una condición ya vuelta a
  // OK no debería inflar "cuántas observaciones Alta hay ahora").
  if (vigente) counts[severity] += 1;
}
