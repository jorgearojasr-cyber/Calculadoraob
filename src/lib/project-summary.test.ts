import { describe, expect, it } from "vitest";
import { summarizePersistedResult } from "./project-summary";

describe("summarizePersistedResult", () => {
  it("returns null for empty/missing results", () => {
    expect(summarizePersistedResult(undefined)).toBeNull();
    expect(summarizePersistedResult(null)).toBeNull();
    expect(summarizePersistedResult([])).toBeNull();
  });

  it("picks the first non-secondary result, using materialName when present", () => {
    const summary = summarizePersistedResult([
      { key: "volumen_total", label: "Volumen de hormigón", unit: "m³", value: 1.03, materialName: null },
      { key: "cemento", label: "Cemento", unit: "bolsas", value: 8, materialName: "Cemento (bolsa 25kg)" },
    ]);
    expect(summary).toBe("1,03 m³ de volumen de hormigón");
  });

  it("skips secondary results and falls back to label when materialName is null", () => {
    const summary = summarizePersistedResult([
      { key: "sec", label: "Secundario", unit: "m²", value: 5, materialName: null, isSecondary: true },
      { key: "primary", label: "Superficie", unit: "m²", value: 45, materialName: null },
    ]);
    expect(summary).toBe("45 m² de superficie");
  });

  it("returns null when every result is secondary", () => {
    const summary = summarizePersistedResult([
      { key: "sec", label: "Secundario", unit: "m²", value: 5, materialName: null, isSecondary: true },
    ]);
    expect(summary).toBeNull();
  });
});
