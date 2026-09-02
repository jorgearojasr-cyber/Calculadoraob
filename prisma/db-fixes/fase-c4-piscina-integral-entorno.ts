import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../src/generated/prisma/client";

// FASE C4 -- Configurador integral de Piscina ("piscina-integral"):
// quinto bloque, ENTORNO / BORDE.
//
// Extiende el Module ya creado por fase-c1-piscina-integral.ts (NO lo
// recrea, NO toca su `published`). El usuario NO vuelve a ingresar
// largo/ancho/diametro del vaso -- el area del entorno se deriva de
// largo-ext/ancho-ext/radio-ext (Formulas de C1) + un unico input nuevo
// (ancho del entorno). Punto de partida: cara EXTERIOR del muro (seccion
// 4 del pedido), no las dimensiones interiores del agua.
//
// Todas las condiciones de visibilidad son de UNA sola key
// (visibleIfQuestionKey nativo) -- a diferencia de Interior (C2), acá NO
// hace falta un mecanismo de active-keys: encadenando 2 condiciones
// simples (base-existente visible solo si terminacion != radier;
// espesor-base visible solo si base-existente == no) el caso "radier
// termina siendo su propia base" queda cubierto sin condicion compuesta.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  // ---------- PREGUNTAS ----------
  async function upsertQuestion(input: {
    key: string;
    label: string;
    type: "SELECT" | "NUMBER";
    unit?: string;
    helpText?: string;
    order: number;
    stepGroup?: string;
    visibleIfQuestionKey?: string;
    visibleIfValues?: string[];
    options?: { key: string; label: string; order: number }[];
  }) {
    const q = await prisma.question.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: input.key } },
      create: {
        moduleId: mod.id,
        key: input.key,
        label: input.label,
        type: input.type,
        unit: input.unit,
        helpText: input.helpText,
        order: input.order,
        stepGroup: input.stepGroup,
        visibleIfQuestionKey: input.visibleIfQuestionKey,
        visibleIfValues: input.visibleIfValues ?? [],
      },
      update: {
        label: input.label,
        type: input.type,
        unit: input.unit,
        helpText: input.helpText,
        order: input.order,
        stepGroup: input.stepGroup,
        visibleIfQuestionKey: input.visibleIfQuestionKey,
        visibleIfValues: input.visibleIfValues ?? [],
      },
    });
    if (input.options) {
      for (const opt of input.options) {
        await prisma.questionOption.upsert({
          where: { questionId_key: { questionId: q.id, key: opt.key } },
          create: { questionId: q.id, key: opt.key, label: opt.label, order: opt.order },
          update: { label: opt.label, order: opt.order },
        });
      }
    }
    return q;
  }

  const STEP_GROUP = "environment";
  const TERMINACION_NO_RADIER = ["ceramica", "porcelanato", "pastelones", "sin-calcular"];

  await upsertQuestion({
    key: "entorno-ancho-m",
    label: "Ancho del entorno/borde",
    type: "NUMBER",
    unit: "m",
    order: 40,
    stepGroup: STEP_GROUP,
    helpText: "Indica cuánto quieres extender el entorno alrededor de la piscina, medido desde la cara exterior del vaso.",
  });
  await upsertQuestion({
    key: "entorno-terminacion",
    label: "Terminación exterior",
    type: "SELECT",
    order: 41,
    stepGroup: STEP_GROUP,
    options: [
      { key: "ceramica", label: "Cerámica", order: 0 },
      { key: "porcelanato", label: "Porcelanato", order: 1 },
      { key: "pastelones", label: "Pastelones", order: 2 },
      { key: "radier", label: "Radier / hormigón terminado", order: 3 },
      { key: "sin-calcular", label: "Sin calcular", order: 4 },
    ],
  });
  // Solo se pregunta si la terminación NO es "radier" -- si el usuario
  // elige Radier/hormigón terminado, esa misma losa YA es la base (ver
  // sección 14 del pedido: evita preguntar "¿ya existe base?" + un radier
  // final aparte, que duplicaría hormigón).
  await upsertQuestion({
    key: "entorno-base-existente",
    label: "¿Ya existe una base firme/radier en el entorno?",
    type: "SELECT",
    order: 42,
    stepGroup: STEP_GROUP,
    visibleIfQuestionKey: "entorno-terminacion",
    visibleIfValues: TERMINACION_NO_RADIER,
    options: [
      { key: "si", label: "Sí", order: 0 },
      { key: "no", label: "No", order: 1 },
    ],
  });
  await upsertQuestion({
    key: "entorno-espesor-base-cm",
    label: "Espesor de la base/radier",
    type: "NUMBER",
    unit: "cm",
    order: 43,
    stepGroup: STEP_GROUP,
    visibleIfQuestionKey: "entorno-base-existente",
    visibleIfValues: ["no"],
    helpText: "El espesor definitivo depende del uso, terreno y solución constructiva.",
  });
  await upsertQuestion({
    key: "entorno-espesor-radier-cm",
    label: "Espesor del radier terminado",
    type: "NUMBER",
    unit: "cm",
    order: 44,
    stepGroup: STEP_GROUP,
    visibleIfQuestionKey: "entorno-terminacion",
    visibleIfValues: ["radier"],
    helpText: "El espesor definitivo depende del uso, terreno y solución constructiva.",
  });
  await upsertQuestion({
    key: "entorno-perdida-terminacion-pct",
    label: "Margen / pérdida",
    type: "NUMBER",
    unit: "%",
    order: 45,
    stepGroup: STEP_GROUP,
    visibleIfQuestionKey: "entorno-terminacion",
    visibleIfValues: ["ceramica", "porcelanato"],
  });
  await upsertQuestion({
    key: "entorno-tamano-pastelon",
    label: "Tamaño de pastelón",
    type: "SELECT",
    order: 46,
    stepGroup: STEP_GROUP,
    visibleIfQuestionKey: "entorno-terminacion",
    visibleIfValues: ["pastelones"],
    // Mismas 3 opciones/coberturas EXACTAS del Module standalone
    // "instalar-pastelones" (ver inspección previa) -- se replican como
    // datos de este Module, sin modificar el standalone.
    options: [
      { key: "40x40cm", label: "40 × 40 cm", order: 0 },
      { key: "50x50cm", label: "50 × 50 cm", order: 1 },
      { key: "60x40cm", label: "60 × 40 cm", order: 2 },
    ],
  });

  // ---------- VARIABLES ----------
  async function upsertVariable(key: string, label: string, source: object) {
    await prisma.variable.upsert({
      where: { moduleId_key: { moduleId: mod.id, key } },
      create: { moduleId: mod.id, key, label, valueType: "NUMBER", source, isResult: false },
      update: { label, source },
    });
  }
  async function upsertTextVariable(key: string, label: string, source: object) {
    await prisma.variable.upsert({
      where: { moduleId_key: { moduleId: mod.id, key } },
      create: { moduleId: mod.id, key, label, valueType: "TEXT", source, isResult: false },
      update: { label, source },
    });
  }

  await upsertVariable("entorno-ancho-m", "Ancho del entorno", { type: "QUESTION", questionKey: "entorno-ancho-m" });
  await upsertTextVariable("entorno-terminacion", "Terminación exterior", { type: "QUESTION", questionKey: "entorno-terminacion" });
  await upsertTextVariable("entorno-base-existente", "Base existente", { type: "QUESTION", questionKey: "entorno-base-existente" });
  await upsertVariable("entorno-espesor-base-cm", "Espesor de la base", { type: "QUESTION", questionKey: "entorno-espesor-base-cm" });
  await upsertVariable("entorno-espesor-radier-cm", "Espesor del radier terminado", { type: "QUESTION", questionKey: "entorno-espesor-radier-cm" });
  await upsertVariable("entorno-perdida-terminacion-pct", "Margen/pérdida terminación entorno", {
    type: "QUESTION",
    questionKey: "entorno-perdida-terminacion-pct",
  });
  await upsertTextVariable("entorno-tamano-pastelon", "Tamaño de pastelón", { type: "QUESTION", questionKey: "entorno-tamano-pastelon" });
  // Misma tabla EXACTA que instalar-pastelones/cobertura-m2 (ver
  // inspección previa) -- replicada como dato propio de este Module
  // (Variable.source no se puede compartir entre Modules, FK moduleId
  // obligatoria), sin modificar el standalone.
  await upsertVariable("entorno-pastelon-cobertura-m2", "Cobertura por pastelón (m²)", {
    type: "LOOKUP",
    table: { "40x40cm": 0.16, "50x50cm": 0.25, "60x40cm": 0.24 },
    questionKey: "entorno-tamano-pastelon",
  });

  // ---------- FORMULAS ----------
  // Orders 100+ -- despues de C1 (40) / C2 (72) / C3 (96).
  async function upsertFormula(input: {
    key: string;
    label: string;
    unit: string;
    expression: Prisma.InputJsonValue;
    condition?: Prisma.InputJsonValue;
    isResult: boolean;
    order: number;
    note?: string;
  }) {
    const condition: Prisma.InputJsonValue | typeof Prisma.JsonNull = input.condition ?? Prisma.JsonNull;
    await prisma.formula.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: input.key } },
      create: {
        moduleId: mod.id,
        key: input.key,
        label: input.label,
        unit: input.unit,
        expression: input.expression,
        condition,
        isResult: input.isResult,
        order: input.order,
        note: input.note,
      },
      update: {
        label: input.label,
        unit: input.unit,
        expression: input.expression,
        condition,
        isResult: input.isResult,
        order: input.order,
        note: input.note,
      },
    });
  }

  const eqForma = (v: string) => ({ op: "==", args: [{ var: "forma" }, { str: v }] });
  const eqTerm = (v: string) => ({ op: "==", args: [{ var: "entorno-terminacion" }, { str: v }] });
  const and = (...args: object[]) => ({ op: "and", args });
  const withLoss = (base: object, varKey: string) => ({
    op: "*",
    args: [base, { op: "+", args: [1, { op: "/", args: [{ var: varKey }, 100] }] }],
  });

  // --- Área del entorno -- seccion 4/5/6/7 del pedido: parte de la cara
  // EXTERIOR del vaso (largo-ext/ancho-ext/radio-ext, ya existentes de
  // C1), NO de dimensiones interiores. area_entorno = area_total - area_vaso
  // (NUNCA se resta el vaso al reves -- ver seccion 7, mismo criterio de
  // "no restar la piscina" ya aplicado en C3 para el hoyo, acá al reves:
  // acá SÍ interesa la resta porque el entorno es literalmente el anillo,
  // no el hoyo completo). ---
  await upsertFormula({
    key: "entorno-area-total-rect",
    label: "Entorno — área total (rect)",
    unit: "m²",
    isResult: false,
    order: 100,
    condition: eqForma("rectangular"),
    expression: {
      op: "*",
      args: [
        { op: "+", args: [{ ref: "largo-ext" }, { op: "*", args: [2, { var: "entorno-ancho-m" }] }] },
        { op: "+", args: [{ ref: "ancho-ext" }, { op: "*", args: [2, { var: "entorno-ancho-m" }] }] },
      ],
    },
  });
  await upsertFormula({
    key: "entorno-area-vaso-rect",
    label: "Entorno — área ocupada por el vaso (rect)",
    unit: "m²",
    isResult: false,
    order: 101,
    condition: eqForma("rectangular"),
    expression: { op: "*", args: [{ ref: "largo-ext" }, { ref: "ancho-ext" }] },
  });
  await upsertFormula({
    key: "entorno-area-rect",
    label: "Entorno — área (rect)",
    unit: "m²",
    isResult: false,
    order: 102,
    condition: eqForma("rectangular"),
    expression: { op: "-", args: [{ ref: "entorno-area-total-rect" }, { ref: "entorno-area-vaso-rect" }] },
  });
  await upsertFormula({
    key: "entorno-radio-total-circ",
    label: "Entorno — radio total (circ)",
    unit: "m",
    isResult: false,
    order: 103,
    condition: eqForma("circular"),
    expression: { op: "+", args: [{ ref: "radio-ext" }, { var: "entorno-ancho-m" }] },
  });
  await upsertFormula({
    key: "entorno-area-total-circ",
    label: "Entorno — área total (circ)",
    unit: "m²",
    isResult: false,
    order: 104,
    condition: eqForma("circular"),
    expression: { op: "*", args: [3.14159265358979, { op: "*", args: [{ ref: "entorno-radio-total-circ" }, { ref: "entorno-radio-total-circ" }] }] },
  });
  await upsertFormula({
    key: "entorno-area-vaso-circ",
    label: "Entorno — área ocupada por el vaso (circ)",
    unit: "m²",
    isResult: false,
    order: 105,
    condition: eqForma("circular"),
    expression: { op: "*", args: [3.14159265358979, { op: "*", args: [{ ref: "radio-ext" }, { ref: "radio-ext" }] }] },
  });
  await upsertFormula({
    key: "entorno-area-circ",
    label: "Entorno — área (circ)",
    unit: "m²",
    isResult: false,
    order: 106,
    condition: eqForma("circular"),
    expression: { op: "-", args: [{ ref: "entorno-area-total-circ" }, { ref: "entorno-area-vaso-circ" }] },
  });
  await upsertFormula({
    key: "entorno-area",
    label: "Área del entorno",
    unit: "m²",
    isResult: true,
    order: 107,
    expression: { op: "coalesce", args: [{ ref: "entorno-area-rect" }, { ref: "entorno-area-circ" }] },
  });

  // --- Base nueva (solo si NO es Radier como terminación Y no existe
  // base) -- VOLUMEN BRUTO, sin LossFactor (sección 11: el 7% del vaso no
  // debe contaminar esta partida distinta; se decide mínimo = bruto). ---
  await upsertFormula({
    key: "entorno-espesor-base-m",
    label: "",
    unit: "m",
    isResult: false,
    order: 108,
    // Misma condición que entorno-volumen-base (que la consume) -- sin
    // esto, evaluaría siempre, incluso cuando base-existente="si" (donde
    // entorno-espesor-base-cm nunca se responde) y lanzaría "Variable no
    // resuelta" en vez de simplemente no formar parte del resultado.
    condition: and({ op: "!=", args: [{ var: "entorno-terminacion" }, { str: "radier" }] }, { op: "==", args: [{ var: "entorno-base-existente" }, { str: "no" }] }),
    expression: { op: "/", args: [{ var: "entorno-espesor-base-cm" }, 100] },
  });
  await upsertFormula({
    key: "entorno-volumen-base",
    label: "Volumen de la base/radier",
    unit: "m³",
    isResult: true,
    order: 109,
    condition: and({ op: "!=", args: [{ var: "entorno-terminacion" }, { str: "radier" }] }, { op: "==", args: [{ var: "entorno-base-existente" }, { str: "no" }] }),
    expression: { op: "*", args: [{ ref: "entorno-area" }, { ref: "entorno-espesor-base-m" }] },
  });

  // --- Radier terminado (única partida de hormigón cuando la
  // terminación ES el radier -- ver sección 14, evita doble conteo). ---
  await upsertFormula({
    key: "entorno-espesor-radier-m",
    label: "",
    unit: "m",
    isResult: false,
    order: 110,
    condition: eqTerm("radier"),
    expression: { op: "/", args: [{ var: "entorno-espesor-radier-cm" }, 100] },
  });
  await upsertFormula({
    key: "entorno-volumen-radier-terminado",
    label: "Volumen de hormigón (radier terminado)",
    unit: "m³",
    isResult: true,
    order: 111,
    condition: eqTerm("radier"),
    expression: { op: "*", args: [{ ref: "entorno-area" }, { ref: "entorno-espesor-radier-m" }] },
  });

  // --- Cerámica / Porcelanato -- fórmula simple pedida en sección 15,
  // NO la complejidad completa de ceramica-pisos/porcelanato-piso
  // standalone (cajas/adhesivo/fragüe quedan fuera de alcance C4). ---
  await upsertFormula({
    key: "entorno-ceramica-m2-compra",
    label: "Cerámica — m² a comprar (con pérdida)",
    unit: "m²",
    isResult: true,
    order: 112,
    condition: eqTerm("ceramica"),
    expression: withLoss({ ref: "entorno-area" }, "entorno-perdida-terminacion-pct"),
  });
  await upsertFormula({
    key: "entorno-porcelanato-m2-compra",
    label: "Porcelanato — m² a comprar (con pérdida)",
    unit: "m²",
    isResult: true,
    order: 113,
    condition: eqTerm("porcelanato"),
    expression: withLoss({ ref: "entorno-area" }, "entorno-perdida-terminacion-pct"),
  });

  // --- Pastelones -- MISMO patrón/valores que instalar-pastelones
  // standalone (8% fijo + cobertura por tamaño, ver inspección), sin
  // modificarlo. ---
  await upsertFormula({
    key: "entorno-pastelones-area-con-perdida",
    label: "",
    unit: "m²",
    isResult: false,
    order: 114,
    condition: eqTerm("pastelones"),
    expression: { op: "*", args: [{ ref: "entorno-area" }, 1.08] },
  });
  await upsertFormula({
    key: "entorno-pastelones-unidades",
    label: "Pastelones — unidades estimadas",
    unit: "unidad",
    isResult: true,
    order: 115,
    condition: eqTerm("pastelones"),
    expression: { op: "ceil", value: { op: "/", args: [{ ref: "entorno-pastelones-area-con-perdida" }, { var: "entorno-pastelon-cobertura-m2" }] } },
  });

  console.log(`Fase C4 (entorno/borde) lista para Module "piscina-integral". id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
