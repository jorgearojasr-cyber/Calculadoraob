import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ElementChecklistGroup, type ElementChecklistData } from "./element-checklist-group";
import { SpaceNavFooter } from "./space-nav-footer";
import { PhotoUpload, type InspectionPhotoItem } from "./photo-upload";
import { computeProgress } from "@/lib/inspecciones/progress";

export function SpaceDetailView({
  caseId,
  spaceId,
  spaceName,
  spacePhotos,
  elements,
  prev,
  next,
}: {
  caseId: string;
  spaceId: string;
  spaceName: string;
  spacePhotos: InspectionPhotoItem[];
  elements: ElementChecklistData[];
  prev: { id: string; name: string } | null;
  next: { id: string; name: string } | null;
}) {
  const progress = computeProgress(elements.flatMap((el) => el.checks.map((c) => c.status)));

  return (
    <div className="grid gap-4">
      {/* min-h-11 + padding negativo horizontal: conserva el aspecto de
          enlace de siempre, solo agranda el área táctil (Fase 3.1,
          punto 2/4 — mismo criterio que "Cancelar" del formulario de
          observación). */}
      <Link
        href={`/inspecciones/${caseId}`}
        className="min-h-11 inline-flex items-center gap-1.5 px-2 -mx-2 text-sm font-medium text-ink-muted hover:text-ink w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
      >
        <ArrowLeft className="w-4 h-4" />
        Inspección
      </Link>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-xl font-semibold tracking-tight">{spaceName}</h1>
        <p className="text-sm font-semibold text-ink-muted">
          {progress.answered} / {progress.total} revisados · {progress.percent}%
        </p>
      </div>

      <div className="rounded-2xl p-4 bg-white border border-border">
        <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">Fotos del espacio</p>
        <PhotoUpload caseId={caseId} context={{ level: "space", spaceId }} initialPhotos={spacePhotos} compact />
      </div>

      <div className="grid gap-3">
        {elements.map((element) => (
          <ElementChecklistGroup key={element.id} caseId={caseId} element={element} />
        ))}
      </div>

      <SpaceNavFooter caseId={caseId} prev={prev} next={next} />
    </div>
  );
}
