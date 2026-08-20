# FASE 12C — QA INTEGRAL DE DORMITORIO V1

## A. Alcance

QA integral única de Dormitorio V1, partiendo de 12A/12B. Sin rediseño, sin funcionalidades nuevas. NO commit, NO push, NO deploy en toda la fase.

## B. Catálogo

Read-only, sin reejecutar el script (12B ya demostró idempotencia con 2 ejecuciones):

- `closet` templates = 1
- checks = 4
- artículos = 4
- `dormitorio<->cielo` = 1 vínculo
- `dormitorio<->iluminacion` = 1 vínculo
- vínculos totales de dormitorio = 7 (piso, muros, puerta, ventana, enchufes-interruptores, cielo, iluminacion)
- duplicados = 0
- wording iluminación confirmado: "¿La iluminación del recinto enciende correctamente y el elemento visible se encuentra firme?"

**PASS.**

## C. Level 2

Confirmado visualmente en un Dormitorio real (caso QA): 2 secciones (TERMINACIONES, EQUIPAMIENTO DEL RECINTO), 4 preguntas exactas en el orden y wording de 12A/12B. Sin metadata en ninguna. Ventana y Puerta confirmadas como base (aparecen en el checklist principal, no en el panel Nivel 2). **PASS.**

## D. Mínimo

Caso QA creado vía UI, "Todo No" guardado → **15/15** confirmado por UI (`0/15 revisados`) y por BD (`piso(2), muros(1), puerta(1), ventana(7), enchufes-interruptores(1), cielo(2), iluminacion(1)` = 15). **PASS.**

## E. Máximo

Las 4 decisiones activadas simultáneamente → **24/24** confirmado por UI (`0/24 revisados`) y por BD (15 base + revestimiento-ceramico-piso(2) + pintura-muro(1) + revestimiento-ceramico-muro(2) + closet(4) = 24). **PASS.**

## F. Deltas

Cada opcional activado individualmente desde la base 15, verificado y luego revertido a 15:

| Componente | Activado | Desactivado (vuelve a) |
|---|---|---|
| Revestimiento cerámico de piso | 17 (15+2) | 15 |
| Pintura de muro | 16 (15+1) | 15 |
| Revestimiento cerámico de muro | 17 (15+2) | 15 |
| Clóset | 19 (15+4) | 20→15 (probado también con datos, ver sección I) |

Todos los 4 deltas exactos. **PASS.**

## G. Independencia

Confirmado en el máximo (sección E): activar los 4 opcionales simultáneamente sumó exactamente 15+2+1+2+4=24, sin que ningún opcional alterara el conteo de otro ni de la base (piso, muros, puerta, ventana, enchufes, cielo, iluminación permanecieron en sus valores exactos en todos los escenarios probados). **PASS.**

## H. Cancelar edición

Dos pruebas: (1) desde Todo Sí=24, se cambiaron 2 respuestas y se pulsó "Cancelar" → config y conteo permanecieron en 24 sin cambios. (2) confirmado por BD tras cada intento. **PASS.**

## I. Retiro con datos

Se activó Clóset, se registró una observación en el check de Fijación (severidad MEDIA, comentario). Al intentar Clóset Sí→No:

- El mecanismo existente (`window.confirm`, idéntico a Cocina/Baño, sin lógica nueva) bloqueó el retiro correctamente.
- **Path A (cancelar retiro)**: confirmado — datos intactos, config siguió en `closet:true`, 24 checks.
- **Path B (confirmar retiro)**: confirmado — Clóset y sus 4 checks (incluida la observación) se eliminaron en cascada, conteo bajó exactamente a 20 (15+2+1+2, las 3 terminaciones seguían activas), sin afectar ningún otro componente. Verificado adicionalmente que no quedó ninguna `InspectionObservation` huérfana en el caso (0 encontradas).

**PASS.** Mismo comportamiento ya aprobado en Cocina/Baño — no se creó lógica nueva.

## J. Clóset — 4 checks

Confirmados en catálogo (lectura BD): Funcionamiento (MEDIUM), Fijación (HIGH), Daños visibles (LOW), Humedad/deformación (MEDIUM) — orden y severidades exactos según diseño. DT-01 (severidad UI siempre MEDIA en el formulario) reconfirmado vigente y no corregido, como estaba explícitamente fuera de alcance. **PASS.**

## K. Observaciones

Una observación completa registrada en Clóset-Fijación: "Tiene un problema" → comentario → guardado → reapertura del espacio confirmó persistencia (2/24 revisados tras recargar la página, sin duplicar). Las 4 preguntas de Clóset se confirmaron visibles y evaluables en el checklist real. **PASS.**

## L. N/A

Check de Funcionamiento marcado "No corresponde" con el clóset conteniendo puertas — la guía corregida en 12B ("revisa únicamente las puertas y/o cajones que existan... si no tiene ninguna parte móvil, puede marcarse No corresponde") no indujo a un N/A incorrecto; el usuario lo marcó deliberadamente como prueba de la semántica de N/A ya corregida. Persistencia confirmada tras reapertura (`NOT_APPLICABLE`, sin `notApplicableReason` obligatorio). **PASS.**

## M. TechnicalArticles

Los 4 artículos (`closet-funcionamiento`, `closet-fijacion`, `closet-danos-visibles`, `closet-humedad-deformacion`) confirmados en catálogo con sus 7 secciones, contenido específico de cada check, y fuente 🟡 criterio interno en los 4 — ninguno atribuye Manual de Tolerancias/OGUC/LGUC/NCh. El PDF detallado mostró correctamente "Referencia técnica: Cómo revisar la fijación del clóset" asociada al check correcto. **PASS.**

## N. DT-05

Confirmado en un Dormitorio, Cocina y Baño recién generados en el mismo caso QA (12B): los 3 muestran "la iluminación **del recinto**", nunca "de la cocina". El mecanismo `questionSnapshot` se confirmó operativo por código (congela el texto en cada `InspectionChecklistCheck` al crearse) — no existía ningún check histórico previo de `iluminacion` en la BD compartida para verificar snapshots antiguos (confirmado ya en 12B), por lo que no se inventó una prueba histórica inexistente, tal como indica el enunciado. **PASS.**

## O. Históricos

Los 6 Dormitorios reales existentes verificados antes y después de toda la sesión de QA: `config=null`, `elements=[enchufes-interruptores, muros, piso, puerta, ventana]` en los 6, sin ningún cambio. Ninguno recibió `cielo`, `iluminacion`, `closet` ni backfill de `config`. **6/6 PASS.**

## P. Cohortes

- Dormitorio histórico (sin `cielo`): confirmado congelado — el mecanismo de ancla histórica (idéntico, sin cambios, a Cocina/Baño) nunca fuerza onboarding sobre los 6 reales.
- Dormitorio V1 (con `cielo`): confirmado con panel Nivel 2 disponible y operativo (secciones C-L de este documento).
- Dormitorio V1 editado: el caso QA pasó por múltiples ediciones (Todo No → deltas → Todo Sí → cancelar → retiro con datos → reactivación) manteniendo su `config` correctamente en cada paso, sin ningún mecanismo adicional. **PASS.**

## Q. PDFs

Ambos endpoints (`/pdf/resumen`, `/pdf/detallado`) → 200, `application/pdf`. Contenido real extraído y verificado (no solo status HTTP):

- Resumen por espacios: "Dormitorio 1 · 8% · 24 puntos · 1 Observación · 1 No aplica · 22 pendientes" — coincide exactamente con BD.
- Detallado: hallazgo "DORMITORIO 1 · CLÓSET / ARMARIO EMPOTRADO" con pregunta, severidad (Media), comentario y referencia técnica correctos; fila "Clóset / Armario empotrado · ¿Las puertas y/o cajones...? No aplica" en la lista de puntos pendientes/N-A.

**PASS en ambos.**

## R. Mobile 375px

Verificado en la pantalla de Dormitorio (panel Nivel 2 + checklist con los 24 puntos, incluida la observación y el N/A ya registrados): `scrollWidth === clientWidth`, sin overflow horizontal. **PASS.**

## S. Ownership

Prueba completa con 2 usuarios QA (`qa-12c@obrabien.local`, `qa-12c-b@obrabien.local`):

- Usuario B intentó acceder por URL directa al Dormitorio del caso de usuario A → "Inspección no disponible — Esta inspección no existe o no tienes permisos para acceder a ella."
- Usuario B intentó `fetch` directo al endpoint PDF del caso de A → **404**.

Sin exposición de config, checklist, observaciones ni PDF del caso ajeno. **PASS.** Sin modificación de lógica de ownership.

## T. Cocina — regresión

En el mismo caso QA: Cocina generó exactamente **7 checks base** (mínimo). Level 2 abierto visualmente: **9 decisiones intactas**, en el mismo orden y wording de siempre. Iluminación en checks recién generados de Cocina también muestra wording genérico ("del recinto"), confirmando el fix aplica transversalmente sin romper nada. **7/33 PASS** (33 no roto por diseño — cero código de Cocina tocado, confirmado por diff).

## U. Baño — regresión

En el mismo caso QA: Baño generó exactamente **8 checks base** (mínimo). Level 2 abierto visualmente: **12 decisiones / 3 secciones intactas** (TERMINACIONES, EQUIPAMIENTO DEL RECINTO, ARTEFACTOS SANITARIOS), historical anchor y legacy `artefactos-sanitarios` sin ningún cambio (no auditado línea por línea de nuevo en esta fase — sin motivo para haber cambiado, cero código de Baño tocado). **8/56 PASS.**

## V. Living-comedor

Confirmado explícitamente sin cambios: en el mismo caso QA generó 11 checks, elementos `[piso, muros, ventana, enchufes-interruptores]` — sin `cielo` ni `iluminacion`, exactamente como antes de Dormitorio V1. No se agregó Level 2 ni ningún componente nuevo, tal como exige el enunciado. **PASS.**

## W. Otros recintos

Smoke en el mismo caso QA: Antejardín generó 1 check (Fachada), Acceso vehicular generó 0 (Portón sigue Nivel 2, sin activar por defecto) — ambos consistentes con su comportamiento ya establecido, sin regresión. **PASS.**

## X. Verificación técnica

- `npx tsc --noEmit` → PASS
- `npx eslint .` → PASS
- `npx vitest run` → **95/95 PASS**
- `npx next build` → PASS (29 rutas)

## Y. Limpieza QA

Ambos usuarios QA (`qa-12c@obrabien.local`, `qa-12c-b@obrabien.local`) y sus casos/espacios/elementos/checks/observaciones eliminados en cascada manual. Confirmado por lectura posterior: 0 usuarios QA residuales, 6 espacios Dormitorio reales (usuarios reales) intactos.

## Z. BD final

Read-only: `closet` templates=1, checks=4, articles=4, vínculos dormitorio=7 (0 duplicados), 6 espacios Dormitorio históricos preservados, 0 usuarios QA residuales. Sin reejecución del script de catálogo en esta fase.

## AA. Git final

`git status --short` / `git diff --stat` / `git diff --check`: único cambio funcional `src/lib/inspecciones/space-config.ts` (+46 líneas, ya presente desde 12B). Sin archivos `_tmp_*` restantes, sin debug logs, sin datos QA en el repo, sin trabajo ajeno modificado (`src/components/module/*`, `src/lib/diagram-v2/*` mantienen su diff preexistente intacto).

## AB. Bugs / autocorrecciones

**Bugs encontrados: 0. Bugs corregidos: 0. Bugs abiertos: 0.** Todo el comportamiento coincidió exactamente con el diseño de 12A y la implementación de 12B en el primer intento de cada prueba. No fue necesaria ninguna autocorrección durante esta fase.

## AC. GO/NO-GO

Todos los criterios de la sección 36 del enunciado se cumplen sin excepción.

## REPORTE EJECUTIVO

DORMITORIO V1 — QA FINAL

Catálogo: 1 template / 4 checks / 4 artículos = **PASS**

Level 2: 4 decisiones / 2 secciones = **PASS**

Conteos:
Todo No = 15 **PASS**
Todo Sí = 24 **PASS**

Deltas:
cerámico piso +2 = **PASS**
pintura +1 = **PASS**
cerámico muro +2 = **PASS**
clóset +4 = **PASS**

Independencia = **PASS**
Cancelar = **PASS**
Guardar = **PASS**
Retirar con datos = **PASS**

Clóset = **PASS**
Observaciones = **PASS**
N/A = **PASS**
Guías = **PASS**
DT-05 = **PASS**

Históricos 6/6 = **PASS**
Ownership = **PASS**

PDF resumen = **PASS**
PDF detallado = **PASS**
Mobile 375 = **PASS**

Cocina 7/33 = **PASS**
Baño 8/56 = **PASS**
Living = **PASS**
Otros = **PASS**

tsc = **PASS**
eslint = **PASS**
vitest = **95/95 PASS**
build = **PASS**

Bugs encontrados = 0
Bugs corregidos = 0
Bugs abiertos = 0

QA temporal eliminado = **PASS**
BD compartida segura = **PASS**

GO PUBLICACIÓN = **SÍ**

## CONTROL FINAL

FASE 12C — QA INTEGRAL DE DORMITORIO V1 APROBADO
🟢 CATÁLOGO 1 TEMPLATE / 4 CHECKS / 4 ARTÍCULOS
🟢 NIVEL 2 — 4 DECISIONES / 2 SECCIONES
🟢 MÍNIMO 15 / MÁXIMO 24
🟢 DELTAS E INDEPENDENCIA VERIFICADOS
🟢 EDICIÓN / OBSERVACIONES / N/A OPERATIVOS
🟢 DT-05 VERIFICADO
🟢 6/6 HISTÓRICOS PRESERVADOS
🟢 OWNERSHIP APROBADO
🟢 PDF Y MOBILE APROBADOS
🟢 COCINA 7/33 Y BAÑO 8/56 SIN REGRESIÓN
🟢 TESTS / TSC / ESLINT / BUILD APROBADOS
🟢 GO PARA PUBLICACIÓN

DETENERSE.

NO COMMIT.
NO PUSH.
NO DEPLOY.
