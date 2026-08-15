# FASE 10A — Diseño de IA para Inspecciones

**Estado del documento**: especificación únicamente. No se modificó código, schema, ni se instaló ninguna dependencia (confirmado por lectura de `package.json`: cero SDKs de IA presentes hoy — ni OpenAI, ni Anthropic, ni Vercel AI SDK, ni ningún otro). Sin commit asociado.

**Fecha**: 2026-08-15

---

## A. Auditoría de arquitectura actual

Confirmado por lectura directa del schema y del código real de este proyecto (no de memoria de fases previas):

- **`InspectionObservation`**: `comment` (String, texto libre del inspector), `severity` (`InspectionSeverity`: LOW/MEDIUM/HIGH/CRITICAL), `recommendation` (String? opcional, hoy redactado a mano por el inspector), `status` (`InspectionObservationStatus`: OPEN/IN_REVIEW/RESOLVED, sin uso en UI todavía), `photos` (1:N vía `InspectionPhoto`).
- **`InspectionChecklistCheck`**: `questionSnapshot` (copia congelada de la pregunta), `status` (OK/OBSERVATION/NOT_APPLICABLE/null=pendiente), `answeredAt`.
- **`InspectionChecklistItem`**: `question`, `helpText` (String?, existe en schema pero sin UI de captura hoy), `defaultSeverity` (opcional, catálogo), `technicalArticleSlug` (referencia libre, no FK).
- **`InspectionPhoto`**: `kind` (GENERAL/EVIDENCE/GOOD_CONDITION/FUTURE_REPAIR — GOOD_CONDITION y FUTURE_REPAIR existen en el enum pero sin UI que los asigne todavía), `url`, `caption`/`notes` (String?, existen pero sin UI de captura), 4 niveles de asociación (caso/espacio/elemento/observación).
- **`TechnicalArticle`**: `slug`, `title`, `content` (Markdown plano, sin parser — se muestra como texto con `whitespace-pre-wrap`), `order`. Vinculado débilmente desde `InspectionChecklistItem.technicalArticleSlug`. Contenido real hoy: 5 artículos (Fase 5B), estructura fija (Qué se revisa / Qué debería observarse / Cuando existe observación / Recomendación / Fuente), **ninguno cita OGUC/LGUC/NCh** — confirmado exhaustivamente en Fase 5A/5B/6A, todos terminan con "Sin referencia normativa verificada en esta fuente" salvo donde citan el Manual de Tolerancias CDT (fuente privada, no estatal).
- **Resumen web** (`/inspecciones/[id]/resumen`, Fase 8): deriva en cada carga (sin persistencia) resultado global, severidad, hallazgos vigentes/históricos, pendientes, fotos agrupadas — 100% texto/datos estructurados generados por código, nada generado por IA.
- **PDF** (`/api/inspecciones/[id]/pdf/{resumen,detallado}`, Fase 9B): mismo criterio, `@react-pdf/renderer` sobre el mismo modelo derivado (`InspectionReportData`), sin ningún texto generado por IA.
- **Flujo de fotografías**: subida directa a Vercel Blob, sin ningún procesamiento ni análisis automático — la foto se guarda tal cual la sube el inspector.
- **Flujo de observaciones**: 100% manual — el inspector escribe `comment`, elige `severity` de un `<select>`, escribe `recommendation` opcional. Ningún texto se sugiere ni se autocompleta hoy.

Ninguna pieza de IA existe en el código actual. Esta fase parte de cero, no de una integración parcial.

## B. Oportunidades de IA (clasificación)

| # | Función | Clasificación |
|---|---|---|
| A | Redacción profesional de observaciones | 🟢 Alto valor / arquitectura actual suficiente |
| B | Mejora de redacción (informal → profesional) | 🟢 Alto valor / arquitectura actual suficiente |
| C | Análisis de fotografías | 🟡 Alto valor / requiere adaptación |
| D | Sugerencia de severidad | 🟡 Alto valor / requiere adaptación |
| E | Relación con TechnicalArticle (ayuda contextual) | 🟢 Alto valor / arquitectura actual suficiente |
| F | Recomendación para el inspector ("conviene revisar también...") | 🟡 Alto valor / requiere adaptación |
| G | Resumen de inspección (ejecutivo) | 🟢 Alto valor / arquitectura actual suficiente |
| H | Generación de conclusiones | 🔴 No recomendable para V1 (ver sección N) |
| I | Preguntas adicionales sugeridas | 🔴 No recomendable para V1 (ver sección N) |

Justificación resumida (detalle en las secciones C-I más abajo): A/B/E/G no requieren ningún dato que hoy no exista — se construyen enteramente sobre `comment`, `severity`, `TechnicalArticle`, y el modelo ya derivado del resumen/PDF. C y D requieren adaptación real: C necesita decidir qué se envía de la foto y qué se hace con la respuesta (no hay campo hoy para guardar una "descripción visual de IA" sin inventar uno); D necesita un lugar en la UI para mostrar "la IA sugiere X, tú decides" sin que se confunda con el valor ya guardado. F es una extensión natural de B/E pero con más riesgo de sonar prescriptivo. H e I quedan fuera de V1 por las razones de la sección N — no por falta de capacidad técnica, sino porque el riesgo de producto (afirmar más de lo que los datos permiten, o inflar el catálogo sin control) supera el valor en esta etapa.

## C. IA + observaciones

Flujo propuesto (sección 4 del pedido, con contexto real):

```
Contexto: Cocina → Muros → "¿Presenta fisuras visibles?"
Comentario del inspector: "fisura vertical esquina muro"
Severidad elegida: MEDIUM
TechnicalArticle vinculado (si existe): "Cómo revisar fisuras en muros"
        ↓
       IA
        ↓
Redacción sugerida: "Se observa una fisura vertical localizada en la
zona próxima a la esquina del muro."

Recomendación sugerida (opcional, separada): "Se recomienda observar
la evolución de la fisura en el tiempo y consultar a un profesional si
aumenta de tamaño o cruza otra superficie."
```

Reglas de diseño:
- La IA recibe: la pregunta (`questionSnapshot`), el comentario tal cual lo escribió el inspector, la severidad elegida, y — si existe — el `title`/`content` del `TechnicalArticle` vinculado (como contexto de qué se espera que signifique un hallazgo en ese punto, nunca como fuente de verdad a repetir literal).
- La IA nunca ve el resto del caso (otras observaciones, dirección, nombre del propietario) para esta función específica — no lo necesita (ver sección J, minimización).
- La salida son **dos textos candidatos, separados y claramente rotulados**: "Redacción sugerida" (reemplazo propuesto para `comment`) y "Recomendación sugerida" (candidato para `recommendation`) — nunca se mezclan en un solo bloque de texto, porque son dos campos distintos del modelo con propósitos distintos.
- Ninguno de los dos se guarda automáticamente. El inspector ve el texto propuesto junto al que él mismo escribió, con un botón explícito "Usar esta redacción" (por campo, no un solo botón para ambos) — aceptar copia el texto al campo editable, el inspector puede seguir modificándolo antes de guardar como siempre.
- La recomendación sugerida debe llevar, si el diseño de UI lo permite, una nota fija visible junto a ella: *"Sugerencia general, no un diagnóstico ni una exigencia normativa."* — mismo principio que ya rige los `TechnicalArticle` (Fase 5B).

## D. IA + fotografías

Flujo (sección 3 del pedido):

```
Inspector toma/sube una fotografía
        ↓
   (opcional, bajo demanda — nunca automático)
        ↓
IA analiza la imagen
        ↓
Resultado: descripción visual objetiva
        ↓
Inspector confirma/edita/descarta
        ↓
Si confirma: el texto (editado o no) pasa a `comment` de una
observación NUEVA o existente — el inspector decide a cuál
```

- **Qué recibe la IA**: solo la imagen (URL pública ya en Vercel Blob) + el contexto mínimo de ubicación (espacio/elemento/pregunta), igual que en C — nunca la foto sola sin contexto, porque "hay una grieta" sin saber si es piso o muro es menos útil.
- **Qué devuelve**: una **descripción visual** en lenguaje llano ("Se observa una superficie con manchas oscuras irregulares, compatible con humedad o filtración") — nunca una conclusión técnica ("Esto es humedad por filtración de techumbre, requiere impermeabilización") ni una severidad. La distinción entre "describir lo que se ve" y "diagnosticar la causa" es la línea dura de esta función — el prompt de sistema (fase de implementación futura) debe reforzarla explícitamente, y la UI debe rotular el resultado como "Descripción visual (IA)", nunca "Diagnóstico".
- **Qué se guarda**: nada automáticamente. Si el inspector confirma, el texto (editable antes de confirmar) se copia a `comment` de una `InspectionObservation` — mismo campo, mismo flujo de guardado ya existente (`createObservationAction`/`updateObservationAction`), sin tocar su firma.
- **Qué NO se guarda**: la imagen no se reprocesa ni se re-envía a la IA en cada carga de página (ver sección K, costos) — es una acción explícita, bajo demanda, una vez por foto (a menos que el inspector la pida de nuevo). No se guarda ningún "resultado de IA" como un campo separado en `InspectionPhoto` (no existe ese campo hoy, y no se propone crearlo para V1 — ver sección Q).
- **Cómo se presenta**: un botón "Analizar con IA" junto a cada foto recién subida (no automático al subir) — el inspector sigue pudiendo escribir su propio comentario sin tocar el botón nunca, en cuyo caso la app funciona exactamente igual que hoy.

## E. IA + TechnicalArticle

La biblioteca de 5 artículos (Fase 5B) es la pieza de contexto más aprovechable que ya existe, sin requerir ningún cambio: cuando el inspector está respondiendo una pregunta que tiene `technicalArticleSlug`, la IA (en las funciones B/C/D) recibe el `title` + `content` de ese artículo como contexto adicional — así una sugerencia de redacción para "¿Presenta fisuras visibles?" puede usar el mismo vocabulario y los mismos umbrales (0,3mm, etc.) que el artículo ya cita, en vez de inventar terminología nueva. Esto no requiere ninguna función de IA nueva — es un parámetro de contexto que se suma a C/D anteriores.

Ayuda contextual adicional posible (no antes que A/B/C/D en prioridad): si el inspector abre el checklist en una pregunta SIN `TechnicalArticle` vinculado, la IA podría en el futuro sugerir un resumen breve genérico de "qué revisar" basado en la pregunta sola — pero esto empieza a acercarse a "inventar contenido técnico" sin fuente, así que se marca 🔴 para V1 (ver sección N) y queda fuera de la propuesta inicial.

## F. IA + resumen

El resumen ejecutivo por IA es candidato de alto valor porque **toda su materia prima ya existe estructurada**: `InspectionReportData` (Fase 9B) ya trae resultado global, severidad, hallazgos vigentes/históricos por espacio — la IA solo necesita convertir esos números y textos ya reales en 2-4 frases de prosa legible, no inventar ningún dato nuevo.

Ejemplo de lo que sería seguro generar: *"Se revisaron 40 puntos en 6 espacios. Se registraron 3 observaciones vigentes: una de severidad Alta en el Baño 1 (griferías) y dos de severidad Media. Todos los puntos fueron revisados; no quedan pendientes."* — cada afirmación es trazable 1:1 a un dato ya calculado.

**Dónde debe aparecer**: en ambos (resumen web y PDF) — es el mismo texto derivado de los mismos datos, coherente con el criterio ya establecido en Fase 9A/9B de "una sola fuente de verdad". Debe presentarse rotulado explícitamente ("Resumen generado automáticamente" o equivalente, con la nota de la sección G/H del PDF-IA más abajo) para que nunca se confunda con una afirmación del inspector.

## G. IA + PDF

Regla de diseño central: el PDF debe distinguir visualmente **datos objetivos capturados por el inspector** de **texto generado por IA**, siempre. Propuesta conceptual (sin implementar):

- El resumen ejecutivo generado por IA (sección F) aparecería en un bloque con un rótulo fijo distinguible (ej. un ícono o etiqueta "Generado automáticamente a partir de los datos de esta inspección") — nunca con el mismo tratamiento tipográfico que usa el informe hoy para hechos capturados (ver Fase 9A, sección F: jerarquía tipográfica ya definida).
- Una redacción de observación mejorada por IA (sección C) que el inspector aceptó **deja de ser "generada por IA" en el momento en que se guarda** — pasa a ser el `comment` real de la observación, indistinguible de uno escrito a mano, porque el inspector la revisó y la aprobó como propia (mismo criterio de human-in-the-loop, sección H). El PDF no necesita marcar esos textos de forma especial — ya pasaron por aprobación humana.
- Lo que el PDF **nunca** debe hacer es presentar una inferencia de IA no confirmada como un hecho medido — por eso ninguna función de IA de esta fase escribe directamente a un campo persistido sin pasar por confirmación explícita del inspector (sección H).

## H. Human-in-the-loop

Regla dura, sin excepciones para V1 de IA: **la IA nunca modifica automáticamente ningún dato persistido.** Específicamente, la IA nunca escribe directamente:
- `InspectionChecklistCheck.status`
- `InspectionObservation.severity`
- `InspectionObservation.comment` (definitivo, ya guardado)
- `InspectionObservation.recommendation` (definitivo, ya guardado)
- Ninguna conclusión o texto de cierre del informe
- Ninguna referencia normativa

Toda salida de IA es una **propuesta en memoria del lado del cliente**, nunca escrita a la base de datos hasta que el inspector la revise y confirme explícitamente (mismo patrón ya usado por los formularios existentes: nada se persiste sin un submit humano). Esto no requiere ninguna Server Action nueva de "aceptar sugerencia de IA" — la sugerencia, una vez aceptada, simplemente pasa a ser el valor que el formulario existente (`ObservationForm`, ya construido en Fase 4/7B) envía a `createObservationAction`/`updateObservationAction`, sin cambios en esas acciones.

## I. Normativa

Regla estricta, heredada sin reinterpretar de Fase 5B/6A/9A: **la IA no debe inventar OGUC/LGUC/NCh** bajo ninguna circunstancia. Ninguna función de esta fase (C, D, F, ni ninguna futura) debe generar una frase que afirme o insinúe cumplimiento normativo si no hay una fuente real citada.

Diseño conceptual para una futura conexión a una biblioteca normativa real (NO implementado, solo el flujo que debería seguir si algún día existe esa fuente):

```
Fuente normativa real (verificada, con texto y artículo citable)
        ↓
       IA
        ↓
Respuesta que cita la fuente textualmente (no parafrasea sin marcar)
        ↓
La cita/fuente se muestra siempre junto a la respuesta, nunca aparte
        ↓
El inspector aprueba explícitamente antes de que la cita entre al
informe — mismo patrón de human-in-the-loop de la sección H
```

Hasta que esa fuente exista y esté verificada (fuera del alcance de Inspecciones V1 y de esta fase), cualquier función de IA que toque el tema normativo debe responder con el mismo patrón ya usado en los `TechnicalArticle`: la frase fija "Sin referencia normativa verificada en esta fuente" en vez de guardar silencio o inventar una.

## J. Privacidad

Datos que SÍ tendrían que enviarse a una API de IA externa, según la función:
- Funciones A/B (redacción): el `comment` del inspector, la pregunta, la severidad — texto técnico sobre la construcción, no sobre personas.
- Función C (fotos): la imagen y su contexto de ubicación (espacio/elemento/pregunta) — la imagen puede incluir el interior de una vivienda, dato sensible por naturaleza aunque no identifique a una persona directamente.
- Función F (resumen): los conteos y textos ya derivados (`InspectionReportData`) — no incluye nombre del propietario ni dirección salvo que se decida incluirlos deliberadamente.

**Principio de minimización propuesto**: nunca enviar más contexto del que la función necesita. Concretamente:
- No enviar `InspectionCase.name`, `direccion`, ni datos del `User` (nombre/email) a ninguna función de IA — ninguna de las funciones A-G de esta fase necesita saber la dirección de la propiedad o quién la inspeccionó para hacer su trabajo.
- No enviar el caso completo cuando solo se necesita un check/observación — cada llamada debe construirse con el payload mínimo específico de esa función (un comentario, una foto, o el bloque ya agregado de resultado/severidad para el resumen), nunca "todo el JSON del caso por si acaso".
- Fotografías: evaluar en la fase de implementación si el proveedor de IA elegido retiene las imágenes enviadas (política de retención del proveedor) — de existir una opción de "no entrenar con mis datos"/retención cero, debe preferirse.
- Nada de esto se implementa en esta fase — se documenta como principio para que la fase de implementación no tenga que decidirlo bajo presión de plazo.

## K. Costos

| Función | Costo relativo | Frecuencia de uso esperada |
|---|---|---|
| A/B — Redacción/mejora de observación | Bajo (texto corto, modelo de texto) | Bajo demanda, por observación — no automático |
| C — Análisis de fotografía | Medio-Alto (modelo con visión, más caro por llamada) | Bajo demanda, por foto — nunca automático al subir |
| D — Sugerencia de severidad | Bajo (texto corto) | Bajo demanda, junto a B, no como llamada separada |
| E — Contexto de TechnicalArticle | Sin costo propio (es solo contexto agregado a A-D) | — |
| F — Resumen ejecutivo | Bajo-Medio (texto más largo, pero UNA vez por generación de resumen/PDF, no por cada check) | Bajo demanda, al abrir el resumen o generar el PDF |

Regla explícita (sección 8 del pedido): **"IA cuando aporta valor", nunca "IA en cada click".** Ninguna función de V1 se dispara automáticamente al cargar una página, al subir una foto, o al cambiar un estado — todas requieren una acción explícita del inspector (un botón "Sugerir redacción", "Analizar foto", "Generar resumen"). Esto evita costo innecesario y respeta también la sección L (experiencia en terreno: el inspector no debería depender de la IA para poder seguir avanzando).

## L. Priorización

| Función | Valor | Complejidad | Riesgo | Prioridad |
|---|---|---|---|---|
| Redacción/mejora de observación (A/B) | Alto | Baja | Bajo | **P0** |
| Resumen ejecutivo (F) | Alto | Baja-Media | Bajo | **P0** |
| Análisis de fotografía (C) | Alto | Media-Alta | Medio (visión, más caro, riesgo de sonar diagnóstico si no se redacta bien el prompt) | **P1** |
| Recomendación contextual (F del enunciado / sección 2-F) | Medio-Alto | Baja (reutiliza A/B/E) | Bajo-Medio (riesgo de sonar prescriptivo) | **P1** |
| Sugerencia de severidad (D) | Medio | Media (requiere UI nueva para "propuesta vs. valor guardado") | Medio (riesgo de que el inspector la acepte sin pensar, sesgo de automatización) | **P2** |
| Preguntas adicionales sugeridas (I) | Medio | Media-Alta | Alto (roza expandir catálogo sin control) | 🔴 fuera de V1 |
| Normativa (conexión a fuente real) | Alto (a futuro) | Alta (requiere fuente normativa verificada, que no existe hoy) | Alto si se hace mal | 🔴 fuera de V1 |
| Conclusiones/diagnóstico (H) | — | — | Alto (afirmar más de lo que los datos permiten) | 🔴 fuera de V1 |

## M. IA V1 recomendada

La propuesta inicial del enunciado (1. redactar observación, 2. analizar foto, 3. resumen ejecutivo, 4. recomendación contextual) se evalúa así, no se asume:

1. **Mejorar/redactar observación (A/B)** — ✅ confirmada P0. Justificación: cero adaptación de arquitectura (usa `comment`/`severity`/`TechnicalArticle` ya existentes), alto valor (el inspector escribe rápido y mal en terreno, la redacción profesional es justo la fricción que más se repite), riesgo bajo (texto revisable antes de guardar, human-in-the-loop trivial de aplicar con el formulario ya existente).
2. **Resumen ejecutivo (F)** — ✅ confirmada P0, se sube de prioridad respecto al orden original porque tiene MENOS complejidad que el análisis de fotos (no requiere modelo de visión, la materia prima ya está 100% estructurada desde Fase 8/9B) y beneficia tanto al resumen web como al PDF de una sola vez.
3. **Analizar fotografía (C)** — confirmada pero como **P1, no P0**: el valor es real, pero la complejidad (modelo de visión, diseño de UI para mostrar "descripción visual, no diagnóstico" sin confundir al usuario, mayor costo por llamada) es mayor que las dos anteriores — no se recomienda meterla en el primer lote junto con A/B/F si el objetivo es un V1 acotado y de bajo riesgo.
4. **Recomendación contextual** — confirmada pero fusionada dentro de la MISMA llamada que A/B (sección C de este documento ya la diseña como una salida separada de la misma función, no como una función aparte) — no amerita ser un botón ni una llamada distinta.

**Recomendación final de alcance para "IA V1" (si se aprueba una fase de implementación futura)**: A/B + F como el primer lote (mismo tipo de modelo, texto puro, menor costo y riesgo); C como segundo lote inmediatamente después, una vez validado el patrón de aprobación humana con el primer lote.

## N. Lo que NO implementaría en IA V1

- **Diagnóstico estructural**: la app no tiene, ni debería simular tener, competencia de ingeniería estructural — cualquier salida que suene a "esta fisura es estructural/no estructural" cruza la línea que Fase 5B/6A ya trazó deliberadamente al excluir "Estructura" del catálogo de Ampliación por falta de fuente confiable.
- **Certificación**: ninguna salida de IA puede decir ni insinuar que la vivienda "cumple", "está en buen estado" o es "segura" — mismo principio ya aplicado al informe PDF (Fase 9A/9B, sección S/AE).
- **Cumplimiento normativo automático**: sin una fuente normativa real y verificada (que no existe hoy en el proyecto), cualquier mención de OGUC/LGUC/NCh generada por IA sería inventada por definición.
- **Modificación automática de severidad**: la IA puede sugerir, nunca escribir `severity` directamente — el inspector es quien evalúa el riesgo real en terreno, con contexto que la IA no tiene (ej. antigüedad de la construcción, historial del inmueble).
- **Modificación automática de checks**: `status` de un `InspectionChecklistCheck` es una respuesta directa del inspector a una pregunta específica — no hay ninguna función de IA de esta fase que deba tocarlo.
- **Generación automática de nuevas preguntas del catálogo**: expandir `InspectionChecklistItem` es una decisión de producto (ver Fase 6A/6B, que ya estableció un proceso deliberado y acotado para esto) — dejar que una IA agregue preguntas "sobre la marcha" reintroduciría exactamente el riesgo de alcance descontrolado que Fase 6A evitó activamente al no importar las 348 preguntas de ITO de una vez.
- **Preguntas adicionales sugeridas de forma persistente**: si en el futuro se explora esta idea, debe ser estrictamente temporal/contextual en la sesión del inspector (ej. "¿quieres agregar una nota sobre esto?"), nunca una escritura al catálogo — y aun así queda fuera de V1 por complejidad/riesgo (sección L).

## O. Arquitectura propuesta

Flujo conceptual único, reutilizado por todas las funciones de V1 (A/B/F, y C en el segundo lote):

```
Inspector
   ↓
Inspección (InspectionCase ya existente)
   ↓
Contexto técnico mínimo específico de la función
   (pregunta + comentario + severidad + TechnicalArticle,
    o el bloque ya derivado de InspectionReportData para el resumen,
    o una foto + su contexto de ubicación)
   ↓
IA (llamada bajo demanda, nunca automática)
   ↓
Propuesta (en memoria del cliente, nunca persistida todavía)
   ↓
Inspector revisa, edita si quiere, confirma o descarta
   ↓
Resultado definitivo — pasa por el mismo formulario/Server Action
   que ya existe hoy (createObservationAction, updateObservationAction,
   o el render del resumen/PDF), sin necesitar una acción nueva de
   "guardar sugerencia de IA" separada.
```

Ningún dato nuevo viaja "por si acaso" — cada función define su propio payload mínimo (sección J).

## P. Campos actuales suficientes

`InspectionObservation.comment`, `.severity`, `.recommendation`; `InspectionChecklistCheck.questionSnapshot`; `TechnicalArticle.title`/`.content`; `InspectionPhoto.url`; y todo el modelo ya derivado en `InspectionReportData` (Fase 9B) — ninguno de estos requiere un campo nuevo para soportar las funciones A/B/C/F de V1.

## Q. Campos futuros necesarios

Ninguno es estrictamente necesario para el alcance de V1 propuesto en la sección M (todo pasa por los campos existentes vía el flujo de la sección O). Si en una fase de implementación futura se decide **guardar** explícitamente que un texto fue sugerido por IA (para trazabilidad, no para esta fase), candidatos a evaluar entonces — no antes:
- Un flag booleano tipo `aiAssisted: Boolean @default(false)` en `InspectionObservation`, si se quisiera distinguir en el PDF/resumen qué observaciones tuvieron ayuda de IA en su redacción (hoy no se propone, ver sección G: una vez aprobado por el inspector, el texto es indistinguible de uno propio, y se considera correcto que así sea).
- Un campo para guardar la "descripción visual de IA" de una foto de forma separada del `comment` final, si se quisiera conservar el texto original de la IA además del texto editado por el inspector — no se propone para V1 (agregar complejidad de schema sin un caso de uso confirmado que lo requiera).

## R. Riesgos

- **Sobre-confianza del inspector** ("automation bias"): si la IA sugiere una redacción o severidad convincente, el inspector podría aceptarla sin revisar realmente el hallazgo — mitigado por mantener la severidad siempre como decisión activa del inspector (nunca pre-seleccionada por la IA sin que él la vea explícitamente como "sugerencia", sección H) y por no incluir D (sugerencia de severidad) en el primer lote de V1.
- **Alucinación de contenido técnico**: la IA podría inventar un umbral, una norma, o un dato técnico que no está en el `TechnicalArticle` de contexto — mitigado por instruir explícitamente (en la fase de implementación futura) a que la IA solo redacte/resuma, nunca añada datos numéricos o normativos que no vengan del contexto entregado.
- **Costo descontrolado**: sin el principio de "bajo demanda, nunca automático" (sección K), el costo por inspección podría dispararse sin control — mitigado por diseño desde el inicio, no como parche posterior.
- **Confusión visual entre dato objetivo y texto generado**: si el PDF/resumen no distingue claramente qué es sugerencia de IA y qué es dato capturado, el documento pierde la credibilidad que las Fases 8/9A/9B construyeron deliberadamente — mitigado por la regla de la sección G (rotulado explícito, y solo lo aprobado por el inspector se persiste como dato "propio").
- **Dependencia de un proveedor externo**: cualquier función de IA introduce un punto de falla/latencia fuera del control del proyecto — mitigado por la sección 9 (el inspector nunca debe depender de la IA para avanzar; toda función es opcional y con estado de error/reintento explícito, diseño de implementación futura).

## S. Recomendación final

Implementar, en una fase de implementación futura y separada de esta especificación: **A/B (redacción y mejora de observación) + F (resumen ejecutivo)** como primer lote — mismo tipo de modelo (texto), menor costo, menor riesgo, cero adaptación de arquitectura. Validar el patrón de aprobación humana (sección H) con ese primer lote antes de abordar **C (análisis de fotografía)** como segundo lote. Mantener **D (severidad)**, **normativa real**, **conclusiones/diagnóstico**, y **generación automática de preguntas de catálogo** explícitamente fuera de alcance hasta que exista una razón de producto concreta y aprobada para reabrirlos — mismo criterio de disciplina de alcance que ya guio Fase 5B (piloto de 5 artículos, no 265) y Fase 6A (11 preguntas V1, no 348).

---

FASE 10A COMPLETADA
