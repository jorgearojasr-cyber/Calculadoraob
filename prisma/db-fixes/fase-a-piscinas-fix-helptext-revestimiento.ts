import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// FASE A — Piscinas: complemento a fase-a-piscinas-correcciones.ts. Al
// eliminar Fulget, el helpText de la pregunta de revestimiento quedó
// mencionándolo ("Cerámica y Fulget van directo sobre el hormigón...") —
// dependencia de copy que no se había detectado hasta revisar el dump
// final. Se corrige acá, mismo criterio (sin tocar otros módulos).
const NEW_HELPTEXT =
  "Cerámica va directo sobre el hormigón. La membrana PVC (liner) es una alternativa impermeable por sí sola, pero se instala distinto — consulta con tu instalador cuál conviene para tu proyecto.";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  for (const { slug, key } of [
    { slug: "piscina-rectangular-hormigon-armado", key: "que-revestimiento-vas-a-usar" },
    { slug: "piscina-circular-hormigon-armado", key: "revestimiento" },
  ]) {
    const mod = await prisma.module.findUniqueOrThrow({ where: { slug } });
    await prisma.question.update({
      where: { moduleId_key: { moduleId: mod.id, key } },
      data: { helpText: NEW_HELPTEXT },
    });
    console.log(`${slug}: helpText de "${key}" corregido (ya no menciona Fulget)`);
  }

  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
