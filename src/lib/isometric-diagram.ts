// Geometría compartida para los diagramas 3D en perspectiva isométrica
// (caja y cilindro) de MeasureDiagram. Portado del prototipo verificado en
// diagrama-3d-prototipo.html (6 casos × 2 breakpoints, shape caja) y
// extendido con la misma lógica para el shape cilindro.
//
// Proyección isométrica FIJA (30° de fuga) — nunca se toca; lo único que
// varía por caso es el escalado uniforme + traslación (fitWithCeiling) y,
// para el cilindro, el radio de la elipse superior/inferior.

export type Point = [number, number];

const ISO_ANGLE = (30 * Math.PI) / 180;
export const COS30 = Math.cos(ISO_ANGLE);
export const SIN30 = Math.sin(ISO_ANGLE);

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function toNum(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Relación profundidad/medida-base, acotada a un rango razonable para que
// el sólido nunca se vea absurdamente aplastado ni absurdamente alto —
// mismo mecanismo que depthRatioFrom en el prototipo, generalizado.
export function depthRatioFrom(
  baseRaw: string | undefined,
  depthRaw: string | undefined,
  bounds: { min: number; max: number; fallback: number }
): { ratio: number; raw: number } {
  const base = toNum(baseRaw);
  const depth = toNum(depthRaw);
  if (base === null || depth === null) return { ratio: bounds.fallback, raw: bounds.fallback };
  const raw = depth / base;
  return { ratio: clamp(raw, bounds.min, bounds.max), raw };
}

export function formatMetric(raw: string | undefined, unit: string | undefined): string | null {
  const num = toNum(raw);
  if (num === null) return null;
  const formatted = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(num);
  return unit ? `${formatted} ${unit}` : formatted;
}

function sub(a: Point, b: Point): Point {
  return [a[0] - b[0], a[1] - b[1]];
}
function add(a: Point, b: Point): Point {
  return [a[0] + b[0], a[1] + b[1]];
}
function scaleV(a: Point, s: number): Point {
  return [a[0] * s, a[1] * s];
}
function mid(a: Point, b: Point): Point {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
function norm(a: Point): Point {
  const len = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / len, a[1] / len];
}
function dot(a: Point, b: Point): number {
  return a[0] * b[0] + a[1] * b[1];
}
function rotCW(v: Point): Point {
  return [v[1], -v[0]];
}
function rotCCW(v: Point): Point {
  return [-v[1], v[0]];
}

export type Fit = {
  project: (p: Point) => Point;
  viewBoxW: number;
  viewBoxH: number;
  k: number;
  widthRatio: number;
};

// Ajusta un set de puntos (bbox) a un viewBox: escala uniforme apuntando
// al techo del rango de ancho (92%) salvo que el techo de alto (maxHeight)
// sea más restrictivo — en ese caso el alto manda y el ancho puede caer
// bajo el piso (80%). Misma regla que fitWithCeiling en el prototipo.
export function fitWithCeiling(points: Point[], pad: number, viewBoxW: number, maxHeight: number): Fit {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const bboxW = maxX - minX;
  const bboxH = maxY - minY;
  const intW = viewBoxW - 2 * pad;
  const WIDTH_RATIO_HIGH = 0.92;
  const kByWidthHigh = (WIDTH_RATIO_HIGH * intW) / bboxW;
  const kByHeightCeiling = (maxHeight - 2 * pad) / bboxH;
  const k = Math.min(kByWidthHigh, kByHeightCeiling);
  const solidW = k * bboxW;
  const solidH = k * bboxH;
  const viewBoxH = solidH + 2 * pad;
  const offX = pad + (intW - solidW) / 2 - k * minX;
  const offY = pad - k * minY;
  const project = (p: Point): Point => [offX + k * p[0], offY + k * p[1]];
  return { project, viewBoxW, viewBoxH: viewBoxH, k, widthRatio: solidW / intW };
}

export function centroidOf(points: Point[]): Point {
  const sx = points.reduce((s, p) => s + p[0], 0);
  const sy = points.reduce((s, p) => s + p[1], 0);
  return [sx / points.length, sy / points.length];
}

// Cota (línea de medida + cajita de valor) entre dos puntos ABSOLUTOS
// (ya proyectados) A/B, con la normal derivada geométricamente
// (perpendicular a la arista, en el sentido que la aleja del centroide del
// sólido completo) — sin reglas hardcodeadas por nombre de arista.
export function placeCota(
  A: Point,
  B: Point,
  allAbsPoints: Point[],
  viewBoxW: number,
  viewBoxH: number,
  chipSize: [number, number]
): { M: Point; extEnd: Point; tickA: Point; tickB: Point; chipCenter: Point } {
  const EXT = 10;
  const TICK = 6;
  const K_DEFAULT = 27;
  const K_MIN = 18;

  const M = mid(A, B);
  const edgeDir = norm(sub(B, A));
  const centroid = centroidOf(allAbsPoints);
  const toM = sub(M, centroid);
  const nCW = norm(rotCW(edgeDir));
  const nCCW = norm(rotCCW(edgeDir));
  const n = dot(nCW, toM) >= dot(nCCW, toM) ? nCW : nCCW;

  const extEnd = add(M, scaleV(n, EXT));
  const tickA = add(extEnd, scaleV(edgeDir, TICK / 2));
  const tickB = add(extEnd, scaleV(edgeDir, -TICK / 2));

  const halfW = chipSize[0] / 2;
  const halfH = chipSize[1] / 2;
  const fits = (c: Point) =>
    c[0] - halfW >= 2 && c[0] + halfW <= viewBoxW - 2 && c[1] - halfH >= 2 && c[1] + halfH <= viewBoxH - 2;

  let k = K_DEFAULT;
  let chipCenter = add(M, scaleV(n, k));
  while (!fits(chipCenter) && k > K_MIN) {
    k -= 1;
    chipCenter = add(M, scaleV(n, k));
  }
  if (!fits(chipCenter)) {
    let dx = 0;
    let dy = 0;
    if (chipCenter[0] - halfW < 2) dx = 2 - (chipCenter[0] - halfW);
    if (chipCenter[0] + halfW > viewBoxW - 2) dx = viewBoxW - 2 - (chipCenter[0] + halfW);
    if (chipCenter[1] - halfH < 2) dy = 2 - (chipCenter[1] - halfH);
    if (chipCenter[1] + halfH > viewBoxH - 2) dy = viewBoxH - 2 - (chipCenter[1] + halfH);
    chipCenter = [chipCenter[0] + dx, chipCenter[1] + dy];
  }

  return { M, extEnd, tickA, tickB, chipCenter };
}

// ---- Sólido: caja (prisma) ----
// P0 = esquina cercana, P1 = +largo, P2 = +ancho, P3 = P1+P2 (esquina
// lejana), y el sufijo "d" = mismo punto desplazado +profundidad (vertical
// hacia abajo, eje Z literal [0, depthRatio]).
export type BoxPoints = {
  P0: Point;
  P1: Point;
  P2: Point;
  P3: Point;
  P0d: Point;
  P1d: Point;
  P2d: Point;
  P3d: Point;
};

const UNIT_L = 1;
const UNIT_W = 0.8;

export function buildLocalBox(depthRatio: number): BoxPoints {
  const l: Point = [COS30 * UNIT_L, SIN30 * UNIT_L];
  const w: Point = [-COS30 * UNIT_W, SIN30 * UNIT_W];
  const d: Point = [0, depthRatio * UNIT_L];
  const P0: Point = [0, 0];
  const P1: Point = [l[0], l[1]];
  const P2: Point = [w[0], w[1]];
  const P3: Point = [l[0] + w[0], l[1] + w[1]];
  return {
    P0,
    P1,
    P2,
    P3,
    P0d: add(P0, d),
    P1d: add(P1, d),
    P2d: add(P2, d),
    P3d: add(P3, d),
  };
}

// ---- Sólido: cilindro ----
// Elipse superior centrada en el origen local (radio R, achatada en Y por
// ELLIPSE_RY_RATIO para simular la misma perspectiva que la caja), elipse
// inferior = misma elipse desplazada +profundidad en Y.
export type CylinderPoints = {
  topLeft: Point;
  topRight: Point;
  topCenter: Point;
  bottomLeft: Point;
  bottomRight: Point;
  bottomCenter: Point;
  rx: number;
  ry: number;
};

const CYL_R = 0.5;
export const ELLIPSE_RY_RATIO = 0.42;

export function buildLocalCylinder(depthRatio: number): CylinderPoints {
  const ry = CYL_R * ELLIPSE_RY_RATIO;
  return {
    topLeft: [-CYL_R, 0],
    topRight: [CYL_R, 0],
    topCenter: [0, 0],
    bottomLeft: [-CYL_R, depthRatio],
    bottomRight: [CYL_R, depthRatio],
    bottomCenter: [0, depthRatio],
    rx: CYL_R,
    ry,
  };
}

// bbox del cilindro debe incluir el ápice superior de la elipse de arriba
// (topCenter.y - ry) y el ápice inferior de la de abajo (bottomCenter.y +
// ry), además de los puntos tangentes izq/der ya presentes.
export function cylinderBboxPoints(c: CylinderPoints): Point[] {
  return [
    c.topLeft,
    c.topRight,
    [c.topCenter[0], c.topCenter[1] - c.ry],
    c.bottomLeft,
    c.bottomRight,
    [c.bottomCenter[0], c.bottomCenter[1] + c.ry],
  ];
}
