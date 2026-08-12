"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleDocumentCheckAction } from "@/app/(app)/regularizacion/[id]/actions";
import { STALE_SESSION_ERROR, STALE_SESSION_MESSAGE } from "@/lib/stale-session";
import {
  describeDocumentOrigen,
  describeSemaforo,
  isAvaluoFiscalDocumento,
  SII_AVALUO_FISCAL_URL,
  type RegularizationDocumentItem,
} from "@/lib/regularization-document-labels";

// Adaptación de ShoppingListView (src/components/shopping-list/) — mismo
// patrón de checkbox optimista + useTransition + rollback en sesión
// caducada. Cambia: materialName -> documento, quantity/unit/cost
// desaparecen (no aplican a un documento), sourceProjectNames ->
// paraQueSirve + dondeSeObtiene, se agrega category como agrupador y una
// etiqueta combinada "Obligatoriedad · origen" (Fase 2, modelo de tres
// ejes). Documentos con dependeDe falso o momento:posterior ya vienen
// excluidos de `items` (filtrados en getVisibleDocumentChecklist,
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

  // Progreso: solo documentos obligatoriedad:minimo, y solo entre los
  // visibles (los ya filtrados por dependeDe/momento en el servidor) —
  // un documento condicional o excluido por condición no cuenta en el
  // denominador (mismo criterio que el "avance del expediente" del
  // informe, ver diseño sección 8).
  const requiredItems = items.filter((d) => d.obligatoriedad === "MINIMO");
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

      {/* Fase 16B — leyenda del semáforo: presentación pura, ver
          describeSemaforo en regularization-document-labels.ts. No agrega
          ni quita categorías normativas, solo explica los 3 colores ya
          derivados de obligatoriedad + tieneCondicionAutomatica. */}
      <div className="rounded-2xl border border-border bg-concrete p-4 mb-5 grid gap-1.5 text-xs text-ink-muted">
        <p className="font-semibold text-ink mb-0.5">Qué significa cada color</p>
        <p>🔴 <span className="font-medium text-ink">Obligatorio</span> — se pide siempre para este trámite.</p>
        <p>🟠 <span className="font-medium text-ink">Sí corresponde</span> — según tus respuestas, aplica a tu caso.</p>
        <p>
          ⚪ <span className="font-medium text-ink">Condicional · revisar</span> — puede o no aplicarte; ObraBien
          todavía no puede determinarlo automáticamente.
        </p>
        <p>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Pendiente de validación normativa</span>{" "}
          — sin cita directa a la fuente oficial todavía; no significa que no se requiera.
        </p>
      </div>

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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium text-[15px] ${doc.checked ? "line-through text-ink-muted" : ""}`}>
                          {doc.documento}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                        {(() => {
                          const semaforo = describeSemaforo(doc);
                          return (
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${semaforo.colorClass}`}
                              title={semaforo.description}
                            >
                              {semaforo.emoji} {semaforo.label}
                            </span>
                          );
                        })()}
                        {doc.estadoValidacion === "PENDIENTE_VALIDACION_PROFESIONAL" && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Pendiente de validación normativa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted mt-1.5">{describeDocumentOrigen(doc.origen)}</p>
                      <p
                        className={`text-xs mt-1 ${
                          doc.estadoValidacion === "PENDIENTE_VALIDACION_PROFESIONAL" ? "text-amber-700" : "text-ink-muted"
                        }`}
                      >
                        {doc.paraQueSirve}
                      </p>
                      <p className="text-xs text-ink-muted mt-1">
                        Dónde se obtiene: {doc.dondeSeObtiene}
                        {isAvaluoFiscalDocumento(doc.documento) && (
                          <>
                            {" "}
                            ·{" "}
                            <a
                              href={SII_AVALUO_FISCAL_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-safety underline font-medium"
                            >
                              Ir a sii.cl
                            </a>
                          </>
                        )}
                      </p>
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
