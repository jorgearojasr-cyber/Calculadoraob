import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const slug of ["excavacion", "excavacion-circular"]) {
    const mod = await prisma.module.findFirst({
      where: { slug },
      include: {
        questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } },
        formulas: { orderBy: { order: "asc" } },
        variables: { orderBy: { order: "asc" } },
      },
    });
    console.log(`\n=== ${slug} (id=${mod?.id}) ===`);
    console.log("QUESTIONS:", JSON.stringify(mod?.questions, null, 2));
    console.log("FORMULAS:", JSON.stringify(mod?.formulas, null, 2));
    console.log("VARIABLES:", JSON.stringify(mod?.variables, null, 2));
  }
}

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
