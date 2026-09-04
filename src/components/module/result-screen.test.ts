import { describe, expect, it } from "vitest";
import { selectHeroPrimaryInfo, buildGroupSummaryText, groupAnswersSummaryByStep } from "./result-screen-helpers";
import type { InfoResult, CalculationResult } from "@/lib/formula-engine";

// Fase C5.1 — cubre exactamente los 4 casos pedidos para el fix de
// heroPrimaryInfo (ver comentario en result-screen.tsx junto a
// selectHeroPrimaryInfo). No monta ResultScreen: la función es pura,
// así que basta con InfoResult[] + Set<string> de exclusión.

const info = (key: string, value: string = `valor-${key}`): InfoResult => ({ key, label: key, value });

describe("selectHeroPrimaryInfo (Fase C5.1)", () => {
  it("CASO A — módulo sin resultGroups/infoKeys: comportamiento histórico intacto (= infoResults[0])", () => {
    const infoResults = [info("tipo_hormigon"), info("otra-cosa")];
    const result = selectHeroPrimaryInfo(infoResults, new Set());
    expect(result).toEqual(infoResults[0]);
  });

  it("CASO B — InfoResult histórica usada por Hero (ej. Radier 'tipo_hormigon'): sigue apareciendo", () => {
    const infoResults = [info("tipo_hormigon")];
    const result = selectHeroPrimaryInfo(infoResults, new Set());
    expect(result?.key).toBe("tipo_hormigon");
  });

  it("CASO C — piscina-integral: InfoResult 'Bomba' ya agrupada en Equipamiento NO debe repetirse en el Hero", () => {
    const infoResults = [info("equipamiento-bomba-criterio"), info("equipamiento-skimmers-criterio"), info("equipamiento-retornos-criterio")];
    const excludeKeys = new Set(["equipamiento-bomba-criterio", "equipamiento-skimmers-criterio", "equipamiento-retornos-criterio"]);
    const result = selectHeroPrimaryInfo(infoResults, excludeKeys);
    // Las 3 InfoResult de C5 están agrupadas -> ninguna debe quedar como
    // primaryInfo del hero (null), no una pérdida silenciosa: el
    // resultado correcto acá es "no hay candidato", no un valor inventado.
    expect(result).toBeNull();
  });

  it("CASO D — InfoResult NO agrupada en un módulo que SÍ usa resultGroups: no debe desaparecer, conserva el comportamiento histórico", () => {
    const infoResults = [info("equipamiento-bomba-criterio"), info("info-suelta-no-agrupada")];
    // Solo "equipamiento-bomba-criterio" está en un grupo; la otra no.
    const excludeKeys = new Set(["equipamiento-bomba-criterio"]);
    const result = selectHeroPrimaryInfo(infoResults, excludeKeys);
    expect(result?.key).toBe("info-suelta-no-agrupada");
  });

  it("excluye también las keys de refuerzoConfig (estado/explicación) cuando corresponde", () => {
    const infoResults = [info("refuerzo_estado"), info("refuerzo_explicacion"), info("tipo_hormigon")];
    const excludeKeys = new Set(["refuerzo_estado", "refuerzo_explicacion"]);
    const result = selectHeroPrimaryInfo(infoResults, excludeKeys);
    expect(result?.key).toBe("tipo_hormigon");
  });

  it("sin InfoResults: devuelve null sin lanzar", () => {
    expect(selectHeroPrimaryInfo([], new Set())).toBeNull();
  });
});

// Fase Pre-Producción — "UX final del configurador de piscina" (2026-09-04):
// buildGroupSummaryText arma el resumen de una línea de un `resultGroups`
// colapsado (ej. "144,65 m³ · 19 viajes" para Excavación), y
// groupAnswersSummaryByStep agrupa "Editar valores" por el mismo stepGroup
// del wizard. Ambas son funciones puras (sin JSX), testeadas sin montar
// ResultScreen.
const result = (key: string, value: number, unit: string): CalculationResult => ({
  key,
  label: key,
  unit,
  value,
  note: null,
  materialName: null,
});

describe("buildGroupSummaryText (Fase Pre-Producción)", () => {
  it("une varios summaryKeys presentes con ' · ', formateados con su unidad", () => {
    const results = [result("excavacion-volumen-suelto", 144.65, "m³"), result("excavacion-viajes", 19, "viaje")];
    expect(buildGroupSummaryText(["excavacion-volumen-suelto", "excavacion-viajes"], results)).toBe("144,65 m³ · 19 viajes");
  });

  it("busca en TODOS los results, no solo en los del propio grupo (ej. hormigon-total, ya excluido de la lista)", () => {
    const results = [result("otro-resultado-cualquiera", 1, "m"), result("hormigon-total", 25.39, "m3")];
    expect(buildGroupSummaryText(["hormigon-total"], results)).toBe("25,39 m3");
  });

  it("solo UNA de varias keys candidatas calculó esta vez (ej. Interior: pintura/cerámica/membrana son mutuamente excluyentes) -> muestra solo esa", () => {
    const results = [result("ceramica-m2-combinado", 32, "m²")];
    expect(
      buildGroupSummaryText(["pintura-litros-combinado", "ceramica-m2-combinado", "membrana-m2-combinado"], results)
    ).toBe("32 m²");
  });

  it("ninguna summaryKey calculó esta vez -> null, nunca '0' ni un valor inventado", () => {
    const results = [result("otra-cosa", 1, "m")];
    expect(buildGroupSummaryText(["entorno-area"], results)).toBeNull();
  });

  it("sin summaryKeys configuradas -> null", () => {
    expect(buildGroupSummaryText(undefined, [result("x", 1, "m")])).toBeNull();
    expect(buildGroupSummaryText([], [result("x", 1, "m")])).toBeNull();
  });
});

describe("groupAnswersSummaryByStep (Fase Pre-Producción)", () => {
  const item = (questionKey: string, stepGroup: string | null) => ({ questionKey, stepGroup });

  it("agrupa por stepGroup real, mapeando rect/circ al mismo título de bloque", () => {
    const items = [item("largo-interior-metros", "medidas-rect"), item("diametro-interior-metros", "medidas-circ")];
    const groups = groupAnswersSummaryByStep(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Medidas");
    expect(groups[0].items).toHaveLength(2);
  });

  it("preserva el orden real del wizard (Medidas -> Estructura -> Interior -> Excavación -> Borde -> Equipamiento -> Costos), no el orden de aparición en el array de entrada", () => {
    const items = [
      item("costos-precio-hormigon-m3", "costs"),
      item("largo-interior-metros", "medidas-rect"),
      item("excavacion-tipo-terreno", "excavation"),
    ];
    const groups = groupAnswersSummaryByStep(items);
    expect(groups.map((g) => g.title)).toEqual(["Medidas", "Excavación", "Costos"]);
  });

  it('"environment" se muestra como "Borde de la piscina" (Fase Pre-Producción, sección 12-13: copy "Entorno" -> "Borde")', () => {
    const groups = groupAnswersSummaryByStep([item("entorno-ancho-m", "environment")]);
    expect(groups[0].title).toBe("Borde de la piscina");
  });

  it("un stepGroup no reconocido (o null) cae a \"Otros\" al final -- nunca desaparece en silencio", () => {
    const items = [item("largo-interior-metros", "medidas-rect"), item("algo-nuevo-sin-clasificar", "un-stepgroup-futuro"), item("sin-grupo", null)];
    const groups = groupAnswersSummaryByStep(items);
    expect(groups.at(-1)?.title).toBe("Otros");
    expect(groups.at(-1)?.items.map((i) => i.questionKey)).toEqual(["algo-nuevo-sin-clasificar", "sin-grupo"]);
  });

  // Fase Pre-Producción — ajuste UX final (2026-09-04): "¿Qué forma tendrá
  // tu piscina?" (key real "que-forma-tendra-tu-piscina") no tiene
  // stepGroup en BD (null) y caía a "Otros" -- override explícito por
  // questionKey la clasifica en "Medidas" sin tocar el schema.
  it('"que-forma-tendra-tu-piscina" (sin stepGroup en BD) se clasifica en "Medidas" via override explícito', () => {
    const groups = groupAnswersSummaryByStep([item("que-forma-tendra-tu-piscina", null)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Medidas");
  });

  it('caso normal completo: Forma junto con Largo/Ancho/Profundidad quedan TODOS en "Medidas", sin grupo "Otros"', () => {
    const items = [
      item("que-forma-tendra-tu-piscina", null),
      item("largo-interior-metros", "medidas-rect"),
      item("ancho-interior-metros", "medidas-rect"),
      item("profundidad-interior-metros", "medidas-rect"),
      item("espesor-de-los-muros-cm", "estructura-rect"),
    ];
    const groups = groupAnswersSummaryByStep(items);
    expect(groups.map((g) => g.title)).toEqual(["Medidas", "Estructura"]);
    expect(groups.find((g) => g.title === "Otros")).toBeUndefined();
    expect(groups[0].items.map((i) => i.questionKey)).toEqual([
      "que-forma-tendra-tu-piscina",
      "largo-interior-metros",
      "ancho-interior-metros",
      "profundidad-interior-metros",
    ]);
  });

  it("caso circular completo: Forma junto con Diámetro/Profundidad también quedan en \"Medidas\"", () => {
    const items = [
      item("que-forma-tendra-tu-piscina", null),
      item("diametro-interior-metros", "medidas-circ"),
      item("profundidad-interior-metros-circular", "medidas-circ"),
    ];
    const groups = groupAnswersSummaryByStep(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Medidas");
    expect(groups[0].items).toHaveLength(3);
  });

  it("el override es específico de esa key -- otra Question sin stepGroup sigue cayendo a \"Otros\"", () => {
    const groups = groupAnswersSummaryByStep([item("que-forma-tendra-tu-piscina", null), item("otra-pregunta-sin-grupo", null)]);
    expect(groups.map((g) => g.title)).toEqual(["Medidas", "Otros"]);
  });

  it("lista vacía -> lista de grupos vacía", () => {
    expect(groupAnswersSummaryByStep([])).toEqual([]);
  });
});
