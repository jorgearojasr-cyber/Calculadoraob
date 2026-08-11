import { describe, expect, it } from "vitest";
import { debeMostrarPuenteSeguridad } from "./execution-advisor-panel-helpers";

// Fase 10D — contrato del puente editorial de seguridad: visible SOLO
// cuando la recomendación es "manual" (única opción donde el usuario
// entra físicamente al hoyo excavado), ausente para cualquier otra
// opción o cuando no hay método recomendado.
describe("debeMostrarPuenteSeguridad", () => {
  it("recomendación 'manual' -> mensaje visible", () => {
    expect(debeMostrarPuenteSeguridad("manual")).toBe(true);
  });

  it("recomendación distinta de 'manual' -> mensaje ausente", () => {
    expect(debeMostrarPuenteSeguridad("mini_excavadora")).toBe(false);
    expect(debeMostrarPuenteSeguridad("retroexcavadora")).toBe(false);
    expect(debeMostrarPuenteSeguridad("excavadora")).toBe(false);
  });

  it("sin método (null/undefined) -> mensaje ausente", () => {
    expect(debeMostrarPuenteSeguridad(null)).toBe(false);
    expect(debeMostrarPuenteSeguridad(undefined)).toBe(false);
  });
});
