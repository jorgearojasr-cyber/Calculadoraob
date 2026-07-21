import { prisma } from "@/lib/prisma";

export type SearchResult = {
  type: "module" | "category";
  id: string;
  name: string;
  description: string;
  href: string;
  categoryName: string;
};

// Minúsculas + sin tildes/diacríticos, para tolerar variaciones de acentos
// (ej. "pintura" encuentra "Pintura" aunque el usuario no tipee la tilde,
// y viceversa) sin depender de la extensión unaccent de Postgres.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Menor score = mejor coincidencia. Nombre exacto/prefijo pesa mucho más
// que un match perdido en la descripción o en las palabras clave.
function scoreMatch(query: string, name: string, description: string, keywords?: string | null): number | null {
  const normalizedQuery = normalize(query);
  const normalizedName = normalize(name);

  if (normalizedName === normalizedQuery) return 0;
  if (normalizedName.startsWith(normalizedQuery)) return 1;
  if (normalizedName.includes(normalizedQuery)) return 2;
  if (keywords && normalize(keywords).includes(normalizedQuery)) return 3;
  if (normalize(description).includes(normalizedQuery)) return 4;
  return null;
}

export async function searchContent(rawQuery: string): Promise<SearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const [modules, categories] = await Promise.all([
    prisma.module.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        searchKeywords: true,
        category: { select: { slug: true, name: true } },
      },
    }),
    prisma.category.findMany({
      select: { id: true, slug: true, name: true, description: true },
    }),
  ]);

  const scored: { result: SearchResult; score: number }[] = [];

  for (const mod of modules) {
    const score = scoreMatch(query, mod.name, mod.description, mod.searchKeywords);
    if (score === null) continue;
    scored.push({
      score,
      result: {
        type: "module",
        id: mod.id,
        name: mod.name,
        description: mod.description,
        href: `/categorias/${mod.category.slug}/${mod.slug}`,
        categoryName: mod.category.name,
      },
    });
  }

  for (const category of categories) {
    const score = scoreMatch(query, category.name, category.description);
    if (score === null) continue;
    scored.push({
      score,
      result: {
        type: "category",
        id: category.id,
        name: category.name,
        description: category.description,
        href: `/categorias/${category.slug}`,
        categoryName: category.name,
      },
    });
  }

  scored.sort((a, b) => a.score - b.score || a.result.name.localeCompare(b.result.name, "es"));

  return scored.map((s) => s.result);
}
