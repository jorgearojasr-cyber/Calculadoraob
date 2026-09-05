import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// FASE C7 -- hallazgo durante la verificación visual completa (sección 7
// del pedido): el grupo ya se llama "Borde de la piscina" en ResultScreen
// (module-visual-config.ts) y en el wizard (pool-environment-step.tsx,
// fix-piscina-integral-copy-ux-final.ts ya renombró "entorno-ancho-m"), pero
// el ítem individual dentro del grupo seguía mostrando el label histórico
// "Área del entorno" (Formula "entorno-area", fase-c4-piscina-integral-
// entorno.ts) -- quedó fuera de aquel fix porque ese solo tocó
// "entorno-ancho-m". Cambio de METADATA únicamente (Formula.label) -- NUNCA
// se toca expression/condition, ni el key "entorno-area" (referenciado por
// otras Formulas vía {ref:"entorno-area"}, ver "entorno-volumen-base" etc.).
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  const formula = await prisma.formula.findUniqueOrThrow({
    where: { moduleId_key: { moduleId: mod.id, key: "entorno-area" } },
  });

  const newLabel = "Área del borde";
  if (formula.label === newLabel) {
    console.log(`"entorno-area": label ya es "${newLabel}" -- sin cambios (idempotente).`);
  } else {
    await prisma.formula.update({ where: { id: formula.id }, data: { label: newLabel } });
    console.log(`"entorno-area": label "${formula.label}" -> "${newLabel}" (expression/condition intactas).`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
