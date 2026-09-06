import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// FASE C7-C (2026-09-05) -- "Completar ayudas ⓘ antes del commit" (cierre
// Etapa B, sección 6 del pedido: esponjamiento). Cambio de METADATA
// únicamente (Formula.note) -- NUNCA se toca expression/condition. Reusa
// el mecanismo YA EXISTENTE de PricedResults (result.note -> CollapsibleHelp
// "¿Cómo calculamos esta cantidad?", ver priced-results.tsx:150-155) -- sin
// esto, "Tierra suelta estimada" en ResultScreen no mostraba ningún ícono
// de ayuda (a diferencia de "Viajes estimados", que sí tiene note).
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  async function updateFormulaNote(key: string, note: string) {
    const formula = await prisma.formula.findUniqueOrThrow({
      where: { moduleId_key: { moduleId: mod.id, key } },
    });
    if (formula.note === note) {
      console.log(`${key}: note ya está actualizada -- sin cambios (idempotente).`);
      return;
    }
    await prisma.formula.update({ where: { id: formula.id }, data: { note } });
    console.log(`${key}: note actualizada (expression/condition intactas).`);
  }

  await updateFormulaNote(
    "excavacion-volumen-suelto",
    "Al excavar, la tierra ocupa más volumen al quedar suelta que cuando estaba compactada en el terreno -- ese aumento se llama esponjamiento. El factor usado depende del tipo de terreno que indicaste (tierra normal o con arcilla/piedras); el valor real puede variar según el terreno y su humedad."
  );

  console.log(`OK — ayudas técnicas sincronizadas. Module id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
