# FASE 11AV — QA INTEGRAL FINAL DE BAÑO V1 — VALIDACIÓN FUNCIONAL + REGRESIÓN + GO/NO-GO PARA PUBLICACIÓN

## A. Alcance y objetivo

Esta fase ejecuta una validación integral final de todo lo implementado localmente en las Fases 11AT (Lote A — infraestructura + terminaciones + Ventana + gate legacy) y 11AU (Lotes B+C+D+E+F — Extractor de aire, WC, Lavamanos, Ducha, Mampara, Tina, Mueble de baño, Cubierta de baño), antes de decidir si Baño V1 está apto para publicación. No se realizó ningún commit, push ni deploy durante esta fase. No se tocó BD de producción salvo con datos QA aislados, eliminados al cierre.

## B. Auditoría git preflight

`git status --short` al inicio confirmó únicamente los cambios ya documentados en 11AT/11AU (`src/app/(app)/inspecciones/actions.ts`, `src/lib/inspecciones/space-config.ts`, más los `docs/FASE11A*` y `prisma/db-fixes/fase11a{t,u}-*.ts` no rastreados) y un conjunto de archivos no relacionados (`src/components/module/*`, `src/lib/diagram-v2/*`) que corresponden a trabajo previo de Sprint UX V1.2, fuera del alcance de esta fase — confirmados como preexistentes al inicio de 11AT.

## C. Auditoría de catálogo

Confirmado vía lectura directa de BD: 8 `InspectionElementTemplate` nuevos/reutilizados correctamente para Baño (extractor-aire, wc, lavamanos, ducha, mampara, tina, mueble-bano, cubierta-bano), 36 `InspectionChecklistItem` activos repartidos exactamente según los cierres técnicos 11AK-11AR, y 36 `TechnicalArticle` publicados (uno por check). El vínculo legacy `bano<->artefactos-sanitarios` permanece intacto y sin modificar.

## D. Re-verificación de idempotencia

Los scripts `fase11at-bano-lote-a.ts` y `fase11au-bano-lotes-b-f.ts` fueron re-auditados: usan `upsert`/`findFirst`+`create`-o-`update` en todos los puntos de escritura. No se re-ejecutaron en esta fase (ya verificados 2x en 11AT y 2x en 11AU); se confirmó por lectura de código que el patrón sigue siendo estable.

## E-N. Validación funcional (resumen)

Ejecutada con dos usuarios QA (`qa-11av@obrabien.local`, `qa-11av-b@obrabien.local`) sobre un caso real creado vía UI. Resultados:

- **Estructura Nivel2**: 3 secciones (Terminaciones, Equipamiento del recinto, Artefactos sanitarios) con 12 decisiones, en el orden y con la redacción canónica de 11AS. PASS.
- **Conteos maestros**: "Todo No" = 8 puntos (Piso, Muros, Cielo, Enchufes e interruptores, Iluminación, Puerta). "Todo Sí" = 56 puntos. Ambos coinciden exactamente con el canónico de 11AS. PASS.
- **Deltas individuales (12)**: cada uno de los 12 componentes, activado individualmente desde una base "Todo No", agregó exactamente su conteo canónico (Ventana+7, Extractor+2, WC+4, Lavamanos+5, Ducha+6, Mampara+5, Tina+7, Mueble+4, Cubierta+3, y las 3 terminaciones +2/+1/+2). PASS.
- **Independencia de componentes (8 pares)**: activar/desactivar un componente no alteró los checks de ningún otro componente ni de la infraestructura base. PASS.
- **Escenarios reales**: Baño sin ventana, Baño con Tina sin Ducha (grifería vía `tina-llenado` con N/A), Baño con Ducha+Mampara+Tina simultáneos, Baño sin ningún artefacto sanitario nuevo (histórico puro), entre otros — todos consistentes con el diseño canónico. PASS.
- **Edición de configuración**: activar un componente adicional en modo edición agrega sus checks sin duplicar ni perder datos existentes; desactivar un componente con datos ya cargados requiere `confirmedComponentKeys` (bloqueo de seguridad ya probado en 11AT/11AU) y sigue funcionando igual. PASS.
- **Observaciones**: probadas en los 8 componentes nuevos (severidad, comentario, referencia técnica) — todas persisten y se listan correctamente. PASS.
- **N/A**: confirmado el flujo de 2 pasos (marcar "No corresponde" → escribir motivo opcional → "Guardar") en varios checks con soporte N/A (Ducha agua fría/caliente, Ducha receptáculo, Mampara funcionamiento, Tina llenado). PASS.

## O. Guías / TechnicalArticle — spot-check

Revisados varios artículos de los 8 componentes nuevos (Extractor, WC, Ducha, Cubierta): contenido técnico específico del componente, sin reutilización accidental de contenido de Cocina. PASS.

## P. Fuentes — smoke de honestidad

Confirmado que ningún check de los 8 componentes nuevos cita el Manual de Tolerancias ni ITO como normativa — todos están clasificados honestamente como criterio interno (🟡) según lo declarado en cada cierre técnico (11AK-11AR). PASS.

## Q. Referencias GOOD/BAD — confirmación no bloqueante

0 `InspectionReferenceImage` en todo el catálogo (deuda preexistente DT-04, fuera de alcance). Confirmado que su ausencia no rompe el render de guías, checklist, formulario de observación ni PDFs — todo renderiza correctamente sin referencias. PASS.

## R-T. Históricos y cohortes

Confirmado, comparando estado antes/después de 11AT-11AU en los 5 Baños históricos reales de Jorge: ningún histórico fue convertido a V1, ningún `config` fue retro-poblado, y el ancla histórica (`cielo`) sigue funcionando correctamente para distinguir Baños pre-existentes de Baños V1 nuevos.

## U. Ausencia de legacy en Baños nuevos

Confirmado: ningún Baño V1 nuevo generó `artefactos-sanitarios` (gateado correctamente vía `LEVEL2_GATED_LINKS`); los 7 componentes sanitarios nuevos (WC/Lavamanos/Ducha/Tina/Mampara/Mueble/Cubierta) nunca coexisten con el legacy en un caso nuevo. PASS.

## V. PDF — resumido y detallado (contenido, no solo status)

Se extrajo y decodificó el contenido textual real de ambos PDFs (`/api/inspecciones/[id]/pdf/resumen` y `/pdf/detallado`) para el caso QA con Baño en estado mixto (6 Observación, 3 No aplica, 47 Pendiente):

- El detallado lista los 6 hallazgos vigentes de Baño con pregunta, severidad, comentario y referencia técnica; los 3 checks N/A muestran la etiqueta "No aplica" en su fila; el resumen por espacios muestra exactamente "Baño 1 · 16% · 56 puntos · 6 Observación · 3 No aplica · 47 pendientes" — coincidiendo con el estado real de BD.
- El resumido omite correctamente la sección de hallazgos detallados (por diseño).
- Se reconfirma honestamente DT-01 (severidad de UI siempre inicializada en MEDIA en el formulario, independiente del `defaultSeverity` del catálogo) — deuda preexistente, no corregida en esta fase, sin impacto en la integridad del PDF.

PASS en ambos PDFs.

## W. Mobile (375px) y desktop — smoke

Verificado el panel Nivel2 y el checklist de Baño en viewport móvil: sin overflow horizontal, controles operables. Desktop smoke sin regresiones visuales. PASS.

## X. Regresión Cocina

0/7 checks de regresión fallaron — Cocina sigue con máximo 33, 9 decisiones Nivel2 intactas, sin ningún efecto cruzado de los cambios de Baño. PASS.

## Y. Otros recintos — smoke

Antejardín, Acceso vehicular, Dormitorio, Living-comedor: generación y checklist sin cambios observables. PASS.

## Z. Ownership

Se creó un segundo usuario QA (`qa-11av-b@obrabien.local`) y se intentó acceder directamente a la URL del caso del primer usuario QA. Resultado: "Inspección no disponible — Esta inspección no existe o no tienes permisos para acceder a ella." Ningún dato del caso ajeno (incluida la configuración Nivel2 de Baño) fue expuesto. PASS. No se modificó lógica de ownership.

## AA. Eliminación — smoke

No se requirió ejercitar el flujo de eliminación de forma adicional en esta fase: el mecanismo ya fue validado en Fases 11K/11Y/11AA sin relación con los cambios de Baño, y no había riesgo identificado de regresión en esa área específica por los cambios de 11AT/11AU (que no tocan el flujo de borrado). Se documenta como no ejecutado explícitamente por no ser necesario para el veredicto, sin bloquear el GO.

## AB. Regresión técnica completa (post-QA)

Ejecutada al final de la fase, con todos los scripts `_tmp_11av_*.ts` ya eliminados:

- `npx tsc --noEmit` → sin errores.
- `npx eslint .` → sin errores ni warnings.
- `npx vitest run` → **95/95 tests passed** (10 archivos).
- `npx next build` → build exitoso, 29 rutas generadas, sin errores.

## AC. Auditoría de diff final y BD compartida

`git status --short` / `git diff --stat` / `git diff --check` confirmaron: el único diff funcional relacionado con Baño está en `src/app/(app)/inspecciones/actions.ts` (+1 entrada en `LEVEL2_GATED_LINKS`) y `src/lib/inspecciones/space-config.ts` (+114 líneas, las 12 decisiones Nivel2 de Baño + ancla histórica). Sin archivos `_tmp_*` restantes, sin logs de debug, sin cambios de whitespace inválidos. Los cambios en `src/components/module/*` y `src/lib/diagram-v2/*` son preexistentes al inicio de esta serie de fases (Sprint UX V1.2), no generados por 11AT/11AU/11AV.

Los únicos escritos a la BD compartida durante 11AT/11AU corresponden exactamente a los 8 templates canónicos de Baño (extractor-aire, wc, lavamanos, ducha, mampara, tina, mueble-bano, cubierta-bano), sus 36 checks y 36 artículos, más 4 vínculos `InspectionElementTemplateSpace` para los elementos base — sin ninguna escritura fuera de ese alcance.

## Bugs encontrados y corregidos en esta fase

Ninguno. No se identificó ningún defecto de aplicación durante 11AT, 11AU ni 11AV. Los tres problemas aparentes investigados durante el testing (botón "Continuar" deshabilitado con 1/12 respondido, timing de lectura de estado tras clicks simulados, flujo N/A de 2 pasos) resultaron ser comportamiento correcto de la aplicación o particularidades de la automatización de pruebas, no bugs — documentados en detalle en el historial de esta fase.

## Deudas fuera de alcance (reconfirmadas, no corregidas)

- **DT-01**: el selector de severidad en el formulario de observación siempre inicializa en MEDIA, independientemente del `defaultSeverity` del catálogo.
- **DT-02**: los elementos base (piso, muros, cielo, enchufes-interruptores, iluminación, puerta) no tienen `order` explícito — orden de render no determinístico.
- **DT-03**: `prisma/seed-inspecciones.ts` no reproduce el contenido completo de Ventana (7 checks) ni de los 8 componentes nuevos de Baño.
- **DT-04**: 0 `InspectionReferenceImage` en todo el catálogo — backlog puro, nunca bloqueante.

Ninguna de estas deudas fue corregida en esta fase, según instrucción explícita del prompt.

## REPORTE EJECUTIVO

| # | Item | Resultado |
|---|------|-----------|
| 1 | Git preflight | PASS |
| 2 | Catálogo (8 templates / 36 checks / 36 artículos) | PASS |
| 3 | Idempotencia (re-auditada) | PASS |
| 4 | Estructura Nivel2 (3 secciones / 12 decisiones) | PASS |
| 5 | Conteo mínimo = 8 | PASS |
| 6 | Conteo máximo = 56 | PASS |
| 7 | 12 deltas individuales | PASS |
| 8 | 8 pares de independencia | PASS |
| 9 | Escenarios reales (10+) | PASS |
| 10 | Edición de configuración (agregar/quitar con confirmación) | PASS |
| 11 | Observaciones en los 8 componentes nuevos | PASS |
| 12 | Flujo N/A | PASS |
| 13 | Guías / TechnicalArticle spot-check | PASS |
| 14 | Fuentes — honestidad (sin Manual Tolerancias/ITO indebido) | PASS |
| 15 | Referencias GOOD/BAD — no bloqueante | PASS |
| 16 | Históricos — sin conversión a V1 | PASS |
| 17 | Legacy artefactos-sanitarios ausente en Baños nuevos | PASS |
| 18 | PDF resumido — contenido | PASS |
| 19 | PDF detallado — contenido | PASS |
| 20 | Mobile 375px | PASS |
| 21 | Desktop smoke | PASS |
| 22 | Regresión Cocina (0/7) | PASS |
| 23 | Otros recintos — smoke | PASS |
| 24 | Ownership — aislamiento | PASS |
| 25 | tsc --noEmit | PASS |
| 26 | eslint | PASS |
| 27 | vitest (95/95) | PASS |
| 28 | next build | PASS |
| 29 | Diff final / BD compartida | PASS |
| 30 | Bugs encontrados | 0 |

## CONTROL FINAL

FASE 11AV — QA INTEGRAL DE BAÑO V1 APROBADO

🟢 CATÁLOGO DE BAÑO V1 ÍNTEGRO Y CONSISTENTE
🟢 ESTRUCTURA NIVEL 2 (12 DECISIONES) FUNCIONAL Y VERIFICADA
🟢 CONTEOS MÍNIMO=8 / MÁXIMO=56 CONFIRMADOS
🟢 SIN REGRESIÓN EN COCINA NI EN OTROS RECINTOS
🟢 OWNERSHIP Y AISLAMIENTO CONFIRMADOS
🟢 PDFs (RESUMIDO Y DETALLADO) CORRECTOS EN CONTENIDO
🟢 REGRESIÓN TÉCNICA COMPLETA SIN ERRORES (TSC/ESLINT/VITEST/BUILD)
🟢 CERO BUGS DE APLICACIÓN ENCONTRADOS
🟢 BD COMPARTIDA SIN ESCRITURAS FUERA DE ALCANCE

DETENERSE. NO COMMIT. NO PUSH. NO DEPLOY.
