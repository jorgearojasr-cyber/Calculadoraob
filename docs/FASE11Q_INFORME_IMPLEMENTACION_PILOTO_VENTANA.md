# Fase 11Q — Implementación del piloto de revisiones específicas: Ventana

Fecha: 2026-08-16. Continúa Fase 11M (diseño del motor de revisiones), Fase 11O (modelo `InspectionReferenceImage`) y Fase 11P (investigación de fuentes para Ventana). Esta fase **implementa localmente** el primer componente con revisiones específicas del catálogo de Inspecciones.

## A. Auditoría inicial

- HEAD y `origin/master` coinciden exactamente en `eb87079874d42ce58399af3fd8123938b07fab4c` (confirmado con `git fetch origin master` antes de empezar) — nada divergente, nada en riesgo de perderse.
- `prisma migrate status` → "Database schema is up to date!": la migración de Fase 11O (`20260816183126_inspection_reference_image`) ya estaba aplicada a la BD compartida.
- Pendientes de Fase 11O identificados y **preservados intactos** durante toda esta fase: `prisma/schema.prisma` (modificado) y `prisma/migrations/20260816183126_inspection_reference_image/` (sin trackear).
- Ventana `InspectionElementTemplate` (id `cmst4yoqm002h1csezjvthd6e`): 1 solo `InspectionChecklistItem` — `"¿Opera correctamente?"` (id `cmst4yqam00301cse9xafa7lp`), `technicalArticleSlug: "ventana-como-revisar-funcionamiento"`, `active: true`.
- 11 `InspectionChecklistCheck` reales referencian ese item, repartidos en los 3 casos reales existentes (`las dalias`, `PROPIA`, `xcxc`, todos de `jorge.arojasr@gmail.com`). **Los 11 tienen `status: null`, `notApplicableReason: null` y 0 observaciones** — ninguno respondido, ninguna foto, ningún hallazgo. No hay datos de respuesta reales en riesgo, pero la estrategia de compatibilidad se diseñó igual de forma genérica (válida aunque hubiera habido respuestas).
- No se tocó Radier, otras calculadoras, ni ningún archivo fuera del alcance de Inspecciones.

## B. Estrategia de compatibilidad (documentada antes de escribir datos)

**Desactivar, nunca borrar.** El item antiguo (`cmst4yqam00301cse9xafa7lp`) pasa a `active: false` y se conserva intacto (`question`, `technicalArticleSlug`, todo). Motivos:

1. `InspectionChecklistCheck.checklistItem` usa `onDelete: Restrict` — borrar el item físicamente está bloqueado por la BD mientras existan checks referenciándolo.
2. La generación de casos nuevos (`src/app/(app)/inspecciones/actions.ts`) filtra `checklistItems: { where: { active: true } }` — al desactivar el item antiguo y activar los 3 nuevos, los casos nuevos generan automáticamente solo las 3 preguntas nuevas.
3. La consulta del detalle de caso (`[id]/page.tsx`) trae los checks de un elemento por su relación directa (`element.checks`), **sin filtrar por `checklistItem.active`** — un check histórico sigue resolviendo su FK y renderizando su `questionSnapshot` congelado exactamente igual, sin importar que el item de origen esté inactivo.

Ningún check existente se modificó, reinterpretó ni se le reasignó una de las 3 preguntas nuevas.

## C. Pregunta antigua

`"¿Opera correctamente?"` → `active: false`. Verificado tras ejecutar el script: la fila sigue existiendo con su contenido original, sus 11 checks siguen apuntando a ella sin error.

## D. Nuevas revisiones

3 `InspectionChecklistItem` nuevos bajo el mismo `elementTemplateId` de Ventana, `order` 1/2/3:

1. `"¿La ventana abre y cierra correctamente?"` → slug `ventana-apertura-cierre`
2. `"¿La manilla y los herrajes funcionan correctamente?"` → slug `ventana-manilla-herrajes`
3. `"Con la ventana cerrada, ¿se ve alguna separación entre la hoja y el marco?"` → slug `ventana-sello-hoja-marco`

La pregunta 3 usa la redacción explícita del prompt de esta fase (observable, no técnica: "¿se ve alguna separación?"), evaluada contra el borrador de Fase 11P (que proponía "¿el sello es continuo?") y descartada a favor de la versión más accesible, tal como pidió el usuario. `defaultSeverity` se dejó `null` en los 3 — sin fundamento para asignar una severidad por defecto, consistente con el resto del catálogo.

## E. TechnicalArticle (3 nuevos)

Cada uno con los 7 encabezados pedidos: `# Qué revisar`, `# Cómo revisarlo`, `# Qué debería verse`, `# Qué señales pueden indicar un problema`, `# Por qué importa`, `# Recomendación`, `# Fuente`. Contenido fraccionado del artículo ya aprobado `ventana-como-revisar-funcionamiento` (que ya bundleaba implícitamente las 3 revisiones) y de los borradores de Fase 11P — ningún criterio técnico nuevo, ninguna fuente nueva.

**Fuente citada en los 3**: Manual de Tolerancias CDT (Ficha 13, Ventanas) + catálogo educativo ITO / biblioteca técnica ITO sobre silicona perimetral (para el de Sello) — exactamente las fuentes ya aprobadas en Fase 11P, sin agregar ninguna referencia normativa nueva ni inventada.

## F. Corrección editorial aplicada

Se evitaron activamente las frases prohibidas de la sección 5 del encargo. Ejemplos de la sustitución aplicada:

- ~~"puede indicar que la ventana quedó mal instalada"~~ → *"Puede dificultar el uso normal de la ventana."*
- ~~"es el primer síntoma de..."~~ → *"Puede permitir el paso de aire o agua."*
- Toda observación cierra con una variante de *"conviene registrarlo/registrarla igual"* o *"esto no determina por sí solo la causa"* — nunca una conclusión diagnóstica.

Se mantuvo estrictamente OBSERVACIÓN → POSIBLE EFECTO → RECOMENDACIÓN.

## G. Auditoría de seguridad de redacción (sección 22)

`grep` sobre `prisma/db-fixes/fase11q-piloto-ventana.ts` con el listado completo de frases prohibidas (`significa que`, `demuestra que`, `falla estructural`, `no cumple`, `cumple normativa`, `está mal instalad[ao]`, `debe estar mal`, `suele ser`, `primer síntoma`, `\bcausa\b`). Único patrón que matchea: **"no determina por sí sola la causa"** / **"no determina por sí solo la causa"** — exactamente la frase de seguridad que el propio encargo pidió usar. Sin hallazgos que requieran revisión manual adicional.

## H. Modelo `InspectionReferenceImage` consumido

`[id]/page.tsx` — el `include` del checklistItem ahora trae `referenceImages: { orderBy: { order: "asc" }, select: { id, kind, url, alt, caption } }` como parte del mismo `include` anidado que ya resolvía `technicalArticleSlug` (mismo query, sin consulta aparte, sin N+1 — a diferencia de `technicalArticleSlug`, que sí requiere una segunda consulta por ser una referencia libre sin FK, `referenceImages` es una relación real y se resuelve directo). Se propagó como campo nuevo `referenceImages` en `ElementChecklistData.checks[]` (`element-checklist-group.tsx`) y como prop nueva de `ChecklistItemRow`.

## I. UI "Ver ejemplos"

Nuevo bloque en `checklist-item-row.tsx`: botón "Ver ejemplos" (ícono `Images`, mismo patrón visual que "Ver cómo revisarlo") que solo se renderiza si `referenceImages.length > 0`. Al expandir: "ASÍ PUEDE VERSE" con columnas BIEN (verde) / MAL (rojo), cada imagen con su `alt` obligatorio y `caption` opcional. Ubicación exacta pedida: guía breve → **Ver ejemplos** → Ver cómo revisarlo → botones de estado. Deliberadamente separado de "Ver cómo revisarlo" (recursos distintos: visual vs. texto extendido) y espacialmente separado de la foto real del hallazgo (que vive más abajo, dentro de la observación) para no confundir imagen educativa con evidencia del caso.

## J. Desktop

Columnas BIEN/MAL lado a lado (`grid-cols-2` desde `sm:`). Verificado en el caso QA: al abrir "Ver ejemplos" en la revisión de Sello se ven ambas columnas con etiqueta, imagen y caption "[QA Fase11Q] Imagen temporal de prueba".

## K. Mobile 375px

1 columna (`grid-cols-1` por debajo de `sm:`, 640px) — imágenes de 251px de ancho, legibles, sin recortarse. `document.documentElement.scrollWidth === window.innerWidth === 375` confirmado por script: **cero overflow horizontal** en toda la página, con o sin el bloque de referencias expandido.

## L. Caso nuevo

Caso QA generado después de aplicar el catálogo → "Ventana 0/3" con **exactamente** las 3 preguntas nuevas (Apertura y cierre, Manilla y herrajes, Sello hoja-marco). La pregunta antigua **no aparece** en absoluto en casos nuevos. Cada revisión mostró: guía breve, expandible técnico completo (los 6 apartados, incluyendo "QUÉ DEBERÍA VERSE" tras el fix de la sección M), 3 botones de estado sin preselección, "Nivel del problema" editable, campo de comentario, foto de hallazgo, y "Sugerir redacción" funcionando (probado end-to-end sobre la revisión de Sello, generó *"Se observa: Se observa una pequeña separación entre la hoja y el marco en el sector inferior derecho."* usando el nuevo artículo). En la revisión de Sello, sin `InspectionReferenceImage`, "Ver ejemplos" **no apareció** — comportamiento correcto confirmado.

## M. Bug encontrado y corregido durante el QA: alias de encabezado faltante

Al expandir "Ver cómo revisarlo" por primera vez, la sección "QUÉ DEBERÍA VERSE" **no aparecía** — el parser de `src/lib/inspecciones-knowledge.ts` (`SECTION_ALIASES.condicionesCorrectas`) solo reconocía el encabezado `"qué debería observarse"` (usado por los artículos previos de Piso/Bodega/Estacionamiento), pero el encargo de esta fase pide literalmente `# Qué debería verse` para los 3 artículos de Ventana. Se agregó `"qué debería verse"` / `"que deberia verse"` como alias **aditivo** (no se tocó ni renombró el alias existente, ningún artículo previo se ve afectado). Verificado tras el fix: la sección aparece completa en los 3 artículos nuevos, y `npx vitest run` sigue en 95/95 tras el cambio.

## N. Caso histórico

Se simuló un check histórico (check apuntando al item antiguo ya inactivo, con `questionSnapshot: "¿Opera correctamente?"`, `status: OBSERVATION` y una observación con comentario) sobre el mismo caso QA. Resultado: **abrió sin error**, mostró la pregunta antigua tal cual (`questionSnapshot`, nunca reinterpretada como ninguna de las 3 nuevas), conservó su estado ("Tiene un problema") y su hallazgo con severidad — junto a las 3 revisiones nuevas del mismo elemento, sin conflicto de orden ni de render. El progreso del elemento pasó a "3/4" reflejando correctamente el check adicional.

## O. Resumen y PDF

`/inspecciones/[id]/resumen` mostró correctamente: 4 puntos revisados, 1 pendiente (Manilla, aún sin responder), 2 hallazgos vigentes — uno de la pregunta antigua histórica, otro de Sello (nueva) — cada uno con su enlace "Cómo revisar..." resuelto al artículo correcto. Ambos PDFs devolvieron `200`: `/api/inspecciones/[id]/pdf/resumen` y `/api/inspecciones/[id]/pdf/detallado`. No se agregaron referencias BIEN/MAL al PDF (fuera de alcance de esta fase, según instrucción explícita).

## P. Ownership

`referenceImages` se lee dentro del mismo `include` de `checklistItem`, dentro de la misma consulta ya protegida por el `findUniqueOrThrow` con verificación de `userId` que existe desde antes en `[id]/page.tsx` — no se creó ningún endpoint ni consulta nueva sin ese resguardo. El caso QA se generó y consultó bajo un usuario QA propio, sin cruce con los casos reales de `jorge.arojasr@gmail.com`.

## Q. QA temporal GOOD/BAD y limpieza

Se insertaron 2 `InspectionReferenceImage` temporales (1 `GOOD`, 1 `BAD`) sobre el checklist item de Sello, con `url` en `data:image/svg+xml` (sin archivos externos ni blobs reales) y `alt`/`caption` marcados explícitamente `[QA Fase11Q temporal]` / `[QA Fase11Q]`. Verificado: botón "Ver ejemplos", expandir/colapsar, columnas BIEN/MAL separadas, alt correcto, caption visible, orden, desktop y mobile 375px. **Eliminadas** al terminar — `InspectionReferenceImage` count = 0 confirmado por consulta directa. No se usó ningún blob real de Vercel Blob Storage en ningún momento (las imágenes de prueba fueron SVG inline, nunca subidas a storage), por lo que no hubo nada que borrar en Blob.

## R. Limpieza QA completa

Eliminado en este orden: `InspectionReferenceImage` QA (2 filas) → `InspectionCase` QA (cascada elimina space/element/checks/observations) → `User` QA (`qa.fase11q@example.com`). Verificación final por consulta directa: `InspectionReferenceImage` total = 0, usuarios QA = 0, casos con nombre `Fase11Q` = 0. Los 11 checks históricos reales de Jorge sobre la pregunta antigua siguen intactos (confirmado por conteo = 11 después de toda la limpieza). Los 5 scripts temporales (`_tmp_11q_*.ts`) fueron borrados; se conservó únicamente `prisma/db-fixes/fase11q-piloto-ventana.ts`.

## S. TypeScript / ESLint / Vitest / Build

- `npx tsc --noEmit` → limpio.
- `npx eslint .` → limpio.
- `npx vitest run` → **95/95 tests pasan** (10 archivos).
- `npx next build` → build de producción exitoso, sin errores ni warnings nuevos.

## T. Regresiones en otros módulos

No se modificó ningún archivo de Piso, Muros, Puerta, Bodega, Estacionamiento, wizard, portada/listado de inspecciones, eliminación de caso, ni foto de portada — el `git diff` (sección Z) confirma que los únicos archivos de Inspecciones tocados son los 4 listados en la sección H/I. No se encontró ninguna regresión real en esos módulos durante el QA (la navegación y renderizado del resto del catálogo no pasa por ningún código nuevo de esta fase).

## U. Pendientes explícitos (fuera de alcance de esta fase)

- Vidrio, Sello marco-muro, Marco, Terminaciones — quedan sin revisión específica (clasificados 🟡/🔴 en Fase 11P).
- `materialVariantOf` — sin usar; ninguna de las 3 revisiones aprobadas lo necesita.
- Imágenes BIEN/MAL reales — el modelo y la UI ya están listos para consumirlas, pero **ninguna imagen real fue insertada** en esta fase.
- El bug del alias `"qué debería verse"` corregido en esta fase (sección M) es aditivo y no requiere seguimiento adicional.

## V. Diff de git (auditoría final)

`git status --porcelain` al cierre — 3 grupos claramente distinguibles:

**(A) Pendiente de Fase 11O (sin tocar en esta fase):**
```
 M prisma/schema.prisma
?? prisma/migrations/20260816183126_inspection_reference_image/
```

**(B) Nuevo de Fase 11Q:**
```
 M src/app/(app)/inspecciones/[id]/page.tsx
 M src/components/inspecciones/checklist-item-row.tsx
 M src/components/inspecciones/element-checklist-group.tsx
 M src/lib/inspecciones-knowledge.ts
?? prisma/db-fixes/fase11q-piloto-ventana.ts
```

**(C) Trabajo preexistente no relacionado (ya estaba así al empezar esta fase, no tocado):**
```
 M src/components/module/dosificacion-card.tsx
 M src/components/module/module-visual-config.ts
 M src/components/module/module-wizard.tsx
 M src/components/module/recalculate-field.tsx
 M src/components/module/result-hero.tsx
 M src/components/module/result-screen.tsx
 M src/lib/diagram-v2/DiagramV2.tsx
 M src/lib/diagram-v2/render/solid-3d.tsx
 M src/lib/diagram-v2/render/theme.ts
?? docs/BASE_PRECIOS_REFERENCIA_DISENO.md
?? docs/ESTUDIO_TECNICO_CALCULADORES.md
?? docs/FASE11C_INFORME_PUBLICACION.md
?? docs/FASE11G_VALIDACION_FUENTES_PREGUNTAS_PENDIENTES.md
?? docs/FASE11J_REDISENO_PROFUNDO_INSPECCION_GUIADA.md
?? docs/FASE11M_DISENO_MOTOR_REVISIONES_VARIANTES.md
?? docs/FASE11O_INFORME_MODELO_REFERENCIAS_VISUALES.md
?? docs/FASE11P_DISENO_PILOTO_VENTANA.md
?? docs/FASE4B_ESPECIFICACION_TECNICA_P1.md
?? docs/FASE4_DISENO_CATALOGO_NUEVO.md
?? prisma/db-fixes/inspect-uncertainty-options.ts
```

`git diff --stat`: 14 archivos, +504/-144 (incluye grupos A+B+C combinados; el desglose de B es 4 archivos modificados con un total acotado a la UI de referencias/alias de conocimiento, ver secciones H/I/M).

**Confirmado**: `HEAD` sigue en `eb87079874d42ce58399af3fd8123938b07fab4c`. **Nada fue agregado al stage, nada fue commiteado, nada fue pusheado, ningún deploy fue disparado** en esta fase.

## W. Estado final

- 4 `InspectionChecklistItem` bajo Ventana: 1 inactivo (histórico, preservado) + 3 activos (piloto).
- 3 `TechnicalArticle` nuevos, con contenido completo y fuentes ya aprobadas.
- 11 checks históricos reales intactos, sin pérdida ni reinterpretación de datos.
- UI de referencias visuales (`InspectionReferenceImage`) implementada y verificada end-to-end con datos QA temporales — 0 imágenes reales insertadas, listo para que una fase futura cargue contenido real.
- Script `prisma/db-fixes/fase11q-piloto-ventana.ts` idempotente, verificado con 2 ejecuciones consecutivas (segunda ejecución actualiza en vez de duplicar).
- Regresión completa limpia (tsc/eslint/vitest 95/95/build).
- **Importante — el código queda solo en local, pero el catálogo ya es efectivo en producción.** Esta BD (`ep-hidden-heart-ac4kyspz`) es compartida entre desarrollo y producción, y el script ya se ejecutó contra ella. El filtro `active: true` en la generación de casos nuevos ya está desplegado desde Fase 11B — por lo tanto, **desde ahora, cualquier caso nuevo que un usuario real cree en producción generará automáticamente las 3 preguntas nuevas de Ventana en vez de la antigua**, aunque el código de esta fase (la UI de "Ver ejemplos", el fix del alias de encabezado) todavía no esté deployado. El único efecto visible de eso hoy en producción: los 3 artículos nuevos existen pero, sin el fix de la sección M ya desplegado, mostrarían el bloque "Qué debería verse" vacío hasta que se publique este código — el resto del contenido (guía breve, cómo revisarlo, señales, por qué importa, recomendación, fuente) sí se vería completo.

**FASE 11Q — PILOTO VENTANA IMPLEMENTADO LOCALMENTE**
