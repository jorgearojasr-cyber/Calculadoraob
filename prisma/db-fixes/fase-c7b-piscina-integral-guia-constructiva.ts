import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// FASE C7-B (2026-09-05) -- "Cómo se construye una piscina de hormigón"
// (Etapa A aprobada, secciones 19/26/27 del pedido). Reusa el mecanismo YA
// existente `ModuleGuide` (1:1 con Module, ver src/app/(app)/categorias/
// [slug]/[moduleSlug]/page.tsx -> mod.guide -> ModuleGuideData ->
// <GuideSection>) -- NINGÚN componente nuevo, NINGÚN paso adicional del
// wizard: es contenido, se renderiza automáticamente en ResultScreen
// (después de las secciones técnicas) apenas existe esta fila.
// `piscina-integral` no tenía ModuleGuide todavía (confirmado antes de
// escribir este fix).
//
// `stepByStepSummary` son las 16 etapas pedidas -- 1-2 frases cada una
// (sección 27: "no convertir en manual técnico extenso"), moldaje
// explícitamente condicional, prueba de estanqueidad ANTES de
// impermeabilización/terminación (mismo orden ya validado en la
// investigación técnica aprobada esta fase anterior).
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  const data = {
    summary:
      "Una piscina de hormigón armado sigue una secuencia constructiva similar en la mayoría de los proyectos residenciales, aunque el orden exacto y los detalles dependen del sistema constructivo (moldaje, shotcrete, etc.) y del proyecto estructural. Esta guía es una referencia general para entender el proceso, no un manual de ejecución.",
    tools: [
      "Nivel y elementos de trazado (huincha, cordel, estacas)",
      "Herramientas de excavación o maquinaria según el volumen",
      "Elementos para armar y fijar la enfierradura",
      "Moldaje (si el sistema constructivo lo requiere)",
      "Equipo de hormigonado o shotcrete según la solución elegida",
      "Elementos de impermeabilización y terminación interior",
    ],
    estimatedTime: "Semanas (varía mucho según sistema constructivo y clima)",
    difficulty: "Alta — requiere proyecto estructural y mano de obra especializada",
    recommendedPeople: "Equipo con maestro a cargo + especialistas (fierrero, hormigonero, gasfíter)",
    tipsBeforeStart: [
      "Define el proyecto estructural (acero, hormigón, impermeabilización) antes de excavar.",
      "Confirma con tu instalador el sistema constructivo (moldaje, shotcrete u otro) antes de cotizar hormigón.",
      "Deja definida la ubicación de instalaciones embebidas (tuberías, retornos, skimmers) antes de hormigonar.",
    ],
    commonMistakes: [
      "Hormigonar sin haber probado la estanqueidad del vaso.",
      "Definir equipamiento (bomba/filtro) sin conocer el caudal objetivo real de la instalación.",
      "Agregar agua al hormigón en obra para 'aflojarlo' en vez de ajustar el diseño de mezcla.",
    ],
    safetyRecommendations: [
      "Señaliza y restringe el acceso a la excavación abierta.",
      "Usa elementos de protección personal durante el hormigonado y manejo de acero.",
      "No permitas el llenado ni el uso de la piscina sin que el sistema eléctrico de equipos esté certificado.",
    ],
    bestPractice:
      "Haz la prueba de estanqueidad antes de avanzar a impermeabilización y terminación interior — corregir una filtración después de terminada la piscina es mucho más caro que corregirla antes.",
    masterTip:
      "El orden importa: cada etapa condiciona la siguiente. Apurar el hormigonado antes de tener claras las instalaciones embebidas es el error más caro de corregir después.",
    faqs: [
      {
        question: "¿Siempre se usa moldaje?",
        answer:
          "No. Algunos sistemas constructivos (por ejemplo, shotcrete/gunita) no requieren moldaje tradicional. La elección depende del proyecto estructural y del sistema que ofrezca tu instalador.",
      },
      {
        question: "¿Cuándo se hace la prueba de estanqueidad?",
        answer:
          "Después del hormigonado y curado, y ANTES de la impermeabilización definitiva y la terminación interior — así cualquier filtración se corrige mientras todavía es accesible.",
      },
      {
        question: "¿Puedo llenar la piscina apenas está terminada?",
        answer:
          "El llenado y la puesta en marcha del equipamiento son la última etapa, después de que la terminación interior y las instalaciones hidráulicas estén listas y probadas.",
      },
    ],
    stepByStepSummary: [
      "Replanteo y trazado: se marca en terreno la posición exacta y los niveles de la piscina.",
      "Definición de niveles: se fija el nivel de fondo y de borde según el proyecto.",
      "Excavación: se excava el hoyo según las dimensiones y profundidad definidas.",
      "Preparación del fondo: base granular, estabilizado u otra solución según el terreno.",
      "Instalaciones embebidas: se dejan las tuberías de retorno, skimmers y drenajes antes de hormigonar.",
      "Armadura de acero: se coloca la enfierradura de muros y losa según el cálculo estructural.",
      "Moldaje, si el sistema constructivo lo requiere: no todos los sistemas lo usan (ej. shotcrete).",
      "Hormigonado o shotcrete: se coloca el hormigón según el sistema y diseño de mezcla definidos.",
      "Curado: se mantiene la humedad del hormigón el tiempo necesario para desarrollar resistencia.",
      "Prueba de estanqueidad: se llena de agua para confirmar que no hay filtraciones, antes de terminar.",
      "Impermeabilización: se aplica la solución definitiva según el proyecto.",
      "Terminación interior: pintura, cerámica o membrana, según lo elegido.",
      "Instalaciones hidráulicas: se conectan bomba, filtro y accesorios al sistema embebido.",
      "Borde/radier exterior: se construye la base y terminación alrededor de la piscina.",
      "Equipamiento: se instalan y conectan bomba, filtro y accesorios definitivos.",
      "Llenado y puesta en marcha: se llena la piscina y se prueba el sistema de recirculación.",
    ],
  };

  await prisma.moduleGuide.upsert({
    where: { moduleId: mod.id },
    create: { moduleId: mod.id, ...data },
    update: data,
  });

  console.log(`OK — Guía constructiva creada/actualizada para Module "piscina-integral". id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
