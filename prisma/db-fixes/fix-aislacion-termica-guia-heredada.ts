import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.3, Fase 5 (07-ago-2026): el ModuleGuide de
// "aislacion-termica-bajo-cubierta" era una copia literal (byte a byte) del
// guide de "cubierta" — hablaba de traslape entre planchas, tornillos mal
// sellados y revisión anual de la techumbre, nada relacionado con instalar
// aislación térmica. Se reemplaza por contenido específico de la tarea
// (lana de vidrio/mineral bajo cubierta). Solo contenido — no toca
// preguntas, fórmulas ni resultados.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const mod = await prisma.module.findFirstOrThrow({
    where: { slug: "aislacion-termica-bajo-cubierta" },
    select: { id: true, guide: { select: { id: true } } },
  });
  if (!mod.guide) throw new Error("Módulo sin guide — esperaba uno existente para reemplazar.");

  await prisma.moduleGuide.update({
    where: { id: mod.guide.id },
    data: {
      summary:
        "La aislación térmica bajo cubierta se instala en el entretecho — el resultado no se ve, así que la calidad se juega en cubrir toda la superficie sin comprimir el material y sin dejar espacios sueltos.",
      tools: [
        "Cuchillo cartonero o tijeras para cortar la lana",
        "Guantes largos y mascarilla (la fibra de vidrio o mineral irrita piel y vías respiratorias)",
        "Grapadora o clavos para fijar, según el sistema",
        "Cinta métrica",
        "Escalera",
      ],
      estimatedTime: "Medio día a 1 día según el tamaño del techo.",
      difficulty: "Fácil-Media",
      recommendedPeople: "1-2 personas.",
      tipsBeforeStart: [
        "Mide el ancho entre cerchas o costaneras antes de comprar — la lana rinde mejor si el ancho del rollo calza sin comprimirla ni dejar huecos.",
        "Revisa que no haya filtraciones de agua en la cubierta antes de instalar — la humedad atrapada bajo la aislación no se nota a simple vista después.",
      ],
      commonMistakes: [
        "Comprimir la lana para que \"entre\" en un espacio más angosto — reduce su capacidad aislante real.",
        "Dejar espacios sin cubrir entre paños — ahí es donde se pierde la mayor parte del calor.",
        "Instalar sin guantes ni mascarilla — la fibra suelta irrita la piel y las vías respiratorias.",
      ],
      safetyRecommendations: [
        "Usa guantes largos, mascarilla y manga larga — la fibra de vidrio o mineral irrita al contacto.",
        "Si instalas junto con el techado (trabajo en altura), usa arnés o línea de vida según corresponda.",
      ],
      bestPractice:
        "Cubre toda la superficie sin dejar huecos ni comprimir el material — un paño mal ajustado pierde la mayor parte de su capacidad aislante.",
      masterTip:
        "La aislación no rinde por lo gruesa que sea, rinde por lo bien que cubre — un espacio pequeño sin tapar deja pasar más frío que perder unos centímetros de grosor.",
      faqs: [
        {
          question: "¿Qué tipo de aislación elegir?",
          answer:
            "Depende del presupuesto y la instalación: la lana de vidrio es más económica, la lana mineral resiste mejor la humedad y el fuego. Ambas rinden bien si se instalan sin comprimir.",
        },
        {
          question: "¿Necesito barrera de vapor?",
          answer:
            "En climas con harta humedad o diferencias de temperatura marcadas, conviene — evita que la humedad condense dentro de la aislación. Consúltalo con tu maestro o proveedor según tu zona.",
        },
      ],
      stepByStepSummary: [
        "Verifica que no haya filtraciones en la cubierta antes de instalar.",
        "Mide el espacio entre cerchas o costaneras.",
        "Corta la aislación a medida, sin dejar huecos entre paños.",
        "Coloca la aislación sin comprimirla contra la estructura.",
        "Fija según el sistema (grapas, clavos o marco de sujeción).",
        "Revisa que toda la superficie quede cubierta, sin espacios sueltos.",
      ],
    },
  });

  console.log("OK — guide de aislacion-termica-bajo-cubierta reemplazado.");
}

main().finally(() => prisma.$disconnect());
