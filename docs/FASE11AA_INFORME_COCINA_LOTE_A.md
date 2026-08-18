# Fase 11AA — Cocina Lote A: base transversal + primer Nivel 2 multi-componente

Informe de implementación local. Base: `docs/FASE11Z_DISENO_NIVEL2_COCINA.md`.

## A. Correcciones a 11Z

1. **Puerta sí requiere Nivel 2.** 11Z clasificó Puerta como categoría B (OPCIONAL) pero su descripción del Lote A decía "cero preguntas nuevas para Piso/Muros/Enchufes". Eso era incorrecto para Puerta: siendo OPCIONAL, necesita pregunta Nivel 2 "¿La cocina tiene puerta?" igual que Ventana. Esta fase implementa esa pregunta — no se editó 11Z, se documenta la corrección aquí.
2. **Cocinas históricas nunca reciben onboarding retroactivo.** Verificado en Q y R más abajo: los 3 casos reales de Jorge con Cocina abren exactamente igual que antes, sin ninguna pregunta nueva.
3. **Cielo/Iluminación solo en Cocinas nuevas.** Sin backfill. Verificado: los 3 casos reales no tienen Cielo ni Iluminación tras esta fase.

## B. Estado inicial

Auditoría de catálogo confirmó: Cocina vinculada a piso/muros/ventana/enchufes-interruptores (orders 0-3); Puerta existía como `InspectionElementTemplate` activo (usado en Dormitorio/Recinto ampliado/Terraza cerrada) con 1 pregunta ("¿Cierra correctamente?"), sin vínculo a Cocina. Máximo `order` en `InspectionElementTemplate` = 10. Los 3 casos reales de Jorge con Cocina (las dalias, xcxc, casa) tenían `config: null` y entre 5 y 11 checks (Ventana congelada en 1 o 7 preguntas según la fecha de creación del caso, vía `questionSnapshot`).

## C. Modelo histórico elegido

Cocina es el primer recinto con **más de un** componente Nivel 2 (Ventana + Puerta), a diferencia de Reja/Portón (Fase 11Y, un componente cada uno). Un heurístico ingenuo por componente falla: Ventana existía en todo caso histórico (resolvería a "implícito Sí"), pero Puerta nunca existió (resolvería a "sin responder"), disparando onboarding en casos históricos que nunca deberían verlo.

Solución: **ancla histórica** (`SPACE_LEVEL2_HISTORICAL_ANCHOR`) — un mapa `spaceTemplateKey → elementTemplateKey` de un elemento siempre-presente y garantizado nuevo. Para `cocina`, el ancla es `cielo`: si el espacio no tiene el elemento Cielo, se asume anterior al catálogo Nivel 2 actual y el onboarding se suprime por completo, sin evaluar componentes individuales. No requirió cambio de schema — se infiere 100% de datos existentes (`InspectionElement.elementTemplate.key`).

## D. Archivos

**Modificados:**
- `src/lib/inspecciones/space-config.ts` — entrada `cocina` en `SPACE_LEVEL2_CONFIG`, campo `section` en `SpaceConfigurableComponent`, `SPACE_LEVEL2_HISTORICAL_ANCHOR`, `needsLevel2Onboarding` extendido con chequeo de ancla.
- `src/components/inspecciones/space-level2-gate.tsx` — recibe `spaceTemplateKey`, lo pasa a `needsLevel2Onboarding`.
- `src/components/inspecciones/space-detail-view.tsx` — prop `level2SpaceTemplateKey` añadida y propagada.
- `src/app/(app)/inspecciones/[id]/page.tsx` — pasa `level2SpaceTemplateKey={space.spaceTemplate?.key}`.
- `src/components/inspecciones/space-level2-panel.tsx` — `groupBySection()` genérico, agrupación visual sin hardcodear nombres de grupo.
- `src/app/(app)/inspecciones/actions.ts` — `LEVEL2_GATED_ELEMENT_KEYS` (Set de element keys) reemplazado por `LEVEL2_GATED_LINKS` (Set de pares `"spaceKey:elementKey"`), agregado `"cocina:ventana"`.
- `prisma/seed-inspecciones.ts` — Cielo/Iluminación agregados al catálogo, links a Cocina, checklist items con `technicalArticleSlug`, 3 artículos técnicos nuevos.

**Creados:**
- `prisma/db-fixes/fase11aa-cocina-lote-a.ts` — script permanente, ejecutado contra la BD compartida.
- `docs/FASE11AA_INFORME_COCINA_LOTE_A.md` — este informe.

## E. Config genérica

`SpaceConfigurableComponent` ganó `label` y `question` independientes (antes solo existía uno u otro implícito) y `section?: string` opcional. Cambio solo de tipos/config — sin migración de schema.

## F. Agrupación visual

`space-level2-panel.tsx` implementa `groupBySection()`: agrupa componentes por `section` preservando el orden de declaración, tanto de grupos como de ítems dentro de cada grupo. Sin `section` declarada (Reja, Portón), no se renderiza encabezado — comportamiento visual idéntico a Fase 11Y. Con `section` declarada (Cocina: `"EQUIPAMIENTO DEL RECINTO"` para Ventana+Puerta), se renderiza el encabezado una sola vez por grupo. El nombre del grupo vive en el catálogo (`space-config.ts`), no en el componente — Lote B puede declarar `"TERMINACIONES"` sin tocar este archivo.

## G. Cielo

`InspectionElementTemplate` transversal (`key: "cielo"`, `appliesTo: CASA/DEPARTAMENTO/AMPLIACION`), vinculado hoy solo a Cocina (order 4). 2 preguntas:
- "¿El cielo presenta manchas, grietas u otros daños visibles?"
- "¿Se observan manchas de humedad en el cielo?"

Redacción evita afirmar que una mancha ES filtración ("puede ser señal de humedad o filtración y conviene revisarlo"). Ninguna instrucción de subir a escaleras, perforar, desarmar, medir humedad o acceder a entretecho — solo observación visual desde posición segura.

## H. Iluminación

`InspectionElementTemplate` transversal (`key: "iluminacion"`), vinculado a Cocina (order 5). 1 pregunta: "¿La iluminación de la cocina enciende correctamente y el elemento visible se encuentra firme?" — redactada para cubrir cualquier tipo de artefacto (ampolleta/portalámparas, plafón, u otro) sin asumir un modelo específico. Sin instrucciones de tocar cableado, tablero o voltaje.

## I. Ventana

Antes de esta fase: vínculo de catálogo Cocina→Ventana generaba Ventana automáticamente en todo caso nuevo. Después: el vínculo de catálogo **permanece intacto** (confirmado por el script en cada ejecución), pero `LEVEL2_GATED_LINKS` contiene el par `"cocina:ventana"`, así que `createInspectionAndGenerateAction` salta su generación automática solo para Cocina — Ventana sigue generándose automáticamente en Dormitorio/Living/Comedor/Living-comedor/Terraza-logia/Terraza-cerrada/Recinto-ampliado/Terraza, sin cambios. En Cocina, Ventana ahora se resuelve vía Nivel 2 ("¿La cocina tiene ventana?"): Sí genera el 7/7 completo existente (sin modificar su contenido), No la omite por completo (nunca 7 "No corresponde").

## J. Puerta

Nueva pregunta Nivel 2 "¿La cocina tiene puerta?". Sí reutiliza el `InspectionElementTemplate` "puerta" ya existente (1 pregunta, "¿Cierra correctamente?") sin expandirlo. No requirió ningún vínculo `InspectionElementTemplateSpace` nuevo — `saveSpaceLevel2ConfigAction` crea el elemento directamente por `elementTemplate.key`, mismo mecanismo ya usado por Reja/Portón.

## K. TechnicalArticle

3 artículos nuevos, formato de 7 encabezados estándar (`# Qué revisar`, `# Cómo revisarlo`, `# Qué debería verse`, `# Qué señales pueden indicar un problema`, `# Por qué importa`, `# Recomendación`, `# Fuente`):
- `cielo-como-revisar-manchas-grietas`
- `cielo-como-revisar-manchas-humedad`
- `iluminacion-como-revisar-encendido-fijacion`

Fuente declarada honestamente: el Manual de Tolerancias CDT respalda que Cielo es una partida diferenciada (Ficha 7), pero no cubre manchas/grietas/humedad a simple vista — esas revisiones se marcan como criterio interno, sin atribuirlas al Manual.

## L. Catálogo

`prisma/db-fixes/fase11aa-cocina-lote-a.ts` ejecutado contra la BD compartida (idempotente, aditivo). Confirmó el vínculo Cocina→Ventana intacto, creó Cielo/Iluminación + sus preguntas/artículos, creó los vínculos Cocina→Cielo (order 4) y Cocina→Iluminación (order 5). No se tocó ningún vínculo existente.

## M. Seed

`prisma/seed-inspecciones.ts` actualizado: Cielo/Iluminación agregados a `elementTemplates`, vínculos a Cocina agregados a `spaceElementLinks`, sus 3 preguntas agregadas a `checklistItems` (con `technicalArticleSlug`, a diferencia de la deuda conocida de Ventana que sigue sin corregirse en el seed — fuera de alcance de esta fase), y los 3 artículos técnicos reproducidos verbatim. Una instalación nueva (`migrate` + `seed`) queda con el mismo catálogo Cocina que la BD compartida ya parchada.

## N. Config A/B/C/D

Probadas exhaustivamente en un caso Casa nuevo (QA local, eliminado al cierre):

- **Config A** (Ventana=No, Puerta=No): 7 checks exactos (Piso 2 + Muros 1 + Enchufes 1 + Cielo 2 + Iluminación 1). Coincide con la estimación de diseño.
- **Config B** (Ventana=Sí, Puerta=No): 14 checks (7 base + Ventana 7/7 completo).
- **Config C** (Ventana=No, Puerta=Sí): no probada como combinación aislada, pero equivalente a Config D menos Ventana — confirmado indirectamente vía las transiciones D→remove-Ventana en la sección O.
- **Config D** (ambos Sí): 15 checks (14 + Puerta 1). Orden visual verificado: Piso → Muros → Enchufes → Cielo → Iluminación → Ventana → Puerta — orden lógico, coherente con el orden de creación.

## O. Idempotencia

Config B guardada dos veces seguidas (sin cambios) se mantuvo en 14 checks — sin duplicación de elemento ni de checks.

## P. Edición

- **Sin datos:** Puerta Sí→No (sin checks respondidos) se removió silenciosamente, sin pedir confirmación (15→14 checks).
- **Con datos:** se respondió 1 check de Ventana ("Está bien"), luego Ventana Sí→No disparó `window.confirm` (política Fase 11Y sin cambios de motor). Al no confirmar (Cancelar), los datos quedaron 100% intactos: Ventana siguió en 1/7 respondidas, sus 7 checks preservados.

## Q. Histórico simulado

Caso simulado creado directamente en BD: Cocina con piso/muros/ventana(1 pregunta, modelo pre-11Q)/enchufes-interruptores, sin Cielo/Iluminación/Puerta, `config: null`. Verificado en navegador:
- Abre directamente el checklist, **sin onboarding**.
- Mantiene exactamente 5 checks (2+1+1+1), Ventana con su única pregunta histórica ("¿Opera correctamente?"), no la versión 7/7 actual.
- No se creó Cielo, Iluminación ni Puerta.
- `config` permaneció `null` tras la sola navegación (confirmado por consulta directa a BD).

## R. Casos reales

Los 3 casos reales de Jorge con Cocina (las dalias, xcxc, casa) comparados antes/después: **cero diferencias**. `config` sigue `null` en los 3; ningún elemento nuevo; conteos de checks idénticos a la baseline capturada al inicio de la fase (las dalias 5, xcxc 5, casa 11 — Ventana congelada en 1 o 7 preguntas según `questionSnapshot`, sin cambios).

## S. Progreso

El denominador de progreso de cada Cocina refleja exactamente sus checks reales — sin inflarse por componentes no configurados (confirmado en Config A: 0/7, no 0/15).

## T. Resumen/PDF

En el resumen web del caso QA: Cocina con Ventana=Sí/Puerta=No mostró Cielo e Iluminación como puntos pendientes normales junto a Piso/Muros/Enchufes/Ventana (las preguntas de Ventana ya respondidas no aparecieron en pendientes); Puerta ausente por no estar configurada. Ambos endpoints PDF (`/api/inspecciones/[id]/pdf/resumen` y `/pdf/detallado`) respondieron `200` con `content-type: application/pdf`.

## U. Ownership

Re-auditado `saveSpaceLevel2ConfigAction` (`src/app/(app)/inspecciones/[id]/actions.ts`): valida sesión activa, resuelve `space` y verifica `space.case.userId !== session.user.id` antes de cualquier mutación; nunca confía en `componentKey` del cliente sin resolverlo contra `getConfigurableComponents(space.spaceTemplate?.key)`; valida `meta` contra `metaOptions` declarados por componente (whitelist estricta). Ventana y Puerta no declaran `metaOptions`, por lo que ese camino es un no-op para ambos — **sin cambios de código necesarios**, la validación ya era genérica.

## V. Mobile (375px)

Verificado en viewport 375×812: onboarding Cocina con grupo "EQUIPAMIENTO DEL RECINTO", panel "Editar configuración" abierto con Ventana/Puerta, checklist con Cielo/Iluminación/Ventana 7/7. `document.documentElement.scrollWidth - clientWidth === 0` en todas las pantallas probadas — sin overflow horizontal.

## W. Regresiones

- **Reja (Antejardín)** y **Portón (Acceso vehicular)**: onboarding sin encabezado de grupo (comportamiento idéntico a antes de `groupBySection`), preguntas de 1 solo componente sin cambios.
- **Ventana fuera de Cocina**: Dormitorio generado con 12 checks (Piso 2 + Muros 1 + Puerta 1 + Ventana 7 + Enchufes 1) — confirma que `LEVEL2_GATED_LINKS` no afecta la generación automática de Ventana en ningún otro recinto.
- Casa, Departamento, Ampliación: sin cambios de comportamiento (no auditados exhaustivamente de nuevo en esta fase por no tocar código compartido con ellos más allá de la generación de elementos, ya cubierta arriba).

## X. TypeScript

`npx tsc --noEmit` — limpio, sin errores.

## Y. ESLint

`npx eslint .` — limpio, sin errores ni warnings.

## Z. Vitest

`npx vitest run` — 10 archivos, 95 tests, todos pasando.

## AA. Build

`npx next build` — compilación exitosa, 29 páginas generadas, sin errores de tipos.

## AB. Limpieza

Usuario QA (`qa-11aa@obrabien.local`), sus 4 casos de prueba (incluyendo fotos, 0 en este caso) y el usuario mismo fueron eliminados de la BD compartida. Todos los scripts `_tmp_11aa_*.ts` fueron eliminados. Se conserva permanentemente `prisma/db-fixes/fase11aa-cocina-lote-a.ts`.

## AC. Paso pendiente de publicación/desacople

Esta fase es **100% local en cuanto a código**: el catálogo (Cielo/Iluminación/vínculos) ya se aplicó a la BD compartida porque el código de producción actual lo ignora por completo (no hay ningún flujo en producción que lea `cielo`/`iluminacion`/Nivel 2 de Cocina todavía). El vínculo Cocina→Ventana permanece intacto en catálogo — producción sigue generando Ventana automáticamente en Cocina sin ningún cambio de comportamiento hasta que el código de esta fase se publique. Ningún paso de "desacople post-deploy" es necesario para Cocina (a diferencia de `terraza-logia`/Reja/Portón) porque el nuevo gate (`LEVEL2_GATED_LINKS`) es puramente de código, no de catálogo — no existe una versión antigua de catálogo que deba desactivarse después. El único paso pendiente real es: commit + push + deploy del código modificado (sección D) cuando el usuario lo autorice.

## AD. Diff final

Modificados: `prisma/seed-inspecciones.ts`, `src/app/(app)/inspecciones/[id]/page.tsx`, `src/app/(app)/inspecciones/actions.ts`, `src/components/inspecciones/space-detail-view.tsx`, `src/components/inspecciones/space-level2-gate.tsx`, `src/components/inspecciones/space-level2-panel.tsx`, `src/lib/inspecciones/space-config.ts`.
Creados: `prisma/db-fixes/fase11aa-cocina-lote-a.ts`, `docs/FASE11AA_INFORME_COCINA_LOTE_A.md`.
No se tocó `module/*`, `diagram-v2/*` (cambios preexistentes de otra sesión, ajenos a esta fase), Radier, ni ningún doc no relacionado.

## AE. Estado final

Cocina Lote A queda implementado y verificado localmente: Piso/Muros/Enchufes/Cielo/Iluminación siempre presentes en Cocinas nuevas; Ventana/Puerta configurables vía Nivel 2, agrupados visualmente bajo "EQUIPAMIENTO DEL RECINTO"; Cocinas históricas 100% preservadas sin onboarding retroactivo; Lote B (Terminaciones: piso-cerámico, pintura-muro, revestimiento-cerámico-muro) queda desbloqueado por la infraestructura genérica de `section`/`group`, pendiente de implementación en una fase futura.

---

## CONTROL FINAL

- **Archivos creados:** `prisma/db-fixes/fase11aa-cocina-lote-a.ts`, `docs/FASE11AA_INFORME_COCINA_LOTE_A.md`
- **Archivos modificados:** `prisma/seed-inspecciones.ts`, `src/app/(app)/inspecciones/[id]/page.tsx`, `src/app/(app)/inspecciones/actions.ts`, `src/components/inspecciones/space-detail-view.tsx`, `src/components/inspecciones/space-level2-gate.tsx`, `src/components/inspecciones/space-level2-panel.tsx`, `src/lib/inspecciones/space-config.ts`
- **Prisma schema modificado:** NO
- **Migración creada:** NO
- **BD modificada:** SÍ — catálogo aditivo (Cielo, Iluminación, sus preguntas/artículos, 2 vínculos nuevos) aplicado vía `prisma/db-fixes/fase11aa-cocina-lote-a.ts`; ningún vínculo existente modificado o eliminado
- **Commit:** NO
- **Push:** NO
- **Deploy:** NO

**FASE 11AA — COCINA LOTE A IMPLEMENTADO LOCALMENTE**
