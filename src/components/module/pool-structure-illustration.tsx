import { Info } from "lucide-react";
import { formatQuantity } from "@/lib/format-number";

// Ilustración del VASO ESTRUCTURAL de la piscina (Paso 2, espesores) —
// componente standalone (Fase B, "Construir una piscina", 2026-08-31), NO
// conectado a DiagramV2 (mismo criterio ya aprobado para
// RadierIllustration/PoolExcavationIllustration). Vive fuera de ese
// sistema a propósito.
//
// Recibe largo/ancho/diámetro/profundidad (ya respondidos en el Paso 1) y
// los espesores de muro/fondo (este mismo paso) directo del estado del
// wizard — no duplica preguntas ni estado. 20cm NO es un default activo
// (ver Fase A): cuando un espesor todavía no fue tipeado, se muestra sin
// cantidad ("Sin definir") con un grosor visual mínimo, nunca una cifra
// inventada — 0 (valor realmente tipeado) sí se muestra como "0 cm".
export type PoolStructureIllustrationProps =
  | {
      shape: "rectangular";
      largo: number | null;
      ancho: number | null;
      profundidad: number | null;
      espesorMuroCm: number | null;
      espesorFondoCm: number | null;
      largoUnit?: string;
      anchoUnit?: string;
      profundidadUnit?: string;
    }
  | {
      shape: "circular";
      diametro: number | null;
      profundidad: number | null;
      espesorMuroCm: number | null;
      espesorFondoCm: number | null;
      diametroUnit?: string;
      profundidadUnit?: string;
    };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function approxTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.62;
}

function formatValue(value: number | null, unit: string): string {
  return `${formatQuantity(value ?? 0)} ${unit}`;
}

// Espesor: null (campo vacío) se muestra SIN cantidad ("Sin definir"),
// nunca con una cifra inventada (20cm sigue sin default activo, Fase A).
// 0 es un valor real que el usuario tipeó — se muestra literal ("0 cm").
function formatEspesor(value: number | null): { text: string; hasValue: boolean } {
  if (value === null) return { text: "Sin definir", hasValue: false };
  return { text: `${formatQuantity(value)} cm`, hasValue: true };
}

const ANGLE_DEG = 22;
const RAD = (ANGLE_DEG * Math.PI) / 180;
const DIR_LARGO = { x: Math.cos(RAD), y: -Math.sin(RAD) };
const DIR_ANCHO = { x: -Math.cos(RAD), y: -Math.sin(RAD) };

const BASE_FOOTPRINT_AREA = 11200;
const MIN_RATIO = 1 / 3;
const MAX_RATIO = 3;
const MIN_WALL_PX = 10;
const MAX_WALL_PX = 30;
const MIN_DEPTH_PX = 50;
const MAX_DEPTH_PX = 100;
const MIN_FLOOR_PX = 8;
const MAX_FLOOR_PX = 22;

function Note() {
  return (
    <div className="flex items-center justify-center gap-1.5 mt-1">
      <Info className="w-3 h-3 text-ink-faint flex-shrink-0" />
      <p className="text-xs text-ink-faint">Ilustración referencial, fuera de escala</p>
    </div>
  );
}

const ORANGE_MARKERS = (
  <defs>
    <marker id="pool-arrow-action-end" markerWidth="6" markerHeight="6" refX="3" refY="5" orient="auto">
      <path d="M0,0 L6,0 L3,6 Z" fill="#FF4E00" />
    </marker>
    <marker id="pool-arrow-action-start" markerWidth="6" markerHeight="6" refX="3" refY="1" orient="auto">
      <path d="M0,6 L6,6 L3,0 Z" fill="#FF4E00" />
    </marker>
    <marker id="pool-arrow-navy-end" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="#002152" />
    </marker>
    <marker id="pool-arrow-navy-start" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
      <path d="M6,0 L0,3 L6,6 Z" fill="#002152" />
    </marker>
  </defs>
);

function RectangularStructure({
  largo,
  ancho,
  profundidad,
  espesorMuroCm,
  espesorFondoCm,
  largoUnit = "m",
  anchoUnit = "m",
  profundidadUnit = "m",
}: {
  largo: number | null;
  ancho: number | null;
  profundidad: number | null;
  espesorMuroCm: number | null;
  espesorFondoCm: number | null;
  largoUnit?: string;
  anchoUnit?: string;
  profundidadUnit?: string;
}) {
  const ratio = clamp(largo && ancho && largo > 0 && ancho > 0 ? largo / ancho : 2, MIN_RATIO, MAX_RATIO);
  const anchoVisual = Math.sqrt(BASE_FOOTPRINT_AREA / ratio);
  const largoVisual = Math.sqrt(BASE_FOOTPRINT_AREA * ratio);
  const avgHorizontal = (largoVisual + anchoVisual) / 2;

  const muro = formatEspesor(espesorMuroCm);
  const fondo = formatEspesor(espesorFondoCm);
  // Grosor VISUAL del muro: proporcional al valor real cuando existe (más
  // cm tipeados -> anillo más ancho), acotado para seguir siendo legible;
  // sin valor, usa un grosor mínimo fijo (nunca 0, para que el anillo siga
  // siendo visible como concepto).
  const wallPx = muro.hasValue ? clamp(avgHorizontal * 0.035 + (espesorMuroCm ?? 0) * 0.6, MIN_WALL_PX, MAX_WALL_PX) : MIN_WALL_PX;
  const floorPx = fondo.hasValue ? clamp((espesorFondoCm ?? 0) * 0.5, MIN_FLOOR_PX, MAX_FLOOR_PX) : MIN_FLOOR_PX;

  const depthRatio = profundidad && profundidad > 0 ? clamp(profundidad / Math.max(largo ?? 1, ancho ?? 1, 0.5), 0.18, 0.85) : 0.32;
  const depthPx = clamp(avgHorizontal * depthRatio, MIN_DEPTH_PX, MAX_DEPTH_PX);

  // Rombo INTERIOR (espejo de agua) — igual patrón que RadierIllustration.
  const P0 = { x: 190, y: 108 };
  const Pright = { x: P0.x + DIR_LARGO.x * largoVisual, y: P0.y + DIR_LARGO.y * largoVisual };
  const Pleft = { x: P0.x + DIR_ANCHO.x * anchoVisual, y: P0.y + DIR_ANCHO.y * anchoVisual };
  const Pback = { x: Pright.x + DIR_ANCHO.x * anchoVisual, y: Pright.y + DIR_ANCHO.y * anchoVisual };
  // Rombo EXTERIOR (cara externa del muro) — mismo centro, agrandado por
  // el espesor de muro en cada dirección.
  const center = { x: (P0.x + Pright.x + Pback.x + Pleft.x) / 4, y: (P0.y + Pright.y + Pback.y + Pleft.y) / 4 };
  const outerLargo = largoVisual + wallPx * 2;
  const outerAncho = anchoVisual + wallPx * 2;
  const outerP0 = {
    x: center.x - (DIR_LARGO.x * outerLargo + DIR_ANCHO.x * outerAncho) / 2,
    y: center.y - (DIR_LARGO.y * outerLargo + DIR_ANCHO.y * outerAncho) / 2,
  };
  const oPright = { x: outerP0.x + DIR_LARGO.x * outerLargo, y: outerP0.y + DIR_LARGO.y * outerLargo };
  const oPleft = { x: outerP0.x + DIR_ANCHO.x * outerAncho, y: outerP0.y + DIR_ANCHO.y * outerAncho };
  const oPback = { x: oPright.x + DIR_ANCHO.x * outerAncho, y: oPright.y + DIR_ANCHO.y * outerAncho };
  const oP0b = { x: outerP0.x, y: outerP0.y + depthPx + floorPx };
  const oPrightb = { x: oPright.x, y: oPright.y + depthPx + floorPx };
  const oPleftb = { x: oPleft.x, y: oPleft.y + depthPx + floorPx };
  const oPbackb = { x: oPback.x, y: oPback.y + depthPx + floorPx };

  const waterTopPts = `${P0.x},${P0.y} ${Pright.x},${Pright.y} ${Pback.x},${Pback.y} ${Pleft.x},${Pleft.y}`;
  const outerTopPts = `${outerP0.x},${outerP0.y} ${oPright.x},${oPright.y} ${oPback.x},${oPback.y} ${oPleft.x},${oPleft.y}`;
  const outerRightFace = `${outerP0.x},${outerP0.y} ${oPright.x},${oPright.y} ${oPrightb.x},${oPrightb.y} ${oP0b.x},${oP0b.y}`;
  const outerLeftFace = `${outerP0.x},${outerP0.y} ${oPleft.x},${oPleft.y} ${oPleftb.x},${oPleftb.y} ${oP0b.x},${oP0b.y}`;
  const floorBottomPts = `${oP0b.x},${oP0b.y} ${oPrightb.x},${oPrightb.y} ${oPbackb.x},${oPbackb.y} ${oPleftb.x},${oPleftb.y}`;

  const largoText = formatValue(largo, largoUnit);
  let largoFontSize = 14;
  const largoLineHalfWidth = Math.max(largoVisual / 2, 34);
  const largoTextMaxWidth = largoLineHalfWidth * 2 - 16;
  if (approxTextWidth(largoText, largoFontSize) > largoTextMaxWidth) {
    largoFontSize = clamp((largoTextMaxWidth / approxTextWidth(largoText, largoFontSize)) * largoFontSize, 10, largoFontSize);
  }
  const largoCotaY = Math.max(oP0b.y, oPrightb.y) + 30;
  const largoCotaCx = (P0.x + Pright.x) / 2;
  const largoPillWidth = Math.max(approxTextWidth(largoText, largoFontSize) + 18, 46);

  const anchoText = formatValue(ancho, anchoUnit);
  let anchoFontSize = 12;
  if (approxTextWidth(anchoText, anchoFontSize) > 84) {
    anchoFontSize = clamp((84 / approxTextWidth(anchoText, anchoFontSize)) * anchoFontSize, 9, anchoFontSize);
  }
  const anchoLabelX = oPleft.x - 12;
  const anchoLabelY = oPleft.y - 2;

  const profText = formatValue(profundidad, profundidadUnit);
  const profFontSize = 11;
  const profLabelWidth = Math.max(approxTextWidth("PROF.", 8.5), approxTextWidth(profText, profFontSize)) + 16;
  const profPillX = 372 - profLabelWidth;
  const profPillY = 24;
  const profPillHeight = 36;
  const profAnchorX = Pright.x + (Pback.x - Pright.x) * 0.3;
  const profAnchorY = Pright.y + (Pback.y - Pright.y) * 0.3;

  // Muro/Fondo: cápsulas naranjas ancladas en las 2 esquinas INFERIORES del
  // lienzo (izquierda/derecha), apuntando con una línea punteada al anillo
  // (muro) / franja de losa (fondo) real — posición fija en vez de
  // derivada de la geometría: ANCHO ya ocupa la esquina superior-izquierda,
  // PROFUNDIDAD la superior-derecha y LARGO el centro-inferior, así que
  // anclar Muro/Fondo dinámicamente cerca del anillo (como se probó
  // primero) termina superponiéndose con esas 3 cotas en proporciones
  // largo/ancho/profundidad reales (detectado en verificación visual,
  // Fase B) — las 2 esquinas inferiores son el único espacio que queda
  // libre en cualquier proporción razonable.
  const muroAnchor = { x: (Pleft.x + oPleft.x) / 2, y: (Pleft.y + oPleft.y) / 2 };
  const muroPillWidth = Math.max(approxTextWidth("MURO", 8.5), approxTextWidth(muro.text, 11)) + 16;
  const muroPillX = 8;
  const muroPillY = 220;

  const fondoAnchor = { x: (oP0b.x + oPrightb.x) / 2, y: (oP0b.y + oPrightb.y) / 2 - floorPx / 2 };
  const fondoPillWidth = Math.max(approxTextWidth("FONDO", 8.5), approxTextWidth(fondo.text, 11)) + 16;
  const fondoPillX = 400 - fondoPillWidth - 8;
  const fondoPillY = 220;

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" className="w-full h-auto" role="img" aria-label="Ilustración del vaso de la piscina con espesores">
      {/* Losa de fondo (hormigón) */}
      <polygon points={floorBottomPts} fill="#8F8A81" stroke="#6E6A62" strokeWidth="1" />
      {/* Muros exteriores (hormigón) */}
      <polygon points={outerLeftFace} fill="#A9A49B" />
      <polygon points={outerRightFace} fill="#8F8A81" />
      {/* Anillo superior = espesor de muro (hormigón) */}
      <path
        d={`M${outerTopPts.split(" ").join("L")}Z M${waterTopPts.split(" ").join("L")}Z`}
        fill="#B9B4AC"
        fillRule="evenodd"
        stroke="#8F8A81"
        strokeWidth="1"
      />
      {/* Espejo de agua (interior) */}
      <polygon points={waterTopPts} fill="#BEE3F8" stroke="#7FB8DE" strokeWidth="1" />

      <g stroke="#002152" strokeWidth="1.5" fill="none">
        <line x1={outerP0.x - 4} y1={outerP0.y + 4} x2={oPleft.x + 4} y2={oPleft.y - 4} markerStart="url(#pool-arrow-navy-start)" markerEnd="url(#pool-arrow-navy-end)" />
      </g>
      <text x={anchoLabelX} y={anchoLabelY - 13} textAnchor="end" fontSize="9" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
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
        markerStart="url(#pool-arrow-navy-start)"
        markerEnd="url(#pool-arrow-navy-end)"
      />
      <rect x={largoCotaCx - largoPillWidth / 2} y={largoCotaY - 10} width={largoPillWidth} height="20" rx="10" fill="#F9F9F9" />
      <text x={largoCotaCx} y={largoCotaY - 4.5} textAnchor="middle" fontSize="8.5" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
        LARGO
      </text>
      <text x={largoCotaCx} y={largoCotaY + 7.5} textAnchor="middle" fontSize={largoFontSize} fontWeight="700" fill="#002152" className="font-display">
        {largoText}
      </text>

      <line
        x1={profAnchorX}
        y1={profAnchorY - depthPx * 0.45}
        x2={profAnchorX}
        y2={profAnchorY + depthPx * 0.45}
        stroke="#002152"
        strokeWidth="1.25"
        strokeDasharray="3 3"
        opacity="0.6"
        markerStart="url(#pool-arrow-navy-start)"
        markerEnd="url(#pool-arrow-navy-end)"
      />
      <rect x={profPillX} y={profPillY} width={profLabelWidth} height={profPillHeight} rx={profPillHeight / 2} fill="#F9F9F9" />
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 14} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
        PROF.
      </text>
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 27} textAnchor="middle" fontSize={profFontSize} fontWeight="700" fill="#002152" className="font-display">
        {profText}
      </text>

      {/* ESPESOR MURO — naranja, sin cantidad si aún no fue tipeado */}
      <line x1={muroAnchor.x} y1={muroAnchor.y} x2={muroPillX + muroPillWidth / 2} y2={muroPillY + 18} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity={muro.hasValue ? 0.75 : 0.4} />
      <rect x={muroPillX} y={muroPillY} width={muroPillWidth} height="36" rx="18" fill="#FFE4D6" />
      <text x={muroPillX + muroPillWidth / 2} y={muroPillY + 14} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#E04500" className="font-display">
        MURO
      </text>
      <text x={muroPillX + muroPillWidth / 2} y={muroPillY + 28} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
        {muro.text}
      </text>

      {/* ESPESOR FONDO — naranja, sin cantidad si aún no fue tipeado */}
      <line x1={fondoAnchor.x} y1={fondoAnchor.y} x2={fondoPillX + fondoPillWidth / 2} y2={fondoPillY} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity={fondo.hasValue ? 0.75 : 0.4} />
      <rect x={fondoPillX} y={fondoPillY} width={fondoPillWidth} height="36" rx="18" fill="#FFE4D6" />
      <text x={fondoPillX + fondoPillWidth / 2} y={fondoPillY + 14} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#E04500" className="font-display">
        FONDO
      </text>
      <text x={fondoPillX + fondoPillWidth / 2} y={fondoPillY + 28} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
        {fondo.text}
      </text>

      {ORANGE_MARKERS}
    </svg>
  );
}

function CircularStructure({
  diametro,
  profundidad,
  espesorMuroCm,
  espesorFondoCm,
  diametroUnit = "m",
  profundidadUnit = "m",
}: {
  diametro: number | null;
  profundidad: number | null;
  espesorMuroCm: number | null;
  espesorFondoCm: number | null;
  diametroUnit?: string;
  profundidadUnit?: string;
}) {
  const cx = 200;
  const cy = 96;
  const innerRx = 92;
  const innerRy = 36;

  const muro = formatEspesor(espesorMuroCm);
  const fondo = formatEspesor(espesorFondoCm);
  const wallPx = muro.hasValue ? clamp(innerRx * 0.05 + (espesorMuroCm ?? 0) * 0.55, MIN_WALL_PX, MAX_WALL_PX) : MIN_WALL_PX;
  const floorPx = fondo.hasValue ? clamp((espesorFondoCm ?? 0) * 0.5, MIN_FLOOR_PX, MAX_FLOOR_PX) : MIN_FLOOR_PX;

  const depthRatio = profundidad && diametro && diametro > 0 ? clamp(profundidad / diametro, 0.15, 0.85) : 0.35;
  const depthPx = clamp(innerRx * 1.05 * depthRatio, MIN_DEPTH_PX, MAX_DEPTH_PX);

  const outerRx = innerRx + wallPx;
  const outerRy = innerRy + wallPx * (innerRy / innerRx);
  const outerFloorRy = outerRy * 0.82;
  const outerFloorRx = outerRx * 0.82;
  const outerFloorCy = cy + depthPx + floorPx;

  const diametroText = formatValue(diametro, diametroUnit);
  const diametroPillWidth = Math.max(approxTextWidth(diametroText, 13) + 18, 58);

  const profText = formatValue(profundidad, profundidadUnit);
  const profLabelWidth = Math.max(approxTextWidth("PROF.", 8.5), approxTextWidth(profText, 11)) + 16;
  const profPillX = 372 - profLabelWidth;
  const profPillY = 24;
  const profPillHeight = 36;

  const muroPillWidth = Math.max(approxTextWidth("MURO", 8.5), approxTextWidth(muro.text, 11)) + 16;
  const muroPillX = 10;
  const muroPillY = cy - 6;

  const fondoPillWidth = Math.max(approxTextWidth("FONDO", 8.5), approxTextWidth(fondo.text, 11)) + 16;
  const fondoPillX = cx - fondoPillWidth / 2;
  const fondoPillY = Math.min(outerFloorCy + 30, 220);

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" className="w-full h-auto" role="img" aria-label="Ilustración del vaso circular de la piscina con espesores">
      {/* Losa de fondo (hormigón) */}
      <ellipse cx={cx} cy={outerFloorCy} rx={outerFloorRx} ry={outerFloorRy} fill="#8F8A81" stroke="#6E6A62" strokeWidth="1" />
      {/* Muro perimetral exterior (hormigón), arco frontal visible */}
      <path
        d={`M${cx - outerRx},${cy} A${outerRx},${outerRy} 0 0,1 ${cx + outerRx},${cy} L${cx + outerFloorRx},${outerFloorCy} A${outerFloorRx},${outerFloorRy} 0 0,0 ${cx - outerFloorRx},${outerFloorCy} Z`}
        fill="#A9A49B"
      />
      {/* Anillo superior = espesor de muro visto en planta (hormigón) */}
      <path
        d={`M${cx - outerRx},${cy} A${outerRx},${outerRy} 0 1,0 ${cx + outerRx},${cy} A${outerRx},${outerRy} 0 1,0 ${cx - outerRx},${cy} Z M${cx - innerRx},${cy} A${innerRx},${innerRy} 0 1,0 ${cx + innerRx},${cy} A${innerRx},${innerRy} 0 1,0 ${cx - innerRx},${cy} Z`}
        fill="#B9B4AC"
        fillRule="evenodd"
        stroke="#8F8A81"
        strokeWidth="1"
      />
      {/* Espejo de agua (interior) */}
      <ellipse cx={cx} cy={cy} rx={innerRx} ry={innerRy} fill="#BEE3F8" stroke="#7FB8DE" strokeWidth="1" />

      <rect x={cx - diametroPillWidth / 2} y={cy - innerRy - 30} width={diametroPillWidth} height="20" rx="10" fill="#F9F9F9" />
      <text x={cx} y={cy - innerRy - 23.5} textAnchor="middle" fontSize="8.5" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
        DIÁMETRO
      </text>
      <text x={cx} y={cy - innerRy - 10.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#002152" className="font-display">
        {diametroText}
      </text>
      <line
        x1={cx - innerRx}
        y1={cy}
        x2={cx + innerRx}
        y2={cy}
        stroke="#002152"
        strokeWidth="1.1"
        strokeDasharray="3 3"
        opacity="0.5"
        markerStart="url(#pool-arrow-navy-start)"
        markerEnd="url(#pool-arrow-navy-end)"
      />

      <line
        x1={cx}
        y1={cy + innerRy * 0.5}
        x2={cx}
        y2={outerFloorCy - outerFloorRy * 0.5}
        stroke="#002152"
        strokeWidth="1.1"
        strokeDasharray="3 3"
        opacity="0.55"
        markerStart="url(#pool-arrow-navy-start)"
        markerEnd="url(#pool-arrow-navy-end)"
      />
      <rect x={profPillX} y={profPillY} width={profLabelWidth} height={profPillHeight} rx={profPillHeight / 2} fill="#F9F9F9" />
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 14} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
        PROF.
      </text>
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 27} textAnchor="middle" fontSize="11" fontWeight="700" fill="#002152" className="font-display">
        {profText}
      </text>

      {/* ESPESOR MURO */}
      <line x1={cx - innerRx} y1={cy + 2} x2={muroPillX + muroPillWidth / 2} y2={muroPillY + 18} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity={muro.hasValue ? 0.75 : 0.4} />
      <rect x={muroPillX} y={muroPillY} width={muroPillWidth} height="36" rx="18" fill="#FFE4D6" />
      <text x={muroPillX + muroPillWidth / 2} y={muroPillY + 14} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#E04500" className="font-display">
        MURO
      </text>
      <text x={muroPillX + muroPillWidth / 2} y={muroPillY + 28} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
        {muro.text}
      </text>

      {/* ESPESOR FONDO */}
      <line x1={cx} y1={outerFloorCy - outerFloorRy * 0.3} x2={fondoPillX + fondoPillWidth / 2} y2={fondoPillY} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity={fondo.hasValue ? 0.75 : 0.4} />
      <rect x={fondoPillX} y={fondoPillY} width={fondoPillWidth} height="36" rx="18" fill="#FFE4D6" />
      <text x={fondoPillX + fondoPillWidth / 2} y={fondoPillY + 14} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#E04500" className="font-display">
        FONDO
      </text>
      <text x={fondoPillX + fondoPillWidth / 2} y={fondoPillY + 28} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
        {fondo.text}
      </text>

      {ORANGE_MARKERS}
    </svg>
  );
}

export function PoolStructureIllustration(props: PoolStructureIllustrationProps) {
  return (
    <div>
      {props.shape === "rectangular" ? (
        <RectangularStructure
          largo={props.largo}
          ancho={props.ancho}
          profundidad={props.profundidad}
          espesorMuroCm={props.espesorMuroCm}
          espesorFondoCm={props.espesorFondoCm}
          largoUnit={props.largoUnit}
          anchoUnit={props.anchoUnit}
          profundidadUnit={props.profundidadUnit}
        />
      ) : (
        <CircularStructure
          diametro={props.diametro}
          profundidad={props.profundidad}
          espesorMuroCm={props.espesorMuroCm}
          espesorFondoCm={props.espesorFondoCm}
          diametroUnit={props.diametroUnit}
          profundidadUnit={props.profundidadUnit}
        />
      )}
      <Note />
    </div>
  );
}
