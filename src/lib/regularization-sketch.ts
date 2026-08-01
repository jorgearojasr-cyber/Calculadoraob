// Croquis (Fase 2D) — sin precedente reutilizable en el proyecto (ver
// diseño aprobado 2026-08-02): SVG propio, sin librería de dibujo.
//
// dataJson de RegularizationSketch es la única fuente de verdad. Esta
// función (elementsToPrimitives) traduce esa geometría a un puñado de
// primitivos neutrales (path + text) que tanto el editor (SVG de DOM)
// como el PDF (<Svg> de @react-pdf/renderer) consumen sin reimplementar
// la geometría — solo cambia cómo cada uno pinta un <path>/<Path> y un
// <text>/<Text>, no qué dibujar.
//
// Unidad interna: centímetros enteros. 1 unidad de coordenada = 1 cm —
// evita arrastrar floats y hace el JSON legible en crudo.

export const SKETCH_DATA_VERSION = 1;
export const SKETCH_GRID_SIZE = 10; // cm

// Mismo texto exacto en la UI del editor y en el PDF — una sola
// constante, para que no puedan divergir con el tiempo (decisión
// confirmada 2026-08-02).
export const SKETCH_DISCLAIMER = "Este croquis es solo referencial y no corresponde a un plano oficial.";

export type WallElement = {
  id: string;
  type: "wall";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
};

export type DoorElement = {
  id: string;
  type: "door";
  x: number;
  y: number;
  rotation: number; // grados
  width: number;
};

export type WindowElement = {
  id: string;
  type: "window";
  x: number;
  y: number;
  rotation: number;
  width: number;
};

export type DimensionElement = {
  id: string;
  type: "dimension";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string | null; // null = calcular automáticamente desde x1/y1/x2/y2
};

export type TextElement = {
  id: string;
  type: "text";
  x: number;
  y: number;
  content: string;
  fontSize: number;
};

export type SketchElement = WallElement | DoorElement | WindowElement | DimensionElement | TextElement;

export type SketchData = {
  version: number;
  unit: "cm";
  grid: { size: number };
  elements: SketchElement[];
};

export function createEmptySketchData(): SketchData {
  return { version: SKETCH_DATA_VERSION, unit: "cm", grid: { size: SKETCH_GRID_SIZE }, elements: [] };
}

export type PathPrimitive = {
  kind: "path";
  id: string;
  d: string;
  stroke: string;
  strokeWidth: number;
  fill: string | null;
  dashed: boolean;
};

export type TextPrimitive = {
  kind: "text";
  id: string;
  x: number;
  y: number;
  content: string;
  fontSize: number;
};

export type SketchPrimitive = PathPrimitive | TextPrimitive;

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function formatMeters(cm: number): string {
  return `${(cm / 100).toFixed(2)} m`;
}

function wallPrimitive(el: WallElement): PathPrimitive {
  return {
    kind: "path",
    id: el.id,
    d: `M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`,
    stroke: "#1a1a1a",
    strokeWidth: el.thickness,
    fill: null,
    dashed: false,
  };
}

function doorPrimitive(el: DoorElement): PathPrimitive {
  const rot = deg2rad(el.rotation);
  const x2 = el.x + el.width * Math.cos(rot);
  const y2 = el.y + el.width * Math.sin(rot);
  const leafRot = rot + Math.PI / 2;
  const leafX = el.x + el.width * Math.cos(leafRot);
  const leafY = el.y + el.width * Math.sin(leafRot);
  return {
    kind: "path",
    id: el.id,
    d: `M ${el.x} ${el.y} L ${leafX} ${leafY} A ${el.width} ${el.width} 0 0 1 ${x2} ${y2}`,
    stroke: "#1a1a1a",
    strokeWidth: 2,
    fill: null,
    dashed: false,
  };
}

function windowPrimitive(el: WindowElement): PathPrimitive {
  const rot = deg2rad(el.rotation);
  const dx = Math.cos(rot);
  const dy = Math.sin(rot);
  const nx = -dy;
  const ny = dx;
  const offset = 4; // cm entre las dos líneas del símbolo
  const x2 = el.x + el.width * dx;
  const y2 = el.y + el.width * dy;
  const a1x = el.x + offset * nx;
  const a1y = el.y + offset * ny;
  const a2x = x2 + offset * nx;
  const a2y = y2 + offset * ny;
  const b1x = el.x - offset * nx;
  const b1y = el.y - offset * ny;
  const b2x = x2 - offset * nx;
  const b2y = y2 - offset * ny;
  return {
    kind: "path",
    id: el.id,
    d: `M ${a1x} ${a1y} L ${a2x} ${a2y} M ${b1x} ${b1y} L ${b2x} ${b2y}`,
    stroke: "#2563eb",
    strokeWidth: 2,
    fill: null,
    dashed: false,
  };
}

function dimensionPrimitives(el: DimensionElement): [PathPrimitive, TextPrimitive] {
  const dx = el.x2 - el.x1;
  const dy = el.y2 - el.y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const tick = 5; // cm
  const t1ax = el.x1 + nx * tick;
  const t1ay = el.y1 + ny * tick;
  const t1bx = el.x1 - nx * tick;
  const t1by = el.y1 - ny * tick;
  const t2ax = el.x2 + nx * tick;
  const t2ay = el.y2 + ny * tick;
  const t2bx = el.x2 - nx * tick;
  const t2by = el.y2 - ny * tick;
  const midX = (el.x1 + el.x2) / 2 + nx * 8;
  const midY = (el.y1 + el.y2) / 2 + ny * 8;

  return [
    {
      kind: "path",
      id: el.id,
      d: `M ${t1ax} ${t1ay} L ${t1bx} ${t1by} M ${el.x1} ${el.y1} L ${el.x2} ${el.y2} M ${t2ax} ${t2ay} L ${t2bx} ${t2by}`,
      stroke: "#888888",
      strokeWidth: 1,
      fill: null,
      dashed: true,
    },
    {
      kind: "text",
      id: `${el.id}-label`,
      x: midX,
      y: midY,
      content: el.label ?? formatMeters(len),
      fontSize: 10,
    },
  ];
}

function textPrimitive(el: TextElement): TextPrimitive {
  return { kind: "text", id: el.id, x: el.x, y: el.y, content: el.content, fontSize: el.fontSize };
}

export function elementsToPrimitives(elements: SketchElement[]): SketchPrimitive[] {
  const primitives: SketchPrimitive[] = [];
  for (const el of elements) {
    if (el.type === "wall") primitives.push(wallPrimitive(el));
    else if (el.type === "door") primitives.push(doorPrimitive(el));
    else if (el.type === "window") primitives.push(windowPrimitive(el));
    else if (el.type === "dimension") primitives.push(...dimensionPrimitives(el));
    else if (el.type === "text") primitives.push(textPrimitive(el));
  }
  return primitives;
}

const PADDING = 60; // cm

export function computeViewBox(elements: SketchElement[]): { minX: number; minY: number; width: number; height: number } {
  if (elements.length === 0) return { minX: 0, minY: 0, width: 600, height: 450 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const consider = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  for (const el of elements) {
    if (el.type === "wall" || el.type === "dimension") {
      consider(el.x1, el.y1);
      consider(el.x2, el.y2);
    } else if (el.type === "door" || el.type === "window") {
      consider(el.x, el.y);
      const rot = deg2rad(el.rotation);
      consider(el.x + el.width * Math.cos(rot), el.y + el.width * Math.sin(rot));
    } else if (el.type === "text") {
      consider(el.x, el.y);
    }
  }

  return {
    minX: minX - PADDING,
    minY: minY - PADDING,
    width: maxX - minX + PADDING * 2,
    height: maxY - minY + PADDING * 2,
  };
}
