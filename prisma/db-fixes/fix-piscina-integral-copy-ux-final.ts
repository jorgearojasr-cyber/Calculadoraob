import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase Pre-Producción — "UX final del configurador de piscina" (2026-09-04):
// solo copy (label/helpText) de 2 Questions de piscina-integral, sin tocar
// Formula.expression/condition ni ningún cálculo aprobado (C1-C7 intactos).
//
// A. excavacion-espacio-trabajo-cm (sección 8-9 del pedido): el label
//    "Espacio de trabajo alrededor" no se entendía suficientemente sin
//    contexto -- se aclara que es un espacio ADICIONAL al muro, y que no
//    corresponde al espesor del muro (confusión real reportada).
// B. entorno-ancho-m (sección 12-13): "Entorno" -> "Borde de la piscina"
//    en el copy visible -- las keys internas (entorno-*, stepGroup
//    "environment") NO cambian, no aportan nada renombrarlas.
//
// Idempotente: usa `updateMany` con el texto actual como condición
// implícita vía comparación en JS antes de escribir -- una segunda corrida
// no vuelve a escribir si el valor ya es el nuevo.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function updateIfNeeded(key: string, newLabel: string, newHelpText: string) {
  const q = await prisma.question.findFirstOrThrow({
    where: { key, module: { slug: "piscina-integral" } },
    select: { id: true, label: true, helpText: true },
  });
  if (q.label === newLabel && q.helpText === newHelpText) {
    console.log(`${key}: ya está actualizado -- sin cambios (idempotente).`);
    return;
  }
  await prisma.question.update({ where: { id: q.id }, data: { label: newLabel, helpText: newHelpText } });
  console.log(`${key}: label "${q.label}" -> "${newLabel}"`);
  console.log(`${key}: helpText "${q.helpText}" -> "${newHelpText}"`);
}

async function main() {
  await updateIfNeeded(
    "excavacion-espacio-trabajo-cm",
    "Espacio para trabajar alrededor de la piscina",
    "Es el espacio extra que se excava por fuera de los muros para poder trabajar durante la construcción. No corresponde al espesor del muro."
  );

  await updateIfNeeded(
    "entorno-ancho-m",
    "Ancho del borde alrededor de la piscina",
    "Indica cuánto piso o superficie quieres dejar alrededor de la piscina, medido desde la cara exterior del muro."
  );

  console.log("OK — copy de piscina-integral actualizado (sin tocar published ni cálculos).");
}

main().finally(() => prisma.$disconnect());
