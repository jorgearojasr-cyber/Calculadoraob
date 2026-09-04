import type { InfoResult } from "@/lib/formula-engine";
import type { CalculationResult } from "@/lib/formula-engine";
// Imports de VALOR (no `import type`) deben ser relativos, no "@/..." — el
// alias "@/" no está configurado para la resolución en tiempo de
// ejecución de vitest (solo tsc/webpack lo resuelven), así que un import
// real (no erosionado como los `import type` de arriba) con "@/" rompe
// cualquier .test.ts que dependa de este archivo (encontrado en vivo:
// "Cannot find package '@/lib/format-number'").
import { formatQuantity } from "../../lib/format-number";
import { pluralizeUnit } from "../../lib/pluralize";

// Fase C5.1 — extraída de result-screen.tsx (heroElement) para poder
// testearla sin montar ResultScreen: este proyecto no tiene configurado un
// plugin de React para vitest (ni jsdom/@testing-library), así que
// cualquier import desde un .tsx falla al transformar el archivo completo,
// JSX incluido (mismo motivo que ya documenta
// execution-advisor-panel-helpers.ts).
//
// Devuelve el primer InfoResult que NO esté en `excludeKeys` — mismo
// criterio que ya usaba el bloque genérico de infoResults más abajo
// (refuerzoConfig.estadoKey/explicacionKey), MÁS los keys que un
// `resultGroups.infoKeys` ya muestra dentro de su propio grupo (Fase C5,
// ver groupedInfoKeysSet en result-screen.tsx). Sin refuerzoConfig ni
// resultGroups (caso histórico, todos los módulos salvo Radier/piscina-
// integral), `excludeKeys` queda vacío y esto se reduce exactamente a
// `infoResults[0] ?? null` — comportamiento intacto (Caso A/B). Si TODAS
// las InfoResult están excluidas, devuelve null a propósito (Caso C: no
// hay candidato "libre" para el subtítulo del hero, mejor no mostrar nada
// que repetir una ya agrupada) — nunca descarta una InfoResult que no
// esté explícitamente en `excludeKeys` (Caso D).
export function selectHeroPrimaryInfo(infoResults: InfoResult[], excludeKeys: Set<string>): InfoResult | null {
  return infoResults.find((info) => !excludeKeys.has(info.key)) ?? null;
}

// Fase Pre-Producción — "UX final del configurador de piscina" (2026-09-04),
// sección 22: resumen de una línea para un `resultGroups` colapsado (ej.
// "144,65 m³ · 19 viajes" para Excavación), sin introducir ninguna fórmula
// nueva — solo formatea `Formula.key` que YA existen en `results`. Busca en
// TODO `results` (no solo en los items del propio grupo) para poder
// referenciar un resultado que vive en `excludeFromListKeys` (ej.
// "hormigon-total", ya destacado en el hero — Estructura lo reusa como su
// resumen). Si ninguna key de `summaryKeys` calculó esta vez (ej. otra
// terminación), devuelve `null` y el grupo simplemente no muestra resumen
// — nunca "0" ni un valor inventado.
export function buildGroupSummaryText(summaryKeys: string[] | undefined, results: CalculationResult[]): string | null {
  if (!summaryKeys || summaryKeys.length === 0) return null;
  const parts = summaryKeys
    .map((key) => results.find((r) => r.key === key))
    .filter((r): r is CalculationResult => r !== undefined)
    .map((r) => `${formatQuantity(r.value)} ${pluralizeUnit(r.value, r.unit)}`.trim());
  return parts.length > 0 ? parts.join(" · ") : null;
}

// Fase Pre-Producción, secciones 23-25: agrupa `answersSummary` (ya
// filtrado/formateado por module-wizard.tsx) según `stepGroup` — el MISMO
// campo que ya vive en cada Question (ver schema), sin inventar una
// clasificación nueva. Preserva el orden real del wizard (Medidas ->
// Estructura -> ... -> Costos); cualquier item sin stepGroup reconocido cae
// a "Otros" al final, red de seguridad si se agrega una Question nueva sin
// clasificar acá (nunca desaparece en silencio, mismo criterio que
// RESULT_GROUPS/ungroupedResults).
export type GroupableSummaryItem = { questionKey: string; stepGroup?: string | null };
export type GroupedSummarySection<T> = { title: string; items: T[] };

const STEP_GROUP_DISPLAY_TITLES: Record<string, string> = {
  "medidas-rect": "Medidas",
  "medidas-circ": "Medidas",
  "estructura-rect": "Estructura",
  "estructura-circ": "Estructura",
  "interior-termination": "Interior",
  excavation: "Excavación",
  environment: "Borde de la piscina",
  equipment: "Equipamiento",
  costs: "Costos",
};

// Fase Pre-Producción — ajuste UX final (2026-09-04): "¿Qué forma tendrá tu
// piscina?" (Question.key real "que-forma-tendra-tu-piscina") no tiene
// stepGroup en BD -- es la única pregunta de todo el módulo sin uno, porque
// decide qué par de stepGroups (medidas-rect/medidas-circ, etc.) se activa,
// no pertenece ella misma a ninguno. Cae en "Editar valores" caía a "Otros"
// por el fallback genérico, pero conceptualmente es la primera decisión de
// Medidas -- override de PRESENTACIÓN explícito por questionKey, sin tocar
// el schema ni agregarle un stepGroup real en BD (evaluado: no hay una
// razón técnica real para eso, ver comentario original de interior-
// termination-step.tsx sobre por qué esta Question no necesita
// visibleIfQuestionKey/stepGroup — misma lógica aplica acá).
const QUESTION_KEY_GROUP_OVERRIDES: Record<string, string> = {
  "que-forma-tendra-tu-piscina": "Medidas",
};

const STEP_GROUP_DISPLAY_ORDER = [
  "Medidas",
  "Estructura",
  "Interior",
  "Excavación",
  "Borde de la piscina",
  "Equipamiento",
  "Costos",
];

export function groupAnswersSummaryByStep<T extends GroupableSummaryItem>(items: T[]): GroupedSummarySection<T>[] {
  const byTitle = new Map<string, T[]>();
  for (const item of items) {
    const title =
      QUESTION_KEY_GROUP_OVERRIDES[item.questionKey] ||
      (item.stepGroup && STEP_GROUP_DISPLAY_TITLES[item.stepGroup]) ||
      "Otros";
    const bucket = byTitle.get(title);
    if (bucket) bucket.push(item);
    else byTitle.set(title, [item]);
  }
  const orderedTitles = [
    ...STEP_GROUP_DISPLAY_ORDER.filter((t) => byTitle.has(t)),
    ...Array.from(byTitle.keys()).filter((t) => !STEP_GROUP_DISPLAY_ORDER.includes(t)),
  ];
  return orderedTitles.map((title) => ({ title, items: byTitle.get(title)! }));
}
