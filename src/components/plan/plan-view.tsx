"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Circle, Calculator, PartyPopper, ArrowRight } from "lucide-react";
import { togglePhaseCompletionAction } from "@/app/(app)/plan/[slug]/actions";
import { STALE_SESSION_ERROR, STALE_SESSION_MESSAGE } from "@/lib/stale-session";

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

// Campo de ancho de contorno + botones de módulo de la fase, con el área
// calculada precargada en cada href (ver forcedInitialArea en
// question-group-step.tsx). Se muestra SOLO si hay poolShape disponible —
// sin eso, el llamador ya renderiza los links tal cual, sin este campo.
function ContornoAreaField({
  pool,
  links,
  renderLinks,
}: {
  pool: PoolShape;
  links: PlanPhaseLink[];
  renderLinks: (links: PlanPhaseLink[]) => ReactNode;
}) {
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
        <span className="block text-sm font-medium text-ink-muted mb-1.5">
          ¿Cuánto ancho tendrá el contorno alrededor de la piscina?
        </span>
        <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-4 py-2.5 max-w-[200px]">
          <input
            type="text"
            inputMode="decimal"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent outline-none font-display text-lg placeholder:text-ink-faint"
          />
          <span className="font-mono text-sm text-ink-muted">m</span>
        </div>
        {area !== null && (
          <p className="mt-1.5 text-xs text-ink-muted">
            Área del contorno: <span className="font-mono font-semibold">{area} m²</span> — se precarga en
            el módulo que elijas, editable ahí.
          </p>
        )}
      </div>
      {renderLinks(effectiveLinks)}
    </div>
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
  const nextPhase = phases.find((p) => !completedIds.has(p.id) && p.id !== justCompletedPhaseId);

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

  return (
    <div>
      {sessionError && (
        <div className="rounded-2xl p-4 mb-4 bg-safety-tint border border-safety/30 text-sm text-safety">
          {sessionError}{" "}
          <Link href={`/login?callbackUrl=${encodeURIComponent(`/plan/${planSlug}`)}`} className="font-semibold underline">
            Iniciar sesión
          </Link>
        </div>
      )}

      {justCompletedPhase && (
        <div className="rounded-2xl p-5 mb-4 bg-safety-tint border border-safety/30">
          <div className="flex items-start gap-3">
            <PartyPopper className="w-5 h-5 text-safety shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-safety">
                ¡{justCompletedPhase.name} lista!
              </p>
              {nextPhase ? (
                <>
                  <p className="text-sm text-ink-muted mt-1">Sigue con: {nextPhase.name}</p>
                  {nextPhase.links.length === 1 && (
                    <Link
                      href={nextPhase.links[0].href}
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white bg-ink"
                    >
                      Ir a {nextPhase.name}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </>
              ) : (
                <p className="text-sm text-ink-muted mt-1">¡Completaste todas las fases del plan!</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-5 bg-white border border-border mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">
            {completedCount} de {phases.length} fases completadas
          </p>
          <span className="text-xs text-ink-muted">
            {Math.round((completedCount / phases.length) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-safety transition-all"
            style={{ width: `${(completedCount / phases.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3">
        {phases.map((phase) => {
          const isDone = completedIds.has(phase.id);
          const isHighlighted = phase.id === nextPhase?.id && justCompletedPhase !== undefined;
          const isContornoPhase = phase.links.some((l) => CONTORNO_MODULE_SLUGS.has(l.moduleSlug));
          const renderPhaseLinks = (links: PlanPhaseLink[]) =>
            links.length === 1 ? (
              <Link
                href={links[0].href}
                className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white bg-ink"
              >
                <Calculator className="w-3.5 h-3.5" />
                Calcular esta fase
              </Link>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-ink"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    {link.label ?? link.moduleName}
                  </Link>
                ))}
              </div>
            );
          return (
            <div
              key={phase.id}
              className={`rounded-2xl p-5 bg-white border ${
                isHighlighted ? "border-safety ring-1 ring-safety/30" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <label className="flex items-center gap-2 cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={(e) => handleToggle(phase.id, e.target.checked)}
                    className="w-4 h-4"
                    aria-label={`Marcar "${phase.name}" como lista`}
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[15px]">{phase.name}</h3>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-safety-tint text-safety">
                        <Check className="w-3 h-3" />
                        Completada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-concrete text-ink-faint">
                        <Circle className="w-3 h-3" />
                        Pendiente
                      </span>
                    )}
                  </div>

                  {isContornoPhase && poolShape ? (
                    <ContornoAreaField pool={poolShape} links={phase.links} renderLinks={renderPhaseLinks} />
                  ) : (
                    renderPhaseLinks(phase.links)
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
