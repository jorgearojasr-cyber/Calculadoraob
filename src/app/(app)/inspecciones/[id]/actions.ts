"use server";

import { put, del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_PHOTO_SIZE_BYTES, isAllowedPhotoType } from "@/lib/project-photos";
import { MAX_PHOTOS_PER_CONTEXT, defaultPhotoKind, type PhotoUploadContext } from "@/lib/inspecciones/photos";
import type { InspectionAnswerStatus, InspectionObservationStatus, InspectionSeverity } from "@/generated/prisma/client";

const VALID_ANSWER_STATUSES: InspectionAnswerStatus[] = ["OK", "OBSERVATION", "NOT_APPLICABLE"];
const VALID_SEVERITIES: InspectionSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const VALID_OBSERVATION_STATUSES: InspectionObservationStatus[] = ["OPEN", "IN_REVIEW", "RESOLVED"];

export type ObservationDTO = {
  id: string;
  comment: string;
  severity: InspectionSeverity;
  recommendation: string | null;
  status: InspectionObservationStatus;
  photos: { id: string; url: string }[];
};

function toObservationDTO(o: {
  id: string;
  comment: string;
  severity: InspectionSeverity;
  recommendation: string | null;
  status: InspectionObservationStatus;
  photos: { id: string; url: string }[];
}): ObservationDTO {
  return {
    id: o.id,
    comment: o.comment,
    severity: o.severity,
    recommendation: o.recommendation,
    status: o.status,
    photos: o.photos.map((p) => ({ id: p.id, url: p.url })),
  };
}

// Cadena de ownership completa, resuelta en una sola query con `include`
// anidado (no 4 round-trips separados) — check -> element -> space -> case
// -> userId, exactamente como pide Fase 3 punto 4/7. Nunca se confía en un
// caseId enviado por el cliente: siempre se resuelve desde el propio check
// hacia arriba.
async function loadCheckWithOwnership(checkId: string) {
  return prisma.inspectionChecklistCheck.findUnique({
    where: { id: checkId },
    include: { element: { include: { space: { include: { case: true } } } } },
  });
}

async function loadObservationWithOwnership(observationId: string) {
  return prisma.inspectionObservation.findUnique({
    where: { id: observationId },
    include: { checklistCheck: { include: { element: { include: { space: { include: { case: true } } } } } } },
  });
}

// Server Action de respuesta — mismo patrón de sesión+ownership que
// createInspectionAndGenerateAction (src/app/(app)/inspecciones/actions.ts)
// y createRegularizationCaseAction. `answeredAt` se fija a `new Date()` en
// el servidor, nunca se recibe del cliente.
export async function updateInspectionChecklistCheckAction(
  checkId: string,
  status: string
): Promise<{ status: InspectionAnswerStatus; answeredAt: string; error?: undefined } | { error: string; status?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  if (!VALID_ANSWER_STATUSES.includes(status as InspectionAnswerStatus)) {
    return { error: "Estado inválido." };
  }

  const check = await loadCheckWithOwnership(checkId);
  if (!check || check.element.space.case.userId !== session.user.id) {
    return { error: "No encontrado." };
  }

  const updated = await prisma.inspectionChecklistCheck.update({
    where: { id: checkId },
    data: { status: status as InspectionAnswerStatus, answeredAt: new Date() },
  });

  revalidatePath(`/inspecciones/${check.element.space.caseId}`);
  return { status: updated.status as InspectionAnswerStatus, answeredAt: updated.answeredAt!.toISOString() };
}

// Una pregunta puede tener varias observaciones (InspectionObservation[],
// 1:N respecto al check — arquitectura aprobada Fase 1) — esta acción
// SIEMPRE agrega una fila nueva, nunca reemplaza las existentes.
export async function createObservationAction(
  checkId: string,
  input: { comment: string; severity: string; recommendation: string | null }
): Promise<{ observation: ObservationDTO; error?: undefined } | { error: string; observation?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const comment = input.comment.trim();
  if (!comment) return { error: "Describe el hallazgo." };
  if (!VALID_SEVERITIES.includes(input.severity as InspectionSeverity)) return { error: "Severidad inválida." };

  const check = await loadCheckWithOwnership(checkId);
  if (!check || check.element.space.case.userId !== session.user.id) {
    return { error: "No encontrado." };
  }

  const created = await prisma.inspectionObservation.create({
    data: {
      checklistCheckId: checkId,
      comment,
      severity: input.severity as InspectionSeverity,
      recommendation: input.recommendation?.trim() || null,
    },
    include: { photos: true },
  });

  revalidatePath(`/inspecciones/${check.element.space.caseId}`);
  return { observation: toObservationDTO(created) };
}

export async function updateObservationAction(
  observationId: string,
  input: { comment: string; severity: string; recommendation: string | null; status: string }
): Promise<{ observation: ObservationDTO; error?: undefined } | { error: string; observation?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const comment = input.comment.trim();
  if (!comment) return { error: "Describe el hallazgo." };
  if (!VALID_SEVERITIES.includes(input.severity as InspectionSeverity)) return { error: "Severidad inválida." };
  if (!VALID_OBSERVATION_STATUSES.includes(input.status as InspectionObservationStatus)) {
    return { error: "Estado de observación inválido." };
  }

  const observation = await loadObservationWithOwnership(observationId);
  if (!observation || observation.checklistCheck.element.space.case.userId !== session.user.id) {
    return { error: "No encontrado." };
  }

  const updated = await prisma.inspectionObservation.update({
    where: { id: observationId },
    data: {
      comment,
      severity: input.severity as InspectionSeverity,
      recommendation: input.recommendation?.trim() || null,
      status: input.status as InspectionObservationStatus,
    },
    include: { photos: true },
  });

  revalidatePath(`/inspecciones/${observation.checklistCheck.element.space.caseId}`);
  return { observation: toObservationDTO(updated) };
}

export async function deleteObservationAction(
  observationId: string
): Promise<{ success: true; error?: undefined } | { error: string; success?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  // Fase 10Q — incluye `photos` acá, en vez de agregarlo a
  // `loadObservationWithOwnership` (que también usa updateObservationAction
  // sin necesitarlas) — mantiene el cambio acotado a esta acción.
  const observation = await prisma.inspectionObservation.findUnique({
    where: { id: observationId },
    include: {
      checklistCheck: { include: { element: { include: { space: { include: { case: true } } } } } },
      photos: { select: { id: true, url: true } },
    },
  });
  if (!observation || observation.checklistCheck.element.space.case.userId !== session.user.id) {
    return { error: "No encontrado." };
  }

  // Borra el blob físico de CADA foto de ESTA observación, identificado
  // exactamente por `photo.url` (nunca un prefijo ni una búsqueda
  // ambigua) — no puede afectar fotos de otra observación, elemento,
  // espacio o caso. Best-effort: mismo criterio ya usado en
  // deleteInspectionPhotoAction — si Vercel Blob falla o el archivo ya
  // no existe, no bloquea el borrado de la observación.
  for (const photo of observation.photos) {
    try {
      await del(photo.url);
    } catch {
      // Blob ya eliminado o inalcanzable — no bloquea la operación.
    }
  }

  // Transacción: borra las filas de foto (en vez de dejarlas huérfanas
  // con `observationId: null` vía el onDelete: SetNull del schema) y la
  // observación en un solo paso atómico — ya no queda ninguna fila
  // apuntando a un blob que se acaba de borrar.
  await prisma.$transaction([
    prisma.inspectionPhoto.deleteMany({ where: { observationId } }),
    prisma.inspectionObservation.delete({ where: { id: observationId } }),
  ]);

  revalidatePath(`/inspecciones/${observation.checklistCheck.element.space.caseId}`);
  return { success: true };
}

// --- Fotografías (Fase 4) ---
//
// `context` fuerza exactamente UN nivel de asociación por foto (case /
// space / element / observation) — resuelve por construcción la
// invariante que en el diseño de Fase 1 quedó documentada como
// responsabilidad de la capa de aplicación ("solo el nivel más
// específico debería estar seteado", nunca enforced por la base de
// datos): acá directamente no existe forma de setear dos FKs de nivel a
// la vez, porque el creador de este objeto es el único lugar donde se
// arma el `data` del create.
async function resolveContextOwnership(
  caseId: string,
  context: PhotoUploadContext
): Promise<{ ok: true; data: { spaceId?: string; elementId?: string; observationId?: string } } | { ok: false }> {
  if (context.level === "case") return { ok: true, data: {} };

  if (context.level === "space") {
    const space = await prisma.inspectionSpace.findUnique({ where: { id: context.spaceId } });
    if (!space || space.caseId !== caseId) return { ok: false };
    return { ok: true, data: { spaceId: space.id } };
  }

  if (context.level === "element") {
    const element = await prisma.inspectionElement.findUnique({
      where: { id: context.elementId },
      include: { space: true },
    });
    if (!element || element.space.caseId !== caseId) return { ok: false };
    return { ok: true, data: { elementId: element.id } };
  }

  const observation = await prisma.inspectionObservation.findUnique({
    where: { id: context.observationId },
    include: { checklistCheck: { include: { element: { include: { space: true } } } } },
  });
  if (!observation || observation.checklistCheck.element.space.caseId !== caseId) return { ok: false };
  return { ok: true, data: { observationId: observation.id } };
}

export type InspectionPhotoDTO = { id: string; url: string; kind: string };

// Mismo patrón que uploadRegularizationPhotoAction
// (src/app/(app)/regularizacion/[id]/actions.ts): sesión -> ownership del
// caso -> tope por "slot" -> validar archivo -> subir a Vercel Blob ->
// crear la fila. Ownership de `context` se resuelve SIEMPRE contra
// `caseId` (nunca se confía en un id suelto enviado por el cliente sin
// volver a verificar que pertenece a este caso, que a su vez pertenece a
// este usuario).
export async function uploadInspectionPhotoAction(
  caseId: string,
  context: PhotoUploadContext,
  formData: FormData
): Promise<{ id: string; url: string; kind: string; error?: undefined } | { error: string; id?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const insCase = await prisma.inspectionCase.findUnique({ where: { id: caseId } });
  if (!insCase || insCase.userId !== session.user.id) return { error: "Inspección no encontrada." };

  const resolved = await resolveContextOwnership(caseId, context);
  if (!resolved.ok) return { error: "No encontrado." };

  const existingCount = await prisma.inspectionPhoto.count({
    where: {
      caseId,
      spaceId: resolved.data.spaceId ?? null,
      elementId: resolved.data.elementId ?? null,
      observationId: resolved.data.observationId ?? null,
    },
  });
  if (existingCount >= MAX_PHOTOS_PER_CONTEXT) {
    return { error: `Ya subiste el máximo de ${MAX_PHOTOS_PER_CONTEXT} fotos acá.` };
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
    blob = await put(`inspection-photos/${caseId}-${context.level}-${Date.now()}-${file.name}`, file, {
      access: "public",
    });
  } catch {
    return { error: "No pudimos subir la foto (almacenamiento no disponible). Inténtalo más tarde." };
  }

  const photo = await prisma.inspectionPhoto.create({
    data: {
      caseId,
      spaceId: resolved.data.spaceId,
      elementId: resolved.data.elementId,
      observationId: resolved.data.observationId,
      kind: defaultPhotoKind(context.level),
      url: blob.url,
    },
  });

  revalidatePath(`/inspecciones/${caseId}`);
  return { id: photo.id, url: photo.url, kind: photo.kind };
}

export async function deleteInspectionPhotoAction(
  photoId: string
): Promise<{ success: true; error?: undefined } | { error: string; success?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  // Ownership más simple de las 4 entidades del módulo: `caseId` es
  // obligatorio en TODA foto, sin importar su nivel — un solo join
  // (ver diseño aprobado Fase 1, sección de ownership).
  const photo = await prisma.inspectionPhoto.findUnique({ where: { id: photoId }, include: { case: true } });
  if (!photo || photo.case.userId !== session.user.id) return { error: "Foto no encontrada." };

  await prisma.inspectionPhoto.delete({ where: { id: photoId } });

  // Best-effort: mismo criterio ya adoptado en
  // deleteRegularizationPhotoAction — si falla el borrado en Blob no se
  // revierte el borrado en base de datos.
  try {
    await del(photo.url);
  } catch {
    // Blob eliminado o inalcanzable — no bloquea la operación.
  }

  revalidatePath(`/inspecciones/${photo.caseId}`);
  return { success: true };
}
