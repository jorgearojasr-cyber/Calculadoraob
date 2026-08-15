# FASE 9A — Especificación del Informe Profesional de Inspecciones

**Estado del documento**: especificación únicamente. No se modificó código, schema, ni se instaló ninguna librería. Sin commit asociado.

**Fecha**: 2026-08-15

---

## A. Objetivo del informe

Dar a la inspección realizada en la app una salida profesional, imprimible/entregable, que un inspector pueda dejarle a un propietario o comprador y que se entienda sin explicación adicional. El informe es un **reflejo fiel** de lo capturado en `InspectionCase` — no agrega diagnóstico, no certifica, no evalúa normativa que no exista en la fuente. Esta fase entrega la especificación completa para que una fase de implementación (PDF) no tenga que decidir nada de producto por su cuenta.

## B. Público objetivo

- **Inspector**: necesita trazabilidad exacta — qué se preguntó, qué se respondió, cuándo, con qué evidencia fotográfica. Lenguaje puede ser técnico en el detalle.
- **Propietario/comprador**: necesita entender rápido qué se encontró sin tener que interpretar jerga. El resumen ejecutivo y el resultado global deben ser legibles por esta audiencia sin ayuda.

Regla de lenguaje: el documento se escribe pensando en el propietario primero (audiencia más amplia y menos experta); cuando aparece un término técnico inevitable (ej. "fisura capilar", "paralelismo"), se explica en una línea breve — mismo criterio ya aplicado en los `TechnicalArticle` de Fase 5B (tono práctico, no un manual de ingeniería).

## C. Tipo de informe

**Recomendación: C — Ambos (resumido + detallado), derivados de la misma fuente de datos.**

Justificación desde uso real, no por defecto:
- Un comprador evaluando una propiedad quiere 1-2 páginas que le digan "¿está bien o hay problemas, y qué tan graves?" — eso es el **resumen ejecutivo**. Pedirle que lea 20 páginas de checklist para llegar a esa conclusión es friccioso y hace que el informe se sienta burocrático (justo lo que la sección 1 pide evitar).
- Un inspector (o el mismo propietario, si quiere profundizar) necesita el **detalle completo** con fotos, comentarios y contexto por espacio para sustentar cada hallazgo — sin esto, el informe pierde su valor de trazabilidad.
- No requiere dos fuentes de datos ni dos flujos de captura: ambos se derivan de la misma consulta a `InspectionCase` (igual que ya hace `/resumen`, Fase 8) — el "resumido" es literalmente un subconjunto de secciones del "detallado" (ver sección U).

## D. Estructura completa

1. Portada
2. Resumen ejecutivo
3. Aviso de completitud
4. Resultado global
5. Resumen por espacios
6. Hallazgos (vigentes)
7. Hallazgos históricos
8. Puntos pendientes
9. Registro fotográfico general
10. Detalle de inspección por espacio *(solo informe detallado)*
11. Alcance y limitaciones
12. Cierre (inspector, fecha, identificación del informe)

Nota respecto al ejemplo conceptual del enunciado: se separan "Hallazgos" y "Hallazgos históricos" en secciones propias (no fusionadas dentro de "Hallazgos") porque son semánticamente distintos y mezclarlos underminaría exactamente la distinción que Fase 7B/8 ya construyó — un lector no debe tener que leer la etiqueta de cada tarjeta para saber si algo es vigente.

## E. Portada

**Disponible actualmente** (todo sale de `InspectionCase`/`User`, sin cambios de schema):
- Nombre/título de la inspección (`InspectionCase.name`)
- Tipo de inmueble (`tipoInmueble`: Casa/Departamento/Ampliación)
- Dirección (`direccion`, si existe)
- Fecha de inspección (`fecha`, si fue registrada; ver sección T)
- Estado del caso (`estado` — mostrado tal cual, ver sección G sobre por qué no se usa como indicador de calidad)
- Marca del producto ("ObraBien Calcula" / "Calculadora Aprende Construye" — identidad visual ya existente, no un logo nuevo)
- Nombre del usuario que hizo la inspección, si se quiere mostrar como "Realizado por" (`User.name` o `User.email` como respaldo si `name` es null)

**Campo futuro recomendado** (no existe hoy en el modelo, no se implementa en esta fase):
- Identificador/código de informe formal (ver sección T)
- Fotografía principal de portada seleccionable (ver sección M — hoy no hay forma de marcar una foto como "portada")
- Nombre de empresa/inspector profesional distinto del usuario de la cuenta (`User` no tiene campo "empresa")
- Logo de la empresa inspectora (si en el futuro se permite white-label)

## F. Identidad visual

Reutilizar el sistema de tokens ya establecido en Calculadora — nada se inventa:
- **Color principal / marca**: los mismos tokens `ink`/`navy` ya usados en headers y títulos del producto.
- **Color de acción**: `action` (botones primarios) y `safety` (links/CTAs de navegación, ya usado en "Revisar"/"Ir a revisar" del resumen web).
- **OK**: `success` / `success-tint` (verde, mismo usado en `StatusPill`/`ResumenResultadoGlobal`).
- **Observación**: `caution-tint` + el tono de texto ámbar oscurecido ya definido localmente en Inspecciones (`#8A620D`, documentado en `checklist-item-row.tsx` por motivo de contraste WCAG AA — se reutiliza tal cual, no un ámbar nuevo).
- **No aplica**: `concrete` / `ink-muted` (gris neutro).
- **Pendiente**: blanco con borde `border` (mismo tratamiento ya usado en `ResumenResultadoGlobal`).
- **Severidades**: Baja/Media reutilizan el mismo tono ámbar de "Observación"; Alta/Crítica reutilizan `danger`/`danger-tint` (rojo) — exactamente el mapeo `SEVERITY_TONE` ya implementado en Fase 4/8, sin una tercera escala nueva.
- **Tipografía**: la familia `display` para títulos (ya usada en `font-display` de toda la app) + la sans regular para cuerpo — mismo par tipográfico, sin fuentes nuevas.
- **Tarjetas**: `rounded-2xl`/`rounded-xl` con `border border-border` sobre fondo blanco — mismo lenguaje que toda tarjeta de Calculadora (Radier, Regularización, Inspecciones).
- **Iconografía**: los mismos íconos `lucide-react` ya en uso (`Check`, `TriangleAlert`, `X`, `CircleDashed`, `Camera`, `History`, `MapPin`) — sin set de íconos nuevo.

Para el PDF específicamente (fase futura, no implementada acá): estos mismos tokens deben traducirse a valores hex/pt fijos (un PDF no lee CSS variables), pero el **mapeo semántico** (qué color significa qué estado) es el que esta sección fija — la fase de implementación no debe reinterpretarlo.

## G. Resumen ejecutivo

Primera sección después de la portada. Responde, en este orden, sin adornos:

1. **Qué se inspeccionó**: tipo de inmueble + dirección (si existe) + cantidad de espacios.
2. **Cuándo**: fecha de inspección (o "fecha no registrada" si `fecha` es null).
3. **Cuántos puntos se revisaron**: total de `InspectionChecklistCheck` del caso.
4. **Desglose**: OK / Observación / No aplica / Pendientes (conteos exactos, mismos que `/resumen` ya calcula en Fase 8 — reutilizar esa misma lógica derivada, no una nueva).
5. **Cuántos hallazgos existen**: total de `InspectionObservation` (vigentes + históricos, indicando cuántos de cada uno).
6. **Distribución de severidad**: Baja/Media/Alta/Crítica, solo de hallazgos vigentes (los históricos no representan una condición actual — mostrarlos acá confundiría la lectura rápida; sí aparecen íntegros más adelante en su propia sección).

**Regla explícita, no negociable**: no se convierte esto en una nota, puntaje o veredicto ("Vivienda 85% buena", "Estado: Bueno/Regular/Malo"). No existe hoy una metodología aprobada para ponderar severidad y cantidad de hallazgos en un solo número, y presentar uno sin esa metodología sería fabricar autoridad que el dato no respalda — mismo principio ya aplicado en Fase 5B/6A a la normativa. Si en el futuro se aprueba una metodología explícita de scoring, es una fase de producto aparte, con su propio diseño y aprobación — no una decisión que tome la fase de implementación del PDF por su cuenta.

## H. Aviso de completitud

Sección corta, muy visible, inmediatamente después del resumen ejecutivo (o integrada en él, ver sección D — se lista aparte acá porque el enunciado la pide como punto propio, pero en el documento final puede vivir dentro del resumen ejecutivo sin problema).

- Si `pending === 0`: **"Inspección completada: N de N puntos revisados."** (tono positivo/success).
- Si `pending > 0`: **"Inspección incompleta: quedan N puntos pendientes de revisión."** (tono de atención/caution — no error, no rojo de severidad, para no confundirlo con un hallazgo).

Regla explícita: esta sección **nunca** se combina visualmente con "sin observaciones" — son ejes independientes. Un informe puede decir simultáneamente "Inspección completada: 40 de 40" y "5 observaciones registradas, 1 de severidad Alta" en la misma página, uno junto al otro, sin que ninguno opaque al otro. Esto ya es exactamente el comportamiento de `ResumenCompletitudBanner` (Fase 8) — el PDF reutiliza el mismo criterio, no uno nuevo.

## I. Resultado global

Misma data que `/resumen` (Fase 8), en formato apto para imprimir:
- 4 bloques: OK / Observación / No aplica / Pendiente, con conteo y color semántico (sección F).
- Distribución de severidad (Baja/Media/Alta/Crítica) de los hallazgos vigentes, con conteo por categoría.

Regla: exactamente los estados de `InspectionAnswerStatus` (OK/OBSERVATION/NOT_APPLICABLE + pendiente=null) y `InspectionSeverity` (LOW/MEDIUM/HIGH/CRITICAL) — ningún estado nuevo, ninguna fusión de categorías, ninguna escala de aprobación/reprobación.

Formato recomendado: **tarjetas** (no tabla ni gráfico) — mismo criterio visual que `ResumenResultadoGlobal.tsx`, prioriza lectura en 2 segundos sobre precisión tabular; una tabla se sentiría "exportación de base de datos" (lo que la sección 1 pide evitar).

## J. Resumen por espacios

Un bloque por `InspectionSpace` real del caso (nombre dinámico — nunca "Cocina"/"Living" hardcodeado, ver sección Z/28):

```
COCINA
████████████████████ 100%
20 puntos revisados
18 OK · 1 Observación · 1 No aplica
```

Formato recomendado: **tarjeta compacta con barra de progreso simple**, no tabla ni gráfico de torta — coherente con `ResumenEspacioCard.tsx` (Fase 8), que ya resolvió exactamente este problema para la versión web; el PDF reutiliza el mismo criterio de densidad. Barra de progreso como elemento gráfico simple (rectángulo relleno proporcional), no un gráfico con librería — mantiene el documento "profesional pero sobrio", no "dashboard".

Orden: mismo `order` ya usado por `InspectionSpace` (el orden en que el usuario los configuró/recorrió), no alfabético.

## K. Hallazgos (vigentes)

Sección central del informe — mayor densidad de información permitida acá. Estructura exacta por hallazgo:

```
Cocina — Muros
¿Presenta fisuras visibles?
🔴 Alta

"Se observa fisura vertical de aprox. 2mm junto al marco de la ventana."

[Fotografía 1] [Fotografía 2]

Referencia técnica: "Cómo revisar fisuras en muros" →
```

Campos, en este orden, cada uno solo si existe (nunca "N/A" o campos vacíos visibles):
1. Espacio — Elemento (contexto de ubicación, siempre presente)
2. Pregunta (`questionSnapshot` — el texto exacto que se le mostró al inspector, nunca el texto actual del catálogo si cambió después)
3. Severidad (badge de color, sección F)
4. Comentario (texto del hallazgo)
5. Recomendación, si existe (`InspectionObservation.recommendation`, opcional)
6. Fotografías asociadas a esa observación específica (no las de espacio/elemento — ver sección M)
7. Referencia a `TechnicalArticle`, si el check tiene `technicalArticleSlug` (ver sección N — solo referencia, no contenido completo)

Orden de los hallazgos: agrupados por espacio (mismo orden que sección J), y dentro de cada espacio, por severidad descendente (Crítica → Alta → Media → Baja) — así el hallazgo más urgente de cada espacio aparece primero, sin necesidad de que el lector escanee toda la sección para encontrarlo.

## L. Hallazgos históricos

Misma estructura de tarjeta que sección K, pero:
- Encabezado visual explícito: **"Hallazgo anterior — no vigente"** (mismo texto/ícono ya usado en `ResumenHallazgoCard.tsx`, badge `History`).
- Ubicados en su **propia sección**, después de "Puntos pendientes" (ver estructura D) — nunca mezclados entre los vigentes, para que un lector que solo escanea "Hallazgos" no los confunda con condiciones actuales.
- Contienen exactamente los mismos campos que un hallazgo vigente (nada se omite ni se resume) — el dato histórico completo se conserva, solo cambia el rótulo y la ubicación.
- Nota introductoria a la sección explicando qué significa: *"Los siguientes hallazgos fueron registrados durante la inspección pero el punto correspondiente fue posteriormente marcado como OK o No aplica. Se conservan para trazabilidad, pero no representan una condición vigente."*

## M. Fotografías

Estrategia por contexto, no galería suelta:

- **Fotografías generales** (nivel `case`): sección propia, cerca del inicio (después del resumen ejecutivo o en la portada como candidata a foto principal — ver abajo). Grilla simple, sin numeración de hallazgo (no están atadas a uno).
- **Fotografías de espacio**: dentro del bloque de "Detalle de inspección por espacio" (sección informe detallado únicamente), agrupadas bajo el nombre del espacio.
- **Fotografías de elemento**: mismo lugar, un nivel más anidado (Espacio → Elemento), en el detalle por espacio.
- **Fotografías de hallazgo**: **siempre junto al hallazgo correspondiente** (sección K/L), nunca repetidas en una galería aparte — mismo criterio ya validado en `/resumen` (Fase 8, sección H: "las de observación ya se muestran junto a su hallazgo, sin duplicar").

Para fotos de hallazgo, mostrar el contexto completo como breadcrumb encima o al pie de la imagen: `Espacio → Elemento → Hallazgo` (ya implícito en el encabezado de la tarjeta de hallazgo, sección K — no se repite dos veces, basta con que la foto viva dentro de esa tarjeta).

**Tamaño/disposición** (conceptual, para la fase PDF):
- Tamaño moderado (ej. 4-6cm de ancho en la página), suficiente para ver el detalle sin dominar la página — el hallazgo es el protagonista, la foto es evidencia de apoyo.
- Hasta 2-3 fotos por hallazgo en línea horizontal antes de saltar de fila (la mayoría de hallazgos tendrán 1, algunos 2-3 — no se diseña para decenas por hallazgo).
- Pie de foto: opcional, solo si `caption`/`notes` tiene contenido (campos que ya existen en `InspectionPhoto` pero hoy no se capturan desde la UI — ver sección X).
- Sin numeración global tipo "Figura 12" — el contexto (espacio/elemento/hallazgo) ya identifica cada foto sin necesidad de un índice fotográfico separado, evitando burocracia innecesaria.

## N. Fotografía principal (portada)

**Hoy no existe forma de marcar una foto como "principal"** — `InspectionPhoto` no tiene un campo `isPrimary`/`isCover`.

Opciones evaluadas:
- Primera fotografía general (`orderBy createdAt asc`, la primera del nivel `case`): funciona sin cambios de schema, pero es arbitraria (depende del orden de subida, no de una elección real).
- Ninguna fotografía en portada: más simple, evita mostrar una foto irrelevante por accidente de orden.

**Recomendación para V1 del PDF**: ninguna fotografía en portada — usar un tratamiento tipográfico/de color en su lugar (mismo criterio de "no inventar contenido que no existe" aplicado a imágenes). Selección manual de portada queda documentada como **mejora futura** (requeriría un campo nuevo en `InspectionPhoto`, ej. `isCover: Boolean @default(false)`, fuera de alcance de esta fase).

## O. Detalle de inspección por espacio *(solo informe detallado)*

Una sección por espacio, en el mismo orden que J, con:
- Progreso (idéntico dato que J, no repetido en texto largo — un renglón).
- Lista de elementos del espacio con su estado (para elementos sin ninguna observación, basta una línea "Piso — OK" o similar; no se repite la pregunta completa a menos que tenga una observación, ver sección Q).
- Observaciones de ese espacio (referencia cruzada a la sección K/L, no re-impresas completas dos veces — ver sección Q, Opción C).
- Fotografías de ese espacio y sus elementos (sección M).

## P. Puntos pendientes

Igual que `/resumen` (Fase 8): agrupados por espacio, listando elemento + pregunta de cada check sin responder. Sección obligatoria si `pending > 0` — **nunca oculta**, incluso en el informe resumido (aunque sea solo el conteo total ahí, con el detalle completo en el informe detallado) — un informe que omite pendientes podría leerse como "inspección terminada" cuando no lo está, violando directamente el principio de la sección H.

## Q. Checklist completo — Opción A/B/C

**Recomendación: C — resumen de todos + detalle de observaciones**, igual que sugiere el enunciado, justificado así:

- **Opción A (mostrar las 11+ preguntas completas)**: exhaustivo pero exactamente el "listado interminable" que la sección 1 pide evitar — para una Casa con 40 puntos, son 40 líneas de "¿Presenta X? — OK" sin ningún valor informativo nuevo (ya sabemos por el resumen que están OK).
- **Opción B (solo preguntas con observación)**: más liviano, pero pierde trazabilidad — un inspector o un comprador exigente puede querer confirmar que TODOS los puntos fueron efectivamente revisados, no solo enterarse de los problemas.
- **Opción C (elegida)**: el resumen por espacio (sección J) ya muestra el conteo agregado (18 OK / 1 Observación / 1 No aplica) sin listar cada pregunta; el detalle por espacio (sección O) lista los elementos con una línea cada uno; y las preguntas que SÍ tienen una observación se expanden completas en la sección de Hallazgos (K/L) — así ningún dato se pierde, pero solo se profundiza donde hay algo que profundizar.

## R. TechnicalArticle — Opción A/B/C

**Recomendación: B — mostrar una referencia breve**, coincide con la sugerencia del enunciado.

- Opción A (no incluirlo) pierde valor: el artículo explica exactamente cómo se detectó/qué significa el hallazgo, información relevante para el lector del informe.
- Opción C (contenido completo) convierte cada hallazgo en un mini-manual — exactamente lo que la sección 17 pide evitar ("no convertir el informe en un manual"), y además duplicaría contenido educativo en cada instancia del mismo artículo si aparece en varios hallazgos del mismo tipo.
- Opción B: mostrar solo el título del artículo como referencia con un indicador visual (ej. "Referencia técnica: 'Cómo revisar fisuras en muros'"), sin el contenido — en la versión PDF no hay forma de "expandir" como en la web (`TechnicalArticleLink`), así que la referencia queda como texto fijo, sin contenido embebido. Si en el futuro el PDF es interactivo (ej. con links a una versión web), podría enlazar al artículo — mejora futura, no esta fase.

## S. Normativa

Regla explícita, sin excepciones: el informe **nunca** afirma "Cumple OGUC", "Cumple NCh", "No cumple normativa" ni ninguna variante, porque el contenido auditado en Fase 5A/5B/6A confirmó que no existe ninguna referencia OGUC/LGUC/NCh estructurada y verificada para los puntos actualmente cubiertos.

El informe distingue explícitamente dos categorías, y solo usa la primera en V1:
- **Observación visual/técnica**: lo que el inspector efectivamente vio y registró — esto es lo único que el informe reporta.
- **Evaluación normativa**: comparación contra un estándar legal/técnico formal — **fuera de alcance de V1**, y no se simula ni insinúa. Donde el `TechnicalArticle` de origen ya incluye la frase "Sin referencia normativa verificada en esta fuente" (Fase 5B), esa frase puede citarse tal cual si se muestra contexto de fuente, pero nunca se reformula como una afirmación de cumplimiento.

Esta sección no es opcional ni ajustable por la fase de implementación — es una restricción de producto ya establecida en fases anteriores y que este documento hereda sin reinterpretar.

## T. Conclusiones

**Recomendación: sección "Resumen de hallazgos", no "Conclusiones".**

"Conclusiones" implica un juicio o síntesis interpretativa que esta V1 no está en condiciones de emitir de forma responsable. "Resumen de hallazgos" describe con precisión lo que la sección realmente contiene: una recapitulación de lo encontrado, sin extrapolar.

Contenido permitido: recapitulación cuantitativa (cuántos hallazgos por severidad, cuántos espacios con al menos una observación, si la inspección quedó completa) — **datos que ya aparecieron antes en el documento**, presentados una vez más en cierre para quien solo lee la última página.

Contenido explícitamente prohibido en V1:
- Afirmar o insinuar seguridad estructural.
- Afirmar o insinuar habitabilidad.
- Afirmar o insinuar cumplimiento normativo.
- Afirmar ausencia total de defectos ("la propiedad no presenta problemas") — el informe solo puede decir "no se registraron observaciones en los puntos inspeccionados", que es una afirmación distinta y más honesta (no cubre lo que no se inspeccionó).

## U. Alcance y limitaciones

Sección final antes del cierre, contenido conceptual (no texto legal definitivo — se redacta en una fase posterior con revisión adecuada):

- **Alcance**: la inspección cubrió los espacios y elementos listados en este informe, según el catálogo vigente de ObraBien Calcula al momento de realizarla.
- **Carácter visual**: la inspección es una revisión visual y funcional básica, no un peritaje técnico ni un ensayo de laboratorio.
- **Puntos inspeccionados vs. no inspeccionados**: el informe debe dejar explícito que el catálogo actual (V1, ver Fase 6A) no cubre exhaustivamente todos los elementos posibles de una propiedad — hay categorías conocidas fuera de alcance (ej. estructura en Ampliación, instalaciones eléctricas/sanitarias generales, techumbre en la mayoría de los casos) que el lector no debe asumir como "revisadas y aprobadas" solo por no aparecer.
- **Pendientes**: si existen, se remite a la sección P.
- **Limitaciones**: la inspección refleja el estado del inmueble en el momento en que se realizó cada revisión; no certifica condiciones futuras ni reemplaza una inspección técnica profesional cuando la severidad de un hallazgo lo amerite.

## V. Inspector / firma

**Disponible actualmente**: nombre del usuario que realizó la inspección (`User.name`, con `email` como respaldo si `name` es null) y la fecha de generación del informe (timestamp al momento de exportar, no un campo de BD).

**Campo futuro recomendado** (no existe en el modelo, no se implementa acá):
- Nombre de empresa inspectora (`User` no tiene campo `empresa`/`company`).
- Número de licencia/certificación profesional del inspector.
- Firma (imagen o firma digital) — no hay ningún campo ni mecanismo de captura de firma en el modelo actual.
- Rol explícito "inspector" vs. "propietario" en el modelo `User` — hoy todos los usuarios son simétricos (`role: user | admin`), no hay distinción de que el usuario logueado sea necesariamente quien inspeccionó físicamente (podría ser el propietario mismo usando la app).

## W. Numeración

**No existe hoy un identificador profesional de informe** (número correlativo, código de inspección con formato propio, versión). El único identificador real es `InspectionCase.id` (un `cuid`, no pensado para mostrarse a un cliente — no es legible ni profesional).

**Propuesta futura, no implementada**: un código corto derivado (ej. `INS-2026-000123`, generado por un contador o por fecha+secuencial) más un campo de versión del informe si se permite regenerar el PDF más de una vez con cambios (ej. "v2, generado el 20-ago-2026" si se vuelve a exportar después de agregar más hallazgos). Requeriría un campo nuevo en `InspectionCase` o una tabla `InspectionReport` separada — decisión de schema que corresponde a la fase de implementación del PDF, con su propia aprobación, no a esta especificación.

Para V1 del PDF: usar `InspectionCase.id` truncado o la fecha + nombre del caso como identificación de facto, dejando explícito en el propio documento que es un identificador provisional.

## X. Encabezado y pie

**Encabezado** (páginas internas, no portada): nombre/marca del producto + nombre de la inspección (`InspectionCase.name`) — repetido en cada página para que una hoja suelta siga siendo identificable.

**Pie de página**:
- Número de página (estándar, generado por el motor de PDF).
- Fecha de generación del informe (timestamp del momento de exportar, no `fecha` de la inspección — son datos distintos y ambos son útiles: cuándo se inspeccionó vs. cuándo se generó el documento).
- Identificación provisional del informe (ver sección W).
- Aviso de confidencialidad: opcional, breve, del tipo "Documento de uso informativo, no constituye certificación técnica" — refuerza el principio de la sección S/U sin ser un descargo legal extenso (eso queda para una revisión legal posterior, no para esta especificación de producto).

## Y. Casos especiales

| Caso | Comportamiento |
|---|---|
| No hay observaciones | Sección "Hallazgos" se omite completa (no se muestra vacía con un mensaje "sin hallazgos" que ocupe espacio innecesario); el resumen ejecutivo ya comunica "0 hallazgos" de forma natural en su conteo. |
| Hay muchas observaciones | Sin límite artificial — todas se listan (integridad de datos por sobre longitud del documento); se recomienda que el informe **resumido** solo muestre el conteo + las de mayor severidad (ej. top 3-5 por severidad descendente) con nota "ver informe detallado para el listado completo", evitando que el resumido deje de ser resumido. |
| Hay muchas fotografías | Igual criterio: el detallado las muestra todas agrupadas por contexto (sección M); no se trunca ni se samplea — cada foto es evidencia de un hallazgo real. |
| Hay puntos pendientes | Sección P siempre visible; el aviso de completitud (sección H) refleja "incompleta" de forma prominente, no un detalle al pie. |
| No hay fotografías (en ningún nivel) | Sección "Registro fotográfico" (y las fotos dentro de hallazgos/detalle) se omiten sin dejar espacios en blanco ni placeholders "sin foto disponible" — el documento simplemente no incluye esa sección. |
| Solo existe una fotografía | Se muestra igual que cualquier otra, sin tratamiento especial (no se agranda artificialmente ni se fuerza como portada — ver sección N, que ya decide no usar fotos en portada). |
| Existen observaciones históricas | Sección L siempre presente si `historicos.length > 0`, con su nota introductoria (sección L) — nunca se omiten ni se fusionan con vigentes. |
| Inspección es Departamento | El resumen por espacios (J) y el detalle (O) muestran exactamente los espacios reales del caso (ej. Cocina/Living/Dormitorio/Baño/Bodega/Estacionamiento, según Fase 6A) — ninguna sección asume Casa. |
| Inspección es Ampliación | Igual criterio: "Recinto ampliado 1"/"2" (o los que existan) aparecen como espacios reales, cada uno con su propio bloque en J/O — nunca fusionados entre sí ni renombrados. |

## Z. No hardcodear Casa

Ratificado explícitamente: ninguna sección de este documento asume Cocina/Living/Dormitorio/Baño como estructura fija. Toda sección que itera por espacio (J, K/L agrupado, O, P) itera sobre `InspectionCase.spaces` real, en su `order` real, con su `name` real — exactamente el mismo criterio ya aplicado en `/resumen` (Fase 8) y verificado ahí contra Casa, Departamento y Ampliación reales.

---

## Resumen ejecutivo del documento (respuesta a la sección 30 del pedido)

### A. Objetivo del informe
Ver sección A arriba.

### B. Público objetivo
Ver sección B.

### C. Tipo de informe
Ambos (resumido + detallado), justificado en sección C.

### D. Estructura completa
Ver sección D — 12 secciones, sin Cocina/Living hardcodeado en ninguna.

### E. Portada
Ver sección E — campos disponibles vs. futuros separados explícitamente.

### F. Resumen ejecutivo
Ver sección G.

### G. Resultado global
Ver sección I.

### H. Resumen por espacios
Ver sección J.

### I. Hallazgos
Ver sección K.

### J. Hallazgos históricos
Ver sección L.

### K. Fotografías
Ver sección M/N.

### L. Checklist
Ver sección Q — Opción C recomendada y justificada.

### M. Pendientes
Ver sección P.

### N. TechnicalArticle
Ver sección R — Opción B recomendada y justificada.

### O. Normativa
Ver sección S — regla estricta, sin excepciones.

### P. Conclusiones
Ver sección T — "Resumen de hallazgos", no "Conclusiones", con lista explícita de lo prohibido.

### Q. Alcance y limitaciones
Ver sección U.

### R. Inspector/firma
Ver sección V — hoy solo `User.name`/email; firma/empresa quedan como campo futuro.

### S. Encabezado/pie
Ver sección X.

### T. Numeración
Ver sección W — no existe hoy, `InspectionCase.id` como identificador provisional, código profesional queda como mejora futura.

### U. Informe resumido vs. detallado
- **Resumido**: Portada, Resumen ejecutivo (incluye aviso de completitud), Resultado global, Resumen por espacios, Hallazgos más severos (top N, con nota de remisión al detallado si hay más), conteo de pendientes, Alcance y limitaciones (versión corta), Cierre. Objetivo: 2-4 páginas.
- **Detallado**: todas las secciones de la sección D completas, sin truncar nada — Hallazgos completos (vigentes e históricos), Puntos pendientes completos, Registro fotográfico completo, Detalle de inspección por espacio.
- Ambos se derivan de la **misma consulta** a `InspectionCase` (mismo criterio que `/resumen`, Fase 8 — sin datos duplicados, sin un modelo `InspectionReport` para esta versión). La única diferencia entre ambos es qué secciones se incluyen y cuánto se trunca en "Hallazgos" — no hay lógica de negocio distinta entre uno y otro.

### V. Diseño visual
Ver sección F. Para diseño de página (conceptual, sección 26 del pedido): tamaño carta/A4, márgenes generosos (2-2.5cm) para que se sienta un documento, no una impresión de pantalla; jerarquía tipográfica de 3 niveles (título de sección, subtítulo de espacio/hallazgo, cuerpo); densidad media-baja (preferir espacio en blanco a comprimir contenido — un informe apretado se siente menos profesional, no más eficiente); salto de página antes de cada sección mayor (Resumen ejecutivo, Resultado global, Hallazgos, Detalle por espacio) para que cada una empiece limpia; títulos de sección con el mismo tratamiento `font-display` ya usado en la web.

### W. Casos especiales
Ver sección Y — tabla completa de 9 casos.

### X. Campos existentes vs. futuros

**Disponible actualmente** (sin cambios de schema):
`InspectionCase`: name, direccion, tipoInmueble, fecha, estado, bedroomCount, bathroomCount, observacionesGenerales (sin UI de captura hoy — ver Fase 8), id, createdAt.
`User`: name, email.
Todo el árbol de espacios/elementos/checks/observaciones/fotos (nombres, preguntas, comentarios, severidades, URLs de foto, `caption`/`notes` de foto aunque sin UI de captura hoy).
`TechnicalArticle`: title, slug (para la referencia, no el contenido completo en V1 del PDF).

**Campo futuro recomendado** (requeriría schema nuevo, no se implementa en esta fase):
- Foto de portada seleccionable (`InspectionPhoto.isCover`).
- Identificador/código profesional de informe + versión (`InspectionCase` o tabla `InspectionReport` nueva).
- Datos de empresa/licencia/firma del inspector (`User` o un perfil profesional aparte).
- Metodología de scoring/nota agregada (si se aprueba en el futuro, sección G lo bloquea explícitamente hasta entonces).
- UI de captura para `caption`/`notes` de foto y `observacionesGenerales` (los campos ya existen en schema pero ninguna pantalla los escribe hoy).

### Y. Recomendación final

Implementar el PDF en una fase posterior siguiendo esta especificación literalmente — sin reabrir decisiones de tipo de informe, secciones, o qué se muestra de normativa/TechnicalArticle, que ya quedaron resueltas y justificadas acá. La fase de implementación debe limitarse a: elegir la librería de generación de PDF, mapear los tokens de la sección F a valores fijos, y construir el layout — no a redefinir qué contiene el documento. Si durante la implementación aparece un dato que esta especificación no contempló, la fase debe detenerse y documentar el vacío (mismo criterio ya aplicado en Fase 5B/6A/8), no decidir por su cuenta.

---

FASE 9A COMPLETADA
