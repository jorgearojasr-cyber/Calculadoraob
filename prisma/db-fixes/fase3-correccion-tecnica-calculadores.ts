import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 3 — Corrección técnica de los calculadores publicados (09-ago-2026).
// Cada bloque cita su fuente en el propio código (Norm.note) — ver el
// informe de cierre para la tabla completa valor-anterior/valor-nuevo/
// fuente. Ningún módulo D (retirado) se toca ni se reactiva.

async function main() {
  await fixZanjaParaTuberias();
  await fixCubiertaNotaCerchaRetirada();
  await fixTechoInclinadoFieltro();
  await fixRadierDosificacionYDuplicado();
  await fixFundacionDespachoMinimoYDuplicado();
  await fixEstuco();
  await fixAislacionTermica();
  await fixDucha();
  console.log("\n=== FASE 3 completada ===");
}

// ---------------------------------------------------------------------------
// 1. zanja-para-tuberias — ancho/profundidad pasan de LOOKUP oculto a
// preguntas editables (Prioridad 0, hallazgo de Fase 2B). Esponjamiento
// (antes ×1.25 escondido en la expression) pasa a LossFactor formal,
// reutilizando la norma OBRA-EXCAVACION-ESPONJAMIENTO ya citada para el
// mismo fenómeno físico en excavacion/excavacion-circular.
// ---------------------------------------------------------------------------
async function fixZanjaParaTuberias() {
  console.log("\n--- 1. zanja-para-tuberias ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "zanja-para-tuberias" },
    include: { questions: true, variables: true, formulas: true, lossFactors: true },
  });

  const qLargo = mod.questions.find((q) => q.key === "largo-de-la-zanja-metros")!;
  const qTipo = mod.questions.find((q) => q.key === "para-que-tipo-de-instalacion")!;
  const qRetiro = mod.questions.find((q) => q.key === "como-vas-a-retirar-la-tierra-sobrante")!;

  await prisma.question.update({ where: { id: qLargo.id }, data: { order: 0 } });
  await prisma.question.update({ where: { id: qTipo.id }, data: { order: 1 } });
  await prisma.question.update({ where: { id: qRetiro.id }, data: { order: 4 } });

  const anchoValues = { "agua-potable": 0.3, alcantarillado: 0.4, electrico: 0.3, gas: 0.3 };
  const profundidadValues = { "agua-potable": 0.5, alcantarillado: 0.8, electrico: 0.6, gas: 0.8 };

  const existingAncho = mod.questions.find((q) => q.key === "ancho-de-la-zanja-metros");
  if (!existingAncho) {
    await prisma.question.create({
      data: {
        moduleId: mod.id,
        key: "ancho-de-la-zanja-metros",
        label: "Ancho de la zanja (metros)",
        type: "NUMBER",
        unit: "m",
        order: 2,
        helpText:
          "Te sugerimos un ancho típico según el tipo de instalación, pero edítalo si tu proyecto exige otro — para gas, confírmalo con tu instalador certificado SEC.",
        defaultSource: { type: "LOOKUP", questionKey: "para-que-tipo-de-instalacion", table: anchoValues },
      },
    });
    console.log("  OK creada pregunta: ancho-de-la-zanja-metros (editable, con sugerencia por tipo)");
  } else {
    console.log("  SKIP (ya existe): ancho-de-la-zanja-metros");
  }

  const existingProfundidad = mod.questions.find((q) => q.key === "profundidad-de-la-zanja-metros");
  if (!existingProfundidad) {
    await prisma.question.create({
      data: {
        moduleId: mod.id,
        key: "profundidad-de-la-zanja-metros",
        label: "Profundidad de la zanja (metros)",
        type: "NUMBER",
        unit: "m",
        order: 3,
        helpText:
          "Te sugerimos una profundidad típica según el tipo de instalación, pero edítalo si tu proyecto exige otra — para gas, la profundidad real la determina un instalador certificado SEC según la normativa vigente, no uses este valor como definitivo.",
        defaultSource: { type: "LOOKUP", questionKey: "para-que-tipo-de-instalacion", table: profundidadValues },
      },
    });
    console.log("  OK creada pregunta: profundidad-de-la-zanja-metros (editable, con sugerencia por tipo)");
  } else {
    console.log("  SKIP (ya existe): profundidad-de-la-zanja-metros");
  }

  const varAncho = mod.variables.find((v) => v.key === "ancho")!;
  const varProfundidad = mod.variables.find((v) => v.key === "profundidad")!;
  await prisma.variable.update({
    where: { id: varAncho.id },
    data: { source: { type: "QUESTION", questionKey: "ancho-de-la-zanja-metros" } },
  });
  await prisma.variable.update({
    where: { id: varProfundidad.id },
    data: { source: { type: "QUESTION", questionKey: "profundidad-de-la-zanja-metros" } },
  });
  console.log("  OK variables ancho/profundidad ahora leen de la pregunta editable, no del LOOKUP oculto");

  const esponjamientoNorm = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-EXCAVACION-ESPONJAMIENTO" } });
  const existingLossFactor = mod.lossFactors.find((lf) => lf.key === "esponjamiento_zanja");
  if (!existingLossFactor) {
    await prisma.lossFactor.create({
      data: {
        moduleId: mod.id,
        key: "esponjamiento_zanja",
        label: "Esponjamiento de tierra excavada",
        percentage: 0.25,
        normId: esponjamientoNorm.id,
      },
    });
    console.log("  OK creado LossFactor esponjamiento_zanja=25% (antes ×1.25 escondido en la expression)");
  } else {
    console.log("  SKIP (ya existe): LossFactor esponjamiento_zanja");
  }

  const fVolumenEsponjado = mod.formulas.find((f) => f.key === "volumen-esponjado")!;
  await prisma.formula.update({
    where: { id: fVolumenEsponjado.id },
    data: {
      expression: { op: "lossFactor", key: "esponjamiento_zanja", value: { ref: "volumen-en-sitio" } },
      label: "Volumen de tierra a retirar (esponjado)",
      isSecondary: true,
      order: 2,
    },
  });
  console.log("  OK fórmula volumen-esponjado ahora usa el LossFactor formal en vez de ×1.25 en la expression");

  // El ejemplo de referencia (Largo=10, Ancho=0,40, Profundidad=0,60 ->
  // 2,40 m³) pide el volumen GEOMÉTRICO de la zanja como resultado
  // principal — antes solo se mostraba el volumen esponjado (3,00 m³ en
  // ese mismo ejemplo), un número distinto (tierra suelta a retirar en
  // camión, no "cuánto tengo que excavar"). Se promueve volumen-en-sitio
  // a resultado principal; volumen-esponjado queda como resultado
  // secundario (isSecondary, ver arriba) — sigue disponible para quien
  // necesite el dato de retiro en camión, pero ya no es el único número
  // que ve el usuario.
  const fVolumenEnSitio = mod.formulas.find((f) => f.key === "volumen-en-sitio")!;
  await prisma.formula.update({
    where: { id: fVolumenEnSitio.id },
    data: {
      label: "Volumen a excavar",
      isResult: true,
      order: 1,
      note: "Largo × ancho × profundidad = {value} {unit} — esto es lo que tienes que cavar. La tierra suelta que sacas ocupa más espacio (ver \"tierra a retirar\" abajo).",
    },
  });
  console.log("  OK volumen-en-sitio promovido a resultado principal 'Volumen a excavar' (coincide con el ejemplo: 10×0,4×0,6=2,40 m³)");
}

// ---------------------------------------------------------------------------
// 2. cubierta — la nota apuntaba a "Cercha de techo" y "Modo profesional",
// ambos retirados/renombrados en la depuración de alcance. No cambia la
// lógica de cálculo, solo el texto (Prioridad 0, punto 4).
// ---------------------------------------------------------------------------
async function fixCubiertaNotaCerchaRetirada() {
  console.log("\n--- 2. cubierta — nota de estructura aparte ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "cubierta" },
    include: { formulas: true },
  });
  const nuevaNota =
    "Este cálculo es solo la cubierta (planchas o tejas) — la estructura (cerchas y costaneras) debe diseñarla un profesional; ObraBien no la calcula.";
  const f = mod.formulas.find((x) => x.key === "aviso-estructura-aparte");
  if (f && f.note !== nuevaNota) {
    await prisma.formula.update({ where: { id: f.id }, data: { note: nuevaNota } });
    console.log("  OK nota de aviso-estructura-aparte actualizada (ya no referencia Cercha de techo/Modo profesional)");
  } else {
    console.log("  SKIP (no encontrada o ya actualizada)");
  }
  const norm = await prisma.norm.findUnique({ where: { code: "OBRA-CUBIERTA-ESTRUCTURA-APARTE" } });
  if (norm && norm.note !== nuevaNota) {
    await prisma.norm.update({ where: { id: norm.id }, data: { note: nuevaNota } });
    console.log("  OK norma OBRA-CUBIERTA-ESTRUCTURA-APARTE actualizada");
  }
}

// ---------------------------------------------------------------------------
// 3. techo-inclinado-bajo-teja-zinc (fieltro) — 10 -> 40 m²/rollo.
// Fuente: Fieltro asfáltico Volcán "10/40", 1m ancho x 40m largo = 40 m²,
// confirmado en tienda oficial (tienda.volcan.cl/products/fieltro-
// asfaltico-10-40-40m2), Prodalam y MCT (retailers chilenos, ago-2026).
// ---------------------------------------------------------------------------
async function fixTechoInclinadoFieltro() {
  console.log("\n--- 3. techo-inclinado-bajo-teja-zinc (fieltro) ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "techo-inclinado-bajo-teja-zinc" },
    include: { formulas: true },
  });
  const f = mod.formulas.find((x) => x.key === "rollos-de-fieltro")!;
  await prisma.formula.update({
    where: { id: f.id },
    data: {
      expression: { op: "ceil", value: { op: "/", args: [{ ref: "area-con-perdida" }, 40] } },
      note: "Cada rollo cubre 40 m² (fieltro asfáltico Volcán 10/40, 1m × 40m) → para {ref:area-con-perdida} m² necesitas {value} {unit}.",
    },
  });
  console.log("  OK fórmula rollos-de-fieltro: 10 m²/rollo -> 40 m²/rollo");

  await prisma.norm.update({
    where: { code: "OBRA-IMPERMEABILIZACION-FIELTRO-INCLINADO" },
    data: {
      verificationStatus: "CITADO",
      note:
        "Fuente: Fieltro asfáltico Volcán 10/40 — 1,0 m de ancho x 40 m de largo = 40 m² por rollo. Confirmado en tienda oficial Volcán (tienda.volcan.cl/products/fieltro-asfaltico-10-40-40m2), Prodalam y MCT (ago-2026). La nomenclatura exacta de \"10/40\" (peso/temperatura vs. peso/rendimiento) no está confirmada contra el PDF oficial de ficha técnica — REQUIERE VALIDACIÓN solo en ese punto secundario; el rendimiento de 40 m²/rollo está confirmado por 3 fuentes independientes.",
    },
  });
  console.log("  OK norma actualizada a CITADO con fuente Volcán");
}

// ---------------------------------------------------------------------------
// 4. radier — dosificación de cemento diferenciada por uso (antes 7
// sacos/m³ fijo para todo). Fuente: tabla Polpaico de dosificaciones
// (declarada sobre NCh170:2016): "Radieres y sobrecimientos sin armar" =
// 10 sacos/m³ (250 kg/m³); "Pavimento tránsito vehicular menor" = 15
// sacos/m³ (375 kg/m³). Se aplica sin-armar a patio/antepiso y vehicular
// a estacionamiento/bodega (tráfico rodado). Arena y gravilla quedan sin
// cambio (no hay ficha que dé su proporción exacta en los tramos de 10 y
// 15 sacos) — marcado REQUIERE VALIDACIÓN explícitamente en la norma.
// También corrige el resultado duplicado volumen_total (A-3).
// ---------------------------------------------------------------------------
async function fixRadierDosificacionYDuplicado() {
  console.log("\n--- 4. radier — dosificación por uso + resultado duplicado ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "radier" },
    include: { formulas: true, variables: true },
  });

  const existingVar = mod.variables.find((v) => v.key === "sacos-cemento-por-m3");
  if (!existingVar) {
    await prisma.variable.create({
      data: {
        moduleId: mod.id,
        key: "sacos-cemento-por-m3",
        label: "Sacos de cemento por m³ (según uso)",
        valueType: "NUMBER",
        source: {
          type: "LOOKUP",
          questionKey: "uso",
          table: {
            patio_terraza: 10,
            antepiso_interior: 10,
            estacionamiento: 15,
            bodega_industrial: 15,
          },
        },
      },
    });
    console.log("  OK creada variable sacos-cemento-por-m3 (10 sin-armar / 15 tránsito vehicular, Polpaico)");
  } else {
    console.log("  SKIP (ya existe): sacos-cemento-por-m3");
  }

  const fCementoManual = mod.formulas.find((f) => f.key === "cemento_manual")!;
  await prisma.formula.update({
    where: { id: fCementoManual.id },
    data: {
      expression: { op: "ceil", value: { op: "*", args: [{ ref: "volumen_con_perdida" }, { var: "sacos-cemento-por-m3" }] } },
      note: "Dosificación según uso (tabla Polpaico sobre NCh170:2016): patio/antepiso interior = 10 sacos/m³ (radier sin armar); estacionamiento/bodega = 15 sacos/m³ (tránsito vehicular menor) → {ref:volumen_con_perdida} m³ × {sacos-cemento-por-m3} = {value} {unit}.",
    },
  });
  console.log("  OK fórmula cemento_manual: 7 sacos/m³ fijo -> 10 o 15 según uso");

  const fCargaPorCemento = mod.formulas.find((f) => f.key === "cemento_por_carga");
  if (fCargaPorCemento) {
    await prisma.formula.update({
      where: { id: fCargaPorCemento.id },
      data: {
        expression: { op: "round", value: { op: "*", args: [{ var: "sacos-cemento-por-m3" }, { ref: "carga_betonera_m3" }, 25] } },
      },
    });
    console.log("  OK fórmula cemento_por_carga también usa la dosificación por uso");
  }

  const fVolumenTotal = mod.formulas.find((f) => f.key === "volumen_total")!;
  await prisma.formula.update({
    where: { id: fVolumenTotal.id },
    data: { condition: { op: "==", args: [{ var: "metodo_hormigon" }, { str: "manual" }] } },
  });
  console.log("  OK volumen_total ahora solo aparece en la rama manual (ya no duplica volumen_premezclado)");

  await prisma.norm.update({
    where: { code: "OBRA-RADIER-ESPESOR-DOSIF" },
    data: {
      verificationStatus: "CITADO",
      reinforcedWarning: false,
      note:
        "Cemento: tabla de dosificaciones Polpaico (jul-2020, declarada sobre NCh170:2016) — \"Radieres y sobrecimientos sin armar\" = 10 sacos/m³ (250 kg/m³) para patio/antepiso interior; \"Pavimento tránsito vehicular menor\" = 15 sacos/m³ (375 kg/m³) para estacionamiento/bodega. Corrige el valor anterior (7 sacos/m³ para todo uso, fila \"Cimientos\" aplicada incorrectamente a un radier). Arena y gravilla (0,5 y 0,75 m³/m³) y agua (180 L/m³) se mantienen sin cambio — REQUIERE VALIDACIÓN: no se encontró ficha Polpaico con el desglose de áridos/agua específico para los tramos de 10 y 15 sacos, así que esos 3 valores siguen siendo práctica de obra no verificada, no la ficha citada del cemento. Espesores por uso siguen sin verificar contra fuente específica.",
    },
  });
  console.log("  OK norma OBRA-RADIER-ESPESOR-DOSIF actualizada, cemento CITADO, áridos/agua marcados REQUIERE VALIDACIÓN");
}

// ---------------------------------------------------------------------------
// 5. fundacion — dosificación de "Cimientos" (7 sacos/m³) YA es correcta
// según la tabla Polpaico (fundación = cimiento corrido), no se toca. Se
// corrige solo: (a) el despacho mínimo, unificado a 3 m³ con radier — ver
// investigación de mercado (ventadehormigon.cl, movilmix.cl); ninguno de
// los 4 grandes productores (Melón/Polpaico/Readymix/Transex) publica una
// cifra propia, así que ambos valores quedan marcados REQUIERE VALIDACIÓN
// pero unificados en vez de mostrar 2 cifras distintas para lo mismo; y
// (b) el resultado duplicado volumen_total (A-3).
// ---------------------------------------------------------------------------
async function fixFundacionDespachoMinimoYDuplicado() {
  console.log("\n--- 5. fundacion — despacho mínimo unificado + resultado duplicado ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "fundacion" },
    include: { formulas: true },
  });

  const fVolumenPremezclado = mod.formulas.find((f) => f.key === "volumen_premezclado")!;
  await prisma.formula.update({
    where: { id: fVolumenPremezclado.id },
    data: {
      note: "Despacho mínimo habitual de camiones mixer: 3 m³ (REQUIERE VALIDACIÓN — no confirmado directamente por los grandes productores; cifra con mejor respaldo de mercado disponible, unificada con el resto de los módulos de hormigón). Si tu cálculo da menos, probablemente igual te cobren el mínimo — consulta con tu proveedor.",
    },
  });
  console.log("  OK nota de despacho mínimo: 7,5 m³ -> 3 m³ (unificado con radier)");

  const fVolumenTotal = mod.formulas.find((f) => f.key === "volumen_total")!;
  await prisma.formula.update({
    where: { id: fVolumenTotal.id },
    data: { condition: { op: "==", args: [{ var: "metodo_hormigon" }, { str: "manual" }] } },
  });
  console.log("  OK volumen_total ahora solo aparece en la rama manual (ya no duplica volumen_premezclado)");

  console.log("  CONFIRMADO sin cambio: cemento manual 7 sacos/m³ ya corresponde a la fila \"Cimientos\" de Polpaico — correcto para fundación.");
}

// ---------------------------------------------------------------------------
// 6. preparar-y-estucar-un-muro — "estuco-completo" pasa de 1,5 kg/m² (que
// es la cifra de un EMPASTE de terminación, no de un estuco de nivelación)
// a 25 kg/m² a un espesor de referencia de 1,5 cm. Fuente: Sika Uruguay,
// ficha técnica "Revoque Sika" (revoque monocapa cementicio), sept-2022:
// "Para un espesor de 1,5 cm, 25 kg/m² aproximadamente". Ficha regional
// (Uruguay, no Chile) — REQUIERE VALIDACIÓN contra una ficha chilena
// (Bekron/Melón/Cementos Bío Bío) bloqueada por Cloudflare en esta
// investigación. "retoque-puntual" (0,3 kg/m²) no fue objetada, sin cambio.
// ---------------------------------------------------------------------------
async function fixEstuco() {
  console.log("\n--- 6. preparar-y-estucar-un-muro (estuco) ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "preparar-y-estucar-un-muro" },
    include: { variables: true },
  });
  const v = mod.variables.find((x) => x.key === "masilla-kg-por-m2")!;
  await prisma.variable.update({
    where: { id: v.id },
    data: {
      source: { type: "LOOKUP", questionKey: "que-tan-danado-esta-el-muro", table: { "estuco-completo": 25, "retoque-puntual": 0.3 } },
    },
  });
  console.log("  OK estuco-completo: 1,5 kg/m² -> 25 kg/m² (a 1,5cm de espesor, Sika Uruguay); retoque-puntual sin cambio (0,3 kg/m²)");

  await prisma.norm.update({
    where: { code: "OBRA-ESTUCO-MURO-RENDIMIENTOS" },
    data: {
      verificationStatus: "CITADO",
      note:
        "Estuco completo: Sika Uruguay, ficha técnica \"Revoque Sika\" (revoque monocapa cementicio, reemplaza revoque grueso+fino tradicional), sept-2022 v.01.06 — \"Para un espesor de 1,5 cm, 25 kg/m² aproximadamente\" (https://ury.sika.com/dms/getdocument.get/67731ee6-0497-47c6-812d-ac4189383c39/revoque-sika.pdf). Corrige el valor anterior (1,5 kg/m²), que correspondía a un EMPASTE de terminación fina, no a un estuco de nivelación. Ficha regional (Uruguay, no Chile) — REQUIERE VALIDACIÓN contra ficha de un fabricante chileno (Bekron, Melón, Cementos Bío Bío); sus sitios bloquearon el acceso automatizado (403/Cloudflare) en esta investigación. Retoque puntual (0,3 kg/m²) no fue objetado por el estudio previo, se mantiene sin cambio como práctica de obra no verificada.",
    },
  });
  console.log("  OK norma OBRA-ESTUCO-MURO-RENDIMIENTOS actualizada, cambia a CITADO");
}

// ---------------------------------------------------------------------------
// 7. aislacion-termica-bajo-cubierta — reemplaza la constante única de 12
// m²/rollo por una tabla real de espesores (lana mineral, Volcán
// Aislanglass, ficha oficial jul-2026: 40/60/80/100mm) y una presentación
// citada para poliestireno expandido (AYRSA/Aislapol, plancha 1,0 x 2,0m).
// ---------------------------------------------------------------------------
async function fixAislacionTermica() {
  console.log("\n--- 7. aislacion-termica-bajo-cubierta ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "aislacion-termica-bajo-cubierta" },
    include: { questions: { include: { options: true } }, variables: true, formulas: true },
  });

  const qTipo = mod.questions.find((q) => q.key === "que-tipo-de-aislacion")!;

  const existingEspesor = mod.questions.find((q) => q.key === "espesor-de-aislacion-lana-mineral-mm");
  if (!existingEspesor) {
    const espesorQuestion = await prisma.question.create({
      data: {
        moduleId: mod.id,
        key: "espesor-de-aislacion-lana-mineral-mm",
        label: "¿Qué espesor de lana mineral vas a usar?",
        type: "SELECT",
        order: qTipo.order + 1,
        helpText:
          "El espesor mínimo recomendado depende de tu zona térmica (NCh1079:2019 / DS N°15). Si no lo sabes, confírmalo con tu proveedor o profesional antes de comprar.",
        visibleIfQuestionKey: "que-tipo-de-aislacion",
        visibleIfValues: ["lana-mineral"],
      },
    });
    await prisma.questionOption.createMany({
      data: [
        { questionId: espesorQuestion.id, key: "40mm", label: "40 mm", order: 0 },
        { questionId: espesorQuestion.id, key: "60mm", label: "60 mm", order: 1 },
        { questionId: espesorQuestion.id, key: "80mm", label: "80 mm", order: 2 },
        { questionId: espesorQuestion.id, key: "100mm", label: "100 mm", order: 3 },
      ],
    });
    console.log("  OK creada pregunta espesor-de-aislacion-lana-mineral-mm (40/60/80/100mm, Volcán Aislanglass)");
  } else {
    console.log("  SKIP (ya existe): espesor-de-aislacion-lana-mineral-mm");
  }

  const existingVar = mod.variables.find((v) => v.key === "cobertura-m2-por-rollo");
  if (!existingVar) {
    await prisma.variable.create({
      data: {
        moduleId: mod.id,
        key: "cobertura-m2-por-rollo",
        label: "Cobertura por rollo (m²)",
        valueType: "NUMBER",
        source: {
          type: "LOOKUP",
          questionKey: "espesor-de-aislacion-lana-mineral-mm",
          table: { "40mm": 28.8, "60mm": 14.4, "80mm": 14.4, "100mm": 9.0 },
          default: 12,
        },
      },
    });
    console.log("  OK creada variable cobertura-m2-por-rollo (28.8/14.4/14.4/9.0 según espesor, ficha Aislanglass)");
  } else {
    console.log("  SKIP (ya existe): cobertura-m2-por-rollo");
  }

  const fRollos = mod.formulas.find((f) => f.key === "rollos-lana-mineral")!;
  await prisma.formula.update({
    where: { id: fRollos.id },
    data: {
      expression: { op: "ceil", value: { op: "/", args: [{ ref: "area-con-perdida" }, { var: "cobertura-m2-por-rollo" }] } },
      note: "Cobertura del rollo según espesor elegido (ficha Volcán Aislanglass, formato 1,2m de ancho) → para {ref:area-con-perdida} m² necesitas {value} {unit}.",
    },
  });
  console.log("  OK fórmula rollos-lana-mineral: 12 m²/rollo fijo -> variable según espesor elegido");

  const fPlanchas = mod.formulas.find((f) => f.key === "planchas-poliestireno")!;
  await prisma.formula.update({
    where: { id: fPlanchas.id },
    data: {
      expression: { op: "ceil", value: { op: "/", args: [{ ref: "area-con-perdida" }, 2.0] } },
      note: "Cada plancha cubre 2,0 m² (AYRSA/Aislapol, plancha 1,0 x 2,0 m — REQUIERE VALIDACIÓN el espesor exacto, no se encontró ficha con espesores por SKU) → para {ref:area-con-perdida} m² necesitas {value} {unit}.",
    },
  });
  console.log("  OK fórmula planchas-poliestireno: 2,88 m²/plancha (sin fuente) -> 2,0 m²/plancha (AYRSA, citado)");

  await prisma.norm.update({
    where: { code: "OBRA-AISLACION-TECHO-RENDIMIENTO" },
    data: {
      verificationStatus: "CITADO",
      note:
        "Lana mineral: Volcán Aislanglass, ficha oficial (volcan.cl/wp-content/uploads/2022/05/ficha_aislanglass_2020_web.pdf), λ=0,042 W/mK (IDIEM 808.181), formato 1,2m de ancho — 40mm=28,8 m²/rollo, 60mm=14,4 m²/rollo, 80mm=14,4 m²/rollo, 100mm=9,0 m²/rollo. Corrige el valor anterior (12 m²/rollo fijo para cualquier espesor). Poliestireno expandido: AYRSA/Aislapol (ayrsa.cl/wp-content/uploads/2016/08/Ficha-Poliestireno-Expandido-Plancha.pdf), plancha de 1,0 x 2,0 m = 2,0 m² — no se encontró ficha con espesores específicos por SKU, REQUIERE VALIDACIÓN si necesitas diferenciar por espesor de EPS. Zona térmica y espesor mínimo exigido por NCh1079:2019/DS N°15 (vigente 28-11-2025) quedan fuera de esta corrección — no se agregó selector de zona, el usuario debe confirmar el espesor mínimo de su zona con su proveedor o profesional.",
    },
  });
  console.log("  OK norma OBRA-AISLACION-TECHO-RENDIMIENTO actualizada, cambia a CITADO");
}

// ---------------------------------------------------------------------------
// 8. instalar-una-ducha — el material recomendado era "Membrana asfáltica"
// (mismo Material que usa impermeabilizacion para techos/fundaciones,
// producto bituminoso en rollo) — incorrecto para un muro interior de
// ducha bajo cerámica. Se reemplaza por una membrana líquida cementicia
// flexible (Sika Sikalastic-1K, 1,2 kg/m²/mano). También corrige la
// sobreestimación de área: antes usaba el perímetro completo (4 lados)
// como si los 4 lados de la ducha tuvieran muro; se corrige a 2 muros
// (instalación de rincón, la más común), con altura de aplicación 2,0 m
// citada como práctica habitual (no hay ficha/norma que la fije).
// ---------------------------------------------------------------------------
async function fixDucha() {
  console.log("\n--- 8. instalar-una-ducha ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "instalar-una-ducha" },
    include: { formulas: true },
  });

  const fArea = mod.formulas.find((f) => f.key === "area-muros-ducha")!;
  await prisma.formula.update({
    where: { id: fArea.id },
    data: {
      // (ancho + profundidad) x altura: 2 muros de un rincón de ducha (la
      // instalación más común), no los 4 lados del perímetro completo.
      expression: { op: "*", args: [{ op: "+", args: [{ var: "ancho" }, { var: "profundidad" }] }, 2.0] },
      note: "Asume ducha de rincón (2 muros) y altura de aplicación de 2,0 m — práctica habitual, sin ficha/norma que la fije (REQUIERE VALIDACIÓN). Si tu ducha tiene más o menos muros, ajusta el resultado.",
    },
  });
  console.log("  OK fórmula area-muros-ducha: perímetro completo (4 lados) -> 2 muros de rincón x altura 2,0m");

  const material = await prisma.material.upsert({
    where: { key: "membrana-liquida-cementicia-ducha" },
    update: { name: "Membrana líquida impermeabilizante (cementicia flexible)", unit: "kg" },
    create: {
      key: "membrana-liquida-cementicia-ducha",
      name: "Membrana líquida impermeabilizante (cementicia flexible)",
      unit: "kg",
    },
  });
  console.log("  OK material creado/actualizado: Membrana líquida impermeabilizante (cementicia flexible), unidad kg");

  const fRollos = mod.formulas.find(
    (f) => f.key === "rollos-impermeabilizante-ducha" || f.key === "kg-membrana-impermeabilizante-ducha"
  )!;
  await prisma.formula.update({
    where: { id: fRollos.id },
    data: {
      key: "kg-membrana-impermeabilizante-ducha",
      label: "Membrana líquida impermeabilizante",
      unit: "kg",
      expression: { op: "round", value: { op: "*", args: [{ ref: "area-muros-con-perdida-ducha" }, 2.4] } },
      note: "1,2 kg/m² por mano × 2 manos = 2,4 kg/m² (Sika Sikalastic-1K, mortero impermeabilizante monocomponente indicado para muros de ducha bajo cerámica) → para {ref:area-muros-con-perdida-ducha} m² necesitas {value} {unit}.",
      materialId: material.id,
    },
  });
  console.log("  OK fórmula (antes 'rollos de membrana asfáltica', 10 m²/rollo) -> kg de membrana líquida cementicia, 2,4 kg/m²");

  await prisma.norm.update({
    where: { code: "OBRA-IMPERMEABILIZACION-RENDIMIENTOS" },
    data: {
      // Esta norma también la usa `impermeabilizacion` (techos/fundaciones,
      // donde la membrana asfáltica SÍ es el producto correcto) — no se
      // toca. La corrección de ducha usa una norma propia nueva.
    },
  });

  const newNormCode = "OBRA-DUCHA-IMPERMEABILIZACION-MEMBRANA-LIQUIDA";
  const existingNorm = await prisma.norm.findUnique({ where: { code: newNormCode } });
  const norm = existingNorm
    ? await prisma.norm.update({
        where: { code: newNormCode },
        data: {
          title: "Impermeabilización de ducha — membrana líquida cementicia",
          scope: "instalar-una-ducha",
          verificationStatus: "CITADO",
          note:
            "Sika Sikalastic-1K (mortero impermeabilizante monocomponente reforzado con fibras), descrito en ficha para \"impermeabilizaciones de techos, balcones, terrazas, muros, baños, duchas, antes de la aplicación de baldosas cerámicas\": 1,2 kg/m² por mano (industry.sika.com/content/dam/dms/cl01/4/sikalastic-1k.pdf; cifra por mano confirmada en fuente secundaria que cita la ficha, grupocasalima.com/blog/sika/sikalastic-1k-rendimiento-precio). Corrige el uso anterior de \"membrana asfáltica\" (mismo Material que usa el módulo impermeabilizacion para techos/fundaciones — producto bituminoso en rollo, incorrecto para un muro interior bajo cerámica). REQUIERE VALIDACIÓN: número de manos (se asume 2, práctica habitual, no confirmado en la ficha completa), altura de aplicación (se asume 2,0 m, práctica habitual sin fuente normativa), y si la instalación es de rincón (2 muros) en vez de perímetro completo.",
        },
      })
    : await prisma.norm.create({
        data: {
          code: newNormCode,
          title: "Impermeabilización de ducha — membrana líquida cementicia",
          scope: "instalar-una-ducha",
          verificationStatus: "CITADO",
          reinforcedWarning: false,
          note:
            "Sika Sikalastic-1K (mortero impermeabilizante monocomponente reforzado con fibras), descrito en ficha para \"impermeabilizaciones de techos, balcones, terrazas, muros, baños, duchas, antes de la aplicación de baldosas cerámicas\": 1,2 kg/m² por mano (industry.sika.com/content/dam/dms/cl01/4/sikalastic-1k.pdf; cifra por mano confirmada en fuente secundaria que cita la ficha, grupocasalima.com/blog/sika/sikalastic-1k-rendimiento-precio). Corrige el uso anterior de \"membrana asfáltica\" (mismo Material que usa el módulo impermeabilizacion para techos/fundaciones — producto bituminoso en rollo, incorrecto para un muro interior bajo cerámica). REQUIERE VALIDACIÓN: número de manos (se asume 2, práctica habitual, no confirmado en la ficha completa), altura de aplicación (se asume 2,0 m, práctica habitual sin fuente normativa), y si la instalación es de rincón (2 muros) en vez de perímetro completo.",
        },
      });
  await prisma.formula.update({
    where: { id: fRollos.id },
    data: { normId: norm.id },
  });
  console.log("  OK norma OBRA-DUCHA-IMPERMEABILIZACION-MEMBRANA-LIQUIDA creada/actualizada y enlazada");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
