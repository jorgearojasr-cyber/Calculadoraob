import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 17A (docs/FASE17A_CIERRE_FUNCIONAL_GLOBAL_INSPECCIONES.md) — cierre
// funcional global del módulo Inspecciones. Este script consolida TODO el
// catálogo nuevo y los vínculos base de la auditoría, en 2 secciones:
//
// SECCIÓN 1 — catálogo nuevo: 1 template (`baranda`, Level 2 de `terraza`),
// 3 checks, 3 TechnicalArticles.
//
// SECCIÓN 2 — vínculos base nuevos (100% catálogo existente reutilizado):
//   bodega:            +piso +muros +cielo +enchufes-interruptores +iluminacion
//   estacionamiento:   +piso
//   antejardin:        +piso
//   acceso-vehicular:  +piso
//
// `terraza` (muros/ventana pasan de base a Level 2 gateado) NO requiere
// escritura en este script — el vínculo de catálogo ya existe, solo cambia
// el gate en `LEVEL2_GATED_LINKS` (actions.ts) y el config en
// space-config.ts.
//
// NO modifica ningún caso/espacio existente.
//
// Ejecutar: npx tsx prisma/db-fixes/fase17a-cierre-funcional-inspecciones.ts

type ChecklistItemSeed = {
  question: string;
  order: number;
  defaultSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  slug: string;
  title: string;
  content: string;
};

const BARANDA_CHECKS: ChecklistItemSeed[] = [
  {
    question: "¿La baranda se ve firme, sin bamboleo al empujarla suavemente?",
    order: 0,
    defaultSeverity: "HIGH",
    slug: "baranda-firmeza",
    title: "Cómo revisar la firmeza de la baranda",
    content: `# Qué revisar

Si la baranda de la terraza se ve firme y estable, sin bamboleo ni movimiento al empujarla.

# Cómo revisarlo

Empuja la baranda suavemente con la mano, en varios puntos de su recorrido (no solo un extremo), sin forzarla ni apoyar todo el peso del cuerpo.

# Qué debería verse

La baranda no se mueve, bascula ni cede al empujarla suavemente, en ningún punto de su recorrido.

# Qué señales pueden indicar un problema

- La baranda se mueve, bascula o cede al empujarla.
- Algún tramo se siente más suelto que el resto.
- Vibración o ruido anormal al tocarla.

# Por qué importa

Una baranda inestable es un riesgo de seguridad real — su función principal es evitar caídas, y una fijación deficiente puede fallar bajo el peso de una persona apoyándose en un momento de descuido.

# Recomendación

Si detectas cualquier inestabilidad, regístrala como observación con foto y severidad alta — no te apoyes con fuerza para confirmar el hallazgo, un empuje suave ya es suficiente evidencia.

# Fuente

- **Criterio interno**: no existe una partida específica para barandas de terraza en el Manual de Tolerancias ni en el catálogo educativo ITO consultados — revisión basada en criterio de seguridad básica (estabilidad ante uso normal), sin atribuir normativa estructural que no la respalda.`,
  },
  {
    question: "¿Presenta daños visibles: barrotes sueltos, quebrados, oxidados u otros deterioros?",
    order: 1,
    defaultSeverity: "MEDIUM",
    slug: "baranda-danos",
    title: "Cómo revisar daños visibles en la baranda",
    content: `# Qué revisar

Si la baranda presenta barrotes sueltos, quebrados, oxidados u otro tipo de deterioro visible en sus materiales.

# Cómo revisarlo

Recorre visualmente toda la baranda, observando cada barrote o panel y los puntos de unión entre ellos.

# Qué debería verse

Barrotes y paneles completos, sin quiebres, sin óxido avanzado (picaduras profundas o pérdida de material) ni piezas visiblemente sueltas.

# Qué señales pueden indicar un problema

- Barrotes quebrados, doblados o faltantes.
- Óxido avanzado que compromete visiblemente el material (no una simple mancha superficial).
- Piezas que se ven sueltas o mal ensambladas.

# Por qué importa

El deterioro de los materiales de la baranda puede derivar con el tiempo en una falla de seguridad, además de ser un defecto estético relevante en un elemento tan visible.

# Recomendación

Si detectas daños, regístralos como observación con foto, indicando el tramo afectado.

# Fuente

- **Criterio interno**: revisión basada en inspección visual básica de daños en elementos metálicos o de otro material — sin normativa específica de barandas consultada que respalde tolerancias exactas de óxido o deformación.`,
  },
  {
    question: "¿La baranda está firmemente fijada a la estructura, sin separaciones visibles en sus anclajes?",
    order: 2,
    defaultSeverity: "HIGH",
    slug: "baranda-anclaje",
    title: "Cómo revisar el anclaje de la baranda",
    content: `# Qué revisar

Si los anclajes (puntos donde la baranda se fija al piso, muro o estructura de la terraza) se ven firmes, sin separaciones ni holguras visibles.

# Cómo revisarlo

Observa cada punto de anclaje visible (base de los postes, encuentros con el muro) y verifica si hay separación entre el anclaje y la superficie donde se fija.

# Qué debería verse

Los anclajes están firmemente unidos a la superficie, sin espacios, grietas ni óxido que sugiera que el anclaje se ha debilitado con el tiempo.

# Qué señales pueden indicar un problema

- Separación visible entre el anclaje y el piso o muro.
- Grietas en el material alrededor del anclaje.
- Tornillos o pernos faltantes, sueltos o muy oxidados.

# Por qué importa

Un anclaje comprometido es la causa más común de falla de barandas — puede no notarse a simple vista si solo se prueba la firmeza general, por lo que revisar cada punto de anclaje por separado es importante.

# Recomendación

Si detectas separaciones o anclajes deteriorados, regístralos como observación con foto, indicando el punto exacto. No intentes reforzar ni ajustar el anclaje tú mismo — solo deja constancia visual.

# Fuente

- **Criterio interno**: revisión basada en criterio de seguridad básica sobre anclajes visibles — sin normativa estructural específica consultada que respalde tolerancias de fijación.`,
  },
];

async function upsertElement(
  prisma: PrismaClient,
  key: string,
  label: string,
  checks: ChecklistItemSeed[]
) {
  const element = await prisma.inspectionElementTemplate.upsert({
    where: { key },
    update: { label, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    create: { key, label, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"], order: 0 },
  });
  console.log(`OK: template ${key} (${element.id})`);

  for (const c of checks) {
    const article = await prisma.technicalArticle.upsert({
      where: { slug: c.slug },
      update: { title: c.title, content: c.content },
      create: { slug: c.slug, title: c.title, content: c.content, order: c.order },
    });
    console.log(`  OK: artículo ${c.slug}`);

    const existingItem = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId: element.id, question: c.question },
    });
    if (existingItem) {
      await prisma.inspectionChecklistItem.update({
        where: { id: existingItem.id },
        data: { order: c.order, defaultSeverity: c.defaultSeverity, technicalArticleSlug: article.slug },
      });
      console.log(`  OK: check actualizado "${c.question}"`);
    } else {
      await prisma.inspectionChecklistItem.create({
        data: {
          elementTemplateId: element.id,
          question: c.question,
          order: c.order,
          defaultSeverity: c.defaultSeverity,
          technicalArticleSlug: article.slug,
        },
      });
      console.log(`  OK: check creado "${c.question}"`);
    }
  }

  return element;
}

async function ensureLink(
  prisma: PrismaClient,
  spaceKey: string,
  elementKey: string,
  order: number
) {
  const space = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: spaceKey } });
  const element = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: elementKey } });
  const existingLink = await prisma.inspectionElementTemplateSpace.findFirst({
    where: { spaceTemplateId: space.id, elementTemplateId: element.id },
  });
  if (existingLink) {
    await prisma.inspectionElementTemplateSpace.update({ where: { id: existingLink.id }, data: { order } });
    console.log(`OK: vínculo actualizado ${spaceKey} <-> ${elementKey} (order=${order})`);
  } else {
    await prisma.inspectionElementTemplateSpace.create({
      data: { spaceTemplateId: space.id, elementTemplateId: element.id, order },
    });
    console.log(`OK: vínculo creado ${spaceKey} <-> ${elementKey} (order=${order})`);
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log("=== SECCIÓN 1: catálogo nuevo (baranda) ===");
  await upsertElement(prisma, "baranda", "Baranda", BARANDA_CHECKS);

  console.log("\n=== SECCIÓN 2: vínculos base nuevos ===");

  console.log("\n-- bodega --");
  await ensureLink(prisma, "bodega", "piso", 1);
  await ensureLink(prisma, "bodega", "muros", 2);
  await ensureLink(prisma, "bodega", "cielo", 3);
  await ensureLink(prisma, "bodega", "enchufes-interruptores", 4);
  await ensureLink(prisma, "bodega", "iluminacion", 5);

  console.log("\n-- estacionamiento --");
  await ensureLink(prisma, "estacionamiento", "piso", 1);

  console.log("\n-- antejardin --");
  await ensureLink(prisma, "antejardin", "piso", 2);

  console.log("\n-- acceso-vehicular --");
  await ensureLink(prisma, "acceso-vehicular", "piso", 1);

  console.log("\nFase 17A: cierre funcional global — catálogo y vínculos creados/confirmados.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
