import { formatQuantity } from "./format-number";
import { pluralizeUnit } from "./pluralize";

// Parte 6 (Mis proyectos) — extrae una línea breve de "resultado principal"
// desde el snapshot YA CALCULADO y persistido en SavedProject.result (nunca
// recalcula, nunca ejecuta fórmulas). Mismo criterio genérico que usa
// ResultHero para el resultado "protagonista" en vivo (primer resultado
// no-secundario) — así la card de un proyecto guardado muestra el mismo
// dato que el usuario vio como protagonista al calcular, sin depender de
// heroResultKey/module-visual-config (que son de la vista en vivo, no del
// snapshot guardado).
export type PersistedResultLike = {
  key: string;
  label: string;
  unit: string;
  value: number;
  materialName: string | null;
  isSecondary?: boolean;
};

export function summarizePersistedResult(results: PersistedResultLike[] | undefined | null): string | null {
  if (!results || results.length === 0) return null;
  const primary = results.find((r) => !r.isSecondary);
  if (!primary) return null;
  const noun = (primary.materialName ?? primary.label).toLowerCase();
  return `${formatQuantity(primary.value)} ${pluralizeUnit(primary.value, primary.unit)} de ${noun}`;
}
