"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { WizardQuestion } from "./types";
import { formatQuantity, formatClp } from "@/lib/format-number";
import { pluralizeUnit } from "@/lib/pluralize";
import { calculateModuleAction } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";
import { getCostsActiveKeys } from "./pool-costs-active-keys";

// Paso "Costos" del configurador integral de Piscina (Fase C6,
// 2026-09-02) -- EXCLUSIVO de "piscina-integral", mismo criterio ya
// aprobado para PoolExcavationStep/PoolEnvironmentStep/PoolEquipmentStep:
// geometría/UI propia que no encaja en QuestionGroupStep genérico.
//
// Alcance DELIBERADAMENTE acotado (sección 1/2/3 del pedido C6): valoriza
// SOLO cantidades que el motor YA calculó -- nunca mano de obra, nunca
// Equipamiento, nunca m³ de excavación (solo viajes). Todos los precios
// son preguntas NUMBER opcionales -- el usuario puede dejarlas todas en
// blanco y avanzar igual (sección 18: "no bloquear ResultScreen porque
// falte un precio").
//
// Diferencia clave con el resto de los pasos custom de este módulo: acá
// SÍ se llama a `calculateModuleAction` (la misma server action que ya
// usa el wizard para el cálculo final) DURANTE el paso, no solo al
// terminar -- es la única forma de mostrar "cantidad × precio = subtotal"
// en vivo (sección 23) sin reimplementar en JS media docena de fórmulas
// complejas (hormigón, excavación, entorno) en paralelo, lo que sí
// arriesgaría una divergencia con el motor real. Este llamado es de solo
// lectura (no escribe nada) y usa exactamente las respuestas acumuladas
// hasta ahora (sin los precios de Costos, que todavía no se han
// respondido) -- el cálculo FINAL real sigue ocurriendo, sin cambios,
// cuando este paso hace onAnswer() y el wizard avanza al resultado.
const COSTS_STEP_GROUP = "costs";

export function isCostsStepGroup(stepGroup: string | null | undefined): boolean {
  return stepGroup === COSTS_STEP_GROUP;
}

// Mismas 10 partidas que costosConfig (module-visual-config.ts) --
// duplicado deliberado y mínimo (nombre + unidad + Formula.key de
// cantidad + Question.key de precio): ese archivo es sobre CÓMO se
// renderiza ResultScreen después, este es sobre CÓMO se pide el precio
// durante el paso -- ambos deben coincidir exactamente con
// fase-c6-piscina-integral-costos.ts, que es la fuente real de verdad
// (motor).
const PARTIDAS = [
  { quantityKey: "hormigon-total", priceQuestionKey: "costos-precio-hormigon-m3", label: "Hormigón de estructura" },
  { quantityKey: "excavacion-viajes", priceQuestionKey: "costos-precio-retiro-viaje", label: "Retiro de tierra" },
  { quantityKey: "costos-pintura-cantidad-litros", priceQuestionKey: "costos-precio-pintura-litro", label: "Pintura interior" },
  { quantityKey: "costos-ceramica-cantidad-m2", priceQuestionKey: "costos-precio-ceramica-interior-m2", label: "Cerámica/mosaico interior" },
  { quantityKey: "costos-membrana-cantidad-m2", priceQuestionKey: "costos-precio-membrana-m2", label: "Membrana interior" },
  { quantityKey: "entorno-volumen-base", priceQuestionKey: "costos-precio-base-entorno-m3", label: "Hormigón base/radier del entorno" },
  { quantityKey: "entorno-volumen-radier-terminado", priceQuestionKey: "costos-precio-radier-terminado-m3", label: "Radier/hormigón terminado del entorno" },
  { quantityKey: "entorno-ceramica-m2-compra", priceQuestionKey: "costos-precio-ceramica-entorno-m2", label: "Cerámica exterior del entorno" },
  { quantityKey: "entorno-porcelanato-m2-compra", priceQuestionKey: "costos-precio-porcelanato-entorno-m2", label: "Porcelanato exterior del entorno" },
  { quantityKey: "entorno-pastelones-unidades", priceQuestionKey: "costos-precio-pastelon-unidad", label: "Pastelones del entorno" },
] as const;

// "" -> sin precio ingresado (se omite del payload, nunca $0 inventado).
// Cualquier número finito >= 0 (incluido 0 explícito, sección 19/49) es
// válido. Negativo o no numérico -> inválido (sección 50: "no permitir
// negativos").
function parsePriceInput(raw: string): { value: number | null; invalid: boolean } {
  const trimmed = raw.trim();
  if (trimmed === "") return { value: null, invalid: false };
  const num = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(num) || num < 0) return { value: null, invalid: true };
  return { value: num, invalid: false };
}

export function PoolCostsStep({
  questions,
  initialValues,
  moduleId,
  onAnswer,
  onSaveForLater,
}: {
  questions: WizardQuestion[];
  initialValues: Record<string, string | number | undefined>;
  moduleId: string;
  onAnswer: (values: Record<string, string | number>) => void;
  onSaveForLater?: () => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, number> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      PARTIDAS.map((p) => [p.priceQuestionKey, initialValues[p.priceQuestionKey] != null ? String(initialValues[p.priceQuestionKey]) : ""])
    )
  );
  const [error, setError] = useState<string | null>(null);

  // Vista previa de solo lectura -- ver comentario de arriba. `initialValues`
  // cambia de referencia en cada respuesta del wizard, así que basta con
  // depender de él para recalcular la vista previa si el usuario vuelve
  // atrás y cambia algo (medidas, terminaciones, etc.) antes de llegar acá
  // de nuevo.
  useEffect(() => {
    let cancelled = false;
    setQuantities(null);
    setLoadError(false);
    calculateModuleAction(moduleId, initialValues as Record<string, string | number>)
      .then((result) => {
        if (cancelled) return;
        const map: Record<string, number> = {};
        for (const r of result.results) map[r.key] = r.value;
        setQuantities(map);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, JSON.stringify(initialValues)]);

  const findQuestion = (key: string) => questions.find((q) => q.key === key);

  const handlePriceChange = (key: string, value: string) => {
    setPrices((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const payload: Record<string, string | number> = {};
    for (const p of PARTIDAS) {
      const raw = prices[p.priceQuestionKey] ?? "";
      const { value, invalid } = parsePriceInput(raw);
      if (invalid) {
        setError("Revisa los precios ingresados: no pueden ser negativos.");
        return;
      }
      if (value !== null) payload[p.priceQuestionKey] = value;
    }
    setError(null);
    onAnswer(payload);
  };

  // Fase C6.1 -- la aplicabilidad de una partida la decide getCostsActiveKeys
  // (misma lógica que "Tu proyecto"), NO la presencia de su cantidad en la
  // vista previa: si el precio calculado (`quantities`) todavía no cargó o
  // falló (`loadError`), la partida sigue mostrándose (con "—" en la
  // cantidad hasta que llegue) en vez de desaparecer -- sección 4 del
  // pedido C6.1 ("verificar el comportamiento si no existiera cantidad
  // válida").
  const activeKeys = getCostsActiveKeys(initialValues);
  const applicablePartidas = PARTIDAS.filter((p) => activeKeys.has(p.priceQuestionKey));

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8">
      {/* Fase C6, sección 21/22 del pedido -- decisión de tracker: NO se
          agrega "Costos" como 7º bloque de PoolConfiguratorLayout (el
          tracker de 6 bloques ya ocupa 3 líneas en mobile, confirmado en
          C5.1 -- un 7º bloque lo empujaría más allá del rango aceptable
          sin necesidad real, ya que Costos no es un bloque CONSTRUCTIVO
          más, es una fase de valorización posterior). Se usa en cambio un
          encabezado propio, distinto del tracker técnico -- "configura tu
          piscina" queda cerrado, esto se siente como el paso siguiente,
          no como un 7º ítem de la misma lista. */}
      <div className="mb-5">
        <p className="font-mono text-xs uppercase tracking-wider text-safety mb-2">Configuración técnica completa</p>
        <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight">Valoriza tu proyecto</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Ingresa tus propios precios para las partidas que ya calculamos — es opcional, puedes ver tu resultado sin costos.
        </p>
      </div>

      {quantities === null && !loadError && <p className="text-sm text-ink-muted">Cargando cantidades…</p>}
      {loadError && (
        <p className="text-sm text-safety mb-4">
          No pudimos cargar las cantidades para previsualizar el costo. Puedes seguir ingresando precios igual — se calcularán
          al ver el resultado.
        </p>
      )}

      {applicablePartidas.length === 0 && (
        <p className="text-sm text-ink-muted mb-4">
          Ninguna de las partidas valorizables aplica todavía a tu configuración (por ejemplo, si elegiste &quot;Sin
          calcular&quot; en terminaciones). Puedes avanzar igual.
        </p>
      )}

      <div className="grid gap-4">
        {applicablePartidas.map((p) => {
          const question = findQuestion(p.priceQuestionKey);
          const cantidad = quantities?.[p.quantityKey];
          const priceStr = prices[p.priceQuestionKey] ?? "";
          const { value: priceNum } = parsePriceInput(priceStr);
          const subtotal = cantidad !== undefined && priceNum !== null ? cantidad * priceNum : null;
          // unit viene del Formula.key real (ver fase-c6-piscina-integral-
          // costos.ts) -- se toma del label de la pregunta de precio para
          // no depender de un mapa unit-por-key duplicado acá; el helpText
          // de la pregunta (cuando existe, ej. Hormigón) se muestra tal
          // cual, sin reinventarlo.
          const unit = quantityUnitFor(p.quantityKey);
          return (
            <div key={p.quantityKey} className="rounded-xl border border-border bg-white px-4 py-3">
              <p className="text-sm font-semibold mb-1">{p.label}</p>
              {cantidad !== undefined && (
                <p className="text-xs text-ink-muted mb-2">
                  {formatQuantity(cantidad)} {pluralizeUnit(cantidad, unit)}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs text-ink-muted flex items-center gap-2">
                  {question?.label ?? "Precio ($)"}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={priceStr}
                    onChange={(e) => handlePriceChange(p.priceQuestionKey, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="w-28 rounded-lg px-2 py-1 border border-border text-sm outline-none focus:border-ink"
                  />
                </label>
                {subtotal !== null && <span className="ml-auto text-sm font-semibold">Subtotal: {formatClp(subtotal)}</span>}
              </div>
              {question?.helpText && <p className="mt-1.5 text-[11px] text-ink-faint">{question.helpText}</p>}
            </div>
          );
        })}
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

// Unidad de cada cantidad -- copia deliberada y mínima de los Formula.unit
// reales (ver fase-c6-piscina-integral-costos.ts) para no depender de que
// la vista previa (`calculateModuleAction`) devuelva la unidad (solo
// devuelve value/label/unit por Formula, así que en rigor SÍ está
// disponible ahí -- pero como este mapa es fijo y ya lo es el resto del
// componente PARTIDAS, se mantiene la misma convención simple).
function quantityUnitFor(quantityKey: string): string {
  switch (quantityKey) {
    case "hormigon-total":
    case "entorno-volumen-base":
    case "entorno-volumen-radier-terminado":
      return "m³";
    case "excavacion-viajes":
      return "viaje";
    case "costos-pintura-cantidad-litros":
      return "L";
    case "costos-ceramica-cantidad-m2":
    case "costos-membrana-cantidad-m2":
    case "entorno-ceramica-m2-compra":
    case "entorno-porcelanato-m2-compra":
      return "m²";
    case "entorno-pastelones-unidades":
      return "unidad";
    default:
      return "";
  }
}
