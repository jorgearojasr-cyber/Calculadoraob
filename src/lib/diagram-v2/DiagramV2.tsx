"use client";

// Componente público ÚNICO de Diagram System V2 — ver API aprobada,
// conversación 2026-08-01. Compone math/ + layout/ + render/ según
// `kind`. Es el único archivo de este sistema que otros componentes de
// la app deberían importar.

import { boxAllPoints, boxFaces, buildBox, buildCylinder, cylinderAllPoints, type BoxProjected } from "./math/solids";
import { compressedRatios, finalizeCanvas, fitToSilhouette } from "./math/scale-engine";
import type { Vec2 } from "./math/vec2";
import { buildLane, outwardFromFace, LANE_OFFSET, type Lane } from "./layout/dimension-lane";
import { buildDepthLane } from "./layout/depth-lane";
import { BoxSolid, CylinderSolid } from "./render/solid-3d";
import { Rect2D, Circle2D, VoidRect } from "./render/shape-2d";
import { DimensionChip, CHIP_H, estimateChipWidth } from "./render/dimension-chip";
import { theme } from "./render/theme";

const PAD = 20;
const CONTENT_TARGET = 205; // eje dominante ≈ 205/(205+40) ≈ 84% del panel
const CANVAS_MARGIN = 6; // margen final entre el chip más lejano y el borde del panel
// Calibración 2026-08-02 (punto 5, "alejar algunos píxeles los chips del
// sólido") — NO se toca LANE_OFFSET (layout/dimension-lane.ts, valor
// congelado); acá, en la capa de composición, se pasa un offset apenas
// mayor al construir cada carril. CHIP_OFFSET_ANCHO_2D es un poco más
// grande todavía — pedido explícito para el Ancho de los diagramas 2D
// (Radier), que "necesita respirar un poco más del dibujo".
const CHIP_OFFSET = LANE_OFFSET + 4;
const CHIP_OFFSET_ANCHO_2D = LANE_OFFSET + 12;

type Field = "largo" | "ancho" | "profundidad" | "diametro";

// Campos de "steppedBox" — figura de 2 cajas apiladas (base ancha + cuello
// angosto encima), ej. Fundación (cimiento corrido): la base y el cuello
// son 2 secciones rectangulares reales distintas, no una sola caja con
// profundidad — forzarla al `kind: "box"` de siempre mostraría solo una
// de las 2 secciones. Reutiliza la MISMA cámara/proyección/tema que el
// resto del sistema (ver buildBox con offset en math/solids.ts) — es una
// composición de 2 boxes, no un motor de dibujo nuevo. Decisión de
// producto (Fase 4, 2026-08-02): "excepción justificada por la geometría,
// no por el módulo".
type SteppedField = "largo" | "anchoBase" | "altoBase" | "anchoCuello" | "altoCuello";

export type DiagramV2Props = {
  kind: "box" | "cylinder" | "rect2d" | "circle2d" | "steppedBox";
  largo?: number;
  ancho?: number;
  profundidad?: number;
  diametro?: number;
  // Solo para kind="steppedBox" — ver SteppedField arriba.
  steppedBox?: {
    largo?: number;
    anchoBase?: number;
    altoBase?: number;
    anchoCuello?: number;
    altoCuello?: number;
  };
  steppedLabels?: Partial<Record<SteppedField, string>>;
  steppedUnits?: Partial<Record<SteppedField, string>>;
  activeSteppedField?: SteppedField;
  // Vanos descontados (puertas/ventanas) — solo para kind="rect2d". Cada
  // uno trae su tamaño real (ancho×alto, mismas unidades que `largo`/
  // `ancho`), NUNCA una posición — no existe ese dato (ver AreaInputToggle,
  // que solo pide tamaño). Se distribuyen ilustrativamente en fila sobre
  // la base del rectángulo, proporcionales a su tamaño real. Filosofía
  // general del sistema (Fase 4, 2026-08-02): "cuando falten datos,
  // representar una versión ilustrativa claramente identificable como
  // tal" — nunca inventar una posición que el usuario no dio.
  voids?: { ancho: number; alto: number }[];
  // Retícula de modulación — SOLO para kind="rect2d", SOLO cuando el
  // tamaño real de la pieza es un dato conocido (ej. Cerámica/
  // Porcelanato: el usuario ya eligió "60x60cm" antes de este paso). En
  // centímetros, mismo criterio que QuestionOption.numericValue. Dibuja
  // líneas de grilla (no cada pieza individual — costoso y no aporta
  // nada extra) proporcionales al tamaño real; el último tramo de cada
  // eje queda más corto que el resto, lo que de forma natural comunica
  // el corte perimetral sin tener que calcularlo aparte. Filosofía Fase 4
  // (2026-08-02): "si el dato existe, aprovecharlo; si no existe, no
  // inventar una representación solo por verse mejor" — ver también
  // `orientationHint` para el caso sin tamaño de pieza conocido.
  tileSizeCm?: { width: number; height: number };
  // Pista de orientación (recto/diagonal) cuando NO hay tamaño de pieza
  // real (ej. Piso SPC/flotante: solo se sabe "tipo de instalación").
  // Deliberadamente más tenue/liviana que `tileSizeCm` (menos líneas,
  // trazo más suave) para que nunca se confunda con una modulación real
  // — es una insinuación de dirección, no una cuenta de piezas.
  orientationHint?: "recto" | "diagonal";
  // Techumbres (Fase 4 Grupo 5, 2026-08-02) — SOLO para kind="rect2d". El
  // mismo factor real que ya usa la Variable "factor-de-inclinacion" del
  // módulo (expuesto vía QuestionOption.numericValue, ver
  // question-group-step.tsx), NUNCA un ángulo inventado: dibuja un plano
  // inclinado ilustrativo junto al rectángulo de planta para explicar por
  // qué la superficie real del techo es mayor que la proyectada. La
  // ALTURA del plano es proporcional al factor (capada visualmente para
  // que siga siendo legible); el ÁNGULO dibujado no representa un grado
  // medido — el dato real es un balde (poco/medio/muy inclinado), no un
  // ángulo — los valores de superficie (reales) los muestra el caller
  // debajo del diagrama, no este componente.
  roofSlopeFactor?: number;
  // Piscina (Fase 4 Grupo 4, 2026-08-02) — SOLO para kind="box"/"cylinder".
  // Lavado celeste semitransparente sobre las mismas caras del sólido de
  // siempre (ver theme.water, BoxSolid/CylinderSolid) — "que se perciba
  // que es una piscina", sin geometría nueva. La cara superior es la
  // superficie del agua; no existe una pregunta de "nivel de agua"
  // distinta de la profundidad, así que llena hasta el borde.
  waterFill?: boolean;
  labels: Partial<Record<Field, string>>;
  // Unidad global, usada cuando un campo no tiene su propia unidad en
  // `units`. La mayoría de los módulos comparten una sola unidad para
  // todos sus campos (ej. todo en metros) — `unit` cubre ese caso simple.
  unit?: string;
  // Unidad por campo — necesario para módulos reales con unidades
  // mixtas (ej. Pilar/columna: ancho y alto en cm, profundidad en m).
  // Bug real encontrado en la revisión funcional 2026-08-02: sin esto,
  // Pilar/columna mostraba "2,8 cm" para un valor que en realidad es
  // "2,8 m" (se usaba una única unidad global para los 3 campos).
  // `units` resuelve el caso mixto sin romper a los consumidores que
  // solo pasan `unit`.
  units?: Partial<Record<Field, string>>;
  activeField?: Field;
  className?: string;
};

function fmt(n: number | undefined, unit: string): string {
  if (n === undefined || !Number.isFinite(n)) return "";
  return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(n)} ${unit}`;
}

// Describe un campo para el aria-label del SVG con su valor en vivo (ej.
// "Largo: 4,50 m"), no solo el nombre del campo — accesibilidad (Fase B,
// 2026-08-02): un lector de pantalla debe recibir la misma información que
// un usuario vidente ve en los chips. `valueText` ya viene calculado como
// `fmt(n, unit) || label` (ver cada kind más abajo) — cuando el campo
// todavía no tiene valor, valueText === label, así que se omite el ": ".
function describeField(label: string | undefined, valueText: string): string {
  if (!label) return "";
  return valueText && valueText !== label ? `${label}: ${valueText}` : label;
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

export function DiagramV2({
  kind,
  largo,
  ancho,
  profundidad,
  diametro,
  steppedBox,
  steppedLabels,
  steppedUnits,
  activeSteppedField,
  voids,
  tileSizeCm,
  orientationHint,
  roofSlopeFactor,
  waterFill,
  labels,
  unit = "m",
  units,
  activeField,
  className,
}: DiagramV2Props) {
  const svgProps = { className: className ?? "w-full", role: "img" as const };
  const u = (field: Field): string => units?.[field] ?? unit;
  const su = (field: SteppedField): string => steppedUnits?.[field] ?? unit;

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

    const largoText = fmt(largo, u("largo")) || (labels.largo ?? "");
    const anchoText = fmt(ancho, u("ancho")) || (labels.ancho ?? "");
    const profundidadText = fmt(profundidad, u("profundidad")) || (labels.profundidad ?? "");

    // El eje "largo" (P1) queda del lado DERECHO de la cámara (AXIS_LARGO
    // apunta abajo-derecha) y el eje "ancho" (P2) del lado IZQUIERDO — ver
    // mockup real: Largo siempre a la derecha, Ancho siempre a la
    // izquierda. La arista P0d-P1d es físicamente la de largo (pared
    // "wallRight"); P0d-P2d es la de ancho (pared "wallLeft").
    //
    // chipT=0.95: ambas aristas comparten el vértice P0d — ver comentario
    // en buildLane, sesgamos el chip hacia el extremo lejano para que no
    // se superpongan en objetos angostos en planta (ej. Pilar/columna).
    let laneAncho = buildLane(P.P0d, P.P2d, outwardFromFace(P.P0d, P.P2d, faces.wallLeft), CHIP_OFFSET, 0.95);
    let laneLargo = buildLane(P.P0d, P.P1d, outwardFromFace(P.P0d, P.P1d, faces.wallRight), CHIP_OFFSET, 0.95);
    const laneProfundidad = buildDepthLane(P.P1, P.P1d, CHIP_OFFSET);
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
      <svg
        viewBox={`0 0 ${canvas.viewBoxW} ${canvas.viewBoxH}`}
        {...svgProps}
        aria-label={`Diagrama de ${describeField(labels.largo, largoText)}, ${describeField(labels.ancho, anchoText)} y ${describeField(labels.profundidad, profundidadText)}`}
      >
        <g transform={`translate(${canvas.translate[0]},${canvas.translate[1]})`}>
          <BoxSolid wallLeft={faces.wallLeft} wallRight={faces.wallRight} top={faces.top} waterFill={waterFill} />
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

    const diametroText = fmt(diametro, u("diametro")) || (labels.diametro ?? "");
    const profundidadText = fmt(profundidad, u("profundidad")) || (labels.profundidad ?? "");

    const laneDiametro = buildLane(diaA, diaB, [0, 1], CHIP_OFFSET);
    const laneProfundidad = buildDepthLane(topRight, bottomRight, CHIP_OFFSET);

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
      <svg
        viewBox={`0 0 ${canvas.viewBoxW} ${canvas.viewBoxH}`}
        {...svgProps}
        aria-label={`Diagrama de ${describeField(labels.diametro, diametroText)} y ${describeField(labels.profundidad, profundidadText)}`}
      >
        <g transform={`translate(${canvas.translate[0]},${canvas.translate[1]})`}>
          <CylinderSolid topLeft={topLeft} topRight={topRight} topCenter={topCenter} bottomLeft={bottomLeft} bottomRight={bottomRight} rx={rx} ry={ry} waterFill={waterFill} />
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

    const largoText = fmt(largo, u("largo")) || (labels.largo ?? "");
    const anchoText = fmt(ancho, u("ancho")) || (labels.ancho ?? "");

    // Regla explícita del mockup: "Largo abajo, ancho a la derecha,
    // siempre" — ver Sistema 2D del PDF (Radier, Cerámica, Vereda). Ancho
    // usa CHIP_OFFSET_ANCHO_2D (más aire) — pedido explícito de esta
    // calibración para la cota vertical de Radier.
    //
    // Ambas aristas comparten el vértice BR — mismo caso que largo/ancho
    // en "box" (ver comentario de separateChips): para un rectángulo
    // cercano a cuadrado (ej. 0,15×0,15) los 2 chips pueden superponerse
    // cerca de esa esquina. Bug real encontrado en la revisión funcional
    // 2026-08-02 (antes separateChips solo se aplicaba en "box").
    let laneLargo = buildLane(BL, BR, [0, 1], CHIP_OFFSET);
    let laneAncho = buildLane(TR, BR, [1, 0], CHIP_OFFSET_ANCHO_2D);
    [laneLargo, laneAncho] = separateChips(laneLargo, [labels.largo ?? "Largo", largoText], laneAncho, [labels.ancho ?? "Ancho", anchoText]);

    // Vanos (ver comentario de `voids` arriba) — SOLO ilustrativos:
    // proporcionales a su tamaño real, apoyados en la base, centrados
    // como grupo. Nunca se intenta ubicar dónde está la puerta/ventana
    // real porque ese dato no existe.
    const voidRects = (voids ?? []).filter((v) => v.ancho > 0 && v.alto > 0);
    const voidElements: React.ReactNode[] = [];
    if (voidRects.length > 0 && L > 0 && A > 0) {
      const pxPerL = w / L;
      const pxPerA = h / A;
      const marginPx = w * 0.06;
      const gapPx = w * 0.03;
      const widthsPx = voidRects.map((v) => Math.min(v.ancho * pxPerL, w - 2 * marginPx));
      const totalWidthPx = widthsPx.reduce((sum, vw) => sum + vw, 0) + gapPx * (voidRects.length - 1);
      let cursorX = TL[0] + (w - totalWidthPx) / 2;
      voidRects.forEach((v, i) => {
        const vw = widthsPx[i];
        const vh = Math.min(v.alto * pxPerA, h - marginPx);
        const vx = cursorX;
        const vy = BR[1] - vh;
        cursorX += vw + gapPx;
        voidElements.push(<VoidRect key={i} x={vx} y={vy} width={vw} height={vh} />);
      });
    }

    // Retícula de modulación (tamaño real de pieza) o pista de orientación
    // (sin tamaño real) — nunca ambas a la vez, mutuamente excluyentes.
    // Tope de líneas (MAX_GRID_LINES): con piezas muy chicas en una
    // superficie grande, cientos de líneas no ayudan a entender nada y
    // sí cuestan performance — se prefiere no dibujar nada antes que
    // saturar el dibujo (mismo criterio que "si no aporta valor, dejar
    // el dibujo limpio").
    const MAX_GRID_LINES = 60;
    const gridLines: React.ReactNode[] = [];
    if (tileSizeCm && L > 0 && A > 0 && tileSizeCm.width > 0 && tileSizeCm.height > 0) {
      const tileWm = tileSizeCm.width / 100;
      const tileHm = tileSizeCm.height / 100;
      const nCols = Math.floor(L / tileWm);
      const nRows = Math.floor(A / tileHm);
      if (nCols + nRows <= MAX_GRID_LINES && nCols >= 1 && nRows >= 1) {
        const pxPerL = w / L;
        const pxPerA = h / A;
        for (let i = 1; i <= nCols; i++) {
          const x = TL[0] + i * tileWm * pxPerL;
          if (x >= BR[0]) break;
          gridLines.push(<line key={`v${i}`} x1={x} y1={TL[1]} x2={x} y2={BR[1]} stroke={theme.tileGrid.stroke} strokeWidth={theme.tileGrid.strokeWidth} />);
        }
        for (let i = 1; i <= nRows; i++) {
          const y = TL[1] + i * tileHm * pxPerA;
          if (y >= BR[1]) break;
          gridLines.push(<line key={`h${i}`} x1={TL[0]} y1={y} x2={BR[0]} y2={y} stroke={theme.tileGrid.stroke} strokeWidth={theme.tileGrid.strokeWidth} />);
        }
      }
    } else if (orientationHint && L > 0 && A > 0) {
      // Sin tamaño real de pieza: solo 3 líneas guía, bien tenues,
      // horizontales/verticales (recto) o a 45° (diagonal) — insinúan
      // dirección, no cuentan piezas.
      const step = 1 / 4;
      for (let i = 1; i <= 3; i++) {
        if (orientationHint === "recto") {
          const x = TL[0] + i * step * w;
          gridLines.push(
            <line key={`o${i}`} x1={x} y1={TL[1]} x2={x} y2={BR[1]} stroke={theme.orientationHint.stroke} strokeWidth={theme.orientationHint.strokeWidth} strokeDasharray={theme.orientationHint.strokeDasharray} />
          );
        } else {
          const offset = i * step * (w + h);
          const x1 = TL[0] + Math.max(0, offset - h);
          const y1 = TL[1] + Math.min(h, offset);
          const x2 = TL[0] + Math.min(w, offset);
          const y2 = TL[1] + Math.max(0, offset - w);
          gridLines.push(
            <line key={`o${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.orientationHint.stroke} strokeWidth={theme.orientationHint.strokeWidth} strokeDasharray={theme.orientationHint.strokeDasharray} />
          );
        }
      }
    }

    // Plano inclinado ilustrativo (ver roofSlopeFactor arriba) — un
    // paralelogramo simple a la derecha del rectángulo de planta, altura
    // proporcional al factor real (capada en 1.35 para que siga cabiendo
    // legible en el panel aunque el factor real sea mayor).
    let roofSlopePoints: Vec2[] | null = null;
    if (roofSlopeFactor && roofSlopeFactor > 1 && w > 0 && h > 0) {
      const gap = w * 0.22;
      const skew = h * 0.28;
      const roofW = w * 0.85;
      const roofH = h * Math.min(roofSlopeFactor, 1.35);
      const px0 = BR[0] + gap;
      const bl: Vec2 = [px0, BR[1]];
      const brRoof: Vec2 = [px0 + roofW, BR[1]];
      const tr: Vec2 = [px0 + roofW + skew, BR[1] - roofH];
      const tl: Vec2 = [px0 + skew, BR[1] - roofH];
      roofSlopePoints = [bl, brRoof, tr, tl];
    }

    const canvas = finalizeCanvas(
      fit.viewBoxW,
      fit.viewBoxH,
      [
        ...chipCorners(laneLargo, labels.largo ?? "Largo", largoText),
        ...chipCorners(laneAncho, labels.ancho ?? "Ancho", anchoText),
        ...(roofSlopePoints ?? []),
      ],
      CANVAS_MARGIN
    );

    return (
      <svg
        viewBox={`0 0 ${canvas.viewBoxW} ${canvas.viewBoxH}`}
        {...svgProps}
        aria-label={`Diagrama de ${describeField(labels.largo, largoText)} y ${describeField(labels.ancho, anchoText)}${voidRects.length > 0 ? `, con ${voidRects.length} vano(s) descontado(s) (posición ilustrativa)` : ""}${roofSlopePoints ? ", con plano inclinado ilustrativo del techo" : ""}`}
      >
        <g transform={`translate(${canvas.translate[0]},${canvas.translate[1]})`}>
          <Rect2D x={TL[0]} y={TL[1]} width={w} height={h} />
          {gridLines}
          {voidElements}
          {roofSlopePoints && (
            <polygon
              points={roofSlopePoints.map((p) => `${p[0]},${p[1]}`).join(" ")}
              fill={theme.roofSlope.fill}
              stroke={theme.roofSlope.stroke}
              strokeWidth={theme.roofSlope.strokeWidth}
              strokeLinejoin="round"
            />
          )}
          <DimensionChip lane={laneLargo} label={labels.largo ?? "Largo"} value={largoText} active={activeField === "largo"} />
          <DimensionChip lane={laneAncho} label={labels.ancho ?? "Ancho"} value={anchoText} active={activeField === "ancho"} />
        </g>
      </svg>
    );
  }

  if (kind === "steppedBox") {
    const s = steppedBox ?? {};
    const L = s.largo ?? 3;
    const AB = s.anchoBase ?? 0.6;
    const HB = s.altoBase ?? 0.3;
    const AC = s.anchoCuello ?? 0.3;
    const HC = s.altoCuello ?? 0.4;
    // Mismo escalado no lineal que el resto del sistema, aplicado a las 5
    // medidas juntas para que la base y el cuello queden en la misma
    // escala relativa entre sí (no cada una normalizada por separado).
    const [lR, abR, hbR, acR, hcR] = compressedRatios([L, AB, HB, AC, HC]);

    // Cuello arriba (profundidad 0..hcR, más angosto), base abajo
    // (profundidad hcR..hcR+hbR, más ancha) — mismo sentido que "box"
    // (profundidad = hacia abajo desde la superficie). El cuello se centra
    // dentro del ancho de la base (mismo criterio real de una fundación).
    const anchoOffsetCuello = (abR - acR) / 2;
    const cuelloLocal = buildBox(lR, acR, hcR, anchoOffsetCuello, 0);
    const baseLocal = buildBox(lR, abR, hbR, 0, hcR);

    const fit = fitToSilhouette([...boxAllPoints(cuelloLocal), ...boxAllPoints(baseLocal)], PAD, CONTENT_TARGET);
    const projectBox = (b: typeof cuelloLocal): BoxProjected => ({
      P0: fit.project(b.P0),
      P1: fit.project(b.P1),
      P2: fit.project(b.P2),
      P3: fit.project(b.P3),
      P0d: fit.project(b.P0d),
      P1d: fit.project(b.P1d),
      P2d: fit.project(b.P2d),
    });
    const cuelloP = projectBox(cuelloLocal);
    const baseP = projectBox(baseLocal);
    const cuelloFaces = boxFaces(cuelloP);
    const baseFaces = boxFaces(baseP);

    const largoText = fmt(L, su("largo")) || (steppedLabels?.largo ?? "");
    const anchoBaseText = fmt(AB, su("anchoBase")) || (steppedLabels?.anchoBase ?? "");
    const altoBaseText = fmt(HB, su("altoBase")) || (steppedLabels?.altoBase ?? "");
    const anchoCuelloText = fmt(AC, su("anchoCuello")) || (steppedLabels?.anchoCuello ?? "");
    const altoCuelloText = fmt(HC, su("altoCuello")) || (steppedLabels?.altoCuello ?? "");

    // Largo: 1 sola cota (compartida por base y cuello), sobre la arista
    // de la base — es la más externa, la más fácil de leer.
    const laneLargo = buildLane(baseP.P0d, baseP.P1d, outwardFromFace(baseP.P0d, baseP.P1d, baseFaces.wallRight), CHIP_OFFSET, 0.95);
    const laneAnchoBase = buildLane(baseP.P0d, baseP.P2d, outwardFromFace(baseP.P0d, baseP.P2d, baseFaces.wallLeft), CHIP_OFFSET, 0.95);
    const laneAltoBase = buildDepthLane(baseP.P1, baseP.P1d, CHIP_OFFSET);
    const laneAnchoCuello = buildLane(cuelloP.P0d, cuelloP.P2d, outwardFromFace(cuelloP.P0d, cuelloP.P2d, cuelloFaces.wallLeft), CHIP_OFFSET, 0.95);
    const laneAltoCuello = buildDepthLane(cuelloP.P1, cuelloP.P1d, CHIP_OFFSET);

    const canvas = finalizeCanvas(
      fit.viewBoxW,
      fit.viewBoxH,
      [
        ...chipCorners(laneLargo, steppedLabels?.largo ?? "Largo", largoText),
        ...chipCorners(laneAnchoBase, steppedLabels?.anchoBase ?? "Ancho base", anchoBaseText),
        ...chipCorners(laneAltoBase, steppedLabels?.altoBase ?? "Alto base", altoBaseText),
        ...chipCorners(laneAnchoCuello, steppedLabels?.anchoCuello ?? "Ancho cuello", anchoCuelloText),
        ...chipCorners(laneAltoCuello, steppedLabels?.altoCuello ?? "Alto cuello", altoCuelloText),
      ],
      CANVAS_MARGIN
    );

    return (
      <svg
        viewBox={`0 0 ${canvas.viewBoxW} ${canvas.viewBoxH}`}
        {...svgProps}
        aria-label={`Diagrama de fundación: ${describeField(steppedLabels?.largo, largoText)}, ${describeField(steppedLabels?.anchoBase, anchoBaseText)}/${describeField(steppedLabels?.altoBase, altoBaseText)} (base) y ${describeField(steppedLabels?.anchoCuello, anchoCuelloText)}/${describeField(steppedLabels?.altoCuello, altoCuelloText)} (cuello)`}
      >
        <g transform={`translate(${canvas.translate[0]},${canvas.translate[1]})`}>
          <BoxSolid wallLeft={baseFaces.wallLeft} wallRight={baseFaces.wallRight} top={baseFaces.top} />
          <BoxSolid wallLeft={cuelloFaces.wallLeft} wallRight={cuelloFaces.wallRight} top={cuelloFaces.top} />
          <DimensionChip lane={laneLargo} label={steppedLabels?.largo ?? "Largo"} value={largoText} active={activeSteppedField === "largo"} />
          <DimensionChip lane={laneAnchoBase} label={steppedLabels?.anchoBase ?? "Ancho base"} value={anchoBaseText} active={activeSteppedField === "anchoBase"} />
          <DimensionChip lane={laneAltoBase} label={steppedLabels?.altoBase ?? "Alto base"} value={altoBaseText} active={activeSteppedField === "altoBase"} />
          <DimensionChip lane={laneAnchoCuello} label={steppedLabels?.anchoCuello ?? "Ancho cuello"} value={anchoCuelloText} active={activeSteppedField === "anchoCuello"} />
          <DimensionChip lane={laneAltoCuello} label={steppedLabels?.altoCuello ?? "Alto cuello"} value={altoCuelloText} active={activeSteppedField === "altoCuello"} />
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
  const diametroText = fmt(diametro, u("diametro")) || (labels.diametro ?? "");
  const laneDiametro = buildLane(diaA, diaB, [0, 1], CHIP_OFFSET);
  const canvas = finalizeCanvas(fit.viewBoxW, fit.viewBoxH, chipCorners(laneDiametro, labels.diametro ?? "Diámetro", diametroText), CANVAS_MARGIN);

  return (
    <svg viewBox={`0 0 ${canvas.viewBoxW} ${canvas.viewBoxH}`} {...svgProps} aria-label={`Diagrama de ${describeField(labels.diametro, diametroText)}`}>
      <g transform={`translate(${canvas.translate[0]},${canvas.translate[1]})`}>
        <Circle2D cx={center[0]} cy={center[1]} r={r} />
        <DimensionChip lane={laneDiametro} label={labels.diametro ?? "Diámetro"} value={diametroText} active={activeField === "diametro"} />
      </g>
    </svg>
  );
}
