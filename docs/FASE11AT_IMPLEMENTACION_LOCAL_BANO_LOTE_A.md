# FASE 11AT — Implementación local Lote A de Baño V1

Infraestructura Nivel 2 + Terminaciones + Ventana + gate del legacy `artefactos-sanitarios`. Implementación local — sin commit, sin push, sin deploy, sin publicación.

## A. Objetivo

Implementar únicamente el Lote A de Baño V1 (docs/FASE11AS_CONSOLIDACION_CANONICA_BANO_V1.md §AH): infraestructura Nivel 2, las 3 decisiones de TERMINACIONES, Ventana, y el gate del legacy `artefactos-sanitarios` — sin tocar los 8 componentes especiales sanitarios (quedan para los Lotes B-F).

## B. Preflight — "10 vs 11" reutilizados

Leído íntegro 11AS. El resumen operativo decía "Reutilizados sin cambios (11)" pero listaba exactamente 10 keys: `piso, muros, cielo, enchufes-interruptores, iluminacion, puerta, ventana, revestimiento-ceramico-piso, pintura-muro, revestimiento-ceramico-muro`.

**Resultado: Caso A — error aritmético/documental puro.** No existe un undécimo template reutilizado omitido; ninguna sección del cuerpo del documento (matriz de componentes base, tabla de terminaciones, tabla M de componentes especiales) menciona un componente adicional. Corregido en `docs/FASE11AS_CONSOLIDACION_CANONICA_BANO_V1.md` línea 544: "(11)" → "(10)". Sin impacto en arquitectura ni conteos — se continuó con la implementación.

## C. Arquitectura real encontrada

Auditado el código real antes de editar (sin asumir nombres esperados):

- **`src/lib/inspecciones/space-config.ts`**: `SPACE_LEVEL2_CONFIG: Record<spaceTemplateKey, SpaceConfigurableComponent[]>` — genérico, sin lógica específica de recinto. `SPACE_LEVEL2_HISTORICAL_ANCHOR: Record<spaceTemplateKey, string>` — igual de genérico. Ninguno tenía entrada para `bano` antes de esta fase.
- **`src/app/(app)/inspecciones/actions.ts`** (`createInspectionAndGenerateAction`): genera elementos base leyendo `InspectionElementTemplateSpace` por `spaceTemplateId`, filtrando por `LEVEL2_GATED_LINKS` (`Set<"spaceTemplateKey:elementTemplateKey">`) antes de crear cada `InspectionElement` — mecanismo 100% genérico, reutilizado sin cambios de lógica.
- **`src/app/(app)/inspecciones/[id]/actions.ts`** (`saveSpaceLevel2ConfigAction`): motor de guardado Nivel 2 — resuelve `componentKey` server-side contra `getConfigurableComponents(space.spaceTemplate?.key)`, nunca confía en el cliente; crea el `InspectionElement` directamente por `elementTemplate.key` cuando el usuario responde "Sí" (sin necesitar vínculo `InspectionElementTemplateSpace` previo); idempotente; exige confirmación si hay datos al eliminar. **No requirió ningún cambio de código** — ya soporta cualquier `spaceTemplateKey`.
- **`src/components/inspecciones/space-level2-panel.tsx`** y **`space-level2-gate.tsx`**: sin ninguna referencia hardcodeada a `cocina` ni `bano` — genéricos por `spaceTemplateKey`, sin cambios necesarios.

**Conclusión confirmada de 11AS §D**: la infraestructura genérica ya existe y es suficiente — Baño V1 solo necesitaba agregar datos.

## D. Archivos modificados

- **`src/lib/inspecciones/space-config.ts`**: agregada la entrada `bano: [...]` a `SPACE_LEVEL2_CONFIG` (4 decisiones del Lote A: 3 terminaciones + Ventana, con wording/section/order exactos de 11AS §N/M) y `bano: "cielo"` a `SPACE_LEVEL2_HISTORICAL_ANCHOR`.
- **`src/app/(app)/inspecciones/actions.ts`**: agregado el par `"bano:artefactos-sanitarios"` a `LEVEL2_GATED_LINKS`, con comentario explicando el mecanismo (mismo patrón que `cocina:ventana`).

## E. BD auditada

Confirmado por consulta solo lectura antes de escribir: `piso`(2 checks), `muros`(1), `cielo`(2), `enchufes-interruptores`(1), `iluminacion`(1), `puerta`(1), `ventana`(8 filas, 7 activas), `revestimiento-ceramico-piso`(2), `pintura-muro`(1), `revestimiento-ceramico-muro`(2), `artefactos-sanitarios`(3) — todos `active: true`, sin cambios de contenido en ninguno.

## F. Shared DB safety

**Necesidad no prevista identificada y resuelta explícitamente** (no silenciada): lograr Base=8 (requisito obligatorio de la sección 22 del enunciado) exige que Cielo/Enchufes/Iluminación/Puerta estén vinculados a `bano` vía `InspectionElementTemplateSpace` — vínculos que no existían. Se distinguió explícitamente "catálogo nuevo" (`InspectionElementTemplate`/`InspectionChecklistItem`/`TechnicalArticle` — 0 creados, confirmado sección G) de "vínculos nuevos de componentes 100% preexistentes" (4 creados) — mismo patrón ya usado en Fase 11AA de Cocina para Cielo/Iluminación (precedente literal: `prisma/db-fixes/fase11aa-cocina-lote-a.ts`), que también creó vínculos base nuevos durante una fase de "implementación local", con el mismo razonamiento de "efecto de BD compartida antes de publicar" ya auditado en esa serie.

**Efecto en producción compartida**: dado que el vínculo es de un elemento **base** (siempre-presente, sin gate), cualquier Baño nuevo creado en producción por el código viejo (todavía desplegado) entre la ejecución de este script y el futuro deploy recibirá automáticamente Cielo/Enchufes/Iluminación/Puerta — comportamiento intencional y ya aceptado como parte del estado final de Baño V1 (no depende del código Nivel 2, que sigue sin publicar). El vínculo `bano<->artefactos-sanitarios` **no se tocó** — permanece intacto, así que producción sigue generando `artefactos-sanitarios` normalmente hasta que el código con el gate se publique (idéntico al patrón ya usado para `cocina:ventana`).

Script `prisma/db-fixes/fase11at-bano-lote-a.ts`: aditivo, idempotente (`findFirst`+`create`/`update`, mismo patrón que los 5 scripts de Cocina), ejecutado 2 veces contra la BD compartida — segunda ejecución confirmó "vínculo actualizado" (mismo `order`) sin duplicar filas. Sin `INSERT`/`UPDATE`/`DELETE` sobre el vínculo legacy ni sobre ningún template/check/artículo existente.

## G. Base

Confirmado en producción local: Piso(2) + Muros(1) + Cielo(2) + Enchufes e interruptores(1) + Iluminación(1) + Puerta(1) = **8 checks**, verificado end-to-end en un caso real creado a través del formulario de la app (no simulado). InspectionElementTemplate nuevos = 0. InspectionChecklistItem nuevos = 0. TechnicalArticle nuevos = 0. Referencias nuevas = 0.

## H. Level 2 Lote A

Confirmado: exactamente **4 decisiones** — 3 TERMINACIONES + 1 EQUIPAMIENTO DEL RECINTO (Ventana). Ningún componente de Lotes B-F (Extractor, WC, Lavamanos, Ducha, Tina, Mampara, Mueble, Cubierta) es visible en el panel — confirmado por lectura directa del DOM renderizado, no solo del código.

## I. Terminaciones

`revestimiento-ceramico-piso`, `pintura-muro`, `revestimiento-ceramico-muro` reutilizados **sin duplicar catálogo** — mismos templates ya usados en Cocina desde Fase 11AB, sin crear `-bano` sufijado. Confirmado en pantalla: preguntas y sección exactas ("¿El piso es de cerámica o porcelanato?", "¿Los muros tienen pintura?", "¿Los muros tienen revestimiento cerámico o porcelanato?", agrupadas bajo TERMINACIONES).

## J. Ventana

Reutilizado sin cambios — mismo `InspectionElementTemplate` (`ventana`), mismos 7 checks activos, mismos artículos, misma severidad (todas `null`, sin cambio). Wording de la pregunta Nivel 2 generalizado a "¿El baño tiene ventana?" (vs. "¿La cocina tiene ventana?" de Cocina) — confirmado en pantalla. Cuando Ventana=No, no se genera ningún `InspectionElement` de ventana (confirmado: config `{"ventana": false}` implícito por ausencia, sin elemento creado). Cuando Ventana=Sí, se generan exactamente los 7 checks existentes, sin cambios de artículo, referencia ni severidad.

## K. Config

Confirmado el esquema real: `{ components?: Record<string, boolean>, componentMeta?: Record<string, Record<string, string>> }`. Verificado en el caso QA real: `config = {"components":{"ventana":true,"pintura-muro":true,"revestimiento-ceramico-muro":true,"revestimiento-ceramico-piso":true},"componentMeta":{}}` — sin metadata artificial agregada, `componentMeta` vacío como se esperaba (ninguno de los 4 componentes del Lote A tiene `metaOptions`).

## L. Whitelist

`getConfigurableComponents("bano")` retorna únicamente las 4 entradas de este lote — confirmado por el renderizado real del panel (sección H). No se agregaron todavía las keys de los 7 componentes sanitarios (`extractor-aire`, `wc`, `lavamanos`, `ducha`, `mampara`, `tina`, `mueble-bano`, `cubierta-bano`) — no existe necesidad demostrada de declararlas antes de que sus templates existan; hacerlo generaría un error al intentar guardar "Sí" para un componente sin `InspectionElementTemplate` en catálogo (`saveSpaceLevel2ConfigAction` busca `elementTemplate.findUnique` y aborta silenciosamente si no existe — confirmado por lectura de código, sección C).

## M. Gate legacy

Confirmado extremo a extremo: el vínculo de catálogo `bano<->artefactos-sanitarios` permanece intacto (sección E/F) — el desacople es 100% de código, vía `LEVEL2_GATED_LINKS.add("bano:artefactos-sanitarios")`. Verificado en el caso QA real: el Baño nuevo generado **no contiene** `artefactos-sanitarios` entre sus elementos (lista completa: `piso, muros, cielo, enchufes-interruptores, iluminacion, puerta, revestimiento-ceramico-piso, pintura-muro, revestimiento-ceramico-muro, ventana` — 10 elementos, ninguno es el legacy). No se desactivó el template, no se borró el link global, no se migró ningún histórico, no se modificaron respuestas/observaciones/fotos de ningún caso existente.

## N. Cohortes

Confirmado el mecanismo real: `SPACE_LEVEL2_HISTORICAL_ANCHOR.bano = "cielo"` — un Baño se considera histórico si no tiene un `InspectionElement` con key `cielo`. Los 5 espacios de Baño históricos reales (sección O) no tienen `cielo` → clasificados correctamente como históricos, sin onboarding forzado. El Baño QA nuevo sí tiene `cielo` desde su creación → clasificado como V1 nuevo, exigió la configuración Nivel 2 al entrar por primera vez (confirmado en pantalla: bloque "ANTES DE REVISAR ESTE ESPACIO" mostrado en la primera visita).

## O. Históricos

Consultados por solo lectura, antes y después de todos los cambios de código y catálogo: los 5 espacios de Baño reales de Jorge (`las dalias`×2, `casa`×1, `xcxc`×2) **permanecen exactamente iguales** — `config: null`, mismos 3 elementos (`piso`(2), `muros`(1), `artefactos-sanitarios`(3)), mismo total de 6 checks cada uno, sin cambios en ningún campo. No se leyó/renderizó ninguno de estos 5 casos a través de la UI en esta fase (para no arriesgar ninguna escritura accidental) — la verificación fue vía consulta directa a BD, antes y después, byte a byte idéntica.

## P. Órdenes

**Panel Nivel 2**: agrupado por `section` — TERMINACIONES (3 preguntas) antes de EQUIPAMIENTO DEL RECINTO (1 pregunta, Ventana) — confirmado en pantalla.
**Checklist plano**: Base (`order` de catálogo 0-6: piso, muros, cielo, enchufes, iluminación, puerta) seguido de Nivel 2 (`order` 10-13: revest. piso, pintura, revest. muro, ventana) — confirmado en pantalla, sin intercalar, mismo criterio que Cocina.
**Deuda transversal DT-02 (orders empatados de elementos base)**: NO corregida, según instrucción explícita — fuera de alcance de este lote.

## Q. Conteos

Verificados end-to-end en el navegador contra un caso real:

| Configuración | Esperado | Obtenido |
|---|---|---|
| Todo Nivel 2 = No | 8 | **8** ✅ |
| Todos los 4 del Lote A = Sí | 20 | **20** ✅ |
| Ventana = No (edición, sin datos) | 13 | **13** ✅ |
| Ventana = Sí (re-agregada, idempotente) | 20 | **20**, sin duplicar ✅ |

**MÍNIMO LOTE A = 8. MÁXIMO LOTE A = 20 — confirmados exactos, obligatorios.**

## R. QA

- **Creación de caso real**: vía el formulario completo de la app (Motivo → Tipo → Ficha con Baños=1 → Datos → Crear), no simulado ni inyectado directamente en BD.
- **Onboarding Nivel 2**: las 4 preguntas se mostraron con wording/section exactos al entrar por primera vez a Baño 1.
- **Guardado inicial**: las 4 respondidas "Sí" → 20 checks generados correctamente, con los 10 elementos esperados.
- **Edición sin datos**: Ventana → No → Guardar, sin pedir confirmación (correcto, sin datos existentes) → 13 checks.
- **Re-activación idempotente**: Ventana → Sí → Guardar → 20 checks, sin duplicar elemento ni checks (confirmado por conteo, no por duplicación de filas visibles).
- **Resumen**: `/inspecciones/[id]/resumen` renderiza Baño 1 con sus 20 puntos pendientes, preguntas y artículos correctos, junto a Cocina/Dormitorio/Living-comedor sin alteración.
- **PDF**: ambos enlaces de descarga (resumen y detallado) presentes y con `href` correctos; no se requirió cambio del motor PDF (confirmado, sin necesidad de tocarlo).

## S. Regresión Cocina

Confirmado en el mismo caso QA: Cocina generada automáticamente muestra **0/7 revisados** (mínimo intacto, sin cambios). Confirmado por consulta a BD: las 3 Cocinas reales de Jorge conservan `config: null` y 4 elementos cada una, sin alteración. `SPACE_LEVEL2_CONFIG.cocina` no fue tocado — solo se agregó la entrada `bano` al mismo `Record`, sin modificar ninguna entrada existente (confirmado por diff del archivo).

## T. Otros recintos

Confirmado en el mismo caso QA: Dormitorio 1 (0/12) y Living-comedor (0/11) se generaron y muestran conteos correctos, sin alteración por los cambios de este lote (ninguno de los 2 usa `bano` en su configuración). No se tocó ningún catálogo ajeno a Baño.

## U. Mobile

Verificado a 375×812: `scrollWidth === clientWidth === 375` con el panel de configuración de Baño abierto — sin overflow horizontal.

## V. PDF

Sin cambios al motor PDF — no fue necesario, confirmado en la sección R/Q. Ambos enlaces (resumen/detallado) presentes en la página de resumen del caso QA.

## W. Riesgos

- **Vínculos base nuevos como escritura de catálogo no trivial**: identificado explícitamente como la única "necesidad no prevista" del lote, resuelta con el mismo patrón ya validado en Cocina 11AA, documentada en detalle (sección F) en vez de ejecutada silenciosamente.
- **Copy de Iluminación con referencia textual a "cocina"** (`"¿La iluminación de la cocina enciende correctamente..."`) — confirmado en pantalla, reproduce el mismo artículo transversal ya usado por Cocina sin adaptar su texto al recinto. Ya estaba clasificado explícitamente en 11AS §Q como "pendiente menor de implementación, no de diseño" — **no corregido en este lote** (es una edición de contenido de un `TechnicalArticle` compartido con Cocina, fuera del principio de "cero catálogo nuevo/modificado" de este lote específico); queda como deuda de copy menor para un futuro ajuste transversal, sin bloquear el Lote A.
- **Ningún otro riesgo material detectado.**

## X. Deudas fuera de alcance

- **DT-01** (`defaultSeverity` no preselecciona la UI): no tocada.
- **DT-02** (orders empatados de elementos base): no tocada.

## Y. Git status

Antes: 9 archivos preexistentes modificados (`src/components/module/*`, `src/lib/diagram-v2/*`) + `prisma/db-fixes/inspect-uncertainty-options.ts`, ninguno relacionado con este trabajo — confirmados intactos, sin tocar.

Después:
```
M src/app/(app)/inspecciones/actions.ts
M src/lib/inspecciones/space-config.ts
?? prisma/db-fixes/fase11at-bano-lote-a.ts
```
más los 9 archivos preexistentes (sin cambios adicionales) y los documentos `docs/FASE11A*` ya existentes de la serie. Ningún archivo ajeno tocado.

## Z. Estado final

Lote A de Baño V1 implementado localmente y verificado end-to-end en un caso real: Base=8, Nivel 2=4 decisiones (Terminaciones×3 + Ventana), máximo Lote A=20, legacy `artefactos-sanitarios` gateado exclusivamente para Baño V1 nuevo sin tocar históricos, 0 catálogo nuevo creado (solo 4 vínculos de componentes 100% preexistentes), regresión de Cocina y otros recintos confirmada intacta, mobile sin overflow, PDF funcional sin cambios de motor. QA usuario/caso de prueba eliminados. Regresión completa (tsc/eslint/vitest 95/95/build) limpia.

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AT_IMPLEMENTACION_LOCAL_BANO_LOTE_A.md`
- `prisma/db-fixes/fase11at-bano-lote-a.ts`

Archivos modificados:
- `src/lib/inspecciones/space-config.ts`
- `src/app/(app)/inspecciones/actions.ts`
- `docs/FASE11AS_CONSOLIDACION_CANONICA_BANO_V1.md` (corrección del preflight, sección B)

## REPORTE FINAL

```
PREFLIGHT:
Reutilizados = 10
Resultado = Caso A — error documental puro, corregido en 11AS ("(11)" -> "(10)")

ARCHIVOS MODIFICADOS:
src/lib/inspecciones/space-config.ts
src/app/(app)/inspecciones/actions.ts
docs/FASE11AS_CONSOLIDACION_CANONICA_BANO_V1.md (typo)

ARCHIVOS CREADOS:
prisma/db-fixes/fase11at-bano-lote-a.ts
docs/FASE11AT_IMPLEMENTACION_LOCAL_BANO_LOTE_A.md

BD:
4 vínculos InspectionElementTemplateSpace nuevos (bano<->cielo/enchufes-interruptores/iluminacion/puerta) —
aditivo, idempotente (verificado con 2 ejecuciones). 0 templates/checks/artículos nuevos.

CATÁLOGO:
Sin templates, checks ni artículos nuevos — solo vínculos de componentes preexistentes.

BASE:
8 checks (verificado en caso real)

NIVEL 2 IMPLEMENTADO:
4 decisiones (3 Terminaciones + Ventana)

CONTEOS:
mínimo = 8
máximo Lote A = 20
(ambos verificados end-to-end en navegador, no calculados)

LEGACY:
artefactos-sanitarios histórico = preservado (5 espacios reales verificados sin cambios)
artefactos-sanitarios Baño V1 nuevo = gateado (confirmado: 0 apariciones en caso nuevo)

QA:
lint = OK
typecheck = OK
tests = 95/95 OK
build = OK
mobile = OK (375px sin overflow)
históricos = OK (5 espacios reales, solo lectura, sin cambios)
Cocina = OK (0/7 sin cambios, 3 casos reales sin cambios)
otros = OK (Dormitorio, Living-comedor sin regresión)

PUBLICACIÓN: NO
COMMIT: NO
PUSH: NO
```

## GO / NO-GO

Todos los criterios obligatorios cumplidos: preflight resuelto, base=8, máximo Lote A=20, Nivel 2 con exactamente 4 decisiones, 3 terminaciones reutilizadas sin duplicar catálogo, Ventana reutilizada sin cambios, cero catálogo de contenido nuevo (solo 4 vínculos de componentes preexistentes, justificados explícitamente), cero escrituras sobre datos existentes, históricos intactos, legacy gateado solo para Baño V1 nuevo, Cocina sin romperse, build/tests limpios.

FASE 11AT — BAÑO V1 LOTE A IMPLEMENTADO LOCALMENTE
🟢 INFRAESTRUCTURA LEVEL 2 OPERATIVA
🟢 TERMINACIONES REUTILIZADAS
🟢 VENTANA REUTILIZADA
🟢 LEGACY ARTEFACTOS-SANITARIOS GATEADO PARA BAÑO V1 NUEVO
🟢 HISTÓRICOS PRESERVADOS
🟢 MÍNIMO 8 / MÁXIMO LOTE A 20

DETENERSE. NO PUBLICAR. NO COMMIT. NO PUSH. NO INICIAR LOTE B.
