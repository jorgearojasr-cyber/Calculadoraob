import { BookCheck, TriangleAlert } from "lucide-react";
import type { NormSummary } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";
import { CollapsibleHelp } from "./collapsible-help";

/**
 * Aviso normativo reutilizable para el resultado de cualquier módulo.
 * Se alimenta de las normas vinculadas a las variables/fórmulas/factores de
 * pérdida que participaron en el cálculo (ver docs/auditoria-normativa.md).
 * No aparece nada si el módulo no tiene normas vinculadas todavía.
 */
export function NormsDisclaimer({ norms }: { norms: NormSummary[] }) {
  if (norms.length === 0) return null;

  const citadas = norms.filter((n) => n.verificationStatus === "CITADO");
  const noVerificadas = norms.filter(
    (n) => n.verificationStatus === "PRACTICA_GENERAL_NO_VERIFICADA" && !n.reinforcedWarning
  );
  const reforzadas = norms.filter(
    (n) => n.verificationStatus === "PRACTICA_GENERAL_NO_VERIFICADA" && n.reinforcedWarning
  );
  const noVerificadasNotes = Array.from(
    new Set(noVerificadas.map((n) => n.note).filter((note): note is string => !!note))
  );
  const reforzadasNotes = Array.from(
    new Set(reforzadas.map((n) => n.note).filter((note): note is string => !!note))
  );

  return (
    <div className="mt-6 grid gap-3">
      {reforzadas.length > 0 && (
        <div className="rounded-2xl p-4 bg-danger-tint border-2 border-danger">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-danger" strokeWidth={2.5} />
            <CollapsibleHelp
              label="Riesgo estructural o de seguridad — no determina la especificación final"
              ariaLabel="Más detalle sobre este riesgo de seguridad"
              labelClassName="text-danger font-semibold"
            >
              <div className="text-xs text-ink-muted grid gap-1.5">
                {reforzadasNotes.length === 0 ? (
                  <p>Estos valores representan práctica de obra habitual, no una norma citada.</p>
                ) : (
                  reforzadasNotes.map((note) => <p key={note}>{note}</p>)
                )}
                <p className="font-medium text-danger">
                  Esta calculadora no reemplaza el cálculo de un profesional habilitado — confírmalo antes
                  de construir, especialmente si hay riesgo estructural, de gas o eléctrico.
                </p>
              </div>
            </CollapsibleHelp>
          </div>
        </div>
      )}

      {citadas.length > 0 && (
        <div className="rounded-2xl p-4 bg-white border border-border">
          <div className="flex items-start gap-2.5">
            <BookCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-navy" />
            <CollapsibleHelp
              label={`Basado en norma técnica: ${citadas.map((n) => n.code).join(", ")}`}
              ariaLabel="Más detalle sobre las normas técnicas citadas"
            >
              <ul className="text-xs text-ink-muted grid gap-0.5">
                {citadas.map((norm) => (
                  <li key={norm.id}>
                    {norm.code} — {norm.title}
                    {norm.note && <span className="block text-ink-faint">{norm.note}</span>}
                  </li>
                ))}
              </ul>
            </CollapsibleHelp>
          </div>
        </div>
      )}

      {noVerificadas.length > 0 && (
        <div className="rounded-2xl p-4 bg-safety-tint border border-safety-border">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-safety" />
            <CollapsibleHelp
              label="Valores no verificados contra una norma específica"
              ariaLabel="Más detalle sobre estos valores no verificados"
              labelClassName="text-safety"
            >
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
            </CollapsibleHelp>
          </div>
        </div>
      )}
    </div>
  );
}
