"use client";

import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import type { WizardQuestion } from "./types";
import { formatQuantity } from "@/lib/format-number";
import { PoolConfiguratorLayout } from "./pool-configurator-layout";
import { PoolConfiguratorIllustration } from "./pool-configurator-illustration";
import type { EnvironmentMaterial } from "./pool-configurator-illustration";

// Paso "Entorno / Borde" del configurador integral de Piscina (Fase C4,
// 2026-09-02) -- EXCLUSIVO de "piscina-integral", mismo criterio ya
// aprobado para InteriorTerminationStep/PoolExcavationStep: geometría/UI
// propia que no encaja en QuestionGroupStep genérico. El usuario NO vuelve
// a ingresar largo/ancho/diámetro de la piscina (sección 1 del pedido
// C4) -- este componente los LEE de Medidas/Estructura y solo pide el
// ancho del entorno + terminación (y los campos condicionales que
// dependan de esa elección), calculando el área EN VIVO como preview
// (mismas fórmulas EXACTAS que fase-c4-piscina-integral-entorno.ts) --
// el cálculo real que llega a ResultScreen lo hace siempre el motor de
// fórmulas contra esos mismos Formula rows, este preview nunca lo
// sustituye.
//
// A diferencia de Interior (Fase C2), acá NO hace falta un mecanismo de
// "active keys": las 4 preguntas condicionales encadenan
// `visibleIfQuestionKey` de a una key por vez (base-existente depende de
// terminacion; espesor-base depende de base-existente; espesor-radier y
// pérdida dependen directo de terminacion) -- el schema nativo ya cubre
// el caso compuesto sin código adicional, y "Tu proyecto" se filtra solo.
const ENVIRONMENT_STEP_GROUP = "environment";

export function isEnvironmentStepGroup(stepGroup: string | null | undefined): boolean {
  return stepGroup === ENVIRONMENT_STEP_GROUP;
}

type Terminacion = EnvironmentMaterial;
type SiNo = "si" | "no";
type TamanoPastelon = "40x40cm" | "50x50cm" | "60x40cm";

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

// Mismo criterio de replicación EXACTA que el db-fix (instalar-pastelones,
// 8% fijo + tabla de cobertura) -- ver inspección previa, nunca se
// modifica el standalone.
const PASTELON_LOSS = 0.08;
const PASTELON_COBERTURA: Record<TamanoPastelon, number> = {
  "40x40cm": 0.16,
  "50x50cm": 0.25,
  "60x40cm": 0.24,
};

const TERMINACION_OPTIONS: { key: Terminacion; label: string }[] = [
  { key: "ceramica", label: "Cerámica" },
  { key: "porcelanato", label: "Porcelanato" },
  { key: "pastelones", label: "Pastelones" },
  { key: "radier", label: "Radier / hormigón terminado" },
  { key: "sin-calcular", label: "Sin calcular" },
];
const BASE_EXISTENTE_OPTIONS: { key: SiNo; label: string }[] = [
  { key: "si", label: "Sí" },
  { key: "no", label: "No" },
];
const TAMANO_PASTELON_OPTIONS: { key: TamanoPastelon; label: string }[] = [
  { key: "40x40cm", label: "40 × 40 cm" },
  { key: "50x50cm", label: "50 × 50 cm" },
  { key: "60x40cm", label: "60 × 40 cm" },
];

export function PoolEnvironmentStep({
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

  const [anchoEntorno, setAnchoEntorno] = useState(initStr("entorno-ancho-m"));
  const [terminacion, setTerminacion] = useState<Terminacion | undefined>(
    (initialValues["entorno-terminacion"] as Terminacion | undefined) ?? undefined
  );
  const [baseExistente, setBaseExistente] = useState<SiNo | undefined>(
    (initialValues["entorno-base-existente"] as SiNo | undefined) ?? undefined
  );
  const [espesorBase, setEspesorBase] = useState(initStr("entorno-espesor-base-cm"));
  const [espesorRadier, setEspesorRadier] = useState(initStr("entorno-espesor-radier-cm"));
  const [perdida, setPerdida] = useState(initStr("entorno-perdida-terminacion-pct"));
  const [tamanoPastelon, setTamanoPastelon] = useState<TamanoPastelon | undefined>(
    (initialValues["entorno-tamano-pastelon"] as TamanoPastelon | undefined) ?? undefined
  );
  const [error, setError] = useState<string | null>(null);

  // Dimensiones/espesores ya respondidos en Medidas/Estructura -- mismas
  // keys literales que usan VolumeStep/InteriorTerminationStep/
  // PoolExcavationStep, leídas del mismo `initialValues` acumulado.
  const forma = initialValues["que-forma-tendra-tu-piscina"];
  const isCircular = forma === "circular";
  const largo = toNum(initialValues["largo-interior-metros"]);
  const ancho = toNum(initialValues["ancho-interior-metros"]);
  const profundidadRect = toNum(initialValues["profundidad-interior-metros"]);
  const diametro = toNum(initialValues["diametro-interior-metros"]);
  const profundidadCirc = toNum(initialValues["profundidad-interior-metros-circular"]);
  const espesorMuroCm = toNum(isCircular ? initialValues["espesor-de-los-muros-cm-circular"] : initialValues["espesor-de-los-muros-cm"]);
  const espesorFondoCm = toNum(isCircular ? initialValues["espesor-del-fondo-losa-cm-circular"] : initialValues["espesor-del-fondo-losa-cm"]);
  const espesorMuroM = (espesorMuroCm ?? 0) / 100;

  // Mismas fórmulas EXACTAS que fase-c4-piscina-integral-entorno.ts (área
  // rect = anillo entre exterior total y vaso exterior; área circ =
  // anillo entre círculo total y círculo exterior) -- ver ese archivo
  // para la versión que realmente calcula ResultScreen. Arranca SIEMPRE
  // de la cara exterior del muro (largo-ext/ancho-ext/radio-ext), nunca
  // del agua ni de una geometría inventada (sección 4/29 del pedido).
  const anchoEntornoM = toNumOrNull(anchoEntorno);
  const largoExt = largo !== null ? largo + 2 * espesorMuroM : null;
  const anchoExt = ancho !== null ? ancho + 2 * espesorMuroM : null;
  const radioExt = diametro !== null ? diametro / 2 + espesorMuroM : null;

  const areaEntornoRect =
    largoExt !== null && anchoExt !== null && anchoEntornoM !== null
      ? (largoExt + 2 * anchoEntornoM) * (anchoExt + 2 * anchoEntornoM) - largoExt * anchoExt
      : null;
  const radioEntorno = radioExt !== null && anchoEntornoM !== null ? radioExt + anchoEntornoM : null;
  const areaEntornoCirc =
    radioEntorno !== null && radioExt !== null ? Math.PI * radioEntorno ** 2 - Math.PI * radioExt ** 2 : null;
  const areaEntorno = isCircular ? areaEntornoCirc : areaEntornoRect;

  const isRadier = terminacion === "radier";
  // Espesor mostrado en el pill BASE de la ilustración: si es radier,
  // el espesor del radier terminado ES la base (sección 14 -- una sola
  // partida); si base existente="si", no corresponde mostrar nada
  // (`undefined`); si base nueva, el espesor recién tipeado.
  const espesorBasePreview: number | null | undefined = isRadier
    ? toNumOrNull(espesorRadier)
    : baseExistente === "si"
      ? undefined
      : baseExistente === "no"
        ? toNumOrNull(espesorBase)
        : undefined;

  const anchoQ = findQuestion(questions, "entorno-ancho-m");
  const terminacionQ = findQuestion(questions, "entorno-terminacion");
  const baseExistenteQ = findQuestion(questions, "entorno-base-existente");
  const espesorBaseQ = findQuestion(questions, "entorno-espesor-base-cm");
  const espesorRadierQ = findQuestion(questions, "entorno-espesor-radier-cm");
  const perdidaQ = findQuestion(questions, "entorno-perdida-terminacion-pct");
  const tamanoPastelonQ = findQuestion(questions, "entorno-tamano-pastelon");

  const handleSubmit = () => {
    const anchoN = toNumOrNull(anchoEntorno);
    if (anchoN === null || anchoN <= 0) {
      setError("Ingresa el ancho del entorno/borde (mayor que 0 m).");
      return;
    }
    if (!terminacion) {
      setError("Elige la terminación exterior.");
      return;
    }

    const values: Record<string, string | number> = {
      "entorno-ancho-m": anchoN,
      "entorno-terminacion": terminacion,
    };

    if (terminacion === "radier") {
      const espesorRadierN = toNumOrNull(espesorRadier);
      if (espesorRadierN === null || espesorRadierN <= 0) {
        setError("Ingresa el espesor del radier terminado (mayor que 0 cm).");
        return;
      }
      values["entorno-espesor-radier-cm"] = espesorRadierN;
      // Si un envío anterior (otra terminación) dejó "entorno-base-existente"
      // guardado en "no", ese valor viejo seguiría cumpliendo la condición
      // encadenada de "entorno-espesor-base-cm" (visibleIfValues=["no"]) aun
      // con "entorno-base-existente" ya oculta por depender de terminación
      // != radier -- el filtro genérico de "Tu proyecto" solo mira el valor
      // crudo, no si esa pregunta intermedia sigue visible. Se sobrescribe
      // explícitamente a "si" (opción real y válida -- el servidor rechaza
      // cualquier valor de SELECT que no sea una de sus opciones, ver
      // calculateModuleAction) para cortar la cadena: "si" != "no" oculta
      // "entorno-espesor-base-cm" corriente abajo, y la pregunta misma
      // sigue oculta en "Tu proyecto" porque su propia visibilidad depende
      // de terminación != radier, no de este valor.
      values["entorno-base-existente"] = "si";
    } else {
      if (!baseExistente) {
        setError("Indica si ya existe una base firme/radier en el entorno.");
        return;
      }
      values["entorno-base-existente"] = baseExistente;
      if (baseExistente === "no") {
        const espesorBaseN = toNumOrNull(espesorBase);
        if (espesorBaseN === null || espesorBaseN <= 0) {
          setError("Ingresa el espesor de la base/radier (mayor que 0 cm).");
          return;
        }
        values["entorno-espesor-base-cm"] = espesorBaseN;
      }

      if (terminacion === "ceramica" || terminacion === "porcelanato") {
        const perdidaN = toNumOrNull(perdida);
        if (perdidaN === null || perdidaN < 0) {
          setError("Ingresa el margen/pérdida de la terminación (0 o mayor).");
          return;
        }
        values["entorno-perdida-terminacion-pct"] = perdidaN;
      }

      if (terminacion === "pastelones") {
        if (!tamanoPastelon) {
          setError("Elige el tamaño de pastelón.");
          return;
        }
        values["entorno-tamano-pastelon"] = tamanoPastelon;
      }
    }

    setError(null);
    onAnswer(values);
  };

  const illustrationProps = isCircular
    ? {
        state: "environment" as const,
        shape: "circular" as const,
        diametro,
        profundidad: profundidadCirc,
        espesorMuroCm,
        espesorFondoCm,
        anchoEntornoM,
        areaEntorno,
        terminacion: terminacion ?? null,
        espesorBaseCm: espesorBasePreview,
      }
    : {
        state: "environment" as const,
        shape: "rectangular" as const,
        largo,
        ancho,
        profundidad: profundidadRect,
        espesorMuroCm,
        espesorFondoCm,
        anchoEntornoM,
        areaEntorno,
        terminacion: terminacion ?? null,
        espesorBaseCm: espesorBasePreview,
      };

  // Preview de compra estimada para Cerámica/Porcelanato -- mismo cálculo
  // EXACTO que las Formulas `entorno-ceramica-m2-compra`/
  // `entorno-porcelanato-m2-compra` (área × (1+pérdida/100)), solo para
  // mostrar en vivo -- el motor recalcula el valor real.
  const perdidaN = toNumOrNull(perdida);
  const compraConPerdida =
    areaEntorno !== null && perdidaN !== null ? areaEntorno * (1 + perdidaN / 100) : null;
  const pastelonesUnidades =
    areaEntorno !== null && tamanoPastelon
      ? Math.ceil((areaEntorno * (1 + PASTELON_LOSS)) / PASTELON_COBERTURA[tamanoPastelon])
      : null;
  const volumenBasePreview =
    espesorBasePreview !== null && espesorBasePreview !== undefined && areaEntorno !== null
      ? areaEntorno * (espesorBasePreview / 100)
      : null;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8 grid md:grid-cols-[1fr_1.4fr] md:gap-10 md:items-start">
      <div className="order-1">
        <PoolConfiguratorLayout activeBlock="Entorno" />

        <div className="md:hidden mb-5 rounded-2xl bg-[#F3F7FB] p-4">
          <PoolConfiguratorIllustration {...illustrationProps} />
        </div>

        <div className="rounded-2xl bg-concrete px-5 py-4 mb-5">
          <p className="text-sm text-ink-muted">Área estimada del entorno:</p>
          <p className="font-display text-2xl font-semibold text-ink mt-1">
            {areaEntorno !== null ? `${formatQuantity(areaEntorno)} m²` : "—"}
          </p>
          {volumenBasePreview !== null && (
            <p className="text-sm text-ink-muted mt-1">
              {isRadier ? "Volumen de hormigón (radier terminado)" : "Volumen base"}: {formatQuantity(volumenBasePreview)} m³
            </p>
          )}
          <p className="text-xs text-ink-faint mt-2">
            Medido desde la cara exterior del muro de la piscina hacia afuera.
          </p>
        </div>

        <div className="grid gap-5">
          <div>
            <p className="text-sm font-medium mb-1.5">{anchoQ?.label ?? "Ancho del entorno/borde"}</p>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-border focus-within:border-ink">
              <input
                type="text"
                inputMode="decimal"
                value={anchoEntorno}
                onChange={(e) => setAnchoEntorno(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-faint"
              />
              <span className="font-mono text-xs text-ink-muted flex-shrink-0">m</span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {anchoQ?.helpText ??
                "Indica cuánto quieres extender el entorno alrededor de la piscina, medido desde la cara exterior del vaso."}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">{terminacionQ?.label ?? "Terminación exterior"}</p>
            <div className="grid gap-2">
              {TERMINACION_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTerminacion(opt.key)}
                  className={`text-left rounded-xl px-4 py-3 border transition-colors ${
                    terminacion === opt.key ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
                  }`}
                >
                  <span className="font-medium text-[14px]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {isRadier && (
            <div>
              <p className="text-sm font-medium mb-1.5">{espesorRadierQ?.label ?? "Espesor del radier terminado"}</p>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-border focus-within:border-ink">
                <input
                  type="text"
                  inputMode="decimal"
                  value={espesorRadier}
                  onChange={(e) => setEspesorRadier(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-faint"
                />
                <span className="font-mono text-xs text-ink-muted flex-shrink-0">cm</span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                {espesorRadierQ?.helpText ?? "El espesor definitivo depende del uso, terreno y solución constructiva."}
              </p>
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-concrete px-3 py-2.5">
                <Info className="w-3.5 h-3.5 text-ink-faint flex-shrink-0 mt-0.5" />
                <p className="text-xs text-ink-faint">
                  Este radier ya es la terminación final -- no se pregunta por una base aparte.
                </p>
              </div>
            </div>
          )}

          {terminacion && !isRadier && (
            <div>
              <p className="text-sm font-medium mb-2">{baseExistenteQ?.label ?? "¿Ya existe una base firme/radier en el entorno?"}</p>
              <div className="grid gap-2">
                {BASE_EXISTENTE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setBaseExistente(opt.key)}
                    className={`text-left rounded-xl px-4 py-3 border transition-colors ${
                      baseExistente === opt.key ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
                    }`}
                  >
                    <span className="font-medium text-[14px]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isRadier && baseExistente === "no" && (
            <div>
              <p className="text-sm font-medium mb-1.5">{espesorBaseQ?.label ?? "Espesor de la base/radier"}</p>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-border focus-within:border-ink">
                <input
                  type="text"
                  inputMode="decimal"
                  value={espesorBase}
                  onChange={(e) => setEspesorBase(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-faint"
                />
                <span className="font-mono text-xs text-ink-muted flex-shrink-0">cm</span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                {espesorBaseQ?.helpText ?? "El espesor definitivo depende del uso, terreno y solución constructiva."}
              </p>
            </div>
          )}

          {!isRadier && (terminacion === "ceramica" || terminacion === "porcelanato") && (
            <div>
              <p className="text-sm font-medium mb-1.5">{perdidaQ?.label ?? "Margen / pérdida"}</p>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-border focus-within:border-ink">
                <input
                  type="text"
                  inputMode="decimal"
                  value={perdida}
                  onChange={(e) => setPerdida(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-faint"
                />
                <span className="font-mono text-xs text-ink-muted flex-shrink-0">%</span>
              </div>
              {compraConPerdida !== null && (
                <p className="mt-1 text-xs text-ink-faint">
                  Compra estimada: {formatQuantity(compraConPerdida)} m²
                </p>
              )}
            </div>
          )}

          {!isRadier && terminacion === "pastelones" && (
            <div>
              <p className="text-sm font-medium mb-2">{tamanoPastelonQ?.label ?? "Tamaño de pastelón"}</p>
              <div className="grid gap-2">
                {TAMANO_PASTELON_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTamanoPastelon(opt.key)}
                    className={`text-left rounded-xl px-4 py-3 border transition-colors ${
                      tamanoPastelon === opt.key ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
                    }`}
                  >
                    <span className="font-medium text-[14px]">{opt.label}</span>
                  </button>
                ))}
              </div>
              {pastelonesUnidades !== null && (
                <p className="mt-2 text-xs text-ink-faint">Unidades estimadas: {formatQuantity(pastelonesUnidades)}</p>
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

      <div className="hidden md:block order-2 rounded-2xl bg-[#F3F7FB] p-5 md:p-6">
        <PoolConfiguratorIllustration {...illustrationProps} />
      </div>
    </div>
  );
}
