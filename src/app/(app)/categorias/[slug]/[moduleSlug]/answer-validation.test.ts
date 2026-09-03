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

// Fase C6 (2026-09-02) — mismo mecanismo scopeado Module+Question, esta
// vez para las 10 preguntas de precio de Costos (sección 19/49 del pedido
// C6: "0 explícito" debe ser una respuesta válida y distinta de dejar el
// precio vacío/sin responder).
describe("isNumberAnswerInvalid — excepción C6 (piscina-integral / precios de Costos)", () => {
  const precioKeys = [
    "costos-precio-hormigon-m3",
    "costos-precio-retiro-viaje",
    "costos-precio-pintura-litro",
    "costos-precio-ceramica-interior-m2",
    "costos-precio-membrana-m2",
    "costos-precio-base-entorno-m3",
    "costos-precio-radier-terminado-m3",
    "costos-precio-ceramica-entorno-m2",
    "costos-precio-porcelanato-entorno-m2",
    "costos-precio-pastelon-unidad",
  ];

  it("0 explícito es válido para las 10 preguntas de precio", () => {
    for (const key of precioKeys) {
      expect(isNumberAnswerInvalid("piscina-integral", key, 0)).toBe(false);
    }
  });

  it("un positivo sigue siendo válido", () => {
    for (const key of precioKeys) {
      expect(isNumberAnswerInvalid("piscina-integral", key, 100000)).toBe(false);
    }
  });

  it("un negativo se rechaza incluso en la excepción (sección 50: no permitir negativos)", () => {
    for (const key of precioKeys) {
      expect(isNumberAnswerInvalid("piscina-integral", key, -1)).toBe(true);
    }
  });

  it("la MISMA key en otro Module NO hereda la excepción — 0 sigue inválido", () => {
    for (const key of precioKeys) {
      expect(isNumberAnswerInvalid("otro-modulo-cualquiera", key, 0)).toBe(true);
    }
  });
});
