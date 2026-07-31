"use client";

import { useId } from "react";
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
  // naranjas, etiquetas en chip blanco/borde azul fuera de la figura. Antes
  // esta vista plana tenía su propio estilo (rayado azul translúcido,
  // flechas azules, texto plano encima de la figura) — quedaba
  // inconsistente con caja/cilindro.
  if (shape === "circle") {
    const cx = 110;
    const cy = 66;
    const r = 50;
    const chipCenter: Point = [cx, cy + r + 30];
    return (
      <svg viewBox="0 0 220 172" className="w-full" role="img" aria-label={`Diagrama de ${primaryLabel}`}>
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
          strokeWidth="2"
          strokeLinecap="round"
          markerStart={`url(#${markerId})`}
          markerEnd={`url(#${markerId})`}
        />
        <line x1={cx} y1={cy + r} x2={chipCenter[0]} y2={chipCenter[1] - CHIP_SIZE[1] / 2} stroke="#8C8579" strokeWidth="1.3" />
        <ValueChip center={chipCenter} size={CHIP_SIZE} label={primaryLabel} raw={primaryValue} unit={primaryUnit} />
      </svg>
    );
  }

  const rx0 = 84;
  const ry0 = 20;
  const rw = 130;
  const rh = 86;
  const primaryChip: Point = [rx0 + rw / 2, ry0 + rh + 30];
  const secondaryChip: Point = [rx0 - 46, ry0 + rh / 2];

  return (
    <svg viewBox="0 0 300 172" className="w-full" role="img" aria-label={`Diagrama de ${primaryLabel}${secondaryLabel ? `, ${secondaryLabel}` : ""}`}>
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
        strokeWidth="2"
        strokeLinecap="round"
        markerStart={`url(#${markerId})`}
        markerEnd={`url(#${markerId})`}
      />
      <line
        x1={rx0 + rw / 2}
        y1={ry0 + rh}
        x2={primaryChip[0]}
        y2={primaryChip[1] - CHIP_SIZE[1] / 2}
        stroke="#8C8579"
        strokeWidth="1.3"
      />
      <ValueChip center={primaryChip} size={CHIP_SIZE} label={primaryLabel} raw={primaryValue} unit={primaryUnit} />

      {/* Flecha vertical, sobre el borde izquierdo real */}
      {secondaryLabel && (
        <>
          <line
            x1={rx0}
            y1={ry0 + 10}
            x2={rx0}
            y2={ry0 + rh - 10}
            stroke={DIM_ORANGE}
            strokeWidth="2"
            strokeLinecap="round"
            markerStart={`url(#${markerId})`}
            markerEnd={`url(#${markerId})`}
          />
          <line
            x1={rx0}
            y1={ry0 + rh / 2}
            x2={secondaryChip[0] + CHIP_SIZE[0] / 2}
            y2={secondaryChip[1]}
            stroke="#8C8579"
            strokeWidth="1.3"
          />
          <ValueChip center={secondaryChip} size={CHIP_SIZE} label={secondaryLabel} raw={secondaryValue} unit={secondaryUnit} />
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
// Proporción real del usuario, acotada a un rango razonable — ver
// docs/svg-diagram-system.md "nunca cambia el estilo, solo las
// proporciones". El piso (0.38) es exageración deliberada de legibilidad
// (misma idea que sugiere la propia spec: "profundidad=3 → el bloque se
// ve más alto") — un prisma real casi plano (profundidad << largo/ancho,
// el caso más común) se ve como una cuña delgada en vez de un bloque
// reconocible si se dibuja a la proporción literal. No es un parche para
// el bug de superposición (ese ya se resolvió cambiando qué polígono
// forma la cara de arriba) ni para las flechas (esas ya no dependen del
// largo de la arista, ver más abajo) — es puramente para que el sólido se
// LEA como un bloque de un vistazo.
const DEPTH_RATIO_BOUNDS = { min: 0.38, max: 0.65, fallback: 0.4 };
const CYL_DEPTH_RATIO_BOUNDS = { min: 0.15, max: 1.4, fallback: 1.8 / 6 };
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

// Definición del marker de flecha naranja, compartida por caja y cilindro.
function OrangeArrowMarker({ id }: { id: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 Z" fill={DIM_ORANGE} />
    </marker>
  );
}

// Cota lateral "estándar" (extensión + flecha vertical/horizontal entre
// esos extremos) — usada para profundidad, la única que pide explícitamente
// esta convención ("como se mide con huincha") en vez del leader+cajita
// simple de largo/ancho. Líneas de extensión SÓLIDAS (no punteadas, ver
// ajuste 2026-07-30 "sin líneas punteadas").
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
      <line x1={A[0]} y1={A[1]} x2={A2[0]} y2={A2[1]} stroke="#8C8579" strokeWidth="1.3" />
      <line x1={B[0]} y1={B[1]} x2={B2[0]} y2={B2[1]} stroke="#8C8579" strokeWidth="1.3" />
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
  // no colgando del rombo superior. Profundidad se queda en la arista
  // vertical derecha (P1-P1d), como cota lateral.
  const cotaLargo = placeBelowCota(P.P0d, P.P2d, 50, CHIP_SIZE, fit.viewBoxW, fit.viewBoxH);
  const cotaAncho = placeBelowCota(P.P0d, P.P1d, 50, CHIP_SIZE, fit.viewBoxW, fit.viewBoxH);

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

          OJO: esta proyección (l, ancho y profundidad los 3 apuntando
          "hacia abajo" en pantalla, no repartidos en 360°) NO arma un
          hexágono sin superposición si la cara de arriba se dibuja como el
          rombo completo P0-P1-P3-P2 — P0d cae DENTRO de ese rombo (no en
          su borde), así que el rombo se comía visualmente las 2 caras
          laterales. Usando el triángulo P2-P3-P1 (sin P0) para la cara de
          arriba sí queda 100% afuera de ambas caras laterales — mismo
          contorno real del sólido, sin parche ni superposición. */}
      <polygon
        points={poly([P.P2, P.P3, P.P1, P.P0])}
        fill={TOP_FILL}
        stroke={SOLID_STROKE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
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

      {/* Largo/ancho: flecha naranja corta, anclada a la cajita de valor
          (crece/decrece con el diagrama entero vía CHIP_SIZE, nunca queda
          flotando suelta — ver docs/svg-diagram-system.md), en vez de
          abarcar la arista completa esquina-a-esquina: en un prisma ancho
          y bajo (profundidad << largo/ancho, el caso real más común) esa
          arista es casi tan larga como la diagonal del dibujo entero, y
          una flecha de ese largo se lee como una línea cruzando todo el
          diagrama en vez de una cota clara sobre "este borde". */}
      {[
        { c: cotaLargo, dir: sub2(P.P2d, P.P0d), label: primaryLabel, raw: primaryValue, unit: primaryUnit },
        { c: cotaAncho, dir: sub2(P.P1d, P.P0d), label: secondaryLabel, raw: secondaryValue, unit: secondaryUnit },
      ].map((item, i) => {
        const d = norm2(item.dir);
        const half = CHIP_SIZE[0] * 0.34;
        const at: Point = [item.c.chipCenter[0], item.c.chipCenter[1] - (CHIP_SIZE[1] / 2 + 9)];
        const arrowA: Point = [at[0] - d[0] * half, at[1] - d[1] * half];
        const arrowB: Point = [at[0] + d[0] * half, at[1] + d[1] * half];
        return (
          <g key={i}>
            <line
              x1={arrowA[0]}
              y1={arrowA[1]}
              x2={arrowB[0]}
              y2={arrowB[1]}
              stroke={DIM_ORANGE}
              strokeWidth="2"
              strokeLinecap="round"
              markerStart={`url(#${markerId})`}
              markerEnd={`url(#${markerId})`}
            />
            <line
              x1={item.c.extEnd[0]}
              y1={item.c.extEnd[1]}
              x2={item.c.chipCenter[0]}
              y2={item.c.chipCenter[1]}
              stroke="#8C8579"
              strokeWidth="1.3"
            />
            <ValueChip center={item.c.chipCenter} size={CHIP_SIZE} label={item.label} raw={item.raw} unit={item.unit} />
          </g>
        );
      })}
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

  // Diámetro → arista inferior (no la elipse de planta de arriba, mismo
  // criterio que largo/ancho en la caja: no cuelga del plano superior).
  const cotaDiametro = placeBelowCota(diaA, diaB, 50, CHIP_SIZE, fit.viewBoxW, fit.viewBoxH);

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

      {/* Diámetro: flecha naranja SOBRE el borde inferior real (el punto
          más bajo del arco, no la línea de los tangentes) + leader fino a
          la cajita, apoyada debajo. */}
      <line
        x1={diaA[0]}
        y1={diaA[1]}
        x2={diaB[0]}
        y2={diaB[1]}
        stroke={DIM_ORANGE}
        strokeWidth="2"
        strokeLinecap="round"
        markerStart={`url(#${markerId})`}
        markerEnd={`url(#${markerId})`}
      />
      <line
        x1={cotaDiametro.extEnd[0]}
        y1={cotaDiametro.extEnd[1]}
        x2={cotaDiametro.chipCenter[0]}
        y2={cotaDiametro.chipCenter[1]}
        stroke="#8C8579"
        strokeWidth="1.3"
      />
      <ValueChip center={cotaDiametro.chipCenter} size={CHIP_SIZE} label={primaryLabel} raw={primaryValue} unit={primaryUnit} />
    </svg>
  );
}
