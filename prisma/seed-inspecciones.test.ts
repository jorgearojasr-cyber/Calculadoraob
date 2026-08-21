import { describe, it, expect } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client";
import { seedInspeccionesModule } from "./seed-inspecciones";

// Fase 18A (DT-03, docs/FASE18A_CIERRE_DEUDAS_TRANSVERSALES_DT01_DT02_DT03.md)
// — regresión estática contra el catálogo escrito en este seed, sin BD
// real: un Prisma fake registra cada upsert/create/update y detecta
// exactamente el tipo de error que causó el desfase original (una fila
// duplicada por error de transcripción, o una referencia a un `key` que
// no existe en el catálogo). La idempotencia real contra Postgres (2
// pasadas) y la comparación semántica campo a campo contra producción ya
// se verificaron en la rama Neon aislada `qa-dt03-seed-20260820` (ver
// informe de la fase, eliminada al cierre) — este test cubre lo que SÍ
// puede repetirse en cualquier CI futuro: que alguien agregue una fila
// duplicada o mal referenciada al editar el seed a mano.
function createFakePrisma() {
  const spaceIds = new Set<string>();
  const elementIds = new Set<string>();
  const linkKeysSeenThisRun = new Set<string>();
  const linkDuplicatesThisRun: string[] = [];
  const itemKeysSeenThisRun = new Set<string>();
  const itemDuplicatesThisRun: string[] = [];
  const articleSlugsSeenThisRun = new Set<string>();
  const articleDuplicatesThisRun: string[] = [];
  const checklistItemsByKey = new Map<string, { id: string }>();
  const createCalls: string[] = [];
  const updateCalls: string[] = [];
  let itemAutoId = 0;

  const prisma = {
    inspectionSpaceTemplate: {
      upsert: async ({ where }: { where: { key: string } }) => {
        spaceIds.add(where.key);
        return { id: where.key };
      },
    },
    inspectionElementTemplate: {
      upsert: async ({ where }: { where: { key: string } }) => {
        elementIds.add(where.key);
        return { id: where.key };
      },
    },
    inspectionElementTemplateSpace: {
      upsert: async ({
        where,
      }: {
        where: { spaceTemplateId_elementTemplateId: { spaceTemplateId: string; elementTemplateId: string } };
      }) => {
        const { spaceTemplateId, elementTemplateId } = where.spaceTemplateId_elementTemplateId;
        if (!spaceIds.has(spaceTemplateId)) throw new Error(`spaceKey inexistente referenciado: ${spaceTemplateId}`);
        if (!elementIds.has(elementTemplateId)) throw new Error(`elementKey inexistente referenciado: ${elementTemplateId}`);
        const key = `${spaceTemplateId}::${elementTemplateId}`;
        if (linkKeysSeenThisRun.has(key)) linkDuplicatesThisRun.push(key);
        linkKeysSeenThisRun.add(key);
        return { id: key };
      },
    },
    inspectionChecklistItem: {
      findFirst: async ({ where }: { where: { elementTemplateId: string; question: string } }) => {
        const key = `${where.elementTemplateId}::${where.question}`;
        return checklistItemsByKey.get(key) ?? null;
      },
      create: async ({ data }: { data: { elementTemplateId: string; question: string } }) => {
        if (!elementIds.has(data.elementTemplateId)) {
          throw new Error(`elementKey inexistente referenciado por checklistItem: ${data.elementTemplateId}`);
        }
        const key = `${data.elementTemplateId}::${data.question}`;
        if (itemKeysSeenThisRun.has(key)) itemDuplicatesThisRun.push(key);
        itemKeysSeenThisRun.add(key);
        createCalls.push(key);
        const id = `item-${itemAutoId++}`;
        checklistItemsByKey.set(key, { id });
        return { id };
      },
      update: async ({ where }: { where: { id: string } }) => {
        updateCalls.push(where.id);
        return { id: where.id };
      },
    },
    technicalArticle: {
      upsert: async ({ where }: { where: { slug: string } }) => {
        if (articleSlugsSeenThisRun.has(where.slug)) articleDuplicatesThisRun.push(where.slug);
        articleSlugsSeenThisRun.add(where.slug);
        return { slug: where.slug };
      },
    },
  };

  return {
    prisma,
    resetPerRunTracking: () => {
      linkKeysSeenThisRun.clear();
      linkDuplicatesThisRun.length = 0;
      itemKeysSeenThisRun.clear();
      itemDuplicatesThisRun.length = 0;
      articleSlugsSeenThisRun.clear();
      articleDuplicatesThisRun.length = 0;
    },
    stats: () => ({
      spaces: spaceIds.size,
      elements: elementIds.size,
      distinctItems: checklistItemsByKey.size,
      linkDuplicates: [...linkDuplicatesThisRun],
      itemDuplicates: [...itemDuplicatesThisRun],
      articleDuplicates: [...articleDuplicatesThisRun],
      createCalls: [...createCalls],
      updateCalls: [...updateCalls],
    }),
  };
}

describe("seedInspeccionesModule (Fase 18A, DT-03)", () => {
  it("never writes a duplicate space<->element link within one pass", async () => {
    const { prisma, stats } = createFakePrisma();
    await seedInspeccionesModule(prisma as unknown as PrismaClient);
    expect(stats().linkDuplicates).toEqual([]);
  });

  it("never writes a duplicate checklist item (same element + question) within one pass", async () => {
    const { prisma, stats } = createFakePrisma();
    await seedInspeccionesModule(prisma as unknown as PrismaClient);
    expect(stats().itemDuplicates).toEqual([]);
  });

  it("never writes a duplicate technical article slug within one pass", async () => {
    const { prisma, stats } = createFakePrisma();
    await seedInspeccionesModule(prisma as unknown as PrismaClient);
    expect(stats().articleDuplicates).toEqual([]);
  });

  it("only references element/space keys that were themselves seeded (referential integrity)", async () => {
    const { prisma } = createFakePrisma();
    // El fake lanza si un link o checklistItem referencia un key que
    // nunca pasó por el upsert de su propio catálogo — no debe lanzar.
    await expect(seedInspeccionesModule(prisma as unknown as PrismaClient)).resolves.not.toThrow();
  });

  it("is idempotent: a second pass creates zero new checklist items, only updates the existing ones", async () => {
    const { prisma, resetPerRunTracking, stats } = createFakePrisma();

    await seedInspeccionesModule(prisma as unknown as PrismaClient);
    const afterFirst = stats();
    const totalItems = afterFirst.createCalls.length;
    expect(afterFirst.updateCalls.length).toBe(0);

    resetPerRunTracking();
    await seedInspeccionesModule(prisma as unknown as PrismaClient);
    const afterSecond = stats();

    // El segundo pase no debe crear ningún item nuevo (createCalls no
    // creció) y debe actualizar exactamente los mismos que ya existían.
    expect(afterSecond.createCalls.length).toBe(totalItems);
    expect(afterSecond.updateCalls.length).toBe(totalItems);
    expect(afterSecond.distinctItems).toBe(totalItems);
  });
});
