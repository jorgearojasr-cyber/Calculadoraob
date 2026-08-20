# FASE 11AK — Cierre técnico y editorial de Extractor de aire de Baño

Fase de auditoría + fuentes + diseño + redacción técnica. Sin cambios de código, Prisma, BD, catálogo, seed, TechnicalArticles en BD, commit, push ni deploy.

## A. Objetivo

Cerrar definitivamente, para Baño V1, el componente Extractor de aire: definición, pregunta Nivel 2, sección, revisiones exactas, fuentes, severidades, seguridad, guías completas y conteos — dejándolo listo para implementación mecánica en un lote futuro, sin implementarlo todavía.

## B. Estado en 11AJ

[FASE11AJ_DISENO_CANONICO_BANO_V1.md](FASE11AJ_DISENO_CANONICO_BANO_V1.md), sección P, dejó definido: componente nuevo, key candidata `extractor-aire` (genérica, sin sufijo `-bano`, para permitir reutilización futura en otros recintos húmedos si surgiera el caso), Nivel 2 Sí/No, sección EQUIPAMIENTO DEL RECINTO junto a Ventana (no una sección "VENTILACIÓN" propia, por ser 1 sola decisión), `order: 14`, lote de implementación B (después de Terminaciones+Ventana del Lote A). 2 checks candidatos: Funcionamiento y Ruido/vibración, ambos 🟡 criterio interno puro, `defaultSeverity` MEDIUM propuesto para ambos, explícitamente sin reutilizar `campana-extractor` por diferencia de contexto (sin velocidades múltiples típicas, sin iluminación incorporada típica). Esta fase confirma, profundiza y cierra esas decisiones — no las contradice.

## C. Auditoría de catálogo (solo lectura, esta fase)

Confirmado en BD compartida: `extractor-aire`, `extractor-bano`, `extractor`, `ventilacion-bano`, `ventilador-bano` — **las 5 keys están libres**, ninguna existe todavía. `campana-extractor` sí existe (3 `InspectionChecklistItem` activos, 3 `TechnicalArticle`), releído íntegro en esta fase exclusivamente como precedente de UX/redacción, no como fuente técnica.

## D. Comparación con Campana de Cocina

| Aspecto | Campana Cocina | Extractor Baño | ¿Reutilizable? |
|---|---|---|---|
| Encendido | Control dedicado (botón/perilla/panel) | Control dedicado, a menudo el mismo interruptor de la luz del baño | No — el mecanismo de activación típico difiere (ver sección J) |
| Velocidades | Común tener 2-3 velocidades | Prácticamente siempre 1 sola velocidad | No — Campana pregunta explícitamente por velocidades, Extractor no debería |
| Iluminación incorporada | Común (luz sobre la zona de cocción) | Rara — la iluminación del baño es un componente separado (`iluminacion`), ya reutilizado en 11AJ | No — el check de iluminación de Campana no aplica |
| Ruido | Motor de mayor caudal, más audible en general | Motor típicamente más pequeño, pero el criterio de "irregular más allá de lo normal" es igual de válido | **Sí — el concepto y la redacción de precaución ("todo motor produce sonido") son igualmente aplicables**, aunque el check final se redacta como texto propio, no como referencia cruzada |
| Extracción/ducto | Ya descartado en Cocina (11AG) por falta de método seguro | Mismo problema, más agudo aún — sin fuente, sin método casero válido (sección M) | Coincide la conclusión (descartar), no el contenido |
| Contexto de humedad | Cocina genera vapor de cocción, uso intermitente | Baño genera humedad de ducha/tina, uso más frecuente y prolongado | No aplica reutilización — contexto distinto no cambia los checks propuestos |
| Controles | Independientes de otros equipos | A menudo compartido con el interruptor de luz o con temporizador incorporado | No — Campana no contempla esta variante |
| Temporizador/sensor | No existe en Campana | Existe como variante real en Extractor de baño | No — concepto ausente en Campana |

**Conclusión: no se reutiliza `campana-extractor`.** Se confirma la preferencia inicial de 11AJ: nuevo `InspectionElementTemplate` `extractor-aire`. Único elemento reutilizado de Campana es el **patrón de redacción** del check de ruido/vibración (la advertencia "todo motor produce sonido al funcionar" es igual de válida aquí), no el contenido, el template ni la fuente.

## E. Definición del componente

`extractor-aire` representa un **equipo fijo de ventilación/extracción mecánica instalado en el baño** — extractor mural, de cielo, o conectado a ducto, activado por interruptor, sensor o control independiente/compartido. **No incluye**: ventana (componente separado, ya reutilizado en 11AJ), ventilación natural sin equipo, calefactor, secador de pelo/manos, ni ventilador portátil (no es un equipo fijo de la vivienda).

## F. Pregunta Nivel 2

**"¿El baño tiene extractor de aire instalado?"** — confirmada tal como la propuso 11AJ. Se evaluó la alternativa "¿El baño tiene extractor o ventilador de extracción instalado?" y se descarta por ser más larga sin agregar claridad real — "extractor de aire" ya es un término de uso común y suficientemente específico para el usuario objetivo de la app (mismo nivel de lenguaje que "¿La cocina tiene campana o extractor instalado?", que no generó ninguna confusión reportada en QA de Cocina).

## G. Sección Nivel 2

**EQUIPAMIENTO DEL RECINTO**, junto a Ventana — confirmado, no se crea sección "VENTILACIÓN". Extractor es la única decisión de ventilación en todo Baño V1; una sección de 1 solo ítem fragmentaría el panel sin beneficio de UX, mismo criterio ya aplicado a Campana en Cocina (11AG §E). `order: 14` confirmado (después de Ventana `order: 13`, antes de WC `order: 15`).

## H. Relación con Ventana

Confirmado explícitamente: **sin dependencia automática en ninguna dirección.** Las 4 combinaciones (Ventana Sí/Extractor Sí, Ventana Sí/Extractor No, Ventana No/Extractor Sí, Ventana No/Extractor Sí) son todas físicamente válidas y deben poder configurarse independientemente — un baño puede tener ambos (redundancia real, no error), ninguno (caso real que la app debe poder representar sin forzar una respuesta), o solo uno. La app **no certifica cumplimiento normativo de ventilación** (no evalúa si la combinación presente cumple algún mínimo reglamentario) — solo registra lo que existe físicamente y su estado de funcionamiento, igual que hace con cualquier otro componente Nivel 2. Sin cambios en el motor genérico — ambos componentes ya son independientes por diseño (`SPACE_LEVEL2_CONFIG` no soporta ni necesita dependencias entre componentes).

## I. Funcionamiento

Check principal, confirmado. Wording final: **"¿El extractor enciende y funciona al accionar su control normal?"** — deliberadamente neutro respecto al mecanismo de activación (ver sección J). Cubre: encendido, respuesta al control, y funcionamiento perceptible (gira / se escucha extraer aire) en una sola pregunta.

## J. Activación (control / interruptor / sensor / temporizador)

**Confirmado: folded dentro de Funcionamiento, sin check separado.** El wording "acciona su control normal" es deliberadamente agnóstico al mecanismo real (interruptor dedicado, compartido con la luz, sensor de humedad, temporizador) — el usuario simplemente usa el mecanismo que el equipo realmente tenga instalado, sea cual sea, y confirma si el extractor responde. Crear checks separados por tipo de mecanismo forzaría al usuario a autoidentificar una categoría técnica (¿esto es un sensor o un temporizador?) sin agregar información nueva sobre el estado real del equipo. Mismo criterio que Campana usó para consolidar "controles" dentro de Funcionamiento (11AG).

## K. Velocidades

**Confirmado: folded dentro de Funcionamiento cuando existan, sin check independiente ni subconfiguración.** A diferencia de Campana (donde múltiples velocidades son comunes y el wording las menciona explícitamente, "velocidades, si tiene más de una"), un extractor de baño estándar tiene **una sola velocidad** en la gran mayoría de los casos reales — no se justifica ni una pregunta separada ni una mención explícita en el wording de Funcionamiento (a diferencia de Campana). Si un extractor de baño excepcionalmente tuviera más de una velocidad, "enciende y funciona al accionar su control normal" sigue siendo una pregunta binaria válida y suficiente — no se crea subconfiguración para cantidad de velocidades, aplicando directamente el aprendizaje de Campana (11AG: velocidades folded, nunca un check ni un dato de cantidad).

## L. Ruido / vibración

**Confirmado: check independiente, con estado/severidad/foto propios** — un extractor puede encender y funcionar (pasando Funcionamiento) pero presentar un problema mecánico audible distinto (pasando a estado propio de observación). Wording final: **"Al funcionar, ¿presenta vibraciones, golpes o ruidos claramente irregulares (más allá del ruido normal del motor)?"** — idéntico patrón textual y misma advertencia explícita que Campana ("todo motor produce sonido al funcionar — eso por sí solo no es un defecto"), reutilizando el patrón de redacción (no el contenido ni la fuente) confirmado en la sección D. Busca específicamente: traqueteo, vibración anormal, roce, golpeteo, indicio de pieza suelta — nunca "es ruidoso" como criterio.

## M. Extracción / flujo de aire

**Decisión: DESCARTADO para V1, sin adoptar ningún método casero.**

Se evaluó explícitamente cada método sugerido en el enunciado (papel higiénico, servilleta, hoja de papel, humo, vapor, aerosol) y se descartan todos por el mismo motivo: ninguno tiene respaldo técnico almacenado en el proyecto, y todos dependen de variables incontrolables (velocidad real del equipo, distancia, corrientes de aire ambientales, sensibilidad del método al peso/rigidez del papel usado) — mismo análisis y misma conclusión que 11AG aplicó al método de "hoja de papel frente al filtro" para Campana. Un extractor que gira y se escucha funcionar (capturado por el check de Funcionamiento) no acredita caudal de extracción correcto, pero la app tampoco pretende certificar ese caudal — sería instrumental (anemómetro) o normativo, ninguno de los dos disponibles ni apropiado para el usuario objetivo de esta app.

**Requiere fuente externa** si en el futuro se quisiera incorporar — no es indispensable para V1 (el check de Funcionamiento ya cubre el defecto más común y observable: el equipo no enciende o no gira), por lo que se descarta honestamente en vez de forzar un método sin respaldo.

## N. Rejilla / tapa

**Decisión: DESCARTADO para V1** (no MANTENER, no FOLD). Un daño visible en la rejilla/tapa es, en la inmensa mayoría de los casos reales, un defecto cosmético menor sin relación con el funcionamiento del equipo ni con un riesgo real — a diferencia de, por ejemplo, la fijación de un mueble aéreo (riesgo de caída) o una fuga (riesgo de humedad sostenida). No se identifica un defecto de instalación de vivienda de suficiente relevancia para justificar un tercer check, y el enunciado explícitamente advierte no agregar por completitud. Si una futura fase encontrara evidencia real (casos reportados, feedback de usuarios) de que esto importa, puede reconsiderarse como candidato V2 — no se cierra la puerta, solo se excluye de V1 sin fuente ni evidencia que lo justifique hoy.

## O. Suciedad

**Decisión: DESCARTADO para V1**, confirmado explícitamente como esperaba el enunciado. La suciedad acumulada depende de uso, antigüedad y mantención posterior a la entrega — no es un defecto de instalación atribuible a la construcción, y evaluarla en una vivienda nueva no cambia esa naturaleza (un extractor recién instalado con polvo de obra no es lo mismo que uno con años de uso, y la app no puede ni debe intentar distinguir esos casos). Sin check propio.

## P. Humedad / condensación

**Decisión: sin check propio dentro de Extractor.** Confirmado: la presencia de humedad/moho en el baño **no** se usa como prueba automática de que el extractor esté fallando — la causa puede ser uso, ventilación insuficiente, puente térmico, filtración, condensación u otro factor, y la app no diagnostica causalidad. La cobertura de humedad ya existe en Cielo (`cielo`, reutilizado en 11AJ §K) y en los checks de fugas de cada artefacto sanitario (11AJ §AB) — ninguno de esos dos pertenece a Extractor ni depende de él. Consistente con la decisión ya tomada en 11AJ de no crear un check de humedad específico de Baño fuera de los componentes que ya lo cubren.

## Q. Ducto

**Decisión: fuera de V1, confirmado.** Ninguna parte del ducto (interno, en entretecho, o su descarga exterior) es observable de forma segura y simple por el usuario — igual conclusión que Campana (11AG §L) para sus propios ductos. No se pide desmontar, acceder a entretecho, revisar ducto interno, verificar descarga exterior desde altura, ni medir diámetro o caudal. Ninguna parte visible del ducto (si la hubiera, como una rejilla de salida exterior) se identifica con valor suficiente para justificar un check propio — queda cubierto conceptualmente por el descarte de Rejilla/tapa (sección N) si acaso fuera la misma pieza visible.

## R. Temporizador

**Decisión: sin check propio, comportamiento normal explícitamente aclarado en la guía de Funcionamiento (no como defecto).** Confirmado: un extractor que continúa funcionando después de apagada la luz (por tener temporizador) es un comportamiento **normal**, no un defecto — la guía final (sección Y) debe evitar cualquier frase tipo "debe apagarse inmediatamente" que induciría a un usuario con extractor temporizado a reportar un falso defecto. No aporta un check independiente — folded conceptualmente dentro de la aclaración de Funcionamiento.

## S. Sensor de humedad

**Decisión: fuera de alcance de V1, confirmado.** No se exige al usuario forzar humedad, usar vapor, ni probar el sensor artificialmente — ninguno de esos métodos es simple ni completamente seguro/predecible para un usuario no técnico (generar vapor deliberadamente en un baño en evaluación introduce variables y tiempo innecesarios). Si el extractor tiene sensor automático, el usuario no necesita validarlo en V1 — el check de Funcionamiento (accionando el control normal, que en un equipo con sensor puede incluir esperar su activación automática al usar la ducha, sin forzarla) ya es suficiente para confirmar que el equipo enciende y funciona.

## T. Matriz de candidatos

| Candidato | Defecto que detecta | ¿Aplica a todos? | ¿Método seguro? | ¿Fuente? | ¿Solapa? | Decisión |
|---|---|---|---|---|---|---|
| 1. Encendido/funcionamiento | Equipo no enciende, control no responde, no gira | Sí | Sí — accionar control normal | 🟡 criterio interno | No | **MANTENER** — check final |
| 2. Controles/activación | (mecanismo específico de activación) | N/A | N/A | N/A | Sí, con #1 | **FOLD** en #1 |
| 3. Velocidades | Velocidad específica no responde | No (mayoría 1 sola velocidad) | Sí, si aplicara | 🟡 | Sí, con #1 | **FOLD** en #1 (sin mención explícita en wording, a diferencia de Campana) |
| 4. Ruido/vibración | Vibración/golpeteo/roce anormal | Sí | Sí — escuchar/observar | 🟡 criterio interno | No | **MANTENER** — check final |
| 5. Extracción/succión | Caudal insuficiente | Sí en teoría | No — ningún método casero con respaldo | Ninguna disponible | N/A | **DESCARTAR** — requiere fuente externa, no indispensable para V1 |
| 6. Rejilla/tapa | Daño/pieza faltante/mal fijada | Solo si el modelo la tiene visible | Sí, si aplicara | 🟡 | Parcial, con #4 (vibración también puede aflojar tapa) | **DESCARTAR** — defecto cosmético menor, sin evidencia de relevancia real |
| 7. Suciedad | Acumulación de polvo/grasa | Sí | Sí, si aplicara | N/A — no es defecto de instalación | N/A | **DESCARTAR** — depende de uso/mantención posterior, no de la construcción |
| 8. Ducto | Obstrucción, mala instalación interna | Parcial (no siempre visible) | No — requiere acceso a entretecho/altura | Ninguna disponible | Con #5 (ambos apuntan a "extracción real") | **DESCARTAR** — no observable de forma segura |
| 9. Temporizador | (comportamiento normal, no defecto) | N/A | N/A | N/A | N/A | **DESCARTAR check** — aclarado como comportamiento normal dentro de la guía de #1 |
| 10. Sensor de humedad | (activación automática, no defecto en sí) | N/A | No — forzar humedad no es seguro/simple | Ninguna disponible | Con #1 (activación) | **DESCARTAR** — fuera de alcance V1 |

**Ningún candidato queda sin decisión.**

## U. Revisiones finales

**2 checks**, dentro del objetivo orientativo de 1 a 3:

1. **Funcionamiento** — "¿El extractor enciende y funciona al accionar su control normal?"
2. **Ruido / vibración** — "Al funcionar, ¿presenta vibraciones, golpes o ruidos claramente irregulares (más allá del ruido normal del motor)?"

Cada uno con estado, comentario, severidad y foto propios, sin solaparse entre sí (uno detecta ausencia de funcionamiento, el otro detecta un funcionamiento anormal presente).

## V. Fuentes

Ambos checks: **🟡 CRITERIO INTERNO**, sin excepción. Auditado explícitamente: el Manual de Tolerancias CDT/CChC no cubre equipos de extracción (confirmado ya en 11V y reconfirmado en 11AJ §F para Baño específicamente); el catálogo educativo ITO no tiene ningún punto de "extractor de aire" ni "ventilación mecánica" que permita una analogía honesta (a diferencia de Lavaplatos, que sí pudo apoyarse en la sección Grifería de ITO). **No se usa la fuente de Campana como respaldo técnico** — Campana es únicamente precedente de redacción/UX (sección D), nunca fuente. Sin inflar ninguna clasificación.

## W. Severidades

- **Funcionamiento**: `MEDIUM` — un extractor que no enciende no es una emergencia, pero sí un defecto funcional real que afecta el uso diario del baño (control de humedad/olores).
- **Ruido/vibración**: `MEDIUM` — un problema mecánico presente conviene documentarlo antes de que empeore, mismo nivel que el check equivalente de Campana.

Sin `HIGH` en ninguno de los 2 — no hay riesgo de seguridad, daño estructural ni gasto sostenido de agua asociado a este componente (a diferencia de las fugas de agua de los artefactos sanitarios). Recordatorio explícito: `defaultSeverity` todavía no preselecciona la UI del formulario de observación (DT-01, deuda transversal reconfirmada en 11AI/11AJ) — este catálogo se diseña correctamente de todas formas, sin diseñar alrededor del bug ni corregirlo en esta fase.

## X. Seguridad

**Permitido**: accionar el control normal del equipo (interruptor, perilla, o esperar su activación automática si tiene sensor), escuchar, observar mientras funciona.

**Prohibido, confirmado en ambas guías**: desmontar la rejilla, introducir dedos u objetos, tocar la hélice/aspas, abrir la carcasa, manipular cableado o componentes eléctricos, subirse a artefactos sanitarios o superficies inseguras para alcanzar el equipo, acceder a ductos o entretecho, generar humo/vapor deliberadamente para probarlo. Ninguna prueba física innecesaria — ni siquiera "acercar la mano sin introducirla" se incluye, porque ninguno de los 2 checks finales lo necesita (Funcionamiento se confirma por vista/oído, no por tacto).

## Y. Guías completas

### `extractor-aire-funcionamiento`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no trata equipos de extracción de baño, y no existe un punto equivalente en el catálogo educativo ITO).
```

### `extractor-aire-ruido-vibracion`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa, redactada con precaución para no convertir el sonido normal de operación en un defecto — sin fuente normativa aplicable.
```

Ambas guías listas para implementación mecánica (crear `TechnicalArticle` + vincular `technicalArticleSlug`), no creadas en BD en esta fase.

## Z. No corresponde

**Ninguno de los 2 checks finales necesita N/A.** Si el componente Extractor existe (el usuario respondió Sí a la pregunta Nivel 2), ambos checks — Funcionamiento y Ruido/vibración — aplican siempre, sin variantes que los hagan opcionales (a diferencia de Campana, donde Iluminación necesita N/A porque no todas las campanas tienen luz incorporada; Extractor de baño no tiene ningún sub-rasgo opcional equivalente entre sus 2 checks finales). Consistente con la instrucción de no introducir N/A solo por variantes menores.

## AA. Referencias visuales

- **Funcionamiento**: NO NECESARIA — encendido/apagado no es comparable por imagen fija.
- **Ruido/vibración**: NO NECESARIA — una imagen fija no comunica sonido, mismo criterio ya aplicado a los 3 checks de Campana en 11AI §P.

Sin candidatos ALTO VALOR ni OPCIONAL para este componente — coincide con la clasificación ya anticipada en 11AJ §AK (Extractor, ambos checks, NO NECESARIA). No se generan imágenes en esta fase.

## AB. Key

**Confirmada: `extractor-aire`.** Libre en catálogo (sección C). Se descarta `extractor-bano` — no es necesario codificar el recinto en la key porque, aunque las 2 revisiones finales se diseñaron pensando en el contexto de Baño, ninguna de las dos depende textualmente de estar en un baño (ambas son sobre el equipo de extracción en sí — encendido y ruido — igual de válidas si mañana se instala en una Bodega o en una Cocina sin ventana). Se descarta también `extractor` a secas (menos descriptivo, podría confundirse con un extractor de otro tipo — de jugos, industrial — sin el calificador "de aire"). `extractor-aire` describe correctamente el componente sin sobre-especificar ni sub-especificar.

## AC. Árbol final

```
Baño
└── Extractor de aire [L2] — extractor-aire
    ├── Funcionamiento — MEDIUM — 🟡 criterio interno — sin N/A
    └── Ruido / vibración — MEDIUM — 🟡 criterio interno — sin N/A
```

## AD. Nivel 2

Actualización conceptual de la rama dentro del árbol ya diseñado en 11AJ §AT (sin rediseñar el resto de Baño):

```
EQUIPAMIENTO DEL RECINTO
├── Ventana [L2] — 7 checks (reutilizado, sin cambios — cerrado desde 11S)
└── Extractor de aire [L2] — 2 checks (nuevo, cerrado en esta fase)
```

Sección y `order` (14) confirmados sin cambios respecto a 11AJ.

## AE. Históricos

Sin exigir cambio del mecanismo diseñado en 11AJ §AL: los baños históricos (`config: null`, sin `cielo`) seguirán protegidos por el mismo ancla `SPACE_LEVEL2_HISTORICAL_ANCHOR.bano = "cielo"` — **no recibirán Extractor automáticamente**, sin onboarding retroactivo ni backfill, exactamente igual que cualquier otro componente Nivel 2 de Baño. Confirmado: cerrar Extractor no introduce ningún caso especial de compatibilidad histórica.

## AF. Evolución futura

Si en V2 aparecen sensor, temporizador, múltiples velocidades o medición de extracción como preguntas propias, pueden incorporarse agregando entradas nuevas a `SPACE_LEVEL2_CONFIG.bano` o checks nuevos a `extractor-aire` sin invalidar el componente V1 — mismo mecanismo genérico ya usado en toda la serie de Cocina (agregar sin romper lo existente). No se diseña schema nuevo para estas posibilidades hipotéticas en esta fase.

## AG. Conteos

Impacto sobre los conteos teóricos de Baño V1 definidos en 11AJ §AO (sin declarar todavía el conteo canónico final de Baño — quedan 6 cierres técnicos pendientes: WC, Lavamanos, Ducha, Mampara, Tina, Mueble de baño):

- **Mínimo** (Extractor en No, junto con las demás 10 decisiones en No): **+0** — sigue en 8 (solo base).
- **Extractor en Sí**: **+2 checks** — confirma exactamente lo proyectado en 11AJ (Extractor 2 checks), sin ajuste.
- **Máximo teórico proyectado** (sin cambios respecto a 11AJ, ya que el conteo de Extractor se confirma idéntico al proyectado): sigue en **45** — a reconfirmar recién cuando los 6 cierres técnicos restantes terminen, por si alguno ajusta su conteo respecto a lo proyectado en 11AJ.

## AH. Riesgos

- **Ambigüedad en baños con extractor+luz combinados en un solo interruptor**: el wording de Funcionamiento ya contempla explícitamente esta variante ("compartido con la luz"), mitigado por diseño.
- **Confusión entre "no tiene sensor" y "no responde"**: mitigado porque el check no exige identificar el tipo de mecanismo, solo el resultado de accionar el control normal (sección J).
- **Percepción de que 2 checks es "poco" comparado con Campana (3 checks)**: aceptado deliberadamente — Campana necesita 3 porque tiene una característica adicional real (iluminación incorporada) que Extractor de baño no tiene típicamente; igualar el conteo por simetría habría sido forzar un check sin base real (Rejilla/tapa fue evaluado y descartado explícitamente por esta razón, sección N).
- **Ninguna fuente 🟢/🟡🟢 disponible**: igual que Campana en Cocina, es un riesgo de percepción ("menos oficial"), no de seguridad — ninguna guía pide una acción insegura.

## AI. Estado final

Extractor de aire de Baño queda completamente cerrado: componente definido (equipo fijo de ventilación mecánica, sin ventana/ventilación natural/calefactor/secador/ventilador portátil), key confirmada (`extractor-aire`, libre en catálogo), pregunta Nivel 2 cerrada, sección confirmada (EQUIPAMIENTO DEL RECINTO, junto a Ventana, `order: 14`), 2 checks exactos con wording final (Funcionamiento, Ruido/vibración), severidades definidas (MEDIUM ambos), fuente clasificada honestamente (🟡 criterio interno puro, sin usar Campana como respaldo técnico), seguridad auditada (sin instrucciones inseguras), 2 guías completas de 7 encabezados listas para implementación mecánica, sin necesidad de N/A, referencias visuales clasificadas (NO NECESARIA ambos checks), históricos confirmados sin cambio de mecanismo, evolución futura contemplada sin diseño de schema prematuro, conteos actualizados (+2 sobre el mínimo, confirmando la proyección de 11AJ).

Ninguna decisión esencial queda abierta.

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AK_CIERRE_TECNICO_EXTRACTOR_AIRE_BANO.md`

Archivos modificados: ninguno.

Código = 0
Prisma = 0
BD = NO
Catálogo = NO
Seed = NO
Commit = NO
Push = NO
Deploy = NO

FASE 11AK — EXTRACTOR DE AIRE DE BAÑO CERRADO TÉCNICAMENTE

DETENERSE. No implementar. No iniciar WC todavía.
