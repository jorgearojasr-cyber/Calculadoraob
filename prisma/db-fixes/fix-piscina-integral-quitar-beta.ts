import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase Pre-Producción Final (2026-09-04): piscina-integral ya pasó C1-C7
// completos, 203/203 tests, QA rectangular/circular/Costos/SavedProject
// autenticado/mobile-desktop, y ya es la experiencia PRINCIPAL de
// "Construir una piscina" (relinking previo). "(beta)" en el nombre ya no
// comunica el estado real del módulo. Se retira solo esa etiqueta del
// Module.name -- el slug ("piscina-integral") y Module.published (false)
// no se tocan.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const mod = await prisma.module.findFirstOrThrow({
    where: { slug: "piscina-integral" },
    select: { id: true, name: true, published: true },
  });

  const newName = "Piscina — Configurador integral";

  if (mod.name === newName) {
    console.log('Module.name ya es "' + newName + '" -- sin cambios (idempotente).');
  } else {
    await prisma.module.update({ where: { id: mod.id }, data: { name: newName } });
    console.log(`Module.name actualizado: "${mod.name}" -> "${newName}"`);
  }

  console.log("published (sin tocar):", mod.published);
}

main().finally(() => prisma.$disconnect());
