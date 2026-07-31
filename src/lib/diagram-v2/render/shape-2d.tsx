// Sistema 2D — vista ortogonal PURA. Sin cámara, sin perspectiva, sin
// espesor (ver especificación aprobada: "Vista ortogonal pura. Sin
// perspectiva, sin espesor"). No importa nada de math/camera.ts a
// propósito — 2D y 3D son familias visuales hermanas, no una simplificación
// de la otra.

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

export function Circle2D({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={theme.fill.top} stroke={theme.stroke.solid} strokeWidth={theme.stroke.width} />;
}
