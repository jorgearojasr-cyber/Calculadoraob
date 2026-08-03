import type { WizardQuestion } from "../types";

// Conversión de texto a número — pertenece al framework: todo campo de
// medida del wizard (VolumeStep, FoundationStep, AreaInputToggle, el grid
// fijo de QuestionGroupStep) necesita la misma regla de parseo. Devuelve
// `null` para texto vacío, no numérico, o negativo — pero ya NO para "0"
// (BUG-009, auditoría funcional 02-ago-2026): antes esta función
// rechazaba `n <= 0` en bloque, así que la vista previa en vivo (diagrama,
// superficie/volumen) mostraba un "0" tipeado como si el campo no se
// hubiera respondido. Los negativos se mantienen rechazados (no cambia
// nada para ellos) — no son parte de este bug y su vista previa (dibujar
// un largo/volumen negativo) nunca se probó. La regla de negocio real
// ("debe ser mayor que 0" para poder avanzar de paso) vive de forma
// independiente en dimension-utils/validation.ts — no depende de esta
// función, así que este cambio no la afecta.
export function toNum(raw: string | undefined): number | null {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Resuelve el valor numérico de un campo sin importar si la pregunta real
// es NUMBER (parsea el texto tipeado) o SELECT (busca el numericValue de
// la opción elegida, ej. "10cm" -> 0.1) — ver decisión de producto, Fase 4
// (2026-08-02): el espesor de Losa/Muro se mantiene como opciones fijas,
// pero el diagrama necesita un número para dibujar.
export function toFieldNum(question: WizardQuestion, raw: string | undefined): number | null {
  return question.type === "SELECT" ? (question.options.find((o) => o.key === raw)?.numericValue ?? null) : toNum(raw);
}
