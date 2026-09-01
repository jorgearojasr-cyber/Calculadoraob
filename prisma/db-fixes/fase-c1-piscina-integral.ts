import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../src/generated/prisma/client";

// FASE C1 -- Configurador integral de Piscina ("piscina-integral").
//
// Crea un Module NUEVO, paralelo a los standalone existentes
// (piscina-rectangular-hormigon-armado / piscina-circular-hormigon-armado),
// SIN tocarlos. Alcance C1 exclusivamente: forma + Medidas + Estructura +
// geometria exterior + hormigon (fondo/losa, muros, total). Sin
// Excavacion/Interior/Entorno/Equipamiento/Precios -- eso queda para fases
// posteriores (C2+).
//
// DECISION DE ARQUITECTURA (aprobada, seccion 5 del pedido): para este
// Module la losa/fondo SI se extiende bajo los muros (Lext x Aext x
// espesor, PI x rExt^2 x espesor) -- un supuesto de estimacion DISTINTO al
// de los modulos standalone (que siguen usando L x A / PI x r^2 sin
// extender, sin cambios). Es un supuesto deliberado, documentado aca y en
// el helpText de Estructura, no un "arreglo" del calculo standalone.
//
// Todas las formulas de hormigon/geometria son DERIVADAS de precedentes ya
// existentes y verificados en produccion:
//   - volumen-muros (anillo corregido): mismo patron exacto que
//     piscina-rectangular-hormigon-armado/piscina-circular-hormigon-armado
//     (ver Fase A, prisma/db-fixes/fase-a-piscinas-correcciones.ts) -- la
//     unica diferencia real es que aca el fondo/losa TAMBIEN usa Lext*Aext
//     en vez de L*A (ver arriba).
//   - LossFactor "perdida_hormigon" 7%: mismo key/valor que Radier y los
//     modulos standalone de Piscina (fila NUEVA, propia de este Module --
//     el schema no permite compartir una fila de LossFactor entre Modules
//     por FK, asi que se replica el DATO, no la logica del motor DSL).
//   - Sintaxis de PI como literal (3.14159265358979) y cuadrado via
//     multiplicacion repetida: exactamente el mismo patron ya usado en
//     piscina-circular-hormigon-armado (no existe op "pow" en el DSL).
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const piscinasCategory = await prisma.category.findUniqueOrThrow({ where: { slug: "piscinas" } });

  const espesorHelpText =
    "Valor referencial para estimación. El espesor definitivo depende del diseño estructural, dimensiones de la piscina, suelo y condiciones del proyecto.";

  const mod = await prisma.module.upsert({
    where: { slug: "piscina-integral" },
    create: {
      slug: "piscina-integral",
      name: "Piscina — Configurador integral (beta)",
      description:
        "Configura una vez las medidas y la estructura de tu piscina y ObraBien calcula el hormigón del vaso. Versión inicial (C1): geometría y estructura únicamente — excavación, terminación interior, entorno y precios se agregan en fases siguientes.",
      categoryId: piscinasCategory.id,
      // Fase C1.1 (2026-09-01) -- CORREGIDO: la Fase C1 original dejaba
      // esto en `published: true` para poder probar el wizard end-to-end
      // por URL directa durante el desarrollo. Eso tuvo una consecuencia
      // real no anticipada: como la BD de desarrollo y produccion es la
      // MISMA (Neon compartido), el Module quedo brevemente visible en
      // produccion real (categorias/[slug]/page.tsx y
      // categorias/[slug]/[moduleSlug]/page.tsx solo filtran por
      // `published`, no por si el codigo del wizard ya esta desplegado).
      // Se corrigio en caliente con un script aparte
      // (fase-c1-1-despublicar-piscina-integral.ts) y ahora se corrige acá
      // en el origen: mientras el Module este incompleto (falta
      // Excavacion/Interior/Entorno/Equipamiento/Precios, ver alcance C1),
      // debe nacer y permanecer `published: false` -- tanto en `create`
      // como reforzado en `update`, para que volver a correr este script
      // sobre una fila ya existente (por error, o en otro entorno) nunca
      // la reflote a `true` por accidente.
      published: false,
    },
    update: {
      published: false,
    },
  });

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

  await upsertQuestion({
    key: "que-forma-tendra-tu-piscina",
    label: "¿Qué forma tendrá tu piscina?",
    type: "SELECT",
    order: 0,
    options: [
      { key: "rectangular", label: "Rectangular", order: 0 },
      { key: "circular", label: "Circular", order: 1 },
    ],
  });

  // MEDIDAS -- rectangular (visible solo si forma=rectangular)
  await upsertQuestion({
    key: "largo-interior-metros",
    label: "Largo interior",
    type: "NUMBER",
    unit: "m",
    helpText: "Medida interior terminada, de borde a borde.",
    order: 1,
    stepGroup: "medidas-rect",
    visibleIfQuestionKey: "que-forma-tendra-tu-piscina",
    visibleIfValues: ["rectangular"],
  });
  await upsertQuestion({
    key: "ancho-interior-metros",
    label: "Ancho interior",
    type: "NUMBER",
    unit: "m",
    helpText: "Medida interior terminada, de borde a borde.",
    order: 2,
    stepGroup: "medidas-rect",
    visibleIfQuestionKey: "que-forma-tendra-tu-piscina",
    visibleIfValues: ["rectangular"],
  });
  await upsertQuestion({
    key: "profundidad-interior-metros",
    label: "Profundidad interior",
    type: "NUMBER",
    unit: "m",
    helpText: "Profundidad uniforme, del fondo al borde.",
    order: 3,
    stepGroup: "medidas-rect",
    visibleIfQuestionKey: "que-forma-tendra-tu-piscina",
    visibleIfValues: ["rectangular"],
  });

  // MEDIDAS -- circular (visible solo si forma=circular)
  await upsertQuestion({
    key: "diametro-interior-metros",
    label: "Diámetro interior",
    type: "NUMBER",
    unit: "m",
    helpText: "Medida interior terminada, de borde a borde.",
    order: 4,
    stepGroup: "medidas-circ",
    visibleIfQuestionKey: "que-forma-tendra-tu-piscina",
    visibleIfValues: ["circular"],
  });
  await upsertQuestion({
    key: "profundidad-interior-metros-circular",
    label: "Profundidad interior",
    type: "NUMBER",
    unit: "m",
    helpText: "Profundidad uniforme, del fondo al borde.",
    order: 5,
    stepGroup: "medidas-circ",
    visibleIfQuestionKey: "que-forma-tendra-tu-piscina",
    visibleIfValues: ["circular"],
  });

  // ESTRUCTURA -- rectangular / circular (mismo patron visibleIf que
  // Medidas, evita necesitar un mecanismo nuevo de deteccion de forma en
  // tiempo de ejecucion dentro de VolumeStep: cada rama es su propio
  // stepGroup, ya resuelto por buildSteps()/visibleIf, igual que Medidas).
  await upsertQuestion({
    key: "espesor-de-los-muros-cm",
    label: "Espesor de los muros",
    type: "NUMBER",
    unit: "cm",
    helpText: espesorHelpText,
    order: 6,
    stepGroup: "estructura-rect",
    visibleIfQuestionKey: "que-forma-tendra-tu-piscina",
    visibleIfValues: ["rectangular"],
  });
  await upsertQuestion({
    key: "espesor-del-fondo-losa-cm",
    label: "Espesor del fondo/losa",
    type: "NUMBER",
    unit: "cm",
    helpText: espesorHelpText,
    order: 7,
    stepGroup: "estructura-rect",
    visibleIfQuestionKey: "que-forma-tendra-tu-piscina",
    visibleIfValues: ["rectangular"],
  });
  await upsertQuestion({
    key: "espesor-de-los-muros-cm-circular",
    label: "Espesor de los muros",
    type: "NUMBER",
    unit: "cm",
    helpText: espesorHelpText,
    order: 8,
    stepGroup: "estructura-circ",
    visibleIfQuestionKey: "que-forma-tendra-tu-piscina",
    visibleIfValues: ["circular"],
  });
  await upsertQuestion({
    key: "espesor-del-fondo-losa-cm-circular",
    label: "Espesor del fondo/losa",
    type: "NUMBER",
    unit: "cm",
    helpText: espesorHelpText,
    order: 9,
    stepGroup: "estructura-circ",
    visibleIfQuestionKey: "que-forma-tendra-tu-piscina",
    visibleIfValues: ["circular"],
  });

  // ---------- VARIABLES ----------

  async function upsertVariable(key: string, label: string, source: object, isResult = false) {
    await prisma.variable.upsert({
      where: { moduleId_key: { moduleId: mod.id, key } },
      create: { moduleId: mod.id, key, label, valueType: "NUMBER", source, isResult },
      update: { label, source, isResult },
    });
  }
  async function upsertTextVariable(key: string, label: string, source: object) {
    await prisma.variable.upsert({
      where: { moduleId_key: { moduleId: mod.id, key } },
      create: { moduleId: mod.id, key, label, valueType: "TEXT", source, isResult: false },
      update: { label, source },
    });
  }

  await upsertTextVariable("forma", "Forma de la piscina", {
    type: "QUESTION",
    questionKey: "que-forma-tendra-tu-piscina",
  });
  await upsertVariable("largo", "Largo interior", { type: "QUESTION", questionKey: "largo-interior-metros" });
  await upsertVariable("ancho", "Ancho interior", { type: "QUESTION", questionKey: "ancho-interior-metros" });
  await upsertVariable("profundidad-rect", "Profundidad interior (rectangular)", {
    type: "QUESTION",
    questionKey: "profundidad-interior-metros",
  });
  await upsertVariable("diametro", "Diámetro interior", { type: "QUESTION", questionKey: "diametro-interior-metros" });
  await upsertVariable("profundidad-circ", "Profundidad interior (circular)", {
    type: "QUESTION",
    questionKey: "profundidad-interior-metros-circular",
  });
  await upsertVariable("espesor-muro-cm-rect", "Espesor de los muros (rectangular)", {
    type: "QUESTION",
    questionKey: "espesor-de-los-muros-cm",
  });
  await upsertVariable("espesor-fondo-cm-rect", "Espesor del fondo/losa (rectangular)", {
    type: "QUESTION",
    questionKey: "espesor-del-fondo-losa-cm",
  });
  await upsertVariable("espesor-muro-cm-circ", "Espesor de los muros (circular)", {
    type: "QUESTION",
    questionKey: "espesor-de-los-muros-cm-circular",
  });
  await upsertVariable("espesor-fondo-cm-circ", "Espesor del fondo/losa (circular)", {
    type: "QUESTION",
    questionKey: "espesor-del-fondo-losa-cm-circular",
  });

  // ---------- FORMULAS ----------
  // Todas las formulas de geometria/hormigon estan condicionadas por
  // `forma` (rectangular XOR circular) -- nunca coexisten en un mismo
  // calculo.

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
    const condition: Prisma.InputJsonValue | typeof Prisma.JsonNull =
      input.condition ?? Prisma.JsonNull;
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

  // --- Conversion de espesores a metros (por rama) ---
  await upsertFormula({
    key: "espesor-muro-m-rect",
    label: "Espesor de muro (m)",
    unit: "m",
    isResult: false,
    order: 1,
    condition: eqForma("rectangular"),
    expression: { op: "/", args: [{ var: "espesor-muro-cm-rect" }, 100] },
  });
  await upsertFormula({
    key: "espesor-fondo-m-rect",
    label: "Espesor de fondo (m)",
    unit: "m",
    isResult: false,
    order: 2,
    condition: eqForma("rectangular"),
    expression: { op: "/", args: [{ var: "espesor-fondo-cm-rect" }, 100] },
  });
  await upsertFormula({
    key: "espesor-muro-m-circ",
    label: "Espesor de muro (m)",
    unit: "m",
    isResult: false,
    order: 3,
    condition: eqForma("circular"),
    expression: { op: "/", args: [{ var: "espesor-muro-cm-circ" }, 100] },
  });
  await upsertFormula({
    key: "espesor-fondo-m-circ",
    label: "Espesor de fondo (m)",
    unit: "m",
    isResult: false,
    order: 4,
    condition: eqForma("circular"),
    expression: { op: "/", args: [{ var: "espesor-fondo-cm-circ" }, 100] },
  });

  // --- Geometria exterior ---
  await upsertFormula({
    key: "largo-ext",
    label: "Largo exterior del muro",
    unit: "m",
    isResult: true,
    order: 10,
    condition: eqForma("rectangular"),
    expression: { op: "+", args: [{ var: "largo" }, { op: "*", args: [2, { ref: "espesor-muro-m-rect" }] }] },
  });
  await upsertFormula({
    key: "ancho-ext",
    label: "Ancho exterior del muro",
    unit: "m",
    isResult: true,
    order: 11,
    condition: eqForma("rectangular"),
    expression: { op: "+", args: [{ var: "ancho" }, { op: "*", args: [2, { ref: "espesor-muro-m-rect" }] }] },
  });
  await upsertFormula({
    key: "radio",
    label: "Radio interior",
    unit: "m",
    isResult: false,
    order: 12,
    condition: eqForma("circular"),
    expression: { op: "/", args: [{ var: "diametro" }, 2] },
  });
  await upsertFormula({
    key: "radio-ext",
    label: "Radio exterior del muro",
    unit: "m",
    isResult: true,
    order: 13,
    condition: eqForma("circular"),
    expression: { op: "+", args: [{ ref: "radio" }, { ref: "espesor-muro-m-circ" }] },
  });
  await upsertFormula({
    key: "diametro-ext",
    label: "Diámetro exterior del muro",
    unit: "m",
    isResult: true,
    order: 14,
    condition: eqForma("circular"),
    expression: { op: "*", args: [{ ref: "radio-ext" }, 2] },
  });

  // --- Hormigon -- RECTANGULAR (losa se extiende bajo los muros: Lext*Aext) ---
  await upsertFormula({
    key: "hormigon-fondo-rect",
    label: "Hormigón fondo/losa",
    unit: "m3",
    isResult: true,
    order: 20,
    condition: eqForma("rectangular"),
    note: "Supuesto de este configurador: la losa se extiende bajo los muros (Lext × Aext × espesor). Los módulos standalone de Piscina no usan este supuesto.",
    expression: {
      op: "*",
      args: [{ op: "*", args: [{ ref: "largo-ext" }, { ref: "ancho-ext" }] }, { ref: "espesor-fondo-m-rect" }],
    },
  });
  await upsertFormula({
    key: "hormigon-muros-rect",
    label: "Hormigón muros",
    unit: "m3",
    isResult: true,
    order: 21,
    condition: eqForma("rectangular"),
    expression: {
      op: "*",
      args: [
        {
          op: "-",
          args: [
            { op: "*", args: [{ ref: "largo-ext" }, { ref: "ancho-ext" }] },
            { op: "*", args: [{ var: "largo" }, { var: "ancho" }] },
          ],
        },
        { var: "profundidad-rect" },
      ],
    },
  });
  await upsertFormula({
    key: "hormigon-bruto-rect",
    label: "Hormigón (bruto, sin pérdida)",
    unit: "m3",
    isResult: false,
    order: 22,
    condition: eqForma("rectangular"),
    expression: { op: "+", args: [{ ref: "hormigon-fondo-rect" }, { ref: "hormigon-muros-rect" }] },
  });

  // --- Hormigon -- CIRCULAR (losa se extiende bajo los muros: PI*rExt^2) ---
  await upsertFormula({
    key: "hormigon-fondo-circ",
    label: "Hormigón fondo/losa",
    unit: "m3",
    isResult: true,
    order: 23,
    condition: eqForma("circular"),
    note: "Supuesto de este configurador: la losa se extiende bajo los muros (π × radio exterior² × espesor). Los módulos standalone de Piscina no usan este supuesto.",
    expression: {
      op: "*",
      args: [
        { op: "*", args: [3.14159265358979, { op: "*", args: [{ ref: "radio-ext" }, { ref: "radio-ext" }] }] },
        { ref: "espesor-fondo-m-circ" },
      ],
    },
  });
  await upsertFormula({
    key: "hormigon-muros-circ",
    label: "Hormigón muros",
    unit: "m3",
    isResult: true,
    order: 24,
    condition: eqForma("circular"),
    expression: {
      op: "*",
      args: [
        {
          op: "*",
          args: [
            3.14159265358979,
            {
              op: "-",
              args: [
                { op: "*", args: [{ ref: "radio-ext" }, { ref: "radio-ext" }] },
                { op: "*", args: [{ ref: "radio" }, { ref: "radio" }] },
              ],
            },
          ],
        },
        { var: "profundidad-circ" },
      ],
    },
  });
  await upsertFormula({
    key: "hormigon-bruto-circ",
    label: "Hormigón (bruto, sin pérdida)",
    unit: "m3",
    isResult: false,
    order: 25,
    condition: eqForma("circular"),
    expression: { op: "+", args: [{ ref: "hormigon-fondo-circ" }, { ref: "hormigon-muros-circ" }] },
  });

  // --- Total con perdida -- cada rama referencia directo su propio
  // "hormigon-bruto-*" (nunca coexisten, gatilladas por `forma`). Fase C1.1
  // (2026-09-01): estas 2 dejan de ser isResult (pasan a ser intermedias)
  // porque ResultScreen (ajeno, HEAD limpio) solo acepta un `heroResultKey`
  // string único, no un array -- "hormigon-total" (más abajo) las unifica
  // en una sola key estable vía `coalesce`, sin tocar result-screen.tsx. ---
  await upsertFormula({
    key: "hormigon-total-rect",
    label: "Hormigón total",
    unit: "m3",
    isResult: false,
    order: 26,
    condition: eqForma("rectangular"),
    expression: { op: "lossFactor", key: "perdida_hormigon", value: { ref: "hormigon-bruto-rect" } },
  });
  await upsertFormula({
    key: "hormigon-total-circ",
    label: "Hormigón total",
    unit: "m3",
    isResult: false,
    order: 27,
    condition: eqForma("circular"),
    expression: { op: "lossFactor", key: "perdida_hormigon", value: { ref: "hormigon-bruto-circ" } },
  });
  // Puente estable (Fase C1.1) -- sin condición propia (siempre evalúa),
  // `coalesce` toma el que sí corrió (rect o circ, nunca ambos) sin lanzar
  // error por el que quedó sin evaluar. Esta es la key que
  // module-visual-config.ts usa como `heroResultKey` para "piscina-integral".
  await upsertFormula({
    key: "hormigon-total",
    label: "Hormigón total",
    unit: "m3",
    isResult: true,
    order: 28,
    expression: { op: "coalesce", args: [{ ref: "hormigon-total-rect" }, { ref: "hormigon-total-circ" }] },
  });

  // Refuerzo estructural -- mismo texto/patron ya aprobado en Fase A (Norm +
  // Formula siempre evaluada, banner reutilizando NormsDisclaimer, sin
  // capas/kg/malla). Se crea un Norm PROPIO (Norm es catalogo global, sin
  // moduleId) para no acoplar el ciclo de vida de este Module en
  // desarrollo al de los modulos standalone ya en produccion.
  const refuerzoNorm = await prisma.norm.upsert({
    where: { code: "OBRA-PISCINA-INTEGRAL-REFUERZO" },
    create: {
      code: "OBRA-PISCINA-INTEGRAL-REFUERZO",
      title: "Refuerzo estructural — piscina (configurador integral)",
      scope: "Aviso de que esta estimación no incluye diseño de armadura.",
      verificationStatus: "PRACTICA_GENERAL_NO_VERIFICADA",
      reinforcedWarning: false,
      note: "No incluido en esta estimación básica. El diámetro, espaciamiento y distribución del acero deben definirse mediante diseño estructural.",
    },
    update: {},
  });
  await upsertFormula({
    key: "refuerzo-estructural-aviso",
    label: "Refuerzo estructural",
    unit: "",
    isResult: false,
    order: 40,
    expression: 1,
  });
  await prisma.formula.update({
    where: { moduleId_key: { moduleId: mod.id, key: "refuerzo-estructural-aviso" } },
    data: { normId: refuerzoNorm.id },
  });

  // ---------- LOSS FACTOR ----------
  await prisma.lossFactor.upsert({
    where: { moduleId_key: { moduleId: mod.id, key: "perdida_hormigon" } },
    create: {
      moduleId: mod.id,
      key: "perdida_hormigon",
      label: "Pérdida de hormigón en vaciado",
      percentage: 0.07,
    },
    update: {},
  });

  console.log(`Module "piscina-integral" listo. id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
