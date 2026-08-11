import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 10D (10-ago-2026): ajuste editorial de confianza en 2 de las 5
// reglas del ExecutionAdvisor de "excavacion", aprobado tras la revisión
// de Fase 10C. Cambio QUIRÚRGICO — únicamente `confianzaBase`, nada más:
// no se toca prioridad, condiciones, opcionRecomendadaKey, tips,
// reduceConfidence de ninguna opción, ni el `estado` del ExecutionAdvisor
// (sigue en PENDIENTE_VALIDACION; el gate de Fase 10B sigue bloqueando
// todo el contenido para el usuario final, este ajuste no lo publica).
//
// 1) acceso=patio_pasillo -> mini_excavadora: ALTA -> MEDIA. La condición
//    es una etiqueta cualitativa ("algo angosto"), sin ancho real en
//    metros — el propio tip de esta opción ya pide "confirma el ancho
//    exacto con el operador", lo que reconoce esa incertidumbre; la
//    confianza mostrada debe reflejarla.
// 2) acceso=calle_directo AND terreno=tierra-normal -> retroexcavadora:
//    ALTA -> MEDIA. La regla no conoce volumen/largo/ancho de la
//    excavación — acceso+terreno confirman que la máquina ES viable, no
//    que sea la más adecuada para cualquier tamaño de proyecto.

async function main() {
  const advisor = await prisma.executionAdvisor.findUnique({
    where: { moduleSlug: "excavacion" },
    include: { rules: true, options: { select: { id: true } }, tips: { select: { id: true } } },
  });
  if (!advisor) throw new Error("No se encontró ExecutionAdvisor para moduleSlug=excavacion");

  if (advisor.options.length !== 10 || advisor.rules.length !== 5 || advisor.tips.length !== 8) {
    throw new Error(
      `Conteo inesperado antes de aplicar el ajuste (options=${advisor.options.length}, rules=${advisor.rules.length}, tips=${advisor.tips.length}) — se esperaba 10/5/8. Deteniendo sin escribir.`
    );
  }

  const reglaPatioPasillo = advisor.rules.find(
    (r) =>
      r.opcionRecomendadaKey === "mini_excavadora" &&
      JSON.stringify(r.condiciones) === JSON.stringify([{ valor: "patio_pasillo", operador: "equals", questionKey: "como-se-puede-acceder-al-terreno-para-excavar" }])
  );
  const reglaCalleTierraNormal = advisor.rules.find(
    (r) =>
      r.opcionRecomendadaKey === "retroexcavadora" &&
      JSON.stringify(r.condiciones) ===
        JSON.stringify([
          { valor: "calle_directo", operador: "equals", questionKey: "como-se-puede-acceder-al-terreno-para-excavar" },
          { valor: "tierra-normal", operador: "equals", questionKey: "que-tipo-de-terreno-es" },
        ])
  );

  if (!reglaPatioPasillo) throw new Error("No se encontró la regla patio_pasillo -> mini_excavadora (deteniendo)");
  if (!reglaCalleTierraNormal) throw new Error("No se encontró la regla calle_directo+tierra-normal -> retroexcavadora (deteniendo)");

  if (reglaPatioPasillo.confianzaBase !== "MEDIA") {
    await prisma.executionAdvisorRule.update({
      where: { id: reglaPatioPasillo.id },
      data: { confianzaBase: "MEDIA" },
    });
    console.log(`OK regla patio_pasillo->mini_excavadora: confianzaBase ${reglaPatioPasillo.confianzaBase} -> MEDIA`);
  } else {
    console.log("SKIP (patio_pasillo->mini_excavadora ya está en MEDIA)");
  }

  if (reglaCalleTierraNormal.confianzaBase !== "MEDIA") {
    await prisma.executionAdvisorRule.update({
      where: { id: reglaCalleTierraNormal.id },
      data: { confianzaBase: "MEDIA" },
    });
    console.log(`OK regla calle_directo+tierra-normal->retroexcavadora: confianzaBase ${reglaCalleTierraNormal.confianzaBase} -> MEDIA`);
  } else {
    console.log("SKIP (calle_directo+tierra-normal->retroexcavadora ya está en MEDIA)");
  }

  const estadoFinal = await prisma.executionAdvisor.findUnique({ where: { moduleSlug: "excavacion" } });
  console.log(`\n=== Fase 10D completada — ExecutionAdvisor.estado sigue: ${estadoFinal?.estado} (no se tocó) ===`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
