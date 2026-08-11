import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 2 — Depuración del alcance + corrección técnica (09-ago-2026).
// Decisión de producto: ObraBien no debe reemplazar el trabajo de
// ingenieros/constructores civiles/instaladores eléctricos/gasfíters ni
// especialistas sanitarios. Se retiran del catálogo público los
// calculadores que determinan dimensionamiento estructural o de
// instalación (no solo cantidad de materiales para un elemento ya
// definido por un profesional).
//
// No se borra ningún Module (se preserva como dato histórico, Questions/
// Formulas/Variables intactas) — solo se despublica (Module.published =
// false) y se retira su punto de entrada público (ProjectTask /
// ProjectTaskModule), para que no quede una tarjeta que lleve a un 404
// ni un selector con una opción rota. Ver informe de cierre para el
// detalle de cada retiro y la clasificación A/B/C/D completa.

const MODULE_SLUGS_TO_UNPUBLISH = [
  "escalera",
  "viga",
  "cadena",
  "pilar-columna",
  "muro-de-hormigon-armado",
  "cable-cajas-y-placas",
] as const;

// Tareas de un solo módulo, dedicadas exclusivamente a uno de los módulos
// de arriba — se elimina la tarea completa (cascada a su único
// ProjectTaskModule), no solo el link, porque sin él la tarea quedaría
// vacía (0 moduleLinks) y /empezar/[taskSlug] mostraría un selector sin
// opciones en vez de desaparecer del todo.
const TASK_SLUGS_TO_DELETE = [
  "escalera",
  "viga",
  "refuerzo-superior-del-muro-cadena-de-amarre",
  "pilar-columna",
  "cable-cajas-y-placas",
] as const;

// "Levantar un muro" tiene 2 opciones (bloques/ladrillos y hormigón
// armado) — se retira SOLO el link a hormigón armado; la tarea y su otra
// opción (que sí queremos conservar) se mantienen intactas.
const TASK_MODULE_LINK_TO_DELETE = {
  taskSlug: "levantar-un-muro",
  moduleSlug: "muro-de-hormigon-armado",
};

async function main() {
  console.log("=== 1. Despublicando módulos ===");
  for (const slug of MODULE_SLUGS_TO_UNPUBLISH) {
    const mod = await prisma.module.findUnique({ where: { slug } });
    if (!mod) {
      console.log(`  SKIP (no existe): ${slug}`);
      continue;
    }
    if (!mod.published) {
      console.log(`  SKIP (ya despublicado): ${slug}`);
      continue;
    }
    await prisma.module.update({ where: { slug }, data: { published: false } });
    console.log(`  OK despublicado: ${mod.name} (${slug})`);
  }

  console.log("\n=== 2. Eliminando ProjectTasks dedicadas (cascada a su ProjectTaskModule) ===");
  for (const slug of TASK_SLUGS_TO_DELETE) {
    const task = await prisma.projectTask.findUnique({ where: { slug }, include: { moduleLinks: true } });
    if (!task) {
      console.log(`  SKIP (no existe): ${slug}`);
      continue;
    }
    await prisma.projectTask.delete({ where: { slug } });
    console.log(`  OK eliminada: "${task.name}" (${slug}) — ${task.moduleLinks.length} moduleLink(s) en cascada`);
  }

  console.log("\n=== 3. Eliminando link puntual (Levantar un muro -> Muro de hormigón armado) ===");
  const task = await prisma.projectTask.findUnique({
    where: { slug: TASK_MODULE_LINK_TO_DELETE.taskSlug },
    include: { moduleLinks: { include: { module: { select: { slug: true, name: true } } } } },
  });
  if (!task) {
    console.log(`  SKIP (tarea no existe): ${TASK_MODULE_LINK_TO_DELETE.taskSlug}`);
  } else {
    const link = task.moduleLinks.find((l) => l.module.slug === TASK_MODULE_LINK_TO_DELETE.moduleSlug);
    if (!link) {
      console.log(`  SKIP (link no existe, quizás ya eliminado)`);
    } else {
      await prisma.projectTaskModule.delete({ where: { id: link.id } });
      console.log(`  OK eliminado link "${link.module.name}" de la tarea "${task.name}"`);
      console.log(`  Links restantes en "${task.name}": ${task.moduleLinks.length - 1}`);
    }
  }

  console.log("\n=== Verificación final ===");
  for (const slug of MODULE_SLUGS_TO_UNPUBLISH) {
    const mod = await prisma.module.findUnique({
      where: { slug },
      include: { _count: { select: { projectTaskLinks: true } } },
    });
    if (mod) {
      console.log(`  ${slug}: published=${mod.published} projectTaskLinks=${mod._count.projectTaskLinks}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
