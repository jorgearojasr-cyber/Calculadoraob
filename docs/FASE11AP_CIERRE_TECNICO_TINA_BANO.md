# FASE 11AP — Cierre técnico y editorial de Tina de Baño

Fase de auditoría + fuentes + diseño + redacción técnica. Sin cambios de código, Prisma, BD, catálogo, seed, TechnicalArticles en BD, commit, push ni deploy.

## A. Objetivo

Cerrar definitivamente, para Baño V1, el componente Tina: definición, key, Nivel 2, checks exactos, fuentes, severidades, seguridad, guías completas, referencias visuales, y frontera explícita e inequívoca con Ducha y Mampara (ambas ya cerradas, no reabiertas) — resolviendo específicamente el punto que 11AJ había dejado pendiente: quién revisa el llenado de una tina sin ducha.

## B. Estado en 11AJ / 11AN / 11AO

[FASE11AJ_DISENO_CANONICO_BANO_V1.md](FASE11AJ_DISENO_CANONICO_BANO_V1.md) §V dejó Tina como componente nuevo, key `tina`, Nivel 2, sección ARTEFACTOS SANITARIOS, `order: 18`, Lote E de implementación, 4 checks candidatos preliminares (firmeza, fugas en base/desagüe, daños visibles en superficie, sello perimetral) **deliberadamente sin grifería ni agua fría/caliente** — para no duplicar la de Ducha cuando ambas coexisten (tina con ducha integrada). `defaultSeverity` MEDIUM/HIGH/LOW/MEDIUM propuestos.

[FASE11AN_CIERRE_TECNICO_DUCHA_BANO.md](FASE11AN_CIERRE_TECNICO_DUCHA_BANO.md) §H/AO cerró la frontera desde el lado de Ducha, de forma explícita y no reabrible: cuando existe ducha sobre tina, Ducha revisa grifería + agua fría/caliente + rociador (folded) + fugas propias de esos elementos + evacuación; Tina revisará únicamente el cuerpo del artefacto — firmeza, daños de superficie, fugas en su propia base/desagüe, sello con el muro — **nunca grifería ni agua fría/caliente**, ni siquiera cuando Ducha está inactiva. Esta última frase es exactamente el punto que esta fase debe resolver sin contradecirla (sección G).

[FASE11AO_CIERRE_TECNICO_MAMPARA_BANO.md](FASE11AO_CIERRE_TECNICO_MAMPARA_BANO.md) §H/AK cerró la frontera desde el lado de Mampara: una mampara sobre tina sigue siendo evaluada íntegramente por el componente Mampara — vidrio, herrajes, apertura, sellos propios del cerramiento — sin que Tina absorba ni duplique ninguno de esos 5 checks.

## C. Catálogo (auditoría solo lectura, esta fase)

Confirmado disponible: `tina`, `banera`, `tina-bano`, `banera-bano` — **las 4 keys están libres**. Ningún `InspectionElementTemplate`, `InspectionChecklistItem` ni `TechnicalArticle` existente trata tina/bañera específicamente — el único precedente disponible es, otra vez, el artículo legacy de `artefactos-sanitarios-como-revisar-fugas-base`, que ya confirmó (11AJ §C, reconfirmado en 11AL/11AM/11AN) que su alcance textual incluye explícitamente "tina/receptáculo de ducha si corresponde" — mismo precedente de fuente/concepto ya reutilizado por WC, Lavamanos y Ducha, disponible también para Tina (sección AD).

## D. Definición del componente

`tina` representa: el **cuerpo visible del artefacto** (incluido su borde), su **fijación/apoyo observable**, su **desagüe visible/funcional**, su **tapón o válvula de retención cuando exista**, sus **sellos propios del encuentro tina-muro (y tina-piso cuando exista)**, y las **fugas visibles directamente asociadas a sus conexiones o desagüe accesibles**. **No incluye**: grifería de Ducha ni rociador (frontera cerrada en 11AN, sección G de esta fase), Mampara (frontera cerrada en 11AO), cerámica de muro ni de piso (componentes transversales, sección V), impermeabilización oculta (sección X) ni cañerías ocultas.

## E. Nivel 2

**Decisión: Nivel 2 (configurable), confirmando 11AJ §V sin reabrir la decisión.** Mismo razonamiento ya aplicado en todo el catálogo sanitario de esta serie: existen casos reales legítimos sin tina.

## F. Pregunta Nivel 2

**"¿El baño tiene tina instalada?"** — se descarta la alternativa "¿El baño tiene tina o bañera instalada?" por ser más larga sin agregar comprensión real: "tina" es suficientemente universal en español (a diferencia de "WC", que sí se prefirió reformular como "inodoro" en 11AL por ser más regionalismo) — "tina" y "bañera" son sinónimos igualmente entendidos, y agregar ambos en la pregunta no resuelve ninguna ambigüedad real. El **label** del componente sí incluye ambos términos por reconocibilidad — ver sección AK.

## G. Independencia de Ducha — resolución del llenado

**Confirmado sin dependencia automática en ninguna dirección**: Tina Sí no implica Ducha Sí, Ducha Sí no implica Tina No — el caso Tina Sí + Ducha Sí (tina con ducha integrada) es válido y ya está resuelto por 11AN/11AJ (Ducha cubre grifería/agua/rociador, Tina cubre el cuerpo del artefacto).

**El punto que quedaba abierto**: una Tina **sin** Ducha (Ducha=No) físicamente sigue necesitando algún mecanismo de llenado (grifería propia, a menudo montada en el borde de la tina en vez de en la pared como una ducha) — y 11AN §AO cerró explícitamente que Tina "nunca" revisa grifería ni agua fría/caliente, ni siquiera en ese caso. Esta fase resuelve la aparente contradicción **sin reabrir esa frase de 11AN** (que sigue siendo válida para el caso Ducha=Sí): se incorpora un check propio de Tina, **Llenado** (sección U), acotado explícitamente por wording a activarse solo cuando la tina tiene un sistema de llenado propio y distinto al de la ducha — con `No corresponde` explícito cuando el llenado se hace con la misma grifería que Ducha ya revisó. Esto no es "grifería de Tina" en el sentido que 11AN excluyó (un segundo check redundante sobre la misma llave física) — es la única forma de que una Tina físicamente sin Ducha activa no quede con un vacío de cobertura real. Se documenta como la resolución explícita del punto 19-21 del enunciado, consistente con la Opción A que el propio enunciado sugería ("Tina incorpora funcionamiento de llenado cuando no hay Ducha").

## H. Independencia de Mampara

**Confirmado sin dependencia automática**: Tina puede existir sin mampara (cortina, o sin cerramiento), con mampara, con cortina — la configuración representa existencia física real de cada componente. No se incluye en Tina ningún check de vidrio, rieles, bisagras, apertura o herrajes de Mampara — frontera ya cerrada en 11AO, no reabierta.

## I. Cuerpo — daños visibles

Check final confirmado. Wording: **"¿La tina presenta trizaduras, quiebres, golpes, esmalte saltado u otros daños visibles?"** — aplica sin distinción de material (acero esmaltado, acrílico, fibra de vidrio u otro) sin pedir al usuario identificar cuál es. No se inventa una tolerancia de rayas menores — el check se limita a observación de daño visible, sin umbral de tamaño o cantidad.

## J. Rayas / desgaste

**Decisión: FOLD dentro de Daños visibles (sección I), confirmado.** Rayas profundas, desprendimientos o esmalte saltado son daños de la misma naturaleza observable que trizaduras o golpes — mismo tipo de foto/comentario, sin fragmentar por tipo de daño (mismo criterio ya aplicado a Mampara-Vidrio, 11AO §O).

## K. Fijación / estabilidad

Check final confirmado, con método adaptado a la realidad física de una tina (a diferencia de otros artefactos, muchas tinas quedan completamente embutidas y no pueden "moverse" para comprobar fijación por contacto). Wording: **"¿La tina se ve firme y estable, sin movimiento evidente, crujidos anormales ni separaciones visibles en sus apoyos o encuentros?"** — el método es observacional (mirar y, si es accesible, un contacto suave en el borde), **nunca** pararse dentro, saltar, aplicar peso deliberadamente o sacudir. Cubre tanto tinas embutidas (donde el indicio es un crujido anormal o una separación visible en el encuentro) como tinas con patas/apoyos visibles (donde además se puede observar movimiento). `defaultSeverity`: MEDIUM.

## L. Desagüe

Ver análisis integrado en sección P — Desagüe y Acumulación se resuelven juntos como un único check (Evacuación), mismo patrón ya aplicado en Ducha (11AN §P).

## M. Tapón / válvula

**Decisión: MANTENER, check propio — no descartado, a diferencia de la decisión que 11AM tomó para el tapón de Lavamanos.**

Justificación de la diferencia respecto a Lavamanos (11AM §N, donde el tapón se descartó por completo): en un lavamanos, retener agua es una función secundaria/opcional de bajo uso; en una **tina**, la capacidad de retener agua es una función central del artefacto — una tina que no puede llenarse y mantenerse llena no cumple su propósito básico. Por eso aquí sí se justifica un check propio, a diferencia de Lavamanos. Wording: **"¿El tapón o válvula de la tina retiene el agua sin pérdida evidente durante unos momentos al cerrarlo?"** — método: cerrar el tapón/válvula y dejar correr una **cantidad pequeña** de agua brevemente (nunca llenar la tina por completo), observando si se mantiene sin perderse de forma evidente. `defaultSeverity`: LOW (función de conveniencia, sin riesgo de seguridad ni de daño a la vivienda si falla).

## N. Rebalse

**Decisión: DESCARTADO como check funcional independiente — solo cubierto implícitamente dentro de Daños visibles (sección I) si la pieza del rebalse es visible y está dañada, sin check propio.**

Confirmado explícitamente: no se exige llenar la tina hasta el nivel de rebalse para probarlo — sería una prueba innecesaria, que consume tiempo y agua sin un beneficio proporcional (el rebalse es una función de seguridad de respaldo, no de uso diario, mismo argumento ya aplicado a Rebalse de Lavamanos en 11AM §R). Si la pieza visible del rebalse (la tapa/rejilla) presenta un daño visible, ya queda capturada por el check general de Daños visibles, sin necesitar un check dedicado.

## O. Fugas

Check final confirmado. Wording: **"Al usar la tina, ¿se observa alguna fuga o humedad visible en sus conexiones o desagüe visibles y accesibles?"** — explícitamente acotado a lo **visible y accesible**: no se pide desmontar registros, abrir cañerías ocultas ni acceder a conexiones bajo la tina que no sean observables sin intervención. Fuente: 🟡 criterio interno adaptado ITO (mismo origen confirmado en sección C — el artículo legacy ya cubre "tina/receptáculo de ducha"). `defaultSeverity`: HIGH (mismo criterio consistente ya aplicado a toda fuga activa de agua en el catálogo).

## P. Evacuación — análisis de fusión con Acumulación y Pendiente

**Análisis explícito, mismo patrón ya validado en Ducha (11AN §P):** Desagüe ("¿el agua evacúa normalmente?"), Acumulación ("¿queda agua acumulada?") y Pendiente interna (sección S) describen, para el usuario, el mismo resultado observable final — agua que no se va de la tina en un tiempo razonable tras destapar el desagüe. Se fusionan en un único check, **Evacuación**. Wording: **"Después de dejar correr una cantidad moderada de agua y destapar el desagüe, ¿el agua evacúa con normalidad, sin quedar acumulada?"** — método explícitamente acotado: dejar correr una cantidad **moderada** de agua (no llenar completamente la tina para esta prueba), sin diagnosticar causa (sifón, obstrucción, red). Distingue explícitamente de "agua dentro de la tina durante el llenado" (que es normal y no es lo que este check evalúa) — ver sección R. Fuente: 🟡 criterio interno puro. `defaultSeverity`: MEDIUM (mismo criterio que Ducha-Evacuación).

## Q. Sellos

Check final confirmado, combinando el encuentro tina-muro y tina-piso cuando ambos o alguno exista, en vez de crear 2 checks separados. Wording: **"El sello visible entre la tina y el muro (y el piso, si existe ese encuentro) se ve continuo, sin separaciones ni grietas?"** — no exige un material específico de sellado (silicona u otro), solo continuidad observable. Se descarta un check separado de "sello tina-piso" porque muchas tinas van embutidas sin ese encuentro visible — el wording combinado ya maneja naturalmente el caso donde solo existe el encuentro con el muro, sin necesitar N/A adicional (a diferencia de Sello de Lavamanos, que sí necesitó N/A explícito porque algunas variantes de montaje no tienen NINGÚN encuentro sellable — aquí el encuentro tina-muro casi siempre existe). Fuente: 🟡 criterio interno (analogía). `defaultSeverity`: MEDIUM.

## R. Acumulación de agua — distinción de agua normal

**Confirmado explícitamente**: agua dentro de la tina **durante su uso normal** (llenado para bañarse) es esperada y normal — el check de Evacuación (sección P) se refiere específicamente al comportamiento **después** de destapar el desagüe, no al agua contenida durante el uso. No se crea un check separado de "queda agua en el fondo" tras el vaciado — pequeñas gotas residuales por la geometría del artefacto (curvatura del fondo) son normales y no se inventa un criterio para distinguirlas de una acumulación real, evitando la ambigüedad que el enunciado advertía explícitamente evitar.

## S. Pendiente interna

**Confirmado: sin check ni tolerancia inventada.** Igual que en Ducha (11AN §Q), no existe fuente que defina una pendiente mínima para el fondo de una tina — el usuario no debe medirla. Si el desagüe evacúa con normalidad (check de Evacuación), eso es funcionalmente suficiente — no se duplica con un concepto técnico adicional sin fuente.

## T. Grifería — resolución arquitectónica final

Confirmado y cerrado (desarrollo completo en sección G): **cuando existe Ducha activa, Tina nunca revisa grifería ni agua fría/caliente** (frontera de 11AN, intacta). **Cuando Tina existe sin Ducha activa**, el nuevo check Llenado (sección U) cubre esa función — un check propio de Tina, no una reapertura de los checks de Ducha, con N/A explícito cuando comparte grifería con una Ducha activa. Resuelto sin dejar un vacío de cobertura ni duplicar preguntas sobre la misma llave física.

## U. Llenado

Check final confirmado, nuevo (no proyectado en 11AJ, resuelve el punto pendiente de la sección G). Wording: **"Si la tina tiene un sistema de llenado propio, distinto al de la ducha (por ejemplo, sin ducha instalada en el baño, o con grifería propia en el borde de la tina), ¿el agua sale con normalidad al abrir esa llave, incluyendo fría y caliente si la instalación dispone de ambas? Si el llenado de la tina se hace con la misma grifería ya revisada en Ducha, marca esta revisión como 'No corresponde'."** — consolida funcionamiento + fría/caliente en un solo check (evitando fragmentar en 2, ya que ambos conceptos describen la misma llave) y resuelve por wording, no por lógica del motor, el caso de compartir grifería con Ducha (N/A explícito). Fuente: 🟡 criterio interno, sin analogía ITO directa (mismo nivel que Ducha-Agua fría/caliente y Lavamanos-Agua fría/caliente). `defaultSeverity`: MEDIUM.

## V. Daños de revestimiento — frontera

Confirmado explícitamente: Tina **no incluye** ningún check de cerámica dañada alrededor del artefacto — eso ya pertenece a `revestimiento-ceramico-muro`/`revestimiento-ceramico-piso` (componentes transversales, reutilizados sin cambios en Baño según 11AJ §AG). Tina revisa exclusivamente su propio cuerpo y sus encuentros directos (sello, sección Q), nunca la cerámica circundante.

## W. Humedad

**Confirmado: sin check propio de "humedad general" en Tina**, mismo razonamiento ya cerrado a nivel de Baño (11AJ §AB) y ya aplicado por Ducha (11AN §W). Humedad visible cerca de la tina no se atribuye automáticamente a un defecto de Tina — puede provenir de sellos (ya cubiertos por su propio check, sección Q), de Ducha (si coexisten), de la red, de condensación, o de otra fuente. Si existe una fuga observable directamente asociada a las conexiones/desagüe de Tina, eso ya se registra en el check de Fugas (sección O) — no se diagnostica causalidad más allá de eso.

## X. Impermeabilización

**Confirmado: sin check, mismo disclaimer que Ducha (11AN §X).** La app no certifica membranas impermeabilizantes ocultas bajo o alrededor de la tina — no se pide prueba de inundación prolongada, desmontaje ni apertura de registros. Solo se detectan síntomas visibles en el momento de la inspección (fugas activas, agua no evacuando, daños visibles). Este disclaimer se incorpora explícitamente al texto de las guías de Fugas y Evacuación (sección AG).

## Y. Matriz de candidatos

| Candidato | Defecto | ¿Aplica a todas? | Método | Fuente | Solapa con | ¿Merece estado? | Decisión |
|---|---|---|---|---|---|---|---|
| 1. Daños del cuerpo | Trizadura/quiebre/golpe en la superficie | Sí | Observar | 🟡 criterio interno puro | Con #2 | Sí | **MANTENER** — check "Daños visibles" |
| 2. Rayas/desgaste | Rayas profundas, esmalte saltado | Sí | Observar | 🟡 criterio interno puro | Con #1 | No — mismo tipo de defecto | **FOLD** en #1 |
| 3. Fijación/estabilidad | Movimiento/crujido/separación en apoyos | Sí | Observación + contacto suave | 🟡 criterio interno puro | Ninguno | Sí | **MANTENER** |
| 4. Desagüe | Agua no evacúa | Sí | Correr agua moderada, observar | 🟡 criterio interno puro | Con #10/#11 | Sí, fusionado | **FUSIONAR** con #10/#11 en "Evacuación" |
| 5. Tapón/válvula | No retiene agua | Sí (función central de tina) | Cerrar y correr agua breve/pequeña | 🟡 criterio interno puro | Ninguno | Sí | **MANTENER** |
| 6. Rebalse | No funciona / dañado | No — no todas visibles del mismo modo | Requiere llenar hasta nivel, invasivo | Sin fuente ni método simple | Con #1 (si pieza visible dañada) | No como check propio | **DESCARTAR**, implícito en #1 si visible |
| 7. Fugas | Agua en conexión/desagüe visible | Sí | Usar y observar, solo lo accesible | 🟡 criterio interno adaptado ITO | Con #4 (relacionado, no idéntico) | Sí | **MANTENER** |
| 8. Sello tina-muro | Separación en encuentro con muro | Sí | Observar | 🟡 criterio interno (analogía) | Con #9 | Sí, combinado | **MANTENER**, combinado con #9 |
| 9. Sello tina-piso | Separación en encuentro con piso | No — muchas tinas embutidas sin este encuentro | Observar | 🟡 criterio interno (analogía) | Con #8 | Sí, combinado (wording maneja ausencia sin N/A) | **MANTENER**, combinado con #8 |
| 10. Acumulación | Agua queda en el piso/fondo tras vaciar | Sí | Observar tras evacuar | 🟡 criterio interno puro | Con #4/#11 | Sí, fusionado | **FUSIONAR** con #4/#11 |
| 11. Pendiente interna | Insuficiente pendiente del fondo | Sí | — | Sin fuente | Con #4/#10 | Sí, fusionado (sin nombrar causa) | **FUSIONAR** con #4/#10, sin check nombrado "pendiente" |
| 12. Grifería/llenado | No sale agua al llenar (solo si Tina sin Ducha) | No — solo si no comparte grifería con Ducha | Abrir y observar | 🟡 criterio interno | Con Ducha-Grifería si compartida (evitado por N/A) | Sí, con N/A | **MANTENER**, check "Llenado", con N/A |
| 13. Fría/caliente (de Tina) | Una red no llega al llenado propio | No — mismo condicionante que #12 | Abrir cada lado | 🟡 criterio interno | Con #12 | No — mismo check, mismo momento de prueba | **FOLD** en #12 (wording consolidado) |
| 14. Humedad | Manchas de humedad cercanas | N/A | — | — | Con #7, con Cielo | No — sin dueño claro, ya cubierto | **DESCARTAR** |
| 15. Impermeabilización | Filtración oculta | N/A | Requiere desmontar/picar | Ninguna, inseguro/invasivo | — | No | **DESCARTAR**, con disclaimer explícito |

**Ningún candidato queda sin decisión.**

## Z. Matriz de solapamiento (análisis dirigido)

| Comparación | ¿Producirían misma foto/comentario/reparación? | Decisión |
|---|---|---|
| Daños vs. Rayas | Sí — mismo tipo de defecto visible en la superficie | **Fusionados** |
| Desagüe vs. Tapón | No — Desagüe es sobre que el agua SALGA bien, Tapón es sobre que el agua NO salga cuando debe retenerse — funciones opuestas, sin overlap real | **Mantenidos independientes** |
| Desagüe vs. Fugas | Parcialmente relacionados (ambos involucran el desagüe), pero Desagüe es sobre el resultado de la evacuación (¿se va el agua?) y Fugas es sobre agua apareciendo donde no debería (¿escapa por una conexión?) — síntomas distintos, mismo criterio que Ducha ya validó | **Mantenidos independientes** |
| Sello vs. Fugas | Relacionados causalmente (un sello roto puede causar humedad) pero uno es estático/visual y el otro dinámico/funcional — mismo tipo de distinción ya validada en Ducha y Mampara | **Mantenidos independientes** |
| Tina vs. Ducha | Sin overlap — frontera ya cerrada en 11AN, confirmada en tabla de la sección AN | **Sin conflicto** |
| Tina vs. Mampara | Sin overlap — frontera ya cerrada en 11AO, confirmada en sección AO | **Sin conflicto** |
| Grifería Tina (Llenado) vs. Grifería Ducha | Misma llave física cuando están integradas — resuelto con N/A explícito en Llenado (sección U/G), nunca ambos activos simultáneamente sobre la misma llave | **Sin duplicación, por diseño de N/A** |

## AA. Revisiones finales

**7 checks** — por encima del rango orientativo de 3-6 sugerido en el enunciado, con justificación explícita: a diferencia de Ducha (6 checks) y Mampara (5 checks), Tina tiene una función genuinamente adicional que ningún otro componente sanitario de Baño V1 tiene — la **retención** de agua (Tapón/válvula, sección M) — y además puede necesitar su propio **Llenado** (sección U) cuando no comparte grifería con Ducha, un caso real que 11AJ había dejado sin resolver. Ninguno de los 7 es redundante entre sí (confirmado en la matriz de solapamiento, sección Z) — cada uno detecta un defecto genuinamente distinto, con estado/comentario/severidad/evidencia propios:

1. **Daños visibles** — "¿La tina presenta trizaduras, quiebres, golpes, esmalte saltado u otros daños visibles?"
2. **Fijación** — "¿La tina se ve firme y estable, sin movimiento evidente, crujidos anormales ni separaciones visibles en sus apoyos o encuentros?"
3. **Tapón/válvula** — "¿El tapón o válvula de la tina retiene el agua sin pérdida evidente durante unos momentos al cerrarlo?"
4. **Fugas** — "Al usar la tina, ¿se observa alguna fuga o humedad visible en sus conexiones o desagüe visibles y accesibles?"
5. **Evacuación** — "Después de dejar correr una cantidad moderada de agua y destapar el desagüe, ¿el agua evacúa con normalidad, sin quedar acumulada?"
6. **Sellos** — "El sello visible entre la tina y el muro (y el piso, si existe ese encuentro), ¿se ve continuo, sin separaciones ni grietas?"
7. **Llenado** — "Si la tina tiene un sistema de llenado propio, distinto al de la ducha, ¿el agua sale con normalidad al abrir esa llave, incluyendo fría y caliente si la instalación dispone de ambas? Si comparte grifería con Ducha, marca 'No corresponde'."

## AB. Fuentes

- Daños visibles: 🟡 criterio interno puro.
- Fijación: 🟡 criterio interno puro.
- Tapón/válvula: 🟡 criterio interno puro.
- Fugas: 🟡 criterio interno adaptado ITO.
- Evacuación: 🟡 criterio interno puro.
- Sellos: 🟡 criterio interno (analogía).
- Llenado: 🟡 criterio interno, sin analogía ITO directa.

Ninguna clasificación 🟢 ni 🟢/🟡. Ninguna analogía elevada a fuente normativa.

## AC. Manual de Tolerancias

Confirmado explícitamente, reutilizando la auditoría íntegra ya hecha en 11V (sin releer el documento completo): el Manual **no** contiene contenido directo para tina/bañera, en ninguna de sus formas — ni su cuerpo, ni desagüe, ni tapón, ni sellos. No se transfieren criterios de muebles (cap. 22), cerámicos (Ficha 10) ni ventanas (Ficha 13) a Tina por analogía — ninguno de esos capítulos fue diseñado para este artefacto, y hacerlo inventaría un respaldo inexistente.

## AD. ITO

El precedente de fugas (confirmado en sección C, artículo legacy que ya menciona "tina/receptáculo de ducha" en su alcance textual) se reutiliza como 🟡 criterio interno adaptado únicamente para Fugas — **no se extiende** esa analogía a Daños visibles, Fijación, Tapón/válvula, Evacuación, Sellos ni Llenado, que quedan como 🟡 criterio interno puro, sin la etiqueta "adaptado de ITO", porque el catálogo ITO histórico nunca desarrolló esos conceptos específicamente para tina.

## AE. Severidades

- **Daños visibles**: `LOW` — defecto cosmético/de calidad, sin riesgo funcional inmediato.
- **Fijación**: `MEDIUM` — riesgo real si empeora, sin fuga activa hoy.
- **Tapón/válvula**: `LOW` — función de conveniencia, sin riesgo de seguridad ni de daño a la vivienda si falla.
- **Fugas**: `HIGH` — agua activa, mismo criterio consistente que toda fuga en el catálogo.
- **Evacuación**: `MEDIUM` — agua estancada es un problema real pero no una fuga activa.
- **Sellos**: `MEDIUM` — mismo criterio que el resto de sellos del catálogo.
- **Llenado**: `MEDIUM` — un defecto funcional real (la tina no puede usarse para su propósito básico), sin ser una fuga.

Sin homogenizar — cada severidad justificada por su consecuencia real. Recordatorio explícito: DT-01 (UI preselecciona MEDIUM sin leer `defaultSeverity`) sigue sin corregirse.

## AF. Seguridad

**Permitido**: abrir agua normalmente, observar, dejar correr una cantidad razonable (moderada para Evacuación, pequeña y breve para Tapón/válvula), tocar suavemente el borde/artefacto para evaluar fijación, revisar visualmente sellos accesibles.

**Prohibido, confirmado en las 7 guías**: llenar excesivamente (ni para probar rebalse ni por ninguna otra razón), tapar el desagüe de forma forzada, desmontar, abrir registros, intervenir conexiones, usar herramientas, subirse dentro de la tina, saltar, aplicar cargas o peso deliberado.

## AG. Guías completas

### `tina-danos-visibles`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.
```

### `tina-fijacion`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.
```

### `tina-tapon-valvula`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.
```

### `tina-fugas`

```
# Qué revisar

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

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos.
```

### `tina-evacuacion`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.
```

### `tina-sellos`

```
# Qué revisar

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

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos — sin fuente normativa aplicable.
```

### `tina-llenado`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.
```

Las 7 guías listas para implementación mecánica, no creadas en BD en esta fase.

## AH. No corresponde

- **Llenado**: N/A cuando la tina comparte grifería con una Ducha activa (mismo mecanismo de agua, ya revisado por Ducha).
- **Daños visibles, Fijación, Tapón/válvula, Fugas, Evacuación, Sellos**: sin N/A — aplican siempre que el componente Tina exista.

Confirmado: solo 1 de los 7 checks tiene N/A, y por la única variante real que efectivamente cambia si el check aplica (compartir o no grifería con Ducha) — sin abusar de N/A.

## AI. Referencias visuales

- **Daños visibles**: ALTO VALOR.
- **Fijación**: NO NECESARIA.
- **Tapón/válvula**: NO NECESARIA.
- **Fugas**: ALTO VALOR.
- **Evacuación**: OPCIONAL (relacionado con el mismo tipo de contenido ya priorizado para Ducha-Evacuación en 11AN).
- **Sellos**: OPCIONAL/ALTO VALOR — mismo criterio que sellos del resto del catálogo.
- **Llenado**: NO NECESARIA.

No se generan imágenes en esta fase.

## AJ. Legacy

Confirmado sin cambios respecto a la política ya cerrada en 11AL/11AM/11AN/11AO: `artefactos-sanitarios` permanece para Baños históricos (snapshot congelado, sin recibir Tina automáticamente). Baño V1 nuevo incorpora `tina` como componente Nivel 2 configurable, reutilizando el concepto/fuente de fugas del legacy (sección C/AD) sin migrar ningún dato. Sin coexistencia automática de `artefactos-sanitarios` + `tina` en un mismo Baño nuevo. Sin tocar `active` del legacy en esta fase.

## AK. Key

**Confirmada: `tina`.** Libre en catálogo (sección C). Se descarta `banera` como key (aunque es sinónimo válido) por preferir el término ya usado consistentemente en toda la cadena de diseño de esta serie (11AJ en adelante) — evita inconsistencia entre documentos. Se descarta `tina-bano` — sin necesidad semántica real, mismo razonamiento ya aplicado a `ducha`/`lavamanos`/`mampara`. **Label: "Tina / Bañera"** (ambos términos visibles para reconocibilidad regional, mismo patrón ya usado en WC — label "WC / Inodoro" con key `wc`, 11AL §H).

## AL. Árbol final

```
Baño
└── Tina [L2] — tina
    ├── Daños visibles — LOW — 🟡 criterio interno puro
    ├── Fijación — MEDIUM — 🟡 criterio interno puro
    ├── Tapón/válvula — LOW — 🟡 criterio interno puro
    ├── Fugas — HIGH — 🟡 criterio interno adaptado ITO
    ├── Evacuación — MEDIUM — 🟡 criterio interno puro
    ├── Sellos — MEDIUM — 🟡 criterio interno (analogía)
    └── Llenado — MEDIUM — 🟡 criterio interno (N/A si comparte grifería con Ducha)
```

## AM. Nivel 2 final

Actualización conceptual de la rama dentro del árbol ya diseñado en 11AJ §AT (sin rediseñar el resto de Baño):

```
ARTEFACTOS SANITARIOS
├── WC / Inodoro [L2] — 4 checks (cerrado, 11AL)
├── Lavamanos [L2] — 5 checks (cerrado, 11AM)
├── Ducha [L2] — 6 checks (cerrado, 11AN)
├── Mampara [L2] — 5 checks (cerrado, 11AO)
├── Tina [L2] — 7 checks (nuevo, cerrado en esta fase)
└── Mueble de baño / Vanitorio [L2] — pendiente de cierre técnico
```

Sección (ARTEFACTOS SANITARIOS) y `order` (18) confirmados sin cambios respecto a 11AJ. Tina es Nivel 2, pregunta Sí/No: "¿El baño tiene tina instalada?". Sin `metaOptions`.

## AN. Frontera con Ducha (tabla final)

| Defecto | Ducha | Tina |
|---|---|---|
| Grifería (cuando comparte con Ducha) | ✅ Ducha | — (N/A en Llenado) |
| Grifería (cuando Tina no comparte, o Ducha inactiva) | — | ✅ Tina (check "Llenado") |
| Agua fría/caliente (compartida) | ✅ Ducha | — (N/A en Llenado) |
| Rociador | ✅ Ducha (folded) | — |
| Cuerpo de tina (daños, fijación) | — | ✅ Tina |
| Desagüe/evacuación de tina | — | ✅ Tina (check "Evacuación") |
| Sellos tina-muro/piso | — | ✅ Tina |
| Fuga asociada a Tina | — | ✅ Tina |
| Pendiente de zona de ducha (receptáculo) | ✅ Ducha (folded en Evacuación) | — |
| Receptáculo de ducha (firmeza/daños) | ✅ Ducha | — |
| Tapón/válvula de retención de la tina | — | ✅ Tina |

**Sin ambigüedad ni overlap en ninguna fila.**

## AO. Frontera con Mampara

Confirmado, sin cambios respecto a lo ya cerrado en 11AO: Mampara revisa el cerramiento completo (funcionamiento, fijación, daños de vidrio/perfiles, sellos propios, filtración) sin importar si está instalada sobre Ducha o sobre Tina. Tina no absorbe ni duplica ningún check de Mampara — una mampara sobre tina sigue siendo evaluada íntegramente por el componente Mampara.

## AP. Conteos

Impacto sobre los conteos teóricos de Baño V1 (base 8 + Extractor 2 + WC 4 + Lavamanos 5 + Ducha 6 + Mampara 5, acumulado 57 tras 11AO):

- **Tina en No**: +0.
- **Tina en Sí**: **+7 checks** — 3 más de lo proyectado preliminarmente en 11AJ (que estimó 4, sin el check de Llenado ni la separación de Tapón/válvula como propio). Ajuste honesto y justificado explícitamente (sección AA) — mismo tipo de ajuste ya visto en WC (3→4) y Mampara (2→5).
- **Máximo teórico actualizado**: 57 (tras 11AO) + 7 (Tina) = **64**. Sigue sin cerrarse el conteo canónico final de Baño — queda 1 cierre técnico pendiente: Mueble de baño / Vanitorio.

## AQ. Riesgos

- **Tina con/sin Ducha**: resuelto explícitamente con el check Llenado y su N/A (sección G/U/T) — riesgo remanente solo si la implementación futura no redacta correctamente la lógica de N/A.
- **Grifería compartida**: mitigado por wording explícito de Llenado, sin duplicación posible con Ducha-Grifería.
- **Tapón variable (tipos de mecanismo)**: mitigado por wording agnóstico al tipo de tapón/válvula.
- **Conexiones ocultas**: mitigado explícitamente acotando Fugas a "visibles y accesibles" (sección O).
- **Prueba de desagüe**: mitigado con método explícitamente acotado (cantidad moderada, sin llenar completamente) — sección P/AF.
- **Sellos**: mitigado combinando muro+piso en un solo check sin necesitar N/A adicional (sección Q).
- **Falta de fuente normativa**: aceptado explícitamente — 7 checks 🟡, ninguno inflado.
- **N/A**: acotado a 1 de 7 checks, por variante real y verificable.
- **Legacy**: mismo riesgo ya documentado en fases anteriores, dependiente de que el lote de implementación respete la política de no-coexistencia.

## AR. Estado final

Tina de Baño queda completamente cerrada: componente definido (cuerpo, apoyos, desagüe, tapón/válvula, sellos propios, fugas visibles/accesibles; excluye grifería de Ducha compartida, Mampara, cerámica transversal, impermeabilización oculta), key confirmada (`tina`, libre en catálogo), Nivel 2 confirmado (configurable, pregunta "¿El baño tiene tina instalada?"), 7 checks exactos con wording final (Daños visibles, Fijación, Tapón/válvula, Fugas, Evacuación, Sellos, Llenado), severidades definidas y justificadas (LOW/MEDIUM/LOW/HIGH/MEDIUM/MEDIUM/MEDIUM, sin homogeneizar), fuentes clasificadas honestamente (7× 🟡, sin atribuir respaldo del Manual de Tolerancias — confirmado sin cobertura), seguridad auditada, 7 guías completas de 7 encabezados listas para implementación mecánica (incluido disclaimer de impermeabilización), N/A definido con precisión (1 de 7 checks), referencias visuales clasificadas, frontera con Ducha resuelta explícitamente (incluido el punto pendiente de llenado sin ducha, tabla exhaustiva sin ambigüedad), frontera con Mampara confirmada sin cambios, legacy reutilizado sin migración, conteo actualizado (+7, 3 más que la proyección preliminar de 11AJ, ajuste justificado).

Ninguna decisión esencial queda abierta.

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AP_CIERRE_TECNICO_TINA_BANO.md`

Archivos modificados: ninguno.

Código = 0
Prisma = 0
BD = NO
Catálogo = NO
Seed = NO
Commit = NO
Push = NO
Deploy = NO

FASE 11AP — TINA DE BAÑO CERRADA TÉCNICAMENTE

DETENERSE. No implementar. No iniciar Mueble/Vanitorio todavía.
