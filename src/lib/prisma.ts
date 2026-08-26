import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Fase 22A (docs/FASE22A_HARDENING_ACCESO_NEON.md) — la app en runtime usa
// una credencial de BD restringida (rol Postgres sin CREATEDB/CREATEROLE
// ni CREATE sobre el schema, solo DML sobre las tablas de la aplicación),
// separada de la credencial administrativa que usan `prisma migrate
// deploy`, los seeds y los scripts de `prisma/db-fixes/` (esos siguen
// usando `DATABASE_URL` sin cambios — ver ese documento para el porqué).
// `DATABASE_URL` queda como fallback para no romper un entorno local que
// todavía no definió `DATABASE_URL_RUNTIME`.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_RUNTIME ?? process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
