// Render del sólido 3D — consume geometría YA proyectada (math/solids.ts
// + math/scale-engine.ts), nunca calcula un punto por su cuenta. Solo
// sabe de pintar: orden Z, colores del tema, grosor de contorno.
//
// Calibración 2026-08-02 ("más sensación de volumen sin tocar geometría/
// cámara/proyección"): cada cara pasa de color plano a un degradado
// sutil DENTRO del mismo polígono (ver theme.gradient) — ningún punto
// nuevo, ningún cambio de forma, solo cómo se pinta el área ya
// calculada. Vertical (de arriba hacia abajo del propio bbox de cada
// cara, objectBoundingBox) porque la luz de la especificación viene de
// arriba — no requiere saber el ángulo de cámara, así que sigue sin
// acoplar render a math/.

import { useId } from "react";
import type { Vec2 } from "../math/vec2";
import { theme } from "./theme";

function poly(pts: Vec2[]): string {
  return pts.map((p) => `${p[0]},${p[1]}`).join(" ");
}

function FaceGradient({ id, from, to }: { id: string; from: string; to: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={from} />
      <stop offset="100%" stopColor={to} />
    </linearGradient>
  );
}

// Fase 7, sprint UX V1.2 (04-ago-2026): el cuerpo curvo del cilindro NO
// puede leer volumen con un degradado vertical de un solo tono (lo que
// tenía antes) — a diferencia de la caja, que vende volumen con 2 CARAS
// realmente distintas (wallLeft oscura / wallRight media), la superficie
// curva nunca usaba el tono oscuro de wallLeft en absoluto, así que se
// veía plana ("inflada") y el borde donde la curva termina (sobre todo el
// izquierdo) se sentía como un corte abrupto en vez de un degradado hacia
// sombra. Este degradado HORIZONTAL (izquierda oscura → centro claro,
// el punto más cercano a la cámara → derecha media) reutiliza los MISMOS
// 2 tonos ya definidos para la caja (wallLeft/wallRight) — mismo lenguaje
// visual, sin inventar un color nuevo, sin tocar geometría ni cámara.
function CylinderBodyGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={theme.gradient.wallLeft.to} />
      <stop offset="48%" stopColor={theme.gradient.wallRight.from} />
      <stop offset="100%" stopColor={theme.gradient.wallRight.to} />
    </linearGradient>
  );
}

export function BoxSolid({
  wallLeft,
  wallRight,
  top,
  waterFill,
}: {
  wallLeft: Vec2[];
  wallRight: Vec2[];
  top: Vec2[];
  // Piscina (ver theme.water) — lavado celeste ENCIMA de las 3 caras ya
  // pintadas, mismo sólido de siempre. Nunca cambia la geometría.
  waterFill?: boolean;
}) {
  const rawId = useId();
  const gid = (name: string) => `dimv2-grad-${name}-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const idTop = gid("top");
  const idRight = gid("right");
  const idLeft = gid("left");

  return (
    <g>
      <defs>
        <FaceGradient id={idTop} from={theme.gradient.top.from} to={theme.gradient.top.to} />
        <FaceGradient id={idRight} from={theme.gradient.wallRight.from} to={theme.gradient.wallRight.to} />
        <FaceGradient id={idLeft} from={theme.gradient.wallLeft.from} to={theme.gradient.wallLeft.to} />
      </defs>
      <polygon
        points={poly(wallLeft)}
        fill={`url(#${idLeft})`}
        stroke={theme.stroke.solid}
        strokeWidth={theme.stroke.width}
        strokeLinejoin="round"
      />
      <polygon
        points={poly(wallRight)}
        fill={`url(#${idRight})`}
        stroke={theme.stroke.solid}
        strokeWidth={theme.stroke.width}
        strokeLinejoin="round"
      />
      <polygon
        points={poly(top)}
        fill={`url(#${idTop})`}
        stroke={theme.stroke.solid}
        strokeWidth={theme.stroke.width}
        strokeLinejoin="round"
      />
      {waterFill && (
        <>
          <polygon points={poly(wallLeft)} fill={theme.water.fill} opacity={theme.water.wallOpacity} />
          <polygon points={poly(wallRight)} fill={theme.water.fill} opacity={theme.water.wallOpacity} />
          <polygon
            points={poly(top)}
            fill={theme.water.fill}
            opacity={theme.water.surfaceOpacity}
            stroke={theme.water.rimStroke}
            strokeWidth={theme.water.rimWidth}
            strokeLinejoin="round"
          />
        </>
      )}
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
  waterFill,
}: {
  topLeft: Vec2;
  topRight: Vec2;
  topCenter: Vec2;
  bottomLeft: Vec2;
  bottomRight: Vec2;
  rx: number;
  ry: number;
  waterFill?: boolean;
}) {
  const rawId = useId();
  const gid = (name: string) => `dimv2-grad-${name}-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const idBody = gid("body");
  const idTop = gid("top");

  return (
    <g>
      <defs>
        <CylinderBodyGradient id={idBody} />
        <FaceGradient id={idTop} from={theme.gradient.top.from} to={theme.gradient.top.to} />
      </defs>
      {/* Cuerpo — degradado horizontal oscuro→claro→medio (ver
          CylinderBodyGradient arriba): vende la curvatura igual que la
          caja vende sus 2 caras, sin necesitar 2 polígonos separados. */}
      <path
        d={`M ${topLeft[0]} ${topLeft[1]} A ${rx} ${ry} 0 0 1 ${topRight[0]} ${topRight[1]} L ${bottomRight[0]} ${bottomRight[1]} A ${rx} ${ry} 0 0 1 ${bottomLeft[0]} ${bottomLeft[1]} Z`}
        fill={`url(#${idBody})`}
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
        fill={`url(#${idTop})`}
        stroke={theme.stroke.solid}
        strokeWidth={theme.stroke.width}
      />
      {waterFill && (
        <>
          <path
            d={`M ${topLeft[0]} ${topLeft[1]} A ${rx} ${ry} 0 0 1 ${topRight[0]} ${topRight[1]} L ${bottomRight[0]} ${bottomRight[1]} A ${rx} ${ry} 0 0 1 ${bottomLeft[0]} ${bottomLeft[1]} Z`}
            fill={theme.water.fill}
            opacity={theme.water.wallOpacity}
          />
          <ellipse
            cx={topCenter[0]}
            cy={topCenter[1]}
            rx={rx}
            ry={ry}
            fill={theme.water.fill}
            opacity={theme.water.surfaceOpacity}
            stroke={theme.water.rimStroke}
            strokeWidth={theme.water.rimWidth}
          />
        </>
      )}
    </g>
  );
}
