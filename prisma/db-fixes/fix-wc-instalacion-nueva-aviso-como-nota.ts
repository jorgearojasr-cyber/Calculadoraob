import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.4, Fase 1 (07-ago-2026): la Formula
// "aviso-instalacion-nueva" (cambiar-o-instalar-un-wc) tenía isResult:true,
// lo que la mostraba en la lista de materiales como si fuera una cantidad a
// comprar ("Conexión de agua/desagüe nueva: 1 conexión (requiere
// gasfitería)"), aunque es puramente informativa (expression constante 1).
// Se mueve el mismo texto a una Norm dedicada, mostrada por el componente
// NormsDisclaimer ya existente (mecanismo ya usado en toda la app para
// advertencias sin cantidad) — la Formula deja de generar una línea de
// resultado pero sigue evaluándose (isResult:false, no isCalculated:false),
// así que sigue "contando" para el pipeline de evaluatedFormulaKeys sin
// tocar el motor de fórmulas ni el framework visual. Mismo contenido
// técnico exacto, solo cambia dónde se muestra.
//
// Nota de alcance: se detectaron otros 3 casos del mismo patrón
// (instalar-un-calefon-a-gas → aviso-instalacion-nueva-calefon;
// piscina-rectangular/circular-hormigon-armado → aviso-tamano-fuera-de-rango)
// que NO se tocan en esta fase — fuera del alcance aprobado explícitamente
// para Fase 1 de Sprint V1.4.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const formula = await prisma.formula.findFirstOrThrow({
    where: { key: "aviso-instalacion-nueva", module: { slug: "cambiar-o-instalar-un-wc" } },
  });

  if (formula.normId) {
    throw new Error("La formula ya tiene una Norm asociada — revisar antes de continuar.");
  }

  const norm = await prisma.norm.create({
    data: {
      code: "OBRA-WC-INSTALACION-NUEVA-CONEXION",
      title: "Aviso — instalación de WC sin cañería previa",
      scope: "Instalación de WC en un punto donde no existía cañería de agua/desagüe antes.",
      verificationStatus: "PRACTICA_GENERAL_NO_VERIFICADA",
      note: formula.note ?? "",
      reinforcedWarning: false,
    },
  });

  await prisma.formula.update({
    where: { id: formula.id },
    data: { isResult: false, normId: norm.id },
  });

  console.log("OK — aviso-instalacion-nueva movido a Norm/NormsDisclaimer, ya no aparece como material.");
}

main().finally(() => prisma.$disconnect());
