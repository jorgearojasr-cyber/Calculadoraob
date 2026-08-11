import { describe, expect, it } from "vitest";
import { calculateModule } from "./index";

// Tests de Fase 4C — Lote 1 (09-ago-2026): Vereda (módulo nuevo) y Terraza
// de hormigón (variante condicional dentro de radier). Construidos contra
// el motor de fórmulas directamente, sin BD (mismo criterio que los demás
// archivos de este directorio). El DSL replica exactamente lo aplicado en
// prisma/db-fixes/fase4c-lote1-vereda-terraza-contrapiso.ts.

function resultOf(results: ReturnType<typeof calculateModule>["results"], key: string) {
  const r = results.find((x) => x.key === key);
  if (!r) throw new Error(`No se encontró el resultado "${key}"`);
  return r.value;
}

describe("vereda — dosificación MINVU/Polpaico (15 sacos/m³ fijo)", () => {
  const variables = [
    { key: "largo", label: "Largo", source: { type: "QUESTION", questionKey: "largo" }, isResult: false },
    { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho" }, isResult: false },
    { key: "espesor-losa-cm", label: "Espesor losa", source: { type: "QUESTION", questionKey: "espesor-losa-cm" }, isResult: false },
    { key: "espesor-base-cm", label: "Espesor base", source: { type: "QUESTION", questionKey: "espesor-base-cm" }, isResult: false },
    { key: "metodo-hormigon", label: "Método", source: { type: "QUESTION", questionKey: "metodo-hormigon" }, isResult: false },
    { key: "soleras-ml", label: "Soleras ml", source: { type: "QUESTION", questionKey: "soleras-ml" }, isResult: false },
    { key: "tipo-de-obra", label: "Tipo de obra", source: { type: "QUESTION", questionKey: "tipo-de-obra" }, isResult: false },
    { key: "incluye-soleras", label: "Incluye soleras", source: { type: "QUESTION", questionKey: "incluye-soleras" }, isResult: false },
    { key: "lleva-malla", label: "Lleva malla", source: { type: "QUESTION", questionKey: "lleva-malla" }, isResult: false },
  ];
  const lossFactors = [
    { key: "perdida_hormigon_vereda", percentage: 0.1, condition: null },
    { key: "esponjamiento_base_vereda", percentage: 0.25, condition: null },
  ];
  const formulas = [
    { key: "area", label: "Área", unit: "m²", expression: { op: "*", args: [{ var: "largo" }, { var: "ancho" }] }, condition: null, isResult: false, note: null, order: 1, material: null },
    { key: "volumen-losa-bruto", label: "Volumen bruto losa", unit: "m³", expression: { op: "*", args: [{ ref: "area" }, { op: "/", args: [{ var: "espesor-losa-cm" }, 100] }] }, condition: null, isResult: false, note: null, order: 2, material: null },
    { key: "volumen-losa-con-perdida", label: "Volumen con pérdida", unit: "m³", expression: { op: "lossFactor", key: "perdida_hormigon_vereda", value: { ref: "volumen-losa-bruto" } }, condition: null, isResult: false, note: null, order: 3, material: null },
    { key: "volumen-base-bruto", label: "Volumen bruto base", unit: "m³", expression: { op: "*", args: [{ ref: "area" }, { op: "/", args: [{ var: "espesor-base-cm" }, 100] }] }, condition: null, isResult: false, note: null, order: 13, material: null },
    { key: "volumen-base-compra", label: "Material de base a comprar", unit: "m³", expression: { op: "lossFactor", key: "esponjamiento_base_vereda", value: { ref: "volumen-base-bruto" } }, condition: null, isResult: true, note: null, order: 14, material: null },
    { key: "volumen-premezclado", label: "Volumen a pedir", unit: "m³", expression: { op: "ceilTo", step: 0.5, value: { ref: "volumen-losa-con-perdida" } }, condition: { op: "==", args: [{ var: "metodo-hormigon" }, { str: "premezclado" }] }, isResult: true, note: null, order: 4, material: null },
    { key: "sacos-cemento", label: "Cemento", unit: "bolsa", expression: { op: "ceil", value: { op: "*", args: [{ ref: "volumen-losa-con-perdida" }, 15] } }, condition: { op: "==", args: [{ var: "metodo-hormigon" }, { str: "manual" }] }, isResult: true, note: null, order: 5, material: null },
    { key: "grava", label: "Grava", unit: "litro", expression: { op: "round", value: { op: "*", args: [{ ref: "sacos-cemento" }, 50] } }, condition: { op: "==", args: [{ var: "metodo-hormigon" }, { str: "manual" }] }, isResult: true, note: null, order: 6, material: null },
    { key: "arena", label: "Arena", unit: "litro", expression: { op: "round", value: { op: "*", args: [{ ref: "sacos-cemento" }, 40] } }, condition: { op: "==", args: [{ var: "metodo-hormigon" }, { str: "manual" }] }, isResult: true, note: null, order: 7, material: null },
    { key: "agua", label: "Agua", unit: "litro", expression: { op: "round", value: { op: "*", args: [{ ref: "sacos-cemento" }, 10] } }, condition: { op: "==", args: [{ var: "metodo-hormigon" }, { str: "manual" }] }, isResult: true, note: null, order: 8, material: null },
    { key: "moldaje", label: "Moldaje", unit: "ml", expression: { op: "*", args: [2, { var: "largo" }] }, condition: null, isResult: true, note: null, order: 9, material: null },
    { key: "cortes-de-junta", label: "Cortes de junta", unit: "corte", expression: { op: "-", args: [{ op: "ceil", value: { op: "/", args: [{ var: "largo" }, 1.2] } }, 1] }, condition: null, isResult: true, note: null, order: 10, material: null },
    { key: "soleras", label: "Soleras", unit: "ml", expression: { var: "soleras-ml" }, condition: { op: "!=", args: [{ var: "incluye-soleras" }, { str: "no" }] }, isResult: true, note: null, order: 11, material: null },
    { key: "malla", label: "Malla", unit: "m²", expression: { ref: "area" }, condition: { op: "and", args: [{ op: "==", args: [{ var: "tipo-de-obra" }, { str: "acceso-vehicular" }] }, { op: "==", args: [{ var: "lleva-malla" }, { str: "si" }] }] }, isResult: true, note: null, order: 12, material: null },
  ];

  it("ejemplo de referencia (FASE4B): 12x1,20m e=7cm, en saco, con soleras tipo A -> 17 sacos, 850L grava, 680L arena, 170L agua, 24ml moldaje, 9 cortes", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: {
        "tipo-de-obra": "vereda-normal",
        largo: 12,
        ancho: 1.2,
        "espesor-losa-cm": 7,
        "espesor-base-cm": 5,
        "metodo-hormigon": "manual",
        "incluye-soleras": "tipo-a",
        "soleras-ml": 24,
      },
    });
    expect(resultOf(r.results, "sacos-cemento")).toBe(17);
    expect(resultOf(r.results, "grava")).toBe(850);
    expect(resultOf(r.results, "arena")).toBe(680);
    expect(resultOf(r.results, "agua")).toBe(170);
    expect(resultOf(r.results, "moldaje")).toBe(24);
    expect(resultOf(r.results, "cortes-de-junta")).toBe(9);
    expect(resultOf(r.results, "soleras")).toBe(24);
    expect(resultOf(r.results, "volumen-base-compra")).toBeCloseTo(0.9, 6);
  });

  it("acceso vehicular con malla, premezclado: 5x3m e=12cm -> 2 m³ (ceilTo 0,5), malla 15m², sin cemento/arena/grava/agua (rama manual no aplica)", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: {
        "tipo-de-obra": "acceso-vehicular",
        largo: 5,
        ancho: 3,
        "espesor-losa-cm": 12,
        "espesor-base-cm": 10,
        "metodo-hormigon": "premezclado",
        "incluye-soleras": "no",
        "lleva-malla": "si",
      },
    });
    expect(resultOf(r.results, "volumen-premezclado")).toBe(2);
    expect(resultOf(r.results, "malla")).toBe(15);
    expect(resultOf(r.results, "volumen-base-compra")).toBeCloseTo(1.875, 6);
    expect(r.results.find((x) => x.key === "sacos-cemento")).toBeUndefined();
    expect(r.results.find((x) => x.key === "soleras")).toBeUndefined();
  });

  it("sin malla incluso en acceso vehicular si el usuario respondió 'no'", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: {
        "tipo-de-obra": "acceso-vehicular",
        largo: 5,
        ancho: 3,
        "espesor-losa-cm": 12,
        "espesor-base-cm": 10,
        "metodo-hormigon": "premezclado",
        "incluye-soleras": "no",
        "lleva-malla": "no",
      },
    });
    expect(r.results.find((x) => x.key === "malla")).toBeUndefined();
  });

  it("caso pequeño: 2m de vereda normal, sin soleras ni malla", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: {
        "tipo-de-obra": "vereda-normal",
        largo: 2,
        ancho: 1.2,
        "espesor-losa-cm": 8,
        "espesor-base-cm": 5,
        "metodo-hormigon": "manual",
        "incluye-soleras": "no",
      },
    });
    // area=2.4, vol_bruto=0.192, con perdida 10%=0.2112, cemento=ceil(0.2112*15)=ceil(3.168)=4
    expect(resultOf(r.results, "sacos-cemento")).toBe(4);
    expect(resultOf(r.results, "cortes-de-junta")).toBe(ceilMinus1(2, 1.2));
  });

  it("caso grande: 40m de vereda reforzada", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: {
        "tipo-de-obra": "reforzada",
        largo: 40,
        ancho: 1.5,
        "espesor-losa-cm": 10,
        "espesor-base-cm": 8,
        "metodo-hormigon": "manual",
        "incluye-soleras": "no",
      },
    });
    // area=60, vol_bruto=6.0, con perdida 10%=6.6 (con ruido de punto flotante,
    // 6.0*1.1=6.6000000000000005) -> cemento=ceil(6,6...×15)=ceil(99,00000000000001)=100
    expect(resultOf(r.results, "sacos-cemento")).toBe(100);
    expect(resultOf(r.results, "moldaje")).toBe(80);
  });

  function ceilMinus1(largo: number, paso: number) {
    return Math.ceil(largo / paso) - 1;
  }
});

describe("terraza de hormigón — variante condicional dentro de radier (pendiente)", () => {
  const variables = [
    { key: "largo", label: "Largo", source: { type: "QUESTION", questionKey: "largo" }, isResult: false },
    { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho" }, isResult: false },
    { key: "espesor_cm", label: "Espesor", source: { type: "QUESTION", questionKey: "espesor_cm" }, isResult: false },
    { key: "es-interior-o-exterior", label: "Interior/exterior", source: { type: "QUESTION", questionKey: "es-interior-o-exterior" }, isResult: false },
    { key: "porcentaje-de-pendiente", label: "% pendiente", source: { type: "QUESTION", questionKey: "porcentaje-de-pendiente" }, isResult: false },
  ];
  const lossFactors = [{ key: "perdida_hormigon", percentage: 0.07, condition: null }];
  const formulas = [
    { key: "volumen_bruto", label: "Volumen bruto", unit: "m³", expression: { op: "*", args: [{ var: "largo" }, { var: "ancho" }, { op: "/", args: [{ var: "espesor_cm" }, 100] }] }, condition: null, isResult: false, note: null, order: 1, material: null },
    {
      key: "volumen_pendiente_extra",
      label: "Extra por pendiente",
      unit: "m³",
      expression: { op: "/", args: [{ op: "*", args: [{ var: "largo" }, { var: "largo" }, { var: "ancho" }, { op: "/", args: [{ var: "porcentaje-de-pendiente" }, 100] }] }, 2] },
      condition: { op: "==", args: [{ var: "es-interior-o-exterior" }, { str: "exterior" }] },
      isResult: false,
      note: null,
      order: 2,
      material: null,
    },
    {
      key: "volumen_con_pendiente",
      label: "Volumen con pendiente",
      unit: "m³",
      expression: { op: "+", args: [{ ref: "volumen_bruto" }, { op: "coalesce", args: [{ ref: "volumen_pendiente_extra" }, 0] }] },
      condition: null,
      isResult: false,
      note: null,
      order: 3,
      material: null,
    },
    { key: "volumen_con_perdida", label: "Volumen con pérdida", unit: "m³", expression: { op: "lossFactor", key: "perdida_hormigon", value: { ref: "volumen_con_pendiente" } }, condition: null, isResult: false, note: null, order: 4, material: null },
    { key: "volumen_total", label: "Volumen de hormigón", unit: "m³", expression: { ref: "volumen_con_perdida" }, condition: null, isResult: true, note: null, order: 10, material: null },
  ];

  it("ejemplo de referencia (FASE4B): terraza exterior 4x3m e=8cm, 1,5% pendiente -> +37% de volumen respecto de área×espesor", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { largo: 4, ancho: 3, espesor_cm: 8, "es-interior-o-exterior": "exterior", "porcentaje-de-pendiente": 1.5 },
    });
    // volumen_bruto = 0.96 ; extra = 4*4*3*0.015/2 = 0.36 ; con_pendiente = 1.32
    // con_perdida = 1.32*1.07 = 1.4124
    expect(resultOf(r.results, "volumen_total")).toBeCloseTo(1.4124, 6);
    const ratioSobreBruto = 1.32 / 0.96;
    expect(ratioSobreBruto).toBeCloseTo(1.375, 3); // +37,5%, coincide con el "+37%" de la especificación
  });

  it("interior (sin pendiente): da exactamente el mismo resultado que radier estándar antes de Fase 4C", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { largo: 4, ancho: 3, espesor_cm: 8, "es-interior-o-exterior": "interior" },
    });
    // volumen_bruto = 0.96 ; sin extra (coalesce cae a 0) ; con_perdida = 0.96*1.07 = 1.0272
    expect(resultOf(r.results, "volumen_total")).toBeCloseTo(1.0272, 6);
  });

  it("pendiente 0% exterior: debe dar el mismo resultado que interior (extra = 0)", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { largo: 4, ancho: 3, espesor_cm: 8, "es-interior-o-exterior": "exterior", "porcentaje-de-pendiente": 0 },
    });
    expect(resultOf(r.results, "volumen_total")).toBeCloseTo(1.0272, 6);
  });

  it("caso pequeño: terraza exterior 2x2m e=8cm, pendiente 1,5%", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { largo: 2, ancho: 2, espesor_cm: 8, "es-interior-o-exterior": "exterior", "porcentaje-de-pendiente": 1.5 },
    });
    // bruto=0.32 ; extra=2*2*2*0.015/2=0.06 ; con_pendiente=0.38 ; con_perdida=0.38*1.07=0.4066
    expect(resultOf(r.results, "volumen_total")).toBeCloseTo(0.4066, 4);
  });

  it("caso grande: terraza exterior 10x8m e=10cm, pendiente 2%", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { largo: 10, ancho: 8, espesor_cm: 10, "es-interior-o-exterior": "exterior", "porcentaje-de-pendiente": 2 },
    });
    // bruto=10*8*0.10=8 ; extra=10*10*8*0.02/2=8 ; con_pendiente=16 ; con_perdida=16*1.07=17.12
    expect(resultOf(r.results, "volumen_total")).toBeCloseTo(17.12, 4);
  });
});
