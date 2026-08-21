# FASE 18A — CIERRE DE DEUDAS TRANSVERSALES DT-01 + DT-02 + DT-03

## Preflight

`git status --short` / `git diff --stat` / `git diff --check`: limpio salvo el trabajo ajeno ya conocido (componentes de módulo, diagram-v2, docs de fases anteriores sin commitear) — nada de eso se toca ni se incluye en el alcance de esta fase.

## Baseline BD pre-fase (BASELINE_PRE_18A)

Lectura read-only (`prisma/db-fixes/_tmp_18a_baseline.ts`, eliminado al cierre): `InspectionCase=5`, `InspectionSpace=34`, `InspectionElement=144`, `InspectionChecklistCheck=260`, `InspectionSpaceTemplate=16`, `InspectionElementTemplate=32`, `InspectionChecklistItem=93`, `TechnicalArticle=91`, `InspectionElementTemplateSpace=77` — idéntico al cierre de 17B.

Backup Neon confirmado disponible sin cambios: `pre-15b-healthy-20260820` (`br-hidden-night-aciqyz9o`, `ready`). No se investigó el incidente Neon de 15A exhaustivamente (fuera de alcance explícito de esta fase) — solo se confirmó ausencia de recurrencia.

---

## DT-01 — Severidad siempre inicia en "Media"

### Diagnóstico

Cadena completa de la causa, de la vista hacia la BD:

1. [checklist-item-row.tsx:818](src/components/inspecciones/checklist-item-row.tsx) (antes del fix) — `ObservationForm` inicializaba `useState<InspectionSeverity>(initial?.severity ?? "MEDIUM")`, sin ningún valor de catálogo disponible como segundo fallback.
2. `ObservationForm` y `ChecklistItemRow` no declaraban ningún prop `defaultSeverity` en su firma.
3. [element-checklist-group.tsx](src/components/inspecciones/element-checklist-group.tsx) — `ElementChecklistData.checks[]` no incluía `defaultSeverity`.
4. [\[id\]/page.tsx](src/app/(app)/inspecciones/[id]/page.tsx) — la raíz real del problema: el `select` de `checklistItem` en la query Prisma NO traía `defaultSeverity` desde la BD, y el mapeo del check hacia `<SpaceDetailView>` tampoco lo incluía.

Es decir, el valor ni siquiera se leía de la base de datos — se perdía en la capa de datos, no en la UI.

### Corrección

- `page.tsx`: se agrega `defaultSeverity: true` al `select` de `checklistItem`, y `defaultSeverity: c.checklistItem.defaultSeverity` al objeto de check mapeado.
- `element-checklist-group.tsx`: se agrega `defaultSeverity: InspectionSeverity | null` al tipo `ElementChecklistData.checks[]`, y se pasa a `<ChecklistItemRow>`.
- `checklist-item-row.tsx`: `ChecklistItemRow` y `ObservationForm` ahora reciben `defaultSeverity` y lo propagan en los 4 sitios donde se invoca `<ObservationForm>`.
- Se extrajo la lógica de fallback a una función pura testeable: [`resolveInitialSeverity`](src/lib/inspecciones/severity.ts) — `initial?.severity ?? defaultSeverity ?? "MEDIUM"`. "Media" queda solo como último fallback para el caso real (permitido por el esquema) en que el checklist item tampoco declara un `defaultSeverity` (p. ej. piso/muros/ventana/puerta, que hoy tienen `defaultSeverity: null`).
- Un hallazgo YA GUARDADO nunca se resetea: `initial?.severity` siempre gana sobre `defaultSeverity` cuando existe.

### Tests

[`src/lib/inspecciones/severity.test.ts`](src/lib/inspecciones/severity.test.ts) — 3 casos: severidad guardada respetada ignorando el default; hallazgo nuevo usa el default del catálogo; fallback final a "Media" solo cuando no hay ninguno de los dos.

### QA manual (caso real, `main`, ver sección QA global)

Confirmado en el navegador contra `main`: al marcar "Tiene un problema" en un check de Baranda (`defaultSeverity: HIGH`), el selector abre en **Alta**, no en Media. Al editar manualmente a **Baja** y guardar, la BD persiste `LOW`; al reabrir el formulario de edición, el selector muestra **Baja** (no se resetea a Alta). Confirmado también en BD directamente (`InspectionObservation.severity`).

---

## DT-02 — `order` de elementos base no determinista

### Diagnóstico

- `InspectionElement.order` existe en el esquema (`Int @default(0)`), y `InspectionElementTemplateSpace.order` es la fuente de verdad real por catálogo (`docs/FASE11AB...`, ya usada correctamente por `saveSpaceLevel2ConfigAction` en `[id]/actions.ts` desde Fase 11AB).
- La generación de elementos BASE en [actions.ts](src/app/(app)/inspecciones/actions.ts) (`createInspectionAndGenerateAction`) consulta `elementLinks` ordenados por `order: "asc"` correctamente, pero al crear cada `InspectionElement` **nunca copiaba `link.order`** — el `create` quedaba siempre en el default de esquema (`0`).
- Auditoría read-only confirmó el efecto real en producción: `InspectionElement.order` distribution: **134 de 144 elementos en `order=0`**; solo 10 (los generados vía Nivel 2, que sí propaga `order`) tenían valores distintos de 0.
- Auditoría de `InspectionElementTemplateSpace.order` (la fuente de verdad) en los 15 recintos activos: **0 empates** — el catálogo en sí es perfectamente determinista, el problema era exclusivamente la propagación al crear.

### Corrección

- [actions.ts](src/app/(app)/inspecciones/actions.ts): `tx.inspectionElement.create` ahora incluye `order: link.order`. No se migra ningún elemento histórico ya creado (siguen en `order=0`, tal como estaban).
- Tie-breaker defensivo para elementos históricos: `orderBy` de `elements` cambia de `{ order: "asc" }` a `[{ order: "asc" }, { id: "asc" }]` en los 3 lugares donde se lee la lista de elementos de un espacio para mostrar/exportar: [\[id\]/page.tsx](src/app/(app)/inspecciones/[id]/page.tsx), [\[id\]/resumen/page.tsx](src/app/(app)/inspecciones/[id]/resumen/page.tsx) y [inspecciones-report.ts](src/lib/inspecciones-report.ts) (PDF). `id` (cuid, creado secuencialmente) desempata sin necesidad de migrar ninguna fila — los elementos históricos en `order=0` quedan ordenados por su orden real de creación.

### Tests

No se agregó un test automatizado dedicado para este DT: el fix es una propagación de un único campo dentro de un server action grande (sesión, transacción, blob storage), y su verificación real requiere una base de datos — se cubrió con la auditoría read-only (arriba) más QA manual end-to-end contra `main` (ver abajo), que es más representativo que un mock aislado. Se evitó un test decorativo.

### QA manual (caso real, `main`)

Caso QA creado con Cocina/Dormitorio/Baño/Living-comedor/Bodega/Terraza/Logia. Lectura directa en BD del `order` de los elementos de Bodega: `bodega(0), piso(1), muros(2), cielo(3), enchufes-interruptores(4), iluminacion(5)` — coincide EXACTO con `InspectionElementTemplateSpace.order` del catálogo. Confirmado también en el resto de los espacios del caso (Cocina, Dormitorio, Baño, Living-comedor, Terraza, Logia) — 100% coincidencia catálogo↔BD, sin empates ni ceros.

---

## DT-03 — `seed-inspecciones.ts` desactualizado

### Diagnóstico

El seed no se había vuelto a tocar desde aproximadamente Fase 11AH (Cocina Lote E). Comparación read-only campo a campo contra el catálogo real de producción:

| Tabla | Seed (antes) | Producción real | Faltante |
|---|---|---|---|
| `InspectionSpaceTemplate` | 16 | 16 | — (coincidía) |
| `InspectionElementTemplate` | 20 | 32 | 12 (baranda, lavadero, closet, conexion-lavadora, extractor-aire, wc, lavamanos, ducha, mampara, tina, mueble-bano, cubierta-bano) |
| `InspectionElementTemplateSpace` | 33 | 77 | 44 (cielo/iluminación en casi todos los recintos, bodega/estacionamiento/antejardín/acceso-vehicular expandidos, logia-lavanderia completo, etc.) |
| `InspectionChecklistItem` | ~30 | 93 | ~63 |
| `TechnicalArticle` | 16 | 91 | 75 |

Una instalación nueva (`migrate` + `seed`) habría quedado con un catálogo muy por debajo del real, sin ningún error visible (el seed corría sin fallar, solo generaba menos).

### Corrección

Se regeneró el seed completo **desde el catálogo real de producción** (lectura read-only, sin tocar ninguna tabla transaccional), preservando exactamente el mismo patrón idempotente (upsert por `key`/`slug`) ya usado desde el seed original — ver [prisma/seed-inspecciones.ts](prisma/seed-inspecciones.ts). No se auditaron operaciones destructivas nuevas: el archivo regenerado usa exclusivamente `upsert`/`findFirst`+`update`/`create`, igual que el original; ninguna tabla de caso/espacio/observación se referencia.

### Aislamiento de prueba (Neon)

- Rama temporal creada desde `main`: `qa-dt03-seed-20260820` (`br-dark-leaf-ac149y9i`) — explícitamente NO se probó contra `main`, y explícitamente NO se reutilizó `pre-15b-healthy-20260820`.
- **Pase 1**: `Seed de Inspecciones completado: 16 espacios, 32 elementos, 77 vínculos espacio-elemento, 93 preguntas, 91 artículos técnicos.`
- **Pase 2** (misma rama, inmediatamente después): idénticos 16/32/77/93/91 — sin duplicados, sin errores.
- **Comparación semántica campo a campo** contra `main` (script ad-hoc, no solo conteos): `spaces`, `elements`, `links` (con su `order`), `items` (con `order`/`defaultSeverity`/`technicalArticleSlug`/`active`) y `articles` (con `title`/`content` completo) — **0 diferencias, 0 duplicados** en las 5 tablas.
- Rama `qa-dt03-seed-20260820` **eliminada** al terminar la prueba. `pre-15b-healthy-20260820` confirmado intacto (`ready`, sin restaurar/resetear).

### Tests

[`prisma/seed-inspecciones.test.ts`](prisma/seed-inspecciones.test.ts) — 5 casos contra un Prisma fake (sin BD real), enfocados en el tipo de error que causó el desfase original (fila duplicada o mal referenciada al editar el seed a mano), no en repetir la prueba de idempotencia real ya hecha en Neon:
- 0 vínculos espacio-elemento duplicados en un pase.
- 0 checklist items duplicados (mismo elemento + misma pregunta) en un pase.
- 0 slugs de artículo técnico duplicados en un pase.
- Integridad referencial: ningún link/checklistItem referencia un `key` que no haya sido sembrado en su propio catálogo (el fake lanza si ocurre).
- Idempotencia estructural: un segundo pase no crea ningún checklist item nuevo, solo actualiza los ya existentes (conteo de `create` no crece).

---

## Implementación combinada

Los 3 fixes se implementaron juntos en una sola pasada de edición (sección 23 de la fase), sin sub-fases intermedias:

- [src/app/(app)/inspecciones/\[id\]/page.tsx](src/app/(app)/inspecciones/[id]/page.tsx) — DT-01 (query + mapeo) y DT-02 (tie-breaker de `orderBy`).
- [src/app/(app)/inspecciones/\[id\]/resumen/page.tsx](src/app/(app)/inspecciones/[id]/resumen/page.tsx) — DT-02 (tie-breaker).
- [src/lib/inspecciones-report.ts](src/lib/inspecciones-report.ts) — DT-02 (tie-breaker, PDF).
- [src/app/(app)/inspecciones/actions.ts](src/app/(app)/inspecciones/actions.ts) — DT-02 (propagación real de `order`).
- [src/components/inspecciones/element-checklist-group.tsx](src/components/inspecciones/element-checklist-group.tsx) — DT-01 (tipo + prop).
- [src/components/inspecciones/checklist-item-row.tsx](src/components/inspecciones/checklist-item-row.tsx) — DT-01 (props + fix del `useState`).
- [src/lib/inspecciones/severity.ts](src/lib/inspecciones/severity.ts) (nuevo) — DT-01 (función pura testeable).
- [prisma/seed-inspecciones.ts](prisma/seed-inspecciones.ts) — DT-03 (regenerado completo).

## Verificación técnica

`npx tsc --noEmit` → PASS. `npx eslint .` → PASS. `npx vitest run` → **103/103 PASS** (95 previos + 8 nuevos: 3 de `severity.test.ts`, 5 de `seed-inspecciones.test.ts`). `npx next build` → PASS (29 rutas).

## QA de regresión (caso real contra `main`, usuario `qa-18a@obrabien.local`)

Caso "QA 18A Casa Global": Cocina + Dormitorio + Baño + Living-comedor + Bodega + Terraza + Logia/Lavandería. Mínimos confirmados exactos vía UI: `0/61` (7+15+8+14+8+2+7), sin regresión respecto a los mínimos ya conocidos de 17B.

- **DT-02**: `order` de Bodega en BD = `bodega(0), piso(1), muros(2), cielo(3), enchufes(4), iluminacion(5)` — exacto respecto al catálogo. Mismo resultado en los demás recintos del caso.
- **Nivel 2 / Terraza**: se activó Baranda vía configuración Nivel 2 — Muros/Ventana confirmados que siguen SIN activarse por defecto (siguen gateados, sin regresión de Fase 17). Baranda generó sus 3 checks correctamente (`0/5` total en el espacio).
- **DT-01**: al marcar "Tiene un problema" en un check de Baranda (`defaultSeverity: HIGH`), el selector abrió en **Alta**. Guardado con comentario → persistido en BD como `HIGH`. Editado manualmente a **Baja** → persistido como `LOW`; reabrir el formulario de edición muestra **Baja**, confirmando que no se resetea al default del catálogo.
- **PDF**: `GET /api/inspecciones/{id}/pdf/detallado` → `200`, `application/pdf`, 28174 bytes — sin errores de generación con las queries corregidas (mismo patrón de `orderBy` ya verificado en la vista principal).
- **Mobile**: no aplica — DT-01/DT-02 son cambios de lógica de datos, no de layout; no se modificó ningún componente visual.
- **Históricos**: no se tocó ningún elemento/caso histórico — el fix de `order` solo afecta creación nueva (no hay migración retroactiva); confirmado que `BASELINE_PRE_18A` se mantiene idéntico antes y después de toda la fase.

## Limpieza QA

Caso y usuario `qa-18a@obrabien.local` eliminados en cascada (foto-blobs best-effort + `InspectionCase.delete`). Rama Neon `qa-dt03-seed-20260820` eliminada. Todos los scripts temporales (`prisma/db-fixes/_tmp_18a_*.ts`) eliminados. `pre-15b-healthy-20260820` confirmado intacto.

## Control de integridad final

Misma lectura de `BASELINE_PRE_18A`, tras toda la fase (incluida la limpieza QA): `InspectionCase=5`, `InspectionSpace=34`, `InspectionElement=144`, `InspectionChecklistCheck=260`, catálogo `16/32/93/91/77` — **idéntico en todos los conteos. Integridad final: PASS.**

## Estado de las deudas transversales

| Deuda | Estado |
|---|---|
| DT-01 (severidad forzada a Media) | 🟢 Corregida y QA aprobado |
| DT-02 (`order` no determinista) | 🟢 Corregida y QA aprobado |
| DT-03 (seed desactualizado) | 🟢 Corregida y QA aprobado (idempotencia + comparación semántica en rama aislada) |
| DT-04 (0 referencias visuales) | 🟠 Pendiente — explícitamente fuera de alcance de esta fase |

## GO / NO-GO

Todos los criterios de la fase se cumplieron: diagnóstico completo antes de implementar, implementación combinada, pruebas focalizadas (no decorativas), prueba de seed 100% aislada de `main` y de `pre-15b-healthy-20260820`, comparación semántica campo a campo, QA de regresión end-to-end sin hallazgos, integridad de BD verificada pre/post en todo momento.

**GO PARA PUBLICACIÓN = SÍ**

## CONTROL FINAL

FASE 18A — DT-01 / DT-02 / DT-03 CORREGIDAS Y QA APROBADO
🟢 DT-01 CORREGIDA (severidad respeta el catálogo y las ediciones manuales)
🟢 DT-02 CORREGIDA (`order` determinista en la generación + tie-breaker en lectura)
🟢 DT-03 CORREGIDA (seed regenerado desde catálogo real, idempotente, verificado en rama aislada)
🟢 TESTS AUTOMATIZADOS AGREGADOS (103/103 PASS)
🟢 SEED PROBADO EN RAMA NEON AISLADA, NUNCA CONTRA MAIN
🟢 COMPARACIÓN SEMÁNTICA CATÁLOGO = 0 DIFERENCIAS
🟢 QA DE REGRESIÓN SIN HALLAZGOS
🟢 INTEGRIDAD DE BD VERIFICADA (PRE = POST)
🟢 LIMPIEZA QA Y RAMA TEMPORAL COMPLETADAS

🟠 DT-04 REFERENCIAS VISUALES — PENDIENTE

GO PARA PUBLICACIÓN = SÍ

DETENERSE.

NO COMMIT. NO PUSH. NO DEPLOY.
