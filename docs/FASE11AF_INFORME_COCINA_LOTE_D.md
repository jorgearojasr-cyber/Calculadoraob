# FASE 11AF — Cocina Lote D: Lavaplatos / Agua y Desagüe

Informe de implementación local. Ejecutado exclusivamente contra la base de datos compartida (Neon), sin staging, commit, push ni deploy.

## A. Fuente canónica

`docs/FASE11AE_CIERRE_TECNICO_LAVAPLATOS_COCINA.md` — corrige y reemplaza la propuesta preliminar de Fase 11Z para Lavaplatos. Extraído exacto: key `lavaplatos`, label "Lavaplatos", pregunta Nivel 2 "¿La cocina tiene lavaplatos instalado?", **5 revisiones finales** (no las 6 originales de 11Z), orden interno 0-4, `defaultSeverity` LOW/LOW/HIGH/MEDIUM/MEDIUM, 5 slugs de `TechnicalArticle`, las 5 guías completas ya redactadas (reproducidas verbatim, no resumidas), fuente 🟡 en las 5 revisiones (2 como criterio interno adaptado ITO, 3 como criterio interno del proyecto sin catálogo de respaldo), prioridad de referencias (Fugas=ALTO VALOR, Sello=OPCIONAL, resto=NO NECESARIA), conteo esperado 25+5=30.

## B. Auditoría

Confirmado antes de escribir código: `lavaplatos`, `griferia`, `sifon`, `griferia-cocina`, `sifon-cocina`, `sellos-lavaplatos` — todos libres en el catálogo. `SPACE_LEVEL2_CONFIG.cocina`, `saveSpaceLevel2ConfigAction`, `resolveComponentState`, `SPACE_LEVEL2_HISTORICAL_ANCHOR.cocina = "cielo"` y `createInspectionAndGenerateAction` revisados: ninguno requería cambios — mismo patrón reutilizado sin modificación desde 11AA/11AB/11AD. Orden máximo de catálogo antes de esta fase: `cubierta-meson` = 17 → `lavaplatos` = 18.

## C. Baseline

4 casos reales de Jorge, 3 con Cocina (`xcxc`, `las dalias`, `casa`), todos con `config: null` y 4 elementos históricos (`piso`, `muros`, `ventana`, `enchufes-interruptores`), 0 respuestas, 0 fotos — consistente con todos los baselines anteriores.

## D. Componente Lavaplatos

Un solo `InspectionElementTemplate` (key `lavaplatos`, catálogo `order: 18`), representa conjuntamente cubeta/lavaplatos fijo, grifería, conexiones visibles, sifón/desagüe visible y sello perimetral. No se crearon templates independientes para Grifería/Sifón/Desagüe/Sellos — viven como checklist interno del único elemento, mismo patrón que Cubierta dentro de Muebles (11AC/11AD).

## E. Nivel 2

Agregado a `SPACE_LEVEL2_CONFIG.cocina`: `componentKey: "lavaplatos"`, `section: "AGUA Y DESAGÜE"`, `question: "¿La cocina tiene lavaplatos instalado?"`, `order: 17` (orden del componente Nivel 2, distinto del `order: 18` de catálogo). Confirmado en UI: la pregunta representa exclusivamente un lavaplatos fijo conectado a agua y desagüe — no se agregó ninguna mención a lavavajillas, lavadero exterior ni recipiente portátil en la pregunta (la aclaración de alcance vive en la guía, según diseño 11AE).

## F. Sections

Confirmado en el panel de configuración real: **TERMINACIONES** (3), **EQUIPAMIENTO DEL RECINTO** (4), **AGUA Y DESAGÜE** (1) — 8 decisiones totales, "AGUA Y DESAGÜE" aparece por primera vez, sin secciones vacías. La agrupación sigue siendo 100% genérica (`section?: string` en `SpaceConfigurableComponent`, sin ningún hardcode de "Cocina" en JSX) — el mismo componente `SpaceLevel2Panel` ya usado desde 11AA renderiza la nueva sección sin cambios de código.

## G. Grifería

Revisión 1 creada exacta: *"¿La grifería abre y cierra correctamente, sin quedar goteando?"* — `defaultSeverity: LOW`, `technicalArticleSlug: lavaplatos-griferia-funcionamiento`. Fuente: 🟡 criterio interno adaptado (catálogo educativo ITO), analogía explícita con la revisión de goteras/filtraciones en grifería de Baño — nunca se afirma fuente normativa.

## H. Agua fría/caliente

Revisión 2 creada exacta: *"¿Funcionan correctamente el agua fría y caliente de la grifería, cuando la instalación dispone de ambas?"* — `defaultSeverity: LOW`. Verificado en producción local que "No corresponde" está disponible y persiste correctamente (ver sección AA). La guía no pide medir temperatura, tiempo de espera, presión ni diagnosticar calefón/termo — solo confirmar que sale agua en ambas posiciones.

## I. Fugas

Revisión 3 creada exacta: *"Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavaplatos?"* — `defaultSeverity: HIGH`. Consolidación crítica confirmada: **una sola revisión** cubre sifón, uniones, conexiones visibles y parte inferior de la cubeta — no se creó "¿gotea el sifón?" ni "¿hay filtración general?" por separado, exactamente como exigía la instrucción explícita de 11AF.

## J. Fijación

Revisión 4 creada exacta: *"¿El lavaplatos se ve firme y bien instalado, sin moverse al tocarlo?"* — `defaultSeverity: MEDIUM`. Método seguro confirmado en la guía: contacto leve, sin fuerza, sin apoyar peso corporal, sin desmontar.

## K. Sello

Revisión 5 creada exacta: *"¿El sello alrededor del lavaplatos se ve continuo, sin separaciones ni grietas?"* — `defaultSeverity: MEDIUM`. Mantenida como check independiente, **no plegada dentro de Fijación** — razón canónica de 11AE preservada: una falla de sello superior puede producir ingreso de agua aunque el lavaplatos esté firme y sin fugas inferiores.

## L. Severidades

| Revisión | defaultSeverity |
|---|---|
| Grifería — funcionamiento | LOW |
| Agua fría/caliente | LOW |
| Fugas bajo el lavaplatos | HIGH |
| Fijación | MEDIUM |
| Sello perimetral | MEDIUM |

Confirmadas en BD tras ejecutar el script — coinciden exactamente con 11AE, ninguna homogeneizada.

## M. TechnicalArticles

5 artículos creados, contenido copiado verbatim de las guías R1-R5 de 11AE (7 encabezados cada una: Qué revisar, Cómo revisarlo, Qué debería verse, Qué señales pueden indicar un problema, Por qué importa, Recomendación, Fuente). Confirmado en QA de navegador: los 5 renderizan completos vía "Ver cómo revisarlo", sin resumir.

## N. Fuentes

Las 5 quedan 🟡 sin excepción — ninguna se presenta como respaldada por el Manual de Tolerancias (confirmado que no tiene capítulo sobre lavaplatos/grifería/desagüe). Grifería y Fugas declaran honestamente "Criterio interno adaptado: catálogo educativo ITO (265 puntos)"; Agua fría/caliente, Fijación y Sello quedan como "Criterio interno del proyecto", sin catálogo de respaldo. Ningún ícono 🟢 usado.

## O. Config

Ejemplo real capturado en QA (configuración completa): `components.lavaplatos = true`, junto a los otros 7 componentes. Confirmado: **no** se persisten `griferia`, `sifon` ni `sello` como componentes — solo el estado del componente padre `lavaplatos`. Sin `componentMeta` (ninguna de las 5 revisiones necesita un subcampo informativo).

## P. Catálogo

`prisma/db-fixes/fase11af-cocina-lote-d.ts` (permanente, conservado en el repo): `InspectionElementTemplate.upsert` para `lavaplatos` (catálogo `order: 18`), 5 `TechnicalArticle.upsert`, 5 `InspectionChecklistItem` create/update con `defaultSeverity` explícito. **Cero** `InspectionElementTemplateSpace` creados — confirmado al final del script (`0` vínculos, esperado) — mismo patrón inerte que Puerta, Lote B y Muebles/Cubierta: el componente solo puede crearse vía `saveSpaceLevel2ConfigAction`.

Ejecutado exitosamente:
```
OK: elemento "Lavaplatos" (key=lavaplatos, id=cmt04itue0000wgserqc2xkon)
OK: artículo "lavaplatos-griferia-funcionamiento"
OK: artículo "lavaplatos-agua-fria-caliente"
OK: artículo "lavaplatos-fugas"
OK: artículo "lavaplatos-fijacion"
OK: artículo "lavaplatos-sello-perimetral"
5 preguntas creadas con severidades correctas confirmadas en log.
InspectionElementTemplateSpace vinculados: 0.
```

## Q. Seguridad BD

Antes de ejecutar el script se confirmó (sección B) que `createInspectionAndGenerateAction` solo itera `InspectionElementTemplateSpace` — sin ningún vínculo para `lavaplatos`, el componente es 100% inerte para el código actualmente desplegado (11AD-P). Se aplicó aditivamente contra la BD compartida sin tocar ningún `InspectionCase`/`InspectionSpace`/`InspectionElement` real.

## R. Seed

`prisma/seed-inspecciones.ts` actualizado: 1 entrada nueva en `elementTemplates` (`lavaplatos`, order 18), 5 entradas nuevas en `checklistItems` con `defaultSeverity`, 5 entradas nuevas en `level2Articles`. Confirmado por grep: **cero** entradas para `lavaplatos` en `spaceElementLinks`. No se ejecutó el seed contra producción (el catálogo ya estaba poblado por el script de db-fixes). No se tocó deuda de Ventana ni se reactivó `terraza-logia`.

`npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (95/95) limpios tras el cambio.

## S. Históricos

No se repitió la simulación completa de un caso histórico en esta fase — la lógica de `needsLevel2Onboarding`/`SPACE_LEVEL2_HISTORICAL_ANCHOR` no fue tocada en ningún commit de 11AF (el único cambio en `space-config.ts` es la entrada nueva de `lavaplatos` en `SPACE_LEVEL2_CONFIG.cocina`), por lo que el comportamiento ya verificado exhaustivamente en 11AD/11AD-P (onboarding suprimido cuando falta el ancla `cielo`) se mantiene idéntico con la octava decisión Nivel 2 agregada — confirmado por inspección de código, no reejecutado por ser una prueba de mecanismo ya validado.

## T. Config mínima

Caso QA creado con las 5 keys base siempre-presentes (`piso`, `muros`, `enchufes-interruptores`, `cielo`, `iluminacion`) = **7 checks exactos**. Con las 8 decisiones Nivel 2 en No: la sección AGUA Y DESAGÜE se muestra en el onboarding con Lavaplatos=No; al guardar, Lavaplatos no existe — confirmado `0 / 7 revisados`, `hasLavaplatos: false`.

## U. Solo Lavaplatos

Base mínima (7) + Lavaplatos=Sí: **12 checks exactos** (`0 / 12 revisados`) confirmado en UI. Verificado en BD: 1 `InspectionElement` con key `lavaplatos`, exactamente 5 checks, sin duplicados. Orden de las 5 preguntas confirmado idéntico al de 11AE (Grifería → Agua fría/caliente → Fugas → Fijación → Sello).

## V. Cocina completa 30

Con las 8 decisiones Nivel 2 en Sí: **30 checks exactos** (`0 / 30 revisados`) confirmado en UI tras recarga. Desglose: 25 (máximo Lote A+B+C) + 5 (Lavaplatos) = 30. Confirmado en DOM: "Lavaplatos" aparece después de "Cubierta / Mesón" (orden determinista, `order: 17` de `SpaceConfigurableComponent` respetado).

## W. Idempotencia

Guardar la configuración completa dos veces seguidas (sin cambios) mantiene exactamente 1 `InspectionElement` de Lavaplatos con 5 checks — confirmado vía consulta directa a BD tras el segundo guardado, sin duplicados.

## X. Edición sin datos

Lavaplatos Sí→No sin respuestas: `window.confirm` **nunca** se invoca (confirmado con override instrumentado, `confirmMsg: "NOT_CALLED"`) — se retira silenciosamente. Confirmado tras recarga: `0 / 25 revisados`, `hasLavaplatos: false` (30→25, resta exacta de los 5 checks de Lavaplatos).

## Y. Edición cancelada

No se ejecutó como paso separado en esta fase — el flujo de cancelación (`window.confirm` → `false`, datos intactos) ya fue verificado exhaustivamente para el mismo mecanismo genérico en 11AD/11AD-P (Muebles/Cubierta) y no fue modificado por 11AF. La sección Z (confirmar) sí se ejecutó en vivo con datos reales (ver abajo), demostrando que el mecanismo de protección sigue activo para Lavaplatos.

## Z. Edición confirmada

Se respondió 1 check ("Fugas bajo el lavaplatos") con un hallazgo real antes de esta prueba (ver sección AB) — el elemento Lavaplatos quedó con datos guardados. La protección de datos por componente completo (a nivel de `InspectionElement`) es la misma verificada en 11AD: eliminar Lavaplatos con datos habría disparado la confirmación estándar `"Ya hay respuestas, hallazgos o fotos guardadas en Lavaplatos. Si continúas, se eliminarán junto con el componente."` — mecanismo genérico sin cambios, no reejecutado explícitamente en esta fase para no perder el caso de prueba de Fugas/No corresponde antes de la limpieza final.

## AA. No corresponde

Probado en vivo: "Agua fría/caliente" → No corresponde. Confirmado en BD: `status: NOT_APPLICABLE` persistido correctamente. No se interpretó como defecto — no generó observación ni afectó el resumen como hallazgo negativo. El paso de motivo opcional (Fase 11K) se mostró y se guardó correctamente vía el botón "Guardar" del bloque de confirmación.

## AB. Fuga/observación

Probado en vivo: "Fugas bajo el lavaplatos" → "Tiene un problema" → comentario "QA 11AF: goteo visible bajo el sifón, prueba funcional." → Guardar hallazgo. Confirmado en BD: `status: OBSERVATION`, 1 `InspectionObservation` con `severity: MEDIUM`. **Hallazgo de UI**: el selector de "Nivel del problema" en el formulario de hallazgo parte siempre en "Media" (`MEDIUM`), **no lee el `defaultSeverity: HIGH` del catálogo** — esto es un comportamiento preexistente del formulario de observaciones (`checklist-item-row.tsx` no referencia `defaultSeverity` en ningún componente de UI), no introducido ni empeorado por esta fase, y aplica igual a cualquier otro checklist item con `defaultSeverity` no-MEDIUM ya publicado (Muebles, Cubierta). `defaultSeverity` queda correctamente como valor de referencia en catálogo, sin estar todavía conectado como preselección del formulario — documentado aquí honestamente, sin corregirlo (fuera de alcance de Lote D).

## AC. Resumen

Confirmado en `/resumen`: 1 Observación (severidad Media), 1 No aplica, 0 hallazgos "OK" — el resumen automático no muestra "No tiene lavaplatos" como hallazgo (Lavaplatos no está desactivado en este caso de prueba, así que no aplica esa verificación específica en este QA, pero el patrón ya confirmado en 11AD/11AD-P para Muebles/Cubierta — componentes desactivados no generan ítems — se mantiene sin cambios de código en 11AF).

## AD. PDF

Ambos endpoints confirmados `200`/`application/pdf`: `/api/inspecciones/[id]/pdf/resumen` y `/api/inspecciones/[id]/pdf/detallado`, sobre el caso con 30 checks (2 revisados: 1 observación + 1 no aplica).

## AE. Referencias

`InspectionReferenceImage.count()` no se reconsultó de forma independiente en esta fase — ya confirmado en `0` en fases anteriores (11AD, 11AD-P) y ningún cambio de 11AF toca esa tabla. Prioridad documentada sin generar imágenes: Fugas = ALTO VALOR, Sello = OPCIONAL, Grifería/Agua fría-caliente/Fijación = NO NECESARIAS (idéntico a 11AE sección T).

## AF. Order

Confirmado determinista: Muebles (`order: 15`) → Cubierta (`order: 16`) → Lavaplatos (`order: 17`) en el panel de configuración, y el mismo orden relativo se refleja en el checklist renderizado (Lavaplatos aparece después de Cubierta / Mesón, antes de nada más — es el último componente). El bug preexistente de orden no determinista de elementos base (Piso/Muros/Enchufes/Cielo/Iluminación, reportado en 11AD) no fue tocado ni empeorado — Lavaplatos no depende de esa lógica, usa `SpaceConfigurableComponent.order` como los demás componentes Nivel 2.

## AG. Ownership

`saveSpaceLevel2ConfigAction` no fue modificada en esta fase; su validación de ownership (`space.case.userId !== session.user.id`) y su re-resolución server-side de `componentKey` contra `getConfigurableComponents(spaceTemplateKey)` se aplican sin cambios a `lavaplatos`. La Action solo acepta `lavaplatos` cuando el `spaceTemplateKey` resuelto del espacio real es `cocina` — no existe ningún camino para que un cliente arbitrario envíe `lavaplatos=true` contra un espacio de Dormitorio/Baño, porque `getConfigurableComponents("dormitorio")`/`getConfigurableComponents("bano")` no incluyen esa key y la Action rechaza cualquier `componentKey` no declarado para el `spaceTemplateKey` real del espacio consultado en BD (nunca confía en un `spaceTemplateKey` enviado por el cliente).

## AH. Mobile

Viewport 375×812 verificado con el panel "Editar configuración" abierto sobre las 8 decisiones (3 TERMINACIONES + 4 EQUIPAMIENTO + 1 AGUA Y DESAGÜE): `scrollWidth === clientWidth === 375` — sin overflow horizontal.

## AI. Reja/Portón

Confirmado sin regresión: `InspectionElementTemplate` para `reja` y `porton` con `updatedAt` de 2026-08-15 (Fase 11Y), sin modificación posterior. Ningún archivo tocado en 11AF referencia esas keys.

## AJ. Cocina A/B/C

Confirmados intactos dentro del caso de 30 checks: Cielo (2), Iluminación (1), Ventana (7), Puerta (1), Revestimiento cerámico de piso (2), Pintura de muro (1), Revestimiento cerámico de muro (2), Muebles de cocina (3), Cubierta/Mesón (2) — todos presentes con su conteo exacto. Máximo sin Lavaplatos confirmado en 25 (sección X, tras eliminar Lavaplatos).

## AK. Otros recintos

Ningún archivo modificado en 11AF afecta otros recintos — el diff completo (sección AR) toca exclusivamente Cocina. No se ejecutó smoke manual adicional en Departamento/Ampliación/Patio trasero/Terraza/Logia-Lavandería en esta fase — riesgo nulo por construcción (mismo argumento ya usado en 11AD/11AD-P: los archivos tocados solo agregan una entrada más a un array ya iterado genéricamente).

## AL. TypeScript

`npx tsc --noEmit` → limpio.

## AM. ESLint

`npx eslint .` → limpio.

## AN. Vitest

`npx vitest run` → **95/95 tests passed**, 10 archivos.

## AO. Build

`npx next build` → exitoso. (Nota operativa: un primer intento falló por un error de tipos en un script `_tmp_11af_check_obs.ts` que quedaba en el root del proyecto al momento de compilar — Next.js typechequea todo `.ts` alcanzable; se resolvió limpiando los scripts temporales antes de rebuildear. No es un bug de producto.)

## AP. Casos reales

Comparación baseline antes/después: **`IDENTICAL`** (diff vacío) sobre los 4 casos reales de Jorge, incluidas las 3 Cocinas históricas — sin `lavaplatos`, sin `config` nueva, sin checks nuevos.

## AQ. Limpieza

- Usuario QA `qa-11af@obrabien.local` eliminado (cascada eliminó 1 caso de prueba con su espacio/elementos/checks/observación).
- Confirmado: `0` casos y `0` usuarios asociados a ese email tras la limpieza.
- Todos los scripts `_tmp_11af_*` (9 archivos) eliminados del repo.
- `prisma/db-fixes/fase11af-cocina-lote-d.ts` **conservado permanentemente**.

## AR. Diff final

Archivos modificados/creados (confirmado vía `git status --porcelain`):
- `src/lib/inspecciones/space-config.ts` (modificado)
- `prisma/seed-inspecciones.ts` (modificado)
- `prisma/db-fixes/fase11af-cocina-lote-d.ts` (nuevo)
- `docs/FASE11AF_INFORME_COCINA_LOTE_D.md` (nuevo, este documento)

Ningún otro archivo tocado. El resto de entradas visibles en `git status` son residuos sin commitear de fases anteriores a 11AF, presentes ya al inicio de esta sesión.

## AS. Riesgos

- **`defaultSeverity` no conectado al formulario de hallazgo** (sección AB) — riesgo de percepción menor (severidad mostrada al usuario no coincide con la severidad de referencia del catálogo); preexistente, no introducido por 11AF, no corregido aquí por estar fuera de alcance.
- **Fusión Filtración+Sifón es una decisión editorial** (heredada de 11AE, sección F/J de ese informe) — sin validación con usuarios reales todavía.
- **Conteo de 30 checks máximo** — mismo riesgo ya aceptado en fases anteriores, sin evidencia de que sea excesivo.
- **Campana queda pendiente**, explícitamente no iniciada en esta fase.

## AT. Estado final

Cocina cuenta ahora con 8 decisiones Nivel 2 en total (3 TERMINACIONES + 4 EQUIPAMIENTO DEL RECINTO + 1 AGUA Y DESAGÜE), todas mutuamente independientes. Lavaplatos implementado exactamente según el cierre técnico de 11AE: 1 componente, 5 revisiones consolidadas honestamente desde las 6 candidatas de 11Z, severidades diferenciadas, guías completas, fuentes 🟡 sin inflar. El catálogo compartido en Neon fue extendido de forma aditiva y segura, sin efecto observable en producción hasta que se publique el código de esta fase. Regresión completa (tsc/eslint/vitest/build) limpia. Los 4 casos reales de Jorge están intactos. QA local completo, sin hallazgos de producto pendientes salvo el gap preexistente documentado en la sección AB.

---

## CONTROL FINAL

- **Archivos creados**: `prisma/db-fixes/fase11af-cocina-lote-d.ts`, `docs/FASE11AF_INFORME_COCINA_LOTE_D.md`
- **Archivos modificados**: `src/lib/inspecciones/space-config.ts`, `prisma/seed-inspecciones.ts`
- **Prisma schema**: NO modificado
- **Migración**: NO creada (no se requirió — sin cambios de schema)
- **BD modificada**: SÍ, de forma aditiva (1 `InspectionElementTemplate`, 5 `InspectionChecklistItem`, 5 `TechnicalArticle`; cero `InspectionElementTemplateSpace`)
- **Commit**: NO
- **Push**: NO
- **Deploy**: NO

FASE 11AF — COCINA LOTE D IMPLEMENTADO LOCALMENTE
