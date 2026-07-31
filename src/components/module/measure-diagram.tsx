"use client";

import { useId } from "react";
import {
  buildLocalBox,
  buildLocalCylinder,
  cylinderBboxPoints,
  fitWithCeiling,
  formatMetric,
  numOrDefault,
  proportionalRatios,
  type Point,
} from "@/lib/isometric-diagram";

// Diagrama SVG para mostrar QUÉ medida se está pidiendo (no reemplaza el
// campo numérico). Generalizado a todos los grupos de exactamente 2 campos
// de medida (shapes "rectangle"/"circle", vista plana) y a los grupos de
// caja/cilindro con profundidad (shapes "*-with-depth", perspectiva 3D
// isométrica) — ver DIMENSION_DIAGRAMS en question-group-step.tsx.
export function MeasureDiagram({
  shape,
  primaryLabel,
  secondaryLabel,
  depthLabel,
  primaryValue,
  secondaryValue,
  depthValue,
  primaryUnit,
  secondaryUnit,
  depthUnit,
}: {
  shape: "rectangle" | "rectangle-with-depth" | "circle" | "circle-with-depth";
  primaryLabel: string;
  secondaryLabel?: string;
  depthLabel?: string;
  // Valores en vivo de los campos numéricos asociados (string crudo del
  // input, con coma o punto decimal) — opcional: si no se pasan, el borde
  // simplemente muestra la etiqueta genérica en vez del valor.
  primaryValue?: string;
  secondaryValue?: string;
  depthValue?: string;
  primaryUnit?: string;
  secondaryUnit?: string;
  depthUnit?: string;
}) {
  const rawId = useId();
  const markerId = `md-arrow-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  if (shape === "rectangle-with-depth" && depthLabel) {
    return (
      <IsometricBoxDiagram
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel ?? ""}
        depthLabel={depthLabel}
        primaryValue={primaryValue}
        secondaryValue={secondaryValue}
        depthValue={depthValue}
        primaryUnit={primaryUnit}
        secondaryUnit={secondaryUnit}
        depthUnit={depthUnit}
      />
    );
  }

  if (shape === "circle-with-depth" && depthLabel) {
    return (
      <IsometricCylinderDiagram
        primaryLabel={primaryLabel}
        depthLabel={depthLabel}
        primaryValue={primaryValue}
        depthValue={depthValue}
        primaryUnit={primaryUnit}
        depthUnit={depthUnit}
      />
    );
  }

  // Mismo lenguaje visual que los diagramas 3D (ver docs/svg-diagram-system.md):
  // relleno sólido gris muy claro (nunca rayado/semi-transparente), flechas
  // naranjas. Etiquetas en texto simple junto a la flecha (ver ajuste
  // 2026-07-31 "regla de las etiquetas": acá nunca se combina la palabra
  // descriptiva + el valor en un mismo rótulo — es una u otra — así que
  // nunca se justifica la cajita blanca/borde azul, solo texto de cotas
  // estilo AutoCAD/Revit).
  if (shape === "circle") {
    const cx = 110;
    const cy = 66;
    const r = 50;
    const textPos: Point = [cx, cy + r + DIM_GAP + TEXT_GAP];
    return (
      <svg viewBox="0 0 220 158" className="w-full" role="img" aria-label={`Diagrama de ${primaryLabel}`}>
        <defs>
          <OrangeArrowMarker id={markerId} />
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={TOP_FILL} stroke={SOLID_STROKE} strokeWidth="2.5" />
        <line
          x1={cx - r + 8}
          y1={cy}
          x2={cx + r - 8}
          y2={cy}
          stroke={DIM_ORANGE}
          strokeWidth="1.6"
          strokeLinecap="round"
          markerStart={`url(#${markerId})`}
          markerEnd={`url(#${markerId})`}
        />
        <line x1={cx} y1={cy + r} x2={cx} y2={cy + r + DIM_GAP} stroke="#8C8579" strokeWidth="1" />
        <DimText center={textPos} text={dimText(primaryValue, primaryUnit, primaryLabel)} />
      </svg>
    );
  }

  const rx0 = 84;
  const ry0 = 20;
  const rw = 130;
  const rh = 86;
  const primaryTextPos: Point = [rx0 + rw / 2, ry0 + rh + DIM_GAP + TEXT_GAP];
  const secondaryTextPos: Point = [rx0 - DIM_GAP - TEXT_GAP, ry0 + rh / 2];

  return (
    <svg viewBox="0 0 300 158" className="w-full" role="img" aria-label={`Diagrama de ${primaryLabel}${secondaryLabel ? `, ${secondaryLabel}` : ""}`}>
      <defs>
        <OrangeArrowMarker id={markerId} />
      </defs>

      {/* Rectángulo principal (vista en planta) — sólido, mismo relleno
          "cara superior" que la caja/cilindro isométricos. */}
      <rect x={rx0} y={ry0} width={rw} height={rh} rx="2" fill={TOP_FILL} stroke={SOLID_STROKE} strokeWidth="2.5" />

      {/* Flecha horizontal, sobre el borde inferior real */}
      <line
        x1={rx0 + 10}
        y1={ry0 + rh}
        x2={rx0 + rw - 10}
        y2={ry0 + rh}
        stroke={DIM_ORANGE}
        strokeWidth="1.6"
        strokeLinecap="round"
        markerStart={`url(#${markerId})`}
        markerEnd={`url(#${markerId})`}
      />
      <line x1={rx0 + rw / 2} y1={ry0 + rh} x2={rx0 + rw / 2} y2={ry0 + rh + DIM_GAP} stroke="#8C8579" strokeWidth="1" />
      <DimText center={primaryTextPos} text={dimText(primaryValue, primaryUnit, primaryLabel)} />

      {/* Flecha vertical, sobre el borde izquierdo real */}
      {secondaryLabel && (
        <>
          <line
            x1={rx0}
            y1={ry0 + 10}
            x2={rx0}
            y2={ry0 + rh - 10}
            stroke={DIM_ORANGE}
            strokeWidth="1.6"
            strokeLinecap="round"
            markerStart={`url(#${markerId})`}
            markerEnd={`url(#${markerId})`}
          />
          <line x1={rx0} y1={ry0 + rh / 2} x2={rx0 - DIM_GAP} y2={ry0 + rh / 2} stroke="#8C8579" strokeWidth="1" />
          <DimText center={secondaryTextPos} text={dimText(secondaryValue, secondaryUnit, secondaryLabel)} />
        </>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------
// Texto de cota en vivo — reemplaza la antigua "cajita" (fondo blanco,
// borde azul). Ver conversación 2026-07-31 "regla de las etiquetas": una
// cajita SOLO se justifica cuando el rótulo combina una palabra
// descriptiva + el valor (ej. "Largo" + "4,50 m" en 2 líneas); acá el
// rótulo siempre es UNA cosa u otra — la etiqueta genérica ("Largo")
// antes de escribir, o el valor ("4,50 m") después — nunca las 2 juntas,
// así que la cajita nunca se justifica: siempre texto simple estilo cota
// técnica (AutoCAD/Revit/SketchUp), pegado a su flecha.
// ---------------------------------------------------------------------
function dimText(raw: string | undefined, unit: string | undefined, label: string): string {
  return formatMetric(raw, unit) ?? label;
}

function DimText({ center, text }: { center: Point; text: string }) {
  return (
    <text
      x={center[0]}
      y={center[1]}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={LABEL_FONT_SIZE}
      fontWeight="600"
      fontFamily="monospace"
      fill={SOLID_STROKE}
    >
      {text}
    </text>
  );
}

// PAD chico + viewBox que se amolda al contenido en sus 2 ejes (ver
// fitWithCeiling en isometric-diagram.ts) para que el sólido ocupe
// siempre la misma fracción del panel sin importar su proporción — ver
// conversación 2026-07-31 "el SVG debe ocupar 75-85% del panel, no un
// dibujo chico centrado con espacio vacío alrededor". CONTENT_TARGET=205
// + PAD=20 da 205/(205+40) ≈ 84% de ocupación en el eje más largo del
// sólido — más grande que antes (80%) porque las etiquetas ya no
// necesitan una cajita de 72×24 + 50px de separación: texto chico pegado
// a la flecha libera espacio que ahora va al sólido (ver conversación
// 2026-07-31, "acorta flechas/etiquetas, agranda el prisma"). El eje NO
// dominante (bbox más chico de los 2) queda algo por debajo de esa
// fracción según la proporción real del sólido — es inherente a
// preservar la proporción real (ver escalado proporcional): un
// largo=4,5/ancho=2,8 real nunca es cuadrado, así que forzar los 2 ejes
// al mismo % simultáneamente deformaría la proporción, justo lo que se
// corrigió en la vuelta anterior.
const PAD = 20;
const CONTENT_TARGET = 205;
// Tamaño de letra de las cotas — ~35% más chico que la cajita anterior
// (10px) para que el usuario reconozca la FORMA primero y lea las
// medidas después, no al revés (ver conversación 2026-07-31).
const LABEL_FONT_SIZE = 6.5;
// Separación arista→línea de cota (antes 18-50px según la cota, con
// cajitas "flotando" lejos de su flecha) y línea de cota→texto — ambas
// chicas a propósito para que la etiqueta quede pegada a su flecha.
const DIM_GAP = 11;
const TEXT_GAP = 7;
// Distancia de empuje para PointDimension (largo/ancho/diámetro) — antes
// 50px con cajita; se acorta a 36 (~28% menos) para que la etiqueta quede
// más pegada al sólido, manteniendo el margen suficiente para despejar la
// cara superior en toda proporción (ver comentario en DimensionLine).
const POINT_DIM_DIST = 36;
// Margen de seguridad para no recortar el texto contra el borde del
// viewBox (reemplaza el antiguo CHIP_SIZE, ya no hay cajita que clampear
// por tamaño real — solo un margen aproximado para texto de cota corto).
const LABEL_MARGIN_X = 24;
const LABEL_MARGIN_Y = 8;
// Piso de cada eje normalizado contra el mayor de los 3 (ver
// proportionalRatios en isometric-diagram.ts) — evita que un eje mucho
// más chico que los otros desaparezca visualmente (queda en ~15% del
// tamaño del eje mayor, sigue leyéndose "chico" pero no colapsa a 0). NO
// es un piso por eje fijo tipo DEPTH_RATIO_BOUNDS de antes: acá los 3 ejes
// (largo, ancho, profundidad) se recalculan juntos desde las medidas
// reales — ver conversación 2026-07-31, bug real: 4×4×5 y 10×2×1 se veían
// casi iguales porque largo/ancho eran constantes fijas y solo la
// profundidad variaba.
const AXIS_RATIO_FLOOR = 0.15;
// Valores genéricos mientras el usuario no ha escrito nada — misma
// proporción "creíble" que tenía el diagrama antes de este ajuste.
const DEFAULT_L = 4.5;
const DEFAULT_W = 2.8;
const DEFAULT_D = 1.2;
const DEFAULT_DIAMETRO = 4;
const DEFAULT_PROFUNDIDAD_CIL = 1.5;
// Naranjo de marca (mismo #FF4E00 que los CTA) — reservado acá para la
// flecha de doble punta de cada cota, nunca para el sólido en sí (ver
// conversación 2026-07-30, rediseño de diagrama de volumen).
const DIM_ORANGE = "#FF4E00";
// Sólido opaco (ver ajuste 2026-07-30 "no wireframe"): cara superior gris
// muy claro, caras laterales blancas, contorno azul grueso — sin caras
// transparentes, sin aristas ocultas, sin líneas punteadas. El volumen se
// lee de un vistazo por el contorno + la sombra de color de la cara de
// arriba, no por transparencias.
const TOP_FILL = "#EEF2F6";
const SIDE_FILL = "#FFFFFF";
const SOLID_STROKE = "#002152";

function sub2(a: Point, b: Point): Point {
  return [a[0] - b[0], a[1] - b[1]];
}
function mid2(a: Point, b: Point): Point {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
function len2(a: Point): number {
  return Math.hypot(a[0], a[1]) || 1;
}
function norm2(a: Point): Point {
  const l = len2(a);
  return [a[0] / l, a[1] / l];
}
function clampLabelCenter(center: Point, viewBoxW: number, viewBoxH: number): Point {
  let [x, y] = center;
  if (x - LABEL_MARGIN_X < 0) x = LABEL_MARGIN_X;
  if (x + LABEL_MARGIN_X > viewBoxW) x = viewBoxW - LABEL_MARGIN_X;
  if (y - LABEL_MARGIN_Y < 0) y = LABEL_MARGIN_Y;
  if (y + LABEL_MARGIN_Y > viewBoxH) y = viewBoxH - LABEL_MARGIN_Y;
  return [x, y];
}

// Definición del marker de flecha naranja, compartida por todas las cotas.
function OrangeArrowMarker({ id }: { id: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 Z" fill={DIM_ORANGE} />
    </marker>
  );
}

// ---------------------------------------------------------------------
// Cota "de arista completa" — línea de cota paralela a la arista real
// (desplazada `gap` hacia afuera, con 2 líneas de extensión finas desde
// la arista), flecha de doble punta del largo EXACTO de la arista medida,
// y el texto chico pegado justo afuera de la línea. Usada SOLO para
// profundidad: esa arista siempre queda en el borde exterior de la
// silueta completa (nunca bajo la cara superior), así que un `gap` chico
// alcanza para despejarla. `outward` no necesita ser perpendicular a la
// arista: como se aplica el MISMO vector a los 2 extremos, cualquier
// dirección constante produce una copia paralela válida.
//
// OJO: largo/ancho (y diámetro) NO usan este componente — ver
// PointDimension más abajo. La arista P0d-P2d/P0d-P1d de largo/ancho
// queda a media altura de la silueta completa (P0d no es el punto más
// bajo del sólido), y la cara superior se extiende diagonalmente mucho
// más abajo que esa arista (hasta la esquina lejana P3) — un offset chico
// desde esa arista, en CUALQUIER dirección perpendicular, sigue quedando
// debajo de la cara superior para ciertas proporciones (ver conversación
// 2026-07-31, verificado con capturas reales: la cota terminaba cruzando
// por encima del prisma). PointDimension empuja un único punto bien lejos
// del centro del dibujo en vez de una arista completa cerca del sólido.
// ---------------------------------------------------------------------
function DimensionLine({
  A,
  B,
  outward,
  gap,
  markerId,
  text,
  viewBoxW,
  viewBoxH,
}: {
  A: Point;
  B: Point;
  outward: Point;
  gap: number;
  markerId: string;
  text: string;
  viewBoxW: number;
  viewBoxH: number;
}) {
  const n = norm2(outward);
  const A2: Point = [A[0] + n[0] * gap, A[1] + n[1] * gap];
  const B2: Point = [B[0] + n[0] * gap, B[1] + n[1] * gap];
  const mid = mid2(A2, B2);
  const textPos = clampLabelCenter([mid[0] + n[0] * TEXT_GAP, mid[1] + n[1] * TEXT_GAP], viewBoxW, viewBoxH);
  return (
    <g>
      <line x1={A[0]} y1={A[1]} x2={A2[0]} y2={A2[1]} stroke="#8C8579" strokeWidth="1" />
      <line x1={B[0]} y1={B[1]} x2={B2[0]} y2={B2[1]} stroke="#8C8579" strokeWidth="1" />
      <line
        x1={A2[0]}
        y1={A2[1]}
        x2={B2[0]}
        y2={B2[1]}
        stroke={DIM_ORANGE}
        strokeWidth="1.6"
        strokeLinecap="round"
        markerStart={`url(#${markerId})`}
        markerEnd={`url(#${markerId})`}
      />
      <DimText center={textPos} text={text} />
    </g>
  );
}

// ---------------------------------------------------------------------
// Cota "de punto" — flecha CORTA (no la arista completa) anclada a un
// único punto, empujado `dist` derecho hacia abajo desde el punto medio
// de la arista real — usada para largo/ancho/diámetro. Empuje fijo hacia
// abajo (no perpendicular a la arista, ver comentario en DimensionLine)
// porque a esta distancia SÍ alcanza a despejar la cara superior para
// toda proporción, verificado con capturas reales (ver conversación
// 2026-07-31). La flecha corta (no la arista entera) evita que una arista
// larga (p.ej. largo=10m vs. ancho=2m) se lea como una línea cruzando
// gran parte del diagrama.
// ---------------------------------------------------------------------
function PointDimension({
  A,
  B,
  dist,
  markerId,
  text,
  viewBoxW,
  viewBoxH,
}: {
  A: Point;
  B: Point;
  dist: number;
  markerId: string;
  text: string;
  viewBoxW: number;
  viewBoxH: number;
}) {
  const mid = mid2(A, B);
  const target: Point = [mid[0], mid[1] + dist];
  const textPos = clampLabelCenter(target, viewBoxW, viewBoxH);
  const leaderStart: Point = [mid[0], mid[1] + dist * 0.4];
  const edgeDir = norm2(sub2(B, A));
  const arrowHalf = 12;
  const at: Point = [textPos[0], textPos[1] - TEXT_GAP];
  const arrowA: Point = [at[0] - edgeDir[0] * arrowHalf, at[1] - edgeDir[1] * arrowHalf];
  const arrowB: Point = [at[0] + edgeDir[0] * arrowHalf, at[1] + edgeDir[1] * arrowHalf];
  return (
    <g>
      <line x1={leaderStart[0]} y1={leaderStart[1]} x2={textPos[0]} y2={textPos[1]} stroke="#8C8579" strokeWidth="1" />
      <line
        x1={arrowA[0]}
        y1={arrowA[1]}
        x2={arrowB[0]}
        y2={arrowB[1]}
        stroke={DIM_ORANGE}
        strokeWidth="1.6"
        strokeLinecap="round"
        markerStart={`url(#${markerId})`}
        markerEnd={`url(#${markerId})`}
      />
      <DimText center={textPos} text={text} />
    </g>
  );
}

// ---------------------------------------------------------------------
// Caja en perspectiva 3D — largo × ancho × profundidad.
// ---------------------------------------------------------------------
function IsometricBoxDiagram({
  primaryLabel,
  secondaryLabel,
  depthLabel,
  primaryValue,
  secondaryValue,
  depthValue,
  primaryUnit,
  secondaryUnit,
  depthUnit,
}: {
  primaryLabel: string;
  secondaryLabel: string;
  depthLabel: string;
  primaryValue?: string;
  secondaryValue?: string;
  depthValue?: string;
  primaryUnit?: string;
  secondaryUnit?: string;
  depthUnit?: string;
}) {
  const rawId = useId();
  const markerId = `md-dim-arrow-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const largoNum = numOrDefault(primaryValue, DEFAULT_L);
  const anchoNum = numOrDefault(secondaryValue, DEFAULT_W);
  const depthNum = numOrDefault(depthValue, DEFAULT_D);
  const [largoRatio, anchoRatio, depthRatio] = proportionalRatios([largoNum, anchoNum, depthNum], AXIS_RATIO_FLOOR);
  const local = buildLocalBox(largoRatio, anchoRatio, depthRatio);
  // Ojo: P3d (esquina lejana + profundidad) no forma parte de NINGUNA cara
  // visible (ni el techo P0-P1-P3-P2 ni las 2 paredes) — si entra al bbox
  // usado para escalar, el algoritmo reserva espacio para un punto que
  // nunca se dibuja y el sólido real queda más chico que el 75-85% target
  // (ver medición 2026-07-31: bbox con P3d daba ~78% de alto REAL cuando
  // el cálculo apuntaba a 80%, hasta un 20pp más chico en casos extremos).
  const visiblePoints = [local.P0, local.P1, local.P2, local.P3, local.P0d, local.P1d, local.P2d];
  const fit = fitWithCeiling(visiblePoints, PAD, CONTENT_TARGET);
  const P = {
    P0: fit.project(local.P0),
    P1: fit.project(local.P1),
    P2: fit.project(local.P2),
    P3: fit.project(local.P3),
    P0d: fit.project(local.P0d),
    P1d: fit.project(local.P1d),
    P2d: fit.project(local.P2d),
    P3d: fit.project(local.P3d),
  };
  const poly = (pts: Point[]) => pts.map((p) => `${p[0]},${p[1]}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${fit.viewBoxW} ${fit.viewBoxH}`}
      className="w-full"
      role="img"
      aria-label={`Diagrama de ${primaryLabel}, ${secondaryLabel} y ${depthLabel}`}
    >
      <defs>
        <OrangeArrowMarker id={markerId} />
      </defs>

      {/* Prisma SÓLIDO y opaco (ver ajuste 2026-07-30 "no wireframe"): 3
          caras rellenas, contorno azul grueso, sin caras ocultas, sin
          transparencias — el volumen se lee de un vistazo.

          OJO: esta proyección (largo, ancho y profundidad apuntando hacia
          "abajo" en pantalla, no repartidos en 360°) hace que la
          proyección 2D del rombo superior (P0-P1-P3-P2) y las paredes
          laterales SIEMPRE se superpongan en algún grado (verificado
          numéricamente para toda proporción, no es un caso borde) —
          ninguna elección de polígono evita la superposición en 2D. La
          solución correcta no es "evitar la superposición" sino pintar en
          el orden Z real: el rombo superior es la cara más CERCANA al
          espectador en esta cámara fija (el borde/reborde que se ve "por
          encima" del hoyo/bloque), así que se dibuja AL FINAL, encima de
          las paredes — el algoritmo del pintor resuelve la superposición
          mostrando siempre la cara correcta, para cualquier profundidad
          (ver conversación 2026-07-31, escalado proporcional real). Antes
          se dibujaba el rombo/triángulo PRIMERO y las paredes después, por
          lo que una profundidad grande tapaba la cara superior entera. */}
      <polygon
        points={poly([P.P0, P.P2, P.P2d, P.P0d])}
        fill={SIDE_FILL}
        stroke={SOLID_STROKE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon
        points={poly([P.P0, P.P1, P.P1d, P.P0d])}
        fill={SIDE_FILL}
        stroke={SOLID_STROKE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon
        points={poly([P.P0, P.P1, P.P3, P.P2])}
        fill={TOP_FILL}
        stroke={SOLID_STROKE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Profundidad: cota lateral sobre la arista vertical derecha */}
      <DimensionLine
        A={P.P1}
        B={P.P1d}
        outward={sub2(P.P1, P.P0)}
        gap={DIM_GAP}
        markerId={markerId}
        text={dimText(depthValue, depthUnit, depthLabel)}
        viewBoxW={fit.viewBoxW}
        viewBoxH={fit.viewBoxH}
      />

      {/* Largo/ancho: cota de punto (ver PointDimension) anclada bajo el
          punto medio de cada arista (P0d-P2d, P0d-P1d). */}
      <PointDimension
        A={P.P0d}
        B={P.P2d}
        dist={POINT_DIM_DIST}
        markerId={markerId}
        text={dimText(primaryValue, primaryUnit, primaryLabel)}
        viewBoxW={fit.viewBoxW}
        viewBoxH={fit.viewBoxH}
      />
      <PointDimension
        A={P.P0d}
        B={P.P1d}
        dist={POINT_DIM_DIST}
        markerId={markerId}
        text={dimText(secondaryValue, secondaryUnit, secondaryLabel)}
        viewBoxW={fit.viewBoxW}
        viewBoxH={fit.viewBoxH}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------
// Cilindro en perspectiva 3D — diámetro × profundidad. Mismo lenguaje
// visual que la caja (perspectiva, cotas técnicas), pero geométricamente
// un cilindro: elipse superior (planta) + extrusión vertical, con el
// arco trasero de la elipse inferior punteado (oculto).
// ---------------------------------------------------------------------
function IsometricCylinderDiagram({
  primaryLabel,
  depthLabel,
  primaryValue,
  depthValue,
  primaryUnit,
  depthUnit,
}: {
  primaryLabel: string;
  depthLabel: string;
  primaryValue?: string;
  depthValue?: string;
  primaryUnit?: string;
  depthUnit?: string;
}) {
  const rawId = useId();
  const markerId = `md-dim-arrow-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const diametroNum = numOrDefault(primaryValue, DEFAULT_DIAMETRO);
  const depthNum = numOrDefault(depthValue, DEFAULT_PROFUNDIDAD_CIL);
  const [diametroRatio, depthRatio] = proportionalRatios([diametroNum, depthNum], AXIS_RATIO_FLOOR);
  const local = buildLocalCylinder(diametroRatio / 2, depthRatio);
  const fit = fitWithCeiling(cylinderBboxPoints(local), PAD, CONTENT_TARGET);

  const topLeft = fit.project(local.topLeft);
  const topRight = fit.project(local.topRight);
  const topCenter = fit.project(local.topCenter);
  const bottomLeft = fit.project(local.bottomLeft);
  const bottomRight = fit.project(local.bottomRight);
  const rx = fit.k * local.rx;
  const ry = fit.k * local.ry;
  // bottomLeft/bottomRight son los puntos TANGENTES de la elipse inferior
  // (más angostos), no su punto más bajo — el punto más bajo real del arco
  // visible está `ry` más abajo, en (bottomCenter, bottomCenter.y+ry). Si
  // la flecha del diámetro se dibuja en la línea de los tangentes, queda
  // un hueco entre la flecha y el borde inferior real del cilindro (se ve
  // flotando a media altura del cuerpo en vez de apoyada en el borde) —
  // se baja la flecha a la altura del punto más bajo real, mismo ancho.
  const diaArrowY = (bottomLeft[1] + bottomRight[1]) / 2 + ry;
  const diaA: Point = [bottomLeft[0], diaArrowY];
  const diaB: Point = [bottomRight[0], diaArrowY];

  return (
    <svg
      viewBox={`0 0 ${fit.viewBoxW} ${fit.viewBoxH}`}
      className="w-full"
      role="img"
      aria-label={`Diagrama de ${primaryLabel} y ${depthLabel}`}
    >
      <defs>
        <OrangeArrowMarker id={markerId} />
      </defs>

      {/* Cilindro SÓLIDO y opaco (ver ajuste 2026-07-30 "no wireframe"):
          pared con relleno único (blanco, como las caras laterales de la
          caja), sin degradado ni arco trasero punteado — un cilindro no
          tiene 2 caras planas que dividir, así que un solo tono es el
          equivalente honesto a "sin transparencias, sin reinterpretar". */}
      <path
        d={`M ${topLeft[0]} ${topLeft[1]} A ${rx} ${ry} 0 0 1 ${topRight[0]} ${topRight[1]} L ${bottomRight[0]} ${bottomRight[1]} A ${rx} ${ry} 0 0 1 ${bottomLeft[0]} ${bottomLeft[1]} Z`}
        fill={SIDE_FILL}
        stroke={SOLID_STROKE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Arco frontal (visible) de la elipse inferior */}
      <path
        d={`M ${bottomLeft[0]} ${bottomLeft[1]} A ${rx} ${ry} 0 0 0 ${bottomRight[0]} ${bottomRight[1]}`}
        fill="none"
        stroke={SOLID_STROKE}
        strokeWidth="2.5"
      />

      {/* Elipse superior (planta, diámetro) — rellena, misma cara "de
          arriba" que el top del prisma. */}
      <ellipse cx={topCenter[0]} cy={topCenter[1]} rx={rx} ry={ry} fill={TOP_FILL} stroke={SOLID_STROKE} strokeWidth="2.5" />

      {/* Profundidad: cota lateral sobre la arista vertical derecha */}
      <DimensionLine
        A={topRight}
        B={bottomRight}
        outward={sub2(topRight, topCenter)}
        gap={DIM_GAP}
        markerId={markerId}
        text={dimText(depthValue, depthUnit, depthLabel)}
        viewBoxW={fit.viewBoxW}
        viewBoxH={fit.viewBoxH}
      />

      {/* Diámetro: cota de punto (ver PointDimension) sobre el borde
          inferior real (el punto más bajo del arco, no la línea de los
          tangentes) — mismo lenguaje que largo/ancho de la caja. */}
      <PointDimension
        A={diaA}
        B={diaB}
        dist={POINT_DIM_DIST}
        markerId={markerId}
        text={dimText(primaryValue, primaryUnit, primaryLabel)}
        viewBoxW={fit.viewBoxW}
        viewBoxH={fit.viewBoxH}
      />
    </svg>
  );
}
