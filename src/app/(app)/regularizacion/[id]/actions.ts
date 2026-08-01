"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { put, del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STALE_SESSION_ERROR, isStaleUserError } from "@/lib/stale-session";
import { getVisibleDocumentChecklist, type RegularizationDocumentItem } from "@/lib/regularization-documents";
import { MAX_PHOTO_SIZE_BYTES, isAllowedPhotoType } from "@/lib/project-photos";
import { MAX_PHOTOS_PER_KIND } from "@/lib/regularization-photos";
import type { RegularizationRoomType, RegularizationPhotoKind } from "@/generated/prisma/client";

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

// --- Recintos (Fase 2C) ---
//
// m2Calculado se calcula siempre en el servidor (largo x ancho) — nunca
// se confía en un valor enviado por el cliente (decisión de arquitectura
// confirmada 2026-08-02). El total del caso NO se persiste en ninguna
// parte: se suma dinámicamente sumando RegularizationRoom[] en el
// cliente, para que nunca pueda desincronizarse de los recintos reales.

function computeM2(largo: number, ancho: number): number {
  return Math.round(largo * ancho * 100) / 100;
}

export type RoomInput = {
  roomType: RegularizationRoomType;
  label: string | null;
  largo: number;
  ancho: number;
};

function validateRoomInput(input: RoomInput): string | null {
  if (!Number.isFinite(input.largo) || input.largo <= 0) return "El largo debe ser mayor a 0.";
  if (!Number.isFinite(input.ancho) || input.ancho <= 0) return "El ancho debe ser mayor a 0.";
  return null;
}

export async function createRoomAction(
  caseId: string,
  input: RoomInput
): Promise<{ id?: string; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const regCase = await prisma.regularizationCase.findUnique({ where: { id: caseId } });
  if (!regCase || regCase.userId !== session.user.id) return { error: "Caso no encontrado." };

  const validationError = validateRoomInput(input);
  if (validationError) return { error: validationError };

  const roomCount = await prisma.regularizationRoom.count({ where: { caseId } });

  let room;
  try {
    room = await prisma.regularizationRoom.create({
      data: {
        caseId,
        roomType: input.roomType,
        label: input.label,
        largo: input.largo,
        ancho: input.ancho,
        m2Calculado: computeM2(input.largo, input.ancho),
        order: roomCount,
      },
    });
  } catch (error) {
    if (isStaleUserError(error)) return { error: STALE_SESSION_ERROR };
    throw error;
  }

  revalidatePath(`/regularizacion/${caseId}`);
  return { id: room.id };
}

export async function updateRoomAction(
  caseId: string,
  roomId: string,
  input: RoomInput
): Promise<{ id?: string; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const room = await prisma.regularizationRoom.findUnique({
    where: { id: roomId },
    include: { case: true },
  });
  if (!room || room.caseId !== caseId || room.case.userId !== session.user.id) {
    return { error: "Recinto no encontrado." };
  }

  const validationError = validateRoomInput(input);
  if (validationError) return { error: validationError };

  await prisma.regularizationRoom.update({
    where: { id: roomId },
    data: {
      roomType: input.roomType,
      label: input.label,
      largo: input.largo,
      ancho: input.ancho,
      m2Calculado: computeM2(input.largo, input.ancho),
    },
  });

  revalidatePath(`/regularizacion/${caseId}`);
  return {};
}

export async function deleteRoomAction(caseId: string, roomId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const room = await prisma.regularizationRoom.findUnique({
    where: { id: roomId },
    include: { case: true },
  });
  if (!room || room.caseId !== caseId || room.case.userId !== session.user.id) {
    return { error: "Recinto no encontrado." };
  }

  await prisma.regularizationRoom.delete({ where: { id: roomId } });

  revalidatePath(`/regularizacion/${caseId}`);
  return {};
}

// --- Fotos (Fase 2C) ---
//
// Reutiliza el mecanismo de subida de ProjectPhoto (Vercel Blob), no su
// modelo: sin status/moderación (RegularizationPhoto es documentación
// privada del propio caso). Múltiples fotos por kind permitidas (Opción
// A, decisión confirmada 2026-08-02), acotadas por MAX_PHOTOS_PER_KIND.

export async function uploadRegularizationPhotoAction(
  caseId: string,
  kind: RegularizationPhotoKind,
  formData: FormData
): Promise<{ id?: string; url?: string; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const regCase = await prisma.regularizationCase.findUnique({ where: { id: caseId } });
  if (!regCase || regCase.userId !== session.user.id) return { error: "Caso no encontrado." };

  const kindCount = await prisma.regularizationPhoto.count({ where: { caseId, kind } });
  if (kindCount >= MAX_PHOTOS_PER_KIND) {
    return { error: `Ya subiste el máximo de ${MAX_PHOTOS_PER_KIND} fotos para esta categoría.` };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Elige una foto primero." };
  if (!isAllowedPhotoType(file.type)) {
    return { error: "Formato no admitido. Sube una foto en JPG, PNG o WEBP." };
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return { error: `La foto pesa demasiado (máximo ${MAX_PHOTO_SIZE_BYTES / 1024 / 1024}MB).` };
  }

  let blob;
  try {
    blob = await put(`regularization-photos/${caseId}-${kind}-${Date.now()}-${file.name}`, file, {
      access: "public",
    });
  } catch {
    return { error: "No pudimos subir la foto (almacenamiento no disponible). Inténtalo más tarde." };
  }

  let photo;
  try {
    photo = await prisma.regularizationPhoto.create({
      data: { caseId, kind, url: blob.url },
    });
  } catch (error) {
    if (isStaleUserError(error)) return { error: STALE_SESSION_ERROR };
    throw error;
  }

  revalidatePath(`/regularizacion/${caseId}`);
  return { id: photo.id, url: photo.url };
}

export async function deleteRegularizationPhotoAction(
  caseId: string,
  photoId: string
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const photo = await prisma.regularizationPhoto.findUnique({
    where: { id: photoId },
    include: { case: true },
  });
  if (!photo || photo.caseId !== caseId || photo.case.userId !== session.user.id) {
    return { error: "Foto no encontrada." };
  }

  await prisma.regularizationPhoto.delete({ where: { id: photoId } });

  // Best-effort: si falla el borrado en Blob no revertimos el borrado en
  // BD (la referencia ya no existe, que es lo que le importa al usuario);
  // queda documentado en el reporte de Fase 2C como comportamiento
  // adoptado, no como bug pendiente.
  try {
    await del(photo.url);
  } catch {
    // Blob eliminado o inalcanzable — no bloquea la operación.
  }

  revalidatePath(`/regularizacion/${caseId}`);
  return {};
}
