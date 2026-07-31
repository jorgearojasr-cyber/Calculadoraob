// Tema visual — el ÚNICO lugar de todo Diagram System V2 con colores,
// grosores de línea y tipografías. Cambiar el tema nunca debería tocar
// math/ ni layout/.
//
// Calibrado 2026-08-02 contra el PDF real (convertido a PNG con
// poppler, ver conversación) — antes eran valores derivados a ojo del
// navy de marca sin ver los píxeles del mockup; esta pasada SÍ compara
// contra la imagen real, caso por caso (ver informe de Fase 0 v2).

export const BRAND_NAVY = "#002152";
export const BRAND_ORANGE = "#FF4E00";

export const theme = {
  stroke: {
    solid: "#0B2A52", // levemente más suave que el navy puro de marca — así se lee en el mockup
    width: 1.8, // grosor exacto pedido por la especificación
    // Carriles/líneas de referencia: MUCHO más suaves que antes (ver
    // punto 3 del alcance, "suavizar el protagonismo de las cotas") —
    // en el mockup real son casi imperceptibles hasta que el ojo los
    // busca; el sólido manda.
    lane: "#B7C1D1",
    laneWidth: 1,
    reference: "#C7CFDB", // líneas vértice→carril: un peldaño más suave aún que el carril
    referenceWidth: 0.9,
  },
  fill: {
    // 3 tonos del mismo azul — cara superior casi blanca (más luz),
    // pared "largo" (derecha) tono medio, pared "ancho" (izquierda) más
    // oscura — confirmado contra Excavación y Pilar/columna en el PDF:
    // las 2 paredes SÍ se diferencian entre sí, no son el mismo tono.
    top: "#EEF3FA",
    wallRight: "#B9C7DE",
    wallLeft: "#9AACCC",
  },
  dimension: {
    active: BRAND_ORANGE, // SOLO la cota que se está escribiendo ahora mismo
    inactive: "#8B96A8", // gris neutro suave — el carril nunca compite con el sólido
  },
  chip: {
    bg: "#FFFFFF",
    border: "#DCE2EC",
    borderWidth: 1,
    radius: 8,
    labelColor: "#7C8798",
    valueColor: "#132A4C",
    valueColorActive: BRAND_ORANGE,
    fontLabel: "var(--font-body)", // Figtree — ya es la fuente de marca de ObraBien
    fontValue: "var(--font-mono)", // IBM Plex Mono — ídem
  },
} as const;
