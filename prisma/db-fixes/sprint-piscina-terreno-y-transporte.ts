import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint UX "Construir una piscina" (03-ago-2026), ítems 1 y 3 del análisis
// aprobado (docs/piscina-fases-ux-analisis.md):
// 1. helpText explicando el efecto real del tipo de terreno (afecta cuánta
//    tierra sobra al excavar y, por lo tanto, cuántos viajes de camión —
//    NO tiempo/dificultad/costo, que el sistema no calcula hoy).
// 3. Mostrar el supuesto de capacidad de camión (6 m³/viaje) en el propio
//    resultado, vía Formula.note (mecanismo ya existente, ver
//    priced-results.tsx) — y dar paridad a excavacion-circular, que hoy
//    NO tiene la pregunta/fórmula de retiro en camión (solo la rectangular
//    la tiene).
const TERRENO_HELP_TEXT =
  "Afecta cuánta tierra sobra al excavar: la tierra suelta ocupa más espacio que en su estado original (más si hay arcilla o piedras), así que este dato cambia cuánto material vas a retirar y cuántos viajes de camión vas a necesitar.";

const CAMION_NOTE = "Asumiendo un camión tolva chico (~6 m³ por viaje) — la capacidad real varía según el proveedor.";

async function main() {
  // --- Ítem 1: helpText en ambos módulos ---
  const terrenoUpdate = await prisma.question.updateMany({
    where: { key: "que-tipo-de-terreno-es", module: { slug: { in: ["excavacion", "excavacion-circular"] } } },
    data: { helpText: TERRENO_HELP_TEXT },
  });
  console.log(`helpText de tipo de terreno actualizado en ${terrenoUpdate.count} preguntas.`);

  // --- Ítem 3a: note en la fórmula de retiro (rectangular, ya existe) ---
  const rectanguloNote = await prisma.formula.updateMany({
    where: { key: "retiro-en-camion", module: { slug: "excavacion" } },
    data: { note: CAMION_NOTE },
  });
  console.log(`note de camión actualizado en ${rectanguloNote.count} fórmula(s) de excavacion (rectangular).`);

  // --- Ítem 3b: paridad — agregar pregunta + variable + fórmula a excavacion-circular ---
  const circular = await prisma.module.findFirst({
    where: { slug: "excavacion-circular" },
    include: { questions: true, formulas: true, variables: true },
  });
  if (!circular) throw new Error("Módulo excavacion-circular no encontrado.");

  const yaExiste = circular.questions.some((q) => q.key === "como-vas-a-retirar-la-tierra-excavada");
  if (yaExiste) {
    console.log("excavacion-circular ya tiene la pregunta de retiro — no se duplica.");
  } else {
    const retiroQuestion = await prisma.question.create({
      data: {
        moduleId: circular.id,
        key: "como-vas-a-retirar-la-tierra-excavada",
        label: "¿Cómo vas a retirar la tierra excavada?",
        type: "SELECT",
        order: 3,
        options: {
          create: [
            { key: "la-dejo-en-el-sitio", label: "La dejo en el sitio", order: 0 },
            { key: "necesito-camion-para-retirarla", label: "Necesito camión para retirarla", order: 1 },
          ],
        },
      },
    });

    const maxVariableOrder = Math.max(-1, ...circular.variables.map((v) => v.order));
    await prisma.variable.create({
      data: {
        moduleId: circular.id,
        key: "metodo-de-retiro",
        label: "Método de retiro",
        valueType: "TEXT",
        source: { type: "QUESTION", questionKey: retiroQuestion.key },
        order: maxVariableOrder + 1,
      },
    });

    const maxFormulaOrder = Math.max(...circular.formulas.map((f) => f.order), -1);
    await prisma.formula.create({
      data: {
        moduleId: circular.id,
        key: "retiro-en-camion",
        label: "Retiro en camión",
        unit: "viaje",
        expression: { op: "ceil", value: { op: "/", args: [{ ref: "volumen_suelto" }, 6] } },
        condition: { op: "==", args: [{ var: "metodo-de-retiro" }, { str: "necesito-camion-para-retirarla" }] },
        isResult: true,
        note: CAMION_NOTE,
        normId: "cmrscpo1j000044se6ut4g44p",
        order: maxFormulaOrder + 1,
      },
    });
    console.log("Pregunta + variable + fórmula de retiro en camión creadas en excavacion-circular.");
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
