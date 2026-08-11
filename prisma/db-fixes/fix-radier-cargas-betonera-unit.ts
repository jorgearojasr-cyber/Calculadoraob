import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 9A (04-ago-2026): "carga(s)" como unit producía "17 carga(s)es" —
// pluralizeUnit ya pluraliza automáticamente (ver src/lib/pluralize.ts:
// termina en vocal -> agrega "s"), así que el unit debe ir en singular
// simple ("carga"), no con el "(s)" manual que el propio motor duplica.
async function main() {
  const result = await prisma.formula.updateMany({
    where: { module: { slug: "radier" }, key: "numero_cargas_betonera" },
    data: { unit: "carga" },
  });
  console.log("Filas actualizadas:", result.count);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
