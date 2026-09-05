import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// FASE C7 -- "Ocultar el radio exterior del ResultScreen para piscina
// circular. Mantenerlo internamente para cálculo." (decisión aprobada,
// sección 1.E).
//
// Cambio de METADATA únicamente -- `isResult: false` -- NUNCA se toca
// `expression` ni `condition` de "radio-ext" (fase-c1-piscina-integral.ts).
// `formulaResults[formula.key] = value` en el motor (ver
// src/lib/formula-engine/index.ts) se asigna SIEMPRE, sin importar
// `isResult` -- por eso "radio-ext" sigue disponible vía {ref:"radio-ext"}
// para "hormigon-fondo-circ"/"hormigon-muros-circ" exactamente igual que
// antes (ninguna Formula que lo referencia cambia). `isResult:false` solo
// lo saca del array `results` que llega a ResultScreen -- mismo patrón ya
// usado hoy para "radio" (radio INTERIOR, ya isResult:false desde C1) y
// para los "-bruto-"/"-total-rect"/"-total-circ" intermedios.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  const formula = await prisma.formula.findUniqueOrThrow({
    where: { moduleId_key: { moduleId: mod.id, key: "radio-ext" } },
  });

  if (formula.isResult === false) {
    console.log('"radio-ext" ya es isResult:false -- sin cambios (idempotente).');
  } else {
    await prisma.formula.update({ where: { id: formula.id }, data: { isResult: false } });
    console.log('"radio-ext": isResult true -> false (expression/condition intactas).');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
