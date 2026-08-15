import { prisma } from "@/lib/prisma";

// Fase 10B (corrección) — base de conocimiento LOCAL de Inspecciones.
// No es un modelo Prisma nuevo: se reutiliza `TechnicalArticle` tal
// cual ya existe (Fase 5B) como fuente de verdad. Los 5 artículos
// reales de esa fase ya siguen una estructura de encabezados Markdown
// fija (# Qué se revisa / # Qué debería observarse / # Cuando existe
// una observación / # Recomendación / # Fuente) — acá se PARSEAN en
// tiempo de ejecución, nunca se persisten como columnas nuevas. Si en
// el futuro se decide una jerarquía más rica (Especialidad → Sistema →
// Elemento → Ítem → Criterios → Fuentes, ver informe de esta fase,
// sección "Pendientes"), es una evolución de schema aparte, evaluada y
// aprobada explícitamente — no algo que esta fase decida por su cuenta.

export type KnowledgeEntry = {
  slug: string;
  title: string;
  // Qué se revisa — contexto general del ítem.
  queRevisar: string | null;
  // "Condiciones correctas" del pedido — lo que ya documentamos en
  // Fase 5B como "Qué debería observarse".
  condicionesCorrectas: string | null;
  // "Condiciones incorrectas" del pedido — lo que ya documentamos en
  // Fase 5B como "Cuando existe una observación".
  condicionesIncorrectas: string | null;
  recomendacion: string | null;
  // Fuente documental citada por el propio artículo (nunca normativa
  // inventada — mismo texto ya auditado en Fase 5B/6A).
  fuente: string | null;
};

const SECTION_ALIASES: Record<keyof Omit<KnowledgeEntry, "slug" | "title">, string[]> = {
  queRevisar: ["qué se revisa", "que se revisa"],
  condicionesCorrectas: ["qué debería observarse", "que deberia observarse", "qué debería observarse"],
  condicionesIncorrectas: ["cuando existe una observación", "cuando existe una observacion"],
  recomendacion: ["recomendación", "recomendacion"],
  fuente: ["fuente"],
};

function parseMarkdownSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  let currentHeading: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentHeading) sections.set(currentHeading, buffer.join("\n").trim());
    buffer = [];
  };

  for (const line of content.split("\n")) {
    const match = line.match(/^#\s+(.+)$/);
    if (match) {
      flush();
      currentHeading = match[1].trim().toLowerCase();
    } else {
      buffer.push(line);
    }
  }
  flush();

  return sections;
}

function findSection(sections: Map<string, string>, aliases: string[]): string | null {
  for (const alias of aliases) {
    const value = sections.get(alias);
    if (value) return value;
  }
  return null;
}

// Devuelve null si el ítem no tiene TechnicalArticle vinculado, o si el
// slug no resuelve a ninguno — la ausencia de conocimiento es un estado
// válido y esperado (la mayoría de las preguntas del catálogo todavía
// no tienen artículo, ver Fase 5B/6B), nunca se rellena con contenido
// inventado.
export async function loadKnowledgeEntry(technicalArticleSlug: string | null): Promise<KnowledgeEntry | null> {
  if (!technicalArticleSlug) return null;

  const article = await prisma.technicalArticle.findUnique({
    where: { slug: technicalArticleSlug },
    select: { slug: true, title: true, content: true },
  });
  if (!article) return null;

  const sections = parseMarkdownSections(article.content);

  return {
    slug: article.slug,
    title: article.title,
    queRevisar: findSection(sections, SECTION_ALIASES.queRevisar),
    condicionesCorrectas: findSection(sections, SECTION_ALIASES.condicionesCorrectas),
    condicionesIncorrectas: findSection(sections, SECTION_ALIASES.condicionesIncorrectas),
    recomendacion: findSection(sections, SECTION_ALIASES.recomendacion),
    fuente: findSection(sections, SECTION_ALIASES.fuente),
  };
}
