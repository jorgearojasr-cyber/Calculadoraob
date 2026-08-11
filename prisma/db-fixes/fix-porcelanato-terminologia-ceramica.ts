import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.3, Fase 5 (07-ago-2026): el ModuleGuide de
// "porcelanato-piso" comparte texto base con "ceramica-pisos" y
// "revestimiento-de-muro" (los 3 módulos de revestimiento), pero 2 frases
// quedaron con "cerámica" sin adaptar al material real del módulo
// (porcelanato). ceramica-pisos y revestimiento-de-muro sí trabajan con
// cerámica real, así que no se tocan. Solo contenido — no toca preguntas,
// fórmulas ni resultados.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const mod = await prisma.module.findFirstOrThrow({
    where: { slug: "porcelanato-piso" },
    select: {
      guide: {
        select: { id: true, commonMistakes: true, faqs: true },
      },
    },
  });
  if (!mod.guide) throw new Error("Módulo sin guide — esperaba uno existente para editar.");

  const commonMistakes = (mod.guide.commonMistakes as string[]).map((m) =>
    m === "Caminar sobre la cerámica antes de que fragüe."
      ? "Caminar sobre el porcelanato antes de que fragüe."
      : m
  );

  const faqs = (mod.guide.faqs as { question: string; answer: string }[]).map((f) =>
    f.question === "¿Puedo instalar sobre cerámica vieja?"
      ? { ...f, question: "¿Puedo instalar sobre porcelanato o cerámica vieja?" }
      : f
  );

  await prisma.moduleGuide.update({
    where: { id: mod.guide.id },
    data: { commonMistakes, faqs },
  });

  console.log("OK — terminología de porcelanato-piso corregida.");
}

main().finally(() => prisma.$disconnect());
