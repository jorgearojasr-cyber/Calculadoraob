# FASE 11AM — Cierre técnico y editorial de Lavamanos de Baño

Fase de auditoría + fuentes + diseño + redacción técnica. Sin cambios de código, Prisma, BD, catálogo, seed, TechnicalArticles en BD, commit, push ni deploy.

## A. Objetivo

Cerrar definitivamente, para Baño V1, el componente Lavamanos: definición, key, Nivel 2, checks exactos, fuentes, severidades, seguridad, guías completas, referencias visuales, relación con Mueble/Vanitorio y estrategia de convivencia con `artefactos-sanitarios`, sin migrarlo ni tocarlo.

## B. Estado en 11AJ / 11AL

[FASE11AJ_DISENO_CANONICO_BANO_V1.md](FASE11AJ_DISENO_CANONICO_BANO_V1.md) §T dejó Lavamanos como componente nuevo, key `lavamanos`, Nivel 2, sección ARTEFACTOS SANITARIOS, `order: 16`, Lote C de implementación (junto con WC), 5 checks candidatos (grifería, agua fría/caliente, fugas bajo el lavamanos, fijación, sello perimetral), `defaultSeverity` propuestos LOW/LOW/HIGH/MEDIUM/MEDIUM — mismo patrón de conteo que Lavaplatos, con la advertencia explícita de no duplicar "fuga visible" + "sifón gotea" como dos checks distintos. §Y confirmó Mueble de baño/Vanitorio como componente independiente de Lavamanos (Lavamanos ≠ Mueble). §Z confirmó Cubierta folded dentro de Mueble de baño, no dentro de Lavamanos.

[FASE11AL_CIERRE_TECNICO_WC_BANO.md](FASE11AL_CIERRE_TECNICO_WC_BANO.md) cerró la estrategia legacy canónica (§E/AD): Baños históricos con `artefactos-sanitarios` permanecen intactos para siempre salvo migración futura explícita; Baños V1 nuevos usan los componentes sanitarios específicos; sin coexistencia automática de `artefactos-sanitarios` + componente nuevo en un mismo Baño nuevo; sin desactivar el legacy todavía. §AC confirmó que WC no revisa grifería/sifón/sello de Lavamanos — separación de responsabilidades ya establecida desde el lado de WC, reutilizada aquí sin cambios. §D/§AF de 11AL confirmaron que el check histórico "goteras en llaves" (`artefactos-sanitarios-como-revisar-goteras-llaves`) es conceptualmente de grifería genérica (lavamanos/cocina/ducha-tina), **no de WC** — queda pendiente de evaluación aquí, en el componente al que sí corresponde.

Esta fase (11AM) no reabre ninguna de esas decisiones — las aplica.

## C. Precedente Lavaplatos — comparación explícita

Releído íntegro [FASE11AE_CIERRE_TECNICO_LAVAPLATOS_COCINA.md](FASE11AE_CIERRE_TECNICO_LAVAPLATOS_COCINA.md) como precedente de diseño, no como fuente ni como plantilla a copiar.

| Criterio | Lavaplatos (Cocina) | Lavamanos (Baño) | ¿Reutilizable el criterio? |
|---|---|---|---|
| Grifería — funcionamiento | 1 check, LOW | Mismo síntoma observable (abre/cierra/gotea), artefacto distinto | **Sí, el criterio** — check propio nuevo, no template compartido |
| Agua fría/caliente | 1 check, LOW, con N/A si solo fría | Idéntico razonamiento — instalación puede tener solo fría | **Sí, el criterio** |
| Fugas | 1 check fusionado (HIGH), fusión de 2 candidatos 11Z originales | Mismo patrón de fusión aplica — ver sección K/L | **Sí, el criterio de fusión, no el wording literal** ("bajo el lavaplatos" → "bajo el lavamanos") |
| Fijación | 1 check, MEDIUM | Aplica igual, pero con una distinción nueva que Lavaplatos no tuvo: Lavamanos puede estar sobre un Mueble/Vanitorio independiente, riesgo de duplicar la fijación del mueble (ver sección O) | **Sí el concepto, con matiz nuevo de independencia frente a Mueble** |
| Sello perimetral | 1 check, MEDIUM, analogía con sello de Ventana | Lavamanos tiene mucha más variabilidad de montaje (pedestal, suspendido, sobre/bajo cubierta, integrado) que Lavaplatos (que siempre se instala sobre una cubierta continua) — el check no puede asumir automáticamente que existe un encuentro sellado visible en todos los casos | **Parcialmente — requiere tratamiento propio, ver sección P** |
| Evacuación | Lavaplatos **no tiene** check de evacuación — 11AE lo descartó porque "puede deberse a causas ajenas al lavaplatos" | Mismo argumento aplica con la misma fuerza aquí | **Sí, mismo descarte** (ver sección M) |

**Conclusión explícita: Lavamanos NO copia los 5 checks de Lavaplatos por simetría.** Reutiliza el patrón de razonamiento (fusionar síntomas idénticos, no exigir diagnóstico de pieza, N/A solo cuando la variante es real) pero cada check final se audita de forma independiente contra el contexto real de Lavamanos — con al menos una diferencia sustantiva confirmada (Fijación vs. Mueble/Vanitorio, sección O) que Lavaplatos nunca tuvo que resolver.

## D. Catálogo (auditoría solo lectura, esta fase)

Confirmado disponible: `lavamanos`, `lavatorio`, `lavabo`, `lavamanos-bano` — **las 4 keys están libres**. `artefactos-sanitarios` ya auditado íntegramente en 11AJ §C/G y 11AL §C — no se vuelve a re-consultar desde cero (mismos 3 `InspectionChecklistItem`, mismos slugs, ya documentados).

## E. Legacy — check histórico de grifería, releído

El check histórico #3, "¿No hay goteras ni filtraciones en las llaves?" (slug `artefactos-sanitarios-como-revisar-goteras-llaves`), tiene el artículo asociado con el texto: *"Si hay goteras o filtraciones visibles en las llaves (grifería) de **lavamanos, cocina, ducha/tina**."* — confirma explícitamente que el check histórico se escribió para cubrir grifería en general, no un artefacto específico. Su fuente declarada: *"Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Grifería — verificación de ausencia de goteras y filtraciones visibles."*

| Check legacy | Question | Artefacto real al que podría aplicar | Fuente | ¿Reutilizable en Lavamanos? | Decisión |
|---|---|---|---|---|---|
| Goteras en llaves | "¿No hay goteras ni filtraciones en las llaves?" | Grifería genérica — lavamanos, cocina, ducha/tina (el propio artículo lo declara así) | 🟡 criterio interno adaptado ITO, sección Grifería | Sí, como concepto y fuente | **Reutilizar el concepto/fuente en un check nuevo específico de Lavamanos** (sección I), no reasignar el `InspectionChecklistItem` histórico |
| Descarga inodoro | "¿Después de descargar el inodoro..." | WC (ya cerrado en 11AL) | 🟡 criterio interno adaptado ITO | No | Ya resuelto en 11AL, no aplica aquí |
| Fugas en la base | "¿No hay fugas visibles en la base de los artefactos?" | Agregado (WC/Lavamanos/Ducha-Tina) — el artículo aclara "inodoro, lavamanos, tina/receptáculo de ducha" | 🟡 criterio interno adaptado ITO | Sí, como concepto (ya usado parcialmente por WC en 11AL) | **Reutilizar el concepto/fuente en el check de Fugas de Lavamanos** (sección K), con wording específico — mismo patrón que 11AL aplicó a WC |

## F. Definición del componente

`lavamanos` representa: la **cubeta**, el **pedestal o soporte cuando exista**, la **grifería asociada**, las **conexiones de agua visibles**, el **sifón/desagüe visible**, y el **sello perimetral cuando el tipo de montaje lo tenga**. **No incluye automáticamente**: el mueble de baño/vanitorio (componente independiente, 11AJ §Y), una cubierta independiente (folded en Mueble de baño, 11AJ §Z), el espejo, ni accesorios — todos con decisiones propias ya cerradas o descartadas en 11AJ.

## G. Base o Nivel 2

**Decisión: Nivel 2 (configurable), no siempre presente.** Mismo razonamiento que WC (11AL §G): aunque la mayoría de los Baños reales tienen lavamanos, la arquitectura debe representar honestamente casos legítimos donde no lo hay en el momento de la inspección (recinto de ducha separado, medio baño en obra sin artefactos instalados). No se crea por simetría con WC — se llega a la misma conclusión por el mismo tipo de análisis independiente (variabilidad real de casos), consistente con 11AJ §T.

## H. Pregunta Nivel 2

**"¿El baño tiene lavamanos instalado?"** — confirmada tal como la propuso 11AJ, sin cambios. No se pregunta pedestal/sobreponer/empotrado/suspendido/material como metadata — ninguna de esas variantes cambia el checklist final (los 4 checks propuestos, secciones I-N, aplican igual sin importar el tipo de montaje, salvo el matiz de Sello tratado en la sección P). Sin `metaOptions`.

## I. Grifería — funcionamiento

Check final confirmado. Wording: **"¿La grifería abre y cierra correctamente, sin quedar goteando?"** — idéntico wording al ya usado en Lavaplatos y en el histórico de `artefactos-sanitarios`, porque el criterio es realmente transversal (mecanismo de apertura/cierre de una llave, sin relación con el recinto). Distingue explícitamente de Fugas (sección K): este check es sobre **la salida de la llave misma** (¿gotea después de cerrada?), no sobre conexiones inferiores — evita solapamiento por diseño desde el wording. Fuente: 🟡 criterio interno adaptado ITO (reutilizando el concepto y la fuente ya confirmados en la sección E). `defaultSeverity`: LOW.

## J. Agua fría / caliente

Check final confirmado. Wording: **"¿Funcionan correctamente el agua fría y caliente de la grifería, cuando la instalación dispone de ambas?"** — reutilizado casi directamente del patrón de Lavaplatos, confirmado aplicable sin cambios: el criterio (verificar ambas redes cuando existan) no depende del recinto. Permite N/A si el Lavamanos solo dispone de una red de agua por diseño (sección AD). No exige temperatura, tiempo de calentamiento, presión ni diagnóstico de calefón/termo — solo confirma que, al abrir cada llave, sale agua de la red correspondiente. Fuente: 🟡 criterio interno, sin analogía ITO directa (mismo nivel de fuente que su equivalente en Lavaplatos). `defaultSeverity`: LOW.

## K. Fugas inferiores

Check final confirmado, consolidado. Wording: **"Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavamanos?"** — cubre sifón, uniones, conexiones y parte inferior de la cubeta en un único síntoma observable, aplicando directamente el aprendizaje de Lavaplatos (11AE): un usuario no puede diagnosticar con confianza cuál pieza específica falla, y todas producen la misma agua/humedad visible bajo el mueble o pedestal. Fuente: 🟡 criterio interno adaptado ITO (reutilizando el concepto/fuente del check histórico de fugas en la base, sección E). `defaultSeverity`: HIGH (mismo criterio consistente ya aplicado a toda fuga activa de agua en Cocina y en WC — Lavaplatos-Fugas, WC-Fugas).

## L. Sifón

**Decisión: NO check independiente — folded dentro de Fugas inferiores (sección K).** Confirmado explícitamente: el síntoma observable de un sifón goteando es indistinguible, para un usuario no técnico, del síntoma de cualquier otra fuga bajo el lavamanos — misma fotografía, mismo comentario, misma acción de registro. No se obliga al usuario a diagnosticar la pieza específica. Mismo criterio ya aplicado en Lavaplatos y en WC (fugas en conexiones fusionadas con fugas en la base, 11AL §L).

## M. Evacuación

**Decisión: DESCARTADO, sin check propio.**

Análisis explícito, con más cuidado que en Lavaplatos según lo pedido: una evacuación lenta en un lavamanos puede deberse a diseño de la cubeta (geometría, tamaño de desagüe), a una obstrucción parcial, a la pendiente de la red, o al uso — el usuario no puede aislar cuál de estas causas aplica, y a diferencia de Ducha (donde 11AJ §U sí incluyó un check de evacuación, porque el agua acumulada en un receptáculo de ducha es un problema de mayor consecuencia práctica — genera una zona húmeda permanente donde la persona se para), un lavamanos con evacuación algo lenta no genera el mismo tipo de consecuencia real (el agua no se "acumula" en el mismo sentido — el usuario simplemente ve el nivel bajar más lento, sin quedarse parado en ella). No se identifica un defecto observable genuinamente distinto de Fugas que justifique un check propio. Se descarta honestamente, sin inventar un tiempo máximo de evacuación (no existe fuente que lo respalde) — mismo criterio de rigor exigido en el enunciado.

## N. Tapón / válvula de desagüe

**Decisión: DESCARTADO para V1, sin N/A masivo asociado.** Confirmado: tapón, válvula click, sistema de rebalse, o ninguno, son variantes de accesorio sin relación directa con un defecto de instalación de la vivienda — no hay evidencia clara de valor técnico que justifique una revisión propia. Descartar esto evita también tener que introducir "No corresponde" en un check que dependería de qué sistema específico tiene el lavamanos (mismo argumento del enunciado: si un check necesitara N/A en demasiadas variantes, probablemente está mal modelado — aquí se prefiere no crear el check en absoluto).

## O. Fijación

Check final confirmado, con el matiz nuevo respecto a Lavaplatos ya anticipado en la sección C. Wording: **"¿El lavamanos se ve firme y bien instalado, sin moverse al tocarlo suavemente?"** — método de contacto leve, sin aplicar fuerza, consistente con el resto del catálogo (Cocina, WC).

**Distinción crítica confirmada respecto al Mueble/Vanitorio**: este check evalúa la fijación del **artefacto lavamanos en sí** (a la pared, al pedestal, o a la cubierta que lo sostiene) — no la fijación del mueble bajo él. Si el lavamanos está sobre un Mueble de baño/Vanitorio (componente independiente, 11AJ §Y), ese componente tiene su propio check de Fijación ("¿el mueble se siente firme...?", 11AJ §Y check 2) que evalúa el mueble como pieza distinta. No hay duplicidad real: un lavamanos puede estar firme sobre un mueble que se mueve (o viceversa) — son dos artefactos físicamente distintos con causas de falla distintas (anclaje del lavamanos a la cubierta/pared vs. anclaje del mueble al muro/piso), y cada uno merece su propio estado — mismo criterio que ya separó Muebles de Cubierta en Cocina por evidencia de independencia real. Fuente: 🟡 criterio interno puro, sin analogía ITO específica (igual que WC-Fijación). `defaultSeverity`: MEDIUM.

## P. Sello perimetral

**Decisión: check propio, con N/A cuando el tipo de montaje no tenga un encuentro sellado aplicable — no descartado, a diferencia de WC.**

Análisis de la variabilidad real de montaje (pedestal separado, lavamanos suspendido, sobre cubierta, bajo cubierta, integrado en cubierta): a diferencia de WC (donde se descartó por completo por falta de fuente que confirme sello como requisito universal, 11AL §P), aquí SÍ existe un encuentro físico real y observable en la mayoría de las variantes comunes (sobre cubierta, bajo cubierta, integrado) — el borde donde el lavamanos se une a la cubierta o al muro. Solo en las variantes sin cubierta (pedestal separado, suspendido sin encimera) ese encuentro no existe físicamente. Por eso se mantiene como check propio con N/A explícito para esas variantes, en vez de descartarlo por completo — es la decisión correcta cuando el defecto SÍ es real y observable en la mayoría de los casos, y la variante sin ese encuentro es la excepción, no la norma (a diferencia de WC, donde ningún sistema de instalación estándar tiene un sello perimetral universalmente esperable). Wording: **"Si el lavamanos tiene un encuentro visible con la cubierta o el muro (por ejemplo, sobre o bajo una cubierta), ¿ese sello se ve continuo, sin separaciones ni grietas?"** — el propio wording deja claro que corresponde marcar "No corresponde" cuando no existe ese encuentro (pedestal, suspendido sin encimera). Fuente: 🟡 criterio interno (analogía con sello de Ventana/Lavaplatos/WC — aunque WC finalmente no lo usó, el patrón de analogía sigue siendo válido aquí donde el encuentro físico sí existe). `defaultSeverity`: MEDIUM.

## Q. Daños visibles

Check final confirmado. Wording: **"¿El lavamanos presenta trizaduras, quiebres, golpes u otros daños visibles?"** — mismo patrón que WC-Daños visibles (11AL §O), un defecto de calidad distinto de fuga, fijación o grifería, observable sin ambigüedad. Fuente: 🟡 criterio interno puro, sin tolerancia estética inventada. `defaultSeverity`: LOW.

## R. Rebalse

**Decisión: DESCARTADO, fuera de V1.** Confirmado: no se pide llenar completamente el lavamanos para probar el orificio de rebalse — no existe un método simple y con fuente segura para esta prueba, y forzar agua hasta el borde introduce un riesgo innecesario de derrame sin beneficio proporcional (el rebalse es una función de respaldo de seguridad, no un uso diario, y su ausencia de funcionamiento no es observable sin una prueba invasiva). Sin candidato V2 explícito — mismo tipo de descarte que Extractor-extracción (11AK §M): requeriría fuente externa que hoy no existe, y no es indispensable para V1.

## S. Vanitorio (Mueble de baño)

**Confirmado explícitamente: Lavamanos ≠ Mueble de baño. Sin dependencia automática en ninguna dirección — mismo principio ya aplicado a Ventana/Extractor en 11AK §H.**

Lavamanos Sí no implica Mueble Sí (puede estar sobre pedestal, suspendido, o directamente anclado al muro sin mueble); Mueble Sí no implica Lavamanos Sí (aunque sea el caso típico, la arquitectura no debe asumirlo). Ambos son componentes Nivel 2 independientes, cada uno con su propio Sí/No — el usuario puede configurar cualquier combinación real (Lavamanos+Mueble, Lavamanos sin Mueble, Mueble sin Lavamanos activo si el checklist alguna vez lo necesitara — caso raro pero no impedido por la arquitectura, Lavamanos sin Mueble y sin Cubierta). La única relación entre ambos es la distinción de Fijación ya cerrada en la sección O — cada uno evalúa su propio anclaje, sin depender del estado del otro componente.

## T. Cubierta

**Confirmado: no se absorbe la cubierta dentro de Lavamanos.** Ya cerrada en 11AJ §Z: la cubierta de vanitorio queda folded dentro del check "Daños visibles" de Mueble de baño (no de Lavamanos), decisión que esta fase no reabre. El único punto donde Lavamanos "toca" conceptualmente la cubierta es el check de Sello perimetral (sección P), que evalúa el **encuentro** entre el lavamanos y la cubierta/muro — no la cubierta en sí misma (su fijación y daños siguen siendo responsabilidad de Mueble de baño). Sin rediseño de Mueble/Vanitorio en esta fase.

## U. Matriz de candidatos

| Candidato | Defecto | ¿Aplica a todas las variantes? | Fuente | Solapa con | ¿Merece estado? | Decisión final |
|---|---|---|---|---|---|---|
| 1. Grifería abre/cierra/gotea | Mecanismo de la llave no cierra bien | Sí | 🟡 criterio interno adaptado ITO | Ninguno (distinto de Fugas por wording) | Sí | **MANTENER** |
| 2. Agua fría/caliente | Una de las 2 redes no funciona | Sí, con N/A si solo 1 red | 🟡 criterio interno | Ninguno | Sí | **MANTENER**, con N/A |
| 3. Fugas inferiores | Agua/humedad bajo el lavamanos | Sí | 🟡 criterio interno adaptado ITO | Incluye #4 (sifón) | Sí | **MANTENER** |
| 4. Sifón | Goteo específico del sifón | Sí | 🟡 criterio interno | Con #3 (mismo síntoma) | No — mismo síntoma que #3 | **FUSIONAR** en #3 |
| 5. Evacuación | Agua queda lenta en drenar | Sí, pero consecuencia baja | Sin fuente para un umbral | Con #3 (causa posiblemente igual) | No — sin defecto observable claramente distinto, sin consecuencia comparable a Ducha | **DESCARTAR** |
| 6. Tapón/válvula | Tapón no sella o falta | No — accesorio opcional variable | Sin fuente | Ninguno | No — sin relación con defecto de instalación | **DESCARTAR** |
| 7. Fijación | Movimiento/inestabilidad del artefacto | Sí | 🟡 criterio interno puro | Con Mueble-Fijación (distinto artefacto, no duplica — sección O) | Sí | **MANTENER** |
| 8. Sello | Separación en encuentro con cubierta/muro | Solo en variantes con encuentro visible | 🟡 criterio interno (analogía) | Con #3 (humedad resultante) | Sí, con N/A cuando no aplica | **MANTENER**, con N/A |
| 9. Daños visibles | Trizadura/quiebre/golpe | Sí | 🟡 criterio interno puro | Ninguno | Sí | **MANTENER** |
| 10. Rebalse | Orificio de rebalse no funciona | No — requiere prueba invasiva | Sin fuente ni método seguro | Ninguno | No | **DESCARTAR** |

**Ningún candidato queda sin decisión.**

## V. Matriz de solapamiento (análisis dirigido)

| Par | ¿Producirían misma foto/comentario/acción? | Decisión |
|---|---|---|
| Fugas inferiores vs. Sifón | Sí — agua/humedad bajo el lavamanos es indistinguible entre ambas causas | **Fusionados** (sección K/L) |
| Fijación (Lavamanos) vs. Fijación (Mueble/Vanitorio) | No — artefactos físicamente distintos, causas de falla distintas, evidencia real de independencia (sección O/S) | **Mantenidos independientes**, uno en cada componente |
| Sello vs. Fugas | Parcialmente relacionados (un sello roto puede causar humedad), pero ubicaciones y momentos de observación distintos: Sello es "¿se ve una separación visible en el borde?" (estático, sin agua corriendo), Fugas es "¿hay agua/humedad al dejar correr agua?" (dinámico) | **Mantenidos independientes** — no duplican, describen dos síntomas distintos aunque relacionados causalmente |
| Evacuación vs. Sifón | Ambos podrían apuntar a una obstrucción, pero Evacuación fue descartado por completo (sección M) — no llega a competir con Sifón porque Sifón ya está fusionado en Fugas | N/A — Evacuación descartado, no genera conflicto |
| Daños vs. Sello | Daños es sobre la loza/material del artefacto, Sello es sobre el encuentro con otra superficie — ubicaciones físicas distintas, sin overlap | **Mantenidos independientes** |

## W. Revisiones finales

**5 checks** — mismo número final que Lavaplatos, pero llegado por análisis independiente, no por copia (confirmado explícitamente en la sección C: la composición interna difiere — Lavamanos incluye N/A real en Agua fría/caliente y en Sello, algo que Lavaplatos no necesitó de la misma forma):

1. **Grifería** — "¿La grifería abre y cierra correctamente, sin quedar goteando?"
2. **Agua fría/caliente** — "¿Funcionan correctamente el agua fría y caliente de la grifería, cuando la instalación dispone de ambas?"
3. **Fugas** — "Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavamanos?"
4. **Fijación** — "¿El lavamanos se ve firme y bien instalado, sin moverse al tocarlo suavemente?"
5. **Sello perimetral** — "Si el lavamanos tiene un encuentro visible con la cubierta o el muro (por ejemplo, sobre o bajo una cubierta), ¿ese sello se ve continuo, sin separaciones ni grietas?"

## X. Fuentes

- Grifería: 🟡 criterio interno adaptado ITO.
- Agua fría/caliente: 🟡 criterio interno, sin analogía ITO directa.
- Fugas: 🟡 criterio interno adaptado ITO.
- Fijación: 🟡 criterio interno puro.
- Sello: 🟡 criterio interno (analogía).

Ninguna clasificación 🟢 ni 🟢/🟡. Confirmado sin excepción: el catálogo educativo ITO es criterio interno adaptado, nunca norma — ninguna analogía se eleva a fuente normativa.

## Y. Manual de Tolerancias

Confirmado explícitamente (reutilizando la auditoría íntegra ya hecha en 11V y reconfirmada en 11AJ §F, sin releer el documento completo de nuevo): el Manual de Tolerancias CDT/CChC **no contiene contenido directo** para Lavamanos, Grifería, Sifón, Desagüe ni Sellos sanitarios — confirmado línea por línea en 11V ("Tina, ducha, shower door, WC, lavamanos, grifería, sellos de silicona en baño, ventilación de baño" listados explícitamente como fuera de cobertura del Manual). No se atribuye ningún respaldo normativo inexistente a ninguno de los 5 checks finales.

## Z. Artículos — reutilización

Para cada check final:

- **Grifería**: **C. Adaptar criterio histórico en nuevo artículo** — reutiliza el concepto y la fuente del histórico `artefactos-sanitarios-como-revisar-goteras-llaves` (que ya mencionaba "lavamanos" explícitamente en su texto, sección E), redactado bajo slug nuevo específico de Lavamanos.
- **Agua fría/caliente**: **A. Nuevo artículo específico** — sin precedente histórico directo (el check histórico de grifería no distinguía fría/caliente).
- **Fugas**: **C. Adaptar criterio histórico en nuevo artículo** — reutiliza concepto/fuente de `artefactos-sanitarios-como-revisar-fugas-base`, con wording específico de Lavamanos (mismo patrón que 11AL aplicó a WC).
- **Fijación**: **A. Nuevo artículo específico** — sin precedente histórico (el agregado nunca evaluó firmeza).
- **Sello perimetral**: **A. Nuevo artículo específico** — sin precedente histórico.

El artículo legacy `artefactos-sanitarios-como-revisar-goteras-llaves` **permanece sin cambios**, sirviendo únicamente a los Baños históricos que todavía usan `artefactos-sanitarios` — no se modifica en esta fase (sin escritura en BD).

## AA. Severidades

- **Grifería**: `LOW` — molestia funcional, sin riesgo real.
- **Agua fría/caliente**: `LOW` — mismo criterio.
- **Fugas**: `HIGH` — agua activa, mismo criterio consistente que toda fuga en Cocina/WC/Lavamanos.
- **Fijación**: `MEDIUM` — riesgo real si empeora, sin fuga activa hoy.
- **Sello perimetral**: `MEDIUM` — riesgo de humedad si empeora, sin ser una fuga activa confirmada.

Sin homogenizar — cada severidad justificada por su consecuencia real, no por copiar mecánicamente los valores de Lavaplatos (que coinciden en este caso porque el análisis independiente llega a la misma conclusión, no porque se haya copiado). Recordatorio explícito: DT-01 (UI preselecciona MEDIUM sin leer `defaultSeverity`) sigue sin corregirse, y este diseño no se hace alrededor del bug.

## AB. Seguridad

**Permitido**: abrir/cerrar grifería, dejar correr agua normalmente, observar conexiones visibles, mirar bajo el lavamanos, tocar suavemente el artefacto para evaluar fijación.

**Prohibido, confirmado en las 5 guías**: desmontar el sifón, soltar flexibles, apretar conexiones, retirar el lavamanos, usar herramientas, introducir objetos al desagüe, usar químicos, intervenir llaves internas, aplicar fuerza.

## AC. Guías completas

### `lavamanos-griferia`

```
# Qué revisar

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

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Grifería — verificación de ausencia de goteras y filtraciones visibles.
```

### `lavamanos-agua-fria-caliente`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable ni analogía específica del catálogo educativo ITO para este punto.
```

### `lavamanos-fugas`

```
# Qué revisar

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

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos.
```

### `lavamanos-fijacion`

```
# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable ni analogía específica del catálogo educativo ITO para este punto.
```

### `lavamanos-sello-perimetral`

```
# Qué revisar

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

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos (ventana, lavaplatos) — sin fuente normativa aplicable.
```

Las 5 guías listas para implementación mecánica, no creadas en BD en esta fase.

## AD. No corresponde

- **Agua fría/caliente**: N/A cuando la instalación solo dispone de agua fría por diseño.
- **Sello perimetral**: N/A cuando el tipo de montaje no tiene un encuentro visible con cubierta/muro (pedestal separado, suspendido sin encimera).
- **Grifería, Fugas, Fijación**: sin N/A — aplican siempre que el componente Lavamanos exista, sin variantes que los hagan opcionales.

Confirmado: solo 2 de los 5 checks tienen N/A, y ambos por una variante real y verificable (tipo de red de agua, tipo de montaje) — no se abusa de N/A, y ningún check quedó "mal modelado" al punto de necesitarlo en demasiadas variantes.

## AE. Referencias visuales

- **Grifería**: NO NECESARIA.
- **Agua fría/caliente**: NO NECESARIA.
- **Fugas**: ALTO VALOR.
- **Fijación**: NO NECESARIA.
- **Sello perimetral**: OPCIONAL/ALTO VALOR — útil para calibrar qué separación visible cuenta como defecto, mismo criterio ya usado para sellos en Cocina/otros componentes de Baño.

No se generan imágenes en esta fase.

## AF. Legacy final

Confirmado, sin cambios respecto a la política ya cerrada en 11AL: `artefactos-sanitarios` permanece para Baños históricos, `lavamanos` (junto con `wc`) para Baño V1 nuevo. Sin coexistencia automática de ambos en un mismo Baño nuevo. Sin migración automática de datos. Sin desactivar el catálogo legacy en esta fase (decisión de implementación, no de diseño, según 11AL §AE).

## AG. Key

**Confirmada: `lavamanos`.** Libre en catálogo (sección D). Se descarta `lavatorio` y `lavabo` (menos usados en el español chileno, que es el contexto principal del proyecto) y `lavamanos-bano` (innecesario — el criterio técnico de este artefacto es específico de baño por naturaleza, a diferencia de `revestimiento-ceramico-piso`, que sí necesitaba genericidad porque su criterio es de material, no de artefacto; un lavamanos no se reutiliza conceptualmente en otro recinto). Label: **"Lavamanos"**.

## AH. Árbol final

```
Baño
└── Lavamanos [L2] — lavamanos
    ├── Grifería — LOW — 🟡 criterio interno adaptado ITO
    ├── Agua fría/caliente — LOW — 🟡 criterio interno (N/A si solo fría)
    ├── Fugas — HIGH — 🟡 criterio interno adaptado ITO
    ├── Fijación — MEDIUM — 🟡 criterio interno puro
    └── Sello perimetral — MEDIUM — 🟡 criterio interno (N/A si sin encuentro visible)
```

## AI. Nivel 2

Actualización conceptual de la rama dentro del árbol ya diseñado en 11AJ §AT (sin rediseñar el resto de Baño):

```
ARTEFACTOS SANITARIOS
├── WC / Inodoro [L2] — 4 checks (cerrado, 11AL)
├── Lavamanos [L2] — 5 checks (nuevo, cerrado en esta fase)
├── Ducha [L2] — pendiente de cierre técnico
├── Tina [L2] — pendiente de cierre técnico
├── Mampara [L2] — pendiente de cierre técnico
└── Mueble de baño / Vanitorio [L2] — pendiente de cierre técnico
```

Sección (ARTEFACTOS SANITARIOS) y `order` (16) confirmados sin cambios respecto a 11AJ. Lavamanos es Nivel 2, confirmado en sección G — pregunta Sí/No: "¿El baño tiene lavamanos instalado?".

## AJ. Conteos

Impacto sobre los conteos teóricos de Baño V1 (base 8 + Extractor 11AK §AG + WC 11AL §AI):

- **Lavamanos en No**: +0.
- **Lavamanos en Sí**: **+5 checks** — coincide exactamente con lo proyectado en 11AJ, sin ajuste (a diferencia de WC, que terminó en 4 checks en vez de los 3 proyectados).
- **Máximo teórico actualizado**: 46 (tras 11AL) + 5 (Lavamanos, sin cambio respecto a proyección) = **51**. Sigue sin cerrarse el conteo canónico final de Baño — quedan 4 cierres técnicos pendientes: Ducha, Tina, Mampara, Mueble de baño.

## AK. Riesgos

- **Solapamiento con legacy**: mitigado por la política de no-coexistencia ya cerrada en 11AL, dependiente de que el lote de implementación (Lote C) la respete.
- **Similitud excesiva con Lavaplatos**: analizada explícitamente en la sección C — coincidencia de conteo (5) es resultado de análisis independiente, no de copia; al menos 2 checks (Agua fría/caliente con N/A real, Sello con N/A real) tienen matices que Lavaplatos no tuvo.
- **Variaciones de montaje**: resueltas mediante N/A explícito en Sello perimetral (sección P/AD), sin forzar un requisito universal sin fuente.
- **Independencia respecto a Vanitorio**: confirmada explícitamente sin dependencia automática en ninguna dirección (sección S).
- **N/A por agua caliente**: aceptado como variante real y legítima, no un síntoma de mal diseño del check.
- **Fugas/sifón**: fusionados por diseño, sin riesgo de doble conteo (sección L/V).
- **Falta de fuente normativa**: aceptada explícitamente, igual que Extractor y WC — 5 checks 🟡, ninguno inflado.
- **Futuros Baños históricos/cohortes**: sin riesgo nuevo — Lavamanos sigue el mismo mecanismo de ancla histórica (`cielo`) ya diseñado en 11AJ, sin necesidad de mecanismo adicional.

## AL. Estado final

Lavamanos de Baño queda completamente cerrado: componente definido (cubeta, pedestal/soporte, grifería, conexiones, sifón/desagüe, sello cuando aplica; excluye mueble/cubierta independiente/espejo/accesorios), key confirmada (`lavamanos`, libre en catálogo), Nivel 2 confirmado (configurable, pregunta "¿El baño tiene lavamanos instalado?"), 5 checks exactos con wording final (Grifería, Agua fría/caliente, Fugas, Fijación, Sello perimetral), severidades definidas y justificadas (LOW/LOW/HIGH/MEDIUM/MEDIUM), fuentes clasificadas honestamente (5× 🟡, sin atribuir respaldo del Manual de Tolerancias — confirmado sin cobertura), seguridad auditada, 5 guías completas de 7 encabezados listas para implementación mecánica, N/A definido con precisión (2 de 5 checks, por variante real), referencias visuales clasificadas, independencia de Mueble/Vanitorio confirmada explícitamente (sin dependencia automática en ninguna dirección), estrategia legacy reutilizada sin cambios de la ya cerrada en 11AL, conteo actualizado (+5, confirmando la proyección de 11AJ sin ajuste).

Ninguna decisión esencial queda abierta.

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AM_CIERRE_TECNICO_LAVAMANOS_BANO.md`

Archivos modificados: ninguno.

Código = 0
Prisma = 0
BD = NO
Catálogo = NO
Seed = NO
Commit = NO
Push = NO
Deploy = NO

FASE 11AM — LAVAMANOS DE BAÑO CERRADO TÉCNICAMENTE

DETENERSE. No implementar. No iniciar Ducha todavía.
