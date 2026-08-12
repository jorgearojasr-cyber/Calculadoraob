// Tipo + helpers de presentación puros, sin ninguna dependencia de
// servidor (Prisma) — separado de regularization-documents.ts a
// propósito: ese archivo importa `@/lib/prisma`, y la vista de checklist
// en pantalla (regularization-document-checklist-view.tsx) es un
// componente "use client" que necesita estas 2 funciones y el tipo, pero
// NUNCA debe arrastrar Prisma/`pg` a un bundle de cliente — bug real
// encontrado en el build de Fase 2 (2026-08-02): `next build` fallaba con
// "Module not found: Can't resolve 'tls'" porque el import transitivo
// llegaba hasta `pg/lib/connection.js`. Ver informe de Fase 2.
export type RegularizationDocumentItem = {
  id: string;
  documento: string;
  category: string;
  paraQueSirve: string;
  dondeSeObtiene: string;
  obligatoriedad: "MINIMO" | "CONDICIONAL";
  origen: "USUARIO" | "PROFESIONAL" | "INSTITUCION";
  momento: "PREVIO" | "DURANTE" | "POSTERIOR";
  soporteObraBien: "GENERA_PLATAFORMA" | "ORIENTA_ACCESO_DIRECTO" | "GESTION_EXTERNA";
  citaNormativa: string;
  estadoValidacion: "PENDIENTE_VALIDACION_PROFESIONAL" | "VALIDADO";
  checked: boolean;
  // Fase 16B — true cuando el documento tiene un `dependeDe` real en BD
  // (una condición DSL evaluable, ver evaluateCondition), false cuando
  // `dependeDe` es null. Nunca se deriva de `obligatoriedad` sola: un
  // documento CONDICIONAL sin `dependeDe` no tiene forma de saber si
  // corresponde al caso actual, a diferencia de uno que sí lo tiene y que
  // ObraBien ya evaluó como aplicable (si no aplicara, ni siquiera
  // llegaría a esta lista — ver getVisibleDocumentChecklist). Distingue
  // 🟠 "Sí corresponde" (condición real, ya evaluada true) de ⚪
  // "Condicional / revisar" (sin forma de saberlo automáticamente todavía).
  tieneCondicionAutomatica: boolean;
};

// Etiqueta combinada "Obligatoriedad · frase de origen", ej. "Mínimo · Lo
// prepara tu profesional" — ver diseño del informe, sección 8. Un único
// lugar para esta frase, reutilizado por la vista en pantalla y por el
// PDF, para que nunca diverjan.
export function describeDocumentOrigen(origen: RegularizationDocumentItem["origen"]): string {
  switch (origen) {
    case "USUARIO":
      return "Lo obtienes tú";
    case "PROFESIONAL":
      return "Lo prepara tu profesional";
    case "INSTITUCION":
      return "Lo emite la institución correspondiente";
  }
}

export function describeObligatoriedad(obligatoriedad: RegularizationDocumentItem["obligatoriedad"]): string {
  return obligatoriedad === "MINIMO" ? "Mínimo" : "Condicional";
}

// Fase 16B — semáforo visual de 3 estados, presentación pura sobre los
// ejes normativos ya existentes (obligatoriedad + tieneCondicionAutomatica).
// NO reclasifica ningún documento: es la misma información de siempre,
// mostrada de forma más legible. Deliberadamente NO existe un 4to estado
// "🟢 Recomendado" (ver auditoría Fase 16A, sección 9A) — hoy ningún
// documento del catálogo pertenece a esa categoría, y crearla implicaría
// reclasificar los 6 PENDIENTE_VALIDACION_PROFESIONAL sin fuente nueva,
// fuera de alcance de esta fase.
export type DocumentoSemaforo = {
  emoji: "🔴" | "🟠" | "⚪";
  label: string;
  description: string;
  colorClass: string;
};

export function describeSemaforo(
  doc: Pick<RegularizationDocumentItem, "obligatoriedad" | "tieneCondicionAutomatica">
): DocumentoSemaforo {
  if (doc.obligatoriedad === "MINIMO") {
    return {
      emoji: "🔴",
      label: "Obligatorio",
      description: "Se pide siempre para este trámite.",
      colorClass: "bg-red-50 text-red-700 border-red-200",
    };
  }
  if (doc.tieneCondicionAutomatica) {
    return {
      emoji: "🟠",
      label: "Sí corresponde",
      description: "Según tus respuestas, este documento aplica a tu caso.",
      colorClass: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }
  return {
    emoji: "⚪",
    label: "Condicional · revisar",
    description: "Puede o no aplicarte — ObraBien todavía no tiene una forma automática de saberlo. Revísalo con tu profesional.",
    colorClass: "bg-concrete text-ink-muted border-border",
  };
}

// Fase 16B — enlace oficial ya usado en avaluo-fiscal-gate.tsx, reutilizado
// acá para el mismo documento del checklist ("Certificado de avalúo fiscal
// simple..."). Coincidencia por texto exacto del catálogo (mismo patrón ya
// aceptado en este proyecto para el semáforo del PDF, ver LABEL_CALIFICA_TRAMO
// en regularization-pdf.tsx) — no se agrega un campo de URL al schema para
// un único documento con enlace conocido hoy.
export const SII_AVALUO_FISCAL_URL = "https://www.sii.cl";
const AVALUO_FISCAL_DOCUMENTO_TEXTO = "Certificado de avalúo fiscal simple, a la fecha 04/02/2016";

export function isAvaluoFiscalDocumento(documento: string): boolean {
  return documento === AVALUO_FISCAL_DOCUMENTO_TEXTO;
}
