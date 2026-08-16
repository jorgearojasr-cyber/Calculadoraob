# FASE 11N — Publicación controlada de Fase 11L

Fecha: 2026-08-16
Estado: publicada y verificada en producción.

## A. Diff auditado

`git status`/`git diff --stat` antes del staging mostraron exactamente los 6 archivos esperados de Fase 11L, junto con cambios preexistentes ajenos (Radier: `dosificacion-card.tsx`, `module-visual-config.ts`, `module-wizard.tsx`, `recalculate-field.tsx`, `result-hero.tsx`, `result-screen.tsx`, `diagram-v2/*`) y documentos/scripts no relacionados (`docs/BASE_PRECIOS...`, `docs/ESTUDIO_TECNICO...`, `docs/FASE4*`, `docs/FASE11C/G/J/M...`, `prisma/db-fixes/inspect-uncertainty-options.ts`). Ninguno de estos últimos entró al staging.

## B. Archivos incluidos

Agregados explícitamente por nombre (sin `git add .`/`-A`):

- `src/lib/inspecciones-knowledge.ts`
- `src/lib/inspecciones-knowledge.test.ts`
- `src/components/inspecciones/checklist-item-row.tsx`
- `src/components/inspecciones/element-checklist-group.tsx`
- `src/app/(app)/inspecciones/[id]/page.tsx`
- `docs/FASE11L_INFORME_REDISENO_VISUAL_GUIA.md`

`git diff --cached --stat` confirmó exactamente estos 6 archivos (422 inserciones, 21 eliminaciones) antes del commit — cero Radier, cero `module/*`, cero `diagram-v2/*`, cero Prisma, cero migraciones, cero catálogo, cero scripts de otras fases.

## C. TypeScript

`npx tsc --noEmit` — sin errores.

## D. ESLint

`npx eslint .` — sin errores ni warnings.

## E. Vitest

`npx vitest run` — 10 archivos, **95/95 tests**, todos pasan.

## F. Build

`npx next build` — build de producción exitoso, todas las rutas de Inspecciones compilan.

## G. Commit hash

`ba3210a3fda222c058b0dbb8d6ed7e513ce01141`

Mensaje: `feat(inspecciones): mejorar experiencia visual de revision guiada`

## H. Push

`git push origin master` — exitoso, sin conflictos (`ac177c3..ba3210a master -> master`).

## I. origin/master

`git rev-parse HEAD` y `git rev-parse origin/master` — ambos `ba3210a3fda222c058b0dbb8d6ed7e513ce01141` (idénticos).

## J. Deployment ID

`dpl_Ds9CSEovKZxfFP5mjH4ES1jPGuYx` (proyecto `jorge-rojas-obrabien/calculadoraob`, target `production`).

## K. Estado Ready

`Ready` (confirmado con `vercel inspect`, build completo).

## L. URL producción

`https://calculadoraob.vercel.app` — verificado con `curl` (`200 OK`) antes de iniciar el smoke test.

## M. Guía breve

Verificado en producción (Dormitorio → Piso, caso QA real): pregunta visible, línea "Revisa: …" visible, contenido técnico largo (Qué revisar/Cómo revisarlo/etc.) **no** visible por defecto, botón "Ver cómo revisarlo" visible, los 3 botones de estado visibles inmediatamente — sin necesidad de expandir nada para poder responder. Medido: bloque colapsado **399px**, mismo bloque expandido **2110px** (5.3× más alto) — confirma que el colapsado es claramente más corto.

## N. Expandir/colapsar

"Ver cómo revisarlo" → contenido completo se muestra (Qué revisar, Cómo revisarlo, Qué debería verse, señales, Recomendación — todas presentes). `aria-expanded` pasó correctamente de `"false"` a `"true"`, y el texto del botón de `"Ver cómo revisarlo"` a `"Ocultar detalle"`. Se volvió a colapsar sin problema. Ningún estado de evaluación cambió al expandir/colapsar (verificado explícitamente, sin efectos secundarios).

## O. Estados visuales

Verificados en producción vía `getComputedStyle` sobre los botones reales:
- 🟢 Está bien: `rgb(24, 92, 61)` sobre `rgb(185, 212, 199)` (verde).
- 🔴 Tiene un problema: tono rojo (`bg-danger-tint text-danger`, sin cambios de Fase 11L).
- 🟠 No corresponde: `rgb(181, 72, 10)` sobre `rgb(252, 234, 217)` (naranjo quemado) — **claramente distinto** del verde y del rojo, y del estado sin responder (antes ambos eran idénticos — bug corregido en Fase 11L). Cada estado combina icono + texto + fondo + borde, no depende solo del color.

## P. No corresponde

Probado sin motivo (Piso → desniveles): guardó correctamente, cuenta como revisado, sin observación creada. Persistió tras recarga completa de página ("No corresponde" visible después de navegar de vuelta a la URL).

## Q. Nivel del problema

Confirmado en el formulario de hallazgo (Muros → "Tiene un problema"): la etiqueta visible es **"Nivel del problema"**, no "Severidad". Opciones confirmadas intactas: Baja, Media, Alta, Crítica — sin cambios de estas etiquetas, tal como exigió la fase.

## R. Hallazgo

Creado un hallazgo real en producción (Muros): comentario "QA Fase11N: fisura de prueba en muros", nivel Media (por defecto), guardado exitoso. Persistió tras recarga completa: comentario, nivel y estado "Tiene un problema" idénticos después de recargar.

## S. Foto post-hallazgo

Tras "Guardar hallazgo" apareció el mensaje **"Agrega una foto del problema, si puedes."**, la sección de fotos visible inmediatamente debajo. Se subió una foto real (`qa-fase11n-evidence.png`) — confirmado con URL de blob real (`https://387r6zvxbs2engtm.public.blob.vercel-storage.com/...`). La foto persistió tras recarga completa de página. **Scroll suave**: se verificó `window.scrollY` antes/después del guardado y permaneció en `0` — reproducido también en el navegador automatizado de Fase 11L (localhost) con el mismo resultado, incluso al invocar `scrollIntoView` manualmente fuera de React. Se documenta como limitación del navegador automatizado de este entorno (el mismo entorno donde `computer.screenshot` falla con "the Browser pane is not displayed, so the page is not compositing frames") — no se reprodujo en un navegador normal por no tener acceso a uno fuera de esta herramienta; la llamada en el código sigue la API estándar (`scrollIntoView({behavior: "smooth", block: "nearest"})`) sin ningún error de ejecución.

## T. Histórico

Se cambió el estado de Muros de "Tiene un problema" a "Está bien". El hallazgo pasó correctamente a **"1 hallazgo anterior — ya no vigente"**, expandible. Al expandir: comentario y foto se conservaron intactos. La guía breve de la misma pregunta (colapsada, sin interferencia) siguió funcionando con normalidad en paralelo.

## U. Redacción local

"Sugerir redacción" (Puerta): generó correctamente "Se observa: Puerta roza el marco al cerrar." — motor 100% local, sin llamada a ningún servicio externo (confirmado por el comportamiento ya documentado en fases previas, sin cambios de Fase 11L). "Aceptar" funcionó (reemplazó el comentario). "Descartar"/"Cancelar" funcionaron sin persistir nada.

## V. Preguntas sin guía

Verificado en un segundo caso QA con Antejardín/Acceso vehicular (Fachada, Reja): siguen usando el checklist simple legacy ("OK"/"Observación"/"No aplica"), sin ningún `GuideBlock` artificial, sin guía breve, sin errores de consola (`read_console_messages` con `onlyErrors: true` → 0 resultados).

## W. Mobile

375px verificado sin overflow horizontal (`scrollWidth === clientWidth === 375`) en: pregunta colapsada, detalle expandido, botones de estado, formulario de hallazgo con "Nivel del problema", mini-formulario de "No corresponde", y bloque histórico expandido.

## X. Resumen/PDF

`/inspecciones/[id]/resumen` renderizó correctamente (progreso, resultado global, espacios). Ambos endpoints devolvieron `200`:
- `/api/inspecciones/[id]/pdf/resumen`
- `/api/inspecciones/[id]/pdf/detallado`

Confirmado en el código fuente (`route.ts`, sin modificar por Fase 11L) que ambos declaran `Content-Type: application/pdf`.

## Y. Ownership

No se crearon Server Actions nuevas en Fase 11L — se realizó un smoke test acotado, no la batería completa de Fase 11K-P: se registró una segunda cuenta real (UserB) y se intentó acceder directamente a la URL del caso de la primera cuenta (UserA). Resultado: **"Inspección no disponible"** — acceso bloqueado correctamente, sin exponer si el caso existe.

## Z. Limpieza QA

Eliminados en producción: 2 casos QA ("QA Fase11N Smoke Test", "QA Fase11N Fachada") vía UI, y 2 usuarios (`qa-fase11n-usera@example.com`, `qa-fase11n-userb@example.com`) vía script. Confirmado por consulta directa: `InspectionCase.findMany({name: {contains: "QA Fase11N"}})` → `[]`, ambos usuarios → no existen, `InspectionPhoto.findMany({url: {contains: "qa-fase11n"}})` → `[]` (cero blobs QA huérfanos). Script temporal borrado inmediatamente después de usarse.

## AA. Regresiones

Ninguna encontrada. Todos los flujos probados (guía breve, expandir/colapsar, 3 estados, No corresponde, Nivel del problema, hallazgo + foto, histórico, redacción local, preguntas sin guía, mobile, resumen/PDF, ownership) funcionan en producción exactamente como se implementaron y probaron localmente en Fase 11L. Única observación documentada (no es una regresión de código): el scroll suave post-hallazgo no se mueve en este navegador automatizado específico — comportamiento ya identificado como limitación de entorno en Fase 11L, reconfirmado acá en producción con el mismo resultado.

## AB. Estado final

Publicación completa y verificada: commit `ba3210a` en `origin/master`, deploy `dpl_Ds9CSEovKZxfFP5mjH4ES1jPGuYx` en estado `Ready`. Los 5 objetivos de Fase 11L (guía breve, detalle colapsado, colores de estados, "Nivel del problema", foto post-hallazgo) funcionan correctamente en producción con datos reales, sin regresión detectada. Base de datos de QA completamente limpia.

---

🟢 FASE 11L PUBLICADA Y VERIFICADA
