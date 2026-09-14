// Fase 3 — "Área personalizada" / tramos (2026-09-14).
//
// Crea, por cada uno de los 15 módulos migrados a AreaInputToggle con
// `tramosQuestionKey` (ver module-visual-config.ts — TODOS los que tienen
// allowAreaToggle, salvo Pintura, que queda fuera por decisión explícita):
//   1. una Question TEXT ("tramos-json") en el MISMO stepGroup que las
//      preguntas de área existentes — nunca se renderiza como campo
//      (AreaInputToggle la escribe directo, ver handleAreaChange en
//      question-group-step/index.tsx), solo viaja junto al resto del
//      grupo para que `onAnswer` la incluya en el submit.
//   2. una Variable pass-through TEXT ("tramos-json", isResult:false,
//      source QUESTION) — mismo patrón EXACTO que "consumo_detalle_json"
//      (Consumo eléctrico), verificado contra el registro real en BD antes
//      de escribir este script.
//
// El `order` de la Question nueva es SIEMPRE mayor que cualquier otra
// pregunta del módulo (max existente + 1000) — así queda al final de
// `questions` para ese stepGroup y nunca corre el índice posicional
// [0]/[1] que usa el diagrama para largo/ancho (ver dimensionQuestions en
// question-group-step/index.tsx).
//
// Idempotente: upsert por [moduleId, key] en ambos modelos — correr de
// nuevo no duplica nada.
//
// Además (mismo commit, pedido explícito de Jorge en la aprobación de
// Fase 3): corrige el helpText de la Question de área en Muro de bloques
// y Fachada exterior — antes decía "puedes descontar puertas y ventanas"
// (describía el descuento de vanos INLINE en modo largo×alto, que ya no
// existe: se reemplazó por la pestaña separada "Área personalizada"). El
// texto viejo confundía al usuario sobre dónde vive esa función ahora.
// Solo estos 2 módulos — los únicos que tenían `enableDeduction` y fueron
// migrados a tramos (Pintura también lo tenía pero no se tocó, resuelve
// vanos con su propio componente standalone).
//
// Uso: npx tsx prisma/db-fixes/fase-tramos-seed.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TRAMOS_QUESTION_KEY = "tramos-json";

// moduleSlug -> stepGroup del diagrama de área (ver module-visual-config.ts,
// campo `tramosQuestionKey` de cada entrada — mismo stepGroup, auditado
// contra la base real antes de escribir este script).
const TARGET_MODULES: Record<string, string> = {
  "hacer-un-sendero": "sendero-dims",
  "ceramica-pisos": "cmru6tntl00000kseunldpq7g",
  "tabiques-y-cielos": "cmrtvl3aw000fmcsezs6inad3",
  "pasto-en-panes": "cmrtvl24q000amcse8s2dj1ex",
  impermeabilizacion: "cmrtvkzox0000mcse4sc28ke7",
  "revestimiento-de-muro": "cmrtx37y50002s4se6alp133w",
  "porcelanato-piso": "cmru6tpo600050kseszh7cl1k",
  "aislacion-termica-bajo-cubierta": "cmruwyzxk0001gcseu3hskggo",
  "techo-inclinado-bajo-teja-zinc": "cmrv640ny00013oseqrvvxb50",
  "instalar-pastelones": "pastelones-area-directa",
  "siembra-por-semilla-cesped": "siembra-area-directa",
  "preparar-y-estucar-un-muro": "estuco-area-directa",
  "terminar-junturas-de-yeso-carton": "yeso-planchas-area-directa",
  "muro-de-bloques-o-ladrillos": "muro-bloques-superficie-final",
  "pintar-fachada-exterior": "fachada-superficie-final",
};

async function main() {
  for (const [slug, stepGroup] of Object.entries(TARGET_MODULES)) {
    const mod = await prisma.module.findFirst({
      where: { slug },
      select: { id: true, questions: { select: { key: true, order: true, stepGroup: true } } },
    });
    if (!mod) {
      console.log(`⚠️  módulo no encontrado, se omite: ${slug}`);
      continue;
    }

    const siblingExists = mod.questions.some((q) => q.stepGroup === stepGroup);
    if (!siblingExists) {
      console.log(`⚠️  stepGroup "${stepGroup}" no encontrado en ${slug} — revisar antes de seguir, se omite`);
      continue;
    }

    const maxOrder = mod.questions.reduce((max, q) => Math.max(max, q.order), 0);
    const newOrder = maxOrder + 1000;

    await prisma.question.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: TRAMOS_QUESTION_KEY } },
      update: {}, // ya existe (re-run idempotente) — no se pisa nada.
      create: {
        moduleId: mod.id,
        key: TRAMOS_QUESTION_KEY,
        label: "Desglose de tramos (uso interno, no se muestra como campo)",
        type: "TEXT",
        stepGroup,
        order: newOrder,
      },
    });

    await prisma.variable.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: TRAMOS_QUESTION_KEY } },
      update: {},
      create: {
        moduleId: mod.id,
        key: TRAMOS_QUESTION_KEY,
        label: "Desglose de tramos (JSON)",
        valueType: "TEXT",
        isResult: false,
        source: { type: "QUESTION", questionKey: TRAMOS_QUESTION_KEY },
      },
    });

    console.log(`✅ ${slug}: Question + Variable "tramos-json" listas (order=${newOrder}, stepGroup=${stepGroup})`);
  }

  // Corrección de copy (ver comentario arriba) — solo los 2 módulos
  // migrados desde "vanos". slug -> { key de la Question de área, texto
  // nuevo }.
  const HELP_TEXT_FIXES: Record<string, { questionKey: string; helpText: string }> = {
    "muro-de-bloques-o-ladrillos": {
      questionKey: "muro-bloques-superficie-final-m2",
      helpText:
        "Ingresa largo × alto, el área ya calculada en m², o usa 'Área personalizada' para sumar y restar tramos (por ejemplo, descontar puertas y ventanas).",
    },
    "pintar-fachada-exterior": {
      questionKey: "fachada-superficie-final-m2",
      helpText:
        "Ingresa largo × alto, el área ya calculada en m², o usa 'Área personalizada' para sumar y restar tramos (por ejemplo, descontar puertas y ventanas).",
    },
  };

  for (const [slug, { questionKey, helpText }] of Object.entries(HELP_TEXT_FIXES)) {
    const mod = await prisma.module.findFirst({ where: { slug }, select: { id: true } });
    if (!mod) {
      console.log(`⚠️  módulo no encontrado para fix de copy, se omite: ${slug}`);
      continue;
    }
    await prisma.question.update({
      where: { moduleId_key: { moduleId: mod.id, key: questionKey } },
      data: { helpText },
    });
    console.log(`✅ ${slug}: helpText de "${questionKey}" actualizado`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
