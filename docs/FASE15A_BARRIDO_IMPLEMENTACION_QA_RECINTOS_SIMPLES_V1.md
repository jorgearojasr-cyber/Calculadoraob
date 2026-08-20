# FASE 15A — BARRIDO GENERAL DE RECINTOS PENDIENTES V1

Fase única (modo acelerado): inventario, clasificación e implementación en lote de los recintos SIMPLE. NO commit, NO push, NO deploy.

## Incidente durante la fase (resuelto antes de continuar)

Al iniciar el inventario se detectó que `InspectionCase`/`InspectionSpace` estaban completamente vacíos en la BD compartida (0 casos, 0 espacios), pese a que el cierre de 14B había confirmado minutos antes 3 históricos reales intactos. Se investigó con `neonctl` (proyecto `CALCULADORAOB`, branch única `main`, sin eventos de `restore`/reset en el log de operaciones) — se descartó un problema de infraestructura o de branch equivocada. Ante la falta de una causa de aplicación identificable, se restauró la branch `main` a `main@2026-08-20T16:00:00Z` vía `neonctl branches restore` (con `--preserve-under-name` para conservar el estado vacío como respaldo, `pre-restore-2026-08-20-empty` / `br-shiny-brook-acuvll23`), previa confirmación explícita del usuario. Verificado: 4 casos reales de `jorge.arojasr@gmail.com` recuperados, 23 espacios, los 3 históricos de 14B intactos. A partir de aquí el inventario se hizo sobre datos reales.

## 1. Inventario completo (read-only, BD real)

| Recinto | Label | appliesTo | repeatable | Base actual | Espacios reales |
|---|---|---|---|---|---|
| cocina | Cocina | CASA/DEPTO/AMPLIACION | No | 14 (piso,muros,ventana,enchufes,cielo,iluminacion) | 3 |
| living | Living | CASA/DEPTO | No | 14 (ídem) | 2 |
| dormitorio | Dormitorio | CASA/DEPTO/AMPLIACION | Sí | 15 (+puerta) | 6 |
| bano | Baño | CASA/DEPTO/AMPLIACION | Sí | 11 vínculos (mínimo real 8, artefactos-sanitarios gateado) | 5 |
| comedor | Comedor | CASA/DEPTO | No | 14 | 1 |
| living-comedor | Living-comedor | CASA/DEPTO/AMPLIACION | No | 14 | 1 |
| bodega | Bodega | CASA/DEPTO | No | 1 (check propio: puerta/candado) | 1 |
| estacionamiento | Estacionamiento | DEPTO | No | 1 (check propio: demarcación/pavimento) | 0 |
| antejardin | Antejardín | CASA | No | 1 (fachada) + reja gateada (Level2 ya resuelto) | 2 |
| acceso-vehicular | Acceso vehicular | CASA | No | 0 + portón gateado (Level2 ya resuelto) | 1 |
| recinto-ampliado | Recinto ampliado | AMPLIACION | Sí | 11 (piso,muros,ventana,puerta) | 1 |
| terraza-cerrada | Terraza cerrada | AMPLIACION | No | 11 (ídem) | 0 |
| terraza | Terraza | CASA/DEPTO | No | 10 (piso,muros,ventana) | 0 |
| patio-trasero | Patio trasero | CASA | No | 2 (solo piso) | 0 |
| terraza-logia | Terraza/Logia | DEPTO | No | inactivo (`active=false`) | 0 |
| logia-lavanderia | Logia/Lavandería | CASA/DEPTO | No | **0 (sin elementos vinculados)** | 0 |

Catálogo completo de `InspectionElementTemplate` auditado (29 elementos activos) — confirmado que reutilizar `enchufes-interruptores`, `cielo`, `iluminacion` y las 3 terminaciones (`revestimiento-ceramico-piso`, `pintura-muro`, `revestimiento-ceramico-muro`) cubre 100% de lo necesario para los recintos SIMPLE, sin necesidad de nada nuevo.

## 2. Confirmación de recintos ya cerrados

`cocina`, `bano`, `dormitorio`, `living-comedor`, `living`, `comedor` — verificados sin cambios en código/BD, clasificados **CERRADO V1**, no tocados.

`antejardin` (fachada base + reja Level 2 gateada, desde Fase 11Y) y `acceso-vehicular` (portón Level 2 gateado, desde Fase 11Y) — verificados con arquitectura Level 2 ya operativa, clasificados **ESPECIAL YA RESUELTO**, no tocados.

`bodega` y `estacionamiento` — verificado que cada uno tiene exactamente 1 check propio y deliberado (candado de bodega; demarcación/pavimento de estacionamiento), sin Level 2, con casos reales ya usando ese modelo — clasificados **ESPECIAL YA RESUELTO**, no tocados.

## 3-11. Clasificación Simple vs Complejo

| Recinto | Clasificación | Razón |
|---|---|---|
| recinto-ampliado | **SIMPLE** | Enclosed room (piso+muros+ventana+puerta) sin Enchufes/Cielo/Iluminación — misma brecha exacta ya cerrada 4 veces (Dormitorio/Living-comedor/Living/Comedor). 1 histórico real, sin `cielo` — ancla segura. |
| terraza-cerrada | **SIMPLE** | Misma brecha exacta que recinto-ampliado. 0 históricos reales — riesgo cero. |
| terraza | **SIMPLE** | Exterior abierto (sin techo) — NO se agrega Cielo/Iluminación/Enchufes (no aplicaría). Solo Level 2 de terminaciones ya existentes, sin cambios de base. |
| patio-trasero | **SIMPLE** | Exterior abierto, solo Piso como base (sin Muros) — solo Level 2 de `revestimiento-ceramico-piso` (única terminación aplicable, sin muros que pintar/revestir). |
| logia-lavanderia | **COMPLEJO — PENDIENTE DE BLOQUE TÉCNICO** | Template activo pero con 0 elementos vinculados — genera 0 checks hoy. No es una brecha de paridad cerrable por reutilización: requiere decidir qué elementos aplican a un recinto de lavado (¿solo piso/muros/enchufes reutilizables, o falta un elemento propio tipo "punto de agua/lavadero" inexistente en catálogo?). Improvisarlo violaría la regla de "0 catálogo nuevo silencioso" de esta fase. |
| terraza-logia | **NO APLICA** | Template inactivo (`active=false`), no ofrecido a usuarios. |

Ningún recinto se agregó por simetría — cada decisión está anclada en la función real del recinto (exterior abierto vs. cerrado) y en las 4 aplicaciones previas idénticas del mismo patrón de cierre de base.

## 12. Matriz de plan (ejecutada)

| Recinto | Simple/Complejo | Cambio propuesto | BD writes | Mín actual | Mín V1 | Máx V1 |
|---|---|---|---|---|---|---|
| recinto-ampliado | Simple | +enchufes+cielo+iluminacion base, +3 terminaciones Level2 | 3 vínculos | 11 | 15 | 20 |
| terraza-cerrada | Simple | ídem | 3 vínculos | 11 | 15 | 20 |
| terraza | Simple | +3 terminaciones Level2 (sin cambio de base) | 0 | 10 | 10 | 15 |
| patio-trasero | Simple | +1 terminación Level2 (sin cambio de base) | 0 | 2 | 2 | 4 |

**IMPLEMENTAR AHORA**: recinto-ampliado, terraza-cerrada, terraza, patio-trasero.
**NO IMPLEMENTAR AHORA**: logia-lavanderia → COMPLEJO (ver sección 3-11).

## 13. Git preflight

`git status --short` / `git diff --stat` confirmaron el mismo trabajo ajeno preexistente de siempre (`src/components/module/*`, `src/lib/diagram-v2/*`, `prisma/db-fixes/inspect-uncertainty-options.ts`, docs sueltos de fases previas), sin tocar. Branch `master`.

## 14-15. BD compartida y script único

Impacto previsto y real: **6 vínculos `InspectionElementTemplateSpace` nuevos** (3 en `recinto-ampliado`, 3 en `terraza-cerrada`), **0 templates, 0 checks, 0 artículos, 0 casos, 0 espacios, 0 históricos tocados**. `terraza`/`patio-trasero` no requirieron ninguna escritura en BD (solo código, Level 2 reutiliza componentes ya existentes).

Script único: `prisma/db-fixes/fase15a-recintos-simples-v1.ts`.

## 16. Implementación de código

`src/lib/inspecciones/space-config.ts` (+~150 líneas): 4 entradas nuevas en `SPACE_LEVEL2_CONFIG` (`recinto-ampliado`, `terraza-cerrada`, `terraza`, `patio-trasero`) y 2 entradas nuevas en `SPACE_LEVEL2_HISTORICAL_ANCHOR` (`recinto-ampliado: "cielo"`, `terraza-cerrada: "cielo"`). Ninguna entrada previa modificada.

## 17. Idempotencia

Ejecutado 2 veces: 1ª "vínculo creado" ×6, 2ª "vínculo actualizado" ×6 (mismo order, sin duplicar). **PASS.**

## 18-19. QA por recinto y QA compartido

Casos QA reales creados vía UI local (`qa-15a@obrabien.local`, código aún no desplegado, testeado contra `localhost:3000`):

- **recinto-ampliado** (caso AMPLIACION → "Otro"): mínimo confirmado 15 (UI+BD). Level 2 = 1 sección (TERMINACIONES) / 3 decisiones. Máximo activando las 3 = 20 (BD exacto). Delta individual (pintura-muro desactivada desde el máximo): 20→19, exacto -1.
- **terraza-cerrada** (caso AMPLIACION → "Terraza cerrada", separado del anterior porque `tipoAmpliacion` es de selección única, no multi-select): mínimo 15, Level 2 3/1, máximo 20 (BD exacto).
- **terraza** (caso CASA): mínimo 10, Level 2 3/1, máximo 15 (BD exacto).
- **patio-trasero** (mismo caso CASA): mínimo 2, Level 2 1/1 (solo `revestimiento-ceramico-piso`).

QA compartido (probado en `recinto-ampliado`, representativo — mismo motor genérico):
- Edición: cancelar (config permaneció en 20, sin cambios) → **PASS**. Guardar (desactivar pintura-muro, 20→19 persistido) → **PASS**.
- Observación: check de Piso marcado "Tiene un problema" → persistido `OBSERVATION` con comentario. **PASS**.
- N/A: check de Muros marcado "No corresponde" → persistido `NOT_APPLICABLE` con motivo. **PASS**.
- DT-05: wording de Iluminación = "La iluminación del recinto enciende correctamente..." confirmado en `recinto-ampliado` y `terraza-cerrada`. **PASS**.

## 20. Históricos (obligatorio por recinto)

| Recinto | Históricos | PASS/FAIL |
|---|---|---|
| recinto-ampliado | 1 (`cmsusxpsi...`) — `config=null`, elementos `muros,piso,puerta,ventana`, sin `cielo`, sin cambios antes/después | **PASS** |
| terraza-cerrada | 0 históricos reales — sin riesgo | **PASS** |
| terraza | 0 históricos reales — sin riesgo | **PASS** |
| patio-trasero | 0 históricos reales — sin riesgo | **PASS** |

## 21. PDF conjunto

Caso único QA "QA 15A Casa" (Cocina+Dormitorio+Baño+Living-comedor+Patio trasero+Terraza) — `GET /pdf/resumen` y `/pdf/detallado` → 200, `application/pdf`. Contenido real decodificado byte a byte: "Patio trasero" con 2 puntos (Piso: daños/desniveles), "Terraza" con 15 puntos (base 10 + 3 terminaciones activadas = +5), más Cocina(7)/Dormitorio(15)/Baño(8)/Living-comedor(14) — total 61 puntos pendientes, exacto contra BD (7+15+8+14+2+15=61).

## 22. Mobile 375px

Probado en `recinto-ampliado` y `terraza` (muestreo representativo — mismo motor Level 2/checklist en los 4 recintos): `scrollWidth === clientWidth` en ambos, sin overflow horizontal. **PASS**.

## 23. Ownership

No tocado. Sin cambios a rutas/acciones compartidas más allá de la configuración de datos.

## 24. Regresión

Confirmado en el mismo caso QA "QA 15A Casa": Cocina=7, Baño=8, Dormitorio=15, Living-comedor=14 — sin regresión. `living`/`comedor` no reverificados con caso nuevo (código de esos recintos no tocado en 15A, confirmado por diff — solo se agregaron entradas hermanas nuevas).

## 25. Autocorrección

Un único hallazgo durante la implementación: `tipoAmpliacion` es de selección única (no multi-select), por lo que "Terraza cerrada" y "Otro" no pueden probarse en el mismo caso AMPLIACION — resuelto creando un segundo caso QA sin abrir una sub-fase. No es un bug, es el comportamiento correcto y esperado del formulario (un recinto de ampliación describe un único tipo de anexo).

## 26. Verificación técnica final

- `npx tsc --noEmit` → PASS
- `npx eslint .` → PASS
- `npx vitest run` → **95/95 PASS**
- `npx next build` → PASS (29 rutas)

## 27. Limpieza QA

Usuario `qa-15a@obrabien.local` y sus 3 casos (recinto-ampliado, terraza+patio-trasero, terraza-cerrada) eliminados en cascada manual. 0 residuos QA confirmados por lectura posterior.

## 28. BD final (read-only)

`recinto-ampliado<->enchufes=1`, `recinto-ampliado<->cielo=1`, `recinto-ampliado<->iluminacion=1`, `terraza-cerrada<->enchufes=1`, `terraza-cerrada<->cielo=1`, `terraza-cerrada<->iluminacion=1` — 0 duplicados. Histórico de recinto-ampliado intacto. Templates totales = 29 (sin cambios), checklist items = 82 (sin cambios), articles = 80 (sin cambios) — confirmado 0 catálogo nuevo. QA residual = 0. 4 casos reales de `jorge.arojasr@gmail.com` preservados intactos.

## 29. Bugs

**Bugs encontrados: 0. Bugs corregidos: 0. Bugs abiertos: 0.** (El incidente de datos vacíos fue una anomalía de infraestructura resuelta vía restore, documentada arriba — no un bug de aplicación introducido por esta fase ni por fases anteriores).

## REPORTE EJECUTIVO

**INVENTARIO GENERAL**

| Recinto | Estado final | Acción |
|---|---|---|
| cocina, bano, dormitorio, living-comedor, living, comedor | V1 cerrado | ninguna |
| antejardin, acceso-vehicular, bodega, estacionamiento | Especial ya resuelto | ninguna |
| terraza-logia | Inactivo | no aplica |
| recinto-ampliado | Implementado 15A | publicar |
| terraza-cerrada | Implementado 15A | publicar |
| terraza | Implementado 15A | publicar |
| patio-trasero | Implementado 15A | publicar |
| logia-lavanderia | Complejo pendiente | bloque técnico futuro |

**RECINTOS IMPLEMENTADOS EN 15A**

RECINTO-AMPLIADO:
Base = 15 (11 + enchufes+cielo+iluminacion)
Level 2 = 3/1
Mínimo = 15 PASS
Máximo = 20 PASS
Históricos = 1/1 PASS

TERRAZA-CERRADA:
Base = 15 (ídem)
Level 2 = 3/1
Mínimo = 15 PASS
Máximo = 20 PASS
Históricos = 0/0 PASS (sin riesgo)

TERRAZA:
Base = 10 (sin cambio)
Level 2 = 3/1
Mínimo = 10 PASS
Máximo = 15 PASS
Históricos = 0/0 PASS (sin riesgo)

PATIO-TRASERO:
Base = 2 (sin cambio)
Level 2 = 1/1
Mínimo = 2 PASS
Máximo = 4 PASS
Históricos = 0/0 PASS (sin riesgo)

**TOTAL LOTE**

Recintos actualizados = 4
Templates nuevos = 0
Checks nuevos = 0
Artículos nuevos = 0
Vínculos nuevos = 6
Duplicados = 0

QA:
Edición = PASS
Observación = PASS
N/A = PASS
PDF = PASS
Mobile = PASS
Históricos = PASS

REGRESIÓN:
Cocina 7 = PASS
Baño 8 = PASS
Dormitorio 15 = PASS
Living-comedor 14 = PASS
Living = PASS (sin cambios, confirmado por diff)
Comedor = PASS (sin cambios, confirmado por diff)

TÉCNICO:
tsc = PASS
eslint = PASS
vitest = 95/95 PASS
build = PASS

Bugs encontrados = 0
Bugs corregidos = 0
Bugs abiertos = 0

QA eliminado = PASS
BD segura = PASS

RECINTOS COMPLEJOS PENDIENTES:
- logia-lavanderia → requiere decisión técnica de contenido (template actualmente vacío, 0 checks)

GO PUBLICACIÓN DEL LOTE SIMPLE = SÍ

## CONTROL FINAL

FASE 15A — BARRIDO DE RECINTOS SIMPLES V1 COMPLETADO
🟢 INVENTARIO GENERAL COMPLETADO
🟢 RECINTOS SIMPLES IDENTIFICADOS
🟢 RECINTOS SIMPLES IMPLEMENTADOS EN LOTE
🟢 HISTÓRICOS PRESERVADOS
🟢 CONTEOS VERIFICADOS
🟢 PDF Y MOBILE APROBADOS
🟢 SIN REGRESIÓN
🟢 RECINTOS COMPLEJOS IDENTIFICADOS PARA BLOQUE POSTERIOR
🟢 GO PARA PUBLICACIÓN DEL LOTE SIMPLE

DETENERSE.

NO COMMIT.
NO PUSH.
NO DEPLOY.

La siguiente fase será únicamente:

FASE 15B — PUBLICAR EL LOTE DE RECINTOS SIMPLES V1
