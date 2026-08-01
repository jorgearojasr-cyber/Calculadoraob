"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STALE_SESSION_ERROR, isStaleUserError } from "@/lib/stale-session";
import { getVisibleDocumentChecklist, type RegularizationDocumentItem } from "@/lib/regularization-documents";

// Server Action nueva — no reutiliza createRegularizationCaseAction (esa
// es de creación, con sus propios campos obligatorios). Mismo patrón de
// sesión + verificación de ownership que el resto de las acciones del
// proyecto (ver renameProjectAction).
export async function updateAvaluoFiscalAction(
  caseId: string,
  avaluoFiscalPesos: number | null
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const regCase = await prisma.regularizationCase.findUnique({ where: { id: caseId } });
  if (!regCase || regCase.userId !== session.user.id) return { error: "Caso no encontrado." };

  await prisma.regularizationCase.update({
    where: { id: caseId },
    data: { avaluoFiscalPesos },
  });

  revalidatePath(`/regularizacion/${caseId}`);
  return {};
}

// Invocada por AvaluoFiscalGate justo después de guardar la respuesta —
// devuelve el checklist ya filtrado con el caso recién actualizado
// (evita depender de router.refresh()/re-render del server component
// para pasar de la compuerta al checklist en la misma pantalla).
export async function getDocumentChecklistAction(
  caseId: string
): Promise<{ documents: RegularizationDocumentItem[]; error?: undefined } | { error: string; documents?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const regCase = await prisma.regularizationCase.findUnique({ where: { id: caseId } });
  if (!regCase || regCase.userId !== session.user.id) return { error: "Caso no encontrado." };

  const documents = await getVisibleDocumentChecklist(caseId, session.user.id);
  return { documents };
}

// Mismo patrón que toggleShoppingCheckAction (upsert sobre clave única +
// manejo de sesión caducada) — a diferencia de ShoppingListCheck, acá la
// identidad SÍ es una FK real a un documento catalogado (documentId), no
// una clave natural (ver decisión de arquitectura: RegularizationDocumentCheck
// usa FK real porque el catálogo ya tiene id propio).
export async function toggleDocumentCheckAction(
  caseId: string,
  documentId: string,
  checked: boolean
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const regCase = await prisma.regularizationCase.findUnique({ where: { id: caseId } });
  if (!regCase || regCase.userId !== session.user.id) return { error: "Caso no encontrado." };

  try {
    await prisma.regularizationDocumentCheck.upsert({
      where: { userId_caseId_documentId: { userId: session.user.id, caseId, documentId } },
      create: { userId: session.user.id, caseId, documentId, checked },
      update: { checked },
    });
  } catch (error) {
    if (isStaleUserError(error)) return { error: STALE_SESSION_ERROR };
    throw error;
  }

  revalidatePath(`/regularizacion/${caseId}`);
  return {};
}
