// El carril + su chip de valor — consume la geometría de layout/, nunca
// calcula un punto por su cuenta. Es la única pieza que sabe qué significa
// "activo": decide naranjo vs. neutro, pero no decide CUÁL cota está
// activa (eso lo decide quien arma el diagrama completo — ver
// DiagramV2.tsx — a partir de `activeField`).
//
// Calibrado 2026-08-02 contra el PDF real (ver conversación) — 2 cambios
// estructurales de render respecto a la primera pasada de Fase 0:
//  1. El carril es una línea CONTINUA con flecha de doble punta en cada
//     extremo (no punteada) — el chip, dibujado encima, es lo que la
//     "interrumpe" visualmente al taparla en el tramo central.
//  2. El chip es un rótulo HORIZONTAL de una sola línea ("Profundidad
//     1,20 m", etiqueta y valor lado a lado) — no 2 líneas apiladas.

import { useId } from "react";
import type { Lane } from "../layout/dimension-lane";
import { theme } from "./theme";

export const CHIP_H = 30;
const CHIP_PAD_X = 12;
const CHIP_GAP = 6;
// Estimador de ancho de texto — no hay medición real de texto disponible
// server-side; estos anchos promedio por caracter para Figtree 10px
// (label) e IBM Plex Mono 12px bold (value) se ajustaron a ojo contra el
// mockup, que usa chips de distinto ancho según el contenido (ver
// "Profundidad 1,20 m" vs. "Largo 4,50 m" en el PDF).
const LABEL_CHAR_W = 5.6;
const VALUE_CHAR_W = 7.6;

export function estimateChipWidth(label: string, value: string): number {
  const labelW = label.length * LABEL_CHAR_W;
  const valueW = value.length * VALUE_CHAR_W;
  return Math.max(80, CHIP_PAD_X * 2 + labelW + CHIP_GAP + valueW);
}

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 Z" fill={color} />
    </marker>
  );
}

export function DimensionChip({ lane, label, value, active }: { lane: Lane; label: string; value: string; active: boolean }) {
  const rawId = useId();
  const markerId = `dimv2-arrow-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const color = active ? theme.dimension.active : theme.dimension.inactive;
  const [cx, cy] = lane.chipCenter;
  const chipW = estimateChipWidth(label, value);

  return (
    <g>
      <defs>
        <ArrowMarker id={markerId} color={color} />
      </defs>

      {/* Líneas de referencia — desde cada vértice real hasta el carril.
          Nunca tocan el sólido: arrancan EN el vértice, terminan en el
          carril paralelo. Sin flecha — solo el carril principal la
          lleva (ver mockup real). */}
      <line x1={lane.A[0]} y1={lane.A[1]} x2={lane.A2[0]} y2={lane.A2[1]} stroke={theme.stroke.reference} strokeWidth={theme.stroke.referenceWidth} />
      <line x1={lane.B[0]} y1={lane.B[1]} x2={lane.B2[0]} y2={lane.B2[1]} stroke={theme.stroke.reference} strokeWidth={theme.stroke.referenceWidth} />

      {/* Carril — línea continua con flecha de doble punta; el chip,
          dibujado encima, la "interrumpe" visualmente. */}
      <line
        x1={lane.A2[0]}
        y1={lane.A2[1]}
        x2={lane.B2[0]}
        y2={lane.B2[1]}
        stroke={color}
        strokeWidth={theme.stroke.laneWidth}
        markerStart={`url(#${markerId})`}
        markerEnd={`url(#${markerId})`}
      />

      {/* Chip de valor — etiqueta + número en una sola línea horizontal,
          fondo opaco con borde fino, corta la línea del carril debajo. */}
      <rect
        x={cx - chipW / 2}
        y={cy - CHIP_H / 2}
        width={chipW}
        height={CHIP_H}
        rx={theme.chip.radius}
        fill={theme.chip.bg}
        stroke={theme.chip.border}
        strokeWidth={theme.chip.borderWidth}
      />
      <text x={cx - chipW / 2 + CHIP_PAD_X} y={cy} textAnchor="start" dominantBaseline="middle" fontFamily={theme.chip.fontLabel} fontSize={10} fontWeight={500} fill={theme.chip.labelColor}>
        {label}
      </text>
      <text
        x={cx + chipW / 2 - CHIP_PAD_X}
        y={cy}
        textAnchor="end"
        dominantBaseline="middle"
        fontFamily={theme.chip.fontValue}
        fontSize={12.5}
        fontWeight={600}
        fill={active ? theme.chip.valueColorActive : theme.chip.valueColor}
      >
        {value}
      </text>
    </g>
  );
}
