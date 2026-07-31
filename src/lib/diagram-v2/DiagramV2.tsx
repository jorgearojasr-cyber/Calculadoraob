"use client";

// Componente público ÚNICO de Diagram System V2 — ver API aprobada,
// conversación 2026-08-01. Compone math/ + layout/ + render/ según
// `kind`. Es el único archivo de este sistema que otros componentes de
// la app deberían importar.

import { boxAllPoints, boxFaces, buildBox, buildCylinder, cylinderAllPoints, type BoxProjected } from "./math/solids";
import { compressedRatios, finalizeCanvas, fitToSilhouette } from "./math/scale-engine";
import type { Vec2 } from "./math/vec2";
import { buildLane, outwardFromFace, type Lane } from "./layout/dimension-lane";
import { buildDepthLane } from "./layout/depth-lane";
import { BoxSolid, CylinderSolid } from "./render/solid-3d";
import { Rect2D, Circle2D } from "./render/shape-2d";
import { DimensionChip, CHIP_H, estimateChipWidth } from "./render/dimension-chip";

const PAD = 20;
const CONTENT_TARGET = 205; // eje dominante ≈ 205/(205+40) ≈ 84% del panel
const CANVAS_MARGIN = 6; // margen final entre el chip más lejano y el borde del panel

type Field = "largo" | "ancho" | "profundidad" | "diametro";

export type DiagramV2Props = {
  kind: "box" | "cylinder" | "rect2d" | "circle2d";
  largo?: number;
  ancho?: number;
  profundidad?: number;
  diametro?: number;
  labels: Partial<Record<Field, string>>;
  unit?: string;
  activeField?: Field;
  className?: string;
};

function fmt(n: number | undefined, unit: string): string {
  if (n === undefined || !Number.isFinite(n)) return "";
  return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(n)} ${unit}`;
}

// Las esquinas del chip (no solo su centro) son lo que realmente hay que
// contener en el canvas final — ver finalizeCanvas. El ancho del chip
// depende del texto (ver estimateChipWidth), así que este helper recibe
// el label/value real en vez de un tamaño fijo.
function chipCorners(lane: Lane, label: string, value: string): Vec2[] {
  const [cx, cy] = lane.chipCenter;
  const w = estimateChipWidth(label, value);
  return [
    [cx - w / 2, cy - CHIP_H / 2],
    [cx + w / 2, cy + CHIP_H / 2],
  ];
}

// Las aristas de largo y ancho comparten su vértice cercano (P0d) — ver
// comentario de chipT en el caso "box" — así que para un objeto MUY
// angosto en planta (ej. Pilar 0,30×0,30) sus 2 chips igual pueden quedar
// lo bastante cerca como para superponerse, sobre todo ahora que el chip
// es una fila horizontal (más ancho que el chip apilado de la primera
// pasada de Fase 0). Si se superponen, se separan horizontalmente lo
// justo para no tocarse — el carril (la línea + flecha) NO se mueve,
// solo el chip que se dibuja sobre él, igual que el mockup real (los 2
// chips de Pilar/columna quedan uno al lado del otro, con un pequeño
// espacio entre ellos).
function separateChips(laneLeft: Lane, textLeft: [string, string], laneRight: Lane, textRight: [string, string]): [Lane, Lane] {
  const wLeft = estimateChipWidth(...textLeft);
  const wRight = estimateChipWidth(...textRight);
  const gap = 6;
  const needed = wLeft / 2 + wRight / 2 + gap;
  const dx = laneRight.chipCenter[0] - laneLeft.chipCenter[0];
  if (dx >= needed) return [laneLeft, laneRight];
  const push = (needed - dx) / 2;
  return [
    { ...laneLeft, chipCenter: [laneLeft.chipCenter[0] - push, laneLeft.chipCenter[1]] },
    { ...laneRight, chipCenter: [laneRight.chipCenter[0] + push, laneRight.chipCenter[1]] },
  ];
}

export function DiagramV2({ kind, largo, ancho, profundidad, diametro, labels, unit = "m", activeField, className }: DiagramV2Props) {
  const svgProps = { className: className ?? "w-full", role: "img" as const };

  if (kind === "box") {
    const L = largo ?? 4.5;
    const A = ancho ?? 2.8;
    const D = profundidad ?? 1.2;
    const [lR, aR, dR] = compressedRatios([L, A, D]);
    const local = buildBox(lR, aR, dR);
    const fit = fitToSilhouette(boxAllPoints(local), PAD, CONTENT_TARGET);
    const P: BoxProjected = {
      P0: fit.project(local.P0),
      P1: fit.project(local.P1),
      P2: fit.project(local.P2),
      P3: fit.project(local.P3),
      P0d: fit.project(local.P0d),
      P1d: fit.project(local.P1d),
      P2d: fit.project(local.P2d),
    };
    const faces = boxFaces(P);

    const largoText = fmt(largo, unit) || (labels.largo ?? "");
    const anchoText = fmt(ancho, unit) || (labels.ancho ?? "");
    const profundidadText = fmt(profundidad, unit) || (labels.profundidad ?? "");

    // El eje "largo" (P1) queda del lado DERECHO de la cámara (AXIS_LARGO
    // apunta abajo-derecha) y el eje "ancho" (P2) del lado IZQUIERDO — ver
    // mockup real: Largo siempre a la derecha, Ancho siempre a la
    // izquierda. La arista P0d-P1d es físicamente la de largo (pared
    // "wallRight"); P0d-P2d es la de ancho (pared "wallLeft").
    //
    // chipT=0.95: ambas aristas comparten el vértice P0d — ver comentario
    // en buildLane, sesgamos el chip hacia el extremo lejano para que no
    // se superpongan en objetos angostos en planta (ej. Pilar/columna).
    let laneAncho = buildLane(P.P0d, P.P2d, outwardFromFace(P.P0d, P.P2d, faces.wallLeft), undefined, 0.95);
    let laneLargo = buildLane(P.P0d, P.P1d, outwardFromFace(P.P0d, P.P1d, faces.wallRight), undefined, 0.95);
    const laneProfundidad = buildDepthLane(P.P1, P.P1d);
    [laneAncho, laneLargo] = separateChips(laneAncho, [labels.ancho ?? "Ancho", anchoText], laneLargo, [labels.largo ?? "Largo", largoText]);

    const canvas = finalizeCanvas(
      fit.viewBoxW,
      fit.viewBoxH,
      [
        ...chipCorners(laneLargo, labels.largo ?? "Largo", largoText),
        ...chipCorners(laneAncho, labels.ancho ?? "Ancho", anchoText),
        ...chipCorners(laneProfundidad, labels.profundidad ?? "Profundidad", profundidadText),
      ],
      CANVAS_MARGIN
    );

    return (
      <svg viewBox={`0 0 ${canvas.viewBoxW} ${canvas.viewBoxH}`} {...svgProps} aria-label={`Diagrama de ${labels.largo}, ${labels.ancho} y ${labels.profundidad}`}>
        <g transform={`translate(${canvas.translate[0]},${canvas.translate[1]})`}>
          <BoxSolid wallLeft={faces.wallLeft} wallRight={faces.wallRight} top={faces.top} />
          <DimensionChip lane={laneLargo} label={labels.largo ?? "Largo"} value={largoText} active={activeField === "largo"} />
          <DimensionChip lane={laneAncho} label={labels.ancho ?? "Ancho"} value={anchoText} active={activeField === "ancho"} />
          <DimensionChip lane={laneProfundidad} label={labels.profundidad ?? "Profundidad"} value={profundidadText} active={activeField === "profundidad"} />
        </g>
      </svg>
    );
  }

  if (kind === "cylinder") {
    const DI = diametro ?? 4;
    const D = profundidad ?? 1.5;
    const [rR, dR] = compressedRatios([DI, D]);
    const local = buildCylinder(rR / 2, dR);
    const fit = fitToSilhouette(cylinderAllPoints(local), PAD, CONTENT_TARGET);
    const topLeft = fit.project(local.topLeft);
    const topRight = fit.project(local.topRight);
    const topCenter = fit.project(local.topCenter);
    const bottomLeft = fit.project(local.bottomLeft);
    const bottomRight = fit.project(local.bottomRight);
    const rx = fit.k * local.rx;
    const ry = fit.k * local.ry;
    // Punto más bajo real del arco visible (no la línea de los tangentes)
    // — mismo ajuste ya validado en el sistema anterior, sigue aplicando
    // acá porque es geometría de elipse, no de cámara.
    const diaArrowY = (bottomLeft[1] + bottomRight[1]) / 2 + ry;
    const diaA: Vec2 = [bottomLeft[0], diaArrowY];
    const diaB: Vec2 = [bottomRight[0], diaArrowY];

    const diametroText = fmt(diametro, unit) || (labels.diametro ?? "");
    const profundidadText = fmt(profundidad, unit) || (labels.profundidad ?? "");

    const laneDiametro = buildLane(diaA, diaB, [0, 1]);
    const laneProfundidad = buildDepthLane(topRight, bottomRight);

    const canvas = finalizeCanvas(
      fit.viewBoxW,
      fit.viewBoxH,
      [
        ...chipCorners(laneDiametro, labels.diametro ?? "Diámetro", diametroText),
        ...chipCorners(laneProfundidad, labels.profundidad ?? "Profundidad", profundidadText),
      ],
      CANVAS_MARGIN
    );

    return (
      <svg viewBox={`0 0 ${canvas.viewBoxW} ${canvas.viewBoxH}`} {...svgProps} aria-label={`Diagrama de ${labels.diametro} y ${labels.profundidad}`}>
        <g transform={`translate(${canvas.translate[0]},${canvas.translate[1]})`}>
          <CylinderSolid topLeft={topLeft} topRight={topRight} topCenter={topCenter} bottomLeft={bottomLeft} bottomRight={bottomRight} rx={rx} ry={ry} />
          <DimensionChip lane={laneDiametro} label={labels.diametro ?? "Diámetro"} value={diametroText} active={activeField === "diametro"} />
          <DimensionChip lane={laneProfundidad} label={labels.profundidad ?? "Profundidad"} value={profundidadText} active={activeField === "profundidad"} />
        </g>
      </svg>
    );
  }

  if (kind === "rect2d") {
    const L = largo ?? 4.5;
    const A = ancho ?? 2.8;
    const [lR, aR] = compressedRatios([L, A]);
    const fit = fitToSilhouette(
      [
        [0, 0],
        [lR, aR],
      ],
      PAD,
      CONTENT_TARGET
    );
    const TL = fit.project([0, 0]);
    const BR = fit.project([lR, aR]);
    const TR: Vec2 = [BR[0], TL[1]];
    const BL: Vec2 = [TL[0], BR[1]];
    const w = BR[0] - TL[0];
    const h = BR[1] - TL[1];

    const largoText = fmt(largo, unit) || (labels.largo ?? "");
    const anchoText = fmt(ancho, unit) || (labels.ancho ?? "");

    // Regla explícita del mockup: "Largo abajo, ancho a la derecha,
    // siempre" — ver Sistema 2D del PDF (Radier, Cerámica, Vereda).
    const laneLargo = buildLane(BL, BR, [0, 1]);
    const laneAncho = buildLane(TR, BR, [1, 0]);

    const canvas = finalizeCanvas(
      fit.viewBoxW,
      fit.viewBoxH,
      [...chipCorners(laneLargo, labels.largo ?? "Largo", largoText), ...chipCorners(laneAncho, labels.ancho ?? "Ancho", anchoText)],
      CANVAS_MARGIN
    );

    return (
      <svg viewBox={`0 0 ${canvas.viewBoxW} ${canvas.viewBoxH}`} {...svgProps} aria-label={`Diagrama de ${labels.largo} y ${labels.ancho}`}>
        <g transform={`translate(${canvas.translate[0]},${canvas.translate[1]})`}>
          <Rect2D x={TL[0]} y={TL[1]} width={w} height={h} />
          <DimensionChip lane={laneLargo} label={labels.largo ?? "Largo"} value={largoText} active={activeField === "largo"} />
          <DimensionChip lane={laneAncho} label={labels.ancho ?? "Ancho"} value={anchoText} active={activeField === "ancho"} />
        </g>
      </svg>
    );
  }

  // circle2d
  const fit = fitToSilhouette(
    [
      [-1, -1],
      [1, 1],
    ],
    PAD,
    CONTENT_TARGET
  );
  const center = fit.project([0, 0]);
  const r = fit.k;
  const diaA: Vec2 = [center[0] - r, center[1] + r];
  const diaB: Vec2 = [center[0] + r, center[1] + r];
  const diametroText = fmt(diametro, unit) || (labels.diametro ?? "");
  const laneDiametro = buildLane(diaA, diaB, [0, 1]);
  const canvas = finalizeCanvas(fit.viewBoxW, fit.viewBoxH, chipCorners(laneDiametro, labels.diametro ?? "Diámetro", diametroText), CANVAS_MARGIN);

  return (
    <svg viewBox={`0 0 ${canvas.viewBoxW} ${canvas.viewBoxH}`} {...svgProps} aria-label={`Diagrama de ${labels.diametro}`}>
      <g transform={`translate(${canvas.translate[0]},${canvas.translate[1]})`}>
        <Circle2D cx={center[0]} cy={center[1]} r={r} />
        <DimensionChip lane={laneDiametro} label={labels.diametro ?? "Diámetro"} value={diametroText} active={activeField === "diametro"} />
      </g>
    </svg>
  );
}
