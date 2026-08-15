import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { InspectionCaseStatus, InspectionPropertyType } from "@/generated/prisma/client";

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
};

export function InspectionList({ items }: { items: InspectionListItem[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const displayDate = item.fecha ?? item.createdAt;
        return (
          <Link
            key={item.id}
            href={`/inspecciones/${item.id}`}
            className="block rounded-2xl p-5 bg-white border border-border hover:border-safety/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
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
        );
      })}
    </div>
  );
}
