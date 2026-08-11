import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.4, Fase 1 (07-ago-2026): la fórmula
// "galones-sellador-exterior" de pintar-fachada-exterior asumía 35 m²/galón
// (Norm OBRA-PINTURA-EXTERIOR-RENDIMIENTOS, PRACTICA_GENERAL_NO_VERIFICADA,
// sin fuente citada). El módulo hermano "pintura" usa 5.3 m²/L (~20
// m²/galón) para el mismo tipo de sellador, citado contra la ficha técnica
// real de Soquina Sellador Fijador Plus Acrílico (Norm
// OBRA-PINTURA-RENDIMIENTOS, CITADO: "rendimiento teórico 20±5 m²/gal,
// 15-25 m²/gal"). 35 m²/gal está muy por encima de ese rango verificado —
// inconsistencia real confirmada, no solo de texto. Se alinea fachada al
// mismo criterio citado que ya usa pintura, y se referencia la misma Norm
// verificada en vez de la práctica genérica no verificada.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CITED_SELLADOR_NORM_ID = "cmrs9sy240000qkseceo9dily"; // OBRA-PINTURA-RENDIMIENTOS (CITADO)

async function main() {
  const formula = await prisma.formula.findFirstOrThrow({
    where: { key: "galones-sellador-exterior", module: { slug: "pintar-fachada-exterior" } },
  });

  const before = formula.expression as unknown as {
    op: string;
    value: { op: string; args: [{ var: string }, number] };
  };
  if (before.value.args[1] !== 35) {
    throw new Error(`Valor esperado 35 en la expresión, encontrado: ${before.value.args[1]}`);
  }

  await prisma.formula.update({
    where: { id: formula.id },
    data: {
      expression: {
        op: "ceil",
        value: { op: "/", args: [before.value.args[0], 20] },
      },
      normId: CITED_SELLADOR_NORM_ID,
    },
  });

  console.log("OK — rendimiento de sellador en pintar-fachada-exterior alineado a 20 m²/galón (Norm citada).");
}

main().finally(() => prisma.$disconnect());
