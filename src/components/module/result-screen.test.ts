import { describe, expect, it } from "vitest";
import { selectHeroPrimaryInfo } from "./result-screen-helpers";
import type { InfoResult } from "@/lib/formula-engine";

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
