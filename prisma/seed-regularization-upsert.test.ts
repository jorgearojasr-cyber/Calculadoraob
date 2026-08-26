import { describe, it, expect } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client";
import { seedRegularizationDocuments } from "./seed-regularization";

// Fase 21A (docs/FASE21A_SEED_REGULARIZACION_IDEMPOTENTE_SEGURO.md) —
// reemplaza el guardrail de Fase 20A (retirado: protegía un
// `deleteMany` que ya no existe en el código, ver comentario "guardrail
// retirado" en seed-regularization.ts) por la prueba real de la nueva
// arquitectura: upsert por clave de negocio estable (`key`), sin ningún
// `deleteMany` sobre catálogo ni progreso.
//
// El fake de abajo simula la semántica real de Postgres/Prisma que
// importa para este seed: un upsert por `key` única asigna un `id` la
// primera vez y lo PRESERVA en corridas posteriores — exactamente el
// comportamiento que protege un `RegularizationDocumentCheck` real (que
// referencia ese `id` por FK) de romperse cuando el catálogo se
// resincroniza.
function createFakeChecklistStore() {
  const byKey = new Map<string, { id: string; key: string; [k: string]: unknown }>();
  const byId = new Map<string, { id: string; key: string; [k: string]: unknown }>();
  let autoId = 0;
  const createCalls: string[] = [];
  const updateCalls: string[] = [];

  const prisma = {
    regularizationDocumentChecklist: {
      upsert: async ({
        where,
        update,
        create,
      }: {
        where: { key: string };
        update: Record<string, unknown>;
        create: { key: string } & Record<string, unknown>;
      }): Promise<{ id: string; key: string; [k: string]: unknown }> => {
        const existing = byKey.get(where.key);
        if (existing) {
          const merged = { ...existing, ...update, id: existing.id, key: existing.key };
          byKey.set(where.key, merged);
          byId.set(existing.id, merged);
          updateCalls.push(where.key);
          return merged;
        }
        const id = `doc-${autoId++}`;
        const row = { ...create, id };
        byKey.set(where.key, row);
        byId.set(id, row);
        createCalls.push(where.key);
        return row;
      },
      findMany: async ({ where }: { where: { key: { notIn: string[] }; active: boolean } }) => {
        const excluded = new Set(where.key.notIn);
        return Array.from(byKey.values())
          .filter((r) => !excluded.has(r.key) && r.active !== false)
          .map((r) => ({ id: r.id, key: r.key }));
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = byId.get(where.id);
        if (row) Object.assign(row, data);
        return row;
      },
    },
  };

  return { prisma, byKey, byId, createCalls, updateCalls };
}

describe("seedRegularizationDocuments upsert (Fase 21A)", () => {
  it("creates exactly one row per unique business key on the first run", async () => {
    const { prisma, byKey, createCalls } = createFakeChecklistStore();
    await seedRegularizationDocuments(prisma as unknown as PrismaClient);
    const keys = Array.from(byKey.keys());
    expect(new Set(keys).size).toBe(keys.length); // 0 duplicate keys
    expect(createCalls.length).toBe(keys.length); // every row was a create
    expect(keys.length).toBeGreaterThan(0);
  });

  it("is idempotent: a second run updates every row, creates none, preserves ids", async () => {
    const { prisma, byKey, createCalls, updateCalls } = createFakeChecklistStore();
    await seedRegularizationDocuments(prisma as unknown as PrismaClient);
    const idsAfterFirstRun = new Map(Array.from(byKey.entries()).map(([k, v]) => [k, v.id]));
    const totalDocs = byKey.size;

    createCalls.length = 0;
    updateCalls.length = 0;
    await seedRegularizationDocuments(prisma as unknown as PrismaClient);

    expect(createCalls.length).toBe(0);
    expect(updateCalls.length).toBe(totalDocs);
    for (const [key, row] of Array.from(byKey.entries())) {
      expect(row.id).toBe(idsAfterFirstRun.get(key));
    }
  });

  it("preserves the id when only the label (documento) text changes for the same key", async () => {
    const { prisma } = createFakeChecklistStore();

    // Simula directamente la semántica del upsert (misma que ejercita el
    // seed real): primera corrida con un label, segunda con otro label,
    // misma key.
    const first = await prisma.regularizationDocumentChecklist.upsert({
      where: { key: "formulario-12-1" },
      create: { key: "formulario-12-1", documento: "Texto original", order: 0 },
      update: { documento: "Texto original", order: 0 },
    });
    const second = await prisma.regularizationDocumentChecklist.upsert({
      where: { key: "formulario-12-1" },
      create: { key: "formulario-12-1", documento: "Texto corregido", order: 5 },
      update: { documento: "Texto corregido", order: 5 },
    });

    expect(second.id).toBe(first.id);
    expect(second.documento).toBe("Texto corregido");
    expect(second.order).toBe(5);
  });

  it("prevents a duplicate business key from creating a second row", async () => {
    const { prisma, byKey } = createFakeChecklistStore();
    await prisma.regularizationDocumentChecklist.upsert({
      where: { key: "duplicado" },
      create: { key: "duplicado", documento: "A" },
      update: { documento: "A" },
    });
    await prisma.regularizationDocumentChecklist.upsert({
      where: { key: "duplicado" },
      create: { key: "duplicado", documento: "B" },
      update: { documento: "B" },
    });
    const matches = Array.from(byKey.values()).filter((r) => r.key === "duplicado");
    expect(matches.length).toBe(1);
    expect(matches[0].documento).toBe("B");
  });
});
