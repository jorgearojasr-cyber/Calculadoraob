"use client";

import { useState } from "react";
import { ArrowRight, Check, Info } from "lucide-react";
import type { WizardQuestion } from "./types";
import { PoolConfiguratorLayout } from "./pool-configurator-layout";
import { PoolConfiguratorIllustration, type InteriorMaterial } from "./pool-configurator-illustration";
import { ReferenceHint } from "./reference-hint";

// Fase Pre-Producción — "Ayudas referenciales" (2026-09-04), secciones 5-7
// y 16: valores de referencia SOLO para una estimación inicial, nunca
// aplicados en silencio -- el usuario los aplica con un botón explícito y
// puede editarlos después como cualquier campo normal (ver ReferenceHint).
const PINTURA_MANOS_REFERENCIA = "3";
const PINTURA_RENDIMIENTO_REFERENCIA = "8";
const MARGEN_APLICACION_REFERENCIA = "10";
const PERDIDA_CORTES_REFERENCIA = "10";

// Paso "Interior" del configurador integral de Piscina (Fase C2,
// 2026-09-01) -- EXCLUSIVO de "piscina-integral", mismo criterio ya
// aprobado para FoundationStep: una geometría/UI que no encaja en el
// patrón genérico de QuestionGroupStep (acá: 2 superficies × 4
// terminaciones posibles, cada una con sus propios campos condicionales,
// más un toggle "misma terminación") se resuelve con un componente propio
// en vez de forzarlo dentro del framework genérico. El stepGroup
// "interior-termination" agrupa sus 13 Questions SIN visibleIfQuestionKey
// (a diferencia del resto del Module) -- la visibilidad condicional para
// RENDERIZAR el paso la decide este componente con su propio estado (no
// el mecanismo genérico de Question), porque necesita tener siempre
// disponibles los 13 objetos Question (label/unit/helpText) para poder
// revelarlos progresivamente sin perder esa información. La visibilidad
// para "Tu proyecto" (qué mostrar como respondido/pendiente, Fase C2.1) la
// resuelve `getInteriorActiveKeys` más abajo -- misma lógica, reutilizada
// desde module-wizard.tsx, no una copia.
//
// Persistencia: sigue siendo 100% el mecanismo genérico de respuestas del
// wizard -- `onAnswer` escribe las keys reales de cada Question al mismo
// objeto `answers` de siempre (mismo draft/recálculo/resumen que cualquier
// otro paso), sin estado paralelo fuera del wizard.
const INTERIOR_STEP_GROUP = "interior-termination";

export function isInteriorTerminationStepGroup(stepGroup: string | null | undefined): boolean {
  return stepGroup === INTERIOR_STEP_GROUP;
}

type MaterialKey = InteriorMaterial;

// Fase C2.1 (2026-09-01) -- fuente única de verdad de "qué preguntas de
// Interior son realmente relevantes ahora mismo", dado el estado real de
// `answers`. Se llama DESDE ACÁ (para decidir qué renderizar) Y desde
// module-wizard.tsx (para filtrar "Tu proyecto", ver `answersSummary`) --
// una sola función, no una lista duplicada a mano en 2 lugares que se
// puede desincronizar. No depende de Question.visibleIfQuestionKey porque
// el caso real es una condición COMPUESTA que el schema no puede expresar
// en una sola Question (ej. "campo de fondo visible SOLO SI misma=no Y
// terminacion-fondo=pintura" -- 2 keys distintas, visibleIfQuestionKey
// solo admite una).
//
// No cambia qué se ESCRIBE en `answers` (el motor de fórmulas sigue
// recibiendo exactamente los mismos valores que antes, sin tocar
// fórmulas) -- solo qué se MUESTRA. Cuando `misma==="si"`, los campos de
// fondo se escriben igual (los necesita el motor, ver `hormigon`/`area-*`
// condicionados por `terminacion-fondo`) pero NO se consideran "activos"
// acá -- así "Tu proyecto" no duplica la misma info 2 veces.
export function getInteriorActiveKeys(answers: Record<string, string | number | undefined>): Set<string> {
  const active = new Set<string>(["interior-misma-terminacion", "interior-terminacion-muros"]);
  const misma = ((answers["interior-misma-terminacion"] as string | undefined) ?? "no") === "si" ? "si" : "no";
  const materialMuros = answers["interior-terminacion-muros"] as MaterialKey | undefined;

  const addDetailKeys = (material: MaterialKey | undefined, suffix: "muros" | "fondo") => {
    if (material === "pintura") {
      active.add(`interior-pintura-manos-${suffix}`);
      active.add(`interior-pintura-rendimiento-${suffix}`);
      active.add(`interior-pintura-perdida-${suffix}`);
    } else if (material === "ceramica") {
      active.add(`interior-ceramica-perdida-${suffix}`);
    } else if (material === "membrana") {
      active.add(`interior-membrana-perdida-${suffix}`);
    }
  };
  addDetailKeys(materialMuros, "muros");

  if (misma === "no") {
    active.add("interior-terminacion-fondo");
    const materialFondo = answers["interior-terminacion-fondo"] as MaterialKey | undefined;
    addDetailKeys(materialFondo, "fondo");
  }

  return active;
}
const MATERIAL_OPTIONS: { key: MaterialKey; label: string }[] = [
  { key: "pintura", label: "Pintura para piscina" },
  { key: "ceramica", label: "Cerámica / mosaico" },
  { key: "membrana", label: "Membrana PVC (liner)" },
  { key: "sin-calcular", label: "Sin calcular" },
];

function toNumOrNull(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Encuentra la Question real (label/unit/helpText) por key -- los 13
// objetos siempre están en `questions` (sin visibleIf, ver arriba).
function findQuestion(questions: WizardQuestion[], key: string): WizardQuestion | undefined {
  return questions.find((q) => q.key === key);
}

function MaterialPicker({
  value,
  onChange,
}: {
  value: MaterialKey | undefined;
  onChange: (key: MaterialKey) => void;
}) {
  return (
    <div className="grid gap-2.5">
      {MATERIAL_OPTIONS.map((opt) => {
        const isSelected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`flex items-center justify-between text-left rounded-xl px-4 py-3 border transition-colors ${
              isSelected ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
            }`}
          >
            <span className="font-medium text-[14px]">{opt.label}</span>
            {isSelected && <Check className="w-4 h-4 text-safety flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

// Campo numérico simple (label + input + unidad) -- no reutiliza FieldRow
// porque ese componente asume un ícono de eje (horizontal/vertical) que no
// tiene sentido para "manos"/"rendimiento"/"pérdida"; estos 3 campos son
// solo números planos con su propia ayuda textual, mismo criterio de
// input que ConditionalRevealStep.
function NumberField({
  label,
  helpText,
  unit,
  value,
  onChange,
}: {
  label: string;
  helpText?: string | null;
  unit?: string | null;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-1.5">{label}</p>
      <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-border focus-within:border-ink">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-faint"
        />
        {unit && <span className="font-mono text-xs text-ink-muted flex-shrink-0">{unit}</span>}
      </div>
      {helpText && <p className="mt-1 text-xs text-ink-faint">{helpText}</p>}
    </div>
  );
}

// Campos condicionales de una superficie (muros o fondo) según el
// material elegido -- sección 7-10 del pedido C2: Pintura pide 3 datos
// (manos/rendimiento/pérdida), Cerámica y Membrana piden solo 1
// (pérdida), Sin calcular no pide nada. Ninguno trae un valor precargado
// (sección 8: "No precargar silenciosamente 2 manos/8 m²/L/10%").
function MaterialDetailFields({
  material,
  questions,
  suffix,
  manos,
  setManos,
  rendimiento,
  setRendimiento,
  perdidaPintura,
  setPerdidaPintura,
  perdidaCeramica,
  setPerdidaCeramica,
  perdidaMembrana,
  setPerdidaMembrana,
}: {
  material: MaterialKey | undefined;
  questions: WizardQuestion[];
  suffix: "muros" | "fondo";
  manos: string;
  setManos: (v: string) => void;
  rendimiento: string;
  setRendimiento: (v: string) => void;
  perdidaPintura: string;
  setPerdidaPintura: (v: string) => void;
  perdidaCeramica: string;
  setPerdidaCeramica: (v: string) => void;
  perdidaMembrana: string;
  setPerdidaMembrana: (v: string) => void;
}) {
  if (material === "pintura") {
    const manosQ = findQuestion(questions, `interior-pintura-manos-${suffix}`);
    const rendQ = findQuestion(questions, `interior-pintura-rendimiento-${suffix}`);
    const perdQ = findQuestion(questions, `interior-pintura-perdida-${suffix}`);
    return (
      <div className="mt-3 grid gap-3 pl-1">
        <NumberField
          label={manosQ?.label ?? "Número de manos"}
          helpText="Revisa el número de manos especificado para el producto."
          value={manos}
          onChange={setManos}
        />
        <NumberField
          label={rendQ?.label ?? "Rendimiento del producto"}
          unit="m²/L"
          helpText="Revisa el rendimiento indicado por el fabricante."
          value={rendimiento}
          onChange={setRendimiento}
        />
        {/* Fase Pre-Producción, secciones 5-6: un solo botón aplica manos +
            rendimiento juntos -- ambos campos siguen editables después. */}
        <ReferenceHint
          text="Como referencia inicial para una piscina nueva puedes considerar 3 manos y un rendimiento aprox. de 8 m²/L por mano. Revisa siempre la ficha técnica del producto elegido."
          actionLabel="Usar referencia de pintura (3 manos, 8 m²/L)"
          onApply={() => {
            setManos(PINTURA_MANOS_REFERENCIA);
            setRendimiento(PINTURA_RENDIMIENTO_REFERENCIA);
          }}
        />
        <div>
          <NumberField
            label={perdQ?.label ?? "Margen de aplicación (%)"}
            unit="%"
            helpText="Agrega un porcentaje extra para considerar pérdidas durante la aplicación. Ej: 10% significa que calcularemos una reserva adicional del 10%."
            value={perdidaPintura}
            onChange={setPerdidaPintura}
          />
          <ReferenceHint
            text="Como referencia puedes usar un margen del 10%."
            actionLabel="Usar 10%"
            onApply={() => setPerdidaPintura(MARGEN_APLICACION_REFERENCIA)}
          />
        </div>
      </div>
    );
  }
  if (material === "ceramica") {
    const perdQ = findQuestion(questions, `interior-ceramica-perdida-${suffix}`);
    return (
      <div className="mt-3 pl-1">
        <NumberField label={perdQ?.label ?? "Pérdida por cortes (%)"} unit="%" value={perdidaCeramica} onChange={setPerdidaCeramica} />
        <ReferenceHint
          text="Referencia para una instalación normal: 10%. Puede aumentar si existen muchos cortes, diagonales o patrones especiales."
          actionLabel="Usar 10%"
          onApply={() => setPerdidaCeramica(PERDIDA_CORTES_REFERENCIA)}
        />
      </div>
    );
  }
  if (material === "membrana") {
    const perdQ = findQuestion(questions, `interior-membrana-perdida-${suffix}`);
    return (
      <div className="mt-3 pl-1 grid gap-2">
        <NumberField label={perdQ?.label ?? "Margen de instalación (%)"} unit="%" value={perdidaMembrana} onChange={setPerdidaMembrana} />
        <div className="flex items-start gap-2 rounded-lg bg-concrete px-3 py-2.5">
          <Info className="w-3.5 h-3.5 text-ink-faint flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-faint">
            Membrana PVC (liner) es un revestimiento flexible instalado sobre el vaso. No corresponde a una piscina de fibra
            de vidrio. La cantidad final depende del formato de rollo y sistema de instalación.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function InteriorTerminationStep({
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

  // Arranca en "no" (no "undefined") a propósito: el checkbox visualmente
  // empieza destildado, que YA es "no misma terminación" para el usuario
  // -- si el estado interno se quedara en undefined hasta el primer click,
  // la sección de Fondo sería inalcanzable sin antes marcar y desmarcar el
  // checkbox (bug real encontrado al probar el flujo real en el navegador).
  const [misma, setMisma] = useState<"si" | "no">(
    (initialValues["interior-misma-terminacion"] as "si" | "no" | undefined) ?? "no"
  );
  const [materialMuros, setMaterialMuros] = useState<MaterialKey | undefined>(
    (initialValues["interior-terminacion-muros"] as MaterialKey | undefined) ?? undefined
  );
  const [materialFondo, setMaterialFondo] = useState<MaterialKey | undefined>(
    (initialValues["interior-terminacion-fondo"] as MaterialKey | undefined) ?? undefined
  );

  const [manosMuros, setManosMuros] = useState(initStr("interior-pintura-manos-muros"));
  const [rendMuros, setRendMuros] = useState(initStr("interior-pintura-rendimiento-muros"));
  const [perdPinturaMuros, setPerdPinturaMuros] = useState(initStr("interior-pintura-perdida-muros"));
  const [perdCeramicaMuros, setPerdCeramicaMuros] = useState(initStr("interior-ceramica-perdida-muros"));
  const [perdMembranaMuros, setPerdMembranaMuros] = useState(initStr("interior-membrana-perdida-muros"));

  const [manosFondo, setManosFondo] = useState(initStr("interior-pintura-manos-fondo"));
  const [rendFondo, setRendFondo] = useState(initStr("interior-pintura-rendimiento-fondo"));
  const [perdPinturaFondo, setPerdPinturaFondo] = useState(initStr("interior-pintura-perdida-fondo"));
  const [perdCeramicaFondo, setPerdCeramicaFondo] = useState(initStr("interior-ceramica-perdida-fondo"));
  const [perdMembranaFondo, setPerdMembranaFondo] = useState(initStr("interior-membrana-perdida-fondo"));

  const [error, setError] = useState<string | null>(null);

  // Dimensiones ya respondidas en Medidas/Estructura -- se leen del mismo
  // `initialValues` acumulado que VolumeStep usa para `sourceDimensionKeys`
  // (ver module-visual-config.ts), con las keys literales de este Module
  // (no hay Question nueva que las duplique).
  const forma = initialValues["que-forma-tendra-tu-piscina"];
  const isCircular = forma === "circular";
  const toNum = (v: string | number | undefined): number | null => {
    if (v === undefined) return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const handleSetMisma = (value: "si" | "no") => {
    setMisma(value);
    if (value === "si") setMaterialFondo(materialMuros);
  };

  const handleSetMaterialMuros = (key: MaterialKey) => {
    setMaterialMuros(key);
    if (misma === "si") setMaterialFondo(key);
  };

  const validateDetail = (
    material: MaterialKey | undefined,
    manos: string,
    rend: string,
    perdPintura: string,
    perdCeramica: string,
    perdMembrana: string,
    surfaceLabel: string
  ): string | null => {
    if (material === "pintura") {
      const manosN = toNumOrNull(manos);
      const rendN = toNumOrNull(rend);
      const perdN = toNumOrNull(perdPintura);
      if (manosN === null || manosN <= 0) return `${surfaceLabel}: ingresa un número de manos mayor que 0.`;
      if (rendN === null || rendN <= 0) return `${surfaceLabel}: ingresa un rendimiento mayor que 0.`;
      if (perdN === null || perdN < 0) return `${surfaceLabel}: la pérdida no puede ser negativa.`;
    } else if (material === "ceramica") {
      const perdN = toNumOrNull(perdCeramica);
      if (perdN === null || perdN < 0) return `${surfaceLabel}: la pérdida de instalación no puede ser negativa.`;
    } else if (material === "membrana") {
      const perdN = toNumOrNull(perdMembrana);
      if (perdN === null || perdN < 0) return `${surfaceLabel}: el margen/pérdida no puede ser negativo.`;
    }
    return null;
  };

  const handleSubmit = () => {
    if (!materialMuros) {
      setError("Elige una terminación para los muros.");
      return;
    }
    const effectiveFondo = misma === "si" ? materialMuros : materialFondo;
    if (!effectiveFondo) {
      setError("Elige una terminación para el fondo.");
      return;
    }

    const muroErr = validateDetail(materialMuros, manosMuros, rendMuros, perdPinturaMuros, perdCeramicaMuros, perdMembranaMuros, "Muros");
    if (muroErr) {
      setError(muroErr);
      return;
    }
    const fondoErr = misma === "si"
      ? validateDetail(effectiveFondo, manosMuros, rendMuros, perdPinturaMuros, perdCeramicaMuros, perdMembranaMuros, "Fondo")
      : validateDetail(effectiveFondo, manosFondo, rendFondo, perdPinturaFondo, perdCeramicaFondo, perdMembranaFondo, "Fondo");
    if (fondoErr) {
      setError(fondoErr);
      return;
    }

    setError(null);

    // Si "misma" está activo, el fondo adopta EXACTAMENTE la selección y
    // los valores de muros (sección 6: "fondo adopta la misma selección")
    // -- se escriben ambos juegos de keys reales para que el motor de
    // fórmulas (condicionado por `interior-terminacion-fondo`) calcule
    // fondo con los mismos datos, sin duplicar lógica en el DSL.
    const values: Record<string, string | number> = {
      "interior-misma-terminacion": misma,
      "interior-terminacion-muros": materialMuros,
      "interior-terminacion-fondo": effectiveFondo,
    };
    const applyDetail = (
      target: "muros" | "fondo",
      material: MaterialKey,
      manos: string,
      rend: string,
      perdPintura: string,
      perdCeramica: string,
      perdMembrana: string
    ) => {
      if (material === "pintura") {
        values[`interior-pintura-manos-${target}`] = Number(manos.replace(",", "."));
        values[`interior-pintura-rendimiento-${target}`] = Number(rend.replace(",", "."));
        values[`interior-pintura-perdida-${target}`] = Number(perdPintura.replace(",", "."));
      } else if (material === "ceramica") {
        values[`interior-ceramica-perdida-${target}`] = Number(perdCeramica.replace(",", "."));
      } else if (material === "membrana") {
        values[`interior-membrana-perdida-${target}`] = Number(perdMembrana.replace(",", "."));
      }
    };
    applyDetail("muros", materialMuros, manosMuros, rendMuros, perdPinturaMuros, perdCeramicaMuros, perdMembranaMuros);
    if (misma === "si") {
      applyDetail("fondo", materialMuros, manosMuros, rendMuros, perdPinturaMuros, perdCeramicaMuros, perdMembranaMuros);
    } else {
      applyDetail("fondo", effectiveFondo, manosFondo, rendFondo, perdPinturaFondo, perdCeramicaFondo, perdMembranaFondo);
    }

    onAnswer(values);
  };

  const illustrationProps = isCircular
    ? {
        state: "interior" as const,
        shape: "circular" as const,
        diametro: toNum(initialValues["diametro-interior-metros"]),
        profundidad: toNum(initialValues["profundidad-interior-metros-circular"]),
        espesorMuroCm: toNum(initialValues["espesor-de-los-muros-cm-circular"]),
        espesorFondoCm: toNum(initialValues["espesor-del-fondo-losa-cm-circular"]),
        materialMuros: materialMuros ?? null,
        materialFondo: (misma === "si" ? materialMuros : materialFondo) ?? null,
      }
    : {
        state: "interior" as const,
        shape: "rectangular" as const,
        largo: toNum(initialValues["largo-interior-metros"]),
        ancho: toNum(initialValues["ancho-interior-metros"]),
        profundidad: toNum(initialValues["profundidad-interior-metros"]),
        espesorMuroCm: toNum(initialValues["espesor-de-los-muros-cm"]),
        espesorFondoCm: toNum(initialValues["espesor-del-fondo-losa-cm"]),
        materialMuros: materialMuros ?? null,
        materialFondo: (misma === "si" ? materialMuros : materialFondo) ?? null,
      };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-8 grid md:grid-cols-[1fr_1.4fr] md:gap-10 md:items-start">
      <div className="order-1">
        <PoolConfiguratorLayout activeBlock="Interior" />

        <div className="md:hidden mb-5 rounded-2xl bg-[#F3F7FB] p-4">
          <PoolConfiguratorIllustration {...illustrationProps} />
        </div>

        <div className="grid gap-6">
          <div>
            <p className="text-sm font-semibold mb-2.5">Terminación de los muros</p>
            <MaterialPicker value={materialMuros} onChange={handleSetMaterialMuros} />
            <MaterialDetailFields
              material={materialMuros}
              questions={questions}
              suffix="muros"
              manos={manosMuros}
              setManos={setManosMuros}
              rendimiento={rendMuros}
              setRendimiento={setRendMuros}
              perdidaPintura={perdPinturaMuros}
              setPerdidaPintura={setPerdPinturaMuros}
              perdidaCeramica={perdCeramicaMuros}
              setPerdidaCeramica={setPerdCeramicaMuros}
              perdidaMembrana={perdMembranaMuros}
              setPerdidaMembrana={setPerdMembranaMuros}
            />
          </div>

          <label className="flex items-center gap-2.5 rounded-xl bg-concrete px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={misma === "si"}
              onChange={(e) => handleSetMisma(e.target.checked ? "si" : "no")}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Usar la misma terminación en muros y fondo</span>
          </label>

          {misma === "no" && (
            <div>
              <p className="text-sm font-semibold mb-2.5">Terminación del fondo</p>
              <MaterialPicker value={materialFondo} onChange={setMaterialFondo} />
              <MaterialDetailFields
                material={materialFondo}
                questions={questions}
                suffix="fondo"
                manos={manosFondo}
                setManos={setManosFondo}
                rendimiento={rendFondo}
                setRendimiento={setRendFondo}
                perdidaPintura={perdPinturaFondo}
                setPerdidaPintura={setPerdPinturaFondo}
                perdidaCeramica={perdCeramicaFondo}
                setPerdidaCeramica={setPerdCeramicaFondo}
                perdidaMembrana={perdMembranaFondo}
                setPerdidaMembrana={setPerdMembranaFondo}
              />
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
