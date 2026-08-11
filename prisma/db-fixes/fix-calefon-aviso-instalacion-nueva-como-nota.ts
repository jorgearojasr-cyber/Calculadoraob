import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.4, Fase 2 (07-ago-2026): mismo patrón corregido en
// Fase 1 para cambiar-o-instalar-un-wc → aviso-instalacion-nueva. La
// Formula "aviso-instalacion-nueva-calefon" (instalar-un-calefon-a-gas)
// tenía isResult:true, mostrando "Cañería de gas nueva: 1 trabajo
// adicional (requiere instalador certificado)" como si fuera una cantidad
// de material a comprar. Se mueve el mismo texto a una Norm dedicada
// (mecanismo NormsDisclaimer ya usado en toda la app), sin tocar el motor
// de fórmulas ni el framework visual. La formula no tenía Norm asociada
// antes (sin severidad previa que reclasificar) — se usa
// reinforcedWarning:false, igual que el caso análogo ya resuelto en WC
// (mismo tipo de aviso: "requiere profesional certificado para la
// conexión/tramo nuevo"), solo se migra el mecanismo de presentación, no
// se evalúa ni cambia el nivel de riesgo.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const formula = await prisma.formula.findFirstOrThrow({
    where: { key: "aviso-instalacion-nueva-calefon", module: { slug: "instalar-un-calefon-a-gas" } },
  });

  if (formula.normId) {
    throw new Error("La formula ya tiene una Norm asociada — revisar antes de continuar.");
  }

  const norm = await prisma.norm.create({
    data: {
      code: "OBRA-CALEFON-INSTALACION-NUEVA-CANERIA",
      title: "Aviso — calefón en instalación nueva requiere cañería de gas adicional",
      scope: "Instalación de un calefón a gas donde no existía cañería de gas antes.",
      verificationStatus: "PRACTICA_GENERAL_NO_VERIFICADA",
      note: formula.note ?? "",
      reinforcedWarning: false,
    },
  });

  await prisma.formula.update({
    where: { id: formula.id },
    data: { isResult: false, normId: norm.id },
  });

  console.log("OK — aviso-instalacion-nueva-calefon movido a Norm/NormsDisclaimer, ya no aparece como material.");
}

main().finally(() => prisma.$disconnect());
