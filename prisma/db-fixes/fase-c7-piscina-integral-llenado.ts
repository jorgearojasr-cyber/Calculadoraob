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

  // FASE C7-B (2026-09-05) -- UX práctica para usuario no técnico
  // (Etapa A aprobada). Reemplaza la pregunta principal Sí/No por un menú
  // de "¿Cómo llenarás la piscina?", reusando EL MISMO key
  // "llenado-estimar" (evita un delete de Question con riesgo de FK; el
  // key es un identificador técnico interno, nunca visible al usuario --
  // mismo criterio ya aplicado a los keys `entorno-*` que hoy muestran
  // copy "Borde"). Las opciones viejas "si"/"no" se reemplazan por las 5
  // nuevas; "llenado-segundos-balde" (medición exacta con balde) pasa a
  // ser una RAMA más ("medir"), no la única entrada -- su Formula
  // (`llenado-caudal-l-min`/`llenado-tiempo-horas`, más abajo) NUNCA
  // dependió del key "llenado-estimar" (solo de `defined(llenado-segundos-
  // balde)`), así que sigue funcionando exactamente igual sin tocarla.
  await upsertQuestion({
    key: "llenado-estimar",
    label: "¿Cómo llenarás la piscina?",
    type: "SELECT",
    order: 135,
    stepGroup: STEP_GROUP,
    options: [
      { key: "pequena", label: "Llave doméstica / conexión pequeña", order: 0 },
      { key: "tres-cuartos", label: "Conexión 3/4\"", order: 1 },
      { key: "una-pulgada", label: "Conexión 1\"", order: 2 },
      { key: "camion", label: "Camión aljibe", order: 3 },
      { key: "medir", label: "Medir mi caudal real", order: 4 },
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
      "Llena un balde de 10 L y cronometra el tiempo. Así obtendrás una estimación mucho más precisa de tu caudal real.",
    visibleIfQuestionKey: "llenado-estimar",
    visibleIfValues: ["medir"],
  });

  // Camión aljibe (sección 6 del pedido) -- mismo patrón EXACTO que
  // "Camión para retirar la tierra" de Excavación (fase-c3-piscina-
  // integral-excavacion.ts: LOOKUP estándar + Question personalizada +
  // coalesce). Capacidades reales de arriendo en Chile (investigación
  // Etapa A): 10.000 / 15.000 / 20.000 L.
  await upsertQuestion({
    key: "llenado-capacidad-camion",
    label: "Capacidad del camión",
    type: "SELECT",
    order: 137,
    stepGroup: STEP_GROUP,
    helpText: "La capacidad real depende del proveedor que contrates.",
    visibleIfQuestionKey: "llenado-estimar",
    visibleIfValues: ["camion"],
    options: [
      { key: "10000", label: "10.000 L", order: 0 },
      { key: "15000", label: "15.000 L", order: 1 },
      { key: "20000", label: "20.000 L", order: 2 },
      { key: "personalizado", label: "Personalizado", order: 3 },
    ],
  });

  await upsertQuestion({
    key: "llenado-capacidad-camion-personalizada",
    label: "¿Cuántos litros lleva el camión?",
    type: "NUMBER",
    unit: "L",
    order: 138,
    stepGroup: STEP_GROUP,
    visibleIfQuestionKey: "llenado-capacidad-camion",
    visibleIfValues: ["personalizado"],
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

  // Modo de llenado como Variable (para poder comparar su valor con "=="
  // en las Formulas de más abajo, mismo patrón que "entorno-terminacion"
  // en fase-c4-piscina-integral-entorno.ts).
  await upsertVariable("llenado-modo-var", "Modo de llenado", {
    type: "QUESTION",
    questionKey: "llenado-estimar",
  });

  // Rangos de caudal por tipo de conexión (sección 3 del pedido, Etapa A
  // sección 3): fuentes de plomería residencial de EE.UU. (no específicas
  // de Chile, no hay equivalente chileno encontrado), CONVERTIDAS a L/min
  // y deliberadamente solapadas entre categorías -- el diámetro nominal NO
  // garantiza un caudal fijo (varía con presión de red, largo de manguera
  // y estado de la instalación). Nunca se presentan como un valor único.
  await upsertVariable("llenado-caudal-min-lookup", "Caudal mínimo por conexión", {
    type: "LOOKUP",
    table: { pequena: 15, "tres-cuartos": 35, "una-pulgada": 55 },
    questionKey: "llenado-estimar",
  });
  await upsertVariable("llenado-caudal-max-lookup", "Caudal máximo por conexión", {
    type: "LOOKUP",
    table: { pequena: 35, "tres-cuartos": 70, "una-pulgada": 95 },
    questionKey: "llenado-estimar",
  });

  // Capacidad del camión aljibe -- mismo patrón que
  // "excavacion-capacidad-camion-m3-lookup" (fase-c3), en litros.
  await upsertVariable("llenado-capacidad-camion-lookup", "Capacidad camión (estándar)", {
    type: "LOOKUP",
    table: { "10000": 10000, "15000": 15000, "20000": 20000 },
    questionKey: "llenado-capacidad-camion",
  });
  await upsertVariable("llenado-capacidad-camion-personalizada-var", "Capacidad camión (personalizada)", {
    type: "QUESTION",
    questionKey: "llenado-capacidad-camion-personalizada",
  });
  await upsertVariable("llenado-capacidad-camion-var", "Tipo de capacidad de camión", {
    type: "QUESTION",
    questionKey: "llenado-capacidad-camion",
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

  // ---------- FORMULAS NUEVAS: rango por conexión + camión aljibe ----------
  const eqVar = (variable: string, value: string) => ({ op: "==", args: [{ var: variable }, { str: value }] });
  const neqVar = (variable: string, value: string) => ({ op: "!=", args: [{ var: variable }, { str: value }] });
  const orC = (...args: Prisma.InputJsonValue[]) => ({ op: "or", args });
  const andC = (...args: Prisma.InputJsonValue[]) => ({ op: "and", args });
  const definedC = (key: string) => ({ op: "defined", key });

  // `definedC` protege contra el caso (solo posible en tests aislados o si
  // el módulo se calcula antes de responder el bloque Llenado completo) en
  // que "llenado-modo-var" todavía no esté en el contexto -- sin esto,
  // evaluar `==` sobre una Variable no resuelta lanza una excepción dura
  // en vez de simplemente no aplicar la condición.
  const MODO_CONEXION = andC(
    definedC("llenado-modo-var"),
    orC(eqVar("llenado-modo-var", "pequena"), eqVar("llenado-modo-var", "tres-cuartos"), eqVar("llenado-modo-var", "una-pulgada"))
  );

  await upsertFormula({
    key: "llenado-caudal-rango-min",
    label: "Caudal mínimo estimado",
    unit: "L/min",
    isResult: true,
    order: 137,
    condition: MODO_CONEXION,
    expression: { var: "llenado-caudal-min-lookup" },
    note: "Referencia general de plomería residencial (no específica de Chile). El caudal real depende de la presión de tu red, el largo de manguera y las condiciones de la instalación.",
  });
  await upsertFormula({
    key: "llenado-caudal-rango-max",
    label: "Caudal máximo estimado",
    unit: "L/min",
    isResult: true,
    order: 138,
    condition: MODO_CONEXION,
    expression: { var: "llenado-caudal-max-lookup" },
  });
  // Tiempo MÁS RÁPIDO ocurre con el caudal MÁXIMO, y viceversa -- rango
  // deliberadamente invertido respecto al caudal (sección 4 del pedido).
  await upsertFormula({
    key: "llenado-tiempo-horas-min",
    label: "Tiempo estimado (más rápido)",
    unit: "hora",
    isResult: true,
    order: 139,
    condition: MODO_CONEXION,
    expression: {
      op: "/",
      args: [{ ref: "agua-volumen-litros" }, { op: "*", args: [{ ref: "llenado-caudal-rango-max" }, 60] }],
    },
  });
  await upsertFormula({
    key: "llenado-tiempo-horas-max",
    label: "Tiempo estimado (más lento)",
    unit: "hora",
    isResult: true,
    order: 140,
    condition: MODO_CONEXION,
    expression: {
      op: "/",
      args: [{ ref: "agua-volumen-litros" }, { op: "*", args: [{ ref: "llenado-caudal-rango-min" }, 60] }],
    },
  });

  // Camión aljibe -- mismo patrón EXACTO que "excavacion-capacidad-camion"
  // (estándar/personalizada + coalesce), en litros. `viajes = ceil(litros
  // de la piscina / capacidad)`.
  await upsertFormula({
    key: "llenado-capacidad-camion-estandar",
    label: "Capacidad camión (estándar)",
    unit: "L",
    isResult: false,
    order: 141,
    condition: andC(definedC("llenado-capacidad-camion-var"), neqVar("llenado-capacidad-camion-var", "personalizado")),
    expression: { var: "llenado-capacidad-camion-lookup" },
  });
  await upsertFormula({
    key: "llenado-capacidad-camion-personalizada-f",
    label: "Capacidad camión (personalizada)",
    unit: "L",
    isResult: false,
    order: 142,
    condition: andC(definedC("llenado-capacidad-camion-var"), eqVar("llenado-capacidad-camion-var", "personalizado")),
    expression: { var: "llenado-capacidad-camion-personalizada-var" },
  });
  await upsertFormula({
    key: "llenado-capacidad-camion-final",
    label: "Capacidad del camión",
    unit: "L",
    isResult: true,
    order: 143,
    condition: andC(definedC("llenado-modo-var"), eqVar("llenado-modo-var", "camion")),
    expression: {
      op: "coalesce",
      args: [{ ref: "llenado-capacidad-camion-estandar" }, { ref: "llenado-capacidad-camion-personalizada-f" }],
    },
  });
  await upsertFormula({
    key: "llenado-viajes-camion",
    label: "Viajes estimados",
    unit: "viaje",
    isResult: true,
    order: 144,
    condition: andC(definedC("llenado-modo-var"), eqVar("llenado-modo-var", "camion")),
    expression: {
      op: "ceil",
      value: { op: "/", args: [{ ref: "agua-volumen-litros" }, { ref: "llenado-capacidad-camion-final" }] },
    },
  });

  console.log(`Fase C7 (llenado) lista para Module "piscina-integral". id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
