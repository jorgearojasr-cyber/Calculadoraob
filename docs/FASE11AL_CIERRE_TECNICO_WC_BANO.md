# FASE 11AL — Cierre técnico y editorial de WC / Inodoro de Baño

Fase de auditoría + fuentes + diseño + redacción técnica. Sin cambios de código, Prisma, BD, catálogo, seed, TechnicalArticles en BD, commit, push ni deploy.

## A. Objetivo

Cerrar definitivamente, para Baño V1, el componente WC/Inodoro: definición, key, Nivel 2, checks exactos, fuentes, severidades, seguridad, guías completas, referencias visuales y — de forma crítica — la estrategia de convivencia con el componente histórico `artefactos-sanitarios`, sin migrarlo ni tocarlo.

## B. Estado en 11AJ

[FASE11AJ_DISENO_CANONICO_BANO_V1.md](FASE11AJ_DISENO_CANONICO_BANO_V1.md): sección Q confirma que `artefactos-sanitarios` es hoy 1 componente agregado con 3 preguntas (descarga, fugas en la base, goteras en llaves) que mezcla WC+lavamanos+ducha/tina+grifería sin poder distinguir el artefacto específico. Sección R recomienda explícitamente **Opción B** (descomponer en WC/Lavamanos/Ducha/Tina independientes), con el componente agregado **"retirado del diseño V1"** — no eliminado del catálogo, solo no usado para generar Baños nuevos. Sección S deja WC como candidato Nivel 2, 3 checks (descarga, fugas en la base/conexión, firmeza), `defaultSeverity` propuestos LOW/HIGH/MEDIUM, key `wc`, sección ARTEFACTOS SANITARIOS, `order: 15`, Lote C de implementación (junto con Lavamanos). Sección AM ("Evolución de config") ya anticipa: la remapeación de las 3 preguntas actuales de `artefactos-sanitarios` hacia WC/Lavamanos es "una decisión de implementación del lote correspondiente, no de esta fase de diseño". Esta fase (11AL) cierra esa remapeación conceptualmente — sigue sin ejecutarla.

[FASE11AK_CIERRE_TECNICO_EXTRACTOR_AIRE_BANO.md](FASE11AK_CIERRE_TECNICO_EXTRACTOR_AIRE_BANO.md) confirma el patrón de cierre técnico a seguir (matriz de candidatos, guías completas de 7 encabezados, ningún check "por completitud") — reutilizado aquí sin cambios de método.

## C. Catálogo histórico (auditoría solo lectura, esta fase — reutilizando la consulta ya hecha en 11AJ §C/G, sin volver a auditar desde cero)

`InspectionElementTemplate` `artefactos-sanitarios`: `id: cmst4yovj002j1csemm1i5qx3`, `label: "Artefactos sanitarios"`, catálogo `order: 4`, `active: true`, `materialVariantOf: null`, `appliesTo: [CASA, DEPARTAMENTO, AMPLIACION]`. Vinculado a `bano` vía `InspectionElementTemplateSpace` (`order: 2` dentro del espacio, confirmado en 11AJ §C).

3 `InspectionChecklistItem`, todos `active: true`, `defaultSeverity: null` (ninguno tiene severidad asignada — precede a la convención de severidades introducida en Fase 11AC de Cocina):

| order | question | technicalArticleSlug |
|---|---|---|
| 0 | "¿Después de descargar el inodoro, el agua deja de correr con normalidad?" | `artefactos-sanitarios-como-revisar-descarga-inodoro` |
| 1 | "¿No hay fugas visibles en la base de los artefactos?" | `artefactos-sanitarios-como-revisar-fugas-base` |
| 2 | "¿No hay goteras ni filtraciones en las llaves?" | `artefactos-sanitarios-como-revisar-goteras-llaves` |

Confirmado disponible en catálogo: `wc`, `inodoro`, `wc-inodoro`, `inodoro-bano` — **las 4 keys están libres**.

## D. Checks históricos — a qué elemento real pertenecen

| Check histórico | Question | Qué elemento real revisa | Fuente declarada | ¿Reutilizable en WC? | Decisión |
|---|---|---|---|---|---|
| Descarga inodoro | "¿Después de descargar el inodoro, el agua deja de correr con normalidad?" | **A. WC** — explícitamente nombra "inodoro", sin ambigüedad | 🟡 criterio interno adaptado ITO, sección Artefactos sanitarios | Sí — es 100% WC, wording ya específico | **Reutilizar el concepto y la fuente; redactar como check nuevo de `wc`, no reasignar el `InspectionChecklistItem` histórico** |
| Fugas en la base | "¿No hay fugas visibles en la base de los artefactos?" | **D. Otro (agregado)** — el artículo asociado aclara explícitamente "inodoro, lavamanos, tina/receptáculo de ducha si corresponde": es 1 sola pregunta que en la práctica cubre 3 artefactos distintos sin poder distinguir cuál | 🟡 criterio interno adaptado ITO, sección Artefactos sanitarios | Parcial — el concepto (fuga visible en la base) aplica a WC, pero el check histórico tal cual mezcla 3 artefactos | **No reutilizar el check tal cual; extraer solo el concepto para un nuevo check de `wc` con wording específico** ("...alrededor de la base del inodoro"), dejando que Lavamanos y Ducha/Tina definan sus propios checks equivalentes en sus futuros lotes |
| Goteras en llaves | "¿No hay goteras ni filtraciones en las llaves?" | **C. Grifería genérica** — el artículo aclara "lavamanos, cocina, ducha/tina": **no menciona WC en absoluto**, porque un WC estándar no tiene "llave" en el sentido de grifería abierta/cerrada por el usuario | 🟡 criterio interno adaptado ITO, sección Grifería | **No** | **No aplica a WC — pertenece conceptualmente a Lavamanos/Ducha, a resolver en sus propios lotes futuros; no se usa ni adapta para WC** |

Confirmado: de las 3 preguntas históricas, **solo 1 (Descarga) es inequívocamente de WC**; la de Fugas es parcialmente reutilizable solo como concepto; la de Goteras en llaves **no pertenece a WC en absoluto**.

## E. Compatibilidad histórica

**Política canónica, confirmada sin excepción:**

Los Baños históricos reales (5 espacios de Baño de Jorge, confirmados en 11AJ §D: `las dalias`×2, `casa`×1, `xcxc`×2, todos con `config: null` y el elemento `artefactos-sanitarios` con sus 3 checks originales) **permanecen exactamente como están**:
- No se renombra `artefactos-sanitarios` a `wc`.
- No se convierte ni se migra su `InspectionElement` existente.
- No se reparten sus respuestas (hoy 0 respuestas reales, confirmado en 11AJ §D — pero la política aplica igual aunque hubiera datos) entre los nuevos componentes.
- No se borran sus checks ni se recrean como observaciones de otro componente.
- No se altera ningún `questionSnapshot` existente.

El nuevo `wc` aplica **únicamente** a Baños generados por la arquitectura Nivel 2 de Baño V1 (los mismos que recibirán `cielo` como ancla histórica, según 11AJ §AL) — nunca retroactivamente. Cualquier migración de datos reales de `artefactos-sanitarios` hacia los componentes nuevos requeriría una fase futura explícita y dedicada, fuera del alcance de esta fase de diseño.

## F. Definición del componente WC

`wc` representa: la **taza**, el **estanque visible** cuando exista, el **mecanismo de descarga desde el punto de vista funcional** (accionarlo y observar el resultado, no su mecanismo interno), la **unión visible al piso/muro**, las **conexiones de agua visibles**, y el **asiento/tapa** cuando corresponda (ver sección N para su tratamiento final).

**No incluye**: inspección interna de válvulas o flotador, desmontaje del estanque, revisión de cañerías ocultas bajo el piso o dentro del muro, ni ninguna forma de certificación de la instalación sanitaria en sí (la app registra síntomas observables, no diagnostica ni certifica).

## G. Base o Nivel 2

**Decisión: Nivel 2 (configurable), no siempre presente.**

Justificación: aunque la inmensa mayoría de los Baños reales tienen WC, la arquitectura debe representar honestamente los casos legítimos donde no lo hay todavía en el momento de la inspección — un baño en obra gruesa sin artefactos instalados, o (más relevante para el uso real de la app) un recinto catalogado como "Baño" que en la práctica es solo una ducha/lavamanos sin WC propio en algunas configuraciones de departamento. Coincide con la decisión ya tomada en 11AJ §S. No se fuerza universalidad sin evidencia — mismo criterio que ya se aplicó a Ventana en Cocina.

## H. Pregunta Nivel 2

**Decisión: "¿El baño tiene inodoro instalado?"** — se prefiere "inodoro" sobre "WC" en el wording de la pregunta, por ser el término de comprensión más universal en español (WC es un anglicismo/regionalismo, más común en Chile pero no garantizado en todo contexto hispanohablante; "inodoro" es entendido sin ambigüedad en cualquier país de habla hispana). El **label** del componente en el catálogo y en la UI del panel Nivel 2 se mantiene **"WC / Inodoro"** (ambos términos visibles, reconocible para el usuario chileno que ya está acostumbrado a "WC" en el componente histórico, sin perder universalidad en la pregunta). Consistente con el patrón ya usado en Cocina (`label` puede diferir del texto exacto de `question`, confirmado en `space-config.ts`).

## I. Descarga

Check final confirmado. Wording: **"¿El inodoro descarga correctamente al accionar el mecanismo, y el agua deja de correr con normalidad después?"** — fusiona intencionalmente el concepto histórico de "descarga" con el de "agua corriendo continuamente" (ver secciones Q/R) en una sola pregunta, evitando fragmentar un mismo evento funcional (accionar → descarga → vuelve a estado normal) en dos checks. Comprueba: activación del mecanismo, descarga observable, y retorno a estado normal — sin pedir abrir el estanque, regular el flotador ni desmontar el mecanismo. Se reutiliza el **concepto y la fuente** del check histórico `artefactos-sanitarios-como-revisar-descarga-inodoro` (confirmado en sección D como 100% WC), pero se redacta un artículo nuevo con slug propio (ver sección X) en vez de reasignar el `InspectionChecklistItem` histórico.

## J. Descarga doble

**Decisión: NO se crea un segundo check, ni metadata `tipoDescarga`.** Confirmado explícitamente: si el WC tiene descarga doble (2 botones), el check de Descarga (sección I) ya cubre "accionar el mecanismo" de forma agnóstica al tipo — el usuario prueba el mecanismo que su WC realmente tenga, sea uno o dos botones, y confirma si descarga y vuelve a la normalidad. No se exige que exista doble descarga, y no cambia ninguna revisión saber cuál tipo tiene instalado — no se agrega metadata sin necesidad, mismo criterio que descartó `metaOptions` para Extractor en 11AK.

## K. Fugas en la base

Check final confirmado, ahora **atribuido exclusivamente a WC** (a diferencia del histórico agregado). Wording: **"¿Se observan fugas o humedad alrededor de la base del inodoro después de una descarga normal?"** — especifica el momento de observación (después de descargar, sin desmontar nada) para distinguir agua propia del WC de agua exterior por limpieza reciente o salpicaduras de ducha cercana; el wording no exige que el usuario diagnostique el origen exacto, solo que observe en un momento razonablemente representativo. Se reutiliza el concepto histórico de `artefactos-sanitarios-como-revisar-fugas-base`, pero con wording específico de WC (no el genérico "de los artefactos").

## L. Fugas en conexiones

**Decisión: NO se crea un check separado — fusionado con Fugas en la base (sección K).**

Análisis de solapamiento explícito: una fuga en la conexión del estanque, en un flexible, o en una unión visible, y una fuga "en la base" del WC, producen exactamente el **mismo síntoma observable** para un usuario no técnico — agua o humedad visible en la zona baja del artefacto, sin que el usuario pueda distinguir con confianza si el origen es la unión al piso, una conexión de agua, o el propio mecanismo. Aplicando directamente el aprendizaje de Lavaplatos (Fase 11AE: "un usuario no puede diagnosticar de forma confiable cuál pieza específica falla, y ambas producen el mismo síntoma observable"), se fusiona en un único check de Fugas, cuyo wording ya cubre "alrededor de la base" de forma suficientemente amplia para incluir conexiones visibles cercanas, sin pedir al usuario clasificar la causa.

## M. Fijación / estabilidad

**Decisión: MANTENER, check final.** Wording: **"¿El inodoro se ve firme y estable, sin movimiento evidente al tocarlo suavemente?"** — confirma la alternativa de wording propuesta en el enunciado. Explícitamente evita: sentarse bruscamente, sacudir, aplicar fuerza, o intentar moverlo — el método es solo tocar suavemente y observar, igual de conservador que el criterio ya usado para Muebles/Lavaplatos/Cubierta en Cocina. Detecta: un problema real de fijación al piso (posible sello de cera/anillo comprometido, riesgo de filtración si empeora). Fuente: 🟡 criterio interno puro — no existe una analogía ITO específica de "firmeza de WC" en los artículos históricos (los históricos solo hablan de firmeza y funcionamiento básico de artefactos en general, sin desarrollar un criterio de fijación diferenciado); se documenta honestamente como criterio interno puro, sin forzar la analogía "adaptado de ITO".

## N. Asiento y tapa

**Decisión: DESCARTADO para V1, ni check propio ni folded.**

Análisis: un asiento suelto, una tapa quebrada o bisagras defectuosas son, en la enorme mayoría de los casos reales, componentes de reemplazo trivial y bajo costo, no indicativos de un defecto de instalación de la vivienda — a diferencia de la fijación del WC mismo (que si falla, compromete el sello con el piso) o de una fuga (que compromete la vivienda). No se identifica valor técnico suficiente para justificar estado/observación/severidad/foto propios. Mismo criterio de descarte ya aplicado a Rejilla/tapa de Extractor (11AK §N) y a Accesorios de Baño (11AJ §AA) — no se agrega por completitud. Queda fuera de V1, sin descartar reconsiderarlo como V2 si evidencia real (casos, feedback de usuarios) lo sugiriera — no se cierra la puerta, pero tampoco se incluye hoy sin esa evidencia.

## O. Daños visibles

**Decisión: MANTENER, check final.** Wording: **"¿El inodoro presenta trizaduras, quiebres, golpes u otros daños visibles en la loza?"** — un daño de loza es un defecto distinto de fuga, fijación o descarga (una trizadura puede no filtrar agua activamente y aun así ser un defecto real de recepción), y es observable sin ambigüedad. Fuente: 🟡 criterio interno puro, sin tolerancia estética inventada — el check pide solo observar presencia/ausencia visible de daño, sin definir umbrales de tamaño o cantidad (a diferencia del Manual de Tolerancias, que sí define umbrales en mm para otros materiales, aquí no se inventa uno equivalente porque no hay fuente que lo respalde).

## P. Sello perimetral

**Decisión: DESCARTADO, sin check propio (ni independiente ni folded como requisito).**

Análisis: a diferencia de Ventana, Lavaplatos, Lavamanos, Ducha o Tina — donde el sello perimetral es una práctica constructiva universal con una junta claramente visible y esperable en todos los casos — el encuentro WC-piso varía legítimamente según el sistema de instalación (algunos WC se fijan solo con pernos y anillo de cera sin sello visible perimetral adicional; otros sí llevan un cordón de sellador). Convertir la ausencia de sello visible en un defecto universal, sin fuente que confirme que es requisito en todos los sistemas de instalación, generaría falsos defectos en instalaciones correctas que simplemente no usan ese método. Sin respaldo para tratarlo como requisito normativo, se descarta explícitamente en vez de crear un check que podría inducir a error. La posible humedad resultante de un sello ausente y necesario ya quedaría capturada de todas formas por el check de Fugas en la base (sección K), que no depende de identificar la causa exacta.

## Q. Estanque

**Decisión: sin check propio — lo relevante del estanque queda folded dentro de Descarga (sección I).**

Confirmado: no se abre el estanque, no se revisa el mecanismo interno, no se evalúa el botón ni la tapa del estanque como piezas separadas. Lo único funcionalmente relevante y observable sin abrir nada — que el WC descargue y el agua vuelva a estado normal después — ya está cubierto por el check de Descarga. No se identifica valor adicional en un check separado de "estanque" en sí.

## R. Agua corriendo continuamente

**Decisión: incorporado al wording de Descarga (sección I), no como check independiente.**

El wording final de Descarga ("...y el agua deja de correr con normalidad después") ya incorpora explícitamente esta falla — un WC que descarga pero luego sigue corriendo agua de forma continua o intermitente es, conceptualmente, el mismo evento funcional fallando en su segunda mitad (no se detiene), no un defecto de una pieza distinta. Se evita crear una pregunta separada y se evita también una pregunta demasiado larga fusionando ambos conceptos en un solo wording claro, tal como el enunciado sugería evaluar.

## S. Obstrucción / evacuación

**Decisión: sin check propio, ni wording que sugiera diagnóstico de causa.**

Confirmado: el check de Descarga (sección I) ya registra el síntoma observable ("descarga correctamente... y el agua deja de correr con normalidad") sin exigir que el usuario determine si una descarga deficiente se debe al WC mismo, al sifón interno, a la red de desagüe, o a una obstrucción — exactamente como el enunciado exige. No se crea ningún check ni wording tipo "tubería obstruida" que implique un diagnóstico que la app no puede ni debe hacer.

## T. Olor

**Decisión: DESCARTADO, fuera de WC V1.**

Un olor a alcantarillado tiene demasiadas causas posibles no atribuibles específicamente al WC (sello de agua insuficiente en cualquier desagüe del baño, ventilación sanitaria general del edificio, otro artefacto) — la ambigüedad de origen es demasiado alta para un check binario simple sin inducir a error sobre cuál componente reportar. No se identifica ningún método de observación que aísle el olor al WC específicamente sin pedir al usuario un diagnóstico que no puede hacer de forma confiable. Queda fuera de V1, sin candidato V2 explícito (a diferencia de Espejo o Asiento/tapa) — la ambigüedad de causa es un problema estructural del concepto, no de granularidad, y no parece resoluble simplemente con más feedback de usuarios.

## U. Matriz de candidatos

| Candidato | Defecto | Método | Fuente | Solapa con | ¿Merece estado? | Decisión final |
|---|---|---|---|---|---|---|
| 1. Descarga/funcionamiento | Mecanismo no descarga o no vuelve a estado normal | Accionar y observar | 🟡 criterio interno adaptado ITO | Incluye conceptualmente #9 (agua continua) y #10 (evacuación) | Sí | **MANTENER** — check final |
| 2. Fuga en base | Agua/humedad visible en la base | Observar tras descarga | 🟡 criterio interno adaptado ITO | Incluye #3 (fugas en conexiones) | Sí | **MANTENER** — check final |
| 3. Fuga en conexiones | Agua en conexión/flexible/unión | Observar | 🟡 criterio interno | Con #2 (mismo síntoma) | No — mismo síntoma que #2 | **FUSIONAR** en #2 |
| 4. Fijación | Movimiento/inestabilidad al tocar suavemente | Tocar suave, observar | 🟡 criterio interno puro | Ninguno | Sí | **MANTENER** — check final |
| 5. Asiento/tapa | Suelto, quebrado, bisagra defectuosa | Observar/mover suavemente | 🟡 criterio interno | Ninguno | No — reemplazo trivial, sin relación con defecto de instalación | **DESCARTAR** |
| 6. Daños visibles | Trizadura/quiebre/golpe en loza | Observar | 🟡 criterio interno puro | Ninguno | Sí | **MANTENER** — check final |
| 7. Sello perimetral | Separación en encuentro WC-piso | Observar | Sin respaldo — práctica variable según sistema | Con #2 (humedad resultante) | No — no universal, sin fuente | **DESCARTAR** |
| 8. Estanque (mecanismo interno) | Falla de flotador/válvula | Requeriría abrir | Ninguna, y método inseguro/invasivo | Con #1 | No | **DESCARTAR** — folded conceptualmente en #1 |
| 9. Agua corriendo continuamente | Mecanismo no cierra tras descargar | Observar tras descargar | 🟡 criterio interno | Con #1 | No — mismo evento funcional que #1 | **FUSIONAR** en #1 (wording) |
| 10. Obstrucción/evacuación | Descarga deficiente por causa no identificable | Observar síntoma, sin diagnosticar | N/A — no se diagnostica causa | Con #1 | No — mismo síntoma que #1, sin nombrar causa | **FUSIONAR** en #1 (sin mención de causa) |
| 11. Olor | Olor a alcantarillado | Ninguno confiable/aislable a WC | Ninguna | Ambiguo con otros artefactos/ventilación | No — origen no aislable | **DESCARTAR** |

**Ningún candidato queda sin decisión.**

## V. Revisiones finales

**3 checks**, dentro de un rango razonable (3-5 sugerido en el enunciado):

1. **Descarga** — "¿El inodoro descarga correctamente al accionar el mecanismo, y el agua deja de correr con normalidad después?"
2. **Fugas** — "¿Se observan fugas o humedad alrededor de la base del inodoro después de una descarga normal?"
3. **Fijación** — "¿El inodoro se ve firme y estable, sin movimiento evidente al tocarlo suavemente?"
4. **Daños visibles** — "¿El inodoro presenta trizaduras, quiebres, golpes u otros daños visibles en la loza?"

(4 checks finales — se incluye Daños visibles como cuarto, confirmado en sección O como check independiente con valor propio, distinto de los otros 3.)

## W. Fuentes

- **Descarga**: 🟡 criterio interno adaptado ITO (reutiliza el concepto y la fuente ya declarada en el artículo histórico, sección D).
- **Fugas**: 🟡 criterio interno adaptado ITO (mismo origen).
- **Fijación**: 🟡 criterio interno puro (sin analogía ITO específica confirmada).
- **Daños visibles**: 🟡 criterio interno puro.

Ninguna clasificación 🟢 ni 🟢/🟡 — confirmado explícitamente: el catálogo educativo ITO usado históricamente es **criterio interno adaptado, no norma**, y no se convierte en 🟢 en esta fase. El Manual de Tolerancias no tiene contenido directo aplicable a WC (confirmado ya en 11V y 11AJ §F) — no se usa como fuente de ninguno de los 4 checks.

## X. Artículos legacy — estrategia de reutilización

Evaluadas las 3 opciones del enunciado para los 2 artículos históricos parcialmente reutilizables (Descarga, Fugas):

**Decisión: Opción B — adaptar a un slug nuevo, no reutilizar sin cambios ni dejar solo histórico.**

Razonamiento: el artículo histórico `artefactos-sanitarios-como-revisar-descarga-inodoro` ya es 100% específico de WC en su contenido (sección D), por lo que su texto puede reutilizarse casi verbatim, solo actualizando el slug al namespace de `wc` (`wc-descarga`) para mantener trazabilidad de catálogo (un `TechnicalArticle` vinculado a un `InspectionChecklistItem` de `artefactos-sanitarios` no debería quedar también vinculado a uno de `wc` — un artículo, un componente dueño). El histórico `artefactos-sanitarios-como-revisar-fugas-base` es solo parcialmente reutilizable (mezcla 3 artefactos en su texto) — se reescribe con wording específico de WC bajo slug nuevo (`wc-fugas`), reutilizando el enfoque y la fuente pero no el texto genérico. Ningún artículo histórico se modifica en esta fase (ninguna escritura en BD) — la adaptación queda redactada y lista en la sección AA para cuando el lote de implementación la ejecute.

## Y. Severidades

- **Descarga**: `MEDIUM` — un mecanismo que no descarga bien o sigue corriendo agua es un defecto funcional real con consecuencia de consumo sostenido, pero no una emergencia de seguridad ni de daño estructural inmediato.
- **Fugas**: `HIGH` — agua activa escapando de una instalación fija, mismo criterio consistente ya aplicado a Lavaplatos-Fugas y a todas las fugas de artefactos sanitarios en Cocina/Baño hasta ahora (riesgo real de daño al piso/estructura si no se corrige).
- **Fijación**: `MEDIUM` — riesgo real si empeora (compromete el sello con el piso), pero no una fuga activa hoy.
- **Daños visibles**: `LOW` — defecto cosmético/de calidad, sin riesgo funcional inmediato mientras no derive en fuga (que ya tiene su propio check).

Ninguna severidad se puso en `HIGH` solo por involucrar agua — se justificó cada una por su consecuencia real, tal como exige el enunciado (Descarga y Fijación quedan en MEDIUM pese a ser "sobre agua", porque su consecuencia inmediata no es una fuga activa). Recordatorio explícito: `defaultSeverity` todavía no preselecciona la UI (DT-01, deuda transversal reconfirmada en 11AI/11AJ/11AK) — no se corrige en esta fase.

## Z. Seguridad

**Permitido**: accionar la descarga normalmente, observar, tocar suavemente para evaluar estabilidad (aprobado explícitamente, único contacto físico permitido en todo el componente), revisar visualmente la base y las conexiones accesibles sin manipularlas.

**Prohibido, confirmado en las 4 guías**: abrir el estanque, desmontar la tapa técnica del mecanismo, apretar pernos, intervenir el flexible de agua, usar herramientas, introducir objetos, destapar con químicos, desmontar el WC. Ninguna guía final pide una acción fuera de esta lista.

## AA. Guías completas

### `wc-descarga`

```
# Qué revisar

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

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de funcionamiento básico de artefactos.
```

### `wc-fugas`

```
# Qué revisar

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

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos.
```

### `wc-fijacion`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable ni analogía específica del catálogo educativo ITO para este punto.
```

### `wc-danos-visibles`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida (no se establece un umbral de tamaño; se registra cualquier daño visible detectado).
```

Las 4 guías listas para implementación mecánica, no creadas en BD en esta fase.

## AB. Referencias visuales

- **Descarga**: NO NECESARIA — funcionamiento no es comparable por imagen fija.
- **Fugas**: ALTO VALOR — humedad/agua es difícil de describir solo con texto, y una foto de referencia ayuda a calibrar qué se considera "visible".
- **Fijación**: NO NECESARIA — un movimiento no se comunica por imagen fija.
- **Daños visibles**: ALTO VALOR — igual criterio que otros checks de daño visible ya priorizados en Cocina (esmalte, palmetas, superficie de Tina en 11AJ).

No se generan imágenes en esta fase.

## AC. Separación con Lavamanos

Confirmado explícitamente: ninguno de los 4 checks finales de WC revisa grifería, sifón ni sello de Lavamanos — a diferencia del histórico `artefactos-sanitarios`, que mezclaba "goteras en llaves" (grifería, aplicable a Lavamanos/Ducha, nunca a WC) dentro del mismo componente agregado. La separación queda clara por diseño: WC no tiene ningún check de grifería (un WC estándar no tiene llave que el usuario abra/cierre), y Lavamanos definirá sus propios checks de grifería/agua/fugas/fijación/sello en su propio lote de cierre técnico futuro, sin overlap con WC.

## AD. Estrategia legacy

Confirmada de forma canónica (ampliando la sección E):

- **Baño histórico** (con `artefactos-sanitarios` ya generado, `config: null`): permanece intacto, sin cambios, para siempre salvo una fase de migración futura explícita.
- **Baño V1 nuevo** (generado bajo la arquitectura Nivel 2 de Baño, con ancla `cielo`): usa `wc`, `lavamanos`, `ducha`/`tina`/etc., según las respuestas Nivel 2 — nunca genera `artefactos-sanitarios`.
- **No coexistencia**: un mismo Baño nuevo nunca tendrá simultáneamente `artefactos-sanitarios` y `wc` — el primero solo existe en baños generados por código anterior a Baño V1, el segundo solo en baños generados por código posterior. La lógica de generación (a implementar en el lote correspondiente) debe garantizar que un Baño nuevo jamás reciba `artefactos-sanitarios`, evitando cualquier duplicidad de hallazgos entre ambos componentes.

## AE. No desactivar legacy todavía

Confirmado: esta fase **no** decide ni ejecuta ningún cambio sobre `artefactos-sanitarios.active`. Se documenta únicamente la estrategia (secciones E/AD) — la futura fase de implementación (Lote C, según 11AJ §AP) deberá auditar explícitamente si desactivar la generación automática de `artefactos-sanitarios` para Baños nuevos afecta algún snapshot o flujo de generación histórica antes de tocar el catálogo. Sin cambios de catálogo en esta fase.

## AF. Key final

**Confirmada: `wc`.** Se descarta `inodoro` como key (aunque sea el término usado en la pregunta Nivel 2, sección H) por preferencia de estabilidad arquitectónica: `wc` es más corto, no genera ambigüedad con otros posibles usos de la palabra "inodoro" en copy futuro, y es coherente con el nombre ya usado en el componente histórico agregado (`artefactos-sanitarios` internamente ya trataba este concepto como "inodoro" en su primera pregunta, pero el nombre de componente nuevo puede ser más compacto). El **label** visible sigue siendo "WC / Inodoro" (sección H), separando deliberadamente key técnica de copy orientado al usuario — mismo patrón ya usado en todo el catálogo (`enchufes-interruptores` vs. label "Enchufes e interruptores").

## AG. Árbol final

```
Baño
└── WC / Inodoro [L2] — wc
    ├── Descarga — MEDIUM — 🟡 criterio interno adaptado ITO
    ├── Fugas — HIGH — 🟡 criterio interno adaptado ITO
    ├── Fijación — MEDIUM — 🟡 criterio interno puro
    └── Daños visibles — LOW — 🟡 criterio interno puro
```

## AH. Nivel 2

Actualización conceptual de la rama dentro del árbol ya diseñado en 11AJ §AT (sin rediseñar el resto de Baño):

```
ARTEFACTOS SANITARIOS
├── WC / Inodoro [L2] — 4 checks (nuevo, cerrado en esta fase)
├── Lavamanos [L2] — pendiente de cierre técnico
├── Ducha [L2] — pendiente de cierre técnico
├── Tina [L2] — pendiente de cierre técnico
├── Mampara [L2] — pendiente de cierre técnico
└── Mueble de baño / Vanitorio [L2] — pendiente de cierre técnico
```

Sección (ARTEFACTOS SANITARIOS) y `order` (15) confirmados sin cambios respecto a 11AJ. WC es Nivel 2, confirmado en sección G — pregunta Sí/No: "¿El baño tiene inodoro instalado?".

## AI. Conteo

Impacto sobre los conteos teóricos de Baño V1 (11AJ §AO, ya ajustado por Extractor en 11AK §AG):

- **WC en No**: +0 sobre el mínimo (sigue en 8).
- **WC en Sí**: **+4 checks** — 1 más de lo proyectado en 11AJ (que estimó 3: descarga, fugas, firmeza). El check adicional (Daños visibles) se justificó explícitamente en la sección O/U como un defecto distinto, no una sobre-granularización — ajuste honesto respecto a la proyección preliminar de 11AJ, documentado aquí en vez de forzar el conteo original.
- **Máximo teórico actualizado**: 45 (proyección 11AJ) − 3 (WC proyectado en 11AJ) + 4 (WC confirmado en esta fase) = **46**. Sigue sin cerrarse el conteo canónico final — quedan 5 cierres técnicos pendientes: Lavamanos, Ducha, Tina, Mampara, Mueble de baño.

## AJ. Riesgos

- **Compatibilidad con `artefactos-sanitarios` legacy**: mitigado por la política de no-coexistencia (sección AD), pero depende de que el lote de implementación la respete exactamente — riesgo de implementación, no de diseño.
- **Doble conteo de fugas**: descartado por diseño — Fugas en base y Fugas en conexiones se fusionaron explícitamente (sección L), y no hay overlap con Lavamanos (sección AC).
- **Fuente no normativa**: aceptado explícitamente, igual que Extractor — 4 checks 🟡, sin inflar ninguno a 🟢.
- **WC con estanque visible vs. oculto (empotrado en muro)**: el wording de Descarga y Fugas no asume un estanque visible — "accionar el mecanismo" y "observar la base" siguen siendo válidos incluso si el estanque está empotrado (el mecanismo de accionamiento sigue siendo visible/accesible, típicamente una placa en el muro). No se identifica necesidad de un check o wording separado para esta variante.
- **Variantes de descarga (simple/doble)**: resuelto explícitamente sin metadata (sección J).
- **Histórico vs. Baño V1**: resuelto con la política de secciones E/AD — riesgo remanente solo si una implementación futura no la respeta.

## AK. Estado final

WC / Inodoro de Baño queda completamente cerrado: componente definido (taza, estanque visible, mecanismo de descarga desde el punto de vista funcional, unión visible, conexiones visibles, asiento/tapa deliberadamente excluido), key confirmada (`wc`, libre en catálogo), Nivel 2 confirmado (no siempre presente, pregunta "¿El baño tiene inodoro instalado?", label "WC / Inodoro"), 4 checks exactos con wording final (Descarga, Fugas, Fijación, Daños visibles), severidades definidas y justificadas por consecuencia real (MEDIUM/HIGH/MEDIUM/LOW), fuentes clasificadas honestamente (4× 🟡, catálogo ITO confirmado como criterio interno adaptado, no norma), seguridad auditada (sin instrucciones inseguras), 4 guías completas de 7 encabezados listas para implementación mecánica, referencias visuales clasificadas, separación clara con Lavamanos confirmada, estrategia legacy definida de forma canónica (sin migración automática, sin coexistencia, sin desactivar catálogo todavía), conteo actualizado honestamente (+4, no +3 como proyectaba 11AJ).

Ninguna decisión esencial queda abierta.

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AL_CIERRE_TECNICO_WC_BANO.md`

Archivos modificados: ninguno.

Código = 0
Prisma = 0
BD = NO
Catálogo = NO
Seed = NO
Commit = NO
Push = NO
Deploy = NO

FASE 11AL — WC / INODORO DE BAÑO CERRADO TÉCNICAMENTE

DETENERSE. No implementar. No iniciar Lavamanos todavía.
