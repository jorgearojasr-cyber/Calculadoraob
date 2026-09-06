"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { WizardQuestion } from "./types";
import { formatQuantity } from "@/lib/format-number";
import { skimmersReferenciaOrientativa } from "./result-screen-helpers";
import { PoolConfiguratorLayout } from "./pool-configurator-layout";
import { CollapsibleHelp } from "./collapsible-help";

// Paso "Equipamiento" del configurador integral de Piscina (Fase C5,
// 2026-09-02) -- EXCLUSIVO de "piscina-integral", mismo criterio ya
// aprobado para PoolExcavationStep/PoolEnvironmentStep: geometría/UI
// propia que no encaja en QuestionGroupStep genérico.
//
// Alcance DELIBERADAMENTE acotado (sección 1 del pedido C5): esto NO es
// diseño hidráulico. El usuario responde UNA sola pregunta nueva (tiempo
// de recirculación, 6h/8h, sin default silencioso) -- Bomba/Filtro/
// Skimmers/Retornos NO son preguntas, son criterios de selección fijos
// (mismo texto que ya quedó en fase-c5-piscina-integral-equipamiento.ts
// como InfoResult), así que este componente los muestra tal cual, sin
// pedirle nada al usuario sobre ellos.
//
// Sin ilustración propia a propósito (sección 18 del pedido: "no dar una
// falsa sensación de diseño hidráulico" dibujando bomba/filtro/tuberías)
// -- el foco queda en el panel, igual que el resto de los pasos ya
// concentra su explicación en texto + preview numérico, no en el dibujo.
const EQUIPMENT_STEP_GROUP = "equipment";

export function isEquipmentStepGroup(stepGroup: string | null | undefined): boolean {
  return stepGroup === EQUIPMENT_STEP_GROUP;
}

type Horas = "6" | "8";

function findQuestion(questions: WizardQuestion[], key: string): WizardQuestion | undefined {
  return questions.find((q) => q.key === key);
}

function toNum(v: string | number | undefined): number | null {
  if (v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const HORAS_OPTIONS: { key: Horas; label: string }[] = [
  { key: "6", label: "6 horas" },
  { key: "8", label: "8 horas" },
];

// Criterios fijos -- MISMO texto exacto que fase-c5-piscina-integral-
// equipamiento.ts (Variables "equipamiento-bomba-criterio"/"-skimmers-
// criterio"/"-retornos-criterio"). No son preguntas, así que no hay
// Question.label que leer -- se muestran tal cual, igual que cualquier
// criterio informativo fijo del catálogo (ver RefuerzoCard para el
// precedente de texto fijo mostrado sin pregunta asociada).
// Fase C7-B (2026-09-05) -- copy práctico ("qué debo buscar/comprar"),
// Etapa A sección 16/21 aprobada: mismo criterio técnico de siempre
// (nunca HP, modelo, marca, ni TDH único), solo más orientado a la acción
// de compra.
const BOMBA_CRITERIO =
  "Busca una bomba cuya curva de funcionamiento entregue al menos el caudal objetivo en las condiciones reales de tu instalación (altura manométrica y pérdidas de carga incluidas).";
// Fase C7 (2026-09-04) -- basado en la investigación técnica aprobada
// (sección 8/14 del pedido): un rango EDUCATIVO de altura manométrica
// total (TDH) para instalaciones residenciales, nunca un TDH calculado
// para "esta" instalación (depende de tuberías/longitud/diámetro/
// accesorios/desnivel/filtro, ninguno de los cuales pide la app). No
// recomienda HP ni modelo.
const BOMBA_TDH_EDUCATIVO =
  "Como referencia educativa, muchas instalaciones residenciales trabajan en un rango aproximado de 8–14 m de altura manométrica total (TDH). Este rango es solo orientativo: el TDH real depende del trazado, diámetro de tuberías, accesorios, desniveles y filtro de tu instalación.";
const FILTRO_CRITERIO = "Busca un filtro con caudal nominal de al menos el caudal objetivo. Revisa el caudal nominal indicado por el fabricante.";
// Fase C7-B, sección 23-24 del pedido (Etapa A aprobada): referencia
// ORIENTATIVA de industria internacional según superficie de agua -- NUNCA
// presentada como cálculo normativo chileno. El número exacto se agrega en
// el render (usa `skimmersReferenciaOrientativa`, ver result-screen-
// helpers.ts) porque depende de la superficie ya calculada, que este
// componente recibe como preview -- el criterio cualitativo de abajo
// queda siempre visible, con o sin superficie disponible todavía.
const SKIMMERS_CRITERIO =
  "La cantidad depende de la superficie, geometría, circulación y ubicación de los retornos.";
const SKIMMERS_DISCLAIMER =
  "Referencia orientativa de industria internacional. La cantidad y ubicación definitiva deben validarse con el instalador y la normativa aplicable.";
const RETORNOS_CRITERIO =
  "Los retornos devuelven el agua filtrada a la piscina y ayudan a generar una circulación uniforme. La cantidad y ubicación deben definirse según la geometría, el caudal y el diseño hidráulico.";

export function PoolEquipmentStep({
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
  const [horas, setHoras] = useState<Horas | undefined>(
    (initialValues["equipamiento-tiempo-recirculacion-h"] as Horas | undefined) ?? undefined
  );
  const [error, setError] = useState<string | null>(null);

  // Dimensiones ya respondidas en Medidas -- mismas keys literales que
  // usan VolumeStep/PoolExcavationStep/PoolEnvironmentStep, leídas del
  // mismo `initialValues` acumulado. Volumen de agua calculado EN VIVO
  // acá solo como preview -- MISMA fórmula exacta que fase-c4-2-piscina-
  // integral-consolidacion.ts ("agua-volumen-m3-rect"/"-circ"), el
  // resultado real que llega a ResultScreen lo sigue calculando el motor
  // contra esos mismos Formula rows (sección 3 del pedido C5: nunca se
  // recalcula el agua en paralelo, esto es puramente un espejo del MISMO
  // cálculo para mostrarlo antes de enviar).
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

  const caudalM3h = aguaVolumenM3 !== null && horas ? aguaVolumenM3 / Number(horas) : null;

  // Fase C7-B, sección 23-24 (Etapa A aprobada): superficie de agua para la
  // referencia orientativa de Skimmers -- MISMA geometría que "area-fondo"
  // (fase-c2-piscina-integral-terminacion.ts), calculada acá en preview sin
  // duplicar el motor.
  const areaAguaM2 = isCircular
    ? diametro !== null
      ? Math.PI * (diametro / 2) ** 2
      : null
    : largo !== null && ancho !== null
      ? largo * ancho
      : null;
  const skimmersRef = areaAguaM2 !== null ? skimmersReferenciaOrientativa(areaAguaM2) : null;

  const horasQ = findQuestion(questions, "equipamiento-tiempo-recirculacion-h");

  const handleSubmit = () => {
    if (!horas) {
      setError("Elige el tiempo de recirculación considerado (6 u 8 horas).");
      return;
    }
    setError(null);
    onAnswer({ "equipamiento-tiempo-recirculacion-h": horas });
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8">
      <PoolConfiguratorLayout activeBlock="Equipamiento" />

      <div className="rounded-2xl bg-concrete px-5 py-4 mb-5">
        <p className="text-sm text-ink-muted">
          Tu piscina contiene{" "}
          {aguaVolumenLitros !== null ? (
            <span className="font-semibold text-ink">{formatQuantity(Math.round(aguaVolumenLitros))} L</span>
          ) : (
            "—"
          )}
          {aguaVolumenM3 !== null && <span className="text-ink-faint"> ({formatQuantity(aguaVolumenM3)} m³)</span>}.
        </p>
        {caudalM3h !== null && horas && (
          <>
            {/* Fase C7-B, sección 19/20 del pedido: traducir el caudal en
                vez de solo mostrarlo -- "¿qué significa esto?" antes del
                bloque CAUDAL OBJETIVO destacado. */}
            <p className="text-sm text-ink-muted mt-2">
              Para recircularla en {horas} horas, el sistema debe mover aproximadamente{" "}
              <span className="font-semibold text-ink">{formatQuantity(caudalM3h)} m³/h</span>.
            </p>
            <div className="mt-3 rounded-xl bg-white border border-border px-4 py-3">
              <p className="font-mono text-xs uppercase tracking-wider text-ink-faint mb-1">Caudal objetivo</p>
              <p className="font-display text-2xl font-semibold text-ink">{formatQuantity(caudalM3h)} m³/h</p>
              <p className="text-xs text-ink-faint mt-2">
                ¿Qué significa esto? Busca una bomba y un filtro capaces de trabajar con este caudal en las
                condiciones reales de tu instalación.
              </p>
              {/* Fase C7-C (2026-09-05, sección 2 del pedido) -- ejemplo
                  concreto en L/h, sin nueva fórmula (mismo caudalM3h × 1000
                  ya calculado arriba). */}
              <div className="mt-2">
                <CollapsibleHelp label="¿Qué significa?" ariaLabel="Qué significa el caudal objetivo">
                  <p className="text-xs text-ink-muted">
                    Es la cantidad de agua que el sistema debe mover aproximadamente cada hora para recircular todo
                    el volumen de la piscina en el tiempo seleccionado. Ejemplo: {formatQuantity(caudalM3h)} m³/h
                    significa mover unos {formatQuantity(Math.round(caudalM3h * 1000))} litros por hora.
                  </p>
                </CollapsibleHelp>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-5">
        <div>
          <p className="text-sm font-medium mb-2">{horasQ?.label ?? "Tiempo de recirculación considerado"}</p>
          <div className="grid gap-2">
            {HORAS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setHoras(opt.key)}
                className={`text-left rounded-xl px-4 py-3 border transition-colors ${
                  horas === opt.key ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
                }`}
              >
                <span className="font-medium text-[14px]">{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            {horasQ?.helpText ??
              "Es el tiempo considerado para hacer pasar aproximadamente todo el volumen de agua por el sistema de filtración."}
          </p>
          {/* Fase C7-C, sección 3 del pedido -- comparación sin afirmar que
              una opción sea universalmente mejor. */}
          <div className="mt-1.5">
            <CollapsibleHelp label="¿6 u 8 horas?" ariaLabel="Diferencia entre 6 y 8 horas de recirculación">
              <p className="text-xs text-ink-muted">
                Es el tiempo considerado para que aproximadamente todo el volumen de agua pase una vez por el
                sistema de filtración. 6 h exige mayor caudal que 8 h.
              </p>
            </CollapsibleHelp>
          </div>
        </div>

        {/* Criterios de selección -- sin cifra inventada (sección 1/28 del
            pedido C5): Bomba, Skimmers y Retornos son SIEMPRE el mismo
            texto informativo, sin importar las respuestas anteriores.
            Filtro sí muestra el caudal objetivo (mismo valor de arriba),
            porque es el criterio real de selección de un filtro. */}
        <div className="grid gap-3">
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-sm font-semibold mb-1">Bomba</p>
            <p className="text-xs text-ink-muted">{BOMBA_CRITERIO}</p>
            <p className="text-xs text-ink-muted mt-2">{BOMBA_TDH_EDUCATIVO}</p>
            {/* Fase C7-C, sección 4 del pedido -- este concepto es
                obligatorio explicar. La definición ("qué es TDH") es nueva;
                el rango 8-14m y "depende de la instalación" ya están arriba
                sin duplicarse acá. */}
            <div className="mt-2">
              <CollapsibleHelp label="¿Qué es TDH?" ariaLabel="Qué es la altura manométrica total (TDH)">
                <p className="text-xs text-ink-muted">
                  La altura manométrica total representa la resistencia que la bomba debe vencer para mover el agua
                  por tuberías, codos, válvulas, filtro y desniveles.
                </p>
              </CollapsibleHelp>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-sm font-semibold mb-1">Filtro</p>
            <p className="text-xs text-ink-muted">{FILTRO_CRITERIO}</p>
            {/* Fase C7-C, sección 5 del pedido. */}
            <div className="mt-2">
              <CollapsibleHelp label="¿Qué es el caudal nominal?" ariaLabel="Qué es el caudal nominal del filtro">
                <p className="text-xs text-ink-muted">
                  Es la cantidad de agua que el fabricante indica que el filtro puede procesar por hora. Debe ser al
                  menos igual al caudal objetivo calculado.
                </p>
              </CollapsibleHelp>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-sm font-semibold mb-1">Skimmers</p>
            {skimmersRef !== null ? (
              <p className="text-sm font-medium mb-1">
                Como referencia orientativa, para una piscina de esta superficie podrías considerar aproximadamente{" "}
                {skimmersRef} {skimmersRef === "1" ? "skimmer" : "skimmers"}.
              </p>
            ) : (
              areaAguaM2 !== null && <p className="text-sm font-medium mb-1">Definir según diseño hidráulico.</p>
            )}
            <p className="text-xs text-ink-muted">{SKIMMERS_CRITERIO}</p>
            {skimmersRef !== null && <p className="text-xs text-ink-faint mt-2">{SKIMMERS_DISCLAIMER}</p>}
            {/* Fase C7-C, sección 12 del pedido -- "qué es", sin repetir el
                disclaimer ya visible arriba. */}
            <div className="mt-2">
              <CollapsibleHelp label="¿Qué es un skimmer?" ariaLabel="Qué es un skimmer">
                <p className="text-xs text-ink-muted">
                  El skimmer toma agua principalmente desde la superficie y ayuda a retirar hojas, insectos y
                  suciedad flotante antes de la filtración.
                </p>
              </CollapsibleHelp>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-sm font-semibold mb-1">Retornos</p>
            <p className="text-xs text-ink-muted">{RETORNOS_CRITERIO}</p>
            {/* Fase C7-C, sección 13 del pedido -- sin mostrar cantidad. */}
            <div className="mt-2">
              <CollapsibleHelp label="¿Qué son los retornos?" ariaLabel="Qué son los retornos">
                <p className="text-xs text-ink-muted">
                  Son las boquillas por donde el agua filtrada vuelve a la piscina. Su ubicación ayuda a generar
                  circulación y evitar zonas con poco movimiento.
                </p>
              </CollapsibleHelp>
            </div>
          </div>
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
  );
}
