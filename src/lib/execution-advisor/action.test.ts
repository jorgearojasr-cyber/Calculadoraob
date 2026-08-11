import { describe, expect, it, vi, beforeEach } from "vitest";

// GATE DE PUBLICACIÓN (Fase 10B) — action.ts no toca Prisma directamente
// (siempre pasa por getExecutionAdvisorConfig, ver loader.ts), así que el
// gate real ya vive ahí. Estos tests confirman que action.ts no tiene un
// segundo camino que lo esquive: si el loader devuelve null (que es
// exactamente lo que pasa hoy con el ExecutionAdvisor de "excavacion",
// en PENDIENTE_VALIDACION), getExecutionAdvisorReport también debe
// devolver null SIN llegar a invocar evaluarAsesorEjecucion — un
// advisor pendiente nunca debe llegar al motor.

const getExecutionAdvisorConfigMock = vi.fn();
const evaluarAsesorEjecucionMock = vi.fn();

vi.mock("./loader", () => ({
  getExecutionAdvisorConfig: (...args: unknown[]) => getExecutionAdvisorConfigMock(...args),
}));
vi.mock("./evaluate", () => ({
  evaluarAsesorEjecucion: (...args: unknown[]) => evaluarAsesorEjecucionMock(...args),
}));

beforeEach(() => {
  getExecutionAdvisorConfigMock.mockReset();
  evaluarAsesorEjecucionMock.mockReset();
});

describe("getExecutionAdvisorReport — un advisor pendiente nunca llega al motor", () => {
  it("5. si el loader devuelve null (advisor no VALIDADO o inexistente), el motor NUNCA se invoca", async () => {
    getExecutionAdvisorConfigMock.mockResolvedValue(null);
    const { getExecutionAdvisorReport } = await import("./action");

    const informe = await getExecutionAdvisorReport("excavacion", { acceso: "solo_peatonal" });

    expect(informe).toBeNull();
    expect(evaluarAsesorEjecucionMock).not.toHaveBeenCalled();
  });

  // 6. "Un advisor pendiente nunca genera ExecutionAdvisorPanel" — no hay
  // infraestructura de testing de componentes React en este proyecto
  // (sin jsdom/@testing-library, ver package.json), así que esta garantía
  // se documenta a nivel de contrato: result-screen.tsx renderiza el panel
  // ÚNICAMENTE con `{informeEjecucion && <ExecutionAdvisorPanel ... />}`
  // (guard existente, no modificado en esta fase) — con informeEjecucion
  // siempre null para un advisor no VALIDADO (test anterior), ese && corto
  // circuita antes de montar el componente. El test de arriba (informe
  // === null) es la garantía real y suficiente: React nunca invoca
  // ExecutionAdvisorPanel con un valor null/undefined bajo ese patrón.

  it("con un advisor VALIDADO (config no-null), el motor SÍ se invoca y su resultado se propaga", async () => {
    const config = {
      nombre: "Asesor de prueba",
      options: [{ key: "manual", label: "Manual", descripcion: null, reduceConfidence: false, tipo: "metodo" as const }],
      rules: [],
      factorExplanations: [],
      tips: [],
    };
    getExecutionAdvisorConfigMock.mockResolvedValue(config);
    evaluarAsesorEjecucionMock.mockReturnValue({
      recomendacion: null,
      eleccionUsuario: { metodoKey: "manual", difiereDeRecomendacion: false },
      antesDeComenzar: { tips: [] },
    });
    const { getExecutionAdvisorReport } = await import("./action");

    const informe = await getExecutionAdvisorReport("excavacion", { metodo: "manual" });

    expect(evaluarAsesorEjecucionMock).toHaveBeenCalledTimes(1);
    expect(informe).not.toBeNull();
    expect(informe?.eleccionUsuario.metodoKey).toBe("manual");
    expect(informe?.eleccionUsuario.label).toBe("Manual");
  });
});
