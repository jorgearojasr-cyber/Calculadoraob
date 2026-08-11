import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 6B — Etapa 4 (10-ago-2026): consistencia de cálculo.
//
// Punto 1 (excavacion/excavacion-circular: volumen en sitio isResult:false
// vs zanja-para-tuberias que sí lo muestra) — NO se modifica: cambiar
// isResult:true agregaría una tarjeta nueva a la pantalla de resultados,
// lo que altera el diseño de resultados existente. Queda documentado como
// hallazgo pendiente de decisión de producto en el cierre de Fase 6B, tal
// como indica la instrucción ("no cambiar todavía si eso altera el diseño
// de resultados").
//
// Punto 2 (tornillos tabique vs cielo-raso metalcon) — ninguna de las dos
// cantidades de tornillos tiene respaldo de fabricante (ambas son práctica
// de obra). cielo-raso-en-metalcon ya lo declara honestamente vía su Norm
// PRACTICA_GENERAL_NO_VERIFICADA; tabique-en-metalcon no tenía ninguna cita
// para su fórmula de tornillos. No se elige arbitrariamente una
// metodología (área vs. por-montante) porque describen situaciones físicas
// distintas (grilla de cielo vs. montantes verticales). Se formaliza el
// mismo criterio de honestidad ya usado en cielo-raso: se cita como
// práctica de obra no verificada, sin inventar una fuente.
//
// Punto 3 (terminar-junturas-de-yeso-carton: metros-juntura = área × 1) —
// no se encontró fuente que derive metros de juntura desde el layout real
// de planchas. Se mantiene el valor (no se reemplaza arbitrariamente) pero
// se documenta explícitamente como supuesto simplificado. También se
// corrige el scope de la Norm de junturas, que no mencionaba "lija" pese a
// que la fórmula lija-fina ya está vinculada a ella.
//
// Punto 4 (cambiar-burlete: pregunta puerta-o-ventana sin efecto en ningún
// cálculo, sin recomendación asociada, sin helpText, sin numericValue en
// sus opciones) — confirmado que es puramente decorativa. Se elimina en
// vez de inventar una diferencia de cálculo entre puerta y ventana que no
// existe (la fórmula de perímetro es idéntica para ambas).

async function fixTabiqueMetalconTornillos() {
  console.log("\n--- Punto 2: tabique-en-metalcon (tornillos) ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "tabique-en-metalcon" },
    include: { formulas: true },
  });

  const code = "OBRA-METALCON-TABIQUE-TORNILLOS-PRACTICA";
  let norm = await prisma.norm.findUnique({ where: { code } });
  if (!norm) {
    norm = await prisma.norm.create({
      data: {
        code,
        title: "Práctica de obra — tornillos de fijación en tabiquería Metalcon",
        scope: "Cantidad de tornillos para fijar montantes a solera superior e inferior en un tabique de Metalcon.",
        verificationStatus: "PRACTICA_GENERAL_NO_VERIFICADA",
        reinforcedWarning: false,
        note:
          "Representa práctica de obra habitual (aprox. 2 tornillos por punto de fijación a cada solera, " +
          "más margen), no una ficha técnica de fabricante — mismo criterio de transparencia ya usado en " +
          "cielo-raso-en-metalcon para su propio conteo de tornillos, que tampoco tiene respaldo de " +
          "fabricante. No se unifica con la metodología de cielo-raso (por m²) porque describen fijaciones " +
          "físicamente distintas: montantes verticales puntuales vs. grilla de perfiles.",
      },
    });
    console.log(`  OK creada Norm ${code}`);
  } else {
    console.log(`  SKIP (Norm ${code} ya existe)`);
  }

  const f = mod.formulas.find((x) => x.key === "tornillos-necesarios")!;
  if (!f.normId) {
    await prisma.formula.update({ where: { id: f.id }, data: { normId: norm.id } });
    console.log(`  OK Formula tornillos-necesarios -> normId ${code}`);
  } else {
    console.log("  SKIP (tornillos-necesarios ya tiene normId)");
  }
}

async function fixYesoCarton() {
  console.log("\n--- Punto 3: terminar-junturas-de-yeso-carton ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "terminar-junturas-de-yeso-carton" },
    include: { formulas: true },
  });

  const metrosJuntura = mod.formulas.find((x) => x.key === "metros-juntura")!;
  const assumptionNote =
    "Supuesto explícito: se asume 1 metro lineal de juntura por cada m² de plancha instalada. " +
    "No se encontró una fuente que derive este valor del layout real de placas (cantidad y disposición " +
    "de planchas) — el consumo real de huincha puede variar según el patrón de instalación. Valor " +
    "identificado como supuesto de estimación, no como dato verificado.";
  if (!metrosJuntura.note) {
    await prisma.formula.update({ where: { id: metrosJuntura.id }, data: { note: assumptionNote } });
    console.log("  OK Formula metros-juntura -> note documentando el supuesto explícito (sin cambiar el valor)");
  } else {
    console.log("  SKIP (metros-juntura ya tiene note)");
  }

  const norm = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-JUNTURAS-YESO-CARTON-RENDIMIENTOS" } });
  if (!norm.scope.includes("lija")) {
    await prisma.norm.update({
      where: { id: norm.id },
      data: {
        scope:
          "Rendimiento de pasta de juntas (kg/m² de plancha), huincha, esquineros y lija fina de " +
          "terminación para dejar un tabique o cielo de yeso cartón liso y listo para pintar.",
      },
    });
    console.log("  OK Norm.scope de OBRA-JUNTURAS-YESO-CARTON-RENDIMIENTOS actualizado (ahora menciona lija)");
  } else {
    console.log("  SKIP (scope ya menciona lija)");
  }
}

async function fixCambiarBurlete() {
  console.log("\n--- Punto 4: cambiar-burlete ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "cambiar-burlete" },
    include: { questions: true },
  });
  const q = mod.questions.find((x) => x.key === "puerta-o-ventana");
  if (q) {
    await prisma.questionOption.deleteMany({ where: { questionId: q.id } });
    await prisma.question.delete({ where: { id: q.id } });
    console.log(
      "  OK eliminada pregunta 'puerta-o-ventana' (sin efecto en ningún cálculo, sin helpText, sin " +
        "recomendación asociada — no existe diferencia de cálculo real entre puerta y ventana en este módulo)"
    );
  } else {
    console.log("  SKIP (puerta-o-ventana ya no existe)");
  }
}

async function main() {
  console.log("Punto 1 (excavacion/excavacion-circular): sin cambios — ver comentario en el encabezado del script.");
  await fixTabiqueMetalconTornillos();
  await fixYesoCarton();
  await fixCambiarBurlete();
  console.log("\n=== Etapa 4 completada ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
