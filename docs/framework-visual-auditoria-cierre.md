# Framework Visual de ObraBien — Auditoría de cierre

**Fecha:** 2026-08-02
**Alcance:** cierre de la consolidación arquitectónica (Fase A: registro único, división de archivos, extracción de lógica compartida; Fase B: accesibilidad, responsive, rendimiento). Evaluación honesta antes de retomar el foco en producto.

---

## 1. Arquitectura — ¿qué tan preparada quedó para crecer?

Bien preparada para el crecimiento **incremental** (nuevas calculadoras dentro de las familias geométricas ya cubiertas: rectángulo, caja, cilindro, figura escalonada, área directa). No está preparada, todavía, para crecer en **tipos de geometría genuinamente nuevos** sin escribir código — eso es exactamente lo que separa el estado actual de un "Framework V2" (ver sección 3).

Lo que sostiene esa preparación:
- **Un solo registro de configuración** (`module-visual-config.ts`) en vez de 6 mapas dispersos — agregar una calculadora con diagrama hoy significa una entrada nueva en un solo archivo, no tocar 3-4 archivos distintos.
- **Separación de responsabilidades real** en `question-group-step/` (orquestador, paso de volumen, fila de campo, utilidades, hook de preview) — no es una carpeta con archivos cortados por tamaño, cada uno tiene un motivo de existir.
- **Lógica común centralizada** (`dimension-utils/`: parsing, unidades, formateo, validación, área) — el próximo componente que necesite "convertir un campo a metros" lo importa, no lo reinventa.
- **Un único punto de entrada al motor de diagramas** (`DiagramV2`) que nunca se rompió durante toda la migración — la mejor señal de que el diseño original (geometría/layout/render separados, un solo export público) fue la decisión correcta desde el principio.

Lo que limita esa preparación:
- El registro sigue acoplado a **cuids de Prisma como claves** (`stepGroup`). Es legible gracias a los comentarios, pero no hay ningún chequeo en tiempo de compilación que confirme que un cuid todavía existe en la base — un stepGroup renombrado en el seed rompe silenciosamente el diagrama de ese módulo, sin error, solo un módulo que deja de mostrar su geometría.
- El registro es **un solo archivo de ~700 líneas**. Hoy es manejable porque está bien organizado por módulo con comentarios, pero seguirá creciendo linealmente con cada calculadora nueva que tenga diagrama — en algún punto (probablemente sobre 100-150 módulos) valdrá la pena dividirlo por categoría.

---

## 2. Reutilización — ¿qué tan genérico es hoy el framework?

Con datos reales de la base (56 módulos activos):

| | Cantidad | % |
|---|---|---|
| Módulos con alguna entrada en `MODULE_CONFIG` (diagrama, hero, recálculo, etc.) | 40 | ~71% |
| — de esos, usando `AreaInputToggle` (100% genérico, cero código por módulo) | 16 | ~29% |
| Módulos sin ninguna entrada (grid genérico plano, sin diagrama) | 16 | ~29% |
| Componentes **bespoke** (geometría no representable por el motor genérico) | 1 (`FoundationStep`) | ~2% |

Lectura honesta: **~98% de los 56 módulos se renderizan con exactamente los mismos componentes** (`QuestionGroupStep`, `VolumeStep`, `AreaInputToggle`, `DiagramV2`) — la única excepción real es Fundación, y esa excepción está justificada por geometría (base + cuello no es una caja simple), no por pereza de generalizar. Ese es el resultado que buscábamos desde el rediseño de flujo: un lenguaje visual, no 57 calculadoras independientes.

Lo que sigue siendo específico de un módulo (y está bien que lo sea):
- Textos y unidades por módulo (`groupLabel`, `primaryLabel`, etc.) — es contenido, no lógica.
- El propio `FoundationStep.tsx` — una excepción de geometría, documentada como tal.
- Un puñado de mapas de contenido editorial sin generalizar todavía (`OPTION_ICONS`, `NOT_SURE_HELPERS` en `question-step.tsx`) — decorativos, de bajo riesgo.

---

## 3. Declaratividad — ¿qué falta para un Framework V2 100% por configuración?

Hoy, una calculadora **nueva sin diagrama** es 100% declarativa: un script de seed, cero código. Una calculadora **con la experiencia completa** (diagrama, hero, resumen) todavía necesita una PR de código porque:

1. **`MODULE_CONFIG` vive en código, no en la base de datos.** Es un `Record` tipado en TypeScript — deliberado (da autocompletado, chequeo de tipos, y comentarios de decisión de producto junto a cada entrada), pero significa que "agregar el diagrama" es un commit, no un formulario de admin.
2. **`DiagramV2` no tiene un "modo automático".** Alguien tiene que decidir a mano qué `kind` (box/cylinder/rect2d/circle2d/steppedBox) le corresponde a una geometría nueva — no hay una regla que lo infiera de las preguntas del módulo.
3. **El motor de diagramas no soporta geometría compuesta arbitraria** — solo box, cylinder y el caso especial steppedBox (2 cajas). Una tercera geometría distinta (ej. una L, un óvalo) requeriría, otra vez, código nuevo en `math/solids.ts` y un branch nuevo en `DiagramV2.tsx`.

Para llegar a un V2 realmente declarativo faltaría:
- Mover `MODULE_CONFIG` (o una versión de él) a la base de datos, con un editor en `/admin` — probablemente como una tabla `ModuleDiagramConfig` con los mismos campos que hoy tiene el tipo `DiagramConfig`.
- Una forma de describir geometría como **datos** en vez de código (ej. una lista de "caras" con offsets, en vez de un nuevo `kind` de TypeScript por forma) — esto es un rediseño real del motor, no una extensión incremental.
- Reglas explícitas (no mágicas) para inferir, a partir del tipo y cantidad de preguntas de un módulo, cuál sería el diagrama por defecto razonable.

Ninguno de estos 3 puntos es trivial — son, en conjunto, el trabajo de una "v2" real, no un ajuste de una tarde.

---

## 4. Inventario de componentes

| Componente | Genérico | Notas |
|---|---|---|
| `DiagramV2` | ✅ 100% | Único punto de entrada al motor de diagramas; 5 `kind` soportados hoy. |
| `AreaInputToggle` | ✅ 100% | Usado por 16 módulos sin ninguna línea de código propia por módulo. |
| `VolumeStep` | ✅ 100% | Cualquier módulo con `depthLabel` en su config lo usa automáticamente. |
| `FieldRow` | ✅ 100% | Reutilizado por `VolumeStep` y `FoundationStep`. |
| `SubmitActions` | ✅ 100% | Ídem. |
| `LiveSummaryPanel` | ✅ 100% | No tiene ninguna referencia a un módulo específico. |
| `ResultHero` | ✅ 100% (con override opcional) | Genérico por defecto; `heroResultKey` permite que un módulo puntual (Piscina) fuerce qué resultado protagoniza, sin tocar el componente. |
| `WizardHeader` | ✅ 100% | Sin lógica por módulo. |
| `ModuleVisualConfig` (`module-visual-config.ts`) | ✅ Es el mecanismo de generalización | No es un componente — es el registro que le permite a los componentes de arriba ser genéricos sin `if (module === ...)`. |
| `dimension-utils/*` | ✅ 100% | Parsing, unidades, formateo, validación, área — sin ninguna referencia a un módulo. |
| `QuestionStep` | ✅ ~95% genérico | Tiene 2 mapas de contenido editorial hardcodeados (`OPTION_ICONS`, `NOT_SURE_HELPERS`) — decorativos, no bloquean nada. |
| `FoundationStep` | ❌ Especializado | Única excepción real del framework — geometría de 2 secciones, justificada. |
| `useVolumePreview` | ✅ 100% | Hook puro, sin acoplamiento a ningún módulo. |

---

## 5. Deuda técnica real (lo que vale la pena resolver, no una lista larga)

1. **Acoplamiento a cuids sin verificación.** `stepGroup` como clave de `MODULE_CONFIG` no tiene ninguna garantía de que siga existiendo en la base. Es el único punto donde un cambio en el seed puede romper silenciosamente la experiencia visual de un módulo sin ningún error visible en build/tests.
2. **`FoundationStep` es la única excepción, pero no hay un patrón documentado para la SIGUIENTE excepción.** Si aparece una segunda geometría irreducible (probable, con 50 calculadoras más), hoy no hay una guía de "cómo se decide cuándo un módulo merece un componente propio vs. cuándo se fuerza al patrón existente" — la decisión de Fundación fue caso a caso, conversada, no una regla escrita.
3. **`module-visual-config.ts` crecerá linealmente sin límite de división.** No es urgente (700 líneas hoy es perfectamente legible), pero conviene decidir AHORA el criterio de cuándo dividirlo (¿por categoría? ¿por familia geométrica?) para no tener que decidirlo bajo presión cuando ya sea difícil de manejar.

Deliberadamente **no** incluyo en esta lista cosas que consideré y descarté por no valer la pena: memoización (medido, sin impacto), unificar `OPTION_ICONS`/`NOT_SURE_HELPERS` a la base de datos (bajo riesgo, contenido editorial, no bloquea nada), o dividir `module-visual-config.ts` ya mismo (prematuro).

---

## 6. Oportunidades futuras (identificadas, no implementadas)

- **Nuevas geometrías** en `DiagramV2`: formas en L, geometría con vanos en 3D (no solo 2D), techos con más de 2 aguas.
- **Informe técnico exportable** desde el resultado — ya existe el "prompt para IA" como precedente de "generar un documento a partir del cálculo", un informe PDF/Word sería una extensión natural del mismo dato (`CalculationResult`/`InfoResult`) que ya se calcula.
- **Integración con IA** más allá del prompt copiable — ej. un asistente que responda preguntas sobre el resultado usando el mismo contexto que hoy arma `buildCalculationPrompt`.
- **Framework V2 declarativo** (ver sección 3) — mover `MODULE_CONFIG` a base de datos + un editor visual en `/admin`.
- **Nuevos tipos de diagrama de apoyo** (no geometría de la figura, sino ayudas visuales nuevas como la retícula de Cerámica o el plano inclinado de Techumbres) — el patrón ya está probado 2 veces, un tercer caso sería barato.
- **Modo "avanzado" de diagramas** (mencionado por Jorge en la Fase 2, no implementado): arrastrar puertas/ventanas para dar posición real en vez de ilustrativa — requiere una decisión de producto sobre cuánto esfuerzo de UI vale la precisión ganada.

---

## 7. Riesgos — partes más sensibles para futuras modificaciones

1. **`module-visual-config.ts`** — es el único lugar donde un error de transcripción (un cuid mal copiado, una entrada duplicada) afecta a un módulo específico sin que ningún test lo detecte. Cualquier edición ahí debería verificarse en vivo, no solo con `tsc`.
2. **`DiagramV2.tsx`** — al ser el único punto de entrada, cualquier cambio ahí es un cambio de alto impacto (afecta a 39+ módulos simultáneamente). Es también la razón por la que vale la pena mantenerlo como un único archivo con una API estable, en vez de fragmentarlo más.
3. **El motor de fórmulas (`formula-engine`)** — no fue tocado en toda esta consolidación (por diseño: "solo cambia la experiencia"), pero sigue siendo el componente del que depende la CORRECCIÓN de cada cálculo. No es parte de esta auditoría visual, pero es, en términos de impacto de negocio, la pieza más sensible de toda la plataforma.

---

## 8. Evaluación final (honesta)

**Lo que quedó realmente bien:**
- La generalización funcionó de verdad: 55 de 56 módulos comparten exactamente los mismos componentes, con una sola excepción justificada por geometría real, no por falta de esfuerzo.
- El proceso de consolidación (registro único → división por responsabilidad → lógica compartida → accesibilidad → responsive → rendimiento medido) evitó exactamente el tipo de deuda que se acumula cuando se sigue agregando funcionalidad sin ordenar la base — la sección 5 de este documento es corta precisamente por eso.
- Las decisiones de "no hacerlo" quedaron tan bien documentadas como las de "sí hacerlo" (memoización descartada con números, dos breakpoints en vez de uno por una razón medida, Fundación como excepción justificada) — eso es lo que hace que la base sea confiable para construir encima, no solo que "funcione hoy".

**Lo que todavía podría mejorarse:**
- La declaratividad tiene un techo real (sección 3) — el framework de hoy generaliza MUY bien dentro de las 5 geometrías que ya existen, pero cada geometría nueva sigue siendo trabajo de ingeniería, no de configuración.
- El acoplamiento a cuids (sección 5, punto 1) es el único punto donde "romperlo por accidente" es fácil y silencioso.

**¿Está preparado el framework para las próximas 50 calculadoras?**
Sí, con una condición: **mientras esas 50 calculadoras quepan en las geometrías que ya existen** (rectángulo, caja, cilindro, área directa, la excepción de Fundación), el costo marginal de cada una nueva es bajo — una entrada de configuración, sin tocar componentes. Si alguna de esas 50 necesita una geometría genuinamente nueva, el patrón para decidirlo existe (la conversación caso a caso que ya se tuvo con Fundación), pero construirla seguirá siendo trabajo de código, no de configuración — y ESO es, honestamente, la diferencia entre el framework de hoy y un "Framework V2".

---

*Documento de cierre de la Fase de Consolidación Arquitectónica (Fase A + Fase B), 2026-08-02. Sin cambios de código — solo diagnóstico.*
