// Tema visual — el ÚNICO lugar de todo Diagram System V2 con colores,
// grosores de línea y tipografías. Cambiar el tema nunca debería tocar
// math/ ni layout/.
//
// Los 3 tonos de azul (luz desde arriba) están DERIVADOS del navy de
// marca de ObraBien (#002152, ver tailwind.config.ts) — el PDF de Claude
// Design no trae valores hex explícitos, así que esto es un punto de
// partida a ajustar por comparación visual en la Fase 0 (aprobado
// explícitamente, conversación 2026-08-01: "derives los tonos de azul
// desde la identidad visual de ObraBien y los ajustes durante la
// comparación visual").

export const BRAND_NAVY = "#002152";
export const BRAND_ORANGE = "#FF4E00";

export const theme = {
  stroke: {
    solid: BRAND_NAVY,
    width: 1.8, // grosor exacto pedido por la especificación
    lane: "#9AA7BD", // gris-azulado neutro para carriles/líneas de referencia
    laneWidth: 1,
  },
  fill: {
    // 3 tonos del mismo azul — cara superior más clara (más luz), pared
    // "largo" tono medio, pared "ancho" más oscura (menos luz relativa).
    top: "#E3E9F4",
    wallRight: "#B7C4DC",
    wallLeft: "#8EA0C4",
  },
  dimension: {
    active: BRAND_ORANGE, // SOLO la cota que se está escribiendo ahora mismo
    inactive: "#5B6B7A", // el resto — neutro, no compite con el sólido
  },
  chip: {
    bg: "#FFFFFF",
    labelColor: "#5B6B7A",
    valueColor: BRAND_NAVY,
    valueColorActive: BRAND_ORANGE,
    fontLabel: "var(--font-body)", // Figtree — ya es la fuente de marca de ObraBien
    fontValue: "var(--font-mono)", // IBM Plex Mono — ídem
  },
} as const;
