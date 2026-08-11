import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 5, sprint UX V1.2 (04-ago-2026): separar el flujo de "reemplazo de
// un WC existente" del de "instalación en una ubicación nueva".
//
// El eje ya existe (pregunta "vas-a-reemplazar-o-instalar-nuevo": reemplazo
// vs. instalacion-nueva) — lo que faltaba es que la segunda pregunta del
// módulo ("¿Tu llave de paso/flexible actual está en buen estado?") solo
// tiene sentido en el camino de REEMPLAZO: presupone que ya existe una
// llave de paso que evaluar. En una instalación nueva no hay nada que
// evaluar — la llave y el flexible siempre hay que instalarlos nuevos.
//
// Se resuelve con el mismo mecanismo ya usado en Excavación (visibleIf) +
// el mismo patrón ya usado en Radier/"colocacion" (hiddenDefaultValue):
// - visibleIfQuestionKey/visibleIfValues: la pregunta solo se muestra en
//   el camino de reemplazo.
// - hiddenDefaultValue="necesita-cambio": cuando la pregunta queda oculta
//   (camino de instalación nueva), esto asume que la llave/flexible se
//   necesita instalar — que es siempre cierto en una instalación nueva.
//   Las fórmulas `flexible-conexion` y `llave-paso` (condition:
//   estado-llave-paso=="necesita-cambio") NO se tocan: siguen
//   funcionando igual para ambos caminos gracias a este valor asumido.
async function main() {
  const before = await prisma.question.findFirst({
    where: { module: { slug: "cambiar-o-instalar-un-wc" }, key: "estado-llave-paso" },
  });
  console.log(
    "ANTES:",
    JSON.stringify(
      { key: before?.key, visibleIfQuestionKey: before?.visibleIfQuestionKey, visibleIfValues: before?.visibleIfValues, hiddenDefaultValue: before?.hiddenDefaultValue },
      null,
      2
    )
  );

  const result = await prisma.question.updateMany({
    where: { module: { slug: "cambiar-o-instalar-un-wc" }, key: "estado-llave-paso" },
    data: {
      visibleIfQuestionKey: "vas-a-reemplazar-o-instalar-nuevo",
      visibleIfValues: ["reemplazo"],
      hiddenDefaultValue: "necesita-cambio",
    },
  });
  console.log("Filas actualizadas:", result.count);

  const after = await prisma.question.findFirst({
    where: { module: { slug: "cambiar-o-instalar-un-wc" }, key: "estado-llave-paso" },
  });
  console.log(
    "DESPUÉS:",
    JSON.stringify(
      { key: after?.key, visibleIfQuestionKey: after?.visibleIfQuestionKey, visibleIfValues: after?.visibleIfValues, hiddenDefaultValue: after?.hiddenDefaultValue },
      null,
      2
    )
  );
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
