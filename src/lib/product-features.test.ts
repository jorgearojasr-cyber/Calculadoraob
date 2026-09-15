import { describe, expect, it } from "vitest";
import {
  PRODUCT_FEATURES,
  PLANNED_FEATURES,
  getSearchableFeatures,
  getMenuFeatures,
  getHomeFeatures,
  type FeatureEntry,
} from "./product-features";

// Cimientos de arquitectura (2026-09-14) — contrato del registro central de
// features standalone. Dos grupos de tests:
//   1. Contra el registro REAL (PRODUCT_FEATURES) — fija qué está migrado
//      hoy y con qué visibilidad, para que un cambio accidental de flags
//      (ej. alguien pone showInMenu:true en Regularización sin querer)
//      rompa un test en vez de pasar desapercibido.
//   2. Contra arrays de prueba inyectados (ver el parámetro opcional
//      `features` de cada getter, agregado solo para esto) — fija el
//      CONTRATO de filtrado en sí (status/showInX), independiente de qué
//      haya hoy en el registro real.

function makeFeature(overrides: Partial<FeatureEntry>): FeatureEntry {
  return {
    id: "test-feature",
    name: "Test Feature",
    description: "Una feature de prueba.",
    href: "/test-feature",
    area: "aprende",
    icon: (() => null) as unknown as FeatureEntry["icon"],
    keywords: "test",
    status: "available",
    requiresAuth: false,
    showInSearch: true,
    showInMenu: true,
    showInHome: false,
    order: 0,
    ...overrides,
  };
}

describe("product-features — registro real", () => {
  it("las 4 features migradas están disponibles y son buscables", () => {
    const ids = PRODUCT_FEATURES.map((f) => f.id).sort();
    expect(ids).toEqual(["biblioteca", "guias", "inspecciones", "regularizacion"]);
    for (const feature of PRODUCT_FEATURES) {
      expect(feature.status).toBe("available");
      expect(feature.showInSearch).toBe(true);
      expect(feature.href).toBeTruthy();
    }
  });

  it("Regularización no aparece en el menú (decisión de producto ya tomada, preservada)", () => {
    const menuIds = getMenuFeatures().map((f) => f.id);
    expect(menuIds).not.toContain("regularizacion");
  });

  it("Inspecciones, Guías y Biblioteca sí aparecen en el menú", () => {
    const menuIds = getMenuFeatures().map((f) => f.id);
    expect(menuIds).toEqual(expect.arrayContaining(["inspecciones", "guias", "biblioteca"]));
  });

  it("getMenuFeatures respeta el orden declarado (`order` ascendente)", () => {
    const menuFeatures = getMenuFeatures();
    const orders = menuFeatures.map((f) => f.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("ninguna feature de PRODUCT_FEATURES aparece también en PLANNED_FEATURES", () => {
    const availableIds = new Set(PRODUCT_FEATURES.map((f) => f.id));
    for (const planned of PLANNED_FEATURES) {
      expect(availableIds.has(planned.id)).toBe(false);
    }
  });

  it("todas las PLANNED_FEATURES están marcadas status:\"planned\" y sin href", () => {
    for (const planned of PLANNED_FEATURES) {
      expect(planned.status).toBe("planned");
      expect("href" in planned).toBe(false);
    }
  });

  it("getHomeFeatures devuelve guias/inspecciones/regularizacion ordenadas, consumidas por la grilla del Home (Home ObraBien V2)", () => {
    expect(getHomeFeatures().map((f) => f.id)).toEqual(["guias", "inspecciones", "regularizacion"]);
  });
});

describe("product-features — contrato de filtrado (datos de prueba inyectados)", () => {
  it("una feature status:\"planned\" nunca aparece en getSearchableFeatures ni getMenuFeatures", () => {
    const fixtures = [makeFeature({ id: "a", status: "planned" })];
    expect(getSearchableFeatures(fixtures)).toEqual([]);
    expect(getMenuFeatures(fixtures)).toEqual([]);
  });

  it("una feature con showInSearch:false no aparece en getSearchableFeatures aunque esté disponible", () => {
    const fixtures = [makeFeature({ id: "a", showInSearch: false })];
    expect(getSearchableFeatures(fixtures)).toEqual([]);
  });

  it("una feature con showInMenu:false no aparece en getMenuFeatures aunque esté disponible", () => {
    const fixtures = [makeFeature({ id: "a", showInMenu: false })];
    expect(getMenuFeatures(fixtures)).toEqual([]);
  });

  it("una feature disponible con ambos flags en true aparece en ambos helpers, con su href real", () => {
    const fixtures = [makeFeature({ id: "a", href: "/a-real" })];
    expect(getSearchableFeatures(fixtures).map((f) => f.href)).toEqual(["/a-real"]);
    expect(getMenuFeatures(fixtures).map((f) => f.href)).toEqual(["/a-real"]);
  });
});
