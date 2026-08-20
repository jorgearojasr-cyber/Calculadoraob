import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 15A (docs/FASE15A_BARRIDO_IMPLEMENTACION_QA_RECINTOS_SIMPLES_V1.md) —
// barrido en lote de los recintos SIMPLE identificados en el inventario
// general: `recinto-ampliado` y `terraza-cerrada` carecían de
// Enchufes/interruptores, Cielo e Iluminación como base (misma brecha ya
// cerrada en Dormitorio/Living-comedor/Living/Comedor). `terraza` y
// `patio-trasero` solo reciben Nivel 2 de terminaciones (sin cambios de
// base) — no requieren escritura en este script, solo en
// space-config.ts.
//
// Este script SOLO crea/actualiza vínculos InspectionElementTemplateSpace,
// reutilizando 100% los templates existentes — cero
// InspectionElementTemplate, cero InspectionChecklistItem, cero
// TechnicalArticle nuevos.
//
// Ejecutar: npx tsx prisma/db-fixes/fase15a-recintos-simples-v1.ts

const NEW_LINKS: { spaceKey: string; elementKey: string; order: number }[] = [
  { spaceKey: "recinto-ampliado", elementKey: "enchufes-interruptores", order: 4 },
  { spaceKey: "recinto-ampliado", elementKey: "cielo", order: 5 },
  { spaceKey: "recinto-ampliado", elementKey: "iluminacion", order: 6 },
  { spaceKey: "terraza-cerrada", elementKey: "enchufes-interruptores", order: 4 },
  { spaceKey: "terraza-cerrada", elementKey: "cielo", order: 5 },
  { spaceKey: "terraza-cerrada", elementKey: "iluminacion", order: 6 },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const spaceCache = new Map<string, { id: string }>();
  const elementCache = new Map<string, { id: string }>();

  for (const link of NEW_LINKS) {
    if (!spaceCache.has(link.spaceKey)) {
      spaceCache.set(link.spaceKey, await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: link.spaceKey } }));
    }
    if (!elementCache.has(link.elementKey)) {
      elementCache.set(link.elementKey, await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: link.elementKey } }));
    }
    const space = spaceCache.get(link.spaceKey)!;
    const element = elementCache.get(link.elementKey)!;

    const existingLink = await prisma.inspectionElementTemplateSpace.findFirst({
      where: { spaceTemplateId: space.id, elementTemplateId: element.id },
    });
    if (existingLink) {
      await prisma.inspectionElementTemplateSpace.update({ where: { id: existingLink.id }, data: { order: link.order } });
      console.log(`OK: vínculo actualizado ${link.spaceKey} <-> ${link.elementKey} (order=${link.order})`);
    } else {
      await prisma.inspectionElementTemplateSpace.create({
        data: { spaceTemplateId: space.id, elementTemplateId: element.id, order: link.order },
      });
      console.log(`OK: vínculo creado ${link.spaceKey} <-> ${link.elementKey} (order=${link.order})`);
    }
  }

  for (const spaceKey of ["recinto-ampliado", "terraza-cerrada"]) {
    const space = spaceCache.get(spaceKey)!;
    const finalLinks = await prisma.inspectionElementTemplateSpace.findMany({
      where: { spaceTemplateId: space.id },
      include: { elementTemplate: true },
      orderBy: { order: "asc" },
    });
    console.log(`\nVínculos finales de ${spaceKey}:`);
    for (const l of finalLinks) console.log(`  order=${l.order} key=${l.elementTemplate.key}`);
  }

  console.log("\nFase 15A: recinto-ampliado y terraza-cerrada — vínculos Enchufes/Cielo/Iluminación creados/confirmados. Sin catálogo nuevo.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
