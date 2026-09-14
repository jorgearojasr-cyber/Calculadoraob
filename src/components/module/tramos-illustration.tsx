import { useId } from "react";
import { Info } from "lucide-react";
import { formatQuantity } from "@/lib/format-number";
import type { TramoRecord } from "./dimension-utils/tramos";

// Ilustración de "Área personalizada" (Fase 3, 2026-09-14) — componente
// standalone, NO conectado al motor genérico DiagramV2 (mismo criterio que
// radier-illustration.tsx / pintura-illustration.tsx: el sistema
// DiagramV2/shape-2d/theme/scale-engine/solids queda congelado sin
// excepciones — este archivo no importa nada de src/lib/diagram-v2).
//
// No existe DiagramV2 kind="rect2d" para esto: sus `voids` se dibujan
// siempre DENTRO de un único rectángulo exterior largo×ancho — un tramo
// "suma" no es un hueco de ese rectángulo, es una pieza independiente que
// se agrega al total (ej. un living en L no tiene un largo/ancho exterior
// único del que restar nada). Por eso este componente dibuja cada tramo
// como su propio bloque, no como un hueco.
//
// Mismo criterio de honestidad que vanos/RadierIllustration: NO existe
// posición real de cada tramo entre sí (el usuario solo da tamaño), así
// que el layout es ilustrativo — bloques en fila (o apilados, ver
// STACK_THRESHOLD abajo), ancho proporcional a su propio largo:ancho real
// (acotado a un rango legible) — nunca un plano a escala real.
//
// Ajuste visual (2026-09-14, pedido de Jorge tras probar en navegador):
// antes este componente se veía "desconectado" del lenguaje de DiagramV2
// (relleno plano, sin grilla, sin cotas fuera del número central). Ahora
// calca literalmente 3 piezas de ese lenguaje — trazo/relleno de
// theme.ts, la trama de "resta" de shape-2d.tsx (ya establecido como
// precedente en pintura-illustration.tsx), y el chip de cota de
// dimension-chip.tsx (blanco, borde fino, valor en IBM Plex Mono) — todas
// COPIADAS como constantes literales, nunca importadas: cambiar el tema
// congelado no afecta a este archivo, y viceversa.
export type TramosIllustrationProps = {
  tramos: TramoRecord[];
};

// --- Paleta: copia literal de src/lib/diagram-v2/render/theme.ts ---
const SUMA_FILL = "#F1F5FB"; // theme.fill.top
const STROKE_NAVY = "#0B2A52"; // theme.stroke.solid
const STROKE_WIDTH = 1.8; // theme.stroke.width
const RESTA_FILL = "#FFFFFF"; // theme.voidShape.fill
const RESTA_HATCH = "#FF4E00"; // theme.voidShape.hatch (BRAND_ORANGE)
const RESTA_HATCH_OPACITY = 0.42; // theme.voidShape.hatchOpacity
const RESTA_STROKE = "#FF4E00"; // theme.voidShape.stroke
const RESTA_DASHARRAY = "4 2"; // theme.voidShape.strokeDasharray
const CHIP_BG = "#FFFFFF"; // theme.chip.bg
const CHIP_BORDER = "#DCE2EC"; // theme.chip.border
const CHIP_RADIUS = 7; // theme.chip.radius
const CHIP_VALUE_COLOR = "#132A4C"; // theme.chip.valueColor
const INK_FAINT = "#8A8378";

// A partir de esta cantidad de tramos, el layout pasa de filas
// horizontales (proporcionales, envueltas) a una sola columna apilada —
// en 375px, 4+ bloques en fila quedan comprimidos hasta ilegibles o
// fuerzan overflow horizontal (ver verificación mobile, pedido de Jorge).
// Apilado, cada bloque conserva el mismo ancho legible sin importar
// cuántos tramos haya — solo crece el alto total del SVG (scroll
// vertical, nunca horizontal).
const STACK_THRESHOLD = 4;

const ROW_HEIGHT = 84;
const STACK_ROW_HEIGHT = 52; // más bajo que ROW_HEIGHT — apilar 7 a la altura normal sería excesivo
const MIN_RATIO = 1 / 3;
const MAX_RATIO = 3;
const MIN_BLOCK_WIDTH = 46;
const GAP = 14;
const ROW_GAP = 34;
const STACK_GAP = 22; // menor que ROW_GAP — bloques apilados quedan más juntos, es una lista, no filas separadas
const MAX_ROW_WIDTH = 480;
const PAD = 16;
// Espacio reservado para los chips de cota (largo abajo, ancho a la
// derecha de cada bloque) — mismo criterio de layout que DiagramV2
// ("Largo abajo, ancho a la derecha, siempre").
const CHIP_H = 18;
const CHIP_PAD_X = 6;
const CHIP_GAP_BELOW = 6;
const CHIP_GAP_RIGHT = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function approxTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.58;
}

function estimateChipWidth(value: string): number {
  return Math.max(30, approxTextWidth(value, 10) + CHIP_PAD_X * 2);
}

type Block = {
  tramo: TramoRecord;
  width: number;
  height: number;
  // Ancho a reservar para este bloque al calcular filas/cursor (>= width):
  // incluye el chip de "ancho" que sobresale a la derecha del borde real
  // (ver DimensionChip más abajo) — bug real encontrado en verificación
  // 900px (2026-09-14): sin esto, el chip de un bloque quedaba tapado por
  // el bloque siguiente de la misma fila, porque el empaquetado solo
  // contaba `width + GAP` entre bloques, no el chip que sobresale.
  packWidth: number;
};

function buildBlock(tramo: TramoRecord, rowHeight: number): Block {
  const ratio = clamp(tramo.ancho > 0 ? tramo.largo / tramo.ancho : 1, MIN_RATIO, MAX_RATIO);
  const width = Math.max(rowHeight * ratio, MIN_BLOCK_WIDTH);
  const anchoChipWidth = estimateChipWidth(`${formatQuantity(tramo.ancho)} m`);
  const packWidth = width + CHIP_GAP_RIGHT + anchoChipWidth;
  return { tramo, width, height: rowHeight, packWidth };
}

// Empaqueta bloques en filas que no excedan MAX_ROW_WIDTH — mismo criterio
// visual que un flex-wrap, hecho a mano porque SVG no lo tiene nativo. Usa
// `packWidth` (no `width`) para dejarle sitio real al chip de "ancho".
function packRows(blocks: Block[]): Block[][] {
  const rows: Block[][] = [];
  let current: Block[] = [];
  let currentWidth = 0;
  for (const block of blocks) {
    const nextWidth = currentWidth + (current.length > 0 ? GAP : 0) + block.packWidth;
    if (current.length > 0 && nextWidth > MAX_ROW_WIDTH) {
      rows.push(current);
      current = [block];
      currentWidth = block.packWidth;
    } else {
      current.push(block);
      currentWidth = nextWidth;
    }
  }
  if (current.length > 0) rows.push(current);
  return rows;
}

// Chip de cota — copia simplificada de DiagramV2 (dimension-chip.tsx):
// mismo pill blanco/borde fino/radio, mismo IBM Plex Mono para el valor.
// Sin carril ni flechas (esas SÍ dependen del layout de UNA sola figura
// con vértices reales, ver layout/dimension-lane.ts — acá hay N bloques
// independientes, así que el chip flota pegado al borde correspondiente,
// la posición ya comunica "esto mide el largo/ancho de este bloque").
function DimensionChip({ x, y, value, align }: { x: number; y: number; value: string; align: "center" | "left" }) {
  const w = estimateChipWidth(value);
  const chipX = align === "center" ? x - w / 2 : x;
  return (
    <g>
      <rect x={chipX} y={y - CHIP_H / 2} width={w} height={CHIP_H} rx={CHIP_RADIUS} fill={CHIP_BG} stroke={CHIP_BORDER} strokeWidth={1} />
      <text
        x={chipX + w / 2}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={9.5}
        fontWeight={600}
        fill={CHIP_VALUE_COLOR}
        className="font-mono"
      >
        {value}
      </text>
    </g>
  );
}

function BlockShape({
  block,
  x,
  y,
  patternId,
}: {
  block: Block;
  x: number;
  y: number;
  patternId: string;
}) {
  const isResta = block.tramo.tipo === "resta";
  const fill = isResta ? RESTA_FILL : SUMA_FILL;
  const stroke = isResta ? RESTA_STROKE : STROKE_NAVY;

  const areaText = `${formatQuantity(block.tramo.area)} m²`;
  const labelText = block.tramo.etiqueta || (isResta ? "Resta" : "Suma");
  const largoText = `${formatQuantity(block.tramo.largo)} m`;
  const anchoText = `${formatQuantity(block.tramo.ancho)} m`;
  const fontSize = 11;
  const badgeR = 9;

  return (
    <g>
      {/* Borde navy como elemento dominante (theme.stroke.solid/width) —
          el relleno queda liviano detrás, igual criterio que Rect2D. */}
      <rect x={x} y={y} width={block.width} height={block.height} fill={fill} />
      {isResta && <rect x={x} y={y} width={block.width} height={block.height} fill={`url(#${patternId})`} />}
      <rect
        x={x}
        y={y}
        width={block.width}
        height={block.height}
        fill="none"
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={isResta ? RESTA_DASHARRAY : undefined}
      />
      {/* Badge +/− en la esquina superior izquierda */}
      <circle cx={x + badgeR + 2} cy={y + badgeR + 2} r={badgeR} fill={isResta ? RESTA_STROKE : STROKE_NAVY} />
      <text
        x={x + badgeR + 2}
        y={y + badgeR + 5}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="#FFFFFF"
        className="font-display"
      >
        {isResta ? "−" : "+"}
      </text>
      {/* Etiqueta + área. Bug real encontrado en verificación mobile
          (2026-09-14, apilado con bloques bajos, ver STACK_ROW_HEIGHT): el
          texto centrado verticalmente en el bloque se superponía con el
          badge cuando el bloque es bajo (poco alto disponible). Con
          espacio vertical de sobra (bloque "alto") se sigue centrando como
          siempre; si no, el texto fluye DEBAJO del badge en vez de
          centrarse — nunca se superponen, sin importar la altura. */}
      {(() => {
        const hasRoomToCenter = block.height >= 70;
        const labelY = hasRoomToCenter ? y + block.height / 2 - 4 : y + badgeR * 2 + 14;
        const areaY = hasRoomToCenter ? y + block.height / 2 + 12 : labelY + 14;
        return (
          <>
            {approxTextWidth(labelText, fontSize) < block.width - 8 && (
              <text
                x={x + block.width / 2}
                y={labelY}
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight="700"
                fill={isResta ? RESTA_STROKE : STROKE_NAVY}
                className="font-display"
              >
                {labelText}
              </text>
            )}
            {approxTextWidth(areaText, 10) < block.width - 8 && areaY < y + block.height - 4 && (
              <text
                x={x + block.width / 2}
                y={areaY}
                textAnchor="middle"
                fontSize="10"
                fill={isResta ? RESTA_STROKE : "#3A4A63"}
                className="font-display"
              >
                {areaText}
              </text>
            )}
          </>
        );
      })()}
      {/* Cotas — "Largo abajo, ancho a la derecha", mismo criterio de
          ubicación que DiagramV2 (ver DiagramV2.tsx: "Regla explícita del
          mockup"). Solo si el bloque mide lo suficiente como para no
          superponerse con el badge/etiqueta de arriba. */}
      {block.width >= MIN_BLOCK_WIDTH && (
        <DimensionChip x={x + block.width / 2} y={y + block.height + CHIP_GAP_BELOW + CHIP_H / 2} value={largoText} align="center" />
      )}
      {block.height >= 34 && (
        <DimensionChip x={x + block.width + CHIP_GAP_RIGHT} y={y + block.height / 2} value={anchoText} align="left" />
      )}
    </g>
  );
}

export function TramosIllustration({ tramos }: TramosIllustrationProps) {
  const patternId = useId();

  if (tramos.length === 0) {
    return null;
  }

  const isStacked = tramos.length >= STACK_THRESHOLD;
  const rowHeight = isStacked ? STACK_ROW_HEIGHT : ROW_HEIGHT;

  const sumaBlocks = tramos.filter((t) => t.tipo === "suma").map((t) => buildBlock(t, rowHeight));
  const restaBlocks = tramos.filter((t) => t.tipo === "resta").map((t) => buildBlock(t, isStacked ? rowHeight : rowHeight * 0.7));

  // Extra espacio a la derecha para el chip de "ancho" y abajo para el de
  // "largo" — mismo margen para todos los bloques (el más ancho define el
  // viewBox, el resto se centra dentro de ese ancho).
  const CHIP_MARGIN_RIGHT = 46;
  const CHIP_MARGIN_BOTTOM = CHIP_GAP_BELOW + CHIP_H;

  let allRows: Block[][];
  let rowGap: number;
  if (isStacked) {
    // Apilado: una sola columna, un bloque por fila — nunca fuerza
    // overflow horizontal (cada bloque ya está acotado por MAX_RATIO), y
    // el alto total simplemente crece con la cantidad de tramos (scroll
    // vertical, no horizontal).
    allRows = [...sumaBlocks, ...restaBlocks].map((b) => [b]);
    rowGap = STACK_GAP + CHIP_MARGIN_BOTTOM;
  } else {
    const sumaRows = packRows(sumaBlocks);
    const restaRows = packRows(restaBlocks);
    allRows = [...sumaRows, ...restaRows];
    rowGap = ROW_GAP + CHIP_MARGIN_BOTTOM;
  }

  // `packWidth` (no `width`) en TODA esta cuenta — reserva el espacio del
  // chip de "ancho" que sobresale a la derecha de cada bloque, para que
  // nunca quede tapado por el bloque siguiente de la misma fila (ver
  // comentario en el tipo Block).
  const contentWidth =
    Math.max(...allRows.map((row) => row.reduce((w, b, i) => w + b.packWidth + (i > 0 ? GAP : 0), 0)), MIN_BLOCK_WIDTH) + CHIP_MARGIN_RIGHT;
  const viewBoxWidth = contentWidth + PAD * 2;

  let cursorY = PAD;
  const positioned: { block: Block; x: number; y: number }[] = [];
  for (const row of allRows) {
    const rowWidth = row.reduce((w, b, i) => w + b.packWidth + (i > 0 ? GAP : 0), 0);
    let cursorX = PAD + (contentWidth - CHIP_MARGIN_RIGHT - rowWidth) / 2;
    const thisRowHeight = Math.max(...row.map((b) => b.height));
    for (const block of row) {
      positioned.push({ block, x: cursorX, y: cursorY + (thisRowHeight - block.height) });
      cursorX += block.packWidth + GAP;
    }
    cursorY += thisRowHeight + rowGap;
  }
  const viewBoxHeight = cursorY - rowGap + PAD + CHIP_MARGIN_BOTTOM;

  return (
    <div className="rounded-2xl border border-border bg-white p-4 blueprint-bg">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
        role="img"
        aria-label="Ilustración de los tramos que forman la superficie total"
      >
        <defs>
          <pattern id={patternId} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke={RESTA_HATCH} strokeWidth="1.4" opacity={RESTA_HATCH_OPACITY} />
            <line x1="0" y1="0" x2="6" y2="0" stroke={RESTA_HATCH} strokeWidth="1.4" opacity={RESTA_HATCH_OPACITY} />
          </pattern>
        </defs>
        {positioned.map(({ block, x, y }, i) => (
          <BlockShape key={i} block={block} x={x} y={y} patternId={patternId} />
        ))}
      </svg>
      <div className="flex items-center justify-center gap-1.5 mt-2">
        <Info className="w-3 h-3 text-ink-faint flex-shrink-0" />
        <p className="text-xs text-center" style={{ color: INK_FAINT }}>
          Representación esquemática — el tamaño de cada bloque es proporcional a su área, no su posición real.
        </p>
      </div>
    </div>
  );
}
