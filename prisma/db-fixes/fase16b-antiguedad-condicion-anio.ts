import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 16B (corrección puntual de Fase 16A) — el documento "Antecedentes
// que acrediten antigüedad anterior al 04/02/2016" tenía dependeDe: null
// (se mostraba siempre, sin importar anioConstruccion). Se le agrega la
// misma condición ya definida en prisma/seed-regularization.ts
// (ANTIGUEDAD_APLICA): se sigue mostrando si anioConstruccion no está
// informado o es <= 2016, y se oculta solo si es estrictamente posterior
// a 2016. No se toca ningún otro campo de este documento ni de ningún
// otro — actualización dirigida por texto exacto de `documento`, no
// borrar-y-recrear (eso destruiría RegularizationDocumentCheck existentes
// por el onDelete: Cascade ya documentado en el seed).
const DOCUMENTO_TEXTO = "Antecedentes que acrediten antigüedad anterior al 04/02/2016";

const ANTIGUEDAD_APLICA = {
  op: "or",
  args: [
    { op: "not", value: { op: "defined", key: "anioConstruccion" } },
    { op: "<=", args: [{ var: "anioConstruccion" }, 2016] },
  ],
};

async function main() {
  const doc = await prisma.regularizationDocumentChecklist.findFirst({
    where: { documento: DOCUMENTO_TEXTO },
  });

  if (!doc) {
    console.log(`AVISO: no se encontró el documento "${DOCUMENTO_TEXTO}" — nada que corregir.`);
    return;
  }

  if (doc.dependeDe !== null) {
    console.log(`SKIP: el documento ya tiene dependeDe distinto de null (${JSON.stringify(doc.dependeDe)}), no se sobrescribe.`);
    return;
  }

  await prisma.regularizationDocumentChecklist.update({
    where: { id: doc.id },
    data: { dependeDe: ANTIGUEDAD_APLICA },
  });

  console.log(`OK: dependeDe actualizado para "${DOCUMENTO_TEXTO}" (id=${doc.id}).`);
}

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
