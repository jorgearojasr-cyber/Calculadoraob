# FASE 11AQ — Cierre técnico y editorial de Mueble de Baño / Vanitorio

Fase de auditoría + fuentes + diseño + redacción técnica. Sin cambios de código, Prisma, BD, catálogo, seed, TechnicalArticles en BD, commit, push ni deploy.

## A. Objetivo

Cerrar definitivamente, para Baño V1, el componente Mueble de baño / Vanitorio, y resolver de forma **definitiva** la pregunta arquitectónica que 11AJ había dejado como decisión preliminar: si Cubierta de baño necesita o no un componente propio — aplicando el mismo rigor que ya corrigió esa misma pregunta en Cocina (11Z folded → 11AC independiente).

## B. Estado en 11AJ-11AP

[FASE11AJ_DISENO_CANONICO_BANO_V1.md](FASE11AJ_DISENO_CANONICO_BANO_V1.md) §Y/§Z dejó Mueble de baño como componente nuevo, key `mueble-bano`, Nivel 2, sección ARTEFACTOS SANITARIOS, `order: 20`, Lote F de implementación (el último), 3 checks candidatos preliminares (funcionamiento, fijación, daños visibles **incluyendo su cubierta**) — con Cubierta **folded** dentro de Mueble, decisión explícitamente marcada como "revisable si una futura fase encuentra evidencia real de independencia" (11AJ §Z). Esta fase es exactamente esa revisión.

[FASE11AM_CIERRE_TECNICO_LAVAMANOS_BANO.md](FASE11AM_CIERRE_TECNICO_LAVAMANOS_BANO.md) §O/§S ya estableció: Lavamanos ≠ Mueble de baño (sin dependencia automática en ninguna dirección), y el check de Sello perimetral de Lavamanos evalúa específicamente el encuentro **lavamanos-cubierta/muro** — un punto de frontera que esta fase debe respetar sin duplicar.

[FASE11AN](FASE11AN_CIERRE_TECNICO_DUCHA_BANO.md)/[FASE11AO](FASE11AO_CIERRE_TECNICO_MAMPARA_BANO.md)/[FASE11AP](FASE11AP_CIERRE_TECNICO_TINA_BANO.md) confirman, cada uno con su propia matriz de candidatos y análisis de solapamiento, que el estándar de rigor exigido en esta serie es siempre el mismo: no asumir por simetría, corregir preliminares cuando el análisis lo justifique (WC 3→4, Mampara 2→5, Tina 4→7).

## C. Precedente Cocina — Mueble/Cubierta

Releído [FASE11AC_CIERRE_TECNICO_MUEBLES_COCINA.md](FASE11AC_CIERRE_TECNICO_MUEBLES_COCINA.md) íntegro. Su conclusión central, aplicable como método (no como resultado automático) a esta fase: 11Z (diseño preliminar) había propuesto Cubierta anidada dentro de Muebles de Cocina; 11AC la corrigió a **independiente** tras construir una matriz de casos reales mostrando evidencia en ambas direcciones — muebles aéreos sin cubierta, y cubierta de obra sin muebles bajos — concluyendo que anidarla habría producido tanto falsos positivos como falsos negativos. La corrección no fue automática ni cosmética: fue el resultado de auditar casos reales concretos, no de una preferencia de diseño.

## D. Catálogo (auditoría solo lectura, esta fase)

Confirmado disponible: `mueble-bano`, `vanitorio`, `mueble-vanitorio`, `mueble-lavamanos`, `cubierta-bano`, `cubierta-vanitorio` — **las 6 keys están libres**. `muebles-cocina` y `cubierta-meson` (Cocina) revisados únicamente como precedente de patrón de diseño (sección C), sin asumir reutilización directa de template — confirmado en la sección AO que ninguno de los dos se reutiliza.

## E. Definición del componente (Mueble de baño / Vanitorio)

`mueble-bano` representa: el **cuerpo del mueble**, sus **puertas**, **cajones**, **repisas**, **frentes**, **costados**, **herrajes** (bisagras, correderas, tiradores, amortiguadores), **fijaciones visibles** y **soportes**, cuando existan. **No incluye automáticamente**: Lavamanos (componente independiente, sección J), grifería, sifón, desagüe (todos de Lavamanos), espejo (descartado de V1, 11AJ §X), accesorios (descartados, 11AJ §AA), y — resuelto definitivamente en esta fase, sección K/AM — **Cubierta** (componente propio nuevo, no folded).

## F. Nombre visible

**Confirmado: "Mueble de baño / Vanitorio"** — se descarta "Mueble de baño" solo (pierde reconocibilidad para quien busca "vanitorio", término de uso extendido en el mercado de la construcción chileno) y se descarta "Vanitorio" solo (regionalismo que podría no ser reconocido fuera de ese contexto, la app busca español neutro internacional). El label combinado ya usado en el diseño preliminar de 11AJ se confirma sin cambios — mismo patrón que "WC / Inodoro" (11AL §H).

## G. Key

**Confirmada: `mueble-bano`.** Se descarta `vanitorio` a secas (menos universal como key técnica, aunque válido como parte del label) y `mueble-vanitorio` (redundante, el label ya combina ambos términos, la key no necesita repetirlos). Se confirma explícitamente, a diferencia de `revestimiento-ceramico-piso`/`pintura-muro` (genéricos porque su criterio es de material, transversal a cualquier recinto): este componente **sí** lleva el sufijo `-bano` porque su contexto (mueble específico de zona húmeda, con checks de humedad/hinchamiento propios de esa condición) no es transversal a otros recintos de la misma forma — mismo razonamiento explícito ya usado para `ducha`/`lavamanos`/`mampara`/`tina` en esta serie. **No se reutiliza `muebles-cocina`** (confirmado, sección AO).

## H. Nivel 2

**Decisión: Nivel 2 (configurable), confirmando 11AJ §Y sin reabrir la decisión.** Casos reales legítimos sin mueble: lavamanos pedestal, lavamanos suspendido, baño pequeño sin almacenamiento.

## I. Pregunta Nivel 2

**"¿El baño tiene mueble de baño o vanitorio instalado?"** — confirmada tal como la propuso 11AJ, sin cambios.

## J. Independencia respecto a Lavamanos

**Confirmado explícitamente, sin dependencia automática en ninguna dirección** — mismo principio ya aplicado en toda la serie (Ventana/Extractor, Ducha/Tina, Ducha/Mampara). Lavamanos Sí no implica Mueble Sí (pedestal, suspendido); Mueble Sí no implica Lavamanos Sí (mueble de almacenamiento independiente, sin lavamanos integrado, es un caso físicamente posible aunque menos común). Ambos son componentes Nivel 2 independientes, cada uno con su propio Sí/No.

## K. El problema de Cubierta — auditoría de casos reales

**Análisis dirigido, aplicando el método de 11AC (no su resultado) a los casos reales de Baño:**

| Escenario | Lavamanos | Mueble | Cubierta (¿existe físicamente?) |
|---|---|---|---|
| A. Lavamanos pedestal | Sí | No | No — sin superficie horizontal distinta del propio lavamanos |
| B. Lavamanos suspendido sin mueble | Sí | No | Frecuentemente no, aunque hay modelos con una repisa de apoyo — caso menor |
| C. Vanitorio prefabricado con lavamanos integrado (cubierta y lavamanos son una sola pieza moldeada) | Sí | Sí | Existe, pero es la MISMA pieza física que el lavamanos — su daño ya lo captura el check de Daños de Lavamanos |
| D. Lavamanos sobrepuesto sobre una cubierta de mueble prefabricado (melamina/MDF, misma línea de material que el resto del mueble) | Sí | Sí | Existe, pero es del mismo material y pieza que el cuerpo del mueble — su daño ya lo capturaría el check de Daños del Mueble |
| E. Mueble de obra (albañilería/enchapado) + cubierta de cuarzo/granito/mármol instalada encima (remodelaciones de mayor estándar, caso real y no infrecuente en Chile) | Sí (sobre o bajo la cubierta) | Sí (el cuerpo de obra) | Existe como **pieza física e independiente**, de material distinto (piedra) al cuerpo del mueble (obra/albañilería) — un defecto de la cubierta (trizadura de cuarzo, mal sellado con el muro) es completamente independiente de un defecto del mueble de obra (puerta que no cierra, humedad en el tablero) |
| F. Cubierta de obra (o repisa continua) sin ningún mueble inferior — solo un lavamanos apoyado o empotrado sobre una repisa/mesón abierto, con el espacio inferior abierto sin puertas | Sí | No | Existe, y de forma completamente independiente del mueble (que ni siquiera existe en este caso) |

**Conclusión de la auditoría de casos**: a diferencia de lo que 11AJ concluyó preliminarmente (sin esta matriz explícita), **sí existe evidencia real de independencia en al menos 2 de los 6 escenarios** (E y F) — casos donde Cubierta es una pieza física, de material y origen de instalación distintos, que puede fallar (trizadura de cuarzo, sello con el muro) sin que el mueble falle, y donde el mueble puede no existir en absoluto mientras la cubierta sí. Los escenarios C/D (donde cubierta y mueble/lavamanos son literalmente la misma pieza) no generan overlap real porque, en esos casos, el daño de "la cubierta" ya es indistinguible del daño de "el lavamanos" o "el mueble" — el usuario respondería Cubierta=No en esos casos (no es una pieza diferenciable), sin generar duplicidad.

**Esta auditoría revierte la conclusión preliminar de 11AJ §Z** ("sin evidencia de independencia real en Baño") — la evidencia sí existe cuando se construye la matriz completa de escenarios reales, exactamente el mismo tipo de ejercicio que en Cocina llevó de 11Z (folded) a 11AC (independiente). No se trata de una preferencia de diseño — es la misma metodología aplicada con el mismo rigor, llegando esta vez también a independencia.

## L. Funcionamiento (puertas/cajones)

Check final confirmado. Wording: **"¿Las puertas y cajones del mueble abren, cierran o deslizan correctamente, cuando existan?"** — reutiliza el concepto (no el template) del precedente de Muebles de Cocina, confirmado aplicable sin cambios de contexto: el criterio de apertura/cierre/deslizamiento no depende de la humedad ambiental del baño. Consolida herrajes (bisagras, correderas, tiradores, amortiguadores) dentro del mismo check (sección R) — mismo criterio que Mampara-Funcionamiento (11AO §L) folded herrajes sin copiar la separación de Ventana.

## M. N/A en Funcionamiento

Confirmado: N/A cuando el mueble no tiene ninguna puerta ni cajón (solo repisas abiertas, o un cuerpo fijo sin partes móviles) — el propio wording ("cuando existan") ya lo maneja de forma natural. No se agrega metadata `tienePuertas`/`tieneCajones` solo para evitar este N/A — mismo principio ya aplicado repetidamente en esta serie (descartado explícitamente para WC-tipoDescarga, 11AL §J).

## N. Fijación / estabilidad

Check final confirmado, independiente de Funcionamiento. Wording: **"¿El mueble se siente firme y bien sujeto, sin movimiento evidente al tocarlo suavemente?"** — método de contacto leve únicamente, explícitamente prohibido colgarse, aplicar peso, tirar o sacudir. `defaultSeverity`: **HIGH** — mismo nivel que Muebles de Cocina-Fijación (11AC/11AD), justificado por el mismo motivo: muchos vanitorios de baño se instalan **suspendidos** (anclados solo al muro, sin apoyo en el piso, precisamente para facilitar la limpieza) — un mueble suspendido mal fijado representa un riesgo real de caída, igual que un mueble aéreo de cocina. No se crean variantes de severidad por tipo de instalación (suspendido vs. apoyado) — una única severidad HIGH aplicada de forma uniforme, justificada por el caso de mayor riesgo real, tal como el enunciado exige.

## O. Daños visibles

Check final confirmado, **sin incluir cubierta** (a diferencia del diseño preliminar de 11AJ — ver sección K/AM). Wording: **"¿El mueble presenta golpes, quiebres, rayas profundas, cantos despegados u otros daños visibles?"** — cubre el cuerpo, puertas, cajones, costados y frentes del mueble, sin extenderse a una cubierta que ahora es responsabilidad de su propio componente. `defaultSeverity`: `LOW` — defecto cosmético/de calidad, mismo nivel que Muebles de Cocina-Daños visibles.

## P. Humedad / hinchamiento

Check final confirmado, **independiente de Daños visibles — no fusionado.**

Análisis explícito de la pregunta del enunciado ("¿esto merece estado propio distinto de 'daños visibles'?"): sí — humedad/hinchamiento tiene causa, progresión y acción de seguimiento distintas de un golpe o rayadura. Un daño visible (golpe, quiebre) es un evento puntual ya ocurrido, mientras que hinchamiento/tablero levantado/melamina despegada es un **proceso en curso** que probablemente empeorará si no se identifica y corrige su causa (aunque esta app no diagnostique cuál) — mezclar ambos en un solo check perdería esa distinción real para el usuario y para quien lea el informe después. Wording: **"¿Se observan señales de humedad en el mueble (tablero hinchado, melamina levantada, cantos despegados por humedad, manchas, o moho visible)?"** — incluye moho visible (sección X) dentro del mismo check, sin fragmentar. No diagnostica causa (puede ser fuga, condensación, agua de uso, u otra — el check solo registra el síntoma observable). `defaultSeverity`: `MEDIUM` — proceso activo que probablemente empeora, pero no una fuga de agua en curso (que ya tiene su propio check y severidad HIGH en Lavamanos).

**Regla explícita de coexistencia con Lavamanos-Fugas** (resolviendo la sección 22 del enunciado): ambos checks pueden coexistir con observaciones activas simultáneamente sin ser el mismo defecto duplicado — Lavamanos-Fugas es un síntoma **dinámico** (agua observada durante el uso, en el momento de la inspección), Mueble-Humedad es un síntoma **de material ya afectado** (degradación visible del tablero, que puede persistir incluso si en el momento de la inspección no hay agua corriendo). Un usuario puede legítimamente reportar ambos si observa las dos cosas — no se trata de doble conteo del mismo hallazgo, sino de dos observaciones de naturaleza distinta que, en conjunto, dan una imagen más completa (agua activa + daño material ya causado).

## Q. Interior del mueble

**Confirmado: sin check propio "interior del mueble".** Cualquier daño o humedad visible dentro del mueble (repisas interiores, fondo, laterales internos) ya queda cubierto por los checks de Daños visibles (sección O) y Humedad/hinchamiento (sección P), sin necesitar un check separado solo por la ubicación de la pieza — mismo criterio de no-fragmentación ya aplicado en toda esta serie.

## R. Herrajes

**Confirmado: FOLD dentro de Funcionamiento (sección L), sin check propio** — mismo análisis y misma conclusión que Mampara-Herrajes (11AO §L): una bisagra o corredera floja se manifiesta como "la puerta/cajón no abre/cierra bien", mismo síntoma observable que el check de Funcionamiento ya captura.

## S. Alineación

**Decisión: DESCARTADO, confirmado sin repetir el error de 11Z de Cocina.**

Releída explícitamente la conclusión de 11AC sobre el Manual de Tolerancias cap. 22: sí tiene tolerancias dimensionales de muebles incorporados, pero **las 7 exigen instrumento graduado** (nivel, escuadra, regla, según el punto específico) — ninguna es verificable a simple vista con un criterio objetivo. Esta app V1 no usa instrumentos. Se confirma explícitamente: **ningún check final de Mueble de baño (Funcionamiento, Fijación, Daños, Humedad) se presenta como respaldado por el cap. 22** — los 4 quedan 🟡 criterio interno puro (sección AC), sin inflar ninguno citando el capítulo solo porque existe una fuente fuerte para un concepto adyacente (mismo principio ya aplicado en Ducha, 11AN §AC: "fuente fuerte de un concepto adyacente ≠ licencia para extenderla"). No se crea un check de alineación — un desalineamiento severo de puertas/cajones ya se manifestaría dentro de Funcionamiento (roce, no cierra bien), sin necesitar una medición separada.

## T. Nivelación / horizontalidad

**Decisión: DESCARTADO, mismo razonamiento que Alineación (sección S).** Si existiera Cubierta (ahora componente independiente, sección K), su horizontalidad también sería medible en teoría con el Manual cap. 22, pero requeriría nivel/instrumento — queda fuera del método de esta app. No se inventa una revisión visual de horizontalidad sin poder verificarla objetivamente.

## U. Cubierta — daños

Trasladado íntegramente al nuevo componente Cubierta (sección AM) — **ya no vive dentro de Mueble**. Ver justificación completa en sección K: un daño de cubierta (trizadura de cuarzo, por ejemplo) es observable de forma completamente independiente de si el mueble está en perfecto estado, confirmando que mezclarlos habría ocultado información real al usuario.

## V. Cubierta — sellos

Trasladado íntegramente al nuevo componente Cubierta (sección AM). **Frontera confirmada con Lavamanos-Sello perimetral** (11AM §P, no reabierto): Lavamanos-Sello evalúa el encuentro **lavamanos-cubierta/muro** (el borde inmediato alrededor del lavamanos mismo); el futuro check de Cubierta-Sello (a definir en su propio cierre técnico, 11AR) evaluaría el encuentro **cubierta-muro** en los tramos donde no hay lavamanos (los costados y el fondo de la cubierta contra el muro) — dos ubicaciones físicas distintas del mismo mueble, sin overlap. Mueble de baño (este componente) **no revisa ningún sello** — ni de cubierta ni de ningún otro tipo.

## W. Fugas

**Confirmado: sin check de fugas dentro de Mueble, en ningún caso.** Las fugas pertenecen exclusivamente a Lavamanos (11AM §K) — Mueble solo puede mostrar la **consecuencia visible** de una fuga (humedad/hinchamiento, sección P), nunca el evento de fuga en sí. Regla de coexistencia ya definida en la sección P: ambos síntomas pueden coexistir sin ser un doble conteo del mismo defecto.

## X. Moho

**Confirmado: sin check separado — incluido dentro de Humedad/hinchamiento (sección P), mismo wording.** No se diagnostica causa del moho (puede ser humedad ambiental, fuga, ventilación insuficiente — ninguna determinable por el usuario ni por la app).

## Y. Material y tipo de mueble

**Confirmado: sin metadata para ninguno de los dos.** Material (MDF, melamina, madera, PVC) no cambia ninguna de las 4 revisiones finales — todas son observacionales, aplicables sin importar el material. Tipo de instalación (suspendido, apoyado, con patas, empotrado) tampoco cambia los checks funcionales (Funcionamiento y Daños aplican igual; Fijación ya usa una severidad uniforme que no depende del tipo, sección N) — sin guardar ningún dato adicional.

## Z. Matriz de candidatos

| Candidato | Defecto | ¿Aplica a todos? | Método | Fuente | Solapa con | ¿Merece estado? | Decisión |
|---|---|---|---|---|---|---|---|
| 1. Funcionamiento puertas/cajones | No abre/cierra/desliza bien | No — solo si tiene partes móviles | Accionar y observar | 🟡 criterio interno | Con #6 (herrajes) | Sí, con N/A | **MANTENER** |
| 2. Fijación/estabilidad | Movimiento/inestabilidad del conjunto | Sí | Tocar suave | 🟡 criterio interno | Ninguno | Sí | **MANTENER** |
| 3. Daños visibles | Golpe/quiebre/raya/canto despegado | Sí | Observar | 🟡 criterio interno | Con #9 antes de esta fase (ya no aplica, Cubierta independiente) | Sí | **MANTENER** |
| 4. Humedad/hinchamiento | Tablero hinchado/melamina levantada/manchas | Sí | Observar | 🟡 criterio interno | Con #11 (moho) y con Lavamanos-Fugas (relacionado, no idéntico) | Sí | **MANTENER** |
| 5. Interior | Daño/humedad ubicado dentro del mueble | Sí, pero sin defecto propio distinto | Observar | — | Con #3/#4 | No — mismo defecto, solo distinta ubicación | **DESCARTAR** como check propio, implícito en #3/#4 |
| 6. Herrajes | Bisagra/corredera/tirador floja | Solo si aplica | — | — | Con #1 | No — mismo síntoma que #1 | **FOLD** en #1 |
| 7. Alineación | Desalineamiento de puertas/cajones | Sí | Requiere instrumento para ser objetivo | Manual cap. 22, pero requiere instrumento | Con #1 | No — sin método sin instrumento, se manifiesta en #1 | **DESCARTAR** |
| 8. Nivelación | Horizontalidad de cubierta | N/A (cubierta ya no es de este componente) | Requiere nivel | Manual cap. 22, requiere instrumento | — | No | **DESCARTAR** (y trasladado conceptualmente a la futura Cubierta, también sin adoptar) |
| 9. Cubierta daños | Trizadura/quiebre de la cubierta | N/A (trasladado) | — | — | — | — | **TRASLADADO a componente Cubierta** (sección K/AM) |
| 10. Cubierta sellos | Separación cubierta-muro | N/A (trasladado) | — | — | — | — | **TRASLADADO a componente Cubierta** |
| 11. Fugas | Agua activa | N/A (no pertenece a Mueble) | — | — | Con #4 | No | **DESCARTAR de Mueble** — pertenece a Lavamanos |
| 12. Moho | Moho visible | Sí, cuando ocurre | Observar | — | Con #4 | No — mismo tipo de síntoma que humedad | **FOLD** en #4 |
| 13. Material | (no es un defecto, es una característica) | N/A | — | — | — | No aplica | **SIN METADATA** |
| 14. Tipo de mueble | (no es un defecto, es una característica) | N/A | — | — | — | No aplica | **SIN METADATA** |

**Ningún candidato queda sin decisión.**

## AA. Matriz de solapamiento (análisis dirigido)

| Comparación | ¿Producirían misma foto/comentario/reparación? | Decisión |
|---|---|---|
| Funcionamiento vs. Herrajes | Sí — misma manifestación observable | **Fusionados** |
| Daños vs. Humedad | No — un daño es un evento puntual (golpe), humedad es un proceso en curso con causa/progresión distinta | **Mantenidos independientes** |
| Humedad vs. Fuga de Lavamanos | Relacionados causalmente pero de naturaleza distinta (dinámico vs. material ya afectado) — pueden coexistir sin ser el mismo hallazgo duplicado | **Mantenidos independientes**, con regla de coexistencia explícita (sección P) |
| Daños mueble vs. Daños cubierta | Ya no aplica dentro de este componente — Cubierta es ahora independiente, con su propio check de daños (a definir en 11AR) | **Sin overlap, por separación de componentes** |
| Cubierta sello vs. Sello Lavamanos | Ubicaciones físicas distintas del mismo mueble (cubierta-muro en los tramos sin lavamanos vs. lavamanos-cubierta/muro en el borde inmediato del lavamanos) | **Sin overlap, frontera ya cerrada en 11AM, mantenida** |
| Fijación vs. Alineación | Fijación es sobre movimiento/estabilidad del conjunto anclado; Alineación (descartada) sería sobre desalineamiento geométrico sin instrumento — sin relación real una vez que Alineación se descarta por completo | **Sin conflicto — Alineación descartada** |

## AB. Revisiones finales

**4 checks**, en el extremo superior del rango orientativo (2-4), justificado explícitamente por el propio enunciado ("Baño puede requerir uno adicional por humedad/hinchamiento") — confirmado con análisis, no copiado del enunciado:

1. **Funcionamiento** — "¿Las puertas y cajones del mueble abren, cierran o deslizan correctamente, cuando existan?"
2. **Fijación** — "¿El mueble se siente firme y bien sujeto, sin movimiento evidente al tocarlo suavemente?"
3. **Daños visibles** — "¿El mueble presenta golpes, quiebres, rayas profundas, cantos despegados u otros daños visibles?"
4. **Humedad/hinchamiento** — "¿Se observan señales de humedad en el mueble (tablero hinchado, melamina levantada, cantos despegados por humedad, manchas, o moho visible)?"

## AC. Fuentes

Los 4 checks: **🟡 CRITERIO INTERNO**, sin excepción, ninguno respaldado por el Manual cap. 22 (sección AD) ni por analogía ITO específica (el catálogo educativo ITO nunca desarrolló un punto de "mueble de baño"). Ninguna analogía elevada a fuente normativa.

## AD. Manual de Tolerancias

Confirmado con precisión, reutilizando la lectura íntegra ya hecha en 11V/11AC (sin releer el documento completo de nuevo): el cap. 22 (Muebles) **sí** cubre criterios dimensionales de muebles incorporados, pero **las 7 tolerancias requieren instrumento graduado** (nivel, escuadra, regla) — ninguna es verificable a simple vista con un criterio objetivo, mismo hallazgo ya confirmado en 11AC para Cocina. El Manual **no** cubre funcionamiento, fijación, humedad, golpes ni herrajes de ningún mueble — ninguno de los 4 checks finales de esta fase se atribuye a él. Ningún check final de esta fase usa instrumento — se acepta la conclusión de que los 4 quedan 🟡, sin forzar una fuente que no aplica al método de la app.

## AE. Severidades

- **Funcionamiento**: `MEDIUM` — defecto funcional real, sin riesgo de seguridad inmediato.
- **Fijación**: `HIGH` — riesgo real de caída, especialmente relevante en muebles suspendidos (justificación completa en sección N).
- **Daños visibles**: `LOW` — defecto cosmético/de calidad.
- **Humedad/hinchamiento**: `MEDIUM` — proceso activo con probable progresión, sin ser una fuga de agua en curso.

Sin homogeneizar. Recordatorio explícito: DT-01 (UI preselecciona MEDIUM sin leer `defaultSeverity`) sigue sin corregirse.

## AF. Seguridad

**Permitido**: abrir/cerrar puertas/cajones, observar, tocar suavemente el mueble, revisar visualmente el interior accesible (sin desmontar nada).

**Prohibido, confirmado en las 4 guías**: colgarse del mueble, aplicar peso, desmontar piezas, retirar el lavamanos, aflojar herrajes, usar herramientas, mover el mueble, intervenir conexiones sanitarias (esas son responsabilidad de Lavamanos, no de este componente).

## AG. Guías completas

### `mueble-bano-funcionamiento`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias, cap. 22, cubre solo tolerancias dimensionales que requieren instrumento, no funcionamiento).
```

### `mueble-bano-fijacion`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.
```

### `mueble-bano-danos-visibles`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.
```

### `mueble-bano-humedad`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable.
```

Las 4 guías listas para implementación mecánica, no creadas en BD en esta fase.

## AH. No corresponde

- **Funcionamiento**: N/A cuando el mueble no tiene ninguna puerta ni cajón.
- **Fijación, Daños visibles, Humedad/hinchamiento**: sin N/A — aplican siempre que el componente Mueble exista.

Confirmado: solo 1 de los 4 checks tiene N/A, por la única variante real que efectivamente cambia si el check aplica.

## AI. Referencias visuales

- **Funcionamiento**: NO NECESARIA.
- **Fijación**: NO NECESARIA.
- **Daños visibles**: OPCIONAL/ALTO VALOR.
- **Humedad/hinchamiento**: ALTO VALOR — confirmado explícitamente por el enunciado, es de los defectos más difíciles de describir solo con texto (distinguir hinchamiento real de una sombra o reflejo en foto ayuda mucho con una referencia).

No se generan imágenes en esta fase.

## AJ. Legacy

Confirmado: Mueble de baño **no existe** en `artefactos-sanitarios` histórico (sus 3 checks, ya auditados en toda esta serie, son exclusivamente descarga/fugas-base/goteras-llaves, sin ninguna mención de mueble). Los Baños históricos permanecen con su snapshot congelado y **no reciben Mueble de baño automáticamente** — mismo mecanismo de ancla histórica (`cielo`) ya diseñado en 11AJ, sin caso especial. Sin migración, sin dato histórico que migrar (mismo estado que Mampara, 11AO §AF).

## AK. Arquitectura Lavamanos / Mueble / Cubierta (conclusión definitiva)

| Elemento | ¿Puede existir sin los otros? | Responsabilidad | Checks propios | ¿Componente independiente? |
|---|---|---|---|---|
| **Lavamanos** | Sí — puede existir sin Mueble (pedestal, suspendido) y sin Cubierta (pedestal, suspendido sin encimera) | Cubeta, grifería, agua fría/caliente, fugas propias, fijación del artefacto, sello lavamanos-cubierta/muro | 5 (cerrados en 11AM) | **Sí**, ya cerrado |
| **Mueble de baño / Vanitorio** | Sí — puede existir sin Lavamanos (mueble de almacenamiento) y sin Cubierta (mueble sin superficie diferenciable, o con cubierta integrada del mismo material — escenarios C/D) | Cuerpo, puertas, cajones, herrajes, fijación del mueble, daños del cuerpo, humedad/hinchamiento del material | 4 (cerrados en esta fase) | **Sí**, cerrado en esta fase |
| **Cubierta** | Sí — puede existir sin Mueble (escenario F, cubierta/repisa sin mueble inferior) y su daño es independiente del daño del Mueble (escenario E, cubierta de piedra sobre mueble de obra) | Superficie de la cubierta (material distinto al cuerpo del mueble cuando es diferenciable), su fijación/nivelación observable, su encuentro con el muro | Pendiente — candidatos preliminares en sección AM, cierre técnico completo diferido a 11AR | **Sí** — declarado formalmente en esta fase, **pendiente de cierre técnico propio** |

**Conclusión arquitectónica definitiva**: los 3 elementos son componentes independientes entre sí, sin ninguna dependencia automática. Lavamanos y Mueble quedan completamente cerrados. Cubierta queda declarada como componente necesario, con su arquitectura básica definida (sección AM) pero su cierre técnico detallado (matriz de candidatos, guías completas, severidades) diferido a una fase dedicada.

## AL. Escenarios reales — validación final

Los 6 escenarios de la sección K, revalidados contra la arquitectura de 3 componentes independientes (Lavamanos / Mueble / Cubierta), sin ninguna mentira ni caso no representable:

- **A. Lavamanos pedestal**: Lavamanos Sí, Mueble No, Cubierta No. ✅ Representable.
- **B. Lavamanos suspendido sin mueble**: Lavamanos Sí, Mueble No, Cubierta No (o Sí si tiene una repisa de apoyo diferenciable). ✅ Representable.
- **C. Vanitorio con lavamanos integrado**: Lavamanos Sí, Mueble Sí, Cubierta No (la "cubierta" es la misma pieza que el lavamanos, sin superficie diferenciable que activar). ✅ Representable, sin duplicidad.
- **D. Lavamanos sobre cubierta + mueble**: Lavamanos Sí, Mueble Sí, Cubierta Sí (si la cubierta es de material/pieza distinta al cuerpo del mueble) o Cubierta No (si es la misma línea de material, escenario D original del enunciado). ✅ Representable en ambas variantes reales.
- **E. Mueble de obra + cubierta de piedra**: Lavamanos Sí (o No), Mueble Sí, Cubierta Sí — el caso que forzó la corrección arquitectónica de esta fase. ✅ Representable.
- **F. Cubierta de obra sin mueble**: Lavamanos Sí, Mueble No, Cubierta Sí. ✅ Representable — este es exactamente el escenario que 11Z/11AJ preliminar no podía representar sin generar un falso "Mueble" solo para alojar la cubierta.

Los 6 escenarios se representan sin mentira, sin forzar activaciones falsas y sin duplicidad de hallazgos.

## AM. Decisión final sobre Cubierta

**Respuesta obligatoria del enunciado: B. CUBIERTA REQUIERE COMPONENTE PROPIO.**

Definición preliminar (arquitectura básica, no cierre técnico completo):

- **Label**: "Cubierta de baño" (se descarta "Cubierta / Mesón" copiado literal de Cocina — en Baño el término "mesón" es menos común que en cocina; se prefiere "Cubierta de baño" como label más natural, a confirmar en el cierre técnico dedicado).
- **Key propuesta**: `cubierta-bano` (confirmada libre en catálogo, sección D) — con sufijo `-bano`, a diferencia de `cubierta-meson` de Cocina (sin sufijo de recinto porque comparte contexto con otros recintos), porque este componente vive en un contexto de humedad y de encuentro con Lavamanos que sí es específico de Baño, mismo razonamiento ya aplicado a `mueble-bano` (sección G).
- **Nivel 2**: Sí, Sí/No — pregunta candidata: "¿El baño tiene una cubierta o mesón de vanitorio instalado (de material distinto al mueble, como piedra, cuarzo o similar)?" — wording candidato que intenta capturar específicamente los escenarios E/F sin activarse falsamente en C/D, a refinar en el cierre técnico dedicado.
- **Sección**: ARTEFACTOS SANITARIOS, junto al resto de componentes sanitarios de Baño.
- **Frontera con Lavamanos** (ya resuelta, no reabrible): Lavamanos conserva su propio check de Sello (lavamanos-cubierta/muro, en el borde inmediato del artefacto) — Cubierta evaluaría el sello cubierta-muro en el resto del perímetro, sin overlap (sección V).
- **Frontera con Mueble** (ya resuelta en esta fase, no reabrible): Mueble no revisa ningún aspecto de la cubierta — cuerpo, puertas, cajones, fijación y humedad del mueble son exclusivamente del cuerpo del mueble, nunca de la superficie de la cubierta.
- **Checks candidatos preliminares** (no cerrados, solo orientativos para dimensionar el próximo cierre): daños visibles de la superficie (trizaduras, quiebres — material distinto al mueble, ej. piedra), fijación/nivelación observable, sello con el muro. Probablemente 2-4 checks, similar en magnitud a Cubierta/Mesón de Cocina (2 checks) pero sin copiar ese conteo sin análisis propio.
- **Requiere cierre técnico específico adicional**: **Sí, confirmado** — con su propia matriz de candidatos, análisis de solapamiento, fuentes por check, severidades justificadas, guías completas de 7 encabezados y seguridad, exactamente el mismo nivel de rigor que recibieron Extractor/WC/Lavamanos/Ducha/Mampara/Tina/Mueble.

## AN. Impacto en la lista de cierres

**Baño V1 todavía requiere: FASE 11AR — cierre técnico de Cubierta de baño**, antes de poder consolidar la arquitectura completa y declarar Baño V1 funcionalmente cerrado (equivalente al momento en que 11AI cerró Cocina V1, después de que los 5 lotes de Cocina, incluida la corrección Mueble/Cubierta de 11AC, ya estuvieran completos). No se fuerza el cierre del catálogo de componentes especiales en 7 solo por mantener el número originalmente anticipado — el enunciado mismo lo prohíbe explícitamente, y hacerlo replicaría exactamente el error que 11Z cometió en Cocina (asumir sin evidencia que Cubierta no necesitaba independencia).

## AO. Key final (Mueble)

**Confirmada: `mueble-bano`** (sección G, sin cambios). No se reutiliza `muebles-cocina` — confirmado explícitamente: aunque el patrón conceptual es análogo (mueble con puertas/cajones), el contexto (humedad, checks de hinchamiento propios de zona húmeda) y ahora también la separación de Cubierta (que en Cocina permanece independiente pero con un patrón de diseño distinto al que tendrá Cubierta de baño) hacen que compartir template mezclaría poblaciones de casos reales distintas sin necesidad real de reutilización de catálogo.

## AP. Árbol final

```
Baño
├── Mueble de baño / Vanitorio [L2] — mueble-bano
│   ├── Funcionamiento — MEDIUM — 🟡 criterio interno (N/A si sin puertas/cajones)
│   ├── Fijación — HIGH — 🟡 criterio interno
│   ├── Daños visibles — LOW — 🟡 criterio interno
│   └── Humedad/hinchamiento — MEDIUM — 🟡 criterio interno
│
└── Cubierta de baño [L2] — cubierta-bano — PENDIENTE DE CIERRE TÉCNICO (11AR)
    ├── (checks candidatos preliminares, no cerrados)
    └── (fuentes/severidades a definir en 11AR)
```

## AQ. Nivel 2

Actualización conceptual de la rama dentro del árbol ya diseñado en 11AJ §AT (sin rediseñar el resto de Baño):

```
ARTEFACTOS SANITARIOS
├── WC / Inodoro [L2] — 4 checks (cerrado, 11AL)
├── Lavamanos [L2] — 5 checks (cerrado, 11AM)
├── Ducha [L2] — 6 checks (cerrado, 11AN)
├── Mampara [L2] — 5 checks (cerrado, 11AO)
├── Tina [L2] — 7 checks (cerrado, 11AP)
├── Mueble de baño / Vanitorio [L2] — 4 checks (nuevo, cerrado en esta fase)
└── Cubierta de baño [L2] — pendiente de cierre técnico (11AR) — NUEVO en la lista de Nivel 2, no anticipado en la sección AF de 11AJ
```

**10 decisiones Nivel 2 en total** (9 ya cerradas técnicamente + Cubierta pendiente), no las 9 originalmente proyectadas en 11AJ §AF — ajuste explícito y justificado por la corrección arquitectónica de esta fase. `order` conceptual de Mueble: 20 (confirmado, sin cambios respecto a 11AJ). `order` conceptual de Cubierta: 21 (nuevo, a confirmar en 11AR). Sin `metaOptions` para Mueble.

## AR. Conteos

Impacto sobre los conteos teóricos de Baño V1 (base 8 + Extractor 2 + WC 4 + Lavamanos 5 + Ducha 6 + Mampara 5 + Tina 7, acumulado 64 tras 11AP):

- **Mueble en No**: +0.
- **Mueble en Sí**: **+4 checks** — 1 más de lo proyectado preliminarmente en 11AJ (que estimó 3, incluyendo cubierta folded). Ajuste honesto: 3 checks del diseño preliminar (Funcionamiento, Fijación, Daños — este último ahora sin cubierta) se mantienen, y se agrega Humedad/hinchamiento como cuarto check nuevo, mientras que los checks de cubierta se trasladan íntegramente al nuevo componente Cubierta.
- **Máximo teórico actualizado, SIN Cubierta todavía**: 64 (tras 11AP) + 4 (Mueble) = **68**.
- **NO se cierra el conteo canónico final de Baño en esta fase** — falta sumar Cubierta, cuyo conteo exacto de checks queda pendiente del cierre técnico de 11AR (estimado preliminar 2-4 checks adicionales, sin comprometer una cifra final).

## AS. Riesgos

- **Confusión Lavamanos/Mueble**: mitigada por independencia explícita sin dependencia automática (sección J), mismo patrón validado en toda la serie.
- **Confusión Mueble/Cubierta**: mitigada por la separación explícita de responsabilidades (sección AK) y la frontera de sellos ya resuelta (sección V) — riesgo remanente acotado al cierre técnico de 11AR, que deberá mantener esta frontera sin reabrirla.
- **Humedad causada por fuga**: resuelto con la regla de coexistencia explícita entre Mueble-Humedad y Lavamanos-Fugas (sección P/W) — ambos síntomas pueden coexistir sin duplicar el mismo hallazgo.
- **Variantes suspendido/apoyado**: resuelto con severidad uniforme (HIGH) justificada por el caso de mayor riesgo real (sección N), sin crear variantes.
- **Partes móviles opcionales**: resuelto con N/A explícito en Funcionamiento (sección M).
- **Fuente no normativa**: aceptado explícitamente — 4 checks 🟡, ninguno inflado, Manual cap. 22 confirmado sin aplicabilidad práctica (requiere instrumento).
- **Legacy**: sin dato histórico que migrar (mismo estado que Mampara).
- **Riesgo de repetir el error de Cocina**: explícitamente evitado — esta fase corrigió la conclusión preliminar de 11AJ con la misma auditoría de casos reales que 11AC usó en Cocina, en vez de asumir por comodidad que Baño era distinto sin evidencia.

## AT. Estado final

Mueble de baño / Vanitorio queda completamente cerrado: componente definido (cuerpo, puertas, cajones, herrajes, fijación; excluye Lavamanos, Cubierta —ahora independiente—, espejo, accesorios), key confirmada (`mueble-bano`, libre en catálogo, sin reutilizar `muebles-cocina`), Nivel 2 confirmado (configurable, pregunta "¿El baño tiene mueble de baño o vanitorio instalado?"), 4 checks exactos con wording final (Funcionamiento, Fijación, Daños visibles, Humedad/hinchamiento), severidades definidas y justificadas (MEDIUM/HIGH/LOW/MEDIUM, sin homogeneizar), fuentes clasificadas honestamente (4× 🟡, Manual cap. 22 confirmado sin aplicabilidad — requiere instrumento, mismo hallazgo que 11AC), seguridad auditada, 4 guías completas de 7 encabezados listas para implementación mecánica, N/A definido con precisión (1 de 4 checks), referencias visuales clasificadas, legacy confirmado sin dato histórico que migrar.

**Sin embargo, la auditoría de casos reales de esta fase (sección K) revirtió la conclusión preliminar de 11AJ §Z y determinó que Cubierta de baño SÍ requiere un componente propio** — declarado formalmente (sección AM) con arquitectura básica definida, pero su cierre técnico detallado queda diferido a una fase dedicada (11AR), exactamente el mismo tipo de rigor que Cocina exigió para su propia Cubierta. Baño V1 no puede consolidarse todavía como arquitectura completa mientras ese cierre esté pendiente.

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AQ_CIERRE_TECNICO_MUEBLE_BANO.md`

Archivos modificados: ninguno.

Código = 0
Prisma = 0
BD = NO
Catálogo = NO
Seed = NO
Commit = NO
Push = NO
Deploy = NO

FASE 11AQ — MUEBLE DE BAÑO / VANITORIO CERRADO TÉCNICAMENTE
🟡 BAÑO V1 REQUIERE CIERRE TÉCNICO ADICIONAL DE CUBIERTA

DETENERSE. No implementar.
