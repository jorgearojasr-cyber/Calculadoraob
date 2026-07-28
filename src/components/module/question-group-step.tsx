"use client";

import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import type { WizardQuestion } from "./types";
import { checkRangeWarning, parseTypicalRange } from "@/lib/range-hint";
import { MeasureDiagram } from "./measure-diagram";
import { AreaInputToggle } from "./area-input-toggle";

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
    // Habilita el toggle largo×ancho / m² directo (AreaInputToggle) en vez
    // del grid de 2 campos fijo — solo para pares donde NINGUNA otra
    // fórmula del módulo usa largo/ancho por separado (perímetro, volumen,
    // vigas, etc.), auditado caso a caso: si algo más depende de las
    // dimensiones individuales, el modo "m² directo" reconstruiría un
    // cuadrado ficticio (lado = √área) y esa otra fórmula quedaría mal —
    // por eso NO se habilita en todos los pares "rectangle".
    allowAreaToggle?: boolean;
    // Además del toggle largo×ancho/m², permite descontar vanos (puertas/
    // ventanas) del área bruta en modo largo×ancho — ver AreaInputToggle.
    enableDeduction?: boolean;
    deductionLabel?: string;
  }
> = {
  "ducha-dims": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "profundidad" },
  "sendero-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true },
  cmrs94tlf000n2kseduz98jwf: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Radier
  "pintura-muro-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" },
  "pintura-puerta-1": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  "pintura-puerta-2": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  "pintura-puerta-3": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  "pintura-ventana-1": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  "pintura-ventana-2": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  "pintura-ventana-3": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" },
  cmru6tntl00000kseunldpq7g: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Cerámica (pisos)
  cmrtvl0y20005mcsen21m2t8l: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Muro de bloques o ladrillos — descuenta vanos, no habilita toggle
  cmrtvl3aw000fmcsezs6inad3: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Tabiques y cielos
  cmrtvl24q000amcse8s2dj1ex: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Pasto en rollos
  "rollo-personalizado": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "largo" }, // Pasto en rollos (personalizado) — medida del rollo, no área a cubrir
  cmrsjnt8q000pwsseqrzjcd3p: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Estructura y techo (quincho) — largo/ancho también arman el perímetro (suma-largo-y-ancho)
  cmrtvkzox0000mcse4sc28ke7: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Impermeabilización
  cmrvizbv10000csse7oy2pha3: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fundación — base
  cmrvizc2d0002csseiddijwkl: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fundación — cuello
  cmrtwxnbu0001zgsee2b5ehv0: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Muro de hormigón armado
  cmrtx37y50002s4se6alp133w: { shape: "rectangle", primaryLabel: "alto", secondaryLabel: "largo", allowAreaToggle: true }, // Revestimiento de muro
  cmrtxip5u0002nwsec9f37ved: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Cadena
  cmrtxmp220003dgsew3pzeapk: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Viga
  cmrtxpdrt00021ose5gav5sc5: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Losa
  cmrtycwly00013ssecmdopk1c: { shape: "circle-with-depth", primaryLabel: "diámetro", depthLabel: "profundidad" }, // Piscina circular
  cmru1qiwi00025csexc68m1cg: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Tabiquería en madera
  cmru1qkjd000n5csewzys8ivv: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Tabique en Metalcon
  cmru3eoou00010oseh4l9ac15: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Piso y Terraza en madera — largo-m/ancho-m también calculan vigas
  cmru3eqsw000q0osehvujfuyu: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Cielo raso con estructura de madera
  cmru6tpo600050kseszh7cl1k: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Porcelanato (piso)
  cmru4zt0j0001yssecv7ercx3: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Piso flotante (laminado) — largo-m/ancho-m también calculan el perímetro (moldura)
  cmru51j2t000128se69qh7xm7: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Piso SPC — mismo caso que Piso flotante (perímetro)
  cmruwyzxk0001gcseu3hskggo: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Aislación térmica bajo cubierta
  cmrv63db30001t8seqpqqyfrk: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Techo de tejas o policarbonato — perímetro (suma-largo-y-ancho)
  cmrv640ny00013oseqrvvxb50: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Techo inclinado (bajo teja/zinc)
  "area-pasto-sintetico": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Pasto sintético — largo/ancho también calculan costuras, franjas y grapas
  "jardinera-muro-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Jardinera de albañilería — largo/alto también calculan el volumen de tierra
  "fachada-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Pintar una fachada exterior — descuenta vanos, no habilita toggle
  "fachada-vano-1": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fachada exterior — vano 1
  "fachada-vano-2": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fachada exterior — vano 2
  "fachada-vano-3": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fachada exterior — vano 3
  "cielo-metalcon-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Cielo raso en Metalcon
  cmrsdqraw0005dkseiur36yb7: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Techo (cubierta) — antes 2 pasos sin agrupar ni diagrama

  // Grupos de 1 pregunta (antes single-question steps, sin diagrama): el
  // toggle también aplica cuando el módulo solo pedía m² directo — ver
  // hasAreaToggle() y su uso en ModuleWizard para rutear estos casos por
  // QuestionGroupStep aunque el "grupo" tenga un solo elemento.
  "malla-area-directa": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Malla electrosoldada
  "pastelones-area-directa": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Pastelones prefabricados
  "siembra-area-directa": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Siembra por semilla (césped)
  "estuco-area-directa": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto", allowAreaToggle: true }, // Preparar y estucar un muro antes de pintar
  "yeso-planchas-area-directa": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto", allowAreaToggle: true }, // Terminar junturas de yeso cartón

  // Pintura: reemplaza modo-calculo + cantidad-puertas/ventanas + vanos 1-3
  // + "más de 3" personalizada — ver resumen del commit que unifica esto.
  "pintura-superficie-final": {
    shape: "rectangle",
    primaryLabel: "largo",
    secondaryLabel: "alto",
    allowAreaToggle: true,
    enableDeduction: true,
    deductionLabel: "Puertas y ventanas a descontar",
  },

  // Grupos de 3 campos y Escalera: excluidos originalmente porque el paso
  // llenaba el viewport de 375px sin margen. Habilitados tras el rediseño
  // de layout compacto (labels chicos, helpText colapsado tras el ícono
  // (i), 2 columnas en desktop) — ver `compact` más abajo.
  cmrsikxe00001wssef5v6idtl: { shape: "rectangle-with-depth", primaryLabel: "largo", secondaryLabel: "ancho", depthLabel: "profundidad" }, // Piscina rectangular
  cmrsc8n1d000mdwse1soq1ay1: { shape: "rectangle-with-depth", primaryLabel: "largo", secondaryLabel: "ancho", depthLabel: "profundidad" }, // Excavación
  cmrtx07qt0002zsseetlhr5x5: { shape: "rectangle-with-depth", primaryLabel: "ancho", secondaryLabel: "alto", depthLabel: "profundidad" }, // Pilar / columna
  cmrtxsb9800042wse1m5gzn6c: { shape: "rectangle", primaryLabel: "huella", secondaryLabel: "contrahuella" }, // Escalera

  // Excluidos deliberadamente (quedan documentados para no volver a auditarlos):
  // - Piscina rectangular / Piscina circular, grupo "espesor de muros x
  //   espesor de losa": ambos campos son espesores de partes distintas
  //   (muro vs. losa de fondo), no una pareja ancho/largo de una misma
  //   figura — un rectángulo etiquetado así confundiría más de lo que
  //   ayuda.
  // - Cercha de techo, grupo "cuántas cerchas x largo de cada cercha":
  //   el primer campo es una cantidad, no una medida — no es una pareja
  //   espacial representable en este diagrama.
};

// Usado por ModuleWizard para decidir si un paso de UNA sola pregunta
// (sin pareja) también debe rutearse por QuestionGroupStep en vez de
// QuestionStep — caso de los módulos que antes solo pedían m² directo y
// ahora también pueden alternar a largo×ancho.
export function hasAreaToggle(stepGroup: string | null | undefined): boolean {
  return Boolean(stepGroup && DIMENSION_DIAGRAMS[stepGroup]?.allowAreaToggle);
}

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
  const [openHelp, setOpenHelp] = useState<Record<string, boolean>>({});

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const stepGroup = questions[0]?.stepGroup;
  const diagram = stepGroup ? DIMENSION_DIAGRAMS[stepGroup] : undefined;

  // Layout compacto para grupos de 3+ campos: los pasos apilados con
  // heading grande + helpText siempre visible llenaban el viewport de
  // 375px sin margen (por eso Piscina rectangular y Escalera quedaron
  // sin diagrama en su momento). En compacto: labels más chicos, menos
  // espaciado, 2 columnas en desktop, y helpText detrás de un ícono (i).
  const compact = questions.length >= 3;
  // El helpText también se colapsa fuera del modo compacto cuando es
  // largo (caso Escalera: 2 campos que repiten un helpText de ~95
  // caracteres cada uno) — regla por largo, no por módulo puntual.
  const isHelpCollapsed = (q: WizardQuestion) =>
    Boolean(q.helpText) && (compact || (q.helpText?.length ?? 0) > 80);

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

  // El diagrama vincula sus campos (primario/secundario/profundidad) con
  // `questions` en ese mismo orden posicional — así fueron auditados al
  // armar DIMENSION_DIAGRAMS (ej. circle-with-depth es [diámetro,
  // profundidad], sin secundario, así que el segundo campo es profundidad).
  const diagramSecondaryQuestion = diagram?.secondaryLabel ? questions[1] : undefined;
  const diagramDepthQuestion = diagram?.depthLabel
    ? questions[diagram.secondaryLabel ? 2 : 1]
    : undefined;

  // AreaInputToggle reemplaza el grid de campos fijo cuando el stepGroup
  // está auditado como seguro para "m² directo" (ver allowAreaToggle
  // arriba). Dos casos:
  // - Grupo de 2 preguntas (largo+ancho ya existentes): en modo m², como
  //   no hay largo/ancho reales que ingresar, se reparte la superficie en
  //   un cuadrado equivalente (lado = √área) para llenar ambas preguntas
  //   sin tocar la fórmula del módulo (que sigue multiplicando las dos) —
  //   matemáticamente da el área correcta; ningún otro cálculo del módulo
  //   depende del largo/ancho por separado en los pares marcados
  //   allowAreaToggle, así que el cuadrado ficticio es inofensivo.
  // - Grupo de 1 sola pregunta (módulos que antes solo pedían m² directo,
  //   o Pintura consolidado): el área calculada se guarda tal cual en esa
  //   única pregunta — no hace falta el truco del cuadrado.
  const useAreaToggle = diagram?.allowAreaToggle && questions.length <= 2;

  const round2 = (value: number) => Math.round(value * 100) / 100;

  const handleAreaChange = (area: number | null) => {
    if (questions.length === 1) {
      setValues({ [questions[0].key]: area !== null ? String(round2(area)) : "" });
      return;
    }
    const side = area !== null ? String(round2(Math.sqrt(area))) : "";
    setValues({ [questions[0].key]: side, [questions[1].key]: side });
  };

  if (useAreaToggle) {
    return (
      <div>
        <AreaInputToggle
          primaryLabel={diagram!.primaryLabel}
          secondaryLabel={diagram!.secondaryLabel}
          // El campo m² directo siempre muestra "m²" (fijo dentro del
          // componente); este `unit` es solo para los campos largo/ancho
          // en modo dims, que son longitudes — nunca la unidad de la
          // pregunta original (que para los grupos de 1 sola pregunta es
          // "m²", la unidad del ÁREA, no de una longitud).
          unit={questions.length === 2 ? questions[0].unit ?? "m" : "m"}
          enableDeduction={diagram!.enableDeduction}
          deductionLabel={diagram!.deductionLabel}
          onAreaChange={handleAreaChange}
        />

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

  return (
    <div>
      {diagram && (
        <div className="mb-5 rounded-2xl p-4 bg-white border border-border">
          <MeasureDiagram
            shape={diagram.shape}
            primaryLabel={diagram.primaryLabel}
            secondaryLabel={diagram.secondaryLabel}
            depthLabel={diagram.depthLabel}
            primaryValue={values[questions[0].key]}
            primaryUnit={questions[0].unit ?? undefined}
            secondaryValue={diagramSecondaryQuestion ? values[diagramSecondaryQuestion.key] : undefined}
            secondaryUnit={diagramSecondaryQuestion?.unit ?? undefined}
            depthValue={diagramDepthQuestion ? values[diagramDepthQuestion.key] : undefined}
            depthUnit={diagramDepthQuestion?.unit ?? undefined}
          />
        </div>
      )}
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-5"}>
        {questions.map((question, i) => {
          const collapsedHelp = isHelpCollapsed(question);
          return (
            <div key={question.id}>
              <div className="flex items-center gap-1.5 mb-2">
                {compact ? (
                  <span className="font-semibold text-[15px]">{question.label}</span>
                ) : (
                  <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
                    {question.label}
                  </h2>
                )}
                {collapsedHelp && (
                  <button
                    type="button"
                    onClick={() => setOpenHelp((prev) => ({ ...prev, [question.key]: !prev[question.key] }))}
                    aria-label={`Más información sobre ${question.label}`}
                    aria-expanded={!!openHelp[question.key]}
                    className="shrink-0 text-ink-faint hover:text-ink"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                )}
              </div>
              {question.helpText && (!collapsedHelp || openHelp[question.key]) && (
                <p className="text-sm text-ink-muted mb-2">{question.helpText}</p>
              )}
              <div
                className={`flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink ${
                  compact ? "px-4 py-3" : "px-5 py-4"
                }`}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus={i === 0}
                  value={values[question.key]}
                  onChange={(e) => setValue(question.key, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="0"
                  className={`w-full bg-transparent outline-none font-display placeholder:text-ink-faint ${
                    compact ? "text-xl" : "text-2xl"
                  }`}
                />
                {question.unit && <span className="font-mono text-sm text-ink-muted">{question.unit}</span>}
              </div>
              {rangeWarnings[question.key] && (
                <p className="mt-2 text-sm text-amber-600">{rangeWarnings[question.key]}</p>
              )}
            </div>
          );
        })}
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
