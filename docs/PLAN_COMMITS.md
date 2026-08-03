# Plan de Commits — Estabilización del repositorio

**Fecha:** 03-ago-2026
**Estado:** Propuesta. **Ningún commit ejecutado todavía**, por instrucción explícita.

---

## Contexto

`git status` muestra que **todo el trabajo desde el commit `b45776a`** (inclusive posterior) sigue sin confirmar — no solo la auditoría V1.1. Hay al menos 3 cuerpos de trabajo previos, también pendientes:

1. Cierre de la migración a Diagram System V2.
2. Consolidación del framework de módulos (`module-visual-config.ts`, `dimension-utils/`, Fase 4 del rediseño de flujo, 2026-08-02).
3. Modelo de tres ejes para el checklist de documentos de Regularización (Fase 2 del Informe de Evaluación Preliminar).

Por eso el plan tiene **7 commits**, no 4 — los 4 que propusiste como ejemplo están incluidos, en el orden 4 a 7.

## Nota sobre archivos "cruzados"

Algunos archivos (`module-wizard.tsx`, `question-step.tsx`, `result-screen.tsx`, `schema.prisma`, `foundation-step.tsx`, `module-visual-config.ts`) acumulan cambios de **más de una** de estas iniciativas en el mismo diff de working tree — git no los separa solo, hay que decidir. Para cada uno indico:
- si su diff está limpio (100% de un solo tema, verificado leyendo el diff real), o
- si mezcla temas y a qué commit lo asigné por practicidad, con la opción de separarlo con `git add -p` (staging parcial por hunk) si prefieres precisión quirúrgica en vez de agruparlo.

---

## Commit 1 — Diagram System V2 (cierre de migración)

**Archivos:**
- `src/lib/diagram-v2/DiagramV2.tsx`
- `src/lib/diagram-v2/math/solids.ts`
- `src/lib/diagram-v2/render/shape-2d.tsx`
- `src/lib/diagram-v2/render/solid-3d.tsx`
- `src/lib/diagram-v2/render/theme.ts`
- `docs/framework-visual-auditoria-cierre.md`

**Objetivo:** cerrar la migración al lenguaje visual V2 (congelado y aprobado según las notas del proyecto) — todos los módulos con diagrama ya renderizan con este sistema.

**Mensaje sugerido:**
```
feat(diagram-v2): completar migración al lenguaje visual V2

Todos los módulos con diagrama (rect2d/circle2d/box/cylinder/steppedBox)
renderizan con el sistema V2 — lenguaje visual congelado y aprobado.
```

---

## Commit 2 — Consolidación del framework de módulos (Fase 4, 02-ago-2026)

**Archivos (diff verificado limpio, sin mezcla con otros temas):**
- `src/components/module/module-visual-config.ts` (nuevo — registro único de configuración visual)
- `src/components/module/dimension-utils/` (nuevo dir — parsing/validation/units/area/formatting)
- `src/components/module/question-group-step/` (nuevo dir, reemplaza el archivo plano de abajo)
- `src/components/module/question-group-step.tsx` (**eliminar** — reemplazado por el directorio)
- `src/components/module/result-hero.tsx` (nuevo)
- `src/components/module/live-summary-panel.tsx` (nuevo)
- `src/components/module/foundation-step.tsx` (nuevo — creación base; ver nota abajo, este archivo también recibió `focusFieldKey` de BUG-003 más tarde, sin punto de corte posible por ser 100% no comiteado)
- `src/components/module/types.ts`
- `src/components/module/area-input-toggle.tsx`
- `src/components/module/image-option-card.tsx`
- `src/components/module/priced-results.tsx`
- `src/components/module/wizard-header.tsx`
- `prisma/seed.ts`
- `prisma/seed-radier.ts`
- `prisma/seed-concrete-mix-ratio.ts` (nuevo)
- `prisma/migrations/20260802041327_add_concrete_mix_ratio/`
- `prisma/migrations/20260802043802_add_question_option_numeric_value/`
- `src/app/admin/modulos/[id]/preview/page.tsx`
- `prisma/schema.prisma` — **⚠️ parcial**: mezcla los modelos `ConcreteMixRatio`/`QuestionOption.numericValue` (este tema) con el modelo de 3 ejes de Regularización (Commit 3). Requiere `git add -p` para separar los 2 bloques de hunks antes de comitear ambos por separado.

**Objetivo:** consolida configuración visual y utilidades de dimensión que antes vivían dispersas en varios componentes, en un registro único; agrega Fundación como componente propio (geometría de 2 secciones); agrega soporte de dosificación de hormigón por grado y valores numéricos en opciones SELECT (para que el motor de diagramas dibuje dimensiones elegidas de una lista fija).

**Mensaje sugerido:**
```
refactor(module): consolidar module-visual-config y dimension-utils

Registro único de configuración visual por módulo (antes disperso),
utilidades de dimensión compartidas, componente propio para Fundación,
y soporte de dosificación de hormigón + valores numéricos de opciones.
```

---

## Commit 3 — Regularización: modelo de tres ejes (Fase 2 del informe)

**Archivos (diff verificado limpio):**
- `prisma/seed-regularization.ts`
- `src/lib/regularization-documents.ts`
- `src/lib/regularization-document-labels.ts` (nuevo)
- `src/lib/regularization-pdf.tsx`
- `src/lib/regularization-sketch.ts`
- `src/components/regularization/avaluo-fiscal-gate.tsx`
- `src/components/regularization/regularization-document-checklist-view.tsx`
- `src/components/regularization/regularization-wizard.tsx`
- `src/app/api/regularizacion/[id]/pdf/route.ts`
- `prisma/migrations/20260802200000_regularization_document_three_axis_model/`
- `docs/regularizacion-auditoria-funcional-normativa-ux.md`
- `docs/regularizacion-revision-normativa.md`
- `prisma/schema.prisma` — **⚠️ parcial**, ver nota en Commit 2 (mismo archivo, hunks distintos).

**Objetivo:** reemplaza el booleano plano `obligatorio` del checklist de documentos por un modelo de 3 ejes independientes (obligatoriedad/origen/momento/soporte ObraBien), permitiendo que un documento sea, por ejemplo, mínimo y aportado por el usuario a la vez — dos ejes distintos que antes no se podían representar por separado.

**Mensaje sugerido:**
```
feat(regularizacion): modelo de tres ejes para checklist de documentos

Reemplaza el booleano `obligatorio` por 4 ejes independientes
(obligatoriedad/origen/momento/soporte ObraBien) — Fase 2 del Informe
de Evaluación Preliminar.
```

---

## Commit 4 — V1.1: Cierre de auditoría funcional (BUG-001 a BUG-011 + UX-001)

**Archivos con diff limpio (100% de este tema, verificado):**
- `src/components/home/exploration-toggle.tsx` (BUG-001)
- `src/components/home/search-bar.tsx` (BUG-011)
- `src/components/module/preselected-confirmation.tsx` (nuevo — UX-001)
- `src/components/module/wizard-draft.ts` (nuevo — BUG-007)
- `src/components/module/wizard-resume-gate.tsx` (nuevo — BUG-007)

**Archivos cruzados (⚠️ ver nota general arriba — asignados acá por ser donde vive la mayoría del cambio de esta etapa; su diff completo incluye también los ajustes del Commit 5, sprint piscina, sobre el mismo archivo):**
- `src/components/module/module-wizard.tsx` — BUG-003 (`focusFieldKey`), BUG-007 (integración `wizard-draft`), BUG-006 (limpieza de error). *Su diff en disco también contiene `planContext.nextPhase` del Commit 5 — no hay corte limpio sin `git add -p`.*
- `src/components/module/question-step.tsx` — BUG-006, UX-001 (`preselectedConfirmation`).
- `src/components/module/foundation-step.tsx` — su creación va en el Commit 2; el único cambio de BUG-003 acá es el prop `focusFieldKey`, no separable sin `git add -p` por ser archivo nunca comiteado.
- `src/lib/auth.ts` — **no**, este va al Commit 6, no acá (ver abajo).

**Objetivo:** corrige los 11 hallazgos de la auditoría funcional del 02-ago-2026 (bugs de datos, validación en vivo, foco de campos, persistencia de progreso) y cierra BUG-004 como hipótesis descartada, dando origen a UX-001.

**Mensaje sugerido:**
```
fix(v1.1): cerrar auditoría funcional — BUG-001 a BUG-011

Corrige 10 hallazgos de la auditoría del 02-ago-2026 (BUG-001, 002, 003,
005, 006, 007, 008, 009, 010, 011) y cierra BUG-004 como hipótesis
descartada tras verificación (dio origen a UX-001, ver docs).
```

---

## Commit 5 — Sprint UX: Proyecto "Construir una piscina"

**Archivos con diff limpio:**
- `src/lib/plan-shape.ts` (nuevo)
- `prisma/db-fixes/` (scripts conservados — helpText de terreno, paridad de retiro en camión)

**Archivos cruzados (⚠️ mismos de arriba — su diff completo se comitea acá, arrastrando también los cambios del Commit 4 sobre el mismo archivo, si se optó por no usar `git add -p`):**
- `src/app/(app)/categorias/[slug]/[moduleSlug]/page.tsx` — `resolveNextPhase`.
- `src/app/(app)/plan/[slug]/page.tsx` — usa `SHAPE_LABELS` compartido.
- `src/components/module/result-screen.tsx` — botón "Continuar con: fase siguiente".
- `src/components/module/module-visual-config.ts` — groupHelpText consistente en excavación (este archivo se CREA en el Commit 2; este cambio es posterior, mismo caso de archivo nunca comiteado).

**Objetivo:** 4 mejoras UX en el proyecto de fases: explicación de tipo de terreno, consistencia hoyo-vs-piscina, supuesto de camión visible + paridad circular, y botón "Continuar con la siguiente fase" como acción principal al cerrar una fase.

**Mensaje sugerido:**
```
feat(piscina): sprint UX — continuidad entre fases y transporte

Explica el efecto del tipo de terreno, unifica la aclaración
hoyo-vs-piscina entre variantes, muestra el supuesto de capacidad de
camión (con paridad circular/rectangular), y agrega "Continuar con la
siguiente fase" como acción principal al cerrar una fase de un plan.
```

---

## Commit 6 — Hotfix autenticación (Hallazgo #1)

**Archivos:**
- `src/lib/auth.ts`
- `docs/AUTH_HOTFIX_AUDITORIA.md`

**Objetivo:** normaliza el email (`.trim().toLowerCase()`) en el login por credenciales, igual que ya hacía el registro — corrige que un email con cualquier mayúscula no pudiera autenticarse (incluido el auto-login inmediato tras registrarse, que fallaba siempre).

**Mensaje sugerido:**
```
fix(auth): normalizar email a minúsculas en login por credenciales

authorize() no normalizaba el email antes de buscar el usuario,
a diferencia del registro — un email con cualquier mayúscula
(común por autocompletado) no podía iniciar sesión, incluido el
auto-login inmediato tras registrarse.
```

---

## Commit 7 — Documentación y estado del proyecto

**Archivos:**
- `docs/BACKLOG_MASTER.md`
- `docs/ROADMAP.md`
- `docs/CHANGELOG.md`
- `docs/PRODUCT_DECISIONS.md`
- `docs/RELEASE_NOTES.md`
- `docs/PROJECT_STATUS.md`
- `docs/AUDIT_V1_1_CLOSURE.md`
- `docs/piscina-fases-ux-analisis.md`
- `docs/calculadoras-rediseno-ux-auditoria.md`
- `docs/calculadoras-rediseno-ux-plan.md`
- `docs/home-especificacion-ui-auditoria.md`
- `docs/home-rediseno-ux.md`
- `docs/PLAN_COMMITS.md` (este documento)
- `reiniciar-servidor.bat` (utilidad de desarrollo — el ciclo stop/rm .next/start documentado durante toda la sesión)

**Objetivo:** deja registrado el proceso de trabajo completo (backlog, roadmap, decisiones de producto, notas de release, estado ejecutivo del proyecto) y los análisis/especificaciones que respaldan el código ya comiteado en los commits 1-6.

**Mensaje sugerido:**
```
docs: backlog, roadmap y cierre de auditoría V1.1

Registra el proceso completo de la auditoría V1.1 (backlog, roadmap,
release notes, decisiones de producto, informe de cierre) y las
especificaciones/análisis de UX que respaldan el trabajo de los
commits anteriores.
```

---

## Resumen y decisión pendiente

| # | Commit | Archivos propios (sin mezcla) | Archivos cruzados |
|---|---|---|---|
| 1 | Diagram System V2 | 6 | 0 |
| 2 | Framework de módulos | 15 | 1 (`schema.prisma`, parcial) |
| 3 | Regularización 3 ejes | 12 | 1 (`schema.prisma`, parcial) |
| 4 | V1.1 auditoría | 5 | 3 (`module-wizard.tsx`, `question-step.tsx`, `foundation-step.tsx`) |
| 5 | Sprint piscina | 2 | 4 (`categorias/.../page.tsx`, `plan/[slug]/page.tsx`, `result-screen.tsx`, `module-visual-config.ts`) |
| 6 | Hotfix auth | 2 | 0 |
| 7 | Documentación | 14 | 0 |

**Necesito que decidas antes de ejecutar:**
1. **`schema.prisma`** (Commits 2 y 3): ¿lo separo con `git add -p` en 2 hunks, o lo comiteo completo en uno solo de los dos (por ejemplo el Commit 3, más reciente) para simplificar?
2. **`module-wizard.tsx`, `question-step.tsx`, `foundation-step.tsx`** (Commits 4 y 5 comparten estos): ¿los dejo completos en el Commit 5 (el más reciente que los toca), o inviertes el tiempo en separarlos con `git add -p`?

Si prefieres simplicidad, la alternativa más simple y honesta es fusionar los Commits 4 y 5 en uno solo ("V1.1 + Sprint Piscina"), ya que de todos modos comparten los archivos más importantes del cambio. Quedo a la espera de tu decisión antes de ejecutar cualquier commit.
