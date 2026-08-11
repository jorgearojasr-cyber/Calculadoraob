import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 6, sprint UX V1.2 (04-ago-2026): "Si el cálculo entrega menos de un
// galón, mostrar recomendación del envase más conveniente" — 100%
// data-driven, sin ningún `if` de Pintura en React. Se agrega como una
// fórmula secundaria más (mismo patrón ya usado por
// `pintura-litros-referencia`/`sellador-litros-referencia`: isSecondary,
// se anida bajo el resultado principal inmediatamente anterior).
//
// `condition` compara directamente contra `litros-pintura-base` (la
// fórmula que ya calcula el total en litros, sin importar qué presentación
// eligió el usuario) — así aplica sin importar si el usuario venía
// comprando por galón, cuarto o cuñete. `order: 22` la ubica después de
// `pintura-litros-referencia` (order 21) y antes de que empiece el grupo
// de sellador (order 23+), para que se anide bajo el resultado de PINTURA,
// nunca bajo el de sellador.
async function main() {
  const pinturaModule = await prisma.module.findUnique({ where: { slug: "pintura" } });
  if (!pinturaModule) throw new Error("No se encontró el módulo 'pintura'.");

  const existing = await prisma.formula.findUnique({
    where: { moduleId_key: { moduleId: pinturaModule.id, key: "recomendacion-envase-pequeno" } },
  });
  if (existing) {
    console.log("Ya existe la fórmula 'recomendacion-envase-pequeno' — no se duplica.");
    return;
  }

  const created = await prisma.formula.create({
    data: {
      moduleId: pinturaModule.id,
      key: "recomendacion-envase-pequeno",
      label: "Envase más conveniente",
      unit: "cuarto de galón",
      order: 22,
      isResult: true,
      isSecondary: true,
      condition: { op: "<", args: [{ ref: "litros-pintura-base" }, 3.785] },
      expression: { op: "ceil", value: { op: "/", args: [{ ref: "litros-pintura-base" }, 0.946] } },
      note: "Necesitas menos de un galón para este trabajo — un cuarto de galón puede ajustarse mejor a lo que realmente vas a usar, sin comprar de más.",
    },
  });

  console.log("Fórmula creada:", JSON.stringify(created, null, 2));
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
