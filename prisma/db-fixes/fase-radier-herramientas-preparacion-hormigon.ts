import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// RADIER — coherencia herramientas/pasos: el módulo YA calcula cargas de
// betonera (Formula "numero_cargas_betonera") y dosificación por carga
// (cemento/arena/gravilla/agua_por_carga) cuando metodo_hormigon=manual,
// pero la lista de herramientas nunca mencionaba la betonera ni un
// recipiente para medir por carga — inconsistencia entre lo que el
// cálculo asume y lo que la guía dice que hay que tener. Se agregan 2
// ítems, sin quitar ni reordenar el resto (además de "Placa compactadora"
// ya agregada en la fase anterior).

async function main() {
  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "radier" }, include: { guide: true } });
  if (!mod.guide) throw new Error("Radier no tiene ModuleGuide.");

  const additions = ["Betonera u hormigonera (si preparas el hormigón tú mismo)", "Baldes o recipiente de medida (para dosificar por carga)"];
  const missing = additions.filter((t) => !mod.guide!.tools.includes(t));
  if (missing.length === 0) {
    console.log("SKIP: las herramientas ya estaban presentes.");
    return;
  }

  // Se insertan después de "Placa compactadora" (preparación del terreno)
  // y antes de "Rastrillo" (colocación) — quedan agrupadas junto al resto
  // de herramientas de preparación del hormigón, sin reordenar el resto.
  const tools = [...mod.guide.tools];
  const insertAt = tools.indexOf("Pala") + 1 || tools.length;
  tools.splice(insertAt, 0, ...missing);

  await prisma.moduleGuide.update({ where: { id: mod.guide.id }, data: { tools } });
  console.log("OK: herramientas actualizadas ->", tools);
}

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
