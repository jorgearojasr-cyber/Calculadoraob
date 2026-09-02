"use client";

import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import type { WizardQuestion } from "./types";
import { formatQuantity } from "@/lib/format-number";
import { PoolConfiguratorLayout } from "./pool-configurator-layout";
import { PoolConfiguratorIllustration } from "./pool-configurator-illustration";

// Paso "Excavación" del configurador integral de Piscina (Fase C3,
// 2026-09-01) -- EXCLUSIVO de "piscina-integral", mismo criterio ya
// aprobado para FoundationStep/InteriorTerminationStep: geometría/UI
// propia que no encaja en QuestionGroupStep. El usuario NO vuelve a
// ingresar largo/ancho/diámetro/profundidad del hoyo (ver sección 1/18
// del pedido C3) -- este componente los CALCULA en vivo (mismas fórmulas
// que fase-c3-piscina-integral-excavacion.ts, ver comentarios inline en
// cada cálculo) solo para mostrarlos como dato derivado; el cálculo real
// que llega a ResultScreen lo hace siempre el motor de fórmulas contra
// esos mismos Formula rows -- este preview nunca sustituye al motor.
//
// Igual que Interior (Fase C2), el stepGroup "excavation" agrupa sus
// Questions sin depender de visibleIfQuestionKey para las que este
// componente maneja con estado propio -- EXCEPTO
// "excavacion-capacidad-personalizada-m3", que SÍ lo tiene en la DB
// (gatillada por tipo-camion="personalizado"): a diferencia del caso
// compuesto de Interior, esta es una condición de una sola key, que el
// schema sí puede expresar -- así que también filtra sola en "Tu
// proyecto" (isQuestionVisible genérico), sin necesitar un mecanismo de
// active-keys adicional.
const EXCAVATION_STEP_GROUP = "excavation";

export function isExcavationStepGroup(stepGroup: string | null | undefined): boolean {
  return stepGroup === EXCAVATION_STEP_GROUP;
}

type Terreno = "tierra-normal" | "con-arcilla-o-piedras";
type Camion = "chico" | "mediano" | "grande" | "personalizado";

function findQuestion(questions: WizardQuestion[], key: string): WizardQuestion | undefined {
  return questions.find((q) => q.key === key);
}

function toNum(v: string | number | undefined): number | null {
  if (v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toNumOrNull(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const TERRENO_OPTIONS: { key: Terreno; label: string }[] = [
  { key: "tierra-normal", label: "Tierra normal" },
  { key: "con-arcilla-o-piedras", label: "Con arcilla o piedras" },
];
const CAMION_OPTIONS: { key: Camion; label: string }[] = [
  { key: "chico", label: "Camión tolva chico (~6 m³)" },
  { key: "mediano", label: "Camión tolva mediano (~10 m³)" },
  { key: "grande", label: "Camión tolva grande (~15 m³)" },
  { key: "personalizado", label: "Personalizado" },
];

export function PoolExcavationStep({
  questions,
  initialValues,
  onAnswer,
  onSaveForLater,
}: {
  questions: WizardQuestion[];
  initialValues: Record<string, string | number | undefined>;
  onAnswer: (values: Record<string, string | number>) => void;
  onSaveForLater?: () => void;
}) {
  const initStr = (key: string) => (initialValues[key] !== undefined ? String(initialValues[key]) : "");

  const [espacioTrabajo, setEspacioTrabajo] = useState(initStr("excavacion-espacio-trabajo-cm"));
  const [preparacionLosa, setPreparacionLosa] = useState(initStr("excavacion-preparacion-losa-cm") || "0");
  const [terreno, setTerreno] = useState<Terreno | undefined>(
    (initialValues["excavacion-tipo-terreno"] as Terreno | undefined) ?? undefined
  );
  const [camion, setCamion] = useState<Camion | undefined>((initialValues["excavacion-tipo-camion"] as Camion | undefined) ?? undefined);
  const [capacidadPersonalizada, setCapacidadPersonalizada] = useState(initStr("excavacion-capacidad-personalizada-m3"));
  const [error, setError] = useState<string | null>(null);

  // Dimensiones e insumos ya respondidos en Medidas/Estructura -- mismas
  // keys literales que usa VolumeStep/InteriorTerminationStep, leídas del
  // mismo `initialValues` acumulado (ver sourceDimensionKeys/C2).
  const forma = initialValues["que-forma-tendra-tu-piscina"];
  const isCircular = forma === "circular";
  const largo = toNum(initialValues["largo-interior-metros"]);
  const ancho = toNum(initialValues["ancho-interior-metros"]);
  const profundidadRect = toNum(initialValues["profundidad-interior-metros"]);
  const diametro = toNum(initialValues["diametro-interior-metros"]);
  const profundidadCirc = toNum(initialValues["profundidad-interior-metros-circular"]);
  const espesorMuroCm = toNum(isCircular ? initialValues["espesor-de-los-muros-cm-circular"] : initialValues["espesor-de-los-muros-cm"]);
  const espesorFondoCm = toNum(isCircular ? initialValues["espesor-del-fondo-losa-cm-circular"] : initialValues["espesor-del-fondo-losa-cm"]);

  const espacioTrabajoM = (toNumOrNull(espacioTrabajo) ?? 0) / 100;
  const preparacionLosaM = (toNumOrNull(preparacionLosa) ?? 0) / 100;
  const espesorMuroM = (espesorMuroCm ?? 0) / 100;
  const espesorFondoM = (espesorFondoCm ?? 0) / 100;

  // Mismas fórmulas EXACTAS que fase-c3-piscina-integral-excavacion.ts
  // (largo-ext/ancho-ext/diametro-ext ya existen desde C1) -- ver ese
  // archivo para la versión que realmente calcula ResultScreen.
  const largoExt = largo !== null ? largo + 2 * espesorMuroM : null;
  const anchoExt = ancho !== null ? ancho + 2 * espesorMuroM : null;
  const diametroExt = diametro !== null ? diametro + 2 * espesorMuroM : null;

  const largoHoyo = largoExt !== null ? largoExt + 2 * espacioTrabajoM : null;
  const anchoHoyo = anchoExt !== null ? anchoExt + 2 * espacioTrabajoM : null;
  const profHoyoRect = profundidadRect !== null ? profundidadRect + espesorFondoM + preparacionLosaM : null;
  const diametroHoyo = diametroExt !== null ? diametroExt + 2 * espacioTrabajoM : null;
  const profHoyoCirc = profundidadCirc !== null ? profundidadCirc + espesorFondoM + preparacionLosaM : null;

  const dimsText = isCircular
    ? diametroHoyo !== null && profHoyoCirc !== null
      ? `Ø ${formatQuantity(diametroHoyo)} × ${formatQuantity(profHoyoCirc)} m`
      : null
    : largoHoyo !== null && anchoHoyo !== null && profHoyoRect !== null
      ? `${formatQuantity(largoHoyo)} × ${formatQuantity(anchoHoyo)} × ${formatQuantity(profHoyoRect)} m`
      : null;

  const terrenoQ = findQuestion(questions, "excavacion-tipo-terreno");
  const camionQ = findQuestion(questions, "excavacion-tipo-camion");
  const capacidadQ = findQuestion(questions, "excavacion-capacidad-personalizada-m3");
  const espacioQ = findQuestion(questions, "excavacion-espacio-trabajo-cm");
  const preparacionQ = findQuestion(questions, "excavacion-preparacion-losa-cm");

  const handleSubmit = () => {
    const espacioN = toNumOrNull(espacioTrabajo);
    if (espacioN === null || espacioN <= 0) {
      setError("Ingresa el espacio de trabajo alrededor del vaso (mayor que 0 cm).");
      return;
    }
    const preparacionN = toNumOrNull(preparacionLosa) ?? 0;
    if (preparacionN < 0) {
      setError("La preparación bajo losa no puede ser negativa.");
      return;
    }
    if (!terreno) {
      setError("Elige el tipo de terreno.");
      return;
    }
    if (!camion) {
      setError("Elige el camión que vas a usar.");
      return;
    }
    let capacidadN: number | null = null;
    if (camion === "personalizado") {
      capacidadN = toNumOrNull(capacidadPersonalizada);
      if (capacidadN === null || capacidadN <= 0) {
        setError("Ingresa la capacidad del camión (mayor que 0 m³).");
        return;
      }
    }

    setError(null);
    const values: Record<string, string | number> = {
      "excavacion-espacio-trabajo-cm": espacioN,
      "excavacion-preparacion-losa-cm": preparacionN,
      "excavacion-tipo-terreno": terreno,
      "excavacion-tipo-camion": camion,
    };
    if (camion === "personalizado" && capacidadN !== null) {
      values["excavacion-capacidad-personalizada-m3"] = capacidadN;
    }
    onAnswer(values);
  };

  const illustrationProps = isCircular
    ? {
        state: "excavation" as const,
        shape: "circular" as const,
        diametro,
        profundidad: profundidadCirc,
        espesorMuroCm,
        espesorFondoCm,
        espacioTrabajoCm: toNumOrNull(espacioTrabajo),
        diametroHoyo,
        profHoyo: profHoyoCirc,
      }
    : {
        state: "excavation" as const,
        shape: "rectangular" as const,
        largo,
        ancho,
        profundidad: profundidadRect,
        espesorMuroCm,
        espesorFondoCm,
        espacioTrabajoCm: toNumOrNull(espacioTrabajo),
        largoHoyo,
        anchoHoyo,
        profHoyo: profHoyoRect,
      };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8 grid md:grid-cols-[1fr_1.4fr] md:gap-10 md:items-start">
      <div className="order-1">
        <PoolConfiguratorLayout activeBlock="Excavación" />

        <div className="md:hidden mb-5 rounded-2xl bg-[#F3F7FB] p-4">
          <PoolConfiguratorIllustration {...illustrationProps} />
        </div>

        <div className="rounded-2xl bg-concrete px-5 py-4 mb-5">
          <p className="text-sm text-ink-muted">Con las medidas de tu piscina, estimamos una excavación de:</p>
          <p className="font-display text-2xl font-semibold text-ink mt-1">{dimsText ?? "—"}</p>
          <p className="text-xs text-ink-faint mt-2">Puedes ajustar los parámetros que influyen en esta estimación.</p>
        </div>

        <div className="grid gap-5">
          <div>
            <p className="text-sm font-medium mb-1.5">{espacioQ?.label ?? "Espacio de trabajo alrededor"}</p>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-border focus-within:border-ink">
              <input
                type="text"
                inputMode="decimal"
                value={espacioTrabajo}
                onChange={(e) => setEspacioTrabajo(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-faint"
              />
              <span className="font-mono text-xs text-ink-muted flex-shrink-0">cm</span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {espacioQ?.helpText ??
                "Espacio adicional necesario alrededor del vaso para ejecutar los trabajos de construcción. Depende del sistema constructivo y de las condiciones de la obra."}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-1.5">{preparacionQ?.label ?? "Preparación bajo losa"}</p>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-border focus-within:border-ink">
              <input
                type="text"
                inputMode="decimal"
                value={preparacionLosa}
                onChange={(e) => setPreparacionLosa(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-faint"
              />
              <span className="font-mono text-xs text-ink-muted flex-shrink-0">cm</span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {preparacionQ?.helpText ??
                "Agrega aquí cualquier espesor adicional que necesites considerar bajo la losa. Si no corresponde, déjalo en 0 cm."}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">{terrenoQ?.label ?? "Tipo de terreno"}</p>
            <div className="grid gap-2">
              {TERRENO_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTerreno(opt.key)}
                  className={`text-left rounded-xl px-4 py-3 border transition-colors ${
                    terreno === opt.key ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
                  }`}
                >
                  <span className="font-medium text-[14px]">{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-concrete px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-ink-faint flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ink-faint">
                {terrenoQ?.helpText ??
                  "El volumen aumenta al excavar porque el terreno deja de estar compactado. El valor real puede variar según el tipo y humedad del suelo."}{" "}
                Factor de esponjamiento estimado.
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">{camionQ?.label ?? "Camión para retirar la tierra"}</p>
            <div className="grid gap-2">
              {CAMION_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setCamion(opt.key)}
                  className={`text-left rounded-xl px-4 py-3 border transition-colors ${
                    camion === opt.key ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
                  }`}
                >
                  <span className="font-medium text-[14px]">{opt.label}</span>
                </button>
              ))}
            </div>
            {camion === "personalizado" && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-1.5">{capacidadQ?.label ?? "Capacidad del camión"}</p>
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-border focus-within:border-ink">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={capacidadPersonalizada}
                    onChange={(e) => setCapacidadPersonalizada(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-faint"
                  />
                  <span className="font-mono text-xs text-ink-muted flex-shrink-0">m³</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-safety">{error}</p>}

        <div className="mt-6">
          <button
            onClick={handleSubmit}
            className="w-full rounded-full px-6 py-4 text-base font-semibold text-white flex items-center justify-center gap-2 bg-action"
          >
            Ver resultado
            <ArrowRight className="w-4 h-4" />
          </button>
          {onSaveForLater && (
            <button
              type="button"
              onClick={onSaveForLater}
              className="mt-3 w-full text-center text-sm font-medium text-ink-muted hover:text-ink underline underline-offset-4"
            >
              Guardar y seguir después
            </button>
          )}
        </div>
      </div>

      <div className="hidden md:block order-2 rounded-2xl bg-[#F3F7FB] p-5 md:p-6">
        <PoolConfiguratorIllustration {...illustrationProps} />
      </div>
    </div>
  );
}
