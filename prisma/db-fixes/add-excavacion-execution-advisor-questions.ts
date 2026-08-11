import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Asesor de Ejecución — Fase 3 (04-ago-2026): agrega las 3 preguntas
// nuevas en Excavación, como pasos sueltos (stepGroup: null), mismo
// patrón que "¿Qué tipo de terreno es?" y "¿Cómo vas a retirar la tierra
// excavada?" ya existentes en este módulo. No modifica ningún componente
// del wizard — usa Question.visibleIfQuestionKey ya existente para la
// pregunta condicional (3).
//
// Orden: se agregan DESPUÉS de las preguntas existentes (order 5, 6, 7)
// — no se reordena nada existente, cero riesgo de romper un stepGroup ya
// en uso.
async function main() {
  const mod = await prisma.module.findFirst({ where: { slug: "excavacion" } });
  if (!mod) throw new Error("Módulo excavacion no encontrado.");

  const existente = await prisma.question.findFirst({
    where: { moduleId: mod.id, key: "como-se-puede-acceder-al-terreno-para-excavar" },
  });
  if (existente) {
    console.log("Las preguntas del Asesor de Ejecución ya existen en excavacion — no se duplican.");
    return;
  }

  const acceso = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "como-se-puede-acceder-al-terreno-para-excavar",
      label: "¿Cómo se puede acceder al terreno para excavar?",
      type: "SELECT",
      order: 5,
      options: {
        create: [
          { key: "calle_directo", label: "Calle directa, entrada amplia", order: 0 },
          { key: "patio_pasillo", label: "Por patio o pasillo, algo angosto", order: 1 },
          { key: "solo_peatonal", label: "Solo acceso peatonal, sin entrada de vehículos", order: 2 },
          { key: "no_seguro", label: "No estoy seguro", order: 3 },
        ],
      },
    },
  });

  const metodo = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "como-prefieres-ejecutar-la-excavacion",
      label: "¿Cómo prefieres ejecutar la excavación?",
      type: "SELECT",
      order: 6,
      options: {
        create: [
          { key: "no_se", label: "No sé, quiero una recomendación", order: 0 },
          { key: "manual", label: "Manual (pala y pico)", order: 1 },
          { key: "maquinaria", label: "Con maquinaria", order: 2 },
        ],
      },
    },
  });

  await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "que-tipo-de-maquina",
      label: "¿Qué tipo de máquina?",
      type: "SELECT",
      order: 7,
      visibleIfQuestionKey: metodo.key,
      visibleIfValues: ["maquinaria"],
      options: {
        create: [
          { key: "mini_excavadora", label: "Mini excavadora", order: 0 },
          { key: "retroexcavadora", label: "Retroexcavadora", order: 1 },
          { key: "excavadora", label: "Excavadora", order: 2 },
          { key: "no_se", label: "No sé, aún no lo decido", order: 3 },
        ],
      },
    },
  });

  console.log("Preguntas creadas:", { acceso: acceso.key, metodo: metodo.key, maquina: "que-tipo-de-maquina" });
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
