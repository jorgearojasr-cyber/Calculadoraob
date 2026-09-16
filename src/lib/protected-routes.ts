// Mejora UX/Auth flow (2026-09-16) — fuente única de verdad para "¿esta
// ruta requiere sesión?". Antes esta pregunta se respondía en 3 lugares
// distintos y de forma inconsistente: la lista hardcodeada del matcher de
// middleware.ts (que además NO incluía /inspecciones ni /regularizacion —
// esas dos solo se protegían con un `getServerSession` + `redirect` manual
// copiado en cada page.tsx), y el flag `FeatureEntry.requiresAuth` de
// product-features.ts (que el propio archivo advierte que es solo
// metadata descriptiva, no protección real). Ninguna de las tres sabía de
// las otras dos.
//
// Este archivo no reemplaza esas protecciones — las UNIFICA: tanto
// middleware.ts (protección real) como cualquier UI que necesite saber si
// una ruta requiere cuenta (ej. el candado discreto en las tarjetas del
// Home) consultan esta misma lista.
export const PROTECTED_PATH_PREFIXES = [
  "/admin",
  "/proyectos",
  "/lista-compras",
  "/galeria/nueva",
  "/inspecciones",
  "/regularizacion",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
