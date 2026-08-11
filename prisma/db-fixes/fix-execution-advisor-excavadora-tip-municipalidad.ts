import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Revisión editorial de Fase 5 (04-ago-2026): el tip de "excavadora" sobre
// permiso municipal sonaba a instrucción/advertencia legal en vez de ayuda
// práctica. Se reemplaza por el texto aprobado por el usuario. Ver también
// el mismo ajuste reflejado en seed-execution-advisor-excavacion.ts.
const TEXTO_ANTERIOR = "Revisa si necesitas algún permiso municipal para el ingreso de maquinaria pesada a la calle.";
const TEXTO_NUEVO =
  "Si la maquinaria ocupará parte de la vía pública, consulta con tu municipalidad si corresponde realizar alguna coordinación o solicitar un permiso.";

async function main() {
  const tip = await prisma.executionAdvisorTip.findFirst({
    where: { aplicaAOpcionKey: "excavadora", orden: 2, texto: TEXTO_ANTERIOR },
  });

  if (!tip) {
    console.log("No se encontró el tip con el texto anterior — puede que ya esté actualizado. No se hace nada.");
    return;
  }

  await prisma.executionAdvisorTip.update({
    where: { id: tip.id },
    data: { texto: TEXTO_NUEVO },
  });

  console.log("Tip actualizado, id:", tip.id);
  console.log("Nuevo texto:", TEXTO_NUEVO);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
