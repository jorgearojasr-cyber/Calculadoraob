import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { RegularizationRuleResult } from "@/lib/regularization-rules";
import type { RegularizationDocumentItem } from "@/lib/regularization-documents";

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
});

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
    </Document>
  );
}
