import { prisma } from "@/lib/prisma";
import { evaluateCondition } from "@/lib/formula-engine/evaluate";
import type { DslNode } from "@/lib/formula-engine/types";
import { buildRegularizationContext } from "@/lib/regularization-rules";
import type { RegularizationDocumentItem } from "@/lib/regularization-document-labels";

export type { RegularizationDocumentItem } from "@/lib/regularization-document-labels";
export { describeDocumentOrigen, describeObligatoriedad } from "@/lib/regularization-document-labels";

// Checklist de documentos filtrado por dependeDe — mismo ctx.variables
// que evaluateRegularizationRules (ver buildRegularizationContext). Un
// documento con dependeDe falso se excluye por completo de la lista, no
// se muestra deshabilitado — mismo criterio que visibleIfQuestionKey en
// el wizard de módulos (ver decisión de diseño Fase 2B, 2026-08-01).
//
// Fase 2 (modelo de tres ejes, ver clasificacion-documentos-ley-20898.md):
// `obligatorio: boolean` se reemplaza por `obligatoriedad` + `origen` +
// `momento`, más `soporteObraBien`/`citaNormativa`/`estadoValidacion` —
// el tipo y los 2 helpers de etiqueta viven en regularization-document-
// labels.ts (sin Prisma) para que un componente cliente los pueda
// importar sin arrastrar `pg` al bundle — ver ese archivo para el bug
// real que motivó la separación.
// `getVisibleDocumentChecklist` sigue siendo el checklist de ENTRADA —
// por eso filtra `momento` a previo/durante; los documentos `posterior`
// (Certificado de Recepción Definitiva, pago de derechos, inscripción
// CBR) nunca pertenecen a esta lista, sin importar cómo se clasifiquen
// en los otros ejes — ver getPosteriorDocuments para esos.

function mapDocument(
  doc: {
    id: string;
    documento: string;
    category: string;
    paraQueSirve: string;
    dondeSeObtiene: string;
    obligatoriedad: string;
    origen: string;
    momento: string;
    soporteObraBien: string;
    citaNormativa: string;
    estadoValidacion: string;
    dependeDe: unknown;
  },
  checkedByDocumentId: Set<string>
): RegularizationDocumentItem {
  return {
    id: doc.id,
    documento: doc.documento,
    category: doc.category,
    paraQueSirve: doc.paraQueSirve,
    dondeSeObtiene: doc.dondeSeObtiene,
    obligatoriedad: doc.obligatoriedad as RegularizationDocumentItem["obligatoriedad"],
    origen: doc.origen as RegularizationDocumentItem["origen"],
    momento: doc.momento as RegularizationDocumentItem["momento"],
    soporteObraBien: doc.soporteObraBien as RegularizationDocumentItem["soporteObraBien"],
    citaNormativa: doc.citaNormativa,
    estadoValidacion: doc.estadoValidacion as RegularizationDocumentItem["estadoValidacion"],
    checked: checkedByDocumentId.has(doc.id),
    // Fase 16B — deriva del `dependeDe` crudo de BD, nunca expuesto tal
    // cual al cliente (queda como boolean, no como el nodo DSL completo).
    tieneCondicionAutomatica: doc.dependeDe !== null && doc.dependeDe !== undefined,
  };
}

export async function getVisibleDocumentChecklist(
  caseId: string,
  userId: string
): Promise<RegularizationDocumentItem[]> {
  const regCase = await prisma.regularizationCase.findUniqueOrThrow({ where: { id: caseId } });

  const ctx = await buildRegularizationContext({
    tipoConstruccion: regCase.tipoConstruccion,
    anioConstruccion: regCase.anioConstruccion,
    recepcionMunicipal: regCase.recepcionMunicipal,
    m2Estimados: regCase.m2Estimados,
    material: regCase.material,
    avaluoFiscalPesos: regCase.avaluoFiscalPesos,
  });

  const [documents, checks] = await Promise.all([
    prisma.regularizationDocumentChecklist.findMany({
      where: { momento: { in: ["PREVIO", "DURANTE"] } },
      orderBy: { order: "asc" },
    }),
    prisma.regularizationDocumentCheck.findMany({ where: { userId, caseId } }),
  ]);

  const checkedByDocumentId = new Set(checks.filter((c) => c.checked).map((c) => c.documentId));

  return documents
    .filter((doc) => evaluateCondition(doc.dependeDe as DslNode | null, ctx))
    .map((doc) => mapDocument(doc, checkedByDocumentId));
}

// Documentos con momento: posterior — nunca pasan por dependeDe (ninguno
// lo usa hoy) ni por el checklist de "reunido/pendiente" (no tiene
// sentido marcar como "aportado" un documento que todavía no existe
// porque el trámite no ha terminado) — se listan tal cual, en el orden
// del catálogo, para la sección "¿Qué Ocurre Después?" del informe.
export async function getPosteriorDocuments(): Promise<
  Pick<RegularizationDocumentItem, "id" | "documento" | "paraQueSirve" | "dondeSeObtiene" | "citaNormativa">[]
> {
  const documents = await prisma.regularizationDocumentChecklist.findMany({
    where: { momento: "POSTERIOR" },
    orderBy: { order: "asc" },
  });
  return documents.map((doc) => ({
    id: doc.id,
    documento: doc.documento,
    paraQueSirve: doc.paraQueSirve,
    dondeSeObtiene: doc.dondeSeObtiene,
    citaNormativa: doc.citaNormativa,
  }));
}
