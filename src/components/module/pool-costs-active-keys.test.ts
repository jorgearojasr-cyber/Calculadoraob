import { describe, expect, it } from "vitest";
import { getCostsActiveKeys } from "./pool-costs-active-keys";

// Fase C6.1 (2026-09-02) — matriz de visibilidad de las 10 preguntas de
// precio de Costos (piscina-integral). No duplica el motor monetario
// (fase-c6-piscina-integral-costos.ts / fase-c6-costos.test.ts) — esto
// solo fija el contrato de "qué precio se pide/muestra", no cuánto vale.

const ALWAYS = ["costos-precio-hormigon-m3", "costos-precio-retiro-viaje"];

describe("getCostsActiveKeys (Fase C6.1)", () => {
  it("Hormigón y Retiro siempre activos, incluso sin ninguna otra respuesta", () => {
    const active = getCostsActiveKeys({});
    for (const key of ALWAYS) expect(active.has(key)).toBe(true);
    expect(active.size).toBe(2);
  });

  it("1. Pintura/Pintura -> solo Question de precio Pintura (interior)", () => {
    const active = getCostsActiveKeys({ "interior-terminacion-muros": "pintura", "interior-terminacion-fondo": "pintura" });
    expect(active.has("costos-precio-pintura-litro")).toBe(true);
    expect(active.has("costos-precio-ceramica-interior-m2")).toBe(false);
    expect(active.has("costos-precio-membrana-m2")).toBe(false);
  });

  it("2. Pintura/Cerámica -> precio Pintura + precio Cerámica, nunca Membrana", () => {
    const active = getCostsActiveKeys({ "interior-terminacion-muros": "pintura", "interior-terminacion-fondo": "ceramica" });
    expect(active.has("costos-precio-pintura-litro")).toBe(true);
    expect(active.has("costos-precio-ceramica-interior-m2")).toBe(true);
    expect(active.has("costos-precio-membrana-m2")).toBe(false);
  });

  it("3. Membrana/Cerámica -> precio Membrana + precio Cerámica, nunca Pintura", () => {
    const active = getCostsActiveKeys({ "interior-terminacion-muros": "membrana", "interior-terminacion-fondo": "ceramica" });
    expect(active.has("costos-precio-membrana-m2")).toBe(true);
    expect(active.has("costos-precio-ceramica-interior-m2")).toBe(true);
    expect(active.has("costos-precio-pintura-litro")).toBe(false);
  });

  it("4. Sin calcular/Sin calcular -> ninguna Question de precio interior", () => {
    const active = getCostsActiveKeys({ "interior-terminacion-muros": "sin-calcular", "interior-terminacion-fondo": "sin-calcular" });
    expect(active.has("costos-precio-pintura-litro")).toBe(false);
    expect(active.has("costos-precio-ceramica-interior-m2")).toBe(false);
    expect(active.has("costos-precio-membrana-m2")).toBe(false);
  });

  it("5. Base nueva + Cerámica entorno -> precio base + precio cerámica exterior", () => {
    const active = getCostsActiveKeys({ "entorno-terminacion": "ceramica", "entorno-base-existente": "no" });
    expect(active.has("costos-precio-base-entorno-m3")).toBe(true);
    expect(active.has("costos-precio-ceramica-entorno-m2")).toBe(true);
    expect(active.has("costos-precio-radier-terminado-m3")).toBe(false);
  });

  it("6. Base existente + Porcelanato -> solo precio porcelanato, NUNCA precio base", () => {
    const active = getCostsActiveKeys({ "entorno-terminacion": "porcelanato", "entorno-base-existente": "si" });
    expect(active.has("costos-precio-porcelanato-entorno-m2")).toBe(true);
    expect(active.has("costos-precio-base-entorno-m3")).toBe(false);
  });

  it("7. Pastelones -> solo precio por pastelón, sin precio de otras terminaciones de entorno", () => {
    const active = getCostsActiveKeys({ "entorno-terminacion": "pastelones", "entorno-base-existente": "no" });
    expect(active.has("costos-precio-pastelon-unidad")).toBe(true);
    expect(active.has("costos-precio-ceramica-entorno-m2")).toBe(false);
    expect(active.has("costos-precio-porcelanato-entorno-m2")).toBe(false);
    // Pastelones también necesita base nueva (no es radier) -> precio base también activo.
    expect(active.has("costos-precio-base-entorno-m3")).toBe(true);
  });

  it("8. Radier terminado sin base -> solo precio radier terminado, NUNCA precio base (anti doble conteo)", () => {
    const active = getCostsActiveKeys({ "entorno-terminacion": "radier", "entorno-base-existente": "no" });
    expect(active.has("costos-precio-radier-terminado-m3")).toBe(true);
    expect(active.has("costos-precio-base-entorno-m3")).toBe(false);
  });

  it("9. Sin calcular entorno -> ninguna Question de precio de entorno (ni base, salvo que base-existente=no se combine con eso)", () => {
    const active = getCostsActiveKeys({ "entorno-terminacion": "sin-calcular", "entorno-base-existente": "si" });
    expect(active.has("costos-precio-ceramica-entorno-m2")).toBe(false);
    expect(active.has("costos-precio-porcelanato-entorno-m2")).toBe(false);
    expect(active.has("costos-precio-pastelon-unidad")).toBe(false);
    expect(active.has("costos-precio-radier-terminado-m3")).toBe(false);
    expect(active.has("costos-precio-base-entorno-m3")).toBe(false);
  });

  it("caso mixto completo (sección 1 del pedido C6.1): interior Pintura+Cerámica, entorno Pastelones+base nueva -> exactamente 6 activas", () => {
    const active = getCostsActiveKeys({
      "interior-terminacion-muros": "pintura",
      "interior-terminacion-fondo": "ceramica",
      "entorno-terminacion": "pastelones",
      "entorno-base-existente": "no",
    });
    const expected = [
      "costos-precio-hormigon-m3",
      "costos-precio-retiro-viaje",
      "costos-precio-pintura-litro",
      "costos-precio-ceramica-interior-m2",
      "costos-precio-base-entorno-m3",
      "costos-precio-pastelon-unidad",
    ];
    expect(Array.from(active).sort()).toEqual(expected.sort());
  });
});
