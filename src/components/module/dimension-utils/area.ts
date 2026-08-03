import { toNum } from "./parsing";

// Área a partir de un par largo×ancho crudo (texto tal como lo tipeó el
// usuario) — pertenece al framework: tanto AreaInputToggle (modo "largo ×
// ancho") como el layout combinado de QuestionGroupStep (ver
// COMBINED_AREA_QUESTION) necesitan "parsear 2 campos y multiplicar solo
// si ambos son válidos", null en cualquier otro caso. Antes era el mismo
// bloque de 3 líneas repetido en los 2 archivos.
export function parseAreaFromRawDims(rawPrimary: string | undefined, rawSecondary: string | undefined): number | null {
  const primary = toNum(rawPrimary);
  const secondary = toNum(rawSecondary);
  return primary !== null && secondary !== null ? primary * secondary : null;
}
