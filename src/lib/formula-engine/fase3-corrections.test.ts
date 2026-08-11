import { describe, expect, it } from "vitest";
import { calculateModule } from "./index";

// Tests de las correcciones técnicas de Fase 3 (09-ago-2026) — construidos
// directamente contra el motor de fórmulas, sin tocar la BD ni Prisma
// (mismo criterio que evaluate.test.ts). Cada DSL de acá refleja EXACTAMENTE
// lo que quedó en prisma/db-fixes/fase3-correccion-tecnica-calculadores.ts
// tras aplicarse — ver ese script para la fuente citada de cada valor.

function resultOf(results: ReturnType<typeof calculateModule>["results"], key: string) {
  const r = results.find((x) => x.key === key);
  if (!r) throw new Error(`No se encontró el resultado "${key}"`);
  return r.value;
}

describe("zanja-para-tuberias — ancho/profundidad editables + esponjamiento formal", () => {
  const variables = [
    { key: "largo", label: "Largo", source: { type: "QUESTION", questionKey: "largo-de-la-zanja-metros" }, isResult: false },
    { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho-de-la-zanja-metros" }, isResult: false },
    { key: "profundidad", label: "Profundidad", source: { type: "QUESTION", questionKey: "profundidad-de-la-zanja-metros" }, isResult: false },
  ];
  const lossFactors = [{ key: "esponjamiento_zanja", percentage: 0.25, condition: null }];
  const formulas = [
    {
      key: "volumen-en-sitio",
      label: "Volumen a excavar",
      unit: "m3",
      expression: { op: "*", args: [{ var: "largo" }, { op: "*", args: [{ var: "ancho" }, { var: "profundidad" }] }] },
      condition: null,
      isResult: true,
      note: null,
      order: 1,
      material: null,
    },
    {
      key: "volumen-esponjado",
      label: "Volumen de tierra a retirar (esponjado)",
      unit: "m3",
      expression: { op: "lossFactor", key: "esponjamiento_zanja", value: { ref: "volumen-en-sitio" } },
      condition: null,
      isResult: true,
      isSecondary: true,
      note: null,
      order: 2,
      material: null,
    },
  ];

  it("caso del enunciado: largo=10, ancho=0.40, profundidad=0.60 -> 2.40 m3 (resultado principal, sin esponjar)", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { "largo-de-la-zanja-metros": 10, "ancho-de-la-zanja-metros": 0.4, "profundidad-de-la-zanja-metros": 0.6 },
    });
    expect(resultOf(r.results, "volumen-en-sitio")).toBeCloseTo(2.4, 6);
  });

  it("el volumen esponjado es un resultado secundario distinto (25% más), no reemplaza al principal", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { "largo-de-la-zanja-metros": 10, "ancho-de-la-zanja-metros": 0.4, "profundidad-de-la-zanja-metros": 0.6 },
    });
    expect(resultOf(r.results, "volumen-esponjado")).toBeCloseTo(3.0, 6);
    const esponjado = r.results.find((x) => x.key === "volumen-esponjado");
    expect(esponjado?.isSecondary).toBe(true);
  });

  it("caso pequeño: zanja eléctrica corta (2m x 0.3 x 0.6)", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { "largo-de-la-zanja-metros": 2, "ancho-de-la-zanja-metros": 0.3, "profundidad-de-la-zanja-metros": 0.6 },
    });
    expect(resultOf(r.results, "volumen-en-sitio")).toBeCloseTo(0.36, 6);
  });

  it("caso grande: zanja de alcantarillado de 50m", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { "largo-de-la-zanja-metros": 50, "ancho-de-la-zanja-metros": 0.4, "profundidad-de-la-zanja-metros": 0.8 },
    });
    expect(resultOf(r.results, "volumen-en-sitio")).toBeCloseTo(16, 6);
    expect(resultOf(r.results, "volumen-esponjado")).toBeCloseTo(20, 6);
  });

  it("ancho y profundidad ahora son inputs del usuario (Question), no un LOOKUP fijo sin pregunta", () => {
    // Antes del fix, estas 2 variables resolvían por LOOKUP sin ninguna
    // Question asociada — este test fija el contrato de que dependen de
    // una respuesta explícita del usuario.
    expect(variables.find((v) => v.key === "ancho")?.source.type).toBe("QUESTION");
    expect(variables.find((v) => v.key === "profundidad")?.source.type).toBe("QUESTION");
  });
});

describe("radier — dosificación de cemento diferenciada por uso (Polpaico)", () => {
  const variables = [
    { key: "largo", label: "Largo", source: { type: "QUESTION", questionKey: "largo" }, isResult: false },
    { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho" }, isResult: false },
    { key: "espesor_cm", label: "Espesor", source: { type: "QUESTION", questionKey: "espesor_cm" }, isResult: false },
    {
      key: "sacos-cemento-por-m3",
      label: "Sacos por m3",
      source: {
        type: "LOOKUP",
        questionKey: "uso",
        table: { patio_terraza: 10, antepiso_interior: 10, estacionamiento: 15, bodega_industrial: 15 },
      },
      isResult: false,
    },
    {
      key: "arena-m3-por-m3",
      label: "Arena (m3 por m3)",
      source: {
        type: "LOOKUP",
        questionKey: "uso",
        table: { patio_terraza: 0.7, antepiso_interior: 0.7, estacionamiento: 0.6, bodega_industrial: 0.6 },
      },
      isResult: false,
    },
    {
      key: "grava-m3-por-m3",
      label: "Grava (m3 por m3)",
      source: {
        type: "LOOKUP",
        questionKey: "uso",
        table: { patio_terraza: 0.6, antepiso_interior: 0.6, estacionamiento: 0.75, bodega_industrial: 0.75 },
      },
      isResult: false,
    },
    {
      key: "agua-litros-por-m3",
      label: "Agua (L por m3)",
      source: {
        type: "LOOKUP",
        questionKey: "uso",
        table: { patio_terraza: 100, antepiso_interior: 100, estacionamiento: 150, bodega_industrial: 150 },
      },
      isResult: false,
    },
  ];
  const lossFactors = [{ key: "perdida_hormigon", percentage: 0.07, condition: null }];
  const formulas = [
    {
      key: "volumen_bruto",
      label: "Volumen bruto",
      unit: "m³",
      expression: { op: "*", args: [{ var: "largo" }, { var: "ancho" }, { op: "/", args: [{ var: "espesor_cm" }, 100] }] },
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
      key: "cemento_manual",
      label: "Cemento",
      unit: "bolsa",
      expression: { op: "ceil", value: { op: "*", args: [{ ref: "volumen_con_perdida" }, { var: "sacos-cemento-por-m3" }] } },
      condition: null,
      isResult: true,
      note: null,
      order: 2,
      material: null,
    },
    {
      key: "arena_manual",
      label: "Arena",
      unit: "m³",
      expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, { var: "arena-m3-por-m3" }] },
      condition: null,
      isResult: true,
      note: null,
      order: 3,
      material: null,
    },
    {
      key: "gravilla_manual",
      label: "Gravilla",
      unit: "m³",
      expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, { var: "grava-m3-por-m3" }] },
      condition: null,
      isResult: true,
      note: null,
      order: 4,
      material: null,
    },
    {
      key: "agua_manual",
      label: "Agua",
      unit: "litro",
      expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, { var: "agua-litros-por-m3" }] },
      condition: null,
      isResult: true,
      note: null,
      order: 5,
      material: null,
    },
  ];

  it("patio/terraza (radier sin armar, 4x3m, e=8cm) usa 10 sacos/m3, no 7", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { uso: "patio_terraza", largo: 4, ancho: 3, espesor_cm: 8 },
    });
    // volumen_bruto = 4*3*0.08 = 0.96 ; con perdida 7% = 1.0272
    // cemento = ceil(1.0272 * 10) = 11 (antes, con 7 sacos/m3, habría dado 8)
    expect(resultOf(r.results, "cemento_manual")).toBe(11);
  });

  it("patio/terraza (Fase 3C): arena 0,70 / grava 0,60 / agua 100 L por m3 (Polpaico, no 0,5/0,75/180 fijos)", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { uso: "patio_terraza", largo: 4, ancho: 3, espesor_cm: 8 },
    });
    // volumen_con_perdida = 1.0272
    expect(resultOf(r.results, "arena_manual")).toBeCloseTo(1.0272 * 0.7, 6);
    expect(resultOf(r.results, "gravilla_manual")).toBeCloseTo(1.0272 * 0.6, 6);
    expect(resultOf(r.results, "agua_manual")).toBeCloseTo(1.0272 * 100, 6);
  });

  it("estacionamiento (tránsito vehicular menor) usa 15 sacos/m3", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { uso: "estacionamiento", largo: 4, ancho: 3, espesor_cm: 10 },
    });
    // volumen_bruto = 4*3*0.10 = 1.2 ; con perdida 7% = 1.284
    // cemento = ceil(1.284 * 15) = 20
    expect(resultOf(r.results, "cemento_manual")).toBe(20);
  });

  it("estacionamiento (Fase 3C): arena 0,60 / grava 0,75 / agua 150 L por m3 — proporción se invierte respecto a sin-armar", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { uso: "estacionamiento", largo: 4, ancho: 3, espesor_cm: 10 },
    });
    // volumen_con_perdida = 1.284
    expect(resultOf(r.results, "arena_manual")).toBeCloseTo(1.284 * 0.6, 6);
    expect(resultOf(r.results, "gravilla_manual")).toBeCloseTo(1.284 * 0.75, 6);
    expect(resultOf(r.results, "agua_manual")).toBeCloseTo(1.284 * 150, 6);
    // confirma que la relación arena/grava se invierte entre dosificaciones
    expect(resultOf(r.results, "gravilla_manual")).toBeGreaterThan(resultOf(r.results, "arena_manual"));
  });

  it("caso pequeño: patio chico 2x2m e=8cm", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { uso: "patio_terraza", largo: 2, ancho: 2, espesor_cm: 8 },
    });
    // volumen_bruto = 0.32 ; con perdida = 0.3424 ; cemento = ceil(3.424) = 4
    expect(resultOf(r.results, "cemento_manual")).toBe(4);
  });

  it("caso grande: bodega industrial 20x15m e=12cm usa 15 sacos/m3", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: { uso: "bodega_industrial", largo: 20, ancho: 15, espesor_cm: 12 },
    });
    // volumen_bruto = 20*15*0.12 = 36 ; con perdida 7% = 38.52 ; cemento = ceil(38.52*15) = 578
    expect(resultOf(r.results, "cemento_manual")).toBe(578);
  });
});

describe("preparar-y-estucar-un-muro — estuco vs. empaste", () => {
  const variables = [
    { key: "area-muro-prep", label: "Área", source: { type: "QUESTION", questionKey: "area-total-del-muro-a-preparar-m2" }, isResult: false },
    {
      key: "masilla-kg-por-m2",
      label: "kg/m2",
      source: { type: "LOOKUP", questionKey: "que-tan-danado-esta-el-muro", table: { "estuco-completo": 25, "retoque-puntual": 0.3 } },
      isResult: false,
    },
  ];
  const formulas = [
    {
      key: "masilla-kg",
      label: "Masilla/estuco",
      unit: "kg",
      expression: { op: "*", args: [{ var: "area-muro-prep" }, { var: "masilla-kg-por-m2" }, 1.1] },
      condition: null,
      isResult: true,
      note: null,
      order: 0,
      material: null,
    },
  ];

  it("estuco completo (20m²) da 550kg, no 33kg (1,5kg/m² era la cifra de empaste, no de estuco)", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "que-tan-danado-esta-el-muro": "estuco-completo", "area-total-del-muro-a-preparar-m2": 20 },
    });
    // 20 * 25 * 1.1 = 550
    expect(resultOf(r.results, "masilla-kg")).toBeCloseTo(550, 6);
  });

  it("retoque puntual no cambió (sigue en 0,3 kg/m2)", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "que-tan-danado-esta-el-muro": "retoque-puntual", "area-total-del-muro-a-preparar-m2": 20 },
    });
    // 20 * 0.3 * 1.1 = 6.6
    expect(resultOf(r.results, "masilla-kg")).toBeCloseTo(6.6, 6);
  });

  it("caso grande: fachada completa 80m²", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "que-tan-danado-esta-el-muro": "estuco-completo", "area-total-del-muro-a-preparar-m2": 80 },
    });
    expect(resultOf(r.results, "masilla-kg")).toBeCloseTo(2200, 6);
  });
});

describe("aislacion-termica-bajo-cubierta — cobertura por espesor real (Volcán Aislanglass)", () => {
  const variables = [
    { key: "largo", label: "Largo", source: { type: "QUESTION", questionKey: "largo-del-techo-metros" }, isResult: false },
    { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho-del-techo-metros" }, isResult: false },
    {
      key: "cobertura-m2-por-rollo",
      label: "Cobertura",
      source: {
        type: "LOOKUP",
        questionKey: "espesor-de-aislacion-lana-mineral-mm",
        table: { "40mm": 28.8, "60mm": 14.4, "80mm": 14.4, "100mm": 9.0 },
        default: 12,
      },
      isResult: false,
    },
  ];
  const formulas = [
    { key: "area-m2", label: "Área", unit: "m2", expression: { op: "*", args: [{ var: "largo" }, { var: "ancho" }] }, condition: null, isResult: false, note: null, order: 0, material: null },
    { key: "area-con-perdida", label: "Área con pérdida", unit: "m2", expression: { op: "*", args: [{ ref: "area-m2" }, 1.1] }, condition: null, isResult: false, note: null, order: 1, material: null },
    {
      key: "rollos-lana-mineral",
      label: "Rollos necesarios",
      unit: "rollo",
      expression: { op: "ceil", value: { op: "/", args: [{ ref: "area-con-perdida" }, { var: "cobertura-m2-por-rollo" }] } },
      condition: null,
      isResult: true,
      note: null,
      order: 2,
      material: null,
    },
  ];

  it("60mm (14,4 m²/rollo): 6x5m -> 3 rollos", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "largo-del-techo-metros": 6, "ancho-del-techo-metros": 5, "espesor-de-aislacion-lana-mineral-mm": "60mm" },
    });
    // area = 30 * 1.1 = 33 ; ceil(33/14.4) = 3
    expect(resultOf(r.results, "rollos-lana-mineral")).toBe(3);
  });

  it("100mm (9,0 m²/rollo) necesita más rollos que 40mm (28,8 m²/rollo) para la misma área — confirma que ya no es una constante fija", () => {
    const answersBase = { "largo-del-techo-metros": 6, "ancho-del-techo-metros": 5 };
    const r40 = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { ...answersBase, "espesor-de-aislacion-lana-mineral-mm": "40mm" },
    });
    const r100 = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { ...answersBase, "espesor-de-aislacion-lana-mineral-mm": "100mm" },
    });
    expect(resultOf(r40.results, "rollos-lana-mineral")).toBe(2); // ceil(33/28.8)=2
    expect(resultOf(r100.results, "rollos-lana-mineral")).toBe(4); // ceil(33/9)=4
    expect(resultOf(r100.results, "rollos-lana-mineral")).toBeGreaterThan(resultOf(r40.results, "rollos-lana-mineral"));
  });

  it("caso grande: techo de 15x10m en 80mm", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "largo-del-techo-metros": 15, "ancho-del-techo-metros": 10, "espesor-de-aislacion-lana-mineral-mm": "80mm" },
    });
    // area = 150 * 1.1 = 165 ; ceil(165/14.4) = 12
    expect(resultOf(r.results, "rollos-lana-mineral")).toBe(12);
  });
});

describe("techo-inclinado-bajo-teja-zinc — fieltro asfáltico Volcán 10/40 (40 m²/rollo, no 10)", () => {
  const variables = [
    { key: "largo", label: "Largo", source: { type: "QUESTION", questionKey: "largo-metros" }, isResult: false },
    { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho-metros" }, isResult: false },
    {
      key: "factor-de-inclinacion",
      label: "Factor",
      source: {
        type: "LOOKUP",
        questionKey: "que-tan-inclinado-es-el-techo",
        table: { "poco-inclinado-hasta-15": 1.03, "medio-15-a-30": 1.15, "muy-inclinado-mas-de-30": 1.3 },
      },
      isResult: false,
    },
  ];
  const formulas = [
    { key: "area-horizontal", label: "Área horizontal", unit: "m2", expression: { op: "*", args: [{ var: "largo" }, { var: "ancho" }] }, condition: null, isResult: false, note: null, order: 0, material: null },
    { key: "area-techo-real", label: "Área real", unit: "m2", expression: { op: "*", args: [{ ref: "area-horizontal" }, { var: "factor-de-inclinacion" }] }, condition: null, isResult: true, note: null, order: 1, material: null },
    { key: "area-con-perdida", label: "Área con pérdida", unit: "m2", expression: { op: "*", args: [{ ref: "area-techo-real" }, 1.15] }, condition: null, isResult: true, note: null, order: 2, material: null },
    {
      key: "rollos-de-fieltro",
      label: "Rollos de fieltro asfáltico",
      unit: "rollo",
      expression: { op: "ceil", value: { op: "/", args: [{ ref: "area-con-perdida" }, 40] } },
      condition: null,
      isResult: true,
      note: null,
      order: 3,
      material: null,
    },
  ];

  it("techo 8x6m, inclinación media: 2 rollos (antes, a 10m²/rollo, habría dado 7 — 4x sobrecompra)", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "largo-metros": 8, "ancho-metros": 6, "que-tan-inclinado-es-el-techo": "medio-15-a-30" },
    });
    // area_horizontal=48, area_real=48*1.15=55.2, area_con_perdida=55.2*1.15=63.48
    // rollos_correcto = ceil(63.48/40) = 2 ; rollos_anterior = ceil(63.48/10) = 7
    expect(resultOf(r.results, "rollos-de-fieltro")).toBe(2);
  });

  it("caso pequeño: techo 3x2m poco inclinado", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "largo-metros": 3, "ancho-metros": 2, "que-tan-inclinado-es-el-techo": "poco-inclinado-hasta-15" },
    });
    // area=6*1.03=6.18*1.15=7.107 ; ceil(7.107/40)=1
    expect(resultOf(r.results, "rollos-de-fieltro")).toBe(1);
  });

  it("caso grande: nave de 30x15m muy inclinada", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "largo-metros": 30, "ancho-metros": 15, "que-tan-inclinado-es-el-techo": "muy-inclinado-mas-de-30" },
    });
    // area=450*1.3=585*1.15=672.75 ; ceil(672.75/40)=17
    expect(resultOf(r.results, "rollos-de-fieltro")).toBe(17);
  });
});

describe("instalar-una-ducha — membrana líquida cementicia (no asfáltica) + área de 2 muros", () => {
  const variables = [
    { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho-de-la-ducha-metros" }, isResult: false },
    { key: "profundidad", label: "Profundidad", source: { type: "QUESTION", questionKey: "profundidad-de-la-ducha-metros" }, isResult: false },
    { key: "impermeabilizar", label: "Impermeabilizar", source: { type: "QUESTION", questionKey: "necesitas-impermeabilizar-los-muros" }, isResult: false },
  ];
  const formulas = [
    {
      key: "area-muros-ducha",
      label: "Área de muros",
      unit: "m²",
      expression: { op: "*", args: [{ op: "+", args: [{ var: "ancho" }, { var: "profundidad" }] }, 2.0] },
      condition: { op: "==", args: [{ var: "impermeabilizar" }, { str: "si" }] },
      isResult: false,
      note: null,
      order: 0,
      material: null,
    },
    {
      key: "area-muros-con-perdida-ducha",
      label: "Área con pérdida",
      unit: "m²",
      expression: { op: "*", args: [{ ref: "area-muros-ducha" }, 1.15] },
      condition: { op: "==", args: [{ var: "impermeabilizar" }, { str: "si" }] },
      isResult: false,
      note: null,
      order: 1,
      material: null,
    },
    {
      key: "kg-membrana-impermeabilizante-ducha",
      label: "Membrana líquida impermeabilizante",
      unit: "kg",
      expression: { op: "round", value: { op: "*", args: [{ ref: "area-muros-con-perdida-ducha" }, 2.4] } },
      condition: { op: "==", args: [{ var: "impermeabilizar" }, { str: "si" }] },
      isResult: true,
      // Fase 3C: corrige la explicación (Sika Sikalastic-1K es 1,2 kg/m² POR
      // MM DE ESPESOR, no "por mano") y marca la altura de 2,0m como
      // criterio de obra, no como exigencia del fabricante.
      note: "Consumo de referencia según espesor especificado por fabricante (Sika Sikalastic-1K: 1,2 kg/m² por mm de espesor) — se asume un espesor total de 2 mm en 2 capas (esquema bajo cerámica), 2,4 kg/m². Altura de aplicación de 2,0 m: criterio de obra utilizado para esta estimación, no es una exigencia de Sika ni aparece en su ficha técnica.",
      order: 2,
      material: { name: "Membrana líquida impermeabilizante (cementicia flexible)", unit: "kg" },
    },
  ];

  it("ducha estándar 0.9x0.9m: área de 2 muros (no 4 lados) x altura 2m = 3.6m², con 15% pérdida = 4.14m² -> 10kg", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "ancho-de-la-ducha-metros": 0.9, "profundidad-de-la-ducha-metros": 0.9, "necesitas-impermeabilizar-los-muros": "si" },
    });
    // area-muros-ducha (2 muros x altura 2m = 3.6m²) es interna, no un resultado visible —
    // se verifica indirectamente vía el resultado final: round(3.6*1.15*2.4) = round(9.936) = 10
    expect(resultOf(r.results, "kg-membrana-impermeabilizante-ducha")).toBe(10);
    const membrana = r.results.find((x) => x.key === "kg-membrana-impermeabilizante-ducha");
    expect(membrana?.unit).toBe("kg"); // ya no "rollo" de membrana asfáltica
  });

  it("caso grande: ducha de cabina completa 1.5x1.0m", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "ancho-de-la-ducha-metros": 1.5, "profundidad-de-la-ducha-metros": 1.0, "necesitas-impermeabilizar-los-muros": "si" },
    });
    // area = (1.5+1.0)*2 = 5 ; con perdida = 5.75 ; kg = round(5.75*2.4) = round(13.8) = 14
    expect(resultOf(r.results, "kg-membrana-impermeabilizante-ducha")).toBe(14);
  });

  it("si el usuario no necesita impermeabilizar, no se calcula membrana (condición sigue funcionando)", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "ancho-de-la-ducha-metros": 0.9, "profundidad-de-la-ducha-metros": 0.9, "necesitas-impermeabilizar-los-muros": "no" },
    });
    expect(r.results.find((x) => x.key === "kg-membrana-impermeabilizante-ducha")).toBeUndefined();
  });

  it("Fase 3C: la nota ya no dice 'por mano' y marca la altura como criterio de obra, no exigencia de Sika", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors: [],
      answers: { "ancho-de-la-ducha-metros": 0.9, "profundidad-de-la-ducha-metros": 0.9, "necesitas-impermeabilizar-los-muros": "si" },
    });
    const membrana = r.results.find((x) => x.key === "kg-membrana-impermeabilizante-ducha");
    expect(membrana?.note).not.toMatch(/por mano/i);
    expect(membrana?.note).toMatch(/por mm de espesor/i);
    expect(membrana?.note).toMatch(/criterio de obra/i);
    expect(membrana?.note).toMatch(/no es una exigencia de sika/i); // se dice explícitamente que NO lo es
  });
});

describe("hormigón premezclado — despacho mínimo ya no se presenta como '3 m³' universal", () => {
  const DESPACHO_NOTE =
    "El costo/condición de despacho depende del tipo de servicio, no de un \"mínimo\" único (Melón, Términos y Condiciones, tienda.melon.cl/terms-condictions): con camión mixer tradicional, el precio se calcula sobre una referencia de 7,5 m³ por viaje — pedir menos puede generar un recargo por carga incompleta, pero igual te lo despachan. Si tu proyecto es chico, algunos proveedores ofrecen mixer volumétrico (planta móvil) desde 0,5 m³, sin ese recargo. Consulta directamente con tu proveedor qué servicio te conviene — esto es información comercial orientativa, no una regla técnica.";

  const formulas = [
    {
      key: "volumen_premezclado",
      label: "Volumen de hormigón a pedir",
      unit: "m³",
      expression: { op: "ceilTo", step: 0.5, value: { var: "volumen_con_perdida" } },
      condition: null,
      isResult: true,
      note: DESPACHO_NOTE,
      order: 0,
      material: null,
    },
  ];
  const variables = [{ key: "volumen_con_perdida", label: "Volumen", source: { type: "QUESTION", questionKey: "volumen" }, isResult: false }];

  it("radier/fundación: la nota no contiene '3 m³' como mínimo universal", () => {
    const r = calculateModule({ variables, formulas, lossFactors: [], answers: { volumen: 1.5 } });
    const nota = r.results.find((x) => x.key === "volumen_premezclado")?.note;
    expect(nota).not.toMatch(/3\s?m³.*(mínimo|despacho mínimo)/i);
    expect(nota).not.toMatch(/despacho mínimo.*3\s?m³/i);
  });

  it("la nota explica los 2 niveles de servicio (mixer tradicional 7,5m³ referencia + mixer volumétrico desde 0,5m³)", () => {
    const r = calculateModule({ variables, formulas, lossFactors: [], answers: { volumen: 1.5 } });
    const nota = r.results.find((x) => x.key === "volumen_premezclado")?.note;
    expect(nota).toMatch(/7,5 m³/);
    expect(nota).toMatch(/0,5 m³/);
    expect(nota).toMatch(/mixer volumétrico/i);
    expect(nota).toMatch(/información comercial orientativa/i);
  });

  it("el volumen calculado no cambió (solo cambió el texto explicativo)", () => {
    const r = calculateModule({ variables, formulas, lossFactors: [], answers: { volumen: 1.5 } });
    expect(resultOf(r.results, "volumen_premezclado")).toBe(1.5);
  });
});
