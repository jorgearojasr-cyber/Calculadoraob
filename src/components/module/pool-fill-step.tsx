"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { WizardQuestion } from "./types";
import { formatQuantity } from "@/lib/format-number";
import { formatRange } from "./result-screen-helpers";
import { PoolConfiguratorLayout } from "./pool-configurator-layout";

// Paso "Llenado" del configurador integral de Piscina.
//
// FASE C7-B (2026-09-05) — reemplaza el flujo original (Sí/No + balde como
// única entrada) por una experiencia práctica para un usuario NO técnico
// (Etapa A aprobada): la pregunta principal es "¿Cómo llenarás la
// piscina?", con la medición exacta con balde como UNA rama más ("Medir mi
// caudal real"), no la entrada obligatoria. Reusa el MISMO Question.key
// "llenado-estimar" que ya existía (ver fase-c7-piscina-integral-
// llenado.ts) — el key interno no cambia, solo su label/opciones; nunca
// visible al usuario.
//
// Los rangos de caudal por conexión (15–35 / 35–70 / 55–95 L/min) son
// referencia general de plomería residencial, NO específica de Chile
// (investigación Etapa A) — deliberadamente solapados entre categorías
// porque el diámetro nominal no garantiza un caudal fijo. Se muestran
// SIEMPRE junto al disclaimer obligatorio (sección 3 del pedido), nunca
// como valor único.
const FILL_STEP_GROUP = "fill";

export function isFillStepGroup(stepGroup: string | null | undefined): boolean {
  return stepGroup === FILL_STEP_GROUP;
}

type Modo = "pequena" | "tres-cuartos" | "una-pulgada" | "camion" | "medir";
type Capacidad = "10000" | "15000" | "20000" | "personalizado";

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

const MODO_OPTIONS: { key: Modo; label: string }[] = [
  { key: "pequena", label: "Llave doméstica / conexión pequeña" },
  { key: "tres-cuartos", label: 'Conexión 3/4"' },
  { key: "una-pulgada", label: 'Conexión 1"' },
  { key: "camion", label: "Camión aljibe" },
  { key: "medir", label: "Medir mi caudal real" },
];

// MISMOS valores EXACTOS que fase-c7-piscina-integral-llenado.ts (Variables
// "llenado-caudal-min-lookup"/"-max-lookup") -- este preview nunca sustituye
// al motor, solo lo refleja antes de enviar.
const RANGO_CAUDAL: Record<"pequena" | "tres-cuartos" | "una-pulgada", { min: number; max: number }> = {
  pequena: { min: 15, max: 35 },
  "tres-cuartos": { min: 35, max: 70 },
  "una-pulgada": { min: 55, max: 95 },
};

const CAPACIDAD_OPTIONS: { key: Capacidad; label: string }[] = [
  { key: "10000", label: "10.000 L" },
  { key: "15000", label: "15.000 L" },
  { key: "20000", label: "20.000 L" },
  { key: "personalizado", label: "Personalizado" },
];

export function PoolFillStep({
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

  const initialModoRaw = initialValues["llenado-estimar"] as string | undefined;
  // Compatibilidad con drafts guardados antes de esta fase (valores "si"/
  // "no" viejos) -- si no coincide con ninguna opción actual, se trata como
  // sin responder, nunca como un modo inválido silencioso.
  const initialModo: Modo | undefined = (["pequena", "tres-cuartos", "una-pulgada", "camion", "medir"] as string[]).includes(
    initialModoRaw ?? ""
  )
    ? (initialModoRaw as Modo)
    : undefined;

  const [modo, setModo] = useState<Modo | undefined>(initialModo);
  const [segundos, setSegundos] = useState(initStr("llenado-segundos-balde"));
  const [capacidad, setCapacidad] = useState<Capacidad | undefined>(
    (initialValues["llenado-capacidad-camion"] as Capacidad | undefined) ?? undefined
  );
  const [capacidadPersonalizada, setCapacidadPersonalizada] = useState(initStr("llenado-capacidad-camion-personalizada"));
  const [error, setError] = useState<string | null>(null);

  // Volumen de agua YA respondido/calculado desde Medidas -- mismas keys
  // literales que usa PoolEquipmentStep, mismo cálculo exacto (nunca se
  // recalcula en paralelo el resultado real, solo se refleja acá como
  // preview antes de enviar).
  const forma = initialValues["que-forma-tendra-tu-piscina"];
  const isCircular = forma === "circular";
  const largo = toNum(initialValues["largo-interior-metros"]);
  const ancho = toNum(initialValues["ancho-interior-metros"]);
  const profundidadRect = toNum(initialValues["profundidad-interior-metros"]);
  const diametro = toNum(initialValues["diametro-interior-metros"]);
  const profundidadCirc = toNum(initialValues["profundidad-interior-metros-circular"]);

  const aguaVolumenM3 = isCircular
    ? diametro !== null && profundidadCirc !== null
      ? Math.PI * (diametro / 2) ** 2 * profundidadCirc
      : null
    : largo !== null && ancho !== null && profundidadRect !== null
      ? largo * ancho * profundidadRect
      : null;
  const aguaVolumenLitros = aguaVolumenM3 !== null ? aguaVolumenM3 * 1000 : null;

  // Mismas fórmulas EXACTAS que fase-c7-piscina-integral-llenado.ts.
  const segundosN = toNumOrNull(segundos);
  const caudalLMin = segundosN !== null && segundosN > 0 ? 10 / (segundosN / 60) : null;
  const tiempoHorasMedido =
    caudalLMin !== null && aguaVolumenLitros !== null ? aguaVolumenLitros / (caudalLMin * 60) : null;

  const rangoConexion = modo === "pequena" || modo === "tres-cuartos" || modo === "una-pulgada" ? RANGO_CAUDAL[modo] : null;
  const tiempoHorasMin =
    rangoConexion !== null && aguaVolumenLitros !== null ? aguaVolumenLitros / (rangoConexion.max * 60) : null;
  const tiempoHorasMax =
    rangoConexion !== null && aguaVolumenLitros !== null ? aguaVolumenLitros / (rangoConexion.min * 60) : null;

  const capacidadPersonalizadaN = toNumOrNull(capacidadPersonalizada);
  const capacidadCamionN =
    capacidad === "personalizado" ? capacidadPersonalizadaN : capacidad !== undefined ? Number(capacidad) : null;
  const viajesCamion =
    capacidadCamionN !== null && capacidadCamionN > 0 && aguaVolumenLitros !== null
      ? Math.ceil(aguaVolumenLitros / capacidadCamionN)
      : null;

  const modoQ = findQuestion(questions, "llenado-estimar");
  const segundosQ = findQuestion(questions, "llenado-segundos-balde");
  const capacidadQ = findQuestion(questions, "llenado-capacidad-camion");
  const capacidadPersonalizadaQ = findQuestion(questions, "llenado-capacidad-camion-personalizada");

  const handleSubmit = () => {
    if (!modo) {
      setError("Elige cómo llenarás la piscina.");
      return;
    }
    if (modo === "medir") {
      if (segundosN === null || segundosN <= 0) {
        setError("Ingresa cuántos segundos demora en llenar el balde de 10 L (mayor que 0).");
        return;
      }
      setError(null);
      onAnswer({ "llenado-estimar": "medir", "llenado-segundos-balde": segundosN });
      return;
    }
    if (modo === "camion") {
      if (!capacidad) {
        setError("Elige la capacidad del camión.");
        return;
      }
      if (capacidad === "personalizado") {
        if (capacidadPersonalizadaN === null || capacidadPersonalizadaN <= 0) {
          setError("Ingresa cuántos litros lleva el camión (mayor que 0).");
          return;
        }
        setError(null);
        onAnswer({
          "llenado-estimar": "camion",
          "llenado-capacidad-camion": "personalizado",
          "llenado-capacidad-camion-personalizada": capacidadPersonalizadaN,
        });
        return;
      }
      setError(null);
      onAnswer({ "llenado-estimar": "camion", "llenado-capacidad-camion": capacidad });
      return;
    }
    setError(null);
    onAnswer({ "llenado-estimar": modo });
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8">
      <PoolConfiguratorLayout activeBlock="Llenado" />

      <div className="grid gap-5">
        <div>
          <p className="text-sm font-medium mb-2">{modoQ?.label ?? "¿Cómo llenarás la piscina?"}</p>
          <div className="grid gap-2">
            {MODO_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setModo(opt.key)}
                className={`text-left rounded-xl px-4 py-3 border transition-colors ${
                  modo === opt.key ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
                }`}
              >
                <span className="font-medium text-[14px]">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {rangoConexion !== null && (
          <div className="rounded-2xl bg-concrete px-5 py-4">
            <p className="text-sm text-ink-muted">Caudal estimado:</p>
            <p className="font-display text-2xl font-semibold text-ink mt-1">
              {formatRange(rangoConexion.min, rangoConexion.max)} L/min
            </p>
            {tiempoHorasMin !== null && tiempoHorasMax !== null && (
              <p className="text-sm text-ink-muted mt-2">
                Con {aguaVolumenLitros !== null ? formatQuantity(Math.round(aguaVolumenLitros)) : "—"} L de agua, tu
                piscina demoraría aproximadamente{" "}
                <span className="font-semibold text-ink">{formatRange(tiempoHorasMin, tiempoHorasMax)} horas</span> en
                llenarse.
              </p>
            )}
            {/* Fase C7-C (2026-09-05, sección 11 del pedido) -- "¿Por qué
                es un rango?" queda DELIBERADAMENTE sin un CollapsibleHelp
                aparte: este mismo párrafo ya explica qué significa (caudal
                real depende de presión/largo/instalación) y qué puede
                variarlo, siempre visible sin necesidad de un clic extra —
                agregar un colapsable adicional aquí sería duplicar, no
                sumar (ver sección 14 del pedido: "si ya responde
                claramente QUÉ SIGNIFICA + QUÉ PUEDE VARIAR, no agregar
                otro bloque"). */}
            <p className="mt-3 text-xs text-ink-faint">
              Es una estimación aproximada. El caudal real depende de la presión de tu red, el largo de la manguera y
              las condiciones de la instalación.
            </p>
            <p className="mt-1 text-xs text-ink-faint">Si quieres una estimación más precisa, mide tu caudal real.</p>
          </div>
        )}

        {modo === "camion" && (
          <div>
            <p className="text-sm font-medium mb-2">{capacidadQ?.label ?? "Capacidad del camión"}</p>
            <div className="grid gap-2">
              {CAPACIDAD_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setCapacidad(opt.key)}
                  className={`text-left rounded-xl px-4 py-3 border transition-colors ${
                    capacidad === opt.key ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
                  }`}
                >
                  <span className="font-medium text-[14px]">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {capacidadQ?.helpText ?? "La capacidad real depende del proveedor que contrates."}
            </p>

            {capacidad === "personalizado" && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-1.5">
                  {capacidadPersonalizadaQ?.label ?? "¿Cuántos litros lleva el camión?"}
                </p>
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-border focus-within:border-ink">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={capacidadPersonalizada}
                    onChange={(e) => setCapacidadPersonalizada(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-faint"
                  />
                  <span className="font-mono text-xs text-ink-muted flex-shrink-0">L</span>
                </div>
              </div>
            )}

            {viajesCamion !== null && (
              <div className="mt-4 rounded-2xl bg-concrete px-5 py-4">
                <p className="text-sm text-ink-muted">Viajes estimados:</p>
                <p className="font-display text-2xl font-semibold text-ink mt-1">
                  {viajesCamion} {viajesCamion === 1 ? "viaje" : "viajes"}
                </p>
                <p className="mt-2 text-xs text-ink-faint">La capacidad real depende del proveedor que contrates.</p>
              </div>
            )}
          </div>
        )}

        {modo === "medir" && (
          <div>
            <p className="text-sm font-medium mb-1.5">
              {segundosQ?.label ?? "¿Cuántos segundos demora tu llave en llenar un balde de 10 litros?"}
            </p>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-border focus-within:border-ink">
              <input
                type="text"
                inputMode="decimal"
                value={segundos}
                onChange={(e) => setSegundos(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-faint"
              />
              <span className="font-mono text-xs text-ink-muted flex-shrink-0">s</span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {segundosQ?.helpText ??
                "Llena un balde de 10 L y cronometra el tiempo. Así obtendrás una estimación mucho más precisa de tu caudal real."}
            </p>

            {caudalLMin !== null && (
              <div className="mt-4 rounded-2xl bg-concrete px-5 py-4">
                <p className="text-sm text-ink-muted">Caudal medido:</p>
                <p className="font-display text-2xl font-semibold text-ink mt-1">
                  {formatQuantity(caudalLMin)} L/min
                </p>
                {tiempoHorasMedido !== null && (
                  <p className="text-sm text-ink-muted mt-2">
                    Con {aguaVolumenLitros !== null ? formatQuantity(Math.round(aguaVolumenLitros)) : "—"} L de
                    agua, tu piscina demoraría aproximadamente{" "}
                    <span className="font-semibold text-ink">{formatQuantity(tiempoHorasMedido)} horas</span> en
                    llenarse a este caudal.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
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
  );
}
