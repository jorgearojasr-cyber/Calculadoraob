# FASE 11D — DISEÑO DE LA BIBLIOTECA TÉCNICA GUIADA COMPLETA

**Estado del documento**: diseño únicamente. No se modificó código, Prisma,
migraciones, catálogo, ni se crearon artículos. Sin commit.

**Fecha**: 2026-08-15

**Método**: todo dato de catálogo citado abajo viene de una consulta de
solo lectura ejecutada contra la base compartida (dev = producción) al
momento de escribir este documento — no se asume nada de memoria de
fases previas. El contenido técnico citado como "ya existente" es el que
ya está persistido en `TechnicalArticle`; ningún contenido nuevo fue
inventado en esta fase. Donde no hay fuente verificable **en esta
fase** (no tengo acceso al proyecto ITO externo desde este documento,
solo a lo que Fase 5B/6A/11A ya extrajeron y dejaron citado), se marca
🔴 explícitamente en vez de asumir plausibilidad.

---

## 1. Auditoría del estado actual

Confirmado por consulta directa:

| Entidad | Total |
|---|---|
| `InspectionSpaceTemplate` activos | 13 |
| `InspectionElementTemplate` activos | 11 |
| `InspectionElementTemplateSpace` (vínculos) | 40 |
| `InspectionChecklistItem` activos | 14 |
| `TechnicalArticle` | 6 (5 reales + 1 de prueba huérfano de Fase 1) |

**Cobertura de contenido guiado, hoy, sobre las 14 preguntas activas:**

| Nivel | Preguntas | Detalle |
|---|---|---|
| 🟢 Guía completa (10 secciones canónicas parciales: Qué se revisa / Cómo revisarlo / Qué debería observarse / Qué señales pueden indicar un problema / Recomendación / Fuente) | 2 | Piso — "¿Presenta daños visibles?" y "¿Presenta desniveles?" (piloto Fase 11B) |
| 🟡 Contenido base sin guía-primero (Qué se revisa / Qué debería observarse / Cuando existe una observación / Recomendación / Fuente — formato Fase 5B, sin "Cómo revisarlo" ni "Qué señales...") | 3 | Muros — fisuras; Ventana — funcionamiento; Puerta — cierre |
| 🔴 Sin ningún `TechnicalArticle` vinculado | 9 | Artefactos sanitarios (×3), Enchufes e interruptores (×1), Bodega (×1), Estacionamiento (×1), Fachada (×1), Reja (×1), Portón (×1) |

Es decir: **36% de las preguntas activas tiene algo de contenido, y solo
14% tiene el formato guiado completo**. El resto del catálogo (9
preguntas, 64%) todavía es V1 puro: botones OK/Observación/No aplica sin
ningún acompañamiento.

El artículo `como-revisar-nivelacion-de-pavimentos` (Fase 1) no está
vinculado a ningún `InspectionChecklistItem` — es contenido de prueba
huérfano, no forma parte de la biblioteca real.

`InspectionElementTemplate.materialVariantOf` existe en el schema desde
el diseño original (referencia libre por `key`, sin tabla de variantes
dedicada) pero **ningún elemento lo usa hoy** — es un mecanismo
disponible y no utilizado, relevante para la sección 6 de este diseño.

`InspectionChecklistItem.defaultSeverity` existe y se usa en exactamente
1 pregunta (Muros → `MEDIUM`) — el único precedente real de severidad
sugerida por conocimiento, relevante para la sección 9.

Documentación previa revisada: Fase 6A (`FASE6A_DISENO_CATALOGO_V2_INSPECCIONES.md`,
14-ago-2026) ya hizo un trabajo equivalente de auditoría + clasificación
🟢/🟡/🔴 para el catálogo de espacios/elementos/preguntas que terminó
implementándose en Fase 6B/11B — este diseño lo reutiliza y extiende,
no lo repite. Fase 11A (`FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md`)
definió la plantilla de 10 secciones y el patrón Observación → Posible
signo → Recomendación que ya se implementó parcialmente en Piso — este
diseño la retoma como base de la sección 4.

---

## A. Inventario de recintos

Los 13 espacios activos, con su estado real (no aspiracional):

| Recinto | Tipo(s) | Repetible | Partidas vinculadas hoy | Estado |
|---|---|---|---|---|
| Cocina | Casa, Departamento, Ampliación | no | Piso, Muros, Ventana, Enchufes | 🟢 implementado (parcialmente guiado: Piso sí, resto no) |
| Living | Casa, Departamento | no | Piso, Muros, Ventana, Enchufes | 🟢 implementado |
| Dormitorio | Casa, Departamento, Ampliación | sí | Piso, Muros, Puerta, Ventana, Enchufes | 🟢 implementado |
| Baño | Casa, Departamento, Ampliación | sí | Piso, Muros, Artefactos sanitarios | 🟢 implementado, sin ninguna guía todavía |
| Bodega | Casa, Departamento | no | Bodega | 🟢 implementado, sin guía |
| Estacionamiento | Departamento | no | Estacionamiento | 🟢 implementado, sin guía |
| Recinto ampliado ("Otro") | Ampliación | sí | Piso, Muros, Ventana, Puerta | 🟢 implementado |
| Antejardín | Casa | no | Fachada, Reja | 🟢 implementado, sin guía |
| Acceso vehicular | Casa | no | Portón | 🟢 implementado, sin guía |
| Comedor | Casa, Departamento | no | Piso, Muros, Ventana, Enchufes | 🟢 implementado (mismo set que Living) |
| Living-comedor | Casa, Departamento, Ampliación | no | Piso, Muros, Ventana, Enchufes | 🟢 implementado (mismo set que Living) |
| Terraza/Logia | Departamento | no | Piso, Muros, Ventana | 🟡 implementado con set genérico — Fase 11A ya lo marcó como fuente delgada, sin partidas propias |
| Terraza cerrada | Ampliación | no | Piso, Muros, Ventana, Puerta | 🟡 implementado con set genérico — mismo fallback que "Recinto ampliado", sin fuente propia |

**Diseñado pero explícitamente fuera** (decisión ya tomada en fases
previas, reafirmada acá, no revertida):

| Recinto candidato | Motivo de exclusión |
|---|---|
| Patio trasero (Casa) | Fase 11A lo marcó 🔴 por falta de contenido de fuente; nunca se creó fila de catálogo |
| Techumbre, Exterior/Fachada completa, Escalera (Casa) | Fase 6A los clasificó V2 — buena fuente ITO, pero no implementados aún (menor frecuencia de uso, riesgo de acceso en terreno para Techumbre) |
| Medianeros, aislación acústica, áreas comunes (Departamento) | Fase 6A: ausentes en toda fuente disponible, no se propone contenido inventado |
| Estructura (pilares/vigas) como recinto/elemento de Ampliación | Fase 6A: única mención es 1 línea suelta sin respaldo, riesgo de falsa autoridad estructural — excluido de forma permanente hasta contar con revisión profesional real |

---

## B. Matriz recinto → partidas

### B.1 — Partidas ya en catálogo (40 vínculos reales), con cobertura de guía

| Recinto | Partida | Guía |
|---|---|---|
| Cocina, Living, Dormitorio, Baño, Recinto ampliado, Comedor, Living-comedor, Terraza/Logia, Terraza cerrada | **Piso** — daños visibles, desniveles | 🟢 completa |
| Cocina, Living, Dormitorio, Baño, Recinto ampliado, Comedor, Living-comedor, Terraza/Logia, Terraza cerrada | **Muros** — fisuras | 🟡 base sin guía-primero |
| Cocina, Living, Dormitorio, Recinto ampliado, Comedor, Living-comedor, Terraza/Logia, Terraza cerrada | **Ventana** — funcionamiento | 🟡 base sin guía-primero |
| Dormitorio, Recinto ampliado, Terraza cerrada | **Puerta** — cierre | 🟡 base sin guía-primero |
| Baño | **Artefactos sanitarios** — descarga, fugas, goteras (3 preguntas) | 🔴 sin contenido |
| Cocina, Living, Dormitorio, Comedor, Living-comedor | **Enchufes e interruptores** — funcionamiento | 🔴 sin contenido |
| Bodega | **Bodega** — puerta/candado | 🔴 sin contenido |
| Estacionamiento | **Estacionamiento** — demarcación/pavimento | 🔴 sin contenido |
| Antejardín | **Fachada** — fisuras/daños | 🔴 sin contenido |
| Antejardín | **Reja** — apertura/cierre | 🔴 sin contenido |
| Acceso vehicular | **Portón** — apertura/cierre | 🔴 sin contenido |

### B.2 — Partidas propuestas, no implementadas (extienden el ejemplo del pedido)

Ninguna de estas existe hoy en catálogo. Clasificadas honestamente según
si Fase 6A/11A ya encontró fuente citable, o si esta fase no verificó
ninguna:

| Recinto(s) | Partida propuesta | Clasificación | Justificación |
|---|---|---|---|
| Baño, Cocina | **Grifería** (como partida propia, separada de Artefactos sanitarios) | 🟡 | Fase 6A ya encontró fuente para "sin goteras ni filtraciones" (🟢, ya plegada como 1 de las 3 preguntas de Artefactos sanitarios) y para "presión pareja fría/caliente" (🟡, requiere abrir ambas llaves a la vez — más fricción en terreno) |
| Baño, Cocina | **Agua potable** (presión general, sin relación a grifería puntual) | 🔴 | Sin fuente distinta verificada en esta fase; se superpone con Grifería sin un criterio propio claro |
| Baño, Cocina | **Desagüe** (velocidad de drenaje, malos olores) | 🔴 | Sin fuente verificada en esta fase |
| Baño, Cocina | **Sellos** (silicona perimetral, juntas) | 🔴 | Solo hay una mención indirecta (silicona perimetral de ventana, ya usada en el artículo de Ventana) — insuficiente para una partida propia de sellos de baño/cocina |
| Dormitorio, Living, Cocina, Baño | **Iluminación** (como partida propia, distinta de Enchufes) | 🔴 | Sin fuente verificada en esta fase |
| Baño, Cocina | **Ventilación/extracción** | 🔴 | Sin fuente verificada en esta fase |
| Cocina | **Muebles/Cubiertas** | 🔴 | Sin fuente verificada en esta fase |
| Dormitorio | **Clóset** (si existe) | 🔴 | Ni siquiera existe como elemento de catálogo hoy; sin fuente |
| Cocina, Living, Dormitorio, Baño | **Pintura** (distinta de Muros — uniformidad, descascarado) | 🔴 | Existe una calculadora "Pintar" en Calculadora B, pero es una fuente de dosificación de materiales, no de criterios de inspección — no se puede reutilizar sin verificación propia |
| Casa (V2, no implementado como recinto) | **Techumbre/Cubierta** | 🟢 (ya sourced por Fase 6A) | Fase 6A ya citó `LibraryArticle estado-de-la-cubierta` y el punto 265 correspondiente — pendiente de implementación de catálogo, no de fuente |

**Regla aplicada, sin excepción**: ninguna partida 🔴 de esta tabla se
recomienda para redacción en el próximo lote. 🔴 significa "no
implementar todavía", no "descartada para siempre" — algunas (Grifería
completa, Iluminación) son candidatas razonables de una futura fase de
investigación de fuente, documentada en la sección N.

---

## C. Plantilla canónica de partida

Formato único, obligatorio para toda partida guiada nueva. Reutiliza y
completa el esquema de 10 secciones ya aprobado en Fase 11A, mapeado a
lo que el schema actual puede sostener sin cambios:

| Campo | Contenido | Dónde vive hoy |
|---|---|---|
| **A. Nombre de la partida** | Igual al `label` del `InspectionElementTemplate` o a la pregunta puntual | `InspectionElementTemplate.label` / `InspectionChecklistItem.question` |
| **B. Qué revisar** | Contexto general en lenguaje simple, 1-2 frases | `TechnicalArticle.content`, encabezado `# Qué revisar` (alias ya soportado: "qué se revisa") |
| **C. Cómo revisarlo** | Paso práctico ejecutable por una persona sin formación | `# Cómo revisarlo` (ya soportado desde Fase 11B) |
| **D. Qué debería verse** | Condición esperable, en positivo | `# Qué debería observarse` (alias ya soportado) |
| **E. Qué puede ser señal de un problema** | Lista de señales, NUNCA un diagnóstico | `# Qué señales pueden indicar un problema` (ya soportado desde Fase 11B) |
| **F. Por qué importa** | 1 frase de consecuencia práctica, sin alarmismo | **Nuevo alias a agregar** (`# Por qué importa`) — no existe todavía en `inspecciones-knowledge.ts`, ver sección M |
| **G. Qué puedes hacer** | Próxima acción concreta para el propietario (ej. "regístralo con foto y coméntalo con el vendedor/constructora") | Hoy se mezcla dentro de `# Recomendación` — se recomienda mantenerlo así (no crear un 4º campo redundante con E/I) |
| **H. Posible signo** | Frase explícitamente separada de causa/diagnóstico (ej. "puede ser señal de...", nunca "esto significa que...") | Es una **regla de redacción** aplicada dentro de E, no un campo de schema aparte — ver sección D |
| **I. Recomendación** | Acción prudente, sin urgencia inventada | `# Recomendación` (ya soportado) |
| **J. Nivel orientativo** | Urgente / A revisar / Estético — **solo si hay criterio sustentado** | No existe como enum hoy; ver análisis completo en sección 9/J — no se agrega sin decisión explícita en una fase de implementación |
| **K. Material o variante** | Cuándo cambia la revisión según material | `InspectionElementTemplate.materialVariantOf` (existe, sin uso) o, más simple, una subsección dentro del mismo artículo — ver sección E |
| **L. Fuente** | Clasificada: referencia técnica / criterio interno / manual / fabricante / normativa verificada | `# Fuente` (ya soportado) — **regla nueva**: cada fuente debe declarar explícitamente su tipo (ver sección F), no solo el nombre del documento |
| **M. Referencia visual** | Qué imagen mostrar (correcta / problemática / comparativa) + pie | **No existe campo hoy** — ver sección I, se diseña conceptualmente sin implementar |

**Consecuencia para `src/lib/inspecciones-knowledge.ts`**: la próxima
fase de implementación deberá agregar el alias `# Por qué importa` (uno
más, aditivo, mismo patrón que `comoRevisarlo`/`senalesDeProblema`) —
no se toca en esta fase de diseño, solo se documenta como paso 1 de la
implementación futura.

---

## D. Reglas de lenguaje simple

Aplican a **toda** redacción futura de la biblioteca, sin excepción:

1. **Nunca jerga sin explicación.** Si se usa un término técnico
   (ej. "hermeticidad", "curado"), debe explicarse en la misma frase.
2. **Nunca afirmaciones categóricas de causa-efecto.** Prohibido:
   *"si suena hueco está mal pegado"*. Correcto:
   *"un sonido hueco puede ser una señal que conviene revisar,
   especialmente si también existe movimiento, fisura o desprendimiento"*.
3. **Cadena obligatoria**: Observación → Posible signo → Recomendación.
   Prohibido: Observación → Diagnóstico automático.
4. **El sistema nunca certifica.** Ninguna redacción puede decir
   "esto cumple/no cumple normativa" salvo que exista una fuente
   normativa real citada (ver sección F — hoy, cero casos).
5. **Todo hallazgo queda como responsabilidad del usuario/inspector.**
   La guía informa y orienta; el estado (OK/Observación/No aplica), la
   severidad y el comentario siempre los define una persona — nunca el
   sistema los completa automáticamente. Esto ya es así en el código
   actual (`ChecklistItemRow`/`ObservationForm`) y esta regla lo
   reafirma como principio de diseño, no como algo a implementar de
   nuevo.
6. **Frases cortas, oraciones simples.** Evitar subordinadas anidadas.
   Un lector sin formación técnica debe poder leer cada sección de
   corrido sin releer.

---

## E. Variantes por material

Evaluación honesta de necesidad real, no exhaustividad por sí misma:

| Elemento | Variantes candidatas | Clasificación | Nota |
|---|---|---|---|
| Piso | Cerámica/porcelanato, Radier/hormigón a la vista, Madera | 🟡 | El contenido actual de Piso YA distingue estos 3 casos **dentro del mismo artículo** (ver `piso-como-revisar-danos-visibles`: "cerámica/porcelanato" vs. "radier/hormigón a la vista" en la misma sección). Es decir: **la variante ya existe a nivel de redacción, sin necesitar una fila de catálogo separada.** Piso flotante no está mencionado — 🔴 sin fuente verificada en esta fase. |
| Muros | Pintura/estuco, Cerámica/revestimiento, Tabiquería, Hormigón/albañilería | 🟡 | El artículo actual ya distingue "fisura de retracción" (estuco) vs. tipos con espesor — mismo patrón: variante dentro del artículo. Cerámica/revestimiento y tabiquería como paños distintos: 🔴 sin fuente verificada esta fase. |
| Ventanas | Aluminio, PVC | 🔴 | El artículo actual no distingue material de marco; sin fuente verificada para diferenciar aluminio vs. PVC en esta fase. |

**Recomendación de mecanismo**: no usar `materialVariantOf` (que crearía
elementos de catálogo separados, ej. "piso-ceramico" vs.
"piso-flotante") a menos que la pregunta de checklist en sí deba
cambiar de texto según material. Mientras la pregunta sea la misma
("¿Presenta daños visibles?") y solo cambie el criterio de qué observar,
**la variante debe vivir dentro del mismo artículo**, como ya ocurre hoy
en Piso — es más simple, no duplica catálogo, y ya está validado en
producción. `materialVariantOf` queda reservado para el caso real futuro
en que la pregunta misma deba ser distinta (ej. una pregunta específica
solo aplicable a piso flotante, que no aplica a radier).

---

## F. Fuentes disponibles

Las mismas ya auditadas y citadas en Fase 5B/6A/11B — no se agregan
fuentes nuevas en esta fase:

| Fuente | Tipo (campo L de la plantilla) | Ya usada en |
|---|---|---|
| Manual de Tolerancias CDT | Manual técnico de referencia (mediciones/tolerancias concretas) | Piso, Muros, Ventana, Puerta |
| Catálogo educativo ITO (265 puntos) | Criterio interno adaptado de material educativo | Piso, Muros, Ventana, Puerta |
| Biblioteca técnica ITO (artículos temáticos) | Criterio interno adaptado | Ventana, Puerta |
| ASTM 1036-01 | Normativa/estándar externo verificado (único caso real en todo el proyecto, citado en Manual CDT, no usado todavía en Inspecciones) | Ninguno todavía |

**Cero citas OGUC/LGUC/NCh en cualquier fuente disponible** — hallazgo
ya confirmado en Fase 5B/6A, reafirmado acá. Ninguna redacción futura
puede citar estas normativas sin una fuente real y verificable — no
existe hoy.

---

## G. Vacíos de fuente

| Vacío | Alcance | Motivo |
|---|---|---|
| Estructura (pilares/vigas) para Ampliación | Permanente hasta revisión profesional | Única mención es 1 línea sin respaldo (Fase 6A) — riesgo de falsa autoridad estructural |
| Aislación térmica | Permanente hasta nueva fuente | 1 sola línea en toda la fuente ITO histórica, insuficiente |
| Departamento — medianeros, aislación acústica, áreas comunes | Permanente hasta nueva fuente | Ausente en toda fuente disponible |
| Patio trasero (Casa) | Hasta nueva fuente | Marcado 🔴 en Fase 11A, nunca implementado |
| Terraza/Logia, Terraza cerrada | Parcial — usan set genérico hoy | Fuente ITO "delgada" según Fase 11A; funcionan con Piso/Muros/Ventana genéricos, sin partidas propias |
| Fachada, Reja, Portón | Existen en catálogo, sin contenido de guía | Fase 11B las creó por analogía funcional a Muros/Puerta/Ventana ("mismo patrón de pregunta"), pero nunca se escribió un `TechnicalArticle` dedicado — el "sin fuente" acá es de **contenido pendiente de redactar**, no de fuente inexistente (la fuente es la misma ya usada en Muros/Puerta/Ventana, aplicada por analogía) |
| Grifería (presión), Bodega (humedad), Estacionamiento (iluminación) | Preguntas descartadas de V1 en Fase 6A | 🟡 más fricción de terreno o criterio subjetivo — no implementadas |
| Todas las partidas 🔴 de la tabla B.2 | Sin fuente verificada en esta fase | Ver tabla B.2 |

---

## H. Prioridad por lotes

**LOTE 1 — máximo impacto, mínimo riesgo, cero investigación nueva**
- Extender guía-primero (Cómo revisarlo + Qué señales) a **Muros**,
  **Ventana**, **Puerta** — ya tienen contenido base 🟡, ya validado en
  producción, mismo patrón exacto que el piloto de Piso. Cero fuente
  nueva requerida: el contenido ya citado en sus artículos actuales
  alcanza para redactar las 2 secciones faltantes (mismo criterio
  aplicado al extender los artículos de Piso en Fase 11B).
- Redactar guía completa para **Artefactos sanitarios** (3 preguntas) y
  **Enchufes e interruptores** (1 pregunta) — Fase 6A ya encontró fuente
  🟢 citable para ambos (`firmeza-de-artefactos-sanitarios`,
  `prueba-de-enchufes`, ficha 26 CDT), nunca se redactó el artículo.

*Justificación: cubre 9 de las 14 preguntas activas (64%), son las
partidas de mayor frecuencia (Piso/Muros/Ventana/Puerta/Enchufes
aparecen en 8-9 de los 13 recintos cada uno), y no requiere ninguna
investigación de fuente nueva — solo redacción sobre fuente ya
verificada.*

**LOTE 2 — buena fuente, requiere completar criterio**
- Bodega (humedad — 🟡 en Fase 6A)
- Estacionamiento (iluminación/maniobra — 🟡 en Fase 6A)
- Grifería como partida propia (presión pareja — 🟡 en Fase 6A)
- Fachada, Reja, Portón — contenido nuevo por analogía a Muros/Puerta,
  requiere solo redacción (misma fuente aplicada a un elemento
  distinto), no investigación desde cero

*Justificación: fuente parcial ya identificada, pero requiere una
decisión editorial (aceptar el criterio 🟡 tal cual, o buscar mejor
respaldo) antes de redactar.*

**LOTE 3 — baja frecuencia o fuente todavía sin verificar en esta fase**
- Techumbre/Cubierta (🟢 sourced pero espacio no implementado — requiere
  primero decisión de catálogo, fuera de esta fase de biblioteca)
- Terraza/Logia, Terraza cerrada (partidas propias, no genéricas)
- Grifería completa (Agua potable/Desagüe/Sellos), Iluminación,
  Ventilación/extracción, Muebles/Cubiertas, Clóset, Pintura — todo lo
  🔴 de la tabla B.2

*Justificación: menor frecuencia de recintos afectados, o fuente
todavía no verificada — requieren investigación antes de redactar
cualquier línea.*

---

## I. Estrategia de imágenes

Diseño conceptual, sin implementación:

- **Foto de condición correcta**: 1 imagen mostrando el estado esperado
  (ej. piso sin daños).
- **Foto de condición problemática**: 1 imagen mostrando una señal real
  (ej. pieza trisada), nunca hiperbolizada.
- **Foto comparativa**: opcional, lado a lado, solo cuando ayude más que
  2 fotos separadas (ej. desnivel visible con regla apoyada).
- **Pie explicativo**: 1 frase corta por imagen, nunca un diagnóstico
  ("Ejemplo de pieza con borde astillado" — no "Esto indica mala
  instalación").

**Relación con el modelo actual**: `InspectionPhoto` existe hoy pero es
exclusivamente para evidencia **subida por el usuario** (vinculada a
`caseId`/`spaceId`/`elementId`/`observationId` — siempre a una
inspección real). Las fotos de referencia de la biblioteca son un
concepto distinto: contenido editorial fijo, igual para todos los
usuarios, no asociado a ningún caso. **No existe campo para esto hoy.**

Dos caminos posibles para una fase de implementación futura (no se
decide acá):
1. Extender `TechnicalArticle` con 2-3 campos de URL de imagen
   (`referenceImageOkUrl`, `referenceImageIssueUrl`, `referenceImageCaption`).
2. Seguir el mismo patrón de Markdown: referenciar imágenes con sintaxis
   estándar dentro de `content` y que el renderer las muestre.

La opción 2 no requiere cambio de schema y es más consistente con cómo
ya se modela el resto del contenido — **se recomienda explorarla
primero** en la fase de implementación, evaluando si el storage de esas
imágenes (Vercel Blob u otro) requiere un mecanismo de subida propio
para contenido editorial (distinto del `PhotoUpload` de usuario).

---

## J. Nivel de gravedad

Estado real del schema: `InspectionChecklistItem.defaultSeverity` (sugerido
por conocimiento, opcional) y `InspectionObservation.severity` (definido
siempre por el usuario/inspector, nunca automático) usan el enum
`InspectionSeverity { LOW, MEDIUM, HIGH, CRITICAL }` — **no** existe hoy
un enum "Urgente / A revisar / Estético" como pidió el enunciado.

Antes de introducirlo, dos preguntas deben responderse en una fase de
implementación futura (no se deciden acá):
1. ¿Es un enum nuevo y paralelo, o un mapeo de presentación sobre
   `LOW/MEDIUM/HIGH/CRITICAL` ya existente? (Ej. CRITICAL/HIGH → Urgente,
   MEDIUM → A revisar, LOW → Estético) — el mapeo evita una migración,
   pero puede forzar equivalencias que no siempre calzan.
2. ¿Aplica al `defaultSeverity` del catálogo (sugerencia) o solo a la
   presentación del reporte? Mezclar ambos sin distinguirlos sería
   confuso.

**Regla de diseño, válida para cualquier decisión de implementación**:
- `defaultSeverity` **solo** puede pre-cargarse cuando existe un
  criterio explícito y citado (ej. Muros → `MEDIUM` porque el propio
  artículo distingue fisura fina vs. con espesor/cruce de esquina —
  criterio real, no arbitrario). Para las 13 preguntas restantes, no
  hay criterio hoy — no se debe inventar uno solo para tener un valor.
- La severidad final **siempre** la confirma o cambia el
  usuario/inspector — el sistema nunca la fija de forma no editable.
  Esto ya es la arquitectura actual (`ObservationForm` siempre muestra
  el selector, incluso con `defaultSeverity` presente) y debe seguir
  siendo así.
- Si se introduce "Urgente/A revisar/Estético" como capa de
  presentación, debe quedar explícito en el reporte que es una
  **orientación**, no una clasificación validada por un profesional.

---

## K. Impacto en informe

La arquitectura actual (`src/lib/inspecciones-report.ts`,
`inspecciones-knowledge.ts`, `inspecciones-redaccion.ts`) ya separa
conocimiento (artículo) de hallazgo (observación) de forma genérica —
agregar más secciones a un artículo **no requiere cambios de código**
para que el checklist las muestre (ya se demostró con `comoRevisarlo`/
`senalesDeProblema` en Fase 11B). Por cada hallazgo, el informe (web,
PDF resumido, PDF detallado) podría enriquecerse mostrando:

- Qué observó el usuario (`observation.comment`, ya existe).
- Por qué conviene revisarlo (nuevo campo "Por qué importa" del
  artículo, sección C de la plantilla) — resumen breve, no alarmista.
- Qué acción concreta se recomienda (`observation.recommendation`, ya
  existe, más el "Qué puedes hacer" del artículo como contexto general).
- Referencia técnica breve (`# Fuente` del artículo, ya existe,
  mostrada de forma abreviada, no la cita completa).

**Regla dura, sin excepción**: ningún texto de informe puede afirmar
cumplimiento o incumplimiento normativo salvo que exista una fuente
normativa real y citada (hoy: cero casos, ver sección F). El informe
sigue siendo un registro de lo que el usuario observó y decidió, con
contexto educativo — nunca una certificación.

---

## L. Cobertura (cuadro cuantitativo)

| Métrica | Valor |
|---|---|
| Total de recintos activos | 13 |
| Total de partidas ya en catálogo (preguntas activas) | 14 |
| Partidas 🟢 (guía completa) | 2 (14%) |
| Partidas 🟡 (contenido base, falta guía-primero) | 3 (21%) |
| Partidas 🔴 (sin contenido) | 9 (64%) |
| Partidas nuevas propuestas (tabla B.2) | 10 |
| — de esas, 🟢 (fuente ya verificada) | 1 (Techumbre/Cubierta — requiere además implementar el recinto) |
| — de esas, 🟡 (fuente parcial) | 1 (Grifería propia) |
| — de esas, 🔴 (sin fuente verificada esta fase) | 8 |
| **Pueden redactarse YA sin investigación nueva** | **9** (3 extensión de guía + 6 redacción nueva con fuente 🟢 ya citada — Artefactos sanitarios ×3, Enchufes ×1, y completar Muros/Ventana/Puerta ×3 — más Fachada/Reja/Portón por analogía, ver Lote 1-2) |
| **Requieren investigación de fuente antes de redactar** | **13** (5 de Lote 2 restante + 8 de Lote 3) |

---

## M. Qué puede implementarse ya

Sin ninguna investigación adicional, usando solo fuente ya citada en
`TechnicalArticle` existentes o en Fase 6A:

1. Extender Muros/Ventana/Puerta con "Cómo revisarlo" y "Qué señales
   pueden indicar un problema" (mismo patrón operativo que Piso).
2. Redactar por primera vez las guías de Artefactos sanitarios (3
   preguntas) y Enchufes e interruptores (1 pregunta).
3. Agregar el alias `# Por qué importa` a `inspecciones-knowledge.ts`
   (cambio aditivo de código, no de schema — mismo patrón ya usado 2
   veces) para poder empezar a incluir ese campo desde el primer lote.

## N. Qué requiere investigación

1. Confirmar o mejorar el criterio 🟡 de Grifería (presión), Bodega
   (humedad), Estacionamiento (iluminación) antes de redactarlos como
   guía completa.
2. Redactar contenido nuevo para Fachada/Reja/Portón (por analogía a
   Muros/Puerta, pero sin un artículo fuente propio todavía — decisión
   editorial de si basta la analogía o se busca fuente dedicada).
3. Toda partida 🔴 nueva de la tabla B.2 (Agua potable, Desagüe, Sellos,
   Iluminación, Ventilación/extracción, Muebles/Cubiertas, Clóset,
   Pintura) — ninguna se redacta sin fuente verificada primero.
4. Techumbre/Cubierta requiere además decidir si se implementa como
   recinto de catálogo (V2, fuera del alcance de esta fase de
   biblioteca).
5. Terraza/Logia y Terraza cerrada como partidas propias (hoy usan el
   set genérico) — solo si en el futuro aparece fuente específica.
6. Definición de "Urgente/A revisar/Estético" (sección J) — requiere
   una decisión de producto explícita, no solo de contenido.
7. Mecanismo de imágenes de referencia (sección I) — requiere decisión
   técnica (campo de schema vs. Markdown) antes de poder redactarse con
   imágenes.

## O. Recomendación del primer lote

**Lote 1 tal como está definido en la sección H**: extender Muros/
Ventana/Puerta al formato guía-primero, y redactar por primera vez
Artefactos sanitarios y Enchufes e interruptores. Es la combinación de
mayor cobertura (9 de 14 preguntas activas, 64% del catálogo actual),
menor riesgo (toda la fuente ya está citada y verificada, ninguna
requiere investigación nueva) y mayor consistencia (repite exactamente
el patrón ya validado en producción con Piso en Fase 11B, sin inventar
un mecanismo nuevo). Se recomienda que sea el contenido de una futura
Fase 11E de implementación, replicando el mismo proceso ya usado dos
veces: redactar, clasificar fuente, verificar con `npx tsc`/`eslint`/
`vitest`/`build`, QA manual, y publicar solo bajo autorización explícita
— sin adelantar ninguno de esos pasos en esta fase de diseño.

---

FASE 11D — DISEÑO DE BIBLIOTECA TÉCNICA GUIADA COMPLETADO
