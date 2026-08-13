// Geometría de los sólidos en espacio LOCAL 3D (antes de proyectar) +
// qué caras/aristas son visibles para la cámara fija de camera.ts. Esto
// es dato de la cámara (siempre la misma), no del sólido — por eso vive
// acá y no en cada componente de render.

import { AXIS_LARGO, project } from "./camera";
import type { Vec2 } from "./vec2";

export type BoxProjected = {
  P0: Vec2; // esquina cercana (largo=0, ancho=0, profundidad=0)
  P1: Vec2; // + largo
  P2: Vec2; // + ancho
  P3: Vec2; // + largo + ancho (esquina lejana de la cara superior)
  P0d: Vec2;
  P1d: Vec2;
  P2d: Vec2;
};

// largoR/anchoR/profundidadR: proporciones YA normalizadas (0-1, ver
// scale-engine.ts) — este archivo no sabe de metros reales ni de
// compresión, solo arma la geometría dado un tamaño relativo por eje.
//
// anchoOffsetR/profundidadOffsetR (opcionales, default 0): desplazan el
// origen local del box antes de proyectar — usado por "steppedBox" (ver
// DiagramV2.tsx) para apilar 2 boxes reales (base + cuello de una
// fundación) que comparten cámara/proyección pero no el mismo origen. Con
// 0/0 (el caso de siempre) el comportamiento es idéntico al de antes.
export function buildBox(
  largoR: number,
  anchoR: number,
  profundidadR: number,
  anchoOffsetR = 0,
  profundidadOffsetR = 0
): BoxProjected {
  const p = (largo: number, ancho: number, profundidad: number) =>
    project({ largo, ancho: ancho + anchoOffsetR, profundidad: profundidad + profundidadOffsetR });
  return {
    P0: p(0, 0, 0),
    P1: p(largoR, 0, 0),
    P2: p(0, anchoR, 0),
    P3: p(largoR, anchoR, 0),
    P0d: p(0, 0, profundidadR),
    P1d: p(largoR, 0, profundidadR),
    P2d: p(0, anchoR, profundidadR),
  };
}

// Caras visibles en orden Z correcto (las paredes primero, la cara
// superior AL FINAL — es la más cercana a la cámara en esta proyección
// fija, cubre correctamente a las paredes donde se superponen en 2D;
// este orden es el único robusto para cualquier proporción, lección
// portada del sistema de diagramas anterior, ya retirado).
export function boxFaces(b: BoxProjected) {
  return {
    wallLeft: [b.P0, b.P2, b.P2d, b.P0d] as Vec2[], // cara "ancho" — más oscura (menos luz)
    wallRight: [b.P0, b.P1, b.P1d, b.P0d] as Vec2[], // cara "largo" — tono medio
    top: [b.P0, b.P1, b.P3, b.P2] as Vec2[], // cara superior — más clara (luz desde arriba)
  };
}

export function boxAllPoints(b: BoxProjected): Vec2[] {
  return [b.P0, b.P1, b.P2, b.P3, b.P0d, b.P1d, b.P2d];
}

export type SlabTopProjected = {
  P0: Vec2; // esquina cercana (largo=0, ancho=0)
  P1: Vec2; // + largo
  P2: Vec2; // + ancho
  P3: Vec2; // + largo + ancho (esquina lejana)
};

// Fase 7 (Radier, 13-ago-2026) — geometría propia de "slab", DELIBERADAMENTE
// separada de buildBox: solo construye la cara SUPERIOR (planta), sin
// ningún punto de profundidad. 3 fases (2, 4, 5, 6) intentando que el
// espesor de un buildBox genérico se vea "delgado" vía ratios/potencias/
// pisos no bastaron — el problema de fondo es que fitToSilhouette
// escalaba el sólido completo (incluida la profundidad) al panel, así que
// la cara superior nunca ocupaba TODO el espacio posible por sí sola. Acá
// el llamador (DiagramV2.tsx, kind="slab") ajusta el panel usando SOLO
// estos 4 puntos — la cara superior queda con el máximo tamaño posible
// dentro del panel — y agrega el espesor DESPUÉS, en píxeles fijos
// (ver EDGE_PX en DiagramV2.tsx), completamente desacoplado de cualquier
// ratio geométrico. Reutiliza `project()` (la misma cámara congelada de
// siempre, sin tocarla) — nada de esto afecta a buildBox/boxFaces, usados
// tal cual por Fundación/Muro/Losa/Pilar/Piscinas/Cadena/Viga/Jardinera.
export function buildSlabTop(largoR: number, anchoR: number): SlabTopProjected {
  const p = (largo: number, ancho: number) => project({ largo, ancho, profundidad: 0 });
  return {
    P0: p(0, 0),
    P1: p(largoR, 0),
    P2: p(0, anchoR),
    P3: p(largoR, anchoR),
  };
}

export type CylinderProjected = {
  topLeft: Vec2;
  topRight: Vec2;
  topCenter: Vec2;
  bottomLeft: Vec2;
  bottomRight: Vec2;
  bottomCenter: Vec2;
  rx: number;
  ry: number;
};

// Fase 7, sprint UX V1.2 (04-ago-2026) — reescrito desde la causa raíz,
// no desde una calibración visual. La versión anterior definía
// topLeft/topRight proyectando los dos extremos del diámetro A LO LARGO
// DEL EJE "largo" (ancho=0) y por separado dibujaba una elipse con un
// `ry` de un valor libre (ELLIPSE_RY_RATIO, ajustado "a ojo"). Esos dos
// puntos NUNCA caían realmente sobre esa elipse — se puede verificar
// reemplazando sus coordenadas en la ecuación de la elipse dibujada: el
// resultado da ~1.93 en vez de 1. Ese desfase geométrico (no un problema
// de proporción ni de color) era la causa del "escalón" entre la pared y
// la tapa que se seguía viendo tras ajustar COMPRESSION_POWER y
// ELLIPSE_RY_RATIO.
//
// Proyectando un círculo real de radio r a través de esta misma cámara
// (parametrizado por ángulo θ, con largo=r·cosθ, ancho=r·senθ) y usando
// cosθ−senθ=√2·cos(θ+45°), cosθ+senθ=√2·sen(θ+45°), el círculo SÍ se
// proyecta como una elipse de eje alineado a pantalla (por la simetría de
// AXIS_LARGO/AXIS_ANCHO), con semiejes:
//   A (horizontal) = r · √2 · AXIS_LARGO[0]   (= r·√2·cos(18°))
//   B (vertical)   = r · √2 · AXIS_LARGO[1]   (= r·√2·sen(18°))
// — derivados del mismo ángulo de cámara que ya existía, cero valores
// libres nuevos. topLeft/topRight/bottomLeft/bottomRight se definen ahora
// como centro±A, así que quedan matemáticamente forzados a estar sobre
// la misma elipse que se dibuja, para cualquier radio y profundidad (ver
// demostración completa en la conversación de cierre de esta fase) — no
// es una calibración que funcione mejor en un rango, es una identidad
// algebraica válida para todo el dominio.
const SQRT2 = Math.SQRT2;

export function buildCylinder(radiusR: number, profundidadR: number): CylinderProjected {
  const A = radiusR * SQRT2 * AXIS_LARGO[0];
  const B = radiusR * SQRT2 * AXIS_LARGO[1];
  const topCenter = project({ largo: 0, ancho: 0, profundidad: 0 });
  const bottomCenter = project({ largo: 0, ancho: 0, profundidad: profundidadR });
  return {
    topLeft: [topCenter[0] - A, topCenter[1]],
    topRight: [topCenter[0] + A, topCenter[1]],
    topCenter,
    bottomLeft: [bottomCenter[0] - A, bottomCenter[1]],
    bottomRight: [bottomCenter[0] + A, bottomCenter[1]],
    bottomCenter,
    rx: A,
    ry: B,
  };
}

export function cylinderAllPoints(c: CylinderProjected): Vec2[] {
  return [
    c.topLeft,
    c.topRight,
    [c.topCenter[0], c.topCenter[1] - c.ry],
    c.bottomLeft,
    c.bottomRight,
    [c.bottomCenter[0], c.bottomCenter[1] + c.ry],
  ];
}
