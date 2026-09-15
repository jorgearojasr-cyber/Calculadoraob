import { describe, expect, it, vi, beforeEach } from "vitest";

// Saneamiento de navegación (2026-09-14, auditoría de producto) — 2 cosas a
// fijar como contrato:
//   1. Inspecciones/Regularización/Guías/Biblioteca (features standalone,
//      sin fila en Module/Category/ProjectGroup/ProjectTask) deben
//      encontrarse con lenguaje natural simple, no solo el nombre exacto.
//   2. Un Module con `published:false` y una Category sin ningún módulo
//      publicado NUNCA deben aparecer en los resultados — mismo criterio
//      "no anunciar lo que no está disponible" que ya se aplica en
//      /categorias/[slug] y ahora en /guias.
//
// Mismo patrón de mock que src/lib/execution-advisor/loader.test.ts: se
// mockea @/lib/prisma con el mínimo necesario, simulando a mano el filtro
// `where` que Postgres aplicaría de verdad (si el `where.published` pedido
// no calza con el registro fake, no hay match) — así el test cubre tanto
// la lógica de scoring como que el `where` correcto se está pidiendo.
const moduleFindManyMock = vi.fn();
const categoryFindManyMock = vi.fn();
const projectGroupFindManyMock = vi.fn();
const projectTaskFindManyMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    module: { findMany: (...args: unknown[]) => moduleFindManyMock(...args) },
    category: { findMany: (...args: unknown[]) => categoryFindManyMock(...args) },
    projectGroup: { findMany: (...args: unknown[]) => projectGroupFindManyMock(...args) },
    projectTask: { findMany: (...args: unknown[]) => projectTaskFindManyMock(...args) },
  },
}));

vi.mock("@/lib/popular-tasks", () => ({ TASK_IMAGES: {} }));

type FakeModule = {
  id: string;
  slug: string;
  name: string;
  description: string;
  searchKeywords: string | null;
  imageUrl: string | null;
  published: boolean;
  category: { slug: string; name: string };
};

type FakeCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  publishedModuleCount: number;
};

function setupFakes({ modules, categories }: { modules: FakeModule[]; categories: FakeCategory[] }) {
  moduleFindManyMock.mockImplementation(async ({ where }: { where: { published: boolean } }) => {
    // Simula `where: { published: true }` tal como lo pide search.ts.
    return modules
      .filter((m) => m.published === where.published)
      .map((m) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        description: m.description,
        searchKeywords: m.searchKeywords,
        imageUrl: m.imageUrl,
        _count: { questions: 5 },
        category: m.category,
      }));
  });

  categoryFindManyMock.mockImplementation(async () => {
    // Simula el `include: { modules: { where: { published: true }, take: 1 } }`
    // — cada fake ya trae cuántos módulos publicados "tendría".
    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      modules: c.publishedModuleCount > 0 ? [{ id: `${c.id}-mod` }] : [],
    }));
  });

  projectGroupFindManyMock.mockResolvedValue([]);
  projectTaskFindManyMock.mockResolvedValue([]);
}

beforeEach(() => {
  moduleFindManyMock.mockReset();
  categoryFindManyMock.mockReset();
  projectGroupFindManyMock.mockReset();
  projectTaskFindManyMock.mockReset();
});

describe("searchContent — features standalone (Inspecciones/Regularización/Guías/Biblioteca)", () => {
  beforeEach(() => {
    setupFakes({ modules: [], categories: [] });
  });

  it.each([
    ["inspección", "Inspecciones"],
    ["inspeccionar", "Inspecciones"],
    ["revisar obra", "Inspecciones"],
    ["recibir casa", "Inspecciones"],
    ["recepción vivienda", "Inspecciones"],
    ["revisar ampliación", "Inspecciones"],
    ["regularizar", "Regularización"],
    ["ley del mono", "Regularización"],
    ["ampliar sin permiso", "Regularización"],
    ["regularización vivienda", "Regularización"],
    ["guía", "Guías y consejos"],
    ["aprender", "Guías y consejos"],
    ["consejos", "Guías y consejos"],
    ["cómo construir", "Guías y consejos"],
    ["biblioteca", "Biblioteca"],
    ["proyectos", "Biblioteca"],
    ["ejemplos", "Biblioteca"],
  ])("\"%s\" encuentra %s", async (query, expectedName) => {
    const { searchContent } = await import("./search");
    const results = await searchContent(query);
    expect(results.some((r) => r.type === "feature" && r.name === expectedName)).toBe(true);
  });

  it("cada feature standalone lleva a su ruta real, no a una calculadora", async () => {
    const { searchContent } = await import("./search");
    const results = await searchContent("inspección");
    const match = results.find((r) => r.name === "Inspecciones");
    expect(match?.href).toBe("/inspecciones");
    expect(match?.type).toBe("feature");
  });
});

describe("searchContent — módulos sin publicar nunca aparecen", () => {
  it("un module con published:false no aparece aunque el nombre matchee exacto", async () => {
    setupFakes({
      modules: [
        {
          id: "m1",
          slug: "escalera",
          name: "Escalera",
          description: "Calculadora de escalera de hormigón",
          searchKeywords: null,
          imageUrl: null,
          published: false,
          category: { slug: "hormigon", name: "Hormigón" },
        },
      ],
      categories: [],
    });
    const { searchContent } = await import("./search");
    const results = await searchContent("escalera");
    expect(results.some((r) => r.name === "Escalera")).toBe(false);
  });

  it("un module publicado sí aparece con el mismo query", async () => {
    setupFakes({
      modules: [
        {
          id: "m2",
          slug: "radier",
          name: "Radier",
          description: "Calculadora de radier de hormigón",
          searchKeywords: null,
          imageUrl: null,
          published: true,
          category: { slug: "hormigon", name: "Hormigón" },
        },
      ],
      categories: [],
    });
    const { searchContent } = await import("./search");
    const results = await searchContent("radier");
    expect(results.some((r) => r.type === "module" && r.name === "Radier")).toBe(true);
  });
});

describe("searchContent — categorías sin módulos publicados no aparecen", () => {
  it("una categoría con 0 módulos publicados no aparece aunque el nombre matchee", async () => {
    setupFakes({
      modules: [],
      categories: [
        { id: "c1", slug: "quinchos", name: "Quinchos", description: "Estructura, techo, terminaciones", publishedModuleCount: 0 },
      ],
    });
    const { searchContent } = await import("./search");
    const results = await searchContent("quinchos");
    expect(results.some((r) => r.name === "Quinchos")).toBe(false);
  });

  it("una categoría con al menos 1 módulo publicado sí aparece", async () => {
    setupFakes({
      modules: [],
      categories: [
        { id: "c2", slug: "ceramica", name: "Cerámica", description: "Pisos, revestimientos, pegado", publishedModuleCount: 3 },
      ],
    });
    const { searchContent } = await import("./search");
    const results = await searchContent("cerámica");
    expect(results.some((r) => r.type === "category" && r.name === "Cerámica")).toBe(true);
  });
});
