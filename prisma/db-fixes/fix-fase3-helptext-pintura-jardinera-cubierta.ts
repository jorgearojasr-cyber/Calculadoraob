import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.4, Fase 3 (07-ago-2026): agrega helpText a preguntas
// donde el dato pedido no es evidente para un dueño de casa, siguiendo el
// mismo tono breve/práctico ya usado en Radier/Fachada/Excavación. Solo
// contenido — no toca preguntas nuevas, fórmulas, resultados ni framework
// visual.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UPDATES: { slug: string; key: string; helpText: string }[] = [
  {
    // Mismo criterio que pintar-fachada-exterior → cuantas-manos-quieres-aplicar
    // ("Lo típico son 2 manos, para buena cobertura y durabilidad en
    // exterior."), sin la mención "en exterior" porque pintura cubre
    // interior y exterior según la respuesta de "¿Qué vas a pintar?".
    slug: "pintura",
    key: "cuantas-manos-de-pintura-vas-a-aplicar",
    helpText: "Lo típico son 2 manos, para buena cobertura y durabilidad pareja.",
  },
  {
    // Mismo criterio que hacer-un-sendero → ancho-del-sendero-metros
    // ("Lo típico es entre 0,6 y 1 metro..."), adaptado al rango real de
    // una jardinera (ya usado como referencia en el helpText existente de
    // "Alto" del mismo módulo: "Lo típico es entre 0,3 y 0,5 metros").
    slug: "hacer-jardineras",
    key: "ancho-de-la-jardinera-metros",
    helpText: "Lo típico es entre 0,4 y 0,6 metros de ancho.",
  },
  {
    slug: "cubierta",
    key: "que-tipo-de-cubierta-vas-a-usar",
    helpText: "Si no estás seguro, el zinc/acero ondulado es la opción más común y económica.",
  },
];

async function main() {
  for (const u of UPDATES) {
    const question = await prisma.question.findFirstOrThrow({
      where: { key: u.key, module: { slug: u.slug } },
    });
    if (question.helpText) {
      throw new Error(`${u.slug}/${u.key} ya tiene helpText — revisar antes de continuar.`);
    }
    await prisma.question.update({
      where: { id: question.id },
      data: { helpText: u.helpText },
    });
    console.log(`OK — helpText agregado a ${u.slug}/${u.key}`);
  }
}

main().finally(() => prisma.$disconnect());
