import type { InfoResult } from "@/lib/formula-engine";

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
