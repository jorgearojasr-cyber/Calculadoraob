// Render del sólido 3D — consume geometría YA proyectada (math/solids.ts
// + math/scale-engine.ts), nunca calcula un punto por su cuenta. Solo
// sabe de pintar: orden Z, colores del tema, grosor de contorno.

import type { Vec2 } from "../math/vec2";
import { theme } from "./theme";

function poly(pts: Vec2[]): string {
  return pts.map((p) => `${p[0]},${p[1]}`).join(" ");
}

export function BoxSolid({ wallLeft, wallRight, top }: { wallLeft: Vec2[]; wallRight: Vec2[]; top: Vec2[] }) {
  return (
    <g>
      <polygon
        points={poly(wallLeft)}
        fill={theme.fill.wallLeft}
        stroke={theme.stroke.solid}
        strokeWidth={theme.stroke.width}
        strokeLinejoin="round"
      />
      <polygon
        points={poly(wallRight)}
        fill={theme.fill.wallRight}
        stroke={theme.stroke.solid}
        strokeWidth={theme.stroke.width}
        strokeLinejoin="round"
      />
      <polygon
        points={poly(top)}
        fill={theme.fill.top}
        stroke={theme.stroke.solid}
        strokeWidth={theme.stroke.width}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function CylinderSolid({
  topLeft,
  topRight,
  topCenter,
  bottomLeft,
  bottomRight,
  rx,
  ry,
}: {
  topLeft: Vec2;
  topRight: Vec2;
  topCenter: Vec2;
  bottomLeft: Vec2;
  bottomRight: Vec2;
  rx: number;
  ry: number;
}) {
  return (
    <g>
      {/* Cuerpo — un solo tono medio (un cilindro no tiene 2 caras planas
          distintas que diferenciar como la caja). */}
      <path
        d={`M ${topLeft[0]} ${topLeft[1]} A ${rx} ${ry} 0 0 1 ${topRight[0]} ${topRight[1]} L ${bottomRight[0]} ${bottomRight[1]} A ${rx} ${ry} 0 0 1 ${bottomLeft[0]} ${bottomLeft[1]} Z`}
        fill={theme.fill.wallRight}
        stroke={theme.stroke.solid}
        strokeWidth={theme.stroke.width}
        strokeLinejoin="round"
      />
      {/* Arco frontal visible del borde inferior */}
      <path
        d={`M ${bottomLeft[0]} ${bottomLeft[1]} A ${rx} ${ry} 0 0 0 ${bottomRight[0]} ${bottomRight[1]}`}
        fill="none"
        stroke={theme.stroke.solid}
        strokeWidth={theme.stroke.width}
      />
      {/* Tapa superior — la cara con más luz, se dibuja al final */}
      <ellipse
        cx={topCenter[0]}
        cy={topCenter[1]}
        rx={rx}
        ry={ry}
        fill={theme.fill.top}
        stroke={theme.stroke.solid}
        strokeWidth={theme.stroke.width}
      />
    </g>
  );
}
