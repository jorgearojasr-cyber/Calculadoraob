import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 4 — Radier: dosificación referencial por saco (baldes de 10L) +
// refuerzo informativo (13-ago-2026).
//
// DOSIFICACIÓN POR SACO: se agregan 3 Formula nuevas (dosif_arena_baldes,
// dosif_grava_baldes, dosif_agua_litros) que NO introducen ninguna tabla
// nueva — se derivan de las MISMAS Variables ya citadas a Polpaico/
// NCh170:2016 (sacos-cemento-por-m3, arena-m3-por-m3, grava-m3-por-m3,
// agua-litros-por-m3) que ya alimentan "materiales totales". Esto es
// deliberado: si mañana se corrige uno de esos 4 valores base, la
// dosificación por saco se actualiza sola — nunca puede quedar
// matemáticamente incoherente con los totales (auditado a mano: patio/
// antepiso = 7 baldes arena + 6 baldes grava + 10L agua por saco;
// estacionamiento/bodega = 4 baldes arena + 5 baldes grava + 10L agua por
// saco — ambos casos dan valores enteros exactos, sin redondeo real).
// Cross-validado contra la tabla oficial Cbb para radier (1 saco, 5
// baldes arena, 5,5 baldes grava, 1 balde agua) — nuestros 2 casos
// (7/6 y 4/5) quedan a ambos lados de esa referencia genérica, consistente
// con que Cbb no distingue exigencia por uso y nosotros sí.
//
// REFUERZO: se reintroduce SOLO como Variable informativa (mismo patrón
// que el "malla_recomendada" original, commit 5cec386) — NO se reactiva
// el módulo "malla-electrosoldada" (sigue despublicado, decisión de
// alcance del 09-ago-2026) y NO se recomienda un código de malla
// específico por uso: la propia Norm OBRA-MALLA-ELECTROSOLDADA ya
// existente dice explícitamente "La elección del tipo de malla debe
// provenir de tu plano o ingeniero, no de esta calculadora" — se
// reutiliza esa misma Norm para el disclaimer, sin inventar una relación
// uso→código ACMA que ninguna fuente pudo sustentar con precisión
// confiable durante la investigación de esta fase.

const MODULE_ID = "cmrrf8ktc000facseuo9fbnvu"; // radier
const NORM_DOSIFICACION = "cmrs8df6v000hv4se1c6cot4d"; // OBRA-RADIER-ESPESOR-DOSIF
const NORM_MALLA = "cmru0cs3t0000fksefp5kni2l"; // OBRA-MALLA-ELECTROSOLDADA

async function main() {
  console.log("=== 1. Reordenar: Volumen de hormigón antes de Cemento/Arena/Gravilla/Agua ===");
  const reorder: { key: string; order: number }[] = [
    { key: "volumen_total", order: 6 },
    { key: "cemento_manual", order: 7 },
    { key: "arena_manual", order: 8 },
    { key: "gravilla_manual", order: 9 },
    { key: "agua_manual", order: 10 },
  ];
  for (const { key, order } of reorder) {
    const f = await prisma.formula.findFirst({ where: { moduleId: MODULE_ID, key } });
    if (!f) throw new Error(`No se encontró Formula "${key}"`);
    await prisma.formula.update({ where: { id: f.id }, data: { order } });
    console.log(`  OK: "${key}" -> order ${order}`);
  }

  console.log("\n=== 2. Nuevas Formula: dosificación por saco (baldes de 10L) ===");

  const existingArena = await prisma.formula.findFirst({ where: { moduleId: MODULE_ID, key: "dosif_arena_baldes" } });
  if (!existingArena) {
    await prisma.formula.create({
      data: {
        moduleId: MODULE_ID,
        key: "dosif_arena_baldes",
        label: "Arena",
        unit: "balde de 10 L",
        expression: {
          op: "round",
          value: { op: "/", args: [{ op: "*", args: [{ var: "arena-m3-por-m3" }, 100] }, { var: "sacos-cemento-por-m3" }] },
        },
        condition: { op: "==", args: [{ var: "metodo_hormigon" }, { str: "manual" }] },
        isResult: true,
        isSecondary: true,
        note: 'Misma dosificación por m³ que ya usa el cálculo de materiales totales — {arena-m3-por-m3} m³ de arena por cada {sacos-cemento-por-m3} sacos de cemento, expresado por saco. Fuente: Polpaico, "Dosificaciones" (jul-2020, tabla sobre NCh170:2016).',
        normId: NORM_DOSIFICACION,
        order: 17,
      },
    });
    console.log("  OK: creada dosif_arena_baldes");
  } else {
    console.log("  SKIP: dosif_arena_baldes ya existe");
  }

  const existingGrava = await prisma.formula.findFirst({ where: { moduleId: MODULE_ID, key: "dosif_grava_baldes" } });
  if (!existingGrava) {
    await prisma.formula.create({
      data: {
        moduleId: MODULE_ID,
        key: "dosif_grava_baldes",
        label: "Gravilla",
        unit: "balde de 10 L",
        expression: {
          op: "round",
          value: { op: "/", args: [{ op: "*", args: [{ var: "grava-m3-por-m3" }, 100] }, { var: "sacos-cemento-por-m3" }] },
        },
        condition: { op: "==", args: [{ var: "metodo_hormigon" }, { str: "manual" }] },
        isResult: true,
        isSecondary: true,
        note: 'Misma dosificación por m³ que ya usa el cálculo de materiales totales — {grava-m3-por-m3} m³ de gravilla por cada {sacos-cemento-por-m3} sacos de cemento, expresado por saco. Fuente: Polpaico, "Dosificaciones" (jul-2020, tabla sobre NCh170:2016).',
        normId: NORM_DOSIFICACION,
        order: 18,
      },
    });
    console.log("  OK: creada dosif_grava_baldes");
  } else {
    console.log("  SKIP: dosif_grava_baldes ya existe");
  }

  const existingAgua = await prisma.formula.findFirst({ where: { moduleId: MODULE_ID, key: "dosif_agua_litros" } });
  if (!existingAgua) {
    await prisma.formula.create({
      data: {
        moduleId: MODULE_ID,
        key: "dosif_agua_litros",
        label: "Agua",
        unit: "litro",
        expression: {
          op: "round",
          value: { op: "/", args: [{ var: "agua-litros-por-m3" }, { var: "sacos-cemento-por-m3" }] },
        },
        condition: { op: "==", args: [{ var: "metodo_hormigon" }, { str: "manual" }] },
        isResult: true,
        isSecondary: true,
        note: 'Misma dosificación por m³ que ya usa el cálculo de materiales totales — {agua-litros-por-m3} litros de agua por cada {sacos-cemento-por-m3} sacos de cemento, expresado por saco. La cantidad real de agua es aproximada y puede variar según la humedad de la arena y la gravilla, y la trabajabilidad deseada de la mezcla. Fuente: Polpaico, "Dosificaciones" (jul-2020, tabla sobre NCh170:2016).',
        normId: NORM_DOSIFICACION,
        order: 19,
      },
    });
    console.log("  OK: creada dosif_agua_litros");
  } else {
    console.log("  SKIP: dosif_agua_litros ya existe");
  }

  console.log("\n=== 3. Nueva Variable: refuerzo_recomendado (informativa, sin código ACMA prescriptivo) ===");
  const existingRefuerzo = await prisma.variable.findFirst({ where: { moduleId: MODULE_ID, key: "refuerzo_recomendado" } });
  if (!existingRefuerzo) {
    await prisma.variable.create({
      data: {
        moduleId: MODULE_ID,
        key: "refuerzo_recomendado",
        label: "Refuerzo",
        valueType: "TEXT",
        source: {
          type: "LOOKUP",
          questionKey: "uso",
          table: {
            patio_terraza:
              "Opcional para uso peatonal. Si habrá tránsito ocasional de vehículos livianos, conviene considerar malla de refuerzo — consúltalo con tu maestro o calculista.",
            antepiso_interior:
              "Un radier interior de uso liviano habitualmente no requiere malla de refuerzo. Si tendrá cargas puntuales importantes, consúltalo con tu maestro.",
            estacionamiento:
              "Recomendado considerarlo. Al tener tránsito vehicular, es habitual reforzar con malla electrosoldada — el tipo y calibre debe definirlo tu maestro o un profesional según tu proyecto.",
            bodega_industrial:
              "Recomendado considerarlo. Para uso de bodega o carga es habitual reforzar con malla electrosoldada — para cargas pesadas o maquinaria, se recomienda un diseño específico con un profesional.",
          },
        },
        isResult: true,
        normId: NORM_MALLA,
        order: 7,
      },
    });
    console.log("  OK: creada Variable refuerzo_recomendado");
  } else {
    console.log("  SKIP: refuerzo_recomendado ya existe");
  }

  console.log("\n=== Verificación ===");
  const formulas = await prisma.formula.findMany({ where: { moduleId: MODULE_ID }, orderBy: { order: "asc" }, select: { key: true, order: true } });
  console.log(formulas.map((f) => `${f.order}:${f.key}`).join(", "));
}

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
