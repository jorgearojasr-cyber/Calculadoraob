import { prisma } from "@/lib/prisma";
import { evaluateCondition } from "@/lib/formula-engine/evaluate";
import type { DslNode } from "@/lib/formula-engine/types";
import { buildRegularizationContext } from "@/lib/regularization-rules";

// Checklist de documentos filtrado por dependeDe — mismo ctx.variables
// que evaluateRegularizationRules (ver buildRegularizationContext). Un
// documento con dependeDe falso se excluye por completo de la lista, no
// se muestra deshabilitado — mismo criterio que visibleIfQuestionKey en
// el wizard de módulos (ver decisión de diseño Fase 2B, 2026-08-01).
export type RegularizationDocumentItem = {
  id: string;
  documento: string;
  category: string;
  paraQueSirve: string;
  dondeSeObtiene: string;
  obligatorio: boolean;
  checked: boolean;
};

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
    prisma.regularizationDocumentChecklist.findMany({ orderBy: { order: "asc" } }),
    prisma.regularizationDocumentCheck.findMany({ where: { userId, caseId } }),
  ]);

  const checkedByDocumentId = new Set(checks.filter((c) => c.checked).map((c) => c.documentId));

  return documents
    .filter((doc) => evaluateCondition(doc.dependeDe as DslNode | null, ctx))
    .map((doc) => ({
      id: doc.id,
      documento: doc.documento,
      category: doc.category,
      paraQueSirve: doc.paraQueSirve,
      dondeSeObtiene: doc.dondeSeObtiene,
      obligatorio: doc.obligatorio,
      checked: checkedByDocumentId.has(doc.id),
    }));
}
