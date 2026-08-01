"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleDocumentCheckAction } from "@/app/(app)/regularizacion/[id]/actions";
import { STALE_SESSION_ERROR, STALE_SESSION_MESSAGE } from "@/lib/stale-session";
import type { RegularizationDocumentItem } from "@/lib/regularization-documents";

// Adaptación de ShoppingListView (src/components/shopping-list/) — mismo
// patrón de checkbox optimista + useTransition + rollback en sesión
// caducada. Cambia: materialName -> documento, quantity/unit/cost
// desaparecen (no aplican a un documento), sourceProjectNames ->
// paraQueSirve + dondeSeObtiene, se agrega category como agrupador y un
// badge "Opcional" para obligatorio:false. Documentos con dependeDe falso
// ya vienen excluidos de `items` (filtrados en getVisibleDocumentChecklist,
// servidor) — esta vista nunca los ve, no hay que ocultarlos acá.
const CATEGORY_LABELS: Record<string, string> = {
  MUNICIPAL: "Municipal",
  DOM: "Dirección de Obras (DOM)",
  ARQUITECTO: "Arquitecto / profesional",
  NOTARIA_REGISTRO: "Notaría / Conservador de Bienes Raíces",
};
const CATEGORY_ORDER = ["MUNICIPAL", "DOM", "ARQUITECTO", "NOTARIA_REGISTRO"];

export function RegularizationDocumentChecklistView({
  caseId,
  documents,
}: {
  caseId: string;
  documents: RegularizationDocumentItem[];
}) {
  const [items, setItems] = useState(documents);
  const [, startTransition] = useTransition();
  const [sessionError, setSessionError] = useState<string | null>(null);

  const handleToggle = (doc: RegularizationDocumentItem) => {
    const next = !doc.checked;
    setItems((prev) => prev.map((d) => (d.id === doc.id ? { ...d, checked: next } : d)));
    startTransition(async () => {
      const result = await toggleDocumentCheckAction(caseId, doc.id, next);
      if (result.error) {
        setItems((prev) => prev.map((d) => (d.id === doc.id ? { ...d, checked: !next } : d)));
        if (result.error === STALE_SESSION_ERROR) setSessionError(STALE_SESSION_MESSAGE);
      }
    });
  };

  // Progreso: solo documentos obligatorios, y solo entre los visibles
  // (los ya filtrados por dependeDe en el servidor) — un documento
  // opcional o excluido por condición no cuenta en el denominador.
  const requiredItems = items.filter((d) => d.obligatorio);
  const requiredDone = requiredItems.filter((d) => d.checked).length;

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    docs: items.filter((d) => d.category === category),
  })).filter((g) => g.docs.length > 0);

  return (
    <div>
      {sessionError && (
        <div className="rounded-2xl p-4 mb-4 bg-safety-tint border border-safety/30 text-sm text-safety">
          {sessionError}{" "}
          <Link href={`/login?callbackUrl=%2Fregularizacion%2F${caseId}`} className="font-semibold underline">
            Iniciar sesión
          </Link>
        </div>
      )}

      <p className="text-xs text-ink-muted mb-4">
        {requiredDone} de {requiredItems.length} documentos obligatorios reunidos
      </p>

      <div className="grid gap-6">
        {grouped.map((group) => (
          <div key={group.category}>
            <h3 className="font-display text-sm font-semibold tracking-tight mb-3 text-ink-muted uppercase">
              {CATEGORY_LABELS[group.category] ?? group.category}
            </h3>
            <div className="grid gap-3">
              {group.docs.map((doc) => (
                <div
                  key={doc.id}
                  className={`rounded-2xl p-5 border transition-colors ${
                    doc.checked ? "bg-concrete border-border" : "bg-white border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={doc.checked}
                      onChange={() => handleToggle(doc)}
                      className="mt-1 w-4 h-4 flex-shrink-0"
                      aria-label={`Reunido: ${doc.documento}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-[15px] ${doc.checked ? "line-through text-ink-muted" : ""}`}>
                          {doc.documento}
                        </span>
                        {!doc.obligatorio && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-safety-tint text-safety">
                            Opcional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted mt-1">{doc.paraQueSirve}</p>
                      <p className="text-xs text-ink-muted mt-1">Dónde se obtiene: {doc.dondeSeObtiene}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
