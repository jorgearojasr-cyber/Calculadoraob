import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11AT (docs/FASE11AT_IMPLEMENTACION_LOCAL_BANO_LOTE_A.md), arquitectura
// consolidada en docs/FASE11AS_CONSOLIDACION_CANONICA_BANO_V1.md.
//
// Este script NO crea ningún InspectionElementTemplate, InspectionChecklistItem
// ni TechnicalArticle nuevo — los 4 elementos que necesita Base (cielo,
// enchufes-interruptores, iluminacion, puerta) ya existen en catálogo,
// transversales, creados en fases anteriores de Cocina (11AA/preexistentes),
// con sus checks y artículos ya publicados. Este script SOLO agrega los 4
// vínculos InspectionElementTemplateSpace que faltan (bano<->cada uno),
// idempotente vía findFirst+create (mismo patrón usado en fase11aa-cocina-lote-a.ts).
//
// CRÍTICO — el vínculo bano<->artefactos-sanitarios YA EXISTE en catálogo y
// este script NO LO TOCA. El desacople de artefactos-sanitarios para la
// generación de Baños nuevos se logra 100% en código (LEVEL2_GATED_LINKS en
// src/app/(app)/inspecciones/actions.ts, par "bano:artefactos-sanitarios"),
// exactamente el mismo patrón ya usado con cocina:ventana — mientras el
// código de producción no conozca el gate, sigue generando
// artefactos-sanitarios automáticamente vía ese mismo vínculo intacto.
//
// Tampoco se crea ningún vínculo bano<->ventana ni bano<->{terminaciones}:
// esos 4 son Nivel 2 (SPACE_LEVEL2_CONFIG.bano), y `saveSpaceLevel2ConfigAction`
// crea el InspectionElement directamente por `elementTemplate.key` cuando el
// usuario responde "Sí", sin necesitar vínculo InspectionElementTemplateSpace
// previo — mismo mecanismo ya usado para Ventana/Puerta de Cocina y para
// Reja/Portón.
//
// Ejecutar: npx tsx prisma/db-fixes/fase11at-bano-lote-a.ts

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const bano = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: "bano" } });

  // 1) Confirmar que el vínculo histórico bano->artefactos-sanitarios sigue
  // intacto — solo lectura, nunca se modifica en este script.
  const artefactosSanitarios = await prisma.inspectionElementTemplate.findUniqueOrThrow({
    where: { key: "artefactos-sanitarios" },
  });
  const legacyLink = await prisma.inspectionElementTemplateSpace.findFirst({
    where: { spaceTemplateId: bano.id, elementTemplateId: artefactosSanitarios.id },
  });
  console.log(
    `OK: vínculo bano->artefactos-sanitarios ${legacyLink ? `intacto (id ${legacyLink.id})` : "NO ENCONTRADO"} — sin modificar en esta ejecución.`
  );

  // 2) Confirmar que los 4 templates base a vincular ya existen, activos,
  // con sus checks — solo lectura, ninguno se crea ni modifica.
  const baseKeys = ["cielo", "enchufes-interruptores", "iluminacion", "puerta"] as const;
  const templateByKey = new Map<string, { id: string; label: string }>();
  for (const key of baseKeys) {
    const template = await prisma.inspectionElementTemplate.findUniqueOrThrow({
      where: { key },
      include: { checklistItems: true },
    });
    if (!template.active) throw new Error(`Template "${key}" no está activo — abortando.`);
    templateByKey.set(key, template);
    console.log(`OK: template "${key}" (label=${template.label}, checks=${template.checklistItems.length}, active=${template.active}) — sin modificar.`);
  }

  // 3) Crear (idempotente) los 4 vínculos bano<->{cielo, enchufes-interruptores,
  // iluminacion, puerta}, continuando el order después de artefactos-sanitarios (order=2).
  const newLinks = [
    { elementKey: "cielo", order: 3 },
    { elementKey: "enchufes-interruptores", order: 4 },
    { elementKey: "iluminacion", order: 5 },
    { elementKey: "puerta", order: 6 },
  ];
  for (const link of newLinks) {
    const elementTemplateId = templateByKey.get(link.elementKey)!.id;
    const existing = await prisma.inspectionElementTemplateSpace.findFirst({
      where: { spaceTemplateId: bano.id, elementTemplateId },
    });
    if (existing) {
      await prisma.inspectionElementTemplateSpace.update({ where: { id: existing.id }, data: { order: link.order } });
      console.log(`OK: vínculo actualizado bano <-> ${link.elementKey} (order=${link.order})`);
    } else {
      await prisma.inspectionElementTemplateSpace.create({
        data: { spaceTemplateId: bano.id, elementTemplateId, order: link.order },
      });
      console.log(`OK: vínculo creado bano <-> ${link.elementKey} (order=${link.order})`);
    }
  }

  const finalLinks = await prisma.inspectionElementTemplateSpace.findMany({
    where: { spaceTemplateId: bano.id },
    include: { elementTemplate: true },
    orderBy: { order: "asc" },
  });
  console.log("\nVínculos finales de bano:");
  for (const l of finalLinks) console.log(`  order=${l.order} key=${l.elementTemplate.key}`);

  console.log(
    "\nFase 11AT: Baño Lote A — vínculos base (Cielo, Enchufes e interruptores, Iluminación, Puerta) creados/confirmados. Vínculo bano->artefactos-sanitarios intacto, sin desacoplar en catálogo (desacople es solo de código, ver LEVEL2_GATED_LINKS)."
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
