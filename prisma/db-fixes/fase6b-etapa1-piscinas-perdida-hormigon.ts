import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 6B — Etapa 1 (10-ago-2026): corrige el 0% de pérdida de hormigón en
// ambas piscinas (bug confirmado en Fase 6). Reutiliza el LossFactor/Norm
// "perdida_hormigon" (7%, OBRA-HORMIGON-DOSIFICACION-MANUAL) ya usado en
// radier/fundacion/muro-de-hormigon-armado/pilar-columna/cadena — mismo
// fenómeno físico (pérdida de vaciado de hormigón in situ), no se crea un
// LossFactor ni una Norm nueva.
//
// NO se corrige el volumen de agua (usa profundidad total, sin nivel de
// resguardo/coping) — no existe fuente para un valor de freeboard, per
// instrucción explícita de no inventar. Queda documentado como pendiente
// en la Norm, sin tocar la fórmula.

async function main() {
  const norm = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-HORMIGON-DOSIFICACION-MANUAL" } });

  // Documentación: el scope ya reutilizado por otros módulos ahora también
  // cubre piscinas — no se inventa un valor, solo se refleja el reuso real.
  if (!norm.scope.includes("piscinas")) {
    await prisma.norm.update({
      where: { id: norm.id },
      data: {
        scope: norm.scope.replace(
          "fundaciones, muros y pilares de hormigón armado.",
          "fundaciones, muros, pilares y piscinas de hormigón armado."
        ),
      },
    });
    console.log("OK scope de OBRA-HORMIGON-DOSIFICACION-MANUAL actualizado para incluir piscinas");
  } else {
    console.log("SKIP (scope ya menciona piscinas)");
  }

  for (const slug of ["piscina-circular-hormigon-armado", "piscina-rectangular-hormigon-armado"]) {
    console.log(`\n--- ${slug} ---`);
    const mod = await prisma.module.findUniqueOrThrow({ where: { slug }, include: { formulas: true, lossFactors: true } });

    const fHormigon = mod.formulas.find((f) => f.key === "hormigon")!;
    const existingBruto = mod.formulas.find((f) => f.key === "hormigon-bruto");

    if (!existingBruto) {
      // hormigon-bruto toma la expresión y el order actuales de "hormigon"
      // (sin pérdida) — hormigon-bruto NO es resultado, es el paso interno.
      await prisma.formula.create({
        data: {
          moduleId: mod.id,
          key: "hormigon-bruto",
          label: "Hormigón (bruto, sin pérdida)",
          unit: "m³",
          expression: fHormigon.expression as object,
          isResult: false,
          order: fHormigon.order,
        },
      });
      console.log("  OK creada hormigon-bruto (misma expresión que tenía 'hormigon', sin pérdida)");
    } else {
      console.log("  SKIP (hormigon-bruto ya existe)");
    }

    const existingLossFactor = mod.lossFactors.find((lf) => lf.key === "perdida_hormigon");
    if (!existingLossFactor) {
      await prisma.lossFactor.create({
        data: {
          moduleId: mod.id,
          key: "perdida_hormigon",
          label: "Pérdida de hormigón en vaciado",
          percentage: 0.07,
          normId: norm.id,
        },
      });
      console.log("  OK creado LossFactor perdida_hormigon=7% (mismo Norm que radier/fundación)");
    } else {
      console.log("  SKIP (LossFactor perdida_hormigon ya existe)");
    }

    // "hormigon" (isResult:true) pasa a aplicar el LossFactor sobre
    // hormigon-bruto. Order=100: nada depende de "hormigon" río abajo
    // (es un resultado terminal), así que no hace falta renumerar el
    // resto de fórmulas del módulo — solo debe evaluarse después de
    // hormigon-bruto, que sigue en su order original.
    await prisma.formula.update({
      where: { id: fHormigon.id },
      data: {
        expression: { op: "lossFactor", key: "perdida_hormigon", value: { ref: "hormigon-bruto" } },
        order: 100,
        note: "Incluye 7% de pérdida de hormigón en vaciado (mismo criterio ya aplicado a otros elementos de hormigón armado vaciado in situ en esta app — no se encontró una fuente específica para piscinas, se reutiliza la práctica de obra ya citada).",
      },
    });
    console.log("  OK 'hormigon' ahora aplica LossFactor formal (antes: 0% de pérdida, bug confirmado en Fase 6)");
  }

  console.log("\n=== Etapa 1 completada — volumen de agua NO fue tocado (sin fuente para nivel de resguardo/coping) ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
