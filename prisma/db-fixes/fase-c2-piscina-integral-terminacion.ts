import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../src/generated/prisma/client";

// FASE C2 -- Configurador integral de Piscina ("piscina-integral"):
// tercer bloque, TERMINACION INTERIOR (muros + fondo, por separado).
//
// Extiende el Module ya creado por fase-c1-piscina-integral.ts (NO lo
// recrea, NO toca su `published` -- esa es la unica fuente de verdad para
// ese flag, ver fase-c1-piscina-integral.ts). Sigue el mismo patron
// idempotente (upsert por key) que el resto del db-fix de este Module.
//
// Alcance C2 exclusivamente: seleccion de terminacion en muros/fondo
// (Pintura/Ceramica-mosaico/Membrana PVC/Sin calcular), toggle "misma
// terminacion", superficies interiores (SIN espesor de muro sumado -- ver
// seccion 3 del pedido), litros de pintura, m2 de ceramica/membrana con
// perdida. Sin Excavacion/Entorno/Equipamiento/precios/costos -- eso queda
// para fases posteriores.
//
// Superficies interiores (geometria INTERIOR terminada, no exterior -- no
// reutiliza largo-ext/ancho-ext/radio-ext de C1, que son para el hormigon
// del vaso, no para revestimiento):
//   Rectangular: area_fondo = L x A ; area_muros = 2 x (L+A) x profundidad
//   Circular:    area_fondo = PI x r^2 ; area_muros = 2 x PI x r x profundidad
// (r = "radio", Formula ya existente de C1, order 12 -- se referencia via
// {ref:"radio"}, no {var:...}, porque es un resultado de Formula, no una
// Variable.)
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // Solo lectura del Module -- este script NUNCA crea ni publica el
  // Module, ni toca su campo `published` (ver comentario de cabecera).
  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  // ---------- PREGUNTAS ----------
  // Las 13 Questions de este bloque comparten stepGroup
  // "interior-termination" y a proposito NO usan visibleIfQuestionKey: la
  // visibilidad condicional (que campos mostrar segun el material y el
  // toggle "misma terminacion") la resuelve el componente propio
  // InteriorTerminationStep, no el mecanismo generico de Question -- ver
  // ese archivo para el porque (necesita los 13 objetos Question
  // disponibles siempre, no solo los "visibles" en un momento dado).

  async function upsertQuestion(input: {
    key: string;
    label: string;
    type: "SELECT" | "NUMBER";
    unit?: string;
    helpText?: string;
    order: number;
    stepGroup?: string;
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
      },
      update: {
        label: input.label,
        type: input.type,
        unit: input.unit,
        helpText: input.helpText,
        order: input.order,
        stepGroup: input.stepGroup,
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

  const STEP_GROUP = "interior-termination";
  const MATERIAL_OPTIONS = [
    { key: "pintura", label: "Pintura para piscina", order: 0 },
    { key: "ceramica", label: "Cerámica / mosaico", order: 1 },
    { key: "membrana", label: "Membrana PVC (liner)", order: 2 },
    { key: "sin-calcular", label: "Sin calcular", order: 3 },
  ];

  await upsertQuestion({
    key: "interior-misma-terminacion",
    label: "¿Usarás la misma terminación en muros y fondo?",
    type: "SELECT",
    order: 10,
    stepGroup: STEP_GROUP,
    options: [
      { key: "si", label: "Sí, la misma en ambos", order: 0 },
      { key: "no", label: "No, elegir por separado", order: 1 },
    ],
  });
  await upsertQuestion({
    key: "interior-terminacion-muros",
    label: "Terminación de los muros",
    type: "SELECT",
    order: 11,
    stepGroup: STEP_GROUP,
    options: MATERIAL_OPTIONS,
  });
  await upsertQuestion({
    key: "interior-terminacion-fondo",
    label: "Terminación del fondo",
    type: "SELECT",
    order: 12,
    stepGroup: STEP_GROUP,
    options: MATERIAL_OPTIONS,
  });

  // Detalle Pintura -- sin defaults precargados (manos/rendimiento/perdida
  // dependen del producto real, no de una cifra "tipica" no verificada).
  await upsertQuestion({
    key: "interior-pintura-manos-muros",
    label: "Número de manos",
    type: "NUMBER",
    order: 13,
    stepGroup: STEP_GROUP,
    helpText: "Revisa el número de manos especificado para el producto.",
  });
  await upsertQuestion({
    key: "interior-pintura-rendimiento-muros",
    label: "Rendimiento del producto",
    type: "NUMBER",
    unit: "m²/L",
    order: 14,
    stepGroup: STEP_GROUP,
    helpText: "Revisa el rendimiento indicado por el fabricante.",
  });
  await upsertQuestion({
    key: "interior-pintura-perdida-muros",
    label: "Margen / pérdida",
    type: "NUMBER",
    unit: "%",
    order: 15,
    stepGroup: STEP_GROUP,
  });
  await upsertQuestion({
    key: "interior-ceramica-perdida-muros",
    label: "Pérdida de instalación",
    type: "NUMBER",
    unit: "%",
    order: 16,
    stepGroup: STEP_GROUP,
  });
  await upsertQuestion({
    key: "interior-membrana-perdida-muros",
    label: "Margen / pérdida",
    type: "NUMBER",
    unit: "%",
    order: 17,
    stepGroup: STEP_GROUP,
  });

  await upsertQuestion({
    key: "interior-pintura-manos-fondo",
    label: "Número de manos",
    type: "NUMBER",
    order: 18,
    stepGroup: STEP_GROUP,
    helpText: "Revisa el número de manos especificado para el producto.",
  });
  await upsertQuestion({
    key: "interior-pintura-rendimiento-fondo",
    label: "Rendimiento del producto",
    type: "NUMBER",
    unit: "m²/L",
    order: 19,
    stepGroup: STEP_GROUP,
    helpText: "Revisa el rendimiento indicado por el fabricante.",
  });
  await upsertQuestion({
    key: "interior-pintura-perdida-fondo",
    label: "Margen / pérdida",
    type: "NUMBER",
    unit: "%",
    order: 20,
    stepGroup: STEP_GROUP,
  });
  await upsertQuestion({
    key: "interior-ceramica-perdida-fondo",
    label: "Pérdida de instalación",
    type: "NUMBER",
    unit: "%",
    order: 21,
    stepGroup: STEP_GROUP,
  });
  await upsertQuestion({
    key: "interior-membrana-perdida-fondo",
    label: "Margen / pérdida",
    type: "NUMBER",
    unit: "%",
    order: 22,
    stepGroup: STEP_GROUP,
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

  await upsertTextVariable("terminacion-muros", "Terminación de los muros", {
    type: "QUESTION",
    questionKey: "interior-terminacion-muros",
  });
  await upsertTextVariable("terminacion-fondo", "Terminación del fondo", {
    type: "QUESTION",
    questionKey: "interior-terminacion-fondo",
  });
  await upsertVariable("pintura-manos-muros", "Número de manos (muros)", {
    type: "QUESTION",
    questionKey: "interior-pintura-manos-muros",
  });
  await upsertVariable("pintura-rendimiento-muros", "Rendimiento del producto (muros)", {
    type: "QUESTION",
    questionKey: "interior-pintura-rendimiento-muros",
  });
  await upsertVariable("pintura-perdida-muros", "Margen/pérdida pintura (muros)", {
    type: "QUESTION",
    questionKey: "interior-pintura-perdida-muros",
  });
  await upsertVariable("ceramica-perdida-muros", "Pérdida de instalación cerámica (muros)", {
    type: "QUESTION",
    questionKey: "interior-ceramica-perdida-muros",
  });
  await upsertVariable("membrana-perdida-muros", "Margen/pérdida membrana (muros)", {
    type: "QUESTION",
    questionKey: "interior-membrana-perdida-muros",
  });
  await upsertVariable("pintura-manos-fondo", "Número de manos (fondo)", {
    type: "QUESTION",
    questionKey: "interior-pintura-manos-fondo",
  });
  await upsertVariable("pintura-rendimiento-fondo", "Rendimiento del producto (fondo)", {
    type: "QUESTION",
    questionKey: "interior-pintura-rendimiento-fondo",
  });
  await upsertVariable("pintura-perdida-fondo", "Margen/pérdida pintura (fondo)", {
    type: "QUESTION",
    questionKey: "interior-pintura-perdida-fondo",
  });
  await upsertVariable("ceramica-perdida-fondo", "Pérdida de instalación cerámica (fondo)", {
    type: "QUESTION",
    questionKey: "interior-ceramica-perdida-fondo",
  });
  await upsertVariable("membrana-perdida-fondo", "Margen/pérdida membrana (fondo)", {
    type: "QUESTION",
    questionKey: "interior-membrana-perdida-fondo",
  });

  // ---------- FORMULAS ----------
  // Orders 50+ -- despues del rango usado por C1 (hasta 40, refuerzo
  // estructural) para que la secuencia de evaluacion nunca se entrelace
  // por error con esas formulas ya verificadas/congeladas.

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
  const eqOpt = (varKey: string, v: string) => ({ op: "==", args: [{ var: varKey }, { str: v }] });
  const and = (...args: object[]) => ({ op: "and", args });
  const pct = (varKey: string) => ({ op: "/", args: [{ var: varKey }, 100] });
  const withLoss = (base: object, varKey: string) => ({
    op: "*",
    args: [base, { op: "+", args: [1, pct(varKey)] }],
  });

  // --- Superficies interiores (geometria interior, sin espesor de muro) ---
  await upsertFormula({
    key: "area-fondo-rect",
    label: "Fondo — superficie interior (rect)",
    unit: "m²",
    isResult: false,
    order: 50,
    condition: eqForma("rectangular"),
    expression: { op: "*", args: [{ var: "largo" }, { var: "ancho" }] },
  });
  await upsertFormula({
    key: "area-muros-rect",
    label: "Muros — superficie interior (rect)",
    unit: "m²",
    isResult: false,
    order: 51,
    condition: eqForma("rectangular"),
    expression: {
      op: "*",
      args: [{ op: "*", args: [2, { op: "+", args: [{ var: "largo" }, { var: "ancho" }] }] }, { var: "profundidad-rect" }],
    },
  });
  await upsertFormula({
    key: "area-fondo-circ",
    label: "Fondo — superficie interior (circ)",
    unit: "m²",
    isResult: false,
    order: 52,
    condition: eqForma("circular"),
    expression: { op: "*", args: [3.14159265358979, { op: "*", args: [{ ref: "radio" }, { ref: "radio" }] }] },
  });
  await upsertFormula({
    key: "area-muros-circ",
    label: "Muros — superficie interior (circ)",
    unit: "m²",
    isResult: false,
    order: 53,
    condition: eqForma("circular"),
    expression: {
      op: "*",
      args: [{ op: "*", args: [2, 3.14159265358979] }, { op: "*", args: [{ ref: "radio" }, { var: "profundidad-circ" }] }],
    },
  });
  await upsertFormula({
    key: "area-fondo",
    label: "Fondo — superficie interior",
    unit: "m²",
    isResult: true,
    order: 54,
    expression: { op: "coalesce", args: [{ ref: "area-fondo-rect" }, { ref: "area-fondo-circ" }] },
  });
  await upsertFormula({
    key: "area-muros",
    label: "Muros — superficie interior",
    unit: "m²",
    isResult: true,
    order: 55,
    expression: { op: "coalesce", args: [{ ref: "area-muros-rect" }, { ref: "area-muros-circ" }] },
  });

  // --- Muros: Pintura / Cerámica / Membrana (Sin calcular -> ninguna
  // formula de este bloque evalua, ver seccion 11 del pedido) ---
  await upsertFormula({
    key: "muros-pintura-litros-brutos",
    label: "Muros — Pintura: litros (bruto)",
    unit: "L",
    isResult: false,
    order: 60,
    condition: eqOpt("terminacion-muros", "pintura"),
    expression: { op: "/", args: [{ op: "*", args: [{ ref: "area-muros" }, { var: "pintura-manos-muros" }] }, { var: "pintura-rendimiento-muros" }] },
  });
  await upsertFormula({
    key: "muros-pintura-litros-total",
    label: "Muros — Pintura para piscina: litros estimados",
    unit: "L",
    isResult: true,
    order: 61,
    condition: eqOpt("terminacion-muros", "pintura"),
    expression: withLoss({ ref: "muros-pintura-litros-brutos" }, "pintura-perdida-muros"),
  });
  await upsertFormula({
    key: "muros-ceramica-m2-compra",
    label: "Muros — Cerámica/mosaico: m² a comprar (con pérdida)",
    unit: "m²",
    isResult: true,
    order: 62,
    condition: eqOpt("terminacion-muros", "ceramica"),
    expression: withLoss({ ref: "area-muros" }, "ceramica-perdida-muros"),
  });
  await upsertFormula({
    key: "muros-membrana-m2",
    label: "Muros — Membrana PVC: m² estimados",
    unit: "m²",
    isResult: true,
    order: 63,
    condition: eqOpt("terminacion-muros", "membrana"),
    expression: withLoss({ ref: "area-muros" }, "membrana-perdida-muros"),
  });

  // --- Fondo: mismo patron ---
  await upsertFormula({
    key: "fondo-pintura-litros-brutos",
    label: "Fondo — Pintura: litros (bruto)",
    unit: "L",
    isResult: false,
    order: 64,
    condition: eqOpt("terminacion-fondo", "pintura"),
    expression: { op: "/", args: [{ op: "*", args: [{ ref: "area-fondo" }, { var: "pintura-manos-fondo" }] }, { var: "pintura-rendimiento-fondo" }] },
  });
  await upsertFormula({
    key: "fondo-pintura-litros-total",
    label: "Fondo — Pintura para piscina: litros estimados",
    unit: "L",
    isResult: true,
    order: 65,
    condition: eqOpt("terminacion-fondo", "pintura"),
    expression: withLoss({ ref: "fondo-pintura-litros-brutos" }, "pintura-perdida-fondo"),
  });
  await upsertFormula({
    key: "fondo-ceramica-m2-compra",
    label: "Fondo — Cerámica/mosaico: m² a comprar (con pérdida)",
    unit: "m²",
    isResult: true,
    order: 66,
    condition: eqOpt("terminacion-fondo", "ceramica"),
    expression: withLoss({ ref: "area-fondo" }, "ceramica-perdida-fondo"),
  });
  await upsertFormula({
    key: "fondo-membrana-m2",
    label: "Fondo — Membrana PVC: m² estimados",
    unit: "m²",
    isResult: true,
    order: 67,
    condition: eqOpt("terminacion-fondo", "membrana"),
    expression: withLoss({ ref: "area-fondo" }, "membrana-perdida-fondo"),
  });

  // --- Totales combinados (solo cuando AMBAS superficies usan el mismo
  // material -- seccion 7/18 del pedido: "si ambos usan pintura, entregar
  // tambien total combinado") ---
  await upsertFormula({
    key: "pintura-litros-combinado",
    label: "Pintura para piscina — litros totales (muros + fondo)",
    unit: "L",
    isResult: true,
    order: 70,
    condition: and(eqOpt("terminacion-muros", "pintura"), eqOpt("terminacion-fondo", "pintura")),
    expression: { op: "+", args: [{ ref: "muros-pintura-litros-total" }, { ref: "fondo-pintura-litros-total" }] },
  });
  await upsertFormula({
    key: "ceramica-m2-combinado",
    label: "Cerámica/mosaico — m² totales a comprar (muros + fondo)",
    unit: "m²",
    isResult: true,
    order: 71,
    condition: and(eqOpt("terminacion-muros", "ceramica"), eqOpt("terminacion-fondo", "ceramica")),
    expression: { op: "+", args: [{ ref: "muros-ceramica-m2-compra" }, { ref: "fondo-ceramica-m2-compra" }] },
  });
  await upsertFormula({
    key: "membrana-m2-combinado",
    label: "Membrana PVC — m² totales estimados (muros + fondo)",
    unit: "m²",
    isResult: true,
    order: 72,
    condition: and(eqOpt("terminacion-muros", "membrana"), eqOpt("terminacion-fondo", "membrana")),
    expression: { op: "+", args: [{ ref: "muros-membrana-m2" }, { ref: "fondo-membrana-m2" }] },
  });

  console.log(`Fase C2 (terminación interior) lista para Module "piscina-integral". id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
