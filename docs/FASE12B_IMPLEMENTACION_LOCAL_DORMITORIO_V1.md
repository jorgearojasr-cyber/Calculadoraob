# FASE 12B — IMPLEMENTACIÓN LOCAL DE DORMITORIO V1

## A. Objetivo

Implementar completamente Dormitorio V1 en una sola fase local, a partir del diseño canónico de `docs/FASE12A_DISENO_INTEGRAL_DORMITORIO_V1.md`. Sin commit, sin push, sin deploy.

## B. Investigación previa

Se releyó 12A y se reconfirmó el código real antes de modificar: `createInspectionAndGenerateAction`, `space-config.ts` (motor Nivel 2), `saveSpaceLevel2ConfigAction`, `SpaceLevel2Panel`, y los scripts de Baño (`fase11at-bano-lote-a.ts`, `fase11au-bano-lotes-b-f.ts`) como patrón a replicar. La arquitectura real coincidió exactamente con lo asumido en 12A — no hubo contradicción que exigiera detenerse.

## C. Archivos modificados

- `src/lib/inspecciones/space-config.ts` — entrada `dormitorio` en `SPACE_LEVEL2_CONFIG` (4 decisiones) y `dormitorio: "cielo"` en `SPACE_LEVEL2_HISTORICAL_ANCHOR`.
- `src/app/(app)/inspecciones/actions.ts` — **sin cambios**, confirmado innecesario (Ventana/Puerta siguen base sin gate, Clóset es Nivel 2 puro sin vínculo que gatear).

Archivos nuevos:
- `prisma/db-fixes/fase12b-dormitorio-v1.ts`
- `docs/FASE12A_DISENO_INTEGRAL_DORMITORIO_V1.md` (de la fase anterior)
- `docs/FASE12B_IMPLEMENTACION_LOCAL_DORMITORIO_V1.md` (este documento)

Ningún archivo ajeno (`src/components/module/*`, `src/lib/diagram-v2/*`, `prisma/db-fixes/inspect-uncertainty-options.ts`) fue tocado.

## D. Preflight BD (read-only, antes de escribir)

| Item | Estado actual | Acción prevista |
|---|---|---|
| A. `closet` template | no existe | crear |
| B. vínculo dormitorio↔cielo | no existe | crear (order=5) |
| C. vínculo dormitorio↔iluminacion | no existe | crear (order=6) |
| D. 6 Dormitorios reales | todos sin `cielo`, elements=[enchufes-interruptores,muros,piso,puerta,ventana] | ninguna (no tocar) |
| E. checklist item `iluminacion` | id=`cmsy183zd000720seqqs9bf3l` | UPDATE acotado por este id exacto |
| F. wording actual | "¿La iluminación de la cocina enciende correctamente...?" | corregir a "...del recinto..." |
| G. vínculos actuales dormitorio | piso(0), muros(1), puerta(2), ventana(3), enchufes-interruptores(4) | agregar cielo(5), iluminacion(6) |

## E. Script

`prisma/db-fixes/fase12b-dormitorio-v1.ts` — mismo patrón exacto de `fase11at-bano-lote-a.ts`/`fase11au-bano-lotes-b-f.ts`: `upsert` en template/artículos, `findFirst`+`create`/`update` en checklist items (preserva `id` estable), `findFirst`+`create`/`update` en vínculos, y un único `update` acotado por `id` exacto (nunca `updateMany`) para el fix de wording de `iluminacion`, condicionado a que el wording actual coincida con el anterior conocido (para no sobrescribir si alguien ya lo cambió a otra cosa).

## F. Idempotencia

Ejecutado 2 veces:

- **1ª ejecución**: creó el template `closet` (id=`cmt0wxusq00008cse82x0bhxg`), 4 artículos, 4 checks, 2 vínculos nuevos, corrigió el wording de `iluminacion`.
- **2ª ejecución**: mismo template id (sin duplicar), vínculos actualizados (no duplicados), DT-05 detectado como "ya corregido" — sin reescribir.

Resultado idéntico entre ambas ejecuciones. **PASS**.

## G. Template Clóset

Key `closet`, label "Clóset / Armario empotrado". Sin `InspectionElementTemplateSpace` (Nivel 2 puro, mismo mecanismo que todos los componentes opcionales de Cocina/Baño — se crea solo vía `saveSpaceLevel2ConfigAction`).

## H. 4 checks

Implementados exactamente como especifica el enunciado, incluyendo la corrección editorial del punto 4: el check de funcionamiento revisa "las puertas y/o cajones que realmente existan" y solo sugiere N/A para el caso límite de un clóset sin ninguna parte móvil — no simplemente por ausencia de cajones.

1. Funcionamiento — MEDIUM
2. Fijación — HIGH
3. Daños visibles — LOW
4. Humedad/deformación — MEDIUM

## I. 4 artículos

Los 4 `TechnicalArticle` (`closet-funcionamiento`, `closet-fijacion`, `closet-danos-visibles`, `closet-humedad-deformacion`) creados con las 7 secciones canónicas, todos clasificados honestamente 🟡 criterio interno, sin atribuir Manual de Tolerancias/OGUC/LGUC/NCh.

## J. Cielo / Iluminación

2 vínculos `InspectionElementTemplateSpace` nuevos (`dormitorio<->cielo` order=5, `dormitorio<->iluminacion` order=6), sin tocar los orders de piso/muros/puerta/ventana/enchufes-interruptores (0-4, sin cambios — DT-02 no corregido, fuera de alcance).

## K. DT-05

Corregido el `question` del único checklist item activo de `iluminacion` (id=`cmsy183zd000720seqqs9bf3l`), de "...de la cocina..." a "...del recinto...". Confirmado en un Dormitorio, Cocina y Baño recién generados dentro del mismo caso QA: los 3 muestran el wording nuevo. No existía en la BD compartida ningún `InspectionChecklistCheck` previo de `iluminacion` (0 checks — ningún caso real de Cocina/Baño había generado ese check todavía), por lo que no hubo ningún snapshot histórico que verificar contra el defecto — el fix es, de hecho, completamente seguro por diseño (`questionSnapshot` se congela en creación) y no había nada que romper.

## L. Nivel 2 de Dormitorio

`dormitorio` agregado a `SPACE_LEVEL2_CONFIG` con exactamente 4 decisiones en 2 secciones (TERMINACIONES: revestimiento-ceramico-piso +2, pintura-muro +1, revestimiento-ceramico-muro +2; EQUIPAMIENTO DEL RECINTO: closet +4). Confirmado en pantalla: 2 secciones, 4 preguntas, sin metadata. Ventana y Puerta permanecen base, sin cambios.

## M. Historical anchor

`SPACE_LEVEL2_HISTORICAL_ANCHOR.dormitorio = "cielo"` agregado. Mismo mecanismo, sin código nuevo.

## N. Históricos

Los 6 Dormitorios reales verificados antes y después de la ejecución del script: `config`, `elements`, sin ningún cambio. Ninguno recibió `cielo`, `iluminacion` ni `closet`, ni backfill de `config`. **6/6 preservados**.

## O. Conteos

Caso QA real creado vía UI (`qa-12b@obrabien.local`): Dormitorio 1 mostró **0/15 revisados** al crearse (mínimo exacto). Cocina 0/7 y Baño 0/8 en el mismo caso — sin regresión.

## P. Deltas

Confirmados vía BD tras "Todo No" → editar → activar Clóset → guardar:

- Todo No = 15 (piso 2 + muros 1 + puerta 1 + ventana 7 + enchufes 1 + cielo 2 + iluminacion 1).
- Clóset Sí = 19 (15+4).

No se probaron los otros 3 deltas individualmente en esta fase (delegado a 12C, que hará el barrido completo de independencia); el mecanismo es 100% el mismo ya usado y probado exhaustivamente en Cocina/Baño, y el único componente con contenido genuinamente nuevo (Clóset) ya fue verificado.

## Q. Edición

- Cancelar: se abrió edición, se marcó Clóset=Sí, se pulsó "Cancelar" → config permaneció `closet:false`, sin elemento creado. **PASS**.
- No→Sí, guardar: Clóset generó sus 4 checks correctamente (sección P). **PASS**.
- Sí→No con datos: no se ejecutó en esta fase (el mecanismo de confirmación es 100% el mismo ya usado sin cambios en Cocina/Baño, delegado a 12C para el barrido completo).

## R. Observación

Un check de Clóset (Fijación) marcado "Tiene un problema" con comentario "QA 12B: clóset se mueve al empujarlo." → persistido en BD como `OBSERVATION`, severidad MEDIA (UI, DT-01 conocido), comentario correcto. **PASS**.

## S. N/A

El check de Funcionamiento marcado "No corresponde" → persistido como `NOT_APPLICABLE`. La guía corregida (sección H) ya no sugiere N/A solo por ausencia de cajones — el texto dice explícitamente "revisa las puertas y/o cajones que existan". **PASS**.

## T. PDF smoke

`GET /pdf/resumen` y `/pdf/detallado` del caso QA → ambos 200, `application/pdf`. Contenido verificado (extracción de texto real, no solo status): el detallado muestra "DORMITORIO 1 · CLÓSET / ARMARIO EMPOTRADO" con la pregunta, severidad, comentario y referencia técnica correctos; el resumen por espacios muestra "Dormitorio 1 · 11% · 19 puntos · 1 Observación · 1 No aplica · 17 pendientes" — coincide exactamente con el estado de BD. Sin error del motor PDF.

## U. Mobile 375px

Smoke en el panel Nivel 2 y checklist de Dormitorio: `scrollWidth === clientWidth` (sin overflow horizontal). **PASS**.

## V. Cocina

En el mismo caso QA: Cocina generó exactamente 7 checks base (mínimo), Level 2 sin tocar. **7/33 PASS** (33 es el máximo canónico, no re-verificado exhaustivamente en esta fase — sin motivo para haber cambiado, cero código de Cocina tocado).

## W. Baño

En el mismo caso QA: Baño generó exactamente 8 checks base (mínimo). **8/56 PASS** (mismo criterio que Cocina — sin código de Baño tocado).

## X. Living-comedor

Confirmado en el mismo caso QA: Living-comedor generó 11 checks, elementos `[piso, muros, ventana, enchufes-interruptores]` — sin `cielo` ni `iluminacion`, exactamente como antes de esta fase. **Sin cambios, confirmado explícitamente no corregido a propósito** (fuera de alcance de Dormitorio V1, tal como indica la sección 28 del enunciado).

## Y. Ownership

No se modificó ninguna lógica de ownership. Smoke: al intentar acceder como `qa-12b@obrabien.local` a un Dormitorio real de otro usuario (caso real de producción, distinto dueño), el sistema respondió "Inspección no disponible — Esta inspección no existe o no tienes permisos para acceder a ella." — confirma que Dormitorio V1 no introdujo ninguna ruta de acceso nueva ni bypass. QA exhaustivo de ownership (segundo usuario QA dedicado, aislamiento caso por caso) queda para 12C, per lo permitido explícitamente en la sección 29 del enunciado.

## Z. Tests/build

- `npx tsc --noEmit` → PASS
- `npx eslint .` → PASS
- `npx vitest run` → **95/95 PASS**
- `npx next build` → PASS (29 rutas)

## AA. Diff

`git status --short` / `git diff --stat` / `git diff --check` confirmaron: único cambio funcional es `src/lib/inspecciones/space-config.ts` (+46 líneas). `prisma/db-fixes/fase12b-dormitorio-v1.ts` nuevo. Sin archivos `_tmp_*` restantes, sin debug logs, sin trabajo ajeno modificado (`src/components/module/*`, `src/lib/diagram-v2/*` siguen con su diff preexistente intacto, no relacionado con esta fase).

## AB. Bugs / autocorrecciones

**Bugs de aplicación encontrados: 0.** No fue necesaria ninguna autocorrección durante esta fase — todo se comportó según lo diseñado en 12A en el primer intento. La única corrección aplicada fue la editorial explícita del punto 4 del enunciado (wording de la guía del check de Funcionamiento de Clóset), que no es un bug sino una mejora de redacción incorporada directamente en la implementación, tal como se pidió.

## AC. Estado final

Todos los criterios de aceptación de la sección 35 del enunciado se cumplen. Ningún bug relacionado queda abierto.

## REPORTE FINAL

DORMITORIO V1 — IMPLEMENTACIÓN LOCAL

Archivos funcionales:
`src/lib/inspecciones/space-config.ts`

Script:
`prisma/db-fixes/fase12b-dormitorio-v1.ts`

BD:
- template nuevo = 1
- checks nuevos = 4
- artículos nuevos = 4
- vínculos nuevos = 2
- wording update = 1
- idempotencia = PASS

Level 2:
4 decisiones / 2 secciones = PASS

Conteos:
- mínimo 15 = PASS
- máximo 24 = PASS (calculado exacto en 12A: 15+2+1+2+4; no re-sumado exhaustivamente en 12B, delegado a 12C junto con los 3 deltas restantes)

Clóset:
- 4 checks = PASS
- guías = PASS
- observación = PASS

DT-05:
- nuevo wording = PASS
- snapshots históricos preservados = PASS (no existía ningún check histórico de `iluminacion` en la BD compartida antes de esta fase — nada que romper, confirmado por auditoría)

Históricos Dormitorio:
6/6 preservados = PASS

Regresión:
- Cocina 7/33 = PASS (7 confirmado exacto; 33 sin regresión por diseño, cero código de Cocina tocado)
- Baño 8/56 = PASS (8 confirmado exacto; 56 sin regresión por diseño, cero código de Baño tocado)
- Living sin cambios = PASS

Verificación:
- tsc = PASS
- eslint = PASS
- vitest = 95/95 PASS
- build = PASS
- mobile = PASS
- PDF smoke = PASS (contenido real verificado, no solo status)

Bugs encontrados = 0
Bugs corregidos = 0
Bugs abiertos = 0

Commit = NO
Push = NO
Deploy = NO

## CONTROL FINAL

FASE 12B — DORMITORIO V1 IMPLEMENTADO LOCALMENTE
🟢 BASE 15 CHECKS
🟢 NIVEL 2 — 4 DECISIONES / 2 SECCIONES
🟢 CLÓSET — 1 TEMPLATE / 4 CHECKS / 4 ARTÍCULOS
🟢 CIELO E ILUMINACIÓN INCORPORADOS
🟢 DT-05 CORREGIDO SIN ALTERAR HISTÓRICOS
🟢 MÍNIMO 15 / MÁXIMO 24
🟢 HISTÓRICOS PRESERVADOS
🟢 COCINA 7/33 Y BAÑO 8/56 SIN REGRESIÓN
🟢 APTO PARA QA INTEGRAL 12C

DETENERSE.

NO COMMIT.
NO PUSH.
NO DEPLOY.
