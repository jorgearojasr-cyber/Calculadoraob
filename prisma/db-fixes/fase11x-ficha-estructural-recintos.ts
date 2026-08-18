import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11X (17-ago-2026) — implementación de la ficha estructural
// aprobada en Fase 11W (docs/FASE11W_CIERRE_ARQUITECTURA_FICHA_INSPECCION.md,
// secciones I/N/O). Solo NIVEL 1 (recintos) — nada de Nivel 2/3, nada de
// revisiones técnicas nuevas, nada de referencias visuales.
//
// Crea 3 InspectionSpaceTemplate nuevos:
//   - patio-trasero      (CASA)               — componente inicial: Piso
//   - terraza             (CASA, DEPARTAMENTO) — componentes: Piso, Muros, Ventana
//   - logia-lavanderia    (CASA, DEPARTAMENTO) — sin componentes todavía (solo recinto)
//
// IMPORTANTE (docs/FASE11X_INFORME_..., sección D) — este script
// DELIBERADAMENTE NO desactiva "terraza-logia" todavía. La BD es
// compartida entre desarrollo y producción, y el código de wizard
// actualmente DESPLEGADO en producción todavía ofrece el checkbox
// "Terraza/Logia" a usuarios reales. Si se desactivara el template
// ahora, ese checkbox seguiría visible en producción pero dejaría de
// generar el espacio silenciosamente (la Action filtra por
// `active: true` sin avisar) — una regresión real para usuarios en
// producción antes de que el código nuevo se publique. La
// desactivación de "terraza-logia" queda pospuesta a la fase de
// publicación (junto con el deploy del wizard que deja de ofrecerlo),
// para que ambos cambios sean atómicos. Ver función `deactivateOldTerrazaLogia`
// más abajo — se deja definida pero SIN llamar desde `main()`.
//
// Idempotente: upsert por `key` (único en el schema) para los templates,
// findFirst+create para los vínculos InspectionElementTemplateSpace (esa
// tabla no tiene un campo único simple más allá de la combinación
// spaceTemplateId+elementTemplateId, que sí está declarada @@unique en
// el schema — se usa upsert compuesto).
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // 1) Confirmar que "terraza-logia" sigue existiendo intacto — NO se
  // toca en esta ejecución (ver nota de seguridad arriba). Solo lectura.
  const terrazaLogia = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({
    where: { key: "terraza-logia" },
  });
  console.log(`OK: "terraza-logia" confirmado intacto (id ${terrazaLogia.id}, active=${terrazaLogia.active}) — sin modificar en esta ejecución.`);

  // 2) Crear/actualizar los 3 templates nuevos.
  const newTemplates = [
    {
      key: "patio-trasero",
      label: "Patio trasero",
      appliesTo: ["CASA"] as const,
      repeatable: false,
      order: 13,
    },
    {
      key: "terraza",
      label: "Terraza",
      appliesTo: ["CASA", "DEPARTAMENTO"] as const,
      repeatable: false,
      order: 14,
    },
    {
      key: "logia-lavanderia",
      label: "Logia / Lavandería",
      appliesTo: ["CASA", "DEPARTAMENTO"] as const,
      repeatable: false,
      order: 15,
    },
  ];

  const templateByKey = new Map<string, { id: string }>();
  for (const t of newTemplates) {
    const created = await prisma.inspectionSpaceTemplate.upsert({
      where: { key: t.key },
      update: { label: t.label, appliesTo: [...t.appliesTo], repeatable: t.repeatable, order: t.order, active: true },
      create: { key: t.key, label: t.label, appliesTo: [...t.appliesTo], repeatable: t.repeatable, order: t.order, active: true },
    });
    templateByKey.set(t.key, created);
    console.log(`OK: recinto "${t.label}" (key=${t.key}, id=${created.id})`);
  }

  // 3) Vincular componentes — SOLO los ya auditados y aprobados en Fase
  // 11X (docs/FASE11X_INFORME_..., sección K): Patio trasero -> Piso;
  // Terraza -> Piso, Muros, Ventana (mismo set que Terraza/Logia, ya
  // auditado como válido para exterior); Logia/Lavandería -> ninguno
  // (solo existe como recinto en esta fase, sin componentes todavía).
  const elementLinks: { spaceKey: string; elementKey: string; order: number }[] = [
    { spaceKey: "patio-trasero", elementKey: "piso", order: 0 },
    { spaceKey: "terraza", elementKey: "piso", order: 0 },
    { spaceKey: "terraza", elementKey: "muros", order: 1 },
    { spaceKey: "terraza", elementKey: "ventana", order: 2 },
  ];

  for (const link of elementLinks) {
    const spaceTemplate = templateByKey.get(link.spaceKey);
    if (!spaceTemplate) throw new Error(`Space template no encontrado en memoria: ${link.spaceKey}`);
    const elementTemplate = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: link.elementKey } });

    const existing = await prisma.inspectionElementTemplateSpace.findFirst({
      where: { spaceTemplateId: spaceTemplate.id, elementTemplateId: elementTemplate.id },
    });
    if (existing) {
      await prisma.inspectionElementTemplateSpace.update({ where: { id: existing.id }, data: { order: link.order } });
      console.log(`OK: vínculo actualizado ${link.spaceKey} <-> ${link.elementKey}`);
    } else {
      await prisma.inspectionElementTemplateSpace.create({
        data: { spaceTemplateId: spaceTemplate.id, elementTemplateId: elementTemplate.id, order: link.order },
      });
      console.log(`OK: vínculo creado ${link.spaceKey} <-> ${link.elementKey}`);
    }
  }

  console.log("\nFase 11X: ficha estructural de recintos — 3 recintos nuevos y vínculos aplicados. terraza-logia sigue activo (desactivación pospuesta a publicación).");
  await prisma.$disconnect();
}

// Deuda transitoria documentada (docs/FASE11X_INFORME_..., sección V):
// llamar esta función manualmente, o descomentar su llamada en main(),
// ÚNICAMENTE en la misma ventana en que se publique el código del
// wizard que deja de ofrecer "Terraza/Logia" — nunca antes.
async function deactivateOldTerrazaLogia(prisma: PrismaClient) {
  const terrazaLogia = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: "terraza-logia" } });
  await prisma.inspectionSpaceTemplate.update({ where: { id: terrazaLogia.id }, data: { active: false } });
  console.log(`OK: "terraza-logia" desactivado para generación futura (id ${terrazaLogia.id}).`);
}
void deactivateOldTerrazaLogia; // referenciada para evitar warning de "no usado"; se invoca manualmente cuando corresponda

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
