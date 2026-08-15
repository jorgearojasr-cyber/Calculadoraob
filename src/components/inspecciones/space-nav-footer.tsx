import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Mismo patrón de foco que property-type-selector.tsx/QuestionStep.
const FOCUS_RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";

// Anterior/Siguiente respetando el `order` real de los InspectionSpace
// del caso (ver [id]/page.tsx) — nunca nombres de espacio hardcodeados.
//
// Revisión UX Fase 3 (punto B): antes solo mostraba el nombre del espacio
// + una flecha, sin la palabra "Anterior"/"Siguiente" — exigía interpretar
// la flecha. Ahora es un rótulo pequeño (mismo estilo de label que
// WizardHeader: mono, mayúsculas, tracking) encima del nombre — sin
// agrandar el control, solo agregar una línea de contexto (Fase 3.1,
// punto 6).
export function SpaceNavFooter({
  caseId,
  prev,
  next,
}: {
  caseId: string;
  prev: { id: string; name: string } | null;
  next: { id: string; name: string } | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {prev ? (
        <Link
          href={`/inspecciones/${caseId}?space=${prev.id}`}
          className={`min-h-11 flex flex-col items-start justify-center gap-0.5 rounded-xl px-4 py-2 border border-border bg-white hover:border-ink ${FOCUS_RING}`}
        >
          <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint leading-none">Anterior</span>
          <span className="inline-flex items-center gap-1 text-sm font-medium leading-tight">
            <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
            {prev.name}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/inspecciones/${caseId}?space=${next.id}`}
          className={`min-h-11 flex flex-col items-end justify-center gap-0.5 rounded-xl px-4 py-2 text-white bg-action ${FOCUS_RING}`}
        >
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/70 leading-none">Siguiente</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold leading-tight">
            {next.name}
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
          </span>
        </Link>
      ) : (
        <Link
          href={`/inspecciones/${caseId}`}
          className={`min-h-11 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white bg-action ${FOCUS_RING}`}
        >
          Ver resumen
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
