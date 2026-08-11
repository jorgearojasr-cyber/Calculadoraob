import { describe, expect, it } from "vitest";
import { calculateModule } from "./index";

// Tests de la corrección de Fase 6D (10-ago-2026) — dosificación de
// arena/gravilla/agua de "fundacion" corregida a la fila CIMIENTOS de
// Polpaico "Dosificaciones" (tabla EN BALDE, baldes de 10L), validada en
// Fase 6C. DSL construido a mano reflejando EXACTAMENTE lo que quedó en
// prisma/db-fixes/fase6d-fundacion-dosificacion-polpaico.ts tras aplicarse
// (mismo criterio que fase3-corrections.test.ts).

function resultOf(results: ReturnType<typeof calculateModule>["results"], key: string) {
  const r = results.find((x) => x.key === key);
  if (!r) throw new Error(`No se encontró el resultado "${key}"`);
  return r.value;
}

// Grupo 1: dosificación pura (arena/grava/agua/cemento/premezclado) contra
// un volumen_con_perdida ya resuelto directamente como input — evita
// depender de la geometría de volumen_bruto para fijar el volumen exacto
// de la mezcla en cada caso (1 m³, 2 m³, 0,5 m³), que es lo que pide el
// enunciado de Fase 6D. El volumen aquí YA incluye el 7% de pérdida (así
// es como lo recibe realmente arena/grava/agua en el módulo real).
describe("fundacion — dosificación Polpaico Cimientos (Fase 6D)", () => {
  const variables = [
    { key: "volumen_con_perdida", label: "Volumen con pérdida", source: { type: "QUESTION", questionKey: "volumen" }, isResult: false },
  ];
  const formulas = [
    {
      key: "cemento",
      label: "Cemento",
      unit: "saco",
      expression: { op: "ceil", value: { op: "*", args: [{ var: "volumen_con_perdida" }, 7] } },
      condition: null,
      isResult: true,
      note: null,
      order: 2,
      material: null,
    },
    {
      key: "arena",
      label: "Arena",
      unit: "m³",
      expression: { op: "*", args: [{ var: "volumen_con_perdida" }, 0.7] },
      condition: null,
      isResult: true,
      note: null,
      order: 3,
      material: null,
    },
    {
      key: "gravilla",
      label: "Gravilla",
      unit: "m³",
      expression: { op: "*", args: [{ var: "volumen_con_perdida" }, 0.63] },
      condition: null,
      isResult: true,
      note: null,
      order: 4,
      material: null,
    },
    {
      key: "agua",
      label: "Agua",
      unit: "litro",
      expression: { op: "*", args: [{ var: "volumen_con_perdida" }, 105] },
      condition: null,
      isResult: true,
      note: null,
      order: 5,
      material: null,
    },
    {
      key: "volumen_premezclado",
      label: "Volumen de hormigón a pedir (premezclado)",
      unit: "m³",
      expression: { op: "ceilTo", step: 0.5, value: { var: "volumen_con_perdida" } },
      condition: null,
      isResult: true,
      note: null,
      order: 6,
      material: null,
    },
  ];

  it("1. caso base: 1 m³ de hormigón (ya con pérdida) -> arena 0,700 m³, grava 0,630 m³, agua 105 L, cemento 7 sacos", () => {
    const r = calculateModule({ variables, formulas, lossFactors: [], answers: { volumen: 1 } });
    expect(resultOf(r.results, "arena")).toBeCloseTo(0.7, 6);
    expect(resultOf(r.results, "gravilla")).toBeCloseTo(0.63, 6);
    expect(resultOf(r.results, "agua")).toBeCloseTo(105, 6);
    expect(resultOf(r.results, "cemento")).toBe(7);
  });

  it("2. caso de volumen mayor: 2 m³ duplica arena/grava/agua correctamente", () => {
    const r = calculateModule({ variables, formulas, lossFactors: [], answers: { volumen: 2 } });
    expect(resultOf(r.results, "arena")).toBeCloseTo(1.4, 6);
    expect(resultOf(r.results, "gravilla")).toBeCloseTo(1.26, 6);
    expect(resultOf(r.results, "agua")).toBeCloseTo(210, 6);
  });

  it("3. caso decimal: 0,5 m³ escala correctamente", () => {
    const r = calculateModule({ variables, formulas, lossFactors: [], answers: { volumen: 0.5 } });
    expect(resultOf(r.results, "arena")).toBeCloseTo(0.35, 6);
    expect(resultOf(r.results, "gravilla")).toBeCloseTo(0.315, 6);
    expect(resultOf(r.results, "agua")).toBeCloseTo(52.5, 6);
  });

  it("4. cemento permanece en 7 sacos/m³ (sin cambio por esta corrección)", () => {
    const r = calculateModule({ variables, formulas, lossFactors: [], answers: { volumen: 1 } });
    expect(resultOf(r.results, "cemento")).toBe(7);
  });

  it("5. arena/grava/agua NO vuelven a aplicar ningún factor de pérdida: solo multiplican el volumen recibido (que ya la incluye una vez)", () => {
    const r = calculateModule({ variables, formulas, lossFactors: [], answers: { volumen: 1 } });
    // Si el 7% se aplicara una segunda vez sobre arena, daría 0.7*1.07=0.749, no 0.7.
    expect(resultOf(r.results, "arena")).toBeCloseTo(0.7, 6);
    expect(resultOf(r.results, "arena")).not.toBeCloseTo(0.7 * 1.07, 6);
  });

  it("6. la rama de hormigón premezclado no cambia por esta corrección (fórmula independiente de arena/grava/agua)", () => {
    const r = calculateModule({ variables, formulas, lossFactors: [], answers: { volumen: 1 } });
    // ceilTo(1, step=0.5) = 1
    expect(resultOf(r.results, "volumen_premezclado")).toBeCloseTo(1, 6);
  });
});

// Grupo 2: con la geometría real de fundación (largo/base/cuello + pérdida
// 7%), para confirmar que la corrección se comporta igual de punta a punta,
// no solo de forma aislada.
describe("fundacion — dosificación Polpaico Cimientos, caso realista con geometría completa", () => {
  const variables = [
    { key: "largo", label: "Largo", source: { type: "QUESTION", questionKey: "largo" }, isResult: false },
    { key: "ancho_base", label: "Ancho base", source: { type: "QUESTION", questionKey: "ancho_base" }, isResult: false },
    { key: "alto_base", label: "Alto base", source: { type: "QUESTION", questionKey: "alto_base" }, isResult: false },
    { key: "ancho_cuello", label: "Ancho cuello", source: { type: "QUESTION", questionKey: "ancho_cuello" }, isResult: false },
    { key: "alto_cuello", label: "Alto cuello", source: { type: "QUESTION", questionKey: "alto_cuello" }, isResult: false },
  ];
  const lossFactors = [{ key: "perdida_hormigon", percentage: 0.07, condition: null }];
  const formulas = [
    {
      key: "volumen_bruto",
      label: "Volumen bruto",
      unit: "m³",
      expression: {
        op: "*",
        args: [
          { var: "largo" },
          {
            op: "+",
            args: [
              { op: "*", args: [{ op: "/", args: [{ var: "ancho_base" }, 100] }, { op: "/", args: [{ var: "alto_base" }, 100] }] },
              { op: "*", args: [{ op: "/", args: [{ var: "ancho_cuello" }, 100] }, { op: "/", args: [{ var: "alto_cuello" }, 100] }] },
            ],
          },
        ],
      },
      condition: null,
      isResult: false,
      note: null,
      order: 0,
      material: null,
    },
    {
      key: "volumen_con_perdida",
      label: "Volumen con pérdida",
      unit: "m³",
      expression: { op: "lossFactor", key: "perdida_hormigon", value: { ref: "volumen_bruto" } },
      condition: null,
      isResult: false,
      note: null,
      order: 1,
      material: null,
    },
    {
      key: "cemento",
      label: "Cemento",
      unit: "saco",
      expression: { op: "ceil", value: { op: "*", args: [{ ref: "volumen_con_perdida" }, 7] } },
      condition: null,
      isResult: true,
      note: null,
      order: 2,
      material: null,
    },
    {
      key: "arena",
      label: "Arena",
      unit: "m³",
      expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, 0.7] },
      condition: null,
      isResult: true,
      note: null,
      order: 3,
      material: null,
    },
    {
      key: "gravilla",
      label: "Gravilla",
      unit: "m³",
      expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, 0.63] },
      condition: null,
      isResult: true,
      note: null,
      order: 4,
      material: null,
    },
    {
      key: "agua",
      label: "Agua",
      unit: "litro",
      expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, 105] },
      condition: null,
      isResult: true,
      note: null,
      order: 5,
      material: null,
    },
  ];

  it("fundación de 10m de largo, base 40x20cm, cuello 30x10cm", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { largo: 10, ancho_base: 40, alto_base: 20, ancho_cuello: 30, alto_cuello: 10 },
    });
    // volumen_bruto = 10 * (0.4*0.2 + 0.3*0.1) = 10 * (0.08+0.03) = 1.1
    // volumen_con_perdida = 1.1 * 1.07 = 1.177
    const volumenConPerdida = 1.1 * 1.07;
    expect(resultOf(r.results, "arena")).toBeCloseTo(volumenConPerdida * 0.7, 6);
    expect(resultOf(r.results, "gravilla")).toBeCloseTo(volumenConPerdida * 0.63, 6);
    expect(resultOf(r.results, "agua")).toBeCloseTo(volumenConPerdida * 105, 6);
    expect(resultOf(r.results, "cemento")).toBe(Math.ceil(volumenConPerdida * 7));
  });
});
