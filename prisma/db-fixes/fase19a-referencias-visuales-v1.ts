import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 19A (docs/FASE19A_DT04_REFERENCIAS_VISUALES_V1.md) — DT-04. Crea
// las asociaciones InspectionReferenceImage (GOOD/BAD) para el conjunto
// curado de 33 checks de alto valor visual, usando los 19 pares de
// ilustraciones SVG originales en `public/inspecciones/referencias/`.
//
// Idempotente: por cada (checklistItemId, kind) hace upsert manual vía
// findFirst — si ya existe la referencia para ese check y ese kind, solo
// actualiza url/alt/caption/order; si no existe, la crea. NO toca
// InspectionCase/Space/Element/Check/Observation — solo la tabla de
// catálogo InspectionReferenceImage.
//
// Varias filas reutilizan intencionalmente el mismo assetKey (mismo
// fenómeno visual genérico — ver sección 8 del diseño de la fase, p.ej.
// "sello-perimetral" para 8 checks distintos de sello continuo/discontinuo
// en Ventana/Lavaplatos/Lavamanos/Ducha/Tina/Mampara/Cubierta baño/Lavadero).

import { ROWS } from "./fase19a-referencias-visuales-v1-data";

async function upsertReference(
  prisma: PrismaClient,
  checklistItemId: string,
  kind: "GOOD" | "BAD",
  url: string,
  alt: string,
  caption: string
) {
  const existing = await prisma.inspectionReferenceImage.findFirst({
    where: { checklistItemId, kind },
  });
  if (existing) {
    await prisma.inspectionReferenceImage.update({
      where: { id: existing.id },
      data: { url, alt, caption, order: 0 },
    });
  } else {
    await prisma.inspectionReferenceImage.create({
      data: { checklistItemId, kind, url, alt, caption, order: 0 },
    });
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  let created = 0;
  for (const row of ROWS) {
    const elementTemplate = await prisma.inspectionElementTemplate.findUniqueOrThrow({
      where: { key: row.elementKey },
    });
    const item = await prisma.inspectionChecklistItem.findFirstOrThrow({
      where: { elementTemplateId: elementTemplate.id, question: row.question },
    });

    const goodUrl = `/inspecciones/referencias/${row.assetKey}-good.svg`;
    const badUrl = `/inspecciones/referencias/${row.assetKey}-bad.svg`;

    await upsertReference(prisma, item.id, "GOOD", goodUrl, row.good.alt, row.good.caption);
    await upsertReference(prisma, item.id, "BAD", badUrl, row.bad.alt, row.bad.caption);
    created += 1;
    console.log(`OK: [${row.elementKey}] "${row.question.slice(0, 50)}..." -> ${row.assetKey}`);
  }

  console.log(`\nFase 19A: ${created} checks con referencias GOOD/BAD asociadas (${created * 2} filas InspectionReferenceImage).`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
