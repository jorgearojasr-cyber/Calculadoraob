import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const taskModules = await prisma.projectTaskModule.findMany({
    where: { presetQuery: { not: null } },
    include: { task: true, module: true },
  });
  console.log(
    "ProjectTaskModule con presetQuery:",
    JSON.stringify(
      taskModules.map((m) => ({ task: m.task.slug, moduleSlug: m.module.slug, presetQuery: m.presetQuery })),
      null,
      2
    )
  );

  const phaseModules = await prisma.projectPlanPhaseModule.findMany({
    where: { presetQuery: { not: null } },
    include: { module: true },
  });
  console.log(
    "ProjectPlanPhaseModule con presetQuery:",
    JSON.stringify(phaseModules.map((m) => ({ moduleSlug: m.module.slug, presetQuery: m.presetQuery })), null, 2)
  );
}

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
