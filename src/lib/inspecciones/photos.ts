import type { InspectionPhotoKind } from "@/generated/prisma/client";

// Tipo/tamaño de archivo se reutilizan de project-photos.ts, no se
// duplican acá — mismo criterio ya usado por regularization-photos.ts.
// Tope por "slot" (la combinación exacta de nivel — caso/espacio/
// elemento/observación — a la que se está subiendo) — evita spam sin
// bloquear el uso real (una inspección puede necesitar bastantes fotos).
export const MAX_PHOTOS_PER_CONTEXT = 10;

// Niveles de asociación de una foto — exactamente uno de estos aplica
// por foto (ver diseño aprobado Fase 1, "el nivel más específico
// presente es el que aplica" — acá se garantiza por construcción: la
// Server Action nunca setea más de un FK de nivel a la vez, resolviendo
// la invariante que en Fase 1 quedó documentada como responsabilidad de
// la capa de aplicación, no de la base de datos).
export type PhotoUploadContext =
  | { level: "case" }
  | { level: "space"; spaceId: string }
  | { level: "element"; elementId: string }
  | { level: "observation"; observationId: string };

// Kind por defecto según el nivel — no se expone un selector de kind al
// usuario en esta fase (GOOD_CONDITION/FUTURE_REPAIR quedan modelados en
// el schema mismo, ver diseño aprobado, pero sin UI todavía; se agregan
// cuando exista un caso de uso real que los necesite).
export function defaultPhotoKind(level: PhotoUploadContext["level"]): InspectionPhotoKind {
  return level === "observation" ? "EVIDENCE" : "GENERAL";
}
