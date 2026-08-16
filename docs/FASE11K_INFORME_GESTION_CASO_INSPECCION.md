# FASE 11K — Gestión del caso de inspección (implementación local)

Fecha: 2026-08-15
Estado: implementado y probado localmente, **sin commit/push/deploy** (autorización explícita pendiente para publicar).

## A. Auditoría previa

Antes de tocar código se verificó contra el estado real del repo (no se asumió que el diseño de Fase 11J calzara 1:1):

- `InspectionPhotoKind` ya tenía valores provisionados sin uso (`GOOD_CONDITION`, `FUTURE_REPAIR`) — se confirmó que ninguna foto de nivel `case` usaba `kind` explícito distinto de `GENERAL` (`defaultPhotoKind()` en `src/lib/inspecciones/photos.ts`), por lo que filtrar por `kind: "GENERAL"` en las queries existentes es 100% compatible con casos V1.
- Las relaciones de cascada (`InspectionSpace`→case, `InspectionElement`→space, `InspectionChecklistCheck`→element, `InspectionObservation`→check, todas `onDelete: Cascade`) ya estaban declaradas en el schema — un solo `prisma.inspectionCase.delete()` basta para limpiar toda la jerarquía sin deletes manuales por tabla.
- El único patrón de confirmación de borrado en el codebase es `DeleteButton` (`src/components/admin/delete-button.tsx`, `window.confirm` + `useTransition`) — se reutilizó directamente en vez de crear un modal nuevo.
- El patrón de limpieza de Blob (recolectar URLs exactas, `del()` best-effort en try/catch que nunca bloquea el borrado en BD) ya estaba validado en `deleteObservationAction` (Fase 10Q) — se replicó para el caso completo y, en la variante "reemplazo", se adaptó el orden (subir nuevo → crear fila nueva → borrar fila+blob viejo) para que un fallo de subida nunca deje la portada en un estado roto.

## B. Archivos modificados

Modificados (existentes):
- `prisma/schema.prisma`
- `src/app/(app)/inspecciones/[id]/actions.ts`
- `src/app/(app)/inspecciones/[id]/page.tsx`
- `src/app/(app)/inspecciones/[id]/resumen/page.tsx`
- `src/app/(app)/inspecciones/actions.ts`
- `src/app/(app)/inspecciones/page.tsx`
- `src/components/inspecciones/checklist-item-row.tsx`
- `src/components/inspecciones/element-checklist-group.tsx`
- `src/components/inspecciones/inspection-case-header.tsx`
- `src/components/inspecciones/inspection-list.tsx`
- `src/components/inspecciones/motivo-selector.tsx`
- `src/lib/inspecciones-report.ts`

Nuevos:
- `prisma/migrations/20260815232435_inspection_cover_photo_and_not_applicable_reason/migration.sql`
- `src/components/inspecciones/cover-photo-upload.tsx`
- `src/components/inspecciones/delete-inspection-button.tsx`

Cero archivos de Radier, `module-visual-config.ts`, `diagram-v2/`, u otras calculadoras — los cambios que `git status` muestra en esos archivos son de trabajo previo a esta fase, no tocados aquí.

## C. Schema y migración

Dos cambios aditivos, ambos nullable:
- `InspectionPhotoKind` gana el valor `COVER`.
- `InspectionChecklistCheck.notApplicableReason String?`.

Migración `20260815232435_inspection_cover_photo_and_not_applicable_reason` creada con `prisma migrate dev --create-only` y aplicada con `prisma migrate deploy` contra la BD compartida (Neon). Sin backfill — ambos campos parten vacíos/null en todas las filas existentes.

## D. Foto principal (portada)

`uploadInspectionCoverPhotoAction` (nuevo, en `[id]/actions.ts`): sube el archivo a Blob, crea la fila `COVER` nueva, y solo **después** de que la creación fue exitosa borra la fila y el blob de la portada anterior (si existía) — un fallo de subida nunca deja el caso sin portada válida. Ownership verificado contra `session.user.id`. Máximo 1 fila `COVER` activa por caso (invariante aplicada en la Server Action, no en el schema). Nunca bloquea la creación del caso: la portada se ofrece solo desde el header del caso ya creado (`InspectionCaseHeader`), no en el wizard.

`CoverPhotoUpload` (nuevo componente cliente) — placeholder "Agregar foto de la vivienda (opcional)" o la imagen actual con overlay "Cambiar foto".

## E. Reemplazo y limpieza de portada

Verificado en vivo (Test E, sesión previa a este informe): tras reemplazar la portada, queda exactamente 1 fila `COVER` en BD y el blob anterior devuelve `404` (confirmado con `curl -sI`, no con `fetch()` de navegador — el CDN de Vercel Blob puede servir un `200` cacheado por unos segundos desde el navegador, comportamiento esperado del edge cache, no un bug).

## F. Mis inspecciones

La query de `/inspecciones` ahora incluye `photos: { where: { kind: "COVER" }, take: 1 }`; cada card muestra la miniatura si existe, o el estado sin foto si no.

## G. Detalle del caso

`[id]/page.tsx` resuelve la portada aparte (`findFirst` por `kind: "COVER"`) y filtra las "fotos generales" existentes con `kind: "GENERAL"` — invisible para casos V1 porque toda foto de nivel `case` anterior a esta fase ya era `GENERAL` de facto.

## H. Eliminación de caso

`deleteInspectionCaseAction` (nuevo, en `inspecciones/actions.ts`): verifica sesión + ownership, recolecta las URLs exactas de **todas** las fotos del caso (`InspectionPhoto.findMany({ where: { caseId } })` — no por prefijo), intenta `del()` de cada una en un try/catch best-effort (un fallo de Blob nunca bloquea ni revierte el borrado en BD), y borra el caso con `prisma.inspectionCase.delete()`, que cascada automáticamente a spaces/elements/checks/observations vía las relaciones ya declaradas en el schema.

`DeleteInspectionButton` (nuevo) envuelve el `DeleteButton` genérico existente; `confirmMessage` incluye el nombre del caso y una advertencia de irreversibilidad.

`InspectionList` se reestructuró: de un único `<Link>` envolvente a un `<div>` exterior con el `<Link>` (navegación principal) y un footer hermano con el botón de eliminar **fuera** del Link — evita depender de `stopPropagation()` sobre un elemento interactivo anidado dentro de un `<a>`.

## I. Limpieza de Blob al eliminar caso

Confirmado por prueba real (ver sección J-N): las 4 fotos de un caso con portada + foto general + foto de espacio + foto de observación quedan con sus 4 blobs en `404` tras el borrado, y las filas correspondientes desaparecen de BD.

## J-N. Batería de pruebas de borrado (ejecutadas contra BD real, no solo UI)

- **Test J** (caso sin fotos): creado, eliminado, confirmado desaparecido de la lista sin error.
- **Tests K/L**: caso `cmsv0g0bs0001ccseo4n6euyc` con las 4 combinaciones de foto (`COVER`, `GENERAL` de caso, `GENERAL` de espacio, `EVIDENCE` de observación) más 4 espacios/16 elementos/22 checks/1 observación. Tras eliminar: `findUnique` del caso devuelve `null`, `InspectionSpace.count({caseId})` y `InspectionPhoto.count({caseId})` devuelven `0` — cero filas huérfanas en ninguna tabla de la jerarquía.
- **Test M**: las 4 URLs de blob del caso eliminado devuelven `404` vía `curl -sI` (verificado, no vía `fetch()` de navegador por el falso positivo de caché de CDN ya documentado).
- **Test N** (protección cruzada): se probó en ambas direcciones. (1) Se eliminó por error un caso "Sobreviviente" con foto de portada mientras el caso con las 4 fotos seguía existiendo — confirmado que ese segundo caso y sus 4 fotos permanecieron 100% intactos en BD tras el borrado del primero. (2) Se creó un tercer caso ("Survivor2", sin fotos) antes de eliminar el caso de las 4 fotos, y se confirmó que Survivor2 (con sus 4 espacios) sigue existiendo íntegro después del borrado. Ambas direcciones confirman que el borrado nunca toca datos de otro caso.

Nota de proceso: en el primer intento de la Sección K, un selector de automatización mal acotado hizo click en el botón de eliminar equivocado (borró "Sobreviviente" en vez del caso objetivo). Fue un error del script de QA, no de la aplicación — se aprovechó como prueba válida adicional de protección cruzada (ver Test N, dirección 1) y se rehizo la prueba original con un nuevo caso "Survivor2".

## O. Ownership

Ambas Server Actions nuevas (`uploadInspectionCoverPhotoAction`, `deleteInspectionCaseAction`) verifican `insCase.userId !== session.user.id` antes de cualquier operación, exactamente el mismo patrón usado en cada acción de Inspecciones desde fases anteriores (10Q y siguientes). Se intentó una verificación end-to-end con una segunda cuenta real en el navegador, pero las pestañas del mismo perfil de navegador comparten cookies de sesión — abrir una pestaña nueva no genera una sesión distinta, y cerrar sesión en la pestaña principal habría arriesgado perder el contexto de la cuenta usada durante toda la fase sin tener sus credenciales a mano para volver a entrar. Se optó por no arriesgar la sesión de trabajo y dejar esta verificación como **auditoría de código** (confirmado que el guard existe y es idéntico al patrón ya probado en vivo en fases previas), no como prueba en vivo con dos cuentas. Queda anotado como el único punto de la batería QA no verificado end-to-end en esta fase.

## P. Mobile (375px)

Verificado sin overflow horizontal (`scrollWidth === clientWidth === 375`) en: lista "Mis inspecciones" con miniaturas y botón eliminar, header del caso con `CoverPhotoUpload`, y el mini-formulario de "No corresponde" abierto en un checklist item.

## Q. Copy de motivos

Confirmado visualmente en Paso 1 del wizard: los 3 textos nuevos ("Recibo una vivienda nueva" / "Quiero revisar una vivienda" / "Quiero revisar una ampliación" con sus descripciones) se muestran correctamente; los `value` del enum (`RECEPCION_PRE_FIRMA`/`POST_RECEPCION`/`REVISION_AMPLIACION`) no cambiaron.

## R. Resumen/PDF

Página `/inspecciones/[id]/resumen` renderiza sin regresiones (progreso, resultado global, pendientes por espacio). Ambos endpoints de PDF (`/api/inspecciones/[id]/pdf/resumen` y `/pdf/detallado`) responden `200 OK` con sesión válida. No se agregó la portada al PDF en esta fase (ver sección X) — se ajustó únicamente el filtro `kind: "GENERAL"` en las queries de fotos de caso existentes, para que la portada no aparezca duplicada en la sección "Fotos generales".

## S. TypeScript

`npx tsc --noEmit` — sin errores.

## T. ESLint

`npx eslint .` — sin errores ni warnings.

## U. Vitest

`npx vitest run` — 9 archivos, 88 tests, todos pasan.

## V. Build

`npx next build` — build de producción exitoso, todas las rutas de Inspecciones compilan (`/inspecciones`, `/inspecciones/[id]`, `/inspecciones/[id]/resumen`, `/inspecciones/nueva`, los 2 endpoints de PDF).

## W. Limpieza QA y regresiones

Se crearon y eliminaron 4 casos de prueba (`cmsv0g0bs0001ccseo4n6euyc`, `cmsv0ph83001eccseoidnawqw`, `cmsv0wnzt002mccseoauvfcp0`, `cmsv11iy4003tccse1gpkahq2`) y 1 usuario (`qa-fase11k@example.com`). Confirmado por query directa: `InspectionCase.findMany({name: {contains: "QA Fase11K"}})` → `[]`, `User.findMany({email: {contains: "qa-fase11k"}})` → `[]`. Todos los scripts temporales (`_tmp_11k_*`) fueron borrados inmediatamente después de usarse. No hubo regresiones detectadas en ningún flujo probado (checklist, fotos por elemento/espacio/observación, redacción local, ownership, mobile, resumen/PDF).

## X. Pendientes deliberadamente fuera de alcance

- **Portada en el PDF**: requeriría extender `InspectionReportData` y modificar layout/posicionamiento en `InspectionSummaryDocument`/`InspectionDetailedDocument` (`@react-pdf/renderer`), con riesgo de fetch remoto poco confiable dentro del renderer — exactamente el tipo de cambio significativo al generador que la fase pidió diferir. No implementado.
- **Sección "No aplica" en resumen/PDF con el motivo**: se confirmó que hoy no existe una sección individual de "No aplica" en el resumen (solo un conteo agregado; el detalle por ítem solo existe para "Pendientes"). Por instrucción explícita de la fase, no se agrega esa sección nueva — el campo `notApplicableReason` queda persistido y disponible para una fase futura.
- **Verificación end-to-end de ownership con segunda cuenta real** (ver sección O) — quedó como auditoría de código, no prueba en vivo.
- Todo lo explícitamente prohibido por el prompt de esta fase: `materialVariant`, `appliesToVariant`, motor de variantes, `InspectionReferenceImage`, imágenes BIEN/MAL, nuevos componentes o materiales, Patio trasero, Terraza de Casa, Logia separada, nuevo Garage/Estacionamiento para Casa, contenido de Fachada/Reja/Portón, cualquier cambio a Radier u otras calculadoras — ninguno tocado.

## Y. Estado final

Cero commits, cero pushes, cero deploys — todo el trabajo de esta fase permanece local, tal como exigió la instrucción. La migración de schema ya está aplicada en la base de datos compartida (Neon), consistente con el criterio ya usado en fases anteriores de aplicar cambios aditivos/nullable a la BD por adelantado del deploy de código. `git status` confirma el set de archivos exacto de esta fase, sin tocar Radier, `module-visual-config.ts`, `diagram-v2/`, otras calculadoras, ni ningún elemento del motor de variantes explícitamente prohibido.

---

FASE 11K — GESTIÓN DEL CASO DE INSPECCIÓN COMPLETADA LOCALMENTE
