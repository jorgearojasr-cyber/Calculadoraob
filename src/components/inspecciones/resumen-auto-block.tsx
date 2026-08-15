"use client";

import { useState, useTransition } from "react";
import { Lightbulb } from "lucide-react";
import { generateInspectionSummaryAction } from "@/app/(app)/inspecciones/[id]/redaccion-actions";

const FOCUS_RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";

// Fase 10B (corrección), Función 2 — bajo demanda (nunca se llama al
// abrir la página). Composición 100% local a partir de
// `InspectionReportData` (Fase 9B) — sin ningún servicio externo, ver
// src/lib/inspecciones-redaccion.ts. No persiste nada: `InspectionCase`
// no gana ningún campo nuevo — el resumen vive solo en el estado de
// este componente hasta que la pestaña se cierra.
//
// `summary`/`keyFindings` son la única fuente de "qué se muestra" — una
// vez que existe un resumen, una regeneración fallida NUNCA lo borra
// ("si falla la segunda llamada, mantener visible la propuesta
// anterior si existe"); `error` es un mensaje que convive al lado del
// resumen anterior, no lo reemplaza.
export function ResumenAutoBlock({ caseId }: { caseId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [keyFindings, setKeyFindings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasSummary = summary !== null;

  const generate = () => {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const result = await generateInspectionSummaryAction(caseId);
      if (!result.summary) {
        setError(result.error ?? "No fue posible generar un resumen.");
        return;
      }
      setSummary(result.summary);
      setKeyFindings(result.keyFindings);
    });
  };

  const handleCopy = async () => {
    if (!summary) return;
    const text = keyFindings.length > 0 ? `${summary}\n\n${keyFindings.map((f) => `· ${f}`).join("\n")}` : summary;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Portapapeles no disponible (ej. contexto no seguro) — el texto
      // ya está en pantalla y es seleccionable a mano, no es bloqueante.
    }
  };

  return (
    <div className="rounded-2xl p-6 bg-white border border-safety-border">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-mono uppercase tracking-wider text-safety flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5" />
          Resumen automático de la inspección
        </p>
        {!hasSummary && (
          <button
            type="button"
            onClick={generate}
            disabled={isPending}
            className={`min-h-11 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white bg-safety disabled:opacity-50 ${FOCUS_RING}`}
          >
            {isPending ? "Generando…" : "Generar resumen"}
          </button>
        )}
      </div>

      {!hasSummary && isPending && <p className="mt-3 text-sm text-ink-muted">Generando resumen de la inspección…</p>}

      {!hasSummary && !isPending && error && (
        <div className="mt-3 grid gap-2">
          <p className="text-sm text-ink-muted">{error} Puedes seguir usando el resumen normalmente sin este texto.</p>
          <button type="button" onClick={generate} className={`min-h-11 inline-flex items-center px-1 -mx-1 text-sm font-medium text-safety w-fit ${FOCUS_RING}`}>
            Reintentar
          </button>
        </div>
      )}

      {hasSummary && (
        <div className="mt-3 grid gap-3">
          <p className="text-sm text-ink whitespace-pre-wrap">{summary}</p>
          {keyFindings.length > 0 && (
            <ul className="grid gap-1 pl-4 list-disc text-sm text-ink">
              {keyFindings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
          {error && <p className="text-xs text-ink-muted">No se pudo regenerar: {error} Se mantiene el resumen anterior.</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <button type="button" onClick={handleCopy} className={`min-h-11 inline-flex items-center px-2 -mx-2 text-sm font-medium text-safety ${FOCUS_RING}`}>
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={isPending}
              className={`min-h-11 inline-flex items-center px-2 -mx-2 text-sm font-medium text-ink-muted hover:text-ink disabled:opacity-50 ${FOCUS_RING}`}
            >
              {isPending ? "Regenerando…" : "Regenerar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSummary(null);
                setKeyFindings([]);
                setError(null);
              }}
              className={`min-h-11 inline-flex items-center px-2 -mx-2 text-sm font-medium text-ink-muted hover:text-ink ${FOCUS_RING}`}
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
