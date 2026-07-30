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
  placeCota,
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
      <svg viewBox="0 0 220 140" className="w-full max-w-[220px] mx-auto" aria-hidden="true">
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
    <svg viewBox="0 0 220 150" className="w-full max-w-[240px] mx-auto" aria-hidden="true">
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
  const allAbs = Object.values(P);

  // Largo y ancho intercambiados de lado a propósito (pedido 2026-07-30):
  // la cota de "largo" ahora se dibuja sobre la arista P0-P2 y la de
  // "ancho" sobre P0-P1 — al revés de lo geométricamente "natural" (P1 es
  // la arista de largo por construcción, ver buildLocalBox), pero así la
  // profundidad —atada a P1-P1d— se queda exactamente en su posición
  // actual en vez de moverse de lado junto con largo.
  const cotaLargo = placeCota(P.P0, P.P2, allAbs, fit.viewBoxW, fit.viewBoxH, CHIP_SIZE);
  const cotaAncho = placeCota(P.P0, P.P1, allAbs, fit.viewBoxW, fit.viewBoxH, CHIP_SIZE);
  const cotaProfundidad = placeCota(P.P1, P.P1d, allAbs, fit.viewBoxW, fit.viewBoxH, CHIP_SIZE);

  const poly = (pts: Point[]) => pts.map((p) => `${p[0]},${p[1]}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${fit.viewBoxW} ${fit.viewBoxH}`}
      className="w-full max-w-[320px] mx-auto"
      role="img"
      aria-label={`Diagrama de ${primaryLabel}, ${secondaryLabel} y ${depthLabel}`}
    >
      {/* Cara superior (planta, largo × ancho) — transparente, solo contorno */}
      <polygon points={poly([P.P2, P.P3, P.P1, P.P0])} fill="none" className="stroke-navy" strokeWidth="1.6" />
      {/* Caras frontales (profundidad) — sombreadas/sólidas */}
      <polygon points={poly([P.P0, P.P1, P.P1d, P.P0d])} className="fill-navy/20" />
      <polygon points={poly([P.P0, P.P2, P.P2d, P.P0d])} className="fill-navy/20" />

      {/* Aristas ocultas (fondo del sólido) */}
      <line x1={P.P3[0]} y1={P.P3[1]} x2={P.P3d[0]} y2={P.P3d[1]} className="stroke-navy" strokeOpacity="0.35" strokeWidth="1.3" strokeDasharray="3 3" />
      <line x1={P.P1d[0]} y1={P.P1d[1]} x2={P.P3d[0]} y2={P.P3d[1]} className="stroke-navy" strokeOpacity="0.35" strokeWidth="1.3" strokeDasharray="3 3" />
      <line x1={P.P2d[0]} y1={P.P2d[1]} x2={P.P3d[0]} y2={P.P3d[1]} className="stroke-navy" strokeOpacity="0.35" strokeWidth="1.3" strokeDasharray="3 3" />

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

      {/* Cotas: línea + tick + leader punteado + cajita de valor */}
      {[
        { c: cotaLargo, label: primaryLabel, raw: primaryValue, unit: primaryUnit },
        { c: cotaAncho, label: secondaryLabel, raw: secondaryValue, unit: secondaryUnit },
        { c: cotaProfundidad, label: depthLabel, raw: depthValue, unit: depthUnit },
      ].map((item, i) => (
        <g key={i}>
          <line x1={item.c.M[0]} y1={item.c.M[1]} x2={item.c.extEnd[0]} y2={item.c.extEnd[1]} stroke="#8C8579" strokeWidth="1.4" />
          <line x1={item.c.tickA[0]} y1={item.c.tickA[1]} x2={item.c.tickB[0]} y2={item.c.tickB[1]} stroke="#8C8579" strokeWidth="1.4" />
          <line
            x1={item.c.extEnd[0]}
            y1={item.c.extEnd[1]}
            x2={item.c.chipCenter[0]}
            y2={item.c.chipCenter[1]}
            stroke="#8C8579"
            strokeOpacity="0.55"
            strokeWidth="1.4"
            strokeDasharray="1.5 2"
          />
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

  const allAbs = [topLeft, topRight, bottomLeft, bottomRight];
  const cotaDiametro = placeCota(topLeft, topRight, allAbs, fit.viewBoxW, fit.viewBoxH, CHIP_SIZE);
  const cotaProfundidad = placeCota(topRight, bottomRight, allAbs, fit.viewBoxW, fit.viewBoxH, CHIP_SIZE);

  // Media elipse visible (frontal/inferior) vs. oculta (trasera/superior):
  // convención estándar del "arco de barril" en SVG — sweep=0 va por
  // arriba (trasera, oculta), sweep=1 va por abajo (frontal, visible).

  return (
    <svg
      viewBox={`0 0 ${fit.viewBoxW} ${fit.viewBoxH}`}
      className="w-full max-w-[320px] mx-auto"
      role="img"
      aria-label={`Diagrama de ${primaryLabel} y ${depthLabel}`}
    >
      {/* Pared lateral visible (profundidad) — sombreada/sólida: mitad frontal de ambas elipses + costados */}
      <path
        d={`M ${topLeft[0]} ${topLeft[1]} A ${rx} ${ry} 0 0 1 ${topRight[0]} ${topRight[1]} L ${bottomRight[0]} ${bottomRight[1]} A ${rx} ${ry} 0 0 1 ${bottomLeft[0]} ${bottomLeft[1]} Z`}
        className="fill-navy/20"
      />

      {/* Elipse inferior: arco trasero (oculto, punteado) */}
      <path
        d={`M ${bottomLeft[0]} ${bottomLeft[1]} A ${rx} ${ry} 0 0 1 ${bottomRight[0]} ${bottomRight[1]}`}
        fill="none"
        className="stroke-navy"
        strokeOpacity="0.35"
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

      {/* Elipse superior (planta, diámetro) — transparente, solo contorno.
          Antes tenía fill="white" (opaca) para tapar la pared detrás — eso
          se leía como "cara superior sólida", al revés de lo pedido. */}
      <ellipse cx={topCenter[0]} cy={topCenter[1]} rx={rx} ry={ry} fill="none" className="stroke-navy" strokeWidth="1.8" />

      {/* Línea de diámetro cruzando la elipse superior */}
      <line x1={topLeft[0]} y1={topLeft[1]} x2={topRight[0]} y2={topRight[1]} className="stroke-navy" strokeWidth="1.4" />

      {[
        { c: cotaDiametro, label: primaryLabel, raw: primaryValue, unit: primaryUnit },
        { c: cotaProfundidad, label: depthLabel, raw: depthValue, unit: depthUnit },
      ].map((item, i) => (
        <g key={i}>
          <line x1={item.c.M[0]} y1={item.c.M[1]} x2={item.c.extEnd[0]} y2={item.c.extEnd[1]} stroke="#8C8579" strokeWidth="1.4" />
          <line x1={item.c.tickA[0]} y1={item.c.tickA[1]} x2={item.c.tickB[0]} y2={item.c.tickB[1]} stroke="#8C8579" strokeWidth="1.4" />
          <line
            x1={item.c.extEnd[0]}
            y1={item.c.extEnd[1]}
            x2={item.c.chipCenter[0]}
            y2={item.c.chipCenter[1]}
            stroke="#8C8579"
            strokeOpacity="0.55"
            strokeWidth="1.4"
            strokeDasharray="1.5 2"
          />
          <ValueChip center={item.c.chipCenter} size={CHIP_SIZE} label={item.label} raw={item.raw} unit={item.unit} />
        </g>
      ))}
    </svg>
  );
}
