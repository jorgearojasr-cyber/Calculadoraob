// Lógica de scoring pura (sin I/O, sin Prisma) extraída de search.ts —
// Design Spec v1.0, Parte 2 (Calculadoras/Herramientas), 2026-09-15.
//
// Por qué existe este archivo separado: calculators.ts necesita
// normalize()/scoreMatch() para su filtro local, y es importado por
// calculators-explorer.tsx ("use client"). search.ts trae `import {
// prisma } from "@/lib/prisma"` a nivel de módulo (usa Node natives vía
// pg/@prisma/adapter-pg) — cualquier client component que importe algo de
// search.ts arrastra ese import al bundle del navegador, y `next build`
// falla ("Module not found: Can't resolve 'fs'/'net'/'tls'/'dns'", los
// natives que pg necesita). Se extrae la parte 100% pura a este archivo
// nuevo; search.ts la reimporta para no duplicar comportamiento.
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Palabras de relleno frecuentes en preguntas naturales ("¿Cuántos
// ladrillos necesito para un muro?") que no aportan ningún contenido
// buscable — sin filtrarlas, el AND estricto por token falla apenas el
// usuario escribe una pregunta en vez de una lista de palabras clave.
const STOPWORDS = new Set([
  "cuanto", "cuantos", "cuanta", "cuantas", "que", "como", "cual", "cuales",
  "de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas",
  "para", "con", "y", "o", "en", "por", "al", "es", "mi", "necesito", "quiero",
]);

function tokenize(value: string): string[] {
  const all = normalize(value).split(/\s+/).filter(Boolean);
  const meaningful = all.filter((t) => !STOPWORDS.has(t));
  // Si TODO era relleno (raro, pero posible con una query de 1 palabra que
  // coincide con una stopword), no nos quedamos sin tokens para buscar.
  return meaningful.length > 0 ? meaningful : all;
}

// Peso por campo para el fallback por tokens — menor = mejor/más relevante.
// "name" pesa más que "searchKeywords", que a su vez pesa más que
// "description", tal como pide la regla de ranking.
const FIELD_WEIGHT = { name: 1, keywords: 2, description: 3 } as const;

// Fallback cuando la frase completa no aparece literal en ningún campo
// (ver scoreMatch): la query se separa en tokens y CADA token debe
// aparecer en AL MENOS UNO de los 3 campos — no necesariamente el mismo
// campo ni en el mismo orden — para que "circuito electrico" encuentre un
// módulo con "circuito" en el name y "eléctrico" solo en la descripción.
// Si algún token no aparece en ningún campo, no hay match (AND estricto).
// El score se arma con el mejor (menor) peso de campo por token,
// promediado, y se desplaza a partir de 5 para que siempre rankee por
// debajo de una coincidencia de frase literal (scores 0-4).
function tokenScore(query: string, name: string, description: string, keywords?: string | null): number | null {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;

  const normalizedName = normalize(name);
  const normalizedDescription = normalize(description);
  const normalizedKeywords = keywords ? normalize(keywords) : "";

  let totalWeight = 0;
  for (const token of tokens) {
    const weights: number[] = [];
    if (normalizedName.includes(token)) weights.push(FIELD_WEIGHT.name);
    if (normalizedKeywords.includes(token)) weights.push(FIELD_WEIGHT.keywords);
    if (normalizedDescription.includes(token)) weights.push(FIELD_WEIGHT.description);
    if (weights.length === 0) return null; // este token no aparece en ningun campo -> sin match
    totalWeight += Math.min(...weights);
  }

  return 5 + totalWeight / tokens.length / 10;
}

// Coincidencia de frase completa (substring/prefijo/exacta) contra un solo
// campo a la vez — nombre exacto/prefijo pesa mucho más que un match
// perdido en la descripción o en las palabras clave.
function phraseScore(query: string, name: string, description: string, keywords?: string | null): number | null {
  const normalizedQuery = normalize(query);
  const normalizedName = normalize(name);

  if (normalizedName === normalizedQuery) return 0;
  if (normalizedName.startsWith(normalizedQuery)) return 1;
  if (normalizedName.includes(normalizedQuery)) return 2;
  if (keywords && normalize(keywords).includes(normalizedQuery)) return 3;
  if (normalize(description).includes(normalizedQuery)) return 4;
  return null;
}

// Corre SIEMPRE los dos caminos (frase completa y tokens) y se queda con
// el mejor score de los dos — nunca uno excluye al otro. Como los rangos
// no se solapan (frase: 0-4, tokens: 5+), la frase gana automáticamente
// cuando ambos matchean, sin necesitar lógica de desempate aparte: un
// match pobre por un lado nunca pisa uno mejor del otro lado.
export function scoreMatch(query: string, name: string, description: string, keywords?: string | null): number | null {
  const phrase = phraseScore(query, name, description, keywords);
  const tokens = tokenScore(query, name, description, keywords);
  if (phrase === null) return tokens;
  if (tokens === null) return phrase;
  return Math.min(phrase, tokens);
}
