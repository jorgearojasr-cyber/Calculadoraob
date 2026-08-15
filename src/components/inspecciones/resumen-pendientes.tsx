import Link from "next/link";
import { ArrowRight, CircleDashed } from "lucide-react";
import { TechnicalArticleLink } from "./technical-article-link";

export type ResumenPendiente = {
  id: string;
  spaceId: string;
  spaceName: string;
  elementName: string;
  question: string;
  technicalArticle: { title: string; content: string } | null;
};

// Fase 8, sección 11 — cada pendiente linkea de vuelta al espacio real
// (`?space=<id>`, misma ruta ya usada por InspectionSpaceCard), no a una
// pantalla nueva. Agrupados por espacio para que el link "Ir a revisar"
// no se repita idéntico por cada pregunta suelta.
export function ResumenPendientes({ caseId, pendientes }: { caseId: string; pendientes: ResumenPendiente[] }) {
  if (pendientes.length === 0) return null;

  const bySpace = new Map<string, { spaceId: string; spaceName: string; items: ResumenPendiente[] }>();
  for (const p of pendientes) {
    const group = bySpace.get(p.spaceId) ?? { spaceId: p.spaceId, spaceName: p.spaceName, items: [] };
    group.items.push(p);
    bySpace.set(p.spaceId, group);
  }

  return (
    <div className="rounded-2xl p-6 bg-white border border-border">
      <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3 flex items-center gap-1.5">
        <CircleDashed className="w-3.5 h-3.5" />
        Puntos pendientes ({pendientes.length})
      </p>
      <div className="grid gap-3">
        {Array.from(bySpace.values()).map((group) => (
          <div key={group.spaceId} className="rounded-xl p-3 bg-concrete/40 border border-border">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm font-medium">{group.spaceName}</p>
              <Link
                href={`/inspecciones/${caseId}?space=${group.spaceId}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-safety flex-shrink-0"
              >
                Ir a revisar
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ul className="grid gap-1.5">
              {group.items.map((item) => (
                <li key={item.id} className="text-xs text-ink-muted">
                  <span className="font-medium text-ink">{item.elementName}</span> — {item.question}
                  {item.technicalArticle && (
                    <TechnicalArticleLink title={item.technicalArticle.title} content={item.technicalArticle.content} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
