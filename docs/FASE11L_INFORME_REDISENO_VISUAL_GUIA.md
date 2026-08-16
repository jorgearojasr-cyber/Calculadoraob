# FASE 11L — Rediseño visual de la revisión guiada (implementación local)

Fecha: 2026-08-16
Estado: implementado y probado localmente, **sin commit/push/deploy** (autorización explícita pendiente para publicar).

## A. Diagnóstico UI anterior

Antes de tocar código se auditó el comportamiento real (no el documentado en fases previas):

- `GuideBlock` (Fase 11B) se mostraba **abierto por defecto** apenas `hasGuide` era `true` — es decir, siempre que el artículo tenía `comoRevisarlo` o `senalesDeProblema`. El bloque incluía de una sola vez Qué revisar, Cómo revisarlo, Qué debería verse, Qué puede ser señal de un problema y Por qué importa — hasta 5 párrafos técnicos antes de que la persona pudiera responder.
- Las preguntas *sin* guía (`hasGuide === false`) ya usaban `TechnicalArticleLink`, que **sí** arranca colapsado (Fase 5B) — este patrón de expandible ya existía en el codebase y se reutilizó como base para el nuevo control "Ver cómo revisarlo".
- El botón "No corresponde" tenía el mismo tono (`bg-concrete text-ink-muted border-border`) en estado seleccionado y no-seleccionado — un check marcado "No corresponde" era visualmente indistinguible de uno sin responder.
- El campo "Severidad" del formulario de hallazgo mostraba esa palabra literal, jerga más técnica que el resto del copy ya simplificado del checklist ("Está bien"/"Tiene un problema"/"No corresponde").
- La foto de un hallazgo recién guardado no tenía ningún tratamiento especial: aparecía en su lugar habitual sin aviso ni scroll, dependiendo de que la persona notara la sección "Fotografías" más abajo.
- 12 `TechnicalArticle` existen hoy en el catálogo; ninguno tiene un encabezado `# Guía breve` explícito — confirmado por consulta directa antes de decidir la estrategia de derivación.

## B. Archivos modificados

- `src/lib/inspecciones-knowledge.ts` (modificado) — campo `guiaBreve` + función `deriveGuiaBreve`.
- `src/lib/inspecciones-knowledge.test.ts` (nuevo) — 7 tests para `deriveGuiaBreve` y la resolución de `guiaBreve` en `parseKnowledgeContent`.
- `src/components/inspecciones/checklist-item-row.tsx` (modificado) — guía breve, expandible "Ver cómo revisarlo", tono nuevo de "No corresponde", etiqueta "Nivel del problema", foto post-hallazgo con aviso/scroll.
- `src/components/inspecciones/element-checklist-group.tsx` (modificado) — tipo `technicalArticle` extendido con `guiaBreve`/`recomendacion`.
- `src/app/(app)/inspecciones/[id]/page.tsx` (modificado, solo comentario) — `articleBySlug` ya spreadeaba `parseKnowledgeContent(...)`, así que `guiaBreve`/`recomendacion` llegan automáticamente sin tocar la query ni el objeto literal.

Cero cambios en `prisma/schema.prisma`, cero migraciones nuevas, cero archivos de Radier/`module-visual-config`/`diagram-v2`/otras calculadoras (confirmado por `git status` — esos archivos aparecen modificados en el árbol por trabajo previo a esta fase, no tocados acá).

## C. Guía breve

`deriveGuiaBreve(queRevisar)` en `inspecciones-knowledge.ts`: determinista, sin IA, nunca inventa contenido. Toma la primera oración de `queRevisar` (hasta el primer `.`/`!`/`?`); si esa oración ya cabe en 160 caracteres, se usa tal cual; si es más larga, se recorta en el último espacio antes del límite y se agrega "…" — nunca corta a mitad de palabra. `parseKnowledgeContent` resuelve `guiaBreve` con esta prioridad: (1) encabezado explícito `# Guía breve` si el artículo lo tiene; (2) derivado de `queRevisar` si no; (3) `null` si tampoco hay `queRevisar`. Ningún artículo actual tiene el encabezado explícito — los 12 calculan `guiaBreve` por derivación, verificado en el navegador contra el catálogo real (Piso, Muros, Puerta, Ventana, Enchufes, Bodega, Estacionamiento, Artefactos sanitarios). Cubierto por 7 tests unitarios en `inspecciones-knowledge.test.ts`.

## D. Expandir/colapsar

Nuevo estado local `guideExpanded` (default `false`) en `ChecklistItemRow`, completamente independiente de `status`/`editingStatus`. Control "Ver cómo revisarlo" / "Ocultar detalle" con `aria-expanded`, mismo patrón visual que `TechnicalArticleLink` (ícono + texto + chevron). Medido en el navegador: un ítem sin responder mide **325px colapsado** y **1556px expandido** (4.8× más alto) — confirma que el contenido colapsado es significativamente más corto. Expandir/colapsar nunca toca el servidor ni pierde el estado de evaluación ya guardado (probado: expandir, responder, recargar — la respuesta persiste; el expandible vuelve a colapsado por ser estado local, comportamiento esperado).

## E. Jerarquía visual

Orden final implementado en `ChecklistItemRow`, verificado en el navegador (Piso/Dormitorio 1):
1. Pregunta (`questionSnapshot`).
2. Guía breve ("Revisa: …").
3. "Ver cómo revisarlo" (colapsado).
4. Botones de estado (Está bien / Tiene un problema / No corresponde).
5. Formulario de hallazgo solo si corresponde.

El nombre del componente ("Piso", "Muros", etc.) ya lo renderiza `ElementChecklistGroup` como encabezado de grupo — no tocado. `GuideBlock` expandido queda visualmente secundario (fondo `bg-safety-tint`, dentro del expandible) — nunca es lo primero que se ve.

## F. Estado "Está bien"

Tono `bg-success-tint text-success` (verde), icono `Check`. Contraste medido: `#185C3D` sobre `#B9D4C7` = **5.05:1** (AA para texto normal). Sin cambios respecto a antes — ya cumplía.

## G. Estado "Tiene un problema"

Tono `bg-danger-tint text-danger` (rojo), icono `TriangleAlert`. Contraste ya documentado en el código como 5.0:1 (Fase 3). Sin cambios respecto a antes.

## H. Estado "No corresponde"

Antes: mismo tono en seleccionado y no-seleccionado (`bg-concrete text-ink-muted`) — bug real de indistinguibilidad, corregido en esta fase. Ahora: naranjo quemado nuevo, LOCAL a `checklist-item-row.tsx` (no se tocó `tailwind.config.ts`), deliberadamente distinto del ámbar/mostaza ya usado para severidad Baja/Media y "Observación" en preguntas sin guía (`caution-tint` + `OBSERVATION_TEXT`), para no confundir dos significados con el mismo matiz. `#B5480A` sobre `#FCEAD9` — contraste medido **~4.9:1** (AA). Icono `X` (antes era solo un guion "—"). Verificado en el navegador vía `getComputedStyle`: `rgb(181, 72, 10)` sobre `rgb(252, 234, 217)`, coincide exactamente con los valores diseñados.

## I. Contraste

Los 3 estados fueron medidos con la misma fórmula de luminancia relativa (WCAG) ya usada en el código para `OBSERVATION_TEXT`:
- Está bien: 5.05:1
- Tiene un problema: 5.0:1 (ya documentado)
- No corresponde: ~4.9:1

Los 3 pasan AA para texto normal (≥4.5:1). Ninguno depende solo del color: cada estado combina texto + icono + fondo + borde (en los botones no seleccionados).

## J. Focus/accesibilidad

- `focus-visible` (`FOCUS_RING`) se mantuvo en todos los controles nuevos y existentes, sin excepción.
- Botones táctiles de 44px mínimo (`min-h-11`) preservados en todos los controles nuevos (toggle "Ver cómo revisarlo", botones de estado).
- El expandible usa `aria-expanded` (mismo patrón que `TechnicalArticleLink` y el histórico de hallazgos, ya existente).
- Ningún estado depende solo del color (icono + texto + fondo + borde en los 3).
- Labels de formulario (`<label><span>...</span></label>`) sin cambios estructurales, solo el texto de "Severidad" → "Nivel del problema".

## K. Nivel del problema

Etiqueta visible cambiada de "Severidad" a "Nivel del problema" SOLO en el `<label>` del formulario de hallazgo (`ObservationForm`). `InspectionSeverity`/`LOW`/`MEDIUM`/`HIGH`/`CRITICAL` sin cambios en ningún lado — BD, tipos, Server Actions, PDF. Las 4 opciones visibles (Baja/Media/Alta/Crítica) se dejaron intactas. Se documenta explícitamente, tal como pidió la fase: "Crítica" podría eventualmente sonar más alarmante de lo necesario para algunos casos reales (p. ej. una fisura estética grande pero no estructural clasificada por error como "Crítica" solo por su tamaño visual) — **no se cambia sin decisión explícita previa**, queda como candidato a revisar en una fase futura de copy, no en esta.

## L. Fotografía post-hallazgo

Invariante preservada sin excepción: la foto solo puede subirse después de que existe `observation.id` (después de "Guardar hallazgo") — no se creó ningún almacenamiento temporal ni se intentó subir antes. Se agregó: (1) el texto "Agrega una foto del problema, si puedes." visible una sola vez, justo después de guardar (verificado en el navegador: aparece exactamente tras "Guardar hallazgo"); (2) un intento de scroll suave (`scrollIntoView({behavior: "smooth", block: "nearest"})`) hacia la sección de fotos vía `useEffect` + `ref`. **Limitación de entorno detectada**: en el navegador de este entorno de pruebas, `scrollIntoView` (incluso invocado manualmente, fuera de React) no mueve `window.scrollY` — el mismo entorno donde `computer.screenshot` falla con "the Browser pane is not displayed, so the page is not compositing frames". Se concluye que es una limitación del compositor de este navegador automatizado, no un defecto del código: la llamada se ejecuta sin error y sigue la API estándar. La subida de foto en sí se verificó exitosa (imagen renderizada con URL de blob real inmediatamente después de subir).

## M. Compatibilidad con preguntas sin guía

`TechnicalArticleLink` (preguntas con artículo pero sin `comoRevisarlo`/`senalesDeProblema`) no se tocó — sigue exactamente igual, ya arrancaba colapsado. Preguntas sin ningún `TechnicalArticle` (la mayoría del catálogo, incluidas Fachada/Reja/Portón, que siguen sin guía por decisión de Fase 11G) degradan al checklist simple de siempre: solo pregunta + 3 botones ("OK"/"Observación"/"No aplica", copy legacy sin cambios). No se forzó `GuideBlock` en ningún caso donde no existía antes.

## N. Desktop

Verificado en el navegador (`localhost:3000`, viewport desktop) contra el catálogo real:
- Dormitorio: Piso (2 preguntas), Muros, Ventana, Puerta, Enchufes e interruptores — guía breve correcta, expandible correcto (incluye "Recomendación" ahora visible), botones claros, formulario limpio.
- Baño: Artefactos sanitarios (3 preguntas) — guía breve y expandible correctos.
- Departamento: Bodega, Estacionamiento — guía breve y expandible correctos (Lote 2, Fase 11H/11I).

## O. Mobile 375px

Verificado sin overflow horizontal (`scrollWidth === clientWidth === 375`) en:
- "Mis inspecciones" y el detalle del caso.
- Pregunta + guía breve colapsada.
- "Ver cómo revisarlo" expandido (contenido completo).
- Formulario de hallazgo abierto (incluye el select "Nivel del problema").
- Mini-formulario de "No corresponde".
- Wizard de creación.

Altura del contenido colapsado significativamente menor que el detalle expandido (325px vs 1556px, ver sección D) — confirma la reducción de scroll pedida.

## P. Funcionalidad de hallazgo

Batería completa probada en el navegador sobre datos reales:
- A. Está bien — funciona, pastilla verde.
- B. Tiene un problema — funciona, abre formulario.
- C. No corresponde — funciona, mini-formulario de motivo opcional, pastilla naranja.
- D. Crear hallazgo — funciona.
- E. Nivel del problema — label nueva confirmada, select funcional (Media por defecto).
- F. Recomendación — campo opcional probado, se guarda y se muestra.
- G. Guardar — funciona.
- H. Agregar foto — funciona (subida real confirmada con URL de blob).
- I. Sugerir redacción — funciona sin cambios (motor local intacto), sugerencia generada y aceptada correctamente.
- J. Editar hallazgo — funciona, comentario editado persiste.
- K. Eliminar hallazgo — funciona.
- L. Histórico de hallazgo — funciona: al cambiar el estado de OBSERVATION a otro, el hallazgo pasa a "1 hallazgo anterior — ya no vigente", expandible, con foto y comentario editado intactos.
- M. Cambiar respuesta después — funciona (Puerta: Tiene un problema → Está bien, sin perder el hallazgo histórico).
- N. Persistencia después de recarga — confirmada con recarga completa de página: todos los estados (No corresponde, Está bien, hallazgo con foto y recomendación) persistieron exactamente igual.

## Q. Históricos

Ver sección P.L — el flujo completo (crear → editar → cambiar estado → ver histórico → eliminar) se probó de punta a punta sin regresiones. Foto y comentario editado se preservan correctamente en el histórico.

## R. Redacción local

"Sugerir redacción" (`suggestObservationCommentAction`, motor 100% local sin IA externa, Fase 10B) no fue tocado por esta fase — verificado que sigue generando sugerencias correctamente ("Se observa: Ventana con luz visible en el marco.") y que "Aceptar"/"Descartar" funcionan igual que antes.

## S. Resumen/PDF

No se rediseñó nada en resumen ni PDF, tal como pidió la fase. Verificado:
- La página `/inspecciones/[id]/resumen` renderiza correctamente (progreso, resultado global, severidad de observaciones, pendientes por espacio) — sin regresiones tras los cambios de `checklist-item-row.tsx`.
- `/api/inspecciones/[id]/pdf/resumen` → `200 OK`.
- `/api/inspecciones/[id]/pdf/detallado` → `200 OK`.
- Las etiquetas internas (severidad LOW/MEDIUM/HIGH/CRITICAL, "Baja"/"Media"/"Alta"/"Crítica") no cambiaron en ningún lado — el resumen sigue mostrando "SEVERIDAD DE LAS OBSERVACIONES" sin ningún cambio, ya que esa página no fue tocada.

## T. TypeScript

`npx tsc --noEmit` — sin errores.

## U. ESLint

`npx eslint .` — sin errores ni warnings.

## V. Vitest

`npx vitest run` — 10 archivos, **95 tests**, todos pasan (88 previos + 7 nuevos de `deriveGuiaBreve`/`parseKnowledgeContent`).

## W. Build

`npx next build` — build de producción exitoso, todas las rutas de Inspecciones compilan (`/inspecciones`, `/inspecciones/[id]`, `/inspecciones/[id]/resumen`, `/inspecciones/nueva`, ambos endpoints de PDF).

## X. Limpieza QA

Se crearon y eliminaron 2 casos de prueba locales ("QA Fase11L Guia Visual", "QA Fase11L Bodega Estac") y 1 usuario (`qa-fase11l-local@example.com`). Confirmado por consulta directa: `InspectionCase.findMany({name: {contains: "QA Fase11L"}})` → `[]`, usuario → no existe, `InspectionPhoto.findMany({url: {contains: "qa-"}})` en toda la BD → `[]` (cero blobs QA huérfanos). El único blob QA subido durante las pruebas (`qa-obs-evidence.png`) se verificó `404` tras la limpieza. Script temporal de limpieza borrado inmediatamente después de usarse — no queda ningún `_tmp_*` en el repo. Scripts permanentes `fase11e-biblioteca-guiada-lote1.ts` y `fase11h-biblioteca-guiada-lote2.ts` no se tocaron.

## Y. Git diff final

```
 src/app/(app)/inspecciones/[id]/page.tsx           |   4 +-
 src/components/inspecciones/checklist-item-row.tsx | 146 ++++++++++++++++++---
 .../inspecciones/element-checklist-group.tsx       |   6 +
 src/lib/inspecciones-knowledge.ts                  |  41 +++++-
 4 files changed, 176 insertions(+), 21 deletions(-)
```

Más el archivo nuevo `src/lib/inspecciones-knowledge.test.ts` (untracked, sin diff --stat porque es nuevo). `git status` confirma: cero `prisma/schema.prisma`, cero migraciones nuevas (última migración sigue siendo la de Fase 11K), cero archivos de catálogo, cero `materialVariant`/`appliesToVariant`/`InspectionReferenceImage`, cero Radier, cero otras calculadoras — los archivos de Radier/`module-visual-config`/`diagram-v2` que aparecen modificados en `git status` son trabajo previo a esta fase, no tocados acá.

## Z. Pendientes deliberadamente fuera de alcance

- Motor de variantes/materiales, nuevos componentes, nuevas preguntas, nuevas fuentes, imágenes BIEN/MAL, `InspectionReferenceImage` — ninguno tocado, como exigió la fase.
- Cambio de "Crítica" a otra palabra en el selector de Nivel del problema — documentado como candidato (sección K), no decidido ni implementado.
- Corrección de la limitación de `scrollIntoView` en el entorno de pruebas automatizado (sección L) — es una limitación del navegador de pruebas, no del código; no requiere acción de esta fase.
- Cambios estructurales a PDF o resumen — explícitamente fuera de alcance, no tocados.

## AA. Estado final

Los 4 objetivos de la fase (guía breve visible por defecto, detalle completo colapsado detrás de un expandible, estados de evaluación visualmente distinguibles sin depender solo del color, etiqueta "Nivel del problema") están implementados y verificados en el navegador contra datos reales del catálogo (Piso, Muros, Ventana, Puerta, Enchufes, Artefactos sanitarios, Bodega, Estacionamiento), sin regresión detectada en checklist, hallazgos, edición, histórico, redacción local, resumen ni PDF. Cero cambios de Prisma, cero migraciones, cero catálogo nuevo, cero motor de variantes. Todo el trabajo permanece local — sin commit, sin push, sin deploy, tal como exigió la instrucción. Base de datos de QA completamente limpia.

---

FASE 11L — REDISEÑO VISUAL DE REVISIÓN GUIADA COMPLETADO LOCALMENTE
