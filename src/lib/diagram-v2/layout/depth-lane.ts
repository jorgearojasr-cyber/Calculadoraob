// Carril vertical de profundidad — caso especial explícito de la
// especificación aprobada: "siempre a la derecha, fuera de la silueta,
// nunca dentro del volumen". No es una regla derivada (como el resto de
// los carriles, que siguen su propia arista) — es una posición FIJA,
// independiente de la proporción del objeto: la arista vertical más a la
// derecha del sólido (P1-P1d en la caja, topRight-bottomRight en el
// cilindro) SIEMPRE es exterior a la silueta completa en esta cámara fija
// a 18°, así que ese es el ancla natural para el carril.

import type { Vec2 } from "../math/vec2";
import { buildLane, type Lane } from "./dimension-lane";

export function buildDepthLane(topRight: Vec2, bottomRight: Vec2, offset?: number): Lane {
  return buildLane(topRight, bottomRight, [1, 0], offset);
}
