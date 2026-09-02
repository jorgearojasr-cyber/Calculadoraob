import { describe, expect, it } from "vitest";
import { calculateModule } from "./index";

// Fase C3 (2026-09-01) — Excavación automática del configurador integral
// de Piscina ("piscina-integral"). DSL construido a mano reflejando
// EXACTAMENTE lo que queda en prisma/db-fixes/fase-c3-piscina-integral-
// excavacion.ts (mismo criterio que fase6d-fundacion.test.ts) — no
// duplica el motor, solo fija el contrato numérico de C3 para detectar
// regresiones sin depender de la BD real. Incluye las piezas mínimas de
// C1 de las que C3 depende (largo-ext/ancho-ext/diametro-ext/espesor-
// fondo-m-*), sin repetir el resto del Module.

function resultOf(results: ReturnType<typeof calculateModule>["results"], key: string) {
  const r = results.find((x) => x.key === key);
  if (!r) throw new Error(`No se encontró el resultado "${key}"`);
  return r.value;
}

const eqForma = (v: string) => ({ op: "==", args: [{ var: "forma" }, { str: v }] });
const eqCamion = (v: string) => ({ op: "==", args: [{ var: "excavacion-tipo-camion" }, { str: v }] });

const variables = [
  { key: "forma", label: "Forma", valueType: "TEXT", source: { type: "QUESTION", questionKey: "que-forma-tendra-tu-piscina" }, isResult: false },
  { key: "largo", label: "Largo", source: { type: "QUESTION", questionKey: "largo-interior-metros" }, isResult: false },
  { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho-interior-metros" }, isResult: false },
  { key: "profundidad-rect", label: "Profundidad (rect)", source: { type: "QUESTION", questionKey: "profundidad-interior-metros" }, isResult: false },
  { key: "diametro", label: "Diámetro", source: { type: "QUESTION", questionKey: "diametro-interior-metros" }, isResult: false },
  { key: "profundidad-circ", label: "Profundidad (circ)", source: { type: "QUESTION", questionKey: "profundidad-interior-metros-circular" }, isResult: false },
  { key: "espesor-muro-cm-rect", label: "Espesor muro (rect)", source: { type: "QUESTION", questionKey: "espesor-de-los-muros-cm" }, isResult: false },
  { key: "espesor-fondo-cm-rect", label: "Espesor fondo (rect)", source: { type: "QUESTION", questionKey: "espesor-del-fondo-losa-cm" }, isResult: false },
  { key: "espesor-muro-cm-circ", label: "Espesor muro (circ)", source: { type: "QUESTION", questionKey: "espesor-de-los-muros-cm-circular" }, isResult: false },
  { key: "espesor-fondo-cm-circ", label: "Espesor fondo (circ)", source: { type: "QUESTION", questionKey: "espesor-del-fondo-losa-cm-circular" }, isResult: false },
  { key: "excavacion-espacio-trabajo-cm", label: "Espacio de trabajo", source: { type: "QUESTION", questionKey: "excavacion-espacio-trabajo-cm" }, isResult: false },
  { key: "excavacion-preparacion-losa-cm", label: "Preparación bajo losa", source: { type: "QUESTION", questionKey: "excavacion-preparacion-losa-cm" }, isResult: false },
  { key: "excavacion-tipo-terreno", label: "Tipo de terreno", valueType: "TEXT", source: { type: "QUESTION", questionKey: "excavacion-tipo-terreno" }, isResult: false },
  { key: "excavacion-tipo-camion", label: "Tipo de camión", valueType: "TEXT", source: { type: "QUESTION", questionKey: "excavacion-tipo-camion" }, isResult: false },
  { key: "excavacion-capacidad-personalizada-m3", label: "Capacidad personalizada", source: { type: "QUESTION", questionKey: "excavacion-capacidad-personalizada-m3" }, isResult: false },
  {
    key: "excavacion-esponjamiento",
    label: "Esponjamiento",
    source: { type: "LOOKUP", table: { "tierra-normal": 0.25, "con-arcilla-o-piedras": 0.35 }, questionKey: "excavacion-tipo-terreno" },
    isResult: false,
  },
  {
    key: "excavacion-capacidad-camion-m3-lookup",
    label: "Capacidad camión (lookup)",
    source: { type: "LOOKUP", table: { chico: 6, mediano: 10, grande: 15 }, questionKey: "excavacion-tipo-camion" },
    isResult: false,
  },
].map((v) => ({ valueType: "NUMBER" as const, ...v }));

const formulas = [
  // --- C1 (mínimo necesario) ---
  { key: "espesor-muro-m-rect", label: "", unit: "m", isResult: false, order: 1, condition: eqForma("rectangular"), expression: { op: "/", args: [{ var: "espesor-muro-cm-rect" }, 100] } },
  { key: "espesor-fondo-m-rect", label: "", unit: "m", isResult: false, order: 2, condition: eqForma("rectangular"), expression: { op: "/", args: [{ var: "espesor-fondo-cm-rect" }, 100] } },
  { key: "espesor-muro-m-circ", label: "", unit: "m", isResult: false, order: 3, condition: eqForma("circular"), expression: { op: "/", args: [{ var: "espesor-muro-cm-circ" }, 100] } },
  { key: "espesor-fondo-m-circ", label: "", unit: "m", isResult: false, order: 4, condition: eqForma("circular"), expression: { op: "/", args: [{ var: "espesor-fondo-cm-circ" }, 100] } },
  { key: "largo-ext", label: "", unit: "m", isResult: false, order: 10, condition: eqForma("rectangular"), expression: { op: "+", args: [{ var: "largo" }, { op: "*", args: [2, { ref: "espesor-muro-m-rect" }] }] } },
  { key: "ancho-ext", label: "", unit: "m", isResult: false, order: 11, condition: eqForma("rectangular"), expression: { op: "+", args: [{ var: "ancho" }, { op: "*", args: [2, { ref: "espesor-muro-m-rect" }] }] } },
  { key: "radio", label: "", unit: "m", isResult: false, order: 12, condition: eqForma("circular"), expression: { op: "/", args: [{ var: "diametro" }, 2] } },
  { key: "radio-ext", label: "", unit: "m", isResult: false, order: 13, condition: eqForma("circular"), expression: { op: "+", args: [{ ref: "radio" }, { ref: "espesor-muro-m-circ" }] } },
  { key: "diametro-ext", label: "", unit: "m", isResult: false, order: 14, condition: eqForma("circular"), expression: { op: "*", args: [{ ref: "radio-ext" }, 2] } },

  // --- C3 ---
  { key: "excavacion-espacio-trabajo-m", label: "", unit: "m", isResult: false, order: 80, expression: { op: "/", args: [{ var: "excavacion-espacio-trabajo-cm" }, 100] } },
  { key: "excavacion-preparacion-losa-m", label: "", unit: "m", isResult: false, order: 81, expression: { op: "/", args: [{ var: "excavacion-preparacion-losa-cm" }, 100] } },

  { key: "excavacion-largo-hoyo-rect", label: "Largo del hoyo", unit: "m", isResult: true, order: 82, condition: eqForma("rectangular"), expression: { op: "+", args: [{ ref: "largo-ext" }, { op: "*", args: [2, { ref: "excavacion-espacio-trabajo-m" }] }] } },
  { key: "excavacion-ancho-hoyo-rect", label: "Ancho del hoyo", unit: "m", isResult: true, order: 83, condition: eqForma("rectangular"), expression: { op: "+", args: [{ ref: "ancho-ext" }, { op: "*", args: [2, { ref: "excavacion-espacio-trabajo-m" }] }] } },
  { key: "excavacion-prof-hoyo-rect", label: "Profundidad del hoyo", unit: "m", isResult: true, order: 84, condition: eqForma("rectangular"), expression: { op: "+", args: [{ op: "+", args: [{ var: "profundidad-rect" }, { ref: "espesor-fondo-m-rect" }] }, { ref: "excavacion-preparacion-losa-m" }] } },
  { key: "excavacion-volumen-hoyo-rect", label: "", unit: "m³", isResult: false, order: 85, condition: eqForma("rectangular"), expression: { op: "*", args: [{ op: "*", args: [{ ref: "excavacion-largo-hoyo-rect" }, { ref: "excavacion-ancho-hoyo-rect" }] }, { ref: "excavacion-prof-hoyo-rect" }] } },

  { key: "excavacion-diametro-hoyo-circ", label: "Diámetro del hoyo", unit: "m", isResult: true, order: 86, condition: eqForma("circular"), expression: { op: "+", args: [{ ref: "diametro-ext" }, { op: "*", args: [2, { ref: "excavacion-espacio-trabajo-m" }] }] } },
  { key: "excavacion-radio-hoyo-circ", label: "", unit: "m", isResult: false, order: 87, condition: eqForma("circular"), expression: { op: "/", args: [{ ref: "excavacion-diametro-hoyo-circ" }, 2] } },
  { key: "excavacion-prof-hoyo-circ", label: "Profundidad del hoyo", unit: "m", isResult: true, order: 88, condition: eqForma("circular"), expression: { op: "+", args: [{ op: "+", args: [{ var: "profundidad-circ" }, { ref: "espesor-fondo-m-circ" }] }, { ref: "excavacion-preparacion-losa-m" }] } },
  { key: "excavacion-volumen-hoyo-circ", label: "", unit: "m³", isResult: false, order: 89, condition: eqForma("circular"), expression: { op: "*", args: [{ op: "*", args: [3.14159265358979, { op: "*", args: [{ ref: "excavacion-radio-hoyo-circ" }, { ref: "excavacion-radio-hoyo-circ" }] }] }, { ref: "excavacion-prof-hoyo-circ" }] } },

  { key: "excavacion-volumen-excavado", label: "Volumen excavado", unit: "m³", isResult: true, order: 90, expression: { op: "coalesce", args: [{ ref: "excavacion-volumen-hoyo-rect" }, { ref: "excavacion-volumen-hoyo-circ" }] } },
  { key: "excavacion-factor-esponjamiento", label: "", unit: "factor", isResult: false, order: 91, expression: { op: "+", args: [1, { var: "excavacion-esponjamiento" }] } },
  { key: "excavacion-volumen-suelto", label: "Tierra suelta estimada", unit: "m³", isResult: true, order: 92, expression: { op: "*", args: [{ ref: "excavacion-volumen-excavado" }, { ref: "excavacion-factor-esponjamiento" }] } },

  { key: "excavacion-capacidad-camion-estandar", label: "", unit: "m³", isResult: false, order: 93, condition: { op: "not", value: eqCamion("personalizado") }, expression: { var: "excavacion-capacidad-camion-m3-lookup" } },
  { key: "excavacion-capacidad-camion-personalizada", label: "", unit: "m³", isResult: false, order: 94, condition: eqCamion("personalizado"), expression: { var: "excavacion-capacidad-personalizada-m3" } },
  { key: "excavacion-capacidad-camion", label: "Capacidad del camión", unit: "m³", isResult: true, order: 95, expression: { op: "coalesce", args: [{ ref: "excavacion-capacidad-camion-estandar" }, { ref: "excavacion-capacidad-camion-personalizada" }] } },
  { key: "excavacion-viajes", label: "Viajes estimados", unit: "viaje", isResult: true, order: 96, expression: { op: "ceil", value: { op: "/", args: [{ ref: "excavacion-volumen-suelto" }, { ref: "excavacion-capacidad-camion" }] } } },
].map((f) => ({ note: null, material: null, condition: null, ...f }));

describe("piscina-integral — Excavación (Fase C3)", () => {
  it("rectangular: 12×6×1,5m, muro 15cm, losa 25cm, trabajo 60cm, prep 0 -> hoyo 13,50×7,50×1,75, volumen 177,1875 m³", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        "que-forma-tendra-tu-piscina": "rectangular",
        "largo-interior-metros": 12,
        "ancho-interior-metros": 6,
        "profundidad-interior-metros": 1.5,
        "espesor-de-los-muros-cm": 15,
        "espesor-del-fondo-losa-cm": 25,
        "excavacion-espacio-trabajo-cm": 60,
        "excavacion-preparacion-losa-cm": 0,
        "excavacion-tipo-terreno": "tierra-normal",
        "excavacion-tipo-camion": "mediano",
      },
    });
    expect(resultOf(results, "excavacion-largo-hoyo-rect")).toBeCloseTo(13.5, 10);
    expect(resultOf(results, "excavacion-ancho-hoyo-rect")).toBeCloseTo(7.5, 10);
    expect(resultOf(results, "excavacion-prof-hoyo-rect")).toBeCloseTo(1.75, 10);
    expect(resultOf(results, "excavacion-volumen-excavado")).toBeCloseTo(177.1875, 10);
    expect(resultOf(results, "excavacion-volumen-suelto")).toBeCloseTo(221.484375, 10);
    expect(resultOf(results, "excavacion-capacidad-camion")).toBe(10);
    expect(resultOf(results, "excavacion-viajes")).toBe(23);
  });

  it("rectangular con preparación bajo losa 10cm -> profundidad 1,85, volumen 187,3125 m³", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        "que-forma-tendra-tu-piscina": "rectangular",
        "largo-interior-metros": 12,
        "ancho-interior-metros": 6,
        "profundidad-interior-metros": 1.5,
        "espesor-de-los-muros-cm": 15,
        "espesor-del-fondo-losa-cm": 25,
        "excavacion-espacio-trabajo-cm": 60,
        "excavacion-preparacion-losa-cm": 10,
        "excavacion-tipo-terreno": "tierra-normal",
        "excavacion-tipo-camion": "mediano",
      },
    });
    expect(resultOf(results, "excavacion-prof-hoyo-rect")).toBeCloseTo(1.85, 10);
    expect(resultOf(results, "excavacion-volumen-excavado")).toBeCloseTo(187.3125, 10);
  });

  it("circular: D=6m, prof=1,5m, muro 20cm, losa 20cm, trabajo 60cm -> hoyo Ø7,6 × 1,7, volumen π×3,8²×1,7", () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        "que-forma-tendra-tu-piscina": "circular",
        "diametro-interior-metros": 6,
        "profundidad-interior-metros-circular": 1.5,
        "espesor-de-los-muros-cm-circular": 20,
        "espesor-del-fondo-losa-cm-circular": 20,
        "excavacion-espacio-trabajo-cm": 60,
        "excavacion-preparacion-losa-cm": 0,
        "excavacion-tipo-terreno": "con-arcilla-o-piedras",
        "excavacion-tipo-camion": "grande",
      },
    });
    expect(resultOf(results, "excavacion-diametro-hoyo-circ")).toBeCloseTo(7.6, 10);
    expect(resultOf(results, "excavacion-prof-hoyo-circ")).toBeCloseTo(1.7, 10);
    expect(resultOf(results, "excavacion-volumen-excavado")).toBeCloseTo(Math.PI * 3.8 * 3.8 * 1.7, 8);
    // Esponjamiento 35% (con-arcilla-o-piedras) -- valores sin modificar
    expect(resultOf(results, "excavacion-volumen-suelto")).toBeCloseTo(Math.PI * 3.8 * 3.8 * 1.7 * 1.35, 8);
  });

  it('camión "Personalizado" usa la capacidad ingresada, no la tabla estándar', () => {
    const { results } = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: {
        "que-forma-tendra-tu-piscina": "rectangular",
        "largo-interior-metros": 12,
        "ancho-interior-metros": 6,
        "profundidad-interior-metros": 1.5,
        "espesor-de-los-muros-cm": 15,
        "espesor-del-fondo-losa-cm": 25,
        "excavacion-espacio-trabajo-cm": 60,
        "excavacion-preparacion-losa-cm": 0,
        "excavacion-tipo-terreno": "tierra-normal",
        "excavacion-tipo-camion": "personalizado",
        "excavacion-capacidad-personalizada-m3": 8,
      },
    });
    expect(resultOf(results, "excavacion-capacidad-camion")).toBe(8);
    // 221.484375 / 8 = 27.685... -> ceil 28
    expect(resultOf(results, "excavacion-viajes")).toBe(28);
  });

  it("cambio de camión (chico/mediano/grande/personalizado) no deja capacidades cruzadas", () => {
    const base = {
      "que-forma-tendra-tu-piscina": "rectangular",
      "largo-interior-metros": 12,
      "ancho-interior-metros": 6,
      "profundidad-interior-metros": 1.5,
      "espesor-de-los-muros-cm": 15,
      "espesor-del-fondo-losa-cm": 25,
      "excavacion-espacio-trabajo-cm": 60,
      "excavacion-preparacion-losa-cm": 0,
      "excavacion-tipo-terreno": "tierra-normal",
    };
    for (const [camion, capacidad, extra] of [
      ["chico", 6, {}],
      ["mediano", 10, {}],
      ["grande", 15, {}],
      ["personalizado", 12, { "excavacion-capacidad-personalizada-m3": 12 }],
    ] as const) {
      const { results } = calculateModule({
        variables,
        formulas,
        lossFactors: [],
        answers: { ...base, "excavacion-tipo-camion": camion, ...extra },
      });
      expect(resultOf(results, "excavacion-capacidad-camion")).toBe(capacidad);
    }
  });
});
