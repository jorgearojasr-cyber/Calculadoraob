import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 1, Sprint Producto V1.3 (04-ago-2026) — "Piscinas: Consolidación
// UX", ítem 3: helpText faltante en las 3 preguntas de revestimiento de
// ambas piscinas (circular y rectangular comparten los mismos keys de
// pregunta). Solo contenido — no toca ninguna Formula/Variable.
const HELP_TEXT: Record<string, string> = {
  "que-revestimiento-vas-a-usar":
    "Cerámica y Fulget van directo sobre el hormigón. La membrana PVC (liner) es una alternativa impermeable por sí sola, pero se instala distinto — consulta con tu instalador cuál conviene para tu proyecto.",
  // Piscina circular usa el key "revestimiento" para la misma pregunta.
  revestimiento:
    "Cerámica y Fulget van directo sobre el hormigón. La membrana PVC (liner) es una alternativa impermeable por sí sola, pero se instala distinto — consulta con tu instalador cuál conviene para tu proyecto.",
  "alcance-revestimiento":
    "Revestir todo el interior (fondo y muros) es lo habitual en una piscina nueva. \"Solo el borde\" es para cuando el interior ya está resuelto (ej. una piscina existente) y solo falta renovar el coping perimetral.",
  "ancho-del-borde-a-revestir-cm":
    "Ancho del coping (borde), medido desde el filo de la piscina hacia afuera — no es el ancho de la piscina en sí.",
};

async function main() {
  for (const slug of ["piscina-rectangular-hormigon-armado", "piscina-circular-hormigon-armado"]) {
    const mod = await prisma.module.findUniqueOrThrow({ where: { slug } });
    for (const [key, helpText] of Object.entries(HELP_TEXT)) {
      const result = await prisma.question.updateMany({
        where: { moduleId: mod.id, key },
        data: { helpText },
      });
      if (result.count > 0) console.log(`[${slug}] ${key}: helpText actualizado.`);
    }
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
