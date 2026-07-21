import { BookCheck, TriangleAlert } from "lucide-react";
import type { NormSummary } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";

/**
 * Aviso normativo reutilizable para el resultado de cualquier módulo.
 * Se alimenta de las normas vinculadas a las variables/fórmulas/factores de
 * pérdida que participaron en el cálculo (ver docs/auditoria-normativa.md).
 * No aparece nada si el módulo no tiene normas vinculadas todavía.
 */
export function NormsDisclaimer({ norms }: { norms: NormSummary[] }) {
  if (norms.length === 0) return null;

  const citadas = norms.filter((n) => n.verificationStatus === "CITADO");
  const noVerificadas = norms.filter((n) => n.verificationStatus === "PRACTICA_GENERAL_NO_VERIFICADA");
  const noVerificadasNotes = Array.from(
    new Set(noVerificadas.map((n) => n.note).filter((note): note is string => !!note))
  );

  return (
    <div className="mt-6 grid gap-3">
      {citadas.length > 0 && (
        <div className="rounded-2xl p-4 bg-white border border-border">
          <div className="flex items-start gap-2.5">
            <BookCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-navy" />
            <div>
              <p className="text-xs font-medium mb-1">Basado en norma técnica</p>
              <ul className="text-xs text-ink-muted grid gap-0.5">
                {citadas.map((norm) => (
                  <li key={norm.id}>
                    {norm.code} — {norm.title}
                    {norm.note && <span className="block text-ink-faint">{norm.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {noVerificadas.length > 0 && (
        <div className="rounded-2xl p-4 bg-safety-tint border border-safety-border">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-safety" />
            <div>
              <p className="text-xs font-medium text-safety mb-1">
                Valores no verificados contra una norma específica
              </p>
              <div className="text-xs text-ink-muted grid gap-1.5">
                {noVerificadasNotes.length === 0 ? (
                  <p>Estos valores representan práctica de obra habitual, no una norma citada.</p>
                ) : (
                  noVerificadasNotes.map((note) => <p key={note}>{note}</p>)
                )}
                <p>
                  Confírmalos con un profesional habilitado antes de usarlos en una obra que requiera
                  aprobación municipal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
