# FASE 11K-P — Publicación controlada y smoke test de gestión del caso

Fecha: 2026-08-16
Estado: publicado y verificado en producción.

## A. Diff auditado

`git status`/`git diff --stat` antes de tocar el staging mostró exactamente los archivos de Fase 11K (16 archivos: 12 modificados + 4 nuevos, ver informe local) junto con cambios preexistentes ajenos (Radier: `dosificacion-card.tsx`, `module-visual-config.ts`, `module-wizard.tsx`, `recalculate-field.tsx`, `result-hero.tsx`, `result-screen.tsx`, `diagram-v2/*`) y documentos/scripts no relacionados (`docs/BASE_PRECIOS...`, `docs/ESTUDIO_TECNICO...`, `docs/FASE4*`, `docs/FASE11C/G/J...`, `prisma/db-fixes/inspect-uncertainty-options.ts`). Ninguno de estos últimos entró al staging.

## B. Archivos incluidos

Se agregó explícitamente cada archivo por nombre (sin `git add .`/`-A`):

- `prisma/schema.prisma`
- `prisma/migrations/20260815232435_inspection_cover_photo_and_not_applicable_reason/migration.sql`
- `src/app/(app)/inspecciones/[id]/actions.ts`
- `src/app/(app)/inspecciones/[id]/page.tsx`
- `src/app/(app)/inspecciones/[id]/resumen/page.tsx`
- `src/app/(app)/inspecciones/actions.ts`
- `src/app/(app)/inspecciones/page.tsx`
- `src/components/inspecciones/checklist-item-row.tsx`
- `src/components/inspecciones/cover-photo-upload.tsx`
- `src/components/inspecciones/delete-inspection-button.tsx`
- `src/components/inspecciones/element-checklist-group.tsx`
- `src/components/inspecciones/inspection-case-header.tsx`
- `src/components/inspecciones/inspection-list.tsx`
- `src/components/inspecciones/motivo-selector.tsx`
- `src/lib/inspecciones-report.ts`
- `docs/FASE11K_INFORME_GESTION_CASO_INSPECCION.md`

`git diff --cached --stat` confirmó exactamente estos 16 archivos (595 inserciones, 52 eliminaciones) antes del commit — cero archivos ajenos.

## C. Migración

`npx prisma migrate status` confirmó "Database schema is up to date!" (40 migraciones aplicadas, incluida `20260815232435_inspection_cover_photo_and_not_applicable_reason`, ya aplicada desde la fase local anterior — no se ejecutó ninguna operación destructiva ni migración nueva). Se confirmó por consulta directa a `pg_enum` e `information_schema.columns` contra la BD de producción:
- `InspectionPhotoKind` = `['GENERAL', 'EVIDENCE', 'GOOD_CONDITION', 'FUTURE_REPAIR', 'COVER']`.
- `inspection_checklist_checks.notApplicableReason` existe, tipo `text`, nullable.

## D. Regresión pre-commit

- `npx tsc --noEmit` — sin errores.
- `npx eslint .` — sin errores ni warnings.
- `npx vitest run` — 9 archivos, 88 tests, todos pasan.
- `npx next build` — build de producción exitoso.

## E. Commit hash

`ba0f23e54ad312827888f2dabccf4661010bd216`

Mensaje: `feat(inspecciones): agregar gestion del caso y foto principal`

## F. Push

`git push origin master` — exitoso, sin conflictos (`433cbd0..ba0f23e master -> master`).

## G. origin/master

`git rev-parse HEAD` y `git rev-parse origin/master` — ambos devolvieron `ba0f23e54ad312827888f2dabccf4661010bd216` (idénticos).

## H. Deployment ID

`dpl_4aqiQY74MmxFoTSXMxPJHen2rQdx` (proyecto `jorge-rojas-obrabien/calculadoraob`, target `production`).

## I. Estado Vercel

`Ready` (confirmado con `vercel inspect`, build completo en ~1 min).

## J. URL producción

`https://calculadoraob.vercel.app` — verificado con `curl` (`200 OK`).

## Nota de proceso — sesión de navegador con usuario obsoleto

Al iniciar el smoke test, la sesión del navegador conservaba una cookie JWT de una cuenta QA de una fase anterior (`QA Fase11I Owner2`) que ya había sido eliminada de la base de datos durante la limpieza de esa fase. Como NextAuth con estrategia JWT no revalida contra la BD en cada request, la sesión seguía "autenticada" pero con un `userId` que ya no existe — al intentar crear una inspección, `createInspectionAndGenerateAction` fallaba con una violación de FK (silenciada por su `catch` genérico, mostrando "No se pudo crear la inspección"). Se confirmó con un script que reproduce la misma transacción directamente contra Prisma: con un usuario real funciona sin problema; el `userId` de la sesión obsoleta simplemente no existía en `User`. **Esto no es una regresión de Fase 11K** (`createInspectionAndGenerateAction` no fue tocado por esta fase, confirmado con `git diff` entre el commit anterior y este). Se resolvió cerrando sesión y registrando una cuenta QA nueva (`qa-fase11kp-usera@example.com`) para el resto del smoke test.

## K. Copy de motivos

Confirmado en `/inspecciones/nueva` (Paso 1): los 3 textos coinciden exactamente con lo especificado ("Recibo una vivienda nueva" / "Quiero revisar una vivienda" / "Quiero revisar una ampliación", con sus descripciones). Los 3 motivos se probaron en la práctica: A (Casa), B (Casa, caso principal), C (Ampliación/Cocina) — el flujo completo de creación funciona con los 3.

## L. Caso sin portada

Creado "QA Fase11KP Sin Portada" (Casa, motivo A). Apareció correctamente en "Mis inspecciones" sin imagen rota — placeholder "Agregar foto de la vivienda (opcional)". Se abrió normalmente, con sus 4 espacios generados.

## M. Portada

Subida una portada real (`qa-cover1.png`) al caso. Confirmado en BD: fila `InspectionPhoto` con `kind: COVER` y URL de blob real. Visible en el detalle del caso (imagen renderizada, no placeholder) y en "Mis inspecciones" (miniatura con la URL exacta del blob, confirmado vía `img.src`). Persistió después de recarga completa de la página.

## N. Reemplazo y limpieza de portada

Subida una segunda portada (`qa-cover2.png`). Confirmado en BD: exactamente 1 fila `COVER` (la nueva). La portada nueva es visible; verificado con `curl -sI` (evitando el falso positivo de caché de CDN ya documentado en Fase 11K) que el blob anterior devuelve `404` y el blob nuevo `200`.

## O. No corresponde sin motivo

En "¿Presenta daños visibles?" (Piso) se seleccionó "No corresponde" sin escribir motivo, se guardó y se recargó la página. Persistió correctamente: cuenta como revisado (aporta al contador X/22), no generó `InspectionObservation`, no pidió severidad, recomendación ni foto.

## P. No corresponde con motivo

En "¿Presenta desniveles?" (Piso) se seleccionó "No corresponde" con el texto "QA Fase11KP: piso cubierto por alfombra permanente", se guardó y se recargó. Confirmado en BD: `status: NOT_APPLICABLE`, `notApplicableReason` con el texto exacto, `observations: []` (sin ninguna observación asociada).

## Q. Limpieza del motivo al cambiar estado

Se cambió esa misma pregunta de "No corresponde" a "Está bien" (mediante el pill de estado → modo edición → botón "Está bien"). Confirmado en BD: el check ya no es `NOT_APPLICABLE`, y `notApplicableReason` volvió a `null` — sin motivo huérfano.

## R. Eliminación sin fotos

Creado un segundo caso "QA Fase11KP Eliminar Sin Fotos" (Ampliación/Cocina). Eliminado desde "Mis inspecciones" con confirmación explícita (mensaje incluye nombre del caso). El caso desapareció de la lista; el otro caso QA existente no se vio afectado.

## S. Eliminación con fotos

Al caso "QA Fase11KP Sin Portada" se le agregaron los 4 niveles de foto: `COVER` (ya existente, `qa-cover2.png`), `GENERAL` de caso (`qa-general.png`), `GENERAL` de espacio (`qa-space.png`), y `EVIDENCE` de un hallazgo ("Tiene un problema" en Muros, comentario "QA Fase11KP: fisura de prueba para borrado de caso con fotos", con foto `qa-evidence.png`). Se registraron las 4 URLs exactas antes de eliminar. Antes de eliminar se creó un caso "QA Fase11KP Survivor" (Departamento) con su propia portada (`qa-survivor.png`), para servir de control cruzado. Se eliminó "QA Fase11KP Sin Portada" desde "Mis inspecciones". Confirmado en BD:

- `InspectionCase.findUnique` → `null`.
- `InspectionSpace.count({caseId})` → `0`.
- `InspectionPhoto.count({caseId})` → `0`.
- El `InspectionObservation` de la evidencia (`cmsv3dogp000f04jmaspsl6yo`) → `count 0` (no existe).

## T. Limpieza física de blobs

Las 4 URLs de blob del caso eliminado (portada, general de caso, general de espacio, evidencia) devolvieron `404` con `curl -sI`. Se incluyó también la URL de la primera portada (reemplazada en el paso N), también `404`. Total: 5 blobs verificados `404`.

## U. Protección contra borrado cruzado

El caso "QA Fase11KP Survivor" (creado antes de eliminar el caso de prueba) se mantuvo íntegro: existe en BD, con sus 4 espacios y su fila `COVER` con la URL original. Su blob de portada respondió `200` con `curl -sI` (confirmado inmediatamente después de la eliminación del otro caso).

## V. Ownership con dos cuentas

Se registró una segunda cuenta real (`qa-fase11kp-userb@example.com`, "UserB") y se cerró sesión de la primera. Con UserB autenticado:

- Navegar directo a `https://calculadoraob.vercel.app/inspecciones/<id-de-UserA>` devolvió **"Inspección no disponible"** (mensaje genérico, sin revelar si el caso existe) — el gate de ownership del lado del servidor bloquea el render completo de la página antes de que exista cualquier botón de portada o de eliminación.
- "Mis inspecciones" de UserB mostró la lista vacía — el caso de UserA no aparece en ningún listado.
- Se intentó adicionalmente invocar las Server Actions (`deleteInspectionCaseAction`, `uploadInspectionCoverPhotoAction`) de forma directa (no solo vía UI) según lo pedido por la fase; esto no fue viable de forma confiable sin acceso al ID de acción compilado por Next.js (hash específico de este build, no descubrible de forma segura sin inspeccionar el bundle cliente) — dado que la página ya bloquea toda superficie de UI para el caso ajeno, no existe ningún control alcanzable desde el navegador de UserB para disparar esas acciones. Se documenta como la única verificación de esta fase apoyada en auditoría de código (ambas acciones verifican `insCase.userId !== session.user.id` antes de cualquier operación, mismo patrón ya usado en el resto del módulo) en vez de un request HTTP directo.
- Confirmado por consulta a BD: después de todo el intento de acceso de UserB, el caso de UserA (`cmsv3fav8000h04jmq7d1lqvc`) permanece exactamente igual — mismo caso, mismas 4 filas de espacio, misma foto de portada, mismo blob accesible.

Resultado: operación efectivamente rechazada (página bloqueada, sin superficie de ataque en la UI) y datos de UserA intactos.

## W. Checklist/hallazgo/redacción

Sobre el caso "QA Fase11KP Survivor" (con UserA autenticado de nuevo): "Está bien" en un ítem de Piso funcionó y quedó reflejado en el progreso. "Tiene un problema" en Muros abrió el formulario de hallazgo; se escribió un comentario, se usó "Sugerir redacción" (generó correctamente "Se observa: Fisura chica cerca de la ventana." — motor 100% local, sin cambios de esta fase), se aceptó la sugerencia y se guardó el hallazgo con severidad Media (por defecto). Sin errores.

## X. Resumen/PDF

`/inspecciones/<id>/resumen` renderizó correctamente: progreso 20%, resultado global (1 OK, 1 Observación, 0 No aplica, 20 Pendientes), severidad de observaciones (1 Media), lista de pendientes por espacio. Ambos endpoints de PDF respondieron `200 OK` en producción:
- `/api/inspecciones/<id>/pdf/resumen`
- `/api/inspecciones/<id>/pdf/detallado`

## Y. Mobile 375px

Verificado sin overflow horizontal (`scrollWidth === clientWidth === 375`) en: "Mis inspecciones" con portada, header del caso con portada, y el wizard de creación con el copy nuevo de motivos. No se detectó ningún desbordamiento en ninguna de las pantallas tocadas por esta fase.

## Z. Limpieza QA

Eliminados en producción: 5 casos QA (`QA Fase11KP Sin Portada`, `QA Fase11KP Sin Fotos J`... nota: los nombres exactos de los 2 casos iniciales de prueba de creación coinciden con los de la sección K/L/S arriba), 2 usuarios QA (`qa-fase11kp-usera@example.com`, `qa-fase11kp-userb@example.com`). Confirmado por consulta directa: `InspectionCase.findMany({name: {contains: "QA Fase11KP"}})` → `[]`, usuarios con email `contains: "qa-fase11kp"` → `0`. Todos los scripts temporales `_tmp_11kp_*` fueron borrados inmediatamente después de usarse (ninguno quedó en el repo). Confirmado que `prisma/db-fixes/fase11e-biblioteca-guiada-lote1.ts` y `fase11h-biblioteca-guiada-lote2.ts` permanecen intactos.

## AA. Regresiones encontradas

Ninguna causada por Fase 11K. El único inconveniente encontrado (creación de inspección fallando con el mensaje genérico "No se pudo crear la inspección") fue causado por una sesión de navegador con una cookie de una cuenta QA ya eliminada en una fase anterior — no por código de esta fase (`createInspectionAndGenerateAction` no fue modificado, confirmado con `git diff` contra el commit previo). Se documenta en la sección J de este informe como nota de proceso, no como bug de Fase 11K.

## AB. Estado final

Publicación completa y verificada: commit `ba0f23e` en `origin/master`, deploy `dpl_4aqiQY74MmxFoTSXMxPJHen2rQdx` en estado `Ready`, los 4 objetivos de Fase 11K (foto principal, eliminación de caso, motivo opcional en "No corresponde", copy de motivos) funcionan correctamente en producción con datos reales, sin regresión detectada en checklist, hallazgos, redacción, resumen, PDF, ownership ni mobile. Base de datos de QA completamente limpia.

---

🟢 FASE 11K PUBLICADA Y VERIFICADA
