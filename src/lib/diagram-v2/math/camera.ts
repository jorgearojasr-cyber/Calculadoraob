// Cámara ÚNICA de Diagram System V2 — axonométrica a 18°, ejes fijos, sin
// excepciones (ver especificación aprobada, PDF "El diagrama de medidas,
// diseñado de nuevo", 2026-08-01). Ningún otro archivo de este sistema
// conoce el ángulo de cámara — si algún día cambia, cambia solo acá.
//
// Un punto 3D LOCAL {largo, ancho, profundidad} (unidades relativas, no
// metros reales — eso lo resuelve scale-engine.ts) se proyecta a 2D
// sumando 3 vectores fijos:
//   - eje "largo" → abajo-derecha, a 18° bajo la horizontal
//   - eje "ancho" → abajo-izquierda, a 18° bajo la horizontal (simétrico)
//   - eje "profundidad" → derecho hacia abajo
//
// Supuesto explícito (comunicado y aprobado — ver conversación
// 2026-08-01, "elijas la proyección axonométrica que reproduzca mejor el
// mockup"): el eje de profundidad NO lleva foreshortening propio — se
// proyecta 1:1. Una axonométrica "de manual" normalmente escorza los 3
// ejes por igual; acá se prioriza que el resultado se vea fiel al mockup
// (donde la profundidad se lee con la misma claridad que largo/ancho)
// sobre la pureza matemática de la proyección.

import type { Vec2 } from "./vec2";
import { add, scale } from "./vec2";

const AXONOMETRIC_ANGLE_DEG = 18;
const ANGLE = (AXONOMETRIC_ANGLE_DEG * Math.PI) / 180;

export const AXIS_LARGO: Vec2 = [Math.cos(ANGLE), Math.sin(ANGLE)];
export const AXIS_ANCHO: Vec2 = [-Math.cos(ANGLE), Math.sin(ANGLE)];
export const AXIS_PROFUNDIDAD: Vec2 = [0, 1];

export type Local3 = { largo: number; ancho: number; profundidad: number };

export function project(p: Local3): Vec2 {
  return add(add(scale(AXIS_LARGO, p.largo), scale(AXIS_ANCHO, p.ancho)), scale(AXIS_PROFUNDIDAD, p.profundidad));
}
