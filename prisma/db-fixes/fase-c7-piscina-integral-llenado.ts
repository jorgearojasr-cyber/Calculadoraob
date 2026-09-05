import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../src/generated/prisma/client";

// FASE C7 -- Configurador integral de Piscina ("piscina-integral"): séptimo
// bloque, LLENADO. Basado en la investigación técnica aprobada
// (2026-09-04): el diámetro de manguera/llave NO determina un caudal fijo
// (varía más de 2x por presión y largo real) -- la única metodología
// defendible es que el USUARIO MIDA su propio caudal real con un balde y un
// cronómetro, nunca asumir un valor por diámetro nominal.
//
// Extiende el Module ya creado por fase-c1-piscina-integral.ts (NO lo
// recrea, NO toca su `published`). Reusa "agua-volumen-litros" (YA
// existente desde C4.2, fase-c4-2-piscina-integral-consolidacion.ts) --
// NUNCA se recalcula el volumen de agua en paralelo.
//
// Totalmente opcional y condicional (sección 18-22 del pedido): si el
// usuario responde "No" a "¿Quieres estimar...?", NINGUNA otra Question de
// este bloque se pregunta ni aparece en "Tu proyecto"/"Editar valores" --
// el filtro genérico ya existente (isQuestionVisible, ver module-wizard.tsx)
// resuelve esto solo, porque "llenado-segundos-balde" usa
// visibleIfQuestionKey de una sola key (mismo mecanismo nativo que ya usa
// "excavacion-capacidad-personalizada-m3" para "camión=personalizado") --
// no hace falta un mecanismo de active-keys nuevo.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  // ---------- PREGUNTAS ----------
  async function upsertQuestion(input: {
    key: string;
    label: string;
    type: "NUMBER" | "SELECT" | "TEXT";
    unit?: string;
    order: number;
    stepGroup?: string;
    helpText?: string;
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
        order: input.order,
        stepGroup: input.stepGroup,
        helpText: input.helpText,
        visibleIfQuestionKey: input.visibleIfQuestionKey,
        visibleIfValues: input.visibleIfValues ?? [],
      },
      update: {
        label: input.label,
        type: input.type,
        unit: input.unit,
        order: input.order,
        stepGroup: input.stepGroup,
        helpText: input.helpText,
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

  const STEP_GROUP = "fill";

  // Orden 135-136 -- entre Equipamiento (130-131) y Costos (140-149):
  // Llenado es un dato físico más, no económico, así que va antes de
  // Costos en el flujo del wizard.
  await upsertQuestion({
    key: "llenado-estimar",
    label: "¿Quieres estimar cuánto demorará en llenarse?",
    type: "SELECT",
    order: 135,
    stepGroup: STEP_GROUP,
    options: [
      { key: "si", label: "Sí", order: 0 },
      { key: "no", label: "No", order: 1 },
    ],
  });

  await upsertQuestion({
    key: "llenado-segundos-balde",
    label: "¿Cuántos segundos demora tu llave en llenar un balde de 10 litros?",
    type: "NUMBER",
    unit: "s",
    order: 136,
    stepGroup: STEP_GROUP,
    helpText:
      "Abre la llave como la usarías para llenar la piscina, mide cuánto demora en llenar un balde de 10 L e ingresa ese tiempo.",
    visibleIfQuestionKey: "llenado-estimar",
    visibleIfValues: ["si"],
  });

  // ---------- VARIABLE ----------
  async function upsertVariable(key: string, label: string, source: object) {
    await prisma.variable.upsert({
      where: { moduleId_key: { moduleId: mod.id, key } },
      create: { moduleId: mod.id, key, label, valueType: "NUMBER", source, isResult: false },
      update: { label, source },
    });
  }

  await upsertVariable("llenado-segundos-balde", "Segundos para llenar balde de 10 L", {
    type: "QUESTION",
    questionKey: "llenado-segundos-balde",
  });

  // ---------- FORMULAS ----------
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

  // Caudal medido = 10 L / (segundos ÷ 60) -- SOLO calcula si el usuario
  // respondió "Sí" y hay un valor (mismo mecanismo `defined()` que ya usan
  // los 10 precios opcionales de Costos, fase-c6, para "vacío = ausente" en
  // vez de "0 = ausente" -- ver fase-c6-piscina-integral-costos.ts). Sin
  // "Sí" -> "llenado-segundos-balde" nunca se pregunta -> la Variable nunca
  // aparece en el contexto -> `defined()` es false -> esta Formula ni
  // "llenado-tiempo-horas" calculan, y el grupo LLENADO del ResultScreen
  // queda vacío (no se renderiza, mismo comportamiento que "Interior" con
  // "Sin calcular").
  await upsertFormula({
    key: "llenado-caudal-l-min",
    label: "Caudal medido (balde)",
    unit: "L/min",
    isResult: true,
    order: 135,
    condition: { op: "defined", key: "llenado-segundos-balde" },
    expression: { op: "/", args: [10, { op: "/", args: [{ var: "llenado-segundos-balde" }, 60] }] },
    note: "Calculado a partir del tiempo medido con un balde de 10 L -- no se asume ningún caudal por diámetro de manguera o llave.",
  });

  // Tiempo total = litros de la piscina (YA existente, C4.2,
  // "agua-volumen-litros" via {ref:}, nunca recalculado en paralelo) ÷
  // (caudal L/min × 60).
  await upsertFormula({
    key: "llenado-tiempo-horas",
    label: "Tiempo estimado de llenado",
    // "hora" (singular, no "h") -- pluralizeUnit ya pluraliza "hora"->
    // "horas" correctamente vía la regla general de palabras terminadas en
    // vocal (mismo criterio que "viaje"->"viajes"); "h" como símbolo
    // rompería esa regla ("h" no termina en vocal -> pluralizeWord daría
    // "hes"), y no está en el set INVARIANT de pluralize.ts.
    unit: "hora",
    isResult: true,
    order: 136,
    condition: { op: "defined", key: "llenado-segundos-balde" },
    expression: {
      op: "/",
      args: [{ ref: "agua-volumen-litros" }, { op: "*", args: [{ ref: "llenado-caudal-l-min" }, 60] }],
    },
  });

  console.log(`Fase C7 (llenado) lista para Module "piscina-integral". id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
