import { CollapsibleHelp } from "./collapsible-help";
import type { CalculationResult } from "@/lib/formula-engine";

// Fase 5 (Radier) — consolida las notas técnicas (fórmula, dosificación,
// fuente citada) de varios resultados en UN solo colapsable, en vez de
// repetirlas debajo de cada tarjeta de material (ver PricedResults'
// `suppressNoteForKeys`, que oculta esas mismas notas de su lugar
// original para que no queden duplicadas). Genérico — cualquier módulo
// que quiera el mismo patrón ("varias tarjetas simples arriba + un
// detalle técnico opcional abajo") pasa su propia lista de resultados.
export function TechnicalNotesSection({
  results,
  label = "¿Cómo calculamos estas cantidades?",
}: {
  results: CalculationResult[];
  label?: string;
}) {
  const items = results.filter((r) => r.note);
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl p-5 mb-3 bg-white border border-border">
      <CollapsibleHelp label={label} ariaLabel={label}>
        <div className="grid gap-2">
          {items.map((r) => (
            <p key={r.key} className="text-xs text-ink-muted">
              <span className="font-medium">{r.label}:</span> {r.note}
            </p>
          ))}
        </div>
      </CollapsibleHelp>
    </div>
  );
}
