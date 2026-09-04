import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase Pre-Producción "piscina-integral como experiencia principal"
// (2026-09-04): hasta ahora, la ProjectTask "construir-una-piscina" tenía
// `planId` apuntando al ProjectPlan legado de 3 fases (Excavación /
// Construir la piscina / Terminar el entorno) — y en /empezar/[taskSlug]
// ese `task.plan` truthy siempre gana la prioridad sobre moduleLinks, así
// que sus 2 ProjectTaskModule existentes (Rectangular -> piscina-rectangular-
// hormigon-armado, Circular -> piscina-circular-hormigon-armado) nunca se
// resolvían de verdad: solo servían para pintar 2 tarjetas de "forma" en
// /grupos/piscinas cuyo único efecto real era anexar ?shape=X al redirect
// hacia el plan legado (ver auditoría "PLAN ANTIGUO VS CONFIGURADOR
// INTEGRAL"). Confirmado con una query previa que NINGUNA otra ProjectTask
// usa esos 2 ProjectTaskModule — son exclusivos de esta tarea, así que
// quitarlos de acá no afecta ningún otro flujo.
//
// Este fix:
//   A. Quita planId de la tarea (dejará de redirigir al plan legado).
//   B. Reemplaza sus 2 ProjectTaskModule (Rectangular/Circular hacia los
//      standalones) por uno solo hacia piscina-integral -- así
//      /empezar/[taskSlug] cae en la rama "moduleLinks.length === 1" y
//      redirige DIRECTO al wizard integral, sin selector intermedio ni
//      query ?shape= (el propio configurador ya pregunta la forma como su
//      primer paso -- evita la doble selección redundante detectada en la
//      auditoría). /grupos/piscinas, que arma sus tarjetas leyendo
//      directamente task.moduleLinks, pasa a mostrar una sola tarjeta
//      (antes 2) como efecto downstream de este cambio de datos, sin tocar
//      ese código.
//
// NO se toca: el ProjectPlan "construir-una-piscina" (fila intacta), sus 3
// ProjectPlanPhase (intactas, /plan/construir-una-piscina sigue
// funcionando por URL directa), ningún Module standalone (piscina-
// rectangular-hormigon-armado, piscina-circular-hormigon-armado y el resto
// siguen `published` e íntegros, accesibles vía /categorias/piscinas),
// ningún SavedProject (su `planId` se graba al momento de guardar, no
// deriva de ProjectTask.planId), y Module.published de piscina-integral
// (se deja explícitamente en false, sin tocar).
//
// Idempotente: los `deleteMany` con `where` son no-op si ya se corrieron
// antes; la creación del nuevo link usa `findFirst` + `create` solo si no
// existe ya (en vez de `create` a ciegas, que duplicaría filas en una
// segunda corrida — ProjectTaskModule no tiene unique constraint en
// (taskId, moduleId)). Seguro de ejecutar 2+ veces.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const task = await prisma.projectTask.findFirstOrThrow({
    where: { slug: "construir-una-piscina" },
    select: { id: true, planId: true },
  });

  const integralModule = await prisma.module.findFirstOrThrow({
    where: { slug: "piscina-integral" },
    select: { id: true, published: true },
  });

  if (integralModule.published) {
    throw new Error(
      "piscina-integral tiene published=true -- este fix está pensado para pre-producción con published=false. Abortando por seguridad."
    );
  }

  // A. Desvincular del plan legado como destino principal (no se toca el
  // ProjectPlan ni sus fases -- solo esta referencia en la tarea).
  if (task.planId !== null) {
    await prisma.projectTask.update({ where: { id: task.id }, data: { planId: null } });
    console.log("A. planId removido de la tarea (antes:", task.planId, ")");
  } else {
    console.log("A. planId ya era null -- sin cambios (idempotente).");
  }

  // B. Quitar los 2 links de forma (Rectangular/Circular hacia los
  // standalones) exclusivos de esta tarea -- confirmado que ninguna otra
  // ProjectTask los usa. Los Module en sí NO se tocan ni se eliminan.
  const removed = await prisma.projectTaskModule.deleteMany({
    where: {
      taskId: task.id,
      module: {
        slug: { in: ["piscina-rectangular-hormigon-armado", "piscina-circular-hormigon-armado"] },
      },
    },
  });
  console.log(`B. ${removed.count} ProjectTaskModule de forma (Rectangular/Circular) removidos de la tarea.`);

  // C. Vincular (o confirmar ya vinculado) piscina-integral como único
  // ProjectTaskModule de la tarea.
  const existingIntegralLink = await prisma.projectTaskModule.findFirst({
    where: { taskId: task.id, moduleId: integralModule.id },
    select: { id: true },
  });

  if (existingIntegralLink) {
    console.log("C. Link a piscina-integral ya existía (id:", existingIntegralLink.id, ") -- sin duplicar.");
  } else {
    const created = await prisma.projectTaskModule.create({
      data: { taskId: task.id, moduleId: integralModule.id, order: 0 },
    });
    console.log("C. Link a piscina-integral creado (id:", created.id, ").");
  }

  const finalLinks = await prisma.projectTaskModule.findMany({
    where: { taskId: task.id },
    include: { module: { select: { slug: true } } },
    orderBy: { order: "asc" },
  });
  console.log(
    "ESTADO FINAL moduleLinks:",
    JSON.stringify(finalLinks.map((l) => ({ module: l.module.slug, label: l.label, order: l.order })))
  );

  console.log("OK — construir-una-piscina ahora apunta a piscina-integral como destino principal.");
}

main().finally(() => prisma.$disconnect());
