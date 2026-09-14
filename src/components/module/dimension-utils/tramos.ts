import { toNum } from "./parsing";
import { round2 } from "./formatting";

// "Área personalizada" (Fase 3, 2026-09-14) — generaliza y reemplaza la
// feature de "vanos" (enableDeduction) de AreaInputToggle: en vez de un
// único rectángulo largo×ancho con huecos restados, el usuario construye
// la superficie total sumando y restando cualquier cantidad de tramos
// rectangulares, cada uno con etiqueta opcional (ej. "Living", "Hueco
// columna"). Pertenece al framework (dimension-utils/), igual que
// parseAreaFromRawDims: lo usan tanto el componente de UI (tramos-input.tsx)
// como el que persiste el desglose (area-input-toggle.tsx).

export type TramoTipo = "suma" | "resta";

// Estado de trabajo editable (inputs de texto crudo, igual criterio que
// primary/secondary en AreaInputToggle — se parsean recién al calcular).
export type TramoInput = {
  id: string;
  tipo: TramoTipo;
  largo: string;
  ancho: string;
  etiqueta: string;
};

// Forma persistida (ver Fase 2, "mismo patrón que Consumo eléctrico"):
// valores ya parseados a número + el área ya calculada por tramo — quien
// lea el JSON (result-screen.tsx) no tiene que re-parsear ni re-calcular.
export type TramoRecord = {
  tipo: TramoTipo;
  largo: number;
  ancho: number;
  area: number;
  etiqueta: string;
};

export function createEmptyTramo(tipo: TramoTipo = "suma"): TramoInput {
  return { id: crypto.randomUUID(), tipo, largo: "", ancho: "", etiqueta: "" };
}

// Un tramo solo cuenta para el total si largo y ancho son números > 0 —
// mismo criterio que vanos hoy (`v.ancho > 0 && v.alto > 0`).
function isValidTramo(t: TramoInput): boolean {
  const l = toNum(t.largo);
  const a = toNum(t.ancho);
  return l !== null && l > 0 && a !== null && a > 0;
}

export function tramosToRecords(tramos: TramoInput[]): TramoRecord[] {
  return tramos.filter(isValidTramo).map((t) => {
    const largo = toNum(t.largo)!;
    const ancho = toNum(t.ancho)!;
    return { tipo: t.tipo, largo, ancho, area: round2(largo * ancho), etiqueta: t.etiqueta.trim() };
  });
}

// Superficie total = suma de tramos "suma" − suma de tramos "resta", nunca
// negativa (mismo criterio que el descuento de vanos hoy: `Math.max(0, ...)`).
export function calcTotalArea(records: TramoRecord[]): number {
  const suma = records.filter((r) => r.tipo === "suma").reduce((sum, r) => sum + r.area, 0);
  const resta = records.filter((r) => r.tipo === "resta").reduce((sum, r) => sum + r.area, 0);
  return round2(Math.max(0, suma - resta));
}

// Validación de envío: al menos 1 tramo "suma" válido, y el total no puede
// ser 0 (equivalente a "sin superficie real" — ej. solo tramos de resta, o
// una resta que anula la suma completa).
export function validateTramos(records: TramoRecord[]): string | null {
  if (!records.some((r) => r.tipo === "suma")) {
    return "Agrega al menos un tramo que sume superficie.";
  }
  if (calcTotalArea(records) <= 0) {
    return "La superficie total no puede ser 0. Revisa los tramos que restas.";
  }
  return null;
}
