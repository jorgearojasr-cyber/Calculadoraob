"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Calculator, PartyPopper, TriangleAlert } from "lucide-react";
import { togglePhaseCompletionAction } from "@/app/(app)/plan/[slug]/actions";
import { STALE_SESSION_ERROR, STALE_SESSION_MESSAGE } from "@/lib/stale-session";
import { PlanProgressBar } from "./plan-progress-bar";

export type PlanPhaseLink = { label: string | null; href: string; moduleName: string; moduleSlug: string };
export type PlanPhaseData = {
  id: string;
  name: string;
  completed: boolean;
  links: PlanPhaseLink[];
};

// FASE A — Piscinas (auditoría, sección 9): `espesorMuroM` se agrega para
// que el contorno se calcule desde la cara EXTERIOR física del muro, no
// desde el espejo de agua (que es lo que largo/ancho/radio representan —
// ver Fase 2, "Medida interior del espejo de agua"). Opcional: proyectos
// guardados antes de que el espesor se guardara como Variable, o donde no
// se pudo leer, caen a 0 (mismo comportamiento que existía antes de este
// cambio — el contorno se mide desde la medida interior).
export type PoolShape =
  | { kind: "rectangular"; largo: number; ancho: number; espesorMuroM?: number }
  | { kind: "circular"; radio: number; espesorMuroM?: number };

// Módulos de "Terminar el entorno" que aceptan un área directa (ver
// AreaInputToggle / forcedInitialArea en question-group-step.tsx) — si una
// fase tiene al menos uno de estos links Y ya se conoce la forma/medidas de
// la piscina (poolShape), se muestra el campo de ancho de contorno antes de
// los botones de módulo. Caso puntual de este plan, no una feature genérica.
const CONTORNO_MODULE_SLUGS = new Set([
  "radier",
  "instalar-pastelones",
  "ceramica-pisos",
  "porcelanato-piso",
]);

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Área EXACTA del anillo de contorno (no perímetro × ancho — eso subestima
// las esquinas/curvatura): rectangular resta el rectángulo EXTERIOR del
// muro (agrandado por el espesor real) del exterior agrandado por el
// ancho de contorno; circular, lo mismo con el radio exterior. FASE A
// (auditoría, sección 9): antes el punto de partida era largo/ancho/radio
// tal cual (el espejo de agua interior) — el contorno físico real empieza
// en la cara exterior del muro, `espesorMuroM` (0 si no se conoce, mismo
// comportamiento que antes) mueve ese punto de partida hacia afuera antes
// de sumar el ancho de contorno.
function computeContornoArea(pool: PoolShape, contornoWidth: number): number {
  const e = pool.espesorMuroM ?? 0;
  if (pool.kind === "rectangular") {
    const largoMuroExt = pool.largo + 2 * e;
    const anchoMuroExt = pool.ancho + 2 * e;
    const largoExt = largoMuroExt + 2 * contornoWidth;
    const anchoExt = anchoMuroExt + 2 * contornoWidth;
    return largoExt * anchoExt - largoMuroExt * anchoMuroExt;
  }
  const radioMuroExt = pool.radio + e;
  const radioExt = radioMuroExt + contornoWidth;
  return Math.PI * (radioExt * radioExt - radioMuroExt * radioMuroExt);
}

// Botón primario, mismo tratamiento que ResultScreen (Parte 4): rounded-xl
// 48px, ds-orange-600. Botón secundario cuando una fase tiene 2+ opciones
// de módulo (ej. Rectangular/Circular): outline, mismo alto.
function PhaseActionLinks({ links }: { links: PlanPhaseLink[] }) {
  if (links.length === 1) {
    return (
      <Link
        href={links[0].href}
        className="inline-flex items-center gap-2 rounded-xl px-5 font-body text-sm font-bold text-white bg-ds-orange-600 hover:bg-ds-orange-700 active:scale-[0.98] transition-all"
        style={{ height: 44 }}
      >
        <Calculator className="w-4 h-4" />
        Calcular esta fase
      </Link>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="inline-flex items-center gap-2 rounded-xl px-4 font-body text-sm font-semibold text-ds-navy-900 border-[1.5px] border-ds-border hover:border-ds-navy-900/40 transition-colors"
          style={{ height: 44 }}
        >
          <Calculator className="w-3.5 h-3.5" />
          {link.label ?? link.moduleName}
        </Link>
      ))}
    </div>
  );
}

// Campo de ancho de contorno + botones de módulo de la fase, con el área
// calculada precargada en cada href (ver forcedInitialArea en
// question-group-step.tsx). Se muestra SOLO si hay poolShape disponible —
// sin eso, el llamador ya renderiza los links tal cual, sin este campo.
function ContornoAreaField({ pool, links }: { pool: PoolShape; links: PlanPhaseLink[] }) {
  const [width, setWidth] = useState("");
  const widthNum = Number(width.replace(",", "."));
  const area =
    width && Number.isFinite(widthNum) && widthNum > 0 ? round2(computeContornoArea(pool, widthNum)) : null;

  const effectiveLinks = useMemo(() => {
    if (area === null) return links;
    const side = round2(Math.sqrt(area));
    // Radier calcula malla electrosoldada asumiendo una losa sólida
    // rectangular (planchas por largo/ancho reales) — no tiene forma de
    // representar un anillo con un agujero en el medio (la piscina), así
    // que la malla quedaría sobreestimada para cualquier contorno, incluso
    // con dimensiones reales (no es un problema del cuadrado ficticio, es
    // que la fórmula no aplica a esta geometría). Se preselecciona "No
    // necesito calcular malla" (opción ya existente en Radier) para no
    // mostrar un número engañoso — el usuario puede cambiarlo si igual
    // quiere una referencia gruesa. Los otros 3 módulos de esta fase no
    // tienen esa pregunta, así que el param extra no les afecta en nada.
    return links.map((link) => ({
      ...link,
      href: `${link.href}&area-inicial=${area}&largo=${side}&ancho=${side}&que-malla-de-refuerzo-vas-a-usar=no-necesito`,
    }));
  }, [links, area]);

  return (
    <div>
      <div className="mb-3">
        <span className="block font-body text-sm font-semibold text-ds-navy-900 mb-1.5">
          ¿Cuánto ancho tendrá el contorno alrededor de la piscina?
        </span>
        <div className="flex items-center gap-2 rounded-ds-input bg-white border-[1.5px] border-ds-border px-4 py-2.5 max-w-[200px] focus-within:border-ds-orange-600 focus-within:ring-[3px] focus-within:ring-ds-orange-100 transition-all">
          <input
            type="text"
            inputMode="decimal"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent outline-none font-display text-lg text-ds-navy-900 placeholder:text-ds-text-tertiary"
          />
          <span className="font-body text-sm font-semibold text-ds-text-secondary">m</span>
        </div>
        {area !== null && (
          <p className="mt-1.5 font-body text-xs text-ds-text-secondary">
            Área del contorno: <span className="font-semibold text-ds-navy-900">{area} m²</span> — se precarga en
            el módulo que elijas, editable ahí.
          </p>
        )}
      </div>
      <PhaseActionLinks links={effectiveLinks} />
    </div>
  );
}

type PhaseStatus = "completed" | "current" | "pending";

function statusDotClasses(status: PhaseStatus): string {
  if (status === "completed") return "bg-ds-success-600 border-ds-success-600 text-white";
  if (status === "current") return "bg-ds-orange-600 border-ds-orange-600 text-white";
  return "bg-white border-ds-border text-ds-text-tertiary";
}

function StatusBadge({ status }: { status: PhaseStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 font-body text-[11px] font-semibold px-2 py-0.5 rounded-full bg-ds-success-600/10 text-ds-success-600">
        <Check className="w-3 h-3" />
        Completada
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="inline-flex items-center gap-1 font-body text-[11px] font-semibold px-2 py-0.5 rounded-full bg-ds-orange-100 text-ds-orange-700">
        En curso
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-body text-[11px] font-semibold px-2 py-0.5 rounded-full bg-ds-muted text-ds-text-tertiary">
      Pendiente
    </span>
  );
}

// Piloto de "Plan de fases": progreso simple sin lógica de dependencia
// entre fases (se pueden completar en cualquier orden) — deliberadamente
// simple hasta validar el patrón con un solo caso real.
export function PlanView({
  planSlug,
  phases,
  justCompletedPhaseId,
  poolShape,
}: {
  planSlug: string;
  phases: PlanPhaseData[];
  // Viene de ?justCompleted=<phaseId> — seteado por ResultScreen al guardar
  // un proyecto abierto desde este plan (ver handleSaveProject). Solo sirve
  // para el banner de bienvenida al volver; el estado real de "completada"
  // ya se guardó en ProjectPlanPhaseCompletion antes de redirigir.
  justCompletedPhaseId?: string;
  // Forma y medidas reales de la piscina, derivadas de un SavedProject de
  // Fase 1/2 (ver plan/[slug]/page.tsx) — null si el usuario no llegó a
  // completar esas fases (o no está logueado): en ese caso "Terminar el
  // entorno" sigue funcionando exactamente como antes, sin este campo.
  poolShape?: PoolShape | null;
}) {
  const [completedIds, setCompletedIds] = useState(
    new Set(phases.filter((p) => p.completed).map((p) => p.id))
  );
  const [, startTransition] = useTransition();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const router = useRouter();

  const completedCount = completedIds.size;
  const justCompletedPhase = phases.find((p) => p.id === justCompletedPhaseId);
  // Fase 5 (Design Spec, "AHORA"): antes `nextPhase` solo se calculaba para
  // el banner post-guardado — ahora es también la fase que se destaca de
  // forma permanente en el bloque "AHORA" (primera no completada, sin
  // importar si se acaba de completar otra). Mismo criterio de siempre
  // (cualquier orden), solo se usa en un lugar más.
  const currentPhase = phases.find((p) => !completedIds.has(p.id));

  const handleToggle = (phaseId: string, checked: boolean) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(phaseId);
      else next.delete(phaseId);
      return next;
    });

    startTransition(async () => {
      const result = await togglePhaseCompletionAction(planSlug, phaseId, checked);
      if (result.error) {
        setCompletedIds((prev) => {
          const next = new Set(prev);
          if (checked) next.delete(phaseId);
          else next.add(phaseId);
          return next;
        });
        if (result.error === STALE_SESSION_ERROR) {
          setSessionError(STALE_SESSION_MESSAGE);
        } else {
          router.push(`/login?callbackUrl=${encodeURIComponent(`/plan/${planSlug}`)}`);
        }
      }
    });
  };

  const renderPhaseActions = (phase: PlanPhaseData) => {
    const isContornoPhase = phase.links.some((l) => CONTORNO_MODULE_SLUGS.has(l.moduleSlug));
    if (isContornoPhase && poolShape) {
      return <ContornoAreaField pool={poolShape} links={phase.links} />;
    }
    return <PhaseActionLinks links={phase.links} />;
  };

  return (
    <div>
      {sessionError && (
        <div className="rounded-ds-card p-4 mb-4 bg-danger-tint border-2 border-danger flex items-start gap-2.5">
          <TriangleAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-danger" />
          <p className="font-body text-sm text-danger">
            {sessionError}{" "}
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/plan/${planSlug}`)}`} className="font-semibold underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      )}

      {justCompletedPhase && (
        <div className="rounded-ds-card p-5 mb-4 bg-ds-success-600/10 border border-ds-success-600/30">
          <div className="flex items-start gap-3">
            <PartyPopper className="w-5 h-5 text-ds-success-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-bold text-ds-success-600">¡{justCompletedPhase.name} lista!</p>
              {currentPhase ? (
                <p className="font-body text-sm text-ds-text-secondary mt-1">Sigue con: {currentPhase.name}</p>
              ) : (
                <p className="font-body text-sm text-ds-text-secondary mt-1">¡Completaste todas las etapas del plan!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progreso — Design Spec v1.0 sección J.7: barra real solo cuando hay
          al menos una etapa completada; sin eso, un mensaje de inicio en
          vez de una barra/porcentaje en 0% (sección 6/16). */}
      <div className="rounded-ds-card p-5 bg-white border border-ds-border mb-4">
        {completedCount > 0 ? (
          <PlanProgressBar completed={completedCount} total={phases.length} />
        ) : (
          <p className="font-body text-sm text-ds-text-secondary">
            {phases.length} {phases.length === 1 ? "etapa" : "etapas"} — empieza por la primera cuando quieras.
          </p>
        )}
      </div>

      {/* AHORA — Design Spec v1.0 sección J.8: máxima claridad para la fase
          actual, con datos reales de ProjectPlan (nunca un nombre
          hardcodeado). Si no hay fase pendiente, el plan está completo. */}
      {currentPhase ? (
        <div className="rounded-ds-card p-5 mb-6 bg-ds-orange-100/40 border border-ds-orange-600/30">
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-ds-orange-700 mb-2">Ahora</p>
          <h2 className="font-display text-xl font-extrabold text-ds-navy-900 tracking-tight mb-4">{currentPhase.name}</h2>
          {renderPhaseActions(currentPhase)}
        </div>
      ) : (
        phases.length > 0 && (
          <div className="rounded-ds-card p-5 mb-6 bg-ds-success-600/10 border border-ds-success-600/30 flex items-start gap-2.5">
            <Check className="w-5 h-5 text-ds-success-600 shrink-0 mt-0.5" />
            <p className="font-body text-sm font-semibold text-ds-success-600">Completaste todas las etapas de este plan.</p>
          </div>
        )
      )}

      {/* Timeline — Design Spec v1.0 sección J.9-10: dot 32px + conector
          2px, se adapta a la cantidad real de fases (nunca hardcodeada). */}
      <div>
        {phases.map((phase, index) => {
          const isDone = completedIds.has(phase.id);
          const status: PhaseStatus = isDone ? "completed" : phase.id === currentPhase?.id ? "current" : "pending";
          const isLast = index === phases.length - 1;

          return (
            <div key={phase.id} className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-body text-xs font-bold ${statusDotClasses(status)}`}
                >
                  {status === "completed" ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[24px] ${status === "completed" ? "bg-ds-success-600" : "bg-ds-border"}`} />
                )}
              </div>

              <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-5"}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-body font-semibold text-[15px] text-ds-navy-900">{phase.name}</h3>
                  <StatusBadge status={status} />
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={(e) => handleToggle(phase.id, e.target.checked)}
                    className="w-4 h-4 accent-ds-orange-600"
                    aria-label={`Marcar "${phase.name}" como lista`}
                  />
                  <span className="font-body text-xs text-ds-text-secondary">Marcar como lista</span>
                </label>

                {status !== "current" && renderPhaseActions(phase)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
