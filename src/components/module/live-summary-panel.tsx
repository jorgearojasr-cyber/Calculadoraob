"use client";

import { Pencil } from "lucide-react";

export type SummaryItem = {
  questionKey: string;
  label: string;
  value: string;
  answered: boolean;
};

// Panel de resumen en vivo, genérico para cualquier módulo — nuevo
// estándar de UX (spec "ObraBien Calculadora - Flujo rediseñado",
// 2026-08-01): existe durante TODO el flujo (no solo al final) y cada
// línea respondida se puede editar sin reiniciar el asistente, saltando
// directo al paso donde vive esa pregunta (ver onEditItem, resuelto por
// el caller vía un mapa questionKey -> stepIndex — este componente no
// sabe nada de steps, solo de la lista de items).
//
// Un solo componente para los dos layouts del PDF: en desktop siempre
// visible (columna lateral, `lg:block`), en mobile/tablet es una tarjeta
// plegable (`<details>`, cerrada por defecto salvo que ya haya alguna
// respuesta) — mismo dato, mismo markup interno, sin duplicar la lista.
// Breakpoint deliberadamente distinto al split diagrama/formulario (md,
// ver Fase B responsive 2026-08-02): este panel es contenido SECUNDARIO
// persistente, no la interacción principal del paso — se le da espacio
// recién en lg (1024px) para no competir por ancho con el formulario/
// diagrama a los 768px (probado en vivo, quedaba apretado).
function SummaryList({ items, onEditItem }: { items: SummaryItem[]; onEditItem: (questionKey: string) => void }) {
  return (
    <dl className="grid gap-0.5">
      {items.map((item) => (
        <div
          key={item.questionKey}
          className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0"
        >
          <div className="min-w-0">
            <dt className="text-xs text-ink-faint">{item.label}</dt>
            <dd className={`text-sm font-medium truncate ${item.answered ? "text-ink" : "text-ink-faint"}`}>
              {item.answered ? item.value : "Pendiente"}
            </dd>
          </div>
          {item.answered && (
            <button
              type="button"
              onClick={() => onEditItem(item.questionKey)}
              className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium text-safety hover:underline"
            >
              <Pencil className="w-3 h-3" />
              Cambiar
            </button>
          )}
        </div>
      ))}
    </dl>
  );
}

export function LiveSummaryPanel({
  items,
  onEditItem,
  title = "Tu proyecto",
}: {
  items: SummaryItem[];
  onEditItem: (questionKey: string) => void;
  title?: string;
}) {
  const answeredCount = items.filter((i) => i.answered).length;
  const countLabel = `${answeredCount} de ${items.length} respondidas`;

  return (
    <>
      {/* Desktop: columna lateral siempre abierta */}
      <div className="hidden lg:block rounded-2xl border border-border bg-concrete p-5">
        <div className="flex items-center justify-between mb-3 gap-3">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">{title}</p>
          <p className="font-mono text-[11px] text-ink-faint flex-shrink-0">{countLabel}</p>
        </div>
        <SummaryList items={items} onEditItem={onEditItem} />
      </div>

      {/* Mobile: tarjeta plegable */}
      <details className="lg:hidden rounded-2xl border border-border bg-concrete open:pb-1" open={answeredCount > 0}>
        <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none">
          <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">{title}</span>
          <span className="font-mono text-[11px] text-ink-faint">{countLabel}</span>
        </summary>
        <div className="px-5 pb-4">
          <SummaryList items={items} onEditItem={onEditItem} />
        </div>
      </details>
    </>
  );
}
