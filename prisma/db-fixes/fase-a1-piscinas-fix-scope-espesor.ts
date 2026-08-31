import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// FASE A.1 — Piscinas: cierra el residuo detectado por Jorge tras el
// reporte de Fase A. `Norm.scope` de "OBRA-PISCINA-DIMENSIONAMIENTO"
// (exclusiva de los 2 módulos de piscina) todavía presentaba "0.20m" como
// si fuera el espesor típico/recomendado — contradice la decisión
// aprobada (20cm sigue PENDIENTE_VALIDACION, sin default efectivo). Se
// reformula esa frase con redacción neutral, sin agregar cifras nuevas,
// preservando el resto del contenido (cobertura/pérdida de revestimiento,
// caudal de filtro) intacto.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const norm = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-PISCINA-DIMENSIONAMIENTO" } });

  console.log("=== scope ANTERIOR ===");
  console.log(norm.scope);

  const OLD_FRAGMENT = "Espesor típico de muro/losa de piscina (0.20m), cobertura y pérdida por revestimiento";
  const NEW_FRAGMENT =
    "El espesor de muros y fondo debe definirse según las características y el diseño estructural del proyecto. Cobertura y pérdida por revestimiento";

  if (!norm.scope.includes(OLD_FRAGMENT)) {
    throw new Error("El fragmento esperado no coincidió — abortando sin cambios para no corromper el resto del texto.");
  }
  const newScope = norm.scope.replace(OLD_FRAGMENT, NEW_FRAGMENT);

  await prisma.norm.update({ where: { id: norm.id }, data: { scope: newScope } });

  console.log("\n=== scope NUEVO ===");
  console.log(newScope);

  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
