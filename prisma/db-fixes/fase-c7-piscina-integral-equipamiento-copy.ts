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

  // FASE C7-B (2026-09-05) -- copy práctico para usuario no técnico (Etapa
  // A aprobada, secciones 16/21/25). Mismo criterio técnico de siempre
  // (nunca HP/modelo/marca, nunca TDH único) -- solo más orientado a "qué
  // debo buscar/comprar".
  await updateVariableDefault(
    "equipamiento-bomba-criterio",
    "Busca una bomba cuya curva de funcionamiento entregue al menos el caudal objetivo en las condiciones reales de tu instalación (altura manométrica y pérdidas de carga incluidas). Como referencia educativa, muchas instalaciones residenciales trabajan en un rango aproximado de 8–14 m de altura manométrica total (TDH). Este rango es solo orientativo: el TDH real depende del trazado, diámetro de tuberías, accesorios, desniveles y filtro de tu instalación."
  );

  // Nota: "Filtro" no tiene Variable/InfoResult propio en ResultScreen (solo
  // existe como texto fijo en el wizard, pool-equipment-step.tsx) -- nada
  // que sincronizar acá.

  // Sin número acá a propósito: el número orientativo depende de la
  // superficie de agua de ESTE proyecto (ver skimmersReferenciaOrientativa,
  // result-screen-helpers.ts), que ResultScreen agrega en vivo junto a
  // este criterio base -- este texto queda como el criterio SIEMPRE
  // visible, con o sin superficie disponible.
  await updateVariableDefault(
    "equipamiento-skimmers-criterio",
    "La cantidad depende de la superficie, geometría, circulación y ubicación de los retornos."
  );

  await updateVariableDefault(
    "equipamiento-retornos-criterio",
    "Los retornos devuelven el agua filtrada a la piscina y ayudan a generar una circulación uniforme. La cantidad y ubicación deben definirse según la geometría, el caudal y el diseño hidráulico."
  );

  console.log(`OK — copy de Equipamiento sincronizado. Module id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
