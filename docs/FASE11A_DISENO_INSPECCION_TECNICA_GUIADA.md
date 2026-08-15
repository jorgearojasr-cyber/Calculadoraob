# FASE 11A — Diseño de Inspección Técnica Guiada

**Estado del documento**: especificación de producto y arquitectura únicamente. No se modificó código, Prisma, catálogo, ni se instaló nada. Sin commit asociado.

**Fecha**: 2026-08-15

**Fuente de verdad reutilizada**: todo lo ya construido y verificado en producción hasta Fase 10R — catálogo V2 (7 espacios/8 elementos/22 vínculos/11 preguntas), `TechnicalArticle` (5 piloto), motor de redacción/resumen 100% local, resumen web, PDF resumido/detallado, ownership, historial vigente/no vigente. Nada de eso se reinterpreta aquí; esta fase diseña cómo **evolucionarlo**, no cómo reemplazarlo.

---

## 1. Flujo UX completo

```
PROYECTO
  → nombre / dirección (igual que hoy)
MOTIVO DE INSPECCIÓN                    ← NUEVO paso
  → A. Recepción antes de firmar
  → B. Ya recibí la vivienda y quiero revisar
  → C. Revisar una ampliación
TIPO DE INMUEBLE
  → Casa / Departamento / Ampliación (reutiliza el enum ya existente;
    si motivo = C, tipo queda fijado en Ampliación automáticamente,
    sin volver a preguntarlo — ver sección 2)
CARACTERÍSTICAS                         ← reemplaza/amplía el paso actual
  → ficha estructurada (secciones 3/4/5), reemplaza el simple
    "contador de espacios" de hoy, pero lo incluye
RECINTOS                                ← igual mecanismo que hoy
  → generados automáticamente desde las características (misma
    lógica ya usada para dormitorios/baños, extendida)
PARTIDAS                                ← "elementos" de hoy, renombrados
  → lista de partidas por recinto (mismo N:N ya existente)
GUÍA DE REVISIÓN                        ← NUEVO — antes vivía como un
  → "Cómo revisar..." colapsado al lado de los botones de evaluación;
    ahora es el primer contenido que ve el usuario al entrar a una
    partida, con tono de tutor (ver plantilla sección 6)
EVALUACIÓN
  → OK / Observación / No aplica (sin cambios, mismo componente)
FOTO/COMENTARIO
  → igual mecanismo de hoy (comentario + severidad + foto por hallazgo)
RESUMEN/INFORME
  → resumen web + PDF ya existentes, con lenguaje condicionado por
    motivo (sección 11)
```

La diferencia central respecto a V1 no es un rediseño de arquitectura — es una **reordenación de énfasis**: la guía de revisión deja de ser opcional/secundaria y pasa a ser el primer contenido de cada partida, coherente con el objetivo de "tutor para propietarios sin conocimientos técnicos".

## 2. Motivo de inspección

**Qué debe persistirse**: un campo nuevo en el caso (`motivo`: A/B/C — ver sección 8C, no implementado en esta fase).

**Relación con `tipoInmueble`**: no son redundantes salvo en un caso — si `tipoInmueble = AMPLIACION`, el motivo solo puede ser C, así que el paso "Motivo" se salta y queda fijado automáticamente. Para Casa/Departamento, A y B son ambos válidos y reales (una recepción antes de firmar y una revisión post-recepción son situaciones distintas de uso, aunque el inmueble sea el mismo tipo).

**Cómo cambia el lenguaje del informe, sin volverse conclusión legal**:
- **A (antes de firmar)**: lenguaje orientado a "esto es lo que conviene revisar antes de aceptar la entrega" — nunca "apto/no apto para recepción", nunca "cumple/no cumple para firmar".
- **B (ya recibida)**: lenguaje orientado a "esto es lo que encontramos, útil para dejar constancia" — nunca "esto invalida tu garantía" ni ninguna afirmación de derecho.
- **C (ampliación)**: lenguaje acotado a la obra nueva únicamente, nunca extendido al resto de la vivienda.

En los tres casos, la regla ya establecida en Fase 9A/10A se mantiene sin excepción: nunca "cumple normativa", nunca certificación, nunca diagnóstico de causa a partir de una señal visual.

## 3. Ficha de Casa

| Campo | ¿Genera recinto/partida? | Diseño |
|---|---|---|
| Cantidad de pisos | No — informativo | Contexto del informe ("casa de 2 pisos"); no crea recintos por sí solo — los dormitorios/baños ya generan sus propios recintos independientemente del piso en que estén |
| Antejardín (sí/no) | Sí, condicional | Genera recinto "Antejardín" solo si responde sí |
| Reja (sí/no) | No genera recinto propio | Metadata que decide si el recinto "Antejardín" incluye la partida "Reja/cierre frontal" |
| Patio trasero (sí/no) | Sí, condicional | Genera recinto "Patio trasero" — 🔴 fuente ITO débil para partidas propias, ver sección 7 |
| Bodega (sí/no) | Sí, condicional | Genera recinto "Bodega" (reutiliza el elemento `bodega` ya existente en catálogo, hoy solo usado para Departamento) |
| Acceso vehicular/estacionamiento (sí/no) | Sí, condicional | Genera recinto "Acceso vehicular" |
| Portón (sí/no) | No genera recinto propio | Metadata que decide si "Acceso vehicular" incluye la partida "Portón" |
| Dormitorios (cantidad) | Sí, repetible | Igual que hoy — sin cambios |
| Baños (cantidad) | Sí, repetible | Igual que hoy — sin cambios |
| Tipo de cocina (americana/cerrada/otra) | No genera recinto propio | Metadata adjunta al recinto "Cocina" (siempre se genera 1) — decide si se incluye la partida "Campana extractora" (solo cocina cerrada) |
| Living-comedor (integrado/separado) | Sí | Integrado → 1 recinto "Living-comedor"; separado → 2 recintos "Living" y "Comedor" |

## 4. Ficha de Departamento

| Campo | ¿Genera recinto/partida? | Diseño |
|---|---|---|
| Piso/torre | No — informativo | Contexto del informe ("depto piso 8, torre B") |
| Terraza o logia (sí/no) | Sí, condicional | Genera recinto "Terraza/Logia" — 🟡 propuesto, fuente ITO existe pero delgada (ver sección 7) |
| Estacionamiento (sí/no) | Sí, condicional | Ya existe en catálogo V1 (Fase 6B) — sin cambios |
| Bodega (sí/no) | Sí, condicional | Ya existe en catálogo V1 (Fase 6B) — sin cambios |
| Dormitorios/Baños | Sí, repetible | Sin cambios |
| Tipo de cocina | Metadata | Igual criterio que Casa |
| Living-comedor | Sí | Igual criterio que Casa |

No se agregan áreas comunes (hall, ascensor, sala de eventos, etc.) — ninguna fuente (ni ITO ni el catálogo actual) las respalda, y el usuario no puede evaluarlas con el mismo criterio de "su propia unidad" — quedan fuera de alcance explícitamente (sección 16).

## 5. Ficha de Ampliación

Reemplaza el "Recinto ampliado" genérico único por una elección explícita de **qué se está ampliando**:

| Tipo de ampliación elegido | Recintos que genera | Partidas |
|---|---|---|
| Cocina | 1 recinto "Cocina (ampliación)" | Mismo set que Cocina normal (sección 7) |
| Dormitorio | 1 recinto "Dormitorio (ampliación)" | Mismo set que Dormitorio normal |
| Dormitorio + baño | 2 recintos | Mismo set que Dormitorio + Baño normales |
| Living-comedor | 1-2 recintos según integrado/separado | Mismo criterio que Casa |
| Segundo piso | Repite la ficha de características acotada al nuevo piso (qué dormitorios/baños/living tiene ese piso) | Igual que Casa, generado dinámicamente |
| Terraza cerrada | 1 recinto "Terraza cerrada" | 🔴 propuesto, sin fuente ITO específica todavía — marcar como pendiente de investigación de contenido antes de implementar |
| Otro | 1 recinto genérico "Recinto ampliado" (comportamiento actual, preservado) | Piso/Muros/Ventana/Puerta — fallback de compatibilidad, no se elimina |

**Campos adicionales** (informativos, nunca generan partidas):
- **Superficie aproximada (m²)**: se reporta en el resumen/informe, no cambia el catálogo aplicado.
- **Permiso existente / en regularización / sin permiso**: se reporta tal cual el usuario lo declara ("Esta ampliación está en proceso de regularización, según lo indicado por el usuario") — **nunca** una afirmación de cumplimiento legal propia de la aplicación.

**Se mantiene sin cambios** la exclusión deliberada de "Estructura" como partida (Fase 6A) — ninguna fuente nueva la justifica en esta fase.

## 6. Plantilla definitiva de una partida

Estructura completa (evolución de los 5 encabezados actuales de `TechnicalArticle`):

```
# Qué revisar
(contexto general — ya existe hoy como "Qué se revisa")

# Cómo revisarlo
(instrucciones prácticas, paso a paso — NUEVO, hoy implícito en el
texto general, se separa explícitamente)

# Qué está bien
(condición aceptable — ya existe hoy como "Qué debería observarse")

# Qué puede ser señal de problema
(zona intermedia — NUEVO, ver distinción de 3 niveles abajo)

# Qué está mal
(condición claramente no conforme, con umbral cuando exista uno real
citable — ya existe hoy como "Cuando existe una observación", se
mantiene pero se separa de "posible señal")

# Por qué importa
(explicación en lenguaje humano de la consecuencia práctica — NUEVO,
sin diagnosticar causa técnica ni citar normativa inexistente)

# Qué puedes hacer
(acción recomendada para el usuario — ya existe hoy como
"Recomendación")

# Ejemplo
(frase concreta ilustrativa, ej. "Una fisura de 0,5mm que cruza una
esquina" — NUEVO)

# Material/variante
(cuando aplica — ej. cerámica vs. porcelanato — NUEVO, opcional)

# Fuente
(igual que hoy — cita real o "Sin referencia normativa verificada en
esta fuente")

# Referencia visual
(foto o diagrama ilustrativo del catálogo — NUEVO, distinto de las
fotos que el usuario sube; ver sección 11)
```

**Distinción de 3 niveles, obligatoria en toda partida** (regla dura pedida en el enunciado, sin excepciones):

```
OBSERVACIÓN         → lo que el usuario efectivamente vio (hecho)
        ↓
POSIBLE SIGNO        → lo que esa observación podría indicar (hedge,
                       nunca una afirmación cerrada)
        ↓
RECOMENDACIÓN         → qué hacer al respecto (acción, no diagnóstico)
```

Ejemplo aplicado (Piso — sonido hueco): "Se observa sonido hueco al golpear la pieza (**observación**). Esto puede ser señal de que la pieza no quedó bien adherida (**posible signo**, no un diagnóstico cerrado). Se recomienda registrar el hallazgo con foto y consultar con el instalador o un profesional si el sonido se repite en varias piezas (**recomendación**)." — nunca "esto es una pieza suelta" como hecho consumado.

## 7. Matriz recinto → partidas (conceptual, no implementada)

Leyenda: 🟢 ya existe en catálogo V1 · 🟡 propuesto, fuente ITO real disponible (mismo rigor que Fase 6A) · 🔴 propuesto, fuente débil/ausente — no implementar sin investigación adicional.

**Casa**
| Recinto | Partidas |
|---|---|
| Dormitorio | Piso🟢, Muros🟢, Ventana🟢, Puerta🟢, Enchufes e interruptores🟢, Cielo🟡, Closets🟡 |
| Baño | Piso🟢, Muros🟢, Artefactos sanitarios🟢 (incluye grifería, ya plegada desde Fase 6B), Impermeabilización y sellos🟡 |
| Living | Piso🟢, Muros🟢, Ventana🟢, Enchufes🟢 |
| Comedor | Mismo set que Living (comparten partidas vía el mismo mecanismo N:N ya usado hoy) |
| Cocina | Piso🟢, Muros🟢, Ventana🟢, Enchufes🟢, Muebles de cocina🟡, Llave de agua/lavaplatos🟡, Campana extractora🟡 (solo si cocina cerrada) |
| Bodega | Bodega🟢 (mismo elemento ya usado en Departamento) |
| Antejardín | Fachada🟡, Reja🟡 (condicional) |
| Patio trasero | 🔴 sin partidas propuestas todavía — requiere investigación de fuente antes de implementar |
| Acceso vehicular/Estacionamiento exterior | Portón🟡 (condicional) |

**Departamento**
| Recinto | Partidas |
|---|---|
| Dormitorio / Baño / Living-comedor / Cocina | Idéntico a Casa |
| Logia/Terraza | 🟡 propuesto, fuente ITO delgada — investigar antes de implementar |
| Bodega | Bodega🟢 (ya existe) |
| Estacionamiento | Estacionamiento🟢 (ya existe) |

**Ampliaciones**: reutilizan exactamente la fila del recinto correspondiente de arriba (una "Cocina (ampliación)" usa las mismas partidas que "Cocina") — no se inventa un set de partidas exclusivo para ampliaciones.

No se modificó el catálogo real en esta fase — esta matriz es la base para una futura Fase 11B de implementación, siguiendo el mismo proceso disciplinado ya usado en Fase 6A (auditar fuente real antes de cada partida nueva, nunca inventar contenido).

## 8. Auditoría del schema actual

**A. Reutilizable sin cambios**: `InspectionSpaceTemplate`, `InspectionElementTemplate`, `InspectionElementTemplateSpace` (el N:N ya soporta exactamente la reutilización de partidas entre recintos que pide esta evolución), `InspectionChecklistItem` (ya es conceptualmente "la partida-pregunta"), `InspectionObservation` (comment/severity/recommendation/status ya cubre la evaluación), `InspectionPhoto` (los 4 niveles ya cubren la estrategia de evidencia del usuario).

**B. Resoluble solo con catálogo** (sin tocar schema): todos los nuevos recintos/elementos/preguntas de la sección 7 marcados 🟢/🟡 — mismo mecanismo de `prisma/seed-inspecciones.ts` ya usado en Fase 6B, solo con más filas.

**C. Requiere nuevas entidades/campos** (NO implementado en esta fase, solo identificado):
- `InspectionCase.motivo` — nuevo campo/enum para persistir A/B/C.
- Datos de la ficha de características (tipo de cocina, living integrado/separado, cantidad de pisos, piso/torre de depto, superficie de ampliación, estado de permiso) — hoy no hay dónde guardarlos. Dos caminos posibles, a evaluar en la fase de implementación, no decididos acá: (a) columnas nuevas en `InspectionCase` (simple, pero no escala bien si la ficha sigue creciendo), o (b) una tabla genérica clave-valor tipo `InspectionCaseAttribute` (más flexible, mismo patrón que otros módulos del proyecto usan para datos variables). Esta decisión queda **explícitamente abierta**, no resuelta en esta fase de diseño.
- Referencia visual de catálogo (foto ilustrativa de una partida, no del usuario) — `InspectionPhoto` hoy solo se asocia a instancias reales de inspección, no a `TechnicalArticle`. Necesitaría un campo nuevo (ej. una URL simple en `TechnicalArticle`, o una tabla de imágenes de catálogo aparte).
- Los 5 campos nuevos de la plantilla de partida (sección 6) — pueden resolverse sin cambio de schema, siguiendo exactamente el mismo patrón de hoy (Markdown estructurado dentro de `TechnicalArticle.content`, parseado por `inspecciones-knowledge.ts`) — **no es obligatorio un cambio de schema para esto**, solo una convención de contenido más rica.

**D. Qué debe persistirse**: motivo, respuestas de la ficha de características (fuente de verdad, no derivable), tipo de ampliación elegido, superficie aproximada, estado de permiso declarado — todo dato que el usuario ingresó explícitamente.

**E. Qué puede derivarse** (no se persiste aparte): conteos/progreso (ya derivado hoy), vigente/histórico (ya derivado del `status` del check), qué partidas corresponden a un recinto dado (se deriva de la matriz de catálogo aplicada al momento de generar el caso, igual que hoy).

**F. Qué NO debe persistirse** (evitar duplicación): el contenido de la guía de revisión no debe copiarse dentro de cada `InspectionChecklistCheck` — seguir usando la referencia liviana `technicalArticleSlug` (diseño ya aprobado en Fase 1, sin razón para cambiarlo); la ficha de características no debe duplicarse dentro de cada `InspectionSpace` generado — vive una sola vez en el caso, los recintos se derivan de ella al crearse, igual que hoy con dormitorios/baños.

## 9. Integración futura de IA

Se hereda el marco ya aprobado en Fase 10A/10B sin reinterpretarlo, extendido con dos ideas nuevas:

| Función | Estado |
|---|---|
| Asistencia de redacción | Ya implementada (Fase 10B), se mantiene sin cambios |
| Resumen del informe | Ya implementada (Fase 10B), se extiende para variar el lenguaje según `motivo` (sección 11) |
| Explicación en lenguaje simple ("no entendí, explícamelo más fácil") | NUEVA idea, de valor real para el público objetivo de esta evolución — reformula el contenido YA ESCRITO de la guía de revisión, nunca inventa contenido nuevo; mismo motor local ya existente |
| Análisis visual de fotografías | Ya diseñada como "segundo lote" en Fase 10A, sigue pospuesta — sin cambios en esa decisión |
| Clasificación asistida (sugerir qué partida corresponde según lo que el usuario escribió/fotografió) | NUEVA idea del pedido, de **menor prioridad** — riesgo real de deslizarse hacia diagnóstico si no se diseña con cuidado; se deja explícitamente para una fase de diseño de IA aparte, no para el primer lote de esta evolución |

**Reglas de human-in-the-loop — sin excepción, heredadas literalmente**: ninguna función de IA escribe directamente estado, severidad, diagnóstico, cumplimiento normativo ni conclusión legal. Toda propuesta pasa por revisión y aceptación explícita del usuario, usando el mismo patrón ya construido (Aceptar/Editar/Descartar). No se propone instalar ninguna API externa "para mejorar" — la arquitectura 100% local sigue siendo el punto de partida por defecto.

## 10. Estrategia de fotografías

Se mantienen los 4 niveles ya existentes (caso/espacio/elemento/observación) — **no se agrega un nivel nuevo**. Se agrega un concepto distinto y claramente separado: la **referencia visual de catálogo** (sección 6/8C) — una foto ilustrativa que pertenece a la guía de revisión de una partida, no a la inspección real del usuario. Debe rotularse siempre de forma inconfundible ("Foto de referencia" vs. las fotos que el usuario sube, ya rotuladas por contexto en la UI actual) para que nunca se confunda evidencia real con material ilustrativo del catálogo.

## 11. Estrategia del informe

Cuatro categorías de lectura, condicionadas por `motivo`, construidas sobre datos ya existentes (severidad + estado vigente/histórico), sin inventar una taxonomía nueva:

- **Qué conviene corregir/priorizar**: hallazgos vigentes de severidad Alta/Crítica, mismo orden ya usado en el PDF (Fase 9B).
- **Qué conviene dejar registrado**: hallazgos vigentes de severidad Baja/Media — relevantes para dejar constancia (útil especialmente en motivo B, "ya recibí la vivienda").
- **Qué es principalmente estético**: no se crea un campo de severidad nuevo — se infiere del mismo `severity` ya existente (Baja tiende a lo estético) combinado con el lenguaje ya redactado en cada hallazgo, sin inventar una clasificación aparte.
- **Qué requiere revisión adicional**: hallazgos de severidad Alta/Crítica cuya recomendación ya sugiere consultar a un profesional — mismo patrón que los `TechnicalArticle` piloto de Fase 5B.

**Regla dura, heredada sin excepción de Fase 9A/10A/10P**: nunca una nota de calidad de la vivienda, nunca una afirmación de cumplimiento u incumplimiento normativo, sin importar el motivo declarado.

## 12. Casos especiales

- Usuario no sabe responder una pregunta de la ficha (ej. "¿tiene permiso de ampliación?") → debe existir una opción "No lo sé", nunca forzar una respuesta.
- Un caso cubre un solo motivo/tipo a la vez (igual que hoy, `tipoInmueble` es único por caso) — revisar "el resto de la casa" y "la ampliación" a la vez queda fuera de alcance de V1 de esta evolución; se sugiere crear dos casos separados si el usuario lo necesita.
- Recinto con partidas 🔴 sin fuente todavía (ej. Patio trasero, Terraza cerrada) → no generar el recinto hasta tener contenido real, o generarlo vacío con el mismo mensaje ya usado hoy ("Todavía no hay catálogo de espacios configurado para este tipo de inmueble").
- Cambiar la ficha de características (ej. de living integrado a separado) después de creado el caso → no soportado en V1 de esta evolución, mismo criterio que hoy con dormitorios/baños (la ficha se responde una sola vez al crear el caso).

## 13. Qué se puede reutilizar de V1

Prácticamente toda la infraestructura: el motor de catálogo N:N completo, el motor de fotografías (4 niveles), el motor de redacción y resumen 100% local, el resumen web y ambos PDF (con ajuste de lenguaje por motivo), ownership, y toda la lógica de vigente/histórico. Esta evolución es una ampliación de contenido y de flujo, no un reemplazo de arquitectura.

## 14. Qué debe cambiar

- El wizard de creación de inspección: agregar el paso "Motivo" y reemplazar el simple contador de espacios por una ficha de características estructurada.
- La posición de la guía de revisión en la UI: de "toggle opcional al costado" a "paso previo, tipo tutor" antes de la evaluación.
- La plantilla de contenido de `TechnicalArticle`: más encabezados (sección 6), pero sin cambio de schema obligatorio.
- El catálogo: nuevos recintos/elementos, siguiendo el mismo proceso disciplinado de Fase 6A (auditar fuente real antes de cada partida).

## 15. Qué debe quedar explícitamente fuera de alcance (de esta fase Y de la próxima implementación inmediata)

- Análisis de fotos con IA.
- Sugerencia automática de severidad.
- Certificación, diagnóstico técnico o cumplimiento normativo de cualquier tipo.
- "Nota de calidad" o puntaje agregado de la vivienda.
- Clasificación asistida por IA (pospuesta, ver sección 9).
- Edición de la ficha de características después de creado el caso.
- Más de un motivo/tipo de inmueble por caso.
- Áreas comunes de edificios (hall, ascensor, sala de eventos, etc.).
- Partidas de Patio trasero y Terraza cerrada hasta contar con fuente real investigada.
- Cualquier cambio de código, Prisma, catálogo o seed — esta fase es exclusivamente de diseño.

---

FASE 11A — DISEÑO DE INSPECCIÓN TÉCNICA GUIADA COMPLETADO
