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
//   - "excavation" (Fase C3, 2026-09-01): MISMA geometria de muro/losa que
//     "estructura" (espesores reales, sin material) más un bloque de
//     terreno de fondo y un límite de excavación punteado, desplazado
//     hacia afuera del muro exterior por el espacio de trabajo (mismo
//     truco de offset en píxeles que ya usa `wallPx` para el espesor de
//     muro). Los pills pasan a mostrar las dimensiones del HOYO (ya
//     calculadas por Formula, se reciben como props -- este componente no
//     recalcula geometría) en vez de las medidas interiores/espesores,
//     que en este estado no son el dato relevante (ver sección 20 del
//     pedido C3).
//
// Mismo criterio de "Sin definir" vs "0" que PoolStructureIllustration:
// un espesor nunca respondido se muestra sin cifra (nunca se inventa un
// valor), 0 tipeado se muestra literal.
export type InteriorMaterial = "pintura" | "ceramica" | "membrana" | "sin-calcular";

// Fase C4 -- terminaciones de ENTORNO/BORDE, catálogo propio (distinto de
// InteriorMaterial: acá no hay "pintura"/"membrana", y "radier" es un
// caso especial que absorbe la base -- ver `PoolEnvironmentStep` y el
// db-fix C4 para la lógica anti doble conteo).
export type EnvironmentMaterial = "ceramica" | "porcelanato" | "pastelones" | "radier" | "sin-calcular";

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
    }
  | {
      state: "excavation";
      shape: "rectangular";
      largo: number | null;
      ancho: number | null;
      profundidad: number | null;
      espesorMuroCm: number | null;
      espesorFondoCm: number | null;
      espacioTrabajoCm: number | null;
      largoHoyo: number | null;
      anchoHoyo: number | null;
      profHoyo: number | null;
    }
  | {
      state: "excavation";
      shape: "circular";
      diametro: number | null;
      profundidad: number | null;
      espesorMuroCm: number | null;
      espesorFondoCm: number | null;
      espacioTrabajoCm: number | null;
      diametroHoyo: number | null;
      profHoyo: number | null;
    }
  | {
      state: "environment";
      shape: "rectangular";
      largo: number | null;
      ancho: number | null;
      profundidad: number | null;
      espesorMuroCm: number | null;
      espesorFondoCm: number | null;
      anchoEntornoM: number | null;
      areaEntorno: number | null;
      terminacion: EnvironmentMaterial | null;
      // `null` = base nueva sin espesor aún tipeado; `undefined` = no
      // corresponde mostrar base (ya existe, o terminación=radier absorbe
      // el espesor en `espesorBaseCm` igual -- ver comentario en
      // RectangularPool/CircularPool sobre por qué es la MISMA prop para
      // ambos casos).
      espesorBaseCm: number | null | undefined;
    }
  | {
      state: "environment";
      shape: "circular";
      diametro: number | null;
      profundidad: number | null;
      espesorMuroCm: number | null;
      espesorFondoCm: number | null;
      anchoEntornoM: number | null;
      areaEntorno: number | null;
      terminacion: EnvironmentMaterial | null;
      espesorBaseCm: number | null | undefined;
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

// Fase C4 -- nombre corto para el pill de terminación de entorno.
const ENVIRONMENT_MATERIAL_LABELS: Record<EnvironmentMaterial, string> = {
  ceramica: "Cerámica",
  porcelanato: "Porcelanato",
  pastelones: "Pastelones",
  radier: "Radier terminado",
  "sin-calcular": "Sin calcular",
};

function formatEnvironmentMaterial(value: EnvironmentMaterial | null): { text: string; hasValue: boolean } {
  if (value === null) return { text: "Sin definir", hasValue: false };
  return { text: ENVIRONMENT_MATERIAL_LABELS[value], hasValue: true };
}

// Fase C4 -- relleno visual por terminación de ENTORNO, catálogo propio de
// `materialFill` (distinta paleta/patrones porque son materiales
// distintos): cerámica reutiliza el mismo patrón de grilla fina que
// Interior (mismo material real), porcelanato usa una grilla más grande
// (piezas más grandes que la cerámica), pastelones usa un patrón con
// módulos bien visibles (imita las piezas grandes reales), radier
// terminado es hormigón sólido (mismo tono que la losa, para que se lea
// como "concreto ya terminado") y sin calcular cae al gris neutro de
// siempre.
function environmentMaterialFill(value: EnvironmentMaterial | null): string {
  switch (value) {
    case "ceramica":
      return "url(#poolcfg-mat-ceramica)";
    case "porcelanato":
      return "url(#poolcfg-mat-porcelanato)";
    case "pastelones":
      return "url(#poolcfg-mat-pastelones)";
    case "radier":
      return "#ACA79E";
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
    {/* Fase C4 -- patrones de terminación de ENTORNO. Porcelanato = grilla
        más grande que la cerámica (piezas mayores, mismo criterio real);
        pastelones = módulos bien marcados con junta ancha (se ven como
        piezas individuales, no como una grilla fina). */}
    <pattern id="poolcfg-mat-porcelanato" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#E7E2D6" />
      <rect x="0.6" y="0.6" width="14.8" height="14.8" fill="none" stroke="#B7AE99" strokeWidth="1.2" />
    </pattern>
    <pattern id="poolcfg-mat-pastelones" width="18" height="18" patternUnits="userSpaceOnUse">
      <rect width="18" height="18" fill="#D7CDBB" />
      <rect x="1.5" y="1.5" width="15" height="15" fill="#C9BEA8" stroke="#A8977C" strokeWidth="1.5" />
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
  excavation,
  environment,
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
  // Fase C3 -- presente (no undefined) SOLO en state="excavation". Las
  // dimensiones del hoyo YA vienen calculadas por Formula (este
  // componente no las recalcula, solo las muestra) -- geometría de
  // muro/losa sigue siendo la real de Estructura, sin cambios.
  excavation?: {
    espacioTrabajoCm: number | null;
    largoHoyo: number | null;
    anchoHoyo: number | null;
    profHoyo: number | null;
  };
  // Fase C4 -- presente (no undefined) SOLO en state="environment". El
  // área ya viene calculada por Formula (mismo criterio que `excavation`
  // con las dimensiones del hoyo) -- este componente NUNCA recalcula
  // geometría, solo la dibuja.
  environment?: {
    anchoEntornoM: number | null;
    areaEntorno: number | null;
    terminacion: EnvironmentMaterial | null;
    espesorBaseCm: number | null | undefined;
  };
}) {
  const showStructure = espesorMuroCm !== undefined;
  const isInterior = materialMuros !== undefined;
  const isExcavation = excavation !== undefined;
  const isEnvironment = environment !== undefined;
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

  // Fase C3 -- límite de excavación: mismo truco de offset en píxeles que
  // ya usa `wallPx`/`outerLargo`/`outerAncho` para el espesor de muro,
  // aplicado una vez más sobre el borde EXTERIOR del muro (no sobre el
  // vaso interior) para representar el espacio de trabajo.
  const workPx = isExcavation
    ? clamp(avgHorizontal * 0.05 + (excavation!.espacioTrabajoCm ?? 0) * 0.55, 14, 46)
    : 0;
  const excavLargo = outerLargo + workPx * 2;
  const excavAncho = outerAncho + workPx * 2;
  const excavP0 = {
    x: center.x - (DIR_LARGO.x * excavLargo + DIR_ANCHO.x * excavAncho) / 2,
    y: center.y - (DIR_LARGO.y * excavLargo + DIR_ANCHO.y * excavAncho) / 2,
  };
  const excavPright = { x: excavP0.x + DIR_LARGO.x * excavLargo, y: excavP0.y + DIR_LARGO.y * excavLargo };
  const excavPleft = { x: excavP0.x + DIR_ANCHO.x * excavAncho, y: excavP0.y + DIR_ANCHO.y * excavAncho };
  const excavPback = { x: excavPright.x + DIR_ANCHO.x * excavAncho, y: excavPright.y + DIR_ANCHO.y * excavAncho };
  const excavTopPts = `${excavP0.x},${excavP0.y} ${excavPright.x},${excavPright.y} ${excavPback.x},${excavPback.y} ${excavPleft.x},${excavPleft.y}`;
  const trabajoText = formatValue(excavation?.espacioTrabajoCm !== undefined && excavation?.espacioTrabajoCm !== null ? excavation.espacioTrabajoCm / 100 : null, "m");
  const trabajoPillWidth = Math.max(approxTextWidth("TRABAJO", 8), approxTextWidth(trabajoText, 10.5)) + 16;
  const trabajoAnchor = { x: (excavPleft.x + oPleft.x) / 2, y: (excavPleft.y + oPleft.y) / 2 };

  // Fase C4 -- anillo de ENTORNO: mismo truco de offset en píxeles que ya
  // usa `workPx`/`excavLargo` para el límite de excavación, aplicado
  // sobre la cara EXTERIOR del muro (nunca sobre el vaso interior --
  // sección 4 del pedido C4: el entorno arranca de `outerLargo`/
  // `outerAncho`, no de `largoVisual`/`anchoVisual`). `anchoEntornoM`
  // viene en METROS (a diferencia del espacio de trabajo de Excavación
  // que es en cm), así que la escala px/m es propia de este bloque.
  const envPx = isEnvironment ? clamp((environment!.anchoEntornoM ?? 0) * 26, 14, 60) : 0;
  const envLargo = outerLargo + envPx * 2;
  const envAncho = outerAncho + envPx * 2;
  const envP0 = {
    x: center.x - (DIR_LARGO.x * envLargo + DIR_ANCHO.x * envAncho) / 2,
    y: center.y - (DIR_LARGO.y * envLargo + DIR_ANCHO.y * envAncho) / 2,
  };
  const envPright = { x: envP0.x + DIR_LARGO.x * envLargo, y: envP0.y + DIR_LARGO.y * envLargo };
  const envPleft = { x: envP0.x + DIR_ANCHO.x * envAncho, y: envP0.y + DIR_ANCHO.y * envAncho };
  const envPback = { x: envPright.x + DIR_ANCHO.x * envAncho, y: envPright.y + DIR_ANCHO.y * envAncho };
  const envTopPts = `${envP0.x},${envP0.y} ${envPright.x},${envPright.y} ${envPback.x},${envPback.y} ${envPleft.x},${envPleft.y}`;

  const envTerminacion = isEnvironment ? formatEnvironmentMaterial(environment!.terminacion ?? null) : { text: "", hasValue: false };
  const envAnchoText = formatValue(environment?.anchoEntornoM ?? null, "m");
  const envAnchoPillWidth = Math.max(approxTextWidth("ANCHO ENTORNO", 7.5), approxTextWidth(envAnchoText, 11)) + 16;
  const envAnchoAnchor = { x: (envPleft.x + oPleft.x) / 2, y: (envPleft.y + oPleft.y) / 2 };

  const envAreaText = formatValue(environment?.areaEntorno ?? null, "m²");
  const envAreaPillWidth = Math.max(approxTextWidth(envTerminacion.text, 10.5), approxTextWidth(envAreaText, 11)) + 16;

  // Fase C4 -- pill "BASE" solo cuando corresponde mostrar un espesor
  // (base nueva propia, o radier terminado que absorbe la base -- ver
  // tipo `espesorBaseCm` en las props). `undefined` = base existente, no
  // se muestra nada (sección 17/28 del pedido: nunca inventar un espesor
  // que el usuario no tipeó ni que no aplica).
  const showEnvBase = isEnvironment && environment!.espesorBaseCm !== undefined;
  const envBaseText = showEnvBase ? formatEspesor(environment!.espesorBaseCm ?? null) : { text: "", hasValue: false };
  const envBasePillWidth = Math.max(approxTextWidth("BASE", 8.5), approxTextWidth(envBaseText.text, 10.5)) + 16;

  const largoText = isExcavation ? formatValue(excavation!.largoHoyo, "m") : formatValue(largo, "m");
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

  const anchoText = isExcavation ? formatValue(excavation!.anchoHoyo, "m") : formatValue(ancho, "m");
  let anchoFontSize = 12;
  if (approxTextWidth(anchoText, anchoFontSize) > 84) {
    anchoFontSize = clamp((84 / approxTextWidth(anchoText, anchoFontSize)) * anchoFontSize, 9, anchoFontSize);
  }
  const anchoRefPoint = isExcavation ? excavPleft : showStructure ? oPleft : Pleft;
  // Fase C4.2 -- fix de clipping: en "excavation" el punto de referencia
  // (excavPleft) se desplaza hacia afuera por el espacio de trabajo y
  // puede quedar muy cerca del borde izquierdo del viewBox (0-400). Como
  // el label usa textAnchor="end" (el texto crece hacia la IZQUIERDA
  // desde este X), "ANCHO HOYO" (más largo que "ANCHO") se salía del
  // viewBox y quedaba cortado -- confirmado en desktop y mobile (ver
  // auditoría global post-C4). Se acota anchoLabelX a un mínimo que
  // garantice espacio suficiente para el label MÁS LARGO posible en este
  // estado, sin tocar la cota/geometría real (excavPleft/oPleft/Pleft
  // siguen siendo los mismos puntos, esto solo mueve dónde se ANCLA el
  // texto cuando el punto real queda demasiado a la izquierda).
  const anchoLabelText = isExcavation ? "ANCHO HOYO" : "ANCHO";
  const anchoLabelMinX = approxTextWidth(anchoLabelText, 9) + 20;
  const anchoLabelX = Math.max(anchoRefPoint.x - 12, anchoLabelMinX);
  const anchoLabelY = anchoRefPoint.y - 2;

  const profText = isExcavation ? formatValue(excavation!.profHoyo, "m") : formatValue(profundidad, "m");
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
      {isExcavation && (
        <>
          {/* Fase C3 -- bloque de terreno de fondo + límite de excavación
              punteado (offset del muro exterior por el espacio de
              trabajo). Da el contexto "PISCINA -> MURO -> ESPACIO DE
              TRABAJO -> LÍMITE DE EXCAVACIÓN" pedido -- el vaso y el muro
              son exactamente los mismos que en "estructura". */}
          <rect x="0" y="0" width="400" height="260" fill="#E4D9C4" />
          <polygon points={excavTopPts} fill="#D8C9A8" stroke="#B99B5C" strokeWidth="1.5" strokeDasharray="5 4" />
        </>
      )}
      {isEnvironment && (
        // Fase C4 -- anillo de entorno: mismo truco evenodd que el anillo
        // de muro (outerTopPts/waterTopPts), pero entre el borde exterior
        // del muro (outerTopPts) y el nuevo límite de entorno (envTopPts)
        // -- así el anillo se ve exactamente donde arranca (sección 4:
        // desde la cara exterior del vaso, nunca desde el agua).
        <path
          d={`M${envTopPts.split(" ").join("L")}Z M${outerTopPts.split(" ").join("L")}Z`}
          fill={environmentMaterialFill(environment!.terminacion ?? null)}
          fillRule="evenodd"
          stroke="#8F8A81"
          strokeWidth="1"
        />
      )}
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
        {isExcavation ? "ANCHO HOYO" : "ANCHO"}
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
        {isExcavation ? "LARGO HOYO" : "LARGO"}
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
        {isExcavation ? "PROF. HOYO" : "PROF."}
      </text>
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 27} textAnchor="middle" fontSize={profFontSize} fontWeight="700" fill="#002152" className="font-display">
        {profText}
      </text>

      {/* Fase C3 -- en "excavation" los pills MURO/FONDO no aportan (ver
          sección 20 del pedido: no saturar con muro/losa/interior en este
          estado); en su lugar, un único pill "TRABAJO" con el espacio de
          trabajo alrededor del vaso. */}
      {showStructure && !isExcavation && !isEnvironment && (
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
      {isExcavation && (
        <>
          <line x1={trabajoAnchor.x} y1={trabajoAnchor.y} x2={8 + trabajoPillWidth / 2} y2={228} stroke="#B99B5C" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.85" />
          <rect x={8} y={220} width={trabajoPillWidth} height="36" rx="18" fill="#F1E9D8" />
          <text x={8 + trabajoPillWidth / 2} y={234} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#8A6D2F" className="font-display">
            TRABAJO
          </text>
          <text x={8 + trabajoPillWidth / 2} y={248} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#8A6D2F" className="font-display">
            {trabajoText}
          </text>
        </>
      )}
      {/* Fase C4 -- pills de ENTORNO: ANCHO ENTORNO (izquierda) + ÁREA
          ENTORNO/terminación (derecha), igual patrón visual que
          MURO/FONDO pero con estos 2 (o 3, si hay base nueva/radier)
          datos -- las cotas de Excavación no aparecen acá (sección 22:
          no saturar con cotas de otro paso). */}
      {isEnvironment && (
        <>
          <line x1={envAnchoAnchor.x} y1={envAnchoAnchor.y} x2={8 + envAnchoPillWidth / 2} y2={228} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.75" />
          <rect x={8} y={220} width={envAnchoPillWidth} height="36" rx="18" fill="#FFE4D6" />
          <text x={8 + envAnchoPillWidth / 2} y={234} textAnchor="middle" fontSize="7.5" fontWeight="700" letterSpacing="0.03em" fill="#E04500" className="font-display">
            ANCHO ENTORNO
          </text>
          <text x={8 + envAnchoPillWidth / 2} y={248} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
            {envAnchoText}
          </text>

          <line x1={(envPback.x + oPback.x) / 2} y1={(envPback.y + oPback.y) / 2} x2={400 - 8 - envAreaPillWidth / 2} y2={228} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.75" />
          <rect x={400 - envAreaPillWidth - 8} y={220} width={envAreaPillWidth} height="36" rx="18" fill="#FFE4D6" />
          <text x={400 - envAreaPillWidth / 2 - 8} y={234} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
            {envAreaText}
          </text>
          <text x={400 - envAreaPillWidth / 2 - 8} y={247} textAnchor="middle" fontSize="7.5" fontWeight="700" letterSpacing="0.02em" fill="#E04500" className="font-display">
            {envTerminacion.text}
          </text>

          {showEnvBase && (
            <>
              <rect x={200 - envBasePillWidth / 2} y={4} width={envBasePillWidth} height="36" rx="18" fill="#F9F9F9" />
              <text x={200} y={18} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
                BASE
              </text>
              <text x={200} y={31} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#002152" className="font-display">
                {envBaseText.text}
              </text>
            </>
          )}
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
  excavation,
  environment,
}: {
  diametro: number | null;
  profundidad: number | null;
  espesorMuroCm: number | null | undefined;
  espesorFondoCm: number | null | undefined;
  materialMuros?: InteriorMaterial | null;
  materialFondo?: InteriorMaterial | null;
  excavation?: {
    espacioTrabajoCm: number | null;
    diametroHoyo: number | null;
    profHoyo: number | null;
  };
  environment?: {
    anchoEntornoM: number | null;
    areaEntorno: number | null;
    terminacion: EnvironmentMaterial | null;
    espesorBaseCm: number | null | undefined;
  };
}) {
  const showStructure = espesorMuroCm !== undefined;
  const isInterior = materialMuros !== undefined;
  const isExcavation = excavation !== undefined;
  const isEnvironment = environment !== undefined;
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

  const diametroText = isExcavation ? formatValue(excavation!.diametroHoyo, "m") : formatValue(diametro, "m");
  const diametroPillWidth = Math.max(approxTextWidth(diametroText, 13) + 18, 58);

  const profText = isExcavation ? formatValue(excavation!.profHoyo, "m") : formatValue(profundidad, "m");
  const profLabelWidth = Math.max(approxTextWidth("PROF.", 8.5), approxTextWidth(profText, 11)) + 16;
  const profPillX = 372 - profLabelWidth;
  const profPillY = 24;
  const profPillHeight = 36;

  const muroPillWidth = Math.max(approxTextWidth("MURO", 8.5), approxTextWidth(muro.text, 11)) + 16;
  const fondoPillWidth = Math.max(approxTextWidth("FONDO", 8.5), approxTextWidth(fondo.text, 11)) + 16;

  // Fase C3 -- límite de excavación circular: anillo exterior offset del
  // muro exterior por el espacio de trabajo (mismo criterio de offset en
  // píxeles que `wallPx`).
  const workPx = isExcavation ? clamp(innerRx * 0.06 + (excavation!.espacioTrabajoCm ?? 0) * 0.5, 14, 46) : 0;
  const excavRx = outerRx + workPx;
  const excavRy = outerRy + workPx * (innerRy / innerRx);
  const trabajoText = formatValue(
    excavation?.espacioTrabajoCm !== undefined && excavation?.espacioTrabajoCm !== null ? excavation.espacioTrabajoCm / 100 : null,
    "m"
  );
  const trabajoPillWidth = Math.max(approxTextWidth("TRABAJO", 8), approxTextWidth(trabajoText, 10.5)) + 16;

  // Fase C4 -- anillo de entorno circular: offset del muro exterior
  // (outerRx/outerRy), NUNCA del vaso interior, igual criterio que la
  // versión rectangular. `anchoEntornoM` en metros, escala propia.
  const envPx = isEnvironment ? clamp((environment!.anchoEntornoM ?? 0) * 26, 14, 60) : 0;
  const envRx = outerRx + envPx;
  const envRy = outerRy + envPx * (innerRy / innerRx);
  const envTerminacion = isEnvironment ? formatEnvironmentMaterial(environment!.terminacion ?? null) : { text: "", hasValue: false };
  const envAnchoText = formatValue(environment?.anchoEntornoM ?? null, "m");
  const envAnchoPillWidth = Math.max(approxTextWidth("ANCHO ENTORNO", 7.5), approxTextWidth(envAnchoText, 11)) + 16;
  const envAreaText = formatValue(environment?.areaEntorno ?? null, "m²");
  const envAreaPillWidth = Math.max(approxTextWidth(envTerminacion.text, 10.5), approxTextWidth(envAreaText, 11)) + 16;
  const showEnvBase = isEnvironment && environment!.espesorBaseCm !== undefined;
  const envBaseText = showEnvBase ? formatEspesor(environment!.espesorBaseCm ?? null) : { text: "", hasValue: false };
  const envBasePillWidth = Math.max(approxTextWidth("BASE", 8.5), approxTextWidth(envBaseText.text, 10.5)) + 16;

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" className="w-full h-auto" role="img" aria-label="Ilustración de la piscina circular">
      {isExcavation && (
        <>
          <rect x="0" y="0" width="400" height="260" fill="#E4D9C4" />
          <ellipse cx={cx} cy={cy} rx={excavRx} ry={excavRy} fill="#D8C9A8" stroke="#B99B5C" strokeWidth="1.5" strokeDasharray="5 4" />
        </>
      )}
      {isEnvironment && (
        <path
          d={`M${cx - envRx},${cy} A${envRx},${envRy} 0 1,0 ${cx + envRx},${cy} A${envRx},${envRy} 0 1,0 ${cx - envRx},${cy} Z M${cx - outerRx},${cy} A${outerRx},${outerRy} 0 1,0 ${cx + outerRx},${cy} A${outerRx},${outerRy} 0 1,0 ${cx - outerRx},${cy} Z`}
          fill={environmentMaterialFill(environment!.terminacion ?? null)}
          fillRule="evenodd"
          stroke="#8F8A81"
          strokeWidth="1"
        />
      )}
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
        {isExcavation ? "DIÁMETRO HOYO" : "DIÁMETRO"}
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
        {isExcavation ? "PROF. HOYO" : "PROF."}
      </text>
      <text x={profPillX + profLabelWidth / 2} y={profPillY + 27} textAnchor="middle" fontSize="11" fontWeight="700" fill="#002152" className="font-display">
        {profText}
      </text>

      {showStructure && !isExcavation && !isEnvironment && (
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
      {isExcavation && (
        <>
          <line x1={cx - innerRx} y1={cy + 2} x2={10 + trabajoPillWidth / 2} y2={cy + 18} stroke="#B99B5C" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.85" />
          <rect x={10} y={cy - 6} width={trabajoPillWidth} height="36" rx="18" fill="#F1E9D8" />
          <text x={10 + trabajoPillWidth / 2} y={cy + 8} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#8A6D2F" className="font-display">
            TRABAJO
          </text>
          <text x={10 + trabajoPillWidth / 2} y={cy + 22} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#8A6D2F" className="font-display">
            {trabajoText}
          </text>
        </>
      )}
      {isEnvironment && (
        <>
          <line x1={cx - innerRx} y1={cy + 2} x2={10 + envAnchoPillWidth / 2} y2={cy + 18} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.75" />
          <rect x={10} y={cy - 6} width={envAnchoPillWidth} height="36" rx="18" fill="#FFE4D6" />
          <text x={10 + envAnchoPillWidth / 2} y={cy + 8} textAnchor="middle" fontSize="7.5" fontWeight="700" letterSpacing="0.03em" fill="#E04500" className="font-display">
            ANCHO ENTORNO
          </text>
          <text x={10 + envAnchoPillWidth / 2} y={cy + 22} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
            {envAnchoText}
          </text>

          <line x1={cx + innerRx} y1={cy + 2} x2={400 - 10 - envAreaPillWidth / 2} y2={cy + 18} stroke="#FF4E00" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.75" />
          <rect x={400 - envAreaPillWidth - 10} y={cy - 6} width={envAreaPillWidth} height="36" rx="18" fill="#FFE4D6" />
          <text x={400 - envAreaPillWidth / 2 - 10} y={cy + 8} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#E04500" className="font-display">
            {envAreaText}
          </text>
          <text x={400 - envAreaPillWidth / 2 - 10} y={cy + 21} textAnchor="middle" fontSize="7.5" fontWeight="700" letterSpacing="0.02em" fill="#E04500" className="font-display">
            {envTerminacion.text}
          </text>

          {showEnvBase && (
            <>
              <rect x={cx - envBasePillWidth / 2} y={4} width={envBasePillWidth} height="36" rx="18" fill="#F9F9F9" />
              <text x={cx} y={18} textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" fill="#5E5850" className="font-display">
                BASE
              </text>
              <text x={cx} y={31} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#002152" className="font-display">
                {envBaseText.text}
              </text>
            </>
          )}
        </>
      )}

      {MARKERS}
    </svg>
  );
}

export function PoolConfiguratorIllustration(props: PoolConfiguratorIllustrationProps) {
  const espesorMuroCm =
    props.state === "estructura" || props.state === "interior" || props.state === "excavation" || props.state === "environment"
      ? props.espesorMuroCm
      : undefined;
  const espesorFondoCm =
    props.state === "estructura" || props.state === "interior" || props.state === "excavation" || props.state === "environment"
      ? props.espesorFondoCm
      : undefined;
  const materialMuros = props.state === "interior" ? props.materialMuros : undefined;
  const materialFondo = props.state === "interior" ? props.materialFondo : undefined;
  const excavationRect =
    props.state === "excavation" && props.shape === "rectangular"
      ? { espacioTrabajoCm: props.espacioTrabajoCm, largoHoyo: props.largoHoyo, anchoHoyo: props.anchoHoyo, profHoyo: props.profHoyo }
      : undefined;
  const excavationCirc =
    props.state === "excavation" && props.shape === "circular"
      ? { espacioTrabajoCm: props.espacioTrabajoCm, diametroHoyo: props.diametroHoyo, profHoyo: props.profHoyo }
      : undefined;
  const environment =
    props.state === "environment"
      ? {
          anchoEntornoM: props.anchoEntornoM,
          areaEntorno: props.areaEntorno,
          terminacion: props.terminacion,
          espesorBaseCm: props.espesorBaseCm,
        }
      : undefined;

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
          excavation={excavationRect}
          environment={environment}
        />
      ) : (
        <CircularPool
          diametro={props.diametro}
          profundidad={props.profundidad}
          espesorMuroCm={espesorMuroCm}
          espesorFondoCm={espesorFondoCm}
          materialMuros={materialMuros}
          materialFondo={materialFondo}
          excavation={excavationCirc}
          environment={environment}
        />
      )}
      <Note />
    </div>
  );
}
