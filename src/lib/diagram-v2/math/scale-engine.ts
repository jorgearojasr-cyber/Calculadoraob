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
// Fase 7, sprint UX V1.2 (04-ago-2026): 0.25 → 0.45. Con 0.25, una
// proporción muy chica (ej. la Zanja del mockup, ancho/largo=0,05) se
// empujaba a ~0,19 — casi 4x su proporción real, lo que se leía como
// "deformado" en Piscinas/Excavación. 0.45 sigue evitando que colapse en
// una franja ilegible (ver AXIS_RATIO_FLOOR) pero se acerca más a la
// proporción real del objeto. Los casos ya razonables (ratio cercano al
// threshold, ej. una piscina típica profundidad/largo=0,25) casi no
// cambian — el ajuste se nota en los casos extremos, no en los normales.
// Cálculo (fórmula del motor de resultados) sin cambios — ver
// src/lib/formula-engine, no tocado en esta fase.
const COMPRESSION_POWER = 0.45;
const AXIS_RATIO_FLOOR = 0.12;

function compressRatioWithPower(ratio: number, power: number): number {
  if (ratio >= COMPRESSION_THRESHOLD) return ratio;
  return COMPRESSION_THRESHOLD * Math.pow(ratio / COMPRESSION_THRESHOLD, power);
}

function compressRatio(ratio: number): number {
  return compressRatioWithPower(ratio, COMPRESSION_POWER);
}

export function compressedRatios(dims: number[]): number[] {
  const maxDim = Math.max(...dims);
  return dims.map((d) => clamp(compressRatio(d / maxDim), AXIS_RATIO_FLOOR, 1));
}

// Fase 2 (Radier, auditoría de proporción del diagrama de caja con
// profundidad — ej. 6×4×0,08 se veía con el espesor casi tan grueso como
// el ancho). Piso MÁS BAJO, específico para el eje "profundidad" de una
// caja (largo/ancho/espesor) — separado de AXIS_RATIO_FLOOR a propósito:
// ese piso genérico (0.12) sigue usándose tal cual para círculo/foundation
// (sin tocar esos call sites), pero para una caja la profundidad es
// conceptualmente distinta de largo/ancho — casi siempre la dimensión más
// chica por lejos (espesor de radier/losa/muro), y 0.12 (12% del eje
// dominante) todavía se lee como "una tercera dimensión casi tan grande
// como el ancho" en proporciones extremas. Verificado que NO afecta casos
// donde la profundidad ya es proporcionalmente grande (Pilar/columna,
// Piscinas): ahí compressRatio() da un valor bien por encima de ambos
// pisos, así que ninguno de los dos clampea — el cambio solo se nota en
// los casos extremos (espesores finos), igual que ya documentó Sprint UX
// V1.2 para COMPRESSION_POWER.
const DEPTH_AXIS_RATIO_FLOOR = 0.045;

// Fase 4 (13-ago-2026): además del piso más bajo (arriba), el eje
// profundidad de una caja usa una potencia de compresión MÁS ALTA que
// COMPRESSION_POWER (0.45) — más alta = menos "inflado" hacia el eje
// dominante = más fiel a la proporción real, MUY chica en una losa
// delgada. 0.45 es el ajuste genérico ya validado en Sprint UX V1.2 para
// TODOS los ejes de TODAS las formas (círculo/foundation/box); acá se
// afina solo el eje profundidad de una caja para que un radier/losa se
// lea claramente como "losa delgada" y no como "caja/cubo" (auditoría
// visual Fase 4) — verificado a mano que con Radier (6×4×0,08m) la razón
// largo:espesor pasa de ~13,5:1 (con COMPRESSION_POWER) a ~18,5:1 con este
// valor, sin llegar a un hilo invisible (el piso de arriba sigue
// garantizando un mínimo). Para Jardinera (la única otra caja publicada
// con profundidad chica, 0,5/4=0,125) el efecto es menor (~0,202 -> ~0,185
// de proporción, ~8% más delgado) — verificado que sigue viéndose bien.
const DEPTH_COMPRESSION_POWER = 0.55;

export function compressedBoxRatios(largo: number, ancho: number, profundidad: number): [number, number, number] {
  const maxDim = Math.max(largo, ancho, profundidad);
  return [
    clamp(compressRatio(largo / maxDim), AXIS_RATIO_FLOOR, 1),
    clamp(compressRatio(ancho / maxDim), AXIS_RATIO_FLOOR, 1),
    clamp(compressRatioWithPower(profundidad / maxDim, DEPTH_COMPRESSION_POWER), DEPTH_AXIS_RATIO_FLOOR, 1),
  ];
}

// Fases 5 y 6 (Radier, 13-ago-2026) intentaron resolver kind="slab" con
// una función acá (`compressedSlabRatios`, ya retirada) que seguía
// tratando el espesor como un RATIO dentro del mismo sólido 3D que largo/
// ancho — 2 rondas de bajar el rango (0,035-0,07 → 0,02-0,045) no
// bastaron ("sigue pareciendo una caja" — feedback del usuario), porque
// el problema no era el número: `fitToSilhouette` seguía escalando el
// sólido COMPLETO (incluida la profundidad) al panel, así que la cara
// superior nunca llegaba a ocupar el máximo espacio posible por sí sola.
// Fase 7 cambia de enfoque: kind="slab" ahora arma su cara superior con
// `buildSlabTop` (math/solids.ts) — SIN ningún punto de profundidad — y
// el llamador (DiagramV2.tsx) ajusta el panel usando SOLO esa cara,
// agregando el espesor DESPUÉS en píxeles fijos, fuera de este archivo.
// compressedRatios (arriba) sigue sirviendo para largo/ancho, sin cambios.

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
