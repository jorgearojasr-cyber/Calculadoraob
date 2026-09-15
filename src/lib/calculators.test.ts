import { describe, expect, it } from "vitest";
import { CALCULATOR_CHIPS, CATEGORY_CHIP_MAP, filterCalculators, getCalculatorChip, type CalculatorModule } from "./calculators";

// calculators.ts reutiliza scoreMatch/normalize de search-scoring.ts (punto
// 3 del pedido: "usar lógica existente") — un módulo 100% puro, sin
// Prisma ni ninguna otra dependencia de servidor, así que no hace falta
// mockear nada acá (a diferencia de search.test.ts, que sí mockea
// @/lib/prisma porque search.ts trae ese import a nivel de módulo).

// Design Spec v1.0 — Parte 2 (Calculadoras/Herramientas), 2026-09-15.
// Contrato del filtro local (punto 23 del pedido: "agregar tests para
// filtro local; published; estado vacío; mapping de categorías").
//
// El guardrail de `published` en sí (no mostrar Module.published:false) y
// el de categorías vacías (fierros/quinchos, 0 módulos publicados) los
// aplica la query de Prisma en page.tsx (`where: { published: true }`,
// mismo patrón ya usado y no testeado individualmente en
// /categorias/[slug]/page.tsx) — filterCalculators() acá recibe la lista
// YA filtrada por published, así que estos tests cubren el contrato que sí
// vive en código puro: el mapeo estático de categorías y la combinación
// búsqueda+chip.

function makeCalculator(overrides: Partial<CalculatorModule>): CalculatorModule {
  return {
    id: "m1",
    slug: "modulo",
    name: "Módulo",
    description: "Descripción del módulo",
    imageUrl: null,
    categorySlug: "hormigon",
    categoryName: "Hormigón",
    ...overrides,
  };
}

describe("CATEGORY_CHIP_MAP — mapping de categorías reales", () => {
  it("no mapea fierros ni quinchos (categorías sin ningún módulo publicado, saneamiento ya aprobado)", () => {
    expect(getCalculatorChip("fierros")).toBeNull();
    expect(getCalculatorChip("quinchos")).toBeNull();
  });

  it("cubre las 17 categorías reales con módulos publicados en exactamente uno de los 4 chips", () => {
    const publishedCategorySlugs = [
      "hormigon", "ceramica", "albanileria", "pintura", "madera", "techumbres",
      "metalcon", "yeso-carton", "excavaciones", "piscinas", "impermeabilizacion",
      "electricidad", "gas", "agua", "paisajismo", "exterior", "bano",
    ];
    for (const slug of publishedCategorySlugs) {
      expect(CATEGORY_CHIP_MAP[slug], `categoría "${slug}" sin chip mapeado`).toBeDefined();
    }
  });

  it("declara exactamente 4 chips temáticos (dentro del máximo de 4-6 pedido)", () => {
    expect(CALCULATOR_CHIPS).toHaveLength(4);
  });

  it("una categoría no mapeada devuelve null en vez de reventar", () => {
    expect(getCalculatorChip("categoria-futura-sin-mapear")).toBeNull();
  });
});

describe("filterCalculators — filtro local (chip + búsqueda)", () => {
  const radier = makeCalculator({ id: "1", slug: "construir-un-radier", name: "Radier", description: "Hormigón, enfierradura", categorySlug: "hormigon" });
  const pintar = makeCalculator({ id: "2", slug: "pintar-una-habitacion", name: "Pintar una habitación", description: "Muros, cielos y fachadas", categorySlug: "pintura" });
  const ceramica = makeCalculator({ id: "3", slug: "ceramica-pisos", name: "Cerámica (pisos)", description: "Cajas de cerámica y sacos de adhesivo", categorySlug: "ceramica" });
  const riego = makeCalculator({ id: "4", slug: "instalar-riego-por-goteo", name: "Riego por goteo", description: "Manguera y goteros", categorySlug: "exterior" });
  const all = [radier, pintar, ceramica, riego];

  it("chip 'todas' + sin query devuelve todo sin filtrar", () => {
    expect(filterCalculators(all, "", "todas")).toHaveLength(4);
  });

  it("un chip temático solo deja pasar su categoría mapeada", () => {
    const result = filterCalculators(all, "", "obra-gruesa");
    expect(result.map((c) => c.id)).toEqual(["1"]); // solo Radier (hormigon)
  });

  it("la búsqueda por nombre encuentra el módulo aunque el chip esté en 'todas'", () => {
    const result = filterCalculators(all, "pintar", "todas");
    expect(result.map((c) => c.id)).toEqual(["2"]);
  });

  it("búsqueda + chip se combinan (AND): un término que matchea otra categoría no aparece", () => {
    // "pintar" matchea el módulo Pintar (categoría pintura), pero el chip
    // pide solo "exterior" — no debe aparecer.
    const result = filterCalculators(all, "pintar", "exterior");
    expect(result).toHaveLength(0);
  });

  it("búsqueda + chip coincidentes sí devuelven resultado", () => {
    const result = filterCalculators(all, "riego", "exterior");
    expect(result.map((c) => c.id)).toEqual(["4"]);
  });

  it("estado vacío: una búsqueda sin ningún match devuelve arreglo vacío, no inventa resultados", () => {
    expect(filterCalculators(all, "cotizacion de maestro", "todas")).toEqual([]);
  });

  it("tolera acentos (normalize compartido con el buscador global)", () => {
    const result = filterCalculators(all, "ceramica", "todas"); // sin tilde
    expect(result.map((c) => c.id)).toEqual(["3"]);
  });
});
