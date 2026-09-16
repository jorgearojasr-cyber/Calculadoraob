import Link from "next/link";
import type { ComponentType } from "react";
import { ChevronRight } from "lucide-react";
import { ShoppingListToggle } from "./shopping-list-toggle";

// Card de un SavedProject para /proyectos — Design Spec v1.0, sección K.6:
// padding 12px, thumbnail 48×48 radius 10px, card radius 14px, progress
// 5px SOLO cuando existe (progressPercent > 0, dato real y editable por el
// usuario — ver ProgressEditor en la página de detalle; nunca se infiere
// ni se muestra en 0%). Genérico, sin conocimiento de ningún módulo
// puntual — recibe todo ya resuelto por el caller (fecha formateada,
// resumen ya extraído del snapshot persistido).
export function ProjectCard({
  id,
  name,
  categoryName,
  moduleName,
  dateLabel,
  resultSummary,
  progressPercent,
  inShoppingList,
  Icon,
}: {
  id: string;
  name: string;
  categoryName: string;
  moduleName: string;
  dateLabel: string;
  resultSummary: string | null;
  progressPercent: number;
  inShoppingList: boolean;
  Icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={`/proyectos/${id}`}
      className="group block overflow-hidden rounded-ds-card p-3 bg-white border border-ds-border shadow-ds-card-rest hover:shadow-ds-card-elevated hover:border-ds-navy-900/20 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-ds-input flex items-center justify-center bg-ds-navy-100 shrink-0">
          <Icon className="w-6 h-6 text-ds-navy-900" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display font-bold text-[15px] text-ds-navy-900 truncate">{name}</p>
            <ChevronRight className="w-4 h-4 text-ds-text-tertiary shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="font-body text-xs text-ds-text-secondary truncate mt-0.5">
            {categoryName} · {moduleName}
          </p>
          {resultSummary && (
            <p className="font-body text-sm font-semibold text-ds-navy-900 mt-1.5 truncate">{resultSummary}</p>
          )}
          <p className="font-body text-[11px] text-ds-text-tertiary mt-1">{dateLabel}</p>

          {progressPercent > 0 && (
            <div className="mt-2 h-[5px] rounded-full bg-ds-muted overflow-hidden max-w-[200px]">
              <div className="h-full rounded-full bg-ds-orange-600" style={{ width: `${progressPercent}%` }} />
            </div>
          )}

          <div className="mt-2.5">
            <ShoppingListToggle id={id} initialValue={inShoppingList} />
          </div>
        </div>
      </div>
    </Link>
  );
}
