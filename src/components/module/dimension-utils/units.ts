// Conversión de unidades — pertenece al framework: cualquier grupo de
// campos puede mezclar unidades (ej. Radier: largo/ancho en metros,
// espesor en centímetros; Fundación: largo en metros, secciones en
// centímetros) y necesita la MISMA tabla de conversión para calcular una
// vista previa de área/volumen en vivo. Antes vivía duplicada (con 2
// firmas ligeramente distintas) en VolumeStep y FoundationStep.
export const UNIT_TO_METERS: Record<string, number> = { m: 1, cm: 0.01, mm: 0.001 };

export function toMeters(n: number | null, unit: string | null): number | null {
  return n === null ? null : n * (UNIT_TO_METERS[unit ?? "m"] ?? 1);
}
