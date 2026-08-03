import type { WizardQuestion } from "../../types";
import { formatQuantity } from "@/lib/format-number";
import { toFieldNum } from "../../dimension-utils/parsing";
import { toMeters } from "../../dimension-utils/units";

export type VolumeField = {
  question: WizardQuestion;
  label: string;
  subLabel?: string;
  axis: "h" | "v";
  dimField: "largo" | "ancho" | "profundidad" | "diametro";
};

// Vista previa en vivo de volumen (y superficie, si corresponde) mientras
// el usuario escribe — extraído de VolumeStep sin cambiar la fórmula: caja
// = largo×ancho×profundidad, cilindro = π×(diámetro/2)²×profundidad. Es
// solo una vista previa; el cálculo real (con pérdidas, esponjamiento,
// etc.) lo hace el motor de fórmulas al enviar el paso.
export function useVolumePreview({
  fields,
  values,
  isCircular,
  showArea,
}: {
  fields: VolumeField[];
  values: Record<string, string>;
  isCircular: boolean;
  showArea?: boolean;
}): { volume: number | null; area: number | null; formulaText: string | null } {
  const nums = fields.map((f) => toFieldNum(f.question, values[f.question.key]));
  const numsInMeters = fields.map((f, i) => toMeters(nums[i], f.question.unit));
  const allValid = numsInMeters.every((n) => n !== null);
  const volume = !allValid
    ? null
    : isCircular
      ? Math.PI * (numsInMeters[0]! / 2) ** 2 * numsInMeters[numsInMeters.length - 1]!
      : numsInMeters.reduce((acc, n) => acc * n!, 1);
  // BUG-005 (auditoría funcional 02-ago-2026): para figuras circulares la
  // leyenda mostraba "diámetro × profundidad m" (estilo rectangular) en
  // vez de la fórmula que realmente se usa arriba (π × radio² ×
  // profundidad) — el número calculado siempre fue correcto, solo el
  // texto explicativo no correspondía a la geometría real.
  const formulaText = !allValid
    ? null
    : isCircular
      ? `π × ${formatQuantity(numsInMeters[0]! / 2)}² × ${formatQuantity(numsInMeters[numsInMeters.length - 1]!)} m`
      : `${numsInMeters.map((n) => formatQuantity(n!)).join(" × ")} m`;

  // Superficie (largo × ancho, ya en metros) al lado del volumen — solo
  // para grupos marcados showArea (ver DiagramConfig), donde esos 2
  // campos son realmente el contorno de la figura.
  const area =
    showArea && !isCircular && numsInMeters[0] !== null && numsInMeters[1] !== null
      ? numsInMeters[0]! * numsInMeters[1]!
      : null;

  return { volume, area, formulaText };
}
