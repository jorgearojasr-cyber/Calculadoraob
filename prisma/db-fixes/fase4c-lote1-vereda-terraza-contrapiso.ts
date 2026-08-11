import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 4C — Lote 1 (09-ago-2026): implementa Vereda (módulo nuevo), Terraza
// de hormigón (variante condicional dentro de radier) y Contrapiso/losa
// sobre terreno (reutiliza "Antepiso interior" de radier, solo metadata de
// búsqueda). Fuente de verdad: docs/FASE4B_ESPECIFICACION_TECNICA_P1.md —
// cada valor cita su origen en el código, ninguno inventado.

async function main() {
  await fixContrapisoSearchKeywords();
  await addTerrazaPendienteARadier();
  await createVereda();
  console.log("\n=== FASE 4C Lote 1 completado ===");
}

// ---------------------------------------------------------------------------
// 3. Contrapiso/losa sobre terreno — NO se crea Module nuevo (per Fase 4B:
// "Antepiso interior" de radier ya cumple la definición). Solo se agregan
// palabras de búsqueda.
// ---------------------------------------------------------------------------
async function fixContrapisoSearchKeywords() {
  console.log("\n--- 3. Contrapiso/losa — searchKeywords de radier (sin Module nuevo) ---");
  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "radier" } });
  const existing = (mod.searchKeywords ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const toAdd = ["losa", "contrapiso", "losa de contrapiso", "piso de hormigón interior"];
  const merged = Array.from(new Set([...existing, ...toAdd]));
  const alreadyHasAll = toAdd.every((k) => existing.includes(k));
  if (alreadyHasAll) {
    console.log("  SKIP (ya incluye los términos)");
  } else {
    await prisma.module.update({ where: { id: mod.id }, data: { searchKeywords: merged.join(", ") } });
    console.log(`  OK searchKeywords actualizado: "${merged.join(", ")}"`);
  }
}

// ---------------------------------------------------------------------------
// 2. Terraza de hormigón — variante condicional dentro de radier (no un
// módulo nuevo). Agrega interior/exterior + % de pendiente; cuando es
// exterior, suma un volumen extra de cuña (rampa lineal, altura promedio
// = pendiente×largo/2) antes de aplicar la pérdida de vaciado ya existente.
// Fórmula y ejemplo verificados contra docs/FASE4B (terraza 4x3m, e=8cm,
// 1,5% pendiente -> +37% de volumen).
// ---------------------------------------------------------------------------
async function addTerrazaPendienteARadier() {
  console.log("\n--- 2. Terraza de hormigón — pendiente condicional en radier ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "radier" },
    include: { questions: true, formulas: true },
  });

  // Reordenar preguntas existentes para insertar interior/exterior después
  // de "uso" y % de pendiente después de "espesor_cm".
  const order = {
    uso: 1,
    "es-interior-o-exterior": 2,
    largo: 3,
    ancho: 4,
    espesor_cm: 5,
    "porcentaje-de-pendiente": 6,
    metodo_hormigon: 7,
    colocacion: 8,
  };
  for (const [key, ord] of Object.entries(order)) {
    const q = mod.questions.find((x) => x.key === key);
    if (q) await prisma.question.update({ where: { id: q.id }, data: { order: ord } });
  }

  const existingInteriorExterior = mod.questions.find((q) => q.key === "es-interior-o-exterior");
  if (!existingInteriorExterior) {
    const q = await prisma.question.create({
      data: {
        moduleId: mod.id,
        key: "es-interior-o-exterior",
        label: "¿Es interior o exterior?",
        type: "SELECT",
        order: order["es-interior-o-exterior"],
        helpText:
          "Si es exterior y necesita escurrimiento de agua (ej. una terraza), te preguntamos por la pendiente en el siguiente paso — afecta el volumen real de hormigón.",
      },
    });
    await prisma.questionOption.createMany({
      data: [
        { questionId: q.id, key: "interior", label: "Interior", order: 0 },
        { questionId: q.id, key: "exterior", label: "Exterior (ej. terraza)", order: 1 },
      ],
    });
    console.log("  OK creada pregunta es-interior-o-exterior");
  } else {
    console.log("  SKIP (ya existe): es-interior-o-exterior");
  }

  const existingVars = await prisma.variable.findMany({ where: { moduleId: mod.id } });
  if (!existingVars.find((v) => v.key === "es-interior-o-exterior")) {
    await prisma.variable.create({
      data: {
        moduleId: mod.id,
        key: "es-interior-o-exterior",
        label: "Interior o exterior",
        valueType: "TEXT",
        source: { type: "QUESTION", questionKey: "es-interior-o-exterior" },
      },
    });
    console.log("  OK creada variable es-interior-o-exterior");
  }
  if (!existingVars.find((v) => v.key === "porcentaje-de-pendiente")) {
    await prisma.variable.create({
      data: {
        moduleId: mod.id,
        key: "porcentaje-de-pendiente",
        label: "Porcentaje de pendiente",
        valueType: "NUMBER",
        source: { type: "QUESTION", questionKey: "porcentaje-de-pendiente" },
      },
    });
    console.log("  OK creada variable porcentaje-de-pendiente");
  }

  const existingPendiente = mod.questions.find((q) => q.key === "porcentaje-de-pendiente");
  if (!existingPendiente) {
    await prisma.question.create({
      data: {
        moduleId: mod.id,
        key: "porcentaje-de-pendiente",
        label: "¿Qué pendiente de escurrimiento tendrá?",
        type: "NUMBER",
        unit: "%",
        order: order["porcentaje-de-pendiente"],
        helpText:
          "Una terraza exterior necesita pendiente para que el agua escurra — la pendiente hace que el hormigón no tenga espesor uniforme, así que aumenta el volumen real más de lo que parece. Te sugerimos 1,5%, típico en terrazas, pero puedes ajustarlo.",
        visibleIfQuestionKey: "es-interior-o-exterior",
        visibleIfValues: ["exterior"],
        defaultSource: { type: "LOOKUP", questionKey: "es-interior-o-exterior", table: { exterior: 1.5 } },
      },
    });
    console.log("  OK creada pregunta porcentaje-de-pendiente (visible solo si exterior, sugerido 1,5%)");
  } else {
    console.log("  SKIP (ya existe): porcentaje-de-pendiente");
  }

  // Fórmulas: volumen_pendiente_extra (solo si exterior) se suma a
  // volumen_bruto ANTES de aplicar la pérdida de vaciado — así que
  // volumen_con_perdida pasa a referenciar volumen_con_pendiente en vez de
  // volumen_bruto directamente.
  const existingExtra = mod.formulas.find((f) => f.key === "volumen_pendiente_extra");
  if (!existingExtra) {
    await prisma.formula.create({
      data: {
        moduleId: mod.id,
        key: "volumen_pendiente_extra",
        label: "Volumen extra por pendiente",
        unit: "m³",
        // largo² × ancho × (pendiente% / 100) / 2 — cuña de altura promedio
        // pendiente×largo/2 sobre el área completa. Verificado contra el
        // ejemplo de FASE4B: largo=4, ancho=3, pendiente=1,5% -> 0,36 m³.
        expression: {
          op: "/",
          args: [
            {
              op: "*",
              args: [
                { var: "largo" },
                { var: "largo" },
                { var: "ancho" },
                { op: "/", args: [{ var: "porcentaje-de-pendiente" }, 100] },
              ],
            },
            2,
          ],
        },
        condition: { op: "==", args: [{ var: "es-interior-o-exterior" }, { str: "exterior" }] },
        isResult: false,
        order: 2,
      },
    });
    console.log("  OK creada fórmula volumen_pendiente_extra (condicional a exterior)");
  } else {
    console.log("  SKIP (ya existe): volumen_pendiente_extra");
  }

  const existingConPendiente = mod.formulas.find((f) => f.key === "volumen_con_pendiente");
  if (!existingConPendiente) {
    await prisma.formula.create({
      data: {
        moduleId: mod.id,
        key: "volumen_con_pendiente",
        label: "Volumen con pendiente",
        unit: "m³",
        // coalesce: si volumen_pendiente_extra no se evaluó (interior, su
        // condición fue falsa), usa 0 — no rompe el cálculo para radieres
        // interiores/patio estándar, que no tienen pendiente de diseño.
        expression: {
          op: "+",
          args: [{ ref: "volumen_bruto" }, { op: "coalesce", args: [{ ref: "volumen_pendiente_extra" }, 0] }],
        },
        isResult: false,
        order: 3,
      },
    });
    console.log("  OK creada fórmula volumen_con_pendiente (volumen_bruto + extra si exterior, si no 0)");
  } else {
    console.log("  SKIP (ya existe): volumen_con_pendiente");
  }

  const fVolumenBruto = mod.formulas.find((f) => f.key === "volumen_bruto")!;
  if (fVolumenBruto.order !== 1) {
    await prisma.formula.update({ where: { id: fVolumenBruto.id }, data: { order: 1 } });
  }

  const fVolumenConPerdida = mod.formulas.find((f) => f.key === "volumen_con_perdida")!;
  await prisma.formula.update({
    where: { id: fVolumenConPerdida.id },
    data: {
      expression: { op: "lossFactor", key: "perdida_hormigon", value: { ref: "volumen_con_pendiente" } },
      order: 4,
    },
  });
  console.log("  OK volumen_con_perdida ahora parte de volumen_con_pendiente (antes: volumen_bruto directo)");

  // Renumerar el resto de fórmulas para dejar espacio a las 2 nuevas.
  const restOrder = {
    volumen_premezclado: 5,
    cemento_manual: 6,
    arena_manual: 7,
    gravilla_manual: 8,
    agua_manual: 9,
    volumen_total: 10,
    carga_betonera_m3: 11,
    numero_cargas_betonera: 12,
    cemento_por_carga: 13,
    arena_por_carga: 14,
    gravilla_por_carga: 15,
    agua_por_carga: 16,
  };
  for (const [key, ord] of Object.entries(restOrder)) {
    const f = mod.formulas.find((x) => x.key === key);
    if (f) await prisma.formula.update({ where: { id: f.id }, data: { order: ord } });
  }
  console.log("  OK fórmulas renumeradas para dejar espacio a las 2 nuevas");
}

// ---------------------------------------------------------------------------
// 1. Vereda — módulo nuevo. Fuente: Polpaico "Dosificaciones" (jul-2020,
// NCh170:2016), fila "Pavimento tránsito vehicular menor" = 15 sacos/m³
// (MINVU exige ≥320 kg/m³, la fila "sin armar" de 10 sacos no alcanza —
// ya resuelto en el Estudio Técnico). Simplificación deliberada respecto
// del origen "premezclado/saco/betonera" de FASE4B: se usa el mismo
// patrón de 2 ramas (premezclado/manual) ya probado en radier/fundación,
// sin una 3ra rama de betonera separada — evita duplicar lógica no usada
// en el spec de vereda (que no menciona desglose por carga de betonera).
// Espesor de losa/base: SIN defaultSource — el spec no entrega una tabla
// de espesores por tipo de obra citada, así que se dejan como NUMBER
// editables sin sugerencia, para no inventar un valor por tipo de obra.
// ---------------------------------------------------------------------------
async function createVereda() {
  console.log("\n--- 1. Vereda — módulo nuevo ---");
  const existing = await prisma.module.findUnique({ where: { slug: "vereda" } });
  if (existing) {
    console.log("  SKIP (el módulo ya existe)");
    return;
  }

  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "hormigon" } });

  const mod = await prisma.module.create({
    data: {
      slug: "vereda",
      name: "Vereda",
      description: "Hormigón, moldaje y soleras para una vereda peatonal o de acceso vehicular",
      searchKeywords: "vereda peatonal, acera, pavimento peatonal, losa de vereda",
      published: true,
      categoryId: category.id,
    },
  });

  const qTipoObra = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "tipo-de-obra",
      label: "¿Qué tipo de vereda vas a construir?",
      type: "SELECT",
      order: 1,
      helpText:
        "El tipo de obra determina si necesitas malla y si aplica exigencia de tránsito vehicular — la dosificación de hormigón (15 sacos/m³) es la misma para los 3 casos porque incluso una vereda peatonal en bien nacional de uso público debe cumplir la exigencia de MINVU.",
    },
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: qTipoObra.id, key: "vereda-normal", label: "Vereda normal (peatonal)", order: 0 },
      { questionId: qTipoObra.id, key: "reforzada", label: "Vereda reforzada", order: 1 },
      { questionId: qTipoObra.id, key: "acceso-vehicular", label: "Acceso vehicular (entrada de auto)", order: 2 },
    ],
  });

  await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "largo",
      label: "Largo de la vereda (metros)",
      type: "NUMBER",
      unit: "m",
      order: 2,
    },
  });

  await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "ancho",
      label: "Ancho de la vereda (metros)",
      type: "NUMBER",
      unit: "m",
      order: 3,
      helpText: "El ancho estándar de una vereda peatonal ronda 1,20 m — ajústalo si el tuyo es distinto.",
      defaultSource: {
        type: "LOOKUP",
        questionKey: "tipo-de-obra",
        table: { "vereda-normal": 1.2, reforzada: 1.2, "acceso-vehicular": 1.2 },
      },
    },
  });

  await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "espesor-losa-cm",
      label: "Espesor de la losa (cm)",
      type: "NUMBER",
      unit: "cm",
      order: 4,
      helpText:
        "Confirma el espesor con la especificación de tu proyecto o municipalidad — MINVU no fija un espesor único para todo Chile, varía según el tipo de obra y la ordenanza local.",
    },
  });

  await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "espesor-base-cm",
      label: "Espesor de la base/emplantillado (cm)",
      type: "NUMBER",
      unit: "cm",
      order: 5,
      helpText: "MINVU exige un emplantillado de al menos 170 kg de cemento por m³ y 10 cm de espesor (§11.7.3).",
    },
  });

  const qMetodo = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "metodo-hormigon",
      label: "¿Cómo vas a obtener el hormigón?",
      type: "SELECT",
      order: 6,
    },
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: qMetodo.id, key: "premezclado", label: "Comprarlo premezclado (camión mixer)", order: 0 },
      { questionId: qMetodo.id, key: "manual", label: "Prepararlo tú mismo en obra", order: 1 },
    ],
  });

  const qSoleras = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "incluye-soleras",
      label: "¿Incluye soleras?",
      type: "SELECT",
      order: 7,
    },
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: qSoleras.id, key: "no", label: "No", order: 0 },
      { questionId: qSoleras.id, key: "tipo-a", label: "Sí, tipo A", order: 1 },
      { questionId: qSoleras.id, key: "tipo-c", label: "Sí, tipo C", order: 2 },
    ],
  });

  await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "soleras-ml",
      label: "¿Cuántos metros lineales de solera necesitas?",
      type: "NUMBER",
      unit: "ml",
      order: 8,
      visibleIfQuestionKey: "incluye-soleras",
      visibleIfValues: ["tipo-a", "tipo-c"],
    },
  });

  const qMalla = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "lleva-malla",
      label: "¿Lleva malla electrosoldada?",
      type: "SELECT",
      order: 9,
      helpText: "Relevante principalmente en acceso vehicular, por el tránsito de auto.",
      visibleIfQuestionKey: "tipo-de-obra",
      visibleIfValues: ["acceso-vehicular"],
    },
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: qMalla.id, key: "si", label: "Sí", order: 0 },
      { questionId: qMalla.id, key: "no", label: "No", order: 1 },
    ],
  });

  // Variables
  await prisma.variable.createMany({
    data: [
      { moduleId: mod.id, key: "largo", label: "Largo", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "largo" } },
      { moduleId: mod.id, key: "ancho", label: "Ancho", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "ancho" } },
      { moduleId: mod.id, key: "espesor-losa-cm", label: "Espesor de losa", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "espesor-losa-cm" } },
      { moduleId: mod.id, key: "espesor-base-cm", label: "Espesor de base", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "espesor-base-cm" } },
      { moduleId: mod.id, key: "metodo-hormigon", label: "Método de obtención", valueType: "TEXT", source: { type: "QUESTION", questionKey: "metodo-hormigon" } },
      { moduleId: mod.id, key: "soleras-ml", label: "Metros lineales de solera", valueType: "NUMBER", source: { type: "QUESTION", questionKey: "soleras-ml" } },
      { moduleId: mod.id, key: "tipo-de-obra", label: "Tipo de obra", valueType: "TEXT", source: { type: "QUESTION", questionKey: "tipo-de-obra" } },
      { moduleId: mod.id, key: "incluye-soleras", label: "Incluye soleras", valueType: "TEXT", source: { type: "QUESTION", questionKey: "incluye-soleras" } },
      { moduleId: mod.id, key: "lleva-malla", label: "Lleva malla", valueType: "TEXT", source: { type: "QUESTION", questionKey: "lleva-malla" } },
    ],
  });

  const fuenteDosificacion =
    "Polpaico, \"Dosificaciones\" (jul-2020, sobre NCh170:2016), fila \"Pavimento tránsito vehicular menor\" = 15 sacos/m³ (375 kg/m³). Se usa esta fila para toda vereda (no la fila \"sin armar\" de 10 sacos, que con 250 kg/m³ no alcanza los ≥320 kg/m³ que exige MINVU para una vereda sobre bien nacional de uso público).";

  // 10% (no 7%, el ya usado en radier/fundación) — verificado exactamente
  // contra el ejemplo de FASE4B: V=1,008 -> ×1,10 = 1,11 m³.
  await prisma.lossFactor.create({
    data: {
      moduleId: mod.id,
      key: "perdida_hormigon_vereda",
      label: "Pérdida de hormigón en vaciado",
      percentage: 0.1,
    },
  });

  // Esponjamiento del material de base al comprarlo (mismo criterio ya
  // citado para tierra excavada, OBRA-EXCAVACION-ESPONJAMIENTO) —
  // verificado contra el ejemplo de FASE4B: base 0,72 -> ×1,25 = 0,90 m³.
  const normEsponjamiento = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-EXCAVACION-ESPONJAMIENTO" } });
  await prisma.lossFactor.create({
    data: {
      moduleId: mod.id,
      key: "esponjamiento_base_vereda",
      label: "Esponjamiento del material de base",
      percentage: 0.25,
      normId: normEsponjamiento.id,
    },
  });

  await prisma.formula.createMany({
    data: [
      {
        moduleId: mod.id,
        key: "area",
        label: "Área",
        unit: "m²",
        expression: { op: "*", args: [{ var: "largo" }, { var: "ancho" }] },
        isResult: false,
        order: 1,
      },
      {
        moduleId: mod.id,
        key: "volumen-losa-bruto",
        label: "Volumen bruto de losa",
        unit: "m³",
        expression: { op: "*", args: [{ ref: "area" }, { op: "/", args: [{ var: "espesor-losa-cm" }, 100] }] },
        isResult: false,
        order: 2,
      },
      {
        moduleId: mod.id,
        key: "volumen-losa-con-perdida",
        label: "Volumen de losa con pérdida",
        unit: "m³",
        expression: { op: "lossFactor", key: "perdida_hormigon_vereda", value: { ref: "volumen-losa-bruto" } },
        isResult: false,
        order: 3,
      },
      {
        moduleId: mod.id,
        key: "volumen-base-bruto",
        label: "Volumen bruto de base",
        unit: "m³",
        expression: { op: "*", args: [{ ref: "area" }, { op: "/", args: [{ var: "espesor-base-cm" }, 100] }] },
        isResult: false,
        order: 13,
      },
      {
        moduleId: mod.id,
        key: "volumen-base-compra",
        label: "Material de base a comprar",
        unit: "m³",
        expression: { op: "lossFactor", key: "esponjamiento_base_vereda", value: { ref: "volumen-base-bruto" } },
        isResult: true,
        note: "Incluye esponjamiento del material de base (mismo criterio ya usado para tierra excavada) — compra más de lo que mide el hueco compactado.",
        order: 14,
      },
      {
        moduleId: mod.id,
        key: "volumen-premezclado",
        label: "Volumen de hormigón a pedir",
        unit: "m³",
        expression: { op: "ceilTo", step: 0.5, value: { ref: "volumen-losa-con-perdida" } },
        condition: { op: "==", args: [{ var: "metodo-hormigon" }, { str: "premezclado" }] },
        isResult: true,
        note:
          "El costo/condición de despacho depende del tipo de servicio, no de un \"mínimo\" único (Melón, Términos y Condiciones, tienda.melon.cl/terms-condictions): con camión mixer tradicional, el precio se calcula sobre una referencia de 7,5 m³ por viaje — pedir menos puede generar un recargo por carga incompleta, pero igual te lo despachan. Si tu proyecto es chico, algunos proveedores ofrecen mixer volumétrico (planta móvil) desde 0,5 m³, sin ese recargo. Consulta directamente con tu proveedor qué servicio te conviene — esto es información comercial orientativa, no una regla técnica.",
        order: 4,
      },
      {
        moduleId: mod.id,
        key: "sacos-cemento",
        label: "Cemento",
        unit: "bolsa",
        expression: { op: "ceil", value: { op: "*", args: [{ ref: "volumen-losa-con-perdida" }, 15] } },
        condition: { op: "==", args: [{ var: "metodo-hormigon" }, { str: "manual" }] },
        isResult: true,
        note: `${fuenteDosificacion} → {ref:volumen-losa-con-perdida} m³ × 15 = {value} {unit}.`,
        order: 5,
      },
      {
        moduleId: mod.id,
        key: "grava",
        label: "Grava",
        unit: "litro",
        expression: { op: "round", value: { op: "*", args: [{ ref: "sacos-cemento" }, 50] } },
        condition: { op: "==", args: [{ var: "metodo-hormigon" }, { str: "manual" }] },
        isResult: true,
        note: "50 litros de grava por saco de cemento (Polpaico, misma tabla de dosificaciones).",
        order: 6,
      },
      {
        moduleId: mod.id,
        key: "arena",
        label: "Arena",
        unit: "litro",
        expression: { op: "round", value: { op: "*", args: [{ ref: "sacos-cemento" }, 40] } },
        condition: { op: "==", args: [{ var: "metodo-hormigon" }, { str: "manual" }] },
        isResult: true,
        note: "40 litros de arena por saco de cemento (Polpaico, misma tabla de dosificaciones).",
        order: 7,
      },
      {
        moduleId: mod.id,
        key: "agua",
        label: "Agua",
        unit: "litro",
        expression: { op: "round", value: { op: "*", args: [{ ref: "sacos-cemento" }, 10] } },
        condition: { op: "==", args: [{ var: "metodo-hormigon" }, { str: "manual" }] },
        isResult: true,
        note: "10 litros de agua por saco de cemento (Polpaico, misma tabla de dosificaciones).",
        order: 8,
      },
      {
        moduleId: mod.id,
        key: "moldaje",
        label: "Moldaje",
        unit: "ml",
        expression: { op: "*", args: [2, { var: "largo" }] },
        isResult: true,
        note: "2 tablas laterales a lo largo de la vereda.",
        order: 9,
      },
      {
        moduleId: mod.id,
        key: "cortes-de-junta",
        label: "Cortes de junta de dilatación",
        unit: "corte",
        // paso_junta = 1,2m — REQUIERE VALIDACIÓN, ver Norm.
        expression: { op: "-", args: [{ op: "ceil", value: { op: "/", args: [{ var: "largo" }, 1.2] } }, 1] },
        isResult: true,
        note: "Cada 1,2 m aproximadamente (REQUIERE VALIDACIÓN — MINVU no fija este valor, delega \"a lo proyectado\"; consulta la especificación de tu proyecto o municipalidad).",
        order: 10,
      },
      {
        moduleId: mod.id,
        key: "soleras",
        label: "Soleras",
        unit: "ml",
        expression: { var: "soleras-ml" },
        condition: { op: "!=", args: [{ var: "incluye-soleras" }, { str: "no" }] },
        isResult: true,
        note: "Metros lineales tal como los especificaste — confirma con tu proveedor el largo de cada pieza según el tipo (A o C) para saber cuántas unidades comprar.",
        order: 11,
      },
      {
        moduleId: mod.id,
        key: "malla",
        label: "Malla electrosoldada",
        unit: "m²",
        expression: { ref: "area" },
        condition: {
          op: "and",
          args: [
            { op: "==", args: [{ var: "tipo-de-obra" }, { str: "acceso-vehicular" }] },
            { op: "==", args: [{ var: "lleva-malla" }, { str: "si" }] },
          ],
        },
        isResult: true,
        note: "Área de referencia (sin traslape) — confirma con tu proveedor el tipo de malla (ej. C92) y el traslape necesario entre paños.",
        order: 12,
      },
    ],
  });

  await prisma.norm.create({
    data: {
      code: "OBRA-VEREDA-DOSIFICACION-MINVU",
      title: "Vereda — dosificación de hormigón y emplantillado (MINVU/Polpaico)",
      scope: "vereda",
      verificationStatus: "CITADO",
      reinforcedWarning: false,
      note:
        `${fuenteDosificacion} Emplantillado: MINVU §11.7.3, ≥170 kg cem/m³, espesor 0,10 m. Emboquillado: mortero 425 kg cem/m³. Pérdida de vaciado de la losa: 10% (no el 7% usado en radier/fundación) — cifra derivada del ejemplo de referencia de la especificación técnica (docs/FASE4B_ESPECIFICACION_TECNICA_P1.md, "V=1,008 → ×1,10 = 1,11 m³"), no de una ficha independiente — REQUIERE VALIDACIÓN. Esponjamiento del material de base: 25%, mismo criterio ya citado para tierra excavada (OBRA-EXCAVACION-ESPONJAMIENTO). Espesor de losa y base: sin valor por defecto (no se encontró tabla MINVU con espesor exacto por tipo de obra — cámbielo tal como lo especifique su proyecto o municipalidad). Paso entre juntas de contracción: se usa 1,2 m como referencia — REQUIERE VALIDACIÓN, MINVU delega "a lo proyectado" y la regla de 24-30×espesor habitualmente citada es del ACI (EE.UU.), no una norma chilena.`,
    },
  });

  console.log(`  OK módulo vereda creado (id=${mod.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
