"use client";

import { useId } from "react";
import { formatQuantity } from "@/lib/format-number";
import {
  buildLocalBox,
  buildLocalCylinder,
  cylinderBboxPoints,
  depthRatioFrom,
  fitWithCeiling,
  formatMetric,
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
  const cleanId = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const markerId = `md-arrow-${cleanId}`;
  const patternId = `md-hatch-${cleanId}`;

  // Texto de cada borde: mientras no se haya escrito un valor válido se
  // muestra la etiqueta genérica ("largo"/"ancho"); apenas hay un número
  // válido, se reemplaza por el valor real + unidad, en vivo.
  const borderText = (label: string, raw: string | undefined, unit: string | undefined) => {
    if (!raw) return label;
    const num = Number(raw.replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) return label;
    return unit ? `${formatQuantity(num)} ${unit}` : formatQuantity(num);
  };

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

  const fillDefs = (
    <>
      <marker
        id={markerId}
        viewBox="0 0 10 10"
        refX="5"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 Z" className="fill-navy" />
      </marker>
      <pattern id={patternId} width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <rect width="7" height="7" fill="#00215210" />
        <line x1="0" y1="0" x2="0" y2="7" stroke="#002152" strokeOpacity="0.3" strokeWidth="1.5" />
      </pattern>
    </>
  );

  if (shape === "circle") {
    return (
      <svg viewBox="0 0 220 140" className="w-full max-w-[340px] mx-auto" aria-hidden="true">
        <defs>{fillDefs}</defs>
        <circle cx="110" cy="70" r="50" fill={`url(#${patternId})`} className="stroke-navy" strokeWidth="2" />
        <line
          x1="60"
          y1="70"
          x2="160"
          y2="70"
          className="stroke-navy"
          strokeWidth="1.5"
          markerStart={`url(#${markerId})`}
          markerEnd={`url(#${markerId})`}
        />
        <text x="110" y="62" textAnchor="middle" className="fill-navy text-sm font-mono font-semibold">
          {borderText(primaryLabel, primaryValue, primaryUnit)}
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 220 150" className="w-full max-w-[380px] mx-auto" aria-hidden="true">
      <defs>{fillDefs}</defs>

      {/* Rectángulo principal (vista en planta) */}
      <rect x="34" y="24" width="130" height="86" rx="2" fill={`url(#${patternId})`} className="stroke-navy" strokeWidth="2" />

      {/* Flecha horizontal: medida principal */}
      <line
        x1="34"
        y1="124"
        x2="164"
        y2="124"
        className="stroke-navy"
        strokeWidth="1.5"
        markerStart={`url(#${markerId})`}
        markerEnd={`url(#${markerId})`}
      />
      <text x="99" y="142" textAnchor="middle" className="fill-navy text-sm font-mono font-semibold">
        {borderText(primaryLabel, primaryValue, primaryUnit)}
      </text>

      {/* Flecha vertical: medida secundaria */}
      {secondaryLabel && (
        <>
          <line
            x1="20"
            y1="24"
            x2="20"
            y2="110"
            className="stroke-navy"
            strokeWidth="1.5"
            markerStart={`url(#${markerId})`}
            markerEnd={`url(#${markerId})`}
          />
          <text
            x="12"
            y="67"
            textAnchor="middle"
            className="fill-navy text-sm font-mono font-semibold"
            transform="rotate(-90 12 67)"
          >
            {borderText(secondaryLabel, secondaryValue, secondaryUnit)}
          </text>
        </>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------
// Cajita de valor en vivo (foreignObject) — misma pieza para caja y
// cilindro. Muestra el valor formateado + unidad; mientras no hay un
// número válido, muestra la etiqueta genérica (ej. "Largo").
// ---------------------------------------------------------------------
function ValueChip({
  center,
  size,
  label,
  raw,
  unit,
}: {
  center: Point;
  size: [number, number];
  label: string;
  raw: string | undefined;
  unit: string | undefined;
}) {
  const formatted = formatMetric(raw, unit);
  return (
    <foreignObject x={center[0] - size[0] / 2} y={center[1] - size[1] / 2} width={size[0]} height={size[1]}>
      <div className="w-full h-full flex items-center justify-center rounded-md border-[1.5px] border-navy bg-white px-1">
        <span className="font-mono text-[10px] font-semibold text-navy whitespace-nowrap leading-none">
          {formatted ?? label}
        </span>
      </div>
    </foreignObject>
  );
}

const PAD = 40;
const VIEWBOX_W = 340;
const MAX_HEIGHT = 260;
const CHIP_SIZE: [number, number] = [72, 24];
const DEPTH_RATIO_BOUNDS = { min: 0.2, max: 0.6, fallback: 1.2 / 4.5 };
const CYL_DEPTH_RATIO_BOUNDS = { min: 0.15, max: 1.4, fallback: 1.8 / 6 };
// Naranjo de marca (mismo #FF4E00 que los CTA) — reservado acá para la
// flecha de doble punta de cada cota, nunca para el sólido en sí (ver
// conversación 2026-07-30, rediseño de diagrama de volumen).
const DIM_ORANGE = "#FF4E00";
const FACE_LIGHT = "#F7FAFD";
const FACE_DARK = "#DFE7F2";

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
function clampChipCenter(center: Point, size: [number, number], viewBoxW: number, viewBoxH: number): Point {
  const halfW = size[0] / 2;
  const halfH = size[1] / 2;
  let [x, y] = center;
  if (x - halfW < 2) x = 2 + halfW;
  if (x + halfW > viewBoxW - 2) x = viewBoxW - 2 - halfW;
  if (y - halfH < 2) y = 2 + halfH;
  if (y + halfH > viewBoxH - 2) y = viewBoxH - 2 - halfH;
  return [x, y];
}

// Cota "debajo": mismo espíritu que placeFrontCota, pero siempre empuja la
// cajita derecho hacia ABAJO (no perpendicular a la arista) — para cajas
// poco profundas, la arista inferior de una cara puede quedar muy cerca de
// la arista superior (profundidad chica vs. ancho del sólido), y una
// normal perpendicular a esa arista casi no aleja la cajita del dibujo.
// "Debajo, siempre" es más predecible y deja la cajita clara del sólido.
function placeBelowCota(
  A: Point,
  B: Point,
  dist: number,
  chipSize: [number, number],
  viewBoxW: number,
  viewBoxH: number
): { M: Point; extEnd: Point; chipCenter: Point } {
  const M = mid2(A, B);
  const extEnd: Point = [M[0], M[1] + dist * 0.4];
  const chipCenter = clampChipCenter([M[0], M[1] + dist], chipSize, viewBoxW, viewBoxH);
  return { M, extEnd, chipCenter };
}

// Flecha naranja de doble punta, corta, centrada sobre `at` — para
// largo/ancho (horizontal-ish, paralela a la arista que mide) va justo
// encima de la cajita de valor; se arma con la MISMA dirección que la
// arista para que quede paralela a lo que está midiendo.
function DimArrow({
  at,
  dir,
  length,
  markerId,
}: {
  at: Point;
  dir: Point;
  length: number;
  markerId: string;
}) {
  const d = norm2(dir);
  const half = length / 2;
  const a: Point = [at[0] - d[0] * half, at[1] - d[1] * half];
  const b: Point = [at[0] + d[0] * half, at[1] + d[1] * half];
  return (
    <line
      x1={a[0]}
      y1={a[1]}
      x2={b[0]}
      y2={b[1]}
      stroke={DIM_ORANGE}
      strokeWidth="2"
      strokeLinecap="round"
      markerStart={`url(#${markerId})`}
      markerEnd={`url(#${markerId})`}
    />
  );
}

// Definición del marker de flecha naranja, compartida por caja y cilindro.
function OrangeArrowMarker({ id }: { id: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 Z" fill={DIM_ORANGE} />
    </marker>
  );
}

// Cota lateral "estándar" (extensión punteada desde cada extremo real de la
// arista + flecha vertical/orizontal entre esos extremos) — usada para
// profundidad, la única que pide explícitamente esta convención ("como se
// mide con huincha") en vez del leader+cajita simple de largo/ancho.
function LateralDimension({
  A,
  B,
  outward,
  gap,
  markerId,
}: {
  A: Point;
  B: Point;
  outward: Point;
  gap: number;
  markerId: string;
}) {
  const n = norm2(outward);
  const A2: Point = [A[0] + n[0] * gap, A[1] + n[1] * gap];
  const B2: Point = [B[0] + n[0] * gap, B[1] + n[1] * gap];
  return (
    <g>
      <line x1={A[0]} y1={A[1]} x2={A2[0]} y2={A2[1]} stroke="#8C8579" strokeOpacity="0.6" strokeWidth="1.3" strokeDasharray="2.5 2.5" />
      <line x1={B[0]} y1={B[1]} x2={B2[0]} y2={B2[1]} stroke="#8C8579" strokeOpacity="0.6" strokeWidth="1.3" strokeDasharray="2.5 2.5" />
      <line
        x1={A2[0]}
        y1={A2[1]}
        x2={B2[0]}
        y2={B2[1]}
        stroke={DIM_ORANGE}
        strokeWidth="2"
        strokeLinecap="round"
        markerStart={`url(#${markerId})`}
        markerEnd={`url(#${markerId})`}
      />
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
  const depth = depthRatioFrom(primaryValue, depthValue, DEPTH_RATIO_BOUNDS);
  const local = buildLocalBox(depth.ratio);
  const fit = fitWithCeiling(Object.values(local), PAD, VIEWBOX_W, MAX_HEIGHT);
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
  // Largo → arista inferior de la cara IZQUIERDA (P0d-P2d), ancho → arista
  // inferior de la cara DERECHA (P0d-P1d) — sobre las paredes del frente,
  // no colgando del rombo superior (pedido 2026-07-30, reemplaza el
  // esquema anterior que las colgaba de P0-P1/P0-P2). Profundidad se queda
  // en la arista vertical derecha (P1-P1d), como cota lateral.
  const cotaLargo = placeBelowCota(P.P0d, P.P2d, 50, CHIP_SIZE, fit.viewBoxW, fit.viewBoxH);
  const cotaAncho = placeBelowCota(P.P0d, P.P1d, 50, CHIP_SIZE, fit.viewBoxW, fit.viewBoxH);

  const poly = (pts: Point[]) => pts.map((p) => `${p[0]},${p[1]}`).join(" ");
  // Flecha siempre horizontal y siempre justo encima de la cajita — más
  // simple y más legible que "paralela a la arista" (que en isométrico
  // queda diagonal y es más difícil de leer como "esto mide esto").
  const arrowAbove = (chipCenter: Point): Point => {
    const up: Point = [0, -1];
    return [chipCenter[0] + up[0] * (CHIP_SIZE[1] / 2 + 9), chipCenter[1] + up[1] * (CHIP_SIZE[1] / 2 + 9)];
  };

  return (
    <svg
      viewBox={`0 0 ${fit.viewBoxW} ${fit.viewBoxH}`}
      className="w-full max-w-[460px] mx-auto"
      role="img"
      aria-label={`Diagrama de ${primaryLabel}, ${secondaryLabel} y ${depthLabel}`}
    >
      <defs>
        <OrangeArrowMarker id={markerId} />
      </defs>

      {/* Cara superior (planta, largo × ancho) — transparente, solo contorno */}
      <polygon points={poly([P.P2, P.P3, P.P1, P.P0])} fill="none" className="stroke-navy" strokeWidth="1.6" />
      {/* Caras frontales — 2 tonos distintos para que el volumen se lea de
          un vistazo (pedido 2026-07-30): izquierda más clara, derecha más
          oscura. */}
      <polygon points={poly([P.P0, P.P2, P.P2d, P.P0d])} fill={FACE_LIGHT} className="stroke-navy" strokeWidth="1" />
      <polygon points={poly([P.P0, P.P1, P.P1d, P.P0d])} fill={FACE_DARK} className="stroke-navy" strokeWidth="1" />

      {/* Fondo del hoyo/sólido (cara inferior, oculta) — punteada al 30% */}
      <polygon
        points={poly([P.P0d, P.P1d, P.P3d, P.P2d])}
        fill="none"
        className="stroke-navy"
        strokeOpacity="0.3"
        strokeWidth="1.3"
        strokeDasharray="3 3"
      />
      {/* Arista vertical oculta (esquina trasera) */}
      <line x1={P.P3[0]} y1={P.P3[1]} x2={P.P3d[0]} y2={P.P3d[1]} className="stroke-navy" strokeOpacity="0.3" strokeWidth="1.3" strokeDasharray="3 3" />

      {/* Aristas estructurales visibles */}
      <line x1={P.P1[0]} y1={P.P1[1]} x2={P.P3[0]} y2={P.P3[1]} className="stroke-navy" strokeWidth="2" strokeLinecap="round" />
      <line x1={P.P2[0]} y1={P.P2[1]} x2={P.P3[0]} y2={P.P3[1]} className="stroke-navy" strokeWidth="2" strokeLinecap="round" />
      <line x1={P.P1[0]} y1={P.P1[1]} x2={P.P1d[0]} y2={P.P1d[1]} className="stroke-navy" strokeWidth="2" strokeLinecap="round" />
      <line x1={P.P2[0]} y1={P.P2[1]} x2={P.P2d[0]} y2={P.P2d[1]} className="stroke-navy" strokeWidth="2" strokeLinecap="round" />
      <line x1={P.P1d[0]} y1={P.P1d[1]} x2={P.P0d[0]} y2={P.P0d[1]} className="stroke-navy" strokeWidth="2" strokeLinecap="round" />
      <line x1={P.P2d[0]} y1={P.P2d[1]} x2={P.P0d[0]} y2={P.P0d[1]} className="stroke-navy" strokeWidth="2" strokeLinecap="round" />
      <line x1={P.P0[0]} y1={P.P0[1]} x2={P.P0d[0]} y2={P.P0d[1]} className="stroke-navy" strokeWidth="2" strokeLinecap="round" />
      <line x1={P.P0[0]} y1={P.P0[1]} x2={P.P1[0]} y2={P.P1[1]} className="stroke-navy" strokeWidth="1.4" />
      <line x1={P.P0[0]} y1={P.P0[1]} x2={P.P2[0]} y2={P.P2[1]} className="stroke-navy" strokeWidth="1.4" />

      {/* Profundidad: cota lateral estándar (extensión + flecha vertical) */}
      <LateralDimension A={P.P1} B={P.P1d} outward={sub2(P.P1, P.P0)} gap={18} markerId={markerId} />
      {(() => {
        const n = norm2(sub2(P.P1, P.P0));
        const lineMid: Point = [(P.P1[0] + P.P1d[0]) / 2 + n[0] * 18, (P.P1[1] + P.P1d[1]) / 2 + n[1] * 18];
        const chipCenter = clampChipCenter(
          [lineMid[0] + n[0] * (CHIP_SIZE[0] / 2 + 4), lineMid[1]],
          CHIP_SIZE,
          fit.viewBoxW,
          fit.viewBoxH
        );
        return <ValueChip center={chipCenter} size={CHIP_SIZE} label={depthLabel} raw={depthValue} unit={depthUnit} />;
      })()}

      {/* Largo/ancho: cajita apoyada en la arista inferior de su cara +
          flecha naranja horizontal encima, doble punta */}
      {[
        { c: cotaLargo, label: primaryLabel, raw: primaryValue, unit: primaryUnit },
        { c: cotaAncho, label: secondaryLabel, raw: secondaryValue, unit: secondaryUnit },
      ].map((item, i) => (
        <g key={i}>
          <line
            x1={item.c.extEnd[0]}
            y1={item.c.extEnd[1]}
            x2={item.c.chipCenter[0]}
            y2={item.c.chipCenter[1]}
            stroke="#8C8579"
            strokeOpacity="0.55"
            strokeWidth="1.3"
            strokeDasharray="1.5 2"
          />
          <DimArrow at={arrowAbove(item.c.chipCenter)} dir={[1, 0]} length={CHIP_SIZE[0] * 0.62} markerId={markerId} />
          <ValueChip center={item.c.chipCenter} size={CHIP_SIZE} label={item.label} raw={item.raw} unit={item.unit} />
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------
// Cilindro en perspectiva 3D — diámetro × profundidad. Mismo lenguaje
// visual que la caja (perspectiva, cotas, cajitas de valor en vivo), pero
// geométricamente un cilindro: elipse superior (planta) + extrusión
// vertical, con el arco trasero de la elipse inferior punteado (oculto).
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
  const depth = depthRatioFrom(primaryValue, depthValue, CYL_DEPTH_RATIO_BOUNDS);
  const local = buildLocalCylinder(depth.ratio);
  const fit = fitWithCeiling(cylinderBboxPoints(local), PAD, VIEWBOX_W, MAX_HEIGHT);

  const topLeft = fit.project(local.topLeft);
  const topRight = fit.project(local.topRight);
  const topCenter = fit.project(local.topCenter);
  const bottomLeft = fit.project(local.bottomLeft);
  const bottomRight = fit.project(local.bottomRight);
  const rx = fit.k * local.rx;
  const ry = fit.k * local.ry;

  // Diámetro → arista inferior (no la elipse de planta de arriba, mismo
  // criterio que largo/ancho en la caja: no cuelga del plano superior).
  const cotaDiametro = placeBelowCota(bottomLeft, bottomRight, 50, CHIP_SIZE, fit.viewBoxW, fit.viewBoxH);

  // Media elipse visible (frontal/inferior) vs. oculta (trasera/superior):
  // convención estándar del "arco de barril" en SVG — sweep=0 va por
  // arriba (trasera, oculta), sweep=1 va por abajo (frontal, visible).

  return (
    <svg
      viewBox={`0 0 ${fit.viewBoxW} ${fit.viewBoxH}`}
      className="w-full max-w-[460px] mx-auto"
      role="img"
      aria-label={`Diagrama de ${primaryLabel} y ${depthLabel}`}
    >
      <defs>
        <OrangeArrowMarker id={markerId} />
      </defs>

      {/* Pared lateral — degradado izq. clara → der. oscura (mismo par de
          tonos que las 2 caras frontales de la caja); un cilindro no tiene
          2 caras planas separadas, así que el degradado es el equivalente
          honesto en vez de forzar una división que no existe. */}
      <defs>
        <linearGradient id={`${markerId}-wall`} x1={topLeft[0]} y1="0" x2={topRight[0]} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={FACE_LIGHT} />
          <stop offset="100%" stopColor={FACE_DARK} />
        </linearGradient>
      </defs>
      <path
        d={`M ${topLeft[0]} ${topLeft[1]} A ${rx} ${ry} 0 0 1 ${topRight[0]} ${topRight[1]} L ${bottomRight[0]} ${bottomRight[1]} A ${rx} ${ry} 0 0 1 ${bottomLeft[0]} ${bottomLeft[1]} Z`}
        fill={`url(#${markerId}-wall)`}
        className="stroke-navy"
        strokeWidth="1"
      />

      {/* Elipse inferior: arco trasero (oculto, punteado, 30%) */}
      <path
        d={`M ${bottomLeft[0]} ${bottomLeft[1]} A ${rx} ${ry} 0 0 1 ${bottomRight[0]} ${bottomRight[1]}`}
        fill="none"
        className="stroke-navy"
        strokeOpacity="0.3"
        strokeWidth="1.3"
        strokeDasharray="3 3"
      />
      {/* Elipse inferior: arco frontal (visible) */}
      <path
        d={`M ${bottomLeft[0]} ${bottomLeft[1]} A ${rx} ${ry} 0 0 0 ${bottomRight[0]} ${bottomRight[1]}`}
        fill="none"
        className="stroke-navy"
        strokeWidth="2"
      />

      {/* Costados verticales */}
      <line x1={topLeft[0]} y1={topLeft[1]} x2={bottomLeft[0]} y2={bottomLeft[1]} className="stroke-navy" strokeWidth="2" strokeLinecap="round" />
      <line x1={topRight[0]} y1={topRight[1]} x2={bottomRight[0]} y2={bottomRight[1]} className="stroke-navy" strokeWidth="2" strokeLinecap="round" />

      {/* Elipse superior (planta, diámetro) — transparente, solo contorno. */}
      <ellipse cx={topCenter[0]} cy={topCenter[1]} rx={rx} ry={ry} fill="none" className="stroke-navy" strokeWidth="1.8" />
      <line x1={topLeft[0]} y1={topLeft[1]} x2={topRight[0]} y2={topRight[1]} className="stroke-navy" strokeWidth="1.4" />

      {/* Profundidad: cota lateral estándar (extensión + flecha vertical) */}
      <LateralDimension A={topRight} B={bottomRight} outward={sub2(topRight, topCenter)} gap={18} markerId={markerId} />
      {(() => {
        const n = norm2(sub2(topRight, topCenter));
        const lineMid: Point = [(topRight[0] + bottomRight[0]) / 2 + n[0] * 18, (topRight[1] + bottomRight[1]) / 2 + n[1] * 18];
        const chipCenter = clampChipCenter(
          [lineMid[0] + n[0] * (CHIP_SIZE[0] / 2 + 4), lineMid[1]],
          CHIP_SIZE,
          fit.viewBoxW,
          fit.viewBoxH
        );
        return <ValueChip center={chipCenter} size={CHIP_SIZE} label={depthLabel} raw={depthValue} unit={depthUnit} />;
      })()}

      {/* Diámetro: cajita apoyada en la arista inferior + flecha naranja */}
      <line
        x1={cotaDiametro.extEnd[0]}
        y1={cotaDiametro.extEnd[1]}
        x2={cotaDiametro.chipCenter[0]}
        y2={cotaDiametro.chipCenter[1]}
        stroke="#8C8579"
        strokeOpacity="0.55"
        strokeWidth="1.3"
        strokeDasharray="1.5 2"
      />
      {(() => {
        const at: Point = [cotaDiametro.chipCenter[0], cotaDiametro.chipCenter[1] - (CHIP_SIZE[1] / 2 + 9)];
        return <DimArrow at={at} dir={[1, 0]} length={CHIP_SIZE[0] * 0.62} markerId={markerId} />;
      })()}
      <ValueChip center={cotaDiametro.chipCenter} size={CHIP_SIZE} label={primaryLabel} raw={primaryValue} unit={primaryUnit} />
    </svg>
  );
}
