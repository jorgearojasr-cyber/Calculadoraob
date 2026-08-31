import { Info } from "lucide-react";
import { formatQuantity } from "@/lib/format-number";

// Ilustración de EXCAVACIÓN (hoyo) — componente standalone (Fase B,
// "Construir una piscina", 2026-08-31), NO conectado al motor genérico
// DiagramV2 (mismo criterio ya aprobado para RadierIllustration: ese
// sistema queda congelado sin excepciones, este componente no importa
// nada de src/lib/diagram-v2). Aplicado GLOBALMENTE al módulo Excavación
// (rectangular y circular) — ver module-visual-config.ts, shape
// "pit-with-depth" — porque la representación "terreno + hueco" es
// semánticamente correcta tanto para su uso dentro del plan "Construir
// una piscina" como para su uso suelto en Herramientas avanzadas (no hay
// 2 variantes de comportamiento, solo 1).
//
// Recibe las medidas directo del mismo estado que alimenta los inputs del
// wizard (ver volume-step.tsx) — no duplica estado. Geometría deliberada-
// mente NO a escala real (mismo criterio que Radier): el hoyo, sus muros
// interiores y el fondo se dibujan con proporciones acotadas para que
// siempre se lean como "terreno con un hueco excavado", nunca como una
// losa ni como un bloque sólido — los NÚMEROS mostrados son siempre los
// reales, solo la geometría se ajusta para legibilidad.
export type PoolExcavationIllustrationProps =
  | {
      shape: "rectangular";
      largo: number | null;
      ancho: number | null;
      profundidad: number | null;
      largoUnit?: string;
      anchoUnit?: string;
      profundidadUnit?: string;
    }
  | {
      shape: "circular";
      diametro: number | null;
      profundidad: number | null;
      diametroUnit?: string;
      profundidadUnit?: string;
    };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Mismo truco que RadierIllustration para evitar medir el DOM: estimación
// de ancho de texto suficiente para decidir si una cota necesita achicar
// su fuente o ensanchar su cápsula.
function approxTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.62;
}

function formatValue(value: number | null, unit: string): string {
  return `${formatQuantity(value ?? 0)} ${unit}`;
}

const ANGLE_DEG = 22;
const RAD = (ANGLE_DEG * Math.PI) / 180;
const DIR_LARGO = { x: Math.cos(RAD), y: -Math.sin(RAD) };
const DIR_ANCHO = { x: -Math.cos(RAD), y: -Math.sin(RAD) };

const BASE_FOOTPRINT_AREA = 12000;
const MIN_RATIO = 1 / 3;
const MAX_RATIO = 3;
const MIN_THICKNESS = 46;
const MAX_THICKNESS = 108;
const GROUND_MARGIN = 46;

function Note() {
  return (
    <div className="flex items-center justify-center gap-1.5 mt-1">
      <Info className="w-3 h-3 text-ink-faint flex-shrink-0" />
      <p className="text-xs text-ink-faint">Ilustración referencial, fuera de escala</p>
    </div>
  );
}

const MARKERS = (
  <defs>
    <marker id="pit-arrow-navy-end" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="#002152" />
    </marker>
    <marker id="pit-arrow-navy-start" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
      <path d="M6,0 L0,3 L6,6 Z" fill="#002152" />
    </marker>
  </defs>
);

function RectangularPit({
  largo,
  ancho,
  profundidad,
  largoUnit = "m",
  anchoUnit = "m",
  profundidadUnit = "m",
}: {
  largo: number | null;
  ancho: number | null;
  profundidad: number | null;
  largoUnit?: string;
  anchoUnit?: string;
  profundidadUnit?: string;
}) {
  const ratio = clamp(largo && ancho && largo > 0 && ancho > 0 ? largo / ancho : 2, MIN_RATIO, MAX_RATIO);
  const anchoVisual = Math.sqrt(BASE_FOOTPRINT_AREA / ratio);
  const largoVisual = Math.sqrt(BASE_FOOTPRINT_AREA * ratio);
  const avgHorizontal = (largoVisual + anchoVisual) / 2;
  const depthRatio =
    profundidad && profundidad > 0 && (largo ?? 0) + (ancho ?? 0) > 0
      ? clamp(profundidad / Math.max(largo ?? 1, ancho ?? 1, 0.5), 0.18, 0.85)
      : 0.32;
  const thicknessPx = clamp(avgHorizontal * depthRatio, MIN_THICKNESS, MAX_THICKNESS);

  // P0 = esquina frontal del hueco (a nivel del terreno). El resto de los
  // vértices se derivan sumando los vectores de dirección — mismo patrón
  // que RadierIllustration.
  const P0 = { x: 190, y: 108 };
  const Pright = { x: P0.x + DIR_LARGO.x * largoVisual, y: P0.y + DIR_LARGO.y * largoVisual };
  const Pleft = { x: P0.x + DIR_ANCHO.x * anchoVisual, y: P0.y + DIR_ANCHO.y * anchoVisual };
  const Pback = { x: Pright.x + DIR_ANCHO.x * anchoVisual, y: Pright.y + DIR_ANCHO.y * anchoVisual };
  const P0b = { x: P0.x, y: P0.y + thicknessPx };
  const Prightb = { x: Pright.x, y: Pright.y + thicknessPx };
  const Pleftb = { x: Pleft.x, y: Pleft.y + thicknessPx };
  const Pbackb = { x: Pback.x, y: Pback.y + thicknessPx };

  // Terreno: mismo rombo del hueco pero agrandado y re-centrado (misma
  // base de direcciones, solo escala), para que se lea como una porción
  // de suelo con un hueco cortado adentro, no como una figura flotando.
  const center = {
    x: (P0.x + Pright.x + Pback.x + Pleft.x) / 4,
    y: (P0.y + Pright.y + Pback.y + Pleft.y) / 4,
  };
  const groundLargo = largoVisual + GROUND_MARGIN * 2;
  const groundAncho = anchoVisual + GROUND_MARGIN * 2;
  const groundP0 = {
    x: center.x - (DIR_LARGO.x * groundLargo + DIR_ANCHO.x * groundAncho) / 2,
    y: center.y - (DIR_LARGO.y * groundLargo + DIR_ANCHO.y * groundAncho) / 2,
  };
  const gPright = { x: groundP0.x + DIR_LARGO.x * groundLargo, y: groundP0.y + DIR_LARGO.y * groundLargo };
  const gPleft = { x: groundP0.x + DIR_ANCHO.x * groundAncho, y: groundP0.y + DIR_ANCHO.y * groundAncho };
  const gPback = { x: gPright.x + DIR_ANCHO.x * groundAncho, y: gPright.y + DIR_ANCHO.y * groundAncho };

  const holePts = `${P0.x},${P0.y} ${Pright.x},${Pright.y} ${Pback.x},${Pback.y} ${Pleft.x},${Pleft.y}`;
  const groundOuterPts = `${groundP0.x},${groundP0.y} ${gPright.x},${gPright.y} ${gPback.x},${gPback.y} ${gPleft.x},${gPleft.y}`;
  const rightFace = `${P0.x},${P0.y} ${Pright.x},${Pright.y} ${Prightb.x},${Prightb.y} ${P0b.x},${P0b.y}`;
  const leftFace = `${P0.x},${P0.y} ${Pleft.x},${Pleft.y} ${Pleftb.x},${Pleftb.y} ${P0b.x},${P0b.y}`;
  const floorPts = `${P0b.x},${P0b.y} ${Prightb.x},${Prightb.y} ${Pbackb.x},${Pbackb.y} ${Pleftb.x},${Pleftb.y}`;

  const largoText = formatValue(largo, largoUnit);
  let largoFontSize = 15;
  const largoLineHalfWidth = Math.max(largoVisual / 2, 34);
  const largoTextMaxWidth = largoLineHalfWidth * 2 - 16;
  if (approxTextWidth(largoText, largoFontSize) > largoTextMaxWidth) {
    largoFontSize = clamp((largoTextMaxWidth / approxTextWidth(largoText, largoFontSize)) * largoFontSize, 10, largoFontSize);
  }
  const largoCotaY = Math.max(P0b.y, Prightb.y) + 34;
  const largoCotaCx = (P0.x + Pright.x) / 2;
  const largoPillWidth = Math.max(approxTextWidth(largoText, largoFontSize) + 20, 48);

  const anchoText = formatValue(ancho, anchoUnit);
  let anchoFontSize = 13;
  if (approxTextWidth(anchoText, anchoFontSize) > 92) {
    anchoFontSize = clamp((92 / approxTextWidth(anchoText, anchoFontSize)) * anchoFontSize, 9, anchoFontSize);
  }
  const anchoLabelX = Pleft.x - 14;
  const anchoLabelY = Pleft.y - 2;

  const profText = formatValue(profundidad, profundidadUnit);
  let profFontSize = 13;
  const profMaxTextWidth = 78;
  if (approxTextWidth(profText, profFontSize) > profMaxTextWidth) {
    profFontSize = clamp((profMaxTextWidth / approxTextWidth(profText, profFontSize)) * profFontSize, 9, profFontSize);
  }
  const profLabelWidth = Math.max(approxTextWidth("PROFUNDIDAD", 9), approxTextWidth(profText, profFontSize)) + 20;
  const profPillX = 372 - profLabelWidth;
  const profPillY = 26;
  const profPillHeight = 40;
  const profAnchorX = Pright.x + (Pback.x - Pright.x) * 0.35;
  const profAnchorY = Pright.y + (Pback.y - Pright.y) * 0.35;

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" className="w-full h-auto" role="img" aria-label="Ilustración de la excavación con sus medidas">
      <defs>
        <pattern id="pit-terrain-texture" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="1.3" cy="1.3" r="0.8" fill="#8C7C57" opacity="0.45" />
        </pattern>
      </defs>

      {/* Fondo del hueco (visible al fondo, primero para que el terreno lo enmarque) */}
      <polygon points={floorPts} fill="#B79F72" stroke="#9C8760" strokeWidth="1" />
      {/* Paredes interiores del hueco */}
      <polygon points={leftFace} fill="#8B7355" />
      <polygon points={rightFace} fill="#6E5A3E" />
      {/* Terreno (dona: footprint grande menos el hueco) */}
      <path d={`M${groundOuterPts.split(" ").join("L")}Z M${holePts.split(" ").join("L")}Z`} fill="#CBBF9C" fillRule="evenodd" stroke="#AFA07A" strokeWidth="1" />
      <path d={`M${groundOuterPts.split(" ").join("L")}Z M${holePts.split(" ").join("L")}Z`} fill="url(#pit-terrain-texture)" fillRule="evenodd" />
      {/* Borde superior del hueco */}
      <polygon points={holePts} fill="none" stroke="#5E5850" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />

      <g stroke="#002152" strokeWidth="1.5" fill="none">
        <line x1={P0.x - 4} y1={P0.y + 4} x2={Pleft.x + 4} y2={Pleft.y - 4} markerStart="url(#pit-arrow-navy-start)" markerEnd="url(#pit-arrow-navy-end)" />
      </g>
      <text x={anchoLabelX} y={anchoLabelY - 14} textAnchor="end" fontSize="9.5" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
        ANCHO
      </text>
      <text x={anchoLabelX} y={anchoLabelY} textAnchor="end" fontSize={anchoFontSize} fontWeight="700" fill="#002152" className="font-display">
        {anchoText}
      </text>

      <line
        x1={largoCotaCx - largoLineHalfWidth}
        y1={largoCotaY}
        x2={largoCotaCx + largoLineHalfWidth}
        y2={largoCotaY}
        stroke="#002152"
        strokeWidth="1.5"
        markerStart="url(#pit-arrow-navy-start)"
        markerEnd="url(#pit-arrow-navy-end)"
      />
      <rect x={largoCotaCx - largoPillWidth / 2} y={largoCotaY - 11} width={largoPillWidth} height="22" rx="11" fill="#F9F9F9" />
      <text x={largoCotaCx} y={largoCotaY - 5} textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
        LARGO
      </text>
      <text x={largoCotaCx} y={largoCotaY + 8} textAnchor="middle" fontSize={largoFontSize} fontWeight="700" fill="#002152" className="font-display">
        {largoText}
      </text>

      <line x1={profAnchorX} y1={profAnchorY} x2={profPillX + profLabelWidth / 2} y2={profPillY + profPillHeight} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.6" />
      <line
        x1={profAnchorX}
        y1={profAnchorY - thicknessPx * 0.5}
        x2={profAnchorX}
        y2={profAnchorY + thicknessPx * 0.5}
        stroke="#FF4E00"
        strokeWidth="1.5"
        markerStart="url(#pit-arrow-action-start)"
        markerEnd="url(#pit-arrow-action-end)"
      />
      <rect x={profPillX} y={profPillY} width={profLabelWidth} height={profPillHeight} rx={profPillHeight / 2} fill="#FFE4D6" />
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 16} textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="0.05em" fill="#E04500" className="font-display">
        PROFUNDIDAD
      </text>
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 32} textAnchor="middle" fontSize={profFontSize} fontWeight="700" fill="#E04500" className="font-display">
        {profText}
      </text>

      {MARKERS}
      <defs>
        <marker id="pit-arrow-action-end" markerWidth="6" markerHeight="6" refX="3" refY="5" orient="auto">
          <path d="M0,0 L6,0 L3,6 Z" fill="#FF4E00" />
        </marker>
        <marker id="pit-arrow-action-start" markerWidth="6" markerHeight="6" refX="3" refY="1" orient="auto">
          <path d="M0,6 L6,6 L3,0 Z" fill="#FF4E00" />
        </marker>
      </defs>
    </svg>
  );
}

function CircularPit({
  diametro,
  profundidad,
  diametroUnit = "m",
  profundidadUnit = "m",
}: {
  diametro: number | null;
  profundidad: number | null;
  diametroUnit?: string;
  profundidadUnit?: string;
}) {
  const cx = 200;
  const cy = 96;
  const rx = 108;
  const ry = 42;
  const depthRatio = profundidad && diametro && diametro > 0 ? clamp(profundidad / diametro, 0.15, 0.85) : 0.35;
  const thicknessPx = clamp(rx * 1.1 * depthRatio, 44, 118);
  const floorRx = rx * 0.8;
  const floorRy = ry * 0.8;
  const floorCy = cy + thicknessPx;

  const diametroText = formatValue(diametro, diametroUnit);
  const diametroFontSize = 14;
  const diametroPillWidth = Math.max(approxTextWidth(diametroText, diametroFontSize) + 20, 60);

  const profText = formatValue(profundidad, profundidadUnit);
  let profFontSize = 13;
  if (approxTextWidth(profText, profFontSize) > 78) {
    profFontSize = clamp((78 / approxTextWidth(profText, profFontSize)) * profFontSize, 9, profFontSize);
  }
  const profLabelWidth = Math.max(approxTextWidth("PROFUNDIDAD", 9), approxTextWidth(profText, profFontSize)) + 20;
  const profPillX = 372 - profLabelWidth;
  const profPillY = 26;
  const profPillHeight = 40;

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" className="w-full h-auto" role="img" aria-label="Ilustración de la excavación circular con sus medidas">
      <defs>
        <pattern id="pit-terrain-texture-c" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="1.3" cy="1.3" r="0.8" fill="#8C7C57" opacity="0.45" />
        </pattern>
        <mask id="pit-ground-mask">
          <rect x="0" y="0" width="400" height="260" fill="white" />
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="black" />
        </mask>
      </defs>

      {/* Fondo del hueco */}
      <ellipse cx={cx} cy={floorCy} rx={floorRx} ry={floorRy} fill="#B79F72" stroke="#9C8760" strokeWidth="1" />
      {/* Pared interior visible (arco frontal, entre el borde y el fondo) */}
      <path
        d={`M${cx - rx},${cy} A${rx},${ry} 0 0,1 ${cx + rx},${cy} L${cx + floorRx},${floorCy} A${floorRx},${floorRy} 0 0,0 ${cx - floorRx},${floorCy} Z`}
        fill="#7A6446"
      />
      {/* Terreno alrededor, con el hueco cortado */}
      <rect x={cx - rx - 60} y={cy - ry - 34} width={(rx + 60) * 2} height={ry + thicknessPx + 90} rx="18" fill="#CBBF9C" mask="url(#pit-ground-mask)" />
      <rect x={cx - rx - 60} y={cy - ry - 34} width={(rx + 60) * 2} height={ry + thicknessPx + 90} rx="18" fill="url(#pit-terrain-texture-c)" mask="url(#pit-ground-mask)" />
      {/* Borde superior del hueco */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#5E5850" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />

      <rect x={cx - diametroPillWidth / 2} y={cy - ry - 30} width={diametroPillWidth} height="22" rx="11" fill="#F9F9F9" />
      <text x={cx} y={cy - ry - 24} textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
        DIÁMETRO
      </text>
      <text x={cx} y={cy - ry - 11} textAnchor="middle" fontSize={diametroFontSize} fontWeight="700" fill="#002152" className="font-display">
        {diametroText}
      </text>
      <line
        x1={cx - rx}
        y1={cy}
        x2={cx + rx}
        y2={cy}
        stroke="#002152"
        strokeWidth="1.25"
        strokeDasharray="3 3"
        opacity="0.55"
        markerStart="url(#pit-arrow-navy-start)"
        markerEnd="url(#pit-arrow-navy-end)"
      />

      <line x1={cx + rx * 0.55} y1={cy + ry * 0.4} x2={profPillX + profLabelWidth / 2} y2={profPillY + profPillHeight} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.6" />
      <line
        x1={cx + rx * 0.55}
        y1={cy + ry * 0.4}
        x2={cx + rx * 0.55 * (floorRx / rx)}
        y2={floorCy + floorRy * 0.4}
        stroke="#FF4E00"
        strokeWidth="1.5"
        markerStart="url(#pit-arrow-action-start)"
        markerEnd="url(#pit-arrow-action-end)"
      />
      <rect x={profPillX} y={profPillY} width={profLabelWidth} height={profPillHeight} rx={profPillHeight / 2} fill="#FFE4D6" />
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 16} textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="0.05em" fill="#E04500" className="font-display">
        PROFUNDIDAD
      </text>
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 32} textAnchor="middle" fontSize={profFontSize} fontWeight="700" fill="#E04500" className="font-display">
        {profText}
      </text>

      {MARKERS}
      <defs>
        <marker id="pit-arrow-action-end" markerWidth="6" markerHeight="6" refX="3" refY="5" orient="auto">
          <path d="M0,0 L6,0 L3,6 Z" fill="#FF4E00" />
        </marker>
        <marker id="pit-arrow-action-start" markerWidth="6" markerHeight="6" refX="3" refY="1" orient="auto">
          <path d="M0,6 L6,6 L3,0 Z" fill="#FF4E00" />
        </marker>
      </defs>
    </svg>
  );
}

export function PoolExcavationIllustration(props: PoolExcavationIllustrationProps) {
  return (
    <div>
      {props.shape === "rectangular" ? (
        <RectangularPit largo={props.largo} ancho={props.ancho} profundidad={props.profundidad} largoUnit={props.largoUnit} anchoUnit={props.anchoUnit} profundidadUnit={props.profundidadUnit} />
      ) : (
        <CircularPit diametro={props.diametro} profundidad={props.profundidad} diametroUnit={props.diametroUnit} profundidadUnit={props.profundidadUnit} />
      )}
      <Note />
    </div>
  );
}
