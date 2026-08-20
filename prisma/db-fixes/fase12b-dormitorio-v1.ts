import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 12B (docs/FASE12B_IMPLEMENTACION_LOCAL_DORMITORIO_V1.md) —
// implementación completa de Dormitorio V1, diseñada en
// docs/FASE12A_DISENO_INTEGRAL_DORMITORIO_V1.md.
//
// Este script hace EXACTAMENTE 6 cosas, todas aditivas salvo la última
// (un único UPDATE acotado por id):
//   1) crea/actualiza el template "closet" (Nivel 2 puro, sin vínculo
//      InspectionElementTemplateSpace — mismo patrón ya usado para TODOS
//      los componentes opcionales de Cocina/Baño: solo se crea vía
//      saveSpaceLevel2ConfigAction cuando el usuario responde "Sí", nunca
//      por generación automática);
//   2) crea/actualiza sus 4 InspectionChecklistItem;
//   3) crea/actualiza sus 4 TechnicalArticle;
//   4) crea/actualiza el vínculo dormitorio<->cielo (order=5);
//   5) crea/actualiza el vínculo dormitorio<->iluminacion (order=6);
//   6) corrige el wording de DT-05 (InspectionChecklistItem.question de
//      "iluminacion", UPDATE por id exacto, NUNCA updateMany) — seguro
//      porque InspectionChecklistCheck.questionSnapshot ya congela el
//      texto en cada check existente; este UPDATE solo afecta a checks
//      generados DESPUÉS de esta ejecución.
//
// No toca ningún InspectionCase/InspectionSpace/InspectionElement/
// InspectionChecklistCheck existente — ni de Dormitorio, ni de Cocina,
// ni de Baño, ni de ningún otro recinto. Los 6 Dormitorios reales
// existentes hoy no tienen `cielo`, así que quedan clasificados como
// históricos por el mismo mecanismo de ancla ya usado en Cocina/Baño
// (ver space-config.ts) — nada en este script los toca.
//
// Ejecutar: npx tsx prisma/db-fixes/fase12b-dormitorio-v1.ts

type ChecklistItemDef = {
  question: string;
  order: number;
  technicalArticleSlug: string;
  defaultSeverity: "LOW" | "MEDIUM" | "HIGH";
};

type ArticleDef = { slug: string; title: string; content: string };

const closetItems: ChecklistItemDef[] = [
  {
    question: "¿Las puertas y/o cajones del clóset abren y cierran correctamente, sin atascarse ni forzar?",
    order: 0,
    technicalArticleSlug: "closet-funcionamiento",
    defaultSeverity: "MEDIUM",
  },
  {
    question: "¿El clóset se siente firme y bien sujeto a la pared, sin bamboleo evidente al empujarlo suavemente?",
    order: 1,
    technicalArticleSlug: "closet-fijacion",
    defaultSeverity: "HIGH",
  },
  {
    question: "¿Presenta daños visibles: golpes, rayas profundas, paneles despegados o quebrados?",
    order: 2,
    technicalArticleSlug: "closet-danos-visibles",
    defaultSeverity: "LOW",
  },
  {
    question: "¿Se observan manchas de humedad o deformación (hinchazón) en el interior o en las puertas del clóset?",
    order: 3,
    technicalArticleSlug: "closet-humedad-deformacion",
    defaultSeverity: "MEDIUM",
  },
];

// Fase 12B, sección 4 del enunciado — corrección editorial respecto al
// texto propuesto en 12A: el check 1 NO se marca "No corresponde" solo
// por ausencia de cajones (un clóset con puertas y sin cajones SÍ debe
// revisarse en sus puertas). La guía deja explícito que se revisa
// únicamente lo que exista, y que "No corresponde" es solo para el caso
// límite de un clóset sin ninguna parte móvil.
const closetArticles: ArticleDef[] = [
  {
    slug: "closet-funcionamiento",
    title: "Cómo revisar el funcionamiento del clóset",
    content: `# Qué revisar

Si las puertas y/o cajones del clóset o armario empotrado abren y cierran correctamente, sin atascarse ni requerir forzar.

# Cómo revisarlo

Revisa únicamente las puertas y/o cajones que realmente existan en este clóset — no todos tienen ambos. Ábrelos y ciérralos con normalidad, sin forzar. Si el clóset no tiene ninguna parte móvil (por ejemplo, un espacio completamente abierto sin puertas ni cajones), puede marcarse "No corresponde".

# Qué debería verse

Cada puerta y cajón existente desliza o gira con normalidad, cierra sin dejar espacio forzado ni roce excesivo contra el marco o los rieles.

# Qué señales pueden indicar un problema

- Una puerta o cajón se atasca, no cierra completamente o requiere forzar.
- Un cajón se sale del riel o no desliza parejo.
- Bisagras o tiradores sueltos o rotos.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

Un clóset que no funciona correctamente limita el uso normal del dormitorio y puede empeorar con el uso (desgaste de rieles, bisagras forzadas) si no se corrige a tiempo.

# Recomendación

No fuerces puertas ni cajones atascados. No desarmes bisagras ni rieles. Si algo no funciona, regístralo con una foto y deja que se revise con las herramientas adecuadas.

# Fuente

- **Manual técnico de referencia**: ninguno específico para mobiliario empotrado de dormitorio.
- **Criterio interno**: revisión funcional básica, mismo estándar ya usado en Mueble de baño/Vanitorio (Fase 11AQ) y Muebles de cocina (Fase 11AC).

Sin referencia normativa verificada para esta revisión específica.`,
  },
  {
    slug: "closet-fijacion",
    title: "Cómo revisar la fijación del clóset",
    content: `# Qué revisar

Si el clóset o armario empotrado se siente firme y bien sujeto a la pared o estructura, sin moverse ni bambolear al empujarlo suavemente.

# Cómo revisarlo

Con el clóset vacío o sin forzar peso adicional, empuja suavemente su parte superior con la mano abierta, sin golpear. Observa si se mueve, se separa de la pared o cruje de forma anormal.

# Qué debería verse

El clóset permanece firme, sin desplazarse ni separarse de la pared al empujarlo suavemente.

# Qué señales pueden indicar un problema

- Movimiento o bamboleo notorio al empujar suavemente.
- Separación visible entre el clóset y la pared.
- Crujidos o ruidos anormales al tocarlo.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

Un mueble empotrado alto y pesado mal anclado tiene riesgo real de volcamiento, especialmente relevante en un dormitorio. Conviene registrarlo para que se revise y refuerce su fijación.

# Recomendación

No empujes con fuerza ni te cuelgues del mueble para probarlo — un empujón suave basta. No intentes reforzar la fijación tú mismo.

# Fuente

- **Manual técnico de referencia**: ninguno específico.
- **Criterio interno**: mismo estándar de fijación/riesgo de volcamiento ya usado en Mueble de baño/Vanitorio (Fase 11AQ, severidad HIGH por el mismo motivo).

Sin referencia normativa verificada para esta revisión específica.`,
  },
  {
    slug: "closet-danos-visibles",
    title: "Cómo revisar daños visibles en el clóset",
    content: `# Qué revisar

Si el clóset presenta daños visibles: golpes, rayas profundas, paneles despegados, quebrados o con bordes astillados.

# Cómo revisarlo

Observa las superficies exteriores e interiores del clóset (puertas, costados, cajones) con buena luz.

# Qué debería verse

Superficies sin golpes, rayas profundas, quiebres ni paneles despegados.

# Qué señales pueden indicar un problema

- Golpes o abolladuras visibles.
- Rayas profundas que atraviesan el acabado.
- Paneles despegados, levantados o quebrados.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

Un daño visible en el mueble empotrado afecta su apariencia y, si es profundo, puede indicar un problema estructural del panel que conviene registrar a tiempo.

# Recomendación

No intentes reparar ni ocultar el daño. Solo regístralo con una foto clara.

# Fuente

- **Manual técnico de referencia**: ninguno específico.
- **Criterio interno**: mismo estándar de "daños visibles" ya usado transversalmente en Piso, Mueble de baño, Tina, Mampara, entre otros.

Sin referencia normativa verificada para esta revisión específica.`,
  },
  {
    slug: "closet-humedad-deformacion",
    title: "Cómo revisar humedad y deformación en el clóset",
    content: `# Qué revisar

Si se observan manchas de humedad o deformación (hinchazón, ondulación) en el interior del clóset o en sus puertas.

# Cómo revisarlo

Abre el clóset y observa el interior (fondo, laterales) y la cara interior de las puertas, con buena luz. Presta atención especial si el clóset está contra un muro exterior o una zona con antecedentes de humedad.

# Qué debería verse

Superficies interiores secas, sin manchas oscuras, hinchazón ni ondulación del panel.

# Qué señales pueden indicar un problema

- Manchas oscuras o de aspecto húmedo en el interior.
- Paneles hinchados, ondulados o que se sienten blandos al tacto suave.
- Olor a humedad al abrir el clóset.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

La humedad atrapada en un mueble empotrado contra un muro puede indicar un problema de humedad del muro mismo, además de dañar el mueble y la ropa guardada — conviene registrarlo para que se revise el origen.

# Recomendación

No apliques fuerza sobre paneles hinchados ni intentes secar la zona tú mismo de forma agresiva. Solo regístralo con una foto y ventila el espacio si es posible.

# Fuente

- **Manual técnico de referencia**: ninguno específico.
- **Criterio interno**: mismo estándar de "manchas de humedad" ya usado en Cielo, y de "hinchazón/deformación" ya usado en Mueble de baño (Fase 11AQ).

Sin referencia normativa verificada para esta revisión específica.`,
  },
];

const ILUMINACION_WORDING_ANTERIOR =
  "¿La iluminación de la cocina enciende correctamente y el elemento visible se encuentra firme?";
const ILUMINACION_WORDING_NUEVO =
  "¿La iluminación del recinto enciende correctamente y el elemento visible se encuentra firme?";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // 1-3) Template Clóset + sus 4 checks + sus 4 artículos.
  const closet = await prisma.inspectionElementTemplate.upsert({
    where: { key: "closet" },
    update: { label: "Clóset / Armario empotrado", active: true },
    create: {
      key: "closet",
      label: "Clóset / Armario empotrado",
      order: 0,
      appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"],
    },
  });
  console.log(`OK: template "Clóset / Armario empotrado" (key=closet, id=${closet.id})`);

  for (const a of closetArticles) {
    await prisma.technicalArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, content: a.content },
      create: { slug: a.slug, title: a.title, content: a.content },
    });
  }
  console.log(`OK: ${closetArticles.length} artículos técnicos de Clóset creados/actualizados.`);

  for (const item of closetItems) {
    const existing = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId: closet.id, question: item.question },
    });
    if (existing) {
      await prisma.inspectionChecklistItem.update({
        where: { id: existing.id },
        data: {
          order: item.order,
          technicalArticleSlug: item.technicalArticleSlug,
          defaultSeverity: item.defaultSeverity,
          active: true,
        },
      });
    } else {
      await prisma.inspectionChecklistItem.create({
        data: {
          elementTemplateId: closet.id,
          question: item.question,
          order: item.order,
          technicalArticleSlug: item.technicalArticleSlug,
          defaultSeverity: item.defaultSeverity,
        },
      });
    }
  }
  console.log(`OK: ${closetItems.length} checks de Clóset creados/actualizados.`);

  // 4-5) Vínculos base dormitorio<->cielo (order=5), dormitorio<->iluminacion (order=6).
  const dormitorio = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: "dormitorio" } });
  const cielo = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: "cielo" } });
  const iluminacion = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: "iluminacion" } });

  const newBaseLinks = [
    { key: "cielo", elementTemplateId: cielo.id, order: 5 },
    { key: "iluminacion", elementTemplateId: iluminacion.id, order: 6 },
  ];
  for (const link of newBaseLinks) {
    const existingLink = await prisma.inspectionElementTemplateSpace.findFirst({
      where: { spaceTemplateId: dormitorio.id, elementTemplateId: link.elementTemplateId },
    });
    if (existingLink) {
      await prisma.inspectionElementTemplateSpace.update({ where: { id: existingLink.id }, data: { order: link.order } });
      console.log(`OK: vínculo actualizado dormitorio <-> ${link.key} (order=${link.order})`);
    } else {
      await prisma.inspectionElementTemplateSpace.create({
        data: { spaceTemplateId: dormitorio.id, elementTemplateId: link.elementTemplateId, order: link.order },
      });
      console.log(`OK: vínculo creado dormitorio <-> ${link.key} (order=${link.order})`);
    }
  }

  // 6) DT-05 — UPDATE acotado por id exacto, nunca updateMany. Solo se
  // corrige si el wording sigue siendo el anterior (idempotente: en la
  // segunda ejecución ya no coincide con ILUMINACION_WORDING_ANTERIOR y
  // no se vuelve a escribir, sin error).
  const ilumItem = await prisma.inspectionChecklistItem.findFirstOrThrow({
    where: { elementTemplateId: iluminacion.id, active: true },
  });
  if (ilumItem.question === ILUMINACION_WORDING_ANTERIOR) {
    await prisma.inspectionChecklistItem.update({
      where: { id: ilumItem.id },
      data: { question: ILUMINACION_WORDING_NUEVO },
    });
    console.log(`OK: DT-05 corregido — question id=${ilumItem.id} actualizado a wording genérico.`);
  } else if (ilumItem.question === ILUMINACION_WORDING_NUEVO) {
    console.log(`OK: DT-05 ya estaba corregido (id=${ilumItem.id}) — sin cambios en esta ejecución.`);
  } else {
    console.log(`AVISO: wording actual de iluminacion no coincide con lo esperado (id=${ilumItem.id}): "${ilumItem.question}" — no se modifica automáticamente.`);
  }

  const finalLinks = await prisma.inspectionElementTemplateSpace.findMany({
    where: { spaceTemplateId: dormitorio.id },
    include: { elementTemplate: true },
    orderBy: { order: "asc" },
  });
  console.log("\nVínculos finales de dormitorio:");
  for (const l of finalLinks) console.log(`  order=${l.order} key=${l.elementTemplate.key}`);

  console.log(
    "\nFase 12B: Dormitorio V1 — Clóset (1 template/4 checks/4 artículos), vínculos Cielo/Iluminación y fix DT-05 creados/confirmados."
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
