# FASE 11AJ — Auditoría y diseño canónico de Baño V1

Fase de auditoría + fuentes + diseño + arquitectura. Sin cambios de código, Prisma, BD, catálogo, seed, TechnicalArticles, commit, push ni deploy.

## A. Objetivo

Diseñar completamente Baño V1 — inventario, fuentes, Nivel 2, lotes — reutilizando la arquitectura genérica ya validada en Cocina V1 ([FASE11AI_CIERRE_FUNCIONAL_COCINA_V1.md](FASE11AI_CIERRE_FUNCIONAL_COCINA_V1.md)), sin copiar su contenido.

## B. Aprendizajes de Cocina reutilizables

De la lectura íntegra de 11AI: (1) modelo `InspectionSpace.config` genérico sin columnas por componente; (2) `section`/`order` opcionales en `SpaceConfigurableComponent`, agrupación visual del panel independiente del orden numérico del checklist plano (comportamiento esperado, no bug); (3) componentes Nivel 2 pueden tener **0 vínculos de catálogo** intencionalmente — se crean solo vía `saveSpaceLevel2ConfigAction`; (4) ancla histórica por recinto (`SPACE_LEVEL2_HISTORICAL_ANCHOR`) inferida de un elemento siempre-nuevo, sin cambio de schema; (5) componentes derivados por material se nombran genéricos (sin sufijo de recinto) cuando el criterio técnico depende del material y no del recinto — permitiendo reutilización real, ya demostrado con `revestimiento-ceramico-*`/`pintura-muro`; (6) independencia real de componentes debe basarse en evidencia de casos, no en intuición (Muebles/Cubierta); (7) fusionar candidatos que describen el mismo síntoma observable evita doble conteo (Lavaplatos-Fugas); (8) un componente sin analogía de fuente disponible no debe forzarse a una — Campana quedó 100% 🟡 sin inflar; (9) cada componente nuevo requirió su propia fase de cierre técnico (11AC, 11AE, 11AG) antes de implementarse — el diseño arquitectónico solo no bastó nunca en Cocina.

## C. Estado actual de Baño (auditoría solo lectura, esta fase)

`InspectionSpaceTemplate`: **una sola key, `bano`**, label "Baño", `repeatable: true` (a diferencia de `cocina`), `appliesTo: [CASA, DEPARTAMENTO, AMPLIACION]`, `active: true`.

`InspectionElementTemplateSpace` vinculados a `bano`: **solo 3** — `piso`(order 0), `muros`(order 1), `artefactos-sanitarios`(order 2). **Baño hoy NO tiene Cielo, Iluminación, Enchufes e interruptores, Ventana ni Puerta vinculados** — a diferencia de Cocina, que ya incorporó Cielo/Iluminación en Fase 11AA. Esto es el hallazgo más importante de la auditoría: Baño está considerablemente más atrasado que Cocina antes de 11AA, no solo antes de 11Y.

`artefactos-sanitarios` (`InspectionElementTemplate`, catálogo `order: 4`, `active: true`, `materialVariantOf: null`): **3 checks activos**, verbatim de BD:
1. "¿Después de descargar el inodoro, el agua deja de correr con normalidad?" — order 0, `defaultSeverity: null`, slug `artefactos-sanitarios-como-revisar-descarga-inodoro`.
2. "¿No hay fugas visibles en la base de los artefactos?" — order 1, `defaultSeverity: null`, slug `artefactos-sanitarios-como-revisar-fugas-base` (texto del artículo aclara "inodoro, lavamanos, tina/receptáculo de ducha si corresponde" — un único check agregado cubre los 3 artefactos a la vez, sin poder identificar cuál específicamente).
3. "¿No hay goteras ni filtraciones en las llaves?" — order 2, `defaultSeverity: null`, slug `artefactos-sanitarios-como-revisar-goteras-llaves` (texto del artículo aclara "lavamanos, cocina, ducha/tina" — reutilizado también como precedente para Lavaplatos de Cocina por analogía en Fase 11AE).

Sin `InspectionElementTemplate` propio para WC, Lavamanos, Ducha, Tina, Mampara, Espejo, Mueble de baño ni Ventilación/Extractor. Sin `SPACE_LEVEL2_CONFIG.bano` en código (`src/lib/inspecciones/space-config.ts` no tiene entrada `bano`). Sin `SPACE_LEVEL2_HISTORICAL_ANCHOR.bano`.

**Checklist actual real de un Baño nuevo: 6 checks fijos** (Piso 2 + Muros 1 + Artefactos sanitarios 3), sin ninguna configuración Nivel 2 — el mismo checklist para cualquier baño, sin importar si tiene ducha, tina, ventana, mampara o vanitorio.

## D. Casos reales (fotografía de solo lectura, esta fase)

4 casos totales de Jorge. **3 casos tienen Baño** (`las dalias`, `casa`, `xcxc`), y como `bano` es `repeatable`, `las dalias` y `xcxc` tienen **2 instancias de Baño cada uno** (`casa` tiene 1) → **5 espacios de Baño reales en total**. Todos con `config: null` (no existe Nivel 2 todavía, es esperado). Todos con exactamente los mismos 3 elementos: `piso`(2 checks), `muros`(1 check), `artefactos-sanitarios`(3 checks) = 6 checks por baño, 0 respuestas registradas, 0 fotos. Ninguna modificación realizada en esta fase — esta fotografía es la base para diseñar la política de históricos (sección AL).

## E. Fuentes — resumen general

Reutilizando el esquema de clasificación de 11W (🟢 FUERTE / 🟢🟡 PARCIAL / 🟡 CRITERIO INTERNO / 🔴 NO USAR), aplicado por revisión, no por capítulo.

## F. Manual de Tolerancias — auditoría dirigida a Baño

Basado en la lectura íntegra ya realizada del Manual completo (26 fichas) documentada en [FASE11V_AUDITORIA_REDISTENO_CATALOGO_DESDE_MANUAL_TOLERANCIAS.md](FASE11V_AUDITORIA_REDISTENO_CATALOGO_DESDE_MANUAL_TOLERANCIAS.md) — no se reinterpreta el Manual desde cero en esta fase, se reutiliza esa auditoría ya hecha, confirmada línea por línea.

**Capítulos ya aplicables y reutilizables sin cambios** (mismos templates que Cocina, mismas fichas):
- Ficha 10 (Revestimientos cerámicos) → `revestimiento-ceramico-piso`/`-muro`.
- Cap. 23 (Pinturas) → `pintura-muro`.
- Ficha 13 (Ventanas) → `ventana`.
- Ficha 12 (Puertas) → `puerta`.
- Cap. 7 (Cielos) → `cielo` (respaldo parcial, ya 🟡, sin cambios).
- Ficha 26 (Enchufes/cajas) → `enchufes-interruptores` (respaldo parcial, ya 🟡🟢).

**Confirmado explícitamente que el Manual NO cubre** (11V, líneas 118 y 306): Tina, ducha, shower door, WC, lavamanos, grifería, sellos de silicona en baño, ventilación de baño. Ninguna de las 6 revisiones sanitarias nuevas propuestas en esta fase (secciones S-W) puede atribuirse al Manual — todas quedan 🟡 CRITERIO INTERNO, sin excepción, honestamente.

## G. Fuentes ITO existentes — auditoría de analogía

Los 3 artículos actuales de `artefactos-sanitarios` (releídos íntegros en la sección C) declaran, verbatim:
- Descarga inodoro: *"Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de firmeza y funcionamiento básico de artefactos."*
- Fugas base: *"Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos."*
- Goteras llaves: *"Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Grifería — verificación de ausencia de goteras y filtraciones visibles."*

Lo que esto permite respaldar por analogía honesta: descarga de WC, fugas visibles en la base de un artefacto sanitario (genérico, sin distinguir cuál), y ausencia de goteras/filtraciones en griferías en general. **No permite respaldar por sí solo**: evacuación de ducha, firmeza de tina/lavamanos/WC, sellos perimetrales, mamparas, ni mueble de baño — para estos, esta fase no inventa una analogía ITO donde el catálogo original no la ofrece; quedan como criterio interno puro, sin la etiqueta "adaptado de ITO" salvo que un futuro lote de cierre técnico confirme un punto ITO específico aplicable.

## H. Componentes base — decisión por elemento

| Componente | ¿Ya existe en Baño? | ¿Debería ser siempre presente? | ¿Incorporar en V1? | Revisiones | Fuente |
|---|---|---|---|---|---|
| Piso | Sí (vinculado) | Sí | Ya está | 2 (reutilizadas, sin cambio) | 🟢 |
| Muros | Sí (vinculado) | Sí | Ya está | 1 (reutilizada, sin cambio) | 🟢🟡 |
| Cielo | **No** | Sí (mismo razonamiento que Cocina 11AA §I: todo baño cerrado tiene un cielo físico) | **Sí — vincular el mismo template `cielo`** | 2 (reutilizadas) | 🟡 |
| Enchufes e interruptores | **No** | Sí | **Sí — vincular el mismo template `enchufes-interruptores`** | 1 (reutilizada) | 🟢🟡 |
| Iluminación | **No** | Sí | **Sí — vincular el mismo template `iluminacion`** | 1 (reutilizada) | 🟡 |

Ninguno de estos 3 nuevos vínculos requiere un `InspectionElementTemplate` nuevo — son los mismos templates transversales ya usados en Cocina, solo agregando el vínculo `InspectionElementTemplateSpace` hacia `bano`.

## I. Piso

Reutilizar `piso` sin cambios — sus 2 checks (daños visibles, desniveles) son transversales por material/superficie, no por recinto. Sin ajuste de wording necesario.

## J. Muros

Reutilizar `muros` sin cambios — 1 check (fisuras), transversal. Ver sección AB para la discusión de un posible check de humedad, deliberadamente NO agregado en esta fase (decisión transversal, fuera de alcance de Baño).

## K. Cielo

Reutilizar `cielo` sin cambios (2 checks: manchas/grietas, manchas de humedad) — ambos ya diseñados de forma genérica, sin mención de recinto en su copy. Su relevancia es, si acaso, mayor en Baño (recinto con más humedad ambiental), pero eso no cambia el contenido de la revisión ni justifica un check adicional — se documenta como observación, no como cambio de diseño.

## L. Electricidad (Enchufes e interruptores)

Reutilizar `enchufes-interruptores` sin cambios. Auditado explícitamente: su guía actual ya indica "esta revisión es solo funcional y visual, no requiere abrir ni tocar ningún componente eléctrico" y no pide desmontar tapas, medir voltaje, puentear ni manipular conductores — cumple el estándar de seguridad exigido para Baño (zona húmeda) sin necesitar una guía específica nueva. No se propone contenido adicional de advertencia agua+electricidad más allá de lo ya prudente del copy existente, para no inflar el artículo con contenido redundante.

## M. Iluminación

Reutilizar `iluminacion` sin cambios (1 check). No se crea una segunda revisión para "iluminación de espejo" — la pregunta actual ("¿la iluminación... enciende correctamente y el elemento visible se encuentra firme?") ya cubre colectivamente cualquier luminaria del recinto, igual que en Cocina. Dos luminarias no justifican dos estados/comentarios/fotos separados salvo evidencia real de que los usuarios necesiten distinguirlas — no existe esa evidencia hoy.

## N. Puerta

**Decisión: SIEMPRE PRESENTE (base), no Nivel 2** — a diferencia de Cocina, donde Puerta es Nivel 2.

Justificación: en Cocina, la ausencia de puerta es un caso real común (cocinas abiertas al living-comedor, especialmente en departamentos y diseños modernos), por eso 11AA la hizo Nivel 2. En Baño, la privacidad es un requisito prácticamente universal para cualquier baño independiente (los únicos casos reales sin puerta serían baños en obra gruesa sin terminar, que ya se tratan como históricos/no aplicables, no como "Baño sin puerta" configurado). No se está copiando Cocina por costumbre — es la conclusión opuesta, justificada por la diferencia real de uso entre ambos recintos. Reutilizar el mismo template `puerta` (1 check, "¿Cierra correctamente?"), vinculado por catálogo igual que Piso/Muros, sin pasar por `SPACE_LEVEL2_CONFIG`.

## O. Ventana

**Decisión: reutilizar directamente el componente `ventana` existente, Nivel 2, sin crear `ventana-bano`.**

Auditadas las 7 revisiones activas contra el contexto de Baño: las 7 son igualmente aplicables sin cambios — apertura/cierre, manilla/herrajes, sello hoja-marco, daños en vidrio, condensación en termopanel, sello marco-muro, daños en marco — ninguna depende de si la ventana está en Cocina o en Baño, todas dependen del mecanismo/material de la ventana misma. Sin excepciones que documentar. Mismo patrón de reutilización ya validado por `revestimiento-ceramico-piso` y `pintura-muro`.

## P. Ventilación / Extractor

**Decisión: SÍ merece componente propio nuevo, Nivel 2, NO reutilizando Campana/Extractor de Cocina.**

Respuesta a las 5 preguntas del enunciado:
- **¿Es funcionalmente importante?** Sí — muchos baños interiores (sin ventana) dependen exclusivamente del extractor para controlar humedad/olores; es un caso real común, no un accesorio menor.
- **¿Hay fuente?** No — ni el Manual ni el catálogo ITO cubren extractores de baño. 🟡 criterio interno puro, igual que Campana en Cocina.
- **¿Puede revisarse con método simple?** Sí — encender y observar/escuchar funcionamiento, sin instrumentos.
- **¿Conviene reutilizar Campana/Extractor?** **No.** Su contexto y checks son distintos: Campana tiene velocidades múltiples e iluminación incorporada como característica común (ninguna de las dos es típica en un extractor de baño), y comparten poco más que la palabra "extractor". Forzar la reutilización produciría preguntas irrelevantes (velocidades, iluminación incorporada) para la mayoría de los extractores de baño reales.
- **¿Merece componente propio?** Sí.

**Propuesta**: nuevo template `extractor-aire` (key genérica, sin sufijo `-bano`, para permitir reutilización futura en otros recintos húmedos como Bodega o Cocina sin ventana, si surgiera el caso — mismo criterio de genericidad ya aplicado a `revestimiento-ceramico-*`). Nivel 2, Sí/No: "¿El baño tiene extractor de aire instalado?". 2 checks candidatos (sin iluminación incorporada, sin velocidades — ninguna de las dos son típicas del extractor de baño estándar):
1. Funcionamiento — "¿El extractor enciende y se percibe funcionando normalmente (gira, hace circular aire) al accionar su control?" — 🟡 criterio interno puro, `defaultSeverity` propuesto MEDIUM.
2. Ruido/vibración — "Al funcionar, ¿presenta vibraciones, golpes o ruidos claramente irregulares (más allá del ruido normal del motor)?" — mismo patrón textual que Campana (advertencia explícita "todo motor produce sonido al funcionar"), 🟡 criterio interno puro, `defaultSeverity` propuesto MEDIUM.

Requiere su propio lote de cierre técnico antes de implementarse (ver sección AJ).

## Q. Artefactos sanitarios (estado actual) — problema central

Confirmado en sección C: hoy es **1 solo componente agregado** con 3 preguntas que mezclan WC + lavamanos + ducha/tina + grifería de cocina sin poder distinguir cuál artefacto específico falló. Esto es insuficiente para representar casos reales: un baño puede tener WC+lavamanos+ducha, WC+lavamanos sin ducha, medio baño (solo WC+lavamanos), ducha sin tina, tina con o sin ducha integrada, etc. — un único componente agregado no puede modelar esa variabilidad ni permitir activar/desactivar partes independientes.

## R. Alternativas de modelado sanitario

| | Opción A — mantener agregado + N/A | Opción B — separar en 4 componentes (WC/Lavamanos/Ducha/Tina) | Opción C — híbrido (base + Ducha/Tina configurables) |
|---|---|---|---|
| UX | Simple pero engañosa — "No corresponde" se volvería la norma en baños sin tina o sin ducha, perdiendo la señal de excepción | Cada componente se activa solo si existe — igual patrón ya validado en Muebles/Cubierta/Lavaplatos/Campana de Cocina | Reduce complejidad pero sigue forzando WC/Lavamanos (casi siempre presentes) en el mismo agregado que a veces necesitan diferenciarse (ej. medio baño sin ducha) |
| Precisión | Baja — imposible saber cuál artefacto específico tiene la fuga reportada por el único check "fugas base" | Alta — cada componente tiene su propio estado/severidad/foto | Media-alta para Ducha/Tina, sigue baja para WC/Lavamanos |
| Edición | Editar "artefactos sanitarios" no permite quitar solo la ducha sin perder datos de WC/lavamanos | Cada componente se edita independientemente, con protección de datos ya genérica (`saveSpaceLevel2ConfigAction`) | Igual ventaja solo para Ducha/Tina |
| Resumen/PDF | Un hallazgo de fuga no indica en qué artefacto ocurrió | Cada hallazgo queda asociado a un componente específico con label propio | Igual, parcial |
| Duplicación de checks | Ninguna, pero a costa de precisión | Requiere diseño cuidadoso para no duplicar grifería/fugas entre Ducha y Tina (ver sección AE) | Mismo riesgo, acotado a Ducha/Tina |
| Históricos | Trivial — sigue existiendo 1 solo componente | Requiere que la migración del catálogo existente sea explícita (ver sección AM) | Migración parcial |
| Fuentes | Ninguna revisión gana fuente nueva | Permite auditar fuente por artefacto de forma honesta, en vez de una fuente "genérica" que en realidad solo cubre 1 de los 3 | Igual ventaja parcial |

**Recomendación explícita: Opción B — separar en componentes independientes (WC, Lavamanos, Ducha, Tina), más Mampara y Mueble de baño/Vanitorio como componentes adicionales propios.** Es el único modelo que representa correctamente la variabilidad real de casos descrita en el enunciado (medio baño, ducha sin tina, tina con ducha integrada, etc.), reutiliza el patrón ya probado 5 veces en Cocina (Muebles, Cubierta, Lavaplatos, Campana, y ahora también Ventana/Puerta como precedente de gating), y permite atribuir fuente honestamente por artefacto en vez de mantener una fuente "genérica" que hoy en realidad solo cubre descarga+fugas+goteras sin poder identificar cuál pieza. El componente agregado actual (`artefactos-sanitarios`) queda **retirado del diseño V1** — sus 3 preguntas existentes deben remapearse a los nuevos componentes en el lote de implementación correspondiente (ver sección AM), no eliminarse silenciosamente.

## S. WC / Inodoro

Componente nuevo, key propuesta `wc`. Nivel 2 Sí/No: "¿El baño tiene WC/inodoro instalado?" (prácticamente siempre Sí en un baño completo o medio baño, pero se modela igual como Nivel 2 para representar honestamente el caso raro de un "baño" en construcción sin artefactos instalados aún, y para mantener consistencia arquitectónica con el resto de los sanitarios).

Revisiones candidatas:
1. **Descarga** — "¿Después de descargar el WC, el agua deja de correr con normalidad?" — reutiliza wording ya validado del check actual, ahora atribuido específicamente al WC. Detecta: mecanismo de descarga que no cierra bien (gasto de agua sostenido). Seguridad: sin abrir el estanque. Fuente: 🟡 criterio interno adaptado ITO (mismo respaldo ya usado hoy). `defaultSeverity` propuesto: LOW (molestia de consumo de agua, no urgente).
2. **Fugas visibles en la base o conexión de agua** — reutiliza wording, ahora atribuido solo al WC (no agregado con lavamanos/ducha). Detecta: filtración activa, riesgo de daño al piso. Fuente: 🟡 criterio interno adaptado ITO. `defaultSeverity` propuesto: HIGH (mismo nivel que Lavaplatos-Fugas, mismo tipo de defecto — agua activa escapando de una instalación fija).
3. **Firmeza** — "¿El WC se ve y se siente firme, sin moverse al tocarlo?" — nueva, no existía antes en el agregado. Detecta: fijación al piso comprometida (riesgo real de filtración en el sello de cera/anillo si se mueve). Fuente: 🟡 criterio interno puro (sin analogía ITO específica encontrada todavía — pendiente de confirmar en el lote de cierre técnico). `defaultSeverity` propuesto: MEDIUM.

**Excluido deliberadamente**: inspección interna del estanque (mecanismo de la boya, válvula) — no observable de forma segura y simple, fuera de alcance según el enunciado. Tapa/asiento — evaluado y descartado por bajo valor técnico (desgaste cosmético, de reemplazo trivial, no indica un defecto de instalación de la vivienda).

3 checks propuestos.

## T. Lavamanos

Componente nuevo, key propuesta `lavamanos`. Nivel 2 Sí/No: "¿El baño tiene lavamanos instalado?".

Revisiones candidatas, diseñadas mirando explícitamente el patrón ya validado de Lavaplatos (Fase 11AE) para no repetir el error que ese cierre corrigió (fusionar "fuga bajo el mueble" + "sifón gotea" en un solo síntoma):
1. **Grifería — funcionamiento** — "¿La grifería abre y cierra correctamente, sin quedar goteando?" — reutiliza wording ya validado (Lavaplatos/artefactos-sanitarios). 🟡 criterio interno adaptado ITO. `defaultSeverity`: LOW.
2. **Agua fría/caliente** — "¿Funcionan correctamente el agua fría y caliente de la grifería, cuando la instalación dispone de ambas?" — con "No corresponde" para instalaciones solo-fría. 🟡 criterio interno, sin analogía ITO directa. `defaultSeverity`: LOW.
3. **Fugas bajo el lavamanos** — "Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavamanos?" — **un único check, no dos** (evita repetir el problema ya corregido en Lavaplatos: no se separa "fuga visible" de "sifón gotea", porque un usuario no puede diagnosticar de forma confiable cuál pieza específica falla, y ambas producen el mismo síntoma observable — agua/humedad bajo el mueble). 🟡 criterio interno adaptado ITO. `defaultSeverity`: HIGH.
4. **Fijación** — "¿El lavamanos se ve firme y bien instalado, sin moverse al tocarlo?" — 🟡 criterio interno puro. `defaultSeverity`: MEDIUM.
5. **Sello perimetral** — "¿El sello alrededor del lavamanos (o entre el lavamanos y el mueble/mesón, si corresponde) se ve continuo, sin separaciones ni grietas?" — 🟡 criterio interno (analogía con sello de Ventana/Lavaplatos). `defaultSeverity`: MEDIUM.

5 checks propuestos — mismo conteo y misma lógica de severidades que Lavaplatos de Cocina, adaptado al contexto de Baño, sin reutilizar el template (el lavamanos es un artefacto físicamente distinto, con posibles variantes — pedestal, sobre mueble — que Lavaplatos no tiene).

## U. Ducha

Componente nuevo, key propuesta `ducha`. Nivel 2 Sí/No: "¿El baño tiene ducha instalada?".

Revisiones candidatas:
1. **Grifería — funcionamiento** — "¿La grifería de la ducha abre y cierra correctamente, sin quedar goteando?" — 🟡 criterio interno adaptado ITO. `defaultSeverity`: LOW.
2. **Agua fría/caliente** — igual patrón que Lavamanos. 🟡 criterio interno. `defaultSeverity`: LOW.
3. **Fugas visibles** — "¿Se observan fugas o filtraciones visibles en las conexiones o en la base de la ducha?" — 🟡 criterio interno adaptado ITO. `defaultSeverity`: HIGH.
4. **Evacuación** — "Después de dejar correr agua varios minutos, ¿el agua drena sin quedar acumulada en el receptáculo?" — prueba funcional simple y segura, sin pedir al usuario diagnosticar la causa (pendiente insuficiente vs. obstrucción vs. desagüe — cualquiera de las tres queda fuera del alcance del usuario, solo se registra el síntoma observable). Sin fuente técnica que defina una tolerancia numérica de pendiente — **no se inventa ninguna** (el enunciado lo prohíbe explícitamente); se formula como observación binaria de resultado, no de causa. 🟡 criterio interno puro. `defaultSeverity`: MEDIUM.
5. **Firmeza del receptáculo/base** — "¿El receptáculo o base de la ducha se ve firme, sin moverse al pisarlo?" — 🟡 criterio interno puro. `defaultSeverity`: MEDIUM.
6. **Sello perimetral** — "¿El sello entre el receptáculo/base de la ducha y el muro se ve continuo, sin separaciones ni grietas?" — 🟡 criterio interno (analogía con sello de Ventana/Lavaplatos). `defaultSeverity`: MEDIUM.

6 checks propuestos. **Mampara evaluada y descartada como check dentro de Ducha** — se modela como componente propio (sección W), no folded, para poder representar duchas con cortina o sin cerramiento sin forzar "No corresponde" dentro de Ducha misma.

## V. Tina

**Decisión: componente propio, independiente de Ducha, con checks propios que NO duplican grifería/agua (para permitir "tina con ducha integrada" sin generar preguntas repetidas sobre la misma llave física).**

Key propuesta `tina`. Nivel 2 Sí/No: "¿El baño tiene tina instalada?" (puede coexistir con Ducha=Sí, representando tina-con-ducha-integrada; o existir sola).

Revisiones candidatas (deliberadamente sin grifería ni agua fría/caliente — cuando la tina tiene ducha integrada, esa grifería ya se revisa una sola vez dentro del componente Ducha):
1. **Firmeza** — "¿La tina se ve firme, sin moverse ni ceder al apoyarse levemente sobre el borde?" — 🟡 criterio interno puro. `defaultSeverity`: MEDIUM.
2. **Fugas visibles en la base o desagüe** — "¿Se observan fugas o filtraciones visibles en la base o en la conexión de desagüe de la tina?" — 🟡 criterio interno adaptado ITO. `defaultSeverity`: HIGH.
3. **Daños visibles en la superficie** — "¿La tina presenta rayas, trizaduras, desportilladuras u otros daños visibles en su superficie?" — 🟡 criterio interno puro. `defaultSeverity`: LOW.
4. **Sello perimetral** — "¿El sello entre la tina y el muro se ve continuo, sin separaciones ni grietas?" — 🟡 criterio interno. `defaultSeverity`: MEDIUM.

4 checks propuestos.

## W. Mampara

**Decisión: componente configurable propio (opción A del enunciado), no folded dentro de Ducha.**

Justificación: no toda ducha tiene mampara (cortina es una alternativa real común), y no todo cerramiento de ducha es mampara — modelarlo como pregunta independiente Sí/No evita forzar "No corresponde" dentro de Ducha para el caso, muy común, de cortina o ausencia de cerramiento.

Key propuesta `mampara`. Nivel 2 Sí/No: "¿La ducha o tina tiene mampara instalada?".

Revisiones candidatas (mirroring el patrón compacto de Cubierta/Mesón de Cocina — 2 checks, no 4, evitando sobre-granularidad):
1. **Funcionamiento** — "¿La mampara abre y cierra (o desliza) correctamente, sin trabarse?" — 🟡 criterio interno puro. `defaultSeverity`: MEDIUM.
2. **Firmeza y sello** — "¿La mampara se ve firme y bien fijada, sin daños visibles ni separaciones en su sello inferior?" (daños + firmeza + sello combinados en 1 check, mismo patrón que Cubierta-daños-sellos de Cocina). 🟡 criterio interno. `defaultSeverity`: LOW.

2 checks propuestos.

## X. Espejo

**Decisión: DESCARTAR de V1, candidato V2 (no V1, no NO-NECESARIO permanente).**

Razonamiento: los defectos posibles (daño visible, fijación) son reales pero de bajo riesgo y bajo valor diferenciador frente a lo ya cubierto por otros componentes — no hay evidencia todavía (ni de casos reales, ni de las próximas pruebas con usuarios) de que agregarlo resuelva un problema real de los usuarios. Se deja como candidato V2 explícito, a revisar si el feedback de las 5-8 sesiones de prueba con usuarios reales (ya planificadas) lo sugiere.

## Y. Mueble de baño / Vanitorio

**Decisión: SÍ merece componente Nivel 2 independiente, NO reutilizando el template `muebles-cocina`.**

Justificación de no reutilizar: aunque el patrón conceptual es análogo (mueble con puertas/cajones que puede fallar en funcionamiento, fijación o daños), el enunciado exige evaluar reutilización de TEMPLATE, no solo de patrón — un vanitorio de baño es un artefacto físicamente distinto (pedestal, suspendido, sobre-mueble) del mueble bajo/aéreo de cocina, y compartir el mismo `InspectionElementTemplate` mezclaría dos poblaciones de casos reales sin necesidad real de reutilización de catálogo (a diferencia de `revestimiento-ceramico-piso`, donde el criterio es literalmente el mismo material). No reutilizar.

Key propuesta `mueble-bano` (label "Mueble de baño / Vanitorio"). Nivel 2 Sí/No: "¿El baño tiene mueble o vanitorio instalado (bajo el lavamanos u otro fijo)?" — cubre pedestal-sin-mueble como "No" limpio.

Revisiones candidatas (mismo patrón de 3 que Muebles de cocina, adaptado):
1. **Funcionamiento** — "¿Las puertas y cajones del mueble abren, cierran o deslizan correctamente (cuando existan)?" — 🟡 criterio interno. `defaultSeverity`: MEDIUM.
2. **Fijación** — "¿El mueble se siente firme y bien sujeto, sin moverse al tocarlo?" — 🟡 criterio interno. `defaultSeverity`: HIGH (mismo criterio que Muebles de cocina — riesgo real si es suspendido).
3. **Daños visibles** — "¿El mueble presenta golpes, quiebres, rayas profundas u otros daños visibles (incluida su cubierta, si la tiene)?" — 🟡 criterio interno. `defaultSeverity`: LOW.

3 checks propuestos.

## Z. Cubierta (de vanitorio)

**Decisión: FOLDED dentro de Mueble de baño, NO componente independiente** — a diferencia de Cocina, donde Cubierta/Mesón sí se independizó de Muebles.

Justificación (aplicando el aprendizaje de Cocina, con conclusión opuesta por evidencia distinta): la independencia de Muebles/Cubierta en Cocina se basó en casos reales documentados en ambas direcciones (muebles aéreos sin cubierta; cubierta de obra sin muebles bajos). En Baño no existe evidencia equivalente — el vanitorio y su cubierta se instalan casi siempre como una sola unidad (mueble con cubierta integrada es la norma comercial), y el caso de una cubierta de obra sin mueble bajo es mucho menos común en baños que en cocinas. Se opta por incluirla como parte del check "Daños visibles" de Mueble de baño (sección Y, check 3) en vez de crear un cuarto componente. **Marcado explícitamente como revisable** si una futura fase encuentra evidencia real de independencia (mismo criterio de honestidad ya aplicado en Cocina).

## AA. Accesorios

Portarrollos, toallero, perchas, jabonera — **clasificados NO NECESARIO** (no V2). Razonamiento: a diferencia de Espejo (que sí tiene un camino plausible hacia V2 si el feedback lo sugiere), estos accesorios menores no tienen ningún defecto de instalación de vivienda asociado que valga la pena documentar — son objetos de uso, reemplazables trivialmente, sin relación con la recepción técnica del inmueble. No se identifica ningún escenario futuro razonable que los active.

## AB. Humedad / moho

**Decisión: NO se agrega ningún check nuevo específico de Baño para humedad/moho en esta fase.**

Análisis: la cobertura ya existe distribuida — Cielo ya tiene "¿Se observan manchas de humedad en el cielo?" (reutilizado sin cambios, sección K), y Ducha/Tina/Lavamanos ya tienen sus propios checks de "fugas visibles" que capturan la causa más común de humedad activa en zonas húmedas. Un check genérico adicional de "manchas de humedad/moho en el baño" duplicaría lo que Cielo ya cubre para el techo, y para los muros generaría una revisión sin componente dueño claro.

**Hallazgo transversal, fuera de alcance de Baño**: Muros (`muros`, reutilizado por Piso/Cocina/Baño/todos los recintos) hoy NO tiene un check de manchas de humedad/moho, a diferencia de Cielo que sí lo tiene desde 11AA. Agregar uno afectaría a TODOS los recintos que usan `muros`, no solo Baño — es una decisión de motor/transversal, no de Baño V1. Se documenta como candidato a evaluar en una fase dedicada a Muros en general, no se resuelve ni se bloquea Baño V1 por esto (ver sección AW).

## AC. Pendiente / evacuación de ducha

Resuelto dentro del diseño de Ducha (sección U, check 4): prueba funcional simple y seria ("después de dejar correr agua varios minutos, ¿drena sin quedar acumulada?"), sin pedir diagnóstico de causa (pendiente insuficiente vs. obstrucción vs. desagüe defectuoso quedan indistinguibles para el usuario, y no se le exige distinguirlas). Sin tolerancia numérica inventada — no existe fuente para una, y el enunciado prohíbe inventarla.

## AD. Sellos en zonas húmedas

Confirmado: **ningún check único "todos los sellos del baño"** — cada componente es responsable de su propio sello cuando tiene sentido físico: Lavamanos (sello perimetral propio), Ducha (sello perimetral propio), Tina (sello perimetral propio), Mampara (sello combinado con firmeza/daños). WC no tiene sello propio (no aplica al mecanismo de fijación por sello, su check de fugas en la base ya cubre el área equivalente). Mueble de baño no tiene sello propio (su cubierta, si existe, está folded en "Daños visibles").

## AE. Matriz de redundancia

| Candidato | Defecto que detecta | Otro check que podría detectar lo mismo | ¿Duplica? | Decisión |
|---|---|---|---|---|
| Lavamanos-Fugas | Agua bajo el lavamanos | (ninguno — único check de esta causa en Lavamanos) | No | Mantener 1 check único (no separar "fuga visible" de "sifón gotea") |
| Ducha-Fugas | Agua en conexiones/base de ducha | Ducha-Evacuación (agua acumulada) | Parcial en apariencia — pero Fugas es sobre origen de instalación, Evacuación es sobre drenaje del agua ya usada; son momentos distintos de la prueba (antes de dejar correr vs. después) | No duplica — mantener ambos, wording aclara el momento distinto |
| Tina-Fugas (base/desagüe) | Agua en la base/desagüe de tina | Tina no tiene check de "grifería" (deliberadamente excluido, ver sección V) | No | Mantener |
| Tina + Ducha (integradas) | Grifería/agua fría-caliente | Si ambas activas, Ducha ya cubre grifería/agua; Tina NO repite esos 2 checks | Evitado deliberadamente por diseño (sección V) | Tina sin grifería/agua — decisión ya aplicada |
| WC-Fugas base | Agua en la base del WC | Ya no se comparte con Lavamanos/Ducha (a diferencia del check agregado actual) | No — precisamente lo que corrige esta fase | Mantener, ahora atribuido solo a WC |
| Mueble de baño-Daños (incl. cubierta) | Daño visible en mueble o su cubierta | Ninguno — Cubierta no es componente independiente (sección Z) | No | Mantener combinado |
| Ducha-Sello perimetral / Mampara-Firmeza y sello | Separación en el encuentro receptáculo-muro vs. sello inferior de mampara | Ubicaciones físicas distintas (receptáculo-muro vs. mampara-receptáculo) | No | Mantener ambos, cada uno en su componente |
| Cielo-Manchas de humedad | Humedad visible en cielo | Ducha/Tina/Lavamanos-Fugas (causa posible pero ubicación distinta: techo vs. artefacto) | No | Mantener — ubicaciones distintas, sin overlap real |
| Muros-Fisuras | Grietas en muro | Ningún check de humedad en Muros hoy (ver sección AB) | N/A | Sin cambio en esta fase |

No se detectó ningún par de checks candidatos que describan literalmente el mismo síntoma en el mismo componente — el único ajuste real (evitar duplicar grifería/agua entre Tina y Ducha) ya está resuelto por diseño desde el principio, no como corrección posterior.

## AF. Nivel 2 — propuesta completa

**3 secciones** (evitando secciones de 1 sola pregunta cuando existe agrupación más natural — Extractor se agrupa con Ventana en vez de crear una sección "VENTILACIÓN" de 1 solo ítem, mismo precedente que Campana en Cocina; no se crea una sección separada "AGUA Y DESAGÜE" distinta de "ARTEFACTOS SANITARIOS" porque en Baño casi todo artefacto sanitario ES agua y desagüe — separar ambas etiquetas sería redundante, a diferencia de Cocina donde Lavaplatos era la única pieza de esa naturaleza):

**TERMINACIONES** (3): Revestimiento cerámico de piso, Pintura de muro, Revestimiento cerámico de muro.

**EQUIPAMIENTO DEL RECINTO** (2): Ventana, Extractor de aire.

**ARTEFACTOS SANITARIOS** (6): WC, Lavamanos, Ducha, Tina, Mampara, Mueble de baño/Vanitorio.

**Total: 11 decisiones Nivel 2.**

## AG. Componentes transversales — reutilizar o no

| Componente | Reutilizar / No reutilizar | Razón |
|---|---|---|
| Piso | Reutilizar | Ya vinculado, sin cambios de contenido |
| Muros | Reutilizar | Ya vinculado, sin cambios de contenido |
| Cielo | Reutilizar (nuevo vínculo a `bano`) | Contenido 100% transversal, ya probado en Cocina |
| Iluminación | Reutilizar (nuevo vínculo) | Igual |
| Enchufes e interruptores | Reutilizar (nuevo vínculo) | Igual |
| Ventana | Reutilizar (Nivel 2 nuevo en `bano`) | Sus 7 checks son igualmente aplicables, confirmado sección O |
| Puerta | Reutilizar (vínculo base, no Nivel 2 en Baño) | Mismo template, distinta clasificación (siempre presente en Baño, Nivel 2 en Cocina) — el motor ya soporta esto sin cambios, un mismo `elementTemplate` puede estar vinculado como base en un recinto y ser Nivel 2 en otro |
| Revestimiento cerámico de piso | Reutilizar (Nivel 2 nuevo en `bano`) | Criterio 100% de material, sin cambios |
| Pintura de muro | Reutilizar (Nivel 2 nuevo en `bano`) | Igual |
| Revestimiento cerámico de muro | Reutilizar (Nivel 2 nuevo en `bano`) | Igual — permite combinación con Pintura, sin selector excluyente, igual que en Cocina |
| Muebles de cocina | **No reutilizar** | Artefacto físicamente distinto de Mueble de baño/Vanitorio (sección Y) |
| Cubierta/Mesón | **No reutilizar** | Folded dentro de Mueble de baño en Baño, no independiente (sección Z) |
| Lavaplatos | **No reutilizar** | Artefacto físicamente distinto de Lavamanos, aunque el patrón de checks sea análogo (sección T) |
| Campana/Extractor | **No reutilizar** | Contexto y checks distintos, confirmado explícitamente (sección P) |
| Artefactos sanitarios (actual) | **Retirado del diseño V1** | Reemplazado por WC/Lavamanos/Ducha/Tina (sección Q/R) |

## AH. Componentes nuevos propuestos

| Label | Key propuesta | Alcance | Nivel 2 | Sección | Checks previstos | Fuente predominante |
|---|---|---|---|---|---|---|
| Extractor de aire | `extractor-aire` | Ventilación mecánica del recinto | Sí | EQUIPAMIENTO DEL RECINTO | 2 | 🟡 criterio interno puro |
| WC / Inodoro | `wc` | Artefacto de descarga sanitaria | Sí | ARTEFACTOS SANITARIOS | 3 | 🟡 criterio interno (2 con analogía ITO) |
| Lavamanos | `lavamanos` | Artefacto de lavado de manos | Sí | ARTEFACTOS SANITARIOS | 5 | 🟡 criterio interno (2 con analogía ITO) |
| Ducha | `ducha` | Equipo de ducha (grifería + receptáculo) | Sí | ARTEFACTOS SANITARIOS | 6 | 🟡 criterio interno (2 con analogía ITO) |
| Tina | `tina` | Bañera, independiente o con ducha integrada | Sí | ARTEFACTOS SANITARIOS | 4 | 🟡 criterio interno (1 con analogía ITO) |
| Mampara | `mampara` | Cerramiento fijo de ducha/tina | Sí | ARTEFACTOS SANITARIOS | 2 | 🟡 criterio interno puro |
| Mueble de baño / Vanitorio | `mueble-bano` | Mueble bajo lavamanos u otro fijo, incluida su cubierta | Sí | ARTEFACTOS SANITARIOS | 3 | 🟡 criterio interno puro |

7 templates nuevos propuestos. Ninguno creado en BD en esta fase.

## AI. Severidades propuestas (catálogo futuro, sin corregir el bug de UI)

Resumen de las 25 revisiones nuevas propuestas (Extractor 2 + WC 3 + Lavamanos 5 + Ducha 6 + Tina 4 + Mampara 2 + Mueble de baño 3 = 25):

- **LOW (8)**: WC-Descarga, Lavamanos-Grifería, Lavamanos-Agua fría/caliente, Ducha-Grifería, Ducha-Agua fría/caliente, Tina-Daños visibles, Mampara-Firmeza y sello, Mueble de baño-Daños visibles.
- **MEDIUM (12)**: Extractor-Funcionamiento, Extractor-Ruido/vibración, WC-Firmeza, Lavamanos-Fijación, Lavamanos-Sello perimetral, Ducha-Evacuación, Ducha-Firmeza del receptáculo, Ducha-Sello perimetral, Tina-Firmeza, Tina-Sello perimetral, Mampara-Funcionamiento, Mueble de baño-Funcionamiento.
- **HIGH (5)**: WC-Fugas, Lavamanos-Fugas, Ducha-Fugas, Tina-Fugas, Mueble de baño-Fijación.

8 + 12 + 5 = 25, coincide con el total de revisiones nuevas propuestas. Patrón: fugas activas de agua = HIGH consistentemente (igual criterio que Lavaplatos-Fugas de Cocina); firmeza/evacuación/sellos = MEDIUM; funcionamiento cosmético/grifería = LOW. Recordatorio explícito: la UI hoy preselecciona MEDIUM sin leer `defaultSeverity` (DT-01) — este diseño define el catálogo correcto igual, sin diseñar alrededor del bug ni corregirlo.

## AJ. TechnicalArticles

No se redacta ningún artículo completo en esta fase (correcto, según instrucción). Para cada uno de los 7 componentes nuevos ya queda definido: enfoque de guía (secciones S-W), fuente (🟡 en todos, con o sin analogía ITO explícita), método seguro (implícito en cada wording — ninguna revisión propuesta pide desmontar, forzar, o intervenir conexiones), riesgos (ninguna instrucción insegura detectada en el diseño). **Los 7 componentes nuevos requieren su propio lote de cierre técnico** antes de redactar contenido definitivo — mismo patrón que Muebles (11AC), Lavaplatos (11AE) y Campana (11AG) tuvieron en Cocina, donde el diseño arquitectónico nunca fue suficiente por sí solo.

## AK. Referencias visuales

`InspectionReferenceImage.count()` global sigue en 0 (confirmado en 11AI, sin cambios desde entonces). Backlog propuesto para Baño:

**ALTO VALOR**: sellos (Lavamanos, Ducha, Tina, Mampara), cerámicos de piso/muro (mismos ya priorizados en Cocina, reutilizables), daños en superficie de Tina, fugas poco evidentes bajo Lavamanos/WC, mampara con daños.

**OPCIONAL**: manchas de humedad en Cielo (ya priorizado en Cocina), daños visibles en Mueble de baño, firmeza de artefactos.

**NO NECESARIA**: funcionamiento de grifería (no comparable por imagen), Extractor (ambos checks — encendido y ruido — no son comparables visualmente, mismo criterio ya aplicado a Campana), Descarga de WC.

No se generan imágenes en esta fase.

## AL. Históricos

Política diseñada, no implementada. Los 5 espacios de Baño reales de Jorge (sección D), todos con `config: null` y solo `piso`/`muros`/`artefactos-sanitarios`, deben quedar protegidos exactamente igual que las Cocinas históricas: snapshot congelado, sin onboarding retroactivo, sin backfill de Cielo/Iluminación/Enchufes/Puerta/Ventana/sanitarios nuevos.

**Ancla histórica propuesta**: `SPACE_LEVEL2_HISTORICAL_ANCHOR.bano = "cielo"` — mismo mecanismo y mismo elemento ancla que Cocina, por el mismo motivo: Cielo es (a) siempre-presente en cualquier Baño generado por el código nuevo, y (b) nunca pudo existir en un Baño generado por el código viejo (100% nuevo en este lote). No depende de heurística frágil — se infiere 100% de datos ya existentes, igual que en Cocina. Los 5 baños reales de Jorge no tienen `cielo` hoy, por lo que quedarían correctamente clasificados como históricos apenas se publique el primer lote de Baño V1.

## AM. Evolución de config

Cohortes aplicables a Baño (mismo marco que Cocina):
- **A. Baño histórico pre-Level2**: los 5 baños reales actuales — `config: null`, sin `cielo`, tratados siempre como completamente configurados, sin onboarding forzado.
- **B. Baño nuevo creado con la primera versión de Level2** (Lote A de implementación): recibe Cielo/Iluminación/Enchufes/Puerta como base, y las 11 preguntas Nivel 2 progresivamente conforme se publiquen los lotes.
- **C. Baño creado después de futuras ampliaciones**: cualquier componente nuevo agregado a `SPACE_LEVEL2_CONFIG.bano` en el futuro aparecerá automáticamente para B y C sin romper A, mismo mecanismo genérico ya usado en Cocina (agregar una entrada más a `SPACE_LEVEL2_CONFIG.bano` no requiere cambio de schema).

**Migración del componente agregado actual** (`artefactos-sanitarios`, 3 preguntas): sus datos existentes (si los hubiera en producción — hoy 0 respuestas reales, sección D) no se pierden porque el template no se elimina, solo se retira de la ruta de generación de Baños nuevos. La remapeación de sus 3 preguntas hacia WC/Lavamanos (sección Q) es una decisión de implementación del lote correspondiente, no de esta fase de diseño — debe documentarse explícitamente en ese lote, sin alterar el catálogo ahora.

## AN. Order

Orden numérico propuesto para `SPACE_LEVEL2_CONFIG.bano` (secuencial, mismo rango que Cocina usa desde 10, continuando sin colisión ya que son `Record` separados por `spaceTemplateKey`): 10 Revest. piso, 11 Pintura muro, 12 Revest. muro, 13 Ventana, 14 Extractor, 15 WC, 16 Lavamanos, 17 Ducha, 18 Tina, 19 Mampara, 20 Mueble de baño.

Se distingue explícitamente, desde el diseño (no como hallazgo posterior como ocurrió con Campana en Cocina): el panel agrupará por `section` (3 grupos), mientras el checklist plano seguirá el `order` numérico sin agrupar — Extractor (order 14, sección EQUIPAMIENTO) aparecerá en el checklist plano ANTES que WC/Lavamanos/Ducha/Tina/Mampara/Mueble (order 15-20, sección ARTEFACTOS SANITARIOS), consistente con su order numérico menor, sin relación con el agrupamiento visual del panel. Documentado de antemano para no repetir la sorpresa que motivó la sección W de 11AG.

No se intenta resolver en esta fase el bug transversal de order no determinista de elementos base (DT-02) — Baño lo heredará igual que Cocina hasta que se corrija en una fase de motor dedicada.

## AO. Conteos

**Base (siempre presente, reutilizado)**: Piso 2 + Muros 1 + Cielo 2 + Enchufes 1 + Iluminación 1 + Puerta 1 = **8 checks**.

**Nivel 2 máximo (las 11 decisiones en Sí)**:
- TERMINACIONES: Revest. piso 2 + Pintura muro 1 + Revest. muro 2 = 5
- EQUIPAMIENTO DEL RECINTO: Ventana 7 + Extractor 2 = 9
- ARTEFACTOS SANITARIOS: WC 3 + Lavamanos 5 + Ducha 6 + Tina 4 + Mampara 2 + Mueble de baño 3 = 23
- Subtotal Nivel 2 = 5 + 9 + 23 = **37**

**MÍNIMO TEÓRICO** (ninguna decisión Nivel 2 en Sí — caso extremo, un "baño" en obra gruesa sin ningún artefacto): **8 checks**.

**MÁXIMO TEÓRICO** (las 11 en Sí — baño completo con ventana, extractor, WC, lavamanos, ducha, tina, mampara y vanitorio, todo a la vez, caso poco común pero representable): 8 + 37 = **45 checks**.

**CONFIGURACIÓN TÍPICA** (ejemplo ilustrativo, sin afirmar datos reales de uso): baño interior sin ventana con extractor, WC, lavamanos, ducha con mampara, sin tina, con vanitorio, piso y muro cerámicos, sin pintura adicional: 8 (base) + 2 (Revest. piso) + 2 (Revest. muro) + 2 (Extractor) + 3 (WC) + 5 (Lavamanos) + 6 (Ducha) + 2 (Mampara) + 3 (Mueble de baño) = **33 checks** — un rango razonable, no absurdo, comparable al máximo ya validado de Cocina (33).

## AP. Lotes de implementación propuestos

División basada en el diseño real de esta fase, no en la plantilla del enunciado:

- **LOTE A — Base + Nivel 2 inicial (Terminaciones + Ventana)**: vincular Cielo/Iluminación/Enchufes/Puerta como base a `bano`; crear ancla histórica `SPACE_LEVEL2_HISTORICAL_ANCHOR.bano = "cielo"`; agregar `SPACE_LEVEL2_CONFIG.bano` con las 3 Terminaciones + Ventana (4 decisiones, 100% componentes ya existentes y con fuente 🟢/🟢🟡 mayoritaria, riesgo mínimo — mismo patrón que Cocina Lote A+B combinados, justificado porque aquí ya no hace falta "descubrir" el patrón, solo aplicarlo).
- **LOTE B — Ventilación**: cierre técnico de Extractor de aire (mini-fase estilo 11AG) + implementación (2 checks, componente nuevo pero simple).
- **LOTE C — WC + Lavamanos**: cierre técnico conjunto (ambos son los artefactos "casi siempre presentes", conviene resolverlos juntos) + implementación, incluyendo la migración explícita del componente agregado `artefactos-sanitarios` (retirarlo de la generación de Baños nuevos).
- **LOTE D — Ducha + Mampara**: cierre técnico conjunto (Mampara depende conceptualmente de Ducha existiendo, aunque no técnicamente) + implementación.
- **LOTE E — Tina**: cierre técnico + implementación, después de Ducha para poder validar en producción el caso real "tina con ducha integrada" sin duplicación.
- **LOTE F — Mueble de baño / Vanitorio**: cierre técnico + implementación, última pieza — sin dependencias de los lotes anteriores, puede publicarse independientemente si el orden real necesita ajustarse.

Cada lote testeable de forma aislada, riesgo acotado, sin mezclar demasiadas decisiones — mismo criterio que dividió Cocina en 5 lotes (A-E) en vez de un solo big-bang.

## AQ. Orden de implementación — justificación

1. **Arquitectura/base primero** (Lote A): sin Cielo/Iluminación/Enchufes/Puerta/ancla histórica, ningún lote posterior tiene dónde apoyarse — mismo orden que Cocina siguió (11AA antes que cualquier Nivel 2 de artefactos).
2. **Reutilización de componentes ya publicados** (Terminaciones + Ventana, dentro de Lote A): riesgo casi nulo, cero contenido nuevo que redactar, solo vínculos y Nivel 2 — recomendable hacerlo primero para validar el "ancla histórica" en un caso de bajo riesgo antes de tocar contenido sanitario nuevo.
3. **Componentes con fuente fuerte antes que los más subjetivos**: Ventana (🟢 mayoritario) antes que Extractor (🟡 puro) — mismo criterio.
4. **Componentes sanitarios centrales antes que los periféricos**: WC/Lavamanos (casi siempre presentes, mayor impacto en cobertura real) antes que Ducha/Tina/Mampara (más variables) antes que Mueble de baño (el más discrecional, más parecido a "equipamiento" que a "artefacto sanitario" propiamente).
5. **Elementos más subjetivos al final**: Mueble de baño y Mampara, ambos 100% criterio interno sin ninguna analogía ITO todavía confirmada, quedan en los últimos lotes.

## AR. Elementos fuera de V1

| Elemento | Descartado / V2 | Razón |
|---|---|---|
| Espejo | **V2** | Bajo riesgo/valor diferencial hoy; revisar según feedback real de usuarios (sección X) |
| Accesorios (portarrollos, toallero, perchas, jabonera) | **Descartado** (no V2) | Sin defecto de instalación de vivienda asociado, sin escenario futuro plausible (sección AA) |
| Cubierta de vanitorio como componente independiente | **Descartado** (folded en Mueble de baño) | Sin evidencia de independencia real en Baño, a diferencia de Cocina (sección Z) |
| Inspección interna del estanque de WC | **Descartado** | No observable de forma segura/simple |
| Tapa/asiento de WC como check propio | **Descartado** | Desgaste cosmético trivial, sin relación con defecto de instalación |
| Check "humedad/moho general del baño" | **Descartado de esta fase** (candidato transversal a Muros, no específico de Baño) | Ya cubierto parcialmente por Cielo y por los checks de fugas de cada artefacto; agregar a Muros afectaría todos los recintos (sección AB) |
| Grifería/velocidades/iluminación incorporada del Extractor | **Descartado** | Extractor de baño estándar no tiene esas características, a diferencia de Campana |
| Reutilización de `muebles-cocina` para Mueble de baño | **Descartado** | Artefacto físicamente distinto (sección Y) |
| Reutilización de `campana-extractor` para Extractor de aire | **Descartado** | Contexto y checks distintos (sección P) |
| Sección Nivel 2 "VENTILACIÓN" separada | **Descartado** | Un solo componente (Extractor) no justifica sección propia; agrupado con Ventana en EQUIPAMIENTO DEL RECINTO |
| Sección Nivel 2 "AGUA Y DESAGÜE" separada de "ARTEFACTOS SANITARIOS" | **Descartado** | Redundante en Baño — casi todo artefacto sanitario ya es agua y desagüe |

## AS. Deudas transversales (no se mezclan con el diseño de Baño)

- **DT-01** (defaultSeverity no llega a la UI): vigente, sin corregir. Baño se diseña igual, con severidades correctas en catálogo (sección AI) sin depender de que la UI las lea todavía.
- **DT-02** (order no determinista de elementos base): vigente, sin corregir. Baño heredará el mismo comportamiento en Piso/Muros/Cielo/Enchufes/Iluminación/Puerta que Cocina.
- **DT-03** (seed no reproduce completamente el catálogo real): vigente para Ventana en Cocina; aplicará también a Baño una vez implementado, si el seed no se actualiza en cada lote — a evaluar en cada lote de implementación de Baño, no en esta fase de diseño.
- **DT-04** (referencias visuales, 0 imágenes cargadas): vigente, sin corregir. Baño agrega su propio backlog (sección AK) al mismo backlog pendiente de Cocina.

Ninguna deuda bloquea el diseño de Baño V1 — todas son de motor o de contenido futuro, no de arquitectura.

## AT. Árbol final propuesto

```
Baño
├── Piso [B] — 2 checks (reutilizado)
├── Muros [B] — 1 check (reutilizado)
├── Cielo [B] — 2 checks (reutilizado, nuevo vínculo)
├── Enchufes e interruptores [B] — 1 check (reutilizado, nuevo vínculo)
├── Iluminación [B] — 1 check (reutilizado, nuevo vínculo)
├── Puerta [B] — 1 check (reutilizado, nuevo vínculo — SIEMPRE presente en Baño, a diferencia de Cocina)
│
├── TERMINACIONES
│   ├── Revestimiento cerámico de piso [L2][D] — 2 checks (reutilizado)
│   ├── Pintura de muro [L2][D] — 1 check (reutilizado)
│   └── Revestimiento cerámico de muro [L2][D] — 2 checks (reutilizado)
│
├── EQUIPAMIENTO DEL RECINTO
│   ├── Ventana [L2] — 7 checks (reutilizado, sin cambios)
│   └── Extractor de aire [L2] — 2 checks (nuevo)
│
└── ARTEFACTOS SANITARIOS
    ├── WC / Inodoro [L2] — 3 checks (nuevo)
    ├── Lavamanos [L2] — 5 checks (nuevo)
    ├── Ducha [L2] — 6 checks (nuevo)
    ├── Tina [L2] — 4 checks (nuevo, sin grifería/agua — no duplica Ducha)
    ├── Mampara [L2] — 2 checks (nuevo)
    └── Mueble de baño / Vanitorio [L2] — 3 checks (nuevo, incluye cubierta folded)
```

## AU. Matriz final de Baño V1

| Componente | Key | Base/L2/Derivado | Sección | Checks | Fuente | Reutilizado/Nuevo | Lote | Estado |
|---|---|---|---|---|---|---|---|---|
| Piso | `piso` | Base | — | 2 | 🟢 | Reutilizado | A | Ya vinculado |
| Muros | `muros` | Base | — | 1 | 🟢🟡 | Reutilizado | A | Ya vinculado |
| Cielo | `cielo` | Base | — | 2 | 🟡 | Reutilizado (nuevo vínculo) | A | Diseñado |
| Enchufes e interruptores | `enchufes-interruptores` | Base | — | 1 | 🟢🟡 | Reutilizado (nuevo vínculo) | A | Diseñado |
| Iluminación | `iluminacion` | Base | — | 1 | 🟡 | Reutilizado (nuevo vínculo) | A | Diseñado |
| Puerta | `puerta` | Base | — | 1 | 🟢 | Reutilizado (nuevo vínculo) | A | Diseñado |
| Revestimiento cerámico de piso | `revestimiento-ceramico-piso` | L2 / Derivado | TERMINACIONES | 2 | 🟢 | Reutilizado | A | Diseñado |
| Pintura de muro | `pintura-muro` | L2 / Derivado | TERMINACIONES | 1 | 🟢 | Reutilizado | A | Diseñado |
| Revestimiento cerámico de muro | `revestimiento-ceramico-muro` | L2 / Derivado | TERMINACIONES | 2 | 🟢 | Reutilizado | A | Diseñado |
| Ventana | `ventana` | L2 | EQUIPAMIENTO DEL RECINTO | 7 | 🟢 mayoritario | Reutilizado | A | Diseñado |
| Extractor de aire | `extractor-aire` | L2 | EQUIPAMIENTO DEL RECINTO | 2 | 🟡 | Nuevo | B | Requiere cierre técnico |
| WC / Inodoro | `wc` | L2 | ARTEFACTOS SANITARIOS | 3 | 🟡 (2 con analogía ITO) | Nuevo | C | Requiere cierre técnico |
| Lavamanos | `lavamanos` | L2 | ARTEFACTOS SANITARIOS | 5 | 🟡 (2 con analogía ITO) | Nuevo | C | Requiere cierre técnico |
| Ducha | `ducha` | L2 | ARTEFACTOS SANITARIOS | 6 | 🟡 (2 con analogía ITO) | Nuevo | D | Requiere cierre técnico |
| Mampara | `mampara` | L2 | ARTEFACTOS SANITARIOS | 2 | 🟡 | Nuevo | D | Requiere cierre técnico |
| Tina | `tina` | L2 | ARTEFACTOS SANITARIOS | 4 | 🟡 (1 con analogía ITO) | Nuevo | E | Requiere cierre técnico |
| Mueble de baño / Vanitorio | `mueble-bano` | L2 | ARTEFACTOS SANITARIOS | 3 | 🟡 | Nuevo | F | Requiere cierre técnico |

**Componente retirado del diseño V1**: `artefactos-sanitarios` (agregado actual, 3 checks) — permanece en catálogo sin cambios hasta que el Lote C lo remapee explícitamente; no se genera para Baños nuevos una vez publicado ese lote.

## AV. Riesgos

- **Migración del componente agregado actual**: si el Lote C no documenta con precisión el remapeo de las 3 preguntas actuales hacia WC/Lavamanos, se corre el riesgo de perder trazabilidad de qué pregunta reemplaza a cuál — mitigación: exigir explícitamente esa tabla de remapeo dentro del informe del Lote C, no en esta fase.
- **Tina-con-ducha-integrada percibida como "doble checklist"** por el usuario si activa ambas — mitigado por diseño (Tina sin grifería/agua), pero debe validarse con QA real en el lote correspondiente, no solo con el argumento de diseño de esta fase.
- **7 componentes nuevos, cada uno pendiente de su propio cierre técnico** — mayor volumen de trabajo de redacción/fuente que cualquier lote individual de Cocina; se mitiga dividiendo en 5 lotes de cierre técnico (B-F) en vez de uno solo.
- **Ninguna fuente 🟢 fuerte para artefactos sanitarios** — igual que Lavaplatos/Campana en Cocina, es un riesgo de percepción (menos "oficial") pero no un riesgo de seguridad, ya que ninguna guía diseñada pide acciones inseguras.

## AW. Decisiones pendientes (explícitas, no bloquean el diseño arquitectónico pero sí la implementación)

1. **Fuente/wording definitivos de los 7 componentes nuevos** — cada uno requiere su propio lote de cierre técnico (estilo 11AC/11AE/11AG) antes de implementarse, según lo indicado explícitamente por el enunciado de esta fase.
2. **Remapeo exacto de las 3 preguntas actuales de `artefactos-sanitarios`** hacia WC/Lavamanos — a resolver en el Lote C, no en esta fase.
3. **Posible check de humedad/moho en Muros** (transversal, afecta a todos los recintos) — fuera de alcance de Baño, a evaluar en una fase de motor/Muros dedicada, sin fecha.
4. **Genericación futura de `mueble-bano`** (evaluar si algún otro recinto podría reutilizarlo) — sin evidencia hoy, dejado abierto igual que `muebles-cocina`/`cubierta-meson` quedaron en Cocina (11AC §Z).

Ninguna de estas 4 es una decisión de arquitectura sin resolver — todas son de contenido/implementación de un lote futuro específico, exactamente el tipo de pendiente que el enunciado anticipa como aceptable ("si un componente necesita todavía una revisión técnica profunda: marcarlo como lote de cierre específico").

## AX. Estado final

Diseño arquitectónico de Baño V1 completo: estado actual auditado, 6 componentes base resueltos (todos reutilizados), 3 terminaciones resueltas (reutilizadas), 6 artefactos sanitarios modelados con decisión explícita de descomposición (Opción B), Ducha/Tina resueltas sin duplicación, Ventana/Puerta resueltas (Puerta pasa a base, justificado), Ventilación resuelta (componente nuevo, sin reutilizar Campana), Electricidad/Iluminación resueltas (reutilizadas sin cambios de seguridad), redundancias identificadas y descartadas (matriz AE), fuentes clasificadas honestamente (ninguna inflada a 🟢 sin base — Manual confirmado sin cobertura sanitaria), Nivel 2 diseñado (11 decisiones, 3 secciones), históricos considerados (ancla `cielo`, mismo mecanismo que Cocina), evolución de config considerada, conteos estimados (mínimo 8, máximo 45, típico 33), 6 lotes definidos con orden justificado, fuera de V1 explícito (10 elementos descartados o V2).

Sin embargo, **7 componentes nuevos requieren su propio cierre técnico específico** (Extractor de aire, WC, Lavamanos, Ducha, Mampara, Tina, Mueble de baño/Vanitorio) antes de poder implementarse — exactamente el mismo patrón que Muebles (11AC), Lavaplatos (11AE) y Campana (11AG) necesitaron en Cocina, donde el diseño arquitectónico nunca fue suficiente por sí solo para pasar directo a implementación. Esto no es una falla de esta fase — es la aplicación consistente del mismo estándar de rigor ya validado.

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AJ_DISENO_CANONICO_BANO_V1.md`

Archivos modificados: ninguno.

Código = 0
Prisma = 0
BD = NO (solo lectura)
Catálogo = NO
Seed = NO
TechnicalArticles en BD = NO
Commit = NO
Push = NO
Deploy = NO

🟡 FASE 11AJ — ARQUITECTURA DE BAÑO V1 DEFINIDA; REQUIERE CIERRES TÉCNICOS ESPECÍFICOS

Componentes que requieren su propio cierre técnico antes de implementarse:
1. Extractor de aire (`extractor-aire`)
2. WC / Inodoro (`wc`)
3. Lavamanos (`lavamanos`)
4. Ducha (`ducha`)
5. Mampara (`mampara`)
6. Tina (`tina`)
7. Mueble de baño / Vanitorio (`mueble-bano`)

DETENERSE. No implementar todavía.
