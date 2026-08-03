import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const modules = await prisma.module.findMany({ where: { slug: "radier" }, include: { questions: { orderBy: { order: "asc" } } } });
  console.log(JSON.stringify(modules.map((m) => m.questions.map((q) => ({ key: q.key, label: q.label, unit: q.unit, helpText: q.helpText, stepGroup: q.stepGroup, order: q.order }))), null, 2));
}

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
