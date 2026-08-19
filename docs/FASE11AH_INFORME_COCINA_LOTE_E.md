# FASE 11AH — Cocina Lote E: Campana / Extractor

Informe de implementación local. Ejecutado exclusivamente contra la base de datos compartida (Neon), sin staging, commit, push ni deploy.

## A. Fuente canónica

`docs/FASE11AG_CIERRE_TECNICO_CAMPANA_COCINA.md` — corrige y reemplaza la propuesta preliminar de Fase 11Z para Campana/Extractor. Extraído exacto: key `campana-extractor`, label "Campana / Extractor", pregunta Nivel 2 "¿La cocina tiene campana o extractor instalado?", section EQUIPAMIENTO DEL RECINTO, **3 revisiones finales** con `defaultSeverity` MEDIUM/LOW/MEDIUM, 3 slugs de `TechnicalArticle`, las 3 guías completas ya redactadas (reproducidas verbatim), fuente 🟡 CRITERIO INTERNO sin excepción en las 3 (sin analogía ITO disponible, a diferencia de Lavaplatos), referencias visuales las 3 NO NECESARIAS, conteo esperado 30+3=33.

## B. Auditoría

Confirmado antes de escribir código: `campana`, `extractor`, `campana-extractor`, `campana-cocina`, `extractor-cocina` — todos libres. `SPACE_LEVEL2_CONFIG.cocina`, `saveSpaceLevel2ConfigAction`, `resolveComponentState`, `SPACE_LEVEL2_HISTORICAL_ANCHOR.cocina = "cielo"` y `createInspectionAndGenerateAction` no requerían cambios — mismo patrón reutilizado sin modificación desde 11AA/11AB/11AD/11AF. Orden máximo de catálogo antes de esta fase: `lavaplatos` = 18 → `campana-extractor` = 19.

## C. Baseline

4 casos reales de Jorge, 3 con Cocina (`xcxc`, `las dalias`, `casa`), todos con `config: null` y 4 elementos históricos, 0 respuestas, 0 fotos — consistente con todos los baselines anteriores.

## D. Campana/Extractor

Un solo `InspectionElementTemplate` (key `campana-extractor`, catálogo `order: 19`), representa conjuntamente campana tradicional, decorativa, de isla, extractor integrado o empotrado equivalente. Sin subcomponentes (motor, luz, filtro, ducto, botonera).

## E. Nivel 2

Agregado a `SPACE_LEVEL2_CONFIG.cocina`: `componentKey: "campana-extractor"`, `section: "EQUIPAMIENTO DEL RECINTO"`, `question: "¿La cocina tiene campana o extractor instalado?"`, `order: 18` (orden del componente Nivel 2, distinto del `order: 19` de catálogo). Confirmado en UI local: Campana aparece agrupada bajo EQUIPAMIENTO DEL RECINTO, después de Cubierta / Mesón, tal como diseñó 11AG — no se creó ninguna sección "VENTILACIÓN".

## F. Section

Confirmado en producción local: el panel de onboarding agrupa las 9 decisiones en TERMINACIONES (3), EQUIPAMIENTO DEL RECINTO (5: Ventana, Puerta, Muebles, Cubierta, Campana), AGUA Y DESAGÜE (1: Lavaplatos) — el agrupamiento visual del panel lo determina `section`, sin ningún hardcode de Cocina en JSX (mismo `SpaceLevel2Panel` reutilizado sin cambios de código desde 11AA).

## G. Funcionamiento

Revisión 1 confirmada exacta: *"¿La campana o extractor enciende y responde normalmente a sus controles (velocidades, si tiene más de una)?"* — `defaultSeverity: MEDIUM`, `technicalArticleSlug: campana-extractor-funcionamiento`.

## H. Velocidades

Confirmado: **0** `InspectionChecklistItem` adicional para velocidades — quedan cubiertas dentro de la pregunta de Funcionamiento (sección G), exactamente como cerró 11AG. Sin doble conteo.

## I. Iluminación

Revisión 2 confirmada exacta: *"Si la campana tiene iluminación incorporada, ¿enciende correctamente?"* — `defaultSeverity: LOW`. Sin metadata `tieneLuz` ni pregunta Nivel 2 secundaria — resuelto vía "No corresponde" (sección J).

## J. No corresponde

Probado en vivo: Iluminación → No corresponde. Confirmado en BD: `status: NOT_APPLICABLE`, persiste correctamente, no se interpreta como defecto — comportamiento correcto para campanas sin iluminación por diseño.

## K. Ruido/vibración

Revisión 3 confirmada exacta: *"Al funcionar, ¿presenta vibraciones, golpes o ruidos claramente irregulares (más allá del ruido normal del motor)?"* — `defaultSeverity: MEDIUM`. Probado en vivo con un hallazgo real ("Tiene un problema" + comentario "QA 11AH: vibración irregular al encender."): confirmado en BD `status: OBSERVATION`, `severity: MEDIUM`, comentario persistido.

## L. Extracción descartada

Confirmado: **0** check de extracción/succión/caudal creado. No se adoptó el método casero (hoja de papel) mencionado en 11AG por falta de fuente técnica que lo respalde — decisión reafirmada sin reabrir.

## M. Filtros descartados

Confirmado: **0** check de presencia/limpieza/daño de filtro creado, sin metadata de tipo de filtro.

## N. Ductos descartados

Confirmado: **0** check de ducto/salida/conexión interna creado.

## O. Severidades

| Revisión | defaultSeverity |
|---|---|
| Funcionamiento | MEDIUM |
| Iluminación | LOW |
| Ruido/vibración | MEDIUM |

Confirmadas en BD tras ejecutar el script — coinciden exactamente con 11AG.

## P. TechnicalArticles

3 artículos creados, contenido copiado verbatim de las guías R1-R3 de 11AG (7 encabezados cada una). Confirmado en QA de navegador: los 3 renderizan completos vía "Ver cómo revisarlo".

## Q. Fuentes

Las 3 quedan 🟡 CRITERIO INTERNO sin excepción — ninguna atribuida al Manual de Tolerancias ni al catálogo ITO (a diferencia de Lavaplatos, Campana no tuvo ninguna analogía disponible en el proyecto).

## R. Seguridad

Confirmado en las 3 guías: permitido encender/apagar/cambiar velocidades/probar luz/escuchar/observar vibración; prohibido abrir carcasa, tocar cableado, medir voltaje, tocar el ventilador, revisar el motor, acceder a ductos, subirse a superficies inseguras.

## S. Config

Ejemplo real capturado en QA (configuración completa): `components["campana-extractor"] = true`, junto a los otros 8 componentes. Confirmado: **no** se persiste tipo, marca, cantidad de velocidades, luz ni filtro — solo el estado booleano del componente padre. Sin `componentMeta`.

## T. Catálogo

`prisma/db-fixes/fase11ah-cocina-lote-e.ts` (permanente): `InspectionElementTemplate.upsert` para `campana-extractor` (catálogo `order: 19`), 3 `TechnicalArticle.upsert`, 3 `InspectionChecklistItem` con `defaultSeverity` explícito. Ejecutado exitosamente:
```
OK: elemento "Campana / Extractor" (key=campana-extractor, id=cmt07g16t0000a4sektzfoxyb)
OK: artículo "campana-extractor-funcionamiento"
OK: artículo "campana-extractor-iluminacion"
OK: artículo "campana-extractor-ruido-vibracion"
3 preguntas creadas con severidades correctas confirmadas en log.
InspectionElementTemplateSpace vinculados: 0.
```

## U. Vínculos

Confirmado por precedente (Puerta, derivados Lote B, Muebles, Cubierta, Lavaplatos) y verificado en código: `createInspectionAndGenerateAction` solo itera `InspectionElementTemplateSpace` para generar elementos automáticamente. **Cero** vínculos creados para `campana-extractor` — el componente solo puede crearse vía `saveSpaceLevel2ConfigAction`. No se creó `Cocina↔Campana` por costumbre.

## V. Seguridad BD

Antes de ejecutar el script se confirmó que el template sin vínculos es 100% inerte para el código actualmente desplegado (11AF-P) — mismo argumento ya usado en todas las fases anteriores de esta serie. Se aplicó aditivamente sin tocar ningún `InspectionCase`/`InspectionSpace`/`InspectionElement` real.

## W. Seed

`prisma/seed-inspecciones.ts` actualizado: 1 entrada nueva en `elementTemplates` (`campana-extractor`, order 19), 3 entradas nuevas en `checklistItems` con `defaultSeverity`, 3 entradas nuevas en `level2Articles`. Confirmado por grep: **cero** entradas de `campana-extractor` en `spaceElementLinks`. No se ejecutó el seed contra producción. No se tocó deuda de Ventana, bug de order ni gap de `defaultSeverity` en la UI.

`npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (95/95) limpios tras el cambio.

## X. Históricos

Regla inalterable, sin excepción: Cocinas históricas con `config: null` no reciben onboarding forzado, no reciben Campana/Extractor, no generan checks nuevos. La lógica de `needsLevel2Onboarding`/`SPACE_LEVEL2_HISTORICAL_ANCHOR` no fue tocada — la novena decisión Nivel 2 no altera este mecanismo, confirmado por inspección de código (el único cambio en `space-config.ts` es la entrada nueva en `SPACE_LEVEL2_CONFIG.cocina`).

## Y. Cocina mínima

Caso QA con las 5 keys base (`piso`, `muros`, `enchufes-interruptores`, `cielo`, `iluminacion`) = **7 checks exactos**. Con las 9 decisiones en No: `0 / 7 revisados`, Campana ausente.

## Z. Solo Campana

Base mínima (7) + Campana=Sí: **10 checks exactos** (`0 / 10 revisados`). Verificado en BD: 1 `InspectionElement` con key `campana-extractor`, exactamente 3 checks, orden correcto (Funcionamiento → Iluminación → Ruido/vibración).

## AA. Cocina completa 33

Con las 9 decisiones en Sí: **33 checks exactos** (`0 / 33 revisados`) confirmado tras recarga. Desglose: Base 7 + Cerámico piso 2 + Pintura muro 1 + Cerámico muro 2 + Ventana 7 + Puerta 1 + Muebles 3 + Cubierta 2 + Lavaplatos 5 + Campana 3 = **33**. Nota de orden: en el checklist plano (no el panel de configuración), Campana aparece después de Lavaplatos porque el `order` numérico de `SpaceConfigurableComponent` (18) es mayor que el de Lavaplatos (17) — el agrupamiento visual por `section` solo aplica al panel de onboarding/edición, no al checklist de revisión, que ordena estrictamente por `order` numérico. Comportamiento esperado, ya anticipado en 11AG sección W, no es una regresión.

## AB. Idempotencia

Guardar la configuración completa dos veces seguidas mantiene exactamente 1 `InspectionElement` de Campana con 3 checks — confirmado en BD, sin duplicados.

## AC. Edición sin datos

No se ejecutó como paso aislado adicional en esta fase — el mecanismo es genérico y ya se probó explícitamente para Lavaplatos en la misma sesión de trabajo (11AF); no fue modificado por 11AH.

## AD. Edición cancelar

Con Campana con datos (Funcionamiento=OK, Iluminación=N/A, Ruido=Observación): Sí→No con `window.confirm` interceptado a `false` → mensaje exacto `"Ya hay respuestas, hallazgos o fotos guardadas en Campana / Extractor. Si continúas, se eliminarán junto con el componente."` — confirmado en BD que los 3 checks permanecen intactos tras cancelar (33 checks, estados OK/NOT_APPLICABLE/OBSERVATION sin cambios).

## AE. Edición confirmar

Repetido con `window.confirm` → `true`: Campana eliminada (33→30), sus 3 checks y la observación eliminados junto con ella, **Lavaplatos, Muebles y Cubierta permanecieron intactos** (`hasLavaplatos: true`, `hasMuebles: true`, `hasCubierta: true`) — cero huérfanos.

## AF. defaultSeverity gap

Reconfirmado, no corregido: el formulario de observación de Ruido/vibración inició en `MEDIUM` en el selector — coincide con el `defaultSeverity: MEDIUM` de catálogo en este caso particular (por eso no se notó discrepancia visual), pero el comportamiento subyacente sigue siendo el mismo gap ya documentado en 11AF-P: el formulario **no lee** `defaultSeverity` del catálogo, simplemente su valor por defecto hardcodeado (`MEDIUM`) coincide por casualidad con el de esta revisión. Confirmado que esta fase **no empeora** el gap — es exactamente el mismo comportamiento preexistente, sin cambios de código en el formulario de observación.

## AG. Resumen

Confirmado en `/resumen`: sin mención de "no tiene campana" como hallazgo. El caso con Funcionamiento=OK, Iluminación=N/A y Ruido=Observación se resumió correctamente reflejando 1 Observación y 1 No aplica.

## AH. PDF

Ambos endpoints confirmados `200`/`application/pdf`: `/api/inspecciones/[id]/pdf/resumen` y `/api/inspecciones/[id]/pdf/detallado`.

## AI. Referencias

`InspectionReferenceImage.count()` = **0**, consultado en esta fase. Las 3 revisiones quedan NO NECESARIAS (sin generar imágenes), tal como cerró 11AG.

## AJ. Order

Confirmado determinista: Muebles → Cubierta → Campana en el panel de configuración (agrupados bajo EQUIPAMIENTO DEL RECINTO por `section`); en el checklist plano, el orden sigue el `order` numérico puro (Lavaplatos antes de Campana, ver sección AA). Campana no introduce aleatoriedad propia — usa `SpaceConfigurableComponent.order` como los demás componentes Nivel 2. El bug preexistente de orden no determinista de elementos base no fue tocado.

## AK. Ownership

`saveSpaceLevel2ConfigAction` no fue modificada en esta fase. Confirmado por lectura de código: `campana-extractor` solo se acepta cuando el `spaceTemplateKey` resuelto del espacio real (consultado en BD) es `cocina` — no existe camino para inyectarlo en otro recinto.

## AL. Mobile

Viewport 375×812 verificado con el panel "Editar configuración" abierto sobre las 9 decisiones: `scrollWidth === clientWidth === 375` — sin overflow horizontal.

## AM. Reja/Portón

Confirmado sin regresión: `reja` y `porton` con `updatedAt` de 2026-08-15 (Fase 11Y), sin modificación posterior. Ningún archivo tocado en 11AH referencia esas keys.

## AN. Cocina A/B/C/D

Confirmados intactos dentro del caso de 33 checks: Cielo (2), Iluminación (1), Ventana (7), Puerta (1), Cerámico piso (2), Pintura muro (1), Cerámico muro (2), Muebles (3), Cubierta (2), Lavaplatos (5) — todos presentes con su conteo exacto. Máximo sin Campana confirmado en 30 (sección AE).

## AO. Otros recintos

Ningún archivo modificado en 11AH afecta otros recintos — el diff completo (sección AV) toca exclusivamente Cocina. No se repitió QA exhaustivo de otros tipos de inmueble en esta fase — riesgo nulo por construcción, mismo argumento ya aceptado en fases anteriores de esta serie.

## AP. TypeScript

`npx tsc --noEmit` → limpio.

## AQ. ESLint

`npx eslint .` → limpio.

## AR. Vitest

`npx vitest run` → **95/95 tests passed**, 10 archivos.

## AS. Build

`npx next build` → exitoso (scripts temporales eliminados antes del build, dev server detenido).

## AT. Casos reales

Comparación baseline antes/después: **`IDENTICAL`** (diff vacío) sobre los 4 casos reales de Jorge, incluidas las 3 Cocinas históricas — sin `campana-extractor`, sin `config` nueva, sin checks nuevos.

## AU. Limpieza

- Usuario QA `qa-11ah@obrabien.local` eliminado (cascada eliminó 1 caso de prueba con su espacio/elementos/checks/observación).
- Confirmado: `0` casos y `0` usuarios asociados a ese email tras la limpieza.
- Todos los scripts `_tmp_11ah_*` eliminados del repo.
- `prisma/db-fixes/fase11ah-cocina-lote-e.ts` **conservado permanentemente**.

## AV. Diff final

Archivos modificados/creados (confirmado vía `git status --porcelain`):
- `src/lib/inspecciones/space-config.ts` (modificado)
- `prisma/seed-inspecciones.ts` (modificado)
- `prisma/db-fixes/fase11ah-cocina-lote-e.ts` (nuevo)
- `docs/FASE11AH_INFORME_COCINA_LOTE_E.md` (nuevo, este documento)

Ningún otro archivo de código tocado.

## AW. Riesgos

- **defaultSeverity gap sigue vigente** (sección AF) — deuda transversal, no específica de Campana, no corregida.
- **Bug de orden de elementos base sin corregir** — deuda transversal, no específica de Campana.
- **Orden Campana vs. Lavaplatos en el checklist plano** (sección AA) puede sorprender visualmente a un usuario que espera ver Campana antes de Lavaplatos porque así aparece en el panel de configuración — riesgo de percepción menor, ya documentado, no bloqueante.

## AX. Estado funcional Cocina V1

Con Campana/Extractor implementado, el catálogo funcional de Cocina diseñado originalmente en Fase 11Z queda **100% resuelto**: Piso, Muros, Enchufes, Cielo, Iluminación (siempre presentes), Ventana, Puerta, Muebles de cocina (con Cubierta foldeada), Lavaplatos (con Grifería/Fugas/Fijación/Sello foldeados), Campana/Extractor — los 9 componentes/derivados identificados en el diseño original están implementados localmente. **Catálogo de Cocina V1 funcionalmente cerrado**, pendiente solo de publicación.

## AY. Estado final

Campana/Extractor de Cocina implementado exactamente según el cierre técnico de 11AG: 1 componente, 9na decisión Nivel 2, 3 revisiones consolidadas (velocidades folded en Funcionamiento, extracción/filtros/ductos descartados), severidades MEDIUM/LOW/MEDIUM, guías completas, fuentes 🟡 sin excepción. El catálogo compartido en Neon fue extendido de forma aditiva y segura, sin efecto observable en producción hasta que se publique el código de esta fase. Regresión completa (tsc/eslint/vitest/build) limpia. Los 4 casos reales de Jorge están intactos. QA local completo, sin hallazgos de producto pendientes salvo las deudas transversales ya conocidas (defaultSeverity UI, bug de order).

---

## CONTROL FINAL

- **Archivos creados**: `prisma/db-fixes/fase11ah-cocina-lote-e.ts`, `docs/FASE11AH_INFORME_COCINA_LOTE_E.md`
- **Archivos modificados**: `src/lib/inspecciones/space-config.ts`, `prisma/seed-inspecciones.ts`
- **Prisma schema**: NO modificado
- **Migración**: NO creada
- **BD modificada**: SÍ, de forma aditiva (1 `InspectionElementTemplate`, 3 `InspectionChecklistItem`, 3 `TechnicalArticle`; cero `InspectionElementTemplateSpace`)
- **Commit**: NO
- **Push**: NO
- **Deploy**: NO

FASE 11AH — COCINA LOTE E IMPLEMENTADO LOCALMENTE
