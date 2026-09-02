import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../src/generated/prisma/client";

// FASE C3 -- Configurador integral de Piscina ("piscina-integral"):
// cuarto bloque, EXCAVACION AUTOMATICA.
//
// Extiende el Module ya creado por fase-c1-piscina-integral.ts (NO lo
// recrea, NO toca su `published`). Sigue el mismo patron idempotente
// (upsert por key) que el resto del db-fix de este Module.
//
// Alcance C3: el usuario NO vuelve a ingresar largo/ancho/diametro/
// profundidad del hoyo -- se derivan de datos ya conocidos (dimensiones
// exteriores del vaso, ya calculadas en C1) mas 2 inputs nuevos (espacio
// de trabajo, preparacion bajo losa). Volumen excavado = volumen TOTAL
// del hoyo (NO se resta el vaso -- ver seccion 7 del pedido, es lo que
// interesa para movimiento de tierra). Esponjamiento, tierra suelta y
// viajes en camion (incluyendo "Personalizado", EXCLUSIVO de este Module)
// derivan del mismo patron DSL ya usado por Excavacion/Excavacion
// circular standalone (ver inspect-excavacion.ts) -- Formula/Variable
// tienen moduleId obligatorio, asi que se REPLICAN los registros acá
// (mismos valores 25%/35%, misma formula ceil(suelto/capacidad)), sin
// duplicar motor TypeScript ni tocar los Modules standalone.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  // ---------- PREGUNTAS ----------
  // Todas comparten stepGroup "excavation". A diferencia de Interior (Fase
  // C2, condicion compuesta que el schema no puede expresar), acá SOLO
  // "excavacion-capacidad-personalizada-m3" tiene una condicion real (de
  // una sola key: tipo de camion == "personalizado") -- eso SI lo puede
  // expresar visibleIfQuestionKey/visibleIfValues nativo, así que se usa
  // directo (sin active-keys extra): el filtro generico de "Tu proyecto"
  // (isQuestionVisible) ya la oculta sola cuando no corresponde.
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

  const STEP_GROUP = "excavation";

  await upsertQuestion({
    key: "excavacion-espacio-trabajo-cm",
    label: "Espacio de trabajo alrededor",
    type: "NUMBER",
    unit: "cm",
    order: 23,
    stepGroup: STEP_GROUP,
    helpText:
      "Espacio adicional necesario alrededor del vaso para ejecutar los trabajos de construcción. Depende del sistema constructivo y de las condiciones de la obra.",
  });
  await upsertQuestion({
    key: "excavacion-preparacion-losa-cm",
    label: "Preparación bajo losa",
    type: "NUMBER",
    unit: "cm",
    order: 24,
    stepGroup: STEP_GROUP,
    helpText:
      "Agrega aquí cualquier espesor adicional que necesites considerar bajo la losa (base, estabilizado, hormigón de limpieza, mejoramiento, etc.). Si no corresponde, déjalo en 0 cm.",
  });
  await upsertQuestion({
    key: "excavacion-tipo-terreno",
    label: "Tipo de terreno",
    type: "SELECT",
    order: 25,
    stepGroup: STEP_GROUP,
    helpText:
      "El volumen aumenta al excavar porque el terreno deja de estar compactado. El valor real puede variar según el tipo y humedad del suelo.",
    options: [
      { key: "tierra-normal", label: "Tierra normal", order: 0 },
      { key: "con-arcilla-o-piedras", label: "Con arcilla o piedras", order: 1 },
    ],
  });
  await upsertQuestion({
    key: "excavacion-tipo-camion",
    label: "Camión para retirar la tierra",
    type: "SELECT",
    order: 26,
    stepGroup: STEP_GROUP,
    options: [
      { key: "chico", label: "Camión tolva chico (~6 m³)", order: 0 },
      { key: "mediano", label: "Camión tolva mediano (~10 m³)", order: 1 },
      { key: "grande", label: "Camión tolva grande (~15 m³)", order: 2 },
      { key: "personalizado", label: "Personalizado", order: 3 },
    ],
  });
  await upsertQuestion({
    key: "excavacion-capacidad-personalizada-m3",
    label: "Capacidad del camión",
    type: "NUMBER",
    unit: "m³",
    order: 27,
    stepGroup: STEP_GROUP,
    visibleIfQuestionKey: "excavacion-tipo-camion",
    visibleIfValues: ["personalizado"],
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

  await upsertVariable("excavacion-espacio-trabajo-cm", "Espacio de trabajo alrededor", {
    type: "QUESTION",
    questionKey: "excavacion-espacio-trabajo-cm",
  });
  await upsertVariable("excavacion-preparacion-losa-cm", "Preparación bajo losa", {
    type: "QUESTION",
    questionKey: "excavacion-preparacion-losa-cm",
  });
  await upsertTextVariable("excavacion-tipo-terreno", "Tipo de terreno", {
    type: "QUESTION",
    questionKey: "excavacion-tipo-terreno",
  });
  await upsertTextVariable("excavacion-tipo-camion", "Tipo de camión", {
    type: "QUESTION",
    questionKey: "excavacion-tipo-camion",
  });
  await upsertVariable("excavacion-capacidad-personalizada-m3", "Capacidad personalizada del camión", {
    type: "QUESTION",
    questionKey: "excavacion-capacidad-personalizada-m3",
  });
  // Mismos valores 25%/35% que Excavacion/Excavacion circular standalone
  // (ver inspect-excavacion.ts) -- NO se modifican, solo se replican
  // porque Variable.source no se puede compartir entre Modules (FK
  // moduleId obligatoria).
  await upsertVariable("excavacion-esponjamiento", "Esponjamiento", {
    type: "LOOKUP",
    table: { "tierra-normal": 0.25, "con-arcilla-o-piedras": 0.35 },
    questionKey: "excavacion-tipo-terreno",
  });
  // Mismas 3 capacidades que standalone (6/10/15) -- SIN "default": las 2
  // formulas de mas abajo (capacidad-camion-estandar/-personalizada) ya
  // se encargan de que esta LOOKUP solo se lea cuando tipo-camion es
  // chico/mediano/grande (nunca "personalizado", que no esta en la
  // tabla).
  await upsertVariable("excavacion-capacidad-camion-m3-lookup", "Capacidad camión (estándar)", {
    type: "LOOKUP",
    table: { chico: 6, mediano: 10, grande: 15 },
    questionKey: "excavacion-tipo-camion",
  });

  // ---------- FORMULAS ----------
  // Orders 80+ -- despues de C1 (hasta 40) y C2 (hasta 72).
  async function upsertFormula(input: {
    key: string;
    label: string;
    unit: string;
    expression: Prisma.InputJsonValue;
    condition?: Prisma.InputJsonValue;
    isResult: boolean;
    order: number;
    note?: string;
    normId?: string;
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
        normId: input.normId,
      },
      update: {
        label: input.label,
        unit: input.unit,
        expression: input.expression,
        condition,
        isResult: input.isResult,
        order: input.order,
        note: input.note,
        normId: input.normId,
      },
    });
  }

  const eqForma = (v: string) => ({ op: "==", args: [{ var: "forma" }, { str: v }] });
  const eqCamion = (v: string) => ({ op: "==", args: [{ var: "excavacion-tipo-camion" }, { str: v }] });

  // Norm compartido (catalogo global, sin moduleId) YA usado por
  // Excavacion/Excavacion circular standalone -- se REFERENCIA (reutiliza
  // su id), no se crea ni se modifica una fila nueva. Trae el aviso de
  // seguridad de derrumbe/entibacion, relevante también acá.
  const ESPONJAMIENTO_NORM_ID = "cmrscpo1j000044se6ut4g44p";

  // --- Conversion cm -> m ---
  await upsertFormula({
    key: "excavacion-espacio-trabajo-m",
    label: "Espacio de trabajo (m)",
    unit: "m",
    isResult: false,
    order: 80,
    expression: { op: "/", args: [{ var: "excavacion-espacio-trabajo-cm" }, 100] },
  });
  await upsertFormula({
    key: "excavacion-preparacion-losa-m",
    label: "Preparación bajo losa (m)",
    unit: "m",
    isResult: false,
    order: 81,
    expression: { op: "/", args: [{ var: "excavacion-preparacion-losa-cm" }, 100] },
  });

  // --- Hoyo rectangular -- ver seccion 5 del pedido: Lext/Aext ya
  // existen (C1); Prof_hoyo = Prof + espesor_losa + preparacion (usa
  // espesor-fondo-m-rect, Formula de C1, orden 2) ---
  await upsertFormula({
    key: "excavacion-largo-hoyo-rect",
    label: "Largo del hoyo",
    unit: "m",
    isResult: true,
    order: 82,
    condition: eqForma("rectangular"),
    expression: { op: "+", args: [{ ref: "largo-ext" }, { op: "*", args: [2, { ref: "excavacion-espacio-trabajo-m" }] }] },
  });
  await upsertFormula({
    key: "excavacion-ancho-hoyo-rect",
    label: "Ancho del hoyo",
    unit: "m",
    isResult: true,
    order: 83,
    condition: eqForma("rectangular"),
    expression: { op: "+", args: [{ ref: "ancho-ext" }, { op: "*", args: [2, { ref: "excavacion-espacio-trabajo-m" }] }] },
  });
  await upsertFormula({
    key: "excavacion-prof-hoyo-rect",
    label: "Profundidad del hoyo",
    unit: "m",
    isResult: true,
    order: 84,
    condition: eqForma("rectangular"),
    expression: {
      op: "+",
      args: [{ op: "+", args: [{ var: "profundidad-rect" }, { ref: "espesor-fondo-m-rect" }] }, { ref: "excavacion-preparacion-losa-m" }],
    },
  });
  await upsertFormula({
    key: "excavacion-volumen-hoyo-rect",
    label: "Volumen excavado (rect)",
    unit: "m³",
    isResult: false,
    order: 85,
    condition: eqForma("rectangular"),
    // Volumen TOTAL del hoyo -- NO se resta el vaso (ver seccion 7 del
    // pedido: interesa el movimiento de tierra completo).
    expression: {
      op: "*",
      args: [{ op: "*", args: [{ ref: "excavacion-largo-hoyo-rect" }, { ref: "excavacion-ancho-hoyo-rect" }] }, { ref: "excavacion-prof-hoyo-rect" }],
    },
  });

  // --- Hoyo circular -- Dext ya existe (C1, "diametro-ext") ---
  await upsertFormula({
    key: "excavacion-diametro-hoyo-circ",
    label: "Diámetro del hoyo",
    unit: "m",
    isResult: true,
    order: 86,
    condition: eqForma("circular"),
    expression: { op: "+", args: [{ ref: "diametro-ext" }, { op: "*", args: [2, { ref: "excavacion-espacio-trabajo-m" }] }] },
  });
  await upsertFormula({
    key: "excavacion-radio-hoyo-circ",
    label: "Radio del hoyo",
    unit: "m",
    isResult: false,
    order: 87,
    condition: eqForma("circular"),
    expression: { op: "/", args: [{ ref: "excavacion-diametro-hoyo-circ" }, 2] },
  });
  await upsertFormula({
    key: "excavacion-prof-hoyo-circ",
    label: "Profundidad del hoyo",
    unit: "m",
    isResult: true,
    order: 88,
    condition: eqForma("circular"),
    expression: {
      op: "+",
      args: [{ op: "+", args: [{ var: "profundidad-circ" }, { ref: "espesor-fondo-m-circ" }] }, { ref: "excavacion-preparacion-losa-m" }],
    },
  });
  await upsertFormula({
    key: "excavacion-volumen-hoyo-circ",
    label: "Volumen excavado (circ)",
    unit: "m³",
    isResult: false,
    order: 89,
    condition: eqForma("circular"),
    expression: {
      op: "*",
      args: [
        { op: "*", args: [3.14159265358979, { op: "*", args: [{ ref: "excavacion-radio-hoyo-circ" }, { ref: "excavacion-radio-hoyo-circ" }] }] },
        { ref: "excavacion-prof-hoyo-circ" },
      ],
    },
  });

  // --- Puente rect/circ (mismo patron coalesce ya usado en C1/C2) ---
  await upsertFormula({
    key: "excavacion-volumen-excavado",
    label: "Volumen excavado",
    unit: "m³",
    isResult: true,
    order: 90,
    expression: { op: "coalesce", args: [{ ref: "excavacion-volumen-hoyo-rect" }, { ref: "excavacion-volumen-hoyo-circ" }] },
  });

  // --- Esponjamiento / tierra suelta -- deriva de
  // excavacion/factor-de-esponjamiento + volumen-esponjado (rect) y
  // excavacion-circular/factor_esponjamiento + volumen_suelto (circ),
  // mismos valores 25%/35%, mismo Norm compartido ---
  await upsertFormula({
    key: "excavacion-factor-esponjamiento",
    label: "Factor de esponjamiento",
    unit: "factor",
    isResult: false,
    order: 91,
    normId: ESPONJAMIENTO_NORM_ID,
    expression: { op: "+", args: [1, { var: "excavacion-esponjamiento" }] },
  });
  await upsertFormula({
    key: "excavacion-volumen-suelto",
    label: "Tierra suelta estimada",
    unit: "m³",
    isResult: true,
    order: 92,
    normId: ESPONJAMIENTO_NORM_ID,
    expression: { op: "*", args: [{ ref: "excavacion-volumen-excavado" }, { ref: "excavacion-factor-esponjamiento" }] },
  });

  // --- Capacidad de camión -- "Personalizado" es EXCLUSIVO de este
  // Module (standalone solo tiene chico/mediano/grande, sin tocarlo) ---
  await upsertFormula({
    key: "excavacion-capacidad-camion-estandar",
    label: "Capacidad camión (estándar)",
    unit: "m³",
    isResult: false,
    order: 93,
    condition: { op: "not", value: eqCamion("personalizado") },
    expression: { var: "excavacion-capacidad-camion-m3-lookup" },
  });
  await upsertFormula({
    key: "excavacion-capacidad-camion-personalizada",
    label: "Capacidad camión (personalizada)",
    unit: "m³",
    isResult: false,
    order: 94,
    condition: eqCamion("personalizado"),
    expression: { var: "excavacion-capacidad-personalizada-m3" },
  });
  await upsertFormula({
    key: "excavacion-capacidad-camion",
    label: "Capacidad del camión",
    unit: "m³",
    isResult: true,
    order: 95,
    expression: { op: "coalesce", args: [{ ref: "excavacion-capacidad-camion-estandar" }, { ref: "excavacion-capacidad-camion-personalizada" }] },
  });

  // --- Viajes -- mismo patron ceil(suelto/capacidad) que
  // excavacion/retiro-en-camion y excavacion-circular/retiro-en-camion ---
  await upsertFormula({
    key: "excavacion-viajes",
    label: "Viajes estimados",
    unit: "viaje",
    isResult: true,
    order: 96,
    normId: ESPONJAMIENTO_NORM_ID,
    note: "Se calcula dividiendo el volumen de tierra suelta por la capacidad del camión y redondeando hacia arriba.",
    expression: { op: "ceil", value: { op: "/", args: [{ ref: "excavacion-volumen-suelto" }, { ref: "excavacion-capacidad-camion" }] } },
  });

  console.log(`Fase C3 (excavación) lista para Module "piscina-integral". id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
