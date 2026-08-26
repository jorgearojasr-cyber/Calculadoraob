# Fase 21A — Cierre definitivo del seed de Regularización (clave de negocio + upsert seguro + migración + QA aislada)

**Fecha:** 2026-08-26
**Alcance:** `prisma/seed-regularization.ts`, `prisma/schema.prisma`, `prisma/migrations/`, `src/lib/regularization-documents.ts`, `prisma/seed-regularization-upsert.test.ts`.
**Estado:** NO COMMIT. NO PUSH. NO DEPLOY. Solo cambios locales, verificados en una base de datos aislada — nunca contra `main`.

---

## 1. Contexto (Fase 20A/20B, no reabierto)

La Fase 20A investigó el incidente forense de Neon (`InspectionCase`/`Space` borrados durante la Fase 15A, luego restaurados) y concluyó que la causa raíz **no es determinable** con las herramientas disponibles en este proyecto/región de Neon. Esa conclusión no se reabre aquí.

En esa misma investigación se detectó un riesgo independiente: `prisma/seed-regularization.ts` hacía `deleteMany({})` sobre `RegularizationDocumentChecklist` (catálogo) antes de recrearlo — un patrón que, en cascada (`onDelete: Cascade`), también habría borrado `RegularizationDocumentCheck` (progreso real de usuario) si el seed se ejecutara alguna vez con progreso real en la base. La Fase 20B publicó una mitigación parcial: un guardrail que abortaba el seed si detectaba progreso existente antes del `deleteMany`. Quedó documentado como **MITIGADO PARCIALMENTE**, con un TODO explícito para reemplazar el patrón por clave de negocio + upsert idempotente.

Esta fase (21A) cierra ese TODO.

---

## 2. Diagnóstico de la arquitectura real (sin asumir nombres/relaciones)

Leyendo `prisma/schema.prisma` directamente (no asumido):

- **Catálogo:** `RegularizationDocumentChecklist` — `id` (cuid), `documento` (texto largo de UI, no estable), `category`, `paraQueSirve`, `dondeSeObtiene`, `obligatoriedad`, `origen`, `momento`, `soporteObraBien`, `citaNormativa`, `estadoValidacion`, `dependeDe` (JSON, condición DSL que referencia campos del caso como `anioConstruccion`/`recepcionMunicipal` — **nunca** referencia otros documentos por id), `order`.
- **Progreso:** `RegularizationDocumentCheck` — `userId` (FK→`User`, `onDelete: Cascade`), `caseId` (FK→`RegularizationCase`, `onDelete: Cascade`), `documentId` (FK→`RegularizationDocumentChecklist`, `onDelete: Cascade`), `checked`, `@@unique([userId, caseId, documentId])`.
- **Catálogo puro sin relación de usuario:** `RegularizationRule` — se evalúa en vivo, nunca se persiste un resultado ligado a un usuario. Confirmado en 20A, reconfirmado aquí: sigue sin relación a `User`/`RegularizationCase`.

Mapa CATÁLOGO → PROGRESO → CASO:
`RegularizationDocumentChecklist` (catálogo) ←FK— `RegularizationDocumentCheck` (progreso, por `documentId`) —FK→ `RegularizationCase` (caso) —FK→ `User`.

Esto confirma: borrar y recrear `RegularizationDocumentChecklist` es destructivo para el progreso real; borrar y recrear `RegularizationRule` no lo es.

---

## 3. Patrón destructivo localizado y clasificado

| Ubicación | Tabla | Clasificación | Acción |
|---|---|---|---|
| `seedRegularizationDocuments` (antes de esta fase) | `RegularizationDocumentChecklist` | **A — eliminar** (cascada sobre progreso real) | Reemplazado por upsert (ver §5) |
| `seedRegularizationRules` | `RegularizationRule` | **B — permanece** (catálogo puro, sin relación de usuario) | Sin cambios |

Cero ambigüedad: solo existían estos dos `deleteMany({})` en todo el archivo.

---

## 4. Clave de negocio

Se agregó `key: String @unique` a `RegularizationDocumentChecklist`:

- Es un slug legible y estable (ej. `formulario-12-1`, `certificado-dominio-vigente`), **no derivado de `documento`** (el texto de UI, que puede corregirse/reescribirse sin cambiar la identidad del documento) ni de `order` (posición visual, cambia libremente).
- Constraint real de base de datos: `UNIQUE INDEX` (no solo una convención de código).
- Nunca se usa `documento` como `where` de upsert — la clave de negocio es siempre `key`.

---

## 5. Migración (`prisma/migrations/20260826060000_regularization_document_business_key/migration.sql`)

Secuencia seguida (sin `DROP`/`TRUNCATE`/reset):

1. `ALTER TABLE ... ADD COLUMN "key" TEXT` (nullable).
2. `UPDATE ... SET "key" = CASE "documento" WHEN ... THEN ... END` — mapeo 1:1 determinístico construido a partir de `BASELINE_PRE_21A` (dump real de las 25 filas de producción, comparado contra el array `DOCUMENTS` del seed: 25 textos únicos, orden 0–24 coincide exactamente con el índice del array — **0 ambigüedad**, ningún key generado al azar).
3. Bloque `DO $$ ... RAISE EXCEPTION ... END $$;` — verificación de control: aborta la migración si queda alguna fila con `key IS NULL`.
4. `ALTER COLUMN "key" SET NOT NULL` + `CREATE UNIQUE INDEX`.
5. Columna adicional aditiva: `active BOOLEAN NOT NULL DEFAULT true` (soft-disable, ver §7).

Revisada manualmente: no hay `DROP`, no hay recreación de tabla, no hay pérdida de filas, el backfill es determinístico y verificado antes de aplicar la restricción `NOT NULL`.

**Esta migración NO se aplicó a `main` en esta fase** — solo se probó en la base aislada (ver §8). Su aplicación a `main` queda para la Fase 21B.

---

## 6. Seed reescrito (`seedRegularizationDocuments`)

Patrón nuevo:

```ts
const seededKeys = new Set<string>();
for (let i = 0; i < DOCUMENTS.length; i++) {
  const doc = DOCUMENTS[i];
  seededKeys.add(doc.key);
  await prisma.regularizationDocumentChecklist.upsert({
    where: { key: doc.key },
    update: { /* todos los campos canónicos */ order: i, active: true },
    create: { key: doc.key, /* ... */ order: i },
  });
}
const retired = await prisma.regularizationDocumentChecklist.findMany({
  where: { key: { notIn: Array.from(seededKeys) }, active: true },
  select: { id: true, key: true },
});
for (const doc of retired) {
  await prisma.regularizationDocumentChecklist.update({ where: { id: doc.id }, data: { active: false } });
}
```

- **Cero `deleteMany`** sobre `RegularizationDocumentChecklist` o `RegularizationDocumentCheck`.
- `id` se preserva siempre — el upsert crea solo si la `key` no existe; si existe, actualiza los campos canónicos sin tocar el `id`.
- `order` se actualiza vía upsert pero **no forma parte de la identidad** (la identidad es `key`).
- Un documento retirado del array `DOCUMENTS` nunca se borra físicamente — pasa a `active: false` (soft-disable, mismo patrón que `InspectionSpaceTemplate.active`).

`src/lib/regularization-documents.ts` se actualizó para filtrar `active: true` en ambas consultas de cara al usuario (`getVisibleDocumentChecklist`, `getPosteriorDocuments`) — sin esto, un documento retirado seguiría apareciendo aunque estuviera "soft-disabled". Sin cambio de comportamiento hoy (las 25 filas actuales están todas activas).

### Guardrail de Fase 20A — retirado deliberadamente

El guardrail (`if (existingProgress > 0) throw ...`) protegía específicamente el `deleteMany` que ya no existe. Se eliminó, con un comentario explícito en el código documentando la decisión (no es un olvido).

---

## 7. Registros retirados del catálogo (soft-disable)

Se investigó primero: `InspectionSpaceTemplate` ya usa `active: Boolean @default(true)` como patrón de soft-disable en este mismo proyecto. Se reutilizó el mismo patrón para `RegularizationDocumentChecklist` en vez de inventar un mecanismo nuevo. Ningún documento con progreso asociado se borra físicamente jamás bajo el nuevo seed.

---

## 8. Aislamiento de prueba

`neonctl` (Neon CLI / API de control) estuvo inalcanzable durante gran parte de esta fase (`ECONNRESET`/timeout en `branches create` y `neonctl me`; confirmado con `curl` que `console.neon.tech` devolvía `000` mientras `api.github.com` devolvía `200` — outage específico de la API de Neon, no de la red en general). Seguindo la instrucción explícita de la fase ("usar otro mecanismo aislado confiable ya disponible... NO usar main/backup/branch forense"), se creó una **base de datos separada** (`qa21a_regularization_seed`) en el mismo compute de Postgres de Neon vía `CREATE DATABASE`, usando las credenciales existentes (`neondb_owner` confirmado con `rolcreatedb=true`). Esto:

- No comparte ninguna tabla ni fila con `main`.
- No requiere acceso a la API de control de Neon (usa el protocolo de cable de Postgres).
- Permitió una prueba de instalación limpia real (migración completa aplicada de punta a punta) y pruebas de escritura reales, no solo mocks.

Al final de la fase, hacia el cierre, la API de Neon volvió a responder (`console.neon.tech` → 302) y se intentó `neonctl branches list`, pero requirió `--project-id` explícito (proyecto ambiguo entre varios) — no se insistió, dado que la integridad de `main` se verificó independientemente por lectura directa (§10) y esta limitación no bloquea el cierre de la fase, igual que se documentó en la Fase 20B.

**Los dos branches de respaldo permanentes (`pre-15b-healthy-20260820`, `pre-restore-2026-08-20-empty`) no fueron tocados en ningún momento de esta fase.**

---

## 9. Las 5 pruebas específicas — resultados

Todas ejecutadas contra la base de datos aislada `qa21a_regularization_seed` (con la migración completa aplicada, incluyendo la nueva migración de clave de negocio):

| # | Prueba | Resultado |
|---|---|---|
| 1 | Datos existentes con progreso real → IDs preservados tras re-seed | **PASS** — `id` de `formulario-12-1` idéntico antes/después |
| 2 | Segunda ejecución idempotente (0 duplicados, 0 filas de progreso nuevas/borradas) | **PASS** — 25 filas, 0 keys duplicadas, `User`/`RegularizationCase`/`RegularizationDocumentCheck` simulados intactos |
| 3 | Instalación limpia (schema → migración → seed desde cero) | **PASS** — `prisma migrate deploy` aplicó toda la historia (incluida la nueva migración) sin error; seed generó 25 filas correctas (0 duplicados, `order` = índice del array) |
| 4 | Progreso simulado (usuario + caso + `RegularizationDocumentCheck` real) preservado íntegramente tras re-seed | **PASS** — mismo `id` de usuario/caso/check, `checked: true` sin cambios, FK intacta |
| 5 | Catálogo modificado (mismo `key`, `documento`/`order` alterados manualmente simulando drift) corregido por el seed, con `id` preservado y progreso intacto | **PASS** — tras drift manual (`documento` y `order` alterados directamente en BD) y una nueva corrida del seed: `id` preservado, `documento`/`order` corregidos a los valores canónicos, el `RegularizationDocumentCheck` asociado siguió intacto |

Evidencia real capturada (no solo unit tests con fake-store): ver salidas de los scripts temporales ejecutados (ya eliminados, ver §12).

---

## 10. Integridad de `main`

`BASELINE_PRE_21A` (leído al inicio y al final de la fase, contra `main`, solo lectura):

```
User: 3
RegularizationCase: 8
RegularizationDocumentChecklist: 25
RegularizationDocumentCheck: 0
RegularizationRule: 9
RegularizationSketch: 2
InspectionCase: 5
InspectionSpace: 34
```

Sin drift — coincide exactamente al final de la fase. Confirmación adicional (no buscada, sino incidental): al intentar leer la columna `key` contra `main`, Prisma devolvió `P2022: The column "regularization_document_checklist.key" does not exist` — prueba directa de que la migración **no fue aplicada a `main`** en esta fase, tal como se exigía.

El seed **no se ejecutó contra `main`** en ningún momento de esta fase.

---

## 11. Regresión — smoke mínimo

- **Regularización/Inspecciones:** servidor de desarrollo (`npm run dev`, apuntando a `main`) levantado y verificado — la app carga correctamente, el middleware de auth redirige rutas protegidas (`/regularizacion`) al login como es esperado (comportamiento no relacionado a este cambio). Sin errores de servidor. Dado que `main` no tiene la columna `key` ni el seed se ejecutó ahí, no hay ningún cambio de comportamiento posible en producción/dev hasta la Fase 21B.
- **Build:** `npx next build` — compiló sin errores, 45 rutas generadas correctamente.

No se realizó re-QA completo de ningún módulo (fuera de alcance de 21A).

---

## 12. Limpieza

- Base de datos aislada `qa21a_regularization_seed`: **eliminada** (`DROP DATABASE`).
- Todos los scripts temporales `prisma/db-fixes/_tmp_21a_*.ts`: **eliminados**.
- Archivo de scratchpad con la cadena de conexión aislada: **eliminado**.
- Backups permanentes (`pre-15b-healthy-20260820`, `pre-restore-2026-08-20-empty`): **no tocados**.
- `git status` final: solo cambios locales de archivos (sin commits, sin staging) — ver §15.

---

## 13. Tests automatizados

`prisma/seed-regularization-guardrail.test.ts` (probaba el guardrail retirado) fue eliminado. `prisma/seed-regularization-upsert.test.ts` (nuevo) cubre, con un fake-store en memoria que replica la semántica real de un upsert por clave única de Postgres/Prisma:

1. Crea exactamente una fila por `key` única en la primera corrida.
2. Es idempotente: segunda corrida no crea filas nuevas, actualiza todas, preserva `id`.
3. Preserva el `id` cuando solo cambia el `documento` (label) para la misma `key`.
4. Previene que una `key` duplicada cree una segunda fila.

`npx vitest run` → **119/119 PASS**.

---

## 14. Auditoría final de `deleteMany`

Único `deleteMany` restante en `prisma/seed-regularization.ts`: `prisma.regularizationRule.deleteMany({})` dentro de `seedRegularizationRules` — tabla de catálogo puro sin relación a `User`/`RegularizationCase`/progreso (confirmado en 20A, reconfirmado aquí en el schema). **0 `deleteMany` sobre tablas de progreso de usuario.**

---

## 15. Verificación técnica completa

| Comando | Resultado |
|---|---|
| `npx prisma validate` | ✅ PASS |
| `npx tsc --noEmit` | ✅ PASS |
| `npx eslint .` | ✅ PASS |
| `npx vitest run` | ✅ 119/119 PASS |
| `npx next build` | ✅ PASS (45 rutas) |
| `git status` | Solo cambios locales — 0 commits, 0 staging |

---

## 16. Resultado de arquitectura

| Ítem | Valor |
|---|---|
| Modelo catálogo | `RegularizationDocumentChecklist` |
| Modelo progreso | `RegularizationDocumentCheck` (vía `documentId` FK) |
| Clave de negocio | `key: String @unique` (slug estable, independiente de `documento`/`order`) |
| Constraint de BD | `UNIQUE INDEX` real (Postgres) |
| Estrategia de seed | `upsert` por `key` — create si no existe, update de campos canónicos si existe, nunca delete/recreate |
| `deleteMany` sobre progreso | **0** |
| IDs existentes preservados | **PASS** |
| Progreso preservado | **PASS** |

---

## 17. Matriz antes/después

| | Antes (Fase 20B) | Después (Fase 21A) |
|---|---|---|
| Identidad de catálogo | Ninguna (posición en array / `documento` como texto libre) | `key: String @unique` |
| Estrategia de seed | `deleteMany({})` + recreación completa, con guardrail que abortaba si detectaba progreso | `upsert` por `key`, sin ningún `deleteMany` sobre progreso |
| Riesgo con progreso real | Guardrail bloqueaba el seed (mitigación parcial: el seed simplemente no podía correr con progreso presente) | El seed corre siempre, con o sin progreso — el progreso nunca se toca |
| Registros retirados del catálogo | No contemplado | `active: false` (soft-disable), nunca borrado físico |
| Preservación de `id` | No garantizada (recreación completa) | Garantizada por diseño (upsert por clave estable) |

---

## 18. Estado del riesgo — GO/NO-GO

**RIESGO 2 DE FASE 20B = 🟢 CERRADO DEFINITIVAMENTE.**

No queda ninguna ruta en el código donde el seed de Regularización pueda borrar `RegularizationDocumentCheck` (progreso real) o forzar la recreación de `RegularizationDocumentChecklist` (rompiendo IDs referenciados por FK). El guardrail parcial de la Fase 20A ya no es necesario y fue retirado explícitamente.

---

# Reporte final

**Causa del riesgo:** el seed de Regularización recreaba el catálogo completo vía `deleteMany({})` + recreación, lo que en cascada habría borrado `RegularizationDocumentCheck` (progreso real de usuario) si se ejecutara con progreso existente.

**Solución:** clave de negocio estable (`key: String @unique`) + `upsert` idempotente; el seed nunca borra ni recrea `RegularizationDocumentChecklist`, solo actualiza campos canónicos preservando `id`.

**Schema:**
- Migración requerida: **SÍ** (`20260826060000_regularization_document_business_key`)
- Business key: `key: String` en `RegularizationDocumentChecklist`
- Unique constraint: **SÍ** (`CREATE UNIQUE INDEX`)

**Seed:**
- `deleteMany` sobre progreso: **0**
- Upsert: **PASS**
- Idempotencia: **PASS**

**Prueba aislada** (base de datos separada `qa21a_regularization_seed`, sin usar `main` ni los backups):
1. Datos existentes con IDs preservados: **PASS**
2. Segunda ejecución idempotente: **PASS**
3. Instalación limpia: **PASS**
4. Progreso simulado preservado: **PASS**
5. Catálogo modificado corregido con ID preservado: **PASS**

**Regresión:**
- Regularización: **PASS** (smoke — app abre, sin errores, sin cambio de comportamiento en `main` porque la migración no se aplicó ahí)
- Inspecciones: **PASS** (smoke mínimo, sin cambios)

**Main:**
- Integridad: **PASS** (BASELINE_PRE_21A sin drift)
- Seed ejecutado en main: **NO**

**Técnico:**
- `prisma validate`: PASS
- `tsc`: PASS
- `eslint`: PASS
- `vitest`: 119/119 PASS
- `build`: PASS

**QA limpio:** **PASS** (0 residuos, base aislada eliminada, backups intactos)

**RIESGO 2 FASE 20B:** 🟢 **CERRADO DEFINITIVAMENTE**

**GO PARA PUBLICACIÓN:** **SÍ**

---

FASE 21A — SEED DE REGULARIZACIÓN CERRADO DEFINITIVAMENTE

🟢 Clave de negocio estable (`key`) agregada y con constraint UNIQUE real
🟢 Migración segura (nullable → backfill verificado → NOT NULL/UNIQUE), sin DROP/TRUNCATE
🟢 Seed reescrito: upsert por clave, 0 `deleteMany` sobre progreso de usuario
🟢 IDs existentes preservados (demostrado en BD real aislada)
🟢 Progreso real de usuario preservado (demostrado en BD real aislada)
🟢 Segunda ejecución idempotente (0 duplicados, 0 pérdidas)
🟢 Instalación limpia funciona de punta a punta (migración + seed)
🟢 Catálogo modificado manualmente corregido sin romper ID ni progreso
🟢 Registros retirados del catálogo: soft-disable, nunca borrado físico
🟢 `main` no usada como sandbox — integridad verificada sin drift
🟢 Guardrail parcial de Fase 20A retirado explícitamente (ya no es necesario)
🟢 Verificación técnica completa (prisma validate / tsc / eslint / vitest / build) — todo PASS

RIESGO 2 DE FASE 20B = 🟢 CERRADO DEFINITIVAMENTE
GO PARA PUBLICACIÓN = SÍ

DETENERSE.
NO COMMIT.
NO PUSH.
NO DEPLOY.

Siguiente y única fase: **FASE 21B — PUBLICAR SEED SEGURO DE REGULARIZACIÓN**
