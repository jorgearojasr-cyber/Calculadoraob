import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// RADIER — agrega "Placa compactadora" a la lista de herramientas de la
// guía. El paso a paso ya dice "Prepara y compacta el terreno" y los
// consejos ya mencionan "Compacta bien el terreno antes de verter", pero
// la lista de herramientas no incluía ningún equipo de compactación —
// inconsistencia entre pasos y herramientas. Se agrega como segundo ítem
// (se usa temprano, antes de la moldura y el vaciado), sin quitar ni
// reordenar el resto de la lista existente.

async function main() {
  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "radier" }, include: { guide: true } });
  if (!mod.guide) throw new Error("Radier no tiene ModuleGuide.");

  if (mod.guide.tools.includes("Placa compactadora")) {
    console.log("SKIP: 'Placa compactadora' ya está en la lista de herramientas.");
    return;
  }

  const tools = [...mod.guide.tools];
  tools.splice(1, 0, "Placa compactadora");

  await prisma.moduleGuide.update({
    where: { id: mod.guide.id },
    data: { tools },
  });

  console.log("OK: herramientas actualizadas ->", tools);
}

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
