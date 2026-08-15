"use client";

import { useState, useTransition } from "react";
import { Camera, Check, ChevronDown, ChevronUp, History, Lightbulb, Pencil, Plus, TriangleAlert, Trash2, X } from "lucide-react";
import {
  createObservationAction,
  deleteObservationAction,
  updateInspectionChecklistCheckAction,
  updateObservationAction,
  type ObservationDTO,
} from "@/app/(app)/inspecciones/[id]/actions";
import { suggestObservationCommentAction } from "@/app/(app)/inspecciones/[id]/redaccion-actions";
import { PhotoUpload } from "./photo-upload";
import { TechnicalArticleLink } from "./technical-article-link";
import type { InspectionAnswerStatus, InspectionSeverity } from "@/generated/prisma/client";

const SEVERITY_LABELS: Record<InspectionSeverity, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

// Mismo patrón de foco que property-type-selector.tsx/QuestionStep — no
// se inventa un estilo nuevo (Fase 3.1, punto 4).
const FOCUS_RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";

// Revisión UX Fase 3 (punto G): `text-caution` (#D9A21B) sobre
// `bg-caution-tint` mide 2.05:1 de contraste — bajo el mínimo WCAG AA
// (4.5:1) para texto normal. Es un token global reutilizado en todo
// Calculadora (ej. DosificacionCard), así que NO se toca
// tailwind.config.ts — se define acá, LOCAL a Inspecciones, un ámbar más
// oscuro solo para el texto sobre `bg-caution-tint` en el contexto
// "Observación" (pastilla, botón, severidad baja/media). Mismo matiz
// (familia ámbar/advertencia), mismo ícono, mismo significado — 4.88:1
// contra el mismo fondo (medido con la misma fórmula de luminancia
// relativa que usó la auditoría).
const OBSERVATION_TEXT = "text-[#8A620D]";

// LOW/MEDIUM en ámbar (mismo tono que "observación" en general), HIGH/
// CRITICAL en rojo — reutiliza los 2 tokens semánticos ya usados en todo
// Calculadora para "atención"/"riesgo", sin inventar una tercera escala.
// LOW/MEDIUM usa OBSERVATION_TEXT (ver arriba) por el mismo motivo de
// contraste — danger/danger-tint ya mide 5.0:1, no necesita ajuste.
const SEVERITY_TONE: Record<InspectionSeverity, string> = {
  LOW: `bg-caution-tint ${OBSERVATION_TEXT}`,
  MEDIUM: `bg-caution-tint ${OBSERVATION_TEXT}`,
  HIGH: "bg-danger-tint text-danger",
  CRITICAL: "bg-danger-tint text-danger",
};

// Muestra `questionSnapshot` (NUNCA el texto actual del catálogo) —
// estabilidad histórica diseñada en Fase 1: aunque el admin edite la
// pregunta del catálogo después, este check sigue mostrando exactamente
// lo que se preguntó cuando se generó la inspección.
export function ChecklistItemRow({
  caseId,
  checkId,
  questionSnapshot,
  initialStatus,
  initialObservations,
  technicalArticle,
}: {
  caseId: string;
  checkId: string;
  questionSnapshot: string;
  initialStatus: InspectionAnswerStatus | null;
  initialObservations: ObservationDTO[];
  technicalArticle: { title: string; content: string } | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [observations, setObservations] = useState(initialObservations);
  // Pendiente (sin responder) siempre muestra los 3 botones; ya respondido
  // arranca colapsado en la pastilla de estado — tocarla vuelve a mostrar
  // los 3 botones para poder cambiar la respuesta (Fase 3, punto 8).
  const [editingStatus, setEditingStatus] = useState(initialStatus === null);
  const [showAddForm, setShowAddForm] = useState(false);
  // Fase 7B, Corrección 2 — true SOLO mientras se está creando el primer
  // hallazgo de un check que todavía no tiene ninguno (el caso que antes
  // persistía `status: OBSERVATION` apenas se tocaba el botón, incluso si
  // el usuario cancelaba sin guardar nada). Mientras esto es true, el
  // estado del check NO se ha tocado en el servidor todavía — recién se
  // persiste a OBSERVATION cuando el hallazgo se guarda con éxito
  // (`onSaved` más abajo). "Cancelar" acá nunca necesita revertir nada en
  // el servidor porque nunca se llegó a escribir.
  const [creatingObservation, setCreatingObservation] = useState(false);
  const [historicalOpen, setHistoricalOpen] = useState(false);
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStatusPending, startStatusTransition] = useTransition();

  const handleSelectStatus = (next: InspectionAnswerStatus) => {
    setError(null);
    setCreatingObservation(false);
    startStatusTransition(async () => {
      const result = await updateInspectionChecklistCheckAction(checkId, next);
      if (!result.status) {
        setError(result.error ?? "No se pudo guardar.");
        return;
      }
      setStatus(result.status);
      setEditingStatus(false);
    });
  };

  // Botón "Observación" del selector de 3 estados — separado de
  // `handleSelectStatus` (Fase 7B, Corrección 2): si el check todavía no
  // tiene NINGÚN hallazgo, no hay nada que mostrar como "Observación"
  // todavía, así que no se persiste nada — solo se abre el formulario en
  // modo local. Si ya tiene hallazgos (vigentes de antes, o históricos de
  // un ciclo OBSERVACIÓN -> OK/No aplica anterior), reactivarlos como
  // vigentes SÍ es una respuesta real y se persiste de inmediato, igual
  // que OK/No aplica.
  const handleClickObservacion = () => {
    if (observations.length === 0) {
      setError(null);
      setCreatingObservation(true);
      setEditingStatus(false);
    } else {
      handleSelectStatus("OBSERVATION");
    }
  };

  // Vigente = el check está actualmente en OBSERVACIÓN; ahí se muestran
  // TODOS sus hallazgos como el estado actual. Si el check volvió a OK o
  // No aplica, esos mismos hallazgos pasan a "históricos" (Fase 7B,
  // Corrección 1) — ya no se presentan como si fueran del estado actual,
  // pero siguen consultables (no se borra nada: observation, foto,
  // comentario, severidad y timestamps quedan intactos).
  const showLiveObservationsBlock = status === "OBSERVATION";
  const showHistoricalNote = status !== "OBSERVATION" && !creatingObservation && observations.length > 0;

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm flex-1 min-w-[180px]">{questionSnapshot}</p>
        {status !== null && !editingStatus && (
          <StatusPill status={status} onClick={() => setEditingStatus(true)} />
        )}
      </div>

      {/* Piloto Fase 5B — solo aparece en las preguntas que ya tienen un
          TechnicalArticle vinculado (5 de momento); el resto del
          catálogo no muestra nada acá, sin romper nada. */}
      {technicalArticle && <TechnicalArticleLink title={technicalArticle.title} content={technicalArticle.content} />}

      {(status === null || editingStatus) && (
        <div className="mt-2.5 flex gap-2 flex-wrap">
          <StatusButton
            label="OK"
            icon={Check}
            tone="bg-success-tint text-success border-success-border"
            selected={status === "OK"}
            disabled={isStatusPending}
            onClick={() => handleSelectStatus("OK")}
          />
          <StatusButton
            label="Observación"
            icon={TriangleAlert}
            tone={`bg-caution-tint ${OBSERVATION_TEXT} border-caution-border`}
            selected={status === "OBSERVATION" || creatingObservation}
            disabled={isStatusPending}
            onClick={handleClickObservacion}
          />
          <StatusButton
            label="No aplica"
            icon={X}
            tone="bg-concrete text-ink-muted border-border"
            selected={status === "NOT_APPLICABLE"}
            disabled={isStatusPending}
            onClick={() => handleSelectStatus("NOT_APPLICABLE")}
          />
        </div>
      )}

      {error && <p className="mt-2 text-xs text-safety">{error}</p>}

      {/* Fase 7B, Corrección 2 — formulario del PRIMER hallazgo de un
          check que todavía no tiene ninguno. Nada se persiste hasta que
          se guarda con éxito: "Cancelar" simplemente cierra esto, sin
          tocar el servidor, así que el check queda exactamente en el
          estado que tenía antes (OK / No aplica / pendiente). */}
      {creatingObservation && (
        <div className="mt-3 rounded-xl p-3 bg-caution-tint/50 border border-caution-border grid gap-2">
          <ObservationForm
            checkId={checkId}
            initial={null}
            onSaved={(created) => {
              setObservations((prev) => [...prev, created]);
              setCreatingObservation(false);
              // Recién ahora hay un hallazgo real que respalda el estado
              // "Observación" — se persiste junto con la creación, nunca
              // antes (ver Corrección 2: "no debe persistirse un estado
              // Observación solamente por abrir el formulario").
              if (status !== "OBSERVATION") {
                startStatusTransition(async () => {
                  const result = await updateInspectionChecklistCheckAction(checkId, "OBSERVATION");
                  if (result.status) setStatus(result.status);
                });
              }
            }}
            onCancel={() => setCreatingObservation(false)}
          />
        </div>
      )}

      {/* Fase 7B, Corrección 1 — hallazgos de un ciclo Observación
          anterior, con el check ya de vuelta en OK/No aplica. No se
          presentan como si fueran del estado actual (nada se borra:
          observation, foto, comentario, severidad y timestamps quedan
          intactos), pero siguen consultables acá, colapsados por
          defecto. */}
      {showHistoricalNote && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setHistoricalOpen((v) => !v)}
            aria-expanded={historicalOpen}
            className={`min-h-11 inline-flex items-center gap-1.5 px-1 text-xs font-medium text-ink-muted ${FOCUS_RING}`}
          >
            <History className="w-3.5 h-3.5 flex-shrink-0" />
            {observations.length} hallazgo{observations.length > 1 ? "s" : ""} anterior{observations.length > 1 ? "es" : ""} — ya no vigente
            {historicalOpen ? <ChevronUp className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />}
          </button>
          {historicalOpen && (
            <div className="mt-2 rounded-xl p-3 bg-concrete/50 border border-border grid gap-2">
              {observations.map((obs) =>
                editingObservationId === obs.id ? (
                  <ObservationForm
                    key={obs.id}
                    checkId={checkId}
                    initial={obs}
                    onSaved={(updated) => {
                      setObservations((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                      setEditingObservationId(null);
                    }}
                    onCancel={() => setEditingObservationId(null)}
                  />
                ) : (
                  <ObservationRow
                    key={obs.id}
                    caseId={caseId}
                    observation={obs}
                    onEdit={() => setEditingObservationId(obs.id)}
                    onDelete={() => setObservations((prev) => prev.filter((o) => o.id !== obs.id))}
                  />
                )
              )}
            </div>
          )}
        </div>
      )}

      {showLiveObservationsBlock && (
        <div className="mt-3 rounded-xl p-3 bg-caution-tint/50 border border-caution-border grid gap-2">
          {observations.map((obs) =>
            editingObservationId === obs.id ? (
              <ObservationForm
                key={obs.id}
                checkId={checkId}
                initial={obs}
                onSaved={(updated) => {
                  setObservations((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                  setEditingObservationId(null);
                }}
                onCancel={() => setEditingObservationId(null)}
              />
            ) : (
              <ObservationRow
                key={obs.id}
                caseId={caseId}
                observation={obs}
                onEdit={() => setEditingObservationId(obs.id)}
                onDelete={() => setObservations((prev) => prev.filter((o) => o.id !== obs.id))}
              />
            )
          )}

          {showAddForm ? (
            <ObservationForm
              checkId={checkId}
              initial={null}
              onSaved={(created) => {
                setObservations((prev) => [...prev, created]);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className={`inline-flex items-center gap-1.5 min-h-11 px-1 text-sm font-medium ${OBSERVATION_TEXT} w-fit ${FOCUS_RING}`}
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar otro hallazgo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status, onClick }: { status: InspectionAnswerStatus; onClick: () => void }) {
  if (status === "OK") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 min-h-11 px-3 py-1.5 rounded-full text-sm font-medium bg-success-tint text-success flex-shrink-0 ${FOCUS_RING}`}
      >
        <Check className="w-3.5 h-3.5" />
        OK
      </button>
    );
  }
  if (status === "OBSERVATION") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 min-h-11 px-3 py-1.5 rounded-full text-sm font-medium bg-caution-tint ${OBSERVATION_TEXT} flex-shrink-0 ${FOCUS_RING}`}
      >
        <TriangleAlert className="w-3.5 h-3.5" />
        Observación
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 min-h-11 px-3 py-1.5 rounded-full text-sm font-medium bg-concrete text-ink-muted flex-shrink-0 ${FOCUS_RING}`}
    >
      — No aplica
    </button>
  );
}

function StatusButton({
  label,
  icon: Icon,
  tone,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof Check;
  tone: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      // min-h-11 (~44px) — objetivo táctil cómodo para uso en terreno
      // desde el celular (Fase 3, punto 16).
      className={`flex-1 min-w-[100px] min-h-11 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS_RING} ${
        selected ? tone : "bg-white text-ink-muted border-border hover:border-ink"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function ObservationRow({
  caseId,
  observation,
  onEdit,
  onDelete,
}: {
  caseId: string;
  observation: ObservationDTO;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteObservationAction(observation.id);
      if (!result.success) {
        setError(result.error ?? "No se pudo eliminar.");
        return;
      }
      onDelete();
    });
  };

  return (
    <div className="rounded-lg p-3 bg-white border border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium mb-1 ${SEVERITY_TONE[observation.severity]}`}>
            {SEVERITY_LABELS[observation.severity]}
          </span>
          <p className="text-sm">{observation.comment}</p>
          {observation.recommendation && (
            <p className="text-xs text-ink-muted mt-1">Recomendación: {observation.recommendation}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar hallazgo"
            className={`w-11 h-11 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-concrete ${FOCUS_RING}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Eliminar hallazgo"
            className={`w-11 h-11 rounded-full flex items-center justify-center text-ink-muted hover:text-safety hover:bg-concrete disabled:opacity-50 ${FOCUS_RING}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Fotografías del hallazgo (Fase 4, punto 1) — asociadas SOLO a
          esta observación, no al check ni al elemento (ver
          PhotoUploadContext, "exactamente un nivel por foto"). */}
      <div className="mt-2.5 pt-2.5 border-t border-border">
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint mb-2 flex items-center gap-1">
          <Camera className="w-3 h-3" />
          Fotografías
        </p>
        <PhotoUpload
          caseId={caseId}
          context={{ level: "observation", observationId: observation.id }}
          initialPhotos={observation.photos}
          compact
        />
      </div>

      {error && <p className="mt-1 text-xs text-safety">{error}</p>}
    </div>
  );
}

function ObservationForm({
  checkId,
  initial,
  onSaved,
  onCancel,
}: {
  checkId: string;
  initial: ObservationDTO | null;
  onSaved: (observation: ObservationDTO) => void;
  onCancel: () => void;
}) {
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [severity, setSeverity] = useState<InspectionSeverity>(initial?.severity ?? "MEDIUM");
  const [recommendation, setRecommendation] = useState(initial?.recommendation ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fase 10B (corrección) — "Sugerir redacción" (Función 1), 100% local:
  // base de conocimiento (TechnicalArticle) + reglas/plantillas, sin
  // ningún servicio externo (ver src/lib/inspecciones-redaccion.ts). El
  // motor nunca escribe `comment` directamente, solo propone
  // (`suggestion`); el textarea de arriba sigue siendo la única fuente
  // de verdad hasta que el inspector pulsa "Aceptar".
  const [suggestionState, setSuggestionState] = useState<"idle" | "loading" | "proposed" | "error">("idle");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isSuggestionPending, startSuggestionTransition] = useTransition();

  const handleSuggestRedaction = () => {
    if (!comment.trim()) return;
    setSuggestionState("loading");
    setSuggestionError(null);
    startSuggestionTransition(async () => {
      const result = await suggestObservationCommentAction(checkId, comment);
      if (!result.suggestedComment) {
        setSuggestionError(result.error ?? "No fue posible generar una propuesta.");
        setSuggestionState("error");
        return;
      }
      setSuggestion(result.suggestedComment);
      setSuggestionState("proposed");
    });
  };

  const handleAcceptSuggestion = () => {
    if (suggestion) setComment(suggestion);
    setSuggestionState("idle");
    setSuggestion(null);
  };

  const handleDiscardSuggestion = () => {
    setSuggestionState("idle");
    setSuggestion(null);
    setSuggestionError(null);
  };

  const handleSubmit = () => {
    if (!comment.trim()) {
      setError("Describe el hallazgo.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = initial
        ? await updateObservationAction(initial.id, {
            comment,
            severity,
            recommendation: recommendation || null,
            status: initial.status,
          })
        : await createObservationAction(checkId, { comment, severity, recommendation: recommendation || null });
      if (!result.observation) {
        setError(result.error ?? "No se pudo guardar.");
        return;
      }
      onSaved(result.observation);
    });
  };

  return (
    <div className="rounded-lg p-3 bg-white border border-caution-border grid gap-2.5">
      <label className="grid gap-1">
        <span className="text-xs font-medium text-ink-muted">Hallazgo</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Ej. Fisura vertical junto a la ventana"
          className="rounded-lg px-3 py-2 text-sm bg-white border border-border outline-none focus:border-ink resize-none"
        />
      </label>

      {/* Fase 10B (corrección) — botón bajo demanda, nunca automático.
          Base de conocimiento local (TechnicalArticle) + reglas, sin
          ningún servicio externo — ver src/lib/inspecciones-redaccion.ts. */}
      <div>
        <button
          type="button"
          onClick={handleSuggestRedaction}
          disabled={!comment.trim() || isSuggestionPending}
          className={`min-h-11 inline-flex items-center gap-1.5 px-1 text-sm font-medium text-safety disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING}`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          {suggestionState === "loading" ? "Redactando…" : "Sugerir redacción"}
        </button>

        {suggestionState === "proposed" && suggestion && (
          <div className="mt-1.5 rounded-lg p-3 bg-safety-tint border border-safety-border grid gap-2">
            <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Sugerencia de redacción</p>
            <p className="text-sm text-ink">{suggestion}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAcceptSuggestion}
                className={`min-h-11 inline-flex items-center px-2 -mx-2 text-sm font-semibold text-safety ${FOCUS_RING}`}
              >
                Aceptar
              </button>
              <button
                type="button"
                onClick={handleDiscardSuggestion}
                className={`min-h-11 inline-flex items-center px-2 -mx-2 text-sm font-medium text-ink-muted hover:text-ink ${FOCUS_RING}`}
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {suggestionState === "error" && (
          <p className="mt-1.5 text-xs text-ink-muted">{suggestionError} Puedes continuar escribiendo manualmente.</p>
        )}
      </div>

      <label className="grid gap-1">
        <span className="text-xs font-medium text-ink-muted">Severidad</span>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as InspectionSeverity)}
          className={`min-h-11 rounded-lg px-3 py-2 text-sm bg-white border border-border outline-none focus:border-ink ${FOCUS_RING}`}
        >
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
          <option value="CRITICAL">Crítica</option>
        </select>
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-medium text-ink-muted">Recomendación (opcional)</span>
        <textarea
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          rows={2}
          className="rounded-lg px-3 py-2 text-sm bg-white border border-border outline-none focus:border-ink resize-none"
        />
      </label>
      {error && <p className="text-xs text-safety">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className={`min-h-11 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white bg-action disabled:opacity-50 ${FOCUS_RING}`}
        >
          {isPending ? "Guardando…" : "Guardar hallazgo"}
        </button>
        {/* Conserva el aspecto de enlace (sin fondo/borde) pero con área
            táctil de 44px vía padding — el texto no crece, solo el
            espacio interactivo alrededor (Fase 3.1, punto 2). */}
        <button
          type="button"
          onClick={onCancel}
          className={`min-h-11 inline-flex items-center px-2 -mx-2 text-sm font-medium text-ink-muted hover:text-ink ${FOCUS_RING}`}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
