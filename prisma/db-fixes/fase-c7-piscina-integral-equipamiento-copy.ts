import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../src/generated/prisma/client";

// FASE C7 -- actualiza el texto (Variable.source.default) de los criterios
// de Equipamiento para que ResultScreen (InfoResult) muestre EXACTAMENTE el
// mismo copy que ya se ve en vivo durante el paso Equipamiento del wizard
// (pool-equipment-step.tsx) -- de lo contrario quedarían 2 textos distintos
// para el mismo criterio según en qué pantalla se mire.
//
// Solo copy (source.default de un Variable LOOKUP con tabla vacía, ver
// fase-c5-piscina-integral-equipamiento.ts) -- no es una Formula, no hay
// expression/condition que tocar. Bomba suma el párrafo de TDH educativo
// (sección 8/14 del pedido: rango 8-14 m, nunca un valor único, nunca HP/
// modelo). Skimmers se amplía con "ubicación de los retornos" (sección 16).
// Retornos e Filtro quedan sin cambios (ya coinciden).
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  async function updateVariableDefault(key: string, newDefault: string) {
    const variable = await prisma.variable.findUniqueOrThrow({
      where: { moduleId_key: { moduleId: mod.id, key } },
    });
    const source = variable.source as { type: string; questionKey: string; table: Record<string, unknown> };
    const currentDefault = (variable.source as { default?: string }).default;
    if (currentDefault === newDefault) {
      console.log(`${key}: ya está actualizado -- sin cambios (idempotente).`);
      return;
    }
    await prisma.variable.update({
      where: { id: variable.id },
      data: { source: { ...source, default: newDefault } as Prisma.InputJsonValue },
    });
    console.log(`${key}: default actualizado.`);
  }

  await updateVariableDefault(
    "equipamiento-bomba-criterio",
    "Selecciona una bomba cuya curva de funcionamiento entregue al menos el caudal objetivo, considerando la altura manométrica y las pérdidas de carga de la instalación. Como referencia educativa, muchas instalaciones residenciales trabajan en un rango aproximado de 8–14 m de altura manométrica total (TDH). El TDH real depende de las tuberías, su longitud y diámetro, los accesorios, el desnivel y el filtro — no se puede calcular sin esos datos."
  );

  await updateVariableDefault(
    "equipamiento-skimmers-criterio",
    "Definir según diseño hidráulico. La cantidad depende de la superficie, geometría, circulación y ubicación de los retornos."
  );

  console.log(`OK — copy de Equipamiento sincronizado. Module id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
