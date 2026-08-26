import { describe, it, expect } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client";
import { seedRegularizationDocuments } from "./seed-regularization";

// Fase 20A (docs/FASE20A_INVESTIGACION_FORENSE_INCIDENTE_NEON.md) —
// `seedRegularizationDocuments` borraba y recreaba TODO
// `RegularizationDocumentChecklist` con `deleteMany({})`, lo que en
// cascada elimina `RegularizationDocumentCheck` — progreso real de
// usuario (tiene userId/caseId, no es catálogo). El propio código ya
// advertía este riesgo en un comentario desde antes de que existieran
// usuarios reales; hoy `RegularizationCase` ya tiene casos reales en
// producción. Este test cubre el guardrail agregado: el seed debe
// abortar si detecta progreso real, en vez de borrarlo en silencio.
describe("seedRegularizationDocuments guardrail (Fase 20A)", () => {
  it("aborts before deleting anything when real user progress already exists", async () => {
    let deleteManyCalled = false;
    const fakePrisma = {
      regularizationDocumentCheck: {
        count: async () => 3,
        deleteMany: async () => {
          deleteManyCalled = true;
          return { count: 0 };
        },
      },
      regularizationDocumentChecklist: {
        deleteMany: async () => {
          deleteManyCalled = true;
          return { count: 0 };
        },
      },
    };

    await expect(seedRegularizationDocuments(fakePrisma as unknown as PrismaClient)).rejects.toThrow(
      /se aborta.*RegularizationDocumentCheck reales/
    );
    expect(deleteManyCalled).toBe(false);
  });
});
