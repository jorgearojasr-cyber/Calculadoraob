import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 14A (docs/FASE14A_IMPLEMENTACION_QA_LIVING_COMEDOR_SEPARADOS_V1.md) —
// cierra la misma brecha de paridad ya cerrada en Dormitorio (12B) y
// Living-comedor (13A) para los dos templates independientes usados cuando
// el usuario elige "Separados" en el paso de características: `living` y
// `comedor`. Ambos comparten hoy exactamente el mismo patrón (piso, muros,
// ventana, enchufes-interruptores = 11 checks, sin cielo/iluminación).
//
// Este script SOLO crea 4 vínculos InspectionElementTemplateSpace nuevos
// (living<->cielo, living<->iluminacion, comedor<->cielo,
// comedor<->iluminacion), reutilizando 100% los templates existentes —
// cero InspectionElementTemplate, cero InspectionChecklistItem, cero
// TechnicalArticle nuevos.
//
// Ejecutar: npx tsx prisma/db-fixes/fase14a-living-comedor-separados-v1.ts

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const cielo = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: "cielo" } });
  const iluminacion = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: "iluminacion" } });

  for (const spaceKey of ["living", "comedor"]) {
    const space = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: spaceKey } });

    const newLinks = [
      { key: "cielo", elementTemplateId: cielo.id, order: 4 },
      { key: "iluminacion", elementTemplateId: iluminacion.id, order: 5 },
    ];
    for (const link of newLinks) {
      const existingLink = await prisma.inspectionElementTemplateSpace.findFirst({
        where: { spaceTemplateId: space.id, elementTemplateId: link.elementTemplateId },
      });
      if (existingLink) {
        await prisma.inspectionElementTemplateSpace.update({ where: { id: existingLink.id }, data: { order: link.order } });
        console.log(`OK: vínculo actualizado ${spaceKey} <-> ${link.key} (order=${link.order})`);
      } else {
        await prisma.inspectionElementTemplateSpace.create({
          data: { spaceTemplateId: space.id, elementTemplateId: link.elementTemplateId, order: link.order },
        });
        console.log(`OK: vínculo creado ${spaceKey} <-> ${link.key} (order=${link.order})`);
      }
    }

    const finalLinks = await prisma.inspectionElementTemplateSpace.findMany({
      where: { spaceTemplateId: space.id },
      include: { elementTemplate: true },
      orderBy: { order: "asc" },
    });
    console.log(`\nVínculos finales de ${spaceKey}:`);
    for (const l of finalLinks) console.log(`  order=${l.order} key=${l.elementTemplate.key}`);
    console.log("");
  }

  console.log("Fase 14A: living y comedor V1 — vínculos Cielo/Iluminación creados/confirmados en ambos. Sin catálogo nuevo.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
