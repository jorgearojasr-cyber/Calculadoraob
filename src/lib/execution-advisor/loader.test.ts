import { describe, expect, it, vi, beforeEach } from "vitest";

// GATE DE PUBLICACIÓN (Fase 10B, 10-ago-2026) — estos tests fijan el
// contrato: getExecutionAdvisorConfig SOLO puede devolver una config
// no-null cuando el ExecutionAdvisor real está en estado "VALIDADO".
// loader.ts depende de Prisma directamente (es la única pieza de este
// motor que lo hace, por diseño) — se mockea @/lib/prisma con el mínimo
// necesario para simular el filtrado real que hace la BD sobre el
// `where: { moduleSlug, estado: "VALIDADO" }` de la query, sin alterar
// nada en producción ni requerir configuración adicional de vitest (el
// alias "@/" no está configurado para vitest en este proyecto — vi.mock
// intercepta el specifier antes de que haga falta resolverlo).

const findUniqueMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { executionAdvisor: { findUnique: (...args: unknown[]) => findUniqueMock(...args) } },
}));

// Simula el comportamiento real de Postgres/Prisma: un `where` con
// `estado` filtra la fila igual que una cláusula SQL AND — si el
// registro real no tiene ese estado exacto, no hay match y la query
// devuelve null, sin importar qué otro campo coincida.
function fakeDbLookup(record: { moduleSlug: string; estado: string } & Record<string, unknown>) {
  findUniqueMock.mockImplementation(async ({ where }: { where: { moduleSlug: string; estado?: string } }) => {
    if (where.moduleSlug !== record.moduleSlug) return null;
    if (where.estado !== undefined && where.estado !== record.estado) return null;
    return record;
  });
}

const BASE_RECORD = {
  moduleSlug: "excavacion",
  nombre: "Asesor de Ejecución — Excavación",
  options: [{ key: "manual", label: "Manual", descripcion: null, reduceConfidence: false, tipo: "METODO" }],
  rules: [
    {
      prioridad: 1,
      condiciones: [{ questionKey: "acceso", operador: "equals", valor: "solo_peatonal" }],
      opcionRecomendadaKey: "manual",
      confianzaBase: "ALTA",
    },
  ],
  factorExplanations: [],
  tips: [],
};

beforeEach(() => {
  findUniqueMock.mockReset();
});

describe("getExecutionAdvisorConfig — gate de publicación", () => {
  it("1. estado VALIDADO: el advisor se carga con su contenido real", async () => {
    fakeDbLookup({ ...BASE_RECORD, estado: "VALIDADO" });
    const { getExecutionAdvisorConfig } = await import("./loader");
    const config = await getExecutionAdvisorConfig("excavacion");
    expect(config).not.toBeNull();
    expect(config?.nombre).toBe("Asesor de Ejecución — Excavación");
    expect(config?.rules).toHaveLength(1);
  });

  it("2. estado PENDIENTE_VALIDACION: el loader devuelve null (no llega contenido no aprobado)", async () => {
    fakeDbLookup({ ...BASE_RECORD, estado: "PENDIENTE_VALIDACION" });
    const { getExecutionAdvisorConfig } = await import("./loader");
    const config = await getExecutionAdvisorConfig("excavacion");
    expect(config).toBeNull();
  });

  it("3. estado desconocido/futuro (no 'VALIDADO'): también devuelve null — lista blanca, no lista negra", async () => {
    fakeDbLookup({ ...BASE_RECORD, estado: "ARCHIVADO" });
    const { getExecutionAdvisorConfig } = await import("./loader");
    const config = await getExecutionAdvisorConfig("excavacion");
    expect(config).toBeNull();
  });

  it("4. sin ExecutionAdvisor para ese módulo: devuelve null (mismo camino que siempre)", async () => {
    fakeDbLookup({ ...BASE_RECORD, estado: "VALIDADO", moduleSlug: "otro-modulo" });
    const { getExecutionAdvisorConfig } = await import("./loader");
    const config = await getExecutionAdvisorConfig("excavacion");
    expect(config).toBeNull();
  });

  it("verifica que la query real se hace con where.estado === 'VALIDADO' explícito", async () => {
    fakeDbLookup({ ...BASE_RECORD, estado: "VALIDADO" });
    const { getExecutionAdvisorConfig } = await import("./loader");
    await getExecutionAdvisorConfig("excavacion");
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { moduleSlug: "excavacion", estado: "VALIDADO" } })
    );
  });
});
