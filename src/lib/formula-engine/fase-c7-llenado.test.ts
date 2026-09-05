import { describe, expect, it } from "vitest";
import { calculateModule } from "./index";

// Fase C7 (2026-09-04) — Llenado del configurador integral de Piscina
// ("piscina-integral"). DSL construido a mano reflejando EXACTAMENTE lo que
// queda en prisma/db-fixes/fase-c7-piscina-integral-llenado.ts (mismo
// criterio que fase-c4-entorno.test.ts) — no duplica el motor, solo fija
// el contrato numérico de C7 para detectar regresiones sin depender de la
// BD real. Incluye "agua-volumen-litros" (YA existente desde C4.2) como
// Variable de entrada directa (no recalcula geometría — no es lo que este
// archivo prueba).

function resultOf(results: ReturnType<typeof calculateModule>["results"], key: string) {
  const r = results.find((x) => x.key === key);
  if (!r) throw new Error(`No se encontró el resultado "${key}"`);
  return r.value;
}

function hasResult(results: ReturnType<typeof calculateModule>["results"], key: string) {
  return results.some((x) => x.key === key);
}

const variables = [
  { key: "llenado-segundos-balde", label: "Segundos para llenar balde de 10 L", valueType: "NUMBER" as const, source: { type: "QUESTION", questionKey: "llenado-segundos-balde" }, isResult: false },
  // Fixture de test únicamente -- representa "agua-volumen-litros" YA
  // calculado por C4.2 (fase-c4-2-piscina-integral-consolidacion.ts), acá
  // alimentado directo por respuesta en vez de recalcular toda la
  // geometría de Medidas (fuera del alcance de este test).
  { key: "agua-volumen-litros-input", label: "", valueType: "NUMBER" as const, source: { type: "QUESTION", questionKey: "agua-volumen-litros" }, isResult: false },
];

const formulas = [
  {
    key: "agua-volumen-litros",
    label: "",
    unit: "L",
    isResult: false,
    order: 1,
    condition: null,
    expression: { var: "agua-volumen-litros-input" },
  },
  {
    key: "llenado-caudal-l-min",
    label: "Caudal medido (balde)",
    unit: "L/min",
    isResult: true,
    order: 135,
    condition: { op: "defined", key: "llenado-segundos-balde" },
    expression: { op: "/", args: [10, { op: "/", args: [{ var: "llenado-segundos-balde" }, 60] }] },
  },
  {
    key: "llenado-tiempo-horas",
    label: "Tiempo estimado de llenado",
    unit: "hora",
    isResult: true,
    order: 136,
    condition: { op: "defined", key: "llenado-segundos-balde" },
    expression: {
      op: "/",
      args: [{ ref: "agua-volumen-litros" }, { op: "*", args: [{ ref: "llenado-caudal-l-min" }, 60] }],
    },
  },
].map((f) => ({ note: null, material: null, ...f }));

describe("piscina-integral — Llenado (Fase C7)", () => {
  it('QA del pedido: 10 L en 40 s -> 15 L/min; piscina de 42.412 L -> ≈47,12 h', () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "llenado-segundos-balde": 40, "agua-volumen-litros": 42412 },
    });
    expect(resultOf(results, "llenado-caudal-l-min")).toBeCloseTo(15, 8);
    expect(resultOf(results, "llenado-tiempo-horas")).toBeCloseTo(47.124444444, 6);
  });

  it('responder "No" (sin segundos ingresados) -> ninguna Formula de Llenado calcula, nunca "0" ni un valor inventado', () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "llenado-estimar": "no", "agua-volumen-litros": 42412 },
    });
    expect(hasResult(results, "llenado-caudal-l-min")).toBe(false);
    expect(hasResult(results, "llenado-tiempo-horas")).toBe(false);
  });

  it("segundos = 0 no ingresado (undefined) -> tampoco calcula (mismo criterio que Costos: vacío = ausente, no 0)", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "agua-volumen-litros": 42412 },
    });
    expect(hasResult(results, "llenado-caudal-l-min")).toBe(false);
  });

  it("otro valor medido real: 10 L en 25 s -> 24 L/min", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "llenado-segundos-balde": 25, "agua-volumen-litros": 30000 },
    });
    expect(resultOf(results, "llenado-caudal-l-min")).toBeCloseTo(24, 8);
    expect(resultOf(results, "llenado-tiempo-horas")).toBeCloseTo(30000 / (24 * 60), 8);
  });
});
