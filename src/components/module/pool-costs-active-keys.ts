// Fase C6.1 (2026-09-02) -- extraída de pool-costs-step.tsx a un archivo
// .ts aparte (sin JSX) para poder testearla sin montar React: este
// proyecto no tiene configurado un plugin de React para vitest (ni
// jsdom/@testing-library), así que cualquier import desde un .tsx falla
// al transformar el archivo completo, JSX incluido (mismo motivo que ya
// documentan execution-advisor-panel-helpers.ts y result-screen-helpers.ts).
//
// Fuente única de verdad de "qué preguntas de precio de Costos son
// realmente aplicables ahora mismo", dado el estado real de `answers` --
// mismo principio ya aprobado en C2 para `getInteriorActiveKeys`
// (interior-termination-step.tsx): varias condiciones acá son compuestas
// (Pintura aplica si muros=pintura O fondo=pintura, 2 keys distintas) y
// `Question.visibleIfQuestionKey` solo admite una sola condición simple --
// no se fuerza esa lógica ahí.
//
// Se llama DESDE PoolCostsStep (para decidir qué renderizar/pedir en el
// paso) Y desde module-wizard.tsx (para filtrar "Tu proyecto") -- una
// sola función, no una matriz de condiciones duplicada a mano en 2
// lugares que se puede desincronizar (sección 8 del pedido C6.1:
// "CostsStep y TU PROYECTO deben provenir de la MISMA lógica"). Replica
// EXACTAMENTE las condiciones reales de fase-c6-piscina-integral-costos.ts
// -- Hormigón y Retiro son siempre candidatos (sus cantidades,
// hormigon-total y excavacion-viajes, no tienen condition en el motor: se
// calculan siempre que hay una forma elegida); el resto depende de
// terminación de muros/fondo/entorno y de si ya existe una base.
export function getCostsActiveKeys(answers: Record<string, string | number | undefined>): Set<string> {
  const active = new Set<string>(["costos-precio-hormigon-m3", "costos-precio-retiro-viaje"]);

  const muros = answers["interior-terminacion-muros"];
  const fondo = answers["interior-terminacion-fondo"];
  if (muros === "pintura" || fondo === "pintura") active.add("costos-precio-pintura-litro");
  if (muros === "ceramica" || fondo === "ceramica") active.add("costos-precio-ceramica-interior-m2");
  if (muros === "membrana" || fondo === "membrana") active.add("costos-precio-membrana-m2");

  const entornoTerminacion = answers["entorno-terminacion"];
  const baseExistente = answers["entorno-base-existente"];
  // Misma condición exacta que "entorno-volumen-base" en el motor (ver
  // sección 14 del pedido C6 original: "mantener exactamente la lógica
  // anti doble conteo aprobada en C4").
  if (entornoTerminacion !== "radier" && baseExistente === "no") active.add("costos-precio-base-entorno-m3");
  if (entornoTerminacion === "radier") active.add("costos-precio-radier-terminado-m3");
  if (entornoTerminacion === "ceramica") active.add("costos-precio-ceramica-entorno-m2");
  if (entornoTerminacion === "porcelanato") active.add("costos-precio-porcelanato-entorno-m2");
  if (entornoTerminacion === "pastelones") active.add("costos-precio-pastelon-unidad");

  return active;
}
