import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: npx tsx prisma/make-admin.ts tu@email.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No existe ningún usuario con el email "${email}". Inicia sesión al menos una vez antes de correr este script.`);
    process.exit(1);
  }

  await prisma.user.update({ where: { email }, data: { role: "admin" } });
  console.log(`Listo: ${email} ahora es admin.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
