import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 13A (docs/FASE13A_IMPLEMENTACION_QA_LIVING_COMEDOR_V1.md) — cierra la
// misma brecha de paridad ya cerrada en Dormitorio (Fase 12B): Living-comedor
// tiene hoy piso/muros/ventana/enchufes-interruptores (11 checks) pero nunca
// tuvo cielo ni iluminación vinculados. Este script SOLO crea 2 vínculos
// InspectionElementTemplateSpace nuevos, reutilizando 100% los templates ya
// existentes — cero InspectionElementTemplate, cero InspectionChecklistItem,
// cero TechnicalArticle nuevos.
//
// Ejecutar: npx tsx prisma/db-fixes/fase13a-living-comedor-v1.ts

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const livingComedor = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: "living-comedor" } });
  const cielo = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: "cielo" } });
  const iluminacion = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: "iluminacion" } });

  const newLinks = [
    { key: "cielo", elementTemplateId: cielo.id, order: 4 },
    { key: "iluminacion", elementTemplateId: iluminacion.id, order: 5 },
  ];
  for (const link of newLinks) {
    const existingLink = await prisma.inspectionElementTemplateSpace.findFirst({
      where: { spaceTemplateId: livingComedor.id, elementTemplateId: link.elementTemplateId },
    });
    if (existingLink) {
      await prisma.inspectionElementTemplateSpace.update({ where: { id: existingLink.id }, data: { order: link.order } });
      console.log(`OK: vínculo actualizado living-comedor <-> ${link.key} (order=${link.order})`);
    } else {
      await prisma.inspectionElementTemplateSpace.create({
        data: { spaceTemplateId: livingComedor.id, elementTemplateId: link.elementTemplateId, order: link.order },
      });
      console.log(`OK: vínculo creado living-comedor <-> ${link.key} (order=${link.order})`);
    }
  }

  const finalLinks = await prisma.inspectionElementTemplateSpace.findMany({
    where: { spaceTemplateId: livingComedor.id },
    include: { elementTemplate: true },
    orderBy: { order: "asc" },
  });
  console.log("\nVínculos finales de living-comedor:");
  for (const l of finalLinks) console.log(`  order=${l.order} key=${l.elementTemplate.key}`);

  console.log("\nFase 13A: Living-comedor V1 — vínculos Cielo/Iluminación creados/confirmados. Sin catálogo nuevo.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
