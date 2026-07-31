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

// Escalado proporcional CON COMPRESIÓN NO LINEAL (ver conversación
// 2026-08-01, "Alternativa B — isométrico amortiguado", elegida tras
// exploración visual formal). Antes (proportionalRatios) cada medida se
// normalizaba de forma puramente lineal contra la mayor de todas — fiel a
// la proporción real, pero para casos extremos (ej. largo=12, ancho=6,
// profundidad=1,5 → ratio de profundidad = 0,125) el sólido colapsaba en
// una franja diagonal casi ilegible.
//
// La compresión NO se aplica parejo a todos los ejes: el eje dominante
// (ratio=1) nunca cambia, y los ejes que ya están razonablemente cerca
// del dominante (ratio >= COMPRESSION_THRESHOLD — el caso típico: un
// ancho suele ser 45-90% del largo) tampoco se tocan, así el caso normal
// se ve prácticamente igual a la escala lineal de antes. Solo los ejes
// MUY chicos en comparación (el caso típico: la profundidad de una
// excavación/radier suele ser una fracción chica del largo) se empujan
// hacia arriba con una potencia < 1 — cuanto más extremo el caso, mayor
// el empujón relativo, pero SIEMPRE por debajo de COMPRESSION_THRESHOLD
// (nunca "miente" haciendo que un eje chico se vea igual de grande que el
// dominante). Calibrado y verificado con capturas reales sobre 4,5×2,8×1,2
// (normal, cambio ~9% en profundidad — casi imperceptible), 8×4×2,
// 6×6×1, 15×3×2 y 12×6×1,5 (extremo, cambio ~90% en el eje más chico —
// nunca colapsa).
const COMPRESSION_THRESHOLD = 0.3;
const COMPRESSION_POWER = 0.25;

function compressRatio(ratio: number): number {
  if (ratio >= COMPRESSION_THRESHOLD) return ratio;
  return COMPRESSION_THRESHOLD * Math.pow(ratio / COMPRESSION_THRESHOLD, COMPRESSION_POWER);
}

// `floor` sigue siendo una red de seguridad para entradas degeneradas
// (ej. un valor casi 0) — con la compresión activa, en la práctica casi
// nunca es la compresión la que determina el resultado final, así que se
// baja de 0.15 a 0.12 (ver AXIS_RATIO_FLOOR en measure-diagram.tsx).
export function compressedRatios(dims: number[], floor: number): number[] {
  const maxDim = Math.max(...dims);
  return dims.map((d) => clamp(compressRatio(d / maxDim), floor, 1));
}

// Toma el valor ingresado (string crudo, coma o punto) o un default
// razonable si el campo todavía está vacío — para que el diagrama
// muestre una proporción genérica creíble antes de que el usuario escriba
// algo, en vez de una caja/cilindro degenerada.
export function numOrDefault(raw: string | undefined, fallback: number): number {
  return toNum(raw) ?? fallback;
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

// Ajusta un set de puntos (bbox) a un viewBox que se AMOLDA al contenido en
// sus 2 ejes (ancho Y alto), no solo al alto — antes viewBoxW era un valor
// fijo (340) y solo el alto se adaptaba al bbox; para un sólido angosto en
// pantalla (p.ej. profundidad >> largo/ancho) eso dejaba franjas vacías
// enormes a los costados, muy por debajo del 75-85% de ocupación del panel
// que pide la spec (ver conversación 2026-07-31). Ahora el eje MÁS LARGO
// del bbox (ancho o alto, el que sea) siempre se escala a CONTENT_TARGET
// px, y el otro eje se escala en la misma proporción (preserva forma) —
// así el sólido ocupa la misma fracción del panel sin importar si el
// dibujo es más ancho que alto o al revés.
export function fitWithCeiling(points: Point[], pad: number, contentTarget: number): Fit {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const bboxW = maxX - minX;
  const bboxH = maxY - minY;
  const k = contentTarget / Math.max(bboxW, bboxH);
  const solidW = k * bboxW;
  const solidH = k * bboxH;
  const viewBoxW = solidW + 2 * pad;
  const viewBoxH = solidH + 2 * pad;
  const offX = pad - k * minX;
  const offY = pad - k * minY;
  const project = (p: Point): Point => [offX + k * p[0], offY + k * p[1]];
  return { project, viewBoxW, viewBoxH, k, widthRatio: solidW / viewBoxW };
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

// largoRatio/anchoRatio/depthRatio: los 3 ejes normalizados contra el
// mayor de los 3, con compresión no lineal en los ejes chicos (ver
// compressedRatios) — antes largo/ancho eran constantes fijas [1, 0.8] y
// solo la profundidad variaba; ahora los 3 ejes reflejan la proporción
// real ingresada.
export function buildLocalBox(largoRatio: number, anchoRatio: number, depthRatio: number): BoxPoints {
  const l: Point = [COS30 * largoRatio, SIN30 * largoRatio];
  const w: Point = [-COS30 * anchoRatio, SIN30 * anchoRatio];
  const d: Point = [0, depthRatio];
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

export const ELLIPSE_RY_RATIO = 0.42;

// radiusRatio/depthRatio: normalizados contra el mayor de los 2 (diámetro
// vs. profundidad, ver compressedRatios) — antes el radio era una
// constante fija (0.5) y solo la profundidad variaba.
export function buildLocalCylinder(radiusRatio: number, depthRatio: number): CylinderPoints {
  const ry = radiusRatio * ELLIPSE_RY_RATIO;
  return {
    topLeft: [-radiusRatio, 0],
    topRight: [radiusRatio, 0],
    topCenter: [0, 0],
    bottomLeft: [-radiusRatio, depthRatio],
    bottomRight: [radiusRatio, depthRatio],
    bottomCenter: [0, depthRatio],
    rx: radiusRatio,
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

// ---- Superficie (m²) con espesor leve isométrico ----
// Decisión de diseño 2026-08-01 (tras exploración visual formal, ver
// docs/svg-diagram-system.md): un diagrama de ÁREA es ante todo una
// vista superior — SIN el escorzo isométrico completo de largo/ancho, la
// mejor lectura posible de "estas son las 2 medidas" — pero con un borde
// delgado de espesor en 2 aristas (frente y lado derecho) para que se
// sienta como una losa/radier físico, no un rectángulo abstracto. El
// espesor es SIEMPRE la misma fracción del lado mayor (SLAB_SKIRT_RATIO)
// — no representa ninguna medida real ingresada por el usuario, es
// puramente un recurso visual, igual que el "leve" del nombre.
export type SlabPoints = {
  TL: Point;
  TR: Point;
  BL: Point;
  BR: Point;
  frontBL: Point;
  frontBR: Point;
  sideTR: Point;
  sideBR: Point;
};

const SLAB_SKIRT_RATIO = 0.09;
const SLAB_SIDE_SKEW_RATIO = 0.05;

export function buildSlab(widthRatio: number, heightRatio: number): SlabPoints {
  const TL: Point = [0, 0];
  const TR: Point = [widthRatio, 0];
  const BL: Point = [0, heightRatio];
  const BR: Point = [widthRatio, heightRatio];
  const skirtH = SLAB_SKIRT_RATIO;
  const skew = SLAB_SIDE_SKEW_RATIO;
  return {
    TL,
    TR,
    BL,
    BR,
    frontBL: add(BL, [0, skirtH]),
    frontBR: add(BR, [0, skirtH]),
    sideTR: add(TR, [skew, skew * 0.6]),
    sideBR: add(BR, [skew, skew * 0.6]),
  };
}

export function slabBboxPoints(s: SlabPoints): Point[] {
  return [s.TL, s.TR, s.BL, s.BR, s.frontBL, s.frontBR, s.sideTR, s.sideBR];
}
