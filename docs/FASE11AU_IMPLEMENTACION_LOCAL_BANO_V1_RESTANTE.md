# FASE 11AU — Implementación local consolidada de Baño V1 (Lotes B+C+D+E+F)

Modo acelerado — mecánica, sin reabrir decisiones técnicas ya cerradas en 11AK-11AR. Implementación local — sin commit, sin push, sin deploy, sin publicación.

## A. Preflight

Confirmado por consulta solo lectura antes de escribir: las 8 keys nuevas (`extractor-aire`, `wc`, `lavamanos`, `ducha`, `mampara`, `tina`, `mueble-bano`, `cubierta-bano`) estaban **libres**, ninguna existía parcialmente. Vínculos actuales de `bano` confirmados intactos desde 11AT: `piso`(0), `muros`(1), `artefactos-sanitarios`(2), `cielo`(3), `enchufes-interruptores`(4), `iluminacion`(5), `puerta`(6).

Verificación aritmética contra 11AS/enunciado: `2+4+5+6+5+7+4+3 = 36` (Extractor+WC+Lavamanos+Ducha+Mampara+Tina+Mueble+Cubierta) — confirmado, coincide con el enunciado. `12 (Lote A) + 36 = 48` Nivel 2 máximo. `8 (base) + 48 = 56` — coincide exactamente con 11AS §Z (conteo ya corregido en esa fase tras el hallazgo del error aritmético acumulativo de 11AL-11AR).

## B. Script

Un único script consolidado: `prisma/db-fixes/fase11au-bano-lotes-b-f.ts`. Crea los 8 `InspectionElementTemplate`, sus 36 `InspectionChecklistItem` y sus 36 `TechnicalArticle`, con wording/severidad/orden reproducidos literalmente de cada cierre técnico (11AK-11AR) — sin reescribir ni un carácter del contenido ya cerrado. No crea ningún `InspectionElementTemplateSpace` (confirmado en el propio log de ejecución: "0 esperado" para los 8). No toca el vínculo `bano<->artefactos-sanitarios` (confirmado por lectura antes de cualquier escritura, sección A).

## C. Idempotencia

Ejecutado **2 veces** contra la BD compartida. Primera ejecución: "creados" para los 36 checks. Segunda ejecución: mismos `id` de template (`extractor-aire=cmt0u6tra...`, ..., `cubierta-bano=cmt0u71bc...`, verificados idénticos entre ambas corridas), checks reportados como "actualizados" (no duplicados, vía `findFirst` por `elementTemplateId`+`question` antes de `create`). Totales confirmados idénticos en ambas ejecuciones: **8 templates, 36 checks**. Sin duplicados.

## D. Catálogo creado

| Componente | Key | Catálogo `order` | Checks | Severidades |
|---|---|---|---|---|
| Extractor de aire | `extractor-aire` | 20 | 2 | MEDIUM, MEDIUM |
| WC / Inodoro | `wc` | 21 | 4 | MEDIUM, HIGH, MEDIUM, LOW |
| Lavamanos | `lavamanos` | 22 | 5 | LOW, LOW, HIGH, MEDIUM, MEDIUM |
| Ducha | `ducha` | 23 | 6 | LOW, LOW, HIGH, MEDIUM, MEDIUM, MEDIUM |
| Mampara | `mampara` | 24 | 5 | MEDIUM, MEDIUM, HIGH, MEDIUM, MEDIUM |
| Tina / Bañera | `tina` | 25 | 7 | LOW, MEDIUM, LOW, HIGH, MEDIUM, MEDIUM, MEDIUM |
| Mueble de baño / Vanitorio | `mueble-bano` | 26 | 4 | MEDIUM, HIGH, LOW, MEDIUM |
| Cubierta de baño | `cubierta-bano` | 27 | 3 | MEDIUM, LOW, MEDIUM |

Coincide exactamente con las severidades declaradas en cada cierre técnico (11AK-11AR), verificado por el log de ejecución del script.

## E. 8 templates

Confirmados creados y activos, ninguno con `InspectionElementTemplateSpace` (0 vínculos cada uno, 100% Nivel 2, sin generación automática) — verificado en el log de ejecución (sección C) y reconfirmado por consulta directa durante el QA (sección I).

## F. 36 checks

Total confirmado: 2+4+5+6+5+7+4+3 = **36**, verificado tanto por el log del script como por consulta directa a la BD durante el QA funcional (sección I: `TOTAL checks=56` sobre un Baño con las 12 decisiones en Sí, de los cuales 20 son base+Lote A y 36 son Lotes B-F).

## G. Level 2 completo

`SPACE_LEVEL2_CONFIG.bano` extendido en `src/lib/inspecciones/space-config.ts` de 4 a **12 decisiones**, exactamente en el orden y sección especificados en 11AS §N:

```
TERMINACIONES (order 10-12): Revest. cerámico piso, Pintura muro, Revest. cerámico muro
EQUIPAMIENTO DEL RECINTO (order 13-14): Ventana, Extractor de aire
ARTEFACTOS SANITARIOS (order 15-21): WC/Inodoro, Lavamanos, Ducha, Tina, Mampara, Mueble de baño/Vanitorio, Cubierta de baño
```

Confirmado renderizado en pantalla, wording y agrupación exactos (sección I). Sin `metaOptions` en ninguno de los 8 nuevos — confirmado, ninguno de los cierres técnicos definió metadata.

## H. Legacy

Confirmado extremo a extremo, sin debilitar el gate ya establecido en 11AT: el Baño QA nuevo, con las 12 decisiones en Sí, generó exactamente 18 elementos (6 base + 3 terminaciones + 9 Nivel 2 sanitarios/equipamiento) — **ninguno es `artefactos-sanitarios`**. El vínculo de catálogo permanece intacto (verificado en el preflight, sección A, sin tocar en ningún punto del script). Los 5 espacios de Baño históricos reales de Jorge conservan su `artefactos-sanitarios` sin cambios (sección L).

## I. Conteos y escenarios

Verificado end-to-end en un caso real creado a través del formulario completo de la app:

| Configuración | Resultado |
|---|---|
| Todo Nivel 2 = No | **8** (confirmado antes de activar nada) |
| Las 12 decisiones = Sí | **56** (confirmado en pantalla y en BD: `TOTAL checks=56`) |

El desglose completo por componente fue verificado directamente en BD (`config` con las 12 keys en `true`, cada elemento con su conteo de checks exacto: `piso:2, muros:1, cielo:2, enchufes-interruptores:1, iluminacion:1, puerta:1, revestimiento-ceramico-piso:2, pintura-muro:1, revestimiento-ceramico-muro:2, ventana:7, extractor-aire:2, wc:4, lavamanos:5, ducha:6, tina:7, mampara:5, mueble-bano:4, cubierta-bano:3`), sumando exactamente 56. No se ejecutaron las 2^12 combinaciones exhaustivas (no requerido) — se validó el extremo mínimo, el extremo máximo, y las combinaciones/interacciones críticas de la sección J.

## J. QA focalizado

- **Renderizado del panel completo**: las 12 preguntas se mostraron con wording y agrupación por sección exactos al entrar por primera vez, confirmando 11AS §N letra por letra (Ventana antes de Extractor dentro de EQUIPAMIENTO; Tina antes de Mampara dentro de ARTEFACTOS SANITARIOS, orden numérico de catálogo, no orden de cierre técnico).
- **Checklist completo**: los 8 componentes nuevos se generaron con el conteo y wording exactos, verificado leyendo el texto completo renderizado en pantalla para Ventana/Extractor/WC/Lavamanos/Ducha/Tina/Mampara (Mueble/Cubierta confirmados por consulta a BD, sección I).
- **Observación funcional**: probado en WC-Fugas — "Tiene un problema" → comentario → "Guardar hallazgo" → persistido en BD (`status: OBSERVATION`, 1 observación con el comentario exacto). La UI preseleccionó severidad `MEDIA` en el formulario (visible en el resumen: "SEVERIDAD DE LAS OBSERVACIONES... MEDIA: 1"), pese a que `defaultSeverity` del catálogo es `HIGH` — **reproduce exactamente la deuda transversal DT-01 ya documentada** (UI no lee `defaultSeverity`), no un bug nuevo introducido por esta fase.
- **No corresponde funcional**: probado en Lavamanos-Agua fría/caliente — "No corresponde" → motivo opcional → "Guardar" → persistido en BD (`status: NOT_APPLICABLE`).
- **Edición con datos protegidos**: probado el intento de remover WC (que ya tenía la observación registrada) — el guardado **no eliminó el componente ni sus datos** (confirmado en BD: `wc` sigue en `config` como `true`, sus 4 checks y la observación intactos). Esto reproduce correctamente el mecanismo de protección de `saveSpaceLevel2ConfigAction` (exige `confirmedComponentKeys` explícito antes de borrar un componente con datos) — mismo motor genérico de Cocina, sin cambios, funcionando correctamente sobre los componentes nuevos.

No se realizó el QA exhaustivo de los 36 checks individuales — según lo indicado explícitamente, ese nivel de detalle corresponde a 11AV. Se cubrió al menos 1 check representativo por componente vía renderizado en pantalla, y 2 flujos completos de guardado (observación + N/A) verificados extremo a extremo contra BD.

## K. TechnicalArticles

Confirmados los 36 artículos creados (uno por check), con contenido de 7 encabezados reproducido literal de cada cierre técnico — visible en pantalla ("Revisa: ...", texto truncado del artículo) para todos los checks inspeccionados en la sección J. Ninguna fuente elevada ni reescrita — confirmado por comparación directa entre el wording mostrado en pantalla y el contenido de cada cierre técnico (11AK-11AR).

## L. Referencias GOOD/BAD

No se generó ninguna imagen ni referencia permanente en esta fase, según instrucción explícita. Clasificación ya consolidada en 11AS §U (15 ALTO VALOR, 9 OPCIONAL, 20 NO NECESARIA) — sin cambios, queda como backlog para una fase de contenido visual futura.

## M. Históricos

Comparados antes/después, solo lectura: los 5 espacios de Baño reales de Jorge (`las dalias`×2, `casa`×1, `xcxc`×2) conservan exactamente `config: null` y los mismos 3 elementos (`piso`(2), `muros`(1), `artefactos-sanitarios`(3)) — sin cambios en ningún campo, confirmado con consulta directa antes y después de ejecutar el script y de todo el QA funcional.

## N. Cocina — regresión

Confirmado en 2 niveles: (1) las 3 Cocinas reales de Jorge conservan `config: null` y 4 elementos cada una, sin cambios; (2) smoke funcional en el caso QA — Cocina generada automáticamente mostró **0/7** (mínimo intacto) y, al entrar al panel Nivel 2, renderizó exactamente las 9 decisiones originales (3 Terminaciones + Ventana/Puerta/Muebles/Cubierta/Campana en EQUIPAMIENTO + Lavaplatos en AGUA Y DESAGÜE), wording y agrupación sin ningún cambio. `SPACE_LEVEL2_CONFIG.cocina` no fue tocado en esta fase — solo se extendió la entrada `bano` del mismo `Record` (confirmado por diff de archivo).

## O. Mobile

Verificado a 375×812 con el panel completo de 12 decisiones (3 secciones) abierto, incluyendo el label más largo ("Mueble de baño / Vanitorio"): `scrollWidth === clientWidth === 375` — sin overflow horizontal.

## P. PDF

`/inspecciones/[id]/resumen` verificado con el caso QA (Baño mínimo en el resto de espacios, Baño completo con observación+N/A): 86 puntos totales agregados correctamente (7+12+11+56), 1 Observación y 1 No aplica reflejados en el resumen global, ambos enlaces de descarga (resumen/detallado) presentes con `href` correctos. Sin cambios al motor PDF — no fue necesario.

## Q. Git

Antes y después: los 9 archivos preexistentes (`src/components/module/*`, `src/lib/diagram-v2/*`) y `prisma/db-fixes/inspect-uncertainty-options.ts` permanecen sin ningún cambio adicional. Diff final:
```
M src/app/(app)/inspecciones/actions.ts   (ya modificado en 11AT, sin cambios nuevos en esta fase)
M src/lib/inspecciones/space-config.ts    (extendido: 4 -> 12 decisiones de bano)
?? prisma/db-fixes/fase11au-bano-lotes-b-f.ts
?? docs/FASE11AU_IMPLEMENTACION_LOCAL_BANO_V1_RESTANTE.md
```

## R. Deudas fuera de alcance

Confirmadas sin tocar: DT-01 (`defaultSeverity` no preselecciona la UI — reconfirmada en sección J, reproducida honestamente, no corregida), DT-02 (orders empatados de elementos base — sin cambios), `src/lib/diagram-v2/*` y módulos ajenos — ninguno tocado.

## Estado

8 componentes especiales implementados localmente y verificados end-to-end en un caso real: catálogo (8 templates, 36 checks, 36 artículos) aditivo e idempotente; Nivel 2 completo (12 decisiones, 3 secciones); legacy preservado y gateado; históricos intactos; Cocina sin regresión; mínimo 8 / máximo 56 confirmados exactos; mobile sin overflow; PDF funcional; regresión de código (tsc/eslint/vitest 95/95/build) limpia. QA de usuario/caso de prueba eliminados.

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AU_IMPLEMENTACION_LOCAL_BANO_V1_RESTANTE.md`
- `prisma/db-fixes/fase11au-bano-lotes-b-f.ts`

Archivos modificados:
- `src/lib/inspecciones/space-config.ts`

## REPORTE FINAL

```
BD:
script ejecutado = Sí (2 veces, verificando idempotencia)
idempotencia = PASS
shared DB safety = PASS (aditivo, sin tocar históricos ni el vínculo legacy)

CATÁLOGO NUEVO:
templates = 8
checks = 36
artículos = 36

LEVEL 2:
decisiones = 12
secciones = 3

CONTEOS:
mínimo = 8
máximo = 56

LEGACY:
histórico preservado = PASS
Baño V1 sin artefactos-sanitarios = PASS

COMPONENTES:
Extractor = PASS
WC = PASS
Lavamanos = PASS
Ducha = PASS
Mampara = PASS
Tina = PASS
Mueble = PASS
Cubierta = PASS

REGRESIÓN:
Cocina 7/33 = PASS (mínimo 7 verificado en caso real; máximo 33 no re-ejercitado en esta fase, sin cambios de código/catálogo de Cocina — confirmado por diff)
Otros = PASS (sin cambios de catálogo ajeno)

QA:
typecheck = PASS
tests = 95/95 PASS
build = PASS
mobile = PASS (375px, 12 decisiones, sin overflow)
PDF = PASS

COMMIT = NO
PUSH = NO
DEPLOY = NO
```

## GO / NO-GO

Todos los criterios obligatorios cumplidos: 8 templates nuevos correctos, 36 checks correctos, 12 decisiones Nivel 2, mínimo 8, máximo 56, idempotencia PASS, históricos PASS, legacy PASS, Cocina PASS, build/tests PASS, sin trabajo ajeno tocado.

FASE 11AU — BAÑO V1 IMPLEMENTADO LOCALMENTE EN SU TOTALIDAD
🟢 8 COMPONENTES NUEVOS IMPLEMENTADOS
🟢 36 CHECKS NUEVOS IMPLEMENTADOS
🟢 NIVEL 2 COMPLETO — 12 DECISIONES
🟢 LEGACY PRESERVADO
🟢 HISTÓRICOS PRESERVADOS
🟢 MÍNIMO 8 / MÁXIMO 56
🟢 APTO PARA QA INTEGRAL FINAL

DETENERSE. NO COMMIT. NO PUSH. NO DEPLOY.
