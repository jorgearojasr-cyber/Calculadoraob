// Límites compartidos por la acción de subida y el input de archivo en el
// cliente (para dar feedback inmediato sin esperar el roundtrip al server).
export const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
export const ALLOWED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
// Tope de fotos por proyecto guardado — evita spam sin necesitar un límite
// configurable; alcanza para "1-2 fotos" por obra terminada.
export const MAX_PHOTOS_PER_PROJECT = 2;

export function isAllowedPhotoType(mimeType: string): boolean {
  return (ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes(mimeType);
}
