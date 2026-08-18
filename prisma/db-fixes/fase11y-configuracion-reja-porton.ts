import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11Y (docs/FASE11Y_INFORME_PILOTO_CONFIGURACION_NIVEL2.md) — piloto
// de Nivel 2: Reja/Portón dejan de generarse automáticamente al crear un
// caso nuevo. La forma en que esto se logra es DELIBERADAMENTE de código,
// no de catálogo: `LEVEL2_GATED_ELEMENT_KEYS` en
// src/app/(app)/inspecciones/actions.ts filtra "reja"/"porton" fuera del
// loop de generación, sin importar si el vínculo de catálogo
// (InspectionElementTemplateSpace Reja->Antejardín, Portón->Acceso
// vehicular) sigue existiendo.
//
// Por qué NO se toca el catálogo en esta ejecución (mismo análisis que
// terraza-logia, Fase 11X-P): la BD es compartida entre dev y producción.
// El código HOY desplegado en producción todavía usa la generación vieja
// (sin el filtro Nivel 2) y SÍ depende de que esos vínculos existan para
// seguir generando Reja/Portón automáticamente. Si se borraran los
// vínculos ahora, producción dejaría de generar Reja/Portón para casos
// nuevos SIN tener todavía la UI de configuración Nivel 2 que los
// reemplace — una regresión real para usuarios reales antes del deploy.
//
// Este script, por lo tanto, NO modifica nada en `main()` — solo
// confirma en modo lectura que los vínculos siguen intactos. La función
// `removeRejaPortonAutoLinks` queda definida pero SIN llamar, para
// ejecutarse manualmente (o descomentar su llamada) únicamente en la
// misma ventana en que se publique el código de este piloto — igual que
// `deactivateOldTerrazaLogia` en fase11x-ficha-estructural-recintos.ts.
// Nota: incluso sin ejecutar esta función, el código nuevo YA deja de
// generar Reja/Portón automáticamente (por el filtro en código) — esta
// función es limpieza de catálogo opcional, no un requisito funcional.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const antejardin = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: "antejardin" } });
  const accesoVehicular = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: "acceso-vehicular" } });
  const reja = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: "reja" } });
  const porton = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: "porton" } });

  const linkReja = await prisma.inspectionElementTemplateSpace.findFirst({
    where: { spaceTemplateId: antejardin.id, elementTemplateId: reja.id },
  });
  const linkPorton = await prisma.inspectionElementTemplateSpace.findFirst({
    where: { spaceTemplateId: accesoVehicular.id, elementTemplateId: porton.id },
  });

  console.log(`OK: vínculo Reja->Antejardín ${linkReja ? `intacto (id ${linkReja.id})` : "NO ENCONTRADO"} — sin modificar en esta ejecución.`);
  console.log(`OK: vínculo Portón->Acceso vehicular ${linkPorton ? `intacto (id ${linkPorton.id})` : "NO ENCONTRADO"} — sin modificar en esta ejecución.`);
  console.log(
    "\nFase 11Y: piloto de configuración Nivel 2 — código ya filtra Reja/Portón de la generación automática. Catálogo sin cambios (desacople de vínculos pospuesto a publicación)."
  );

  await prisma.$disconnect();
}

// Deuda transitoria documentada (docs/FASE11Y_INFORME_..., sección W):
// ejecutar manualmente, o descomentar su llamada en main(), ÚNICAMENTE
// en la misma ventana en que se publique el código de este piloto.
async function removeRejaPortonAutoLinks(prisma: PrismaClient) {
  const antejardin = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: "antejardin" } });
  const accesoVehicular = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: "acceso-vehicular" } });
  const reja = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: "reja" } });
  const porton = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: "porton" } });

  const linkReja = await prisma.inspectionElementTemplateSpace.findFirst({
    where: { spaceTemplateId: antejardin.id, elementTemplateId: reja.id },
  });
  if (linkReja) {
    await prisma.inspectionElementTemplateSpace.delete({ where: { id: linkReja.id } });
    console.log(`OK: vínculo Reja->Antejardín eliminado (id ${linkReja.id}).`);
  }

  const linkPorton = await prisma.inspectionElementTemplateSpace.findFirst({
    where: { spaceTemplateId: accesoVehicular.id, elementTemplateId: porton.id },
  });
  if (linkPorton) {
    await prisma.inspectionElementTemplateSpace.delete({ where: { id: linkPorton.id } });
    console.log(`OK: vínculo Portón->Acceso vehicular eliminado (id ${linkPorton.id}).`);
  }
}
void removeRejaPortonAutoLinks; // referenciada para evitar warning de "no usado"; se invoca manualmente cuando corresponda

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
