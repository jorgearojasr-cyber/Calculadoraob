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
    // Valores usados como stop final de cada gradiente (ver `gradient`
    // abajo) y como fallback si algún consumidor pintara sin degradado.
    top: "#F1F5FB",
    wallRight: "#A7B8D5",
    wallLeft: "#7F93BC",
  },
  // Degradado sutil DENTRO de cada cara (calibración 2026-08-02, "más
  // sensación de volumen sin tocar geometría/cámara") — cada cara pasa de
  // un tono más claro (borde superior, más cerca de la luz) al tono base
  // ya calibrado en `fill` (borde inferior). Es la MISMA paleta de 3
  // tonos, solo con un quiebre de luz adicional dentro de cada polígono
  // — no un 4to color. El objetivo es "casi imperceptible en el código,
  // evidente en el objeto": el rango entre stops es chico a propósito.
  gradient: {
    top: { from: "#FAFCFE", to: "#F1F5FB" },
    wallRight: { from: "#B7C5DE", to: "#93A6C9" },
    wallLeft: { from: "#8FA1C4", to: "#6D82AD" },
  },
  dimension: {
    active: BRAND_ORANGE, // SOLO la cota que se está escribiendo ahora mismo
    inactive: "#8B96A8", // gris neutro suave — el carril nunca compite con el sólido
  },
  // Vanos descontados (puertas/ventanas) dibujados sobre una figura 2D —
  // spec "ObraBien Calculadora - Flujo rediseñado" (Fase 4, 2026-08-02):
  // "diagramas explicativos, no planos técnicos" — se diferencian del
  // muro con un color/trama clara y distinta (blanco + trama diagonal +
  // trazo naranjo punteado), nunca pretendiendo ser la ubicación real.
  //
  // Fase 8, sprint UX V1.2 (04-ago-2026): "que la incorporación de
  // puertas/ventanas se note mucho más evidente, aunque siga siendo
  // esquemática" — el problema no era la posición (ya se resolvía bien),
  // era el CONTRASTE: blanco (#FFFFFF) sobre el muro casi-blanco
  // (theme.fill.top = #F1F5FB) con una trama al 18% de opacidad y un
  // trazo de 1.25px apenas se distinguía. Se sube la opacidad de la trama
  // y el grosor del trazo — mismo color naranjo de marca, mismo patrón
  // diagonal, solo con más peso visual.
  voidShape: {
    fill: "#FFFFFF",
    hatch: BRAND_ORANGE,
    hatchOpacity: 0.42,
    stroke: BRAND_ORANGE,
    strokeWidth: 1.8,
    strokeDasharray: "4 2",
  },
  // Retícula de modulación (Cerámica/Porcelanato, ver `tileSizeCm` en
  // DiagramV2) y pista de orientación (SPC/flotante, ver
  // `orientationHint`) — dos intensidades DISTINTAS a propósito: la
  // retícula usa datos reales (tamaño de pieza elegido), la pista de
  // orientación no representa ninguna medida real, así que debe leerse
  // claramente más tenue/decorativa para que nunca se confundan.
  tileGrid: {
    stroke: "#B9C4D6",
    strokeWidth: 0.9,
  },
  orientationHint: {
    stroke: "#D5DBE5",
    strokeWidth: 0.75,
    strokeDasharray: "2 3",
  },
  // Piscina (Fase 4 Grupo 4, 2026-08-02): "el diagrama debe transmitir
  // profundidad... quiero que visualmente se perciba que es una piscina".
  // Reutiliza el mismo box/cylinder de siempre (BoxSolid/CylinderSolid con
  // waterFill=true) — un lavado celeste semitransparente ENCIMA del
  // degradado ya calibrado, nunca un color/geometría nuevos. La cara
  // superior (`top`) es literalmente la superficie del agua vista desde
  // arriba — no existe una pregunta de "nivel de agua" distinta de la
  // profundidad, así que el agua llena hasta el borde superior de la caja
  // (mismo criterio "no inventar un dato que no existe"). El trazo del
  // borde (`rimStroke`) marca el borde/coping de la piscina.
  water: {
    fill: "#3E8FD9",
    wallOpacity: 0.22,
    surfaceOpacity: 0.32,
    rimStroke: "#FFFFFF",
    rimWidth: 1.4,
  },
  // Techumbres (Fase 4 Grupo 5, 2026-08-02): plano inclinado ilustrativo
  // junto al rectángulo de planta (ver `roofSlopeFactor` en DiagramV2,
  // kind="rect2d") — mismo tono de "pared" que ya usa BoxSolid
  // (wallRight) para que se lea como parte de la misma familia visual, no
  // como un elemento inventado. El ángulo dibujado es solo proporcional
  // al factor real (nunca un grado medido, ver comentario en DiagramV2).
  roofSlope: {
    fill: "#A7B8D5",
    stroke: "#0B2A52",
    strokeWidth: 1.4,
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
