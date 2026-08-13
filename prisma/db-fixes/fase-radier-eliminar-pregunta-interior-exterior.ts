import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// RADIER — elimina la pregunta redundante "¿Es interior o exterior?" del
// flujo (no solo la oculta). Auditoría: esta Question solo alimentaba dos
// cosas — la Variable "es-interior-o-exterior" (vía type:QUESTION) y la
// visibilidad/defaultSource de "porcentaje-de-pendiente" — nada de espesor,
// tipo_hormigon ni dosificación depende de ella (esos ya están indexados
// directamente por "uso"). Se elimina de raíz cambiando la fuente de la
// derivación de "responder una pregunta" a "derivar de uso", que es el
// mismo patrón LOOKUP ya usado en sacos-cemento-por-m3/tipo_hormigon.
//
// Ambiente derivado por uso:
//   patio_terraza      -> exterior (pide pendiente)
//   estacionamiento    -> exterior (pide pendiente)
//   antepiso_interior  -> interior (bajo techo, no pide pendiente)
//   bodega_industrial  -> interior (bodega = recinto techado por
//                          definición, mismo criterio que antepiso
//                          interior) — DECISIÓN DE JUICIO, no hay Norm que
//                          distinga esto hoy; documentado explícitamente
//                          para que quede trazable, no una cifra inventada
//                          sin marcar.
//
// Alcance estricto: NO se toca espesor_cm, tipo_hormigon, dosificación de
// cemento/arena/gravilla/agua, metodo_hormigon, colocacion, ni ningún otro
// módulo.

async function main() {
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "radier" },
    include: { questions: { include: { options: true } }, variables: true },
  });

  // 1. Variable "es-interior-o-exterior": QUESTION -> LOOKUP derivado de "uso".
  const ambienteVar = mod.variables.find((v) => v.key === "es-interior-o-exterior");
  if (!ambienteVar) throw new Error("No se encontró la Variable 'es-interior-o-exterior'");
  await prisma.variable.update({
    where: { id: ambienteVar.id },
    data: {
      source: {
        type: "LOOKUP",
        questionKey: "uso",
        table: {
          patio_terraza: "exterior",
          estacionamiento: "exterior",
          antepiso_interior: "interior",
          bodega_industrial: "interior",
        },
      },
    },
  });
  console.log("OK: Variable 'es-interior-o-exterior' ahora es LOOKUP derivado de 'uso' (ya no depende de una Question).");

  // 2. Question "porcentaje-de-pendiente": visibilidad y sugerencia por
  // defecto pasan a depender de "uso" directamente (la Question de la que
  // dependían antes desaparece en el paso 3).
  const pendienteQ = mod.questions.find((q) => q.key === "porcentaje-de-pendiente");
  if (!pendienteQ) throw new Error("No se encontró la Question 'porcentaje-de-pendiente'");
  await prisma.question.update({
    where: { id: pendienteQ.id },
    data: {
      visibleIfQuestionKey: "uso",
      visibleIfValues: ["patio_terraza", "estacionamiento"],
      defaultSource: {
        type: "LOOKUP",
        questionKey: "uso",
        table: { patio_terraza: 1.5, estacionamiento: 1.5 },
      },
      helpText:
        "Una superficie exterior necesita pendiente para que el agua escurra — la pendiente hace que el hormigón no tenga espesor uniforme, así que aumenta el volumen real más de lo que parece. Te sugerimos 1,5%, típico en patios y terrazas (aprox. 1,5 cm de desnivel por cada metro), pero puedes ajustarlo.",
    },
  });
  console.log("OK: Question 'porcentaje-de-pendiente' ahora depende de 'uso' (patio_terraza/estacionamiento) en vez de la pregunta eliminada.");

  // 3. Eliminar la Question "es-interior-o-exterior" (cascada borra sus 2
  // QuestionOption). No se elimina como db-fix "silencioso": se deja este
  // registro explícito de qué existía antes, para trazabilidad.
  const ambienteQ = mod.questions.find((q) => q.key === "es-interior-o-exterior");
  if (ambienteQ) {
    console.log(
      `Eliminando Question '${ambienteQ.key}' ("${ambienteQ.label}") con ${ambienteQ.options.length} opciones: ` +
        ambienteQ.options.map((o) => o.key).join(", ")
    );
    await prisma.question.delete({ where: { id: ambienteQ.id } });
    console.log("OK: Question 'es-interior-o-exterior' eliminada (cascada de sus opciones incluida).");
  } else {
    console.log("SKIP: Question 'es-interior-o-exterior' ya no existe.");
  }

  console.log("\n=== Fix completado — radier ===");
}

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
