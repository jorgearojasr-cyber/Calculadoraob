import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 2 — SEGUNDA DEPURACIÓN del alcance (09-ago-2026). Continuación
// directa de fase2-depuracion-alcance-seguridad.ts: aplica el mismo
// principio de seguridad (ObraBien no debe hacer diseño estructural ni
// dimensionamiento de instalaciones profesionales) a 7 módulos más de
// "Cálculos especiales" que compartían el mismo tipo de riesgo que
// escalera/viga/cadena/pilar-columna pero no habían sido nombrados
// explícitamente en la primera ronda, más "instalar-un-calefon-a-gas"
// (Agua y Gas), que recomienda una CAPACIDAD de equipo (litros) según
// criterios de uso sin norma citada verificada (verificationStatus =
// PRACTICA_GENERAL_NO_VERIFICADA en ambas normas vinculadas) — por regla
// explícita del usuario, sin fuente sólida verificada, corresponde
// GUÍA, no calculador.
//
// Mismo criterio que la primera ronda: no se borra ningún Module (se
// preserva como dato histórico) — solo se despublica y se retira su
// punto de entrada público. Todas las 8 tareas afectadas son dedicadas
// (1 solo moduleLink cada una, verificado antes de ejecutar) — se
// elimina la tarea completa, no queda ninguna con 0 links.

const MODULE_SLUGS_TO_UNPUBLISH = [
  "enfierradura",
  "malla-electrosoldada",
  "perfil-estructural",
  "tubo-estructural",
  "losa",
  "cercha-de-techo",
  "madera-para-cercha-u-otro-uso-estructural",
  "instalar-un-calefon-a-gas",
] as const;

// Mismos slugs de módulo y de tarea en los 7 de "Cálculos especiales"
// (cada uno tenía su propia tarea homónima); "instalar-un-calefon-a-gas"
// también comparte slug de módulo y de tarea.
const TASK_SLUGS_TO_DELETE = MODULE_SLUGS_TO_UNPUBLISH;

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

  console.log("\n=== 2. Verificando y eliminando ProjectTasks dedicadas ===");
  for (const slug of TASK_SLUGS_TO_DELETE) {
    const task = await prisma.projectTask.findUnique({ where: { slug }, include: { moduleLinks: true } });
    if (!task) {
      console.log(`  SKIP (no existe): ${slug}`);
      continue;
    }
    if (task.moduleLinks.length !== 1) {
      console.log(`  DETENIDO — "${task.name}" (${slug}) tiene ${task.moduleLinks.length} moduleLinks, no 1. No se elimina automáticamente, requiere revisión manual.`);
      continue;
    }
    await prisma.projectTask.delete({ where: { slug } });
    console.log(`  OK eliminada: "${task.name}" (${slug}) — 1 moduleLink en cascada`);
  }

  console.log("\n=== Verificación final ===");
  for (const slug of MODULE_SLUGS_TO_UNPUBLISH) {
    const mod = await prisma.module.findUnique({
      where: { slug },
      include: { _count: { select: { projectTaskLinks: true, questions: true, formulas: true } } },
    });
    if (mod) {
      console.log(`  ${slug}: published=${mod.published} projectTaskLinks=${mod._count.projectTaskLinks} questions=${mod._count.questions} formulas=${mod._count.formulas}`);
    }
  }

  const count = await prisma.module.count({ where: { published: true } });
  console.log(`\nTotal módulos publicados ahora: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
