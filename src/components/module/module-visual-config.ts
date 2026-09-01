// Registro único de configuración visual del framework — Fase de
// consolidación (2026-08-02), aprobada por Jorge: antes esta configuración
// vivía dispersa en 6 mapas independientes (DIMENSION_DIAGRAMS,
// COMBINED_AREA_QUESTION, RECALCULATE_FIELDS, HERO_RESULT_KEYS,
// OPTIONAL_QUESTION_KEYS en question-group-step.tsx/module-wizard.tsx),
// cada uno indexado en un espacio de claves distinto (stepGroup vs
// moduleSlug) y sin ningún registro central que documentara qué cuid
// pertenece a qué módulo — esa relación solo existía en comentarios sueltos
// junto a cada entrada.
//
// Acá se concentra TODA la configuración visual por módulo, indexada por
// moduleSlug (la identidad estable y legible de cada calculadora). Los 5
// mapas planos que el resto del código ya conocía (DIMENSION_DIAGRAMS,
// COMBINED_AREA_QUESTION, HERO_RESULT_KEYS, RECALCULATE_FIELDS,
// OPTIONAL_QUESTION_KEYS) se siguen exportando con el mismo nombre y misma
// forma que antes — se DERIVAN de MODULE_CONFIG más abajo — así que ningún
// punto de lectura en question-group-step.tsx/module-wizard.tsx necesitó
// cambiar: es una reorganización de dónde vive el dato, no de cómo se
// consulta en tiempo de ejecución. Regla de esta fase: cero cambios de
// comportamiento, solo arquitectura.

// Diagramas de medida — uno por cada stepGroup de exactamente 2 campos
// NUMBER confirmado por auditoría real contra la base. Grupos de 3+ campos
// quedan fuera salvo los explícitamente habilitados (ver `compact` en
// question-group-step.tsx), igual que los pares que no son geométricamente
// una medida ancho/largo (ej. dos espesores distintos, o una cantidad + una
// medida).
export type DiagramConfig = {
  // "slab-with-depth" (Fase 5, Radier) — mismos campos/labels/cotas que
  // "rectangle-with-depth", pero DiagramV2 dibuja kind="slab" en vez de
  // kind="box" (ver volume-step.tsx): una losa delgada con un borde
  // plano de un solo tono, en vez de una caja isométrica de 2 caras con
  // contraste fuerte. Ver DiagramV2.tsx y math/scale-engine.ts
  // (compressedSlabRatios) para el detalle — sin tocar "box" ni ningún
  // otro módulo que use "rectangle-with-depth".
  // "pit-with-depth"/"pit-circle-with-depth" (Fase B, 2026-08-31): mismos
  // campos/labels/cotas que "rectangle-with-depth"/"circle-with-depth",
  // pero VolumeStep dibuja PoolExcavationIllustration (terreno + hueco)
  // en vez de DiagramV2 — ver volume-step.tsx. Aplicado globalmente al
  // módulo Excavación (rect/circ), no solo dentro del plan de Piscinas:
  // la representación es semánticamente correcta para todos sus usos.
  //
  // "pool-structure-with-depth"/"pool-structure-circle-with-depth" (Fase
  // B): SOLO para el stepGroup de espesores de Piscina (rect/circ) — 2
  // preguntas de espesor (muro=primary, fondo=depth, sin secondary),
  // ruteadas a PoolStructureIllustration en vez de DiagramV2. Ver
  // `sourceDimensionKeys` para cómo la ilustración recupera largo/ancho/
  // diámetro/profundidad ya respondidos en el Paso 1, sin duplicar
  // preguntas ni estado.
  //
  // "pool-integral-*-with-depth" (Fase C1, 2026-08-31): EXCLUSIVO del
  // Module nuevo `piscina-integral` (configurador integral) — nunca usado
  // por ningún otro módulo, ni por los standalone de Piscina. Rutea a
  // PoolConfiguratorIllustration (componente propio, distinto de
  // PoolStructureIllustration) en un estado "medidas" (rect/circ, 2-3
  // campos, sin espesores aún) o "estructura" (rect/circ, espesor muro/
  // losa, lee largo/ancho/profundidad ya respondidos vía
  // `sourceDimensionKeys`, mismo mecanismo ya usado en Fase B). También
  // gatea el header de bloque ("MEDIDAS"/"ESTRUCTURA") de
  // PoolConfiguratorLayout — ver `poolConfiguratorBlockLabel`.
  shape:
    | "rectangle"
    | "rectangle-with-depth"
    | "slab-with-depth"
    | "circle"
    | "circle-with-depth"
    | "pit-with-depth"
    | "pit-circle-with-depth"
    | "pool-structure-with-depth"
    | "pool-structure-circle-with-depth"
    | "pool-integral-medidas-rect-with-depth"
    | "pool-integral-medidas-circ-with-depth"
    | "pool-integral-estructura-rect-with-depth"
    | "pool-integral-estructura-circ-with-depth";
  primaryLabel: string;
  secondaryLabel?: string;
  depthLabel?: string;
  // Habilita el toggle largo×ancho / m² directo (AreaInputToggle) en vez
  // del grid de 2 campos fijo — solo para pares donde NINGUNA otra fórmula
  // del módulo usa largo/ancho por separado (perímetro, volumen, vigas,
  // etc.), auditado caso a caso: si algo más depende de las dimensiones
  // individuales, el modo "m² directo" reconstruiría un cuadrado ficticio
  // (lado = √área) y esa otra fórmula quedaría mal — por eso NO se habilita
  // en todos los pares "rectangle".
  allowAreaToggle?: boolean;
  // Además del toggle largo×ancho/m², permite descontar vanos (puertas/
  // ventanas) del área bruta en modo largo×ancho — ver AreaInputToggle.
  enableDeduction?: boolean;
  deductionLabel?: string;
  // "Calculadora de PINTURA rediseñada" (2026-08-30, aprobado por Jorge)
  // — rutea este stepGroup a PinturaAreaStep (componente standalone) en
  // vez de AreaInputToggle (compartido). Presente ÚNICAMENTE en la
  // entrada "pintura": Muro de bloques o ladrillos y Pintar una fachada
  // exterior también tienen enableDeduction pero NO este flag, así que
  // siguen usando AreaInputToggle exactamente igual que siempre — no
  // ganan el descuento de vanos en modo "m² directo" ni la tarjeta de
  // resultado de 3 celdas, a propósito (decisión confirmada por Jorge:
  // no extender este comportamiento fuera de Pintura en esta fase).
  standaloneAreaStep?: boolean;
  // Sub-etiqueta corta bajo cada label de campo (ej. "El lado más largo")
  // — solo usada por los grupos con depthLabel (volumen). El resto de los
  // grupos (área) no la necesita — su patrón de campo no cambió.
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
  // Fase B.1 (2026-08-31, Excavación): contenido técnico adicional que
  // NO debe perderse (holgura, moldaje, sistema constructivo) pero que
  // volvía la explicación de arriba (`groupHelpText`) demasiado larga en
  // mobile, empujando la ilustración fuera de la primera pantalla —
  // detectado en verificación visual. Cuando está presente, VolumeStep lo
  // muestra colapsado detrás de un ícono (i) "¿Cómo medir?", mismo patrón
  // ya usado por `CollapsibleHelp`/`isHelpCollapsed` para helpText largo de
  // preguntas individuales — no es un mecanismo nuevo. Ausente en todo
  // módulo que no lo necesite (su `groupHelpText` sigue mostrándose
  // completo y siempre visible, sin cambios).
  groupHelpTextDetail?: string;
  // Además del cuadro de volumen en vivo, muestra la superficie (primario
  // × secundario) al lado — solo tiene sentido cuando esos 2 campos son
  // realmente el contorno/footprint de la figura (ej. Radier: largo ×
  // ancho = superficie del radier), no en todos los grupos de 3 campos.
  showArea?: boolean;
  areaResultLabel?: string;
  // Retícula de modulación (Cerámica/Porcelanato) — key de la pregunta
  // SELECT de tamaño de pieza, respondida en un paso ANTERIOR a este. Su
  // valor ("60x60cm") se lee de `initialValues` y se parsea con
  // parseTileSizeCm — nunca se inventa un tamaño si la opción es
  // "personalizada" u otro formato no reconocido.
  tileSizeQuestionKey?: string;
  // Pista de orientación (SPC/flotante) — key de la pregunta SELECT "¿Qué
  // tipo de instalación?" (opciones "recto"/"diagonal"). Mutuamente
  // excluyente con tileSizeQuestionKey.
  orientationQuestionKey?: string;
  // Piscina — activa el lavado de agua en el diagrama box/cylinder (ver
  // waterFill en DiagramV2). Solo tiene sentido junto a depthLabel.
  waterFill?: boolean;
  // Techumbres — key de la pregunta SELECT "¿Qué tan inclinado es el
  // techo?", respondida en un paso ANTERIOR a este. El valor se mapea a un
  // factor real vía ROOF_SLOPE_FACTORS (mismos 3 valores que la Variable
  // "factor-de-inclinacion" del motor de fórmulas).
  slopeQuestionKey?: string;
  // Piscina Paso 2 (espesores) — SOLO para shapes "pool-structure-*": keys
  // de las preguntas de MEDIDAS (Paso 1, un stepGroup ANTERIOR y distinto
  // a este) que la ilustración necesita mostrar junto a los espesores
  // (largo/ancho/profundidad o diámetro/profundidad). Se leen de
  // `initialValues` (todas las respuestas previas del wizard, no solo las
  // de este grupo — mismo mecanismo ya usado por tileSizeQuestionKey/
  // orientationQuestionKey/slopeQuestionKey) — nunca se duplica la
  // pregunta ni se crea una Variable nueva.
  sourceDimensionKeys?: { primary: string; secondary?: string; depth: string };
  // Fase C1 — EXCLUSIVO de shapes "pool-integral-*": rótulo del bloque
  // ("Medidas"/"Estructura") que PoolConfiguratorLayout muestra como
  // encabezado, en vez del <h2> genérico de `groupLabel` — es lo que hace
  // que el Module `piscina-integral` se sienta como un configurador por
  // bloques y no como un wizard genérico de preguntas sueltas. Ausente
  // (undefined) en todo el resto de los módulos: VolumeStep sigue
  // mostrando su `groupLabel` de siempre, sin cambios.
  poolConfiguratorBlockLabel?: string;
};

export type CombinedAreaQuestionConfig = { label: string; helpText: string; areaLabel: string };

export type ModuleVisualConfig = {
  // stepGroup -> DiagramConfig. Un módulo puede tener más de un stepGroup
  // con diagrama (ej. ninguno hoy tiene 2, pero la forma lo permite).
  diagrams?: Record<string, DiagramConfig>;
  // stepGroup -> layout combinado (largo+ancho en una sola pregunta con
  // caja de superficie en vivo) — ver COMBINED_AREA_QUESTION más abajo.
  combinedAreaQuestion?: Record<string, CombinedAreaQuestionConfig>;
  // Ver HERO_RESULT_KEYS.
  heroResultKey?: string;
  // Ver RECALCULATE_FIELDS.
  recalculateField?: string;
  // Ver OPTIONAL_QUESTION_KEYS.
  optionalQuestionKeys?: string[];
  // Ver RECIPE_GROUPS.
  recipeGroups?: RecipeGroupConfig[];
  // Ver DOSIFICACION_GROUPS.
  dosificacionGroups?: DosificacionGroupConfig[];
  // Ver CONSOLIDATE_NOTES_KEYS.
  consolidateNotesKeys?: string[];
  // Ver EXCLUDE_FROM_LIST_KEYS.
  excludeFromListKeys?: string[];
  // Ver HERO_POSITIONS. Default "top" (comportamiento de siempre).
  heroPosition?: "top" | "beforeMaterials";
  // Ver REFUERZO_CONFIG.
  refuerzo?: RefuerzoConfig;
};

// Fase 5 (Radier) — arma la RefuerzoCard a partir de 2 InfoResult (estado
// + explicación, ver Variable.key) más una nota estática (no depende de
// datos, es siempre el mismo texto para cualquier uso). Genérico, sin
// nada de Radier hardcodeado en el componente — cualquier módulo futuro
// con el mismo patrón agrega su propia entrada acá.
export type RefuerzoConfig = {
  title: string;
  materialLabel: string;
  estadoKey: string;
  explicacionKey: string;
  nota: string;
};

// Fase 9B, sprint UX V1.2 (04-ago-2026) — agrupa un resultado "primario"
// (ej. cantidad de cargas de betonera) con sus resultados "ingrediente"
// (ej. cemento/arena/gravilla/agua por carga) para que ResultScreen los
// pinte juntos en una tarjeta de receta (ver RecipeCard), en vez de la
// lista genérica de PricedResults. Genérico a propósito — cualquier
// módulo futuro con el mismo patrón ("una cantidad base + su desglose de
// ingredientes por unidad") reutiliza esto sin escribir componente
// nuevo, con solo agregar su propia entrada acá.
export type RecipeGroupConfig = {
  title: string;
  primaryKey: string;
  itemKeys: string[];
};

// Fase 4 (Radier, 13-ago-2026) — agrupa una "dosificación referencial"
// (proporción práctica por unidad base, ej. 1 saco de cemento) con sus
// Formula.key ingrediente, para que ResultScreen los pinte juntos en una
// DosificacionCard (ámbar, distinta de RecipeCard) en vez de la lista
// genérica de PricedResults. Genérico, sin nada de Radier hardcodeado —
// mismo criterio que RecipeGroupConfig.
export type DosificacionGroupConfig = {
  title: string;
  subtitle: string;
  baseLabel: string;
  baseValue: string;
  baseUnit: string;
  itemKeys: string[];
  tip: string;
  disclaimer: string;
  sourceLabel: string;
};

// Mismo factor que ya usa la Variable "factor-de-inclinacion" (LOOKUP) en
// Techo inclinado y Techo (cubierta) — no es un cálculo nuevo, es el MISMO
// dato ya usado por el motor de fórmulas, solo expuesto acá para que el
// diagrama pueda dibujar el plano inclinado sin re-ejecutar el motor. No es
// configuración POR módulo (no vive en MODULE_CONFIG) — es una tabla de
// valores compartida, referenciada desde dos módulos vía slopeQuestionKey.
export const ROOF_SLOPE_FACTORS: Record<string, number> = {
  "poco-inclinado-hasta-15": 1.03,
  "medio-15-a-30": 1.15,
  "muy-inclinado-mas-de-30": 1.3,
};

export const MODULE_CONFIG: Record<string, ModuleVisualConfig> = {
  "instalar-una-ducha": {
    diagrams: { "ducha-dims": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "profundidad" } },
  },
  "hacer-un-sendero": {
    diagrams: { "sendero-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true } },
  },
  // Radier — antes "rectangle" (2D, solo largo/ancho); el espesor vivía en
  // un stepGroup separado sin wireo al diagrama. Rediseño de flujo (spec
  // "ObraBien Calculadora - Flujo rediseñado", 2026-08-01): el espesor se
  // fusiona a este mismo paso, precargado según el uso (Question.
  // defaultSource) y editable — el diagrama pasa a "rectangle-with-depth"
  // (caja 3D real), mismo patrón que Excavación/Pilar. No cambia la
  // fórmula del volumen (sigue siendo largo × ancho × espesor/100 en el
  // motor DSL) — solo dónde se pregunta el espesor y cómo se dibuja.
  radier: {
    diagrams: {
      "radier-medidas": {
        shape: "slab-with-depth",
        primaryLabel: "largo",
        secondaryLabel: "ancho",
        // "Espesor recomendado" (no solo "Espesor") — Fase 1, sprint UX
        // V1.2 (04-ago-2026): el valor viene precargado según el uso
        // elegido, así que el label debe dejar claro que es una sugerencia
        // editable, no una medida que el usuario tiene que saber de memoria.
        depthLabel: "espesor recomendado",
        primarySubLabel: "El lado más largo",
        secondarySubLabel: "El lado más corto",
        depthSubLabel: "Sugerido según el uso, puedes ajustarlo",
        volumeResultLabel: "Volumen de hormigón",
        groupLabel: "¿Qué medidas tiene el radier?",
        groupHelpText: "Mide de pared a pared, por el suelo. El espesor viene precargado según el uso que elegiste, pero puedes ajustarlo.",
        showArea: true,
        areaResultLabel: "Superficie del radier",
      },
    },
    // Editar el espesor desde el resultado dispara un recálculo completo
    // sin volver atrás en el wizard (ver RecalculateField en
    // result-screen.tsx) — mecanismo genérico, por ahora solo conectado acá.
    recalculateField: "espesor_cm",
    // Fase 5 (13-ago-2026): "Volumen de hormigón" pasa a ser el resultado
    // protagonista (ResultHero, azul) en vez de Cemento — pedido explícito
    // del usuario ("VOLUMEN DE HORMIGÓN — AZUL" como su propio bloque,
    // separado de "MATERIALES"). Solo existe bajo metodo_hormigon=manual
    // (condition de la Formula); con premezclado, "volumen_total" no se
    // computa, heroResult no encuentra match, showsHero cae a false, y el
    // comportamiento vuelve a ser exactamente el de siempre para ese
    // camino (volumen_premezclado como primer ítem destacado de la lista
    // — ver comentario en result-screen.tsx sobre showsHero). Se excluye
    // "volumen_total" de la lista genérica para que no aparezca dos veces
    // (una vez en ResultHero, otra como fila de "Materiales") —
    // "volumen_premezclado" NO está en esta lista a propósito: bajo
    // premezclado no hay hero, así que necesita seguir siendo el primer
    // ítem de la lista para conservar su propio destaque, como antes.
    heroResultKey: "volumen_total",
    excludeFromListKeys: ["volumen_total"],
    heroPosition: "beforeMaterials",
    refuerzo: {
      title: "Refuerzo recomendado",
      materialLabel: "Malla electrosoldada",
      estadoKey: "refuerzo_estado",
      explicacionKey: "refuerzo_explicacion",
      nota: "Esta es una orientación general. El tipo y dimensionamiento definitivo del refuerzo debe definirse según espesor, base, cargas y especificaciones del proyecto. ObraBien no realiza dimensionamiento estructural.",
    },
    // Fase 9B (04-ago-2026) agregó una RecipeCard de "Dosificación por
    // carga de betonera" acá — Fase 5 (13-ago-2026) la retiró del
    // resultado por pedido explícito (dos "recetas" simultáneas —por saco
    // y por carga— confundían más de lo que ayudaban). La lógica del
    // motor sigue intacta (Formula.key "numero_cargas_betonera" +
    // "*_por_carga" se siguen calculando, solo con isResult:false — ver
    // db-fixes/fase5-radier-limpieza-refuerzo-betonera.ts): si alguna
    // vez se necesita mostrarla de nuevo, es solo volver a agregar este
    // bloque, sin tocar el motor.
    // Fase 4 (13-ago-2026): dosificación referencial por saco, en baldes de
    // 10L (ver dosif_arena_baldes/dosif_grava_baldes/dosif_agua_litros,
    // derivadas de las mismas Variables por m³ que ya alimentan
    // "materiales totales" — nunca puede quedar matemáticamente
    // incoherente con esos totales). Se muestra ANTES de "Volumen de
    // hormigón"/"materiales totales" en ResultScreen (ver ese archivo) —
    // es la información más práctica para quien prepara el hormigón.
    dosificacionGroups: [
      {
        title: "Dosificación referencial estimada",
        subtitle: "Para preparación manual en obra",
        baseLabel: "Cemento",
        baseValue: "1",
        baseUnit: "saco de 25 kg",
        itemKeys: ["dosif_arena_baldes", "dosif_grava_baldes", "dosif_agua_litros"],
        tip: "Usa siempre el mismo recipiente para medir los áridos.",
        disclaimer:
          "Referencia práctica. La cantidad real puede variar según los áridos, su humedad y las condiciones de obra. No garantiza por sí sola el grado de resistencia indicado — para mayor exigencia, usa una dosificación diseñada o considera hormigón premezclado.",
        sourceLabel: "Polpaico (dosificaciones sobre NCh170:2016)",
      },
    ],
    // Fase 5 (13-ago-2026): las notas técnicas de estos 4 materiales
    // (fórmula, fuente citada) se sacan de su tarjeta individual (ver
    // `suppressNoteForKeys` en PricedResults) y se consolidan en un solo
    // colapsable al final (ver TechnicalNotesSection en result-screen.tsx)
    // — el pedido explícito fue "no repetir fuentes técnicas dentro de
    // cada tarjeta". Volumen de hormigón NO está acá a propósito: su nota
    // (desglose 1,92 -> 3 -> 3,21 m³) es justamente lo que explica ESE
    // número, tiene sentido quedarse pegada a él.
    consolidateNotesKeys: ["cemento_manual", "arena_manual", "gravilla_manual", "agua_manual"],
  },
  "ceramica-pisos": {
    diagrams: {
      cmru6tntl00000kseunldpq7g: {
        shape: "rectangle",
        primaryLabel: "largo",
        secondaryLabel: "ancho",
        allowAreaToggle: true,
        tileSizeQuestionKey: "que-tamano-de-ceramica-vas-a-usar",
      },
    },
  },
  "tabiques-y-cielos": {
    diagrams: { cmrtvl3aw000fmcsezs6inad3: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true } },
  },
  "pasto-en-panes": {
    diagrams: {
      cmrtvl24q000amcse8s2dj1ex: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true },
      // Pasto en rollos (personalizado) — medida del rollo, no área a cubrir.
      "rollo-personalizado": { shape: "rectangle", primaryLabel: "ancho", secondaryLabel: "largo" },
    },
  },
  impermeabilizacion: {
    diagrams: { cmrtvkzox0000mcse4sc28ke7: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true } },
  },
  // Fundación NO tiene entrada acá a propósito (Fase 4, 2026-08-02): antes
  // "base" y "cuello" eran 2 entradas "rectangle" (2D) en 2 pasos
  // separados. Ahora las 5 medidas (largo + base + cuello) se fusionaron a
  // un solo stepGroup y se renderizan con FoundationStep (componente
  // específico, no QuestionGroupStep) — mismo motor de diagramas,
  // kind="steppedBox" — ver isFoundationStepGroup en foundation-step.tsx.
  //
  // Muro de hormigón armado — antes "rectangle" (2D, solo largo×alto); el
  // espesor era una pregunta SELECT en un paso separado. Fase 4 (decisión
  // de producto, 2026-08-02, opción B): se mantiene como SELECT (opciones
  // técnicas fijas, no un NUMBER libre) pero se fusiona al mismo paso — el
  // diagrama ahora interpreta el valor elegido vía QuestionOption.
  // numericValue (ver toFieldNum en VolumeStep). No cambia la fórmula.
  "muro-de-hormigon-armado": {
    diagrams: {
      cmrtwxnbu0001zgsee2b5ehv0: {
        shape: "rectangle-with-depth",
        primaryLabel: "largo",
        secondaryLabel: "alto",
        depthLabel: "espesor",
        primarySubLabel: "Largo del muro",
        secondarySubLabel: "Altura del muro",
        depthSubLabel: "Elige el espesor técnico",
        volumeResultLabel: "Volumen de hormigón",
        groupLabel: "¿Qué medidas tiene el muro?",
        groupHelpText: "Largo y alto del muro, más el espesor técnico según el cálculo estructural.",
      },
    },
  },
  "revestimiento-de-muro": {
    diagrams: { cmrtx37y50002s4se6alp133w: { shape: "rectangle", primaryLabel: "alto", secondaryLabel: "largo", allowAreaToggle: true } },
  },
  // Cadena y Viga — antes "rectangle" (2D, solo la sección ancho×alto);
  // "largo" vivía en un paso separado sin wireo al diagrama. Fase 4 Grupo 1
  // (Hormigón, 2026-08-02): se fusiona "largo" al mismo paso, mismo patrón
  // ya usado por Pilar/columna (rectangle-with-depth). depthLabel="largo"
  // en vez de "profundidad" porque estos son elementos alargados (largo es
  // la dimensión dominante, no una profundidad de excavación) — el label
  // visible es el string real, "profundidad" es solo el nombre interno del
  // slot del diagrama. No cambia ninguna fórmula.
  cadena: {
    diagrams: {
      cmrtxip5u0002nwsec9f37ved: {
        shape: "rectangle-with-depth",
        primaryLabel: "ancho",
        secondaryLabel: "alto",
        depthLabel: "largo",
        primarySubLabel: "Ancho de la sección",
        secondarySubLabel: "Alto de la sección",
        depthSubLabel: "Largo total de la cadena",
        volumeResultLabel: "Volumen de hormigón",
        groupLabel: "¿Qué medidas tiene la cadena?",
        groupHelpText: "Sección transversal (ancho × alto) y largo total del tramo.",
      },
    },
  },
  viga: {
    diagrams: {
      cmrtxmp220003dgsew3pzeapk: {
        shape: "rectangle-with-depth",
        primaryLabel: "ancho",
        secondaryLabel: "alto",
        depthLabel: "largo",
        primarySubLabel: "Ancho de la sección",
        secondarySubLabel: "Alto de la sección",
        depthSubLabel: "Largo total de la viga",
        volumeResultLabel: "Volumen de hormigón",
        groupLabel: "¿Qué medidas tiene la viga?",
        groupHelpText: "Sección transversal (ancho × alto) y largo total del tramo.",
      },
    },
  },
  // Losa — mismo caso que Muro de hormigón armado (ver comentario arriba).
  losa: {
    diagrams: {
      cmrtxpdrt00021ose5gav5sc5: {
        shape: "rectangle-with-depth",
        primaryLabel: "largo",
        secondaryLabel: "ancho",
        depthLabel: "espesor",
        primarySubLabel: "El lado más largo",
        secondarySubLabel: "El lado más corto",
        depthSubLabel: "Elige el espesor técnico",
        volumeResultLabel: "Volumen de hormigón",
        groupLabel: "¿Qué medidas tiene la losa?",
        groupHelpText: "Mide de borde a borde, más el espesor técnico según el cálculo estructural.",
      },
    },
  },
  // Piscina circular — Fase 4 Grupo 4 (2026-08-02): waterFill activa el
  // lavado celeste sobre el mismo cilindro de siempre; heroResultKey
  // fuerza el volumen de agua (litros) como dato protagonista en vez del
  // primer resultado priced (hormigón, que sigue destacado abajo).
  "piscina-circular-hormigon-armado": {
    diagrams: {
      cmrtycwly00013ssecmdopk1c: {
        shape: "circle-with-depth",
        primaryLabel: "diámetro",
        depthLabel: "profundidad",
        primarySubLabel: "De borde a borde",
        depthSubLabel: "Del fondo al borde",
        // BUG-005 (auditoría funcional 02-ago-2026): en este paso (antes
        // de preguntar espesor de muros/losa) el número que se calcula es
        // el volumen del espejo de agua interior, no de hormigón — la
        // etiqueta decía "Volumen de hormigón" por copiarse de los demás
        // módulos de esta misma familia (Fundación, Viga, Muro, etc.),
        // donde si es hormigón desde este primer paso. El resultado final
        // (heroResultKey abajo) ya separaba agua y hormigón
        // correctamente; esto solo corrige la vista previa del paso 1.
        volumeResultLabel: "Volumen de agua (referencial)",
        groupLabel: "¿Qué medidas tiene la piscina?",
        groupHelpText: "Medida interior del espejo de agua, de borde a borde.",
        waterFill: true,
      },
      // Fase B (2026-08-31): el grupo "espesor de muros x espesor de losa"
      // ya no queda excluido — antes un rectángulo genérico habría
      // confundido más de lo que ayuda (dos espesores de partes distintas,
      // no una pareja ancho/largo de una misma figura); ahora se rutea a
      // PoolStructureIllustration (ilustración del vaso estructural), que
      // sí distingue explícitamente muro de fondo/losa. "espesor de los
      // muros" = primary, "espesor del fondo/losa" = depth (2 preguntas,
      // sin secondary — mismo patrón de 2 campos que Piscina circular
      // Paso 1). `sourceDimensionKeys` recupera diámetro/profundidad del
      // Paso 1 (stepGroup ANTERIOR) desde `initialValues`, sin duplicar
      // preguntas ni estado.
      cmrwrhv06000edosesg7vud51: {
        shape: "pool-structure-circle-with-depth",
        primaryLabel: "espesor de los muros",
        depthLabel: "espesor del fondo/losa",
        groupLabel: "Espesores del vaso",
        sourceDimensionKeys: { primary: "diametro", depth: "profundidad" },
      },
    },
    heroResultKey: "volumen-de-agua",
  },
  "tabiqueria-en-madera": {
    diagrams: { cmru1qiwi00025csexc68m1cg: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" } },
  },
  "tabique-en-metalcon": {
    diagrams: { cmru1qkjd000n5csewzys8ivv: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto" } },
  },
  "piso-y-terraza-en-madera": {
    // largo-m/ancho-m también calculan vigas — por eso no lleva allowAreaToggle.
    diagrams: { cmru3eoou00010oseh4l9ac15: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" } },
    combinedAreaQuestion: {
      cmru3eoou00010oseh4l9ac15: {
        label: "¿Cuánto mide de largo y ancho?",
        helpText: "Mide el piso o terraza de borde a borde, por el suelo.",
        areaLabel: "Superficie del piso/terraza",
      },
    },
  },
  "cielo-con-estructura-de-madera": {
    diagrams: { cmru3eqsw000q0osehvujfuyu: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" } },
  },
  "porcelanato-piso": {
    diagrams: {
      cmru6tpo600050kseszh7cl1k: {
        shape: "rectangle",
        primaryLabel: "largo",
        secondaryLabel: "ancho",
        allowAreaToggle: true,
        tileSizeQuestionKey: "que-tamano-de-porcelanato-vas-a-usar",
      },
    },
  },
  "piso-flotante-laminado": {
    // largo-m/ancho-m también calculan el perímetro (moldura) — por eso no
    // lleva allowAreaToggle.
    diagrams: {
      cmru4zt0j0001yssecv7ercx3: {
        shape: "rectangle",
        primaryLabel: "largo",
        secondaryLabel: "ancho",
        orientationQuestionKey: "que-tipo-de-instalacion",
      },
    },
    combinedAreaQuestion: {
      cmru4zt0j0001yssecv7ercx3: {
        label: "¿Cuánto mide de largo y ancho el espacio?",
        helpText: "Mide de pared a pared, por el suelo. Si el espacio no es un rectángulo perfecto, usa la medida más larga por lado.",
        areaLabel: "Superficie del piso",
      },
    },
  },
  "piso-spc-vinilico-rigido": {
    // Mismo caso que Piso flotante (perímetro).
    diagrams: {
      cmru51j2t000128se69qh7xm7: {
        shape: "rectangle",
        primaryLabel: "largo",
        secondaryLabel: "ancho",
        orientationQuestionKey: "que-tipo-de-instalacion",
      },
    },
    combinedAreaQuestion: {
      cmru51j2t000128se69qh7xm7: {
        label: "¿Cuánto mide de largo y ancho el espacio?",
        helpText: "Mide de pared a pared, por el suelo. Si el espacio no es un rectángulo perfecto, usa la medida más larga por lado.",
        areaLabel: "Superficie del piso",
      },
    },
  },
  "aislacion-termica-bajo-cubierta": {
    diagrams: { cmruwyzxk0001gcseu3hskggo: { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true } },
  },
  "techo-inclinado-bajo-teja-zinc": {
    diagrams: {
      cmrv640ny00013oseqrvvxb50: {
        shape: "rectangle",
        primaryLabel: "largo",
        secondaryLabel: "ancho",
        allowAreaToggle: true,
        slopeQuestionKey: "que-tan-inclinado-es-el-techo",
      },
    },
  },
  "pasto-sintetico": {
    // largo/ancho también calculan costuras, franjas y grapas.
    diagrams: { "area-pasto-sintetico": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" } },
    combinedAreaQuestion: {
      "area-pasto-sintetico": {
        label: "¿Cuánto mide de largo y ancho el área?",
        helpText: "Mide el área a cubrir con pasto sintético, de borde a borde.",
        areaLabel: "Superficie de pasto sintético",
      },
    },
  },
  // Jardinera de albañilería: las 3 medidas (largo/alto/ancho) ahora
  // comparten un solo paso — antes el ancho quedaba en un paso aparte, sin
  // relación visual con largo/alto. depthLabel="ancho" es la profundidad
  // de la jardinera (front-to-back), mismo patrón que Piscina rectangular.
  // largo/alto/ancho también calculan el volumen de tierra.
  "hacer-jardineras": {
    diagrams: {
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
      },
    },
    // Nota: esta entrada queda sin efecto — el stepGroup tiene depthLabel,
    // así que siempre renderiza vía VolumeStep (prioridad sobre `combined`
    // en question-group-step.tsx), igual que ya pasaba con Piscina
    // rectangular. Se conserva tal cual estaba (cero cambios de
    // comportamiento en esta fase de consolidación).
    combinedAreaQuestion: {
      "jardinera-muro-dims": {
        label: "¿Cuánto mide de largo y alto la jardinera?",
        helpText: "Largo total del muro y su altura. Lo típico es entre 0,3 y 0,5 metros de alto.",
        areaLabel: "Superficie del muro",
      },
    },
  },
  "excavacion-circular": {
    diagrams: {
      "excavacion-circular-dims": {
        // Fase B (2026-08-31): "circle-with-depth" -> "pit-circle-with-depth"
        // — mismos campos/cotas/textos, pero VolumeStep dibuja
        // PoolExcavationIllustration (terreno + hueco) en vez de DiagramV2.
        // Aplicado globalmente (ver comentario del type `shape` arriba):
        // este módulo también se usa suelto en Herramientas avanzadas, no
        // solo dentro del plan "Construir una piscina" — la ilustración es
        // correcta para ambos usos por igual.
        shape: "pit-circle-with-depth",
        primaryLabel: "diámetro",
        depthLabel: "profundidad",
        primarySubLabel: "De borde a borde",
        depthSubLabel: "Del suelo hasta el fondo",
        volumeResultLabel: "Volumen a excavar",
        groupLabel: "¿Qué medidas tiene la excavación?",
        // Sprint UX "Construir una piscina" (03-ago-2026), ítem 2: antes solo
        // el campo "diámetro" aclaraba hoyo-vs-piscina (via su helpText
        // propio); acá se sube al groupHelpText (siempre visible, no solo al
        // abrir un campo) e iguala textualmente con la variante rectangular.
        // Fase 1, Sprint Producto V1.3 (04-ago-2026): se agrega la
        // referencia de holgura (20-30cm) pedida por Jorge — puramente
        // texto, no crea ninguna Variable/Formula ni toca el cálculo. Se
        // redacta como recomendación explícita ("como referencia", "no
        // un cálculo"), nunca como una medida verificada, y se aclara que
        // depende del sistema constructivo — mismo criterio editorial ya
        // usado en el resto de los helpText/note del proyecto.
        // Fase B.1 (2026-08-31): el texto completo (holgura, moldaje,
        // sistema constructivo) empujaba la ilustración fuera de la
        // primera pantalla en mobile — se divide en un resumen siempre
        // visible + el resto colapsado detrás de "¿Cómo medir?"
        // (`groupHelpTextDetail`, ver comentario en el type DiagramConfig).
        // Cero contenido eliminado, solo reordenado.
        groupHelpText: "Mide el hoyo terminado, no la marca en el suelo ni el tamaño de la piscina.",
        groupHelpTextDetail:
          "El hoyo va más ancho y profundo que la piscina para dejar espacio de moldaje y el espesor del muro. La profundidad se mide desde el nivel del terreno hasta el fondo. Como referencia general, muchos proyectos dejan entre 20 y 30 cm de holgura alrededor de la piscina — es solo una recomendación, no un cálculo: el valor real depende del sistema constructivo que uses, confírmalo con tu maestro o constructor.",
      },
    },
  },
  "cielo-raso-en-metalcon": {
    diagrams: { "cielo-metalcon-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" } },
  },
  // Techo (cubierta): antes 2 pasos sin agrupar ni diagrama. allowAreaToggle
  // desactivado a propósito — desde que zinc/acero usa cálculo por grilla
  // (filas × planchas por fila), el modo "m² directo" reconstruiría un
  // cuadrado ficticio y rompería ese cálculo para cualquier rectángulo real
  // (mismo riesgo ya identificado y evitado en Pasto sintético).
  cubierta: {
    diagrams: {
      cmrsdqraw0005dkseiur36yb7: {
        shape: "rectangle",
        primaryLabel: "largo",
        secondaryLabel: "ancho",
        slopeQuestionKey: "que-tan-inclinado-es-el-techo",
      },
    },
  },
  // Malla electrosoldada: mismo motivo que Techo (cubierta) — pasó de pedir
  // m² directo a largo/ancho reales para calcular planchas por grilla
  // (ancho útil × largo útil, con traslape real). allowAreaToggle
  // desactivado a propósito: "m² directo" reconstruiría un cuadrado
  // ficticio y rompería la grilla para cualquier rectángulo real.
  "malla-electrosoldada": {
    diagrams: { "malla-electrosoldada-dims": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho" } },
  },

  // Grupos de 1 pregunta (antes single-question steps, sin diagrama): el
  // toggle también aplica cuando el módulo solo pedía m² directo — ver
  // hasAreaToggle() y su uso en ModuleWizard para rutear estos casos por
  // QuestionGroupStep aunque el "grupo" tenga un solo elemento.
  "instalar-pastelones": {
    diagrams: { "pastelones-area-directa": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true } },
  },
  "siembra-por-semilla-cesped": {
    diagrams: { "siembra-area-directa": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "ancho", allowAreaToggle: true } },
  },
  "preparar-y-estucar-un-muro": {
    diagrams: { "estuco-area-directa": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto", allowAreaToggle: true } },
  },
  "terminar-junturas-de-yeso-carton": {
    diagrams: { "yeso-planchas-area-directa": { shape: "rectangle", primaryLabel: "largo", secondaryLabel: "alto", allowAreaToggle: true } },
  },

  // Pintura: reemplaza modo-calculo + cantidad-puertas/ventanas + vanos 1-3
  // + "más de 3" personalizada.
  pintura: {
    diagrams: {
      "pintura-superficie-final": {
        shape: "rectangle",
        primaryLabel: "largo",
        secondaryLabel: "alto",
        allowAreaToggle: true,
        enableDeduction: true,
        deductionLabel: "Puertas y ventanas a descontar",
        standaloneAreaStep: true,
      },
    },
  },
  // Muro de bloques o ladrillos: reemplaza el campo único "m² a descontar"
  // por el mismo descuento de vanos ancho×alto del componente.
  "muro-de-bloques-o-ladrillos": {
    diagrams: {
      "muro-bloques-superficie-final": {
        shape: "rectangle",
        primaryLabel: "largo",
        secondaryLabel: "alto",
        allowAreaToggle: true,
        enableDeduction: true,
        deductionLabel: "Puertas y ventanas a descontar",
      },
    },
  },
  // Pintar una fachada exterior: reemplaza cuantos-vanos-quieres-descontar
  // + vano 1-3 + "más de 3" personalizada, mismo patrón que Pintura.
  "pintar-fachada-exterior": {
    diagrams: {
      "fachada-superficie-final": {
        shape: "rectangle",
        primaryLabel: "largo",
        secondaryLabel: "alto",
        allowAreaToggle: true,
        enableDeduction: true,
        deductionLabel: "Puertas y ventanas a descontar",
      },
    },
  },

  // Grupos de 3 campos y Escalera: excluidos originalmente porque el paso
  // llenaba el viewport de 375px sin margen. Habilitados tras el rediseño
  // de layout compacto (labels chicos, helpText colapsado tras el ícono
  // (i), 2 columnas en desktop) — ver `compact` en question-group-step.tsx.
  //
  // Piscina rectangular — mismo criterio que Piscina circular (waterFill +
  // heroResultKey, ver comentario ahí).
  "piscina-rectangular-hormigon-armado": {
    diagrams: {
      cmrsikxe00001wssef5v6idtl: {
        shape: "rectangle-with-depth",
        primaryLabel: "largo",
        secondaryLabel: "ancho",
        depthLabel: "profundidad",
        primarySubLabel: "El lado más largo",
        secondarySubLabel: "El lado más corto",
        depthSubLabel: "Del fondo al borde",
        // BUG-005 (auditoría funcional 02-ago-2026 + hallazgo durante el
        // Grupo 3, V1.1): mismo defecto reportado para la piscina
        // circular — en este paso (antes de preguntar espesores) el
        // número calculado es el volumen del espejo de agua interior
        // (waterFill: true lo confirma), no de hormigón. La auditoría
        // original solo probó la variante circular; se corrige acá por
        // ser el mismo módulo hermano con el mismo dato mal etiquetado.
        volumeResultLabel: "Volumen de agua (referencial)",
        groupLabel: "¿Qué medidas tiene la piscina?",
        groupHelpText: "Medida interior del espejo de agua, de borde a borde.",
        waterFill: true,
      },
      // Fase B (2026-08-31): mismo motivo/patrón que Piscina circular (ver
      // comentario ahí) — "espesor de los muros" = primary, "espesor del
      // fondo/losa" = depth, sin secondary. `sourceDimensionKeys` recupera
      // largo/ancho/profundidad del Paso 1 desde `initialValues`.
      cmrwrhtiz0000dose4fmkjyia: {
        shape: "pool-structure-with-depth",
        primaryLabel: "espesor de los muros",
        depthLabel: "espesor del fondo/losa",
        groupLabel: "Espesores del vaso",
        sourceDimensionKeys: {
          primary: "largo-de-la-piscina-metros",
          secondary: "ancho-de-la-piscina-metros",
          depth: "profundidad-promedio-metros",
        },
      },
    },
    // Nota: esta entrada queda sin efecto — mismo caso que Jardinera (ver
    // comentario ahí), el stepGroup tiene depthLabel así que VolumeStep
    // tiene prioridad. Se conserva tal cual estaba.
    combinedAreaQuestion: {
      cmrsikxe00001wssef5v6idtl: {
        label: "¿Cuánto mide de largo y ancho la piscina?",
        helpText: "Medida interior del espejo de agua, de borde a borde.",
        areaLabel: "Superficie de la piscina",
      },
    },
    heroResultKey: "volumen-de-agua",
  },
  excavacion: {
    diagrams: {
      cmrsc8n1d000mdwse1soq1ay1: {
        // Fase B (2026-08-31): "rectangle-with-depth" -> "pit-with-depth" —
        // mismos campos/cotas/textos, pero VolumeStep dibuja
        // PoolExcavationIllustration (terreno + hueco) en vez de DiagramV2.
        // Aplicado globalmente (ver comentario del type `shape` arriba):
        // este módulo también se usa suelto en Herramientas avanzadas, no
        // solo dentro del plan "Construir una piscina" — la ilustración es
        // correcta para ambos usos por igual.
        shape: "pit-with-depth",
        primaryLabel: "largo",
        secondaryLabel: "ancho",
        depthLabel: "profundidad",
        primarySubLabel: "El lado más largo",
        secondarySubLabel: "El lado más corto",
        depthSubLabel: "Del suelo hasta el fondo",
        volumeResultLabel: "Volumen a excavar",
        groupLabel: "¿Qué medidas tiene la excavación?",
        // Sprint UX "Construir una piscina" (03-ago-2026), ítem 2: mismo
        // texto que excavacion-circular — antes esta variante no tenía
        // ninguna aclaración de hoyo-vs-piscina (la circular sí, pero solo
        // en el campo "diámetro").
        // Fase 1, Sprint Producto V1.3 (04-ago-2026): se agrega la
        // referencia de holgura (20-30cm) pedida por Jorge — puramente
        // texto, no crea ninguna Variable/Formula ni toca el cálculo. Se
        // redacta como recomendación explícita ("como referencia", "no
        // un cálculo"), nunca como una medida verificada, y se aclara que
        // depende del sistema constructivo — mismo criterio editorial ya
        // usado en el resto de los helpText/note del proyecto.
        // Fase B.1 (2026-08-31): mismo motivo/split que excavacion-circular
        // (ver comentario ahí) — resumen visible + detalle colapsado.
        groupHelpText: "Mide el hoyo terminado, no la marca en el suelo ni el tamaño de la piscina.",
        groupHelpTextDetail:
          "El hoyo va más ancho y profundo que la piscina para dejar espacio de moldaje y el espesor del muro. La profundidad se mide desde el nivel del terreno hasta el fondo. Como referencia general, muchos proyectos dejan entre 20 y 30 cm de holgura alrededor de la piscina — es solo una recomendación, no un cálculo: el valor real depende del sistema constructivo que uses, confírmalo con tu maestro o constructor.",
      },
    },
  },
  // Fase C1 (2026-08-31) — Module NUEVO "piscina-integral" (configurador
  // integral), paralelo a piscina-rectangular-hormigon-armado/
  // piscina-circular-hormigon-armado — NO los reemplaza ni los modifica.
  // 4 stepGroups, 2 por forma (rectangular/circular), cada par mutuamente
  // excluyente vía visibleIfQuestionKey en la Question (ver
  // fase-c1-piscina-integral.ts) — el wizard nunca muestra más de un
  // "Medidas" ni más de un "Estructura" en la misma sesión.
  "piscina-integral": {
    // Fase C1.1 (2026-09-01) — "hormigon-total" es el puente `coalesce`
    // (ver fase-c1-piscina-integral.ts) que unifica hormigon-total-rect/
    // hormigon-total-circ en una sola key SIEMPRE presente, para que el
    // hero de ResultScreen muestre "Hormigón total" en vez del resultado
    // priced por defecto (antes caía en el primer no-secundario: el radio/
    // largo exterior del muro).
    heroResultKey: "hormigon-total",
    diagrams: {
      "medidas-rect": {
        shape: "pool-integral-medidas-rect-with-depth",
        primaryLabel: "largo",
        secondaryLabel: "ancho",
        depthLabel: "profundidad",
        primarySubLabel: "Medida interior terminada",
        secondarySubLabel: "Medida interior terminada",
        depthSubLabel: "Del fondo al borde",
        groupLabel: "¿Qué medidas tiene la piscina?",
        poolConfiguratorBlockLabel: "Medidas",
      },
      "medidas-circ": {
        shape: "pool-integral-medidas-circ-with-depth",
        primaryLabel: "diámetro",
        depthLabel: "profundidad",
        primarySubLabel: "Medida interior terminada",
        depthSubLabel: "Del fondo al borde",
        groupLabel: "¿Qué medidas tiene la piscina?",
        poolConfiguratorBlockLabel: "Medidas",
      },
      "estructura-rect": {
        shape: "pool-integral-estructura-rect-with-depth",
        primaryLabel: "espesor de los muros",
        depthLabel: "espesor del fondo/losa",
        groupLabel: "Estructura del vaso",
        poolConfiguratorBlockLabel: "Estructura",
        // Recupera largo/ancho/profundidad ya respondidos en "Medidas"
        // (stepGroup ANTERIOR) desde `initialValues` — mismo mecanismo de
        // Fase B, sin duplicar pregunta ni estado.
        sourceDimensionKeys: {
          primary: "largo-interior-metros",
          secondary: "ancho-interior-metros",
          depth: "profundidad-interior-metros",
        },
      },
      "estructura-circ": {
        shape: "pool-integral-estructura-circ-with-depth",
        primaryLabel: "espesor de los muros",
        depthLabel: "espesor del fondo/losa",
        groupLabel: "Estructura del vaso",
        poolConfiguratorBlockLabel: "Estructura",
        sourceDimensionKeys: {
          primary: "diametro-interior-metros",
          depth: "profundidad-interior-metros-circular",
        },
      },
    },
  },
  "pilar-columna": {
    diagrams: {
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
      },
    },
  },
  // Escalera sigue excluida por geometría (huella/contrahuella no es un
  // box simple — depende además de "ancho" y "escalones", preguntas
  // propias sin stepGroup). DECISIÓN ORIGINAL (confirmada con Jorge,
  // 2026-08-01): no tocar — pasarla a "rectangle-with-depth" real
  // requeriría fusionar esos pasos separados en uno solo, un cambio de
  // flujo de preguntas distinto a este trabajo de estilo visual.
  escalera: {
    diagrams: { cmrtxsb9800042wse1m5gzn6c: { shape: "rectangle", primaryLabel: "huella", secondaryLabel: "contrahuella" } },
  },

  // Consumo eléctrico: sin diagrama (no tiene geometría), pero SÍ tiene
  // configuración visual — el precio del kWh es opcional (ver
  // OPTIONAL_QUESTION_KEYS): si se omite, la Formula condicionada con
  // {op:"defined",...} sobre esa Variable simplemente no se calcula y la
  // tarjeta de costo no aparece (el consumo en kWh sí se muestra siempre).
  "consumo-electrico": {
    optionalQuestionKeys: ["precio-kwh"],
  },

  // Cerámica para baño (Fase 4D, 09-ago-2026): el descuento de puertas/
  // ventanas es opcional — "no hay vanos que descontar" es un caso legítimo,
  // pero la validación global de NUMBER exige > 0, así que no se puede
  // resolver pidiendo "escribe 0" (ver conditional-reveal-step.tsx/
  // question-step.tsx). Mismo patrón que precio-kwh: si se omite, la
  // Formula "superficie-descontada" (condicionada con {op:"defined",...})
  // no se calcula, y superficie-final usa el `coalesce` ya existente que
  // cae a 0 cuando esa referencia no está disponible.
  "ceramica-para-bano": {
    optionalQuestionKeys: ["descuento-vanos-m2"],
  },

  // Auditoría 2026-08-01 — módulos cuyo RESULTADO final es m³ pero la 3ra
  // dimensión (espesor, largo o cantidad de escalones) se pide en un paso
  // SEPARADO, no wireado a este diagrama: Cercha de techo (grupo "cuántas
  // cerchas x largo de cada cercha" — el primer campo es una cantidad, no
  // una medida, no es una pareja espacial representable) y Fundación
  // (geometría de 2 secciones, ver FoundationStep) quedan sin entrada acá
  // deliberadamente — no forzar un diagrama donde no representa la figura
  // real.
};

// Los 9 módulos migrados al layout combinado (ver commit que agrega
// sideBySide): unifica largo+ancho (o largo+alto en Jardinera) en UNA sola
// pregunta con una sola descripción, en vez de 2 preguntas/títulos
// separados — y agrega una caja de superficie en vivo debajo de los
// campos. Solo cubre los stepGroups declarados con combinedAreaQuestion
// arriba: son los únicos auditados contra el mockup; el resto de los pares
// de 2 campos (Losa, Viga, Fundación, etc.) siguen con el patrón anterior.

// --- Mapas planos derivados — misma forma y mismo nombre que antes, para
// que ningún punto de lectura en question-group-step.tsx/module-wizard.tsx
// necesite cambiar. ---

export const DIMENSION_DIAGRAMS: Record<string, DiagramConfig> = Object.fromEntries(
  Object.values(MODULE_CONFIG).flatMap((m) => Object.entries(m.diagrams ?? {}))
);

export const COMBINED_AREA_QUESTION: Record<string, CombinedAreaQuestionConfig> = Object.fromEntries(
  Object.values(MODULE_CONFIG).flatMap((m) => Object.entries(m.combinedAreaQuestion ?? {}))
);

// Módulos donde el resultado permite editar una pregunta NUMBER ya
// contestada y recalcular todo sin volver atrás en el wizard (ver
// RecalculateField en result-screen.tsx) — mecanismo genérico, pero por
// ahora solo conectado en Radier (espesor).
export const RECALCULATE_FIELDS: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_CONFIG)
    .filter(([, m]) => m.recalculateField)
    .map(([slug, m]) => [slug, m.recalculateField!])
);

// Módulos donde el dato protagonista (ResultHero) NO es el primer resultado
// priced sino un resultado informativo más relevante para el usuario (ej.
// Piscina: volumen de agua antes que hormigón) — mecanismo genérico, un
// Formula.key fuerza qué resultado ocupa la tarjeta hero.
export const HERO_RESULT_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_CONFIG)
    .filter(([, m]) => m.heroResultKey)
    .map(([slug, m]) => [slug, m.heroResultKey!])
);

// Ver RecipeGroupConfig — módulos con una tarjeta de "receta" (cantidad
// base + desglose de ingredientes) además de la lista genérica de
// PricedResults. Los Formula.key listados en cada grupo se sacan de esa
// lista genérica (ver ResultScreen) para no duplicarse.
export const RECIPE_GROUPS: Record<string, RecipeGroupConfig[]> = Object.fromEntries(
  Object.entries(MODULE_CONFIG)
    .filter(([, m]) => m.recipeGroups)
    .map(([slug, m]) => [slug, m.recipeGroups!])
);

// Ver DosificacionGroupConfig — módulos con una tarjeta de "dosificación
// referencial" además de la lista genérica de PricedResults. Los
// Formula.key listados en cada grupo se sacan de esa lista genérica (ver
// ResultScreen) para no duplicarse, mismo criterio que RECIPE_GROUPS.
export const DOSIFICACION_GROUPS: Record<string, DosificacionGroupConfig[]> = Object.fromEntries(
  Object.entries(MODULE_CONFIG)
    .filter(([, m]) => m.dosificacionGroups)
    .map(([slug, m]) => [slug, m.dosificacionGroups!])
);

// Fase 5 (Radier) — Formula.key cuyas notas individuales (ver
// PricedResults' `suppressNoteForKeys`) se ocultan de su tarjeta y se
// consolidan en un solo TechnicalNotesSection (ver ResultScreen).
export const CONSOLIDATE_NOTES_KEYS: Record<string, string[]> = Object.fromEntries(
  Object.entries(MODULE_CONFIG)
    .filter(([, m]) => m.consolidateNotesKeys)
    .map(([slug, m]) => [slug, m.consolidateNotesKeys!])
);

// Fase 5 (Radier) — Formula.key que NUNCA deben aparecer en la lista
// genérica de PricedResults, sin importar recipeGroups/dosificacionGroups
// (ej. un resultado que ya se muestra en su propia tarjeta destacada vía
// heroResultKey — "volumen_total" en Radier, para que no aparezca DOS
// veces: una vez grande en ResultHero, otra vez como fila normal en
// "Materiales"). Sin esta entrada (la mayoría de los módulos), el
// comportamiento es idéntico al de siempre.
export const EXCLUDE_FROM_LIST_KEYS: Record<string, string[]> = Object.fromEntries(
  Object.entries(MODULE_CONFIG)
    .filter(([, m]) => m.excludeFromListKeys)
    .map(([slug, m]) => [slug, m.excludeFromListKeys!])
);

// Fase 5 (Radier) — dónde va ResultHero (la tarjeta protagonista azul).
// Todos los módulos salvo Radier quedan "top" (comportamiento de
// siempre, sin tocar nada) — Radier pidió el orden Espesor -> Tipo de
// hormigón -> Dosificación -> Refuerzo -> Volumen (hero) -> Materiales.
export const HERO_POSITIONS: Record<string, "top" | "beforeMaterials"> = Object.fromEntries(
  Object.entries(MODULE_CONFIG)
    .filter(([, m]) => m.heroPosition)
    .map(([slug, m]) => [slug, m.heroPosition!])
);

// Ver RefuerzoConfig.
export const REFUERZO_CONFIG: Record<string, RefuerzoConfig> = Object.fromEntries(
  Object.entries(MODULE_CONFIG)
    .filter(([, m]) => m.refuerzo)
    .map(([slug, m]) => [slug, m.refuerzo!])
);

// Preguntas NUMBER que el usuario puede dejar en blanco y avanzar igual
// (ver botón "Omitir" en QuestionStep).
export const OPTIONAL_QUESTION_KEYS: Record<string, string[]> = Object.fromEntries(
  Object.entries(MODULE_CONFIG)
    .filter(([, m]) => m.optionalQuestionKeys)
    .map(([slug, m]) => [slug, m.optionalQuestionKeys!])
);

// Parsea claves de opción tipo "60x60cm" a {width,height} en cm — devuelve
// null para cualquier formato no reconocido (ej. "personalizada"), nunca
// inventa una medida.
export function parseTileSizeCm(optionKey: string | undefined): { width: number; height: number } | null {
  if (!optionKey) return null;
  const match = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)cm$/i.exec(optionKey);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}
