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
  // Fase 11B — secciones nuevas del piloto "guía primero" de Piso
  // (docs/FASE11A..., sección 7). Aditivo: null en cualquier artículo que
  // no las tenga (los otros 4 de Fase 5B, o cualquiera futuro que no las
  // incluya) — el resto de esta librería (composeSuggestedComment) sigue
  // sin leerlas, así que no hay ningún cambio de comportamiento fuera del
  // nuevo renderizado guiado.
  comoRevisarlo: string | null;
  senalesDeProblema: string | null;
  // Fase 11E — sección nueva del Lote 1 de biblioteca guiada
  // (docs/FASE11D_DISENO_BIBLIOTECA_TECNICA_GUIADA.md, plantilla
  // canónica campo F). Mismo patrón aditivo que comoRevisarlo/
  // senalesDeProblema: null en cualquier artículo que no la tenga.
  porQueImporta: string | null;
  // Fase 11L (docs/FASE11L_INFORME_REDISENO_VISUAL_GUIA.md, sección C) —
  // línea compacta mostrada por defecto antes de responder, para no
  // obligar a leer todo el bloque de guía de entrada. Prioridad: (1) si
  // el artículo tiene un encabezado "# Guía breve" explícito, se usa tal
  // cual; (2) si no, se deriva de `queRevisar` con `deriveGuiaBreve`
  // (determinista, sin IA, nunca inventa contenido — solo recorta lo que
  // ya existe); (3) si tampoco hay `queRevisar`, queda null y el
  // componente simplemente no muestra la línea compacta. Ningún artículo
  // existente tiene el encabezado explícito todavía — todos calculan
  // este campo por derivación.
  guiaBreve: string | null;
};

const SECTION_ALIASES: Record<keyof Omit<KnowledgeEntry, "slug" | "title">, string[]> = {
  // "qué revisar" — encabezado de la plantilla canónica Fase 11D/11E;
  // "qué se revisa" se conserva para no romper Piso (Fase 11B), que ya
  // está en producción con ese encabezado.
  queRevisar: ["qué revisar", "que revisar", "qué se revisa", "que se revisa"],
  condicionesCorrectas: ["qué debería observarse", "que deberia observarse", "qué debería observarse"],
  condicionesIncorrectas: ["cuando existe una observación", "cuando existe una observacion"],
  recomendacion: ["recomendación", "recomendacion"],
  fuente: ["fuente"],
  comoRevisarlo: ["cómo revisarlo", "como revisarlo"],
  senalesDeProblema: ["qué señales pueden indicar un problema", "que señales pueden indicar un problema", "que senales pueden indicar un problema"],
  porQueImporta: ["por qué importa", "por que importa"],
  // Fase 11L — encabezado explícito opcional; ningún artículo lo trae
  // todavía (se deriva de queRevisar en ese caso, ver deriveGuiaBreve).
  guiaBreve: ["guía breve", "guia breve"],
};

// Fase 11L (sección C) — derivación 100% determinista y auditable, sin
// ningún servicio externo: toma la primera oración de `queRevisar` (hasta
// el primer punto/signo de cierre) y, si igual queda demasiado larga,
// recorta en el último espacio antes del límite y agrega "…". Nunca
// agrega palabras que no estaban en el texto original — solo extrae o
// recorta. Si `queRevisar` viene vacío, no hay nada que derivar.
const GUIA_BREVE_MAX_LENGTH = 160;

export function deriveGuiaBreve(queRevisar: string): string {
  const trimmed = queRevisar.trim();
  const firstSentenceMatch = trimmed.match(/^[^.!?]*[.!?]/);
  const firstSentence = (firstSentenceMatch ? firstSentenceMatch[0] : trimmed).trim();

  if (firstSentence.length <= GUIA_BREVE_MAX_LENGTH) return firstSentence;

  const cut = firstSentence.slice(0, GUIA_BREVE_MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  const safeCut = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${safeCut.trim()}…`;
}

export function parseMarkdownSections(content: string): Map<string, string> {
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

export function findSection(sections: Map<string, string>, aliases: string[]): string | null {
  for (const alias of aliases) {
    const value = sections.get(alias);
    if (value) return value;
  }
  return null;
}

// Fase 11B — extraída de loadKnowledgeEntry para reutilizarla también en
// [id]/page.tsx, que ya resuelve `TechnicalArticle` con una query aparte
// (referencia por slug, no FK) y no necesita una segunda consulta a la
// base de datos solo para parsear el mismo `content` que ya tiene en
// memoria.
export function parseKnowledgeContent(content: string): Omit<KnowledgeEntry, "slug" | "title"> {
  const sections = parseMarkdownSections(content);
  const queRevisar = findSection(sections, SECTION_ALIASES.queRevisar);
  const explicitGuiaBreve = findSection(sections, SECTION_ALIASES.guiaBreve);

  return {
    queRevisar,
    condicionesCorrectas: findSection(sections, SECTION_ALIASES.condicionesCorrectas),
    condicionesIncorrectas: findSection(sections, SECTION_ALIASES.condicionesIncorrectas),
    recomendacion: findSection(sections, SECTION_ALIASES.recomendacion),
    fuente: findSection(sections, SECTION_ALIASES.fuente),
    comoRevisarlo: findSection(sections, SECTION_ALIASES.comoRevisarlo),
    senalesDeProblema: findSection(sections, SECTION_ALIASES.senalesDeProblema),
    porQueImporta: findSection(sections, SECTION_ALIASES.porQueImporta),
    guiaBreve: explicitGuiaBreve ?? (queRevisar ? deriveGuiaBreve(queRevisar) : null),
  };
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

  return { slug: article.slug, title: article.title, ...parseKnowledgeContent(article.content) };
}
