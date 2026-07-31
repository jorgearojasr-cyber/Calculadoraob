// Tema visual — el ÚNICO lugar de todo Diagram System V2 con colores,
// grosores de línea y tipografías. Cambiar el tema nunca debería tocar
// math/ ni layout/.
//
// Calibrado 2026-08-02 contra el PDF real (convertido a PNG con
// poppler, ver conversación) — antes eran valores derivados a ojo del
// navy de marca sin ver los píxeles del mockup; esa pasada SÍ comparó
// contra la imagen real, caso por caso (ver informe de Fase 0 v2).
//
// Segunda pasada de calibración 2026-08-02 (ya con Excavación/Radier
// reales integrados, ver conversación) — arquitectura y API congeladas,
// SOLO se tocan valores acá y en dimension-chip.tsx: más contraste entre
// las 3 caras (el sólido se lee antes que las cotas), líneas auxiliares
// todavía más suaves, chips más chicos y compactos.

export const BRAND_NAVY = "#002152";
export const BRAND_ORANGE = "#FF4E00";

export const theme = {
  stroke: {
    solid: "#0B2A52", // levemente más suave que el navy puro de marca — así se lee en el mockup
    width: 1.8, // grosor exacto pedido por la especificación
    // Carriles/líneas de referencia: bajados un peldaño más de contraste
    // (ver punto 3 de esta calibración, "reducir todavía más su
    // protagonismo") — apoyo visual, nunca compiten con el sólido.
    lane: "#C3CCD9",
    laneWidth: 0.85,
    reference: "#D5DBE5", // líneas vértice→carril: un peldaño más suave aún que el carril
    referenceWidth: 0.75,
  },
  fill: {
    // 3 tonos del mismo azul, contraste subido respecto a la primera
    // calibración (ver punto 2, "aumenta un poco el contraste entre las
    // 3 caras") — cara superior más clara todavía, pared derecha (largo)
    // con más presencia/saturación, pared izquierda (ancho) claramente
    // más oscura — el volumen debe leerse antes de mirar las cotas.
    top: "#F1F5FB",
    wallRight: "#A7B8D5",
    wallLeft: "#7F93BC",
  },
  dimension: {
    active: BRAND_ORANGE, // SOLO la cota que se está escribiendo ahora mismo
    inactive: "#8B96A8", // gris neutro suave — el carril nunca compite con el sólido
  },
  chip: {
    bg: "#FFFFFF",
    border: "#DCE2EC",
    borderWidth: 1,
    radius: 7,
    labelColor: "#7C8798",
    valueColor: "#132A4C",
    valueColorActive: BRAND_ORANGE,
    fontLabel: "var(--font-body)", // Figtree — ya es la fuente de marca de ObraBien
    fontValue: "var(--font-mono)", // IBM Plex Mono — ídem
  },
} as const;
