import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { InspectionPropertyType, InspectionCaseStatus, InspectionSeverity } from "@/generated/prisma/client";
import type { InspectionReportData, ReportHallazgo, ReportSpace, ReportCounts } from "@/lib/inspecciones-report";

// Fase 9B — implementación del PDF según la especificación aprobada en
// docs/FASE9A_ESPECIFICACION_INFORME_PROFESIONAL.md. Estructura de
// bloques reutilizables (sección 3 del pedido: "evitar duplicar toda la
// lógica entre informe resumido y detallado") — ambos Document
// exportados (`InspectionSummaryDocument`/`InspectionDetailedDocument`)
// componen los MISMOS bloques sobre el MISMO `InspectionReportData`; solo
// cambia qué bloques se incluyen y cuánto se trunca en Hallazgos (Fase
// 9A, sección Y — "informe resumido vs. detallado").
//
// Reutiliza el mismo patrón de @react-pdf/renderer ya probado en
// regularization-pdf.tsx (misma librería, sin instalar nada nuevo — Fase
// 9B punto 2): fuentes core (Helvetica/Times, sin TTF embebida), colores
// como hex fijos derivados 1:1 de tailwind.config.ts (un PDF no lee CSS
// variables), disclaimers como bloques de color+borde (nunca solo
// color), Footer/RunningHeader `fixed`.

const dateFormatter = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "long", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Valores hex tomados 1:1 de tailwind.config.ts (Fase 9A, sección F:
// "reutilizar los tokens existentes, no inventar una paleta nueva para
// el PDF"). `caution` acá usa el mismo ámbar oscurecido
// (`text-[#8A620D]`) que checklist-item-row.tsx usa para el texto sobre
// `caution-tint` por motivo de contraste — no el `#D9A21B` crudo del
// token Tailwind, que mide 2.05:1 y no es apto para texto.
const PALETTE = {
  ink: "#1A1917",
  inkMuted: "#5E5850",
  inkFaint: "#8C8579",
  navy: "#002152",
  border: "#E4DED4",
  success: "#185C3D",
  successTint: "#B9D4C7",
  successBorder: "#9CC0AE",
  caution: "#8A620D",
  cautionTint: "#FBF1DC",
  cautionBorder: "#EFD9A0",
  danger: "#C4122F",
  dangerTint: "#FBE4E8",
  dangerBorder: "#EFB3BE",
  concrete: "#F9F9F9",
};

const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

const styles = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 56, paddingHorizontal: 42, fontSize: 9.5, color: PALETTE.ink, lineHeight: 1.35 },
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
  footer: {
    position: "absolute",
    bottom: 22,
    left: 42,
    right: 42,
    fontSize: 7.25,
    color: PALETTE.inkFaint,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `0.5 solid ${PALETTE.border}`,
    paddingTop: 5,
  },
  h1: { fontFamily: "Times-Bold", fontSize: 17, color: PALETTE.navy, marginBottom: 4, lineHeight: 1.2 },
  h2: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    color: PALETTE.navy,
    marginTop: SPACE.xl,
    marginBottom: SPACE.sm,
    paddingBottom: 4,
    borderBottom: `1.25 solid ${PALETTE.navy}`,
  },
  h3: { fontFamily: "Helvetica-Bold", fontSize: 9, color: PALETTE.inkMuted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: SPACE.md, marginBottom: SPACE.xs },
  meta: { fontSize: 8.5, color: PALETTE.inkMuted, marginBottom: 4 },
  emptyNote: { color: PALETTE.inkFaint, fontStyle: "italic" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  caseName: { fontFamily: "Times-Bold", fontSize: 13, color: PALETTE.ink, marginTop: 6, marginBottom: SPACE.md },
  completitudBlockOk: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, backgroundColor: PALETTE.successTint, border: `0.75 solid ${PALETTE.successBorder}`, borderRadius: 3, padding: SPACE.sm, marginBottom: SPACE.md },
  completitudBlockPending: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, backgroundColor: PALETTE.cautionTint, border: `0.75 solid ${PALETTE.cautionBorder}`, borderRadius: 3, padding: SPACE.sm, marginBottom: SPACE.md },
  completitudTextOk: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: PALETTE.success },
  completitudTextPending: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: PALETTE.caution },
  row: { flexDirection: "row", marginBottom: SPACE.xs, alignItems: "flex-start" },
  label: { width: 160, color: PALETTE.inkMuted },
  value: { flex: 1, color: PALETTE.ink },
  valueMuted: { flex: 1, color: PALETTE.inkFaint, fontStyle: "italic" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm, marginTop: SPACE.xs, marginBottom: SPACE.sm },
  chip: { borderRadius: 3, paddingVertical: 5, paddingHorizontal: 8, minWidth: 90 },
  chipLabel: { fontSize: 7.5, textTransform: "uppercase", letterSpacing: 0.4 },
  chipValue: { fontFamily: "Helvetica-Bold", fontSize: 13, marginTop: 1 },
  spaceBlock: { marginBottom: SPACE.sm, paddingBottom: SPACE.sm, borderBottom: `0.5 solid ${PALETTE.border}` },
  spaceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  spaceName: { fontFamily: "Helvetica-Bold", fontSize: 10, color: PALETTE.ink },
  spacePercent: { fontFamily: "Helvetica-Bold", fontSize: 10, color: PALETTE.navy },
  progressBarTrack: { height: 4, backgroundColor: PALETTE.border, borderRadius: 2, marginBottom: 3 },
  progressBarFill: { height: 4, backgroundColor: PALETTE.navy, borderRadius: 2 },
  spaceCountsText: { fontSize: 8, color: PALETTE.inkMuted },
  hallazgoBlock: { marginBottom: SPACE.sm, padding: SPACE.sm, borderRadius: 3, border: `0.75 solid ${PALETTE.border}` },
  hallazgoBlockVigente: { borderColor: PALETTE.cautionBorder },
  hallazgoHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 },
  hallazgoContext: { fontSize: 7.5, textTransform: "uppercase", letterSpacing: 0.4, color: PALETTE.inkFaint },
  hallazgoQuestion: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: PALETTE.ink, marginTop: 1 },
  severityChip: { borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6, fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  noVigenteChip: { borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6, fontSize: 7.5, fontFamily: "Helvetica-Bold", backgroundColor: PALETTE.concrete, color: PALETTE.inkMuted, border: `0.5 solid ${PALETTE.border}`, marginRight: 4 },
  hallazgoComment: { fontSize: 9, color: PALETTE.ink, marginTop: 3 },
  hallazgoRecommendation: { fontSize: 8, color: PALETTE.inkMuted, marginTop: 2 },
  hallazgoArticle: { fontSize: 8, color: PALETTE.navy, marginTop: 3, fontStyle: "italic" },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: SPACE.xs },
  photoImg: { width: 90, height: 68, objectFit: "cover", border: `0.75 solid ${PALETTE.border}`, borderRadius: 2 },
  photoImgLarge: { width: 150, height: 112, objectFit: "cover", border: `0.75 solid ${PALETTE.border}`, borderRadius: 2, marginBottom: 4 },
  photoGroupLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: PALETTE.inkMuted, marginBottom: 4, marginTop: SPACE.sm },
  pendienteGroup: { marginBottom: SPACE.sm },
  pendienteSpaceLabel: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: PALETTE.ink, marginBottom: 2 },
  pendienteLine: { fontSize: 8.5, color: PALETTE.inkMuted, marginBottom: 1 },
  elementLine: { flexDirection: "row", justifyContent: "space-between", fontSize: 8.5, marginBottom: 2, paddingBottom: 2, borderBottom: `0.5 solid ${PALETTE.border}` },
  elementLineName: { color: PALETTE.ink },
  elementLineStatus: { color: PALETTE.inkMuted },
  disclaimer: {
    fontSize: 8.25,
    color: PALETTE.inkMuted,
    backgroundColor: PALETTE.concrete,
    border: `0.75 solid ${PALETTE.border}`,
    padding: SPACE.sm,
    borderRadius: 3,
    marginBottom: SPACE.md,
    lineHeight: 1.4,
  },
  legalParagraph: { fontSize: 8.25, color: PALETTE.inkMuted, marginBottom: SPACE.sm, lineHeight: 1.45 },
  closingBlock: { marginTop: SPACE.xl, paddingTop: SPACE.sm, borderTop: `0.75 solid ${PALETTE.border}` },
  closingText: { fontSize: 7.75, color: PALETTE.inkFaint, marginBottom: 1 },
});

const PROPERTY_TYPE_LABELS: Record<InspectionPropertyType, string> = { CASA: "Casa", DEPARTAMENTO: "Departamento", AMPLIACION: "Ampliación" };
const CASE_STATUS_LABELS: Record<InspectionCaseStatus, string> = { DRAFT: "Borrador", IN_PROGRESS: "En curso", CLOSED: "Cerrada" };
const SEVERITY_LABELS: Record<InspectionSeverity, string> = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica" };
const SEVERITY_COLORS: Record<InspectionSeverity, { bg: string; text: string; border: string }> = {
  LOW: { bg: PALETTE.cautionTint, text: PALETTE.caution, border: PALETTE.cautionBorder },
  MEDIUM: { bg: PALETTE.cautionTint, text: PALETTE.caution, border: PALETTE.cautionBorder },
  HIGH: { bg: PALETTE.dangerTint, text: PALETTE.danger, border: PALETTE.dangerBorder },
  CRITICAL: { bg: PALETTE.dangerTint, text: PALETTE.danger, border: PALETTE.dangerBorder },
};

// Fase 9A, sección U/W — sin identificador profesional real todavía
// (InspectionCase no tiene un código correlativo); se usa el id truncado
// como referencia provisional, dejado explícito como tal en el pie.
function provisionalId(caseId: string): string {
  return `INS-${caseId.slice(0, 8).toUpperCase()}`;
}

function Footer({ refCode, generatedAt }: { refCode: string; generatedAt: Date }) {
  return (
    <Text
      style={styles.footer}
      fixed
      render={({ pageNumber, totalPages }) =>
        `${refCode} (provisorio)  ·  Generado ${dateFormatter.format(generatedAt)}  ·  Página ${pageNumber} de ${totalPages}`
      }
    />
  );
}

function RunningHeader({ title, refCode }: { title: string; refCode: string }) {
  return (
    <View style={styles.runningHeader} fixed>
      <Text style={styles.runningHeaderTitle}>{title}</Text>
      <Text>{refCode}</Text>
    </View>
  );
}

// ---- Bloques reutilizables (Fase 9B, punto 3: datos normalizados -> modelo de presentación -> renderer) ----

function Portada({ data, titulo }: { data: InspectionReportData; titulo: string }) {
  return (
    <View>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: SPACE.lg }}>
          <Text style={styles.h1}>{titulo}</Text>
          <Text style={styles.meta}>ObraBien Calcula — Inspecciones</Text>
        </View>
        <View style={{ alignItems: "flex-end", width: 150 }}>
          <Text style={[styles.meta, { fontFamily: "Courier" }]}>{provisionalId(data.caseId)}</Text>
          <Text style={styles.meta}>{dateFormatter.format(data.generatedAt)}</Text>
        </View>
      </View>
      <Text style={styles.caseName}>{data.name}</Text>
      <View style={styles.row} wrap={false}>
        <Text style={styles.label}>Tipo de inmueble</Text>
        <Text style={styles.value}>{PROPERTY_TYPE_LABELS[data.tipoInmueble]}</Text>
      </View>
      {data.direccion && (
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Dirección</Text>
          <Text style={styles.value}>{data.direccion}</Text>
        </View>
      )}
      <View style={styles.row} wrap={false}>
        <Text style={styles.label}>Fecha de inspección</Text>
        <Text style={data.fecha ? styles.value : styles.valueMuted}>{data.fecha ? dateFormatter.format(data.fecha) : "No registrada"}</Text>
      </View>
      <View style={styles.row} wrap={false}>
        <Text style={styles.label}>Estado del caso</Text>
        <Text style={styles.value}>{CASE_STATUS_LABELS[data.estado]}</Text>
      </View>
      <View style={styles.row} wrap={false}>
        <Text style={styles.label}>Realizado por</Text>
        <Text style={styles.value}>{data.ownerLabel}</Text>
      </View>
      {(data.bedroomCount !== null || data.bathroomCount !== null) && (
        <View style={styles.row} wrap={false}>
          <Text style={styles.label}>Dormitorios / Baños</Text>
          <Text style={styles.value}>
            {data.bedroomCount ?? "—"} / {data.bathroomCount ?? "—"}
          </Text>
        </View>
      )}
      <View style={styles.disclaimer}>
        <Text>
          Este documento refleja una revisión visual y funcional de los puntos indicados a continuación, realizada a
          través de ObraBien Calcula. No constituye una certificación técnica ni un pronunciamiento normativo — ver
          Alcance y limitaciones.
        </Text>
      </View>
    </View>
  );
}

function CompletitudBlock({ resultado }: { resultado: ReportCounts }) {
  if (resultado.total === 0) return null;
  if (resultado.pending === 0) {
    return (
      <View style={styles.completitudBlockOk} wrap={false}>
        <Text style={styles.completitudTextOk}>
          Inspección completa — los {resultado.total} puntos del checklist fueron revisados.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.completitudBlockPending} wrap={false}>
      <Text style={styles.completitudTextPending}>
        Inspección incompleta — quedan {resultado.pending} punto{resultado.pending > 1 ? "s" : ""} pendiente
        {resultado.pending > 1 ? "s" : ""} de revisión de {resultado.total}.
      </Text>
    </View>
  );
}

function ResultadoGlobalBlock({ data }: { data: InspectionReportData }) {
  const chips: { label: string; value: number; bg: string; text: string }[] = [
    { label: "OK", value: data.resultado.ok, bg: PALETTE.successTint, text: PALETTE.success },
    { label: "Observación", value: data.resultado.observation, bg: PALETTE.cautionTint, text: PALETTE.caution },
    { label: "No aplica", value: data.resultado.notApplicable, bg: PALETTE.concrete, text: PALETTE.inkMuted },
    { label: "Pendientes", value: data.resultado.pending, bg: "#FFFFFF", text: PALETTE.inkMuted },
  ];
  const totalObs = data.hallazgosVigentes.length;
  return (
    <View>
      {/* wrap={false} en cada grupo (título + fila de chips) — sin esto,
          @react-pdf/renderer puede auto-paginar A MITAD de una fila
          flexWrap cuando el contenido anterior (portada + aviso de
          completitud, de largo variable) casi llena la página: algunos
          chips desaparecían en vez de pasar a la página siguiente (bug
          real encontrado en QA de Fase 9B, reproducido en el informe
          resumido con una inspección incompleta). Cada grupo ahora se
          mueve completo a la página siguiente si no cabe, nunca se
          corta. */}
      <View wrap={false}>
        <Text style={styles.h3}>Resultado global ({data.resultado.total} puntos)</Text>
        <View style={styles.chipsRow}>
          {chips.map((c) => (
            <View key={c.label} style={[styles.chip, { backgroundColor: c.bg, border: `0.75 solid ${PALETTE.border}` }]}>
              <Text style={[styles.chipLabel, { color: c.text }]}>{c.label}</Text>
              <Text style={[styles.chipValue, { color: c.text }]}>{c.value}</Text>
            </View>
          ))}
        </View>
      </View>
      {totalObs > 0 && (
        <View wrap={false}>
          <Text style={styles.h3}>Severidad de hallazgos vigentes ({totalObs})</Text>
          <View style={styles.chipsRow}>
            {(Object.keys(SEVERITY_LABELS) as InspectionSeverity[]).map((sev) => (
              <View key={sev} style={[styles.chip, { backgroundColor: SEVERITY_COLORS[sev].bg, border: `0.75 solid ${SEVERITY_COLORS[sev].border}` }]}>
                <Text style={[styles.chipLabel, { color: SEVERITY_COLORS[sev].text }]}>{SEVERITY_LABELS[sev]}</Text>
                <Text style={[styles.chipValue, { color: SEVERITY_COLORS[sev].text }]}>{data.severityCounts[sev]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function EspaciosBlock({ spaces }: { spaces: ReportSpace[] }) {
  if (spaces.length === 0) return null;
  return (
    <View>
      <Text style={styles.h2}>Resumen por espacios</Text>
      {spaces.map((space) => {
        const percent = space.counts.total > 0 ? Math.round((space.counts.total - space.counts.pending) / space.counts.total * 100) : 0;
        const parts = [
          space.counts.ok > 0 ? `${space.counts.ok} OK` : null,
          space.counts.observation > 0 ? `${space.counts.observation} Observación` : null,
          space.counts.notApplicable > 0 ? `${space.counts.notApplicable} No aplica` : null,
          space.counts.pending > 0 ? `${space.counts.pending} pendiente${space.counts.pending > 1 ? "s" : ""}` : null,
        ].filter(Boolean);
        return (
          <View key={space.id} style={styles.spaceBlock} wrap={false}>
            <View style={styles.spaceHeaderRow}>
              <Text style={styles.spaceName}>{space.name}</Text>
              <Text style={styles.spacePercent}>{percent}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
            </View>
            <Text style={styles.spaceCountsText}>
              {space.counts.total} {space.counts.total === 1 ? "punto" : "puntos"} · {parts.join(" · ") || "sin puntos"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function HallazgoCard({ hallazgo, large }: { hallazgo: ReportHallazgo; large?: boolean }) {
  const sevColor = SEVERITY_COLORS[hallazgo.severity];
  return (
    <View style={[styles.hallazgoBlock, hallazgo.vigente ? styles.hallazgoBlockVigente : {}]} wrap={false}>
      <View style={styles.hallazgoHeaderRow}>
        <View style={{ flex: 1, paddingRight: SPACE.sm }}>
          <Text style={styles.hallazgoContext}>
            {hallazgo.spaceName} · {hallazgo.elementName}
          </Text>
          <Text style={styles.hallazgoQuestion}>{hallazgo.question}</Text>
        </View>
        <View style={{ flexDirection: "row", flexShrink: 0 }}>
          {!hallazgo.vigente && <Text style={styles.noVigenteChip}>NO VIGENTE</Text>}
          <Text style={[styles.severityChip, { backgroundColor: sevColor.bg, color: sevColor.text, border: `0.5 solid ${sevColor.border}` }]}>
            {SEVERITY_LABELS[hallazgo.severity]}
          </Text>
        </View>
      </View>
      <Text style={styles.hallazgoComment}>{hallazgo.comment}</Text>
      {hallazgo.recommendation && <Text style={styles.hallazgoRecommendation}>Recomendación: {hallazgo.recommendation}</Text>}
      {hallazgo.photos.length > 0 && (
        <View style={styles.photoRow}>
          {hallazgo.photos.map((p) => (
            // eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no <img> del DOM
            <Image key={p.id} src={p.url} style={large ? styles.photoImgLarge : styles.photoImg} cache={false} />
          ))}
        </View>
      )}
      {hallazgo.technicalArticleTitle && (
        <Text style={styles.hallazgoArticle}>Referencia técnica: &ldquo;{hallazgo.technicalArticleTitle}&rdquo;</Text>
      )}
    </View>
  );
}

function HallazgosSection({
  titulo,
  hallazgos,
  notaVacio,
  truncateTo,
}: {
  titulo: string;
  hallazgos: ReportHallazgo[];
  notaVacio?: string;
  truncateTo?: number;
}) {
  if (hallazgos.length === 0) {
    if (!notaVacio) return null;
    return (
      <View>
        <Text style={styles.h2}>{titulo}</Text>
        <Text style={styles.emptyNote}>{notaVacio}</Text>
      </View>
    );
  }
  const shown = truncateTo ? hallazgos.slice(0, truncateTo) : hallazgos;
  const remaining = hallazgos.length - shown.length;
  return (
    <View>
      <Text style={styles.h2}>
        {titulo} ({hallazgos.length})
      </Text>
      {shown.map((h) => (
        <HallazgoCard key={h.id} hallazgo={h} />
      ))}
      {remaining > 0 && (
        <Text style={styles.emptyNote}>+{remaining} hallazgo{remaining > 1 ? "s" : ""} adicional{remaining > 1 ? "es" : ""} — ver informe detallado.</Text>
      )}
    </View>
  );
}

function PendientesBlock({ data }: { data: InspectionReportData }) {
  if (data.pendientes.length === 0) return null;
  const bySpace = new Map<string, { spaceName: string; items: typeof data.pendientes }>();
  for (const p of data.pendientes) {
    const group = bySpace.get(p.spaceName) ?? { spaceName: p.spaceName, items: [] };
    group.items.push(p);
    bySpace.set(p.spaceName, group);
  }
  return (
    <View>
      <Text style={styles.h2}>Puntos pendientes ({data.pendientes.length})</Text>
      {Array.from(bySpace.values()).map((group) => (
        <View key={group.spaceName} style={styles.pendienteGroup} wrap={false}>
          <Text style={styles.pendienteSpaceLabel}>{group.spaceName}</Text>
          {group.items.map((item) => (
            <Text key={item.id} style={styles.pendienteLine}>
              · {item.elementName} — {item.question}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function FotosGeneralesBlock({ data }: { data: InspectionReportData }) {
  const grupos = [
    { label: "Fotografías generales de la inspección", photos: data.fotosGenerales },
    ...data.spaces.filter((s) => s.photos.length > 0).map((s) => ({ label: s.name, photos: s.photos })),
    ...data.spaces.flatMap((s) => s.elements.filter((e) => e.photos.length > 0).map((e) => ({ label: `${s.name} — ${e.name}`, photos: e.photos }))),
  ].filter((g) => g.photos.length > 0);
  if (grupos.length === 0) return null;
  return (
    <View>
      <Text style={styles.h2}>Registro fotográfico</Text>
      <Text style={styles.meta}>
        Fotografías generales, de espacio y de elemento. Las fotografías de cada hallazgo ya se muestran junto a su
        descripción, en la sección correspondiente.
      </Text>
      {grupos.map((g) => (
        <View key={g.label} wrap={false}>
          <Text style={styles.photoGroupLabel}>{g.label}</Text>
          <View style={styles.photoRow}>
            {g.photos.map((p) => (
              // eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer
              <Image key={p.id} src={p.url} style={styles.photoImg} cache={false} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function DetalleEspaciosBlock({ spaces }: { spaces: ReportSpace[] }) {
  const STATUS_LABEL: Record<string, string> = { OK: "OK", OBSERVATION: "Observación (ver hallazgo)", NOT_APPLICABLE: "No aplica" };
  return (
    <View>
      <Text style={styles.h2}>Detalle de inspección por espacio</Text>
      <Text style={styles.meta}>
        Estado de cada punto revisado. Los puntos con observación se detallan completos en la sección de Hallazgos —
        acá no se repite el comentario ni la fotografía, solo el estado.
      </Text>
      {spaces.map((space) => (
        <View key={space.id} wrap={false}>
          <Text style={styles.h3}>{space.name}</Text>
          {space.elements.map((el) => (
            <View key={el.id} style={{ marginBottom: SPACE.xs }}>
              {el.checks.map((c) => (
                <View key={c.id} style={styles.elementLine} wrap={false}>
                  <Text style={styles.elementLineName}>
                    {el.name} — {c.question}
                  </Text>
                  <Text style={styles.elementLineStatus}>{c.status ? STATUS_LABEL[c.status] ?? c.status : "Pendiente"}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function AlcanceBlock({ extendido }: { extendido: boolean }) {
  const parrafos = [
    "Alcance: esta inspección cubrió los espacios y elementos listados en este informe, según el catálogo vigente de ObraBien Calcula al momento de realizarla.",
    "Carácter visual: esta es una revisión visual y funcional básica, no un peritaje técnico ni un ensayo de laboratorio.",
    "Puntos no cubiertos: el catálogo actual no cubre exhaustivamente todos los elementos posibles de una propiedad. No debe asumirse que un elemento no mencionado en este informe fue revisado y aprobado.",
  ];
  if (extendido) {
    parrafos.push(
      "Limitaciones: este informe refleja el estado observado en el momento de cada revisión; no certifica condiciones futuras ni reemplaza una inspección técnica profesional cuando la severidad de un hallazgo lo amerite.",
      'Normativa: las observaciones registradas son de carácter visual/técnico. Este informe no evalúa cumplimiento normativo (OGUC, LGUC, NCh) salvo que exista una fuente explícita y verificada citada junto al hallazgo — ningún hallazgo de este documento debe interpretarse como "cumple" o "no cumple" normativa.'
    );
  }
  return (
    <View>
      <Text style={styles.h2}>Alcance y limitaciones</Text>
      {parrafos.map((p, i) => (
        <Text key={i} style={styles.legalParagraph}>
          {p}
        </Text>
      ))}
    </View>
  );
}

function Cierre({ data }: { data: InspectionReportData }) {
  return (
    <View style={styles.closingBlock}>
      <Text style={styles.closingText}>Realizado por: {data.ownerLabel}</Text>
      <Text style={styles.closingText}>Generado: {dateTimeFormatter.format(data.generatedAt)}</Text>
      <Text style={styles.closingText}>Referencia del documento: {provisionalId(data.caseId)} (identificador provisional, no correlativo)</Text>
    </View>
  );
}

// ---- Documentos ----

const RESUMEN_TRUNCATE = 5;

export function InspectionSummaryDocument({ data }: { data: InspectionReportData }) {
  const refCode = provisionalId(data.caseId);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Portada data={data} titulo="Resumen de Inspección" />
        <CompletitudBlock resultado={data.resultado} />
        <ResultadoGlobalBlock data={data} />
        <EspaciosBlock spaces={data.spaces} />
        <HallazgosSection titulo="Hallazgos vigentes" hallazgos={data.hallazgosVigentes} truncateTo={RESUMEN_TRUNCATE} notaVacio="No se registraron hallazgos vigentes." />
        <HallazgosSection titulo="Hallazgos anteriores — no vigentes" hallazgos={data.hallazgosHistoricos} truncateTo={RESUMEN_TRUNCATE} />
        <PendientesBlock data={data} />
        <AlcanceBlock extendido={false} />
        <Cierre data={data} />
        <RunningHeader title={`Resumen de Inspección — ${data.name}`} refCode={refCode} />
        <Footer refCode={refCode} generatedAt={data.generatedAt} />
      </Page>
    </Document>
  );
}

export function InspectionDetailedDocument({ data }: { data: InspectionReportData }) {
  const refCode = provisionalId(data.caseId);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Portada data={data} titulo="Informe Detallado de Inspección" />
        <CompletitudBlock resultado={data.resultado} />
        <ResultadoGlobalBlock data={data} />
        <RunningHeader title={`Informe Detallado — ${data.name}`} refCode={refCode} />
        <Footer refCode={refCode} generatedAt={data.generatedAt} />
      </Page>

      <Page size="A4" style={styles.page}>
        <RunningHeader title={`Informe Detallado — ${data.name}`} refCode={refCode} />
        <EspaciosBlock spaces={data.spaces} />
        <PendientesBlock data={data} />
        <Footer refCode={refCode} generatedAt={data.generatedAt} />
      </Page>

      <Page size="A4" style={styles.page}>
        <RunningHeader title={`Informe Detallado — ${data.name}`} refCode={refCode} />
        <HallazgosSection titulo="Hallazgos vigentes" hallazgos={data.hallazgosVigentes} notaVacio="No se registraron hallazgos vigentes." />
        <HallazgosSection titulo="Hallazgos anteriores — no vigentes" hallazgos={data.hallazgosHistoricos} />
        <Footer refCode={refCode} generatedAt={data.generatedAt} />
      </Page>

      <Page size="A4" style={styles.page}>
        <RunningHeader title={`Informe Detallado — ${data.name}`} refCode={refCode} />
        <FotosGeneralesBlock data={data} />
        <Footer refCode={refCode} generatedAt={data.generatedAt} />
      </Page>

      <Page size="A4" style={styles.page}>
        <RunningHeader title={`Informe Detallado — ${data.name}`} refCode={refCode} />
        <DetalleEspaciosBlock spaces={data.spaces} />
        <AlcanceBlock extendido />
        <Cierre data={data} />
        <Footer refCode={refCode} generatedAt={data.generatedAt} />
      </Page>
    </Document>
  );
}
