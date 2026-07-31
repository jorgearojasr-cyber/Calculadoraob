// Álgebra vectorial 2D pura — sin JSX, sin SVG, sin conocimiento de cámara
// ni de tema visual. Reutilizado tal cual del sistema anterior (ver
// auditoría Diagram System V2, 2026-08-01): esta capa nunca cambia de
// cámara en cámara ni de diseño en diseño.

export type Vec2 = [number, number];

export function add(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]];
}
export function sub(a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]];
}
export function scale(a: Vec2, s: number): Vec2 {
  return [a[0] * s, a[1] * s];
}
export function mid(a: Vec2, b: Vec2): Vec2 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
export function len(a: Vec2): number {
  return Math.hypot(a[0], a[1]);
}
export function norm(a: Vec2): Vec2 {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
}
export function dot(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}
// Perpendicular en sentido horario / antihorario (útil para hallar la
// normal "hacia afuera" de una arista sin depender del centroide del
// sólido — ver layout/dimension-lane.ts).
export function rotCW(v: Vec2): Vec2 {
  return [v[1], -v[0]];
}
export function rotCCW(v: Vec2): Vec2 {
  return [-v[1], v[0]];
}
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
export function bboxOf(points: Vec2[]): { minX: number; maxX: number; minY: number; maxY: number } {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}
