// Parte 6 (Mis proyectos) — decide qué copy de fecha mostrar en una card de
// SavedProject, sin fingir actividad reciente (Design Spec v1.0, sección
// K.8): "Actualizado hace X" solo si `updatedAt` difiere de `createdAt` en
// más de un minuto (representa una edición real — renombrar, tocar el
// slider de avance, marcar/desmarcar lista de compras — no el jitter de
// milisegundos entre ambos campos al crear la fila). En cualquier otro
// caso, "Guardado el DD/MM/YYYY" sobre `createdAt`.
const MEANINGFUL_UPDATE_THRESHOLD_MS = 60_000;

const UNITS: { limit: number; divisor: number; singular: string; plural: string }[] = [
  { limit: 60, divisor: 1, singular: "minuto", plural: "minutos" },
  { limit: 60 * 60, divisor: 60, singular: "minuto", plural: "minutos" },
  { limit: 60 * 60 * 24, divisor: 60 * 60, singular: "hora", plural: "horas" },
  { limit: 60 * 60 * 24 * 7, divisor: 60 * 60 * 24, singular: "día", plural: "días" },
  { limit: 60 * 60 * 24 * 30, divisor: 60 * 60 * 24 * 7, singular: "semana", plural: "semanas" },
  { limit: 60 * 60 * 24 * 365, divisor: 60 * 60 * 24 * 30, singular: "mes", plural: "meses" },
];

function relativeFromSeconds(diffSeconds: number): string {
  if (diffSeconds < 60) return "hace un momento";
  for (const unit of UNITS) {
    if (diffSeconds < unit.limit) {
      const amount = Math.max(1, Math.floor(diffSeconds / unit.divisor));
      return `hace ${amount} ${amount === 1 ? unit.singular : unit.plural}`;
    }
  }
  const years = Math.max(1, Math.floor(diffSeconds / (60 * 60 * 24 * 365)));
  return `hace ${years} ${years === 1 ? "año" : "años"}`;
}

export function projectDateLabel(createdAt: Date, updatedAt: Date, now: Date = new Date()): string {
  const wasEdited = updatedAt.getTime() - createdAt.getTime() > MEANINGFUL_UPDATE_THRESHOLD_MS;
  if (wasEdited) {
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - updatedAt.getTime()) / 1000));
    return `Actualizado ${relativeFromSeconds(diffSeconds)}`;
  }
  const day = String(createdAt.getDate()).padStart(2, "0");
  const month = String(createdAt.getMonth() + 1).padStart(2, "0");
  const year = createdAt.getFullYear();
  return `Guardado el ${day}/${month}/${year}`;
}
