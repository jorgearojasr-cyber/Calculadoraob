// Sistema de cotas — geometría de "dónde va cada cosa", todavía sin
// pintar nada (eso es render/dimension-chip.tsx). Un carril es SIEMPRE
// paralelo a la arista que mide, a una distancia CONSTANTE (30 u en
// unidades de panel), con líneas de referencia desde los 2 vértices —
// nunca toca el sólido (ver especificación aprobada).
//
// A diferencia del sistema anterior (placeCota, que buscaba la normal
// "más lejos del centroide" del sólido completo — heurística frágil que
// rompía con proporciones extremas), acá la dirección `outward` es un
// dato FIJO que decide quien arma el diagrama del sólido (ver
// solid-3d.tsx), no algo derivado geométricamente en tiempo real.

import type { Vec2 } from "../math/vec2";
import { add, dot, mid, norm, rotCCW, rotCW, scale, sub } from "../math/vec2";

export const LANE_OFFSET = 30;

export type Lane = {
  A: Vec2; // vértice real 1 (extremo de la arista medida)
  B: Vec2; // vértice real 2
  A2: Vec2; // extremo 1 del carril paralelo
  B2: Vec2; // extremo 2 del carril paralelo
  chipCenter: Vec2;
};

// `chipT` (0-1): dónde sobre el carril va el chip — 0.5 (el default) es
// el punto medio real de la arista. Excepción documentada: las aristas
// de largo y ancho de la caja comparten su vértice cercano (P0d) — para
// un objeto muy angosto en planta (ej. Pilar 0,30×0,30, ver captura Fase
// 0), sus 2 puntos medios quedan casi pegados entre sí (ambos cerca del
// vértice compartido) aunque los extremos lejanos SÍ están bien
// separados, y los 2 chips se superponen. Sesgar el chip hacia el
// extremo lejano (lejos del vértice compartido) resuelve la superposición
// sin inventar una regla nueva — sigue siendo "un punto sobre el carril".
export function buildLane(A: Vec2, B: Vec2, outward: Vec2, offset: number = LANE_OFFSET, chipT: number = 0.5): Lane {
  const n = norm(outward);
  const A2 = add(A, scale(n, offset));
  const B2 = add(B, scale(n, offset));
  const chipCenter: Vec2 = [A2[0] + (B2[0] - A2[0]) * chipT, A2[1] + (B2[1] - A2[1]) * chipT];
  return { A, B, A2, B2, chipCenter };
}

// Dirección "hacia afuera" de una arista, alejándose del centroide de la
// CARA a la que pertenece (sus propios vértices) — no del sólido
// completo. Lección de la vuelta anterior: el centroide del sólido
// completo queda descentrado por la esquina lejana, y da una dirección
// "hacia afuera" incorrecta para la arista de largo/ancho más cercana a
// la cámara (cruza por encima de la cara superior en vez de alejarse de
// ella) — el centroide de la CARA misma sí da la dirección correcta.
export function outwardFromFace(A: Vec2, B: Vec2, faceCorners: Vec2[]): Vec2 {
  const sum = faceCorners.reduce((acc, p) => add(acc, p), [0, 0] as Vec2);
  const faceCentroid: Vec2 = [sum[0] / faceCorners.length, sum[1] / faceCorners.length];
  const edgeDir = norm(sub(B, A));
  const toMid = norm(sub(mid(A, B), faceCentroid));
  const perpA = rotCW(edgeDir);
  const perpB = rotCCW(edgeDir);
  return dot(perpA, toMid) >= dot(perpB, toMid) ? perpA : perpB;
}
