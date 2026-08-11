import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.4, Fase 3 (07-ago-2026): agrega helpText a las
// preguntas de dimensiones de Piscinas (largo/ancho en la rectangular,
// diámetro en la circular), coherente con excavacion-circular →
// diametro ("Mide el hoyo terminado, no la piscina..."). Aclara que la
// medida corresponde a la piscina terminada, SIN repetir la explicación
// completa de holgura (20-30cm) que ya vive en el groupHelpText de
// Excavación (Fase 1, Sprint Producto V1.3) — solo la referencia breve de
// que el hoyo va más ancho, mismo nivel de detalle que el propio helpText
// de excavacion-circular → diametro (que tampoco cita los cm).
// Verificado con un sub-agente que este texto SÍ se renderiza (VolumeStep,
// caja "Tip" con ícono de bombilla) — no es contenido muerto. Solo
// contenido — no toca preguntas nuevas, fórmulas, resultados ni framework
// visual.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const HELP_TEXT = "Medida de la piscina terminada — el hoyo de excavación va más ancho, para dejar espacio de moldaje.";

const UPDATES: { slug: string; key: string }[] = [
  { slug: "piscina-rectangular-hormigon-armado", key: "largo-de-la-piscina-metros" },
  { slug: "piscina-rectangular-hormigon-armado", key: "ancho-de-la-piscina-metros" },
  { slug: "piscina-circular-hormigon-armado", key: "diametro" },
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
      data: { helpText: HELP_TEXT },
    });
    console.log(`OK — helpText agregado a ${u.slug}/${u.key}`);
  }
}

main().finally(() => prisma.$disconnect());
