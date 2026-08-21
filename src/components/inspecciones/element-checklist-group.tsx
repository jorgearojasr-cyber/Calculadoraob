import { Check, Camera } from "lucide-react";
import { ChecklistItemRow } from "./checklist-item-row";
import { PhotoUpload, type InspectionPhotoItem } from "./photo-upload";
import { computeProgress } from "@/lib/inspecciones/progress";
import type { ObservationDTO } from "@/app/(app)/inspecciones/[id]/actions";
import type { InspectionAnswerStatus, InspectionReferenceImageKind, InspectionSeverity } from "@/generated/prisma/client";

export type ElementChecklistData = {
  id: string;
  name: string;
  photos: InspectionPhotoItem[];
  checks: {
    id: string;
    questionSnapshot: string;
    status: InspectionAnswerStatus | null;
    // Fase 11K — ver docs/FASE11J..., sección Q. Solo tiene sentido
    // cuando status === "NOT_APPLICABLE"; en cualquier otro caso siempre
    // viene null (la Server Action lo garantiza).
    notApplicableReason: string | null;
    // Fase 18A (DT-01) — severidad por defecto del InspectionChecklistItem
    // (puede ser null: varios checks base — piso/muros/ventana/etc. — no
    // declaran una). Se usa solo para inicializar el selector de un
    // hallazgo NUEVO; nunca sobrescribe la severidad ya guardada de un
    // hallazgo existente (ver ObservationForm en checklist-item-row.tsx).
    defaultSeverity: InspectionSeverity | null;
    observations: ObservationDTO[];
    // Piloto Fase 5B — presente solo cuando el InspectionChecklistItem
    // tiene technicalArticleSlug Y ese slug resuelve a un TechnicalArticle
    // real (resuelto en [id]/page.tsx). null en el resto de las preguntas
    // — la mayoría del catálogo no tiene artículo todavía.
    // Fase 11B — queRevisar/comoRevisarlo/condicionesCorrectas/
    // senalesDeProblema arman el bloque de guía; comoRevisarlo y
    // senalesDeProblema están presentes solo cuando el artículo tiene esas
    // 2 secciones nuevas (hoy, solo Piso) — en el resto quedan null y el
    // checklist se ve exactamente igual que antes (docs/FASE11A..., sección 7).
    technicalArticle: {
      title: string;
      content: string;
      queRevisar: string | null;
      condicionesCorrectas: string | null;
      comoRevisarlo: string | null;
      senalesDeProblema: string | null;
      // Fase 11E — ver GuideBlock en checklist-item-row.tsx.
      porQueImporta: string | null;
      // Fase 11L — línea compacta mostrada por defecto (explícita o
      // derivada, ver inspecciones-knowledge.ts) y la recomendación del
      // artículo (ya existía en KnowledgeEntry desde Fase 10B, pero no se
      // mostraba en el flujo "guía primero" hasta ahora).
      guiaBreve: string | null;
      recomendacion: string | null;
    } | null;
    // Fase 11Q (docs/FASE11O_INFORME_MODELO_REFERENCIAS_VISUALES.md,
    // docs/FASE11Q_INFORME_...) — imágenes de referencia BIEN/MAL de ESTA
    // revisión puntual (InspectionChecklistItem.referenceImages), no del
    // TechnicalArticle. Vacío en casi todo el catálogo hoy (solo existe el
    // consumidor; ningún InspectionReferenceImage real insertado aún) —
    // el control "Ver ejemplos" se oculta por completo con length 0.
    referenceImages: {
      id: string;
      kind: InspectionReferenceImageKind;
      url: string;
      alt: string;
      caption: string | null;
    }[];
  }[];
};

// Un InspectionElement con sus InspectionChecklistCheck — orden ya
// resuelto en la query (elementos por `order`, checks por el `order` de
// su InspectionChecklistItem, ver [id]/page.tsx).
export function ElementChecklistGroup({ caseId, element }: { caseId: string; element: ElementChecklistData }) {
  const progress = computeProgress(element.checks.map((c) => c.status));

  return (
    <div className="rounded-2xl p-5 bg-white border border-border">
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="font-medium text-[15px]">{element.name}</p>
        <span className="inline-flex items-center gap-1 text-xs font-mono text-ink-muted flex-shrink-0">
          {progress.answered} / {progress.total}
          {progress.total > 0 && progress.answered === progress.total && (
            <Check className="w-3.5 h-3.5 text-success" />
          )}
        </span>
      </div>
      <div>
        {element.checks.map((check) => (
          <ChecklistItemRow
            key={check.id}
            caseId={caseId}
            checkId={check.id}
            questionSnapshot={check.questionSnapshot}
            initialStatus={check.status}
            initialNotApplicableReason={check.notApplicableReason}
            defaultSeverity={check.defaultSeverity}
            initialObservations={check.observations}
            technicalArticle={check.technicalArticle}
            referenceImages={check.referenceImages}
          />
        ))}
      </div>

      {/* Fotografía general del elemento — no exige una observación
          (Fase 4, punto 2: "Dormitorio 1 -> Ventana -> Fotografía
          general"). */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint mb-2 flex items-center gap-1">
          <Camera className="w-3 h-3" />
          Fotografía general
        </p>
        <PhotoUpload caseId={caseId} context={{ level: "element", elementId: element.id }} initialPhotos={element.photos} compact />
      </div>
    </div>
  );
}
