import { Info } from "lucide-react";
import { formatQuantity } from "@/lib/format-number";

// Ilustración de Radier — componente standalone (Fase "Radier rediseñado",
// 2026-08-30), NO conectado al motor genérico DiagramV2 (ver
// docs/... conversación con Jorge: DiagramV2/solid-3d/theme/scale-engine/
// solids quedan congelados sin excepciones — este componente no importa
// nada de src/lib/diagram-v2). Vive fuera de ese sistema a propósito.
//
// Recibe largo/ancho/espesor directo del mismo estado que alimenta los
// inputs del wizard (ver volume-step.tsx) — no duplica estado. La
// geometría es deliberadamente NO a escala real:
//   - el espesor visual es una proporción fija del alto del dibujo
//     (nunca < ~15%), sin importar el espesor real ingresado;
//   - el ratio largo:ancho del dibujo se acota a [1/3, 3] aunque los
//     valores reales excedan ese rango — los NÚMEROS mostrados siempre
//     son los reales, solo la geometría se ajusta para legibilidad.
export type RadierIllustrationProps = {
  largo: number | null;
  ancho: number | null;
  espesor: number | null;
  largoUnit?: string;
  anchoUnit?: string;
  espesorUnit?: string;
};

const ANGLE_DEG = 22;
const RAD = (ANGLE_DEG * Math.PI) / 180;
const DIR_LARGO = { x: Math.cos(RAD), y: -Math.sin(RAD) };
const DIR_ANCHO = { x: -Math.cos(RAD), y: -Math.sin(RAD) };

// Área visual de referencia del footprint (no m² reales) — a ratio 2:1
// (caso por defecto, ej. 6x3) da un footprint de ~160x80px, tamaño que se
// ve bien dentro del viewBox elegido más abajo.
const BASE_FOOTPRINT_AREA = 12800;
const MIN_RATIO = 1 / 3;
const MAX_RATIO = 3;
const MIN_THICKNESS = 30;
const MAX_THICKNESS = 50;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Estimación de ancho de texto sin medir el DOM (evita un segundo render
// vía useLayoutEffect solo para esto) — suficiente para decidir si un
// valor largo ("12,5 m", "100 m") necesita achicar la fuente o ensanchar
// el fondo/línea de cota que lo acompaña. Factor calibrado para
// font-display (Figtree) en negrita a los tamaños usados acá.
function approxTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.62;
}

function formatValue(value: number | null, unit: string): string {
  return `${formatQuantity(value ?? 0)} ${unit}`;
}

export function RadierIllustration({
  largo,
  ancho,
  espesor,
  largoUnit = "m",
  anchoUnit = "m",
  espesorUnit = "cm",
}: RadierIllustrationProps) {
  const ratio = clamp(largo && ancho && largo > 0 && ancho > 0 ? largo / ancho : 2, MIN_RATIO, MAX_RATIO);
  const anchoVisual = Math.sqrt(BASE_FOOTPRINT_AREA / ratio);
  const largoVisual = Math.sqrt(BASE_FOOTPRINT_AREA * ratio);
  const thicknessPx = clamp((largoVisual + anchoVisual) * Math.sin(RAD) * 0.55, MIN_THICKNESS, MAX_THICKNESS);

  // Origen (P0) = esquina frontal-inferior de la cara superior — el resto
  // de los vértices se derivan sumando los vectores de dirección
  // escalados por el largo/ancho VISUALES (no los reales).
  const P0 = { x: 190, y: 118 };
  const Pright = { x: P0.x + DIR_LARGO.x * largoVisual, y: P0.y + DIR_LARGO.y * largoVisual };
  const Pleft = { x: P0.x + DIR_ANCHO.x * anchoVisual, y: P0.y + DIR_ANCHO.y * anchoVisual };
  const Pback = { x: Pright.x + DIR_ANCHO.x * anchoVisual, y: Pright.y + DIR_ANCHO.y * anchoVisual };
  const P0b = { x: P0.x, y: P0.y + thicknessPx };
  const Prightb = { x: Pright.x, y: Pright.y + thicknessPx };
  const Pleftb = { x: Pleft.x, y: Pleft.y + thicknessPx };

  const topFace = `${P0.x},${P0.y} ${Pright.x},${Pright.y} ${Pback.x},${Pback.y} ${Pleft.x},${Pleft.y}`;
  const rightFace = `${P0.x},${P0.y} ${Pright.x},${Pright.y} ${Prightb.x},${Prightb.y} ${P0b.x},${P0b.y}`;
  const leftFace = `${P0.x},${P0.y} ${Pleft.x},${Pleft.y} ${Pleftb.x},${Pleftb.y} ${P0b.x},${P0b.y}`;

  // --- LARGO: cota horizontal centrada bajo la losa ---
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

  // --- ANCHO: cota diagonal arriba-izquierda ---
  const anchoText = formatValue(ancho, anchoUnit);
  let anchoFontSize = 13;
  // El texto de ancho vive fuera del viewBox central si es muy largo —
  // en vez de medir con precisión, se reserva un margen izquierdo amplio
  // (ver viewBox) y se achica la fuente si aun así no entra.
  if (approxTextWidth(anchoText, anchoFontSize) > 92) {
    anchoFontSize = clamp((92 / approxTextWidth(anchoText, anchoFontSize)) * anchoFontSize, 9, anchoFontSize);
  }
  const anchoLabelX = Pleft.x - 14;
  const anchoLabelY = Pleft.y - 2;

  // --- ESPESOR: cápsula naranja arriba-derecha ---
  const espesorText = formatValue(espesor, espesorUnit);
  let espesorFontSize = 13;
  const espesorMaxTextWidth = 78;
  if (approxTextWidth(espesorText, espesorFontSize) > espesorMaxTextWidth) {
    espesorFontSize = clamp((espesorMaxTextWidth / approxTextWidth(espesorText, espesorFontSize)) * espesorFontSize, 9, espesorFontSize);
  }
  const espesorLabelWidth = Math.max(approxTextWidth("ESPESOR", 9.5), approxTextWidth(espesorText, espesorFontSize)) + 20;
  const espesorPillX = 372 - espesorLabelWidth; // ancla a la derecha, crece hacia la izquierda
  const espesorPillY = 26;
  const espesorPillHeight = 40;
  const espesorAnchorX = Pright.x + (Pback.x - Pright.x) * 0.35;
  const espesorAnchorY = Pright.y + (Pback.y - Pright.y) * 0.35;

  return (
    <div>
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" className="w-full h-auto" role="img" aria-label="Ilustración del radier con sus medidas">
        <defs>
          <pattern id="radier-texture" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="0.7" fill="#B9B4AC" opacity="0.5" />
          </pattern>
        </defs>

        {/* Losa: cara superior + 2 caras de canto (espesor exagerado) */}
        <polygon points={leftFace} fill="#A9A49B" />
        <polygon points={rightFace} fill="#8F8A81" />
        <polygon points={topFace} fill="#D9D5CC" stroke="#B9B4AC" strokeWidth="1" />
        <polygon points={topFace} fill="url(#radier-texture)" />

        {/* ANCHO — cota diagonal arriba-izquierda, navy */}
        <g stroke="#002152" strokeWidth="1.5" fill="none">
          <line x1={P0.x - 4} y1={P0.y + 4} x2={Pleft.x + 4} y2={Pleft.y - 4} markerStart="url(#arrow-navy-start)" markerEnd="url(#arrow-navy-end)" />
        </g>
        <text x={anchoLabelX} y={anchoLabelY - 14} textAnchor="end" fontSize="9.5" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
          ANCHO
        </text>
        <text x={anchoLabelX} y={anchoLabelY} textAnchor="end" fontSize={anchoFontSize} fontWeight="700" fill="#002152" className="font-display">
          {anchoText}
        </text>

        {/* LARGO — cota horizontal centrada abajo, navy */}
        <line
          x1={largoCotaCx - largoLineHalfWidth}
          y1={largoCotaY}
          x2={largoCotaCx + largoLineHalfWidth}
          y2={largoCotaY}
          stroke="#002152"
          strokeWidth="1.5"
          markerStart="url(#arrow-navy-start)"
          markerEnd="url(#arrow-navy-end)"
        />
        <rect x={largoCotaCx - largoPillWidth / 2} y={largoCotaY - 11} width={largoPillWidth} height="22" rx="11" fill="#F9F9F9" />
        <text x={largoCotaCx} y={largoCotaY - 5} textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
          LARGO
        </text>
        <text x={largoCotaCx} y={largoCotaY + 8} textAnchor="middle" fontSize={largoFontSize} fontWeight="700" fill="#002152" className="font-display">
          {largoText}
        </text>

        {/* ESPESOR — cápsula naranja arriba-derecha + cota vertical corta + línea punteada */}
        <line x1={espesorAnchorX} y1={espesorAnchorY} x2={espesorPillX + espesorLabelWidth / 2} y2={espesorPillY + espesorPillHeight} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.6" />
        <line
          x1={espesorAnchorX}
          y1={espesorAnchorY - thicknessPx * 0.55}
          x2={espesorAnchorX}
          y2={espesorAnchorY + thicknessPx * 0.55}
          stroke="#FF4E00"
          strokeWidth="1.5"
          markerStart="url(#arrow-action-start)"
          markerEnd="url(#arrow-action-end)"
        />
        <rect x={espesorPillX} y={espesorPillY} width={espesorLabelWidth} height={espesorPillHeight} rx={espesorPillHeight / 2} fill="#FFE4D6" />
        <text x={espesorPillX + espesorLabelWidth / 2} y={espesorPillY + 16} textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="0.05em" fill="#E04500" className="font-display">
          ESPESOR
        </text>
        <text x={espesorPillX + espesorLabelWidth / 2} y={espesorPillY + 32} textAnchor="middle" fontSize={espesorFontSize} fontWeight="700" fill="#E04500" className="font-display">
          {espesorText}
        </text>

        <defs>
          <marker id="arrow-navy-end" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#002152" />
          </marker>
          <marker id="arrow-navy-start" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
            <path d="M6,0 L0,3 L6,6 Z" fill="#002152" />
          </marker>
          <marker id="arrow-action-end" markerWidth="6" markerHeight="6" refX="3" refY="5" orient="auto">
            <path d="M0,0 L6,0 L3,6 Z" fill="#FF4E00" />
          </marker>
          <marker id="arrow-action-start" markerWidth="6" markerHeight="6" refX="3" refY="1" orient="auto">
            <path d="M0,6 L6,6 L3,0 Z" fill="#FF4E00" />
          </marker>
        </defs>
      </svg>
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <Info className="w-3 h-3 text-ink-faint flex-shrink-0" />
        <p className="text-xs text-ink-faint">Espesor ilustrado fuera de escala</p>
      </div>
    </div>
  );
}
