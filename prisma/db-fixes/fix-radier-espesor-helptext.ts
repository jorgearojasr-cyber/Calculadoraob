import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 1, sprint UX V1.2 (04-ago-2026): "Espesor" pasa a "Espesor
// recomendado" (cambio de label hardcodeado en module-visual-config.ts,
// no de este script) + un helpText propio, para que ya no dependa de
// heredar el tip de rango de largo/ancho (ver volume-step.tsx: ahora se
// muestra un tip por campo, no solo el primero del grupo). Rango tomado
// de `espesorPorUso` en seed-radier.ts (7-12cm) — mismo patrón "entre X y
// Y" que ya usa range-hint.ts para largo/ancho (BUG-008).
const HELP_TEXT =
  "El espesor recomendado varía entre 7 y 12 cm según el uso que elegiste (patio o terraza, antepiso interior, estacionamiento o bodega). Ya viene precargado según tu respuesta anterior, pero puedes ajustarlo si tu maestro o la especificación de tu proyecto indica otro valor.";

async function main() {
  const before = await prisma.question.findFirst({ where: { module: { slug: "radier" }, key: "espesor_cm" } });
  console.log("ANTES:", JSON.stringify({ key: before?.key, helpText: before?.helpText }, null, 2));

  const result = await prisma.question.updateMany({
    where: { module: { slug: "radier" }, key: "espesor_cm" },
    data: { helpText: HELP_TEXT },
  });
  console.log("Filas actualizadas:", result.count);

  const after = await prisma.question.findFirst({ where: { module: { slug: "radier" }, key: "espesor_cm" } });
  console.log("DESPUÉS:", JSON.stringify({ key: after?.key, helpText: after?.helpText }, null, 2));
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
