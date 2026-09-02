import { describe, expect, it } from "vitest";
import { isNumberAnswerInvalid } from "./answer-validation";

// Fase C3.1 (2026-09-01) -- fija el contrato de la excepción puntual
// Module+key a "Preparación bajo losa" (piscina-integral), agregada en
// C3 para permitir 0 en esa pregunta específica sin ampliar la
// aceptación de cero a ninguna otra NUMBER del catálogo. El caso E
// (misma key en OTRO Module) es el que demuestra que el scope real es
// Module+key y no key sola.
describe("isNumberAnswerInvalid — excepción C3 (piscina-integral / excavacion-preparacion-losa-cm)", () => {
  it("CASO B: 0 es válido para piscina-integral + excavacion-preparacion-losa-cm", () => {
    expect(isNumberAnswerInvalid("piscina-integral", "excavacion-preparacion-losa-cm", 0)).toBe(false);
  });

  it("CASO C: un positivo sigue siendo válido", () => {
    expect(isNumberAnswerInvalid("piscina-integral", "excavacion-preparacion-losa-cm", 10)).toBe(false);
  });

  it("CASO D: un negativo se rechaza incluso en la excepción", () => {
    expect(isNumberAnswerInvalid("piscina-integral", "excavacion-preparacion-losa-cm", -1)).toBe(true);
  });

  it("CASO E: la MISMA key en otro Module NO hereda la excepción — 0 sigue inválido", () => {
    expect(isNumberAnswerInvalid("otro-modulo-cualquiera", "excavacion-preparacion-losa-cm", 0)).toBe(true);
  });

  it("cualquier otra NUMBER de piscina-integral sigue rechazando 0 (ej. espacio de trabajo, capacidad personalizada)", () => {
    expect(isNumberAnswerInvalid("piscina-integral", "excavacion-espacio-trabajo-cm", 0)).toBe(true);
    expect(isNumberAnswerInvalid("piscina-integral", "excavacion-capacidad-personalizada-m3", 0)).toBe(true);
    expect(isNumberAnswerInvalid("piscina-integral", "largo-interior-metros", 0)).toBe(true);
  });

  it("NaN / no finito siempre inválido, incluso en la excepción", () => {
    expect(isNumberAnswerInvalid("piscina-integral", "excavacion-preparacion-losa-cm", NaN)).toBe(true);
    expect(isNumberAnswerInvalid("piscina-integral", "excavacion-preparacion-losa-cm", Infinity)).toBe(true);
  });
});
