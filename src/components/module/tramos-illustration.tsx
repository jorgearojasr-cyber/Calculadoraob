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
// que el layout es ilustrativo — bloques en fila, alto fijo por fila,
// ancho proporcional a su propio largo:ancho real (acotado a un rango
// legible) — nunca un plano a escala real. La paleta y el tramado de
// "resta" son copia literal de pintura-illustration.tsx (mismo lenguaje
// visual ya aprobado, "trama naranja a dos direcciones + trazo punteado"),
// no una referencia — cambiar el tema congelado no afecta a este archivo.
export type TramosIllustrationProps = {
  tramos: TramoRecord[];
};

const SUMA_FILL = "#F1F5FB";
const SUMA_STROKE = "#0B2A52";
const SUMA_STROKE_WIDTH = 1.6;
const RESTA_FILL = "#FFFFFF";
const RESTA_HATCH = "#FF4E00";
const RESTA_HATCH_OPACITY = 0.42;
const RESTA_STROKE = "#FF4E00";
const RESTA_STROKE_WIDTH = 1.6;
const RESTA_DASHARRAY = "4 2";
const NAVY = "#002152";
const INK_FAINT = "#8A8378";

const ROW_HEIGHT = 84;
const MIN_RATIO = 1 / 3;
const MAX_RATIO = 3;
const MIN_BLOCK_WIDTH = 46;
const GAP = 14;
const ROW_GAP = 34;
const MAX_ROW_WIDTH = 480;
const PAD = 16;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function approxTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.58;
}

type Block = {
  tramo: TramoRecord;
  width: number;
  height: number;
};

function buildBlock(tramo: TramoRecord, rowHeight: number): Block {
  const ratio = clamp(tramo.ancho > 0 ? tramo.largo / tramo.ancho : 1, MIN_RATIO, MAX_RATIO);
  const width = Math.max(rowHeight * ratio, MIN_BLOCK_WIDTH);
  return { tramo, width, height: rowHeight };
}

// Empaqueta bloques en filas que no excedan MAX_ROW_WIDTH — mismo criterio
// visual que un flex-wrap, hecho a mano porque SVG no lo tiene nativo.
function packRows(blocks: Block[]): Block[][] {
  const rows: Block[][] = [];
  let current: Block[] = [];
  let currentWidth = 0;
  for (const block of blocks) {
    const nextWidth = currentWidth + (current.length > 0 ? GAP : 0) + block.width;
    if (current.length > 0 && nextWidth > MAX_ROW_WIDTH) {
      rows.push(current);
      current = [block];
      currentWidth = block.width;
    } else {
      current.push(block);
      currentWidth = nextWidth;
    }
  }
  if (current.length > 0) rows.push(current);
  return rows;
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
  const stroke = isResta ? RESTA_STROKE : SUMA_STROKE;
  const strokeWidth = isResta ? RESTA_STROKE_WIDTH : SUMA_STROKE_WIDTH;

  const areaText = `${formatQuantity(block.tramo.area)} m²`;
  const labelText = block.tramo.etiqueta || (isResta ? "Resta" : "Suma");
  const fontSize = 11;
  const badgeR = 9;

  return (
    <g>
      <rect x={x} y={y} width={block.width} height={block.height} fill={fill} />
      {isResta && <rect x={x} y={y} width={block.width} height={block.height} fill={`url(#${patternId})`} />}
      <rect
        x={x}
        y={y}
        width={block.width}
        height={block.height}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={isResta ? RESTA_DASHARRAY : undefined}
      />
      {/* Badge +/− en la esquina superior izquierda */}
      <circle cx={x + badgeR + 2} cy={y + badgeR + 2} r={badgeR} fill={isResta ? RESTA_STROKE : NAVY} />
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
      {/* Etiqueta + área, centradas dentro del bloque cuando entra, si no
          truncada — mismo criterio de legibilidad que RadierIllustration
          (nunca desborda el bloque). */}
      {approxTextWidth(labelText, fontSize) < block.width - 8 && (
        <text
          x={x + block.width / 2}
          y={y + block.height / 2 - 4}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="700"
          fill={isResta ? RESTA_STROKE : NAVY}
          className="font-display"
        >
          {labelText}
        </text>
      )}
      {approxTextWidth(areaText, 10) < block.width - 8 && (
        <text
          x={x + block.width / 2}
          y={y + block.height / 2 + 12}
          textAnchor="middle"
          fontSize="10"
          fill={isResta ? RESTA_STROKE : "#3A4A63"}
          className="font-display"
        >
          {areaText}
        </text>
      )}
    </g>
  );
}

export function TramosIllustration({ tramos }: TramosIllustrationProps) {
  const patternId = useId();

  if (tramos.length === 0) {
    return null;
  }

  const sumaBlocks = tramos.filter((t) => t.tipo === "suma").map((t) => buildBlock(t, ROW_HEIGHT));
  const restaBlocks = tramos.filter((t) => t.tipo === "resta").map((t) => buildBlock(t, ROW_HEIGHT * 0.7));

  const sumaRows = packRows(sumaBlocks);
  const restaRows = packRows(restaBlocks);

  const allRows = [...sumaRows, ...restaRows];
  const contentWidth = Math.max(...allRows.map((row) => row.reduce((w, b, i) => w + b.width + (i > 0 ? GAP : 0), 0)), MIN_BLOCK_WIDTH);
  const viewBoxWidth = contentWidth + PAD * 2;

  let cursorY = PAD;
  const positioned: { block: Block; x: number; y: number }[] = [];
  for (const row of allRows) {
    const rowWidth = row.reduce((w, b, i) => w + b.width + (i > 0 ? GAP : 0), 0);
    let cursorX = PAD + (contentWidth - rowWidth) / 2;
    const rowHeight = Math.max(...row.map((b) => b.height));
    for (const block of row) {
      positioned.push({ block, x: cursorX, y: cursorY + (rowHeight - block.height) });
      cursorX += block.width + GAP;
    }
    cursorY += rowHeight + ROW_GAP;
  }
  const viewBoxHeight = cursorY - ROW_GAP + PAD;

  return (
    <div>
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
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <Info className="w-3 h-3 text-ink-faint flex-shrink-0" />
        <p className="text-xs text-center" style={{ color: INK_FAINT }}>
          Representación esquemática — el tamaño de cada bloque es proporcional a su área, no su posición real.
        </p>
      </div>
    </div>
  );
}
