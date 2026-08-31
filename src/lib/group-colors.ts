// Color del ícono de cada ProjectGroup en Home y en /grupos/[slug].
//
// Decisión (2026-07-28, reemplaza la de "un solo tinte marino" de hace
// unas horas): cada uno de los 11 grupos confirmados lleva su propio color
// de ícono, derivado de la familia de marca — nunca naranjo/ámbar/carmín,
// reservados para CTA/normas/avisos (ver comentario en tailwind.config.ts).
// El TEXTO (nombre del grupo, títulos) se mantiene siempre en marino/negro
// estándar; la variedad de color vive solo en el ícono.
//
// Nota: la base tiene 13 ProjectGroup (2 más de los 11 confirmados:
// "Reparar" y "Puertas y ventanas"). No están en este mapa a propósito —
// caen al tinte marino por defecto (GROUP_ICON_CHIP_CLASS) hasta que se
// confirme un color para ellos también.
export const GROUP_ICON_CHIP_CLASS = "bg-navy/[0.07] text-navy";

const GROUP_ICON_COLORS: Record<string, { bg: string; text: string }> = {
  construir: { bg: "bg-navy/[0.07]", text: "text-navy" },
  "pisos-y-revestimientos": { bg: "bg-clay/[0.1]", text: "text-clay" },
  pintar: { bg: "bg-plum/[0.1]", text: "text-plum" },
  electricidad: { bg: "bg-blueprint/[0.1]", text: "text-blueprint" },
  "agua-y-gas": { bg: "bg-lagoon/[0.1]", text: "text-lagoon" },
  bano: { bg: "bg-graphite/[0.1]", text: "text-graphite" },
  jardin: { bg: "bg-success/[0.12]", text: "text-success" },
  techumbre: { bg: "bg-ochre/[0.1]", text: "text-ochre" },
  piscinas: { bg: "bg-poolblue/[0.1]", text: "text-poolblue" },
  "guias-rapidas": { bg: "bg-ink-muted/[0.1]", text: "text-ink-muted" },
  // Cálculos especiales — slug real en la base es "herramientas-avanzadas".
  "herramientas-avanzadas": { bg: "bg-safety-hover/[0.1]", text: "text-safety-hover" },
};

// Clases del chip de ícono (fondo tinte + color) para un grupo por slug —
// cae al tinte marino por defecto si el slug no está en la paleta.
export function getGroupIconClasses(slug: string): string {
  const colors = GROUP_ICON_COLORS[slug];
  return colors ? `${colors.bg} ${colors.text}` : GROUP_ICON_CHIP_CLASS;
}

// FASE A — Piscinas (auditoría, sección 10): el conteo genérico de
// ProjectGroup ("N cálculos" = group.tasks.length) es correcto como
// ARQUITECTURA — "Construir una piscina" es 1 sola ProjectTask, con 2
// ProjectTaskModule (Rectangular/Circular) — pero el copy resultante ("1
// cálculo") no comunica que hay 2 formas reales disponibles. Se corrige
// SOLO el copy, SOLO para "piscinas", sin tocar group.tasks.length ni
// ningún otro ProjectGroup — mismo criterio que GROUP_ICON_COLORS de
// arriba (mapa opcional por slug, con fallback al comportamiento
// genérico de siempre). Ver group-card.tsx y grupos/[slug]/page.tsx.
const GROUP_COUNT_LABEL_OVERRIDES: Record<string, string> = {
  piscinas: "2 formas disponibles",
};

// Label del contador de un grupo — el override de arriba si existe, o
// `null` para que el llamador use el cálculo genérico "{total} {cálculo(s)}"
// de siempre (sin cambios para los demás 12 grupos).
export function getGroupCountLabel(slug: string): string | null {
  return GROUP_COUNT_LABEL_OVERRIDES[slug] ?? null;
}
