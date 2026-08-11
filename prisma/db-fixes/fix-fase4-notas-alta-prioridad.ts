import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.4, Fase 4 (07-ago-2026), grupo Alta Prioridad.
// Mecanismo A: agrega Formula.note a materiales cuya cantidad depende de un
// rendimiento/cobertura implícito, siguiendo el patrón ya consolidado en
// fases anteriores ("Cada X cubre/rinde Y -> para Z necesitas {value}
// {unit}."). Solo contenido — no toca expression, preguntas, resultados ni
// framework visual. Verificado antes de escribir que ninguna de estas
// explicaciones ya existe en Question.helpText, ModuleGuide o Norm de cada
// módulo (no hay duplicado).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UPDATES: { slug: string; key: string; note: string }[] = [
  // --- Radier: dosificación manual (proporción volumétrica fija por m³) ---
  {
    slug: "radier",
    key: "cemento_manual",
    note: "Dosificación manual estándar: 7 sacos de cemento por cada m³ de hormigón → {ref:volumen_con_perdida} m³ × 7 = {value} {unit}.",
  },
  {
    slug: "radier",
    key: "arena_manual",
    note: "Dosificación manual estándar: 0,5 m³ de arena por cada m³ de hormigón → {ref:volumen_con_perdida} m³ × 0,5 = {value} {unit}.",
  },
  {
    slug: "radier",
    key: "gravilla_manual",
    note: "Dosificación manual estándar: 0,75 m³ de gravilla por cada m³ de hormigón → {ref:volumen_con_perdida} m³ × 0,75 = {value} {unit}.",
  },
  {
    slug: "radier",
    key: "agua_manual",
    note: "Dosificación manual estándar: 180 litros de agua por cada m³ de hormigón → {ref:volumen_con_perdida} m³ × 180 = {value} {unit}.",
  },
  // --- Cerámica (pisos) ---
  {
    slug: "ceramica-pisos",
    key: "adhesivo-pegamento",
    note: "Cada saco cubre aprox. 4 m² → para {ref:area-m2} m² + {lossFactor:perdida-por-corte-superficie-simple}% de pérdida necesitas {value} {unit}.",
  },
  {
    slug: "ceramica-pisos",
    key: "adhesivo-pegamento-2",
    note: "Cada saco cubre aprox. 4 m² → para {ref:area-m2} m² + {lossFactor:perdida-por-corte-superficie-irregular}% de pérdida necesitas {value} {unit}.",
  },
  {
    slug: "ceramica-pisos",
    key: "fraguue-simple",
    note: "Rinde según el tamaño de cerámica elegido ({kg-por-m2-fraguue} kg/m²) ÷ 5 kg por bolsa → para {ref:area-m2} m² + {lossFactor:perdida-por-corte-superficie-simple}% de pérdida necesitas {value} {unit}.",
  },
  {
    slug: "ceramica-pisos",
    key: "fraguue-irregular",
    note: "Rinde según el tamaño de cerámica elegido ({kg-por-m2-fraguue} kg/m²) ÷ 5 kg por bolsa → para {ref:area-m2} m² + {lossFactor:perdida-por-corte-superficie-irregular}% de pérdida necesitas {value} {unit}.",
  },
  // --- Porcelanato (piso) ---
  {
    slug: "porcelanato-piso",
    key: "adhesivo-c2-simple",
    note: "Cada saco cubre aprox. 3,2 m² → para {ref:area-m2} m² + {lossFactor:perdida-por-corte-superficie-simple}% de pérdida necesitas {value} {unit}.",
  },
  {
    slug: "porcelanato-piso",
    key: "adhesivo-c2-irregular",
    note: "Cada saco cubre aprox. 3,2 m² → para {ref:area-m2} m² + {lossFactor:perdida-por-corte-superficie-irregular}% de pérdida necesitas {value} {unit}.",
  },
  {
    slug: "porcelanato-piso",
    key: "fraguue-simple",
    note: "Rinde según el tamaño de porcelanato elegido ({kg-por-m2-fraguue} kg/m²) ÷ 5 kg por bolsa → para {ref:area-m2} m² + {lossFactor:perdida-por-corte-superficie-simple}% de pérdida necesitas {value} {unit}.",
  },
  {
    slug: "porcelanato-piso",
    key: "fraguue-irregular",
    note: "Rinde según el tamaño de porcelanato elegido ({kg-por-m2-fraguue} kg/m²) ÷ 5 kg por bolsa → para {ref:area-m2} m² + {lossFactor:perdida-por-corte-superficie-irregular}% de pérdida necesitas {value} {unit}.",
  },
  // --- Revestimiento de muro ---
  {
    slug: "revestimiento-de-muro",
    key: "adhesivo-pegamento",
    note: "Cada saco cubre aprox. 4 m² → para {ref:area-m2} m² + {lossFactor:perdida-por-corte-muro}% de pérdida necesitas {value} {unit}.",
  },
  {
    slug: "revestimiento-de-muro",
    key: "fraguue",
    note: "Rinde según el tamaño de cerámica elegido ({kg-por-m2-fraguue} kg/m²) ÷ 5 kg por bolsa → para {ref:area-m2} m² + {lossFactor:perdida-por-corte-muro}% de pérdida necesitas {value} {unit}.",
  },
  // --- Pintura: envases de sellador (conversión litros -> envase) ---
  {
    slug: "pintura",
    key: "envases-sellador-galon",
    note: "Cada galón equivale a 3,785 litros → para los {ref:litros-sellador-base} litros de sellador que necesitas, son {value} {unit}.",
  },
  {
    slug: "pintura",
    key: "envases-sellador-cuarto",
    note: "Cada cuarto de galón equivale a 0,946 litros → para los {ref:litros-sellador-base} litros de sellador que necesitas, son {value} {unit}.",
  },
  {
    slug: "pintura",
    key: "envases-sellador-cunete",
    note: "Cada cuñete equivale a 19 litros → para los {ref:litros-sellador-base} litros de sellador que necesitas, son {value} {unit}.",
  },
  // --- Piscinas: revestimiento (rendimiento por unidad depende del tipo elegido) ---
  {
    slug: "piscina-rectangular-hormigon-armado",
    key: "revestimiento",
    note: "Cada unidad de revestimiento cubre {cobertura-por-unidad-m} m² → para {ref:area-revestimiento-con-perdida} m² necesitas {value} {unit}.",
  },
  {
    slug: "piscina-rectangular-hormigon-armado",
    key: "revestimiento-borde",
    note: "Cada unidad de revestimiento cubre {cobertura-por-unidad-m} m² → para {ref:area-revestimiento-con-perdida-borde} m² necesitas {value} {unit}.",
  },
  {
    slug: "piscina-circular-hormigon-armado",
    key: "revestimiento",
    note: "Cada unidad de revestimiento cubre {cobertura-por-unidad-m} m² → para {ref:area-revestimiento-con-perdida} m² necesitas {value} {unit}.",
  },
  {
    slug: "piscina-circular-hormigon-armado",
    key: "revestimiento-borde",
    note: "Cada unidad de revestimiento cubre {cobertura-por-unidad-m} m² → para {ref:area-revestimiento-con-perdida-borde} m² necesitas {value} {unit}.",
  },
];

async function main() {
  for (const u of UPDATES) {
    const formula = await prisma.formula.findFirstOrThrow({
      where: { key: u.key, module: { slug: u.slug } },
    });
    if (formula.note) {
      throw new Error(`${u.slug}/${u.key} ya tiene note — revisar antes de continuar.`);
    }
    await prisma.formula.update({
      where: { id: formula.id },
      data: { note: u.note },
    });
    console.log(`OK — note agregada a ${u.slug}/${u.key}`);
  }
}

main().finally(() => prisma.$disconnect());
