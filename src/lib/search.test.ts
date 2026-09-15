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

// Cimientos de arquitectura (2026-09-14) — search.ts ya no declara las
// features standalone a mano, las lee de src/lib/product-features.ts (el
// registro central). Se mockea acá con un fixture que copia LITERAL el
// name/description/href/area/keywords de las 4 entradas reales de
// PRODUCT_FEATURES — así este archivo sigue probando que las keywords
// aprobadas (lenguaje natural) funcionan de punta a punta a través de
// searchContent, sin acoplarse a la implementación interna del registro
// (eso lo prueba product-features.test.ts por separado). Si el día de
// mañana el registro real cambia esas keywords, este fixture necesita
// actualizarse a mano — es el mismo trade-off que loader.test.ts ya acepta
// con su BASE_RECORD.
const SEARCH_FEATURE_FIXTURES = [
  {
    id: "inspecciones",
    name: "Inspecciones",
    description: "Revisa tu obra o la casa que vas a recibir con una checklist guiada, antes de la recepción o entrega.",
    href: "/inspecciones",
    area: "revisa" as const,
    keywords:
      "inspeccion inspecciones inspeccionar revisar revision obra recibir casa recepcion vivienda revisar ampliacion checklist",
  },
  {
    id: "regularizacion",
    name: "Regularización",
    description: "Regulariza tu vivienda o ampliación construida sin permiso, según la Ley N.º 20.898 (Ley del Mono).",
    href: "/regularizacion",
    area: "regulariza" as const,
    keywords:
      "regularizar regularizacion ley del mono ampliar sin permiso permiso de edificacion vivienda dgoc municipalidad",
  },
  {
    id: "guias",
    name: "Guías y consejos",
    description: "Consejos prácticos, errores comunes y experiencia de obra para proyectos que ya tienen guía completa.",
    href: "/guias",
    area: "aprende" as const,
    keywords: "guia guias aprender consejos como construir tips recomendaciones",
  },
  {
    id: "biblioteca",
    name: "Biblioteca",
    description: "Proyectos terminados por otros usuarios, como ejemplo e inspiración para el tuyo.",
    href: "/galeria",
    area: "aprende" as const,
    keywords: "biblioteca proyectos ejemplos fotos terminados inspiracion",
  },
];

const getSearchableFeaturesMock = vi.fn();
getSearchableFeaturesMock.mockReturnValue(SEARCH_FEATURE_FIXTURES);

vi.mock("@/lib/product-features", () => ({
  getSearchableFeatures: (...args: unknown[]) => getSearchableFeaturesMock(...args),
  PRODUCT_AREAS: {
    revisa: { label: "Revisa tu obra" },
    regulariza: { label: "Regulariza" },
    aprende: { label: "Aprende" },
  },
}));

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
  getSearchableFeaturesMock.mockReset();
  getSearchableFeaturesMock.mockReturnValue(SEARCH_FEATURE_FIXTURES);
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

  // El filtro real de showInSearch/status vive en product-features.ts (ver
  // product-features.test.ts) — acá se prueba la INTEGRACIÓN: si el
  // registro central ya excluyó una feature (porque showInSearch:false o
  // porque no está publicada/disponible), searchContent nunca la agrega
  // por su cuenta — confía ciegamente en lo que getSearchableFeatures
  // devuelve, sin una lista propia de respaldo.
  it("una feature que el registro no devuelve (showInSearch:false o no disponible) no aparece en los resultados", async () => {
    getSearchableFeaturesMock.mockReturnValue(
      SEARCH_FEATURE_FIXTURES.filter((f) => f.id !== "regularizacion")
    );
    const { searchContent } = await import("./search");
    const results = await searchContent("regularizar");
    expect(results.some((r) => r.type === "feature" && r.name === "Regularización")).toBe(false);
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
