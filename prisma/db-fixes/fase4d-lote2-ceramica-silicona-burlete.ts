import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 4D — Lote 2 (09-ago-2026): Cerámica para baño, Cambiar silicona,
// Cambiar burlete. Fuente de verdad: docs/FASE4B_ESPECIFICACION_TECNICA_P1.md.
// Reutiliza literalmente los LossFactor/Norm ya citados en ceramica-pisos
// (perdida-por-corte, cobertura Bekron, fragüe Bekron) — no se inventa
// ningún valor nuevo para cerámica. Categorías: "Cerámica para baño" no
// tiene categoría específica de baño con motor cerámico, se usa "ceramica"
// (mismo motor). "Cambiar silicona" se ubica en "bano" (ya relacionado con
// instalar-una-ducha, que calcula silicona). "Cambiar burlete" no calza
// limpio en ninguna categoría existente (es mantenimiento de puertas/
// ventanas, no hay categoría de material para eso) — se deja en "exterior"
// como el ajuste menos malo, marcado explícitamente en el informe para tu
// confirmación, en vez de crear una categoría nueva sin autorización.

async function main() {
  await createCeramicaBano();
  await createCambiarSilicona();
  await createCambiarBurlete();
  await fixVarPlaceholderNotes();
  await fixDescuentoVanosOpcional();
  console.log("\n=== FASE 4D Lote 2 completado ===");
}

// ---------------------------------------------------------------------------
// Corrige otro bug propio: "descuento-vanos-m2" se diseñó como NUMBER
// opcional con "escribe 0 si no aplica", pero la validación global de
// pasos NUMBER exige > 0 (question-step.tsx / conditional-reveal-step.tsx)
// — 0 nunca era un valor aceptable, bloqueaba el flujo. Se registra la
// pregunta como opcional (module-visual-config.ts, botón "Omitir") y se
// agrega la condición "defined" para que la fórmula no intente evaluar
// una variable sin resolver cuando el usuario omite el paso.
// ---------------------------------------------------------------------------
async function fixDescuentoVanosOpcional() {
  console.log("\n--- Corrigiendo descuento-vanos-m2 (0 no era válido, ahora es opcional/omitible) ---");
  const q = await prisma.question.findFirst({ where: { module: { slug: "ceramica-para-bano" }, key: "descuento-vanos-m2" } });
  if (q && q.helpText !== 'Si no hay vanos que descontar, presiona "Omitir" para saltar este paso.') {
    await prisma.question.update({
      where: { id: q.id },
      data: { helpText: 'Si no hay vanos que descontar, presiona "Omitir" para saltar este paso.' },
    });
    console.log("  OK helpText corregido");
  } else {
    console.log("  SKIP (helpText ya corregido o pregunta no encontrada)");
  }

  const f = await prisma.formula.findFirst({ where: { module: { slug: "ceramica-para-bano" }, key: "superficie-descontada" } });
  const newCondition = {
    op: "and",
    args: [{ op: "!=", args: [{ var: "zonas-a-revestir" }, { str: "piso" }] }, { op: "defined", key: "descuento-vanos-m2" }],
  };
  if (f) {
    await prisma.formula.update({ where: { id: f.id }, data: { condition: newCondition } });
    console.log("  OK condición de superficie-descontada actualizada (agrega chequeo 'defined')");
  } else {
    console.log("  SKIP (fórmula superficie-descontada no encontrada)");
  }
}

// ---------------------------------------------------------------------------
// Corrige un bug propio: las notas de "cartuchos" y "rollos" usaban
// {var:X} (sintaxis inválida del motor de interpolación — solo {X} bare o
// {ref:X} funcionan, ver interpolateTemplate en src/lib/formula-engine) —
// quedaba el placeholder literal sin resolver en el resultado. Idempotente,
// separado de las funciones de creación (que ya no vuelven a correr una
// vez que el módulo existe).
// ---------------------------------------------------------------------------
async function fixVarPlaceholderNotes() {
  console.log("\n--- Corrigiendo notas con placeholder {var:X} inválido ---");
  const fCartuchos = await prisma.formula.findFirst({ where: { module: { slug: "cambiar-silicona" }, key: "cartuchos" } });
  if (fCartuchos && fCartuchos.note?.includes("{var:largo-a-sellar}")) {
    await prisma.formula.update({
      where: { id: fCartuchos.id },
      data: { note: "Cartucho de 280 mL — cada uno rinde {ref:rendimiento-m-por-cartucho} m en esta junta → para {largo-a-sellar} m (+15% de desperdicio) necesitas {value} {unit}." },
    });
    console.log("  OK nota de cartuchos corregida");
  } else {
    console.log("  SKIP (cambiar-silicona/cartuchos ya corregida o no encontrada)");
  }

  const fRollos = await prisma.formula.findFirst({ where: { module: { slug: "cambiar-burlete" }, key: "rollos" } });
  if (fRollos && fRollos.note?.includes("{var:largo-rollo-m}")) {
    await prisma.formula.update({
      where: { id: fRollos.id },
      data: { note: "Perímetro total {ref:perimetro-total} m (+10% por empalmes en esquinas) ÷ {largo-rollo-m} m por rollo → {value} {unit}." },
    });
    console.log("  OK nota de rollos corregida");
  } else {
    console.log("  SKIP (cambiar-burlete/rollos ya corregida o no encontrada)");
  }
}

// ---------------------------------------------------------------------------
// 1. Cerámica para baño — reutiliza el motor de ceramica-pisos: mismas
// LossFactor (perdida-por-corte-superficie-simple 8%, ...irregular 15%),
// misma norma OBRA-CERAMICA-COBERTURA-PERDIDA, mismo LOOKUP kg-por-m2-fraguue
// (Bekron), mismo adhesivo 4 m²/saco (Bekron DA). Simplificación deliberada
// respecto de ceramica-pisos: la cobertura por caja se pide siempre como
// NUMBER directo (dato de empaque) en vez de ofrecer un LOOKUP por tamaño +
// rama "no lo sé" — reduce las 6 fórmulas de cajas de ceramica-pisos a 2
// (simple/irregular), sin perder ninguna cifra ya citada.
// ---------------------------------------------------------------------------
async function createCeramicaBano() {
  console.log("\n--- 1. Cerámica para baño ---");
  const existing = await prisma.module.findUnique({ where: { slug: "ceramica-para-bano" } });
  if (existing) {
    console.log("  SKIP (el módulo ya existe)");
    return;
  }

  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "ceramica" } });
  const normCobertura = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-CERAMICA-COBERTURA-PERDIDA" } });
  const normFragüe = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-FRAGÜE-CONSUMO" } });

  const mod = await prisma.module.create({
    data: {
      slug: "ceramica-para-bano",
      name: "Cerámica para baño",
      description: "Cerámica/porcelanato de piso y muros de un baño en una sola pasada, con descuento de puertas/ventanas",
      searchKeywords: "revestimiento de baño, porcelanato baño, azulejo, cerámica muro ducha",
      published: true,
      categoryId: category.id,
    },
  });

  const qZonas = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "zonas-a-revestir",
      label: "¿Vas a revestir piso, muros, o ambos?",
      type: "SELECT",
      order: 1,
    },
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: qZonas.id, key: "piso", label: "Solo piso", order: 0 },
      { questionId: qZonas.id, key: "muros", label: "Solo muros", order: 1 },
      { questionId: qZonas.id, key: "ambos", label: "Piso y muros", order: 2 },
    ],
  });

  await prisma.question.createMany({
    data: [
      {
        moduleId: mod.id,
        key: "piso-largo",
        label: "Largo del piso (metros)",
        type: "NUMBER",
        unit: "m",
        order: 2,
        visibleIfQuestionKey: "zonas-a-revestir",
        visibleIfValues: ["piso", "ambos"],
      },
      {
        moduleId: mod.id,
        key: "piso-ancho",
        label: "Ancho del piso (metros)",
        type: "NUMBER",
        unit: "m",
        order: 3,
        visibleIfQuestionKey: "zonas-a-revestir",
        visibleIfValues: ["piso", "ambos"],
      },
      {
        moduleId: mod.id,
        key: "muros-perimetro",
        label: "Suma el ancho de cada muro que vas a revestir (metros)",
        type: "NUMBER",
        unit: "m",
        order: 4,
        helpText: "Ej. 2 muros de 1,2m cada uno = 2,4m. No es el perímetro completo del baño, solo los muros que realmente vas a cubrir.",
        visibleIfQuestionKey: "zonas-a-revestir",
        visibleIfValues: ["muros", "ambos"],
      },
      {
        moduleId: mod.id,
        key: "muros-altura",
        label: "Altura del revestimiento (metros)",
        type: "NUMBER",
        unit: "m",
        order: 5,
        helpText: "De piso a cielo, o solo hasta la altura que vas a cubrir (ej. 1,8m en la zona de ducha).",
        visibleIfQuestionKey: "zonas-a-revestir",
        visibleIfValues: ["muros", "ambos"],
      },
      {
        moduleId: mod.id,
        key: "descuento-vanos-m2",
        label: "Superficie de puertas/ventanas a descontar (m²)",
        type: "NUMBER",
        unit: "m²",
        order: 6,
        helpText: "Si no hay vanos que descontar, presiona \"Omitir\" para saltar este paso.",
        visibleIfQuestionKey: "zonas-a-revestir",
        visibleIfValues: ["muros", "ambos"],
      },
    ],
  });

  const qTamano = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "tamano-pieza",
      label: "¿Qué tamaño de cerámica/porcelanato vas a usar?",
      type: "SELECT",
      order: 7,
      helpText: "Solo se usa para estimar el fragüe — el tamaño no cambia cuántas cajas necesitas, eso depende de la cobertura de tu producto específico.",
    },
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: qTamano.id, key: "20x20cm", label: "20x20 cm", order: 0 },
      { questionId: qTamano.id, key: "25x25cm", label: "25x25 cm", order: 1 },
      { questionId: qTamano.id, key: "25x60cm", label: "25x60 cm", order: 2 },
      { questionId: qTamano.id, key: "30x30cm", label: "30x30 cm", order: 3 },
      { questionId: qTamano.id, key: "45x45cm", label: "45x45 cm", order: 4 },
      { questionId: qTamano.id, key: "60x60cm", label: "60x60 cm", order: 5 },
      { questionId: qTamano.id, key: "80x80cm", label: "80x80 cm", order: 6 },
      { questionId: qTamano.id, key: "60x120cm", label: "60x120 cm", order: 7 },
      { questionId: qTamano.id, key: "personalizada", label: "Otro tamaño", order: 8 },
    ],
  });

  await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "cobertura-caja-m2",
      label: "¿Cuántos m² trae la caja de tu producto? (dato impreso en el empaque)",
      type: "NUMBER",
      unit: "m²",
      order: 8,
    },
  });

  const qIrregular = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "superficie-irregular",
      label: "¿La superficie tiene muchos cortes (esquinas, desagüe, tuberías)?",
      type: "SELECT",
      order: 9,
      helpText: "Un baño suele tener más cortes que un piso abierto — confirma si tu caso aplica.",
    },
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: qIrregular.id, key: "no-es-simple", label: "No, superficie simple", order: 0 },
      { questionId: qIrregular.id, key: "si-bastante-irregular", label: "Sí, bastante irregular", order: 1 },
    ],
  });

  await prisma.variable.createMany({
    data: [
      { moduleId: mod.id, key: "zonas-a-revestir", label: "Zonas", valueType: "TEXT", source: { type: "QUESTION", questionKey: "zonas-a-revestir" } },
      { moduleId: mod.id, key: "piso-largo", label: "Largo piso", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "piso-largo" } },
      { moduleId: mod.id, key: "piso-ancho", label: "Ancho piso", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "piso-ancho" } },
      { moduleId: mod.id, key: "muros-perimetro", label: "Perímetro muros", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "muros-perimetro" } },
      { moduleId: mod.id, key: "muros-altura", label: "Altura muros", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "muros-altura" } },
      { moduleId: mod.id, key: "descuento-vanos-m2", label: "Descuento vanos", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "descuento-vanos-m2" } },
      { moduleId: mod.id, key: "cobertura-caja-m2", label: "Cobertura por caja", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "cobertura-caja-m2" } },
      { moduleId: mod.id, key: "superficie-irregular", label: "Superficie irregular", valueType: "TEXT", source: { type: "QUESTION", questionKey: "superficie-irregular" } },
      {
        moduleId: mod.id,
        key: "kg-por-m2-fraguue",
        label: "Kg de fragüe por m²",
        valueType: "NUMBER",
        // Mismo LOOKUP ya citado en ceramica-pisos (Bekron Fragüe Standard).
        source: {
          type: "LOOKUP",
          questionKey: "tamano-pieza",
          table: { "20x20cm": 1, "25x25cm": 1, "25x60cm": 0.3, "30x30cm": 0.7, "45x45cm": 0.55, "60x60cm": 0.4, "80x80cm": 0.3, "60x120cm": 0.3, personalizada: 0.5 },
        },
      },
    ],
  });

  await prisma.lossFactor.createMany({
    data: [
      { moduleId: mod.id, key: "perdida-simple-bano", label: "Pérdida por corte (superficie simple)", percentage: 0.08, normId: normCobertura.id },
      { moduleId: mod.id, key: "perdida-irregular-bano", label: "Pérdida por corte (superficie irregular)", percentage: 0.15, normId: normCobertura.id },
    ],
  });

  await prisma.formula.createMany({
    data: [
      {
        moduleId: mod.id,
        key: "area-piso",
        label: "Área de piso",
        unit: "m²",
        expression: { op: "*", args: [{ var: "piso-largo" }, { var: "piso-ancho" }] },
        condition: { op: "!=", args: [{ var: "zonas-a-revestir" }, { str: "muros" }] },
        isResult: false,
        order: 1,
      },
      {
        moduleId: mod.id,
        key: "area-muros-bruta",
        label: "Área de muros",
        unit: "m²",
        expression: { op: "*", args: [{ var: "muros-perimetro" }, { var: "muros-altura" }] },
        condition: { op: "!=", args: [{ var: "zonas-a-revestir" }, { str: "piso" }] },
        isResult: false,
        order: 2,
      },
      {
        moduleId: mod.id,
        key: "superficie-total",
        label: "Superficie total",
        unit: "m²",
        expression: {
          op: "+",
          args: [{ op: "coalesce", args: [{ ref: "area-piso" }, 0] }, { op: "coalesce", args: [{ ref: "area-muros-bruta" }, 0] }],
        },
        isResult: true,
        order: 3,
      },
      {
        moduleId: mod.id,
        key: "superficie-descontada",
        label: "Superficie descontada",
        unit: "m²",
        expression: { var: "descuento-vanos-m2" },
        // "defined" evita "Variable no resuelta" cuando el usuario omite
        // la pregunta (ver descuento-vanos-m2 en OPTIONAL_QUESTION_KEYS,
        // module-visual-config.ts) — sin esto, esta fórmula intentaría
        // evaluar {var:"descuento-vanos-m2"} igual y lanzaría un error.
        condition: {
          op: "and",
          args: [{ op: "!=", args: [{ var: "zonas-a-revestir" }, { str: "piso" }] }, { op: "defined", key: "descuento-vanos-m2" }],
        },
        isResult: true,
        order: 4,
      },
      {
        moduleId: mod.id,
        key: "superficie-final",
        label: "Superficie final a revestir",
        unit: "m²",
        expression: {
          op: "-",
          args: [{ ref: "superficie-total" }, { op: "coalesce", args: [{ ref: "superficie-descontada" }, 0] }],
        },
        isResult: true,
        order: 5,
      },
      {
        moduleId: mod.id,
        key: "cajas-simple",
        label: "Cajas necesarias",
        unit: "caja",
        expression: { op: "ceil", value: { op: "lossFactor", key: "perdida-simple-bano", value: { op: "/", args: [{ ref: "superficie-final" }, { var: "cobertura-caja-m2" }] } } },
        condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "no-es-simple" }] },
        isResult: true,
        note: "Cada caja cubre {cobertura-caja-m2} m² → para {ref:superficie-final} m² + {lossFactor:perdida-simple-bano}% de pérdida necesitas {value} {unit}.",
        order: 6,
        materialLabelTemplate: null,
      },
      {
        moduleId: mod.id,
        key: "cajas-irregular",
        label: "Cajas necesarias",
        unit: "caja",
        expression: { op: "ceil", value: { op: "lossFactor", key: "perdida-irregular-bano", value: { op: "/", args: [{ ref: "superficie-final" }, { var: "cobertura-caja-m2" }] } } },
        condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "si-bastante-irregular" }] },
        isResult: true,
        note: "Cada caja cubre {cobertura-caja-m2} m² → para {ref:superficie-final} m² + {lossFactor:perdida-irregular-bano}% de pérdida necesitas {value} {unit}.",
        order: 7,
      },
      {
        moduleId: mod.id,
        key: "adhesivo-simple",
        label: "Adhesivo",
        unit: "saco",
        expression: { op: "ceil", value: { op: "lossFactor", key: "perdida-simple-bano", value: { op: "/", args: [{ ref: "superficie-final" }, 4] } } },
        condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "no-es-simple" }] },
        isResult: true,
        note: "Cada saco cubre aprox. 4 m² (Bekron DA, bekron.cl) → para {ref:superficie-final} m² + {lossFactor:perdida-simple-bano}% de pérdida necesitas {value} {unit}.",
        order: 8,
      },
      {
        moduleId: mod.id,
        key: "adhesivo-irregular",
        label: "Adhesivo",
        unit: "saco",
        expression: { op: "ceil", value: { op: "lossFactor", key: "perdida-irregular-bano", value: { op: "/", args: [{ ref: "superficie-final" }, 4] } } },
        condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "si-bastante-irregular" }] },
        isResult: true,
        note: "Cada saco cubre aprox. 4 m² (Bekron DA, bekron.cl) → para {ref:superficie-final} m² + {lossFactor:perdida-irregular-bano}% de pérdida necesitas {value} {unit}.",
        order: 9,
      },
      {
        moduleId: mod.id,
        key: "fragüe-simple",
        label: "Fragüe",
        unit: "bolsa",
        expression: {
          op: "ceil",
          value: { op: "/", args: [{ op: "*", args: [{ op: "lossFactor", key: "perdida-simple-bano", value: { ref: "superficie-final" } }, { var: "kg-por-m2-fraguue" }] }, 5] },
        },
        condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "no-es-simple" }] },
        isResult: true,
        note: "Rinde según el tamaño elegido ({kg-por-m2-fraguue} kg/m², Bekron Fragüe Standard) ÷ 5 kg por bolsa → para {ref:superficie-final} m² necesitas {value} {unit}.",
        order: 10,
      },
      {
        moduleId: mod.id,
        key: "fragüe-irregular",
        label: "Fragüe",
        unit: "bolsa",
        expression: {
          op: "ceil",
          value: { op: "/", args: [{ op: "*", args: [{ op: "lossFactor", key: "perdida-irregular-bano", value: { ref: "superficie-final" } }, { var: "kg-por-m2-fraguue" }] }, 5] },
        },
        condition: { op: "==", args: [{ var: "superficie-irregular" }, { str: "si-bastante-irregular" }] },
        isResult: true,
        note: "Rinde según el tamaño elegido ({kg-por-m2-fraguue} kg/m², Bekron Fragüe Standard) ÷ 5 kg por bolsa → para {ref:superficie-final} m² necesitas {value} {unit}.",
        order: 11,
      },
    ],
  });

  await prisma.norm.create({
    data: {
      code: "OBRA-CERAMICA-BANO-FLUJO-COMBINADO",
      title: "Cerámica para baño — flujo combinado piso+muros",
      scope: "ceramica-para-bano",
      verificationStatus: "CITADO",
      reinforcedWarning: false,
      note:
        `Reutiliza íntegramente las fuentes ya citadas en ceramica-pisos: pérdida por corte 8%/15% y cobertura de caja como dato de empaque (norma ${normCobertura.code}); fragüe Bekron Fragüe Standard y adhesivo Bekron DA ~4 m²/saco (norma ${normFragüe.code}). Simplificación respecto de ceramica-pisos: la cobertura por caja se pide siempre como dato directo del empaque, sin tabla de valores típicos por tamaño — evita repetir una constante de mercado no verificada dos veces.`,
    },
  });

  console.log(`  OK módulo ceramica-para-bano creado (id=${mod.id})`);
}

// ---------------------------------------------------------------------------
// 2. Cambiar silicona — calculador + guía. Fórmula puramente volumétrica
// verificada contra Sika Sanisil HDP (mar-2025) y Sikasil Universal HDP
// (may-2019): cartucho de 280 mL = 280.000 mm³, rendimiento_mm =
// 280.000 / (ancho_mm × profundidad_mm). Profundidad se asume en 10mm —
// es el único valor de profundidad verificado en los 3 puntos de la ficha
// (10x10, 15x10, 20x10), no se inventa una tabla de profundidades nuevas.
//
// DISCREPANCIA A REPORTAR (per instrucción de Fase 4D, no resuelta
// inventando un valor): la especificación de FASE4B cita "15×10mm -> 1,8m"
// como punto de ficha, pero la fórmula general (280.000/150) da 1,8667m,
// no 1,8m — una diferencia de ~3,6%. Los otros 2 puntos (10x10 y 20x10)
// SÍ coinciden exactamente con la fórmula. Se implementa la fórmula
// general (no una tabla fija por tamaño) porque la propia especificación
// la declara como la relación validada ("permite una fórmula general en
// vez de un lookup"), y coincide exacta en 2 de los 3 puntos — la
// discrepancia del punto medio se documenta en la Norm, no se oculta.
// ---------------------------------------------------------------------------
async function createCambiarSilicona() {
  console.log("\n--- 2. Cambiar silicona ---");
  const existing = await prisma.module.findUnique({ where: { slug: "cambiar-silicona" } });
  if (existing) {
    console.log("  SKIP (el módulo ya existe)");
    return;
  }

  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "bano" } });

  const mod = await prisma.module.create({
    data: {
      slug: "cambiar-silicona",
      name: "Cambiar silicona",
      description: "Cartuchos de silicona sanitaria necesarios para resellar una junta, según su ancho",
      searchKeywords: "silicona sanitaria, sellar junta, resellar tina, resellar ducha",
      published: true,
      categoryId: category.id,
    },
  });

  await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "largo-a-sellar",
      label: "Largo total a sellar (metros)",
      type: "NUMBER",
      unit: "m",
      order: 1,
      helpText: "Ej. el perímetro de tu tina o ducha — mide directo con huincha.",
    },
  });

  const qAncho = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "ancho-de-la-junta",
      label: "¿Qué ancho tiene la junta a sellar?",
      type: "SELECT",
      order: 2,
      helpText: "El rendimiento de un cartucho depende del ancho de la junta — a mayor ancho, menos largo rinde cada cartucho. Se asume una profundidad de junta de 10mm (la única verificada en ficha).",
    },
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: qAncho.id, key: "10mm", label: "10 mm", numericValue: 10, order: 0 },
      { questionId: qAncho.id, key: "15mm", label: "15 mm", numericValue: 15, order: 1 },
      { questionId: qAncho.id, key: "20mm", label: "20 mm", numericValue: 20, order: 2 },
    ],
  });

  await prisma.variable.createMany({
    data: [
      { moduleId: mod.id, key: "largo-a-sellar", label: "Largo a sellar", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "largo-a-sellar" } },
      {
        moduleId: mod.id,
        key: "ancho-junta-mm",
        label: "Ancho de junta (mm)",
        valueType: "NUMBER",
        source: { type: "LOOKUP", questionKey: "ancho-de-la-junta", table: { "10mm": 10, "15mm": 15, "20mm": 20 } },
      },
    ],
  });

  await prisma.lossFactor.create({
    data: {
      moduleId: mod.id,
      key: "desperdicio-silicona",
      label: "Desperdicio de aplicación",
      percentage: 0.15,
    },
  });

  await prisma.formula.createMany({
    data: [
      {
        moduleId: mod.id,
        key: "rendimiento-m-por-cartucho",
        label: "Rendimiento por cartucho",
        unit: "m",
        // 280.000 mm³ (cartucho 280mL) / (ancho_mm × 10mm de profundidad) / 1000
        expression: {
          op: "/",
          args: [{ op: "/", args: [280000, { op: "*", args: [{ var: "ancho-junta-mm" }, 10] }] }, 1000],
        },
        isResult: false,
        order: 1,
      },
      {
        moduleId: mod.id,
        key: "largo-con-desperdicio",
        label: "Largo con desperdicio",
        unit: "m",
        expression: { op: "lossFactor", key: "desperdicio-silicona", value: { var: "largo-a-sellar" } },
        isResult: false,
        order: 2,
      },
      {
        moduleId: mod.id,
        key: "cartuchos",
        label: "Cartuchos de silicona sanitaria",
        unit: "tubo",
        expression: { op: "ceil", value: { op: "/", args: [{ ref: "largo-con-desperdicio" }, { ref: "rendimiento-m-por-cartucho" }] } },
        isResult: true,
        note: "Cartucho de 280 mL — cada uno rinde {ref:rendimiento-m-por-cartucho} m en esta junta → para {largo-a-sellar} m (+15% de desperdicio) necesitas {value} {unit}.",
        order: 3,
      },
    ],
  });

  await prisma.norm.create({
    data: {
      code: "OBRA-SILICONA-RENDIMIENTO-VOLUMETRICO",
      title: "Silicona sanitaria — rendimiento volumétrico por ancho de junta",
      scope: "cambiar-silicona",
      verificationStatus: "CITADO",
      reinforcedWarning: false,
      note:
        "Sika Sanisil HDP (mar-2025) y Sikasil Universal HDP (may-2019): cartucho de 280 mL, rendimiento puramente volumétrico (280.000 mm³ ÷ área de la junta en mm²). Verificado exacto contra 2 de los 3 puntos de ficha: 10×10mm → 2,8 m ✓, 20×10mm → 1,4 m ✓. El tercer punto (15×10mm) da 1,8667 m por fórmula pero la ficha original citaba 1,8 m — diferencia de ~3,6%, DISCREPANCIA NO RESUELTA, reportada explícitamente en vez de forzar un ajuste. Se usa la fórmula general (no una tabla fija) porque el propio hallazgo de la investigación la valida como relación matemática, no una tabla arbitraria. Profundidad de junta: se asume 10mm — es la única profundidad verificada en los 3 puntos de ficha; si tu junta tiene otra profundidad, el resultado no aplica directamente. Desperdicio: 15% — REQUIERE VALIDACIÓN, estimación del equipo, no viene de la ficha.",
    },
  });

  await prisma.moduleGuide.create({
    data: {
      moduleId: mod.id,
      summary:
        "Resellar una junta con silicona sanitaria es rápido si retiras bien la silicona vieja y trabajas con la superficie completamente seca — la mayoría de los problemas (que se despegue, que le entre hongo) vienen de saltarse esos dos pasos.",
      tools: ["Cutter o rascador de silicona", "Pistola de silicona", "Alcohol isopropílico o similar para limpiar", "Cinta de enmascarar (opcional, para un borde parejo)", "Espátula o el dedo con guante para alisar"],
      estimatedTime: "1-2 horas, la mayor parte retirando la silicona vieja",
      difficulty: "Fácil",
      recommendedPeople: "1",
      tipsBeforeStart: [
        "Retira toda la silicona vieja — aplicar silicona nueva sobre restos de la anterior no pega bien y se despega rápido.",
        "Limpia y seca completamente la superficie antes de aplicar — la humedad es la causa más común de que la silicona nueva no adhiera.",
        "Usa cinta de enmascarar a cada lado de la junta si quieres un borde parejo, y retírala antes de que la silicona empiece a curar.",
      ],
      commonMistakes: [
        "Aplicar sobre superficie húmeda o con restos de jabón/sarro.",
        "No retirar completamente la silicona vieja antes de aplicar la nueva.",
        "Usar la ducha antes de que termine el tiempo de curado indicado en el envase.",
      ],
      safetyRecommendations: [
        "Ventila el espacio mientras aplicas y mientras cura — algunos productos tienen olores fuertes.",
        "Revisa el tiempo de curado en el envase de tu producto específico antes de exponerlo al agua — varía según marca y condiciones ambientales.",
      ],
      bestPractice: "Aplica en una pasada continua a lo largo de toda la junta, sin detenerte a la mitad — empalmar dos aplicaciones deja una marca visible y un punto débil.",
      masterTip: "Moja el dedo o la espátula con agua jabonosa antes de alisar la silicona — se desliza sin pegarse ni arrastrar el cordón.",
      faqs: [
        { question: "¿Cuánto tiempo tengo que esperar antes de usar la ducha?", answer: "Depende del producto — revisa el tiempo de curado en el envase, la mayoría de las siliconas sanitarias piden entre 24 y 48 horas antes del contacto con agua." },
        { question: "¿Puedo aplicar silicona nueva sobre la vieja?", answer: "No es recomendable — la silicona no se adhiere bien sobre silicona, retira toda la anterior antes de aplicar." },
      ],
      stepByStepSummary: [
        "Retira toda la silicona vieja con un cutter o rascador.",
        "Limpia la superficie con alcohol isopropílico o similar y deja secar completamente.",
        "Aplica cinta de enmascarar a cada lado de la junta (opcional).",
        "Aplica la silicona en una pasada continua con la pistola.",
        "Alisa el cordón con espátula o el dedo (con agua jabonosa).",
        "Retira la cinta de enmascarar antes de que empiece a curar.",
        "Respeta el tiempo de curado del envase antes de exponer a agua.",
      ],
    },
  });

  console.log(`  OK módulo cambiar-silicona creado (id=${mod.id})`);
}

// ---------------------------------------------------------------------------
// 3. Cambiar burlete — calculador simple + guía. Fórmula geométrica de
// perímetro. Formatos comerciales de rollo verificados en el Estudio
// Técnico (Sodimac): 5, 6, 10m. Pérdida de 10% por empalmes en esquinas —
// REQUIERE VALIDACIÓN, no viene de ficha de fabricante.
// ---------------------------------------------------------------------------
async function createCambiarBurlete() {
  console.log("\n--- 3. Cambiar burlete ---");
  const existing = await prisma.module.findUnique({ where: { slug: "cambiar-burlete" } });
  if (existing) {
    console.log("  SKIP (el módulo ya existe)");
    return;
  }

  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "exterior" } });

  const mod = await prisma.module.create({
    data: {
      slug: "cambiar-burlete",
      name: "Cambiar burlete",
      description: "Metros de burlete para sellar el perímetro de una puerta o ventana",
      searchKeywords: "burlete puerta, burlete ventana, sellar corriente de aire, weatherstrip",
      published: true,
      categoryId: category.id,
    },
  });

  const qTipo = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "puerta-o-ventana",
      label: "¿Puerta o ventana?",
      type: "SELECT",
      order: 1,
    },
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: qTipo.id, key: "puerta", label: "Puerta", order: 0 },
      { questionId: qTipo.id, key: "ventana", label: "Ventana", order: 1 },
    ],
  });

  await prisma.question.createMany({
    data: [
      { moduleId: mod.id, key: "ancho", label: "Ancho (metros)", type: "NUMBER", unit: "m", order: 2 },
      { moduleId: mod.id, key: "alto", label: "Alto (metros)", type: "NUMBER", unit: "m", order: 3 },
      {
        moduleId: mod.id,
        key: "cantidad",
        label: "¿Cuántas puertas/ventanas iguales?",
        type: "NUMBER",
        order: 4,
        helpText: "Si tienes varias del mismo tamaño, ObraBien suma el perímetro total antes de calcular los rollos — es más preciso que calcular rollo por rollo.",
      },
    ],
  });

  const qRollo = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "largo-de-rollo",
      label: "¿Qué largo de rollo vas a comprar?",
      type: "SELECT",
      order: 5,
    },
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: qRollo.id, key: "5m", label: "5 m", numericValue: 5, order: 0 },
      { questionId: qRollo.id, key: "6m", label: "6 m", numericValue: 6, order: 1 },
      { questionId: qRollo.id, key: "10m", label: "10 m", numericValue: 10, order: 2 },
    ],
  });

  await prisma.variable.createMany({
    data: [
      { moduleId: mod.id, key: "ancho", label: "Ancho", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "ancho" } },
      { moduleId: mod.id, key: "alto", label: "Alto", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "alto" } },
      { moduleId: mod.id, key: "cantidad", label: "Cantidad", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "cantidad" } },
      {
        moduleId: mod.id,
        key: "largo-rollo-m",
        label: "Largo de rollo (m)",
        valueType: "NUMBER",
        source: { type: "LOOKUP", questionKey: "largo-de-rollo", table: { "5m": 5, "6m": 6, "10m": 10 } },
      },
    ],
  });

  await prisma.lossFactor.create({
    data: { moduleId: mod.id, key: "perdida-burlete-empalmes", label: "Pérdida por empalmes en esquinas", percentage: 0.1 },
  });

  await prisma.formula.createMany({
    data: [
      {
        moduleId: mod.id,
        key: "perimetro-total",
        label: "Perímetro total",
        unit: "m",
        expression: { op: "*", args: [{ var: "cantidad" }, 2, { op: "+", args: [{ var: "ancho" }, { var: "alto" }] }] },
        isResult: false,
        order: 1,
      },
      {
        moduleId: mod.id,
        key: "perimetro-con-perdida",
        label: "Perímetro con pérdida",
        unit: "m",
        expression: { op: "lossFactor", key: "perdida-burlete-empalmes", value: { ref: "perimetro-total" } },
        isResult: false,
        order: 2,
      },
      {
        moduleId: mod.id,
        key: "rollos",
        label: "Rollos de burlete",
        unit: "rollo",
        expression: { op: "ceil", value: { op: "/", args: [{ ref: "perimetro-con-perdida" }, { var: "largo-rollo-m" }] } },
        isResult: true,
        note: "Perímetro total {ref:perimetro-total} m (+10% por empalmes en esquinas) ÷ {largo-rollo-m} m por rollo → {value} {unit}.",
        order: 3,
      },
    ],
  });

  await prisma.norm.create({
    data: {
      code: "OBRA-BURLETE-FORMATOS-COMERCIALES",
      title: "Burlete — formatos comerciales y pérdida por empalmes",
      scope: "cambiar-burlete",
      verificationStatus: "CITADO",
      reinforcedWarning: false,
      note:
        "Formatos de rollo verificados en Sodimac (Estudio Técnico ObraBien, ago-2026): 5, 6 y 10 metros. El \"burlete bajo puerta\" (barredera/cepillo) es un producto DISTINTO, no incluido en este módulo — no confundir. Pérdida por empalmes en esquinas: 10% — REQUIERE VALIDACIÓN, no verificado contra ficha de fabricante específica.",
    },
  });

  await prisma.moduleGuide.create({
    data: {
      moduleId: mod.id,
      summary: "Cambiar el burlete de una puerta o ventana es rápido y no requiere herramientas especiales — el resultado depende sobre todo de limpiar bien el marco antes de pegar el nuevo.",
      tools: ["Tijeras o cutter", "Alcohol isopropílico o similar para limpiar el marco", "Rascador o espátula para retirar el burlete viejo"],
      estimatedTime: "20-40 minutos por puerta o ventana",
      difficulty: "Fácil",
      recommendedPeople: "1",
      tipsBeforeStart: [
        "Retira todo el burlete viejo y los restos de adhesivo antes de instalar el nuevo — pegar sobre residuos hace que se despegue rápido.",
        "Limpia y seca bien el marco antes de aplicar el burlete autoadhesivo.",
        "Corta el burlete un poco más largo de lo calculado y ajusta en las esquinas — es más fácil recortar el sobrante que estirarlo si queda corto.",
      ],
      commonMistakes: [
        "Aplicar sobre el marco sucio o con restos de burlete/adhesivo viejo.",
        "Estirar el burlete al aplicarlo — pierde grosor y sella peor.",
        "No presionar firme los primeros minutos después de aplicar — el adhesivo no fija bien.",
      ],
      safetyRecommendations: ["Ninguna especial — es un trabajo de baja complejidad y sin riesgo relevante."],
      bestPractice: "Aplica el burlete con la puerta o ventana cerrada, marcando dónde topa realmente — así el sello queda ajustado, ni suelto ni tan apretado que cueste cerrar.",
      masterTip: "Calienta un poco el burlete con secador de pelo antes de aplicarlo en días fríos — el adhesivo pega mejor tibio que frío.",
      faqs: [
        { question: "¿El burlete de puerta sirve para ventanas?", answer: "Depende del tipo — este cálculo es para burlete de sellado perimetral en general; confirma en la ficha del producto si es apto para el tipo de marco (madera, aluminio, PVC) de tu puerta o ventana." },
      ],
      stepByStepSummary: [
        "Retira el burlete viejo y limpia los restos de adhesivo.",
        "Limpia y seca el marco.",
        "Mide y corta el burlete nuevo según el perímetro.",
        "Aplica con la puerta/ventana cerrada, ajustando en las esquinas.",
        "Presiona firme durante unos minutos para fijar el adhesivo.",
      ],
    },
  });

  console.log(`  OK módulo cambiar-burlete creado (id=${mod.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
