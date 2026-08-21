import { describe, it, expect } from "vitest";
import { resolveInitialSeverity } from "./severity";

describe("resolveInitialSeverity (Fase 18A, DT-01)", () => {
  it("respects an already-saved severity, ignoring the catalog default", () => {
    expect(resolveInitialSeverity("LOW", "HIGH")).toBe("LOW");
    expect(resolveInitialSeverity("CRITICAL", null)).toBe("CRITICAL");
  });

  it("uses the checklist item's defaultSeverity for a brand-new observation", () => {
    expect(resolveInitialSeverity(null, "HIGH")).toBe("HIGH");
    expect(resolveInitialSeverity(undefined, "LOW")).toBe("LOW");
  });

  it("falls back to MEDIUM only when there is neither a saved severity nor a catalog default", () => {
    expect(resolveInitialSeverity(null, null)).toBe("MEDIUM");
    expect(resolveInitialSeverity(undefined, undefined)).toBe("MEDIUM");
  });
});
