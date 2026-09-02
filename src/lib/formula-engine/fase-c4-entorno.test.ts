import { describe, expect, it } from "vitest";
import { calculateModule } from "./index";

// Fase C4 (2026-09-02) — Entorno/Borde del configurador integral de
// Piscina ("piscina-integral"). DSL construido a mano reflejando
// EXACTAMENTE lo que queda en prisma/db-fixes/fase-c4-piscina-integral-
// entorno.ts (mismo criterio que fase-c3-excavacion.test.ts) — no
// duplica el motor, solo fija el contrato numérico de C4 para detectar
// regresiones sin depender de la BD real. Incluye las piezas mínimas de
// C1 de las que C4 depende (largo-ext/ancho-ext/radio-ext), sin repetir
// el resto del Module.

function resultOf(results: ReturnType<typeof calculateModule>["results"], key: string) {
  const r = results.find((x) => x.key === key);
  if (!r) throw new Error(`No se encontró el resultado "${key}"`);
  return r.value;
}

function hasResult(results: ReturnType<typeof calculateModule>["results"], key: string) {
  return results.some((x) => x.key === key);
}

const eqForma = (v: string) => ({ op: "==", args: [{ var: "forma" }, { str: v }] });
const eqTerm = (v: string) => ({ op: "==", args: [{ var: "entorno-terminacion" }, { str: v }] });
const and = (...args: object[]) => ({ op: "and", args });
const withLoss = (base: object, varKey: string) => ({
  op: "*",
  args: [base, { op: "+", args: [1, { op: "/", args: [{ var: varKey }, 100] }] }],
});

const variables = [
  { key: "forma", label: "Forma", valueType: "TEXT", source: { type: "QUESTION", questionKey: "que-forma-tendra-tu-piscina" }, isResult: false },
  { key: "largo", label: "Largo", source: { type: "QUESTION", questionKey: "largo-interior-metros" }, isResult: false },
  { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho-interior-metros" }, isResult: false },
  { key: "diametro", label: "Diámetro", source: { type: "QUESTION", questionKey: "diametro-interior-metros" }, isResult: false },
  { key: "espesor-muro-cm-rect", label: "Espesor muro (rect)", source: { type: "QUESTION", questionKey: "espesor-de-los-muros-cm" }, isResult: false },
  { key: "espesor-muro-cm-circ", label: "Espesor muro (circ)", source: { type: "QUESTION", questionKey: "espesor-de-los-muros-cm-circular" }, isResult: false },
  { key: "entorno-ancho-m", label: "Ancho del entorno", source: { type: "QUESTION", questionKey: "entorno-ancho-m" }, isResult: false },
  { key: "entorno-terminacion", label: "Terminación exterior", valueType: "TEXT", source: { type: "QUESTION", questionKey: "entorno-terminacion" }, isResult: false },
  { key: "entorno-base-existente", label: "Base existente", valueType: "TEXT", source: { type: "QUESTION", questionKey: "entorno-base-existente" }, isResult: false },
  { key: "entorno-espesor-base-cm", label: "Espesor de la base", source: { type: "QUESTION", questionKey: "entorno-espesor-base-cm" }, isResult: false },
  { key: "entorno-espesor-radier-cm", label: "Espesor del radier terminado", source: { type: "QUESTION", questionKey: "entorno-espesor-radier-cm" }, isResult: false },
  { key: "entorno-perdida-terminacion-pct", label: "Margen/pérdida", source: { type: "QUESTION", questionKey: "entorno-perdida-terminacion-pct" }, isResult: false },
  { key: "entorno-tamano-pastelon", label: "Tamaño de pastelón", valueType: "TEXT", source: { type: "QUESTION", questionKey: "entorno-tamano-pastelon" }, isResult: false },
  {
    key: "entorno-pastelon-cobertura-m2",
    label: "Cobertura por pastelón (m²)",
    source: { type: "LOOKUP", table: { "40x40cm": 0.16, "50x50cm": 0.25, "60x40cm": 0.24 }, questionKey: "entorno-tamano-pastelon" },
    isResult: false,
  },
].map((v) => ({ valueType: "NUMBER" as const, ...v }));

const formulas = [
  // --- C1 (mínimo necesario) ---
  { key: "espesor-muro-m-rect", label: "", unit: "m", isResult: false, order: 1, condition: eqForma("rectangular"), expression: { op: "/", args: [{ var: "espesor-muro-cm-rect" }, 100] } },
  { key: "espesor-muro-m-circ", label: "", unit: "m", isResult: false, order: 2, condition: eqForma("circular"), expression: { op: "/", args: [{ var: "espesor-muro-cm-circ" }, 100] } },
  { key: "largo-ext", label: "", unit: "m", isResult: false, order: 10, condition: eqForma("rectangular"), expression: { op: "+", args: [{ var: "largo" }, { op: "*", args: [2, { ref: "espesor-muro-m-rect" }] }] } },
  { key: "ancho-ext", label: "", unit: "m", isResult: false, order: 11, condition: eqForma("rectangular"), expression: { op: "+", args: [{ var: "ancho" }, { op: "*", args: [2, { ref: "espesor-muro-m-rect" }] }] } },
  { key: "radio", label: "", unit: "m", isResult: false, order: 12, condition: eqForma("circular"), expression: { op: "/", args: [{ var: "diametro" }, 2] } },
  { key: "radio-ext", label: "", unit: "m", isResult: false, order: 13, condition: eqForma("circular"), expression: { op: "+", args: [{ ref: "radio" }, { ref: "espesor-muro-m-circ" }] } },

  // --- C4 ---
  { key: "entorno-area-total-rect", label: "", unit: "m²", isResult: false, order: 100, condition: eqForma("rectangular"), expression: { op: "*", args: [{ op: "+", args: [{ ref: "largo-ext" }, { op: "*", args: [2, { var: "entorno-ancho-m" }] }] }, { op: "+", args: [{ ref: "ancho-ext" }, { op: "*", args: [2, { var: "entorno-ancho-m" }] }] }] } },
  { key: "entorno-area-vaso-rect", label: "", unit: "m²", isResult: false, order: 101, condition: eqForma("rectangular"), expression: { op: "*", args: [{ ref: "largo-ext" }, { ref: "ancho-ext" }] } },
  { key: "entorno-area-rect", label: "", unit: "m²", isResult: false, order: 102, condition: eqForma("rectangular"), expression: { op: "-", args: [{ ref: "entorno-area-total-rect" }, { ref: "entorno-area-vaso-rect" }] } },
  { key: "entorno-radio-total-circ", label: "", unit: "m", isResult: false, order: 103, condition: eqForma("circular"), expression: { op: "+", args: [{ ref: "radio-ext" }, { var: "entorno-ancho-m" }] } },
  { key: "entorno-area-total-circ", label: "", unit: "m²", isResult: false, order: 104, condition: eqForma("circular"), expression: { op: "*", args: [3.14159265358979, { op: "*", args: [{ ref: "entorno-radio-total-circ" }, { ref: "entorno-radio-total-circ" }] }] } },
  { key: "entorno-area-vaso-circ", label: "", unit: "m²", isResult: false, order: 105, condition: eqForma("circular"), expression: { op: "*", args: [3.14159265358979, { op: "*", args: [{ ref: "radio-ext" }, { ref: "radio-ext" }] }] } },
  { key: "entorno-area-circ", label: "", unit: "m²", isResult: false, order: 106, condition: eqForma("circular"), expression: { op: "-", args: [{ ref: "entorno-area-total-circ" }, { ref: "entorno-area-vaso-circ" }] } },
  { key: "entorno-area", label: "Área del entorno", unit: "m²", isResult: true, order: 107, expression: { op: "coalesce", args: [{ ref: "entorno-area-rect" }, { ref: "entorno-area-circ" }] } },

  { key: "entorno-espesor-base-m", label: "", unit: "m", isResult: false, order: 108, condition: and({ op: "!=", args: [{ var: "entorno-terminacion" }, { str: "radier" }] }, { op: "==", args: [{ var: "entorno-base-existente" }, { str: "no" }] }), expression: { op: "/", args: [{ var: "entorno-espesor-base-cm" }, 100] } },
  { key: "entorno-volumen-base", label: "Volumen de la base/radier", unit: "m³", isResult: true, order: 109, condition: and({ op: "!=", args: [{ var: "entorno-terminacion" }, { str: "radier" }] }, { op: "==", args: [{ var: "entorno-base-existente" }, { str: "no" }] }), expression: { op: "*", args: [{ ref: "entorno-area" }, { ref: "entorno-espesor-base-m" }] } },

  { key: "entorno-espesor-radier-m", label: "", unit: "m", isResult: false, order: 110, condition: eqTerm("radier"), expression: { op: "/", args: [{ var: "entorno-espesor-radier-cm" }, 100] } },
  { key: "entorno-volumen-radier-terminado", label: "Volumen de hormigón (radier terminado)", unit: "m³", isResult: true, order: 111, condition: eqTerm("radier"), expression: { op: "*", args: [{ ref: "entorno-area" }, { ref: "entorno-espesor-radier-m" }] } },

  { key: "entorno-ceramica-m2-compra", label: "Cerámica — m² a comprar (con pérdida)", unit: "m²", isResult: true, order: 112, condition: eqTerm("ceramica"), expression: withLoss({ ref: "entorno-area" }, "entorno-perdida-terminacion-pct") },
  { key: "entorno-porcelanato-m2-compra", label: "Porcelanato — m² a comprar (con pérdida)", unit: "m²", isResult: true, order: 113, condition: eqTerm("porcelanato"), expression: withLoss({ ref: "entorno-area" }, "entorno-perdida-terminacion-pct") },

  { key: "entorno-pastelones-area-con-perdida", label: "", unit: "m²", isResult: false, order: 114, condition: eqTerm("pastelones"), expression: { op: "*", args: [{ ref: "entorno-area" }, 1.08] } },
  { key: "entorno-pastelones-unidades", label: "Pastelones — unidades estimadas", unit: "unidad", isResult: true, order: 115, condition: eqTerm("pastelones"), expression: { op: "ceil", value: { op: "/", args: [{ ref: "entorno-pastelones-area-con-perdida" }, { var: "entorno-pastelon-cobertura-m2" }] } } },
].map((f) => ({ note: null, material: null, condition: null, ...f }));

const BASE_RECT_ANSWERS = {
  "que-forma-tendra-tu-piscina": "rectangular",
  "largo-interior-metros": 12,
  "ancho-interior-metros": 6,
  "espesor-de-los-muros-cm": 15,
  "entorno-ancho-m": 1.5,
};

describe("piscina-integral — Entorno/Borde (Fase C4)", () => {
  it("rectangular: 12×6, muro 15cm, entorno 1,5m -> área 64,80 m²; base nueva 10cm -> volumen 6,48 m³; Cerámica pérdida 10% -> 71,28 m²", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        ...BASE_RECT_ANSWERS,
        "entorno-terminacion": "ceramica",
        "entorno-base-existente": "no",
        "entorno-espesor-base-cm": 10,
        "entorno-perdida-terminacion-pct": 10,
      },
    });
    expect(resultOf(results, "entorno-area")).toBeCloseTo(64.8, 8);
    expect(resultOf(results, "entorno-volumen-base")).toBeCloseTo(6.48, 8);
    expect(resultOf(results, "entorno-ceramica-m2-compra")).toBeCloseTo(71.28, 8);
    expect(hasResult(results, "entorno-volumen-radier-terminado")).toBe(false);
  });

  it("rectangular: base existente + Porcelanato -> NO hay volumen de base, solo m² de porcelanato", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        ...BASE_RECT_ANSWERS,
        "entorno-terminacion": "porcelanato",
        "entorno-base-existente": "si",
        "entorno-perdida-terminacion-pct": 10,
      },
    });
    expect(resultOf(results, "entorno-area")).toBeCloseTo(64.8, 8);
    expect(hasResult(results, "entorno-volumen-base")).toBe(false);
    expect(resultOf(results, "entorno-porcelanato-m2-compra")).toBeCloseTo(71.28, 8);
  });

  it("rectangular: Radier terminado -> UNA sola partida de hormigón (sin doble conteo con base)", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        ...BASE_RECT_ANSWERS,
        "entorno-terminacion": "radier",
        "entorno-espesor-radier-cm": 10,
      },
    });
    expect(resultOf(results, "entorno-area")).toBeCloseTo(64.8, 8);
    expect(resultOf(results, "entorno-volumen-radier-terminado")).toBeCloseTo(6.48, 8);
    expect(hasResult(results, "entorno-volumen-base")).toBe(false);
  });

  it("rectangular: Pastelones 50x50cm -> 280 unidades (ceil(64,8×1,08/0,25))", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        ...BASE_RECT_ANSWERS,
        "entorno-terminacion": "pastelones",
        "entorno-base-existente": "no",
        "entorno-espesor-base-cm": 10,
        "entorno-tamano-pastelon": "50x50cm",
      },
    });
    expect(resultOf(results, "entorno-pastelones-unidades")).toBe(280);
    expect(resultOf(results, "entorno-volumen-base")).toBeCloseTo(6.48, 8);
  });

  it("rectangular: Sin calcular -> área visible, base nueva independiente, sin cantidad de material", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        ...BASE_RECT_ANSWERS,
        "entorno-terminacion": "sin-calcular",
        "entorno-base-existente": "no",
        "entorno-espesor-base-cm": 10,
      },
    });
    expect(resultOf(results, "entorno-area")).toBeCloseTo(64.8, 8);
    expect(resultOf(results, "entorno-volumen-base")).toBeCloseTo(6.48, 8);
    expect(hasResult(results, "entorno-ceramica-m2-compra")).toBe(false);
    expect(hasResult(results, "entorno-porcelanato-m2-compra")).toBe(false);
    expect(hasResult(results, "entorno-pastelones-unidades")).toBe(false);
    expect(hasResult(results, "entorno-volumen-radier-terminado")).toBe(false);
  });

  it("circular: D=6m, muro 20cm, entorno 1,5m -> radioExt 3,2, radioEntorno 4,7, área π×(4,7²−3,2²)", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        "que-forma-tendra-tu-piscina": "circular",
        "diametro-interior-metros": 6,
        "espesor-de-los-muros-cm-circular": 20,
        "entorno-ancho-m": 1.5,
        "entorno-terminacion": "ceramica",
        "entorno-base-existente": "no",
        "entorno-espesor-base-cm": 10,
        "entorno-perdida-terminacion-pct": 10,
      },
    });
    expect(resultOf(results, "entorno-area")).toBeCloseTo(Math.PI * (4.7 ** 2 - 3.2 ** 2), 6);
  });
});
