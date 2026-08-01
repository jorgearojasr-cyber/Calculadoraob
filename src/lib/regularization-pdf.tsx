import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from "@react-pdf/renderer";
import type { RegularizationRuleResult } from "@/lib/regularization-rules";
import type { RegularizationDocumentItem } from "@/lib/regularization-documents";
import { SKETCH_DISCLAIMER, elementsToPrimitives, computeViewBox, type SketchData } from "@/lib/regularization-sketch";

// Fuente Helvetica por defecto de @react-pdf/renderer — probada con
// texto real del módulo (tildes y ñ) antes de construir este documento,
// ver font-test.tsx (2026-08-02). Sin fuente TTF embebida: no hizo
// falta.

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

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: "#1a1a1a" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 18, marginBottom: 8 },
  meta: { fontSize: 9, color: "#666666", marginBottom: 16 },
  disclaimer: {
    fontSize: 9,
    color: "#7a4b00",
    backgroundColor: "#fff4e0",
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 160, color: "#555555" },
  value: { flex: 1 },
  ruleBlock: { marginBottom: 10, paddingBottom: 8, borderBottom: "1 solid #e0e0e0" },
  ruleLabel: { fontWeight: 700, marginBottom: 2 },
  ruleMessage: { color: "#333333" },
  emptyNote: { color: "#888888", fontStyle: "italic" },
  roomRow: { flexDirection: "row", marginBottom: 4 },
  roomType: { width: 160 },
  roomDims: { flex: 1 },
  totalRow: { flexDirection: "row", marginTop: 6, paddingTop: 6, borderTop: "1 solid #333333" },
  categoryBlock: { marginBottom: 12 },
  categoryTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" },
  docRow: { flexDirection: "row", marginBottom: 5 },
  docCheck: { width: 16 },
  docText: { flex: 1 },
  docObligatorio: { fontSize: 8, color: "#7a4b00" },
  photoImg: { width: 160, height: 120, marginBottom: 4, objectFit: "cover" },
  photoCaption: { fontSize: 8, color: "#666666", marginBottom: 10 },
  sketchDisclaimer: {
    fontSize: 9,
    color: "#7a4b00",
    backgroundColor: "#fff4e0",
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
});

const SKETCH_MAX_WIDTH = 480; // pt
const SKETCH_MAX_HEIGHT = 620; // pt

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

export type RegularizationPdfData = {
  regCase: RegularizationPdfCase;
  rules: RegularizationRuleResult[];
  rooms: RegularizationPdfRoom[];
  documents: RegularizationDocumentItem[];
  photos: RegularizationPdfPhoto[];
  sketch: SketchData | null;
  generatedAt: Date;
};

function sumM2(rooms: RegularizationPdfRoom[]): number {
  return Math.round(rooms.reduce((acc, r) => acc + r.m2Calculado, 0) * 100) / 100;
}

export function RegularizationCarpetaDocument({
  regCase,
  rules,
  rooms,
  documents,
  photos,
  sketch,
  generatedAt,
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{regCase.name}</Text>
        <Text style={styles.meta}>Carpeta generada el {dateFormatter.format(generatedAt)}</Text>

        <View style={styles.disclaimer}>
          <Text>
            Esta información constituye una orientación preliminar y no reemplaza la evaluación de un
            arquitecto ni la resolución de la Dirección de Obras Municipales.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Tipo de construcción</Text>
          <Text style={styles.value}>{TIPO_CONSTRUCCION_LABELS[regCase.tipoConstruccion] ?? regCase.tipoConstruccion}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Material</Text>
          <Text style={styles.value}>{MATERIAL_LABELS[regCase.material] ?? regCase.material}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Año de construcción</Text>
          <Text style={styles.value}>{regCase.anioConstruccion ?? "No informado"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Recepción municipal</Text>
          <Text style={styles.value}>
            {regCase.recepcionMunicipal === true
              ? "Sí"
              : regCase.recepcionMunicipal === false
                ? "No"
                : "No informado"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>m² estimados (wizard inicial)</Text>
          <Text style={styles.value}>{regCase.m2Estimados} m²</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>m² real (suma de recintos)</Text>
          <Text style={styles.value}>{rooms.length > 0 ? `${sumM2(rooms)} m²` : "Sin recintos cargados"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Avalúo fiscal</Text>
          <Text style={styles.value}>
            {regCase.avaluoFiscalPesos !== null ? pesosFormatter.format(regCase.avaluoFiscalPesos) : "No informado"}
          </Text>
        </View>

        <Text style={styles.h2}>Evaluación preliminar</Text>
        {rules.length === 0 ? (
          <Text style={styles.emptyNote}>No hay observaciones adicionales para este caso.</Text>
        ) : (
          rules.map((rule, i) => (
            <View key={i} style={styles.ruleBlock}>
              <Text style={styles.ruleLabel}>{rule.label}</Text>
              <Text style={styles.ruleMessage}>{rule.message}</Text>
            </View>
          ))
        )}

        <Text style={styles.h2}>Recintos</Text>
        {rooms.length === 0 ? (
          <Text style={styles.emptyNote}>Sin recintos cargados.</Text>
        ) : (
          <>
            {rooms.map((room, i) => (
              <View key={i} style={styles.roomRow}>
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

        <Text style={styles.h2}>Checklist de documentos</Text>
        {groupedDocs.length === 0 ? (
          <Text style={styles.emptyNote}>Sin documentos aplicables todavía.</Text>
        ) : (
          groupedDocs.map((group) => (
            <View key={group.category} style={styles.categoryBlock}>
              <Text style={styles.categoryTitle}>{CATEGORY_LABELS[group.category] ?? group.category}</Text>
              {group.docs.map((doc) => (
                <View key={doc.id} style={styles.docRow}>
                  <Text style={styles.docCheck}>{doc.checked ? "[X]" : "[ ]"}</Text>
                  <Text style={styles.docText}>
                    {doc.documento}
                    {!doc.obligatorio ? " " : ""}
                    {!doc.obligatorio && <Text style={styles.docObligatorio}>(Opcional)</Text>}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Fotografías</Text>
        {groupedPhotos.length === 0 ? (
          <Text style={styles.emptyNote}>Sin fotografías cargadas.</Text>
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
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Croquis</Text>
        <View style={styles.sketchDisclaimer}>
          <Text>{SKETCH_DISCLAIMER}</Text>
        </View>
        {!sketchViewBox ? (
          <Text style={styles.emptyNote}>Sin croquis cargado.</Text>
        ) : (
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
        )}
      </Page>
    </Document>
  );
}
