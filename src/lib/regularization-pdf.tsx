import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from "@react-pdf/renderer";
import type { RegularizationRuleResult } from "@/lib/regularization-rules";
import { describeDocumentOrigen, describeObligatoriedad, type RegularizationDocumentItem } from "@/lib/regularization-document-labels";
import { SKETCH_DISCLAIMER, elementsToPrimitives, computeViewBox, type SketchData } from "@/lib/regularization-sketch";

// Fuente Helvetica por defecto de @react-pdf/renderer — probada con
// texto real del módulo (tildes y ñ) antes de construir este documento,
// ver font-test.tsx (2026-08-02). Sin fuente TTF embebida: no hizo
// falta.
//
// Fase 1 de `plan-implementacion-informe-regularizacion.md` (2026-08-02):
// reestructuración a las 15 secciones + portada + pie de página de
// `diseno-informe-regularizacion.md`, SIN tocar todavía el modelo de
// documentos (3 ejes, Fase 2) ni la lógica de elegibilidad/semáforo
// (Fase 3). Las secciones que dependen de esos modelos van con
// contenido placeholder explícito — nunca contenido inventado que
// aparente ser definitivo. Ver informe de Fase 1 para el detalle
// sección por sección.

const pesosFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Mismas etiquetas que RegularizationWizard (Paso 1 y Paso 5) — no hay
// un mapa central reutilizable, mismo criterio que ROOM_TYPE_LABELS/
// KIND_LABELS/CATEGORY_LABELS ya definidos localmente en cada
// componente que los necesita.
const TIPO_CONSTRUCCION_LABELS: Record<string, string> = {
  AMPLIACION: "Ampliación",
  SEGUNDO_PISO: "Segundo piso",
  TERRAZA_CERRADA: "Terraza cerrada",
  QUINCHO: "Quincho",
  BODEGA: "Bodega",
  ESTACIONAMIENTO_TECHADO: "Estacionamiento techado",
  VIVIENDA_COMPLETA: "Vivienda completa",
  OTRO: "Otro",
};

const MATERIAL_LABELS: Record<string, string> = {
  MADERA: "Madera",
  ALBANILERIA: "Albañilería",
  METALCON: "Metalcón",
  HORMIGON: "Hormigón",
  MIXTA: "Mixta",
  OTRO: "Otro",
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  DORMITORIO: "Dormitorio",
  COCINA: "Cocina",
  BANO: "Baño",
  LIVING_COMEDOR: "Living-comedor",
  LAVANDERIA: "Lavandería",
  BODEGA: "Bodega",
  OTRO: "Otro",
};

const PHOTO_KIND_LABELS: Record<string, string> = {
  FACHADA: "Fachada",
  POSTERIOR: "Posterior",
  COSTADO: "Costado",
  INTERIOR: "Interior",
  TECHUMBRE: "Techumbre",
  FUNDACION: "Fundación",
  OTRO: "Otro",
};

const CATEGORY_LABELS: Record<string, string> = {
  MUNICIPAL: "Municipal",
  DOM: "Dirección de Obras (DOM)",
  ARQUITECTO: "Arquitecto / profesional",
  NOTARIA_REGISTRO: "Notaría / Conservador de Bienes Raíces",
};
const CATEGORY_ORDER = ["MUNICIPAL", "DOM", "ARQUITECTO", "NOTARIA_REGISTRO"];
const PHOTO_KIND_ORDER = ["FACHADA", "POSTERIOR", "COSTADO", "INTERIOR", "TECHUMBRE", "FUNDACION", "OTRO"];

// Texto legal unificado — mismo criterio en portada (corto) y sección 12
// (versión larga), reemplaza los 3 textos distintos que existían antes
// de esta fase (ver auditoría funcional/normativa/UX, 2026-08-02).
const DISCLAIMER_CORTO =
  "Este documento es una evaluación preliminar automatizada, basada en reglas normativas determinísticas. No reemplaza la evaluación de un profesional habilitado. Ver aviso legal completo en la sección 12.";

const AVISO_LEGAL_COMPLETO = [
  "Esta herramienta entrega una orientación inicial y no reemplaza la evaluación de un profesional competente ni el pronunciamiento de la Dirección de Obras Municipales correspondiente.",
  "El contenido normativo citado en este informe (criterios de tramo, documentos requeridos, plazos legales) proviene del análisis de fuentes oficiales y profesionales, pero puede estar sujeto a validación adicional — ver el estado de cada dato en las secciones 8 y 11. ObraBien no asume responsabilidad por decisiones tomadas exclusivamente en base a este informe.",
  "Este informe no constituye un permiso, autorización ni pronunciamiento de ninguna entidad pública. La regularización de una construcción requiere la evaluación y firma de un profesional competente habilitado (arquitecto, ingeniero civil, ingeniero constructor o constructor civil) y la resolución de la Dirección de Obras Municipales correspondiente.",
  "Se recomienda validar cada dato de este informe con un profesional competente antes de tomar cualquier decisión legal, constructiva o de inversión basada en su contenido.",
];

// ============================================================
// Fase 6 (plan de implementación) — diseño visual fino. Fase exclusiva
// de presentación: ningún contenido, estructura, lógica ni dato cambia
// acá, solo cómo se dibuja. Paleta y escala tipográfica como constantes
// nombradas (no valores sueltos en cada regla de `styles`) para que la
// jerarquía visual sea consistente y fácil de auditar en un solo lugar.
//
// Tipografía: pareja deliberada Times (serif, para H1/H2 — la misma
// convención visual de documentos técnicos/legales oficiales chilenos,
// para que el informe se lea como documento formal) + Helvetica (sans,
// para H3/cuerpo — funcional, alta legibilidad en bloques largos de
// texto). Ambas son fuentes core de PDF (Times-Roman/Times-Bold/
// Helvetica), sin necesidad de embeber TTF — mismo motivo por el que la
// Fase 4 evitó glifos fuera de WinAnsi: cero riesgo de glifo faltante.
// ============================================================
const PALETTE = {
  ink: "#1a1a1a",
  inkMuted: "#5b6472",
  inkFaint: "#94a0af",
  accent: "#1e3a5f", // azul pizarra — encabezados y reglas de sección
  accentTint: "#eef2f7",
  border: "#dbe1e8",
  borderStrong: "#aab4c0",
  warningText: "#7a4b00",
  warningBg: "#fff4e0",
  warningBorder: "#e3b76a",
  successText: "#166534",
  successBorder: "#166534",
};

const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 60, paddingHorizontal: 42, fontSize: 9.75, color: PALETTE.ink, lineHeight: 1.35 },
  // Cabecera corrida (fixed) en páginas 2-4 — identifica cada página con
  // folio + título abreviado incluso si el documento se imprime y se
  // desordena, o si una sección larga se desborda a páginas físicas
  // adicionales dentro del mismo <Page> (react-pdf repite los elementos
  // `fixed` en cada página física generada por desborde de contenido).
  runningHeader: {
    position: "absolute",
    top: 20,
    left: 42,
    right: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: PALETTE.inkFaint,
    borderBottom: `0.5 solid ${PALETTE.border}`,
    paddingBottom: 4,
  },
  runningHeaderTitle: { fontFamily: "Times-Bold", fontSize: 8, color: PALETTE.inkMuted },
  h1: { fontFamily: "Times-Bold", fontSize: 16.5, color: PALETTE.accent, marginBottom: 4, lineHeight: 1.2 },
  h2: {
    fontFamily: "Times-Bold",
    fontSize: 13.5,
    color: PALETTE.accent,
    marginTop: SPACE.xl,
    marginBottom: SPACE.sm,
    paddingBottom: 4,
    borderBottom: `1.25 solid ${PALETTE.accent}`,
  },
  h3: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: PALETTE.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: SPACE.md,
    marginBottom: SPACE.xs,
  },
  meta: { fontSize: 8.5, color: PALETTE.inkMuted, marginBottom: 4 },
  folio: { fontSize: 8.5, color: PALETTE.inkMuted, fontFamily: "Courier" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  address: { fontFamily: "Times-Bold", fontSize: 13, color: PALETTE.ink, marginTop: 6, marginBottom: SPACE.md },
  disclaimer: {
    fontSize: 8.75,
    color: PALETTE.warningText,
    backgroundColor: PALETTE.warningBg,
    border: `0.75 solid ${PALETTE.warningBorder}`,
    padding: SPACE.sm,
    borderRadius: 3,
    marginBottom: SPACE.lg,
    lineHeight: 1.4,
  },
  placeholderNote: {
    fontSize: 8.25,
    color: PALETTE.inkMuted,
    fontStyle: "italic",
    backgroundColor: "#f4f5f7",
    border: `0.75 solid ${PALETTE.border}`,
    padding: SPACE.sm,
    borderRadius: 3,
    marginTop: SPACE.xs,
    marginBottom: SPACE.sm,
    lineHeight: 1.4,
  },
  // Semáforo de elegibilidad (Fase 3) — nunca solo color, siempre
  // ícono + texto (ver diseño, sección 1 y regla dura de la sección 17:
  // "el documento debe ser 100% comprensible impreso en blanco y negro").
  // Fase 6: se agrega un borde 1pt para que el bloque siga siendo
  // reconocible como un cuadro destacado incluso en fotocopia/impresión
  // en blanco y negro, donde el fondo gris claro puede perder contraste.
  semaforoBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    backgroundColor: "#f7f8f9",
    border: `0.75 solid ${PALETTE.border}`,
    borderRadius: 3,
    padding: SPACE.sm,
    marginBottom: SPACE.sm,
  },
  semaforoDot: { width: 14, height: 14, borderRadius: 7, marginRight: 2 },
  semaforoLabel: { fontFamily: "Helvetica-Bold", fontSize: 11.5, color: PALETTE.ink },
  semaforoDescription: { fontSize: 8.75, color: PALETTE.inkMuted, marginTop: 1 },
  row: { flexDirection: "row", marginBottom: SPACE.xs, alignItems: "flex-start" },
  label: { width: 190, color: PALETTE.inkMuted },
  value: { flex: 1, color: PALETTE.ink },
  valueMuted: { flex: 1, color: PALETTE.inkFaint, fontStyle: "italic" },
  ruleBlock: { marginBottom: SPACE.sm, paddingBottom: SPACE.sm, borderBottom: `0.75 solid ${PALETTE.border}` },
  ruleLabel: { fontFamily: "Helvetica-Bold", color: PALETTE.ink, marginBottom: 2 },
  // Fase 6: sin `lineHeight` explícito — @react-pdf/renderer 4.5.1 tiene
  // un bug real (verificado en render) donde lineHeight en un Text
  // dentro de un View con wrap={false} infla el interlineado a casi el
  // doble de lo esperado en cada salto de línea envuelto. `docWarningText`
  // (sin lineHeight, misma condición de wrap={false}) confirma que sin
  // el override el texto se ve correcto — se deja así deliberadamente.
  ruleMessage: { color: PALETTE.inkMuted },
  emptyNote: { color: PALETTE.inkFaint, fontStyle: "italic" },
  // Tabla de recintos — encabezado explícito (Fase 6: "tablas
  // (alineación, encabezados, legibilidad)"); antes no tenía encabezado.
  tableHeaderRow: {
    flexDirection: "row",
    borderBottom: `1 solid ${PALETTE.accent}`,
    paddingBottom: 3,
    marginBottom: 4,
  },
  tableHeaderCell: { fontFamily: "Helvetica-Bold", fontSize: 8, color: PALETTE.accent, textTransform: "uppercase", letterSpacing: 0.4 },
  roomRow: { flexDirection: "row", marginBottom: SPACE.xs },
  roomType: { width: 160 },
  roomDims: { flex: 1, fontVariantNumeric: "tabular-nums" },
  totalRow: { flexDirection: "row", marginTop: SPACE.xs, paddingTop: SPACE.xs, borderTop: `1 solid ${PALETTE.ink}` },
  categoryBlock: { marginBottom: SPACE.md },
  categoryTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: PALETTE.accent,
    marginBottom: SPACE.xs,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  docRow: { flexDirection: "row", marginBottom: SPACE.xs + 1, paddingBottom: 4, borderBottom: `0.5 solid ${PALETTE.border}` },
  docCheck: { width: 18, fontFamily: "Courier-Bold" },
  docText: { flex: 1 },
  docObligatorio: { fontSize: 7.75, color: PALETTE.inkMuted },
  docWarningText: { fontSize: 7.75, color: PALETTE.warningText },
  photoImg: { width: 160, height: 120, marginBottom: 4, objectFit: "cover", border: `0.75 solid ${PALETTE.border}` },
  photoCaption: { fontSize: 8, color: PALETTE.inkMuted, marginBottom: SPACE.sm },
  sketchDisclaimer: {
    fontSize: 8.75,
    color: PALETTE.warningText,
    backgroundColor: PALETTE.warningBg,
    border: `0.75 solid ${PALETTE.warningBorder}`,
    padding: SPACE.sm,
    borderRadius: 3,
    marginBottom: SPACE.md,
    lineHeight: 1.4,
  },
  bienBlockRow: { flexDirection: "row", gap: SPACE.xl },
  bienBlockCol: { flex: 1 },
  bienItemRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: SPACE.xs, gap: 6 },
  bienItem: { fontSize: 9.25, color: PALETTE.ink },
  bienItemMuted: { fontSize: 9.25, color: PALETTE.inkMuted },
  numberedStep: { flexDirection: "row", marginBottom: SPACE.sm },
  numberedStepNum: { width: 20, fontFamily: "Helvetica-Bold", color: PALETTE.accent },
  // Ver nota en `ruleMessage` — mismo bug de wrap={false} + lineHeight,
  // por eso ninguno de los dos define lineHeight explícito.
  numberedStepText: { flex: 1 },
  glossaryRow: { flexDirection: "row", marginBottom: SPACE.xs + 1, paddingBottom: SPACE.xs + 1, borderBottom: `0.5 solid ${PALETTE.border}` },
  glossaryTerm: { width: 140, fontFamily: "Helvetica-Bold", color: PALETTE.ink },
  glossaryDef: { flex: 1, color: PALETTE.inkMuted },
  sourceItem: { fontSize: 9.25, marginBottom: SPACE.xs, color: PALETTE.ink },
  legalParagraph: { fontSize: 8.25, color: PALETTE.inkMuted, marginBottom: SPACE.sm, lineHeight: 1.45 },
  signatureBoxes: { flexDirection: "row", gap: SPACE.lg, marginTop: SPACE.sm },
  signatureBox: { flex: 1, border: `1 solid ${PALETTE.borderStrong}`, borderRadius: 3, padding: SPACE.md },
  signatureLine: { borderBottom: `0.75 solid ${PALETTE.borderStrong}`, marginTop: SPACE.lg, marginBottom: 4, height: 1 },
  signatureFieldLabel: { fontSize: 8.25, color: PALETTE.inkMuted },
  historyBlock: { marginTop: SPACE.xl, paddingTop: SPACE.sm, borderTop: `0.75 solid ${PALETTE.border}` },
  historyText: { fontSize: 7.75, color: PALETTE.inkFaint, marginBottom: 1 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    fontSize: 7.25,
    color: PALETTE.inkFaint,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `0.5 solid ${PALETTE.border}`,
    paddingTop: 5,
  },
});

const SKETCH_MAX_WIDTH = 480; // pt
const SKETCH_MAX_HEIGHT = 500; // pt

export type RegularizationPdfCase = {
  name: string;
  tipoConstruccion: string;
  anioConstruccion: number | null;
  recepcionMunicipal: boolean | null;
  m2Estimados: number;
  material: string;
  avaluoFiscalPesos: number | null;
};

export type RegularizationPdfRoom = {
  roomType: string;
  label: string | null;
  largo: number;
  ancho: number;
  m2Calculado: number;
};

export type RegularizationPdfPhoto = {
  kind: string;
  url: string;
  caption: string | null;
};

// Documento momento:posterior — subconjunto de campos (ver
// getPosteriorDocuments en regularization-documents.ts); nunca lleva
// `checked` porque no tiene sentido marcar "aportado" algo que todavía no
// existe (el trámite no ha terminado).
export type RegularizationPdfPosteriorDoc = {
  documento: string;
  paraQueSirve: string;
  dondeSeObtiene: string;
};

export type RegularizationPdfData = {
  folio: string;
  regCase: RegularizationPdfCase;
  rules: RegularizationRuleResult[];
  rooms: RegularizationPdfRoom[];
  documents: RegularizationDocumentItem[];
  documentsPosteriores: RegularizationPdfPosteriorDoc[];
  photos: RegularizationPdfPhoto[];
  sketch: SketchData | null;
  generatedAt: Date;
  // Fase 5 — distinto de `generatedAt`: `generatedAt` es cuándo se generó
  // ESTE documento (siempre "ahora"), `caseUpdatedAt` es cuándo se
  // modificó por última vez el caso subyacente (RegularizationCase.
  // updatedAt) — es la señal real de trazabilidad de la sección 14; sin
  // esto, "Última actualización" quedaba duplicando "Generado" siempre.
  caseUpdatedAt: Date;
};

// Identificadores de versión de la sección 14 (Historial y Trazabilidad) —
// constantes nombradas en vez de strings sueltos en el JSX, para que
// quede explícito qué se está versionando: REPORT_VERSION es la versión
// de esta plantilla de informe (bump manual si cambia su estructura);
// NORM_ENGINE_VERSION identifica el motor de reglas normativas
// (regularization-rules.ts) que evaluó el caso — también de bump manual,
// no hay hoy un mecanismo automático de versionado del motor de reglas.
const REPORT_VERSION = "1.0";
const NORM_ENGINE_VERSION = "1.0";

function sumM2(rooms: RegularizationPdfRoom[]): number {
  return Math.round(rooms.reduce((acc, r) => acc + r.m2Calculado, 0) * 100) / 100;
}

// Fase 3 (plan de implementación) — semáforo, tramo aplicable y avance del
// expediente. Deriva del resultado YA calculado por el motor de reglas
// (RegularizationRuleResult[]) — no se toca regularization-rules.ts ni su
// lógica normativa, solo se interpreta la salida existente. El acople a
// las etiquetas exactas de seed-regularization.ts es deliberado (mismo
// patrón que otros lugares del framework que referencian labels/keys de
// seed en comentarios) — si el label de una regla cambia en el seed, esta
// interpretación debe actualizarse junto con él.
//
// DEUDA TÉCNICA (registrada explícitamente, aprobada por Jorge 2026-08-02
// al cerrar la Fase 3 — no bloquea esta implementación): el semáforo
// depende de comparar el `label` (texto) de la regla activa contra estas
// 2 constantes, en vez de un identificador estable o un campo de tipo de
// resultado en RegularizationRule. Es un acoplamiento real — un cambio de
// copy en seedRegularizationRules (aunque sea solo de redacción, sin
// cambiar la lógica normativa) rompe silenciosamente el semáforo sin
// ningún error de compilación. En una evolución futura del motor de
// reglas convendría agregar un campo estable (ej. `key` único o
// `resultType: "califica" | "excede" | "info"`) y comparar contra eso en
// vez del texto del mensaje.
const LABEL_CALIFICA_TRAMO = "Elegibilidad preliminar por superficie y avalúo";
const LABEL_EXCEDE_TRAMO = "El caso excede los tramos evaluados para la vía simplificada";

// `color` (hex) en vez de un glifo emoji: la fuente Helvetica embebida
// por defecto en @react-pdf/renderer no soporta emoji (🔴/🟢/🟡 se
// renderizan como bytes de reemplazo ilegibles) — el color se dibuja
// como un bloque sólido (ver semaforoDot) y el texto de `label` es
// quien transmite el estado, nunca el color solo.
type Semaforo = { color: string; label: string; description: string };

export function computeSemaforo(rules: RegularizationRuleResult[]): Semaforo {
  const hasLabel = (label: string) => rules.some((r) => r.label === label);
  if (hasLabel(LABEL_EXCEDE_TRAMO)) {
    return {
      color: "#DC2626",
      label: "Fuera de tramo",
      description: "Superficie o avalúo exceden los límites evaluados para la vía simplificada.",
    };
  }
  if (hasLabel(LABEL_CALIFICA_TRAMO)) {
    return {
      color: "#16A34A",
      label: "Vía clara",
      description: "Cumple criterios básicos de tramo, según los datos ingresados.",
    };
  }
  return {
    color: "#D97706",
    label: "Requiere revisión",
    description: "Cumple parcialmente o falta información para determinar la elegibilidad preliminar.",
  };
}

function computeTramoAplicable(rules: RegularizationRuleResult[], m2Estimados: number): string {
  const hasLabel = (label: string) => rules.some((r) => r.label === label);
  if (hasLabel(LABEL_EXCEDE_TRAMO)) return "Fuera de los tramos evaluados";
  if (hasLabel(LABEL_CALIFICA_TRAMO)) {
    // "hasta" en vez de "≤": Helvetica (fuente por defecto, sin TTF
    // embebida) no tiene el glifo "≤" — se renderiza como "d" ilegible.
    return m2Estimados <= 90 ? "Tramo 1 (hasta 90 m² / hasta 1.000 UF)" : "Tramo 2 (hasta 140 m² / hasta 2.000 UF)";
  }
  return "Pendiente — falta el avalúo fiscal";
}

// Solo documentos obligatoriedad:minimo cuentan en el denominador — los
// condicionales no aplicables al caso ya vienen excluidos de `documents`
// (filtrados por dependeDe en getVisibleDocumentChecklist), y los que sí
// aplican pasan a sumar tanto al numerador como al denominador cuando se
// marcan como reunidos (mismo criterio que el diseño, sección 8).
function computeAvanceExpediente(documents: RegularizationDocumentItem[]): { done: number; total: number; percent: number } {
  const minimos = documents.filter((d) => d.obligatoriedad === "MINIMO");
  const done = minimos.filter((d) => d.checked).length;
  const total = minimos.length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

// Pie de página — folio + fecha + paginación, en todas las hojas (ver
// diseño sección 1, "PIE DE PÁGINA (todas las páginas)").
function Footer({ folio, generatedAt }: { folio: string; generatedAt: Date }) {
  return (
    <Text
      style={styles.footer}
      fixed
      render={({ pageNumber, totalPages }) =>
        `${folio}  ·  ${dateFormatter.format(generatedAt)}  ·  Página ${pageNumber} de ${totalPages}`
      }
    />
  );
}

// Cabecera corrida (Fase 6 — "repetición de encabezados cuando
// corresponda") — se agrega en las páginas 2-4, que no tienen el
// encabezado grande de portada. Marcada `fixed`: react-pdf la repite en
// cada página física que genere, incluidas las páginas de continuación
// que resultan cuando el contenido de una sección desborda una sola
// hoja A4 (ej. sección 8 con muchos documentos) — así ninguna página
// impresa queda sin folio ni título identificatorio.
function RunningHeader({ folio }: { folio: string }) {
  return (
    <View style={styles.runningHeader} fixed>
      <Text style={styles.runningHeaderTitle}>Informe de Evaluación Preliminar de Regularización — Ley N° 20.898</Text>
      <Text>{folio}</Text>
    </View>
  );
}

// Ícono de línea (Fase 6 — "iconografía definitiva: estilo línea, no
// ilustrativa") — reemplaza el emoji "✅" usado antes en 1-bis, que no
// renderiza en Helvetica (mismo problema de glifos fuera de WinAnsi ya
// corregido en el resto del documento en Fase 4 — este quedó sin
// detectar porque esa sección no se inspeccionó visualmente en su
// momento). Trazo simple, sin relleno, mismo criterio que el resto de
// la iconografía del informe (checklist en corchetes, croquis en SVG).
function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={8} height={8} viewBox="0 0 10 10">
      <Path d="M1 5.2 L3.8 8 L9 1.5" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RegularizationCarpetaDocument({
  folio,
  regCase,
  rules,
  rooms,
  documents,
  documentsPosteriores,
  photos,
  sketch,
  generatedAt,
  caseUpdatedAt,
}: RegularizationPdfData) {
  const groupedDocs = CATEGORY_ORDER.map((category) => ({
    category,
    docs: documents.filter((d) => d.category === category),
  })).filter((g) => g.docs.length > 0);

  const groupedPhotos = PHOTO_KIND_ORDER.map((kind) => ({
    kind,
    items: photos.filter((p) => p.kind === kind),
  })).filter((g) => g.items.length > 0);

  const sketchPrimitives = sketch && sketch.elements.length > 0 ? elementsToPrimitives(sketch.elements) : [];
  const sketchViewBox = sketch && sketch.elements.length > 0 ? computeViewBox(sketch.elements) : null;
  let sketchRenderWidth = 0;
  let sketchRenderHeight = 0;
  if (sketchViewBox) {
    const aspect = sketchViewBox.width / sketchViewBox.height;
    sketchRenderWidth = SKETCH_MAX_WIDTH;
    sketchRenderHeight = sketchRenderWidth / aspect;
    if (sketchRenderHeight > SKETCH_MAX_HEIGHT) {
      sketchRenderHeight = SKETCH_MAX_HEIGHT;
      sketchRenderWidth = sketchRenderHeight * aspect;
    }
  }

  // "Registro fotográfico" y "cálculo de recintos" solo cuentan como
  // valor entregado por la plataforma si el caso realmente tiene datos
  // cargados — mismo principio de honestidad que rige el checklist (ver
  // diseño, sección 1-bis: "debe reflejar exactamente lo que existe en
  // los datos de este expediente en particular", nunca una lista de
  // marketing).
  const bienResueltos = [
    "Evaluación preliminar de elegibilidad",
    "Organización del expediente",
    sketch && sketch.elements.length > 0 ? "Croquis referencial" : null,
    photos.length > 0 ? "Registro fotográfico" : null,
    rooms.length > 0 ? "Cálculo de superficies" : null,
  ].filter((item): item is string => item !== null);

  // Fase 3 — semáforo, tramo y avance real (ver helpers arriba). "Aún
  // necesitarás" (columna derecha de 1-bis) se deriva del mismo modelo de
  // documentos que alimenta el checklist (sección 8) — nunca una lista
  // estática, siempre reflejando lo que falta en ESTE expediente.
  const semaforo = computeSemaforo(rules);
  const tramoAplicable = computeTramoAplicable(rules, regCase.m2Estimados);
  const avance = computeAvanceExpediente(documents);
  const minimosPendientes = documents.filter((d) => d.obligatoriedad === "MINIMO" && !d.checked);
  const bienPendientes = [
    minimosPendientes.some((d) => d.origen === "PROFESIONAL") ? "Elaboración de planos y documentos técnicos (con tu profesional)" : null,
    minimosPendientes.some((d) => d.origen === "USUARIO") ? "Reunir antecedentes propios pendientes" : null,
    "Revisión profesional final antes de presentar",
    "Presentación del expediente ante la DOM",
  ].filter((item): item is string => item !== null);

  return (
    <Document>
      {/* ===== PÁGINA 1 — Portada, Resumen, Qué puede hacer ObraBien, Datos, Metodología, Elegibilidad ===== */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {/* Fase 6: flex:1 + paddingRight en el bloque de título, ancho
              fijo en el bloque de folio — sin esto, al agrandar el H1
              (18→20pt, más el ancho extra de la fuente serif) el título
              se superponía visualmente con el folio en la esquina
              superior derecha. */}
          <View style={{ flex: 1, paddingRight: SPACE.lg }}>
            <Text style={styles.h1}>Informe de Evaluación Preliminar de Regularización</Text>
            <Text style={styles.meta}>Ley N° 20.898 — Regularización de Ampliaciones y Construcciones Existentes</Text>
          </View>
          <View style={{ alignItems: "flex-end", width: 150 }}>
            <Text style={styles.folio}>{folio}</Text>
            <Text style={styles.meta}>{dateFormatter.format(generatedAt)}</Text>
          </View>
        </View>
        <Text style={styles.address}>{regCase.name}</Text>

        <View style={styles.disclaimer}>
          <Text>{DISCLAIMER_CORTO}</Text>
        </View>

        {/* --- 1. Resumen Ejecutivo --- */}
        <Text style={styles.h2}>1. Resumen Ejecutivo</Text>
        <View style={styles.semaforoBlock}>
          <View style={[styles.semaforoDot, { backgroundColor: semaforo.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.semaforoLabel}>{semaforo.label}</Text>
            <Text style={styles.semaforoDescription}>{semaforo.description}</Text>
          </View>
        </View>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Superficie construida declarada</Text>
          <Text style={styles.value}>{regCase.m2Estimados} m²</Text>
        </View>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Superficie real (suma de recintos)</Text>
          <Text style={rooms.length > 0 ? styles.value : styles.valueMuted}>
            {rooms.length > 0 ? `${sumM2(rooms)} m²` : "Sin recintos cargados"}
          </Text>
        </View>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Avalúo fiscal</Text>
          <Text style={regCase.avaluoFiscalPesos !== null ? styles.value : styles.valueMuted}>
            {regCase.avaluoFiscalPesos !== null ? pesosFormatter.format(regCase.avaluoFiscalPesos) : "No informado"}
          </Text>
        </View>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Tramo aplicable</Text>
          <Text style={styles.value}>{tramoAplicable}</Text>
        </View>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Avance del expediente</Text>
          <Text style={styles.value}>
            {avance.total === 0
              ? "Sin documentos mínimos aplicables todavía"
              : `${avance.done} de ${avance.total} antecedentes mínimos reunidos (${avance.percent}%)`}
          </Text>
        </View>
        <Text style={styles.legalParagraph}>
          Qué significa esto para usted: {semaforo.description} Este resultado es orientativo — no reemplaza la
          evaluación de un profesional competente ni el pronunciamiento de la DOM. Vea los próximos pasos
          recomendados en la sección 9.
        </Text>

        {/* --- 1-bis. ¿Qué Puede Hacer ObraBien por Ti? --- */}
        <Text style={styles.h2}>1-bis. ¿Qué Puede Hacer ObraBien por Ti?</Text>
        <View style={styles.bienBlockRow}>
          <View style={styles.bienBlockCol}>
            <Text style={styles.h3}>Con este informe ya avanzaste en:</Text>
            {bienResueltos.map((item) => (
              <View key={item} style={styles.bienItemRow} wrap={false}>
                <CheckIcon color={PALETTE.successBorder} />
                <Text style={styles.bienItem}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={styles.bienBlockCol}>
            <Text style={styles.h3}>Aún necesitarás:</Text>
            {bienPendientes.map((item) => (
              <View key={item} style={styles.bienItemRow} wrap={false}>
                <Text style={styles.bienItemMuted}>·</Text>
                <Text style={styles.bienItemMuted}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- 2. Datos del Inmueble y del Solicitante --- */}
        <Text style={styles.h2}>2. Datos del Inmueble y del Solicitante</Text>
        <Text style={styles.h3}>Inmueble</Text>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Dirección</Text>
          <Text style={styles.valueMuted}>No informado</Text>
        </View>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Comuna / Región</Text>
          <Text style={styles.valueMuted}>No informado</Text>
        </View>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Tipo de construcción</Text>
          <Text style={styles.value}>{TIPO_CONSTRUCCION_LABELS[regCase.tipoConstruccion] ?? regCase.tipoConstruccion}</Text>
        </View>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Material principal</Text>
          <Text style={styles.value}>{MATERIAL_LABELS[regCase.material] ?? regCase.material}</Text>
        </View>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Año de construcción</Text>
          <Text style={regCase.anioConstruccion !== null ? styles.value : styles.valueMuted}>
            {regCase.anioConstruccion ?? "No informado"}
          </Text>
        </View>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Recepción municipal</Text>
          <Text style={regCase.recepcionMunicipal !== null ? styles.value : styles.valueMuted}>
            {regCase.recepcionMunicipal === true
              ? "Sí"
              : regCase.recepcionMunicipal === false
                ? "No"
                : "No informado"}
          </Text>
        </View>
        <Text style={styles.h3}>Solicitante</Text>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Nombre</Text>
          <Text style={styles.valueMuted}>No informado</Text>
        </View>
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Relación con la propiedad</Text>
          <Text style={styles.valueMuted}>No informado</Text>
        </View>
        {/* Recintos — no es una de las 15 secciones del diseño (esa
            estructura queda cerrada, ver nota de cierre del documento de
            diseño), así que el detalle vive como sub-bloque de "Datos del
            Inmueble" en vez de sumar una sección nueva. El total ya se
            muestra en el Resumen Ejecutivo; acá va el detalle por recinto,
            contenido real que existía antes de esta fase. */}
        {rooms.length > 0 && (
          <>
            <Text style={styles.h3}>Recintos</Text>
            <View style={styles.tableHeaderRow} wrap={false}>
              <Text style={[styles.roomType, styles.tableHeaderCell]}>Recinto</Text>
              <Text style={[styles.roomDims, styles.tableHeaderCell]}>Dimensiones</Text>
            </View>
            {rooms.map((room, i) => (
              <View key={i} style={styles.roomRow} wrap={false}>
                <Text style={styles.roomType}>
                  {ROOM_TYPE_LABELS[room.roomType] ?? room.roomType}
                  {room.label ? ` — ${room.label}` : ""}
                </Text>
                <Text style={styles.roomDims}>
                  {room.largo}m × {room.ancho}m = {room.m2Calculado} m²
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.roomType}>Superficie total</Text>
              <Text style={styles.roomDims}>{sumM2(rooms)} m²</Text>
            </View>
          </>
        )}

        {/* --- 3. Metodología y Fuentes de Evaluación --- */}
        <Text style={styles.h2}>3. Metodología y Fuentes de Evaluación</Text>
        <Text style={styles.legalParagraph}>
          Esta evaluación fue generada mediante un motor de reglas normativas determinístico — no mediante
          inteligencia artificial generativa — aplicando {rules.length} criterio(s) activo(s) a la fecha de
          generación de este informe. Las fuentes normativas usadas se detallan en la sección 11.
        </Text>

        {/* --- 4. Resultado de Elegibilidad por Tramo --- */}
        <View break>
          <Text style={styles.h2}>4. Resultado de Elegibilidad por Tramo</Text>
          <Text style={styles.placeholderNote}>
            El panel comparativo de tramos (Tramo 1 / Tramo 2) y las tarjetas de criterio individuales se
            implementan en una fase posterior de este plan. Por ahora, esta sección muestra el mismo resultado de la
            evaluación preliminar ya calculado por el motor de reglas.
          </Text>
          {rules.length === 0 ? (
            <Text style={styles.emptyNote}>No hay observaciones adicionales para este caso.</Text>
          ) : (
            rules.map((rule, i) => (
              <View key={i} style={styles.ruleBlock} wrap={false}>
                <Text style={styles.ruleLabel}>{rule.label}</Text>
                <Text style={styles.ruleMessage}>{rule.message}</Text>
              </View>
            ))
          )}
        </View>

        <Footer folio={folio} generatedAt={generatedAt} />
      </Page>

      {/* ===== PÁGINA 2 — Croquis y Fotografías ===== */}
      <Page size="A4" style={styles.page}>
        <RunningHeader folio={folio} />
        <Text style={styles.h2}>5. Croquis Referencial de la Vivienda</Text>
        <View style={styles.sketchDisclaimer}>
          <Text>{SKETCH_DISCLAIMER}</Text>
        </View>
        {!sketchViewBox ? (
          <Text style={styles.emptyNote}>Croquis no disponible para este caso.</Text>
        ) : (
          <>
            <Svg
              width={sketchRenderWidth}
              height={sketchRenderHeight}
              viewBox={`${sketchViewBox.minX} ${sketchViewBox.minY} ${sketchViewBox.width} ${sketchViewBox.height}`}
            >
              {sketchPrimitives.map((p) =>
                p.kind === "path" ? (
                  <Path
                    key={p.id}
                    d={p.d}
                    stroke={p.stroke}
                    strokeWidth={p.strokeWidth}
                    fill={p.fill ?? "none"}
                    strokeDasharray={p.dashed ? "4,3" : undefined}
                    strokeLinecap={p.linecap}
                  />
                ) : (
                  // @ts-expect-error -- @react-pdf/renderer@4.5.1: SVGTextProps
                  // (node_modules/@react-pdf/types/svg.d.ts) no declara
                  // `fontSize`, pero el prop SÍ es soportado y aplicado en
                  // runtime por Text dentro de Svg — verificado explícitamente
                  // en la prueba de compatibilidad SVG↔PDF previa a esta
                  // implementación (2026-08-02): un <Text fontSize={14}> real
                  // se renderizó y su contenido se extrajo correctamente del
                  // PDF resultante. Esta supresión es deliberada, no un error
                  // accidental — no la elimines en una limpieza de TypeScript
                  // sin volver a intentar sin ella primero. Quítala cuando
                  // una versión futura de @react-pdf/renderer agregue
                  // `fontSize` a SVGTextProps (el build fallará solo si la
                  // supresión deja de ser necesaria, gracias a @ts-expect-error
                  // en vez de @ts-ignore).
                  <Text key={p.id} x={p.x} y={p.y} fontSize={p.fontSize}>
                    {p.content}
                  </Text>
                )
              )}
            </Svg>
            <Text style={styles.meta}>Generado a partir de los datos ingresados por el usuario. Sujeto a verificación en terreno.</Text>
          </>
        )}

        <Text style={styles.h2}>6. Registro Fotográfico</Text>
        {groupedPhotos.length === 0 ? (
          <Text style={styles.emptyNote}>Sin registro fotográfico adjunto.</Text>
        ) : (
          groupedPhotos.map((group) => (
            <View key={group.kind} style={styles.categoryBlock}>
              <Text style={styles.categoryTitle}>{PHOTO_KIND_LABELS[group.kind] ?? group.kind}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {group.items.map((photo, i) => (
                  <View key={i} style={{ marginRight: 10 }}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no el <img> del DOM: no acepta alt */}
                    <Image src={photo.url} style={styles.photoImg} />
                    {photo.caption && <Text style={styles.photoCaption}>{photo.caption}</Text>}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        <Footer folio={folio} generatedAt={generatedAt} />
      </Page>

      {/* ===== PÁGINA 3 — Observaciones, Documentos, Próximos pasos, Qué ocurre después ===== */}
      <Page size="A4" style={styles.page}>
        <RunningHeader folio={folio} />
        <Text style={styles.h2}>7. Observaciones Técnicas Preliminares</Text>
        <Text style={styles.placeholderNote}>
          La clasificación de observaciones por nivel de prioridad (riesgos importantes / aspectos a verificar /
          observaciones informativas) se implementa en una fase posterior de este plan, cuando el motor de reglas
          incorpore un nivel de severidad por criterio. El resultado de la evaluación preliminar de este caso ya se
          muestra en la sección 4.
        </Text>

        <View break>
          <Text style={styles.h2}>8. Documentos y Antecedentes Requeridos</Text>
          <Text style={styles.meta}>
            Esta es la lista de documentos que normalmente se requieren para este trámite. Márquelos a medida que los
            vaya reuniendo.
          </Text>
          {groupedDocs.length === 0 ? (
            <Text style={styles.emptyNote}>Sin documentos aplicables todavía.</Text>
          ) : (
            groupedDocs.map((group) => (
              <View key={group.category} style={styles.categoryBlock}>
                <Text style={styles.categoryTitle}>{CATEGORY_LABELS[group.category] ?? group.category}</Text>
                {group.docs.map((doc) => (
                  <View key={doc.id} style={styles.docRow} wrap={false}>
                    <Text style={styles.docCheck}>
                      {doc.estadoValidacion === "PENDIENTE_VALIDACION_PROFESIONAL" ? "[!]" : doc.checked ? "[X]" : "[ ]"}
                    </Text>
                    <View style={styles.docText}>
                      <Text>{doc.documento}</Text>
                      <Text style={styles.docObligatorio}>
                        {describeObligatoriedad(doc.obligatoriedad)} · {describeDocumentOrigen(doc.origen)}
                      </Text>
                      {doc.estadoValidacion === "PENDIENTE_VALIDACION_PROFESIONAL" && (
                        <Text style={styles.docWarningText}>{doc.paraQueSirve}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        <View break>
          <Text style={styles.h2}>9. Próximos Pasos Recomendados</Text>
          <View style={styles.numberedStep} wrap={false}>
            <Text style={styles.numberedStepNum}>1.</Text>
            <Text style={styles.numberedStepText}>
              Contratar un arquitecto, ingeniero constructor o constructor civil habilitado para la revisión y
              elaboración del expediente técnico.
            </Text>
          </View>
          <View style={styles.numberedStep} wrap={false}>
            <Text style={styles.numberedStepNum}>2.</Text>
            <Text style={styles.numberedStepText}>Solicitar certificado de avalúo fiscal actualizado en el SII.</Text>
          </View>
          <View style={styles.numberedStep} wrap={false}>
            <Text style={styles.numberedStepNum}>3.</Text>
            <Text style={styles.numberedStepText}>Completar el Formulario 12.1 con el profesional a cargo.</Text>
          </View>
          <View style={styles.numberedStep} wrap={false}>
            <Text style={styles.numberedStepNum}>4.</Text>
            <Text style={styles.numberedStepText}>Presentar el expediente en la Dirección de Obras Municipales (DOM) de la comuna.</Text>
          </View>
          <View style={styles.numberedStep} wrap={false}>
            <Text style={styles.numberedStepNum}>5.</Text>
            <Text style={styles.numberedStepText}>Dar seguimiento al plazo legal vigente de la Ley 20.898 (ver sección 11).</Text>
          </View>
        </View>

        <Text style={styles.h2}>9-bis. ¿Qué Ocurre Después?</Text>
        <Text style={styles.meta}>
          Una vez aprobada tu regularización, estos son los pasos y documentos que normalmente vienen a
          continuación — no necesitas gestionarlos todavía.
        </Text>
        <View style={styles.numberedStep} wrap={false}>
          <Text style={styles.numberedStepNum}>1.</Text>
          <Text style={styles.numberedStepText}>
            Pago de derechos municipales — la propia DOM calcula y emite el comprobante (Formularios 12.2 / 12.3), una
            vez revisado el expediente.
          </Text>
        </View>
        <View style={styles.numberedStep} wrap={false}>
          <Text style={styles.numberedStepNum}>2.</Text>
          <Text style={styles.numberedStepText}>Emisión de la resolución de regularización por parte de la DOM.</Text>
        </View>
        <View style={styles.numberedStep} wrap={false}>
          <Text style={styles.numberedStepNum}>3.</Text>
          <Text style={styles.numberedStepText}>
            Recepción definitiva — el documento que certifica que la construcción quedó regularizada.
          </Text>
        </View>
        <View style={styles.numberedStep} wrap={false}>
          <Text style={styles.numberedStepNum}>4.</Text>
          <Text style={styles.numberedStepText}>
            Inscripción de la recepción en el Conservador de Bienes Raíces, si corresponde — paso final de registro,
            no un requisito de entrada.
          </Text>
        </View>

        {/* Documentos reales con momento:posterior (Fase 2, modelo de tres
            ejes) — el listado narrativo de arriba se mantiene tal cual
            (explica el PROCESO), esto agrega el detalle de cada documento
            (para qué sirve, dónde se obtiene) desde el catálogo. */}
        {documentsPosteriores.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.h3}>Documentos asociados</Text>
            {documentsPosteriores.map((doc) => (
              <View key={doc.documento} style={styles.docRow} wrap={false}>
                <Text style={styles.docCheck}>·</Text>
                <View style={styles.docText}>
                  <Text>{doc.documento}</Text>
                  <Text style={styles.docObligatorio}>{doc.paraQueSirve} — {doc.dondeSeObtiene}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Footer folio={folio} generatedAt={generatedAt} />
      </Page>

      {/* ===== PÁGINA 4 — Glosario, Marco normativo, Aviso legal, Firmas, Historial ===== */}
      <Page size="A4" style={styles.page}>
        <RunningHeader folio={folio} />
        <Text style={styles.h2}>10. Glosario Breve</Text>
        {[
          ["DOM", "Dirección de Obras Municipales — unidad de la municipalidad que revisa y resuelve el trámite."],
          ["OGUC", "Ordenanza General de Urbanismo y Construcciones — reglamento que desarrolla la Ley General de Urbanismo y Construcciones."],
          ["Rol de avalúo", "Número que identifica una propiedad ante el Servicio de Impuestos Internos (SII)."],
          ["Recepción de obra", "Acto por el cual la DOM certifica que una construcción cumple con el permiso otorgado."],
          ["Formulario 12.1", "Formulario oficial del MINVU para solicitar la regularización simplificada de viviendas hasta 90 m² / 1.000 UF (Tramo 1)."],
          ["Profesional competente", "Arquitecto, ingeniero civil, ingeniero constructor o constructor civil, habilitado para firmar el expediente."],
          ["UF", "Unidad de Fomento — unidad de valor reajustable, usada para expresar los límites de avalúo fiscal de la ley."],
          ["Tramo", "Cada uno de los 2 rangos de superficie/avalúo fiscal que definen la vía simplificada de regularización."],
        ].map(([term, def]) => (
          <View key={term} style={styles.glossaryRow} wrap={false}>
            <Text style={styles.glossaryTerm}>{term}</Text>
            <Text style={styles.glossaryDef}>{def}</Text>
          </View>
        ))}

        <Text style={styles.h2}>11. Marco Normativo y Fuentes Citadas</Text>
        <Text style={styles.sourceItem}>· Ley N° 20.898, Ministerio de Vivienda y Urbanismo — procedimiento simplificado de regularización.</Text>
        <Text style={styles.sourceItem}>· Ordenanza General de Urbanismo y Construcciones (OGUC).</Text>
        <Text style={styles.sourceItem}>· Formulario 12.1, Ministerio de Vivienda y Urbanismo (MINVU) — Tramo 1 (hasta 90 m² / 1.000 UF).</Text>
        <Text style={styles.sourceItem}>· Valor UF: Servicio de Impuestos Internos (SII).</Text>
        <Text style={styles.placeholderNote}>
          Contenido normativo sujeto a validación profesional — ver aviso legal (sección 12) y el documento de
          revisión normativa del proyecto.
        </Text>

        <Text style={styles.h2}>12. Aviso Legal Completo</Text>
        {AVISO_LEGAL_COMPLETO.map((paragraph, i) => (
          <Text key={i} style={styles.legalParagraph}>
            {paragraph}
          </Text>
        ))}

        <View break>
          <Text style={styles.h2}>13. Espacio de Validación Profesional</Text>
          <View style={styles.signatureBoxes} wrap={false}>
            <View style={styles.signatureBox}>
              <Text style={styles.h3}>Validación profesional</Text>
              <Text style={styles.signatureFieldLabel}>Nombre del profesional</Text>
              <View style={styles.signatureLine} />
              <Text style={[styles.signatureFieldLabel, { marginTop: 8 }]}>
                Especialidad:  [ ] Arquitecto   [ ] Ingeniero Constructor   [ ] Constructor Civil
              </Text>
              <Text style={[styles.signatureFieldLabel, { marginTop: 8 }]}>N° de registro / colegio profesional</Text>
              <View style={styles.signatureLine} />
              <Text style={[styles.signatureFieldLabel, { marginTop: 8 }]}>Firma                                          Fecha: __ /__ /____</Text>
              <View style={styles.signatureLine} />
              <Text style={[styles.signatureFieldLabel, { marginTop: 8 }]}>Observaciones del profesional</Text>
              <View style={styles.signatureLine} />
              <View style={styles.signatureLine} />
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.h3}>Acuse de recibo del propietario</Text>
              <Text style={styles.signatureFieldLabel}>Nombre del solicitante</Text>
              <View style={styles.signatureLine} />
              <Text style={[styles.signatureFieldLabel, { marginTop: 8 }]}>Firma                                          Fecha: __ /__ /____</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
        </View>

        <View style={styles.historyBlock}>
          <Text style={styles.h3}>14. Historial y Trazabilidad del Documento</Text>
          <Text style={styles.historyText}>Versión del informe: {REPORT_VERSION}</Text>
          <Text style={styles.historyText}>Generado: {dateTimeFormatter.format(generatedAt)}</Text>
          <Text style={styles.historyText}>Última actualización del caso: {dateTimeFormatter.format(caseUpdatedAt)}</Text>
          <Text style={styles.historyText}>Motor normativo: v{NORM_ENGINE_VERSION}</Text>
          <Text style={styles.historyText}>Fuentes utilizadas: Ley 20.898 · Formulario 12.1 · OGUC</Text>
        </View>

        <Footer folio={folio} generatedAt={generatedAt} />
      </Page>
    </Document>
  );
}
