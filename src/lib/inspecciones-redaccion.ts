import type { InspectionReportData } from "@/lib/inspecciones-report";
import type { InspectionSeverity, InspectionPropertyType } from "@/generated/prisma/client";

// Fase 10B (corrección) — motor de redacción y composición 100% LOCAL:
// reglas + plantillas + datos ya cargados, SIN llamar a ningún servicio
// externo. Nunca inventa hechos: el contenido factual siempre sale del
// comentario del propio inspector o de un fragmento LITERAL de un
// TechnicalArticle real (nunca una paráfrasis libre que podría alterar
// el significado de la fuente citada).

const MIN_INFORMATIVE_LENGTH = 12;
const MAX_INPUT_LENGTH = 4000;
export { MAX_INPUT_LENGTH };

// Normalización de frases informales comunes en terreno hacia un
// registro más profesional — diccionario cerrado y explícito, no un
// modelo de lenguaje: cada entrada es una sustitución literal y
// predecible, auditable línea por línea. No agrega hechos nuevos, solo
// reformula lo que el inspector ya escribió.
const PHRASE_NORMALIZATIONS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\bsuena\s+huec[oa]s?\b/gi, replacement: "presenta sonido hueco al verificar manualmente" },
  { pattern: /\btremend[oa]s?\b/gi, replacement: "de consideración" },
  { pattern: /\bmuy\s+mal[oa]?\b/gi, replacement: "en mal estado" },
  { pattern: /\bmucho\b/gi, replacement: "considerable" },
  { pattern: /\bharto[a]?\b/gi, replacement: "considerable" },
  { pattern: /\bgotea\b/gi, replacement: "presenta goteo" },
  { pattern: /\bse\s+ve\s+mal\b/gi, replacement: "presenta una condición visible de deterioro" },
  { pattern: /\breventad[oa]s?\b/gi, replacement: "con daño visible" },
  { pattern: /\bquebrad[oa]s?\b/gi, replacement: "con quiebre visible" },
];

const STOPWORDS = new Set([
  "para", "como", "pero", "desde", "hasta", "entre", "este", "esta", "esta",
  "sobre", "donde", "cuando", "tiene", "estan", "esta", "hay", "con", "los",
  "las", "del", "una", "uno", "que", "por", "muy", "presenta", "observa",
]);

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function significantWords(text: string): Set<string> {
  const matches = stripAccents(text.toLowerCase()).match(/[a-z]{4,}/g) ?? [];
  return new Set(matches.filter((w) => !STOPWORDS.has(w)));
}

// Solo se cita la base de conocimiento si el comentario del inspector
// realmente comparte vocabulario con el criterio de condición no
// conforme del artículo — nunca se adjunta un criterio que no
// corresponda a lo que el inspector efectivamente describió.
function hasKeywordOverlap(a: string, b: string): boolean {
  const wordsA = significantWords(a);
  const wordsB = significantWords(b);
  return Array.from(wordsA).some((word) => wordsB.has(word));
}

function firstSentence(text: string): string {
  const cleaned = text.replace(/\n+/g, " ").trim();
  const idx = cleaned.indexOf(".");
  return idx === -1 ? cleaned : cleaned.slice(0, idx + 1);
}

function normalizePhrasing(text: string): string {
  let out = text.trim();
  for (const { pattern, replacement } of PHRASE_NORMALIZATIONS) out = out.replace(pattern, replacement);
  out = out.charAt(0).toUpperCase() + out.slice(1);
  if (!/[.!?]$/.test(out)) out += ".";
  return out;
}

// Función 1 (Fase 10A/10B) — "Sugerir redacción". `condicionesIncorrectas`
// es el fragmento de TechnicalArticle (si existe y aplica) que describe
// una condición no conforme para este ítem; puede ser null si el ítem
// no tiene artículo vinculado, en cuyo caso la propuesta se basa
// exclusivamente en el propio comentario del inspector, sin ninguna
// referencia externa.
export function composeSuggestedComment(originalComment: string, condicionesIncorrectas: string | null): string {
  const trimmed = originalComment.trim();

  // Sin información suficiente — nunca se inventan detalles para
  // "completar" la frase (regla explícita de la fase). Se devuelve una
  // redacción prudente que señala la falta de detalle, en vez de una
  // descripción específica no respaldada.
  if (trimmed.length < MIN_INFORMATIVE_LENGTH) {
    return `El comentario registrado es muy breve para redactar una versión más específica. Se recomienda detallar qué elemento presenta la condición, en qué consiste y su ubicación aproximada antes de guardar el hallazgo. Texto original: "${trimmed}".`;
  }

  const base = `Se observa: ${normalizePhrasing(trimmed)}`;

  if (condicionesIncorrectas && hasKeywordOverlap(trimmed, condicionesIncorrectas)) {
    return `${base} Esto es coherente con el criterio de condición no conforme definido para este elemento: "${firstSentence(condicionesIncorrectas)}"`;
  }

  return base;
}

const SEVERITY_LABELS: Record<InspectionSeverity, string> = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica" };
const PROPERTY_LABELS: Record<InspectionPropertyType, string> = { CASA: "Casa", DEPARTAMENTO: "Departamento", AMPLIACION: "Ampliación" };
const SEVERITY_ORDER: InspectionSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

// Función 2 (Fase 10A/10B) — "Resumen de la inspección". Composición
// determinista 100% derivada de `InspectionReportData` (Fase 9B, ya
// resuelve ownership y ya excluye históricos de `hallazgosVigentes`) —
// ningún dato nuevo, ninguna inferencia, ninguna severidad recalculada.
export function composeInspectionSummary(data: InspectionReportData): { summary: string; keyFindings: string[] } {
  const { resultado, severityCounts, hallazgosVigentes, tipoInmueble, spaces } = data;

  const opening = `Se revisaron ${resultado.total} punto${resultado.total === 1 ? "" : "s"} en ${spaces.length} espacio${spaces.length === 1 ? "" : "s"} de este inmueble tipo ${PROPERTY_LABELS[tipoInmueble] ?? tipoInmueble}.`;

  const completeness =
    resultado.pending === 0
      ? "La inspección está completa: se revisaron todos los puntos del checklist."
      : `La inspección está incompleta: quedan ${resultado.pending} de ${resultado.total} puntos pendientes de revisión.`;

  let findings: string;
  if (hallazgosVigentes.length === 0) {
    findings = "No se registraron observaciones vigentes en los puntos revisados.";
  } else {
    const bySeverity = SEVERITY_ORDER.map((sev) => ({ sev, count: severityCounts[sev] }))
      .filter((s) => s.count > 0)
      .map((s) => `${s.count} de severidad ${SEVERITY_LABELS[s.sev]}`);
    const observacionWord = hallazgosVigentes.length === 1 ? "observación" : "observaciones";
    findings = `Se registraron ${hallazgosVigentes.length} ${observacionWord} vigente${hallazgosVigentes.length === 1 ? "" : "s"}: ${bySeverity.join(", ")}.`;
  }

  const summary = `${opening} ${completeness} ${findings}`;

  const keyFindings = [...hallazgosVigentes]
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
    .slice(0, 5)
    .map((h) => `${h.spaceName} — ${h.elementName}: ${truncate(h.comment, 110)}`);

  return { summary, keyFindings };
}
