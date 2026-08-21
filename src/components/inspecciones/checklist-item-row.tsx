"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BookOpen, Camera, Check, ChevronDown, ChevronUp, History, Images, Lightbulb, Pencil, Plus, TriangleAlert, Trash2, X } from "lucide-react";
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
import { resolveInitialSeverity } from "@/lib/inspecciones/severity";
import type { InspectionAnswerStatus, InspectionReferenceImageKind, InspectionSeverity } from "@/generated/prisma/client";

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

// Fase 11L (docs/FASE11L_INFORME_REDISENO_VISUAL_GUIA.md, sección H) —
// "No corresponde" necesitaba un tono seleccionado propio: antes
// reutilizaba `bg-concrete text-ink-muted border-border`, IDÉNTICO al
// estado no-seleccionado, así que un check marcado "No corresponde" no
// se distinguía visualmente de uno sin responder. Se eligió un naranja
// quemado deliberadamente DISTINTO del ámbar/mostaza que ya usan las
// severidades Baja/Media (`caution-tint` + OBSERVATION_TEXT arriba) y de
// "Observación" en preguntas sin guía — mismo motivo que obligó a crear
// OBSERVATION_TEXT: evitar que dos significados distintos compartan el
// mismo matiz. #B5480A sobre #FCEAD9 mide ~4.9:1 (AA para texto normal,
// misma fórmula de luminancia relativa ya usada en OBSERVATION_TEXT).
const NOT_APPLICABLE_TEXT = "text-[#B5480A]";
const NOT_APPLICABLE_TINT = "bg-[#FCEAD9]";
const NOT_APPLICABLE_BORDER = "border-[#F0C9A0]";

// Muestra `questionSnapshot` (NUNCA el texto actual del catálogo) —
// estabilidad histórica diseñada en Fase 1: aunque el admin edite la
// pregunta del catálogo después, este check sigue mostrando exactamente
// lo que se preguntó cuando se generó la inspección.
export function ChecklistItemRow({
  caseId,
  checkId,
  questionSnapshot,
  initialStatus,
  initialNotApplicableReason,
  defaultSeverity,
  initialObservations,
  technicalArticle,
  referenceImages,
}: {
  caseId: string;
  checkId: string;
  questionSnapshot: string;
  initialStatus: InspectionAnswerStatus | null;
  // Fase 11K — ver docs/FASE11J..., sección Q. Solo relevante cuando
  // initialStatus === "NOT_APPLICABLE"; la Server Action garantiza null
  // en cualquier otro caso.
  initialNotApplicableReason: string | null;
  // Fase 18A (DT-01) — severidad por defecto del catálogo (puede ser
  // null). Solo inicializa el selector de un hallazgo NUEVO.
  defaultSeverity: InspectionSeverity | null;
  initialObservations: ObservationDTO[];
  technicalArticle: {
    title: string;
    content: string;
    queRevisar: string | null;
    condicionesCorrectas: string | null;
    comoRevisarlo: string | null;
    senalesDeProblema: string | null;
    porQueImporta: string | null;
    // Fase 11L — ver GuideBlock más abajo.
    guiaBreve: string | null;
    recomendacion: string | null;
  } | null;
  // Fase 11Q (docs/FASE11Q_INFORME_...) — imágenes BIEN/MAL de ESTA
  // revisión puntual. Vacío en casi todo el catálogo hoy — el control
  // "Ver ejemplos" no se renderiza en absoluto con length 0.
  referenceImages: {
    id: string;
    kind: InspectionReferenceImageKind;
    url: string;
    alt: string;
    caption: string | null;
  }[];
}) {
  // Fase 11B — piloto "guía primero" (docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md,
  // sección 7): solo se activa cuando el artículo vinculado tiene alguna
  // de las 2 secciones nuevas (hoy, únicamente las 2 preguntas de Piso).
  // El resto del catálogo sigue mostrando el mismo TechnicalArticleLink
  // colapsado de Fase 5B, sin ningún cambio.
  const hasGuide = Boolean(technicalArticle?.comoRevisarlo || technicalArticle?.senalesDeProblema);
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

  // Fase 11K (docs/FASE11J..., sección Q) — "No corresponde" NUNCA crea
  // un InspectionObservation (severidad/recomendación no aplican
  // semánticamente acá): un motivo opcional y breve, guardado
  // directamente en el check. Mismo criterio de "no bloquear" que el
  // resto del checklist — el motivo es opcional, "Guardar" funciona
  // igual con el campo vacío.
  const [notApplicableReason, setNotApplicableReason] = useState(initialNotApplicableReason);
  const [markingNotApplicable, setMarkingNotApplicable] = useState(false);
  const [notApplicableDraft, setNotApplicableDraft] = useState(initialNotApplicableReason ?? "");

  // Fase 11L (docs/FASE11L_INFORME_REDISENO_VISUAL_GUIA.md, sección D) —
  // el bloque completo de guía (Qué revisar/Cómo revisarlo/Qué debería
  // verse/Qué puede ser señal de un problema/Por qué importa/
  // Recomendación) arranca SIEMPRE colapsado, sin importar si el check
  // está pendiente o en edición — antes se mostraba abierto por defecto
  // apenas `hasGuide` era true. Estado puramente de presentación: no
  // toca ni depende de `status`/`editingStatus`, así que expandir o
  // colapsar nunca pierde ni altera la evaluación ya guardada.
  const [guideExpanded, setGuideExpanded] = useState(false);
  // Fase 11Q — mismo criterio "colapsado por defecto" que guideExpanded,
  // pero independiente: puede abrirse/cerrarse sin afectar la guía
  // técnica (son 2 recursos distintos, ver docs/FASE11Q_INFORME_...).
  const [referencesExpanded, setReferencesExpanded] = useState(false);
  // Fase 11L (sección L) — solo se usa para decidir a qué hallazgo recién
  // guardado darle foco/scroll y el mensaje "Agrega una foto..." una
  // única vez; no se persiste en ningún lado, es puramente de UX local.
  const [justSavedObservationId, setJustSavedObservationId] = useState<string | null>(null);

  const handleSelectStatus = (next: InspectionAnswerStatus) => {
    setError(null);
    setCreatingObservation(false);
    setMarkingNotApplicable(false);
    startStatusTransition(async () => {
      const result = await updateInspectionChecklistCheckAction(checkId, next);
      if (!result.status) {
        setError(result.error ?? "No se pudo guardar.");
        return;
      }
      setStatus(result.status);
      // La Server Action limpia el motivo en el servidor apenas el
      // status deja de ser NOT_APPLICABLE — acá solo se refleja lo que
      // ya volvió (nunca queda un motivo incoherente con el estado
      // actual, ver sección Q del informe).
      setNotApplicableReason(result.notApplicableReason);
      setEditingStatus(false);
    });
  };

  const handleClickNotApplicable = () => {
    setError(null);
    setCreatingObservation(false);
    setNotApplicableDraft(notApplicableReason ?? "");
    setMarkingNotApplicable(true);
  };

  const handleSaveNotApplicable = () => {
    setError(null);
    startStatusTransition(async () => {
      const result = await updateInspectionChecklistCheckAction(checkId, "NOT_APPLICABLE", notApplicableDraft);
      if (!result.status) {
        setError(result.error ?? "No se pudo guardar.");
        return;
      }
      setStatus(result.status);
      setNotApplicableReason(result.notApplicableReason);
      setMarkingNotApplicable(false);
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
          <StatusPill status={status} hasGuide={hasGuide} onClick={() => setEditingStatus(true)} />
        )}
      </div>

      {/* Piloto Fase 5B — solo aparece en las preguntas que ya tienen un
          TechnicalArticle vinculado; el resto del catálogo (incluidas
          Fachada/Reja/Portón, deliberadamente sin guía) no muestra nada
          acá, sin romper nada — degrada al checklist simple de siempre.
          TechnicalArticleLink ya arranca colapsado por su cuenta, así
          que las preguntas legacy sin `hasGuide` no cambian con Fase 11L. */}
      {technicalArticle && !hasGuide && (
        <TechnicalArticleLink title={technicalArticle.title} content={technicalArticle.content} />
      )}
      {/* Fase 11L (docs/FASE11L_INFORME_REDISENO_VISUAL_GUIA.md, secciones
          C/D) — "guía primero" (Fase 11B) mostraba SIEMPRE el bloque
          completo apenas `hasGuide` era true, antes incluso de que la
          persona pudiera responder. Ahora: una línea compacta ("guía
          breve", explícita o derivada — ver deriveGuiaBreve en
          inspecciones-knowledge.ts) siempre visible, y el resto detrás de
          un expandible que arranca cerrado. Misma condición de
          visibilidad que los botones de estado (status === null ||
          editingStatus) — una vez respondido, ni la guía breve ni el
          expandible se muestran (la pastilla de estado ya resume todo). */}
      {technicalArticle && hasGuide && (status === null || editingStatus) && (
        <>
          {technicalArticle.guiaBreve && (
            <p className="mt-1.5 text-sm text-ink-muted">
              <span className="font-medium text-ink">Revisa: </span>
              {technicalArticle.guiaBreve}
            </p>
          )}
          {/* Fase 11Q — recurso distinto de "Ver cómo revisarlo" (imagen
              vs. texto extendido): a propósito NO va dentro del
              expandible técnico. Se oculta por completo si no hay
              InspectionReferenceImage para este check. */}
          {referenceImages.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setReferencesExpanded((v) => !v)}
                aria-expanded={referencesExpanded}
                className={`mt-1.5 min-h-11 inline-flex items-center gap-1.5 px-1 text-xs font-medium text-safety ${FOCUS_RING}`}
              >
                <Images className="w-3.5 h-3.5 flex-shrink-0" />
                {referencesExpanded ? "Ocultar ejemplos" : "Ver ejemplos"}
                {referencesExpanded ? <ChevronUp className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />}
              </button>
              {referencesExpanded && <ReferenceImagesBlock images={referenceImages} />}
            </>
          )}
          <button
            type="button"
            onClick={() => setGuideExpanded((v) => !v)}
            aria-expanded={guideExpanded}
            className={`mt-1.5 min-h-11 inline-flex items-center gap-1.5 px-1 text-xs font-medium text-safety ${FOCUS_RING}`}
          >
            <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
            {guideExpanded ? "Ocultar detalle" : "Ver cómo revisarlo"}
            {guideExpanded ? <ChevronUp className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />}
          </button>
          {guideExpanded && (
            <GuideBlock
              queRevisar={technicalArticle.queRevisar}
              comoRevisarlo={technicalArticle.comoRevisarlo}
              condicionesCorrectas={technicalArticle.condicionesCorrectas}
              senalesDeProblema={technicalArticle.senalesDeProblema}
              porQueImporta={technicalArticle.porQueImporta}
              recomendacion={technicalArticle.recomendacion}
            />
          )}
        </>
      )}

      {(status === null || editingStatus) && (
        <div className="mt-2.5 flex gap-2 flex-wrap">
          <StatusButton
            label={hasGuide ? "Está bien" : "OK"}
            icon={Check}
            tone="bg-success-tint text-success border-success-border"
            selected={status === "OK"}
            disabled={isStatusPending}
            onClick={() => handleSelectStatus("OK")}
          />
          <StatusButton
            label={hasGuide ? "Tiene un problema" : "Observación"}
            icon={TriangleAlert}
            tone={hasGuide ? "bg-danger-tint text-danger border-danger/30" : `bg-caution-tint ${OBSERVATION_TEXT} border-caution-border`}
            selected={status === "OBSERVATION" || creatingObservation}
            disabled={isStatusPending}
            onClick={handleClickObservacion}
          />
          <StatusButton
            label={hasGuide ? "No corresponde" : "No aplica"}
            icon={X}
            tone={`${NOT_APPLICABLE_TINT} ${NOT_APPLICABLE_TEXT} ${NOT_APPLICABLE_BORDER}`}
            selected={status === "NOT_APPLICABLE" || markingNotApplicable}
            disabled={isStatusPending}
            onClick={handleClickNotApplicable}
          />
        </div>
      )}

      {/* Fase 11K — motivo opcional de "No corresponde" (docs/FASE11J...,
          sección Q). Nunca crea un InspectionObservation: sin severidad,
          sin recomendación, sin fotografía — solo un texto breve y
          opcional guardado directamente en el check. */}
      {markingNotApplicable && (
        <div className="mt-3 rounded-xl p-3 bg-concrete/60 border border-border grid gap-2">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-ink-muted">¿Por qué no corresponde? (opcional)</span>
            <textarea
              value={notApplicableDraft}
              onChange={(e) => setNotApplicableDraft(e.target.value)}
              rows={2}
              placeholder="Ej. Este recinto no tiene ventana"
              className="rounded-lg px-3 py-2 text-sm bg-white border border-border outline-none focus:border-ink resize-none"
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveNotApplicable}
              disabled={isStatusPending}
              className={`min-h-11 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white bg-action disabled:opacity-50 ${FOCUS_RING}`}
            >
              {isStatusPending ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setMarkingNotApplicable(false)}
              className={`min-h-11 inline-flex items-center px-2 -mx-2 text-sm font-medium text-ink-muted hover:text-ink ${FOCUS_RING}`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {status === "NOT_APPLICABLE" && !editingStatus && !markingNotApplicable && notApplicableReason && (
        <p className="mt-1.5 text-xs text-ink-muted">Motivo: {notApplicableReason}</p>
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
            defaultSeverity={defaultSeverity}
            onSaved={(created) => {
              setObservations((prev) => [...prev, created]);
              setCreatingObservation(false);
              setJustSavedObservationId(created.id);
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
                    defaultSeverity={defaultSeverity}
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
                defaultSeverity={defaultSeverity}
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
                highlightPhotos={obs.id === justSavedObservationId}
              />
            )
          )}

          {showAddForm ? (
            <ObservationForm
              checkId={checkId}
              initial={null}
              defaultSeverity={defaultSeverity}
              onSaved={(created) => {
                setObservations((prev) => [...prev, created]);
                setShowAddForm(false);
                setJustSavedObservationId(created.id);
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

// Fase 11B — piloto "guía primero" de Piso (docs/FASE11A..., sección 7):
// muestra la guía ANTES de los botones de evaluación, en el orden
// pedido por el diseño (Qué revisar / Cómo revisarlo / Qué debería verse
// / Qué señales pueden indicar un problema). Cada sección es opcional —
// solo se pinta si el artículo la tiene, así que este mismo componente
// también sirve si en el futuro algún artículo trae solo alguna de las 2
// secciones nuevas.
function GuideBlock({
  queRevisar,
  comoRevisarlo,
  condicionesCorrectas,
  senalesDeProblema,
  porQueImporta,
  recomendacion,
}: {
  queRevisar: string | null;
  comoRevisarlo: string | null;
  condicionesCorrectas: string | null;
  senalesDeProblema: string | null;
  porQueImporta: string | null;
  // Fase 11L — ya existía en KnowledgeEntry desde Fase 10B (alias
  // "recomendación"/"recomendacion"), pero no se mostraba en el flujo
  // "guía primero" hasta ahora; se agrega al detalle expandido, mismo
  // criterio "solo se pinta si el artículo la tiene" que porQueImporta.
  recomendacion: string | null;
}) {
  const sections = [
    { label: "Qué revisar", value: queRevisar },
    { label: "Cómo revisarlo", value: comoRevisarlo },
    { label: "Qué debería verse", value: condicionesCorrectas },
    { label: "Qué puede ser señal de un problema", value: senalesDeProblema },
    // Fase 11E — solo se pinta si el artículo la tiene (docs/FASE11D...,
    // regla "no mostrar 'Por qué importa' si el artículo no lo tiene").
    { label: "Por qué importa", value: porQueImporta },
    { label: "Recomendación", value: recomendacion },
  ].filter((s): s is { label: string; value: string } => Boolean(s.value));

  if (sections.length === 0) return null;

  return (
    <div className="mt-2.5 rounded-xl p-4 bg-safety-tint border border-safety/20 grid gap-3">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">{section.label}</p>
          <p className="text-sm text-ink whitespace-pre-wrap">{section.value}</p>
        </div>
      ))}
    </div>
  );
}

// Fase 11Q (docs/FASE11Q_INFORME_...) — "Así puede verse": columnas BIEN
// / MAL separadas espacialmente a propósito, para no confundirlas con la
// foto real del hallazgo (que vive más abajo, dentro de la observación).
// 1 columna en mobile angosto (evita miniaturas ilegibles a 375px), 2 en
// desktop/tablet — mismo breakpoint `sm:` que el resto del checklist.
function ReferenceImagesBlock({
  images,
}: {
  images: { id: string; kind: InspectionReferenceImageKind; url: string; alt: string; caption: string | null }[];
}) {
  const good = images.filter((img) => img.kind === "GOOD");
  const bad = images.filter((img) => img.kind === "BAD");

  return (
    <div className="mt-2.5 rounded-xl p-4 bg-safety-tint border border-safety/20">
      <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-3">Así puede verse</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {good.length > 0 && <ReferenceImageColumn label="BIEN" tone="text-success" images={good} />}
        {bad.length > 0 && <ReferenceImageColumn label="MAL" tone="text-danger" images={bad} />}
      </div>
    </div>
  );
}

function ReferenceImageColumn({
  label,
  tone,
  images,
}: {
  label: string;
  tone: string;
  images: { id: string; url: string; alt: string; caption: string | null }[];
}) {
  return (
    <div className="grid gap-2">
      <span className={`text-xs font-semibold ${tone}`}>{label}</span>
      {images.map((img) => (
        <figure key={img.id} className="grid gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen
              educativa de catálogo, no forma parte de next/image config */}
          <img src={img.url} alt={img.alt} className="w-full rounded-lg border border-border object-cover" />
          {img.caption && <figcaption className="text-xs text-ink-muted">{img.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

function StatusPill({
  status,
  hasGuide,
  onClick,
}: {
  status: InspectionAnswerStatus;
  hasGuide: boolean;
  onClick: () => void;
}) {
  if (status === "OK") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 min-h-11 px-3 py-1.5 rounded-full text-sm font-medium bg-success-tint text-success flex-shrink-0 ${FOCUS_RING}`}
      >
        <Check className="w-3.5 h-3.5" />
        {hasGuide ? "Está bien" : "OK"}
      </button>
    );
  }
  if (status === "OBSERVATION") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 min-h-11 px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0 ${FOCUS_RING} ${
          hasGuide ? "bg-danger-tint text-danger" : `bg-caution-tint ${OBSERVATION_TEXT}`
        }`}
      >
        <TriangleAlert className="w-3.5 h-3.5" />
        {hasGuide ? "Tiene un problema" : "Observación"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 min-h-11 px-3 py-1.5 rounded-full text-sm font-medium ${NOT_APPLICABLE_TINT} ${NOT_APPLICABLE_TEXT} flex-shrink-0 ${FOCUS_RING}`}
    >
      <X className="w-3.5 h-3.5" />
      {hasGuide ? "No corresponde" : "No aplica"}
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
  highlightPhotos,
}: {
  caseId: string;
  observation: ObservationDTO;
  onEdit: () => void;
  onDelete: () => void;
  // Fase 11L (sección L) — true solo para el hallazgo recién guardado en
  // ESTE render (la foto necesita `observationId`, así que solo puede
  // agregarse después de guardar — invariante ya existente, no se toca).
  // Hace foco/scroll suave hacia la zona de fotos y muestra un aviso una
  // sola vez; nunca sube nada automáticamente ni crea almacenamiento
  // temporal — sigue siendo el mismo <PhotoUpload> de siempre.
  highlightPhotos?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const photoSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightPhotos) {
      photoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    // Solo debe correr una vez, cuando este observation pasa a ser el
    // recién guardado — no en cada re-render del componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightPhotos]);

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
          PhotoUploadContext, "exactamente un nivel por foto"). Fase 11L
          — foco/scroll + aviso cuando este hallazgo se acaba de guardar
          (ver highlightPhotos arriba); la foto sigue subiéndose recién
          acá, nunca antes de que exista `observation.id`. */}
      <div ref={photoSectionRef} className="mt-2.5 pt-2.5 border-t border-border">
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint mb-2 flex items-center gap-1">
          <Camera className="w-3 h-3" />
          Fotografías
        </p>
        {highlightPhotos && (
          <p className="mb-2 text-xs font-medium text-safety">Agrega una foto del problema, si puedes.</p>
        )}
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
  defaultSeverity,
  onSaved,
  onCancel,
}: {
  checkId: string;
  initial: ObservationDTO | null;
  // Fase 18A (DT-01) — severidad por defecto del checklist item de este
  // check (puede ser null: varios checks base no la declaran). Solo se
  // usa para un hallazgo NUEVO (initial === null); un hallazgo ya
  // guardado siempre respeta su propia severidad (initial.severity),
  // nunca se resetea a este valor.
  defaultSeverity: InspectionSeverity | null;
  onSaved: (observation: ObservationDTO) => void;
  onCancel: () => void;
}) {
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [severity, setSeverity] = useState<InspectionSeverity>(resolveInitialSeverity(initial?.severity, defaultSeverity));
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
        {/* Fase 11L (docs/FASE11L_INFORME_REDISENO_VISUAL_GUIA.md, sección
            K) — "Severidad" (jerga técnica) pasa a "Nivel del problema"
            SOLO en la etiqueta visible. `severity`/InspectionSeverity/
            LOW-MEDIUM-HIGH-CRITICAL no cambian en ningún lado (BD, tipos,
            Server Actions, PDF). Las 4 opciones (Baja/Media/Alta/Crítica)
            se dejaron intactas — "Crítica" en particular se documenta
            como candidato a revisar en una fase futura, pero NO se
            cambia acá sin decisión explícita previa (instrucción
            expresa de esta fase). */}
        <span className="text-xs font-medium text-ink-muted">Nivel del problema</span>
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
