import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProgressCount } from "@/lib/inspecciones/progress";
import type { ResultadoGlobal } from "./resumen-resultado-global";

// Fase 8, sección 6 — mismo patrón visual de barra que
// InspectionSpaceCard, pero con el desglose de conteos por estado (esa
// tarjeta original solo trae % — acá se pidió explícitamente "5 OK / 1
// Observación / ..." por espacio). No hardcodea nombres ni asume una
// cantidad fija de checks: `resultado.total` viene calculado del espacio
// real.
export function ResumenEspacioCard({
  caseId,
  spaceId,
  name,
  progress,
  resultado,
}: {
  caseId: string;
  spaceId: string;
  name: string;
  progress: ProgressCount;
  resultado: ResultadoGlobal;
}) {
  return (
    <div className="rounded-2xl p-5 bg-white border border-border">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-[15px]">{name}</p>
        <Link
          href={`/inspecciones/${caseId}?space=${spaceId}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-safety flex-shrink-0"
        >
          Revisar
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="h-1.5 flex-1 max-w-[140px] rounded-full bg-border overflow-hidden mr-3">
          <div className="h-full bg-safety rounded-full" style={{ width: `${progress.percent}%` }} />
        </div>
        <span className="font-display text-sm font-semibold flex-shrink-0">{progress.percent}%</span>
      </div>
      <p className="text-xs text-ink-muted mt-1">
        {progress.answered} / {progress.total} revisados
      </p>

      <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        {resultado.ok > 0 && <span>{resultado.ok} OK</span>}
        {resultado.observation > 0 && <span className="text-[#8A620D] font-medium">{resultado.observation} Observación</span>}
        {resultado.notApplicable > 0 && <span>{resultado.notApplicable} No aplica</span>}
        {resultado.pending > 0 && <span>{resultado.pending} pendiente{resultado.pending > 1 ? "s" : ""}</span>}
      </div>
    </div>
  );
}
