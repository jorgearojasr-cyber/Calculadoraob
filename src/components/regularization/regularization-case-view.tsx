"use client";

import { useState } from "react";
import { AvaluoFiscalGate } from "./avaluo-fiscal-gate";
import { RegularizationDocumentChecklistView } from "./regularization-document-checklist-view";
import type { RegularizationDocumentItem } from "@/lib/regularization-documents";

// Decide compuerta vs. checklist en el cliente (ver diseño Fase 2B,
// 2026-08-01) — sin campo adicional de "compuerta respondida": el estado
// inicial se deriva de si el servidor ya trae documentos (avalúo
// conocido) o no. Después de responder la compuerta, la transición al
// checklist es local (setDocuments), no depende de recargar la página.
export function RegularizationCaseView({
  caseId,
  initialDocuments,
}: {
  caseId: string;
  initialDocuments: RegularizationDocumentItem[] | null;
}) {
  const [documents, setDocuments] = useState(initialDocuments);

  if (documents === null) {
    return <AvaluoFiscalGate caseId={caseId} onDone={setDocuments} />;
  }

  return <RegularizationDocumentChecklistView caseId={caseId} documents={documents} />;
}
