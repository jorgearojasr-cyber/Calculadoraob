import { useId } from "react";
import { Info } from "lucide-react";
import { formatQuantity } from "@/lib/format-number";

// Ilustración de Pintura — componente standalone ("Calculadora de PINTURA
// rediseñada", 2026-08-30, aprobado por Jorge), NO conectado al motor
// genérico DiagramV2 (mismo criterio que radier-illustration.tsx: el
// sistema DiagramV2/shape-2d/theme/scale-engine/solids queda congelado sin
// excepciones — este archivo no importa nada de src/lib/diagram-v2).
//
// El tratamiento visual de los vanos (blanco + trama naranja a dos
// direcciones + trazo punteado) reproduce a propósito el mismo lenguaje
// que ya usa VoidRect (src/lib/diagram-v2/render/shape-2d.tsx) — Jorge
// confirmó que ese tramado ya está aprobado y pidió reutilizar esa lógica
// de render en vez de inventar una nueva, siempre que el componente final
// no importe nada de diagram-v2. Los valores de color/trazo de abajo son
// una copia literal de theme.ts (voidShape), no una referencia — cambiar
// el tema congelado no afecta a este archivo, y viceversa.
export type PinturaIllustrationProps = {
  largo: number | null;
  alto: number | null;
  vanos: { ancho: number; alto: number }[];
  largoUnit?: string;
  altoUnit?: string;
};

const WALL_FILL = "#F1F5FB";
const WALL_STROKE = "#0B2A52";
const WALL_STROKE_WIDTH = 1.8;
const VOID_FILL = "#FFFFFF";
const VOID_HATCH = "#FF4E00";
const VOID_HATCH_OPACITY = 0.42;
const VOID_STROKE = "#FF4E00";
const VOID_STROKE_WIDTH = 1.8;
const VOID_DASHARRAY = "4 2";
const NAVY = "#002152";

const MIN_RATIO = 1 / 4;
const MAX_RATIO = 4;
const BASE_FOOTPRINT_AREA = 15000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function approxTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.62;
}

function formatValue(value: number | null, unit: string): string {
  return `${formatQuantity(value ?? 0)} ${unit}`;
}

function VoidRect({ x, y, width, height, patternId }: { x: number; y: number; width: number; height: number; patternId: string }) {
  return (
    <>
      <rect x={x} y={y} width={width} height={height} fill={VOID_FILL} />
      <rect x={x} y={y} width={width} height={height} fill={`url(#${patternId})`} />
      <rect x={x} y={y} width={width} height={height} fill="none" stroke={VOID_STROKE} strokeWidth={VOID_STROKE_WIDTH} strokeDasharray={VOID_DASHARRAY} />
    </>
  );
}

export function PinturaIllustration({ largo, alto, vanos, largoUnit = "m", altoUnit = "m" }: PinturaIllustrationProps) {
  const patternId = useId();

  const ratio = clamp(largo && alto && largo > 0 && alto > 0 ? largo / alto : 1.8, MIN_RATIO, MAX_RATIO);
  const wallW = Math.sqrt(BASE_FOOTPRINT_AREA * ratio);
  const wallH = Math.sqrt(BASE_FOOTPRINT_AREA / ratio);

  const originX = 40;
  const originY = 40;
  const wallRight = originX + wallW;
  const wallBottom = originY + wallH;

  // Vanos: mismo algoritmo que DiagramV2 (proporcionales a su tamaño real,
  // apoyados en la base del muro, centrados como grupo) — reimplementado
  // acá de forma independiente, sin importar diagram-v2.
  const L = largo ?? 0;
  const A = alto ?? 0;
  const voidElements: { x: number; y: number; w: number; h: number }[] = [];
  const validVanos = vanos.filter((v) => v.ancho > 0 && v.alto > 0);
  if (validVanos.length > 0 && L > 0 && A > 0) {
    const pxPerL = wallW / L;
    const pxPerA = wallH / A;
    const marginPx = wallW * 0.06;
    const gapPx = wallW * 0.03;
    const widthsPx = validVanos.map((v) => Math.min(v.ancho * pxPerL, wallW - 2 * marginPx));
    const totalWidthPx = widthsPx.reduce((sum, vw) => sum + vw, 0) + gapPx * (validVanos.length - 1);
    let cursorX = originX + (wallW - totalWidthPx) / 2;
    validVanos.forEach((v, i) => {
      const vw = widthsPx[i];
      const vh = Math.min(v.alto * pxPerA, wallH - marginPx);
      voidElements.push({ x: cursorX, y: wallBottom - vh, w: vw, h: vh });
      cursorX += vw + gapPx;
    });
  }

  // --- Cota LARGO: horizontal, debajo del muro ---
  const largoText = formatValue(largo, largoUnit);
  let largoFontSize = 14;
  const largoLineHalfWidth = Math.max(wallW / 2, 34);
  const largoTextMaxWidth = largoLineHalfWidth * 2 - 16;
  if (approxTextWidth(largoText, largoFontSize) > largoTextMaxWidth) {
    largoFontSize = clamp((largoTextMaxWidth / approxTextWidth(largoText, largoFontSize)) * largoFontSize, 10, largoFontSize);
  }
  const largoCotaY = wallBottom + 30;
  const largoCotaCx = originX + wallW / 2;
  const largoPillWidth = Math.max(approxTextWidth(largoText, largoFontSize) + 44, 60);

  // --- Cota ALTO: vertical, a la derecha del muro ---
  const altoText = formatValue(alto, altoUnit);
  let altoFontSize = 13;
  const altoMaxTextWidth = 60;
  if (approxTextWidth(altoText, altoFontSize) > altoMaxTextWidth) {
    altoFontSize = clamp((altoMaxTextWidth / approxTextWidth(altoText, altoFontSize)) * altoFontSize, 9, altoFontSize);
  }
  const altoCotaX = wallRight + 26;
  const altoCotaCy = originY + wallH / 2;
  const altoPillHeight = 34;
  const altoPillWidth = Math.max(approxTextWidth(altoText, altoFontSize) + 16, approxTextWidth("Alto", 9.5) + 16, 44);

  const viewBoxWidth = altoCotaX + altoPillWidth / 2 + 14;
  const viewBoxHeight = largoCotaY + 16;

  return (
    <div>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
        role="img"
        aria-label="Ilustración del muro a pintar con sus medidas"
      >
        <defs>
          <pattern id={patternId} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke={VOID_HATCH} strokeWidth="1.6" opacity={VOID_HATCH_OPACITY} />
            <line x1="0" y1="0" x2="6" y2="0" stroke={VOID_HATCH} strokeWidth="1.6" opacity={VOID_HATCH_OPACITY} />
          </pattern>
          <marker id="pintura-arrow-navy-end" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={NAVY} />
          </marker>
          <marker id="pintura-arrow-navy-start" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
            <path d="M6,0 L0,3 L6,6 Z" fill={NAVY} />
          </marker>
        </defs>

        {/* Muro */}
        <rect x={originX} y={originY} width={wallW} height={wallH} fill={WALL_FILL} stroke={WALL_STROKE} strokeWidth={WALL_STROKE_WIDTH} strokeLinejoin="round" />

        {/* Vanos */}
        {voidElements.map((v, i) => (
          <VoidRect key={i} x={v.x} y={v.y} width={v.w} height={v.h} patternId={patternId} />
        ))}

        {/* Cota LARGO */}
        <line
          x1={largoCotaCx - largoLineHalfWidth}
          y1={largoCotaY}
          x2={largoCotaCx + largoLineHalfWidth}
          y2={largoCotaY}
          stroke={NAVY}
          strokeWidth="1.5"
          markerStart="url(#pintura-arrow-navy-start)"
          markerEnd="url(#pintura-arrow-navy-end)"
        />
        <rect x={largoCotaCx - largoPillWidth / 2} y={largoCotaY - 12} width={largoPillWidth} height="24" rx="12" fill="#FFFFFF" stroke="#E4DED4" strokeWidth="1" />
        <text x={largoCotaCx} y={largoCotaY - 14} textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="0.04em" fill="#5E5850" className="font-display">
          LARGO
        </text>
        <text x={largoCotaCx} y={largoCotaY + 5} textAnchor="middle" fontSize={largoFontSize} fontWeight="700" fill={NAVY} className="font-display">
          {largoText}
        </text>

        {/* Cota ALTO */}
        <line
          x1={altoCotaX}
          y1={originY + 2}
          x2={altoCotaX}
          y2={wallBottom - 2}
          stroke={NAVY}
          strokeWidth="1.5"
          markerStart="url(#pintura-arrow-navy-start)"
          markerEnd="url(#pintura-arrow-navy-end)"
        />
        <rect x={altoCotaX - altoPillWidth / 2} y={altoCotaCy - altoPillHeight / 2} width={altoPillWidth} height={altoPillHeight} rx="10" fill="#FFFFFF" stroke="#E4DED4" strokeWidth="1" />
        <text x={altoCotaX} y={altoCotaCy - 4} textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="0.04em" fill="#5E5850" className="font-display">
          ALTO
        </text>
        <text x={altoCotaX} y={altoCotaCy + 11} textAnchor="middle" fontSize={altoFontSize} fontWeight="700" fill={NAVY} className="font-display">
          {altoText}
        </text>
      </svg>
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <Info className="w-3 h-3 text-ink-faint flex-shrink-0" />
        <p className="text-xs text-ink-faint text-center">Ubicación de vanos ilustrativa · áreas tramadas no se pintan</p>
      </div>
    </div>
  );
}
