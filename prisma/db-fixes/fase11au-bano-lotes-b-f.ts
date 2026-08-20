import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11AU (docs/FASE11AU_IMPLEMENTACION_LOCAL_BANO_V1_RESTANTE.md) —
// implementación consolidada de los 8 componentes especiales restantes de
// Baño V1, cerrados técnicamente en 11AK-11AR, arquitectura consolidada en
// 11AS. Reemplaza la ejecución separada de los antiguos Lotes B-F.
//
// Crea 8 InspectionElementTemplate nuevos (extractor-aire, wc, lavamanos,
// ducha, mampara, tina, mueble-bano, cubierta-bano), sus 36
// InspectionChecklistItem (2+4+5+6+5+7+4+3=36) y sus 36 TechnicalArticle.
// Aditivo e idempotente (upsert / findFirst+create-o-update). Deliberadamente
// NO crea ningún InspectionElementTemplateSpace — mismo patrón 100% Nivel 2
// ya usado para todos los componentes opcionales de Cocina y para Ventana de
// Baño: el componente solo puede crearse vía saveSpaceLevel2ConfigAction,
// nunca vía generación automática. El vínculo bano<->artefactos-sanitarios
// NO se toca en este script.
//
// Ejecutar: npx tsx prisma/db-fixes/fase11au-bano-lotes-b-f.ts

type ChecklistItemDef = {
  question: string;
  order: number;
  technicalArticleSlug: string;
  defaultSeverity: "LOW" | "MEDIUM" | "HIGH";
};

type ArticleDef = { slug: string; title: string; content: string };

type ComponentDef = {
  key: string;
  label: string;
  catalogOrder: number;
  items: ChecklistItemDef[];
  articles: ArticleDef[];
};

const components: ComponentDef[] = [
  // ============================================================
  // EXTRACTOR DE AIRE (11AK) — 2 checks
  // ============================================================
  {
    key: "extractor-aire",
    label: "Extractor de aire",
    catalogOrder: 20,
    items: [
      {
        question: "¿El extractor enciende y funciona al accionar su control normal?",
        order: 0,
        technicalArticleSlug: "extractor-aire-funcionamiento",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "Al funcionar, ¿presenta vibraciones, golpes o ruidos claramente irregulares (más allá del ruido normal del motor)?",
        order: 1,
        technicalArticleSlug: "extractor-aire-ruido-vibracion",
        defaultSeverity: "MEDIUM",
      },
    ],
    articles: [
      {
        slug: "extractor-aire-funcionamiento",
        title: "Cómo revisar el funcionamiento del extractor de aire",
        content: `# Qué revisar

Si el extractor de aire del baño enciende y funciona al accionar su control normal (interruptor propio, compartido con la luz, o automático si el equipo tiene sensor).

# Cómo revisarlo

Acciona el control normal del extractor — el mismo que usarías en el uso diario del baño (interruptor dedicado, el interruptor de la luz si están combinados, o simplemente usa la ducha con normalidad si el equipo se activa por sensor). Escucha y observa unos segundos.

# Qué debería verse

El extractor enciende al accionar su control y se percibe funcionando con normalidad (se escucha o se siente que está extrayendo aire). Si el equipo sigue funcionando un rato después de apagar la luz, eso es normal en modelos con temporizador — no es un defecto.

# Qué señales pueden indicar un problema

- El extractor no enciende al accionar su control.
- El extractor enciende pero no da ninguna señal perceptible de estar funcionando (sin sonido ni sensación de movimiento de aire).
- El control (interruptor, botón) no responde o cuesta mucho accionarlo.

# Por qué importa

Un extractor que no enciende no cumple su función básica de ayudar a controlar la humedad y los olores del baño durante el uso diario.

# Recomendación

Si detectas que no enciende o el control no responde, regístralo como observación indicando cómo lo probaste. No es necesario abrir el equipo ni revisar su instalación eléctrica interna — con accionar el control normal alcanza para dejar constancia.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no trata equipos de extracción de baño, y no existe un punto equivalente en el catálogo educativo ITO).`,
      },
      {
        slug: "extractor-aire-ruido-vibracion",
        title: "Cómo revisar ruido y vibración anormal en el extractor de aire",
        content: `# Qué revisar

Si, al funcionar, el extractor de aire presenta vibraciones, golpes o ruidos claramente irregulares, más allá del ruido normal de un motor en funcionamiento.

# Cómo revisarlo

Enciende el extractor y escucha/observa mientras funciona por unos segundos.

# Qué debería verse

Un sonido de motor en funcionamiento, sin golpeteo, vibración de piezas sueltas ni roces irregulares.

# Qué señales pueden indicar un problema

- Golpeteo o traqueteo audible.
- Vibración notoria que hace vibrar la carcasa, la rejilla o piezas cercanas.
- Un roce o chirrido irregular distinto al sonido normal del motor.

Ten en cuenta que **todo motor produce sonido al funcionar** — eso por sí solo no es un defecto. Solo registra lo que se sienta claramente irregular, no simplemente "hace ruido".

# Por qué importa

Un ruido o vibración irregular puede indicar una pieza mal fijada o un problema mecánico que conviene documentar antes de que empeore con el uso.

# Recomendación

Si detectas algo claramente irregular, regístralo como observación describiendo el tipo de ruido (golpeteo, vibración, roce). No intentes abrir el equipo para identificar la causa.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa, redactada con precaución para no convertir el sonido normal de operación en un defecto — sin fuente normativa aplicable.`,
      },
    ],
  },

  // ============================================================
  // WC / INODORO (11AL) — 4 checks
  // ============================================================
  {
    key: "wc",
    label: "WC / Inodoro",
    catalogOrder: 21,
    items: [
      {
        question: "¿El inodoro descarga correctamente al accionar el mecanismo, y el agua deja de correr con normalidad después?",
        order: 0,
        technicalArticleSlug: "wc-descarga",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "¿Se observan fugas o humedad alrededor de la base del inodoro después de una descarga normal?",
        order: 1,
        technicalArticleSlug: "wc-fugas",
        defaultSeverity: "HIGH",
      },
      {
        question: "¿El inodoro se ve firme y estable, sin movimiento evidente al tocarlo suavemente?",
        order: 2,
        technicalArticleSlug: "wc-fijacion",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "¿El inodoro presenta trizaduras, quiebres, golpes u otros daños visibles en la loza?",
        order: 3,
        technicalArticleSlug: "wc-danos-visibles",
        defaultSeverity: "LOW",
      },
    ],
    articles: [
      {
        slug: "wc-descarga",
        title: "Cómo revisar la descarga del inodoro",
        content: `# Qué revisar

Si el inodoro descarga correctamente al accionar el mecanismo, y si el agua deja de correr con normalidad después de terminado el ciclo.

# Cómo revisarlo

Acciona el mecanismo de descarga del inodoro (botón o palanca) y observa el estanque y la taza durante unos segundos después de que termine el ciclo normal.

# Qué debería verse

El inodoro descarga con normalidad al accionar el mecanismo, y el agua se detiene por completo en un tiempo razonable, sin quedar corriendo de forma continua ni goteando dentro del estanque.

# Qué señales pueden indicar un problema

- El mecanismo no responde al accionarlo.
- La descarga es visiblemente débil o incompleta.
- El agua sigue corriendo varios segundos después de terminado el ciclo normal, o se escucha un ruido de agua corriendo de forma intermitente sin que nadie haya accionado la descarga.

Conviene registrar la observación aunque no sea necesariamente grave.

# Por qué importa

Un mecanismo de descarga que no funciona bien, o que no se detiene, puede representar un gasto de agua sostenido en el tiempo — vale la pena dejarlo registrado antes de dar por recibido el baño.

# Recomendación

Si notas que no descarga bien o que el agua no se detiene con normalidad, regístralo como observación con foto o video corto. No es necesario abrir el estanque ni manipular el mecanismo interno — con la observación visual/auditiva alcanza para dejar constancia.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de funcionamiento básico de artefactos.`,
      },
      {
        slug: "wc-fugas",
        title: "Cómo revisar fugas en la base del inodoro",
        content: `# Qué revisar

Si hay fugas o humedad visibles alrededor de la base del inodoro, después de una descarga normal.

# Cómo revisarlo

Descarga el inodoro con normalidad y observa la base con buena luz unos momentos después, buscando manchas de humedad, agua acumulada o goteo activo. Puedes pasar la mano (seca) cerca de la base, sin tocar directamente conexiones de agua, para sentir si hay humedad.

# Qué debería verse

La base del inodoro seca, sin manchas de humedad ni agua acumulada alrededor, y sin goteo visible después de la descarga.

# Qué señales pueden indicar un problema

- Manchas de humedad o agua acumulada en el piso junto a la base del inodoro.
- Goteo visible después de usar la descarga.

Si la humedad podría deberse a limpieza reciente o salpicaduras de una ducha cercana, espera un momento y vuelve a observar antes de registrar la observación.

# Por qué importa

Una fuga en la base, aunque parezca menor, puede afectar el piso o generar humedad sostenida si no se corrige a tiempo.

# Recomendación

Si ves humedad o goteo, regístralo como observación con foto. No es necesario desmontar el inodoro ni intervenir sus conexiones de agua — la observación visual es suficiente para dejar constancia.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos.`,
      },
      {
        slug: "wc-fijacion",
        title: "Cómo revisar la fijación del inodoro",
        content: `# Qué revisar

Si el inodoro se ve firme y estable, sin movimiento evidente al tocarlo suavemente.

# Cómo revisarlo

Toca el inodoro suavemente en la parte superior de la taza, sin sentarte bruscamente, sacudirlo ni aplicar fuerza. Observa si se mueve o cede.

# Qué debería verse

El inodoro se siente firme y estable, sin ningún movimiento perceptible al tocarlo suavemente.

# Qué señales pueden indicar un problema

- El inodoro se mueve o cede levemente al tocarlo con suavidad.
- Se percibe que la base no está firmemente asentada en el piso.

# Por qué importa

Un inodoro mal fijado puede comprometer el sello con el desagüe del piso con el tiempo, aumentando el riesgo de una fuga posterior.

# Recomendación

Si notas movimiento, regístralo como observación. No intentes ajustar ni apretar nada tú mismo — no es necesario para dejar constancia del hallazgo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable ni analogía específica del catálogo educativo ITO para este punto.`,
      },
      {
        slug: "wc-danos-visibles",
        title: "Cómo revisar daños visibles en el inodoro",
        content: `# Qué revisar

Si el inodoro presenta trizaduras, quiebres, golpes u otros daños visibles en la loza.

# Cómo revisarlo

Recorre visualmente toda la superficie del inodoro (taza, estanque visible, tapa del estanque) con buena luz, buscando daños.

# Qué debería verse

La loza del inodoro sin trizaduras, quiebres, golpes ni otros daños visibles.

# Qué señales pueden indicar un problema

- Trizaduras o grietas visibles en la loza.
- Quiebres o desportilladuras.
- Golpes con marca visible.

# Por qué importa

Un daño en la loza, aunque no genere una fuga inmediata, es un defecto de calidad que conviene documentar antes de dar por recibido el baño — y puede empeorar con el uso si no se corrige.

# Recomendación

Si detectas cualquier daño, regístralo como observación con foto, indicando su ubicación exacta en la pieza.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida (no se establece un umbral de tamaño; se registra cualquier daño visible detectado).`,
      },
    ],
  },

  // ============================================================
  // LAVAMANOS (11AM) — 5 checks
  // ============================================================
  {
    key: "lavamanos",
    label: "Lavamanos",
    catalogOrder: 22,
    items: [
      {
        question: "¿La grifería abre y cierra correctamente, sin quedar goteando?",
        order: 0,
        technicalArticleSlug: "lavamanos-griferia",
        defaultSeverity: "LOW",
      },
      {
        question: "¿Funcionan correctamente el agua fría y caliente de la grifería, cuando la instalación dispone de ambas?",
        order: 1,
        technicalArticleSlug: "lavamanos-agua-fria-caliente",
        defaultSeverity: "LOW",
      },
      {
        question: "Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavamanos?",
        order: 2,
        technicalArticleSlug: "lavamanos-fugas",
        defaultSeverity: "HIGH",
      },
      {
        question: "¿El lavamanos se ve firme y bien instalado, sin moverse al tocarlo suavemente?",
        order: 3,
        technicalArticleSlug: "lavamanos-fijacion",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "Si el lavamanos tiene un encuentro visible con la cubierta o el muro (por ejemplo, sobre o bajo una cubierta), ¿ese sello se ve continuo, sin separaciones ni grietas?",
        order: 4,
        technicalArticleSlug: "lavamanos-sello-perimetral",
        defaultSeverity: "MEDIUM",
      },
    ],
    articles: [
      {
        slug: "lavamanos-griferia",
        title: "Cómo revisar la grifería del lavamanos",
        content: `# Qué revisar

Si la grifería del lavamanos abre y cierra correctamente, sin quedar goteando.

# Cómo revisarlo

Abre y cierra la llave del lavamanos, probando el mecanismo por completo. Observa la salida de la llave unos segundos después de cerrarla.

# Qué debería verse

La llave abre y cierra sin dificultad, y no queda goteando después de cerrada por completo.

# Qué señales pueden indicar un problema

- La llave sigue goteando después de cerrada por completo.
- El mecanismo cuesta mucho accionar o no responde con normalidad.

# Por qué importa

Una llave que gotea, aunque sea poco, representa un gasto de agua sostenido en el tiempo y suele ser más fácil de resolver mientras la vivienda todavía está en garantía o en proceso de entrega.

# Recomendación

Si detectas goteo o dificultad para accionar la llave, regístralo como observación con foto. No es necesario desarmar la llave ni intervenir sus conexiones internas.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Grifería — verificación de ausencia de goteras y filtraciones visibles.`,
      },
      {
        slug: "lavamanos-agua-fria-caliente",
        title: "Cómo revisar el agua fría y caliente del lavamanos",
        content: `# Qué revisar

Si funcionan correctamente el agua fría y caliente de la grifería del lavamanos, cuando la instalación dispone de ambas.

# Cómo revisarlo

Abre la llave hacia el lado del agua fría y confirma que sale agua. Repite hacia el lado del agua caliente. Si la instalación solo dispone de agua fría por diseño, marca esta revisión como "No corresponde".

# Qué debería verse

Sale agua de ambas redes al accionar la llave hacia cada lado, cuando la instalación dispone de ambas.

# Qué señales pueden indicar un problema

- No sale agua de uno de los dos lados (fría o caliente), en una instalación que sí dispone de ambas redes.

# Por qué importa

Confirmar que ambas redes de agua funcionan antes de recibir la vivienda evita sorpresas al usar el lavamanos en el día a día.

# Recomendación

Si uno de los dos lados no entrega agua, regístralo como observación indicando cuál. No es necesario evaluar temperatura, tiempo de calentamiento ni presión — solo que el agua efectivamente sale de cada red disponible.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable ni analogía específica del catálogo educativo ITO para este punto.`,
      },
      {
        slug: "lavamanos-fugas",
        title: "Cómo revisar fugas bajo el lavamanos",
        content: `# Qué revisar

Si, al dejar correr agua, se observa alguna fuga o goteo bajo el lavamanos.

# Cómo revisarlo

Abre la llave y deja correr agua unos momentos. Observa la parte inferior del lavamanos (conexiones, sifón, uniones visibles) con buena luz, buscando humedad o goteo activo.

# Qué debería observarse

Toda la parte inferior del lavamanos seca, sin manchas de humedad, agua acumulada ni goteo mientras corre el agua.

# Qué señales pueden indicar un problema

- Goteo visible en cualquier conexión o unión bajo el lavamanos mientras corre el agua.
- Manchas de humedad o agua acumulada bajo el mueble o en el piso cercano.

Cualquiera de estas señales conviene documentarla, aunque el origen exacto (sifón, unión, conexión) no se pueda determinar solo con observación visual.

# Por qué importa

Una fuga bajo el lavamanos, aunque parezca menor, puede afectar el mueble o el piso, o generar humedad sostenida si no se corrige a tiempo.

# Recomendación

Si detectas humedad o goteo, regístralo como observación con foto. No es necesario desmontar el sifón ni intervenir las conexiones — la observación visual mientras corre el agua es suficiente para dejar constancia.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos.`,
      },
      {
        slug: "lavamanos-fijacion",
        title: "Cómo revisar la fijación del lavamanos",
        content: `# Qué revisar

Si el lavamanos se ve firme y bien instalado, sin moverse al tocarlo suavemente.

# Cómo revisarlo

Toca el lavamanos suavemente en su borde, sin aplicar fuerza. Observa si se mueve o cede.

# Qué debería verse

El lavamanos firme, sin ningún movimiento perceptible al tocarlo con suavidad.

# Qué señales pueden indicar un problema

- El lavamanos se mueve o cede levemente al tocarlo con suavidad.
- El artefacto no se ve firmemente anclado a la pared, el pedestal o la cubierta que lo sostiene.

# Por qué importa

Un lavamanos mal fijado puede comprometer sus conexiones de agua o desagüe con el tiempo, y representa un riesgo si se apoya peso sobre él.

# Recomendación

Si notas movimiento, regístralo como observación. No intentes ajustar ni apretar nada tú mismo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable ni analogía específica del catálogo educativo ITO para este punto.`,
      },
      {
        slug: "lavamanos-sello-perimetral",
        title: "Cómo revisar el sello perimetral del lavamanos",
        content: `# Qué revisar

Si el lavamanos tiene un encuentro visible con la cubierta o el muro (por ejemplo, sobre o bajo una cubierta), y si ese sello se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Observa el borde donde el lavamanos se une a la cubierta o al muro, si ese encuentro existe físicamente en tu caso (algunos lavamanos, como los de pedestal o suspendidos sin encimera, no tienen este tipo de encuentro — en ese caso marca esta revisión como "No corresponde").

# Qué debería verse

Un sello continuo, sin separaciones, grietas ni huecos visibles en el encuentro.

# Qué señales pueden indicar un problema

- Separaciones o grietas visibles en el sello.
- Falta de sello donde debería haberlo, dejando un hueco visible.

# Por qué importa

Un sello en mal estado puede permitir el paso de agua hacia el mueble o la estructura de apoyo, generando humedad sostenida si no se corrige.

# Recomendación

Si detectas separaciones o falta de sello, regístralo como observación con foto. No es necesario retirar ni resellar tú mismo.

# Fuente

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos (ventana, lavaplatos) — sin fuente normativa aplicable.`,
      },
    ],
  },

  // ============================================================
  // DUCHA (11AN) — 6 checks
  // ============================================================
  {
    key: "ducha",
    label: "Ducha",
    catalogOrder: 23,
    items: [
      {
        question: "¿La grifería de la ducha abre, cierra y responde correctamente al accionar sus controles?",
        order: 0,
        technicalArticleSlug: "ducha-griferia",
        defaultSeverity: "LOW",
      },
      {
        question: "¿Funcionan correctamente el agua fría y caliente de la ducha, cuando la instalación dispone de ambas?",
        order: 1,
        technicalArticleSlug: "ducha-agua-fria-caliente",
        defaultSeverity: "LOW",
      },
      {
        question: "Al usar la ducha, ¿se observan fugas o goteos en conexiones visibles, fuera de las salidas normales de agua (rociador, llave)?",
        order: 2,
        technicalArticleSlug: "ducha-fugas",
        defaultSeverity: "HIGH",
      },
      {
        question: "Después de dejar correr agua durante el uso normal de la ducha, ¿el agua evacúa sin quedar acumulada en el piso o el receptáculo?",
        order: 3,
        technicalArticleSlug: "ducha-evacuacion",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "Si la ducha tiene receptáculo o plato (prefabricado, no cerámico continuo), ¿se ve firme y sin trizaduras, quiebres u otros daños visibles?",
        order: 4,
        technicalArticleSlug: "ducha-receptaculo",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "El sello entre el receptáculo/plato de la ducha (o el piso de la zona de ducha) y el muro, ¿se ve continuo, sin separaciones ni grietas?",
        order: 5,
        technicalArticleSlug: "ducha-sello-perimetral",
        defaultSeverity: "MEDIUM",
      },
    ],
    articles: [
      {
        slug: "ducha-griferia",
        title: "Cómo revisar la grifería de la ducha",
        content: `# Qué revisar

Si la grifería de la ducha abre, cierra y responde correctamente al accionar sus controles.

# Cómo revisarlo

Acciona los controles de la ducha (llave o mezclador) tal como los usarías normalmente — abrir, cerrar, y cambiar entre las salidas disponibles si tiene más de una (rociador fijo, ducha teléfono).

# Qué debería verse

Los controles responden con normalidad al accionarlos, el agua sale por la salida seleccionada, y cierra por completo al cerrar la llave.

# Qué señales pueden indicar un problema

- El control no responde o cuesta mucho accionarlo.
- El agua no sale al abrir, o no cambia entre salidas si el modelo tiene más de una.

# Por qué importa

Una grifería que no responde bien afecta el uso diario de la ducha.

# Recomendación

Si detectas que un control no responde con normalidad, regístralo como observación indicando cuál. No es necesario desarmar la grifería.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Grifería — verificación de ausencia de goteras y filtraciones visibles, extendido a funcionamiento de controles de ducha.`,
      },
      {
        slug: "ducha-agua-fria-caliente",
        title: "Cómo revisar el agua fría y caliente de la ducha",
        content: `# Qué revisar

Si funcionan correctamente el agua fría y caliente de la ducha, cuando la instalación dispone de ambas.

# Cómo revisarlo

Abre la ducha hacia el lado del agua fría y confirma que sale agua. Repite hacia el lado del agua caliente. Si la instalación solo dispone de agua fría por diseño, marca esta revisión como "No corresponde".

# Qué debería verse

Sale agua de ambas redes al accionar los controles hacia cada lado, cuando la instalación dispone de ambas.

# Qué señales pueden indicar un problema

- No sale agua de uno de los dos lados (fría o caliente), en una instalación que sí dispone de ambas redes.

# Por qué importa

Confirmar que ambas redes de agua funcionan antes de recibir la vivienda evita sorpresas en el uso diario.

# Recomendación

Si uno de los dos lados no entrega agua, regístralo como observación. No es necesario evaluar temperatura exacta, tiempo de calentamiento ni presión — solo que el agua efectivamente sale de cada red disponible. No es necesario exponerte a agua excesivamente caliente para esta revisión — usa el mismo cuidado que tendrías al ducharte normalmente.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.`,
      },
      {
        slug: "ducha-fugas",
        title: "Cómo revisar fugas en conexiones de la ducha",
        content: `# Qué revisar

Si, al usar la ducha, se observan fugas o goteos en conexiones visibles, fuera de las salidas normales de agua (rociador, llave).

# Cómo revisarlo

Usa la ducha con normalidad durante unos momentos y observa las conexiones visibles (base de la grifería, uniones de flexibles, conexión del rociador), buscando agua escapando de un punto que no sea la salida normal.

# Qué debería observarse

El agua sale únicamente por el rociador o la llave, sin escapar por ninguna conexión o unión visible.

# Qué señales pueden indicar un problema

- Goteo o chorro de agua visible en una conexión o unión, distinto del agua normal saliendo del rociador.
- Humedad que aparece en una zona donde no debería haber agua durante el uso normal.

# Por qué importa

Una fuga en una conexión, aunque parezca menor, puede empeorar con el uso y generar humedad sostenida en el muro o el piso.

# Recomendación

Si detectas una fuga, regístrala como observación con foto o video corto. No es necesario desarmar la grifería ni intervenir las conexiones — la observación durante el uso normal es suficiente. Esta revisión no certifica la impermeabilización oculta bajo el piso o los muros — solo detecta fugas visibles durante el uso.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles, extendido al contexto de ducha.`,
      },
      {
        slug: "ducha-evacuacion",
        title: "Cómo revisar la evacuación de agua de la ducha",
        content: `# Qué revisar

Si, después de dejar correr agua durante el uso normal de la ducha, el agua evacúa sin quedar acumulada en el piso o el receptáculo.

# Cómo revisarlo

Deja correr agua durante el uso normal de la ducha (sin tapar el desagüe ni forzar acumulación artificial) y observa cómo evacúa.

# Qué debería observarse

El agua evacúa con normalidad, sin quedar acumulada de forma prolongada en el piso o el receptáculo.

# Qué señales pueden indicar un problema

- El agua queda acumulada o forma pozas visibles después de un uso normal.
- El agua tarda visiblemente mucho más de lo esperable en desaparecer.

No es necesario ni recomendable determinar la causa exacta (desagüe, pendiente u otra) — solo registra si el agua evacúa con normalidad o no.

# Por qué importa

Agua que no evacúa bien puede generar riesgo de resbalón y humedad sostenida en el piso de la ducha.

# Recomendación

Si notas acumulación, regístralo como observación con foto o video corto. No introduzcas objetos en el desagüe ni intentes destaparlo — con la observación durante el uso normal alcanza para dejar constancia. Esta revisión no certifica la impermeabilización oculta bajo el piso — solo detecta si el agua evacúa con normalidad durante el uso.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no define una tolerancia de pendiente para receptáculos o pisos de ducha).`,
      },
      {
        slug: "ducha-receptaculo",
        title: "Cómo revisar el receptáculo o plato de la ducha",
        content: `# Qué revisar

Si la ducha tiene receptáculo o plato (prefabricado, no cerámico continuo), si este se ve firme y sin trizaduras, quiebres u otros daños visibles.

# Cómo revisarlo

Si la ducha tiene un receptáculo o plato prefabricado, tócalo suavemente para sentir si cede o se mueve, y recorre su superficie visualmente buscando daños. Si la ducha es "a ras" con el mismo piso cerámico del resto del baño (sin una pieza de receptáculo distinta), marca esta revisión como "No corresponde" — el estado de ese piso ya se revisa en la partida de revestimiento cerámico.

# Qué debería verse

El receptáculo firme, sin movimiento al tocarlo suavemente, y sin trizaduras, quiebres ni otros daños visibles.

# Qué señales pueden indicar un problema

- El receptáculo se mueve o cede al tocarlo con suavidad.
- Trizaduras, quiebres o desportilladuras visibles en su superficie.

# Por qué importa

Un receptáculo mal fijado o dañado puede comprometer su sello con el desagüe o el muro, generando humedad sostenida si no se corrige.

# Recomendación

Si detectas movimiento o daño, regístralo como observación con foto. No intentes ajustar ni reparar nada tú mismo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.`,
      },
      {
        slug: "ducha-sello-perimetral",
        title: "Cómo revisar el sello perimetral de la ducha",
        content: `# Qué revisar

Si el sello entre el receptáculo/plato de la ducha (o el piso de la zona de ducha) y el muro se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Observa el borde donde el receptáculo o el piso de la zona de ducha se une al muro.

# Qué debería verse

Un sello continuo, sin separaciones, grietas ni huecos visibles.

# Qué señales pueden indicar un problema

- Separaciones o grietas visibles en el sello.
- Falta de sello donde debería haberlo.

Esta revisión es sobre el encuentro del receptáculo o piso con el muro — si la ducha tiene mampara, el sello propio de la mampara se revisa por separado, dentro de esa partida.

# Por qué importa

Un sello en mal estado puede permitir el paso de agua hacia el muro o la estructura, generando humedad sostenida si no se corrige.

# Recomendación

Si detectas separaciones o falta de sello, regístralo como observación con foto. No intentes resellar tú mismo.

# Fuente

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos (ventana, lavaplatos, lavamanos) — sin fuente normativa aplicable.`,
      },
    ],
  },

  // ============================================================
  // MAMPARA (11AO) — 5 checks
  // ============================================================
  {
    key: "mampara",
    label: "Mampara",
    catalogOrder: 24,
    items: [
      {
        question: "Si la mampara tiene alguna hoja móvil (corredera, abatible o plegable), ¿abre, cierra o desliza correctamente, sin atascarse ni forzar?",
        order: 0,
        technicalArticleSlug: "mampara-funcionamiento",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "¿La mampara se ve firme y estable, sin movimientos o piezas sueltas al tocarla suavemente?",
        order: 1,
        technicalArticleSlug: "mampara-fijacion",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "¿Los vidrios o perfiles de la mampara presentan trizaduras, quiebres, rayas profundas u otros daños visibles?",
        order: 2,
        technicalArticleSlug: "mampara-danos-visibles",
        defaultSeverity: "HIGH",
      },
      {
        question: "¿Los sellos visibles de la mampara (perfiles contra el muro o el receptáculo, uniones entre paneles) se ven continuos, sin separaciones ni grietas?",
        order: 3,
        technicalArticleSlug: "mampara-sellos",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "Durante el uso normal de la ducha, ¿se observa agua saliendo fuera de la mampara (más allá de salpicaduras normales)?",
        order: 4,
        technicalArticleSlug: "mampara-filtracion",
        defaultSeverity: "MEDIUM",
      },
    ],
    articles: [
      {
        slug: "mampara-funcionamiento",
        title: "Cómo revisar el funcionamiento de la mampara",
        content: `# Qué revisar

Si la mampara, cuando tiene alguna hoja móvil (corredera, abatible o plegable), abre, cierra o desliza correctamente, sin atascarse ni forzar.

# Cómo revisarlo

Si la mampara tiene una hoja móvil, ábrela y ciérrala completamente un par de veces, probando también la manilla si tiene una. Si la mampara es completamente fija, sin ninguna hoja móvil, marca esta revisión como "No corresponde".

# Qué debería verse

La hoja móvil abre y cierra con normalidad, sin atascarse, forzar ni descarrilarse de su guía.

# Qué señales pueden indicar un problema

- La hoja se atasca, cuesta mucho mover, o se sale de su carril/guía.
- La manilla no responde con normalidad.
- Las hojas se ven notoriamente desalineadas entre sí al cerrar.

# Por qué importa

Una mampara que no abre/cierra bien es una molestia de uso diario y puede empeorar con el tiempo si no se corrige.

# Recomendación

Si detectas alguna de estas señales, regístralo como observación con foto o video corto. No es necesario desmontar ni forzar el mecanismo para diagnosticarlo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no trata mamparas ni cerramientos de ducha).`,
      },
      {
        slug: "mampara-fijacion",
        title: "Cómo revisar la fijación de la mampara",
        content: `# Qué revisar

Si la mampara se ve firme y estable, sin movimientos o piezas sueltas al tocarla suavemente.

# Cómo revisarlo

Toca la mampara suavemente (el panel fijo y, si corresponde, la hoja móvil), sin empujar fuerte, colgarte, sacudirla ni aplicar peso corporal. Observa si se mueve o cede.

# Qué debería verse

La mampara firme, sin movimiento perceptible al tocarla con suavidad.

# Qué señales pueden indicar un problema

- La mampara se mueve o cede al tocarla con suavidad.
- Se percibe que algún perfil o soporte no está firmemente anclado.

# Por qué importa

Una mampara mal fijada puede empeorar con el uso y representa un riesgo si llegara a soltarse, especialmente por tratarse de una pieza de vidrio en una zona de piso mojado.

# Recomendación

Si notas movimiento, regístralo como observación. No intentes ajustar ni apretar nada tú mismo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.`,
      },
      {
        slug: "mampara-danos-visibles",
        title: "Cómo revisar daños visibles en la mampara",
        content: `# Qué revisar

Si los vidrios o perfiles de la mampara presentan trizaduras, quiebres, rayas profundas u otros daños visibles.

# Cómo revisarlo

Recorre visualmente toda la mampara (vidrios y perfiles) con buena luz, buscando daños. No golpees ni apliques presión sobre el vidrio para "probarlo" — solo obsérvalo.

# Qué debería verse

Los vidrios y perfiles sin trizaduras, quiebres, rayas profundas ni otros daños visibles.

# Qué señales pueden indicar un problema

- Trizaduras o quiebres visibles en el vidrio.
- Rayas profundas (perceptibles al tacto, no solo marcas superficiales de limpieza).
- Perfiles deformados, con golpes visibles, o con oxidación notoria.

# Por qué importa

Un vidrio dañado representa un riesgo real de seguridad — puede astillarse o quebrarse por completo con el uso normal. Conviene documentarlo y evitar el uso de esa mampara hasta que se revise.

# Recomendación

Si detectas cualquier daño en el vidrio, regístralo como observación con foto, indicando su ubicación exacta. No intentes evaluar si el vidrio es templado o qué tan resistente es — eso no es parte de esta revisión.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.`,
      },
      {
        slug: "mampara-sellos",
        title: "Cómo revisar los sellos de la mampara",
        content: `# Qué revisar

Si los sellos visibles de la mampara (perfiles contra el muro o el receptáculo, uniones entre paneles) se ven continuos, sin separaciones ni grietas.

# Cómo revisarlo

Observa los bordes donde la mampara se une al muro, al receptáculo/piso, y las uniones entre paneles si tiene más de uno.

# Qué debería verse

Sellos continuos, sin separaciones, grietas ni huecos visibles, sin importar el sistema usado (silicona, burletes, perfiles u otro).

# Qué señales pueden indicar un problema

- Separaciones o grietas visibles en cualquiera de los sellos.
- Falta de sello donde debería haberlo.

# Por qué importa

Un sello en mal estado puede permitir el paso de agua fuera de la zona de ducha, generando humedad sostenida si no se corrige.

# Recomendación

Si detectas separaciones o falta de sello, regístralo como observación con foto. No intentes resellar tú mismo.

# Fuente

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos — sin fuente normativa aplicable.`,
      },
      {
        slug: "mampara-filtracion",
        title: "Cómo revisar filtración de agua por la mampara",
        content: `# Qué revisar

Si, durante el uso normal de la ducha, se observa agua saliendo fuera de la mampara, más allá de salpicaduras normales.

# Cómo revisarlo

Usa la ducha con normalidad durante unos momentos, sin dirigir el chorro deliberadamente contra las juntas de la mampara, y observa si sale agua de forma clara hacia fuera de la zona de ducha.

# Qué debería verse

El agua se mantiene dentro de la zona de ducha durante el uso normal, más allá de alguna salpicadura menor esperable en el perfil inferior.

# Qué señales pueden indicar un problema

- Agua saliendo de forma clara y sostenida por debajo o por los costados de la mampara durante el uso normal.

# Por qué importa

Agua saliendo de la zona de ducha de forma sostenida puede generar humedad en el resto del baño si no se corrige.

# Recomendación

Si detectas filtración, regístrala como observación con foto o video corto. No dirijas el chorro deliberadamente contra las juntas para "forzar" la prueba — la observación durante el uso normal es suficiente.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.`,
      },
    ],
  },

  // ============================================================
  // TINA (11AP) — 7 checks
  // ============================================================
  {
    key: "tina",
    label: "Tina / Bañera",
    catalogOrder: 25,
    items: [
      {
        question: "¿La tina presenta trizaduras, quiebres, golpes, esmalte saltado u otros daños visibles?",
        order: 0,
        technicalArticleSlug: "tina-danos-visibles",
        defaultSeverity: "LOW",
      },
      {
        question: "¿La tina se ve firme y estable, sin movimiento evidente, crujidos anormales ni separaciones visibles en sus apoyos o encuentros?",
        order: 1,
        technicalArticleSlug: "tina-fijacion",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "¿El tapón o válvula de la tina retiene el agua sin pérdida evidente durante unos momentos al cerrarlo?",
        order: 2,
        technicalArticleSlug: "tina-tapon-valvula",
        defaultSeverity: "LOW",
      },
      {
        question: "Al usar la tina, ¿se observa alguna fuga o humedad visible en sus conexiones o desagüe visibles y accesibles?",
        order: 3,
        technicalArticleSlug: "tina-fugas",
        defaultSeverity: "HIGH",
      },
      {
        question: "Después de dejar correr una cantidad moderada de agua y destapar el desagüe, ¿el agua evacúa con normalidad, sin quedar acumulada?",
        order: 4,
        technicalArticleSlug: "tina-evacuacion",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "El sello visible entre la tina y el muro (y el piso, si existe ese encuentro), ¿se ve continuo, sin separaciones ni grietas?",
        order: 5,
        technicalArticleSlug: "tina-sellos",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "Si la tina tiene un sistema de llenado propio, distinto al de la ducha, ¿el agua sale con normalidad al abrir esa llave, incluyendo fría y caliente si la instalación dispone de ambas?",
        order: 6,
        technicalArticleSlug: "tina-llenado",
        defaultSeverity: "MEDIUM",
      },
    ],
    articles: [
      {
        slug: "tina-danos-visibles",
        title: "Cómo revisar daños visibles en la tina",
        content: `# Qué revisar

Si la tina presenta trizaduras, quiebres, golpes, esmalte saltado u otros daños visibles.

# Cómo revisarlo

Recorre visualmente toda la superficie de la tina con buena luz, buscando daños. No es necesario identificar el material (acero esmaltado, acrílico, fibra u otro) — solo observa si hay daño visible.

# Qué debería verse

La superficie de la tina sin trizaduras, quiebres, golpes ni esmalte saltado.

# Qué señales pueden indicar un problema

- Trizaduras o grietas visibles.
- Quiebres o desportilladuras.
- Esmalte saltado dejando ver el material base.
- Golpes con marca visible.

# Por qué importa

Un daño en la superficie, aunque no genere una fuga inmediata, es un defecto de calidad y puede empeorar con el uso si no se corrige.

# Recomendación

Si detectas cualquier daño, regístralo como observación con foto, indicando su ubicación exacta.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.`,
      },
      {
        slug: "tina-fijacion",
        title: "Cómo revisar la fijación de la tina",
        content: `# Qué revisar

Si la tina se ve firme y estable, sin movimiento evidente, crujidos anormales ni separaciones visibles en sus apoyos o encuentros.

# Cómo revisarlo

Observa la tina y, si es accesible, toca suavemente su borde. No te pares dentro, no saltes ni apliques peso deliberadamente — muchas tinas van embutidas y no es necesario ni seguro intentar moverlas con fuerza.

# Qué debería verse

La tina firme, sin movimiento perceptible, sin crujidos anormales al tocarla suavemente, y sin separaciones visibles en el encuentro con el muro o el piso.

# Qué señales pueden indicar un problema

- Movimiento perceptible al tocar suavemente el borde.
- Crujidos anormales.
- Separaciones visibles en los apoyos o encuentros de la tina.

# Por qué importa

Una tina mal fijada puede comprometer sus sellos o conexiones con el tiempo.

# Recomendación

Si notas alguna de estas señales, regístralo como observación. No intentes ajustar ni forzar la tina tú mismo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.`,
      },
      {
        slug: "tina-tapon-valvula",
        title: "Cómo revisar el tapón o válvula de la tina",
        content: `# Qué revisar

Si el tapón o válvula de la tina retiene el agua sin pérdida evidente durante unos momentos al cerrarlo.

# Cómo revisarlo

Cierra el tapón o válvula de la tina y deja correr una cantidad pequeña de agua brevemente — no llenes la tina por completo. Observa si el nivel se mantiene sin perderse de forma evidente.

# Qué debería verse

El tapón o válvula retiene el agua sin que se vea perderse de forma evidente durante unos momentos.

# Qué señales pueden indicar un problema

- El agua se pierde rápidamente pese a que el tapón/válvula está cerrado.
- El mecanismo no cierra completamente o no responde con normalidad.

# Por qué importa

Sin un tapón que retenga agua, la tina no puede cumplir su función básica de uso.

# Recomendación

Si detectas pérdida de agua con el tapón cerrado, regístralo como observación. No es necesario desmontar el mecanismo para diagnosticarlo — no llenes la tina completamente solo para esta prueba.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.`,
      },
      {
        slug: "tina-fugas",
        title: "Cómo revisar fugas en la tina",
        content: `# Qué revisar

Si, al usar la tina, se observa alguna fuga o humedad visible en sus conexiones o desagüe visibles y accesibles.

# Cómo revisarlo

Usa la tina con normalidad (dejar correr agua, luego destaparla) y observa las conexiones y el desagüe que sean visibles y accesibles, sin desmontar registros ni acceder a cañerías ocultas.

# Qué debería verse

Sin humedad ni goteo visible en las conexiones o el desagüe accesibles.

# Qué señales pueden indicar un problema

- Goteo o humedad visible en una conexión o unión accesible.
- Manchas de humedad cerca de la base de la tina asociadas directamente a su uso.

# Por qué importa

Una fuga, aunque parezca menor, puede empeorar con el uso y generar humedad sostenida si no se corrige. Esta revisión no certifica la impermeabilización oculta bajo o alrededor de la tina — solo detecta fugas visibles y accesibles.

# Recomendación

Si detectas una fuga, regístrala como observación con foto. No intentes desmontar registros ni conexiones ocultas para investigar más allá de lo visible.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos.`,
      },
      {
        slug: "tina-evacuacion",
        title: "Cómo revisar la evacuación de agua de la tina",
        content: `# Qué revisar

Si, después de dejar correr una cantidad moderada de agua y destapar el desagüe, el agua evacúa con normalidad, sin quedar acumulada.

# Cómo revisarlo

Deja correr una cantidad moderada de agua en la tina (sin llenarla por completo), luego destapa el desagüe y observa cómo evacúa.

# Qué debería verse

El agua evacúa con normalidad, sin quedar acumulada de forma prolongada.

# Qué señales pueden indicar un problema

- El agua tarda visiblemente mucho más de lo esperable en evacuar, o queda acumulada.

No es necesario ni recomendable determinar la causa exacta — solo registra si evacúa con normalidad o no. Pequeñas gotas residuales por la forma del fondo son normales y no cuentan como acumulación.

# Por qué importa

Una evacuación deficiente puede indicar un problema en el desagüe que conviene documentar.

# Recomendación

Si notas acumulación, regístralo como observación con foto o video corto. No introduzcas objetos en el desagüe. Esta revisión no certifica la impermeabilización oculta — solo detecta si el agua evacúa con normalidad.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no define una tolerancia de pendiente para receptáculos o pisos de ducha).`,
      },
      {
        slug: "tina-sellos",
        title: "Cómo revisar los sellos de la tina",
        content: `# Qué revisar

Si el sello visible entre la tina y el muro (y el piso, si existe ese encuentro) se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Observa el borde donde la tina se une al muro, y al piso si ese encuentro existe visiblemente en tu caso.

# Qué debería verse

Un sello continuo, sin separaciones, grietas ni huecos visibles.

# Qué señales pueden indicar un problema

- Separaciones o grietas visibles en el sello.
- Falta de sello donde debería haberlo.

# Por qué importa

Un sello en mal estado puede permitir el paso de agua hacia el muro o la estructura, generando humedad sostenida si no se corrige.

# Recomendación

Si detectas separaciones o falta de sello, regístralo como observación con foto. No intentes resellar tú mismo.

# Fuente

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos (ventana, lavaplatos, lavamanos) — sin fuente normativa aplicable.`,
      },
      {
        slug: "tina-llenado",
        title: "Cómo revisar el llenado propio de la tina",
        content: `# Qué revisar

Si la tina tiene un sistema de llenado propio, distinto al de la ducha, si el agua sale con normalidad al abrir esa llave, incluyendo fría y caliente si la instalación dispone de ambas.

# Cómo revisarlo

Si el baño no tiene ducha instalada, o la tina tiene su propia grifería de llenado (por ejemplo, en el borde de la tina, distinta a la de la ducha), abre esa llave hacia cada lado (fría y caliente) y confirma que sale agua. Si el llenado de la tina se hace con la misma grifería ya revisada en la partida de Ducha, marca esta revisión como "No corresponde".

# Qué debería verse

Sale agua de la llave de llenado propia de la tina al accionarla, de ambas redes si dispone de ambas.

# Qué señales pueden indicar un problema

- No sale agua al accionar la llave de llenado propia de la tina.
- No sale agua de uno de los dos lados (fría o caliente), en una instalación que dispone de ambas.

# Por qué importa

Sin un sistema de llenado funcional, la tina no puede cumplir su función básica de uso.

# Recomendación

Si detectas que no sale agua, regístralo como observación. No es necesario evaluar temperatura exacta, tiempo de calentamiento ni presión.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.`,
      },
    ],
  },

  // ============================================================
  // MUEBLE DE BAÑO / VANITORIO (11AQ) — 4 checks
  // ============================================================
  {
    key: "mueble-bano",
    label: "Mueble de baño / Vanitorio",
    catalogOrder: 26,
    items: [
      {
        question: "¿Las puertas y cajones del mueble abren, cierran o deslizan correctamente, cuando existan?",
        order: 0,
        technicalArticleSlug: "mueble-bano-funcionamiento",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "¿El mueble se siente firme y bien sujeto, sin movimiento evidente al tocarlo suavemente?",
        order: 1,
        technicalArticleSlug: "mueble-bano-fijacion",
        defaultSeverity: "HIGH",
      },
      {
        question: "¿El mueble presenta golpes, quiebres, rayas profundas, cantos despegados u otros daños visibles?",
        order: 2,
        technicalArticleSlug: "mueble-bano-danos-visibles",
        defaultSeverity: "LOW",
      },
      {
        question: "¿Se observan señales de humedad en el mueble (tablero hinchado, melamina levantada, cantos despegados por humedad, manchas, o moho visible)?",
        order: 3,
        technicalArticleSlug: "mueble-bano-humedad",
        defaultSeverity: "MEDIUM",
      },
    ],
    articles: [
      {
        slug: "mueble-bano-funcionamiento",
        title: "Cómo revisar el funcionamiento del mueble de baño",
        content: `# Qué revisar

Si las puertas y cajones del mueble abren, cierran o deslizan correctamente, cuando existan.

# Cómo revisarlo

Abre y cierra cada puerta y cajón del mueble, probando también tiradores y sistemas de cierre si los tiene. Si el mueble no tiene ninguna puerta ni cajón (solo repisas abiertas), marca esta revisión como "No corresponde".

# Qué debería verse

Cada puerta y cajón abre, cierra o desliza con normalidad, sin atascarse ni forzar.

# Qué señales pueden indicar un problema

- Una puerta o cajón se atasca, cuesta mucho mover, o no cierra bien.
- Un tirador o sistema de cierre no responde con normalidad.
- Bisagras o correderas con ruido anormal o que se sienten flojas.

# Por qué importa

Un mueble que no abre/cierra bien es una molestia de uso diario y puede empeorar con el tiempo si no se corrige.

# Recomendación

Si detectas alguna de estas señales, regístralo como observación con foto, indicando cuál puerta o cajón específico presenta el problema.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias, cap. 22, cubre solo tolerancias dimensionales que requieren instrumento, no funcionamiento).`,
      },
      {
        slug: "mueble-bano-fijacion",
        title: "Cómo revisar la fijación del mueble de baño",
        content: `# Qué revisar

Si el mueble se siente firme y bien sujeto, sin movimiento evidente al tocarlo suavemente.

# Cómo revisarlo

Toca el mueble suavemente, sin colgarte de él, aplicar peso ni sacudirlo. Observa si se mueve o cede.

# Qué debería verse

El mueble firme, sin movimiento perceptible al tocarlo con suavidad.

# Qué señales pueden indicar un problema

- El mueble se mueve o cede al tocarlo con suavidad.
- El mueble no se ve firmemente anclado al muro o al piso.

# Por qué importa

Un mueble mal fijado, especialmente si está suspendido (anclado solo al muro), representa un riesgo real de caída.

# Recomendación

Si notas movimiento, regístralo como observación. No intentes ajustar ni apretar nada tú mismo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.`,
      },
      {
        slug: "mueble-bano-danos-visibles",
        title: "Cómo revisar daños visibles en el mueble de baño",
        content: `# Qué revisar

Si el mueble presenta golpes, quiebres, rayas profundas, cantos despegados u otros daños visibles.

# Cómo revisarlo

Recorre visualmente todo el mueble (cuerpo, puertas, cajones, costados, frentes) con buena luz, buscando daños.

# Qué debería verse

El mueble sin golpes, quiebres, rayas profundas ni cantos despegados.

# Qué señales pueden indicar un problema

- Golpes o quiebres visibles.
- Rayas profundas.
- Cantos o bordes despegados.

# Por qué importa

Un daño visible, aunque no genere una falla funcional inmediata, es un defecto de calidad que conviene documentar antes de dar por recibido el baño.

# Recomendación

Si detectas cualquier daño, regístralo como observación con foto, indicando su ubicación exacta.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.`,
      },
      {
        slug: "mueble-bano-humedad",
        title: "Cómo revisar señales de humedad en el mueble de baño",
        content: `# Qué revisar

Si se observan señales de humedad en el mueble: tablero hinchado, melamina levantada, cantos despegados por humedad, manchas, o moho visible.

# Cómo revisarlo

Recorre visualmente el mueble (incluido su interior accesible, sin desmontar nada) buscando señales de humedad.

# Qué debería verse

El mueble sin tableros hinchados, melamina levantada por humedad, manchas ni moho visible.

# Qué señales pueden indicar un problema

- Tablero visiblemente hinchado o deformado.
- Melamina o cantos despegados por humedad (distinto de un canto despegado por golpe).
- Manchas de humedad.
- Moho visible.

No es necesario ni recomendable determinar la causa (fuga, condensación, uso u otra) — solo registra lo que observes.

# Por qué importa

La humedad en un mueble de material aglomerado tiende a empeorar con el tiempo si no se identifica y corrige su causa — conviene documentarla apenas se detecta.

# Recomendación

Si detectas cualquiera de estas señales, regístralo como observación con foto. Esta revisión puede coexistir con una observación de fuga registrada en la partida de Lavamanos — no es necesario elegir una sola, ambas pueden ser hallazgos reales y complementarios.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable.`,
      },
    ],
  },

  // ============================================================
  // CUBIERTA DE BAÑO (11AR) — 3 checks
  // ============================================================
  {
    key: "cubierta-bano",
    label: "Cubierta de baño",
    catalogOrder: 27,
    items: [
      {
        question: "¿La cubierta o mesón se ve firme y bien instalada, sin movimiento evidente al tocarla suavemente?",
        order: 0,
        technicalArticleSlug: "cubierta-bano-fijacion",
        defaultSeverity: "MEDIUM",
      },
      {
        question: "¿La cubierta presenta golpes, quiebres, trizaduras, rayas profundas, manchas, hinchamiento u otro deterioro o daño visible?",
        order: 1,
        technicalArticleSlug: "cubierta-bano-danos-visibles",
        defaultSeverity: "LOW",
      },
      {
        question: "El sello entre la cubierta y el muro (en el tramo que no corresponde al Lavamanos), ¿se ve continuo, sin separaciones ni grietas?",
        order: 2,
        technicalArticleSlug: "cubierta-bano-sello",
        defaultSeverity: "MEDIUM",
      },
    ],
    articles: [
      {
        slug: "cubierta-bano-fijacion",
        title: "Cómo revisar la fijación de la cubierta de baño",
        content: `# Qué revisar

Si la cubierta o mesón se ve firme y bien instalada, sin movimiento evidente al tocarla suavemente.

# Cómo revisarlo

Toca la cubierta suavemente con la mano en distintos puntos, especialmente cerca de los bordes y las uniones con el mueble o el muro. No te apoyes con tu peso ni apliques fuerza.

# Qué debería verse

La cubierta no se mueve ni se balancea al tocarla levemente, y no hay separación visible entre la cubierta y su soporte (mueble, muro u obra).

# Qué señales pueden indicar un problema

- La cubierta se mueve o cede al presionarla suavemente.
- Se ve una separación entre la cubierta y su soporte.

# Por qué importa

Una cubierta mal fijada puede indicar un problema en su soporte y empeorar con el uso normal.

# Recomendación

No apliques fuerza excesiva ni te apoyes con todo tu peso para probarla. Si notas movimiento, regístralo con foto.

# Fuente

- Criterio interno del proyecto. El Manual de Tolerancias (cap. 22) da solo la horizontalidad dimensional de la superficie (1 mm por metro lineal, verificable con nivel), no un criterio de fijación.`,
      },
      {
        slug: "cubierta-bano-danos-visibles",
        title: "Cómo revisar daños visibles en la cubierta de baño",
        content: `# Qué revisar

Si la cubierta presenta golpes, quiebres, trizaduras, rayas profundas, manchas, hinchamiento u otro deterioro o daño visible.

# Cómo revisarlo

Recorre visualmente toda la superficie de la cubierta con buena luz, incluidos sus bordes y, si tiene más de una pieza, las juntas entre ellas.

# Qué debería verse

La superficie sin golpes, quiebres, trizaduras, rayas profundas, manchas ni ningún otro deterioro visible — sin importar el material (piedra, cuarzo, cerámica, madera u otro).

# Qué señales pueden indicar un problema

- Golpes, quiebres o trizaduras.
- Rayas profundas.
- Manchas que no corresponden a suciedad removible con limpieza normal.
- Hinchamiento o deformación visible (más frecuente en materiales tipo MDF revestido).
- Separación o desalineamiento visible en las juntas entre piezas, si tiene más de una.

# Por qué importa

Un daño en la cubierta, aunque no genere una falla funcional inmediata, es un defecto de calidad de uso diario que conviene documentar.

# Recomendación

Si detectas cualquier daño, regístralo como observación con foto, indicando su ubicación exacta.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.`,
      },
      {
        slug: "cubierta-bano-sello",
        title: "Cómo revisar el sello de la cubierta de baño con el muro",
        content: `# Qué revisar

Si el sello entre la cubierta y el muro (en el tramo que no corresponde al lavamanos, que se revisa por separado) se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Observa el borde donde la cubierta se une al muro, en las zonas que no están directamente bajo el lavamanos.

# Qué debería verse

Un sello continuo, sin separaciones, grietas ni huecos visibles, sin importar el material de sellado usado.

# Qué señales pueden indicar un problema

- Separaciones o grietas visibles en el sello.
- Falta de sello donde debería haberlo.

# Por qué importa

Un sello en mal estado puede permitir el paso de agua hacia el muro, generando humedad sostenida si no se corrige — aunque hoy se vea seco.

# Recomendación

Si detectas separaciones o falta de sello, regístralo como observación con foto. No intentes resellar tú mismo.

# Fuente

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros componentes (ventana, lavamanos, ducha, tina, mampara) — sin fuente normativa aplicable.`,
      },
    ],
  },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // 1) Confirmar que el vínculo histórico bano->artefactos-sanitarios sigue
  // intacto — solo lectura, nunca se modifica en este script.
  const artefactosSanitarios = await prisma.inspectionElementTemplate.findUniqueOrThrow({
    where: { key: "artefactos-sanitarios" },
  });
  const bano = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: "bano" } });
  const legacyLink = await prisma.inspectionElementTemplateSpace.findFirst({
    where: { spaceTemplateId: bano.id, elementTemplateId: artefactosSanitarios.id },
  });
  console.log(
    `OK: vínculo bano->artefactos-sanitarios ${legacyLink ? `intacto (id ${legacyLink.id})` : "NO ENCONTRADO"} — sin modificar en esta ejecución.`
  );

  let totalChecks = 0;
  for (const comp of components) {
    const template = await prisma.inspectionElementTemplate.upsert({
      where: { key: comp.key },
      update: { label: comp.label, order: comp.catalogOrder, active: true },
      create: {
        key: comp.key,
        label: comp.label,
        order: comp.catalogOrder,
        appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"],
      },
    });
    console.log(`\nOK: elemento "${comp.label}" (key=${comp.key}, id=${template.id})`);

    for (const a of comp.articles) {
      await prisma.technicalArticle.upsert({
        where: { slug: a.slug },
        update: { title: a.title, content: a.content },
        create: { slug: a.slug, title: a.title, content: a.content },
      });
    }
    console.log(`  OK: ${comp.articles.length} artículos técnicos creados/actualizados.`);

    for (const item of comp.items) {
      const existing = await prisma.inspectionChecklistItem.findFirst({
        where: { elementTemplateId: template.id, question: item.question },
      });
      if (existing) {
        await prisma.inspectionChecklistItem.update({
          where: { id: existing.id },
          data: {
            order: item.order,
            technicalArticleSlug: item.technicalArticleSlug,
            defaultSeverity: item.defaultSeverity,
            active: true,
          },
        });
      } else {
        await prisma.inspectionChecklistItem.create({
          data: {
            elementTemplateId: template.id,
            question: item.question,
            order: item.order,
            technicalArticleSlug: item.technicalArticleSlug,
            defaultSeverity: item.defaultSeverity,
            active: true,
          },
        });
      }
    }
    console.log(`  OK: ${comp.items.length} preguntas creadas/actualizadas (severidades: ${comp.items.map((i) => i.defaultSeverity).join(",")})`);
    totalChecks += comp.items.length;

    const links = await prisma.inspectionElementTemplateSpace.findMany({ where: { elementTemplateId: template.id } });
    console.log(`  InspectionElementTemplateSpace vinculados a "${comp.key}": ${links.length} (esperado: 0 — 100% Nivel 2, sin generación automática).`);
  }

  console.log(`\nTOTAL componentes: ${components.length} (esperado 8). TOTAL checks: ${totalChecks} (esperado 36).`);
  console.log(
    "\nFase 11AU: Baño Lotes B-F consolidados — 8 componentes especiales creados/confirmados. Vínculo bano->artefactos-sanitarios intacto, sin desacoplar en catálogo (desacople es solo de código, ya aplicado en Fase 11AT)."
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
