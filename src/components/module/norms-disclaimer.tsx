import { BookCheck, TriangleAlert } from "lucide-react";
import type { NormSummary } from "@/app/categorias/[slug]/[moduleSlug]/actions";

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

  return (
    <div className="mt-6 grid gap-3">
      {citadas.length > 0 && (
        <div className="rounded-2xl p-4 bg-white border border-border">
          <div className="flex items-start gap-2.5">
            <BookCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-blueprint" />
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
        <div className="rounded-2xl p-4 bg-[#FDEDE6] border border-[#F3C7B1]">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-safety" />
            <div>
              <p className="text-xs font-medium text-safety mb-1">
                Valores no verificados contra una norma específica
              </p>
              <p className="text-xs text-ink-muted">
                {noVerificadas
                  .map((n) => n.note)
                  .find((note) => !!note) ??
                  "Estos valores representan práctica de obra habitual, no una norma citada."}{" "}
                Confírmalos con un profesional habilitado antes de usarlos en una obra que requiera
                aprobación municipal.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
