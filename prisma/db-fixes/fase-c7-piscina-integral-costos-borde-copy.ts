import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// FASE C7 (cierre pre-commit) -- unifica el copy "Borde" en los 5
// Formula.label de Costos (C6, fase-c6-piscina-integral-costos.ts) que aún
// decían "del entorno" (los últimos 2 -- Radier terminado y Porcelanato --
// se detectaron en el grep de consistencia de la ronda anterior y quedaron
// aprobados para esta ronda). Cambio de METADATA únicamente (Formula.label) --
// NUNCA se toca key/expression/condition/material/unit de estas Formulas
// (getCostsActiveKeys y la arquitectura de Costos quedan intactas).
//
// Nota: este label solo se ve directamente en la vista de solo lectura de
// un SavedProject (proyectos/[id]/page.tsx -> <PricedResults> ->
// result.label). El "Costo estimado" interactivo de ResultScreen y el paso
// Costos del wizard usan sus propios arrays de copy hardcodeados en
// module-visual-config.ts / pool-costs-step.tsx -- esos se corrigen aparte,
// en el mismo commit, para que el resultado visible sea consistente en
// todas las superficies.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  async function updateLabel(key: string, newLabel: string) {
    const formula = await prisma.formula.findUniqueOrThrow({
      where: { moduleId_key: { moduleId: mod.id, key } },
    });
    if (formula.label === newLabel) {
      console.log(`${key}: label ya es "${newLabel}" -- sin cambios (idempotente).`);
      return;
    }
    await prisma.formula.update({ where: { id: formula.id }, data: { label: newLabel } });
    console.log(`${key}: label "${formula.label}" -> "${newLabel}" (key/expression/condition intactas).`);
  }

  await updateLabel("costos-base-entorno-subtotal", "Hormigón base/radier del borde (subtotal)");
  await updateLabel("costos-ceramica-entorno-subtotal", "Cerámica del borde (subtotal)");
  await updateLabel("costos-pastelones-subtotal", "Pastelones del borde (subtotal)");
  await updateLabel("costos-radier-terminado-subtotal", "Radier/hormigón terminado del borde (subtotal)");
  await updateLabel("costos-porcelanato-entorno-subtotal", "Porcelanato del borde (subtotal)");

  console.log(`OK — copy "Borde" unificado en Costos. Module id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
