import { describe, expect, it } from "vitest";
import { pluralizeUnit } from "./pluralize";

// Fase C2.1 (2026-09-01) — cubre el fix que agregó "l" y "m²/l" a
// INVARIANT (ver pluralize.ts): antes de este fix, unidades "L" (litros,
// usadas por primera vez en el configurador integral de Piscina, Fase C2)
// se pluralizaban como cualquier palabra genérica terminada en consonante
// ("unidad" -> "unidades"), dando "Les"/"m²/Les" — un bug de copy, no de
// cálculo, pero visible en ResultScreen y en "Tu proyecto". Estos tests
// fijan el contrato: las unidades simbólicas/abreviadas nunca cambian,
// sin importar la cantidad.
describe("pluralizeUnit — invariantes existentes (no deben cambiar con el fix de C2.1)", () => {
  it("unidades ya invariantes se mantienen intactas en singular y plural", () => {
    expect(pluralizeUnit(1, "m")).toBe("m");
    expect(pluralizeUnit(2, "m")).toBe("m");
    expect(pluralizeUnit(1, "m²")).toBe("m²");
    expect(pluralizeUnit(2, "m²")).toBe("m²");
    expect(pluralizeUnit(1, "m³")).toBe("m³");
    expect(pluralizeUnit(2, "m³")).toBe("m³");
    expect(pluralizeUnit(2, "cm")).toBe("cm");
    expect(pluralizeUnit(2, "kg")).toBe("kg");
    expect(pluralizeUnit(2, "%")).toBe("%");
    expect(pluralizeUnit(2, "m³/h")).toBe("m³/h");
  });

  it("palabras regulares se siguen pluralizando igual que antes", () => {
    expect(pluralizeUnit(1, "unidad")).toBe("unidad");
    expect(pluralizeUnit(2, "unidad")).toBe("unidades");
    expect(pluralizeUnit(1, "caja")).toBe("caja");
    expect(pluralizeUnit(2, "caja")).toBe("cajas");
    expect(pluralizeUnit(2, "tramo")).toBe("tramos");
  });

  it("irregulares (con acento que se pierde al pluralizar) sin cambios", () => {
    expect(pluralizeUnit(2, "galón")).toBe("galones");
    expect(pluralizeUnit(2, "camión")).toBe("camiones");
  });

  it("unidades compuestas: solo la primera palabra se pluraliza", () => {
    expect(pluralizeUnit(2, "pieza de 6m")).toBe("piezas de 6m");
  });
});

describe("pluralizeUnit — fix C2.1 (unidades de litros, Pintura para piscina)", () => {
  it('"L" nunca se pluraliza, en singular ni en plural', () => {
    expect(pluralizeUnit(1, "L")).toBe("L");
    expect(pluralizeUnit(2, "L")).toBe("L");
    expect(pluralizeUnit(9.05, "L")).toBe("L");
    expect(pluralizeUnit(18.1, "L")).toBe("L");
  });

  it('"m²/L" (rendimiento de pintura) nunca se pluraliza', () => {
    expect(pluralizeUnit(1, "m²/L")).toBe("m²/L");
    expect(pluralizeUnit(7, "m²/L")).toBe("m²/L");
  });

  it("la comparación no distingue mayúsculas/minúsculas (mismo criterio que el resto de INVARIANT)", () => {
    expect(pluralizeUnit(2, "l")).toBe("l");
    expect(pluralizeUnit(2, "m²/l")).toBe("m²/l");
  });
});

// Fase C6.1 (2026-09-02) — cobertura de las 5 unidades "$/X" agregadas a
// INVARIANT en C6 (bug real encontrado en vivo: "100000 $/m³es" en TU
// PROYECTO, antes del fix — mismo patrón de bug que C2.1 ya había
// corregido para "L").
describe("pluralizeUnit — precios de Costos (Fase C6, piscina-integral)", () => {
  const units = ["$/m³", "$/viaje", "$/l", "$/m²", "$/unidad"];

  it("nunca pluraliza estas 5 unidades, sin importar la cantidad", () => {
    for (const unit of units) {
      expect(pluralizeUnit(1, unit)).toBe(unit);
      expect(pluralizeUnit(0, unit)).toBe(unit);
      expect(pluralizeUnit(100000, unit)).toBe(unit);
    }
  });

  it('regresión del bug real: "$/m³" ya NO se convierte en "$/m³es"', () => {
    expect(pluralizeUnit(100000, "$/m³")).toBe("$/m³");
  });
});
