import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.4, Fase 2 (07-ago-2026): mismo patrón corregido en
// Fase 1 para cambiar-o-instalar-un-wc → aviso-instalacion-nueva. La
// Formula "aviso-estructura-aparte" (cubierta) tenía isResult:true y
// condition:null (aparece SIEMPRE, en el 100% de los cálculos de Cubierta)
// mostrando "Estructura del techo (cerchas y costaneras): 1 aviso" como si
// fuera una cantidad de material. Se mueve el mismo texto a una Norm
// dedicada (mecanismo NormsDisclaimer ya usado en toda la app), sin tocar
// el motor de fórmulas ni el framework visual. Severidad normal (sin
// reinforcedWarning) — es un aviso informativo de alcance, no un riesgo de
// seguridad.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const formula = await prisma.formula.findFirstOrThrow({
    where: { key: "aviso-estructura-aparte", module: { slug: "cubierta" } },
  });

  if (formula.normId) {
    throw new Error("La formula ya tiene una Norm asociada — revisar antes de continuar.");
  }

  const norm = await prisma.norm.create({
    data: {
      code: "OBRA-CUBIERTA-ESTRUCTURA-APARTE",
      title: "Aviso — estructura del techo no incluida en este cálculo",
      scope: "Cálculo de cubierta (planchas/tejas) — no incluye cerchas ni costaneras.",
      verificationStatus: "PRACTICA_GENERAL_NO_VERIFICADA",
      note: formula.note ?? "",
      reinforcedWarning: false,
    },
  });

  await prisma.formula.update({
    where: { id: formula.id },
    data: { isResult: false, normId: norm.id },
  });

  console.log("OK — aviso-estructura-aparte movido a Norm/NormsDisclaimer, ya no aparece como material.");
}

main().finally(() => prisma.$disconnect());
