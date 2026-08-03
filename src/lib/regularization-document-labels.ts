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
