import { describe, expect, it } from "vitest";
import { calculateModule } from "./index";

// Fase C4.2 (2026-09-02) — Volumen de agua del configurador integral de
// Piscina ("piscina-integral"). DSL construido a mano reflejando
// EXACTAMENTE lo que queda en prisma/db-fixes/fase-c4-2-piscina-integral-
// consolidacion.ts (mismo criterio que fase-c4-entorno.test.ts) — no
// duplica el motor, solo fija el contrato numérico de C4.2. Incluye la
// pieza mínima de C1 de la que depende el caso circular ("radio",
// isResult:false, ya existente desde C1), sin repetir el resto del
// Module.

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
].map((v) => ({ valueType: "NUMBER" as const, ...v }));

const formulas = [
  // --- C1 (mínimo necesario para el caso circular: "radio" ya existe
  // desde C1, order 12, isResult:false, condición circular) ---
  { key: "radio", label: "Radio interior", unit: "m", isResult: false, order: 12, condition: eqForma("circular"), expression: { op: "/", args: [{ var: "diametro" }, 2] } },

  // --- C4.2 ---
  { key: "agua-volumen-m3-rect", label: "", unit: "m³", isResult: false, order: 120, condition: eqForma("rectangular"), expression: { op: "*", args: [{ op: "*", args: [{ var: "largo" }, { var: "ancho" }] }, { var: "profundidad-rect" }] } },
  { key: "agua-volumen-m3-circ", label: "", unit: "m³", isResult: false, order: 121, condition: eqForma("circular"), expression: { op: "*", args: [3.14159265358979, { op: "*", args: [{ op: "*", args: [{ ref: "radio" }, { ref: "radio" }] }, { var: "profundidad-circ" }] }] } },
  { key: "agua-volumen-m3", label: "Volumen de agua", unit: "m³", isResult: true, order: 122, expression: { op: "coalesce", args: [{ ref: "agua-volumen-m3-rect" }, { ref: "agua-volumen-m3-circ" }] } },
  { key: "agua-volumen-litros", label: "Volumen de agua", unit: "L", isResult: true, order: 123, expression: { op: "*", args: [{ ref: "agua-volumen-m3" }, 1000] } },
].map((f) => ({ note: null, material: null, condition: null, ...f }));

describe("piscina-integral — Volumen de agua (Fase C4.2)", () => {
  it("rectangular: 12×6×1,5 -> 108 m³ / 108.000 L", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        "que-forma-tendra-tu-piscina": "rectangular",
        "largo-interior-metros": 12,
        "ancho-interior-metros": 6,
        "profundidad-interior-metros": 1.5,
      },
    });
    expect(resultOf(results, "agua-volumen-m3")).toBeCloseTo(108, 8);
    expect(resultOf(results, "agua-volumen-litros")).toBeCloseTo(108000, 6);
  });

  it("circular: D=6, prof=1,5 -> π×3²×1,5 ≈ 42,4115 m³ / ≈42.412 L", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        "que-forma-tendra-tu-piscina": "circular",
        "diametro-interior-metros": 6,
        "profundidad-interior-metros-circular": 1.5,
      },
    });
    expect(resultOf(results, "agua-volumen-m3")).toBeCloseTo(Math.PI * 3 * 3 * 1.5, 6);
    expect(resultOf(results, "agua-volumen-litros")).toBeCloseTo(Math.PI * 3 * 3 * 1.5 * 1000, 3);
  });

  it("cambio de shape: agua no queda cacheada de una forma a otra (coalesce siempre toma la rama vigente)", () => {
    const rect = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "que-forma-tendra-tu-piscina": "rectangular", "largo-interior-metros": 10, "ancho-interior-metros": 6, "profundidad-interior-metros": 1.5 },
    });
    expect(resultOf(rect.results, "agua-volumen-m3")).toBeCloseTo(90, 8);

    const circ = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "que-forma-tendra-tu-piscina": "circular", "diametro-interior-metros": 6, "profundidad-interior-metros-circular": 1.5 },
    });
    expect(resultOf(circ.results, "agua-volumen-m3")).toBeCloseTo(Math.PI * 3 * 3 * 1.5, 6);
  });
});
