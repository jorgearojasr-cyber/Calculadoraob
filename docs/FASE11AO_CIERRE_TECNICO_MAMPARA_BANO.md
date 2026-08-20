# FASE 11AO — Cierre técnico y editorial de Mampara de Baño

Fase de auditoría + fuentes + diseño + redacción técnica. Sin cambios de código, Prisma, BD, catálogo, seed, TechnicalArticles en BD, commit, push ni deploy.

## A. Objetivo

Cerrar definitivamente, para Baño V1, el componente Mampara: definición, key, Nivel 2, checks exactos, fuentes, severidades, seguridad (con foco especial en vidrio), guías completas, referencias visuales, y frontera explícita e inequívoca con Ducha (ya cerrada en 11AN, no reabierta) y con Tina (adelanto para 11AP) — sin implementar.

## B. Estado en 11AJ / 11AN

[FASE11AJ_DISENO_CANONICO_BANO_V1.md](FASE11AJ_DISENO_CANONICO_BANO_V1.md) §W dejó Mampara como componente nuevo, key `mampara`, Nivel 2, sección ARTEFACTOS SANITARIOS, `order: 19`, Lote D de implementación (junto con Ducha), 2 checks candidatos preliminares (Funcionamiento, Firmeza y sello combinados), `defaultSeverity` MEDIUM y LOW propuestos — diseño compacto explícitamente mirando el patrón de Cubierta/Mesón de Cocina. Esta fase profundiza ese diseño preliminar con el nivel de detalle exigido (matriz de candidatos completa, frontera explícita con Ducha, tratamiento específico de vidrio) y puede ajustar el conteo si el análisis lo justifica — mismo patrón ya visto en 11AL (WC pasó de 3 a 4 checks) y 11AN (Ducha confirmó 6 sin cambio).

[FASE11AN_CIERRE_TECNICO_DUCHA_BANO.md](FASE11AN_CIERRE_TECNICO_DUCHA_BANO.md) §I ya cerró la frontera desde el lado de Ducha, de forma explícita y no reabrible: Ducha **no incluye** apertura/cierre de mampara, fijación de mampara, daños de vidrio, herrajes de mampara, ni el sello propio de la mampara. El sello que Ducha sí conserva es el del receptáculo/plato con el muro (una superficie física distinta). Esta fase (11AO) construye Mampara respetando esa frontera al pie de la letra, sin volver a evaluarla desde cero.

## C. Catálogo (auditoría solo lectura, esta fase)

Confirmado disponible: `mampara`, `mampara-bano`, `mampara-ducha`, `cerramiento-ducha` — **las 4 keys están libres**. Ningún `InspectionElementTemplate` ni `TechnicalArticle` existente trata vidrio, herrajes de cerramiento, correderas ni sellos de mampara — no hay contenido histórico de `artefactos-sanitarios` relacionado (confirmado, sus 3 checks ya auditados en 11AJ/11AL/11AM/11AN son exclusivamente descarga/fugas/goteras, sin mención de mampara). El único precedente indirecto disponible en el catálogo es `ventana` (apertura/cierre, manilla/herrajes, sello hoja-marco, daños de vidrio, sello marco-muro, daños de marco) — auditado explícitamente en la sección N como analogía de diseño, no como fuente ni como template a reutilizar.

## D. Definición del componente

`mampara` representa: un **cerramiento fijo y/o móvil** instalado en la zona de ducha, tina con ducha, o zona húmeda equivalente — puede ser panel fijo, hoja abatible, hoja corredera, o combinación de panel fijo + hoja móvil, incluyendo sus **perfiles**, **guías/rieles** cuando existan, **herrajes** (bisagras, ruedas, manillas), y **sellos propios del cerramiento**. **No incluye**: cortina de baño (no es un cerramiento fijo, no aplica el componente — el usuario simplemente responde "No" a la pregunta Nivel 2), muro fijo de obra (no es mampara, es parte de la construcción del recinto), grifería, receptáculo, cerámica ni desagüe (todos ya asignados a Ducha o a componentes transversales).

## E. Nivel 2

**Decisión: Nivel 2 (configurable), confirmando 11AJ §W sin reabrir la decisión.** Mismo razonamiento ya aplicado en cada componente sanitario de esta serie: existen casos reales legítimos sin mampara (ducha abierta, cortina) que la arquitectura debe representar honestamente.

## F. Pregunta Nivel 2

**"¿El baño tiene mampara instalada?"** — confirmada tal como la propuso 11AJ, sin cambios.

## G. Independencia de Ducha

**Confirmado explícitamente, sin dependencia automática en ninguna dirección.** Ducha Sí no implica Mampara Sí (la mayoría de las duchas reales en Chile usan cortina o quedan abiertas, no mampara) — y Mampara Sí no implica que Ducha deba estar activa como componente, porque la mampara podría estar asociada a una Tina sin ducha propia (una tina con mampara fija, sin rociador ni grifería de ducha independiente, es un caso físicamente posible aunque menos común). La configuración representa existencia física real de cada pieza, sin inferencias automáticas entre componentes — mismo principio arquitectónico ya aplicado a Ventana/Extractor (11AK §H) y a Ducha/Tina (11AN §H).

## H. Relación con Tina

Mampara se diseña con checks **suficientemente genéricos para aplicar tanto sobre ducha como sobre tina** — ninguno de los 5 checks finales (sección X) asume la existencia de un plato de ducha específico; todos hablan del "cerramiento" en términos que aplican igual si está instalado sobre un receptáculo de ducha o sobre el borde de una tina. **Frontera explícita para 11AP** (adelanto, para no reabrir Mampara en esa futura fase): una mampara sobre tina sigue siendo evaluada íntegramente por el componente Mampara — Tina no absorbe ni duplica ninguno de sus checks; Tina evaluará únicamente el cuerpo del artefecto (firmeza, daños de superficie, fugas propias en su base/desagüe, sello de la tina con el muro), nunca el cerramiento que eventualmente tenga instalado encima.

## I. Tipo de mampara

**Decisión: NO se guarda el tipo como metadata — Opción B del enunciado (un check de funcionamiento con N/A en mampara fija).**

Análisis explícito de las 4 alternativas: (A) `componentMeta.tipo` fue descartado porque el único check que realmente varía según el tipo es Funcionamiento (una mampara 100% fija no tiene nada que abrir/cerrar) — y ese único caso ya se resuelve con N/A simple, sin necesitar que el usuario clasifique su mampara en una categoría técnica (fija/corredera/abatible/plegable) antes de poder continuar; (D) un modelado distinto (por ejemplo, dos componentes separados "Mampara fija" y "Mampara móvil") se descarta por sobre-ingeniería — sería crear dos templates para resolver un problema que un solo N/A ya resuelve limpiamente. Se confirma (B): un check de Funcionamiento con N/A explícito para mampara completamente fija (sección J), sin guardar el tipo en ningún lado — consistente con el principio ya aplicado repetidamente en esta serie ("no agregar metadata si solo evita un N/A razonable", ya usado para descartar `tipoDescarga` en WC, 11AL §J).

## J. Apertura / cierre

Check final confirmado (bajo el nombre "Funcionamiento", ver sección X — incluye también Rieles y Herrajes, secciones K/L). Wording: **"Si la mampara tiene alguna hoja móvil (corredera, abatible o plegable), ¿abre, cierra o desliza correctamente, sin atascarse ni forzar?"** — el propio wording aclara que corresponde "No corresponde" cuando la mampara es 100% fija (sin ninguna hoja móvil). Cubre corredera, abatible y plegable en una sola pregunta agnóstica al mecanismo específico — no exige distinguir cuál tipo de movimiento tiene, solo si funciona con normalidad.

## K. Guías / rieles

**Decisión: FOLD dentro de Funcionamiento (sección J), sin check propio.** Análisis: un riel con roce, una guía que se salió de su carril, o un atasco en el desplazamiento, producen exactamente el mismo síntoma observable que "la mampara no abre/cierra bien" — misma foto, mismo comentario, misma acción de registro. Crear un check separado de "rieles" fragmentaría un mismo defecto funcional en dos revisiones sin aportar información nueva al usuario.

## L. Herrajes

**Decisión: FOLD dentro de Funcionamiento (sección J), sin check propio — explícitamente sin copiar el precedente de Ventana.**

Análisis explícito de por qué NO se replica la separación que Ventana sí tiene (funcionamiento general + manilla/herrajes como checks distintos): Ventana separa esos dos conceptos porque una ventana puede abrir/cerrar con normalidad pero tener una manilla floja o unos herrajes que cuestan accionar de forma perceptiblemente distinta al movimiento general de la hoja — es una distinción justificada por la complejidad mecánica de una ventana (bisagras + manilla + mecanismo de cierre, con más piezas independientes). Una mampara tiene una complejidad mecánica menor — sus herrajes (bisagras, ruedas, manilla) existen puramente para permitir la apertura/cierre, y una falla en cualquiera de ellos se manifiesta exactamente como "la mampara no abre/cierra bien" — no hay un segundo síntoma observable distinto que justifique una revisión propia. Se descarta copiar Ventana automáticamente (tal como el enunciado exige verificar) y se confirma la fusión.

## M. Fijación / estabilidad

Check final confirmado, independiente de Funcionamiento. Wording: **"¿La mampara se ve firme y estable, sin movimientos o piezas sueltas al tocarla suavemente?"** — aplica igual a panel fijo, hojas móviles y perfiles en conjunto. Método: contacto suave únicamente — explícitamente prohibido empujar fuerte, colgarse, sacudir o aplicar peso corporal (mismo nivel de cuidado que el resto del catálogo). Representa un defecto distinto de Funcionamiento: una mampara puede abrir/cerrar perfectamente y aun así estar mal anclada al muro o al receptáculo (riesgo real si empeora, dado que es una pieza de vidrio en una zona de piso mojado). `defaultSeverity`: MEDIUM (ver justificación diferenciada de Daños visibles en sección AB).

## N. Vidrio — daños

Check final confirmado. Wording: **"¿Los vidrios de la mampara presentan trizaduras, quiebres u otros daños visibles (incluidas rayas profundas)?"** — incluye rayas profundas en el mismo check (sección O), y se extiende también a perfiles dañados (sección S) bajo el mismo check ampliado a "Daños visibles" (ver sección X, wording final consolidado). No se pide identificar tipo de vidrio (templado, laminado), espesor, ni ninguna característica técnica del material — solo observación de daño visible. Ninguna guía pide golpear el vidrio, comprobar su resistencia, ni aplicar carga para "probarlo" — sección AA.

## O. Vidrio — rayas

**Decisión: FOLD dentro de Daños visibles (sección N), confirmado — no se crean 3 checks (trizaduras + rayas + golpes) como el enunciado advertía explícitamente evitar.** Una raya profunda es, para efectos de esta app, un defecto de la misma naturaleza que una trizadura o un golpe — daño visible en el material — y el usuario documentaría los 3 con el mismo tipo de foto y comentario.

## P. Alineación

**Decisión: FOLD dentro de Funcionamiento (sección J), sin check geométrico separado — confirmado sin fuente ni tolerancia objetiva.** Un desalineamiento de hojas o un espacio irregular entre paneles, si es severo, ya se manifiesta como "no cierra bien" o "roza" dentro del check de Funcionamiento — no existe una tolerancia de milímetros ni un método de medición simple que el usuario pueda aplicar de forma objetiva (a diferencia de Ventana, donde 11S sí encontró una fuente específica — CDT Ficha 13, paralelismo ±2mm — para el paralelismo hoja/marco; ninguna fuente equivalente existe para mampara). No se inventa una tolerancia de alineación sin respaldo.

## Q. Sellos propios de mampara

Check final confirmado, distinto y sin overlap con el sello que Ducha conserva (receptáculo-muro, 11AN §T). Wording: **"¿Los sellos visibles de la mampara (perfiles contra el muro o el receptáculo, uniones entre paneles) se ven continuos, sin separaciones ni grietas?"** — deliberadamente agnóstico al sistema de sellado usado (silicona, burletes, perfiles, juntas magnéticas), sin exigir un sistema específico. Fuente: 🟡 criterio interno (analogía con sellos ya usados en el resto del catálogo — ver sección Z, analogía explícitamente NO fuente).

## R. Filtración de agua

**Decisión: check final independiente, no folded dentro de Sellos — mismo criterio de separación estático/dinámico ya aplicado por Ducha entre su check de Sello y su check de Fugas (11AN, secciones N/T).**

Análisis: un sello puede verse visualmente continuo y aun así dejar pasar algo de agua durante el uso real (un defecto no siempre visible en reposo), y viceversa, una separación visible menor podría no traducirse en filtración real perceptible — son dos observaciones potencialmente distintas (una estática/visual, otra dinámica/funcional), igual que Ducha mantuvo Sello y Fugas como checks separados por el mismo tipo de razonamiento. Wording: **"Durante el uso normal de la ducha, ¿se observa agua saliendo fuera de la mampara (más allá de salpicaduras normales)?"** — el wording aclara explícitamente "más allá de salpicaduras normales" para no convertir el humedecimiento cotidiano esperable (agua que salpica el perfil inferior durante el uso, normal en cualquier mampara) en un falso defecto. **Método explícitamente prohibido**: no se dirige el chorro deliberadamente contra las juntas ni se realiza una prueba agresiva — la observación ocurre durante el uso normal de la ducha (mismo método ya usado por Ducha-Evacuación, 11AN §R), nunca como una prueba forzada. Fuente: 🟡 criterio interno puro.

## S. Perfiles

**Decisión: FOLD dentro de Daños visibles (sección N), ampliando su alcance — confirmado, sin check separado.** Deformaciones, piezas sueltas o golpes en los perfiles son daños de la misma naturaleza observable que los daños de vidrio — mismo tipo de foto/comentario. El wording final del check (sección X) se amplía explícitamente para cubrir "vidrio y perfiles" en conjunto, evitando fragmentar en 2 checks lo que es un mismo tipo de defecto (daño físico visible) en 2 materiales distintos de la misma pieza.

## T. Corrosión

**Decisión: sin check propio — cubierta implícitamente dentro de Daños visibles (sección N/S) cuando sea observable, sin mención explícita en el wording.** Confirmado: no se crea un check dedicado a oxidación/corrosión — depende demasiado de material, uso y antigüedad para ser un defecto de instalación atribuible de forma confiable en una vivienda nueva, y cualquier corrosión visible ya cabría razonablemente dentro de "daños visibles" en los perfiles sin necesitar nombrarla aparte.

## U. Manilla

**Decisión: FOLD dentro de Funcionamiento (sección J/L), confirmado — sin check por pieza.** Ya resuelto en la sección L (Herrajes) — una manilla floja o que no responde ya se manifiesta como "la mampara no abre/cierra bien" dentro del check de Funcionamiento.

## V. Matriz de candidatos

| Candidato | Defecto | ¿Aplica a todas? | Método | Fuente | Solapa con | ¿Merece estado? | Decisión |
|---|---|---|---|---|---|---|---|
| 1. Apertura/cierre | Hoja móvil no abre/cierra/desliza | No — solo mamparas con hoja móvil | Accionar y observar | 🟡 criterio interno | Con #2/#3 (mismo síntoma) | Sí, con N/A | **MANTENER** — check "Funcionamiento", con N/A para panel 100% fijo |
| 2. Guías/rieles | Roce, atasco, salida de carril | Solo si aplica | — | — | Con #1 | No — mismo síntoma que #1 | **FOLD** en #1 |
| 3. Herrajes | Bisagra/rueda/manilla floja o que no responde | Solo si aplica | — | — | Con #1 | No — mismo síntoma que #1 | **FOLD** en #1 |
| 4. Fijación/estabilidad | Movimiento/pieza suelta del conjunto | Sí | Tocar suave | 🟡 criterio interno puro | Ninguno | Sí | **MANTENER** |
| 5. Daños de vidrio | Trizadura/quiebre/golpe en el vidrio | Sí | Observar | 🟡 criterio interno puro | Con #6/#10 | Sí | **MANTENER** — check "Daños visibles" |
| 6. Rayas | Rayas profundas en el vidrio | Sí | Observar | 🟡 criterio interno puro | Con #5 | No — mismo tipo de defecto | **FOLD** en #5 |
| 7. Alineación | Desalineamiento entre hojas/paneles | Sí | — | Sin tolerancia disponible | Con #1 | No — sin fuente, se manifiesta en #1 | **FOLD** en #1 (sin nombrarlo) |
| 8. Sellos | Separación visible en el sello del cerramiento | Sí | Observar | 🟡 criterio interno (analogía) | Con #9 (relación causal, no síntoma idéntico) | Sí | **MANTENER** |
| 9. Filtración | Agua saliendo del cerramiento en uso normal | Sí | Usar y observar | 🟡 criterio interno puro | Con #8 (relacionado, no idéntico) | Sí | **MANTENER** |
| 10. Perfiles | Deformación/golpe en perfiles | Sí | Observar | 🟡 criterio interno puro | Con #5 | No — mismo tipo de defecto (daño visible) | **FOLD** en #5, ampliando su alcance |
| 11. Corrosión | Oxidación visible | No — depende de material/uso/antigüedad | Observar | Sin fuente propia | Con #5/#10 | No — sin check dedicado | **DESCARTAR** como check propio, implícito en #5 si observable |
| 12. Manilla | Manilla floja/no responde | Solo si aplica | — | — | Con #1/#3 | No | **FOLD** en #1 |

**Ningún candidato queda sin decisión.**

## W. Matriz de solapamiento (análisis dirigido)

| Comparación | ¿Producirían misma foto/comentario/reparación? | Decisión |
|---|---|---|
| Apertura vs. Rieles vs. Herrajes vs. Alineación | Sí — los 4 se manifiestan como "no abre/cierra/desliza bien" desde la perspectiva del usuario | **Fusionados en 1 solo check, "Funcionamiento"** |
| Fijación vs. Perfiles | No — Fijación es sobre el movimiento/estabilidad del conjunto anclado, Perfiles (dentro de Daños) es sobre daño físico visible en la pieza — un perfil puede estar dañado sin que la mampara se mueva, y viceversa | **Mantenidos en checks distintos** (Fijación independiente; Perfiles folded en Daños visibles, no en Fijación) |
| Sellos vs. Filtración | Parcialmente relacionados causalmente, pero uno es observación estática (¿se ve una separación?) y el otro dinámica (¿sale agua realmente durante el uso?) — mismo tipo de distinción que Ducha ya validó entre su Sello y sus Fugas | **Mantenidos independientes** |
| Vidrio vs. Rayas | Sí — mismo tipo de defecto (daño visible en el vidrio) | **Fusionados** |

## X. Revisiones finales

**5 checks**, dentro del rango orientativo de 3-5:

1. **Funcionamiento** — "Si la mampara tiene alguna hoja móvil (corredera, abatible o plegable), ¿abre, cierra o desliza correctamente, sin atascarse ni forzar?" (incluye rieles, herrajes, manilla y alineación; N/A para mampara 100% fija).
2. **Fijación** — "¿La mampara se ve firme y estable, sin movimientos o piezas sueltas al tocarla suavemente?"
3. **Daños visibles** — "¿Los vidrios o perfiles de la mampara presentan trizaduras, quiebres, rayas profundas u otros daños visibles?" (vidrio y perfiles combinados, incluye rayas y deformaciones/corrosión visible).
4. **Sellos** — "¿Los sellos visibles de la mampara (perfiles contra el muro o el receptáculo, uniones entre paneles) se ven continuos, sin separaciones ni grietas?"
5. **Filtración** — "Durante el uso normal de la ducha, ¿se observa agua saliendo fuera de la mampara (más allá de salpicaduras normales)?"

## Y. Fuentes

Los 5 checks: **🟡 CRITERIO INTERNO**, sin excepción. Ninguno tiene analogía ITO disponible (el catálogo educativo ITO nunca desarrolló un punto de "mampara" — confirmado por ausencia, sin inventar una analogía forzada). La analogía con Ventana (apertura/cierre, herrajes, sello, daños de vidrio/marco) es **explícitamente de diseño/UX, no de fuente** — confirmado sin ambigüedad, tal como exige el enunciado ("analogía con Ventana ≠ fuente directa").

## Z. Manual de Tolerancias

Confirmado explícitamente, reutilizando la auditoría íntegra ya hecha en 11V (sin releer el documento completo de nuevo): el Manual **no** tiene ningún capítulo aplicable a mamparas, vidrios de cerramiento, herrajes de cerramiento, ni sellos de zona húmeda de este tipo — su Ficha 13 (Ventanas) cubre vidrios y sellos de **ventanas**, un elemento constructivo distinto (parte de la envolvente del edificio, con criterios de estanqueidad al exterior), no un cerramiento interior de ducha. **No se transfieren** automáticamente los requisitos de Ventana (paralelismo ±2mm, EN-12543/EN-1279/EN-1096, NCh 2496) a Mampara — ninguno de esos umbrales fue diseñado ni validado para este contexto, y hacerlo inventaría un respaldo normativo inexistente. Ninguna tolerancia de separación, verticalidad, holgura ni alineación se inventa en esta fase.

## AA. Seguridad del vidrio

**Confirmado explícitamente**: ninguna guía final pide golpear el vidrio, comprobar su resistencia, intentar identificar si es templado o laminado rompiéndolo o de cualquier otra forma, desmontar el panel, ni aplicar carga o presión para "probarlo". La app **no afirma** que el vidrio "debe ser templado" — no existe una fuente/regulación específica validada para este proyecto que permita exigirlo, y afirmarlo sin esa base sería inventar un requisito normativo. Toda revisión de vidrio en esta fase es puramente de **inspección visual y operación normal** — mismo nivel de exigencia que el resto del catálogo.

**Permitido**: accionar la hoja móvil con normalidad, observar visualmente vidrio/perfiles/sellos, tocar suavemente para evaluar fijación, usar la ducha con normalidad para observar filtración.

**Prohibido**: desmontar el panel, aplicar fuerza o peso corporal, golpear o forzar el vidrio deliberadamente, dirigir el chorro de agua agresivamente contra las juntas, retirar herrajes, usar herramientas.

## AB. Severidades

- **Funcionamiento**: `MEDIUM` — defecto funcional real (atascamiento, dificultad de uso), sin riesgo de seguridad inmediato en sí mismo.
- **Fijación**: `MEDIUM` — riesgo real si empeora (un panel de vidrio inestable puede eventualmente caer), pero se mantiene en MEDIUM y no HIGH porque, mientras el vidrio está intacto y solo hay "movimiento perceptible al tocar suavemente", el riesgo es de progresión futura, no un peligro ya materializado.
- **Daños visibles**: `HIGH` — a diferencia de Fijación, un vidrio ya trizado o quebrado es un **riesgo de seguridad activo y presente** (posibilidad real de astillamiento/corte), no una proyección a futuro — justifica una severidad mayor que el resto de los "daños visibles" del catálogo de Baño (que en WC/Lavamanos/Ducha/receptáculo se mantuvieron en LOW por ser defectos cosméticos sin riesgo de corte). Diferenciación explícita y justificada, no homogeneizada con el patrón general de "daños visibles = LOW" del resto del catálogo.
- **Sellos**: `MEDIUM` — mismo criterio que el resto de sellos del catálogo.
- **Filtración**: `MEDIUM` — agua saliendo del cerramiento es un problema real (humedad fuera de la zona húmeda) pero no una fuga de instalación sanitaria (ya cubierta por Ducha con severidad HIGH) — se diferencia deliberadamente de Ducha-Fugas por naturaleza distinta del defecto.

Recordatorio explícito: DT-01 (UI preselecciona MEDIUM sin leer `defaultSeverity`) sigue sin corregirse — este catálogo se diseña correctamente de todas formas.

## AC. Guías completas

### `mampara-funcionamiento`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no trata mamparas ni cerramientos de ducha).
```

### `mampara-fijacion`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.
```

### `mampara-danos-visibles`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.
```

### `mampara-sellos`

```
# Qué revisar

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

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos — sin fuente normativa aplicable.
```

### `mampara-filtracion`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.
```

Las 5 guías listas para implementación mecánica, no creadas en BD en esta fase.

## AD. No corresponde

- **Funcionamiento**: N/A cuando la mampara es completamente fija, sin ninguna hoja móvil.
- **Fijación, Daños visibles, Sellos, Filtración**: sin N/A — aplican siempre que el componente Mampara exista, sin variantes que los hagan opcionales.

Confirmado: solo 1 de los 5 checks tiene N/A, por la única variante real que efectivamente cambia si el check aplica (tipo fijo vs. con hoja móvil) — sin abusar de N/A.

## AE. Referencias visuales

- **Funcionamiento**: NO NECESARIA.
- **Fijación**: NO NECESARIA.
- **Daños visibles**: ALTO VALOR — confirmado explícitamente por el enunciado, y coherente con el riesgo de seguridad del vidrio.
- **Sellos**: OPCIONAL/ALTO VALOR — mismo criterio que sellos del resto del catálogo.
- **Filtración**: OPCIONAL — una imagen puede ayudar a mostrar el patrón de agua saliendo, aunque el síntoma es más claro en video/momento que en una foto fija.

No se generan imágenes en esta fase.

## AF. Legacy

Confirmado: Mampara **no existe** en `artefactos-sanitarios` histórico (sus 3 checks, ya auditados en fases previas, son exclusivamente descarga/fugas-base/goteras-llaves — sin ninguna mención de mampara). Los Baños históricos permanecen con su snapshot congelado y **no reciben Mampara automáticamente** cuando se implemente — mismo mecanismo de ancla histórica (`cielo`) ya diseñado en 11AJ, sin necesidad de un caso especial para Mampara. Baño V1 nuevo incorpora Mampara como componente Nivel 2 configurable, sin migración de ningún dato histórico (no hay dato histórico de mampara que migrar, a diferencia de WC/Lavamanos/Ducha que sí heredan concepto de `artefactos-sanitarios`).

## AG. Key

**Confirmada: `mampara`.** Libre en catálogo (sección C). Se descarta `mampara-bano` — sin necesidad semántica real (mismo razonamiento ya aplicado a `ducha`/`lavamanos`, 11AN §AK/11AM §AG). Se descarta `mampara-ducha` y `cerramiento-ducha` — ambos codifican "ducha" en la key pese a que, según la sección H, el componente también puede aplicar sobre una tina; `mampara` a secas evita esa sobre-especificación falsa. Sin metadata de tipo (sección I). Label: **"Mampara"**.

## AH. Árbol final

```
Baño
└── Mampara [L2] — mampara
    ├── Funcionamiento — MEDIUM — 🟡 criterio interno (N/A si mampara fija)
    ├── Fijación — MEDIUM — 🟡 criterio interno puro
    ├── Daños visibles — HIGH — 🟡 criterio interno puro
    ├── Sellos — MEDIUM — 🟡 criterio interno (analogía)
    └── Filtración — MEDIUM — 🟡 criterio interno puro
```

## AI. Nivel 2 final

Actualización conceptual de la rama dentro del árbol ya diseñado en 11AJ §AT (sin rediseñar el resto de Baño):

```
ARTEFACTOS SANITARIOS
├── WC / Inodoro [L2] — 4 checks (cerrado, 11AL)
├── Lavamanos [L2] — 5 checks (cerrado, 11AM)
├── Ducha [L2] — 6 checks (cerrado, 11AN)
├── Mampara [L2] — 5 checks (nuevo, cerrado en esta fase)
├── Tina [L2] — pendiente de cierre técnico (11AP)
└── Mueble de baño / Vanitorio [L2] — pendiente de cierre técnico
```

Sección (ARTEFACTOS SANITARIOS) y `order` (19) confirmados sin cambios respecto a 11AJ. Mampara es Nivel 2, pregunta Sí/No: "¿El baño tiene mampara instalada?". Sin `metaOptions`.

## AJ. Frontera con Ducha (tabla final)

| Defecto | Ducha | Mampara |
|---|---|---|
| Grifería (abre/cierra/responde) | ✅ Ducha | — |
| Agua fría/caliente | ✅ Ducha | — |
| Rociador | ✅ Ducha (folded en Grifería/Fugas) | — |
| Desagüe / Acumulación / Pendiente | ✅ Ducha (check "Evacuación") | — |
| Sello receptáculo-muro (o piso-muro de la zona) | ✅ Ducha | — |
| Apertura/cierre de la mampara | — | ✅ Mampara (check "Funcionamiento") |
| Herrajes/rieles/manilla de la mampara | — | ✅ Mampara (folded en Funcionamiento) |
| Fijación de la mampara | — | ✅ Mampara |
| Vidrio/perfiles de la mampara | — | ✅ Mampara (check "Daños visibles") |
| Sellos propios de la mampara (perfiles contra muro/receptáculo, uniones entre paneles) | — | ✅ Mampara (check "Sellos") |
| Filtración de agua a través del cerramiento | — | ✅ Mampara (check "Filtración") |
| Fugas en conexiones de grifería/rociador | ✅ Ducha (check "Fugas") | — |
| Receptáculo/plato (firmeza y daños) | ✅ Ducha | — |

**Sin ambigüedad ni overlap en ninguna fila** — confirmado explícitamente, la tabla es exhaustiva sobre los defectos evaluados por ambos componentes en su cierre técnico respectivo.

## AK. Frontera con Tina (para 11AP)

Confirmado explícitamente (sección H, resumen operativo para la futura fase): 11AP **no debe reabrir** ningún check de Mampara. Una mampara instalada sobre una tina sigue evaluándose íntegramente por el componente Mampara — Tina no absorbe ni duplica ninguno de sus 5 checks. Tina evaluará únicamente su propio cuerpo (firmeza, daños de superficie, fugas en su base/desagüe, sello de la tina con el muro), nunca el cerramiento que eventualmente tenga instalado.

## AL. Conteos

Impacto sobre los conteos teóricos de Baño V1 (base 8 + Extractor 2 + WC 4 + Lavamanos 5 + Ducha 6, acumulado 52 tras 11AN):

- **Mampara en No**: +0.
- **Mampara en Sí**: **+5 checks** — 3 más de lo proyectado preliminarmente en 11AJ (que estimó 2, un diseño compacto sin el nivel de detalle de esta fase). Ajuste honesto, justificado por el análisis explícito de esta fase (Funcionamiento, Fijación, Daños visibles, Sellos y Filtración cada uno con defecto distinto y sin overlap, según las matrices de las secciones V/W) — mismo tipo de ajuste ya visto en WC (11AL, 3→4).
- **Máximo teórico actualizado**: 52 (tras 11AN) + 5 (Mampara) = **57**. Sigue sin cerrarse el conteo canónico final de Baño — quedan 2 cierres técnicos pendientes: Tina, Mueble de baño.

## AM. Riesgos

- **Variantes fija/móvil**: resuelto con N/A explícito en Funcionamiento (sección I/AD), sin necesitar metadata.
- **Subjetividad de alineación**: eliminada al fusionar Alineación dentro de Funcionamiento sin nombrarla como concepto separado, sin inventar tolerancia (sección P).
- **Sellos variables (silicona/burletes/perfiles/juntas magnéticas)**: mitigado por wording agnóstico al sistema usado (sección Q).
- **Prueba de filtración**: mitigado explícitamente prohibiendo dirigir el chorro deliberadamente contra las juntas — el método es de uso normal únicamente (sección R/AA).
- **Seguridad de vidrio**: auditada explícitamente, sin ninguna instrucción insegura ni afirmación de tipo de vidrio sin fuente (sección AA).
- **Falta de fuente específica**: aceptado explícitamente — 5 checks 🟡, ninguno inflado, analogía con Ventana explícitamente marcada como no-fuente (sección Y).
- **Frontera con Ducha**: resuelta con tabla exhaustiva sin ambigüedad (sección AJ).
- **Frontera con Tina**: resuelta con frontera explícita para 11AP (sección AK).

## AN. Estado final

Mampara de Baño queda completamente cerrada: componente definido (cerramiento fijo/móvil de zona húmeda, con perfiles/guías/herrajes/sellos propios; excluye cortina, muro de obra, grifería, receptáculo, cerámica, desagüe), key confirmada (`mampara`, libre en catálogo), Nivel 2 confirmado (configurable, pregunta "¿El baño tiene mampara instalada?", sin metadata), 5 checks exactos con wording final (Funcionamiento, Fijación, Daños visibles, Sellos, Filtración), severidades definidas y diferenciadas con justificación explícita (MEDIUM/MEDIUM/HIGH/MEDIUM/MEDIUM, sin homogeneizar), fuentes clasificadas honestamente (5× 🟡 criterio interno, sin analogía ITO disponible, analogía con Ventana marcada explícitamente como no-fuente), Manual de Tolerancias confirmado sin cobertura para este componente, seguridad de vidrio auditada con especial cuidado, 5 guías completas de 7 encabezados listas para implementación mecánica, N/A definido con precisión (1 de 5 checks), referencias visuales clasificadas, frontera con Ducha cerrada con tabla exhaustiva sin ambigüedad, frontera con Tina cerrada explícitamente para 11AP, legacy confirmado sin dato histórico que migrar, conteo actualizado (+5, 3 más que la proyección preliminar de 11AJ, ajuste justificado).

Ninguna decisión esencial queda abierta.

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AO_CIERRE_TECNICO_MAMPARA_BANO.md`

Archivos modificados: ninguno.

Código = 0
Prisma = 0
BD = NO
Catálogo = NO
Seed = NO
Commit = NO
Push = NO
Deploy = NO

FASE 11AO — MAMPARA DE BAÑO CERRADA TÉCNICAMENTE

DETENERSE. No implementar. No iniciar Tina todavía.
