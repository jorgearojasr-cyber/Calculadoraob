import type { PrismaClient } from "../src/generated/prisma/client";

// Inspecciones — Fase 1 (14-ago-2026): catálogo mínimo (solo CASA).
// Fase 6B (14-ago-2026): catálogo V2 aprobado en Fase 6A
// (docs/FASE6A_DISENO_CATALOGO_V2_INSPECCIONES.md) — extiende a
// DEPARTAMENTO y AMPLIACION sin romper lo existente: los 4 espacios y
// las 5 preguntas de Casa se mantienen con su `key`/id intactos, solo se
// amplía su `appliesTo` y se agrega catálogo nuevo al lado.
//
// Idempotente vía upsert por `key`/`slug` únicos, mismo patrón que
// seedRadierModule.
export async function seedInspeccionesModule(prisma: PrismaClient) {
  // --- Espacios ---
  // cocina/living/dormitorio/bano: mismos 4 de Fase 1, ahora también
  // aplicables a Departamento (diseño Fase 6A, sección C: "Departamento
  // reutiliza íntegramente los 4 espacios y elementos de Casa").
  // bodega/estacionamiento: exclusivos de Departamento (Fase 6A, sección
  // C/E) — únicos con respaldo real en ITO para ese tipo de inmueble.
  // recinto-ampliado: espacio genérico y repetible para Ampliación
  // (Fase 6A, sección D) — reutiliza los elementos ya validados de Casa
  // en vez de inventar espacios sin fuente.
  const spaceTemplates = [
    { key: "cocina", label: "Cocina", repeatable: false, order: 0, appliesTo: ["CASA", "DEPARTAMENTO"] },
    { key: "living", label: "Living", repeatable: false, order: 1, appliesTo: ["CASA", "DEPARTAMENTO"] },
    { key: "dormitorio", label: "Dormitorio", repeatable: true, order: 2, appliesTo: ["CASA", "DEPARTAMENTO"] },
    { key: "bano", label: "Baño", repeatable: true, order: 3, appliesTo: ["CASA", "DEPARTAMENTO"] },
    { key: "bodega", label: "Bodega", repeatable: false, order: 4, appliesTo: ["DEPARTAMENTO"] },
    { key: "estacionamiento", label: "Estacionamiento", repeatable: false, order: 5, appliesTo: ["DEPARTAMENTO"] },
    { key: "recinto-ampliado", label: "Recinto ampliado", repeatable: true, order: 6, appliesTo: ["AMPLIACION"] },
  ] as const;

  const spaceByKey = new Map<string, { id: string }>();
  for (const s of spaceTemplates) {
    const row = await prisma.inspectionSpaceTemplate.upsert({
      where: { key: s.key },
      update: { label: s.label, repeatable: s.repeatable, order: s.order, appliesTo: [...s.appliesTo], active: true },
      create: { key: s.key, label: s.label, repeatable: s.repeatable, order: s.order, appliesTo: [...s.appliesTo] },
    });
    spaceByKey.set(s.key, row);
  }

  // --- Elementos ---
  // piso/muros/ventana/puerta: ahora también aplicables a Departamento Y
  // Ampliación (Fase 6A, sección D/F: son los únicos elementos con
  // fundamento suficiente para reutilizarse en "Recinto ampliado").
  // artefactos-sanitarios: ahora también Departamento (vía Baño); NO
  // Ampliación (no hay baño genérico en un recinto ampliado por diseño).
  // enchufes-interruptores: nuevo, transversal (Cocina/Living/Dormitorio),
  // Casa y Departamento (Fase 6A, sección F).
  // bodega / estacionamiento: nuevos, un elemento por espacio exclusivo
  // de Departamento — no se comparte el mismo elemento entre ambos
  // espacios porque sus preguntas no son intercambiables (ver informe
  // Fase 6B, sección T).
  const elementTemplates = [
    { key: "piso", label: "Piso", order: 0, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "muros", label: "Muros", order: 1, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "ventana", label: "Ventana", order: 2, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "puerta", label: "Puerta", order: 3, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "artefactos-sanitarios", label: "Artefactos sanitarios", order: 4, appliesTo: ["CASA", "DEPARTAMENTO"] },
    { key: "enchufes-interruptores", label: "Enchufes e interruptores", order: 5, appliesTo: ["CASA", "DEPARTAMENTO"] },
    { key: "bodega", label: "Bodega", order: 6, appliesTo: ["DEPARTAMENTO"] },
    { key: "estacionamiento", label: "Estacionamiento", order: 7, appliesTo: ["DEPARTAMENTO"] },
  ] as const;

  const elementByKey = new Map<string, { id: string }>();
  for (const e of elementTemplates) {
    const row = await prisma.inspectionElementTemplate.upsert({
      where: { key: e.key },
      update: { label: e.label, order: e.order, appliesTo: [...e.appliesTo], active: true },
      create: { key: e.key, label: e.label, order: e.order, appliesTo: [...e.appliesTo] },
    });
    elementByKey.set(e.key, row);
  }

  // --- Tabla puente espacio <-> elemento (qué se sugiere revisar en cada
  // espacio) — ver Parte 12/13 del diseño: Cocina/Dormitorio/Baño/Living
  // reutilizan las MISMAS filas de "piso"/"muros"/"ventana". ---
  const spaceElementLinks: { spaceKey: string; elementKey: string; order: number }[] = [
    { spaceKey: "cocina", elementKey: "piso", order: 0 },
    { spaceKey: "cocina", elementKey: "muros", order: 1 },
    { spaceKey: "cocina", elementKey: "ventana", order: 2 },
    { spaceKey: "cocina", elementKey: "enchufes-interruptores", order: 3 },

    { spaceKey: "dormitorio", elementKey: "piso", order: 0 },
    { spaceKey: "dormitorio", elementKey: "muros", order: 1 },
    { spaceKey: "dormitorio", elementKey: "puerta", order: 2 },
    { spaceKey: "dormitorio", elementKey: "ventana", order: 3 },
    { spaceKey: "dormitorio", elementKey: "enchufes-interruptores", order: 4 },

    { spaceKey: "bano", elementKey: "piso", order: 0 },
    { spaceKey: "bano", elementKey: "muros", order: 1 },
    { spaceKey: "bano", elementKey: "artefactos-sanitarios", order: 2 },

    { spaceKey: "living", elementKey: "piso", order: 0 },
    { spaceKey: "living", elementKey: "muros", order: 1 },
    { spaceKey: "living", elementKey: "ventana", order: 2 },
    { spaceKey: "living", elementKey: "enchufes-interruptores", order: 3 },

    // Departamento — espacios exclusivos (Fase 6A, sección C/E).
    { spaceKey: "bodega", elementKey: "bodega", order: 0 },
    { spaceKey: "estacionamiento", elementKey: "estacionamiento", order: 0 },

    // Ampliación — reutiliza los 4 elementos ya validados, sin
    // "Estructura" (Fase 6A, sección D/L: fuente insuficiente, exclusión
    // deliberada, no revertir).
    { spaceKey: "recinto-ampliado", elementKey: "piso", order: 0 },
    { spaceKey: "recinto-ampliado", elementKey: "muros", order: 1 },
    { spaceKey: "recinto-ampliado", elementKey: "ventana", order: 2 },
    { spaceKey: "recinto-ampliado", elementKey: "puerta", order: 3 },
  ];

  for (const link of spaceElementLinks) {
    const spaceTemplateId = spaceByKey.get(link.spaceKey)!.id;
    const elementTemplateId = elementByKey.get(link.elementKey)!.id;
    await prisma.inspectionElementTemplateSpace.upsert({
      where: { spaceTemplateId_elementTemplateId: { spaceTemplateId, elementTemplateId } },
      update: { order: link.order },
      create: { spaceTemplateId, elementTemplateId, order: link.order },
    });
  }

  // --- Checklist (catálogo de preguntas) ---
  // Los 5 items de Fase 1 se mantienen sin cambios (texto, elemento,
  // orden) — Fase 5B ya vinculó `technicalArticleSlug`/`defaultSeverity`
  // a estos 5 vía script aparte (prisma/db-fixes/fase5b-...), y este seed
  // nunca toca esos dos campos en el `update`, así que ese vínculo no se
  // pierde al re-ejecutar.
  //
  // Los 6 nuevos (Fase 6A, secciones G/K) cierran el gap de Artefactos
  // sanitarios (incluye la pregunta de Grifería, plegada en este mismo
  // elemento en vez de un ElementTemplate aparte — ver informe Fase 6B,
  // sección T, para la reconciliación con el conteo aprobado de 8
  // elementos) y agregan Enchufes/interruptores, Bodega y Estacionamiento.
  // Ninguno trae `technicalArticleSlug` (regla Fase 6B punto 10: no crear
  // artículos nuevos en esta fase).
  const checklistItems: { elementKey: string; question: string; order: number }[] = [
    { elementKey: "piso", question: "¿Presenta daños visibles?", order: 0 },
    { elementKey: "piso", question: "¿Presenta desniveles?", order: 1 },
    { elementKey: "muros", question: "¿Presenta fisuras visibles?", order: 0 },
    { elementKey: "ventana", question: "¿Opera correctamente?", order: 0 },
    { elementKey: "puerta", question: "¿Cierra correctamente?", order: 0 },

    { elementKey: "artefactos-sanitarios", question: "¿Después de descargar el inodoro, el agua deja de correr con normalidad?", order: 0 },
    { elementKey: "artefactos-sanitarios", question: "¿No hay fugas visibles en la base de los artefactos?", order: 1 },
    { elementKey: "artefactos-sanitarios", question: "¿No hay goteras ni filtraciones en las llaves?", order: 2 },
    { elementKey: "enchufes-interruptores", question: "¿Cada enchufe probado funciona con un artefacto real?", order: 0 },
    { elementKey: "bodega", question: "¿La puerta cierra y el candado/cerradura funciona?", order: 0 },
    { elementKey: "estacionamiento", question: "¿La demarcación del espacio es clara y el pavimento está en buen estado?", order: 0 },
  ];

  for (const item of checklistItems) {
    const elementTemplateId = elementByKey.get(item.elementKey)!.id;
    const existing = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId, question: item.question },
    });
    if (existing) {
      await prisma.inspectionChecklistItem.update({ where: { id: existing.id }, data: { order: item.order } });
    } else {
      await prisma.inspectionChecklistItem.create({
        data: { elementTemplateId, question: item.question, order: item.order },
      });
    }
  }

  // --- Biblioteca técnica — un artículo de prueba, solo para validar la
  // relación conceptual (technicalArticleSlug), sin UI ni contenido real. ---
  await prisma.technicalArticle.upsert({
    where: { slug: "como-revisar-nivelacion-de-pavimentos" },
    update: {
      title: "Cómo revisar nivelación de pavimentos",
      content: "Artículo de prueba (Fase 1) — contenido real pendiente para una fase futura con UI de biblioteca.",
    },
    create: {
      slug: "como-revisar-nivelacion-de-pavimentos",
      title: "Cómo revisar nivelación de pavimentos",
      content: "Artículo de prueba (Fase 1) — contenido real pendiente para una fase futura con UI de biblioteca.",
    },
  });

  console.log(
    `Seed de Inspecciones completado: ${spaceTemplates.length} espacios, ${elementTemplates.length} elementos, ${spaceElementLinks.length} vínculos espacio-elemento, ${checklistItems.length} preguntas, 1 artículo técnico.`
  );
}
