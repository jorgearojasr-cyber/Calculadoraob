import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.3, Fase 5 (07-ago-2026): la FAQ "¿Sirve para baños o
// cocinas?" de "piso-flotante-laminado" traía la respuesta de
// "piso-spc-vinilico-rigido" copiada literal ("El SPC tolera mejor la
// humedad que el flotante tradicional.") — dentro del propio módulo de
// Laminado, sin decir explícitamente que la recomendación es NO usar
// laminado ahí. Se reemplaza por una respuesta propia del módulo. Solo
// contenido — no toca preguntas, fórmulas ni resultados. El módulo SPC no
// se modifica (su respuesta es correcta para sí mismo).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const mod = await prisma.module.findFirstOrThrow({
    where: { slug: "piso-flotante-laminado" },
    select: { guide: { select: { id: true, faqs: true } } },
  });
  if (!mod.guide) throw new Error("Módulo sin guide — esperaba uno existente para editar.");

  const faqs = (mod.guide.faqs as { question: string; answer: string }[]).map((f) =>
    f.question === "¿Sirve para baños o cocinas?"
      ? {
          ...f,
          answer:
            "No es lo ideal — el piso laminado es a base de fibra de madera (HDF) y se hincha con la humedad. Para baños, cocinas o lavanderías conviene más un piso SPC (vinílico), que sí tolera el agua.",
        }
      : f
  );

  await prisma.moduleGuide.update({
    where: { id: mod.guide.id },
    data: { faqs },
  });

  console.log("OK — FAQ de piso-flotante-laminado corregida.");
}

main().finally(() => prisma.$disconnect());
