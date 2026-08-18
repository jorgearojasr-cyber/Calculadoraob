"use server";

import { put, del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_PHOTO_SIZE_BYTES, isAllowedPhotoType } from "@/lib/project-photos";
import { MAX_PHOTOS_PER_CONTEXT, defaultPhotoKind, type PhotoUploadContext } from "@/lib/inspecciones/photos";
import { getConfigurableComponents, parseSpaceConfig, type SpaceConfigJson } from "@/lib/inspecciones/space-config";
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

// Tope de sanidad simple para el motivo opcional de "No corresponde" —
// mismo criterio de "límite defensivo, no regla de producto" ya usado en
// MAX_REPEATABLE_COUNT (src/app/(app)/inspecciones/actions.ts).
const MAX_NOT_APPLICABLE_REASON_LENGTH = 300;

// Server Action de respuesta — mismo patrón de sesión+ownership que
// createInspectionAndGenerateAction (src/app/(app)/inspecciones/actions.ts)
// y createRegularizationCaseAction. `answeredAt` se fija a `new Date()` en
// el servidor, nunca se recibe del cliente.
//
// Fase 11K (docs/FASE11J..., sección Q) — `notApplicableReason` es
// opcional y SOLO tiene sentido cuando `status === "NOT_APPLICABLE"`:
// para cualquier otro status, se fuerza a `null` acá mismo,
// incondicionalmente — así nunca puede quedar un motivo "huérfano" de un
// estado anterior distinto (ej. si el usuario escribió un motivo, guardó
// como No corresponde, y después cambia a OK, el motivo desaparece solo,
// sin que el cliente tenga que acordarse de limpiarlo).
export async function updateInspectionChecklistCheckAction(
  checkId: string,
  status: string,
  notApplicableReason?: string | null
): Promise<
  | { status: InspectionAnswerStatus; answeredAt: string; notApplicableReason: string | null; error?: undefined }
  | { error: string; status?: undefined }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  if (!VALID_ANSWER_STATUSES.includes(status as InspectionAnswerStatus)) {
    return { error: "Estado inválido." };
  }

  const check = await loadCheckWithOwnership(checkId);
  if (!check || check.element.space.case.userId !== session.user.id) {
    return { error: "No encontrado." };
  }

  const reason =
    status === "NOT_APPLICABLE"
      ? (notApplicableReason?.trim().slice(0, MAX_NOT_APPLICABLE_REASON_LENGTH) || null)
      : null;

  const updated = await prisma.inspectionChecklistCheck.update({
    where: { id: checkId },
    data: { status: status as InspectionAnswerStatus, answeredAt: new Date(), notApplicableReason: reason },
  });

  revalidatePath(`/inspecciones/${check.element.space.caseId}`);
  return {
    status: updated.status as InspectionAnswerStatus,
    answeredAt: updated.answeredAt!.toISOString(),
    notApplicableReason: updated.notApplicableReason,
  };
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

// Fase 11K (docs/FASE11J_REDISENO_PROFUNDO_INSPECCION_GUIADA.md, sección
// E) — foto de portada del caso. Reutiliza InspectionPhoto a nivel `case`
// (spaceId/elementId/observationId null), con `kind: "COVER"`. A lo más
// 1 fila COVER por caso — invariante aplicada acá (no en el schema),
// mismo criterio que el resto del módulo. Semántica de reemplazo segura:
// se sube el blob nuevo y se crea la fila nueva ANTES de tocar la
// portada anterior — si algo falla en el camino, la portada anterior
// queda intacta. Recién con la fila nueva ya persistida se borra la fila
// vieja y se intenta borrar su blob físico (best-effort, mismo patrón
// que deleteObservationAction/deleteInspectionPhotoAction — un fallo acá
// nunca revierte ni bloquea el reemplazo, que ya es válido en base de
// datos).
export async function uploadInspectionCoverPhotoAction(
  caseId: string,
  formData: FormData
): Promise<{ url: string; error?: undefined } | { error: string; url?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const insCase = await prisma.inspectionCase.findUnique({ where: { id: caseId } });
  if (!insCase || insCase.userId !== session.user.id) return { error: "Inspección no encontrada." };

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
    blob = await put(`inspection-photos/${caseId}-cover-${Date.now()}-${file.name}`, file, { access: "public" });
  } catch {
    return { error: "No pudimos subir la foto (almacenamiento no disponible). Inténtalo más tarde." };
  }

  const previousCover = await prisma.inspectionPhoto.findFirst({ where: { caseId, kind: "COVER" } });

  const newCover = await prisma.inspectionPhoto.create({
    data: { caseId, kind: "COVER", url: blob.url },
  });

  if (previousCover) {
    await prisma.inspectionPhoto.delete({ where: { id: previousCover.id } });
    try {
      await del(previousCover.url);
    } catch {
      // Blob ya eliminado o inalcanzable — no bloquea el reemplazo, que
      // ya está persistido correctamente en base de datos.
    }
  }

  revalidatePath("/inspecciones");
  revalidatePath(`/inspecciones/${caseId}`);
  return { url: newCover.url };
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

// --- Configuración Nivel 2 del recinto (Fase 11Y) ---
//
// Piloto: Antejardín -> ¿Tiene reja?, Acceso vehicular -> ¿Tiene portón?
// (docs/FASE11Y_INFORME_PILOTO_CONFIGURACION_NIVEL2.md). Un mismo
// `InspectionSpace.config` JSON guarda la respuesta de TODOS los
// componentes configurables de ese espacio — batch, no una acción por
// componente, para que el bloque "Antes de revisar este espacio" (que en
// el futuro puede tener varias preguntas, ej. Cocina) se guarde con un
// solo "Continuar".
export type SpaceLevel2Answer = { componentKey: string; present: boolean; meta?: Record<string, string> };

export type SaveSpaceLevel2ConfigResult =
  | { config: SpaceConfigJson; requiresConfirmation?: undefined; error?: undefined }
  | { requiresConfirmation: true; components: string[]; message: string; config?: undefined; error?: undefined }
  | { error: string; config?: undefined; requiresConfirmation?: undefined };

async function loadSpaceWithOwnershipForConfig(spaceId: string) {
  return prisma.inspectionSpace.findUnique({
    where: { id: spaceId },
    include: {
      case: true,
      spaceTemplate: { select: { key: true } },
      elements: {
        include: {
          elementTemplate: { select: { key: true } },
          checks: { select: { status: true, observations: { select: { id: true } } } },
          photos: { select: { id: true, url: true } },
        },
      },
    },
  });
}

// Ownership igual al resto del módulo (Fase 3): `spaceId` nunca se
// confía sin resolver contra `space.case.userId` de la sesión.
//
// `confirmedComponentKeys` — política de datos existentes (sección 7 de
// la fase): si un componente que ya tiene checks respondidos,
// observaciones o fotos se marca "No", NO se borra silenciosamente. Esta
// acción devuelve `requiresConfirmation` con la lista de componentes en
// esa situación y NO aplica ningún cambio (todo o nada); el llamador debe
// pedir confirmación explícita al usuario y reintentar pasando esos
// mismos componentKey en `confirmedComponentKeys`. Si el componente no
// tiene datos, se quita sin pedir confirmación.
export async function saveSpaceLevel2ConfigAction(
  spaceId: string,
  answers: SpaceLevel2Answer[],
  confirmedComponentKeys: string[] = []
): Promise<SaveSpaceLevel2ConfigResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const space = await loadSpaceWithOwnershipForConfig(spaceId);
  if (!space || space.case.userId !== session.user.id) return { error: "No encontrado." };

  // Nunca confiar en `componentKey` enviado desde el cliente sin
  // volver a resolverlo contra el catálogo de componentes configurables
  // de ESTE espacio (mismo criterio que `spaceSelections` en
  // createInspectionAndGenerateAction).
  const allowed = getConfigurableComponents(space.spaceTemplate?.key);
  const allowedByKey = new Map(allowed.map((c) => [c.componentKey, c]));
  const validAnswers = answers.filter((a) => allowedByKey.has(a.componentKey));
  if (validAnswers.length === 0) return { error: "Nada que guardar." };

  const elementByComponentKey = new Map(
    space.elements.filter((e) => e.elementTemplate).map((e) => [e.elementTemplate!.key, e])
  );
  const confirmedSet = new Set(confirmedComponentKeys);

  const needsConfirm: string[] = [];
  for (const a of validAnswers) {
    if (a.present) continue;
    const existing = elementByComponentKey.get(a.componentKey);
    if (!existing) continue;
    const hasData =
      existing.checks.some((c) => c.status !== null || c.observations.length > 0) || existing.photos.length > 0;
    if (hasData && !confirmedSet.has(a.componentKey)) needsConfirm.push(a.componentKey);
  }
  if (needsConfirm.length > 0) {
    const labels = needsConfirm.map((k) => allowedByKey.get(k)?.label ?? k).join(", ");
    return {
      requiresConfirmation: true,
      components: needsConfirm,
      message: `Ya hay respuestas, hallazgos o fotos guardadas en ${labels}. Si continúas, se eliminarán junto con el componente.`,
    };
  }

  const currentConfig = parseSpaceConfig(space.config);
  const nextComponents: Record<string, boolean> = { ...(currentConfig.components ?? {}) };
  const nextMeta: Record<string, Record<string, string>> = { ...(currentConfig.componentMeta ?? {}) };

  for (const a of validAnswers) {
    nextComponents[a.componentKey] = a.present;
    if (a.present && a.meta) {
      // Fase 11Y-P (sección 3) — nunca persistir JSON arbitrario del
      // cliente sin validar: solo se aceptan las claves declaradas en
      // `metaOptions` de ESTE componente, y solo si el valor coincide con
      // una de sus opciones reales (ej. "tipo" de Portón solo puede ser
      // MANUAL/AUTOMATICO/NO_SE, nunca un string libre inventado).
      const metaOptions = allowedByKey.get(a.componentKey)?.metaOptions ?? [];
      const validatedMeta: Record<string, string> = {};
      for (const opt of metaOptions) {
        const value = a.meta[opt.key];
        if (value && opt.options.some((o) => o.value === value)) {
          validatedMeta[opt.key] = value;
        }
      }
      if (Object.keys(validatedMeta).length > 0) {
        nextMeta[a.componentKey] = { ...(nextMeta[a.componentKey] ?? {}), ...validatedMeta };
      }
    } else if (!a.present) {
      delete nextMeta[a.componentKey];
    }

    const existing = elementByComponentKey.get(a.componentKey);

    if (a.present) {
      // Idempotente: configurar "Sí" dos veces no debe duplicar el
      // elemento ni sus checks (sección 9 de la fase) — si ya existe, no
      // se toca.
      if (!existing) {
        const elementTemplate = await prisma.inspectionElementTemplate.findUnique({
          where: { key: a.componentKey },
        });
        if (elementTemplate && elementTemplate.active) {
          const newElement = await prisma.inspectionElement.create({
            data: { spaceId: space.id, elementTemplateId: elementTemplate.id, name: elementTemplate.label },
          });
          const checklistItems = await prisma.inspectionChecklistItem.findMany({
            where: { elementTemplateId: elementTemplate.id, active: true },
            orderBy: { order: "asc" },
          });
          for (const item of checklistItems) {
            await prisma.inspectionChecklistCheck.create({
              data: { elementId: newElement.id, checklistItemId: item.id, questionSnapshot: item.question },
            });
          }
        }
      }
    } else if (existing) {
      // Ya se confirmó arriba (o no había datos) — borrado seguro. Fotos
      // del elemento y de sus observaciones se borran explícitamente
      // primero (mismo patrón que deleteObservationAction): su FK usa
      // onDelete: SetNull, no Cascade, así que quedarían huérfanas
      // (elementId/observationId null pero caseId válido) si no se
      // borran acá.
      const obsIds = existing.checks.flatMap((c) => c.observations.map((o) => o.id));
      const photosToDelete = await prisma.inspectionPhoto.findMany({
        where: { OR: [{ elementId: existing.id }, ...(obsIds.length ? [{ observationId: { in: obsIds } }] : [])] },
        select: { id: true, url: true },
      });
      for (const photo of photosToDelete) {
        try {
          await del(photo.url);
        } catch {
          // Blob ya eliminado o inalcanzable — no bloquea el borrado.
        }
      }
      await prisma.inspectionPhoto.deleteMany({
        where: { OR: [{ elementId: existing.id }, ...(obsIds.length ? [{ observationId: { in: obsIds } }] : [])] },
      });
      // Cascade del schema borra checks (Check.element onDelete: Cascade)
      // y sus observaciones (Observation.checklistCheck onDelete: Cascade)
      // en el mismo `delete`.
      await prisma.inspectionElement.delete({ where: { id: existing.id } });
    }
  }

  const nextConfig: SpaceConfigJson = { components: nextComponents, componentMeta: nextMeta };
  await prisma.inspectionSpace.update({ where: { id: space.id }, data: { config: nextConfig } });

  revalidatePath(`/inspecciones/${space.caseId}`);
  return { config: nextConfig };
}
