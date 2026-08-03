import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// BUG-008 (auditoría funcional 02-ago-2026, Grupo 2 V1.1): Largo/Ancho de
// Radier no tenían `helpText`, por lo que el motor de advertencia suave de
// rango (src/lib/range-hint.ts, ya existente) no tenía nada que parsear y
// un valor como 999999 no generaba ninguna señal. Se agrega un helpText
// con el patrón "entre X y Y" que ese motor ya sabe interpretar — decisión
// confirmada con Jorge (2026-08-02): se acepta que esto también muestre un
// cuadro de tip visible bajo los campos (efecto esperado del mecanismo
// existente, no oculto).
const HELP_TEXT = "Lo típico en un radier residencial es entre 2 y 15 metros por lado.";

async function main() {
  const questions = await prisma.question.findMany({
    where: { module: { slug: "radier" }, key: { in: ["largo", "ancho"] } },
  });
  console.log("ANTES:", JSON.stringify(questions.map((q) => ({ key: q.key, helpText: q.helpText })), null, 2));

  const result = await prisma.question.updateMany({
    where: { module: { slug: "radier" }, key: { in: ["largo", "ancho"] } },
    data: { helpText: HELP_TEXT },
  });
  console.log("Filas actualizadas:", result.count);

  const after = await prisma.question.findMany({
    where: { module: { slug: "radier" }, key: { in: ["largo", "ancho"] } },
  });
  console.log("DESPUÉS:", JSON.stringify(after.map((q) => ({ key: q.key, helpText: q.helpText })), null, 2));
}

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
