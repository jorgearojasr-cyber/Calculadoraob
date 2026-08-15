"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadInspectionReportData } from "@/lib/inspecciones-report";
import { loadKnowledgeEntry } from "@/lib/inspecciones-knowledge";
import { composeSuggestedComment, composeInspectionSummary, MAX_INPUT_LENGTH } from "@/lib/inspecciones-redaccion";

// Fase 10B (corrección) — reemplaza el `ai-actions.ts` original (llamaba
// a la API de Anthropic). Estas 2 funciones son las MISMAS 2 aprobadas
// en Fase 10A (mejorar/sugerir redacción de una observación, generar
// resumen ejecutivo), pero ahora 100% locales: base de conocimiento
// (TechnicalArticle, vía inspecciones-knowledge.ts) + reglas/plantillas
// (inspecciones-redaccion.ts), sin ningún fetch externo. Ninguna de las
// dos escribe en la base de datos — devuelven una propuesta que el
// cliente muestra; el dato definitivo sigue pasando por
// createObservationAction/updateObservationAction (sin cambios) o por
// la lectura normal del resumen.

// Mismo patrón exacto de resolución de ownership que
// loadCheckWithOwnership en [id]/actions.ts.
async function loadCheckContext(checkId: string) {
  return prisma.inspectionChecklistCheck.findUnique({
    where: { id: checkId },
    include: {
      checklistItem: { select: { technicalArticleSlug: true } },
      element: { include: { space: { include: { case: true } } } },
    },
  });
}

export type SuggestObservationResult = { suggestedComment: string; error?: undefined } | { error: string; suggestedComment?: undefined };

export async function suggestObservationCommentAction(checkId: string, comment: string): Promise<SuggestObservationResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const trimmed = comment.trim();
  if (!trimmed) return { error: "Escribe un comentario primero." };
  if (trimmed.length > MAX_INPUT_LENGTH) return { error: "El comentario es demasiado largo." };

  const check = await loadCheckContext(checkId);
  if (!check || check.element.space.case.userId !== session.user.id) return { error: "No encontrado." };

  const knowledge = await loadKnowledgeEntry(check.checklistItem.technicalArticleSlug);
  const suggestedComment = composeSuggestedComment(trimmed, knowledge?.condicionesIncorrectas ?? null);

  return { suggestedComment };
}

export type GenerateSummaryResult = { summary: string; keyFindings: string[]; error?: undefined } | { error: string; summary?: undefined };

export async function generateInspectionSummaryAction(caseId: string): Promise<GenerateSummaryResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  // Reutiliza el mismo modelo derivado de Fase 9B — ya resuelve
  // ownership (null si el caso no existe o no es del usuario) y ya
  // excluye históricos de `hallazgosVigentes`.
  const data = await loadInspectionReportData(caseId, session.user.id);
  if (!data) return { error: "No encontrado." };

  const { summary, keyFindings } = composeInspectionSummary(data);
  return { summary, keyFindings };
}
