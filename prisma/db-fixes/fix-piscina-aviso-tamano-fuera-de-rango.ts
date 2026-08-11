import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.4, Fase 2 (07-ago-2026): mismo patrón corregido en
// Fase 1 para cambiar-o-instalar-un-wc → aviso-instalacion-nueva. La
// Formula "aviso-tamano-fuera-de-rango" (piscina-rectangular y
// piscina-circular hormigon-armado, texto idéntico en ambas) tenía
// isResult:true y usaba el campo `unit` como texto explicativo ("m de
// profundidad — fuera del rango típico residencial"), mostrando algo como
// "2.5 m de profundidad — fuera del rango típico residencial" pegado al
// número, como si fuera una cantidad de material. El `note` ya es
// autocontenido (no depende del valor de profundidad), así que migrar a
// Norm no pierde información.
//
// Severidad: reinforcedWarning:true (decisión explícita del usuario) — el
// aviso indica que el diseño estructural completo debe hacerlo un
// profesional desde cero, a diferencia de cubierta/calefón que son avisos
// informativos de alcance sin ese nivel de riesgo. Ambos módulos comparten
// la misma Norm (mismo texto exacto), igual que el precedente de
// OBRA-PINTURA-RENDIMIENTOS reutilizada entre módulos hermanos.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const targets = [
    { slug: "piscina-rectangular-hormigon-armado" },
    { slug: "piscina-circular-hormigon-armado" },
  ];

  const formulas = await Promise.all(
    targets.map((t) =>
      prisma.formula.findFirstOrThrow({
        where: { key: "aviso-tamano-fuera-de-rango", module: { slug: t.slug } },
      })
    )
  );

  for (const f of formulas) {
    if (f.normId) {
      throw new Error(`La formula de ${f.moduleId} ya tiene una Norm asociada — revisar antes de continuar.`);
    }
  }

  const noteText = formulas[0].note ?? "";
  if (formulas[1].note !== noteText) {
    throw new Error("Las notas de ambos módulos no son idénticas — revisar antes de compartir una sola Norm.");
  }

  const norm = await prisma.norm.create({
    data: {
      code: "OBRA-PISCINA-TAMANO-FUERA-DE-RANGO",
      title: "Aviso — piscina fuera del rango típico residencial",
      scope: "Piscinas de hormigón armado (rectangular y circular) con profundidad > 2 m o área de fondo > 100 m².",
      verificationStatus: "PRACTICA_GENERAL_NO_VERIFICADA",
      note: noteText,
      reinforcedWarning: true,
    },
  });

  for (const f of formulas) {
    await prisma.formula.update({
      where: { id: f.id },
      data: { isResult: false, normId: norm.id },
    });
  }

  console.log("OK — aviso-tamano-fuera-de-rango movido a Norm/NormsDisclaimer (reinforcedWarning) en ambas piscinas.");
}

main().finally(() => prisma.$disconnect());
