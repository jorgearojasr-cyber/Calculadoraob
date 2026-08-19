// Fase 11AH — Cocina Lote E: Campana / Extractor
// (docs/FASE11AH_INFORME_COCINA_LOTE_E.md), diseño cerrado técnicamente
// en Fase 11AG (docs/FASE11AG_CIERRE_TECNICO_CAMPANA_COCINA.md).
//
// Último componente funcional del catálogo original de Fase 11Z para
// Cocina — con esto, Cocina V1 queda funcionalmente cerrada.
//
// Crea 1 InspectionElementTemplate ("campana-extractor"), 3
// InspectionChecklistItem y 3 TechnicalArticle. Idempotente (upsert).
// Deliberadamente NO crea ningún InspectionElementTemplateSpace — mismo
// patrón 100% Nivel 2 ya usado para Puerta (11AA), las 3 terminaciones
// de Lote B (11AB), Muebles/Cubierta (11AD) y Lavaplatos (11AF): el
// componente solo puede crearse vía saveSpaceLevel2ConfigAction, nunca
// vía generación automática de createInspectionAndGenerateAction.
// Velocidades/extracción/filtros/ductos NO tienen check propio (ver
// informe 11AG, secciones G/J/K/L).
//
// Ejecutar: npx tsx prisma/db-fixes/fase11ah-cocina-lote-e.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const campana = await prisma.inspectionElementTemplate.upsert({
    where: { key: "campana-extractor" },
    update: {},
    create: {
      key: "campana-extractor",
      label: "Campana / Extractor",
      order: 19,
      appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"],
    },
  });
  console.log(`OK: elemento "${campana.label}" (key=${campana.key}, id=${campana.id})`);

  const articles: { slug: string; title: string; content: string }[] = [
    {
      slug: "campana-extractor-funcionamiento",
      title: "Cómo revisar el funcionamiento de la campana o extractor",
      content: `# Qué revisar

Si la campana o extractor de la cocina enciende y responde normalmente a sus controles, incluidas las distintas velocidades si el modelo tiene más de una.

# Cómo revisarlo

Enciende la campana o extractor usando sus controles normales (botones, perilla o panel). Si tiene más de una velocidad, prueba cada una por turno. Apágala al terminar.

# Qué debería verse

El equipo enciende al accionar el control, y cada velocidad disponible responde de forma perceptible y distinta a las demás.

# Qué señales pueden indicar un problema

- El equipo no enciende al accionar el control.
- Alguna velocidad no responde o no se nota diferencia entre velocidades.
- Los controles (botones/perilla) no responden o cuesta mucho accionarlos.

# Por qué importa

Un equipo de extracción que no enciende o cuyos controles no funcionan no cumple su función básica de ventilar la cocina durante el uso diario.

# Recomendación

Si detectas que no enciende o algún control no responde, regístralo como observación indicando qué control específico falla. No es necesario abrir el equipo ni revisar su instalación eléctrica interna — con operar los controles normales alcanza para dejar constancia.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no trata equipamiento de extracción de cocina).`,
    },
    {
      slug: "campana-extractor-iluminacion",
      title: "Cómo revisar la iluminación de la campana",
      content: `# Qué revisar

Si la campana tiene iluminación incorporada, si esta enciende correctamente.

# Cómo revisarlo

Acciona el control de la luz de la campana (si existe, suele ser un botón o interruptor separado del control de velocidad).

# Qué debería verse

La luz enciende al accionar su control, en los modelos que la incluyen.

# Qué señales pueden indicar un problema

- La luz no enciende al accionar su control, en un modelo que sí la incluye.

Si el modelo de campana no tiene iluminación incorporada por diseño, marca esta revisión como "No corresponde" — no es un defecto.

# Por qué importa

La iluminación de la campana suele ser la principal fuente de luz directa sobre la zona de cocción — su ausencia de funcionamiento afecta el uso diario de la cocina.

# Recomendación

Si la luz no enciende, regístralo como observación. No es necesario abrir el equipo para revisar la ampolleta ni el cableado interno.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.`,
    },
    {
      slug: "campana-extractor-ruido-vibracion",
      title: "Cómo revisar ruido y vibración anormal en la campana o extractor",
      content: `# Qué revisar

Si, al funcionar, la campana o extractor presenta vibraciones, golpes o ruidos claramente irregulares, más allá del ruido normal de un motor en funcionamiento.

# Cómo revisarlo

Enciende la campana y escucha/observa mientras funciona por unos segundos, en al menos una velocidad.

# Qué debería verse

Un sonido de motor en funcionamiento, sin golpeteo, vibración de piezas sueltas ni roces irregulares.

# Qué señales pueden indicar un problema

- Golpeteo o traqueteo audible.
- Vibración notoria que hace vibrar la carcasa o piezas cercanas.
- Un roce o chirrido irregular distinto al sonido normal del motor.

Ten en cuenta que **todo motor produce sonido al funcionar** — eso por sí solo no es un defecto. Solo registra lo que se sienta claramente irregular, no simplemente "suena fuerte".

# Por qué importa

Un ruido o vibración irregular puede indicar una pieza mal fijada o un problema mecánico que conviene documentar antes de que empeore con el uso.

# Recomendación

Si detectas algo claramente irregular, regístralo como observación describiendo el tipo de ruido (golpeteo, vibración, roce). No intentes abrir el equipo para identificar la causa.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa, redactada con precaución para no convertir el sonido normal de operación en un defecto — sin fuente normativa aplicable.`,
    },
  ];

  for (const a of articles) {
    await prisma.technicalArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, content: a.content },
      create: a,
    });
    console.log(`OK: artículo "${a.slug}"`);
  }

  const checklistItems: {
    question: string;
    order: number;
    technicalArticleSlug: string;
    defaultSeverity: "LOW" | "MEDIUM" | "HIGH";
  }[] = [
    {
      question: "¿La campana o extractor enciende y responde normalmente a sus controles (velocidades, si tiene más de una)?",
      order: 0,
      technicalArticleSlug: "campana-extractor-funcionamiento",
      defaultSeverity: "MEDIUM",
    },
    {
      question: "Si la campana tiene iluminación incorporada, ¿enciende correctamente?",
      order: 1,
      technicalArticleSlug: "campana-extractor-iluminacion",
      defaultSeverity: "LOW",
    },
    {
      question: "Al funcionar, ¿presenta vibraciones, golpes o ruidos claramente irregulares (más allá del ruido normal del motor)?",
      order: 2,
      technicalArticleSlug: "campana-extractor-ruido-vibracion",
      defaultSeverity: "MEDIUM",
    },
  ];

  for (const item of checklistItems) {
    const existing = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId: campana.id, question: item.question },
    });
    if (existing) {
      await prisma.inspectionChecklistItem.update({
        where: { id: existing.id },
        data: { order: item.order, technicalArticleSlug: item.technicalArticleSlug, defaultSeverity: item.defaultSeverity },
      });
    } else {
      await prisma.inspectionChecklistItem.create({
        data: {
          elementTemplateId: campana.id,
          question: item.question,
          order: item.order,
          technicalArticleSlug: item.technicalArticleSlug,
          defaultSeverity: item.defaultSeverity,
        },
      });
    }
    console.log(`OK: pregunta "${item.question}" (severity=${item.defaultSeverity})`);
  }

  const links = await prisma.inspectionElementTemplateSpace.findMany({ where: { elementTemplateId: campana.id } });
  console.log(`\nInspectionElementTemplateSpace vinculados a "campana-extractor": ${links.length} (esperado: 0 — componente 100% Nivel 2, sin generación automática).`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
