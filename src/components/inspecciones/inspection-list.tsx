import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { InspectionCaseStatus, InspectionPropertyType } from "@/generated/prisma/client";
import { DeleteInspectionButton } from "./delete-inspection-button";

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

// Mismo criterio de tono de badge que el resto de Calculadora: ámbar
// (caution) para "todavía no está terminado", marino (safety) para
// "activo en curso", neutro para "cerrado" — sin introducir tokens
// nuevos.
const STATUS_TONE: Record<InspectionCaseStatus, string> = {
  DRAFT: "bg-caution-tint text-caution",
  IN_PROGRESS: "bg-safety-tint text-safety",
  CLOSED: "bg-concrete text-ink-muted",
};

export type InspectionListItem = {
  id: string;
  name: string;
  tipoInmueble: InspectionPropertyType;
  direccion: string | null;
  fecha: Date | null;
  createdAt: Date;
  estado: InspectionCaseStatus;
  progress: { answered: number; total: number; percent: number } | null;
  // Fase 11K — ver docs/FASE11J..., sección E.
  coverPhotoUrl: string | null;
};

export function InspectionList({ items }: { items: InspectionListItem[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const displayDate = item.fecha ?? item.createdAt;
        return (
          // Fase 11K — ya no es un único <Link> envolvente: el botón de
          // eliminar (acción secundaria, fuera del área de navegación)
          // necesita vivir FUERA del <Link> para no disparar la
          // navegación al hacer click — en vez de stopPropagation sobre
          // un hijo anidado, que es frágil.
          <div key={item.id} className="rounded-2xl bg-white border border-border hover:border-safety/40 transition-colors overflow-hidden">
            <Link href={`/inspecciones/${item.id}`} className="block p-5">
              <div className="flex items-start justify-between gap-4">
                {item.coverPhotoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element -- URL de Vercel Blob, mismo patrón que photo-upload.tsx */
                  <img
                    src={item.coverPhotoUrl}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-border"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-[15px] truncate">{item.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_TONE[item.estado]}`}>
                      {STATUS_LABELS[item.estado]}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5 truncate">
                    {PROPERTY_TYPE_LABELS[item.tipoInmueble]} ·{" "}
                    {displayDate.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  {item.direccion && (
                    <p className="text-xs text-ink-muted mt-1 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {item.direccion}
                    </p>
                  )}
                  {item.progress && item.progress.total > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 max-w-[160px] rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full bg-safety rounded-full"
                          style={{ width: `${item.progress.percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-ink-muted flex-shrink-0">
                        {item.progress.answered}/{item.progress.total}
                      </span>
                    </div>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-ink-faint flex-shrink-0 mt-1" />
              </div>
            </Link>

            {/* Acción secundaria, deliberadamente fuera del área
                clickeable principal (Fase 11K, docs/FASE11J..., sección
                F: "acción secundaria, no botón primario"). */}
            <div className="px-5 pb-3.5 pt-1 border-t border-border flex justify-end">
              <DeleteInspectionButton caseId={item.id} name={item.name} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
