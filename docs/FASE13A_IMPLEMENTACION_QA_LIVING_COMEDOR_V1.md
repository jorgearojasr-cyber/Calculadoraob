# FASE 13A — IMPLEMENTACIÓN + QA INTEGRAL DE LIVING-COMEDOR V1

Fase única (modo acelerado): investigación, implementación y QA integral local en un solo documento, siguiendo el mismo patrón de Dormitorio V1 (12A-12C) pero consolidado. NO commit, NO push, NO deploy.

## A. Diagnóstico inicial (investigación read-only)

Auditoría real del repositorio y la BD, sin asumir nada:

- `spaceTemplate.key` real: `living-comedor` (label "Living-comedor", `repeatable: false`).
- Vínculos actuales: `piso`(order 0), `muros`(order 1), `ventana`(order 2), `enchufes-interruptores`(order 3) — **11 checks totales** (2+1+7+1). Coincide exacto con la hipótesis del enunciado.
- Sin vínculo `cielo` ni `iluminacion` — confirmado ausente.
- Sin ningún componente Nivel 2 configurado (`living-comedor` no existía en `SPACE_LEVEL2_CONFIG` ni en `SPACE_LEVEL2_HISTORICAL_ANCHOR`).
- Sin `puerta` vinculada — confirmado, y correctamente no agregada (sección 5 del enunciado: no agregar por simetría con Dormitorio).
- **1 único Living-comedor real** en toda la BD (`space=cmswr1ce9001904jq7ri0bv6f`, `config=null`, elementos `[enchufes-interruptores, muros, piso, ventana]`).

**Hallazgo adicional documentado (fuera de alcance de esta fase)**: existen dos `InspectionSpaceTemplate` separados, `living` (2 casos reales) y `comedor` (1 caso real), usados cuando el usuario elige "Separados" en vez de "Integrados" en el paso de características. Ambos comparten exactamente el mismo patrón/brecha que `living-comedor` (piso, muros, ventana, enchufes-interruptores, sin cielo/iluminación). No se tocan en esta fase — el enunciado de 13A se refiere específicamente a "Living-comedor"; cerrar la misma brecha en `living`/`comedor` queda documentado como oportunidad futura, no ampliada aquí sin instrucción explícita.

**Diagnóstico**: el escenario real coincide exactamente con la hipótesis del enunciado. Se procede a implementar.

## B. Arquitectura encontrada — decisión

Reutilización 100% del motor ya probado en Cocina/Baño/Dormitorio: `SPACE_LEVEL2_CONFIG`, `SPACE_LEVEL2_HISTORICAL_ANCHOR`, `saveSpaceLevel2ConfigAction`, `SpaceLevel2Panel`. Sin nuevo motor, sin nuevas rutas, sin nueva lógica de PDF/ownership.

## C. Implementación

**Código** (`src/lib/inspecciones/space-config.ts`, +34 líneas):
- `SPACE_LEVEL2_CONFIG["living-comedor"]` — 3 decisiones, 1 sección (TERMINACIONES): `revestimiento-ceramico-piso` (+2), `pintura-muro` (+1), `revestimiento-ceramico-muro` (+2). Sin metadata, default No.
- `SPACE_LEVEL2_HISTORICAL_ANCHOR["living-comedor"] = "cielo"`.

**Catálogo**: 0 templates nuevos, 0 checks nuevos, 0 artículos nuevos — confirmado no necesario, tal como esperaba el enunciado (sección 10).

**Script** (`prisma/db-fixes/fase13a-living-comedor-v1.ts`): crea/actualiza únicamente 2 vínculos `InspectionElementTemplateSpace` (`living-comedor<->cielo` order=4, `living-comedor<->iluminacion` order=5), reutilizando 100% los templates existentes.

## D. BD — preflight e impacto

Antes de escribir: `closet`... no aplica acá; para esta fase el impacto previsto fue exactamente: **2 vínculos nuevos, 0 templates, 0 checks, 0 artículos, 0 casos modificados**. Confirmado por auditoría (sección A) antes de ejecutar.

## E. Idempotencia

Ejecutado 2 veces:
- 1ª ejecución: "vínculo creado" ×2.
- 2ª ejecución: "vínculo actualizado" ×2 (mismo `order`, sin duplicar).

Vínculos finales: `piso(0), muros(1), ventana(2), enchufes-interruptores(3), cielo(4), iluminacion(5)`. **PASS.**

## F. Históricos

El único Living-comedor real (`cmswr1ce9001904jq7ri0bv6f`) verificado antes y después de todo el proceso: `config=null`, elementos `[enchufes-interruptores, muros, piso, ventana]`, sin cambios. **1/1 PASS.**

## G. Conteos

Caso QA real creado vía UI (`qa-13a@obrabien.local`):

- **Mínimo (Todo No) = 14** — confirmado por UI (`0/14 revisados`) y BD (`piso(2)+muros(1)+ventana(7)+enchufes(1)+cielo(2)+iluminacion(1)=14`).
- **Máximo (Todo Sí) = 19** — confirmado por UI y BD (14+2+1+2=19).
- **Delta individual** (pintura-muro desactivada desde el máximo): 19→18, exacto -1, sin afectar los otros 2 opcionales ni la base — independencia confirmada.
- Cocina=7, Baño=8, Dormitorio=15 en el mismo caso — sin regresión.

## H. Edición

- Cancelar: se cambió una respuesta desde el máximo y se pulsó "Cancelar" → config permaneció sin cambios (19). **PASS.**
- Guardar: desactivar `pintura-muro` y guardar → persistido correctamente (18). **PASS.**

## I. Observación / N/A

- Observación en Ventana ("¿La ventana abre y cierra correctamente?") → persistida como `OBSERVATION`, comentario correcto.
- N/A en Piso ("¿Presenta desniveles?") → persistido como `NOT_APPLICABLE`.

Smoke representativo, no exhaustivo — sin contenido nuevo que auditar (todo reutilizado).

## J. DT-05

Confirmado: el check de Iluminación en Living-comedor toma el wording ya corregido transversalmente ("¿La iluminación del recinto enciende correctamente...?"), sin necesidad de tocar nada — el fix de 12B es genérico y automático para cualquier recinto nuevo que use `iluminacion`.

## K. PDF

`GET /pdf/resumen` y `/pdf/detallado` → 200, `application/pdf`. Contenido real verificado: resumen por espacios muestra "Living-comedor · 11% · 18 puntos · 1 Observación · 1 No aplica · 16 pendientes" (coincide exacto con BD tras el delta); detallado muestra "LIVING-COMEDOR · VENTANA" con la pregunta, severidad, comentario y referencia técnica correctos.

## L. Mobile

375×812 en el panel Nivel 2 y checklist de Living-comedor: `scrollWidth === clientWidth`, sin overflow horizontal.

## M. Regresión

En el mismo caso QA: Cocina=7, Baño=8, Dormitorio=15 — los 3 mínimos exactos, sin regresión. No se re-verificaron los máximos completos de Cocina/Baño/Dormitorio (33/56/24) — no justificado, ya que el único código tocado (`space-config.ts`) es aditivo por key y no modifica ninguna entrada existente de esos 3 recintos (confirmado por diff: solo se agregó la entrada `living-comedor`, ninguna línea de `cocina`/`bano`/`dormitorio` fue tocada).

## N. Verificación técnica

- `npx tsc --noEmit` → PASS
- `npx eslint .` → PASS
- `npx vitest run` → **95/95 PASS**
- `npx next build` → PASS (29 rutas)

## O. Limpieza QA

Usuario `qa-13a@obrabien.local` y su caso (espacios, elementos, checks, observaciones) eliminados en cascada manual. Confirmado 0 residuos QA.

## P. Bugs

**Bugs encontrados: 0. Bugs corregidos: 0. Bugs abiertos: 0.** Todo se comportó exactamente según la hipótesis del enunciado en el primer intento.

## Q. Git final

`git status --short` / `git diff --stat` / `git diff --check`: único cambio funcional `src/lib/inspecciones/space-config.ts` (+34 líneas), script nuevo `prisma/db-fixes/fase13a-living-comedor-v1.ts`, sin temporales, sin trabajo ajeno modificado.

## REPORTE FINAL

LIVING-COMEDOR V1 — IMPLEMENTACIÓN + QA

Base:
Piso(2) + Muros(1) + Ventana(7) + Enchufes(1) — reutilizados sin cambios
Cielo(2) + Iluminación(1) — reutilizados, vínculo nuevo

Nivel 2:
3 decisiones / 1 sección (TERMINACIONES): revestimiento-ceramico-piso(+2), pintura-muro(+1), revestimiento-ceramico-muro(+2) — todas reutilizadas, sin contenido nuevo.

Templates nuevos: 0
Checks nuevos: 0
Artículos nuevos: 0
Vínculos nuevos: 2

Mínimo: 14 PASS
Máximo: 19 PASS

Deltas: pintura-muro -1 (19→18) verificado exacto, independencia confirmada PASS

Históricos: 1/1 PASS

PDF: PASS (contenido real)

Mobile: PASS

Regresión:
Cocina = PASS (7)
Baño = PASS (8)
Dormitorio = PASS (15)

tsc = PASS
eslint = PASS
vitest = 95/95 PASS
build = PASS

Bugs encontrados = 0
Bugs corregidos = 0
Bugs abiertos = 0

QA temporal eliminado = PASS
BD compartida segura = PASS

GO PUBLICACIÓN = SÍ

## CONTROL FINAL

FASE 13A — LIVING-COMEDOR V1 IMPLEMENTADO Y QA APROBADO
🟢 ARQUITECTURA VERIFICADA
🟢 IMPLEMENTACIÓN COMPLETA
🟢 CONTEOS VERIFICADOS
🟢 HISTÓRICOS PRESERVADOS
🟢 PDF Y MOBILE APROBADOS
🟢 SIN REGRESIÓN
🟢 GO PARA PUBLICACIÓN

DETENERSE.

NO COMMIT.
NO PUSH.
NO DEPLOY.

La siguiente y única fase será:

FASE 13B — PUBLICAR Y CERRAR LIVING-COMEDOR V1
