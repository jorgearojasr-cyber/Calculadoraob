# FASE 14A — IMPLEMENTACIÓN + QA INTEGRAL DE LIVING V1 + COMEDOR V1

Fase única (modo acelerado): investigación, implementación y QA integral local de ambos recintos en un solo documento. NO commit, NO push, NO deploy.

## A. Diagnóstico

Auditoría real (sin asumir el hallazgo de 13A ciegamente, reverificado):

**LIVING**: `key=living`, label "Living", `repeatable:false`. Vínculos: `piso(2), muros(1), ventana(7), enchufes-interruptores(1)` = **11 checks**. Sin `cielo`, sin `iluminacion`. Sin Nivel 2. **2 casos reales**, ambos `config=null`, elementos `[enchufes-interruptores, muros, piso, ventana]`.

**COMEDOR**: `key=comedor`, label "Comedor", `repeatable:false`. Vínculos idénticos: `piso(2), muros(1), ventana(7), enchufes-interruptores(1)` = **11 checks**. Sin `cielo`, sin `iluminacion`. Sin Nivel 2. **1 caso real**, `config=null`, mismos elementos.

Ambos coinciden exactamente con la hipótesis del enunciado — ninguna contradicción arquitectónica. Se procede a implementar ambos juntos con el mismo patrón ya usado en Dormitorio (12B) y Living-comedor (13A).

## B. Implementación

**Código** (`src/lib/inspecciones/space-config.ts`, +61 líneas):
- `SPACE_LEVEL2_CONFIG.living` — 3 decisiones, 1 sección (TERMINACIONES), idénticas a Living-comedor.
- `SPACE_LEVEL2_CONFIG.comedor` — mismas 3 decisiones.
- `SPACE_LEVEL2_HISTORICAL_ANCHOR.living = "cielo"`, `SPACE_LEVEL2_HISTORICAL_ANCHOR.comedor = "cielo"`.
- La entrada `"living-comedor"` (integrado) no fue tocada — confirmado por diff, solo se agregaron entradas hermanas nuevas.

**Catálogo**: 0 templates nuevos, 0 checks nuevos, 0 artículos nuevos — confirmado innecesario, tal como esperaba el enunciado.

**Script único** (`prisma/db-fixes/fase14a-living-comedor-separados-v1.ts`): crea/actualiza 4 vínculos `InspectionElementTemplateSpace` (`living<->cielo`, `living<->iluminacion`, `comedor<->cielo`, `comedor<->iluminacion`, todos order 4/5), reutilizando 100% los templates existentes. Un único script para ambos recintos, como pedía el enunciado.

## C. Impacto BD previsto vs. real

Previsto: 4 vínculos, 0 templates, 0 checks, 0 artículos, 0 casos históricos tocados. Coincidió exacto.

## D. Idempotencia

Ejecutado 2 veces: 1ª "vínculo creado" ×4, 2ª "vínculo actualizado" ×4 (mismo order, sin duplicar). **PASS.**

## E. Históricos

Los 3 espacios reales (2 Living + 1 Comedor) verificados antes y después: `config=null`, elementos `[enchufes-interruptores, muros, piso, ventana]` en los 3, sin cambios. **3/3 PASS.**

## F. Conteos — LIVING

Caso QA real creado vía UI con "Separados" (`qa-14a@obrabien.local`):

- **Mínimo (Todo No) = 14** — confirmado por UI (`0/14`) y BD.
- **Máximo (Todo Sí) = 19** — confirmado por BD (14+2+1+2).
- **Delta individual** (pintura-muro desactivada desde el máximo): 19→18, exacto -1.

## G. Conteos — COMEDOR

- **Mínimo (Todo No) = 14** — confirmado por UI y BD.
- **Máximo (Todo Sí) = 19** — confirmado por BD.
- **Delta individual** (revestimiento-ceramico-piso desactivado desde el máximo): 19→17, exacto -2.

## H. Edición

Probado en Living: cambiar respuesta → "Cancelar" → config sin cambios (19 intacto). Luego cambiar → "Guardar" → persistido correctamente (18). Mismo motor que Comedor — no repetido allí sin necesidad (sin comportamiento distinto observado).

## I. Observación / N/A

- **Living → observación**: check de Cielo ("¿Se observan manchas de humedad en el cielo?") marcado "Tiene un problema" → persistido como `OBSERVATION`, comentario correcto.
- **Comedor → N/A**: check de Piso ("¿Presenta desniveles?") marcado "No corresponde" → persistido como `NOT_APPLICABLE`.

## J. DT-05

Confirmado en ambos: `iluminacion.checks[0].questionSnapshot` = "¿La iluminación del recinto enciende correctamente y el elemento visible se encuentra firme?" en Living y en Comedor — wording genérico ya corregido transversalmente, sin necesidad de tocar nada.

## K. PDF

Un único caso QA con Living + Comedor separados. `GET /pdf/resumen` y `/pdf/detallado` → 200, `application/pdf`. Contenido real verificado:

- Resumen por espacios: "Living · 6% · 18 puntos" y "Comedor · 6% · 17 puntos" — coinciden exacto con los deltas de BD (19-1=18, 19-2=17).
- Detallado: hallazgo "LIVING · CIELO" con pregunta, severidad, comentario y referencia técnica correctos; fila "COMEDOR · Piso · ¿Presenta desniveles? **No aplica**" en la sección de puntos pendientes.

## L. Mobile

375×812 en ambos paneles Nivel 2 (Living y Comedor, mismo motor): `scrollWidth === clientWidth`, sin overflow horizontal.

## M. Regresión

En el mismo caso QA: Cocina=7, Baño=8, Dormitorio=15 — sin regresión. Living-comedor integrado (13/3 sección/decisiones) no verificado con un caso nuevo en esta fase (el caso QA usó "Separados", que excluye el template integrado) — en su lugar, confirmado por inspección directa del diff: la entrada `SPACE_LEVEL2_CONFIG["living-comedor"]` y su ancla histórica permanecen exactamente iguales, sin ninguna línea modificada — prueba suficiente de que no hay regresión posible en código puro sin dependencias de estado compartido.

## N. Verificación técnica

- `npx tsc --noEmit` → PASS
- `npx eslint .` → PASS
- `npx vitest run` → **95/95 PASS**
- `npx next build` → PASS (29 rutas)

## O. Limpieza QA

Usuario `qa-14a@obrabien.local` y su caso (5 espacios, incluidos Living y Comedor) eliminados en cascada manual. 0 residuos QA confirmados por lectura posterior — los 3 espacios históricos reales (2 Living + 1 Comedor) permanecen intactos.

## P. Auditoría final BD

`living<->cielo=1`, `living<->iluminacion=1`, `comedor<->cielo=1`, `comedor<->iluminacion=1`, 0 duplicados. Históricos: 3/3 intactos.

## Q. Bugs

**Bugs encontrados: 0. Bugs corregidos: 0. Bugs abiertos: 0.**

## R. Git final

Único cambio funcional: `src/lib/inspecciones/space-config.ts` (+61 líneas). Script nuevo: `prisma/db-fixes/fase14a-living-comedor-separados-v1.ts`. Sin temporales, sin trabajo ajeno modificado.

## REPORTE FINAL

LIVING + COMEDOR V1 — IMPLEMENTACIÓN + QA

**LIVING**

Base: Piso(2)+Muros(1)+Ventana(7)+Enchufes(1)+Cielo(2)+Iluminación(1) = 14 (reutilizado, 2 vínculos nuevos)
Level 2: 3 decisiones / 1 sección (TERMINACIONES)
Mínimo: 14 PASS
Máximo: 19 PASS
Históricos: 2/2 PASS

**COMEDOR**

Base: idéntica a Living = 14 (reutilizado, 2 vínculos nuevos)
Level 2: 3 decisiones / 1 sección (TERMINACIONES)
Mínimo: 14 PASS
Máximo: 19 PASS
Históricos: 1/1 PASS

**CATÁLOGO**

Templates nuevos = 0
Checks nuevos = 0
Artículos nuevos = 0
Vínculos nuevos = 4
Duplicados = 0

**QA compartido**

Edición = PASS
Observación = PASS
N/A = PASS
PDF = PASS
Mobile = PASS

**Regresión**

Living-comedor integrado = PASS (código sin tocar, confirmado por diff)
Dormitorio = PASS (15)
Cocina = PASS (7)
Baño = PASS (8)

**Técnico**

tsc = PASS
eslint = PASS
vitest = 95/95 PASS
build = PASS

Bugs encontrados = 0
Bugs corregidos = 0
Bugs abiertos = 0

QA eliminado = PASS
BD segura = PASS

GO PUBLICACIÓN CONJUNTA = SÍ

## CONTROL FINAL

FASE 14A — LIVING V1 + COMEDOR V1 IMPLEMENTADOS Y QA APROBADO
🟢 AMBOS RECINTOS IMPLEMENTADOS
🟢 CIELO E ILUMINACIÓN INCORPORADOS
🟢 LEVEL 2 OPERATIVO EN AMBOS
🟢 CONTEOS VERIFICADOS
🟢 HISTÓRICOS PRESERVADOS
🟢 PDF Y MOBILE APROBADOS
🟢 SIN REGRESIÓN
🟢 GO PARA PUBLICACIÓN CONJUNTA

DETENERSE.

NO COMMIT.
NO PUSH.
NO DEPLOY.

La siguiente y única fase será:

FASE 14B — PUBLICAR Y CERRAR LIVING V1 + COMEDOR V1
