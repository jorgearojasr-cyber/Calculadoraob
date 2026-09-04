import { describe, expect, it } from "vitest";
import { getExtraVisibleSlugs, isModuleVisible } from "./module-visibility";

// Fase C7.3 (2026-09-04) — matriz mínima del gate de Preview: piscina-integral
// debe ser visible en local development y en Vercel Preview aunque
// published=false en la BD, y seguir invisible en Vercel Production real.
// Ningún otro módulo unpublished debe volverse visible por este gate.

describe("isModuleVisible (Fase C7.3)", () => {
  it("piscina-integral + published=false + development → visible", () => {
    expect(
      isModuleVisible({ slug: "piscina-integral", published: false }, { nodeEnv: "development", vercelEnv: undefined })
    ).toBe(true);
  });

  it("piscina-integral + published=false + Vercel preview → visible", () => {
    expect(
      isModuleVisible({ slug: "piscina-integral", published: false }, { nodeEnv: "production", vercelEnv: "preview" })
    ).toBe(true);
  });

  it("piscina-integral + published=false + Vercel production → NO visible", () => {
    expect(
      isModuleVisible({ slug: "piscina-integral", published: false }, { nodeEnv: "production", vercelEnv: "production" })
    ).toBe(false);
  });

  it("piscina-integral + published=false + producción sin VERCEL_ENV definido → NO visible", () => {
    expect(
      isModuleVisible({ slug: "piscina-integral", published: false }, { nodeEnv: "production", vercelEnv: undefined })
    ).toBe(false);
  });

  it("otro módulo unpublished + Vercel preview → NO visible", () => {
    expect(
      isModuleVisible({ slug: "otro-modulo-cualquiera", published: false }, { nodeEnv: "production", vercelEnv: "preview" })
    ).toBe(false);
  });

  it("otro módulo unpublished + development → NO visible (solo piscina-integral está en la lista de Preview)", () => {
    expect(
      isModuleVisible({ slug: "otro-modulo-cualquiera", published: false }, { nodeEnv: "development", vercelEnv: undefined })
    ).toBe(false);
  });

  it("módulo published + Vercel production → visible (comportamiento normal sin cambios)", () => {
    expect(
      isModuleVisible({ slug: "cualquier-modulo-publicado", published: true }, { nodeEnv: "production", vercelEnv: "production" })
    ).toBe(true);
  });
});

describe("getExtraVisibleSlugs (Fase C7.3)", () => {
  it("development → incluye piscina-integral", () => {
    expect(getExtraVisibleSlugs({ nodeEnv: "development", vercelEnv: undefined })).toEqual(["piscina-integral"]);
  });

  it("Vercel preview → incluye piscina-integral", () => {
    expect(getExtraVisibleSlugs({ nodeEnv: "production", vercelEnv: "preview" })).toEqual(["piscina-integral"]);
  });

  it("Vercel production → lista vacía", () => {
    expect(getExtraVisibleSlugs({ nodeEnv: "production", vercelEnv: "production" })).toEqual([]);
  });
});
