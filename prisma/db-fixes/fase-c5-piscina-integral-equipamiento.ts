import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../src/generated/prisma/client";

// FASE C5 -- Configurador integral de Piscina ("piscina-integral"): sexto
// bloque, EQUIPAMIENTO HIDRÁULICO BÁSICO.
//
// Extiende el Module ya creado por fase-c1-piscina-integral.ts (NO lo
// recrea, NO toca su `published`). Alcance DELIBERADAMENTE acotado
// (sección 1 del pedido C5): esto NO es un diseño hidráulico. Se calcula
// UN dato real (caudal de recirculación, derivado directamente del
// volumen de agua ya existente desde C4.2 -- NUNCA se recalcula el agua
// en paralelo) y se documentan 4 criterios de selección (Bomba/Filtro/
// Skimmers/Retornos) como texto informativo, SIN inventar cifras que
// dependen de ficha técnica/fabricante/diseño hidráulico real (HP,
// pulgadas, cantidad de skimmers/retornos, altura manométrica, pérdida de
// carga -- todo eso queda explícitamente fuera, ver sección 1/28).
//
// Solo 1 pregunta nueva (sección 12): "tiempo de recirculación" (6h/8h,
// sin default silencioso). Bomba/Filtro/Skimmers/Retornos NO son
// preguntas -- son criterios fijos, expresados como Variables TEXT
// isResult:true. El mecanismo Variable-TEXT-isResult:true -> InfoResult
// (formula-engine/index.ts) SÍ tiene precedente real y en uso (ej.
// "refuerzo_recomendado" y "tipo_hormigon" en Radier, fase4-radier-
// dosificacion-refuerzo.ts / fase-c1-piscina-integral.ts) -- ese es el
// patrón nativo del motor para texto informativo. Lo que NO tiene
// precedente en el repo (revisado en C5.1) es el sub-patrón concreto de
// "tabla LOOKUP vacía + default" para un texto que NO varía con ninguna
// respuesta: los precedentes existentes (refuerzo_recomendado) siempre
// atan el texto a una tabla REAL, poblada, donde el texto sí cambia según
// la opción elegida. Acá se usa vacía+default a propósito porque el texto
// de Bomba/Skimmers/Retornos es constante -- poblar una tabla con el
// mismo texto repetido por cada opción de forma sería una tabla FICTICIA
// (sugeriría una variación que no existe). Ver comentario más abajo, junto
// a cada Variable, para el detalle.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  // ---------- PREGUNTA ----------
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

  const STEP_GROUP = "equipment";

  await upsertQuestion({
    key: "equipamiento-tiempo-recirculacion-h",
    label: "Tiempo de recirculación considerado",
    type: "SELECT",
    order: 130,
    stepGroup: STEP_GROUP,
    helpText:
      "Es el tiempo considerado para hacer pasar aproximadamente todo el volumen de agua por el sistema de filtración.",
    // Sin selección precargada (sección 4: "NO imponer silenciosamente
    // 8h" -- el usuario elige explícitamente entre las 2 opciones).
    options: [
      { key: "6", label: "6 horas", order: 0 },
      { key: "8", label: "8 horas", order: 1 },
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
  async function upsertTextInfoVariable(key: string, label: string, source: object) {
    // isResult:true + valueType TEXT -- se convierte en InfoResult (ver
    // formula-engine/index.ts: "infoResults = variables.filter(isResult)")
    // en vez de CalculationResult -- mismo mecanismo nativo que ya usa
    // "refuerzo_recomendado" (Radier) y "tipo_hormigon" (Radier) para
    // texto informativo, reutilizado acá para los 4 criterios de
    // Equipamiento (sección 14 del pedido: "inspecciona el patrón ya
    // existente... úsalo así"). A diferencia de esos 2 precedentes, acá el
    // `source` usa tabla vacía + `default` en vez de una tabla real
    // poblada -- ver el comentario junto a Bomba/Skimmers/Retornos más
    // abajo para el porqué (texto constante, no ligado a ninguna
    // respuesta).
    await prisma.variable.upsert({
      where: { moduleId_key: { moduleId: mod.id, key } },
      create: { moduleId: mod.id, key, label, valueType: "TEXT", source, isResult: true },
      update: { label, source },
    });
  }

  await upsertVariable("equipamiento-horas-recirculacion", "Horas de recirculación", {
    type: "LOOKUP",
    questionKey: "equipamiento-tiempo-recirculacion-h",
    table: { "6": 6, "8": 8 },
  });

  // Los 4 criterios informativos son SIEMPRE los mismos, sin importar la
  // forma/dimensiones de la piscina -- se implementan como LOOKUP con
  // tabla vacía + `default` (ver evaluate.ts: `table[String(answerKey)] ??
  // default ?? null`), enganchados a una pregunta que YA está SIEMPRE
  // respondida desde Medidas ("que-forma-tendra-tu-piscina") solo para
  // que el motor los resuelva en cualquier corrida -- no dependen del
  // valor real de esa pregunta (ver sección 14: "no crear valores
  // numéricos falsos solo porque ResultScreen espera una cifra" -- acá
  // directamente no son cifras, son texto informativo constante).
  await upsertTextInfoVariable("equipamiento-bomba-criterio", "Bomba", {
    type: "LOOKUP",
    questionKey: "que-forma-tendra-tu-piscina",
    table: {},
    default:
      "Selecciona una bomba cuya curva de funcionamiento entregue al menos el caudal objetivo, considerando la altura manométrica y las pérdidas de carga de la instalación.",
  });
  await upsertTextInfoVariable("equipamiento-skimmers-criterio", "Skimmers", {
    type: "LOOKUP",
    questionKey: "que-forma-tendra-tu-piscina",
    table: {},
    default:
      "Definir según diseño hidráulico. La cantidad y ubicación dependen de la superficie, geometría, circulación y condiciones de la piscina.",
  });
  await upsertTextInfoVariable("equipamiento-retornos-criterio", "Retornos", {
    type: "LOOKUP",
    questionKey: "que-forma-tendra-tu-piscina",
    table: {},
    default: "Definir según diseño hidráulico. La cantidad y ubicación deben definirse según el sistema de circulación.",
  });

  // ---------- FORMULAS ----------
  // Orders 130+ -- despues de C1(40)/C2(72)/C3(96)/C4(115)/C4.2(123).
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

  // Caudal de recirculación = volumen de agua (YA existente, C4.2,
  // "agua-volumen-m3" via {ref:}, NUNCA recalculado en paralelo -- sección
  // 3 del pedido) ÷ horas consideradas. Sin ceil/floor -- presentación
  // normal (sección 5: "no aplicar ceil arbitrario").
  await upsertFormula({
    key: "equipamiento-caudal-recirculacion-m3h",
    label: "Caudal de recirculación estimado",
    unit: "m³/h",
    isResult: true,
    order: 130,
    expression: { op: "/", args: [{ ref: "agua-volumen-m3" }, { var: "equipamiento-horas-recirculacion" }] },
    note: "Es el caudal aproximado que la bomba y el filtro deben mover para recircular el volumen de agua en el tiempo considerado.",
  });
  // Filtro -- mismo valor que el caudal objetivo (no es un cálculo nuevo,
  // es el mismo dato mostrado bajo el criterio de selección del filtro,
  // ver sección 8/17 del pedido: el mock pide mostrar el número DENTRO de
  // la tarjeta de Filtro, no solo arriba).
  await upsertFormula({
    key: "equipamiento-filtro-caudal-minimo-m3h",
    label: "Filtro — caudal nominal mínimo",
    unit: "m³/h",
    isResult: true,
    order: 131,
    expression: { ref: "equipamiento-caudal-recirculacion-m3h" },
    note: "Selecciona un filtro cuyo caudal nominal admisible sea igual o superior al caudal objetivo.",
  });

  console.log(`Fase C5 (equipamiento) lista para Module "piscina-integral". id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
