import { MapPin } from "lucide-react";
import type { InspectionCaseStatus, InspectionPropertyType } from "@/generated/prisma/client";
import type { ProgressCount } from "@/lib/inspecciones/progress";

const PROPERTY_TYPE_LABELS: Record<InspectionPropertyType, string> = {
  CASA: "Casa",
  DEPARTAMENTO: "Departamento",
  AMPLIACION: "Ampliación",
};

const STATUS_LABELS: Record<InspectionCaseStatus, string> = {
  DRAFT: "Borrador",
  IN_PROGRESS: "En curso",
  CLOSED: "Cerrada",
};

const STATUS_TONE: Record<InspectionCaseStatus, string> = {
  DRAFT: "bg-caution-tint text-caution",
  IN_PROGRESS: "bg-safety-tint text-safety",
  CLOSED: "bg-concrete text-ink-muted",
};

export function InspectionCaseHeader({
  name,
  tipoInmueble,
  direccion,
  estado,
  progress,
}: {
  name: string;
  tipoInmueble: InspectionPropertyType;
  direccion: string | null;
  estado: InspectionCaseStatus;
  // Solo se muestra la barra si `progress` viene con total > 0 — mismo
  // criterio que en la lista: sin checks generados, no hay nada que
  // calcular, así que el caller (page.tsx) pasa null en ese caso.
  progress: ProgressCount | null;
}) {
  return (
    <div className="rounded-2xl p-6 bg-white border border-border">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-xl font-semibold tracking-tight">{name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_TONE[estado]}`}>
              {STATUS_LABELS[estado]}
            </span>
          </div>
          <p className="text-sm text-ink-muted mt-1">{PROPERTY_TYPE_LABELS[tipoInmueble]}</p>
          {direccion && (
            <p className="text-sm text-ink-muted mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {direccion}
            </p>
          )}
        </div>
      </div>

      {progress && (
        <div className="mt-5 pt-5 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono uppercase tracking-wider text-ink-muted">Progreso</p>
            <p className="text-sm font-semibold">
              {progress.percent}% · {progress.answered}/{progress.total} revisados
            </p>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-safety rounded-full" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
