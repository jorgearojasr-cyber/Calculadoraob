import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedRadierModule } from "./seed-radier";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { slug: "hormigon", name: "Hormigón", description: "Radieres, fundaciones, muros", icon: "Layers", tag: "Más usado" },
  { slug: "ceramica", name: "Cerámica", description: "Pisos, revestimientos, pegado", icon: "Grid3x3" },
  { slug: "albanileria", name: "Albañilería", description: "Ladrillos, bloques, mortero", icon: "LayoutGrid" },
  { slug: "pintura", name: "Pintura", description: "Interior, exterior, rendimiento", icon: "PaintBucket" },
  { slug: "fierros", name: "Fierros", description: "Enfierradura, mallas, traslapos", icon: "Construction" },
  { slug: "techumbres", name: "Techumbres", description: "Estructura, cubierta, aislación", icon: "Warehouse" },
  { slug: "yeso-carton", name: "Yeso Cartón", description: "Tabiques, cielos, planchas", icon: "LayoutGrid" },
  { slug: "excavaciones", name: "Excavaciones", description: "Volumen de tierra a mover", icon: "Construction" },
  { slug: "piscinas", name: "Piscinas", description: "Hormigón, revestimiento, filtrado", icon: "Waves" },
  { slug: "quinchos", name: "Quinchos", description: "Estructura, techo, terminaciones", icon: "Flame" },
  { slug: "impermeabilizacion", name: "Impermeabilización", description: "Techos, muros, fundaciones", icon: "Droplets" },
  { slug: "electricidad", name: "Electricidad", description: "Cableado, ductos, tableros", icon: "Zap" },
  { slug: "gas", name: "Gas", description: "Cañerías, artefactos, ventilación", icon: "Flame" },
  { slug: "agua", name: "Agua", description: "Cañerías, arranques, estanques", icon: "Droplets" },
  { slug: "paisajismo", name: "Paisajismo", description: "Pasto, tierra de hoja, riego", icon: "Trees" },
];

async function main() {
  for (let index = 0; index < CATEGORIES.length; index++) {
    const category = CATEGORIES[index];
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { ...category, order: index },
      create: { ...category, order: index },
    });
  }
  console.log(`Seed completado: ${CATEGORIES.length} categorías.`);

  await seedRadierModule(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
