"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeftRight, ArrowUpDown, Info, Lightbulb } from "lucide-react";
import type { WizardQuestion } from "./types";
import { checkRangeWarning, parseTypicalRange } from "@/lib/range-hint";
import { formatQuantity } from "@/lib/format-number";
import { MeasureDiagram } from "./measure-diagram";
import { AreaInputToggle } from "./area-input-toggle";

// Diagramas de medida — uno por cada stepGroup de exactamente 2 campos
// NUMBER confirmado por auditoría real contra la base (ver resumen del
// commit que introduce esta tabla). Grupos de 3+ campos quedan fuera
// (proyecto aparte de rediseño de layout), igual que los pares que no son
// geométricamente una medida ancho/largo (ej. dos espesores distintos, o
// una cantidad + una medida).
type DiagramConfig = {
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
    // Sub-etiqueta corta bajo cada label de campo (ej. "El lado más largo")
    // — solo usada por los grupos con depthLabel (volumen), ver
    // conversación 2026-07-30, rediseño del diagrama de volumen. El resto
    // de los grupos (área) no la necesita — su patrón de campo no cambió.
    primarySubLabel?: string;
    secondarySubLabel?: string;
    depthSubLabel?: string;
    // Label del resultado en vivo (ej. "Volumen a excavar") — solo para
    // grupos con depthLabel.
    volumeResultLabel?: string;
    // Título + bajada del paso — solo para grupos con depthLabel (los de
    // área no tienen heading propio, cada campo lleva su propio label).
    groupLabel?: string;
    groupHelpText?: string;
};

const DIMENSION_DIAGRAMS: Record<string, DiagramConfig> = {
  "ducha-dims": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "profundidad" },
  "sendero-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true },
  cmrs94tlf000n2kseduz98jwf: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Radier
  cmru6tntl00000kseunldpq7g: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Cerámica (pisos)
  cmrtvl3aw000fmcsezs6inad3: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Tabiques y cielos
  cmrtvl24q000amcse8s2dj1ex: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Pasto en rollos
  "rollo-personalizado": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "largo" }, // Pasto en rollos (personalizado) — medida del rollo, no área a cubrir
  cmrtvkzox0000mcse4sc28ke7: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Impermeabilización
  cmrvizbv10000csse7oy2pha3: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fundación — base
  cmrvizc2d0002csseiddijwkl: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Fundación — cuello
  cmrtwxnbu0001zgsee2b5ehv0: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Muro de hormigón armado
  cmrtx37y50002s4se6alp133w: { shape: "rectangle", primaryLabel: "alto", secondaryLabel: "largo", allowAreaToggle: true }, // Revestimiento de muro
  cmrtxip5u0002nwsec9f37ved: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Cadena
  cmrtxmp220003dgsew3pzeapk: { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "alto" }, // Viga
  cmrtxpdrt00021ose5gav5sc5: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Losa
  cmrtycwly00013ssecmdopk1c: {
    shape: "circle-with-depth",
    primaryLabel: "diámetro",
    depthLabel: "profundidad",
    primarySubLabel: "De borde a borde",
    depthSubLabel: "Del fondo al borde",
    volumeResultLabel: "Volumen de hormigón",
    groupLabel: "¿Qué medidas tiene la piscina?",
    groupHelpText: "Medida interior del espejo de agua, de borde a borde.",
  }, // Piscina circular
  cmru1qiwi00025csexc68m1cg: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Tabiquería en madera
  cmru1qkjd000n5csewzys8ivv: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" }, // Tabique en Metalcon
  cmru3eoou00010oseh4l9ac15: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Piso y Terraza en madera — largo-m/ancho-m también calculan vigas
  cmru3eqsw000q0osehvujfuyu: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Cielo raso con estructura de madera
  cmru6tpo600050kseszh7cl1k: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Porcelanato (piso)
  cmru4zt0j0001yssecv7ercx3: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Piso flotante (laminado) — largo-m/ancho-m también calculan el perímetro (moldura)
  cmru51j2t000128se69qh7xm7: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Piso SPC — mismo caso que Piso flotante (perímetro)
  cmruwyzxk0001gcseu3hskggo: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Aislación térmica bajo cubierta
  cmrv640ny00013oseqrvvxb50: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true }, // Techo inclinado (bajo teja/zinc)
  "area-pasto-sintetico": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Pasto sintético — largo/ancho también calculan costuras, franjas y grapas
  // Jardinera de albañilería: las 3 medidas (largo/alto/ancho) ahora
  // comparten un solo paso — antes el ancho quedaba en un paso aparte, sin
  // relación visual con largo/alto. depthLabel="ancho" es la profundidad
  // de la jardinera (front-to-back), mismo patrón que Piscina rectangular.
  "jardinera-muro-dims": {
    shape: "rectangle-with-depth",
    primaryLabel: "largo",
    secondaryLabel: "alto",
    depthLabel: "ancho",
    primarySubLabel: "Largo del muro",
    secondarySubLabel: "Altura del muro",
    depthSubLabel: "Profundidad de tierra",
    volumeResultLabel: "Volumen de tierra",
    groupLabel: "¿Qué medidas tiene la jardinera?",
    groupHelpText: "Largo y alto del muro, más qué tan ancha (de profundidad) va la tierra.",
  }, // Jardinera de albañilería — largo/alto/ancho también calculan el volumen de tierra
  "excavacion-circular-dims": {
    shape: "circle-with-depth",
    primaryLabel: "diámetro",
    depthLabel: "profundidad",
    primarySubLabel: "De borde a borde",
    depthSubLabel: "Del suelo hasta el fondo",
    volumeResultLabel: "Volumen a excavar",
    groupLabel: "¿Qué medidas tiene la excavación?",
    groupHelpText: "Mide el hoyo terminado, no la marca en el suelo. La profundidad se mide desde el nivel del terreno hasta el fondo.",
  }, // Excavación circular — mismo shape que Piscina circular
  "cielo-metalcon-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" }, // Cielo raso en Metalcon
  // Techo (cubierta): antes 2 pasos sin agrupar ni diagrama. allowAreaToggle
  // desactivado a propósito — desde que zinc/acero usa cálculo por grilla
  // (filas × planchas por fila), el modo "m² directo" reconstruiría un
  // cuadrado ficticio y rompería ese cálculo para cualquier rectángulo real
  // (mismo riesgo ya identificado y evitado en Pasto sintético).
  cmrsdqraw0005dkseiur36yb7: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" },
  // Malla electrosoldada: mismo motivo que Techo (cubierta) — pasó de
  // pedir m² directo a largo/ancho reales para calcular planchas por
  // grilla (ancho útil × largo útil, con traslape real). allowAreaToggle
  // desactivado a propósito: "m² directo" reconstruiría un cuadrado
  // ficticio y rompería la grilla para cualquier rectángulo real.
  "malla-electrosoldada-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" },

  // Grupos de 1 pregunta (antes single-question steps, sin diagrama): el
  // toggle también aplica cuando el módulo solo pedía m² directo — ver
  // hasAreaToggle() y su uso en ModuleWizard para rutear estos casos por
  // QuestionGroupStep aunque el "grupo" tenga un solo elemento.
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
  // Muro de bloques o ladrillos: reemplaza el campo único "m² a descontar"
  // por el mismo descuento de vanos ancho×alto del componente.
  "muro-bloques-superficie-final": {
    shape: "rectangle",
    primaryLabel: "largo",
    secondaryLabel: "alto",
    allowAreaToggle: true,
    enableDeduction: true,
    deductionLabel: "Puertas y ventanas a descontar",
  },
  // Pintar una fachada exterior: reemplaza cuantos-vanos-quieres-descontar
  // + vano 1-3 + "más de 3" personalizada, mismo patrón que Pintura.
  "fachada-superficie-final": {
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
  cmrsikxe00001wssef5v6idtl: {
    shape: "rectangle-with-depth",
    primaryLabel: "largo",
    secondaryLabel: "ancho",
    depthLabel: "profundidad",
    primarySubLabel: "El lado más largo",
    secondarySubLabel: "El lado más corto",
    depthSubLabel: "Del fondo al borde",
    volumeResultLabel: "Volumen de hormigón",
    groupLabel: "¿Qué medidas tiene la piscina?",
    groupHelpText: "Medida interior del espejo de agua, de borde a borde.",
  }, // Piscina rectangular
  cmrsc8n1d000mdwse1soq1ay1: {
    shape: "rectangle-with-depth",
    primaryLabel: "largo",
    secondaryLabel: "ancho",
    depthLabel: "profundidad",
    primarySubLabel: "El lado más largo",
    secondarySubLabel: "El lado más corto",
    depthSubLabel: "Del suelo hasta el fondo",
    volumeResultLabel: "Volumen a excavar",
    groupLabel: "¿Qué medidas tiene la excavación?",
    groupHelpText: "Mide el hoyo terminado, no la marca en el suelo. La profundidad se mide desde el nivel del terreno hasta el fondo.",
  }, // Excavación
  cmrtx07qt0002zsseetlhr5x5: {
    shape: "rectangle-with-depth",
    primaryLabel: "ancho",
    secondaryLabel: "alto",
    depthLabel: "profundidad",
    primarySubLabel: "Ancho de la sección",
    secondarySubLabel: "Alto del pilar",
    depthSubLabel: "Profundidad de la sección",
    volumeResultLabel: "Volumen de hormigón",
    groupLabel: "¿Qué medidas tiene el pilar?",
    groupHelpText: "Sección transversal (ancho × alto) y profundidad de la excavación o molde.",
  }, // Pilar / columna
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
  //
  // Auditoría 2026-08-01 (ver docs/svg-diagram-system.md, estándar
  // oficial 2D/3D) — módulos cuyo RESULTADO final es m³ pero la 3ra
  // dimensión (espesor, largo o cantidad de escalones) se pide en un
  // paso SEPARADO, no wireado a este diagrama, así que hoy quedan en
  // "rectangle" (2D) mostrando solo 2 de las 3 medidas reales:
  //   Losa (cmrtxpdrt00021ose5gav5sc5), Muro de hormigón armado
  //   (cmrtwxnbu0001zgsee2b5ehv0), Radier (cmrs94tlf000n2kseduz98jwf,
  //   espesor en el stepGroup separado "radier-espesor-step"), Fundación
  //   — base y cuello (cmrvizbv10000csse7oy2pha3,
  //   cmrvizc2d0002csseiddijwkl), Cadena (cmrtxip5u0002nwsec9f37ved),
  //   Viga (cmrtxmp220003dgsew3pzeapk), Escalera
  //   (cmrtxsb9800042wse1m5gzn6c, depende además de "ancho" y
  //   "escalones", preguntas propias sin stepGroup).
  // DECISIÓN (confirmada con Jorge): no tocar — pasarlos a
  // "rectangle-with-depth" real requeriría fusionar esos pasos
  // separados en uno solo (mismo patrón que Piscina/Excavación), un
  // cambio de flujo de preguntas distinto a este trabajo de estilo
  // visual. Se evalúa aparte si vale la pena unificarlos.
};

// Los 9 módulos migrados al layout combinado (ver commit que agrega
// sideBySide): unifica largo+ancho (o largo+alto en Jardinera) en UNA sola
// pregunta con una sola descripción, en vez de 2 preguntas/títulos
// separados — y agrega una caja de superficie en vivo debajo de los
// campos. Solo cubre estos 9 stepGroups a propósito: son los únicos
// auditados contra el mockup; el resto de los pares de 2 campos (Losa,
// Viga, Fundación, etc.) siguen con el patrón anterior (ya lado a lado
// desde sideBySide, pero sin unificar la pregunta ni el cálculo de
// superficie, que no aplica igual de bien a esos casos).
const COMBINED_AREA_QUESTION: Record<string, { label: string; helpText: string; areaLabel: string }> = {
  cmrs94tlf000n2kseduz98jwf: {
    label: "¿Cuánto mide de largo y ancho?",
    helpText: "Mide de pared a pared, por el suelo. Si el patio no es un rectángulo perfecto, usa la medida más larga.",
    areaLabel: "Superficie del radier",
  }, // Radier
  cmrsikxe00001wssef5v6idtl: {
    label: "¿Cuánto mide de largo y ancho la piscina?",
    helpText: "Medida interior del espejo de agua, de borde a borde.",
    areaLabel: "Superficie de la piscina",
  }, // Piscina rectangular — la profundidad queda como pregunta aparte, debajo
  cmru51j2t000128se69qh7xm7: {
    label: "¿Cuánto mide de largo y ancho el espacio?",
    helpText: "Mide de pared a pared, por el suelo. Si el espacio no es un rectángulo perfecto, usa la medida más larga por lado.",
    areaLabel: "Superficie del piso",
  }, // Piso SPC
  cmru4zt0j0001yssecv7ercx3: {
    label: "¿Cuánto mide de largo y ancho el espacio?",
    helpText: "Mide de pared a pared, por el suelo. Si el espacio no es un rectángulo perfecto, usa la medida más larga por lado.",
    areaLabel: "Superficie del piso",
  }, // Piso flotante
  cmru3eoou00010oseh4l9ac15: {
    label: "¿Cuánto mide de largo y ancho?",
    helpText: "Mide el piso o terraza de borde a borde, por el suelo.",
    areaLabel: "Superficie del piso/terraza",
  }, // Piso y Terraza en madera
  "jardinera-muro-dims": {
    label: "¿Cuánto mide de largo y alto la jardinera?",
    helpText: "Largo total del muro y su altura. Lo típico es entre 0,3 y 0,5 metros de alto.",
    areaLabel: "Superficie del muro",
  }, // Jardinera — el ancho (profundidad) queda como pregunta aparte, debajo
  "area-pasto-sintetico": {
    label: "¿Cuánto mide de largo y ancho el área?",
    helpText: "Mide el área a cubrir con pasto sintético, de borde a borde.",
    areaLabel: "Superficie de pasto sintético",
  }, // Pasto sintético
};

// Botón "Siguiente" (ancho completo, grande) + "Guardar y seguir después"
// como link secundario debajo — solo para pasos con diagrama (ver
// conversación 2026-07-30). Los grupos sin diagrama no reciben
// onSaveForLater y siguen con el botón chico de siempre (ver más abajo).
function SubmitActions({
  onSubmit,
  onSaveForLater,
}: {
  onSubmit: () => void;
  onSaveForLater?: () => void;
}) {
  return (
    <div className="mt-6">
      <button
        onClick={onSubmit}
        className="w-full rounded-full px-6 py-4 text-base font-semibold text-white flex items-center justify-center gap-2 bg-action"
      >
        Siguiente
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
  );
}

// Fila de campo de VolumeStep (ícono de eje + label + sublabel + input) —
// componente de NIVEL SUPERIOR a propósito: definirlo dentro de VolumeStep
// lo recreaba como un tipo de componente nuevo en cada tecla (cada
// setValue re-renderiza VolumeStep), lo que a su vez desmontaba y volvía a
// montar los 3 inputs en cada letra — el usuario perdía foco/cursor a
// mitad de escribir. Bug real encontrado al verificar "actualización en
// vivo" en el navegador (2026-07-30), no solo un detalle de estilo.
function FieldRow({
  icon,
  label,
  subLabel,
  value,
  unit,
  autoFocus,
  onChange,
  onEnter,
  rangeWarning,
}: {
  icon: "horizontal" | "vertical";
  label: string;
  subLabel?: string;
  value: string;
  unit: string | null;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onEnter: () => void;
  rangeWarning?: string | null;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="w-8 h-8 rounded-full bg-concrete flex items-center justify-center flex-shrink-0 text-ink-muted">
          {icon === "horizontal" ? <ArrowLeftRight className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4" />}
        </span>
        <div>
          <p className="font-semibold text-[15px] leading-tight">{label}</p>
          {subLabel && <p className="text-xs text-ink-muted leading-tight">{subLabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-4 py-3">
        <input
          type="text"
          inputMode="decimal"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter()}
          placeholder="0"
          className="w-full bg-transparent outline-none font-display text-xl placeholder:text-ink-faint"
        />
        {unit && <span className="font-mono text-sm text-ink-muted">{unit}</span>}
      </div>
      {rangeWarning && <p className="mt-2 text-sm text-amber-600">{rangeWarning}</p>}
    </div>
  );
}

// Mismo motivo que FieldRow: nivel superior para no recrear el tipo de
// componente en cada render de VolumeStep.
function Tip({ text, className = "" }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 bg-concrete ${className}`}>
      <Lightbulb className="w-4 h-4 text-ink-muted flex-shrink-0 mt-0.5" />
      <p className="text-sm text-ink-muted">{text}</p>
    </div>
  );
}

// Paso de VOLUMEN (diagrama caja/cilindro con profundidad) — ver
// conversación 2026-07-30. Mismo patrón de campo en mobile y desktop
// (ícono de eje + label + sublabel, input a la derecha); en desktop el
// diagrama va en su propia columna con subtítulo + tip debajo. Volumen en
// vivo = largo×ancho×profundidad (caja) o π×(diámetro/2)²×profundidad
// (cilindro) — solo una vista previa mientras el usuario escribe, el
// cálculo real (con pérdidas, esponjamiento, etc.) lo hace el resultado
// final del wizard como siempre.
function VolumeStep({
  questions,
  diagram,
  values,
  setValue,
  error,
  rangeWarnings,
  handleSubmit,
  onSaveForLater,
}: {
  questions: WizardQuestion[];
  diagram: DiagramConfig;
  values: Record<string, string>;
  setValue: (key: string, value: string) => void;
  error: string | null;
  rangeWarnings: Record<string, string | null>;
  handleSubmit: () => void;
  onSaveForLater?: () => void;
}) {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const toNum = (raw: string | undefined) => {
    const n = Number((raw ?? "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const isCircular = diagram.shape === "circle-with-depth";
  const secondaryQuestion = diagram.secondaryLabel ? questions[1] : undefined;
  const depthQuestion = questions[diagram.secondaryLabel ? 2 : 1];

  const fields = [
    { question: questions[0], label: diagram.primaryLabel, subLabel: diagram.primarySubLabel, axis: "h" as const },
    ...(secondaryQuestion
      ? [{ question: secondaryQuestion, label: diagram.secondaryLabel!, subLabel: diagram.secondarySubLabel, axis: "h" as const }]
      : []),
    { question: depthQuestion, label: diagram.depthLabel!, subLabel: diagram.depthSubLabel, axis: "v" as const },
  ];

  const nums = fields.map((f) => toNum(values[f.question.key]));
  const allValid = nums.every((n) => n !== null);
  const volume = !allValid
    ? null
    : isCircular
      ? Math.PI * (nums[0]! / 2) ** 2 * nums[nums.length - 1]!
      : nums.reduce((acc, n) => acc * n!, 1);
  const formulaText = allValid
    ? `${nums.map((n) => formatQuantity(n!)).join(" × ")} ${questions[0].unit ?? "m"}`
    : null;

  // El tip reutiliza el helpText que ya tenga alguna pregunta del grupo
  // (dato específico del módulo, ya cargado en la DB) — no se hardcodea
  // texto nuevo por módulo acá.
  const tip = fields.map((f) => f.question.helpText).find(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8 grid lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:items-start">
      <div className="order-2 lg:order-1">
        {diagram.groupLabel && (
          <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight mb-2">{diagram.groupLabel}</h2>
        )}
        {diagram.groupHelpText && <p className="text-sm text-ink-muted mb-5">{diagram.groupHelpText}</p>}

        <div className="grid gap-4">
          {fields.map((f, i) => (
            <FieldRow
              key={f.question.id}
              icon={f.axis === "h" ? "horizontal" : "vertical"}
              label={capitalize(f.label)}
              subLabel={f.subLabel}
              value={values[f.question.key]}
              unit={f.question.unit}
              autoFocus={i === 0}
              onChange={(v) => setValue(f.question.key, v)}
              onEnter={handleSubmit}
              rangeWarning={rangeWarnings[f.question.key]}
            />
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-concrete px-5 py-4">
          <p className="text-sm text-ink-muted">{diagram.volumeResultLabel ?? "Volumen"}</p>
          <p className="font-display text-2xl font-semibold text-ink">
            {volume !== null ? `${formatQuantity(volume)} m³` : "—"}
          </p>
          {formulaText && <p className="mt-1 text-xs text-ink-muted">{formulaText}</p>}
        </div>

        <Tip text={tip} className="mt-4 lg:hidden" />

        {error && <p className="mt-4 text-sm text-safety">{error}</p>}

        <SubmitActions onSubmit={handleSubmit} onSaveForLater={onSaveForLater} />
      </div>

      <div className="order-1 lg:order-2 mb-6 lg:mb-0 rounded-2xl bg-[#F3F7FB] p-5 sm:p-6">
        <div className="hidden lg:block mb-4">
          <p className="font-semibold text-sm">Así se ve con tus medidas</p>
          <p className="text-sm text-ink-muted mt-1">
            Mismo diagrama y mismos valores: el {isCircular ? "diámetro" : "ancho"} extra va al dibujo, no a agrandar
            el texto.
          </p>
        </div>
        <MeasureDiagram
          shape={diagram.shape}
          primaryLabel={diagram.primaryLabel}
          secondaryLabel={diagram.secondaryLabel}
          depthLabel={diagram.depthLabel}
          primaryValue={values[questions[0].key]}
          primaryUnit={questions[0].unit ?? undefined}
          secondaryValue={secondaryQuestion ? values[secondaryQuestion.key] : undefined}
          secondaryUnit={secondaryQuestion?.unit ?? undefined}
          depthValue={values[depthQuestion.key]}
          depthUnit={depthQuestion.unit ?? undefined}
        />
        <div className="hidden lg:block mt-4">
          <Tip text={tip} />
        </div>
      </div>
    </div>
  );
}

// Usado por ModuleWizard para decidir si un paso de UNA sola pregunta
// (sin pareja) también debe rutearse por QuestionGroupStep en vez de
// QuestionStep — caso de los módulos que antes solo pedían m² directo y
// ahora también pueden alternar a largo×ancho.
export function hasAreaToggle(stepGroup: string | null | undefined): boolean {
  return Boolean(stepGroup && DIMENSION_DIAGRAMS[stepGroup]?.allowAreaToggle);
}

// Usado por ModuleWizard para ensanchar el contenedor del wizard solo en
// pasos con diagrama (ver conversación 2026-07-30) — a 2 columnas, el
// ancho angosto de siempre (max-w-2xl, pensado para 1 columna) dejaba el
// diagrama y los inputs apretados.
export function hasDiagram(stepGroup: string | null | undefined): boolean {
  return Boolean(stepGroup && DIMENSION_DIAGRAMS[stepGroup]);
}

export function QuestionGroupStep({
  questions,
  initialValues,
  onAnswer,
  forcedInitialArea,
  onSaveForLater,
}: {
  questions: WizardQuestion[];
  initialValues: Record<string, string | number | undefined>;
  onAnswer: (values: Record<string, number>) => void;
  // Fuerza el AreaInputToggle (ver useAreaToggle más abajo) a abrir en modo
  // "m² directo" con este valor precargado, sin importar cuántas preguntas
  // tenga el grupo (1 o 2) — usado por la Fase 3 de "Construir una piscina"
  // para precargar el área del contorno ya calculada (ver plan/[slug]/page.tsx).
  // Sin esto, el comportamiento es idéntico al de siempre.
  forcedInitialArea?: number;
  // Link secundario bajo "Siguiente", solo en pasos con diagrama (ver
  // conversación 2026-07-30) — ausente en grupos sin diagrama, que
  // conservan el botón de siempre.
  onSaveForLater?: () => void;
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
  // Pares de 2 campos con diagrama (largo/ancho, etc.) van lado a lado
  // aunque no tengan allowAreaToggle — es puramente el layout de las
  // mismas 2 preguntas ya agrupadas en este paso, no cambia cómo se
  // guardan ni se usan sus valores en las fórmulas. Los grupos que sí
  // tienen allowAreaToggle ni pasan por acá (los renderiza AreaInputToggle
  // más abajo); esto es para los que se quedaron con el grid fijo.
  const sideBySide = questions.length === 2 && Boolean(diagram);
  // Los 9 módulos auditados contra el mockup (ver COMBINED_AREA_QUESTION):
  // largo+ancho (siempre questions[0]/[1], mismo orden posicional que usa
  // el diagrama) se combinan en una sola pregunta con superficie en vivo;
  // un 3er campo (profundidad/alto), si existe, se queda como pregunta
  // aparte de todos modos.
  const combined = stepGroup ? COMBINED_AREA_QUESTION[stepGroup] : undefined;
  const pairedQuestions = combined ? questions.slice(0, 2) : [];
  const extraQuestions = combined ? questions.slice(2) : questions;
  // Grupos de exactamente 3 campos con diagrama de caja/cilindro 3D y SIN
  // el layout combinado (ej. Excavación): las 3 medidas van en una sola
  // fila en tablet/desktop, apiladas en mobile — mismo criterio que ya
  // aplicaba sideBySide para pares de 2. Los grupos combinados (Piscina
  // rectangular, Jardinera) NO entran acá: mantienen su layout ya auditado
  // (2 campos bajo un título + superficie en vivo, 3er campo aparte).
  const threeInRow = !combined && questions.length === 3 && Boolean(diagram);
  const toNum = (raw: string | undefined) => {
    const n = Number((raw ?? "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const areaValue = combined
    ? (() => {
        const a = toNum(values[pairedQuestions[0]?.key]);
        const b = toNum(values[pairedQuestions[1]?.key]);
        return a !== null && b !== null ? a * b : null;
      })()
    : null;
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
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

  const handleAreaChange = (
    area: number | null,
    dims: { primary: string; secondary: string } | null
  ) => {
    if (questions.length === 1) {
      setValues({ [questions[0].key]: area !== null ? String(round2(area)) : "" });
      return;
    }
    if (dims) {
      // Modo "largo × ancho": preserva el par real que tecleó el usuario en
      // vez de reconstruir un cuadrado ficticio — bug corregido (antes se
      // perdía la asimetría real incluso viniendo de este modo).
      setValues({ [questions[0].key]: dims.primary, [questions[1].key]: dims.secondary });
      return;
    }
    // Modo "m² directo": no hay dims individuales reales que preservar —
    // reparte el área en un cuadrado equivalente (da el m² correcto para la
    // fórmula, aunque el par individual mostrado sea ficticio).
    const side = area !== null ? String(round2(Math.sqrt(area))) : "";
    setValues({ [questions[0].key]: side, [questions[1].key]: side });
  };

  // Pasos de VOLUMEN (diagrama con profundidad: caja o cilindro) — layout
  // propio (ícono+label+sublabel+input por campo, resultado en vivo, tip),
  // el mismo en mobile y desktop (ver conversación 2026-07-30). Tiene
  // prioridad sobre `combined`: antes Piscina rectangular/Jardinera
  // combinaban largo+ancho con un cuadro de ÁREA en vivo — ahora, como
  // cualquier otro módulo de volumen, muestran los 3 campos por separado
  // con un cuadro de VOLUMEN en vivo (coherente con Excavación/Pilar).
  if (diagram?.depthLabel) {
    return (
      <VolumeStep
        questions={questions}
        diagram={diagram}
        values={values}
        setValue={setValue}
        error={error}
        rangeWarnings={rangeWarnings}
        handleSubmit={handleSubmit}
        onSaveForLater={onSaveForLater}
      />
    );
  }

  if (useAreaToggle) {
    return (
      <div>
        {questions.length === 1 && questions[0].helpText && (
          <p className="text-sm text-ink-muted mb-3">{questions[0].helpText}</p>
        )}
        <AreaInputToggle
          primaryLabel={diagram!.primaryLabel}
          secondaryLabel={diagram!.secondaryLabel}
          // El campo m² directo siempre muestra "m²" (fijo dentro del
          // componente); este `unit` es solo para los campos largo/ancho
          // en modo dims, que son longitudes — nunca la unidad de la
          // pregunta original (que para los grupos de 1 sola pregunta es
          // "m²", la unidad del ÁREA, no de una longitud).
          unit={questions.length === 2 ? questions[0].unit ?? "m" : "m"}
          // Para un grupo de 1 sola pregunta, lo único que existe es el área
          // combinada (nunca hubo largo/ancho reales guardados por separado
          // — ver handleAreaChange) — si ya hay una respuesta previa (ej.
          // "Editar respuestas" en Pintura), abre directo en "m² directo"
          // con ese valor precargado, en vez del tab "largo × ancho" vacío
          // por defecto.
          initialMode={
            forcedInitialArea !== undefined || (questions.length === 1 && values[questions[0].key])
              ? "area"
              : "dims"
          }
          enableDeduction={diagram!.enableDeduction}
          deductionLabel={diagram!.deductionLabel}
          initialPrimary={questions.length === 2 ? values[questions[0].key] || undefined : undefined}
          initialSecondary={questions.length === 2 ? values[questions[1].key] || undefined : undefined}
          initialArea={
            forcedInitialArea !== undefined
              ? String(forcedInitialArea)
              : questions.length === 1
                ? values[questions[0].key] || undefined
                : undefined
          }
          onAreaChange={handleAreaChange}
        />

        {error && <p className="mt-4 text-sm text-safety">{error}</p>}

        <SubmitActions onSubmit={handleSubmit} onSaveForLater={onSaveForLater} />
      </div>
    );
  }

  return (
    <div
      className={
        diagram
          ? "bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8 grid lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:items-center"
          : undefined
      }
    >
      {diagram && (
        <div className="order-1 lg:order-2 mb-6 lg:mb-0">
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
      <div className={diagram ? "order-2 lg:order-1" : undefined}>
      {combined && (
        <div className="mb-5">
          <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight">{combined.label}</h2>
          <p className="text-sm text-ink-muted mt-2 mb-4">{combined.helpText}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {pairedQuestions.map((question, i) => (
              <div key={question.id}>
                <span className="block text-sm font-medium text-ink-muted mb-1.5">
                  {capitalize(i === 0 ? diagram?.primaryLabel ?? question.label : diagram?.secondaryLabel ?? question.label)}
                </span>
                <div className="flex items-center gap-3 rounded-2xl bg-white border-[1.5px] border-ink px-5 py-4">
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus={i === 0}
                    value={values[question.key]}
                    onChange={(e) => setValue(question.key, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="0"
                    className="w-full bg-transparent outline-none font-display placeholder:text-ink-faint text-2xl"
                  />
                  {question.unit && <span className="font-mono text-sm text-ink-muted">{question.unit}</span>}
                </div>
                {rangeWarnings[question.key] && (
                  <p className="mt-2 text-sm text-amber-600">{rangeWarnings[question.key]}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-concrete px-5 py-4 text-center">
            <p className="text-sm text-ink-muted">{combined.areaLabel}</p>
            <p className="font-display text-2xl font-semibold text-ink">
              {areaValue !== null ? `${formatQuantity(areaValue)} m²` : "—"}
            </p>
          </div>
        </div>
      )}
      {extraQuestions.length > 0 && (
      <div
        className={
          threeInRow
            ? "grid gap-3 sm:grid-cols-3"
            : compact
              ? "grid gap-3 sm:grid-cols-2"
              : sideBySide
                ? "grid gap-5 sm:grid-cols-2"
                : "grid gap-5"
        }
      >
        {extraQuestions.map((question, i) => {
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
                  autoFocus={!combined && i === 0}
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
      )}

      {error && <p className="mt-4 text-sm text-safety">{error}</p>}

      <SubmitActions onSubmit={handleSubmit} onSaveForLater={diagram ? onSaveForLater : undefined} />
      </div>
    </div>
  );
}
