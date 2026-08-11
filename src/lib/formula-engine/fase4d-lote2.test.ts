import { describe, expect, it } from "vitest";
import { calculateModule } from "./index";

// Tests de Fase 4D — Lote 2 (09-ago-2026): Cerámica para baño, Cambiar
// silicona, Cambiar burlete. DSL replicado exactamente contra
// prisma/db-fixes/fase4d-lote2-ceramica-silicona-burlete.ts.

function resultOf(results: ReturnType<typeof calculateModule>["results"], key: string) {
  const r = results.find((x) => x.key === key);
  if (!r) throw new Error(`No se encontró el resultado "${key}"`);
  return r.value;
}

describe("ceramica-para-bano — flujo combinado piso+muros (reutiliza motor de ceramica-pisos)", () => {
  const variables = [
    { key: "zonas-a-revestir", label: "Zonas", source: { type: "QUESTION", questionKey: "zonas-a-revestir" }, isResult: false },
    { key: "piso-largo", label: "Largo piso", source: { type: "QUESTION", questionKey: "piso-largo" }, isResult: false },
    { key: "piso-ancho", label: "Ancho piso", source: { type: "QUESTION", questionKey: "piso-ancho" }, isResult: false },
    { key: "muros-perimetro", label: "Perímetro muros", source: { type: "QUESTION", questionKey: "muros-perimetro" }, isResult: false },
    { key: "muros-altura", label: "Altura muros", source: { type: "QUESTION", questionKey: "muros-altura" }, isResult: false },
    { key: "descuento-vanos-m2", label: "Descuento", source: { type: "QUESTION", questionKey: "descuento-vanos-m2" }, isResult: false },
    { key: "cobertura-caja-m2", label: "Cobertura", source: { type: "QUESTION", questionKey: "cobertura-caja-m2" }, isResult: false },
    { key: "superficie-irregular", label: "Irregular", source: { type: "QUESTION", questionKey: "superficie-irregular" }, isResult: false },
    {
      key: "kg-por-m2-fraguue",
      label: "Kg fragüe",
      source: {
        type: "LOOKUP",
        questionKey: "tamano-pieza",
        table: { "20x20cm": 1, "25x25cm": 1, "25x60cm": 0.3, "30x30cm": 0.7, "45x45cm": 0.55, "60x60cm": 0.4, "80x80cm": 0.3, "60x120cm": 0.3, personalizada: 0.5 },
      },
      isResult: false,
    },
  ];
  const lossFactors = [
    { key: "perdida-simple-bano", percentage: 0.08, condition: null },
    { key: "perdida-irregular-bano", percentage: 0.15, condition: null },
  ];
  const formulas = [
    { key: "area-piso", label: "Área piso", unit: "m²", expression: { op: "*", args: [{ var: "piso-largo" }, { var: "piso-ancho" }] }, condition: { op: "!=", args: [{ var: "zonas-a-revestir" }, { str: "muros" }] }, isResult: false, note: null, order: 1, material: null },
    { key: "area-muros-bruta", label: "Área muros", unit: "m²", expression: { op: "*", args: [{ var: "muros-perimetro" }, { var: "muros-altura" }] }, condition: { op: "!=", args: [{ var: "zonas-a-revestir" }, { str: "piso" }] }, isResult: false, note: null, order: 2, material: null },
    { key: "superficie-total", label: "Superficie total", unit: "m²", expression: { op: "+", args: [{ op: "coalesce", args: [{ ref: "area-piso" }, 0] }, { op: "coalesce", args: [{ ref: "area-muros-bruta" }, 0] }] }, condition: null, isResult: true, note: null, order: 3, material: null },
    { key: "superficie-descontada", label: "Superficie descontada", unit: "m²", expression: { var: "descuento-vanos-m2" }, condition: { op: "!=", args: [{ var: "zonas-a-revestir" }, { str: "piso" }] }, isResult: true, note: null, order: 4, material: null },
    { key: "superficie-final", label: "Superficie final", unit: "m²", expression: { op: "-", args: [{ ref: "superficie-total" }, { op: "coalesce", args: [{ ref: "superficie-descontada" }, 0] }] }, condition: null, isResult: true, note: null, order: 5, material: null },
    { key: "cajas-simple", label: "Cajas", unit: "caja", expression: { op: "ceil", value: { op: "lossFactor", key: "perdida-simple-bano", value: { op: "/", args: [{ ref: "superficie-final" }, { var: "cobertura-caja-m2" }] } } }, condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "no-es-simple" }] }, isResult: true, note: null, order: 6, material: null },
    { key: "cajas-irregular", label: "Cajas", unit: "caja", expression: { op: "ceil", value: { op: "lossFactor", key: "perdida-irregular-bano", value: { op: "/", args: [{ ref: "superficie-final" }, { var: "cobertura-caja-m2" }] } } }, condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "si-bastante-irregular" }] }, isResult: true, note: null, order: 7, material: null },
    { key: "adhesivo-simple", label: "Adhesivo", unit: "saco", expression: { op: "ceil", value: { op: "lossFactor", key: "perdida-simple-bano", value: { op: "/", args: [{ ref: "superficie-final" }, 4] } } }, condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "no-es-simple" }] }, isResult: true, note: null, order: 8, material: null },
    { key: "adhesivo-irregular", label: "Adhesivo", unit: "saco", expression: { op: "ceil", value: { op: "lossFactor", key: "perdida-irregular-bano", value: { op: "/", args: [{ ref: "superficie-final" }, 4] } } }, condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "si-bastante-irregular" }] }, isResult: true, note: null, order: 9, material: null },
    { key: "fragüe-simple", label: "Fragüe", unit: "bolsa", expression: { op: "ceil", value: { op: "/", args: [{ op: "*", args: [{ op: "lossFactor", key: "perdida-simple-bano", value: { ref: "superficie-final" } }, { var: "kg-por-m2-fraguue" }] }, 5] } }, condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "no-es-simple" }] }, isResult: true, note: null, order: 10, material: null },
    { key: "fragüe-irregular", label: "Fragüe", unit: "bolsa", expression: { op: "ceil", value: { op: "/", args: [{ op: "*", args: [{ op: "lossFactor", key: "perdida-irregular-bano", value: { ref: "superficie-final" } }, { var: "kg-por-m2-fraguue" }] }, 5] } }, condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "si-bastante-irregular" }] }, isResult: true, note: null, order: 11, material: null },
  ];

  it("piso + muros, superficie irregular: 2x1,8m piso + 2,4x2,0m muros, cobertura 1,44 -> 8,4m² total, 7 cajas, 3 sacos adhesivo, 1 bolsa fragüe", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: {
        "zonas-a-revestir": "ambos",
        "piso-largo": 2,
        "piso-ancho": 1.8,
        "muros-perimetro": 2.4,
        "muros-altura": 2.0,
        "descuento-vanos-m2": 0,
        "tamano-pieza": "60x60cm",
        "cobertura-caja-m2": 1.44,
        "superficie-irregular": "si-bastante-irregular",
      },
    });
    expect(resultOf(r.results, "superficie-total")).toBeCloseTo(8.4, 6);
    expect(resultOf(r.results, "superficie-final")).toBeCloseTo(8.4, 6);
    expect(resultOf(r.results, "cajas-irregular")).toBe(7);
    expect(resultOf(r.results, "adhesivo-irregular")).toBe(3);
    expect(resultOf(r.results, "fragüe-irregular")).toBe(1);
  });

  it("solo piso, superficie simple: 3x2m, cobertura 1,35 -> 5 cajas, 2 sacos adhesivo", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: {
        "zonas-a-revestir": "piso",
        "piso-largo": 3,
        "piso-ancho": 2,
        "tamano-pieza": "45x45cm",
        "cobertura-caja-m2": 1.35,
        "superficie-irregular": "no-es-simple",
      },
    });
    expect(resultOf(r.results, "superficie-total")).toBeCloseTo(6, 6);
    expect(resultOf(r.results, "cajas-simple")).toBe(5);
    expect(resultOf(r.results, "adhesivo-simple")).toBe(2);
    expect(r.results.find((x) => x.key === "superficie-descontada")).toBeUndefined();
  });

  it("con descuento de vanos: muros 4m perímetro x 2m alto, descontando 1,5m² de puerta", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: {
        "zonas-a-revestir": "muros",
        "muros-perimetro": 4,
        "muros-altura": 2,
        "descuento-vanos-m2": 1.5,
        "tamano-pieza": "30x30cm",
        "cobertura-caja-m2": 1,
        "superficie-irregular": "no-es-simple",
      },
    });
    expect(resultOf(r.results, "superficie-total")).toBeCloseTo(8, 6);
    expect(resultOf(r.results, "superficie-descontada")).toBe(1.5);
    expect(resultOf(r.results, "superficie-final")).toBeCloseTo(6.5, 6);
  });

  it("caso grande: baño de suite, piso 4x3m + muros 10m x 2,2m", () => {
    const r = calculateModule({
      variables,
      formulas,
      lossFactors,
      answers: {
        "zonas-a-revestir": "ambos",
        "piso-largo": 4,
        "piso-ancho": 3,
        "muros-perimetro": 10,
        "muros-altura": 2.2,
        "descuento-vanos-m2": 2,
        "tamano-pieza": "60x120cm",
        "cobertura-caja-m2": 1.44,
        "superficie-irregular": "no-es-simple",
      },
    });
    // total = 12 + 22 = 34 ; final = 34 - 2 = 32
    expect(resultOf(r.results, "superficie-final")).toBeCloseTo(32, 6);
    // cajas = ceil(32*1.08/1.44) = ceil(24) = 24
    expect(resultOf(r.results, "cajas-simple")).toBe(24);
  });
});

describe("cambiar-silicona — rendimiento volumétrico (Sika, 280.000mm³/cartucho)", () => {
  const variables = [
    { key: "largo-a-sellar", label: "Largo", source: { type: "QUESTION", questionKey: "largo-a-sellar" }, isResult: false },
    { key: "ancho-junta-mm", label: "Ancho junta", source: { type: "LOOKUP", questionKey: "ancho-de-la-junta", table: { "10mm": 10, "15mm": 15, "20mm": 20 } }, isResult: false },
  ];
  const lossFactors = [{ key: "desperdicio-silicona", percentage: 0.15, condition: null }];
  const formulas = [
    { key: "rendimiento-m-por-cartucho", label: "Rendimiento", unit: "m", expression: { op: "/", args: [{ op: "/", args: [280000, { op: "*", args: [{ var: "ancho-junta-mm" }, 10] }] }, 1000] }, condition: null, isResult: false, note: null, order: 1, material: null },
    { key: "largo-con-desperdicio", label: "Largo con desperdicio", unit: "m", expression: { op: "lossFactor", key: "desperdicio-silicona", value: { var: "largo-a-sellar" } }, condition: null, isResult: false, note: null, order: 2, material: null },
    { key: "cartuchos", label: "Cartuchos", unit: "tubo", expression: { op: "ceil", value: { op: "/", args: [{ ref: "largo-con-desperdicio" }, { ref: "rendimiento-m-por-cartucho" }] } }, condition: null, isResult: true, note: null, order: 3, material: null },
  ];

  it("los 3 puntos de ficha (rendimiento en m/cartucho, antes de desperdicio): 10mm->2,8m, 15mm->1,8667m, 20mm->1,4m", () => {
    const r10 = calculateModule({ variables, formulas, lossFactors, answers: { "largo-a-sellar": 2.8, "ancho-de-la-junta": "10mm" } });
    // 2.8m de junta con 15% desperdicio = 3.22m ; /2.8 rendimiento = 1.15 -> ceil = 2
    expect(resultOf(r10.results, "cartuchos")).toBe(2);
  });

  it("junta de 10mm, 1m a sellar -> 1 cartucho (1m*1.15/2.8m = 0.41)", () => {
    const r = calculateModule({ variables, formulas, lossFactors, answers: { "largo-a-sellar": 1, "ancho-de-la-junta": "10mm" } });
    expect(resultOf(r.results, "cartuchos")).toBe(1);
  });

  it("caso normal: ducha de 3,6m de perímetro, junta 10mm -> 2 cartuchos", () => {
    const r = calculateModule({ variables, formulas, lossFactors, answers: { "largo-a-sellar": 3.6, "ancho-de-la-junta": "10mm" } });
    // 3.6*1.15=4.14 ; /2.8 = 1.478 -> ceil = 2
    expect(resultOf(r.results, "cartuchos")).toBe(2);
  });

  it("caso grande: cocina + 2 baños combinados, 15m, junta 20mm", () => {
    const r = calculateModule({ variables, formulas, lossFactors, answers: { "largo-a-sellar": 15, "ancho-de-la-junta": "20mm" } });
    // 15*1.15=17.25 ; rendimiento 20mm = 1.4 ; 17.25/1.4=12.32 -> ceil=13
    expect(resultOf(r.results, "cartuchos")).toBe(13);
  });

  it("junta más ancha (20mm) rinde menos por cartucho que una angosta (10mm) para el mismo largo", () => {
    const rAngosta = calculateModule({ variables, formulas, lossFactors, answers: { "largo-a-sellar": 10, "ancho-de-la-junta": "10mm" } });
    const rAncha = calculateModule({ variables, formulas, lossFactors, answers: { "largo-a-sellar": 10, "ancho-de-la-junta": "20mm" } });
    expect(resultOf(rAncha.results, "cartuchos")).toBeGreaterThan(resultOf(rAngosta.results, "cartuchos"));
  });
});

describe("cambiar-burlete — perímetro + formato comercial de rollo (Sodimac)", () => {
  const variables = [
    { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho" }, isResult: false },
    { key: "alto", label: "Alto", source: { type: "QUESTION", questionKey: "alto" }, isResult: false },
    { key: "cantidad", label: "Cantidad", source: { type: "QUESTION", questionKey: "cantidad" }, isResult: false },
    { key: "largo-rollo-m", label: "Largo rollo", source: { type: "LOOKUP", questionKey: "largo-de-rollo", table: { "5m": 5, "6m": 6, "10m": 10 } }, isResult: false },
  ];
  const lossFactors = [{ key: "perdida-burlete-empalmes", percentage: 0.1, condition: null }];
  const formulas = [
    { key: "perimetro-total", label: "Perímetro", unit: "m", expression: { op: "*", args: [{ var: "cantidad" }, 2, { op: "+", args: [{ var: "ancho" }, { var: "alto" }] }] }, condition: null, isResult: false, note: null, order: 1, material: null },
    { key: "perimetro-con-perdida", label: "Perímetro con pérdida", unit: "m", expression: { op: "lossFactor", key: "perdida-burlete-empalmes", value: { ref: "perimetro-total" } }, condition: null, isResult: false, note: null, order: 2, material: null },
    { key: "rollos", label: "Rollos", unit: "rollo", expression: { op: "ceil", value: { op: "/", args: [{ ref: "perimetro-con-perdida" }, { var: "largo-rollo-m" }] } }, condition: null, isResult: true, note: null, order: 3, material: null },
  ];

  it("ejemplo de referencia (FASE4B): puerta 0,9x2,1m, rollo 6m -> 2 rollos", () => {
    const r = calculateModule({ variables, formulas, lossFactors, answers: { ancho: 0.9, alto: 2.1, cantidad: 1, "largo-de-rollo": "6m" } });
    // perimetro = 2*(0.9+2.1) = 6.0 ; con perdida 10% = 6.6 ; ceil(6.6/6) = 2
    expect(resultOf(r.results, "rollos")).toBe(2);
  });

  it("caso pequeño: ventana chica 0,4x0,4m, rollo 5m", () => {
    const r = calculateModule({ variables, formulas, lossFactors, answers: { ancho: 0.4, alto: 0.4, cantidad: 1, "largo-de-rollo": "5m" } });
    // perimetro=1.6, con perdida=1.76, ceil(1.76/5)=1
    expect(resultOf(r.results, "rollos")).toBe(1);
  });

  it("caso grande: 5 puertas iguales, suma el perímetro total antes de dividir (no calcula rollo por puerta individual)", () => {
    const r = calculateModule({ variables, formulas, lossFactors, answers: { ancho: 0.9, alto: 2.1, cantidad: 5, "largo-de-rollo": "10m" } });
    // perimetro = 5*2*(0.9+2.1)=30 ; con perdida=33 ; ceil(33/10)=4
    expect(resultOf(r.results, "rollos")).toBe(4);
  });

  it("decimales: puerta de 0,82x2,03m, rollo 6m", () => {
    const r = calculateModule({ variables, formulas, lossFactors, answers: { ancho: 0.82, alto: 2.03, cantidad: 1, "largo-de-rollo": "6m" } });
    // perimetro=2*(0.82+2.03)=5.7 ; con perdida=6.27 ; ceil(6.27/6)=2
    expect(resultOf(r.results, "rollos")).toBe(2);
  });
});
