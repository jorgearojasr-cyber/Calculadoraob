# FASE 20A — INVESTIGACIÓN FORENSE DEL INCIDENTE NEON

## Principio forense aplicado

Este documento separa siempre: **HECHO CONFIRMADO** (evidencia directa, verificable) de **HIPÓTESIS** (razonamiento plausible sin prueba directa) y de **DESCARTADO**/**NO DETERMINABLE**. Ninguna afirmación de causa se basa solo en correlación temporal.

## 1. Preservación de evidencia

Confirmado ANTES de tocar nada (`neonctl branches list -o json`):

| Branch | Estado | created_at | Notas |
|---|---|---|---|
| `main` (`br-super-breeze-ac04bgr6`) | ready | 2026-07-19 | **`last_reset_at: 2026-08-20T18:33:03Z`** — el restore que hicimos en 15A, no otro |
| `pre-restore-2026-08-20-empty` (`br-shiny-brook-acuvll23`) | archived | 2026-07-19 (heredado) | Estado vacío preservado. `written_data_bytes: 0` desde su creación. |
| `pre-15b-healthy-20260820` (`br-hidden-night-aciqyz9o`) | ready | 2026-08-20 19:41 | Backup sano post-restore. |

Ninguno de los 3 fue restaurado, reseteado, renombrado ni eliminado durante 20A. Para poder leer el branch forense vacío (archivado, sin cómputo) se le agregó un endpoint de cómputo temporal (`neonctl branches add-compute`) — esto cambió su estado de `archived` a `ready` pero **no escribió ningún dato**: `logical_size` y `written_data_bytes: 0` permanecen idénticos antes y después de la lectura. Esto se documenta con total transparencia.

## 2. Baseline actual (BASELINE_PRE_20A)

Lectura read-only sobre `main`: `InspectionCase=5`, `InspectionSpace=34`, `InspectionElement=144`, `InspectionChecklistCheck=260`, `InspectionObservation=0`, `InspectionPhoto=0`, `User=3`, catálogo `16/32/93/91/77`, `InspectionReferenceImage=66` — idéntico al cierre de 19B. Datos reales confirmados presentes.

## 3. Timeline reconstruida

Fuentes cruzadas: `git log` (commits con timestamp exacto), Vercel (`vercel inspect --logs`, timestamps de build reales), Neon `operations list` (eventos de cómputo/branch).

| Hora (UTC) | Evento | Fuente |
|---|---|---|
| **~15:44–16:06** | Build y deploy de Fase 14B (commit `2e7bc75`) completa. Smoke de producción de 14B corre: crea caso QA real, confirma 3 espacios históricos reales intactos (`config=null`, sin retroactividad), verifica PDF con conteos reales, limpia QA, confirma "0 residuos". **Última confirmación directa de que existían datos reales.** | Build log Vercel (`Cloning... Commit: 2e7bc75` a las 15:42:49.845Z) + `docs/FASE14B_PUBLICACION_LIVING_COMEDOR_SEPARADOS_V1.md` (smoke completo documentado) |
| 16:06:46 | `suspend_compute` en `main` — fin de la sesión de actividad de 14B | Neon operations |
| 17:12:01 – 17:17:16 | Breve sesión de cómputo (~5 min) | Neon operations — sin registro de qué query se ejecutó (Neon no guarda logs a nivel de fila) |
| 18:06:53 – 18:16:46 | Otra breve sesión de cómputo (~10 min) | Neon operations |
| **18:33:03** | Restore de `main` a `main@2026-08-20T16:00:00Z`, con preservación del estado previo como `pre-restore-2026-08-20-empty` (secuencia `create_branch`/`detach_parent_branch`/`sync_dbs_and_roles_from_compute`/`epc_sync`, todas al mismo timestamp) | Neon operations — coincide exacto con `main.last_reset_at` |
| 19:41:00 | Creación de `pre-15b-healthy-20260820` desde `main` ya restaurada | Neon operations (`create_branch`, parent=`br-super-breeze-ac04bgr6`) |
| 19:42:56 (commit) / 19:43:00 (deploy) | Push + deploy de Fase 15B (commit `c5104cb`) | `git log`, Vercel build log |

**VENTANA DEL INCIDENTE — HECHO CONFIRMADO (cota externa):** entre **2026-08-20T16:06:46Z** (última actividad conocida tras la confirmación de datos reales en 14B) y **2026-08-20T18:33:03Z** (restore ejecutado). Duración máxima: **2h 26min**.

**Ventana más estrecha — HIPÓTESIS (no confirmada con timestamp exacto):** los dos únicos períodos de actividad de cómputo dentro de esa ventana son 17:12–17:17 y 18:06–18:16. Es razonable (no probado) que el primero corresponda al momento en que la investigación de 15A leyó el baseline y encontró la BD vacía por primera vez, acotando la ventana real a **~17:12** (66 min desde el último dato confirmado). No existe timestamp persistido de ese hallazgo específico — Neon no registra queries, solo eventos de branch/cómputo.

## 4. Qué se borró realmente — comparación de tablas

Se conectó de forma read-only al branch forense `pre-restore-2026-08-20-empty` (sin escribir nada) y se comparó contra `main` actual:

| Tabla | Vacío (forense) | Main (actual, 21-ago) |
|---|---|---|
| **User** | **3** | **3** |
| **InspectionCase** | **0** | **5** |
| **InspectionSpace** | **0** | **34** |
| **InspectionElement** | **0** | **144** |
| **InspectionChecklistCheck** | **0** | **260** |
| InspectionSpaceTemplate | 16 | 16 |
| InspectionElementTemplate | 29 | 32 |
| InspectionChecklistItem | 82 | 93 |
| TechnicalArticle | 80 | 91 |
| InspectionElementTemplateSpace | 58 | 77 |
| **RegularizationCase** | **8** | **8** |
| **SavedProject** | **4** | **4** |

Las diferencias en catálogo (`ElementTemplate` 29→32, `ChecklistItem` 82→93, etc.) corresponden a **crecimiento legítimo posterior** (Fases 16A–19A agregaron Logia/Lavandería, Baño Lote B-F, referencias visuales, etc.) — no a pérdida, ya que `InspectionSpaceTemplate` (sin cambios desde antes del incidente) coincide exacto.

**PATRÓN CONFIRMADO — Clasificación C6/sección 5, patrón A:** únicamente `InspectionCase` y su cadena de cascada (`Space→Element→ChecklistCheck→Observation→Photo`) fueron eliminados. **`User` intacto (3=3). `RegularizationCase` (otro módulo transaccional) intacto (8=8). `SavedProject` intacto (4=4).** El catálogo de Inspecciones está presente en su totalidad para ese punto en el tiempo.

Esto **descarta con evidencia dura**:
- Un reset/DROP total del schema (habría afectado `User`, `RegularizationCase`, `SavedProject` también).
- Una eliminación de `User` con cascada (los 3 usuarios siguen existiendo idénticos en ambos snapshots).
- Cualquier operación que tocara módulos fuera de Inspecciones.

Y es **consistente exactamente** con una operación que borró únicamente filas de `InspectionCase` (dejando que el cascade de Prisma/Postgres se encargara del resto), sin tocar ninguna otra tabla.

## 5. Cascadas Prisma

Árbol de cascada real (`schema.prisma`): `User → InspectionCase → InspectionSpace → InspectionElement → InspectionChecklistCheck → (Observation, Photo)`, todos `onDelete: Cascade`. Borrar el `User` padre produciría el mismo patrón de hijos vacíos, **pero también borraría la fila `User` misma** — lo cual NO ocurrió (3=3 confirmado). Esto descarta la hipótesis de eliminación de usuario como causa total, con evidencia directa, no por inferencia.

## 6. Auditoría de código destructivo (todo el repo)

Búsqueda de `deleteMany|$executeRaw|$executeRawUnsafe|$queryRaw|TRUNCATE|DROP` en `src/` y `prisma/` (excluyendo el cliente Prisma generado, que solo contiene tipos/JSDoc boilerplate, no código ejecutable real):

| Hallazgo | Clasificación | Nota |
|---|---|---|
| `src/app/(app)/inspecciones/actions.ts:298` — `prisma.inspectionCase.delete({ where: { id: caseId } })` | **SEGURO** | Delete de UN registro por id explícito, gateado por ownership (`insCase.userId !== session.user.id`). Nunca `deleteMany`. Ver auditoría detallada sección 7. |
| `prisma/seed-regularization.ts:144-145` (antes del fix) — `regularizationDocumentCheck.deleteMany({})` + `regularizationDocumentChecklist.deleteMany({})` sin filtro | **POTENCIALMENTE DESTRUCTIVO — CORREGIDO EN ESTA FASE** | `RegularizationDocumentCheck` es transaccional (tiene `userId`/`caseId`, progreso real de usuario), no catálogo. El propio comentario del archivo ya advertía este riesgo desde antes de que existieran usuarios reales. Hoy `RegularizationCase=8` en producción — el riesgo es real y vigente. **No causó el incidente de Inspecciones** (`RegularizationCase` intacto en el patrón de la sección 4), pero es un guardrail necesario independiente. Ver sección 12. |
| `prisma/seed-regularization.ts:569` — `regularizationRule.deleteMany({})` | **SEGURO** | `RegularizationRule` es catálogo puro (sin `userId`), sin riesgo. |
| `prisma/seed-radier.ts:24-28` — `deleteMany({ where: { moduleId: mod.id } })` | **SEGURO** | Filtro explícito por módulo, tablas de catálogo (Formula/Variable/LossFactor/Question). |
| `prisma/db-fixes/fase6b-etapa4-consistencia.ts:124` | **SEGURO** | Filtro explícito por `questionId`, catálogo. |
| Resto de `prisma/db-fixes/*.ts` (29 scripts) | **SOLO CATÁLOGO** | Ninguno toca `InspectionCase`/`InspectionSpace`/`User` — confirmado por grep dirigido (sección 10). |

**Ningún script, en ningún commit de todo el historial de Git, contiene `inspectionCase.deleteMany` ni ninguna operación que pudiera borrar todos los casos de Inspecciones.**

## 7. Auditoría de `deleteInspectionCaseAction`

Única ruta de aplicación que borra un `InspectionCase`:

- **Autenticación**: requiere sesión activa (`getServerSession`), si no hay sesión retorna error sin tocar BD.
- **Ownership**: `insCase.userId !== session.user.id` → error "Inspección no encontrada." (nunca revela si el caso existe pero es de otro usuario).
- **ID requerido**: `caseId: string` explícito, sin default, sin posibilidad de `undefined`/`null` (TypeScript lo exige).
- **Scope**: `prisma.inspectionCase.delete({ where: { id: caseId } })` — Prisma `.delete()` (singular) exige un `where` único (`id`), es estructuralmente imposible que borre más de un registro. **No existe ninguna ruta para ejecutar `deleteMany({})` desde esta acción.**
- **Cascade**: delegado al schema (`onDelete: Cascade` en cada nivel) — nunca borrado manual fila por fila.
- **Manejo de errores**: `del()` de blobs es best-effort (try/catch que no bloquea ni revierte el borrado del caso).

**Conclusión: una acción normal de usuario JAMÁS puede borrar más de UNA inspección propia.** Confirmado también en vivo (sección 13, prueba de cascada controlada).

## 8. Auditoría de cleanup QA

Cada fase de este proyecto crea y elimina usuarios/casos QA mediante un script temporal (`prisma/db-fixes/_tmp_*_qa_cleanup.ts`), **siempre eliminado antes del cierre de la fase, nunca commiteado**. Esto significa que el contenido exacto de cualquier script de cleanup ejecutado durante la ventana del incidente **no es recuperable de Git** (nunca estuvo trackeado) — limitación reconocida explícitamente, no se inventa su contenido.

Lo que SÍ es auditable: el **patrón** seguido en todas las fases de este historial (14B, 15B, 16B... hasta 20A, incluida esta misma fase) es consistente y verificable en los documentos `docs/FASEXXB_*.md` ya escritos: cada cleanup busca el caso/usuario por **email exacto** (`qa-XX@obrabien.local`) o **nombre exacto**, y borra por `id` explícito — nunca un `deleteMany({})` sin filtro. No se encontró ningún documento de fase que describa un cleanup con filtro vacío o ambiguo.

**Riesgo real identificado**: este patrón seguro dependía enteramente de la disciplina manual de cada fase, sin ningún guardrail de código que lo *forzara*. Se corrige en esta fase (sección 12).

## 9. Auditoría de db-fixes

29 commits tocan `prisma/db-fixes/`. Ninguno cae dentro de la ventana del incidente (16:06–18:33 UTC del 20-ago) — el más cercano anterior es la implementación de 15A (sin commit propio, es parte de la sesión de investigación) y el siguiente es `c5104cb` (15B, 19:43 UTC, **después** del restore). Todos los scripts de `db-fixes/` revisados tocan exclusivamente catálogo (`InspectionSpaceTemplate`/`ElementTemplate`/`ChecklistItem`/`TechnicalArticle`/`ElementTemplateSpace`) vía upsert — ninguno tiene capacidad de borrar `InspectionCase`.

## 10. Seed histórico

`git log --oneline -- prisma/seed-inspecciones.ts` (9 commits) revisado en su totalidad: **ninguna versión, en ningún punto de la historia, contuvo `deleteMany` ni tocó `InspectionCase`/`InspectionSpace`** — confirmado leyendo el contenido de cada commit histórico directamente (`git show <hash>:prisma/seed-inspecciones.ts`), no solo el mensaje. El único match de texto fue un comentario (`// ...InspectionSpace.spaceTemplateId`), no código.

`package.json`, revisado en **todo su historial** (`git log -p --follow`): `build` fue siempre `next build` y `postinstall` fue siempre `prisma generate` — **nunca, en ningún commit, se configuró `db:seed`, `migrate reset` ni ningún reset a ejecutarse automáticamente en build/postinstall/deploy.** Esto descarta con evidencia directa (no solo el estado actual) que un deploy normal de Vercel haya podido ejecutar el seed o un reset.

## 11. Git — commits alrededor de la ventana

Ver timeline (sección 3). No hay ningún commit cuyo timestamp de push caiga dentro de la ventana 16:06–18:33 UTC del 20-ago — el push+deploy de 14B ya había completado y confirmado datos reales a las ~15:44, y el siguiente push (15B) fue después del restore.

## 12. Vercel

Deployment de 14B (`dpl_2uXuSZ1Xgu4Uf6xo5N3NHL2mDXqr`, commit `2e7bc75`): build log completo revisado — clona el repo, `postinstall: prisma generate` (sin seed), `next build`, genera 29 páginas estáticas, termina con `exit code 0`. **Ningún paso del build ejecuta código que escriba en `InspectionCase`.** No hay error de Prisma ni de BD en el log. Un deploy normal de Vercel **no tiene ninguna ruta que pueda destruir datos** — confirmado leyendo el log real, no supuesto.

## 13. Neon operations

Reconfirmado con la ventana exacta: **el único evento de tipo restore/reset/branch-reset en todo el historial de operaciones del proyecto es el que ejecutamos nosotros mismos a las 18:33:03Z** (secuencia `create_branch`/`detach_parent_branch`/`sync_dbs_and_roles_from_compute`, todos con ese mismo timestamp, sobre `main` y `pre-restore-2026-08-20-empty`). Antes de eso, los únicos eventos en la ventana son `start_compute`/`suspend_compute` normales (dos sesiones cortas, 17:12–17:17 y 18:06–18:16) — ciclos de auto-suspensión por inactividad, no operaciones destructivas de infraestructura.

**Limitación confirmada y documentada**: `neonctl logs query` devuelve `ERROR: telemetry is not available in this region` — **este proyecto de Neon NO tiene logs a nivel de query/SQL disponibles** (esa función solo existe para proyectos en `aws-us-east-2`; este proyecto corre en `sa-east-1`). Esto significa que **ninguna sentencia SQL ejecutada contra la BD queda registrada en ningún lugar accesible**, sin importar quién o qué la haya ejecutado. Esta es la razón fundamental por la que la causa raíz exacta no puede demostrarse con certeza — no es que se haya buscado mal, es que el dato no existe.

## 14. ¿Fue DROP/reset o DELETE selectivo?

El patrón de la sección 4 (User/RegularizationCase/SavedProject intactos, catálogo intacto, solo InspectionCase+cascada vacío) **demuestra que NO fue un reset total de schema ni un DROP de base de datos** — ambos habrían afectado todas las tablas. Es matemáticamente consistente con una sentencia equivalente a `DELETE FROM inspection_cases;` (sin `WHERE`) o `prisma.inspectionCase.deleteMany({})`, cuyo cascade de Postgres/Prisma produce exactamente el patrón observado. No se reprodujo esta operación en ninguna rama (ni siquiera aislada) porque el resultado es matemáticamente obvio dado el cascade ya documentado en la sección 5 — reproducirlo no añadiría evidencia sobre el patrón, solo confirmaría lo que el propio schema ya garantiza.

## 15. Reproducción aislada

No fue necesaria (ver sección 14): la evidencia de patrón (sección 4) ya es suficiente para confirmar qué tipo de operación pudo producir el estado observado, sin necesidad de ejecutarla en una rama de prueba. No se creó ninguna rama Neon adicional para esta fase.

## 16. Matriz de hipótesis

| Hipótesis | ¿Puede producir el patrón? | Evidencia temporal | Evidencia de código | Estado |
|---|---|---|---|---|
| `deleteMany` sobre `InspectionCase` (o SQL equivalente `DELETE FROM inspection_cases`) | Sí, exacto | Ventana 16:06–18:33 UTC 20-ago, sin registro de quién la ejecutó | 0 ocurrencias en todo el código/historial versionado | **MUY PROBABLE** (patrón encaja exacto; mecanismo/actor no determinable) |
| Eliminación masiva de `User` (cascada) | No — habría borrado usuarios también | — | — | **DESCARTADA** (evidencia directa: `User=3` en ambos snapshots) |
| Reset/DROP total de schema | No — habría afectado todas las tablas | Único evento de restore/reset en Neon es el nuestro, 18:33Z | — | **DESCARTADA** (evidencia directa: catálogo/RegularizationCase/SavedProject/User intactos) |
| Seed histórico de Inspecciones | Ninguna versión histórica tenía `deleteMany` | — | 0 en 9 commits históricos revisados | **DESCARTADA** |
| Ejecución automática de seed/reset en deploy/build | No existe tal hook, nunca existió | Build log de 14B sin seed | `package.json` sin `db:seed` en build/postinstall en TODO su historial | **DESCARTADA** |
| Cleanup QA mal scopeado (script temporal no commiteado) | Sí sería posible en teoría | Sin timestamp exacto de ejecución recuperable | Contenido no recuperable (nunca trackeado) — patrón en todas las fases documentadas es siempre scope explícito | **POSIBLE, NO DETERMINABLE** |
| Acción manual vía psql/Prisma Studio/cliente SQL directo | Sí sería posible | Sin registro (Neon no tiene audit log de queries en esta región) | N/A (fuera del repo) | **POSIBLE, NO DETERMINABLE** |
| Restore/reset de Neon (previo al nuestro) | No — el único evento de este tipo es el nuestro | Confirmado por operations log completo | — | **DESCARTADA** |
| Acción normal de usuario vía UI (`deleteInspectionCaseAction`) | No — solo borra 1 caso por id, con ownership | — | Auditoría completa sección 7 | **DESCARTADA** |

## 17. Causa raíz

```
CAUSA RAÍZ: NO DETERMINABLE CON LOS LOGS DISPONIBLES.

HIPÓTESIS MÁS PROBABLE:
Una operación equivalente a "borrar todas las filas de InspectionCase"
(deleteMany sin filtro o SQL manual equivalente), cuyo cascade de
Postgres/Prisma vació también Space/Element/ChecklistCheck/Observation/
Photo — ejecutada mediante una conexión directa a la base (script
temporal nunca commiteado, o un cliente SQL/Prisma Studio manual),
NUNCA a través de código de aplicación versionado.

EVIDENCIA A FAVOR:
- El patrón de datos (sección 4) es EXACTAMENTE el que produciría esa
  operación: solo InspectionCase+cascada vacío, todo lo demás intacto.
- Se auditó el 100% del código versionado (actual + histórico) sin
  encontrar ninguna ruta que ejecute esa operación — descarta que haya
  sido introducida por un commit real.
- El patrón descarta con evidencia directa las alternativas de mayor
  impacto (reset total, eliminación de usuario, seed automático).

EVIDENCIA EN CONTRA / LÍMITE:
- No existe registro de query-level en Neon para esta región — no se
  puede identificar QUIÉN o QUÉ conexión ejecutó la operación, ni
  confirmar si fue deliberada, un script de prueba, o un error humano.
- No se puede recuperar el contenido de ningún script temporal no
  commiteado que haya podido ejecutarse en la ventana.

NIVEL DE CONFIANZA: MEDIO — alto en el PATRÓN de lo que ocurrió (qué
tablas, qué mecanismo de cascada), bajo en el MECANISMO/ACTOR exacto.
```

## 18. Guardrails implementados

### Guardrail 1 — cleanup QA sin scope fuerte (prevención)

Nuevo módulo [`src/lib/inspecciones/qa-safety.ts`](src/lib/inspecciones/qa-safety.ts): `assertQaEmail(email)` (exige dominio `@obrabien.local`, lanza si no) y `assertMaxCount(actual, max, label)` (lanza si un cleanup encuentra más filas de las esperadas). No reemplaza el criterio de cada script (que ya buscaba por id/email exacto), lo hace **explícito y verificable por test** en vez de depender solo de la disciplina manual de cada fase. Usado en vivo en el cleanup QA de esta misma fase (sección 20).

### Guardrail 2 — `seed-regularization.ts` (riesgo real, independiente del incidente)

[`prisma/seed-regularization.ts`](prisma/seed-regularization.ts): `seedRegularizationDocuments` ahora aborta (`throw`) si detecta `RegularizationDocumentCheck` reales (progreso de usuario) antes de ejecutar su `deleteMany({})` sobre el catálogo de documentos. El comentario original ya advertía este riesgo desde antes de que existieran usuarios reales — hoy `RegularizationCase=8` en producción, el riesgo es vigente. No se hizo la migración completa (agregar clave de negocio única para upsert seguro) por exceder el alcance de esta fase — ese TODO permanece explícito en el propio comentario del archivo.

### Guardrail 3 — observabilidad en `deleteInspectionCaseAction`

[`src/app/(app)/inspecciones/actions.ts`](src/app/(app)/inspecciones/actions.ts): log server-side (`userId`, `caseId`, `photosDeleted`, timestamp ISO — sin tokens/cookies/secretos) justo antes de confirmar el borrado. Es la única ruta de aplicación capaz de borrar un `InspectionCase`; si algo similar volviera a ocurrir, este log permite saber qué usuario y qué caso lo originó. Verificado en vivo (sección 20): el log aparece exactamente al ejecutar el borrado real vía UI.

### Guardrail 4 — bulk delete

No existe ni existió nunca un endpoint público de "borrar todas las inspecciones" — confirmado en la auditoría de código (sección 6/7). No se agregó ninguno. No hace falta ningún guardrail adicional aquí.

## 19. Pruebas

- [`src/lib/inspecciones/qa-safety.test.ts`](src/lib/inspecciones/qa-safety.test.ts) — 6 casos: acepta email QA válido, rechaza email real, rechaza string vacío, rechaza dominio que solo contiene el sufijo sin terminar en él, acepta conteo dentro del máximo, aborta si excede el máximo.
- [`prisma/seed-regularization-guardrail.test.ts`](prisma/seed-regularization-guardrail.test.ts) — confirma que `seedRegularizationDocuments` aborta ANTES de llamar a `deleteMany` cuando ya existe progreso real (fake Prisma, sin BD real).
- **Prueba de cascada controlada (en vivo, contra `main`, usuario `qa-20a@obrabien.local`)**: creados Caso A y Caso B reales vía UI. Caso A eliminado por el flujo normal (`deleteInspectionCaseAction`, incluido el `confirm()` del navegador). **Resultado: Caso A eliminado, Caso B intacto, datos reales intactos (`InspectionCase` 5→6→5 tras cleanup), log de observabilidad confirmado en consola del servidor.**
- **Prueba de cleanup QA**: el script de limpieza de esta misma fase usó `assertQaEmail`/`assertMaxCount` en vivo — ambos guardrails pasaron sin bloquear el cleanup legítimo.

`npx vitest run` → **116/116 PASS** (109 previos + 7 nuevos).

## 20. Verificación técnica

`npx tsc --noEmit` → PASS. `npx eslint .` → PASS. `npx vitest run` → 116/116 PASS. `npx next build` → PASS (29 rutas).

## 21. Integridad final de `main`

BASELINE_PRE_20A repetido tras toda la investigación y las pruebas QA: idéntico en todos los conteos (`InspectionCase=5`, `InspectionSpace=34`, `InspectionElement=144`, `InspectionChecklistCheck=260`, `User=3`, catálogo `16/32/93/91/77`, `InspectionReferenceImage=66`). Ningún dato real fue alterado por la investigación. No se ejecutó ninguna reproducción destructiva contra `main`.

## 22. Limpieza

Usuario `qa-20a@obrabien.local` y sus 2 casos QA eliminados. Todos los scripts temporales (`prisma/db-fixes/_tmp_20a_*.ts`) eliminados. **Preservados sin cambios**: `pre-restore-2026-08-20-empty` y `pre-15b-healthy-20260820` (ambos siguen existiendo, con sus datos exactamente iguales a como se encontraron al inicio de esta fase).

## 23. Decisión de publicación

**RESULTADO A** — se modificó código (2 guardrails de aplicación reales: fix de `seed-regularization.ts` + logging en `deleteInspectionCaseAction`, más el módulo reutilizable `qa-safety.ts`). **GO PARA FASE 20B.**

---

## INCIDENTE NEON — CONCLUSIÓN

**VENTANA DEL INCIDENTE:** 2026-08-20T16:06:46Z (última confirmación de datos reales, smoke de Fase 14B) a 2026-08-20T18:33:03Z (restore ejecutado) — cota confirmada de 2h26min; ventana más probable (no confirmada con timestamp exacto) ~16:06:46Z–17:12:01Z (~66 min).

**PATRÓN DE DATOS:** Solo `InspectionCase` y su cascada (`Space→Element→ChecklistCheck→Observation→Photo`) vacíos. `User`, `RegularizationCase`, `SavedProject` y el catálogo de Inspecciones intactos — confirmado comparando el branch forense vacío contra `main` actual.

**CAUSA RAÍZ:** NO DETERMINABLE (Neon no tiene logs de query para esta región).

**DETALLE:** Se auditó el 100% del código de aplicación (actual e histórico) sin encontrar ninguna ruta versionada capaz de producir el patrón observado.

**HIPÓTESIS MÁS PROBABLE:** Un `deleteMany`/`DELETE FROM inspection_cases` sin filtro, ejecutado vía conexión directa (script temporal no commiteado o cliente SQL manual) — nunca vía código de aplicación.

**NIVEL DE CONFIANZA:** MEDIO (alto en el patrón, bajo en el mecanismo/actor exacto).

---

## HIPÓTESIS (resumen)

| Hipótesis | Estado | Evidencia |
|---|---|---|
| deleteMany/DELETE directo sobre InspectionCase | MUY PROBABLE | Patrón de datos exacto; 0 código versionado que lo haga |
| Eliminación de User (cascada) | DESCARTADA | User=3 en ambos snapshots |
| Reset/DROP total de schema | DESCARTADA | Catálogo/RegularizationCase/SavedProject/User intactos |
| Seed histórico Inspecciones | DESCARTADA | 0 deleteMany en 9 commits históricos |
| Seed/reset automático en deploy | DESCARTADA | package.json sin db:seed en build/postinstall, en toda su historia |
| Cleanup QA mal scopeado | NO DETERMINABLE | Script no recuperable de Git (nunca trackeado) |
| SQL manual / Prisma Studio | NO DETERMINABLE | Neon sin audit log de queries en esta región |
| Restore/reset Neon previo al nuestro | DESCARTADA | Único evento de este tipo es el nuestro (18:33Z) |
| Acción normal de usuario vía UI | DESCARTADA | Solo borra 1 caso por id, con ownership |

## GUARDRAILS

Implementados = 3 (+ 1 confirmado innecesario)

1. `src/lib/inspecciones/qa-safety.ts` — `assertQaEmail`/`assertMaxCount`, reutilizable en futuros cleanups QA.
2. `prisma/seed-regularization.ts` — aborta si detecta progreso real antes de `deleteMany({})` (riesgo real independiente, descubierto durante la auditoría).
3. `src/app/(app)/inspecciones/actions.ts` — logging server-side en `deleteInspectionCaseAction` (única ruta capaz de borrar un caso).
4. Bulk delete público — auditado, no existe, no se agregó ninguno (no hacía falta).

## PRUEBAS

Borrado individual = PASS
Cleanup QA = PASS
Scope protection = PASS
Datos reales = PASS

## TÉCNICO

tsc = PASS
eslint = PASS
vitest = 116/116 PASS
build = PASS

## MAIN

integridad = PASS

## BACKUPS

empty forensic backup = PRESERVADO
healthy backup = PRESERVADO

## CAMBIOS DE CÓDIGO

SÍ

## GO PUBLICACIÓN

SÍ
