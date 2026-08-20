# FASE 11AN — Cierre técnico y editorial de Ducha de Baño

Fase de auditoría + fuentes + diseño + redacción técnica. Sin cambios de código, Prisma, BD, catálogo, seed, TechnicalArticles en BD, commit, push ni deploy.

## A. Objetivo

Cerrar definitivamente, para Baño V1, el componente Ducha: definición, key, Nivel 2, checks exactos, fuentes, severidades, seguridad, guías completas, referencias visuales, frontera explícita con Mampara (11AO) y Tina (11AP), y estrategia legacy — sin implementar.

## B. Estado en 11AJ / 11AM

[FASE11AJ_DISENO_CANONICO_BANO_V1.md](FASE11AJ_DISENO_CANONICO_BANO_V1.md) §U dejó Ducha como componente nuevo, key `ducha`, Nivel 2, sección ARTEFACTOS SANITARIOS, `order: 17`, Lote D de implementación (junto con Mampara), 6 checks candidatos: grifería, agua fría/caliente, fugas visibles, evacuación (fusión de desagüe/acumulación/pendiente, sin diagnóstico de causa), firmeza del receptáculo/base, sello perimetral — `defaultSeverity` propuestos LOW/LOW/HIGH/MEDIUM/MEDIUM/MEDIUM. §V confirmó explícitamente: Mampara evaluada y descartada como check dentro de Ducha, modelada como componente propio para no forzar N/A en duchas con cortina o sin cerramiento. §Y confirmó Tina como componente independiente sin grifería/agua propias (para no duplicar la de Ducha cuando están integradas).

[FASE11AM_CIERRE_TECNICO_LAVAMANOS_BANO.md](FASE11AM_CIERRE_TECNICO_LAVAMANOS_BANO.md) aporta el patrón de análisis a reutilizar (no el contenido): fusión de síntomas idénticos sin exigir diagnóstico de pieza (Fugas), N/A solo por variante real y verificable — no por costumbre (Sello perimetral con N/A cuando no hay encuentro visible), y distinción de fijación entre artefactos físicamente independientes (aplicado aquí a Ducha vs. Mampara vs. Tina, secciones H/I).

Esta fase no reabre ninguna decisión ya cerrada — las aplica y profundiza específicamente para Ducha.

## C. Catálogo (auditoría solo lectura, esta fase)

Confirmado disponible: `ducha`, `ducha-bano`, `plato-ducha`, `receptaculo-ducha`, `rociador-ducha` — **las 5 keys están libres**. `artefactos-sanitarios` ya auditado íntegramente en 11AJ/11AL/11AM — no se vuelve a re-consultar desde cero. Su artículo de "fugas en la base" ya confirmó (11AJ §C, 11AL §D) que su alcance textual incluye "tina/receptáculo de ducha si corresponde" — mismo precedente de fuente/concepto ya reutilizado por WC y Lavamanos, disponible también para Ducha (sección AB/AD). Su artículo de "goteras en llaves" ya confirmó (11AM §E) que su alcance textual incluye "ducha/tina" — mismo precedente disponible para Grifería de Ducha.

## D. Legacy

Confirmada sin cambios la política canónica ya cerrada en 11AL §E/AD y reutilizada en 11AM §AF: Baños históricos con `artefactos-sanitarios` permanecen intactos (snapshot congelado, sin migración, sin repartir respuestas, sin crear `ducha` retroactivamente). Baños V1 nuevos usarán `ducha` (junto con `wc`/`lavamanos`/futuros) según la arquitectura Nivel 2. Sin coexistencia automática de `artefactos-sanitarios` + `ducha` en un mismo Baño nuevo. Sin desactivar el catálogo legacy en esta fase.

## E. Definición del componente

`ducha` representa: la **grifería de ducha** (incluido mezclador cuando exista), el **rociador** (fijo o teléfono, sin distinguir tipo como subcomponente), las **conexiones visibles accesibles**, el **desagüe/rejilla visible**, y el **receptáculo/plato cuando exista**, junto con los **sellos propios de esa zona** (no los de Mampara). **No incluye automáticamente**: Mampara (componente propio, frontera cerrada en sección I), Tina (componente propio, frontera cerrada en sección H), Mueble de baño, Extractor, ni el revestimiento cerámico general de muros/piso (componentes transversales ya existentes, frontera cerrada en sección V).

## F. Base o Nivel 2

**Decisión: Nivel 2 (configurable), no siempre presente.** Mismo razonamiento ya aplicado a WC (11AL §G) y Lavamanos (11AM §G): existen casos reales legítimos de Baño sin ducha (medio baño solo con WC+lavamanos, baño con solo tina sin ducha independiente). Confirma la decisión ya tomada en 11AJ §U sin reabrirla.

## G. Pregunta Nivel 2

**"¿El baño tiene ducha instalada?"** — confirmada tal como la propuso 11AJ, sin cambios. Sin `metaOptions` para tipo de rociador, marca, material del receptáculo — ninguna de esas variantes cambia el checklist final (secciones J-U).

## H. Relación con Tina

**Confirmado explícitamente: sin dependencia automática en ninguna dirección.** Ducha Sí no implica Tina Sí, ni Tina Sí implica Ducha Sí — ambos son componentes Nivel 2 independientes. Las 4 combinaciones reales son válidas: Ducha sin Tina (caso más común), Tina con ducha integrada (Ducha=Sí y Tina=Sí simultáneamente), Tina sin ducha (Ducha=No, Tina=Sí), Ducha y Tina separadas en el mismo baño (caso menos común pero físicamente posible, ambos=Sí con dos zonas distintas).

**Frontera de qué se evalúa bajo Ducha cuando existe ducha sobre tina** (adelanto explícito para no reabrir Ducha en 11AP, la futura fase de cierre de Tina): Ducha evalúa **grifería, agua fría/caliente, rociador (folded), fugas, evacuación** — todo lo relacionado con el agua en movimiento y su control. Tina evaluará (según su futuro cierre) **el cuerpo de la tina en sí** — firmeza, daños de superficie, fugas en su propia base/desagüe, sello perimetral de la tina con el muro — nunca la grifería ni el agua fría/caliente, que ya quedan cubiertas por Ducha cuando están integradas (decisión ya anticipada en 11AJ §V: "Tina sin grifería/agua — decisión ya aplicada"). Sin doble conteo: si el usuario activa ambos componentes para una tina-con-ducha-integrada, cada uno pregunta sobre su propia mitad del artefacto físico, sin preguntas repetidas sobre la misma llave.

## I. Relación con Mampara

**Frontera explícita, cerrada para no reabrir Ducha en 11AO** (la futura fase de cierre de Mampara). Ducha **NO incluye**: apertura/cierre de mampara, fijación de mampara, daños de vidrio, herrajes de mampara, ni el sello propio de la mampara (el encuentro mampara-receptáculo, que pertenece a Mampara según lo ya anticipado en 11AJ §W: "Firmeza y sello combinados" es el check propio de Mampara). El único punto donde Ducha podría tocar conceptualmente un "sello" es el de su propio receptáculo/plato con el muro (sección T) — una superficie física distinta del sello de la mampara con el receptáculo. Confirmado: ninguna revisión de Ducha depende de si existe o no una mampara — el componente funciona igual de completo con cortina, sin cerramiento, o con mampara (que en cualquier caso se evalúa aparte).

## J. Grifería — funcionamiento

Check final confirmado. Wording: **"¿La grifería de la ducha abre, cierra y responde correctamente al accionar sus controles?"** — se descarta explícitamente el verbo "regular" del enunciado original por ser demasiado amplio (regular temperatura exacta o presión no es algo que el usuario deba evaluar, ver secciones K/M) — el check se limita a abrir/cerrar/responder, consistente con el nivel de exigencia ya usado en Lavamanos/Lavaplatos. Distingue explícitamente de Fugas (sección N): este check es sobre el control mismo (¿responde al accionarlo?), no sobre agua escapando de una conexión. Fuente: 🟡 criterio interno adaptado ITO (reutilizando el concepto/fuente ya confirmado en la sección C — el artículo legacy de goteras en llaves ya cubre "ducha/tina" en su alcance textual). `defaultSeverity`: LOW.

## K. Agua fría / caliente

Check final confirmado. Wording: **"¿Funcionan correctamente el agua fría y caliente de la ducha, cuando la instalación dispone de ambas?"** — mismo patrón ya validado en Lavamanos (11AM §J), con N/A explícito para instalaciones que solo disponen de agua fría por diseño (poco común en una ducha residencial, pero no se asume universalidad sin evidencia, tal como exige el enunciado). No pide temperatura exacta, tiempo de calentamiento, presión ni diagnóstico de calefón/termo — solo confirma que sale agua de cada red disponible. Fuente: 🟡 criterio interno, sin analogía ITO directa. `defaultSeverity`: LOW.

## L. Rociador / ducha teléfono

**Decisión: FOLD, sin check propio.** Análisis explícito: un rociador que no entrega agua normalmente ya se detecta dentro de Grifería-funcionamiento (el control no responde con normalidad si el agua no llega al rociador seleccionado), y una fuga en la conexión del rociador o del flexible de la ducha teléfono ya se detecta dentro de Fugas (sección N) — crear un tercer check produciría exactamente el solapamiento que el enunciado pide evitar (misma foto, mismo comentario, misma acción que Grifería o Fugas, según cuál sea el síntoma). No se crean subcomponentes por tipo de rociador (fijo, teléfono, columna, multi-modo) — el wording de Grifería y Fugas ya es agnóstico al tipo de accesorio de salida de agua.

## M. Presión / caudal

**Decisión: DESCARTADO, confirmado explícitamente sin fuente.** Un check de "presión suficiente" dependería de la red del edificio, el calefón/termo, la hora del día, el estado del aireador, y otros factores completamente ajenos a la instalación de la ducha misma — ninguno diagnosticable ni corregible por el usuario, y sin ningún criterio objetivo o fuente que defina qué presión es "suficiente" para efectos de recepción de vivienda. Mismo tipo de descarte ya aplicado a Extracción/flujo de aire en Extractor (11AK §M) y a Evacuación en Lavamanos (11AM §M) — ausencia de fuente y de método simple/seguro.

## N. Fugas visibles

Check final confirmado, consolidado. Wording: **"Al usar la ducha, ¿se observan fugas o goteos en conexiones visibles, fuera de las salidas normales de agua (rociador, llave)?"** — el wording distingue explícitamente el agua normal del uso de la ducha (saliendo del rociador o la llave, que es agua esperada) de agua escapando por una unión, flexible o conexión que no debería tener agua saliendo. Cubre conexión de grifería, unión visible de flexible, conexión del rociador — un único síntoma observable, sin exigir diagnóstico de cuál pieza específica falla, mismo criterio que Fugas de Lavamanos/WC/Lavaplatos. Fuente: 🟡 criterio interno adaptado ITO (mismo origen confirmado en sección C). `defaultSeverity`: HIGH (mismo criterio consistente ya aplicado a toda fuga activa de agua en Cocina/WC/Lavamanos).

## O. Desagüe

Ver análisis integrado en sección P — Desagüe, Acumulación y Pendiente se resuelven juntos como un único check (Evacuación), no por separado.

## P. Acumulación de agua — análisis de fusión con Desagüe y Pendiente

**Análisis explícito de si el usuario puede distinguir Desagüe de Acumulación de Pendiente:**

Los 3 candidatos del enunciado — "¿el agua evacúa normalmente por el desagüe?", "¿queda agua acumulada en el piso después de usar la ducha?", y un eventual check de pendiente — describen, para un usuario no técnico, **el mismo resultado observable final**: agua que no se va del piso de la ducha en un tiempo razonable. Es cierto que, técnicamente, las causas pueden ser distintas (el desagüe en sí obstruido vs. una pendiente insuficiente que deja "pozas" lejos del desagüe aunque este funcione bien) — pero el enunciado mismo exige explícitamente **no pedir diagnóstico de causa**, y un usuario que ve agua estancada después de la ducha no tiene forma confiable de saber si es porque "el desagüe no evacúa" o porque "la pendiente no lleva el agua hasta el desagüe" — terminaría fotografiando exactamente la misma poza de agua en ambos casos.

**Decisión: fusionar Desagüe + Acumulación + Pendiente en un único check, "Evacuación".** Mismo criterio ya aplicado en el diseño preliminar de 11AJ §U (que ya había anticipado esta fusión), ahora confirmado con análisis explícito en vez de solo heredado. Wording final: **"Después de dejar correr agua durante el uso normal de la ducha, ¿el agua evacúa sin quedar acumulada en el piso o el receptáculo?"** — pregunta el resultado observable único, sin nombrar causa (ni "desagüe", ni "pendiente", ni "obstrucción" como posible origen). Fuente: 🟡 criterio interno puro, sin tolerancia de pendiente inventada (ver sección Q). `defaultSeverity`: MEDIUM (agua estancada es un problema real — riesgo de resbalón, humedad sostenida — pero no una fuga activa de agua escapando de la instalación, que ya tiene su propio check de mayor severidad).

## Q. Pendiente — auditoría de fuente

Confirmado explícitamente, reutilizando la auditoría íntegra ya hecha del Manual de Tolerancias en 11V (sin releer el documento completo de nuevo): el Manual **no** tiene un capítulo o ficha que defina una tolerancia numérica de pendiente para receptáculos o pisos de ducha — su único contenido de pendiente/nivelación aplicable en general es el de pisos (Ficha 10, ya usado en `piso-como-revisar-desniveles`, sección de "desnivel entre piezas", no de pendiente hacia un desagüe). No existe fuente para inventar un porcentaje o milímetro de pendiente mínima de ducha. **No se crea ningún check separado de "pendiente"** — su síntoma observable ya queda cubierto por el check fusionado de Evacuación (sección P), sin necesidad de nombrar la causa técnica.

## R. Prueba con agua — método seguro

Confirmado el método exclusivo permitido para el check de Evacuación (sección P): abrir la ducha con normalidad, dejar correr agua brevemente (representando el uso cotidiano, no una prueba extendida ni artificial), y observar. **Explícitamente prohibido**: inundar deliberadamente, tapar el desagüe para acumular agua a propósito, llenar artificialmente con baldes u otro recipiente, o generar cualquier condición que no sea el uso normal de la ducha. La prueba debe representar exactamente lo que ocurre en el uso diario, ni más ni menos.

## S. Rejilla de desagüe

**Decisión: DESCARTADO, sin check propio.** Confirmado: la presencia, firmeza o daño de la rejilla de desagüe es, en la enorme mayoría de los casos, un defecto visual menor sin relación con un problema de instalación relevante — mismo tipo de descarte ya aplicado a Rejilla/tapa de Extractor (11AK §N) y a Asiento/tapa de WC (11AL §N). No se agrega solo porque es visible — el enunciado lo advierte explícitamente. Si la rejilla faltara por completo (caso extremo), eso ya generaría el síntoma de acumulación/evacuación anormal capturado por el check de Evacuación, sin necesitar un check separado sobre la pieza en sí.

## T. Sellos

Check final confirmado, propio de Ducha (no de Mampara — frontera ya cerrada en sección I). Wording: **"El sello entre el receptáculo/plato de la ducha (o el piso de la zona de ducha) y el muro, ¿se ve continuo, sin separaciones ni grietas?"** — evalúa específicamente el encuentro receptáculo-muro o piso-muro de la zona de ducha, no el sello de la grifería con el muro (que no es una práctica constructiva estándar separada) ni el sello de Mampara (frontera ya cerrada). Fuente: 🟡 criterio interno (analogía con sello de Ventana/Lavaplatos/Lavamanos). `defaultSeverity`: MEDIUM.

## U. Receptáculo / plato de ducha

**Decisión: check propio combinado (firmeza + daños visibles en 1 solo check), con N/A cuando la ducha no tiene plato/receptáculo (ducha a ras, piso cerámico continuo).**

Análisis: muchas duchas no tienen un plato prefabricado — son "a ras", con el mismo piso cerámico continuo del resto del baño, en cuyo caso no existe una pieza "receptáculo" distinta que revisar (los daños de ese piso ya los cubre `revestimiento-ceramico-piso`, componente transversal, sección V). Para las duchas que sí tienen un receptáculo/plato prefabricado (material distinto — acrílico, fibra de vidrio, loza — que no es "cerámico" en el sentido de `revestimiento-ceramico-piso`), la firmeza y los daños de esa pieza son defectos reales y distintos de lo que cualquier otro componente cubre. Se combina firmeza+daños en **un único check** (no dos, evitando sobre-granularidad — mismo patrón compacto ya usado en Cubierta/Mesón de Cocina y en el diseño preliminar de Mampara de 11AJ) con N/A explícito cuando no existe receptáculo, en vez de forzarlo como requisito universal o descartarlo del todo (a diferencia de Rejilla, sección S, aquí SÍ hay un defecto real cuando la pieza existe). Wording: **"Si la ducha tiene receptáculo o plato (prefabricado, no cerámico continuo), ¿se ve firme y sin trizaduras, quiebres u otros daños visibles?"**. Fuente: 🟡 criterio interno puro. `defaultSeverity`: MEDIUM.

## V. Daños visibles — frontera con cerámicos

Confirmado explícitamente: Ducha **no duplica** ningún check de `revestimiento-ceramico-piso` ni `revestimiento-ceramico-muro` — los daños de cerámica de la zona de ducha (palmetas quebradas, defectos de esmalte) ya quedan cubiertos por esos 2 componentes transversales cuando el usuario los activa para Baño (11AJ §AG confirma su reutilización directa, mismos 2+2 checks, sin cambios). El único "daño visible" propio de Ducha es el del receptáculo/plato (sección U), que es una pieza de material distinto (no cerámico) cuando existe — sin overlap con los componentes de terminación.

## W. Humedad

**Decisión: sin check propio dentro de Ducha, confirmado.** Mismo razonamiento ya cerrado a nivel de Baño en 11AJ §AB: la humedad como síntoma general ya queda cubierta por Cielo (manchas de humedad, componente transversal) y por los checks de Fugas de cada artefacto sanitario (incluido el de Ducha, sección N) — un check adicional de "humedad del muro cerca de la ducha" duplicaría esa cobertura sin un dueño claro (¿es de Ducha? ¿de Muros? ¿de Cielo?). No se atribuye automáticamente humedad observada a un defecto de Ducha — puede deberse a A) una fuga visible durante la prueba (ya capturada por Fugas), B) humedad preexistente en muro/cielo (responsabilidad de esos componentes, no de Ducha), C) filtración oculta o D) condensación — ninguna de estas últimas 2 es diagnosticable por el usuario ni por la app.

## X. Impermeabilización

**Decisión: sin check, con disclaimer explícito para las guías (sección AG).** Confirmado sin ambigüedad: la app **no certifica** la existencia ni el estado de una membrana impermeabilizante oculta bajo el receptáculo o el piso de la ducha — ninguna revisión visual puede acreditar eso. No se pide picar, desmontar, ni realizar una prueba de inundación prolongada para intentar detectar una filtración oculta. La app detecta únicamente síntomas visibles en el momento de la inspección (fugas activas, agua no evacuando, daños visibles) — nunca certifica capas constructivas ocultas. Este disclaimer se incorpora explícitamente al texto de las guías de Fugas y Evacuación (sección AG), para que el usuario no interprete una revisión "sin observaciones" como una certificación de impermeabilización correcta.

## Y. Temperatura / quemaduras

**Decisión: sin check, seguridad explícita en la guía de Agua fría/caliente.** No se establece una temperatura máxima sin fuente ni instrumento de medición, y no se pide al usuario tocar deliberadamente agua excesivamente caliente para "probar" — el check de Agua fría/caliente (sección K) solo confirma que ambas redes entregan agua, usando el contacto normal y prudente que cualquier persona usaría al abrir una ducha, sin exponerse a riesgo.

## Z. Matriz de candidatos

| Candidato | Defecto | Método | Fuente | Solapa con | ¿Aplica a todas? | ¿Merece estado? | Decisión final |
|---|---|---|---|---|---|---|---|
| 1. Grifería funcionamiento | Control no responde/no abre-cierra | Accionar y observar | 🟡 criterio interno adaptado ITO | Ninguno (distinto de Fugas) | Sí | Sí | **MANTENER** |
| 2. Agua fría/caliente | Una red no funciona | Abrir cada lado | 🟡 criterio interno | Ninguno | Sí, con N/A si solo fría | Sí | **MANTENER**, con N/A |
| 3. Rociador | No entrega agua / fuga en su conexión | — | — | Con #1 (funcionamiento) y #5 (fugas) | N/A | No — mismo síntoma que #1/#5 | **FOLD** en #1 y #5 |
| 4. Presión/caudal | "Poca presión" | — | Sin fuente, causas ajenas a la instalación | — | No — depende de red/edificio | No | **DESCARTAR** |
| 5. Fugas visibles | Agua escapando de conexión | Usar y observar | 🟡 criterio interno adaptado ITO | Incluye #3 (rociador) | Sí | Sí | **MANTENER** |
| 6. Desagüe | Agua no evacúa | Usar y observar | 🟡 criterio interno puro | Con #7 y #8 (mismo síntoma) | Sí | Sí, fusionado | **FUSIONAR** con #7/#8 en "Evacuación" |
| 7. Acumulación de agua | Agua queda en el piso | Usar y observar | 🟡 criterio interno puro | Con #6 y #8 | Sí | Sí, fusionado | **FUSIONAR** con #6/#8 |
| 8. Pendiente | Insuficiente pendiente hacia desagüe | — | Sin fuente (Manual no cubre pendiente de ducha) | Con #6 y #7 (mismo síntoma) | Sí | Sí, fusionado (sin nombrar causa) | **FUSIONAR** con #6/#7, sin check nombrado "pendiente" |
| 9. Rejilla | Faltante/dañada/mal terminada | Observar | 🟡 criterio interno | Con Evacuación si faltara del todo | Sí | No — defecto visual menor | **DESCARTAR** |
| 10. Sello | Separación receptáculo/piso-muro | Observar | 🟡 criterio interno (analogía) | Con #5 (humedad resultante) | Sí | Sí | **MANTENER** |
| 11. Receptáculo (firmeza) | Movimiento/inestabilidad | Tocar suave | 🟡 criterio interno puro | Con #12 (mismo componente físico) | No — solo si existe plato | Sí, combinado | **MANTENER**, combinado con #12, N/A si no hay plato |
| 12. Receptáculo (daños) | Trizadura/quiebre del plato | Observar | 🟡 criterio interno puro | Con #11 | No — solo si existe plato | Sí, combinado | **MANTENER**, combinado con #11 |
| 13. Humedad | Manchas de humedad en muro/cielo cercano | — | — | Con Cielo, con #5 | N/A | No — sin dueño claro, ya cubierto por otros componentes | **DESCARTAR** |
| 14. Impermeabilización | Filtración oculta bajo el receptáculo/piso | Requeriría desmontar/picar | Ninguna, método inseguro/invasivo | — | N/A | No | **DESCARTAR**, con disclaimer explícito en guías |

**Ningún candidato queda sin decisión.**

## AA. Revisiones finales

**6 checks** — dentro de un rango razonable (4-7 sugerido en el enunciado), coincide con el conteo proyectado en 11AJ, ahora confirmado por análisis independiente detallado en vez de solo heredado:

1. **Grifería** — "¿La grifería de la ducha abre, cierra y responde correctamente al accionar sus controles?"
2. **Agua fría/caliente** — "¿Funcionan correctamente el agua fría y caliente de la ducha, cuando la instalación dispone de ambas?"
3. **Fugas** — "Al usar la ducha, ¿se observan fugas o goteos en conexiones visibles, fuera de las salidas normales de agua (rociador, llave)?"
4. **Evacuación** — "Después de dejar correr agua durante el uso normal de la ducha, ¿el agua evacúa sin quedar acumulada en el piso o el receptáculo?"
5. **Receptáculo/plato** — "Si la ducha tiene receptáculo o plato (prefabricado, no cerámico continuo), ¿se ve firme y sin trizaduras, quiebres u otros daños visibles?"
6. **Sello perimetral** — "El sello entre el receptáculo/plato de la ducha (o el piso de la zona de ducha) y el muro, ¿se ve continuo, sin separaciones ni grietas?"

## AB. Fuentes

- Grifería: 🟡 criterio interno adaptado ITO.
- Agua fría/caliente: 🟡 criterio interno, sin analogía ITO directa.
- Fugas: 🟡 criterio interno adaptado ITO.
- Evacuación: 🟡 criterio interno puro.
- Receptáculo/plato: 🟡 criterio interno puro.
- Sello perimetral: 🟡 criterio interno (analogía).

Ninguna clasificación 🟢 ni 🟢/🟡. Ninguna analogía elevada a fuente normativa.

## AC. Manual de Tolerancias

Confirmado explícitamente, sin releer el documento completo (reutilizando 11V, ya confirmado en 11AJ §F): el Manual **no** cubre ducha, receptáculo, pendiente de zonas húmedas, ni sellos de silicona en baño. Su único contenido potencialmente relacionado (desnivel de piso, Ficha 10) ya está en uso por `piso-como-revisar-desniveles` y `revestimiento-ceramico-piso`, componentes transversales — no se duplica ni se extiende artificialmente su alcance hacia Ducha solo porque existe una fuente fuerte para un concepto adyacente (regla explícita del enunciado: "fuente fuerte ≠ necesidad de nuevo check", aplicada aquí en sentido inverso también: fuente fuerte de un concepto adyacente ≠ licencia para extenderla a un concepto que no cubre).

## AD. ITO

El precedente de grifería/fugas (confirmado en sección C, artículo legacy que ya menciona "ducha/tina" y "tina/receptáculo de ducha" en su alcance textual) se reutiliza como 🟡 criterio interno adaptado para Grifería y Fugas — **no se extiende** esa misma analogía a Evacuación, Receptáculo ni Sello perimetral, que quedan como 🟡 criterio interno puro, sin la etiqueta "adaptado de ITO", porque el catálogo ITO histórico nunca desarrolló esos conceptos específicamente.

## AE. Severidades

- **Grifería**: `LOW` — molestia funcional, sin riesgo real.
- **Agua fría/caliente**: `LOW` — mismo criterio.
- **Fugas**: `HIGH` — agua activa, mismo criterio consistente que toda fuga en Cocina/WC/Lavamanos.
- **Evacuación**: `MEDIUM` — agua estancada es un problema real (riesgo de resbalón, humedad sostenida) pero no una fuga activa.
- **Receptáculo/plato**: `MEDIUM` — riesgo real si empeora (trizadura puede derivar en fuga), sin ser hoy una fuga activa.
- **Sello perimetral**: `MEDIUM` — mismo criterio que el resto de sellos del catálogo.

Sin `HIGH` automático solo por presencia de agua — únicamente Fugas (agua activa escapando) lo justifica; Evacuación y Receptáculo se mantienen en MEDIUM porque su consecuencia inmediata no es una fuga en curso. Recordatorio explícito: DT-01 (UI preselecciona MEDIUM sin leer `defaultSeverity`) sigue sin corregirse.

## AF. Seguridad

**Permitido**: abrir/cerrar la ducha normalmente, cambiar frío/caliente con normalidad, dejar correr agua brevemente (representando uso cotidiano), observar, revisar visualmente conexiones accesibles.

**Prohibido, confirmado en las 6 guías**: desmontar grifería, retirar la rejilla si requiere manipulación, intervenir el sifón, tapar el desagüe para forzar acumulación, inundar deliberadamente, usar químicos, tocar conexiones ocultas, usar herramientas, subirse a superficies inseguras, forzar cualquier componente.

## AG. Guías completas

### `ducha-griferia`

```
# Qué revisar

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

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Grifería — verificación de ausencia de goteras y filtraciones visibles, extendido a funcionamiento de controles de ducha.
```

### `ducha-agua-fria-caliente`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.
```

### `ducha-fugas`

```
# Qué revisar

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

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles, extendido al contexto de ducha.
```

### `ducha-evacuacion`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no define una tolerancia de pendiente para receptáculos o pisos de ducha).
```

### `ducha-receptaculo`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.
```

### `ducha-sello-perimetral`

```
# Qué revisar

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

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos (ventana, lavaplatos, lavamanos) — sin fuente normativa aplicable.
```

Las 6 guías listas para implementación mecánica, no creadas en BD en esta fase.

## AH. No corresponde

- **Agua fría/caliente**: N/A cuando la instalación solo dispone de agua fría por diseño.
- **Receptáculo/plato**: N/A cuando la ducha es "a ras" sin pieza de receptáculo distinta del piso cerámico continuo.
- **Grifería, Fugas, Evacuación, Sello perimetral**: sin N/A — aplican siempre que el componente Ducha exista.

Confirmado: solo 2 de los 6 checks tienen N/A, ambos por una variante real y verificable — no se abusa de N/A, ningún check quedó mal modelado al punto de necesitarlo en demasiadas variantes.

## AI. Referencias visuales

- **Grifería**: NO NECESARIA.
- **Agua fría/caliente**: NO NECESARIA.
- **Fugas**: ALTO VALOR.
- **Evacuación (acumulación de agua)**: ALTO VALOR — confirmado explícitamente por el enunciado como candidato de alto valor.
- **Receptáculo/plato**: OPCIONAL — daño visible se beneficia de referencia, pero es menos crítico que fugas/acumulación.
- **Sello perimetral**: OPCIONAL/ALTO VALOR — mismo criterio que sellos de Lavamanos/WC.

Sin duplicar referencias de cerámicos (frontera ya cerrada en sección V — esas referencias, si se generan, pertenecen a `revestimiento-ceramico-piso`/`-muro`, no a Ducha). No se generan imágenes en esta fase.

## AJ. Legacy final

Confirmado sin cambios respecto a la política ya cerrada en 11AL/11AM: `artefactos-sanitarios` permanece para Baños históricos, `ducha` (junto con `wc`/`lavamanos`) para Baño V1 nuevo. Sin coexistencia automática. Sin migración automática. Sin desactivar el catálogo legacy en esta fase.

## AK. Key

**Confirmada: `ducha`.** Libre en catálogo (sección C). Se descarta `ducha-bano` — sin necesidad semántica real, el criterio técnico de este artefacto ya es intrínsecamente de baño (mismo razonamiento aplicado a `lavamanos` en 11AM §AG, a diferencia de componentes genuinamente transversales por material como `revestimiento-ceramico-piso`). Sin metadata de tipo, marca, rociador o material — ninguna cambia las revisiones. Label: **"Ducha"**.

## AL. Árbol final

```
Baño
└── Ducha [L2] — ducha
    ├── Grifería — LOW — 🟡 criterio interno adaptado ITO
    ├── Agua fría/caliente — LOW — 🟡 criterio interno (N/A si solo fría)
    ├── Fugas — HIGH — 🟡 criterio interno adaptado ITO
    ├── Evacuación — MEDIUM — 🟡 criterio interno puro
    ├── Receptáculo/plato — MEDIUM — 🟡 criterio interno puro (N/A si ducha a ras)
    └── Sello perimetral — MEDIUM — 🟡 criterio interno (analogía)
```

## AM. Nivel 2

Actualización conceptual de la rama dentro del árbol ya diseñado en 11AJ §AT (sin rediseñar el resto de Baño):

```
ARTEFACTOS SANITARIOS
├── WC / Inodoro [L2] — 4 checks (cerrado, 11AL)
├── Lavamanos [L2] — 5 checks (cerrado, 11AM)
├── Ducha [L2] — 6 checks (nuevo, cerrado en esta fase)
├── Tina [L2] — pendiente de cierre técnico (11AP)
├── Mampara [L2] — pendiente de cierre técnico (11AO)
└── Mueble de baño / Vanitorio [L2] — pendiente de cierre técnico
```

Sección (ARTEFACTOS SANITARIOS) y `order` (17) confirmados sin cambios respecto a 11AJ. Ducha es Nivel 2, pregunta Sí/No: "¿El baño tiene ducha instalada?".

## AN. Frontera con Mampara (para 11AO)

Confirmado explícitamente (sección I, resumen operativo para la futura fase): 11AO **no debe reabrir** ningún check de Ducha. Mampara diseñará sus propios checks (funcionamiento, firmeza/sello combinados, según lo ya anticipado en 11AJ §W) sin que Ducha le ceda ni comparta ninguno de sus 6 checks actuales.

## AO. Frontera con Tina (para 11AP)

Confirmado explícitamente (sección H, resumen operativo para la futura fase): 11AP **no debe reabrir** ningún check de Ducha. Tina diseñará checks sobre el cuerpo del artefacto (firmeza, daños de superficie, fugas propias en su base/desagüe, sello con el muro) sin grifería ni agua fría/caliente propias — esos 2 checks siguen siendo exclusivos de Ducha incluso cuando ambos componentes coexisten (tina con ducha integrada).

## AP. Conteos

Impacto sobre los conteos teóricos de Baño V1 (base 8 + Extractor 2 + WC 4 + Lavamanos 5, acumulado 46 tras 11AM):

- **Ducha en No**: +0.
- **Ducha en Sí**: **+6 checks** — coincide exactamente con lo proyectado en 11AJ, sin ajuste.
- **Máximo teórico actualizado**: 46 (tras 11AM) + 6 (Ducha) = **52**. Sigue sin cerrarse el conteo canónico final de Baño — quedan 3 cierres técnicos pendientes: Mampara, Tina, Mueble de baño.

## AQ. Riesgos

- **Solapamiento fuga/desagüe/pendiente**: resuelto explícitamente por fusión (sección P), con análisis dedicado en vez de solo heredar la fusión de 11AJ.
- **Confusión Ducha/Tina**: mitigada por frontera explícita (sección H/AO) — riesgo remanente solo si la implementación futura de Tina no la respeta.
- **Confusión Ducha/Mampara**: mitigada por frontera explícita (sección I/AN).
- **Subjetividad del caudal**: eliminada al descartar por completo el check de Presión/caudal (sección M), sin quedar ambigüedad.
- **Impermeabilización oculta**: mitigado con disclaimer explícito en las guías de Fugas y Evacuación (secciones X/AG) — el riesgo de que un usuario interprete "sin observaciones" como certificación de impermeabilización queda advertido, no eliminado del todo (limitación inherente de cualquier inspección visual, no exclusiva de esta app).
- **Fuentes no normativas**: aceptado explícitamente — 6 checks 🟡, ninguno inflado.
- **N/A**: acotado a 2 de 6 checks, por variante real (sección AH).
- **Legacy**: mismo riesgo ya documentado en 11AL/11AM, dependiente de que el lote de implementación respete la política de no-coexistencia.
- **Variantes de receptáculo**: resuelto con N/A explícito (sección U/AH), sin forzar el check en duchas a ras.

## AR. Estado final

Ducha de Baño queda completamente cerrada: componente definido (grifería, rociador folded, conexiones visibles, desagüe/rejilla, receptáculo cuando exista, sellos propios; excluye Mampara/Tina/Mueble de baño/Extractor/cerámicos transversales), key confirmada (`ducha`, libre en catálogo), Nivel 2 confirmado (configurable, pregunta "¿El baño tiene ducha instalada?"), 6 checks exactos con wording final (Grifería, Agua fría/caliente, Fugas, Evacuación, Receptáculo/plato, Sello perimetral), severidades definidas y justificadas (LOW/LOW/HIGH/MEDIUM/MEDIUM/MEDIUM), fuentes clasificadas honestamente (6× 🟡, sin atribuir respaldo del Manual de Tolerancias — confirmado sin cobertura de pendiente/ducha), seguridad auditada, 6 guías completas de 7 encabezados listas para implementación mecánica (incluido disclaimer de impermeabilización), N/A definido con precisión (2 de 6 checks), referencias visuales clasificadas, frontera con Mampara cerrada explícitamente para 11AO, frontera con Tina cerrada explícitamente para 11AP, estrategia legacy reutilizada sin cambios, conteo actualizado (+6, confirmando la proyección de 11AJ sin ajuste).

Ninguna decisión esencial queda abierta.

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AN_CIERRE_TECNICO_DUCHA_BANO.md`

Archivos modificados: ninguno.

Código = 0
Prisma = 0
BD = NO
Catálogo = NO
Seed = NO
Commit = NO
Push = NO
Deploy = NO

FASE 11AN — DUCHA DE BAÑO CERRADA TÉCNICAMENTE

DETENERSE. No implementar. No iniciar Mampara todavía.
