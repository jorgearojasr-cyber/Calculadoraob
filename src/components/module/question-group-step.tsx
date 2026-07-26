"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { WizardQuestion } from "./types";
import { checkRangeWarning, parseTypicalRange } from "@/lib/range-hint";
import { MeasureDiagram } from "./measure-diagram";

// Diagramas de medida — uno por cada stepGroup de exactamente 2 campos
// NUMBER confirmado por auditoría real contra la base (ver resumen del
// commit que introduce esta tabla). Grupos de 3+ campos quedan fuera
// (proyecto aparte de rediseño de layout), igual que los pares que no son
// geométricamente una medida ancho/largo (ej. dos espesores distintos, o
// una cantidad + una medida).
const DIMENSION_DIAGRAMS: Record<
  string,
  {
    shape: "rectangle" | "rectangle-with-depth" | "circle" | "circle-with-depth";
    primaryLabel: string;
    secondaryLabel?: string;
    depthLabel?: string;
  }
> = {
  "ducha-dims": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "profundidad" },
  "sendero-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" },
  cmrs94tlf000n2kseduz98jwf: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Radier
  "pintura-muro-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" },
  "pintura-puerta-1": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  "pintura-puerta-2": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  "pintura-puerta-3": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  "pintura-ventana-1": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  "pintura-ventana-2": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  "pintura-ventana-3": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  cmru6tntl00000kseunldpq7g: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Cerámica (pisos)
  cmrtvl0y20005mcsen21m2t8l: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Muro de bloques o ladrillos
  cmrtvl3aw000fmcsezs6inad3: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Tabiques y cielos
  cmrtvl24q000amcse8s2dj1ex: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Pasto en rollos
  "rollo-personalizado": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "largo" }, // Pasto en rollos (personalizado)
  cmrsjnt8q000pwsseqrzjcd3p: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Estructura y techo (quincho)
  cmrtvkzox0000mcse4sc28ke7: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Impermeabilización
  cmrvizbv10000csse7oy2pha3: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fundación — base
  cmrvizc2d0002csseiddijwkl: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fundación — cuello
  cmrtwxnbu0001zgsee2b5ehv0: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Muro de hormigón armado
  cmrtx37y50002s4se6alp133w: { shape: "rectangle", primaryLabel: "alto", secondaryLabel: "largo" }, // Revestimiento de muro
  cmrtxip5u0002nwsec9f37ved: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Cadena
  cmrtxmp220003dgsew3pzeapk: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Viga
  cmrtxpdrt00021ose5gav5sc5: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Losa
  cmrtycwly00013ssecmdopk1c: { shape: "circle-with-depth", primaryLabel: "diámetro", depthLabel: "profundidad" }, // Piscina circular
  cmru1qiwi00025csexc68m1cg: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Tabiquería en madera
  cmru1qkjd000n5csewzys8ivv: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Tabique en Metalcon
  cmru3eoou00010oseh4l9ac15: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Piso y Terraza en madera
  cmru3eqsw000q0osehvujfuyu: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Cielo raso con estructura de madera
  cmru6tpo600050kseszh7cl1k: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Porcelanato (piso)
  cmru4zt0j0001yssecv7ercx3: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Piso flotante (laminado)
  cmru51j2t000128se69qh7xm7: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Piso SPC
  cmruwyzxk0001gcseu3hskggo: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Aislación térmica bajo cubierta
  cmrv63db30001t8seqpqqyfrk: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Techo de tejas o policarbonato
  cmrv640ny00013oseqrvvxb50: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Techo inclinado (bajo teja/zinc)
  "area-pasto-sintetico": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Pasto sintético
  "jardinera-muro-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Jardinera de albañilería
  "fachada-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Pintar una fachada exterior
  "fachada-vano-1": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fachada exterior — vano 1
  "fachada-vano-2": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fachada exterior — vano 2
  "fachada-vano-3": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fachada exterior — vano 3

  // Excluidos deliberadamente (quedan documentados para no volver a auditarlos):
  // - Piscina rectangular / Piscina circular, grupo "espesor de muros x
  //   espesor de losa": ambos campos son espesores de partes distintas
  //   (muro vs. losa de fondo), no una pareja ancho/largo de una misma
  //   figura — un rectángulo etiquetado así confundiría más de lo que
  //   ayuda.
  // - Cercha de techo, grupo "cuántas cerchas x largo de cada cercha":
  //   el primer campo es una cantidad, no una medida — no es una pareja
  //   espacial representable en este diagrama.
  // - Piscina rectangular (largo/ancho/profundidad, 3 campos): descartado
  //   en el piloto — en 375px ese paso llena el viewport sin margen y
  //   cualquier diagrama empuja "Siguiente" fuera de la vista.
  // - Escalera (huella x contrahuella): técnicamente 2 campos, pero cada
  //   uno repite un helpText largo ("Si no sabes estas medidas, lo típico
  //   en una vivienda es huella 28cm y contrahuella 18cm.") que ya deja el
  //   paso casi al límite del viewport en 375px; con el diagrama, empuja
  //   "Siguiente" ~10px fuera de la vista sin scroll. Se excluye por la
  //   regla dura de layout, no por el número de campos.
};

export function QuestionGroupStep({
  questions,
  initialValues,
  onAnswer,
}: {
  questions: WizardQuestion[];
  initialValues: Record<string, string | number | undefined>;
  onAnswer: (values: Record<string, number>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      questions.map((q) => [q.key, initialValues[q.key] !== undefined ? String(initialValues[q.key]) : ""])
    )
  );
  const [error, setError] = useState<string | null>(null);

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const stepGroup = questions[0]?.stepGroup;
  const diagram = stepGroup ? DIMENSION_DIAGRAMS[stepGroup] : undefined;

  const rangeWarnings: Record<string, string | null> = {};
  for (const question of questions) {
    const range = parseTypicalRange(question.helpText, question.key);
    const raw = values[question.key] ?? "";
    const num = Number(raw.replace(",", "."));
    rangeWarnings[question.key] =
      range && raw && Number.isFinite(num) && num > 0 ? checkRangeWarning(num, range) : null;
  }

  const handleSubmit = () => {
    const parsed: Record<string, number> = {};
    for (const question of questions) {
      const raw = values[question.key] ?? "";
      const num = Number(raw.replace(",", "."));
      if (!raw || !Number.isFinite(num) || num <= 0) {
        setError("Completa todos los campos con un número mayor que 0.");
        return;
      }
      parsed[question.key] = num;
    }
    setError(null);
    onAnswer(parsed);
  };

  return (
    <div>
      {diagram && (
        <div className="mb-5 rounded-2xl p-4 bg-white border border-border">
          <MeasureDiagram
            shape={diagram.shape}
            primaryLabel={diagram.primaryLabel}
            secondaryLabel={diagram.secondaryLabel}
            depthLabel={diagram.depthLabel}
          />
        </div>
      )}
      <div className="grid gap-5">
        {questions.map((question, i) => (
          <div key={question.id}>
            <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight mb-2">
              {question.label}
            </h2>
            {question.helpText && <p className="text-sm text-ink-muted mb-3">{question.helpText}</p>}
            <div className="flex items-center gap-3 rounded-2xl px-5 py-4 bg-white border-[1.5px] border-ink">
              <input
                type="text"
                inputMode="decimal"
                autoFocus={i === 0}
                value={values[question.key]}
                onChange={(e) => setValue(question.key, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="0"
                className="w-full bg-transparent outline-none text-2xl font-display placeholder:text-ink-faint"
              />
              {question.unit && <span className="font-mono text-sm text-ink-muted">{question.unit}</span>}
            </div>
            {rangeWarnings[question.key] && (
              <p className="mt-2 text-sm text-amber-600">{rangeWarnings[question.key]}</p>
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-safety">{error}</p>}

      <button
        onClick={handleSubmit}
        className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-ink"
      >
        Siguiente
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
