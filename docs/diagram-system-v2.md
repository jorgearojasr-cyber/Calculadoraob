# Diagram System V2

**Estado: oficial y único sistema de diagramas de ObraBien Calcula.**
Migración cerrada el 2026-08-02. Reemplaza por completo al sistema
anterior (`measure-diagram.tsx` / `isometric-diagram.ts`), que fue
eliminado del proyecto — no debería quedar ninguna referencia a él.

Este documento es la referencia permanente del sistema: por qué existe,
cómo está construido, cómo se usa, y qué hacer (y qué no) si hay que
tocarlo. `docs/svg-diagram-system.md` documenta la especificación visual
del sistema *anterior* y queda como registro histórico — no describe el
código actual.

## Objetivo del sistema

El diagrama de medidas no es una ilustración decorativa: es la forma en
que el usuario valida visualmente que las medidas que está escribiendo
corresponden a lo que quiere calcular, antes de avanzar en el asistente.
Tiene que ser:

- **Predecible** — el mismo lenguaje visual en los ~40 módulos de
  cálculo de la app, sin variaciones por módulo.
- **Reactivo en vivo** — se redibuja con cada tecla que el usuario
  escribe, reflejando la proporción real de sus medidas (dentro de los
  límites de legibilidad, ver "Compresión no lineal" más abajo).
- **Claro en los extremos** — un objeto muy largo y angosto, o casi
  cuadrado y diminuto, tiene que seguir siendo legible, sin que las
  cotas se corten, se superpongan o el dibujo colapse en una línea.

No es una herramienta de diseño técnico ni un plano a escala — es una
ayuda de validación visual rápida.

## Principios de diseño

Estos son los principios que quedaron **congelados y aprobados** tras el
proceso de calibración visual (2026-08-01/02). No son sugerencias: un
cambio a cualquiera de estos puntos es un cambio de lenguaje visual y
requiere aprobación explícita antes de tocarse (ver "Checklist para
futuras modificaciones").

1. **Una sola cámara, sin excepciones.** Todo diagrama 3D usa la misma
   proyección axonométrica a 18°, definida en un único lugar
   (`math/camera.ts`). Ningún módulo tiene su propio ángulo o variante.
2. **2D es 2D de verdad.** Los diagramas de superficie (m²) son vista
   ortogonal pura — sin perspectiva, sin espesor, sin sombra de volumen.
   2D y 3D son familias visuales *hermanas*, no una es una simplificación
   de la otra.
3. **El sólido se lee antes que las cotas.** Jerarquía visual: primero
   la forma (con su iluminación y contraste entre caras), después las
   líneas de cota (tenues, nunca compiten), después los chips de valor
   (el elemento con más contraste de la escena).
4. **Las cotas nunca tocan el sólido.** Todo carril de cota vive a una
   distancia constante del objeto, con líneas de referencia que van
   desde los vértices reales hasta el carril — nunca cruzan ni pisan la
   geometría.
5. **El naranjo es exclusivo del campo activo.** Es el único uso de
   color de marca (`BRAND_ORANGE`) en todo el diagrama — significa
   "esto es lo que estás escribiendo ahora mismo", nunca decoración.
6. **El panel sigue al objeto, no al revés.** No hay una altura fija de
   panel — el `viewBox` se ajusta para que el sólido ocupe ~80-85% de su
   eje dominante, y crece lo justo para no cortar ningún carril o chip.
7. **Todo cambio de "sensación" pasa por render, nunca por geometría.**
   Contraste entre caras, degradados de luz, grosor de línea: todo eso
   vive en `render/theme.ts` y los componentes de `render/`. La cámara,
   el escalado y el layout de cotas (`math/`, `layout/`) son el motor
   matemático — cambiarlos altera la lectura geométrica del objeto, no
   solo su acabado.

## Arquitectura general

Cuatro capas, cada una sin conocimiento de la que viene después:

```
math/     → geometría pura (vectores, cámara, sólidos, escalado).
            Sin JSX, sin SVG, sin color. No sabe que existe una pantalla.
layout/   → dónde va cada cota (carriles, offsets, líneas de
            referencia). Sigue sin saber pintar nada — solo geometría
            de las cotas, no del sólido.
render/   → el ÚNICO lugar que sabe de SVG, color, tipografía y grosor
            de línea. Consume la geometría ya calculada por math/ y
            layout/, nunca la recalcula.
DiagramV2.tsx → composición: decide qué construir según `kind`, llama a
            math/ → layout/ → render/ en orden, arma el <svg> final.
            Es el único archivo del sistema que el resto de la app
            debería importar (vía index.ts).
```

La regla dura de esta arquitectura: **math/ nunca depende de render/**.
Se puede cambiar toda la paleta de colores sin tocar una sola fórmula
geométrica, y se puede cambiar el ángulo de cámara (si algún día se
aprueba) sin tocar un solo componente visual. Esta separación es la que
permitió, por ejemplo, agregar degradados sutiles en las caras del
sólido (una calibración puramente visual) sin arriesgar ni un pixel de
la proyección o el escalado.

## Componentes principales

```
src/lib/diagram-v2/
├── index.ts                  Punto de entrada público
├── DiagramV2.tsx              Composición — el componente que se usa
├── math/
│   ├── vec2.ts                 Álgebra vectorial 2D pura
│   ├── camera.ts                Proyección axonométrica fija (18°)
│   ├── solids.ts                 Geometría local de caja y cilindro
│   └── scale-engine.ts            Compresión de proporciones + fit al viewBox
├── layout/
│   ├── dimension-lane.ts       Carril de cota genérico (paralelo a una arista)
│   └── depth-lane.ts            Carril de profundidad (caso especial: fijo a la derecha)
└── render/
    ├── theme.ts                  Único archivo con colores/tipografía/grosores
    ├── solid-3d.tsx                Pinta BoxSolid y CylinderSolid (con degradados)
    ├── shape-2d.tsx                 Pinta Rect2D y Circle2D (planos, sin degradado)
    └── dimension-chip.tsx            Pinta el carril + chip de valor de una cota
```

| Archivo | Responsabilidad | Sabe de... |
|---|---|---|
| `math/vec2.ts` | Suma, resta, producto punto, normalización, bbox | Nada de dominio — es álgebra genérica |
| `math/camera.ts` | Proyectar un punto 3D local a 2D | El ángulo de cámara (18°), nada más |
| `math/solids.ts` | Vértices de la caja/cilindro en espacio local, y qué caras son visibles en qué orden | La cámara (para saber orientación), no de escala real ni de color |
| `math/scale-engine.ts` | Comprimir proporciones extremas, ajustar puntos a un `viewBox` | Nada de metros reales — trabaja en proporciones 0-1 y unidades de panel |
| `layout/dimension-lane.ts` | Geometría de un carril de cota (paralelo, offset constante, líneas de referencia) | Vectores, nada de SVG ni color |
| `layout/depth-lane.ts` | Caso especial: el carril de profundidad siempre a la derecha del sólido | Reutiliza `dimension-lane.ts` |
| `render/theme.ts` | Todos los colores, grosores, radios y fuentes | Nada de geometría |
| `render/solid-3d.tsx` | JSX de `<polygon>`/`<path>` con degradados por cara | Geometría YA proyectada (no calcula puntos) |
| `render/shape-2d.tsx` | JSX de `<rect>`/`<circle>` planos | Igual — solo pinta lo que le pasan |
| `render/dimension-chip.tsx` | JSX de carril + flechas + chip de texto | Geometría de `layout/`, color de `theme.ts` |
| `DiagramV2.tsx` | Orquesta todo lo anterior según `kind`, arma el `<svg>` público | Todas las capas — es la única que las conoce a todas |

## Flujo de render

Para `kind="box"` (el más completo, los otros 3 son variaciones más
simples del mismo patrón):

1. **Compresión de proporciones** — `compressedRatios([largo, ancho,
   profundidad])` normaliza las 3 medidas reales a proporciones 0-1,
   con el eje dominante intacto y los ejes muy chicos empujados hacia
   arriba (ver "Compresión no lineal").
2. **Geometría local** — `buildBox(largoR, anchoR, profundidadR)`
   calcula los 7 vértices del prisma ya proyectados a 2D (todavía en
   unidades relativas, no de panel).
3. **Ajuste al viewBox** — `fitToSilhouette(...)` escala esos puntos
   para que el eje dominante ocupe `CONTENT_TARGET` unidades de panel, y
   devuelve una función `project()` que se aplica a cada vértice.
4. **Caras visibles** — `boxFaces(P)` arma los 3 polígonos (pared
   izquierda, pared derecha, tapa superior) en el orden Z correcto.
5. **Carriles de cota** — `buildLane(...)` (largo y ancho, offset desde
   la capa de composición) y `buildDepthLane(...)` (profundidad, siempre
   a la derecha) calculan dónde va cada línea de cota y su chip.
6. **Anti-colisión de chips** — `separateChips(...)` empuja
   horizontalmente los chips de largo/ancho si se superpondrían
   (aristas que comparten vértice cercano, común en objetos angostos).
7. **Canvas final** — `finalizeCanvas(...)` agranda el `viewBox` (sin
   volver a escalar `k`) lo justo para contener también los carriles y
   chips, que se dibujan más allá del bbox del sólido.
8. **Render** — se pinta `<BoxSolid>` (caras con degradado) y 3
   `<DimensionChip>` (uno por cota), dentro de un `<g transform=...>`
   que centra todo en el `viewBox` final.

`kind="cylinder"`, `"rect2d"` y `"circle2d"` siguen el mismo patrón,
recortando los pasos que no aplican (2D no tiene profundidad ni caras;
el círculo no tiene anti-colisión porque solo tiene una cota).

## API pública

Todo el sistema se consume a través de un único componente:

```ts
import { DiagramV2, type DiagramV2Props } from "@/lib/diagram-v2";
```

```ts
type Field = "largo" | "ancho" | "profundidad" | "diametro";

type DiagramV2Props = {
  kind: "box" | "cylinder" | "rect2d" | "circle2d";
  largo?: number;
  ancho?: number;
  profundidad?: number;
  diametro?: number;
  labels: Partial<Record<Field, string>>;   // texto de cada etiqueta (ej. "Ancho")
  unit?: string;                             // unidad global, default "m"
  units?: Partial<Record<Field, string>>;    // unidad por campo (ver más abajo)
  activeField?: Field;                       // qué campo resaltar en naranjo
  className?: string;                        // default "w-full"
};
```

Notas de uso:

- **`kind` determina qué campos son relevantes** — `"box"` usa
  largo/ancho/profundidad, `"cylinder"` usa diametro/profundidad,
  `"rect2d"` usa largo/ancho, `"circle2d"` usa diametro. Pasar un campo
  que no aplica al `kind` simplemente se ignora.
- **Valores `undefined`** — cuando un valor todavía no fue escrito por
  el usuario, el diagrama sigue mostrando geometría (con valores por
  defecto internos: 4.5×2.8×1.2 para caja, etc.) pero el chip muestra el
  *label* en vez de un valor formateado — así el panel nunca está vacío
  mientras el usuario llena el formulario.
- **`unit` vs `units`** — si todos los campos comparten unidad (el caso
  más común, ej. todo en metros), basta con `unit="m"`. Si un módulo
  mezcla unidades por campo (ej. Pilar/columna: ancho y alto en cm,
  profundidad en m), hay que pasar `units={{ ancho: "cm", alto: "cm",
  profundidad: "m" }}` — `units` tiene prioridad sobre `unit` campo por
  campo; `unit` sigue siendo el *fallback* para cualquier campo que no
  esté en `units`.
- **`activeField`** — se recalcula en el consumidor (no en `DiagramV2`)
  a partir del foco real de los `<input>` del formulario. Ver el patrón
  ya usado en `question-group-step.tsx` y `area-input-toggle.tsx`: un
  estado `activeKey`/`activeInput` que se actualiza en `onFocus`/`onBlur`
  de cada input, mapeado al `Field` correspondiente.

## Tipos de diagramas soportados

| `kind` | Forma | Campos | Uso típico |
|---|---|---|---|
| `"box"` | Prisma rectangular isométrico | largo, ancho, profundidad | Excavaciones, piscinas rectangulares, jardineras — cualquier módulo cuyo resultado es un volumen con base rectangular |
| `"cylinder"` | Cilindro isométrico | diámetro, profundidad | Piscinas circulares, excavaciones circulares — volumen con base circular |
| `"rect2d"` | Rectángulo, vista ortogonal | largo, ancho | Radier, losas, muros, cerámica, pintura — cualquier módulo cuyo resultado es una superficie rectangular |
| `"circle2d"` | Círculo, vista ortogonal | diámetro | Superficies circulares (hoy sin módulo real que lo use — soportado por la API pero sin consumidor en producción) |

## Cómo agregar un nuevo tipo de diagrama

Antes de nada: **¿el nuevo caso realmente necesita una geometría nueva,
o es una combinación de largo/ancho/profundidad/diámetro que ya existe?**
La enorme mayoría de los módulos de ObraBien son una caja, un cilindro,
un rectángulo o un círculo — revisar primero si el `kind` correcto ya
existe antes de construir uno nuevo.

Si de verdad hace falta una forma nueva (ej. un triángulo, una L, un
trapecio):

1. **`math/solids.ts`** (o un archivo nuevo en `math/` si la forma es
   muy distinta): agregar una función `buildX(...)` que devuelva los
   vértices en espacio local, usando `project()` de `camera.ts` — nunca
   calcules el ángulo de cámara de nuevo, impórtalo.
2. **`math/scale-engine.ts`**: normalmente no hace falta tocarlo —
   `compressedRatios` y `fitToSilhouette` son genéricos sobre cualquier
   set de puntos 2D.
3. **`layout/`**: si la forma tiene aristas rectas, reutiliza
   `buildLane`/`outwardFromFace` tal cual. Si tiene una cota con
   posición fija (como la profundidad, siempre a la derecha), sigue el
   patrón de `depth-lane.ts` — un wrapper delgado sobre `buildLane` con
   la dirección `outward` fija.
4. **`render/`**: agrega el componente de pintado (`XSolid` en
   `solid-3d.tsx` si es 3D, o en `shape-2d.tsx` si es 2D) — solo debe
   recibir geometría ya proyectada y pintar, nunca calcular puntos.
5. **`DiagramV2.tsx`**: agrega el nuevo valor a `kind`, y una rama
   `if (kind === "x") { ... }` siguiendo el flujo de render descrito
   arriba (compresión → geometría → fit → carriles → anti-colisión si
   aplica → canvas final → JSX).
6. **`DiagramV2Props`**: si la forma necesita un campo nuevo (algo que
   no sea largo/ancho/profundidad/diametro), agrégalo al tipo `Field` y
   a los props — es una extensión aditiva, no debería romper a ningún
   consumidor existente.
7. **Antes de integrarlo a un módulo real**: pruébalo primero en una
   página de desarrollo aislada (el patrón que se usó para construir
   todo el sistema fue `/zzdiagramv2test`, hoy todavía presente en el
   repo como referencia/sandbox) con varios casos extremos (muy angosto,
   muy chico, muy grande, casi cuadrado) antes de tocar cualquier
   `question-group-step.tsx`.
8. **Visual**: si la forma nueva necesita un color o degradado que no
   existe en `theme.ts`, agrégalo ahí — nunca hardcodees un color
   directamente en un componente de `render/`.

## Convenciones del proyecto

- **`math/` y `layout/` nunca importan de `render/`.** Si sientes la
  tentación de pasarle un color a una función de `math/`, es una señal
  de que ese cálculo pertenece a otra capa.
- **Ningún archivo de `math/` o `layout/` conoce metros reales.**
  Trabajan en proporciones (0-1) o en unidades de panel (`viewBox`) — la
  conversión de metros reales a proporciones ocurre en
  `compressedRatios`, y de ahí en adelante todo es geometría abstracta.
  El formateo con unidad real (`fmt()`, `"4,50 m"`) vive en
  `DiagramV2.tsx`, no en `math/`.
- **Los componentes de `render/` nunca calculan un punto.** Reciben
  vértices ya proyectados y solo deciden cómo pintarlos (color, orden,
  grosor). Si un componente de `render/` necesita saber un ángulo o una
  proporción, es una señal de que ese cálculo se filtró a la capa
  equivocada.
- **Un solo archivo de colores.** Todo color, grosor de línea, radio de
  esquina y fuente vive en `render/theme.ts`. No hay valores hardcodeados
  de color en ningún otro archivo del sistema.
- **Offsets de cota se ajustan desde la capa de composición, no desde
  `layout/`.** `LANE_OFFSET` (en `dimension-lane.ts`) es el valor base
  congelado; `DiagramV2.tsx` puede pasar un `offset` distinto por caso de
  uso (ver `CHIP_OFFSET`, `CHIP_OFFSET_ANCHO_2D`) sin tocar el archivo de
  `layout/`. Esta distinción importó en la práctica: permitió ajustar
  separación de chips en calibraciones visuales sin arriesgar la
  arquitectura de cotas.
- **`DiagramV2.tsx` es el único punto de importación permitido para el
  resto de la app.** Nada fuera de `src/lib/diagram-v2/` debería
  importar de `math/`, `layout/` o `render/` directamente — siempre a
  través de `index.ts`.
- **Todos los comentarios de "por qué" se quedan en el código, no solo
  en este doc.** Si corregís un bug o tomás una decisión de diseño no
  obvia, dejá un comentario breve en el archivo relevante explicando el
  motivo (no el qué) — es lo que hizo posible reconstruir la historia de
  este sistema durante la migración y debería seguir siendo así.

## Decisiones técnicas importantes

Estas son las decisiones que costó más trabajo llegar a la forma actual
— vale la pena entender el porqué antes de asumir que están "mal" o que
se pueden simplificar:

- **La cámara no tiene foreshortening en el eje de profundidad.** Una
  axonométrica "de manual" escorza los 3 ejes por igual; acá el eje de
  profundidad se proyecta 1:1. Es una desviación deliberada de la pureza
  matemática, para que la profundidad se lea con la misma claridad que
  largo/ancho, tal como la muestra el mockup aprobado. Ver comentario en
  `math/camera.ts`.
- **Compresión no lineal de proporciones extremas
  (`scale-engine.ts`).** Sin esto, un objeto 12×0,6×0,8 (una zanja, por
  ejemplo) colapsaría en una franja casi ilegible en pantalla. El eje
  dominante nunca se toca; los ejes ya razonablemente cerca del
  dominante tampoco; solo los ejes muy chicos en comparación se empujan
  hacia arriba con una potencia < 1. Es una técnica heredada del sistema
  anterior, pero la lógica es independiente de la cámara — no se
  reconstruyó de cero.
- **`outwardFromFace` usa el centroide de la CARA, no del sólido
  completo.** El sistema anterior calculaba la dirección "hacia afuera"
  de una cota contra el centroide del sólido entero — heurística frágil
  que fallaba para la arista más cercana a la cámara en objetos con
  proporciones extremas (cruzaba por encima de la cara superior en vez
  de alejarse de ella). Usar el centroide de la cara específica a la que
  pertenece la arista es lo que lo resuelve de forma robusta para
  cualquier proporción.
- **Anti-colisión de chips por desplazamiento horizontal
  (`separateChips`).** Cuando 2 aristas comparten un vértice cercano
  (ej. largo y ancho de un objeto angosto en planta, o largo/ancho de un
  rectángulo casi cuadrado en 2D), sus chips pueden superponerse. La
  solución NO mueve el carril (la línea + flecha, que sigue midiendo la
  arista real) — solo empuja el chip que se dibuja sobre él, lo justo
  para no tocarse. Aplica tanto a `"box"` como a `"rect2d"` (bug
  encontrado en la revisión final: al principio solo estaba en `"box"`).
- **`finalizeCanvas` crece el viewBox sin volver a escalar.** El sólido
  ya tiene su tamaño final calculado por `fitToSilhouette`; los carriles
  de cota (sobre todo el de profundidad, siempre fuera de la silueta)
  se extienden más allá de ese bbox. Si el `viewBox` se quedara del
  tamaño del sólido, esos carriles quedarían recortados. Este paso final
  agranda el `viewBox` y calcula un `translate` para centrar todo, sin
  tocar la escala `k` ya decidida — el objeto no cambia de tamaño, el
  panel simplemente se agranda para mostrarlo completo.
- **`units` por campo (agregado en el cierre de la migración).** El
  sistema anterior soportaba una unidad distinta por campo
  (`primaryUnit`/`secondaryUnit`/`depthUnit`); la primera versión de
  `DiagramV2` solo aceptaba una unidad global, lo que producía un bug
  real en Pilar/columna (mostraba "2,8 cm" para un valor real de "2,8
  m"). Se agregó `units?: Partial<Record<Field, string>>` de forma
  aditiva — cualquier consumidor que solo pasaba `unit` sigue
  funcionando igual.
- **`activeField` vive fuera de `DiagramV2`.** El componente no sabe qué
  input tiene foco — cada consumidor mantiene su propio estado de "campo
  activo" (derivado de `onFocus`/`onBlur` de sus propios inputs) y se lo
  pasa como prop. Esto evitó acoplar el sistema de diagramas al sistema
  de formularios de la app.

## Limitaciones conocidas

- **Solo 4 formas soportadas** (`box`, `cylinder`, `rect2d`,
  `circle2d`). Cualquier módulo con una geometría distinta (triángulos,
  formas en L, trapecios) no tiene representación hoy — ver "Cómo
  agregar un nuevo tipo de diagrama" si hace falta.
- **`circle2d` no tiene consumidor real en producción** — está en la API
  pública y probado en `/zzdiagramv2test`, pero ningún módulo actual lo
  usa (todos los círculos existentes son volumen, `cylinder`).
- **El ángulo de cámara (18°) y la proyección sin foreshortening en
  profundidad son una decisión visual, no una axonométrica matemáticamente
  "pura".** Si algún día se necesita una vista técnica realmente precisa
  (para un plano, no para un diagrama de validación), este sistema no es
  el punto de partida correcto.
- **`estimateChipWidth` es un heurístico de caracteres, no medición real
  de texto.** No hay medición de texto disponible del lado del servidor;
  los anchos promedio por carácter (Figtree 9px para el label, IBM Plex
  Mono 11px bold para el valor) se ajustaron a ojo contra el mockup. Un
  cambio de fuente o de tamaño de fuente en `theme.ts` podría requerir
  reajustar estas constantes en `render/dimension-chip.tsx`.
- **El sistema de preguntas/formularios (fuera de este sistema) puede
  entregarle a `DiagramV2` datos con problemas que el diagrama no puede
  detectar ni corregir** — por ejemplo, si el orden de las preguntas en
  la base de datos no coincide con el orden que asume la configuración
  del módulo, el diagrama mostrará fielmente lo que le llega, con la
  etiqueta equivocada en el campo equivocado (ver el bug de Pilar/columna
  documentado como tarea aparte, no arreglado en este sistema porque el
  problema está en la capa de datos, no en el render).
- **No hay animación entre estados.** El diagrama se re-renderiza
  completo en cada cambio de valor — no hay transición suave entre
  proporciones. No fue un requisito de la especificación aprobada.

## Checklist para futuras modificaciones

Antes de tocar cualquier archivo de `src/lib/diagram-v2/`, preguntate:

- [ ] **¿Es un cambio de geometría/cámara/escalado, o de acabado
      visual?** Si es geometría (`math/`, `layout/`), es un cambio de
      arquitectura — necesita aprobación explícita antes de
      implementarse, no una calibración libre. Si es acabado (`render/`,
      sobre todo `theme.ts`), tiene más margen, pero sigue siendo
      lenguaje visual congelado — confirmar con el equipo/usuario antes
      de cambiar colores, tipografía o proporciones del chip.
- [ ] **¿El cambio se puede resolver en la capa de composición
      (`DiagramV2.tsx`) sin tocar `math/` o `layout/`?** Los offsets de
      cota, por ejemplo, se ajustan pasando un valor distinto a
      `buildLane`/`buildDepthLane` desde `DiagramV2.tsx` — no
      modificando `LANE_OFFSET` en `dimension-lane.ts`. Preferir siempre
      la capa más alta posible.
- [ ] **¿El cambio rompe la separación math → layout → render?** Si una
      función de `math/` o `layout/` necesita saber de color, o un
      componente de `render/` necesita calcular un punto nuevo, es una
      señal de diseño equivocado — reubicar el cálculo en la capa
      correcta.
- [ ] **¿Se probó contra casos extremos?** Objeto muy largo y angosto,
      muy chico, muy grande, casi cuadrado/cúbico — la compresión no
      lineal y el anti-colisión de chips existen exactamente porque
      estos casos rompían versiones anteriores. Cualquier cambio de
      escalado o de layout de cotas debe volver a probarse contra ellos.
- [ ] **¿Se probó en al menos un módulo real, no solo en
      `/zzdiagramv2test`?** El test aislado prueba el componente; un
      módulo real prueba además el cableado de props (valores, labels,
      unidades, `activeField`) desde `question-group-step.tsx` o
      `area-input-toggle.tsx`.
- [ ] **¿Sigue siendo `tsc`/`eslint`/`next build` limpio?** Correr los 3
      antes de dar por terminado cualquier cambio.
- [ ] **¿El cambio beneficia a todos los módulos, o es un caso
      especial de uno solo?** Este sistema es explícitamente compartido
      — un ajuste pensado para un módulo específico casi siempre
      pertenece a la capa de composición (props/valores), nunca a un
      `if` especial dentro de `math/`, `layout/` o `render/`.
- [ ] **¿El cambio es realmente de Diagram System V2, o del sistema de
      preguntas/formularios que lo consume?** Ver "Limitaciones
      conocidas" — no todo bug visible en el diagrama es un bug del
      diagrama. Si el problema está en qué dato le llega (orden de
      preguntas, valor por defecto, etc.), corresponde arreglarlo en
      `question-group-step.tsx`/`area-input-toggle.tsx` o en la capa de
      datos, no en `src/lib/diagram-v2/`.
