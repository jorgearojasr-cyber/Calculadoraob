import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 5 — Radier: limpieza del resultado (13-ago-2026).
//
// 1) BETONERA: se pidió sacar la tarjeta "Dosificación por carga de
// betonera" del resultado (queda una sola receta, la de por saco de la
// Fase 4) SIN borrar la lógica del motor. isResult:false logra
// exactamente eso — la fórmula se sigue evaluando (formulaResults sigue
// disponible), solo deja de exponerse en `results` (ver
// src/lib/formula-engine/index.ts línea ~176: el push a `results` está
// gateado por isResult, el cálculo mismo no).
//
// 2) REFUERZO: se reemplaza la Variable única "refuerzo_recomendado" (una
// oración larga) por 2 Variables separadas — "refuerzo_estado" (la
// palabra clave: OPCIONAL/RECOMENDADA/etc., para jerarquía visual) y
// "refuerzo_explicacion" (el texto de contexto) — el componente nuevo
// (RefuerzoCard) arma la tarjeta a partir de ambas + una nota estática
// (no depende de datos, vive en el componente). Ninguna de las dos cita
// normId — la advertencia de "no reemplaza a un ingeniero" queda escrita
// directo en la nota estática de la tarjeta, no en el mecanismo genérico
// de NormsDisclaimer (que por tener reinforcedWarning:true en la Norm
// citada antes disparaba el bloque rojo "Riesgo estructural o de
// seguridad" — confuso en su ubicación, ver feedback de esta fase).

const MODULE_ID = "cmrrf8ktc000facseuo9fbnvu"; // radier

async function main() {
  console.log("=== 1. Betonera: isResult -> false (sigue calculándose, deja de exponerse) ===");
  const betoneraKeys = ["numero_cargas_betonera", "cemento_por_carga", "arena_por_carga", "gravilla_por_carga", "agua_por_carga"];
  for (const key of betoneraKeys) {
    const f = await prisma.formula.findFirst({ where: { moduleId: MODULE_ID, key } });
    if (!f) throw new Error(`No se encontró Formula "${key}"`);
    await prisma.formula.update({ where: { id: f.id }, data: { isResult: false } });
    console.log(`  OK: "${key}" isResult=false`);
  }

  console.log("\n=== 2. Refuerzo: reemplazar Variable única por estado + explicación ===");
  const old = await prisma.variable.findFirst({ where: { moduleId: MODULE_ID, key: "refuerzo_recomendado" } });
  if (old) {
    await prisma.variable.delete({ where: { id: old.id } });
    console.log("  OK: eliminada Variable refuerzo_recomendado (Fase 4)");
  } else {
    console.log("  SKIP: refuerzo_recomendado no existía");
  }

  const existingEstado = await prisma.variable.findFirst({ where: { moduleId: MODULE_ID, key: "refuerzo_estado" } });
  if (!existingEstado) {
    await prisma.variable.create({
      data: {
        moduleId: MODULE_ID,
        key: "refuerzo_estado",
        label: "Refuerzo — estado",
        valueType: "TEXT",
        source: {
          type: "LOOKUP",
          questionKey: "uso",
          table: {
            patio_terraza: "OPCIONAL",
            antepiso_interior: "HABITUALMENTE NO REQUERIDA",
            estacionamiento: "RECOMENDADA",
            bodega_industrial: "RECOMENDADA",
          },
        },
        isResult: true,
        normId: null,
        order: 7,
      },
    });
    console.log("  OK: creada Variable refuerzo_estado");
  } else {
    console.log("  SKIP: refuerzo_estado ya existe");
  }

  const existingExplicacion = await prisma.variable.findFirst({ where: { moduleId: MODULE_ID, key: "refuerzo_explicacion" } });
  if (!existingExplicacion) {
    await prisma.variable.create({
      data: {
        moduleId: MODULE_ID,
        key: "refuerzo_explicacion",
        label: "Refuerzo — explicación",
        valueType: "TEXT",
        source: {
          type: "LOOKUP",
          questionKey: "uso",
          table: {
            patio_terraza:
              "Para uso principalmente peatonal, normalmente no es imprescindible en esta configuración. Si habrá tránsito ocasional de vehículos livianos, considera utilizar refuerzo y consulta la solución adecuada con tu maestro o profesional.",
            antepiso_interior:
              "Un radier interior de uso liviano habitualmente no requiere malla de refuerzo. Si tendrá cargas puntuales importantes, consúltalo con tu maestro.",
            estacionamiento:
              "Para un radier destinado a estacionamiento, se recomienda considerar refuerzo. El tipo, calibre y separación deben definirse según las cargas, espesor, base y condiciones del proyecto.",
            bodega_industrial:
              "Para uso de bodega o carga, se recomienda considerar refuerzo. Para cargas pesadas o maquinaria, el tipo y dimensionamiento deben definirse específicamente con un profesional.",
          },
        },
        isResult: true,
        normId: null,
        order: 8,
      },
    });
    console.log("  OK: creada Variable refuerzo_explicacion");
  } else {
    console.log("  SKIP: refuerzo_explicacion ya existe");
  }

  console.log("\n=== Verificación ===");
  const formulas = await prisma.formula.findMany({ where: { moduleId: MODULE_ID, key: { in: betoneraKeys } }, select: { key: true, isResult: true } });
  console.log(formulas);
  const vars = await prisma.variable.findMany({ where: { moduleId: MODULE_ID, key: { in: ["refuerzo_estado", "refuerzo_explicacion", "refuerzo_recomendado"] } }, select: { key: true, normId: true } });
  console.log(vars);
}

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
