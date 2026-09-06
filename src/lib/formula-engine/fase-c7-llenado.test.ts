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
  // Fase C7-B (2026-09-05) -- modo de llenado + rangos de conexión + camión.
  { key: "llenado-modo-var", label: "Modo de llenado", valueType: "TEXT" as const, source: { type: "QUESTION", questionKey: "llenado-estimar" }, isResult: false },
  { key: "llenado-caudal-min-lookup", label: "", valueType: "NUMBER" as const, source: { type: "LOOKUP", table: { pequena: 15, "tres-cuartos": 35, "una-pulgada": 55 }, questionKey: "llenado-estimar" }, isResult: false },
  { key: "llenado-caudal-max-lookup", label: "", valueType: "NUMBER" as const, source: { type: "LOOKUP", table: { pequena: 35, "tres-cuartos": 70, "una-pulgada": 95 }, questionKey: "llenado-estimar" }, isResult: false },
  { key: "llenado-capacidad-camion-lookup", label: "", valueType: "NUMBER" as const, source: { type: "LOOKUP", table: { "10000": 10000, "15000": 15000, "20000": 20000 }, questionKey: "llenado-capacidad-camion" }, isResult: false },
  { key: "llenado-capacidad-camion-personalizada-var", label: "", valueType: "NUMBER" as const, source: { type: "QUESTION", questionKey: "llenado-capacidad-camion-personalizada" }, isResult: false },
  { key: "llenado-capacidad-camion-var", label: "", valueType: "TEXT" as const, source: { type: "QUESTION", questionKey: "llenado-capacidad-camion" }, isResult: false },
];

const eqVar = (variable: string, value: string) => ({ op: "==", args: [{ var: variable }, { str: value }] });
const neqVar = (variable: string, value: string) => ({ op: "!=", args: [{ var: variable }, { str: value }] });
const orC = (...args: object[]) => ({ op: "or", args });
const andC = (...args: object[]) => ({ op: "and", args });
const definedC = (key: string) => ({ op: "defined", key });
const MODO_CONEXION = andC(
  definedC("llenado-modo-var"),
  orC(eqVar("llenado-modo-var", "pequena"), eqVar("llenado-modo-var", "tres-cuartos"), eqVar("llenado-modo-var", "una-pulgada"))
);

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
  { key: "llenado-caudal-rango-min", label: "Caudal mínimo estimado", unit: "L/min", isResult: true, order: 137, condition: MODO_CONEXION, expression: { var: "llenado-caudal-min-lookup" } },
  { key: "llenado-caudal-rango-max", label: "Caudal máximo estimado", unit: "L/min", isResult: true, order: 138, condition: MODO_CONEXION, expression: { var: "llenado-caudal-max-lookup" } },
  { key: "llenado-tiempo-horas-min", label: "Tiempo estimado (más rápido)", unit: "hora", isResult: true, order: 139, condition: MODO_CONEXION, expression: { op: "/", args: [{ ref: "agua-volumen-litros" }, { op: "*", args: [{ ref: "llenado-caudal-rango-max" }, 60] }] } },
  { key: "llenado-tiempo-horas-max", label: "Tiempo estimado (más lento)", unit: "hora", isResult: true, order: 140, condition: MODO_CONEXION, expression: { op: "/", args: [{ ref: "agua-volumen-litros" }, { op: "*", args: [{ ref: "llenado-caudal-rango-min" }, 60] }] } },
  { key: "llenado-capacidad-camion-estandar", label: "Capacidad camión (estándar)", unit: "L", isResult: false, order: 141, condition: andC(definedC("llenado-capacidad-camion-var"), neqVar("llenado-capacidad-camion-var", "personalizado")), expression: { var: "llenado-capacidad-camion-lookup" } },
  { key: "llenado-capacidad-camion-personalizada-f", label: "Capacidad camión (personalizada)", unit: "L", isResult: false, order: 142, condition: andC(definedC("llenado-capacidad-camion-var"), eqVar("llenado-capacidad-camion-var", "personalizado")), expression: { var: "llenado-capacidad-camion-personalizada-var" } },
  { key: "llenado-capacidad-camion-final", label: "Capacidad del camión", unit: "L", isResult: true, order: 143, condition: andC(definedC("llenado-modo-var"), eqVar("llenado-modo-var", "camion")), expression: { op: "coalesce", args: [{ ref: "llenado-capacidad-camion-estandar" }, { ref: "llenado-capacidad-camion-personalizada-f" }] } },
  { key: "llenado-viajes-camion", label: "Viajes estimados", unit: "viaje", isResult: true, order: 144, condition: andC(definedC("llenado-modo-var"), eqVar("llenado-modo-var", "camion")), expression: { op: "ceil", value: { op: "/", args: [{ ref: "agua-volumen-litros" }, { ref: "llenado-capacidad-camion-final" }] } } },
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

// Fase C7-B (2026-09-05) -- rangos por tipo de conexión (sección 34 del
// pedido: QA Llenado).
describe("piscina-integral — Llenado por rango de conexión (Fase C7-B)", () => {
  it('conexión "llave doméstica / pequeña": 15-35 L/min', () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "llenado-estimar": "pequena", "agua-volumen-litros": 42412 },
    });
    expect(resultOf(results, "llenado-caudal-rango-min")).toBe(15);
    expect(resultOf(results, "llenado-caudal-rango-max")).toBe(35);
    // tiempo más rápido con el caudal MÁXIMO, más lento con el MÍNIMO
    expect(resultOf(results, "llenado-tiempo-horas-min")).toBeCloseTo(42412 / (35 * 60), 6);
    expect(resultOf(results, "llenado-tiempo-horas-max")).toBeCloseTo(42412 / (15 * 60), 6);
  });

  it('QA del pedido: 108.000 L con conexión 3/4" (35-70 L/min) -> aprox. 26-51 horas', () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "llenado-estimar": "tres-cuartos", "agua-volumen-litros": 108000 },
    });
    expect(resultOf(results, "llenado-caudal-rango-min")).toBe(35);
    expect(resultOf(results, "llenado-caudal-rango-max")).toBe(70);
    expect(resultOf(results, "llenado-tiempo-horas-min")).toBeCloseTo(25.714285714, 6);
    expect(resultOf(results, "llenado-tiempo-horas-max")).toBeCloseTo(51.428571429, 6);
  });

  it('conexión 1": 55-95 L/min', () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "llenado-estimar": "una-pulgada", "agua-volumen-litros": 42412 },
    });
    expect(resultOf(results, "llenado-caudal-rango-min")).toBe(55);
    expect(resultOf(results, "llenado-caudal-rango-max")).toBe(95);
  });

  it('modo "medir" -> ninguna Formula de rango calcula (mutuamente excluyente con conexión)', () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "llenado-estimar": "medir", "llenado-segundos-balde": 40, "agua-volumen-litros": 42412 },
    });
    expect(hasResult(results, "llenado-caudal-rango-min")).toBe(false);
    expect(hasResult(results, "llenado-caudal-l-min")).toBe(true);
  });
});

describe("piscina-integral — Llenado con camión aljibe (Fase C7-B)", () => {
  it("QA del pedido: 42.412 L con camión de 15.000 L -> 3 viajes", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "llenado-estimar": "camion", "llenado-capacidad-camion": "15000", "agua-volumen-litros": 42412 },
    });
    expect(resultOf(results, "llenado-capacidad-camion-final")).toBe(15000);
    expect(resultOf(results, "llenado-viajes-camion")).toBe(3);
  });

  it("capacidad personalizada (8.500 L): 42.412 L -> 5 viajes", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        "llenado-estimar": "camion",
        "llenado-capacidad-camion": "personalizado",
        "llenado-capacidad-camion-personalizada": 8500,
        "agua-volumen-litros": 42412,
      },
    });
    expect(resultOf(results, "llenado-capacidad-camion-final")).toBe(8500);
    expect(resultOf(results, "llenado-viajes-camion")).toBe(5);
  });

  it("exacto sin resto: 30.000 L con camión de 10.000 L -> 3 viajes (sin redondear de más)", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "llenado-estimar": "camion", "llenado-capacidad-camion": "10000", "agua-volumen-litros": 30000 },
    });
    expect(resultOf(results, "llenado-viajes-camion")).toBe(3);
  });
});
