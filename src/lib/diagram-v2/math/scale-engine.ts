// Motor de escalado — traduce medidas reales (metros) a proporciones
// locales (0-1) para la geometría, y ajusta un set de puntos YA
// proyectados a un viewBox que llena ~80-85% del panel sin alto fijo
// (ver especificación aprobada, "el panel sigue al objeto").

import type { Vec2 } from "./vec2";
import { bboxOf, clamp } from "./vec2";

// Compresión no lineal — reutilizada del sistema anterior (ver auditoría
// Diagram System V2: la idea es independiente de la cámara). El eje
// dominante (ratio=1) nunca cambia; los ejes ya razonablemente cerca del
// dominante (ratio >= COMPRESSION_THRESHOLD) tampoco se tocan; solo los
// ejes MUY chicos en comparación se empujan hacia arriba con una potencia
// < 1, para que ninguna proporción extrema (ej. 12×0,6×0,8, la Zanja del
// mockup) colapse en una franja ilegible.
const COMPRESSION_THRESHOLD = 0.3;
const COMPRESSION_POWER = 0.25;
const AXIS_RATIO_FLOOR = 0.12;

function compressRatio(ratio: number): number {
  if (ratio >= COMPRESSION_THRESHOLD) return ratio;
  return COMPRESSION_THRESHOLD * Math.pow(ratio / COMPRESSION_THRESHOLD, COMPRESSION_POWER);
}

export function compressedRatios(dims: number[]): number[] {
  const maxDim = Math.max(...dims);
  return dims.map((d) => clamp(compressRatio(d / maxDim), AXIS_RATIO_FLOOR, 1));
}

export type Fit = {
  project: (p: Vec2) => Vec2;
  viewBoxW: number;
  viewBoxH: number;
  k: number;
};

// El eje MÁS LARGO del bbox (ancho o alto, el que sea) se escala a
// `contentTarget`, y `pad` es el margen fijo alrededor — juntos
// determinan qué fracción del panel ocupa el sólido en su eje dominante
// (contentTarget / (contentTarget + 2*pad)). El eje NO dominante queda
// en lo que resulte según la proporción real del objeto — así es como el
// propio mockup lo reporta (algunos ejemplos "84% del ancho", otros "84%
// del alto": siempre se mide en el eje que manda, nunca se fuerza el
// mismo % en los 2 a la vez, porque eso deformaría la proporción real).
export function fitToSilhouette(points: Vec2[], pad: number, contentTarget: number): Fit {
  const { minX, maxX, minY, maxY } = bboxOf(points);
  const bboxW = maxX - minX;
  const bboxH = maxY - minY;
  const k = contentTarget / Math.max(bboxW, bboxH);
  const solidW = k * bboxW;
  const solidH = k * bboxH;
  const viewBoxW = solidW + 2 * pad;
  const viewBoxH = solidH + 2 * pad;
  const offX = pad - k * minX;
  const offY = pad - k * minY;
  return {
    project: (p: Vec2) => [offX + k * p[0], offY + k * p[1]],
    viewBoxW,
    viewBoxH,
    k,
  };
}

export type FinalCanvas = {
  viewBoxW: number;
  viewBoxH: number;
  translate: Vec2;
};

// El sólido en sí ocupa ~84% del panel (fitToSilhouette), pero los
// carriles de cota — sobre todo el de profundidad, siempre a la
// derecha, fuera de la silueta — se dibujan MÁS ALLÁ del bbox del sólido
// solo. Si el viewBox se quedara del tamaño del sólido, esos carriles
// (y sus chips) quedarían recortados por el borde del panel. Este paso
// final crece el viewBox lo justo para contener TODO lo que se va a
// dibujar (sólido + carriles + chips), sin volver a escalar `k` — el
// objeto conserva su tamaño ya calculado, el panel simplemente se agranda
// para mostrarlo completo.
export function finalizeCanvas(currentW: number, currentH: number, extraPoints: Vec2[], margin: number): FinalCanvas {
  const xs = [0, currentW, ...extraPoints.map((p) => p[0])];
  const ys = [0, currentH, ...extraPoints.map((p) => p[1])];
  const minX = Math.min(...xs) - margin;
  const maxX = Math.max(...xs) + margin;
  const minY = Math.min(...ys) - margin;
  const maxY = Math.max(...ys) + margin;
  return {
    viewBoxW: maxX - minX,
    viewBoxH: maxY - minY,
    translate: [-minX, -minY],
  };
}
