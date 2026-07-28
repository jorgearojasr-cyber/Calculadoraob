// Límites de la publicación en la galería pública (/galeria/nueva).
export const MAX_SHOWCASE_PHOTO_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
export const ALLOWED_SHOWCASE_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
// Al menos 1 foto de cada lado para que la publicación tenga sentido
// (un "antes/después" sin ambos lados no cumple el propósito de la galería).
export const MIN_SHOWCASE_PHOTOS_PER_SIDE = 1;
export const MAX_SHOWCASE_PHOTOS_PER_SIDE = 3;

export function isAllowedShowcasePhotoType(mimeType: string): boolean {
  return (ALLOWED_SHOWCASE_PHOTO_MIME_TYPES as readonly string[]).includes(mimeType);
}
