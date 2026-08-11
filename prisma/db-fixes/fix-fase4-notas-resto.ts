import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Sprint Producto V1.4, Fase 4 (07-ago-2026), grupo Resto (Techumbres,
// Aislación, Electricidad, Baño, Paisajismo, Yeso Cartón,
// Impermeabilización). Mismo mecanismo A que el grupo Alta Prioridad —
// agrega Formula.note a materiales con rendimiento/cobertura implícito.
// "cubierta" quedó fuera de este script porque sus 2 fórmulas relevantes
// (cubierta, planchas-zinc-grid) ya tenían note propia (verificado antes de
// escribir). Solo contenido — no toca expression, preguntas, resultados ni
// framework visual. Verificado que ninguna de estas explicaciones ya existe
// en Question.helpText o ModuleGuide de cada módulo.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UPDATES: { slug: string; key: string; note: string }[] = [
  {
    slug: "techo-inclinado-bajo-teja-zinc",
    key: "rollos-de-fieltro",
    note: "Cada rollo cubre 10 m² → para {ref:area-con-perdida} m² necesitas {value} {unit}.",
  },
  {
    slug: "aislacion-termica-bajo-cubierta",
    key: "rollos-lana-mineral",
    note: "Cada rollo cubre 12 m² → para {ref:area-con-perdida} m² necesitas {value} {unit}.",
  },
  {
    slug: "aislacion-termica-bajo-cubierta",
    key: "planchas-poliestireno",
    note: "Cada plancha cubre 2,88 m² → para {ref:area-con-perdida} m² necesitas {value} {unit}.",
  },
  {
    slug: "cable-cajas-y-placas",
    key: "rollos-de-cable",
    note: "Cada rollo trae 100 m → para {ref:metros-con-perdida} m necesitas {value} {unit}.",
  },
  {
    slug: "instalar-una-ducha",
    key: "silicona-tubos",
    note: "Cada tubo rinde aprox. 6 m de sellado → para un perímetro de {ref:perimetro-ducha} m necesitas {value} {unit}.",
  },
  {
    slug: "instalar-una-ducha",
    key: "rollos-impermeabilizante-ducha",
    note: "Cada rollo cubre 10 m² → para {ref:area-muros-con-perdida-ducha} m² necesitas {value} {unit}.",
  },
  {
    slug: "pasto-en-panes",
    key: "rollos-necesarios-estandar",
    note: "Cada rollo cubre {area-por-rollo-estandar} m² → para {ref:area-cesped-con-perdida} m² necesitas {value} {unit}.",
  },
  {
    slug: "pasto-en-panes",
    key: "rollos-necesarios-personalizado",
    note: "Cada rollo cubre {ref:area-por-rollo-personalizado} m² (el tamaño que ingresaste) → para {ref:area-cesped-con-perdida} m² necesitas {value} {unit}.",
  },
  {
    slug: "pasto-sintetico",
    key: "relleno-kg",
    note: "Dosis estándar: 6 kg de relleno por m² → {ref:area-bruta} m² × 6 = {value} {unit}.",
  },
  {
    slug: "pasto-sintetico",
    key: "pegamento-kg",
    note: "Dosis estándar: 0,3 kg de pegamento por metro de costura → {ref:costuras-metros} m × 0,3 = {value} {unit}.",
  },
  {
    slug: "tabiques-y-cielos",
    key: "planchas-de-yeso-carton",
    note: "Cada plancha cubre 2,88 m² → para {ref:area-con-perdida} m² necesitas {value} {unit}.",
  },
  {
    slug: "impermeabilizacion",
    key: "galones-de-pintura-impermeabilizante",
    note: "Cada galón cubre {cobertura-por-unidad-m} m² → para {ref:area-con-perdida} m² necesitas {value} {unit}.",
  },
  {
    slug: "impermeabilizacion",
    key: "rollos-de-membrana-asfaltica",
    note: "Cada rollo cubre {cobertura-por-unidad-m} m² → para {ref:area-con-perdida} m² necesitas {value} {unit}.",
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
