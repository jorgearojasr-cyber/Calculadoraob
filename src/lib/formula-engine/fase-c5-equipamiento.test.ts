import { describe, expect, it } from "vitest";
import { calculateModule } from "./index";

// Fase C5 (2026-09-02) — Equipamiento hidráulico básico del configurador
// integral de Piscina ("piscina-integral"). DSL construido a mano
// reflejando EXACTAMENTE lo que queda en prisma/db-fixes/fase-c5-
// piscina-integral-equipamiento.ts (mismo criterio que fase-c4-2-agua.
// test.ts) — no duplica el motor, solo fija el contrato numérico de C5.
// Incluye las piezas mínimas de C4.2 de las que depende (agua-volumen-m3
// rect/circ + su coalesce), sin repetir el resto del Module.

function resultOf(results: ReturnType<typeof calculateModule>["results"], key: string) {
  const r = results.find((x) => x.key === key);
  if (!r) throw new Error(`No se encontró el resultado "${key}"`);
  return r.value;
}

const eqForma = (v: string) => ({ op: "==", args: [{ var: "forma" }, { str: v }] });

const variables = [
  { key: "forma", label: "Forma", valueType: "TEXT", source: { type: "QUESTION", questionKey: "que-forma-tendra-tu-piscina" }, isResult: false },
  { key: "largo", label: "Largo", source: { type: "QUESTION", questionKey: "largo-interior-metros" }, isResult: false },
  { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho-interior-metros" }, isResult: false },
  { key: "profundidad-rect", label: "Profundidad (rect)", source: { type: "QUESTION", questionKey: "profundidad-interior-metros" }, isResult: false },
  { key: "diametro", label: "Diámetro", source: { type: "QUESTION", questionKey: "diametro-interior-metros" }, isResult: false },
  { key: "profundidad-circ", label: "Profundidad (circ)", source: { type: "QUESTION", questionKey: "profundidad-interior-metros-circular" }, isResult: false },
  {
    key: "equipamiento-horas-recirculacion",
    label: "Horas de recirculación",
    source: { type: "LOOKUP", questionKey: "equipamiento-tiempo-recirculacion-h", table: { "6": 6, "8": 8 } },
    isResult: false,
  },
].map((v) => ({ valueType: "NUMBER" as const, ...v }));

const formulas = [
  // --- C1 (mínimo para el caso circular) ---
  { key: "radio", label: "Radio interior", unit: "m", isResult: false, order: 12, condition: eqForma("circular"), expression: { op: "/", args: [{ var: "diametro" }, 2] } },

  // --- C4.2 (agua) ---
  { key: "agua-volumen-m3-rect", label: "", unit: "m³", isResult: false, order: 120, condition: eqForma("rectangular"), expression: { op: "*", args: [{ op: "*", args: [{ var: "largo" }, { var: "ancho" }] }, { var: "profundidad-rect" }] } },
  { key: "agua-volumen-m3-circ", label: "", unit: "m³", isResult: false, order: 121, condition: eqForma("circular"), expression: { op: "*", args: [3.14159265358979, { op: "*", args: [{ op: "*", args: [{ ref: "radio" }, { ref: "radio" }] }, { var: "profundidad-circ" }] }] } },
  { key: "agua-volumen-m3", label: "Volumen de agua", unit: "m³", isResult: true, order: 122, expression: { op: "coalesce", args: [{ ref: "agua-volumen-m3-rect" }, { ref: "agua-volumen-m3-circ" }] } },

  // --- C5 ---
  { key: "equipamiento-caudal-recirculacion-m3h", label: "Caudal de recirculación estimado", unit: "m³/h", isResult: true, order: 130, expression: { op: "/", args: [{ ref: "agua-volumen-m3" }, { var: "equipamiento-horas-recirculacion" }] } },
  { key: "equipamiento-filtro-caudal-minimo-m3h", label: "Filtro — caudal nominal mínimo", unit: "m³/h", isResult: true, order: 131, expression: { ref: "equipamiento-caudal-recirculacion-m3h" } },
].map((f) => ({ note: null, material: null, condition: null, ...f }));

const RECT_BASE = {
  "que-forma-tendra-tu-piscina": "rectangular",
  "largo-interior-metros": 12,
  "ancho-interior-metros": 6,
  "profundidad-interior-metros": 1.5,
};
const CIRC_BASE = {
  "que-forma-tendra-tu-piscina": "circular",
  "diametro-interior-metros": 6,
  "profundidad-interior-metros-circular": 1.5,
};

describe("piscina-integral — Equipamiento (Fase C5)", () => {
  it("rectangular, 6h: 108 / 6 = 18 m³/h", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { ...RECT_BASE, "equipamiento-tiempo-recirculacion-h": "6" },
    });
    expect(resultOf(results, "equipamiento-caudal-recirculacion-m3h")).toBeCloseTo(18, 8);
    expect(resultOf(results, "equipamiento-filtro-caudal-minimo-m3h")).toBeCloseTo(18, 8);
  });

  it("rectangular, 8h: 108 / 8 = 13,5 m³/h", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { ...RECT_BASE, "equipamiento-tiempo-recirculacion-h": "8" },
    });
    expect(resultOf(results, "equipamiento-caudal-recirculacion-m3h")).toBeCloseTo(13.5, 8);
    expect(resultOf(results, "equipamiento-filtro-caudal-minimo-m3h")).toBeCloseTo(13.5, 8);
  });

  it("circular, 6h: ≈42,41150082 / 6 ≈ 7,06858347 m³/h", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { ...CIRC_BASE, "equipamiento-tiempo-recirculacion-h": "6" },
    });
    const agua = Math.PI * 3 * 3 * 1.5;
    expect(resultOf(results, "equipamiento-caudal-recirculacion-m3h")).toBeCloseTo(agua / 6, 8);
  });

  it("circular, 8h: ≈42,41150082 / 8 ≈ 5,30143760 m³/h", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { ...CIRC_BASE, "equipamiento-tiempo-recirculacion-h": "8" },
    });
    const agua = Math.PI * 3 * 3 * 1.5;
    expect(resultOf(results, "equipamiento-caudal-recirculacion-m3h")).toBeCloseTo(agua / 8, 8);
  });

  it("cambio de tiempo (6h -> 8h -> 6h): el caudal cambia, el agua no", () => {
    const r6a = calculateModule({ variables, formulas, lossFactors: [], answers: { ...RECT_BASE, "equipamiento-tiempo-recirculacion-h": "6" } }).results;
    const r8 = calculateModule({ variables, formulas, lossFactors: [], answers: { ...RECT_BASE, "equipamiento-tiempo-recirculacion-h": "8" } }).results;
    const r6b = calculateModule({ variables, formulas, lossFactors: [], answers: { ...RECT_BASE, "equipamiento-tiempo-recirculacion-h": "6" } }).results;
    expect(resultOf(r6a, "agua-volumen-m3")).toBeCloseTo(108, 8);
    expect(resultOf(r8, "agua-volumen-m3")).toBeCloseTo(108, 8);
    expect(resultOf(r6b, "agua-volumen-m3")).toBeCloseTo(108, 8);
    expect(resultOf(r6a, "equipamiento-caudal-recirculacion-m3h")).toBeCloseTo(18, 8);
    expect(resultOf(r8, "equipamiento-caudal-recirculacion-m3h")).toBeCloseTo(13.5, 8);
    expect(resultOf(r6b, "equipamiento-caudal-recirculacion-m3h")).toBeCloseTo(18, 8);
  });

  it("cambio de shape (rect -> circ): el caudal recalcula sobre el agua vigente, sin residuo de la forma anterior", () => {
    const rect = calculateModule({ variables, formulas, lossFactors: [], answers: { ...RECT_BASE, "equipamiento-tiempo-recirculacion-h": "6" } }).results;
    const circ = calculateModule({ variables, formulas, lossFactors: [], answers: { ...CIRC_BASE, "equipamiento-tiempo-recirculacion-h": "6" } }).results;
    expect(resultOf(rect, "equipamiento-caudal-recirculacion-m3h")).toBeCloseTo(18, 8);
    expect(resultOf(circ, "equipamiento-caudal-recirculacion-m3h")).toBeCloseTo((Math.PI * 3 * 3 * 1.5) / 6, 8);
  });
});
