import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// FASE A — Piscinas: complemento. Al verificar el banner de resultado en
// localhost se encontró que el Norm "OBRA-PISCINA-DIMENSIONAMIENTO"
// (adjunto a variables/fórmulas de revestimiento y hormigón, EXCLUSIVO de
// los 2 módulos de piscina) menciona a Fulget explícitamente tanto en
// `scope` como en `note` — dependencia no detectada en la pasada anterior
// porque vive en el catálogo de Normas, no en Question/Formula/Variable.
// Se limpia la mención a Fulget, sin tocar el resto del contenido (el
// resto de `note`/`scope` sigue siendo válido para Cerámica/Membrana PVC).
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const norm = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-PISCINA-DIMENSIONAMIENTO" } });

  const newScope = norm.scope.replace(
    / Fulget: cobertura 1m²\/unidad y pérdida 5% \(superficie continua aplicada, no en piezas\)\.$/,
    ""
  );
  const newNote = norm.note!.replace(
    / Para Fulget en particular, no existe una tasa de rendimiento \(kg\/m²\) verificada de un fabricante específico — confirma la cobertura real con tu proveedor antes de comprar\.$/,
    ""
  );

  if (newScope === norm.scope || newNote === norm.note) {
    throw new Error("El texto esperado de Fulget no coincidió exactamente — abortando sin cambios para no corromper el resto del texto.");
  }

  await prisma.norm.update({
    where: { id: norm.id },
    data: { scope: newScope, note: newNote },
  });
  console.log("Norm OBRA-PISCINA-DIMENSIONAMIENTO actualizada — mención a Fulget removida de scope y note.");
  console.log("scope:", newScope);
  console.log("note:", newNote);

  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
