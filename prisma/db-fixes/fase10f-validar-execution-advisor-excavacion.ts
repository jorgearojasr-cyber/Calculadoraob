import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 10F (10-ago-2026): promoción editorial aprobada del ExecutionAdvisor
// de "excavacion", de PENDIENTE_VALIDACION a VALIDADO — único cambio que
// hace este script. NO toca reglas, condiciones, opciones, tips,
// reduceConfidence, factorExplanations, preguntas ni fórmulas del módulo.
// Antes de escribir, verifica exhaustivamente que el contenido es
// exactamente el aprobado en Fase 10E (10/5/8 + las 5 combinaciones
// condición->recomendación de las reglas) — si algo no calza, se detiene
// sin escribir nada. Idempotente: si ya está VALIDADO, no hace nada.

type ReglaEsperada = { valores: string[]; opcionRecomendadaKey: string };

const REGLAS_ESPERADAS: ReglaEsperada[] = [
  { valores: ["solo_peatonal"], opcionRecomendadaKey: "manual" },
  { valores: ["no_seguro"], opcionRecomendadaKey: "manual" },
  { valores: ["patio_pasillo"], opcionRecomendadaKey: "mini_excavadora" },
  { valores: ["calle_directo", "tierra-normal"], opcionRecomendadaKey: "retroexcavadora" },
  { valores: ["calle_directo", "con-arcilla-o-piedras"], opcionRecomendadaKey: "excavadora" },
];

function condicionesValores(condiciones: unknown): string[] {
  if (!Array.isArray(condiciones)) return [];
  return condiciones.map((c) => (c as { valor: string }).valor).sort();
}

async function main() {
  const advisors = await prisma.executionAdvisor.findMany({ where: { moduleSlug: "excavacion" } });
  if (advisors.length !== 1) {
    throw new Error(`Se esperaba exactamente 1 ExecutionAdvisor para "excavacion", se encontraron ${advisors.length}. Deteniendo sin escribir.`);
  }
  const advisor = advisors[0];

  if (advisor.estado === "VALIDADO") {
    console.log("SKIP — el ExecutionAdvisor de excavacion ya está en estado VALIDADO. Nada que hacer.");
    return;
  }

  if (advisor.estado !== "PENDIENTE_VALIDACION") {
    throw new Error(`Estado inesperado antes de validar: "${advisor.estado}" (se esperaba PENDIENTE_VALIDACION). Deteniendo sin escribir.`);
  }

  const [options, rules, tips] = await Promise.all([
    prisma.executionAdvisorOption.findMany({ where: { advisorId: advisor.id } }),
    prisma.executionAdvisorRule.findMany({ where: { advisorId: advisor.id } }),
    prisma.executionAdvisorTip.findMany({ where: { advisorId: advisor.id } }),
  ]);

  if (options.length !== 10) throw new Error(`Se esperaban 10 opciones, hay ${options.length}. Deteniendo sin escribir.`);
  if (rules.length !== 5) throw new Error(`Se esperaban 5 reglas, hay ${rules.length}. Deteniendo sin escribir.`);
  if (tips.length !== 8) throw new Error(`Se esperaban 8 tips, hay ${tips.length}. Deteniendo sin escribir.`);

  for (const esperada of REGLAS_ESPERADAS) {
    const valoresEsperados = [...esperada.valores].sort();
    const coincide = rules.some(
      (r) =>
        r.opcionRecomendadaKey === esperada.opcionRecomendadaKey &&
        JSON.stringify(condicionesValores(r.condiciones)) === JSON.stringify(valoresEsperados)
    );
    if (!coincide) {
      throw new Error(
        `No se encontró la regla aprobada en Fase 10E: condiciones=${JSON.stringify(esperada.valores)} -> ${esperada.opcionRecomendadaKey}. Deteniendo sin escribir.`
      );
    }
  }
  console.log("OK — las 5 reglas coinciden exactamente con lo aprobado en Fase 10E (condiciones y recomendación).");

  await prisma.executionAdvisor.update({
    where: { id: advisor.id },
    data: { estado: "VALIDADO" },
  });
  console.log("OK — ExecutionAdvisor de excavacion: PENDIENTE_VALIDACION -> VALIDADO");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
