// Sistema 2D — vista ortogonal PURA. Sin cámara, sin perspectiva, sin
// espesor (ver especificación aprobada: "Vista ortogonal pura. Sin
// perspectiva, sin espesor"). No importa nada de math/camera.ts a
// propósito — 2D y 3D son familias visuales hermanas, no una simplificación
// de la otra.

import { useId } from "react";
import { theme } from "./theme";

export function Rect2D({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={theme.fill.top}
      stroke={theme.stroke.solid}
      strokeWidth={theme.stroke.width}
      strokeLinejoin="round"
    />
  );
}

// Vano descontado (puerta/ventana) dibujado sobre un Rect2D — spec
// "ObraBien Calculadora - Flujo rediseñado" (Fase 4, 2026-08-02):
// "diagramas explicativos, no planos técnicos". La POSICIÓN es siempre
// ilustrativa (el dato real solo trae ancho×alto, nunca dónde está) — se
// distribuyen en fila sobre la base del muro, nunca se intenta ubicarlos
// donde el usuario nunca dijo que estaban. El color/trama (blanco +
// diagonales naranjas + trazo punteado) los distingue claramente del
// muro para que no se lean como una grieta o un error de dibujo.
// Fase 8, sprint UX V1.2 (04-ago-2026): trama a dos direcciones (antes
// solo diagonal simple) — "que se note mucho más evidente que se agregó
// una puerta o ventana". Sigue siendo la misma idea de siempre (blanco +
// trama naranja + trazo punteado, nunca una posición real), solo con más
// densidad de línea para que no compita en sutileza con el muro casi del
// mismo blanco.
export function VoidRect({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  const patternId = useId();
  return (
    <>
      <defs>
        <pattern id={patternId} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="6" stroke={theme.voidShape.hatch} strokeWidth="1.6" opacity={theme.voidShape.hatchOpacity} />
          <line x1="0" y1="0" x2="6" y2="0" stroke={theme.voidShape.hatch} strokeWidth="1.6" opacity={theme.voidShape.hatchOpacity} />
        </pattern>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill={theme.voidShape.fill} />
      <rect x={x} y={y} width={width} height={height} fill={`url(#${patternId})`} />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke={theme.voidShape.stroke}
        strokeWidth={theme.voidShape.strokeWidth}
        strokeDasharray={theme.voidShape.strokeDasharray}
      />
    </>
  );
}

export function Circle2D({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={theme.fill.top} stroke={theme.stroke.solid} strokeWidth={theme.stroke.width} />;
}
