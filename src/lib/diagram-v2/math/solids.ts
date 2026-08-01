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
export function buildBox(largoR: number, anchoR: number, profundidadR: number): BoxProjected {
  const p = (largo: number, ancho: number, profundidad: number) => project({ largo, ancho, profundidad });
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

// Proporción de achatado de la elipse (vista de un círculo desde esta
// cámara) — no hay un valor "correcto" único para una proyección
// simplificada de 2 ejes oblicuos + 1 vertical (una axonométrica real de
// 3 ejes a 120° tiene una fórmula distinta); se ajusta por criterio
// visual contra el mockup en la Fase 0 (ver conversación 2026-08-01).
const ELLIPSE_RY_RATIO = 0.32;

export function buildCylinder(radiusR: number, profundidadR: number): CylinderProjected {
  // rx real = radiusR proyectado sobre el eje "largo" (cos del ángulo de
  // cámara) — el radio horizontal 2D no es 1:1 con el radio real, igual
  // que cualquier otro largo medido a lo largo de ese eje.
  const rx = radiusR * AXIS_LARGO[0];
  const ry = radiusR * ELLIPSE_RY_RATIO;
  return {
    topLeft: project({ largo: -radiusR, ancho: 0, profundidad: 0 }),
    topRight: project({ largo: radiusR, ancho: 0, profundidad: 0 }),
    topCenter: project({ largo: 0, ancho: 0, profundidad: 0 }),
    bottomLeft: project({ largo: -radiusR, ancho: 0, profundidad: profundidadR }),
    bottomRight: project({ largo: radiusR, ancho: 0, profundidad: profundidadR }),
    bottomCenter: project({ largo: 0, ancho: 0, profundidad: profundidadR }),
    rx,
    ry,
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
