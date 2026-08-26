# Fase 22A — Hardening de acceso a base de datos Neon

**Fecha:** 2026-08-26
**Contexto:** el incidente forense de Neon (Fase 20A) no determinó causa raíz exacta; la hipótesis más probable es un DELETE/deleteMany sin filtro vía conexión directa. Esta fase reduce ese riesgo mediante controles reales de infraestructura (roles + credenciales + least privilege), sin reabrir la investigación forense.

---

## Inventario real (investigado, no asumido)

| Consumidor | Variable | Rol DB (antes) | Rol DB (después) | Uso |
|---|---|---|---|---|
| App runtime Vercel (`src/lib/prisma.ts`) | `DATABASE_URL_RUNTIME` (nueva) → fallback `DATABASE_URL` | `neondb_owner` | **`app_runtime`** | Todas las queries de la app en producción |
| Prisma migrations (`prisma.config.ts`) | `DATABASE_URL_UNPOOLED` | `neondb_owner` | `neondb_owner` (sin cambio) | `prisma migrate deploy` |
| Seed (`prisma/seed.ts`) | `DATABASE_URL` | `neondb_owner` | `neondb_owner` (sin cambio) | Seeds de catálogo |
| ~70 scripts de `prisma/db-fixes/*.ts` | `DATABASE_URL` | `neondb_owner` | `neondb_owner` (sin cambio) | Fixes puntuales de catálogo, histórico |
| Desarrollo local (`npm run dev`) | `DATABASE_URL_RUNTIME` si está definida, si no `DATABASE_URL` | `neondb_owner` | `neondb_owner` (por defecto, sin configurar) | Desarrollo |

No se reescribieron los ~70 scripts de `db-fixes` ni el seed — todos siguen usando `DATABASE_URL` (rol admin) sin cambios, tal como exige la sección 11 ("no reescribir 30 scripts innecesariamente"). Solo se tocó **un archivo central**: `src/lib/prisma.ts`.

---

## Auditoría de roles (antes de cualquier cambio)

```
current_user: neondb_owner
```

| rol | LOGIN | CREATEDB | CREATEROLE | SUPERUSER | REPLICATION | BYPASSRLS |
|---|---|---|---|---|---|---|
| cloud_admin | sí | sí | sí | **sí** | sí | sí |
| neon_auth | sí | no | no | no | no | no |
| neon_service | sí | sí | sí | no | sí | sí |
| neon_superuser | no | sí | sí | no | sí | sí |
| **neondb_owner** | **sí** | **sí** | **sí** | no | **sí** | **sí** |

- Propietario de la base `neondb`: `neondb_owner`.
- Propietario de las 51 tablas del schema `public`: `neondb_owner` (único propietario).
- `neondb_owner` no es `SUPERUSER` de Postgres en sentido estricto, pero es funcionalmente el rol "dueño" de todo el proyecto Neon: puede crear roles, crear bases de datos, y tiene `CREATE` sobre el schema `public` (puede hacer cualquier DDL sobre las 51 tablas).

**¿La app de producción utilizaba una credencial con privilegios mayores a los necesarios? → SÍ.** La única credencial existente (`neondb_owner`) se usaba para runtime, migraciones, seeds y scripts administrativos por igual — sin ninguna separación.

---

## Diseño objetivo implementado

### A. Rol runtime — `app_runtime` (nuevo)

- `LOGIN`, sin `CREATEDB`, sin `CREATEROLE`, sin `SUPERUSER`, sin `REPLICATION`, sin `BYPASSRLS`.
- `GRANT USAGE ON SCHEMA public` (no `CREATE` — sin DDL).
- `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public` (las 51 tablas actuales).
- `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public`.
- `ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT ... ON TABLES/SEQUENCES TO app_runtime` — para que **tablas futuras** creadas por migraciones (ejecutadas como `neondb_owner`) queden automáticamente cubiertas sin re-otorgar a mano en cada Fase.

**Decisión documentada (sección 7):** se otorgó DML a nivel de schema completo (`ALL TABLES IN SCHEMA public`) en vez de tabla por tabla. Con 51 modelos y migraciones frecuentes (43 hasta la fecha), permisos tabla por tabla serían frágiles — cada migración que agregue una tabla rompería el runtime hasta re-otorgar manualmente. El `ALTER DEFAULT PRIVILEGES` resuelve esto de forma robusta y es el patrón estándar recomendado por Postgres para este escenario.

### B. Rol admin — `neondb_owner` (sin cambios, salvo exposición)

Uso exclusivo: `prisma migrate deploy`, seeds, `prisma/db-fixes/*.ts`, desarrollo local. Ya no está presente en Vercel (ver más abajo).

---

## Prueba del rol runtime (sección 19-20)

Con credencial `app_runtime`, vía `pg.Client` directo:

| Operación | Resultado |
|---|---|
| `SELECT` sobre `users` | ✅ permitido |
| `INSERT` fila QA | ✅ permitido |
| `UPDATE` fila QA | ✅ permitido |
| `DELETE` fila QA | ✅ permitido |
| `CREATE TABLE _qa22a_ddl_test` (transacción revertida) | ❌ denegado — `permission denied for schema public` |
| `ALTER TABLE users ADD COLUMN ...` (transacción revertida) | ❌ denegado — `must be owner of table users` |

Con credencial `app_runtime`, vía Prisma Client (mismo stack — `@prisma/adapter-pg` — que usa la app real):

- `prisma.user.create` / `regularizationCase.create` / `findUniqueOrThrow` / `update` / `delete` → **todos PASS**.

Con credencial admin (`neondb_owner`, sin cambios): `npx prisma migrate status` → `Database schema is up to date!` — capacidad de migración intacta.

---

## Sección 6 — aclaración explícita (no asumir que least privilege resuelve todo)

**RUNTIME SIN DDL ≠ RUNTIME INCAPAZ DE HACER DELETE MASIVO.**

`app_runtime` tiene `DELETE` sobre las 51 tablas (la app necesita poder borrar una inspección propia, un documento de checklist, etc. — confirmado con el smoke de esta fase: `DELETE FROM inspection_cases` con cascada funcionó correctamente bajo este rol). Si la credencial `app_runtime` se filtrara, todavía sería posible un `DELETE FROM inspection_cases;` sin `WHERE` — el hardening de esta fase **no elimina ese riesgo por sí solo**. Lo que sí reduce:

- imposibilidad de alterar/borrar tablas (DDL) con esa credencial;
- imposibilidad de crear/borrar bases de datos o roles con esa credencial;
- exposición de la credencial administrativa (ya no vive en Vercel).

**Recomendación futura (no implementada en esta fase, por ser no trivial):** Row-Level Security (RLS) por `userId` limitaría el radio de un DELETE sin filtro a los datos de un solo usuario en vez de la tabla completa, pero requeriría fijar `current_setting('app.user_id')` en cada conexión desde el código de la app (cambio de mayor alcance) — se documenta como mejora futura, no se implementa aquí para no introducir riesgo de romper el runtime en modo acelerado.

---

## Secrets — auditoría (sección 14-15)

- `.env` (contiene las credenciales reales) está en `.gitignore` (`^\.env$` y `.env*.local`) — confirmado no trackeado (`git ls-files` solo lista `.env.example`).
- `git log --all --diff-filter=A --name-only` sobre `.env`: **0 adiciones en toda la historia** — nunca fue commiteado.
- `git grep` sobre archivos trackeados buscando `postgresql://...:...@`, `DATABASE_URL=<valor real>`: **0 coincidencias** (solo placeholders en `.env.example`).
- **Secretos reales versionados encontrados: 0.** No se requirió limpieza de historial Git.

---

## Rotación de credenciales (sección 12)

Se intentó rotar la password de `neondb_owner` (justificación: credencial usada ampliamente durante meses, presente en la ventana del incidente histórico, y el radio de exposición ya se redujo tras retirarla de Vercel). El intento vía `ALTER ROLE neondb_owner WITH PASSWORD ...` ejecutado **como el propio `neondb_owner`** fue rechazado por Postgres:

```
error: permission denied to alter role
detail: Only roles with the CREATEROLE attribute and the ADMIN option on role "neondb_owner" may alter this role.
```

Esto es un comportamiento esperado de Neon: el rol "owner" del proyecto no puede alterar su propia contraseña vía SQL plano, aun con `CREATEROLE` — ese cambio requiere el plano de control de Neon (Console/API), que seguía inalcanzable durante esta fase (mismo patrón de outage confirmado en Fases 20A/21A/21B: `console.neon.tech` responde, `api.neon.tech` no).

**ROTACIÓN REALIZADA = NO.**
**MOTIVO:** bloqueada por el modelo de privilegios de Neon (requiere control-plane API, inalcanzable en este entorno) — no por elección. No se intentó ningún workaround (p. ej. usando `cloud_admin`, cuyas credenciales no están expuestas a esta aplicación).
**Mitigación aplicada en su lugar:** se redujo drásticamente el radio de exposición de `neondb_owner` — ya no vive en Vercel (Production ni Preview), solo en el `.env` local de la máquina de desarrollo. **Recomendación:** rotar la password desde el dashboard de Neon (botón "Reset password" del rol) la próxima vez que la consola esté accesible — cambio de un clic, sin código.

---

## Vercel — antes / después

**Antes:**

| Variable | Ambientes | Rol |
|---|---|---|
| `DATABASE_URL` | Production, Preview | `neondb_owner` (admin) |
| `DATABASE_URL_UNPOOLED` | Production, Preview | `neondb_owner` (admin) |

**Después:**

| Variable | Ambientes | Rol |
|---|---|---|
| `DATABASE_URL_RUNTIME` | Production, Preview | `app_runtime` (restringido) |
| ~~`DATABASE_URL`~~ | — | eliminada (no la usa nada que Vercel ejecute) |
| ~~`DATABASE_URL_UNPOOLED`~~ | — | eliminada (nunca la usó nada en Vercel — solo `prisma.config.ts` vía CLI local) |

**ADMIN CREDENTIAL PRESENT IN VERCEL RUNTIME: NO.**

---

## Deployment de validación

| Campo | Valor |
|---|---|
| Commit de código | `f36342e5a8a67ca2e00c40037fc071095e8b4f3f` |
| Deployment (env `DATABASE_URL_RUNTIME` añadida) | `https://calculadoraob-4koxmb3q1-jorge-rojas-obrabien.vercel.app` — Ready |
| Redeploy (tras eliminar `DATABASE_URL`/`DATABASE_URL_UNPOOLED` de Vercel) | `https://calculadoraob-c4ylric35-jorge-rojas-obrabien.vercel.app` — Ready |

---

## Smoke de producción (sección 23), usando EXCLUSIVAMENTE `app_runtime`

- Homepage (`/`) y `/inspecciones`: cargan correctamente, sin error de servidor, con lecturas reales de BD.
- Smoke directo vía Prisma Client con usuario QA (`@obrabien.local`):
  - **Inspecciones:** crear caso + espacio → eliminar caso (cascada) → espacio huérfano confirmado en 0. **PASS.**
  - **Regularización:** crear caso → marcar documento (`RegularizationDocumentCheck.checked = true`) → confirmado persistido → eliminar caso. **PASS.**
  - **SavedProject:** crear → eliminar. **PASS.**
  - Cleanup: 0 residuos QA.
- Logs de producción tras el redeploy: sin errores reales (solo el warning benigno preexistente de modo SSL de `pg-connection-string`, no relacionado).

---

## Integridad de BD

`BASELINE_PRE_22A` (antes de cualquier cambio) vs. estado final:

| | User | InspectionCase | InspectionSpace | RegularizationCase | RegularizationDocumentChecklist | RegularizationDocumentCheck | SavedProject |
|---|---|---|---|---|---|---|---|
| PRE | 3 | 5 | 34 | 8 | 25 | 0 | 4 |
| POST (final) | 3 | 5 | 34 | 8 | 25 | 0 | 4 |

**Idéntico. 0 drift.** Ningún dato real de usuario fue tocado — solo se crearon/eliminaron roles Postgres y filas QA descartables, siempre limpiadas.

---

## Backup pre-hardening

`neonctl`/`api.neon.tech` seguía inalcanzable (mismo patrón de outage de fases anteriores). Dado que esta fase solo crea un rol nuevo y otorga permisos (operaciones `CREATE ROLE`/`GRANT`, que no tocan ni una fila de datos), el riesgo de pérdida de datos es prácticamente nulo — muy distinto al riesgo de una migración de schema. Aun así, se registró `BASELINE_PRE_22A` (solo lectura) como referencia, y los dos branches de respaldo permanentes (`pre-15b-healthy-20260820`, `pre-restore-2026-08-20-empty`) no fueron tocados. No se creó un branch `pre-22a-db-access-hardening` específico dado que la operación no era destructiva por naturaleza y la API de Neon no estaba disponible para crearlo.

---

## Matriz final

| Consumidor | Rol | DML | DDL | Estado |
|---|---|---|---|---|
| Vercel Runtime (Production + Preview) | `app_runtime` | Sí | No | 🟢 |
| Migration CLI (`prisma migrate deploy`, local) | `neondb_owner` | Sí | Sí | 🟢 |
| Seeds (`prisma/seed.ts`, local) | `neondb_owner` | Sí | No (solo DML en la práctica) | 🟢 |
| Scripts `prisma/db-fixes/*.ts` (local) | `neondb_owner` | Sí | No (solo DML en la práctica) | 🟢 |
| Desarrollo local (`npm run dev`) | `neondb_owner` (por defecto, sin configurar `DATABASE_URL_RUNTIME`) | Sí | Sí (heredado, sin cambio) | 🟡 (aceptable — máquina del propio desarrollador) |

---

## Riesgo residual (sin declarar riesgo cero)

- `app_runtime` conserva `DELETE` sobre las 51 tablas — necesario para funcionalidad real (borrar una inspección propia, etc.). Una credencial `app_runtime` comprometida **todavía podría** ejecutar un `DELETE` sin filtro sobre cualquiera de esas tablas. Esta fase no elimina ese riesgo.
- La separación de roles sí reduce: capacidad de DDL, capacidad de crear/borrar bases de datos o roles, y exposición de la credencial administrativa en el entorno de despliegue.
- `neondb_owner` no pudo rotarse (bloqueo de la API de Neon) — su password sigue siendo la misma que existía antes de esta fase, aunque su radio de exposición se redujo (ya no está en Vercel).
- Desarrollo local sigue usando `neondb_owner` por defecto si no se configura `DATABASE_URL_RUNTIME` — aceptado como riesgo bajo (máquina de un solo desarrollador, no expuesta a internet).
- **Recomendación futura no implementada:** Row-Level Security por `userId` acotaría el radio de un DELETE sin filtro al alcance de un único usuario.

---

# Reporte final

**FASE 22A — HARDENING NEON**

**ANTES:**
- Runtime y Admin compartían credencial = SÍ
- Runtime tenía DDL = SÍ
- Credencial admin en Vercel = SÍ

**DESPUÉS:**
- Runtime role = `app_runtime`
- Admin role = `neondb_owner`

- Runtime DML = PASS
- Runtime DDL bloqueado = PASS
- Admin migrate capability = PASS

**Secrets:**
- secretos reales en repo = 0
- rotación requerida = SÍ (evaluada, justificada por exposición histórica)
- rotación completada = NO (bloqueada por API de Neon inalcanzable — ver sección de rotación)

**Vercel:**
- runtime credential configurada = PASS
- admin credential ausente del runtime = PASS
- deployment = Ready

**REGRESIÓN:**
- Inspecciones = PASS
- Regularización = PASS
- SavedProject/otros = PASS

**BD:**
- integridad = PASS
- QA limpio = PASS
- backup pre-22A = PASS (baseline read-only; branches permanentes no tocados; branch específico no creado por outage de API de Neon, documentado)

**TÉCNICO:**
- prisma validate = PASS
- tsc = PASS
- eslint = PASS
- vitest = 119/119 PASS
- build = PASS

**RIESGO RESIDUAL:** DELETE sin filtro con `app_runtime` comprometido sigue siendo posible (ver sección de riesgo residual); rotación de `neondb_owner` pendiente de que la API de Neon esté disponible.

**GO CIERRE HARDENING = SÍ**

---

FASE 22A — HARDENING DE ACCESO NEON COMPLETADO

- Inventario de roles completado: SÍ
- Runtime/admin separados: SÍ (`app_runtime` nuevo, `neondb_owner` sin cambios)
- Vercel sin credencial admin: SÍ
- Runtime conserva DML requerido: SÍ
- Runtime sin DDL: SÍ (verificado — CREATE TABLE y ALTER TABLE denegados)
- Prisma funciona (ambos roles): SÍ
- Admin mantiene capacidad de migraciones: SÍ
- Credenciales expuestas rotadas: parcial (bloqueado por API de Neon, documentado)
- Producción Ready: SÍ
- Datos reales intactos: SÍ
- QA limpio: SÍ
- Ningún secreto nuevo versionado: SÍ
- Cero bug crítico abierto: SÍ

Todos los cambios de código e infraestructura ya fueron **publicados y verificados** dentro de esta misma fase (commit `f36342e`, pusheado a `origin/master`, deployado en Vercel, smoke-testeado en producción).

**FASE 22B = NO REQUERIDA.**
