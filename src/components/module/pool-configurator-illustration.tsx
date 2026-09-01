import { Info } from "lucide-react";
import { formatQuantity } from "@/lib/format-number";

// Ilustracion del configurador integral de Piscina (Fase C1, Module NUEVO
// "piscina-integral") -- componente standalone, NO conectado a DiagramV2
// (mismo criterio ya aprobado para RadierIllustration/
// PoolExcavationIllustration/PoolStructureIllustration). Reutiliza la
// MATEMATICA/idea de esos 2 ultimos (rombo/elipse isometrico + espesor)
// pero es un archivo propio -- no los importa ni los modifica.
//
// 3 estados dentro de UN solo componente (ver seccion 11 del pedido de
// C1, "un unico PoolConfiguratorIllustration con variantes/estados
// internos", no un componente separado por paso):
//   - "medidas": solo el vaso interior (agua), sin muro/losa -- el
//     usuario aun no respondio espesores.
//   - "estructura": vaso interior + anillo de muro + losa extendida bajo
//     el muro (el supuesto geometrico aprobado para este Module,
//     EXCLUSIVO de piscina-integral), leyendo largo/ancho/profundidad ya
//     respondidos en "Medidas" (sourceDimensionKeys, mismo mecanismo de
//     Fase B) + los espesores que se estan tipeando ahora.
//   - "interior" (Fase C2, 2026-09-01): MISMA geometria que "estructura"
//     (muro+losa ya definidos, se leen de Estructura vía
//     sourceDimensionKeys igual que siempre) pero la cara de agua (fondo)
//     y las caras interiores de muro se tiñen/texturizan según la
//     terminación elegida para cada superficie -- pintura (color solido),
//     cerámica/mosaico (patrón de grilla), membrana PVC (patrón de franjas
//     continuas) o sin calcular (gris neutro, mismo tono que el hormigón
//     sin terminar). Los pills MURO/FONDO pasan a mostrar el nombre de la
//     terminación en vez del espesor en cm (el espesor ya se ve en la
//     ilustración de Estructura, acá lo relevante es el material).
//
// Mismo criterio de "Sin definir" vs "0" que PoolStructureIllustration:
// un espesor nunca respondido se muestra sin cifra (nunca se inventa un
// valor), 0 tipeado se muestra literal.
export type InteriorMaterial = "pintura" | "ceramica" | "membrana" | "sin-calcular";

export type PoolConfiguratorIllustrationProps =
  | {
      state: "medidas";
      shape: "rectangular";
      largo: number | null;
      ancho: number | null;
      profundidad: number | null;
    }
  | {
      state: "medidas";
      shape: "circular";
      diametro: number | null;
      profundidad: number | null;
    }
  | {
      state: "estructura";
      shape: "rectangular";
      largo: number | null;
      ancho: number | null;
      profundidad: number | null;
      espesorMuroCm: number | null;
      espesorFondoCm: number | null;
    }
  | {
      state: "estructura";
      shape: "circular";
      diametro: number | null;
      profundidad: number | null;
      espesorMuroCm: number | null;
      espesorFondoCm: number | null;
    }
  | {
      state: "interior";
      shape: "rectangular";
      largo: number | null;
      ancho: number | null;
      profundidad: number | null;
      espesorMuroCm: number | null;
      espesorFondoCm: number | null;
      materialMuros: InteriorMaterial | null;
      materialFondo: InteriorMaterial | null;
    }
  | {
      state: "interior";
      shape: "circular";
      diametro: number | null;
      profundidad: number | null;
      espesorMuroCm: number | null;
      espesorFondoCm: number | null;
      materialMuros: InteriorMaterial | null;
      materialFondo: InteriorMaterial | null;
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

// Espesor: null (campo vacio) se muestra SIN cantidad ("Sin definir"),
// nunca con una cifra inventada. 0 es un valor real que el usuario tipeo
// -- se muestra literal ("0 cm").
function formatEspesor(value: number | null): { text: string; hasValue: boolean } {
  if (value === null) return { text: "Sin definir", hasValue: false };
  return { text: `${formatQuantity(value)} cm`, hasValue: true };
}

// Fase C2 -- nombre corto (cabe en el pill MURO/FONDO) por terminación.
const MATERIAL_LABELS: Record<InteriorMaterial, string> = {
  pintura: "Pintura",
  ceramica: "Cerámica",
  membrana: "Membrana",
  "sin-calcular": "Sin calcular",
};

function formatMaterial(value: InteriorMaterial | null): { text: string; hasValue: boolean } {
  if (value === null) return { text: "Sin definir", hasValue: false };
  return { text: MATERIAL_LABELS[value], hasValue: true };
}

// Relleno visual por terminación -- pintura es color sólido uniforme,
// cerámica/membrana usan un patrón (definido en MATERIAL_PATTERNS más
// abajo) para diferenciarse a simple vista, sin calcular/null cae al
// mismo gris neutro del hormigón sin terminar (no se inventa un
// acabado que el usuario no eligió).
function materialFill(value: InteriorMaterial | null): string {
  switch (value) {
    case "pintura":
      return "#4FB8DE";
    case "ceramica":
      return "url(#poolcfg-mat-ceramica)";
    case "membrana":
      return "url(#poolcfg-mat-membrana)";
    default:
      return "#D9D4CB";
  }
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

const MARKERS = (
  <defs>
    <marker id="poolcfg-arrow-action-end" markerWidth="6" markerHeight="6" refX="3" refY="5" orient="auto">
      <path d="M0,0 L6,0 L3,6 Z" fill="#FF4E00" />
    </marker>
    <marker id="poolcfg-arrow-action-start" markerWidth="6" markerHeight="6" refX="3" refY="1" orient="auto">
      <path d="M0,6 L6,6 L3,0 Z" fill="#FF4E00" />
    </marker>
    <marker id="poolcfg-arrow-navy-end" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="#002152" />
    </marker>
    <marker id="poolcfg-arrow-navy-start" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
      <path d="M6,0 L0,3 L6,6 Z" fill="#002152" />
    </marker>
    {/* Fase C2 -- patrones de terminación interior (cerámica/mosaico =
        grilla discreta, membrana PVC = franjas continuas). Se incluyen
        siempre (no solo en state="interior") porque son inertes/sin costo
        si no se referencian -- evita threadear una prop extra solo para
        decidir si declarar el <defs>. */}
    <pattern id="poolcfg-mat-ceramica" width="9" height="9" patternUnits="userSpaceOnUse">
      <rect width="9" height="9" fill="#CDEBFA" />
      <rect x="0.5" y="0.5" width="8" height="8" fill="none" stroke="#7FB8DE" strokeWidth="1" />
    </pattern>
    <pattern id="poolcfg-mat-membrana" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="10" height="10" fill="#BEE3F8" />
      <rect width="4" height="10" fill="#4A9BC7" />
    </pattern>
  </defs>
);

function RectangularPool({
  largo,
  ancho,
  profundidad,
  espesorMuroCm,
  espesorFondoCm,
  materialMuros,
  materialFondo,
}: {
  largo: number | null;
  ancho: number | null;
  profundidad: number | null;
  // `undefined` (no `null`) marca el estado "medidas": el espesor todavía
  // no es una pregunta visible en este paso, a diferencia de "estructura"
  // donde `null` significa "pregunta visible, aún sin responder".
  espesorMuroCm: number | null | undefined;
  espesorFondoCm: number | null | undefined;
  // Fase C2 -- presentes (no undefined) SOLO en state="interior". `null`
  // ahí significa "aún no elegida" (Sin definir), igual criterio que los
  // espesores de Estructura.
  materialMuros?: InteriorMaterial | null;
  materialFondo?: InteriorMaterial | null;
}) {
  const showStructure = espesorMuroCm !== undefined;
  const isInterior = materialMuros !== undefined;
  const ratio = clamp(largo && ancho && largo > 0 && ancho > 0 ? largo / ancho : 2, MIN_RATIO, MAX_RATIO);
  const anchoVisual = Math.sqrt(BASE_FOOTPRINT_AREA / ratio);
  const largoVisual = Math.sqrt(BASE_FOOTPRINT_AREA * ratio);
  const avgHorizontal = (largoVisual + anchoVisual) / 2;

  // Fase C2 -- en "interior" el pill MURO/FONDO muestra la terminación
  // elegida (Pintura/Cerámica/Membrana/Sin calcular), no el espesor en cm
  // (ese ya se vio en el paso Estructura) -- mismo objeto {text,hasValue}
  // que formatEspesor, así el resto del render no necesita ramas nuevas.
  const espesorMuroHasValue = espesorMuroCm !== null && espesorMuroCm !== undefined;
  const espesorFondoHasValue = espesorFondoCm !== null && espesorFondoCm !== undefined;
  const muro = isInterior ? formatMaterial(materialMuros ?? null) : formatEspesor(espesorMuroCm ?? null);
  const fondo = isInterior ? formatMaterial(materialFondo ?? null) : formatEspesor(espesorFondoCm ?? null);
  const wallPx = showStructure ? (espesorMuroHasValue ? clamp(avgHorizontal * 0.035 + (espesorMuroCm ?? 0) * 0.6, MIN_WALL_PX, MAX_WALL_PX) : MIN_WALL_PX) : 0;
  const floorPx = showStructure ? (espesorFondoHasValue ? clamp((espesorFondoCm ?? 0) * 0.5, MIN_FLOOR_PX, MAX_FLOOR_PX) : MIN_FLOOR_PX) : 0;

  const depthRatio = profundidad && profundidad > 0 ? clamp(profundidad / Math.max(largo ?? 1, ancho ?? 1, 0.5), 0.18, 0.85) : 0.32;
  const depthPx = clamp(avgHorizontal * depthRatio, MIN_DEPTH_PX, MAX_DEPTH_PX);

  const P0 = { x: 190, y: 108 };
  const Pright = { x: P0.x + DIR_LARGO.x * largoVisual, y: P0.y + DIR_LARGO.y * largoVisual };
  const Pleft = { x: P0.x + DIR_ANCHO.x * anchoVisual, y: P0.y + DIR_ANCHO.y * anchoVisual };
  const Pback = { x: Pright.x + DIR_ANCHO.x * anchoVisual, y: Pright.y + DIR_ANCHO.y * anchoVisual };
  const P0b = { x: P0.x, y: P0.y + depthPx };
  const Prightb = { x: Pright.x, y: Pright.y + depthPx };
  const Pleftb = { x: Pleft.x, y: Pleft.y + depthPx };

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
  const waterRightFace = `${P0.x},${P0.y} ${Pright.x},${Pright.y} ${Prightb.x},${Prightb.y} ${P0b.x},${P0b.y}`;
  const waterLeftFace = `${P0.x},${P0.y} ${Pleft.x},${Pleft.y} ${Pleftb.x},${Pleftb.y} ${P0b.x},${P0b.y}`;

  const largoText = formatValue(largo, "m");
  let largoFontSize = 14;
  const largoLineHalfWidth = Math.max(largoVisual / 2, 34);
  const largoTextMaxWidth = largoLineHalfWidth * 2 - 16;
  if (approxTextWidth(largoText, largoFontSize) > largoTextMaxWidth) {
    largoFontSize = clamp((largoTextMaxWidth / approxTextWidth(largoText, largoFontSize)) * largoFontSize, 10, largoFontSize);
  }
  const bottomEdgeY = showStructure ? Math.max(oP0b.y, oPrightb.y) : Math.max(P0b.y, Prightb.y);
  const largoCotaY = bottomEdgeY + 30;
  const largoCotaCx = (P0.x + Pright.x) / 2;
  const largoPillWidth = Math.max(approxTextWidth(largoText, largoFontSize) + 18, 46);

  const anchoText = formatValue(ancho, "m");
  let anchoFontSize = 12;
  if (approxTextWidth(anchoText, anchoFontSize) > 84) {
    anchoFontSize = clamp((84 / approxTextWidth(anchoText, anchoFontSize)) * anchoFontSize, 9, anchoFontSize);
  }
  const anchoRefPoint = showStructure ? oPleft : Pleft;
  const anchoLabelX = anchoRefPoint.x - 12;
  const anchoLabelY = anchoRefPoint.y - 2;

  const profText = formatValue(profundidad, "m");
  const profFontSize = 11;
  const profLabelWidth = Math.max(approxTextWidth("PROF.", 8.5), approxTextWidth(profText, profFontSize)) + 16;
  const profPillX = 372 - profLabelWidth;
  const profPillY = 24;
  const profPillHeight = 36;
  const profAnchorX = Pright.x + (Pback.x - Pright.x) * 0.3;
  const profAnchorY = Pright.y + (Pback.y - Pright.y) * 0.3;

  const muroPillWidth = Math.max(approxTextWidth("MURO", 8.5), approxTextWidth(muro.text, 11)) + 16;
  const muroAnchor = { x: (Pleft.x + oPleft.x) / 2, y: (Pleft.y + oPleft.y) / 2 };
  const fondoPillWidth = Math.max(approxTextWidth("FONDO", 8.5), approxTextWidth(fondo.text, 11)) + 16;
  const fondoAnchor = { x: (oP0b.x + oPrightb.x) / 2, y: (oP0b.y + oPrightb.y) / 2 - floorPx / 2 };

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" className="w-full h-auto" role="img" aria-label="Ilustración de la piscina rectangular">
      {showStructure ? (
        <>
          {/* Losa de fondo (hormigón), extendida bajo los muros */}
          <polygon points={floorBottomPts} fill="#8F8A81" stroke="#6E6A62" strokeWidth="1" />
          {/* Muros exteriores (hormigón) */}
          <polygon points={outerLeftFace} fill="#A9A49B" />
          <polygon points={outerRightFace} fill="#8F8A81" />
          {/* Anillo superior = espesor de muro -- en "interior" (Fase C2)
              es la única cara claramente asociable a "muros" en esta
              perspectiva, así que se tiñe con la terminación de muros; en
              "estructura" sigue siendo el gris de hormigón de siempre. */}
          <path
            d={`M${outerTopPts.split(" ").join("L")}Z M${waterTopPts.split(" ").join("L")}Z`}
            fill={isInterior ? materialFill(materialMuros ?? null) : "#B9B4AC"}
            fillRule="evenodd"
            stroke="#8F8A81"
            strokeWidth="1"
          />
        </>
      ) : (
        <>
          {/* Estado "medidas": solo el vaso interior, sin muro/losa aún */}
          <polygon points={waterLeftFace} fill="#8FCBEF" opacity="0.55" />
          <polygon points={waterRightFace} fill="#7FB8DE" opacity="0.55" />
        </>
      )}
      {/* Espejo de agua = cara de FONDO -- en "interior" se tiñe con la
          terminación de fondo elegida; en los otros 2 estados sigue el
          celeste de agua de siempre. */}
      <polygon points={waterTopPts} fill={isInterior ? materialFill(materialFondo ?? null) : "#BEE3F8"} stroke="#7FB8DE" strokeWidth="1" />

      <g stroke="#002152" strokeWidth="1.5" fill="none">
        <line x1={anchoRefPoint.x - 4} y1={anchoRefPoint.y + 4} x2={Pleft.x + 4} y2={Pleft.y - 4} markerStart="url(#poolcfg-arrow-navy-start)" markerEnd="url(#poolcfg-arrow-navy-end)" />
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
        markerStart="url(#poolcfg-arrow-navy-start)"
        markerEnd="url(#poolcfg-arrow-navy-end)"
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
        markerStart="url(#poolcfg-arrow-navy-start)"
        markerEnd="url(#poolcfg-arrow-navy-end)"
      />
      <rect x={profPillX} y={profPillY} width={profLabelWidth} height={profPillHeight} rx={profPillHeight / 2} fill="#F9F9F9" />
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 14} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
        PROF.
      </text>
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 27} textAnchor="middle" fontSize={profFontSize} fontWeight="700" fill="#002152" className="font-display">
        {profText}
      </text>

      {showStructure && (
        <>
          <line x1={muroAnchor.x} y1={muroAnchor.y} x2={8 + muroPillWidth / 2} y2={228} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity={muro.hasValue ? 0.75 : 0.4} />
          <rect x={8} y={220} width={muroPillWidth} height="36" rx="18" fill="#FFE4D6" />
          <text x={8 + muroPillWidth / 2} y={234} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#E04500" className="font-display">
            MURO
          </text>
          <text x={8 + muroPillWidth / 2} y={248} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
            {muro.text}
          </text>

          <line x1={fondoAnchor.x} y1={fondoAnchor.y} x2={400 - 8 - fondoPillWidth / 2} y2={228} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity={fondo.hasValue ? 0.75 : 0.4} />
          <rect x={400 - fondoPillWidth - 8} y={220} width={fondoPillWidth} height="36" rx="18" fill="#FFE4D6" />
          <text x={400 - fondoPillWidth / 2 - 8} y={234} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#E04500" className="font-display">
            FONDO
          </text>
          <text x={400 - fondoPillWidth / 2 - 8} y={248} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
            {fondo.text}
          </text>
        </>
      )}

      {MARKERS}
    </svg>
  );
}

function CircularPool({
  diametro,
  profundidad,
  espesorMuroCm,
  espesorFondoCm,
  materialMuros,
  materialFondo,
}: {
  diametro: number | null;
  profundidad: number | null;
  espesorMuroCm: number | null | undefined;
  espesorFondoCm: number | null | undefined;
  materialMuros?: InteriorMaterial | null;
  materialFondo?: InteriorMaterial | null;
}) {
  const showStructure = espesorMuroCm !== undefined;
  const isInterior = materialMuros !== undefined;
  const cx = 200;
  const cy = 96;
  const innerRx = 92;
  const innerRy = 36;

  const espesorMuroHasValue = espesorMuroCm !== null && espesorMuroCm !== undefined;
  const espesorFondoHasValue = espesorFondoCm !== null && espesorFondoCm !== undefined;
  const muro = isInterior ? formatMaterial(materialMuros ?? null) : formatEspesor(espesorMuroCm ?? null);
  const fondo = isInterior ? formatMaterial(materialFondo ?? null) : formatEspesor(espesorFondoCm ?? null);
  const wallPx = showStructure ? (espesorMuroHasValue ? clamp(innerRx * 0.05 + (espesorMuroCm ?? 0) * 0.55, MIN_WALL_PX, MAX_WALL_PX) : MIN_WALL_PX) : 0;
  const floorPx = showStructure ? (espesorFondoHasValue ? clamp((espesorFondoCm ?? 0) * 0.5, MIN_FLOOR_PX, MAX_FLOOR_PX) : MIN_FLOOR_PX) : 0;

  const depthRatio = profundidad && diametro && diametro > 0 ? clamp(profundidad / diametro, 0.15, 0.85) : 0.35;
  const depthPx = clamp(innerRx * 1.05 * depthRatio, MIN_DEPTH_PX, MAX_DEPTH_PX);

  const outerRx = innerRx + wallPx;
  const outerRy = innerRy + wallPx * (innerRy / innerRx);
  const outerFloorRy = outerRy * 0.82;
  const outerFloorRx = outerRx * 0.82;
  const innerFloorRy = innerRy * 0.82;
  const outerFloorCy = cy + depthPx + floorPx;
  const innerFloorCy = cy + depthPx;

  const diametroText = formatValue(diametro, "m");
  const diametroPillWidth = Math.max(approxTextWidth(diametroText, 13) + 18, 58);

  const profText = formatValue(profundidad, "m");
  const profLabelWidth = Math.max(approxTextWidth("PROF.", 8.5), approxTextWidth(profText, 11)) + 16;
  const profPillX = 372 - profLabelWidth;
  const profPillY = 24;
  const profPillHeight = 36;

  const muroPillWidth = Math.max(approxTextWidth("MURO", 8.5), approxTextWidth(muro.text, 11)) + 16;
  const fondoPillWidth = Math.max(approxTextWidth("FONDO", 8.5), approxTextWidth(fondo.text, 11)) + 16;

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" className="w-full h-auto" role="img" aria-label="Ilustración de la piscina circular">
      {showStructure ? (
        <>
          <ellipse cx={cx} cy={outerFloorCy} rx={outerFloorRx} ry={outerFloorRy} fill="#8F8A81" stroke="#6E6A62" strokeWidth="1" />
          <path
            d={`M${cx - outerRx},${cy} A${outerRx},${outerRy} 0 0,1 ${cx + outerRx},${cy} L${cx + outerFloorRx},${outerFloorCy} A${outerFloorRx},${outerFloorRy} 0 0,0 ${cx - outerFloorRx},${outerFloorCy} Z`}
            fill="#A9A49B"
          />
          <path
            d={`M${cx - outerRx},${cy} A${outerRx},${outerRy} 0 1,0 ${cx + outerRx},${cy} A${outerRx},${outerRy} 0 1,0 ${cx - outerRx},${cy} Z M${cx - innerRx},${cy} A${innerRx},${innerRy} 0 1,0 ${cx + innerRx},${cy} A${innerRx},${innerRy} 0 1,0 ${cx - innerRx},${cy} Z`}
            fill={isInterior ? materialFill(materialMuros ?? null) : "#B9B4AC"}
            fillRule="evenodd"
            stroke="#8F8A81"
            strokeWidth="1"
          />
        </>
      ) : (
        <>
          {/* Estado "medidas": pared/fondo interior de agua tenue, sin estructura */}
          <ellipse cx={cx} cy={innerFloorCy} rx={innerRx * 0.82} ry={innerFloorRy} fill="#8FCBEF" opacity="0.4" />
          <path
            d={`M${cx - innerRx},${cy} A${innerRx},${innerRy} 0 0,1 ${cx + innerRx},${cy} L${cx + innerRx * 0.82},${innerFloorCy} A${innerRx * 0.82},${innerFloorRy} 0 0,0 ${cx - innerRx * 0.82},${innerFloorCy} Z`}
            fill="#7FB8DE"
            opacity="0.4"
          />
        </>
      )}
      <ellipse cx={cx} cy={cy} rx={innerRx} ry={innerRy} fill={isInterior ? materialFill(materialFondo ?? null) : "#BEE3F8"} stroke="#7FB8DE" strokeWidth="1" />

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
        markerStart="url(#poolcfg-arrow-navy-start)"
        markerEnd="url(#poolcfg-arrow-navy-end)"
      />

      <line
        x1={cx}
        y1={cy + innerRy * 0.5}
        x2={cx}
        y2={(showStructure ? outerFloorCy : innerFloorCy) - innerRy * 0.5}
        stroke="#002152"
        strokeWidth="1.1"
        strokeDasharray="3 3"
        opacity="0.55"
        markerStart="url(#poolcfg-arrow-navy-start)"
        markerEnd="url(#poolcfg-arrow-navy-end)"
      />
      <rect x={profPillX} y={profPillY} width={profLabelWidth} height={profPillHeight} rx={profPillHeight / 2} fill="#F9F9F9" />
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 14} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
        PROF.
      </text>
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 27} textAnchor="middle" fontSize="11" fontWeight="700" fill="#002152" className="font-display">
        {profText}
      </text>

      {showStructure && (
        <>
          <line x1={cx - innerRx} y1={cy + 2} x2={10 + muroPillWidth / 2} y2={cy + 18} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity={muro.hasValue ? 0.75 : 0.4} />
          <rect x={10} y={cy - 6} width={muroPillWidth} height="36" rx="18" fill="#FFE4D6" />
          <text x={10 + muroPillWidth / 2} y={cy + 8} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#E04500" className="font-display">
            MURO
          </text>
          <text x={10 + muroPillWidth / 2} y={cy + 22} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
            {muro.text}
          </text>

          <line x1={cx} y1={outerFloorCy - outerFloorRy * 0.3} x2={cx - fondoPillWidth / 2 + fondoPillWidth / 2} y2={Math.min(outerFloorCy + 30, 220)} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity={fondo.hasValue ? 0.75 : 0.4} />
          <rect x={cx - fondoPillWidth / 2} y={Math.min(outerFloorCy + 30, 220)} width={fondoPillWidth} height="36" rx="18" fill="#FFE4D6" />
          <text x={cx} y={Math.min(outerFloorCy + 30, 220) + 14} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#E04500" className="font-display">
            FONDO
          </text>
          <text x={cx} y={Math.min(outerFloorCy + 30, 220) + 28} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
            {fondo.text}
          </text>
        </>
      )}

      {MARKERS}
    </svg>
  );
}

export function PoolConfiguratorIllustration(props: PoolConfiguratorIllustrationProps) {
  const espesorMuroCm = props.state === "estructura" || props.state === "interior" ? props.espesorMuroCm : undefined;
  const espesorFondoCm = props.state === "estructura" || props.state === "interior" ? props.espesorFondoCm : undefined;
  const materialMuros = props.state === "interior" ? props.materialMuros : undefined;
  const materialFondo = props.state === "interior" ? props.materialFondo : undefined;

  return (
    <div>
      {props.shape === "rectangular" ? (
        <RectangularPool
          largo={props.largo}
          ancho={props.ancho}
          profundidad={props.profundidad}
          espesorMuroCm={espesorMuroCm}
          espesorFondoCm={espesorFondoCm}
          materialMuros={materialMuros}
          materialFondo={materialFondo}
        />
      ) : (
        <CircularPool
          diametro={props.diametro}
          profundidad={props.profundidad}
          espesorMuroCm={espesorMuroCm}
          espesorFondoCm={espesorFondoCm}
          materialMuros={materialMuros}
          materialFondo={materialFondo}
        />
      )}
      <Note />
    </div>
  );
}
