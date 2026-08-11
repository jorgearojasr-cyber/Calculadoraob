import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 1, Sprint Producto V1.3 (04-ago-2026) — "Piscinas: Consolidación
// UX", ítem 2: selección de tipo de camión para el retiro de tierra
// excavada. Alcance acordado con Jorge: modifica ÚNICAMENTE la
// estimación de viajes (retiro-en-camion) — no toca ningún otro
// cálculo, ni el motor de fórmulas en sí (mismo mecanismo LOOKUP +
// visibleIf ya usado en todo el proyecto, sin código nuevo). El supuesto
// sigue visible en el `note` del resultado, ahora reflejando la
// capacidad elegida en vez del valor fijo de 6 m³, siempre explícito
// como estimación.
//
// Capacidades de referencia (chico/mediano/grande) — no vienen de una
// fuente verificada, son valores de referencia general de mercado, igual
// de "no verificado" que el 6 m³ que ya estaba hardcodeado antes de este
// cambio (no se introduce un supuesto nuevo, se hace configurable el que
// ya existía).
//
// DEUDA TÉCNICA registrada (04-ago-2026, cierre de Fase 1, sin
// implementar): estas capacidades quedan como un objeto literal en este
// script — si en algún momento se agregan costos de transporte (ítem 4b
// de docs/piscina-fases-ux-analisis.md, hoy fuera de alcance), convendría
// migrarlas a un catálogo configurable (ej. una tabla o `Material`
// reutilizable) en vez de repetir el mismo mapa chico/mediano/grande en
// cada lugar que necesite tarifas por tipo de camión.
const CAPACIDADES = { chico: 6, mediano: 10, grande: 15 };
const OPTIONS = [
  { key: "chico", label: "Camión tolva chico (~6 m³)", order: 0 },
  { key: "mediano", label: "Camión tolva mediano (~10 m³)", order: 1 },
  { key: "grande", label: "Camión tolva grande (~15 m³)", order: 2 },
];

async function processModule(prisma: PrismaClient, slug: string, volumenRefKey: string) {
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  const existing = mod.questions.find((q) => q.key === "tipo-de-camion");
  if (existing) {
    console.log(`[${slug}] Ya existe "tipo-de-camion" — no se duplica.`);
    return;
  }

  const retiroQuestion = mod.questions.find((q) => q.key === "como-vas-a-retirar-la-tierra-excavada");
  if (!retiroQuestion) throw new Error(`[${slug}] No se encontró la pregunta de retiro de tierra.`);

  // Corre las preguntas posteriores un puesto (descendente, para no pisar
  // valores de `order` mientras se actualiza) y deja el hueco justo
  // después de "como-vas-a-retirar-la-tierra-excavada" — así la pregunta
  // de tipo de camión aparece inmediatamente después de la que la
  // origina, no al final del flujo.
  const toShift = mod.questions.filter((q) => q.order > retiroQuestion.order).sort((a, b) => b.order - a.order);
  for (const q of toShift) {
    await prisma.question.update({ where: { id: q.id }, data: { order: q.order + 1 } });
  }

  const newQuestion = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "tipo-de-camion",
      label: "¿Qué tipo de camión vas a usar?",
      type: "SELECT",
      order: retiroQuestion.order + 1,
      visibleIfQuestionKey: "como-vas-a-retirar-la-tierra-excavada",
      visibleIfValues: ["necesito-camion-para-retirarla"],
      hiddenDefaultValue: "chico",
      options: { create: OPTIONS },
    },
  });
  console.log(`[${slug}] Pregunta "tipo-de-camion" creada (order=${newQuestion.order}), ${toShift.length} pregunta(s) posteriores corridas +1.`);

  const existingVar = await prisma.variable.findFirst({ where: { moduleId: mod.id, key: "capacidad-camion-m3" } });
  if (!existingVar) {
    await prisma.variable.create({
      data: {
        moduleId: mod.id,
        key: "capacidad-camion-m3",
        valueType: "NUMBER",
        source: { type: "LOOKUP", questionKey: "tipo-de-camion", table: CAPACIDADES, default: CAPACIDADES.chico },
      },
    });
    console.log(`[${slug}] Variable "capacidad-camion-m3" creada.`);
  }

  const formula = await prisma.formula.findFirstOrThrow({ where: { moduleId: mod.id, key: "retiro-en-camion" } });
  await prisma.formula.update({
    where: { id: formula.id },
    data: {
      expression: { op: "ceil", value: { op: "/", args: [{ ref: volumenRefKey }, { var: "capacidad-camion-m3" }] } },
      note: "Asumiendo {capacidad-camion-m3} m³ por viaje — es una estimación, la capacidad real varía según el proveedor.",
    },
  });
  console.log(`[${slug}] Fórmula "retiro-en-camion" actualizada (ahora usa capacidad-camion-m3 en vez del literal 6).`);
}

async function main() {
  await processModule(prisma, "excavacion", "volumen-esponjado");
  await processModule(prisma, "excavacion-circular", "volumen_suelto");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
