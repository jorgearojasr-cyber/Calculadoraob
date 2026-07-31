// El carril + su chip de valor — consume la geometría de layout/, nunca
// calcula un punto por su cuenta. Es la única pieza que sabe qué significa
// "activo": decide naranjo vs. neutro, pero no decide CUÁL cota está
// activa (eso lo decide quien arma el diagrama completo — ver
// DiagramV2.tsx — a partir de `activeField`).

import type { Lane } from "../layout/dimension-lane";
import { theme } from "./theme";

export const CHIP_W = 64;
export const CHIP_H = 30;

export function DimensionChip({ lane, label, value, active }: { lane: Lane; label: string; value: string; active: boolean }) {
  const color = active ? theme.dimension.active : theme.dimension.inactive;
  const [cx, cy] = lane.chipCenter;

  return (
    <g>
      {/* Líneas de referencia — desde cada vértice real hasta el carril.
          Nunca tocan el sólido: arrancan EN el vértice, terminan en el
          carril paralelo. */}
      <line x1={lane.A[0]} y1={lane.A[1]} x2={lane.A2[0]} y2={lane.A2[1]} stroke={theme.stroke.lane} strokeWidth={theme.stroke.laneWidth} />
      <line x1={lane.B[0]} y1={lane.B[1]} x2={lane.B2[0]} y2={lane.B2[1]} stroke={theme.stroke.lane} strokeWidth={theme.stroke.laneWidth} />

      {/* Carril — línea interrumpida (el chip se dibuja encima y "corta"
          el tramo central). */}
      <line
        x1={lane.A2[0]}
        y1={lane.A2[1]}
        x2={lane.B2[0]}
        y2={lane.B2[1]}
        stroke={color}
        strokeWidth={theme.stroke.laneWidth}
        strokeDasharray="3 3"
      />

      {/* Chip de valor — fondo opaco corta la línea del carril debajo. */}
      <rect
        x={cx - CHIP_W / 2}
        y={cy - CHIP_H / 2}
        width={CHIP_W}
        height={CHIP_H}
        rx={4}
        fill={theme.chip.bg}
      />
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily={theme.chip.fontLabel}
        fontSize={9}
        fontWeight={500}
        fill={theme.chip.labelColor}
      >
        {label}
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily={theme.chip.fontValue}
        fontSize={11}
        fontWeight={600}
        fill={active ? theme.chip.valueColorActive : theme.chip.valueColor}
      >
        {value}
      </text>
    </g>
  );
}
