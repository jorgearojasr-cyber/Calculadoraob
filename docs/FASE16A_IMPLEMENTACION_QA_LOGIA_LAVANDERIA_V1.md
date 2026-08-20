# FASE 16A — LOGIA/LAVANDERÍA V1: INVESTIGACIÓN + DISEÑO + IMPLEMENTACIÓN + QA

Fase única (modo acelerado). NO commit, NO push, NO deploy.

## 1. Investigación

`logia-lavanderia` confirmado read-only: `key=logia-lavanderia`, `label="Logia / Lavandería"`, `appliesTo=["CASA","DEPARTAMENTO"]`, `repeatable=false`, `active=true`, **0 vínculos** `InspectionElementTemplateSpace`, **0 checks generados**, **0 espacios reales**. Coincide exacto con el hallazgo de 15A — sin caso real relacionado que migrar.

Catálogo reutilizable auditado antes de diseñar: `piso`(2), `muros`(1), `cielo`(2), `puerta`(1), `ventana`(7), `enchufes-interruptores`(1), `iluminacion`(1), las 3 terminaciones, y — específicamente para la sección de agua — `lavaplatos`(5) y `lavamanos`(5), ambos con semántica de artefacto sanitario de Cocina/Baño. Se descartó reutilizarlos directamente (regla anti-simetría del enunciado): un lavadero de logia y una conexión de lavadora son conceptualmente distintos de un lavaplatos/lavamanos instalado.

## 2. Seguridad BD

**BASELINE_PRE_16A** (idéntico al de 15B, confirmando que nada cambió en el intervalo): `InspectionCase=4`, `InspectionSpace=23`, `InspectionElement=83`, `InspectionChecklistCheck=130`, `User=3`, `InspectionSpaceTemplate=16`, `InspectionElementTemplate=29`, `InspectionChecklistItem=82`, `TechnicalArticle=80`, `InspectionElementTemplateSpace=64`.

Respaldo Neon: ya existía `pre-15b-healthy-20260820` (`br-hidden-night-aciqyz9o`), creado durante 15B con el estado sano vigente — confirmado equivalente al estado actual (baseline idéntico), reutilizado sin duplicar.

## 3-9. Arquitectura decidida

**Base V1** (5 vínculos nuevos, 100% reutilizado): `piso`(2) + `muros`(1) + `enchufes-interruptores`(1) + `cielo`(2) + `iluminacion`(1) = **7 checks**. Mismo patrón de "recinto interior cerrado" ya usado 6 veces en el catálogo. Puerta/Ventana NO se fuerzan como base — sin evidencia de que toda logia tenga puerta o ventana propia — se agregan como Level 2 reutilizado (sin vínculo base, mismo patrón de Puerta en Cocina).

**Componentes nuevos evaluados** (sección 8/9 del enunciado): se optó por el Modelo B (separar) — dos decisiones independientes, no un único componente mezclado, porque un lavadero y una conexión de lavadora son elementos físicamente distintos que pueden existir independientemente uno del otro.

- `conexion-lavadora` (4 checks): llave de agua, fuga en la conexión, desagüe visible, firmeza de componentes visibles. Ninguno exige conectar una lavadora — todo evaluable con la instalación vacía.
- `lavadero` (4 checks, patrón de Lavaplatos/Lavamanos pero redacción y artículos propios): grifería, fuga bajo el lavadero, firmeza, sello perimetral.

Ningún check exige desmontar, desarmar, medir presión, intervenir tablero eléctrico ni certificar instalación oculta — todos son observación visual/accionamiento normal (regla de la sección 5).

## 10. Checks nuevos (detalle)

| Template | Check | Severidad default |
|---|---|---|
| conexion-lavadora | ¿La llave de agua para la lavadora abre y cierra correctamente? | MEDIUM |
| conexion-lavadora | Al abrir la llave brevemente, ¿se observa alguna fuga visible en la conexión? | HIGH |
| conexion-lavadora | ¿El desagüe visible para la lavadora está presente y sin fuga? | MEDIUM |
| conexion-lavadora | ¿Los componentes visibles (llave, mangueras, conexiones) se ven firmes y sin daños? | LOW |
| lavadero | ¿La grifería del lavadero abre y cierra correctamente, sin quedar goteando? | MEDIUM |
| lavadero | Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavadero? | HIGH |
| lavadero | ¿El lavadero se ve firme y bien instalado, sin moverse al tocarlo? | LOW |
| lavadero | ¿El sello alrededor del lavadero se ve continuo, sin separaciones ni grietas? | LOW |

## 13. Fuentes

Los 8 checks nuevos se clasificaron honestamente como **🟡 criterio interno/adaptado** — no existe partida específica para conexiones de lavadora ni lavaderos de logia en el Manual de Tolerancias ni en el catálogo educativo ITO consultados. Los 4 de `lavadero` adaptan el patrón ya usado (y ya fuente-clasificado) de Lavaplatos/Lavamanos; los 4 de `conexion-lavadora` son criterio interno puro, declarado explícitamente sin atribuir normativa que no los respalda.

## 14. TechnicalArticles

8 artículos nuevos, estructura estándar completa (Qué revisar / Cómo revisarlo / Qué debería verse / Qué señales pueden indicar un problema / Por qué importa / Recomendación / Fuente) — contenido verificado en UI (sección "Ver cómo revisarlo" renderiza las 4 secciones correctamente) y en PDF detallado.

## 15. Referencias visuales

0 referencias GOOD/BAD generadas — DT-04 permanece fuera de alcance, no bloquea esta fase.

## 16. Históricos

Reconfirmado: **0 espacios reales** de `logia-lavanderia` — sin riesgo de migración. Se define de todas formas `logia-lavanderia: "cielo"` como ancla histórica, por consistencia con el resto del catálogo (trivialmente segura, sin cohorte real que proteger).

## 17. Plan (LOGIA V1 — DISEÑO CERRADO)

Base: 7 (piso+muros+enchufes+cielo+iluminacion, reutilizado)
Level 2: 7 decisiones / 3 secciones (TERMINACIONES, EQUIPAMIENTO DEL RECINTO, AGUA Y DESAGÜE)
Reutilizados: 3 terminaciones + ventana + puerta
Nuevos: conexion-lavadora(4) + lavadero(4)
Checks nuevos: 8
Artículos nuevos: 8
Mínimo: 7
Máximo: 7+2+1+2+7+1+4+4 = **28**
BD writes: 2 templates, 8 checklist items, 8 articles, 5 vínculos base
Históricos: 0, sin riesgo

Diseño resuelto íntegramente con catálogo existente + 2 templates claramente justificados — continuado automáticamente a implementación, sin bloqueo (sección 18 del enunciado).

## 18-21. Script e idempotencia

`prisma/db-fixes/fase16a-logia-lavanderia-v1.ts` — único script. Ejecutado 2 veces:

- 1ª ejecución: 2 templates creados, 8 artículos creados, 8 checks creados, 5 vínculos creados.
- 2ª ejecución: mismos IDs, "actualizado" en todos los casos, 0 duplicados.

Integridad verificada antes/después de cada ejecución: `InspectionCase/Space/Element/ChecklistCheck` de usuarios reales sin cambios (4/23/83/130) en ambas — solo catálogo cambió (`InspectionElementTemplate` 29→31, `InspectionChecklistItem` 82→90, `TechnicalArticle` 80→88, `InspectionElementTemplateSpace` 64→69).

## 22. Implementación de código

`src/lib/inspecciones/space-config.ts`: 1 entrada nueva en `SPACE_LEVEL2_CONFIG["logia-lavanderia"]` (7 decisiones) + 1 entrada nueva en `SPACE_LEVEL2_HISTORICAL_ANCHOR`. Confirmado por diff: 0 líneas eliminadas, 100% aditivo — ninguna entrada previa tocada.

## 23-24. QA — mínimo y máximo

Caso QA real vía UI local (código aún no desplegado, `qa-16a@obrabien.local`, caso CASA con Cocina/Dormitorio/Baño/Living-comedor/Logia):

- **Mínimo (Todo No)**: confirmado por UI (`0/7`) y por conteo total del caso (`0/51 = 7+15+8+14+7`).
- **Máximo (Todo Sí)**: activadas las 7 decisiones → confirmado por BD `totalChecks=28`, desglose exacto por componente (piso2+muros1+enchufes1+cielo2+iluminacion1+revestimiento-piso2+pintura-muro1+revestimiento-muro2+ventana7+puerta1+conexion-lavadora4+lavadero4=28).

## 25. QA — componentes nuevos

`conexion-lavadora` y `lavadero` aparecen solo tras activarlos en Level 2, con sus 4 checks correctos cada uno, guía completa funcionando (`Ver cómo revisarlo` renderiza las 7 secciones del artículo), y order correcto (aparecen al final, sección "AGUA Y DESAGÜE"). Observación completa registrada en `lavadero` (check de grifería) con comentario persistido en `InspectionObservation`.

## 26. QA — agua/fugas

Confirmado que ningún check ni su guía instruye a desmontar sifones, abrir muros ni intervenir instalaciones — todos son observación visual o accionamiento normal. Probado: evaluación normal (Está bien), observación (Tiene un problema con comentario), N/A (`conexion-lavadora` → desagüe marcado "No corresponde" con motivo).

## 27. Edición

Cancelar: cambio de `revestimiento-ceramico-piso` sin guardar → config permaneció en 28. **PASS**. Guardar: desactivar `lavadero` (que tenía una observación guardada) → disparó el diálogo de confirmación existente ("Ya hay respuestas, hallazgos o fotos guardadas en Lavadero / Pileta..."), confirmado → 28→24 exacto, observación eliminada limpiamente sin datos huérfanos. Mecanismo de protección de datos existente, sin lógica nueva.

## 28. PDF

`GET /pdf/resumen` y `/pdf/detallado` → 200, `application/pdf`. Contenido real decodificado: sección "Conexión de lavadora" con las 4 preguntas exactas, N/A correctamente mostrado ("No aplica") en el check de desagüe. Resultado global: 68 puntos totales (7+15+8+14+24), 1 NO APLICA, 0 OBSERVACIÓN (removida junto con `lavadero`), 67 pendientes — exacto contra BD.

## 29. Mobile

375×812: `scrollWidth === clientWidth`, sin overflow horizontal, checklist y Level 2 renderizan correctamente.

## 30. Ownership

No tocado — sin cambios a rutas/actions compartidas.

## 31. Regresión

En el mismo caso QA: Cocina=7, Dormitorio=15, Baño=8, Living-comedor=14 — sin regresión. `recinto-ampliado`/`terraza-cerrada`/`terraza`/`patio-trasero` no repetidos con caso nuevo — confirmado por diff (0 líneas eliminadas en `space-config.ts`, ninguna entrada previa modificada).

## 32. Autocorrección

Un hallazgo menor durante la verificación técnica: `next build` falló por un error de tipos en un script temporal propio (`_tmp_16a_qa_shared.ts`, comparación `status !== "PENDING"` contra un enum sin ese valor) — no era un bug de la aplicación, era un script de QA descartable. Corregido eliminando el script temporal (ya no era necesario) y repitiendo el build, que pasó limpio.

## 33. Verificación técnica

`npx tsc --noEmit` → PASS. `npx eslint .` → PASS. `npx vitest run` → **95/95 PASS** (sin tests nuevos — solo configuración/catálogo, sin lógica nueva que testear). `npx next build` → PASS (29 rutas).

## 34. Limpieza QA

Usuario `qa-16a@obrabien.local` y su caso (5 espacios) eliminados en cascada manual, incluyendo la observación huérfana en la conexión-lavadora restante. 0 residuos QA confirmados por lectura posterior.

## 35. Auditoría final

Templates nuevos = 2. Checks nuevos = 8. Artículos nuevos = 8. Vínculos nuevos = 5. Mínimo = 7. Máximo = 28. Duplicados = 0. BD real intacta = PASS (4/23/83/130 sin cambios, solo catálogo: 31/90/88/69).

## GO/NO-GO

**GO** — Logia/Lavandería V1 queda técnicamente cerrada, con checklist útil (28 puntos posibles, 7 base), catálogo nuevo mínimo (2 templates, 8 checks) y bien justificado, sin migración histórica, sin arquitectura nueva, 0 bugs.

## REPORTE FINAL

LOGIA/LAVANDERÍA V1 — IMPLEMENTACIÓN + QA

ARQUITECTURA

Base: piso(2)+muros(1)+enchufes(1)+cielo(2)+iluminacion(1) = 7, reutilizado, 5 vínculos nuevos

Level 2: 7 decisiones / 3 secciones (TERMINACIONES, EQUIPAMIENTO DEL RECINTO, AGUA Y DESAGÜE)

Mínimo: 7
Máximo: 28

CATÁLOGO

Templates reutilizados: piso, muros, enchufes-interruptores, cielo, iluminacion, ventana, puerta, revestimiento-ceramico-piso, pintura-muro, revestimiento-ceramico-muro
Templates nuevos: conexion-lavadora, lavadero
Checks nuevos: 8
Artículos nuevos: 8
Vínculos nuevos: 5

QA

Todo No = 7 PASS
Todo Sí = 28 PASS
Edición = PASS
Observación = PASS
N/A = PASS
Guías = PASS
PDF = PASS
Mobile = PASS

BD

Baseline real preservado = PASS
Backup Neon = `pre-15b-healthy-20260820` (`br-hidden-night-aciqyz9o`), reutilizado
Idempotencia = PASS
Duplicados = 0 PASS
QA eliminado = PASS

REGRESIÓN

Cocina 7 = PASS
Baño 8 = PASS
Dormitorio 15 = PASS
Living-comedor 14 = PASS
Recinto ampliado = PASS (sin cambios, confirmado por diff)
Terraza = PASS (sin cambios, confirmado por diff)

TÉCNICO

tsc = PASS
eslint = PASS
vitest = 95/95 PASS
build = PASS

Bugs encontrados = 0 (el fallo de build fue un script de QA propio, no de la app)
Bugs corregidos = 0
Bugs abiertos = 0

GO PUBLICACIÓN = SÍ

## CONTROL FINAL

FASE 16A — LOGIA/LAVANDERÍA V1 IMPLEMENTADA Y QA APROBADO
🟢 ARQUITECTURA TÉCNICA CERRADA
🟢 LOGIA/LAVANDERÍA YA GENERA CHECKLIST ÚTIL
🟢 CATÁLOGO REUTILIZADO Y NUEVO VALIDADO
🟢 MÍNIMO / MÁXIMO VERIFICADOS
🟢 BD REAL E HISTÓRICOS PRESERVADOS
🟢 PDF Y MOBILE APROBADOS
🟢 SIN REGRESIÓN
🟢 TESTS / TSC / ESLINT / BUILD APROBADOS
🟢 GO PARA PUBLICACIÓN

DETENERSE.

NO COMMIT.
NO PUSH.
NO DEPLOY.

La siguiente y única fase será:

FASE 16B — PUBLICAR Y CERRAR LOGIA/LAVANDERÍA V1
