# Fase 11AB — Cocina Lote B: Terminaciones y componentes derivados por Nivel 2

Informe de implementación local. Base: `docs/FASE11Z_DISENO_NIVEL2_COCINA.md` (secciones G/H, árbol U), `docs/FASE11AA_INFORME_COCINA_LOTE_A.md`, `docs/FASE11AAP_INFORME_PUBLICACION_COCINA_LOTE_A.md`.

## A. Auditoría

Confirmado por código + BD antes de modificar: `SPACE_LEVEL2_CONFIG.cocina` tenía solo Ventana/Puerta (Lote A, publicado); `groupBySection`/`section` y `question` independiente de `label` ya soportados sin cambios (Fase 11AA); `SPACE_LEVEL2_HISTORICAL_ANCHOR.cocina = "cielo"` intacto. Catálogo real: Piso (2 preguntas), Muros (1), sin ningún `TechnicalArticle` para revestimientos/pintura. `materialVariantOf` en `InspectionElementTemplate`: 0 filas lo usaban. Cocinas nuevas (post-11AA-P, con Cielo): 0 casos reales — los 4 casos reales de Jorge siguen siendo 100% históricos (sin Cielo), confirmado antes y después de esta fase (sección AG).

## B. Fuentes

Releído directamente el Manual de Tolerancias para Edificaciones (CDT/CChC, 3ª edición 2018): capítulo 10 (Revestimientos Cerámicos) y capítulo 23 (Pinturas) — no solo por resumen de Fase 11Z, sino confirmando el contenido ya citado ahí (palmetas quebradas/despuntadas "no se aceptan"; defectos de esmalte; observación de pintura a distancia normal de uso). Ninguna tolerancia en mm se presenta como cumplimiento normativo — todo se tradujo a observación binaria en lenguaje cotidiano, siguiendo la política canónica de Fase 11W.

## C. Decisión de nomenclatura

Resuelta la pendiente de Fase 11Z (sección V, nota de nomenclatura): se adoptan keys **genéricas sin sufijo de recinto** — `revestimiento-ceramico-piso`, `pintura-muro`, `revestimiento-ceramico-muro` — en vez de `piso-ceramico-cocina`/`pintura-muro-cocina`/`revestimiento-ceramico-muro-cocina`. Confirmado que las 3 revisiones dependen exclusivamente del **material/terminación** (palmetas quebradas, defectos de esmalte, manchas de pintura), no de ningún criterio específico de Cocina — el mismo Manual (cap. 10/23) no distingue por tipo de recinto. No se encontró ninguna diferencia técnica real que justificara keys específicas de recinto. Esta fase vincula los 3 componentes SOLO a Cocina (sección L); quedan listos para reutilizarse en Baño u otro recinto en una fase futura sin duplicar catálogo, agregando solo el vínculo correspondiente.

## D. materialVariantOf

Auditado su propósito real (`prisma/schema.prisma`, comentario del campo): referencia libre para agrupar variantes de material bajo un elemento "padre", sin tabla de variantes dedicada, sin ninguna lógica de consulta que lo use hoy. Se usa aquí **solo como documentación semántica**: `revestimiento-ceramico-piso.materialVariantOf = "piso"`, `pintura-muro.materialVariantOf = "muros"`, `revestimiento-ceramico-muro.materialVariantOf = "muros"` — sin introducir ninguna lógica adicional ni cambiar el comportamiento del motor. El diseño real sigue siendo el aprobado en 11Z: Piso/Muros base + componentes derivados adicionales (nunca un reemplazo ni una "variante" que sustituya al componente base), permitiendo combinaciones simultáneas.

## E. UX

Verificado en el navegador (caso Casa nuevo, local): el onboarding de Cocina muestra exactamente

```
ANTES DE REVISAR ESTE ESPACIO
TERMINACIONES
¿El piso es de cerámica o porcelanato?       Sí / No
¿Los muros tienen pintura?                    Sí / No
¿Los muros tienen revestimiento cerámico o porcelanato?   Sí / No
EQUIPAMIENTO DEL RECINTO
¿La cocina tiene ventana?                     Sí / No
¿La cocina tiene puerta?                      Sí / No
Continuar
```

5 decisiones exactas, sin el grupo "AGUA Y DESAGÜE" (no declarado, no renderiza vacío).

## F. Sections

`groupBySection()` (Fase 11AA, sin cambios de código) agrupa los 5 componentes por el orden de declaración en `SPACE_LEVEL2_CONFIG.cocina`: TERMINACIONES (3 items) antes que EQUIPAMIENTO DEL RECINTO (2 items) — confirmado en pantalla. Ningún nombre de grupo está hardcodeado en el componente de UI.

## G. Cerámico piso

`InspectionElementTemplate` "revestimiento-ceramico-piso" (transversal, `materialVariantOf: "piso"`), 100% Nivel 2 (sin vínculo `InspectionElementTemplateSpace`, mismo patrón que Puerta). 2 revisiones:
- "¿Hay palmetas quebradas, trisadas o despuntadas?"
- "¿Se observan defectos visibles en el esmalte o superficie de las palmetas?"

**No-duplicación (sección 9 de la fase)**: auditado el artículo publicado `piso-como-revisar-danos-visibles` — ya menciona explícitamente "sonido hueco al golpear suavemente indica que la pieza no quedó bien pegada". Se decidió **no crear una tercera pregunta sobre sonido hueco** — las 2 revisiones nuevas se enfocan en lo que ese artículo NO cubre (palmetas quebradas específicamente, defectos de esmalte), evitando una revisión redundante.

## H. Pintura muro

`InspectionElementTemplate` "pintura-muro" (`materialVariantOf: "muros"`), 100% Nivel 2. 1 revisión: "¿Se observan manchas, marcas o defectos visibles en la pintura?" — traducido del criterio del Manual (cap. 23, observación visual a ~1m) a lenguaje cotidiano, sin pedir determinar espesor, número de manos, adherencia química, tipo de producto ni cumplimiento normativo.

## I. Cerámico muro

`InspectionElementTemplate` "revestimiento-ceramico-muro" (`materialVariantOf: "muros"`), 100% Nivel 2. Mismas 2 revisiones que Cerámico piso, adaptadas a superficie vertical (texto distinto, no copy/paste literal — "recorre el muro con la vista" en vez de "camina por el piso"). Confirmado que **coexiste sin conflicto** con Pintura de muro (caso mixto probado en Q).

## J. TechnicalArticles

5 nuevos, formato de 7 encabezados canónico (`# Qué revisar`, `# Cómo revisarlo`, `# Qué debería verse`, `# Qué señales pueden indicar un problema`, `# Por qué importa`, `# Recomendación`, `# Fuente`): `revestimiento-ceramico-piso-palmetas-quebradas`, `revestimiento-ceramico-piso-defectos-esmalte`, `pintura-muro-manchas-defectos`, `revestimiento-ceramico-muro-palmetas-quebradas`, `revestimiento-ceramico-muro-defectos-esmalte`. Todos citan "Manual de Tolerancias para Edificaciones (CDT/CChC, 3ª edición 2018)" con capítulo específico (10 o 23), sin afirmar "norma obliga" en ningún caso. Ninguna instrucción de instrumentos profesionales — solo observación visual con luz normal.

## K. Catálogo

`prisma/db-fixes/fase11ab-cocina-lote-b.ts` (permanente, idempotente) creado y ejecutado contra la BD compartida: 3 `InspectionElementTemplate` (order 13/14/15, continuando después de `iluminacion`=12), 5 `InspectionChecklistItem`, 5 `TechnicalArticle`. **Deliberadamente NO crea ningún vínculo `InspectionElementTemplateSpace`** — igual que Puerta, `saveSpaceLevel2ConfigAction` crea el elemento directamente por `elementTemplate.key`. No se tocó Cielo, Iluminación, Ventana, Puerta, Piso base, Muros base ni Enchufes — confirmado por el diff del script (solo `create`/`upsert` de las 3 keys nuevas).

## L. BD compartida

Analizado ANTES de ejecutar el script: el código de producción actualmente desplegado (`git show HEAD` antes de esta fase) no conoce las keys `revestimiento-ceramico-piso`/`pintura-muro`/`revestimiento-ceramico-muro` en absoluto, y su bucle de generación automática (`createInspectionAndGenerateAction`) solo itera sobre los vínculos `InspectionElementTemplateSpace` existentes para cada `spaceTemplate`. Como este script **no crea ningún vínculo nuevo**, los 3 componentes quedan 100% inertes para el código desplegado — no hay ningún catálogo "activo" que gatear ni desacoplar después, a diferencia de Cielo/Iluminación en Fase 11AA (que sí eran siempre-presentes y requirieron el gate `LEVEL2_GATED_LINKS`). No existe ninguna ventana insegura: el script fue seguro de ejecutar contra la BD compartida de inmediato, con el código de esta fase todavía sin publicar. No se requiere ningún paso de activación post-deploy (ver sección AI).

## M. Seed

`prisma/seed-inspecciones.ts` actualizado: 3 nuevos `elementTemplates` (con `materialVariantOf`), sus 5 `checklistItems` (con `technicalArticleSlug`), y los 5 artículos agregados al array `level2Articles` ya existente (mismo patrón que Cielo/Iluminación de Fase 11AA). **Deliberadamente sin vínculos en `spaceElementLinks`** — igual que Puerta, para que una instalación nueva reproduzca el estado final ya parchado en la BD compartida sin generar automáticamente estos componentes. No se resolvió la deuda histórica conocida del seed de Ventana (fuera de alcance).

## N. Config mínima

Casa QA nueva, las 5 preguntas respondidas "No": **7 checks exactos** (Piso 2 + Muros 1 + Enchufes 1 + Cielo 2 + Iluminación 1), sin ningún derivado. Confirmado en DOM.

## O. Piso cerámico

Piso cerámico = Sí, resto No: **9 checks exactos** (7 base + 2 cerámico piso). Componente "Revestimiento cerámico de piso" apareció inmediatamente después de Iluminación, con las 2 preguntas correctas y sin duplicar "daños visibles"/"desniveles" de Piso.

## P. Muro pintado

Pintura = Sí, Cerámico muro = No (partiendo de Piso cerámico = Sí): confirmado que Pintura se agrega de forma independiente junto al resto — probado en combinación directamente con el caso mixto (sección R), sin conflicto.

## Q. Muro cerámico

Cerámico muro = Sí junto con Pintura = Sí (caso mixto real, sección R): ambos componentes coexistieron sin error, sin selector excluyente — exactamente el diseño de Fase 11Z sección H (Opción B adoptada).

## R. Muro mixto

Piso cerámico=Sí + Pintura=Sí + Cerámico muro=Sí: **12 checks exactos** (7 base + 2 cerámico piso + 1 pintura + 2 cerámico muro). Ambos componentes de muro visibles simultáneamente, sin conflicto, orden correcto: Piso, Muros, Enchufes, Cielo, Iluminación, Revestimiento cerámico de piso, Pintura de muro, Revestimiento cerámico de muro.

## S. Config completa

Los 5 = Sí: **20 checks exactos** (7 base + 2 cerámico piso + 1 pintura + 2 cerámico muro + 7 Ventana + 1 Puerta) — coincide con el número esperado por la fase. Confirmado en DOM completo, contenido de Ventana idéntico al ya publicado (sin duplicar), Puerta reutiliza "¿Cierra correctamente?" sin expandir.

## T. Orden

**Desviación deliberada y documentada del orden intercalado propuesto** (sección 18 de la fase: Piso→Revest.piso→Muros→Pintura→Revest.muro→Cielo→Enchufes→Iluminación→Ventana→Puerta). Intercalar habría exigido reescribir el `order` de catálogo (`InspectionElementTemplateSpace`) de Muros/Enchufes/Cielo/Iluminación en Cocina — vínculos leídos HOY MISMO por el código ya desplegado en producción para generar cualquier Cocina nueva. Cambiar esos valores habría alterado el orden visual de Cocinas creadas en producción ANTES de que el código de esta fase se publique — el mismo tipo de "ventana insegura" ya evitado en Fase 11AA (sección E de ese informe).

**Solución adoptada**: se agregó un campo genérico opcional `order?: number` a `SpaceConfigurableComponent` (`space-config.ts`), usado por `saveSpaceLevel2ConfigAction` al crear el `InspectionElement` Nivel 2 (antes no pasaba `order` explícito, caía al default de schema = 0). Los 5 componentes de Cocina se ordenan 10-14 (después de todos los siempre-presentes, que llegan hasta 5), agrupados por sección (TERMINACIONES antes que EQUIPAMIENTO) pero sin intercalar con la base. Determinista, sin tocar ningún `order` de catálogo compartido. Reja/Portón/Ventana/Puerta (Fases 11Y/11AA) no necesitan el campo — mantienen su comportamiento sin cambios. Confirmado en DOM: orden real observado coincide exactamente con lo diseñado en esta sección.

## U. Idempotencia

Config completa (20 checks) guardada dos veces seguidas sin cambios: se mantuvo en 20, sin duplicar `InspectionElement` ni `InspectionChecklistCheck`. Piso cerámico alternado Sí→No→Sí: terminó en exactamente 1 componente/2 checks (regenerado limpio, sin duplicación).

## V. Edición sin datos

Piso cerámico Sí→No (sin checks respondidos): removido silenciosamente, sin `window.confirm`, progreso recalculado (20→18 tras esa transición, ya que Ventana/Puerta seguían activos).

## W. Edición con datos

Se respondió 1 check de "Pintura de muro" ("Está bien"). Intento Sí→No disparó `window.confirm` con el mensaje genérico ya validado en Fase 11Y ("Ya hay respuestas, hallazgos o fotos guardadas en Pintura de muro..."). **Cancelar**: datos 100% intactos (1/20 preservado). **Confirmar**: componente eliminado correctamente (20→19), sin filas huérfanas, `config` actualizado a `false` para ese componente. Sin fotos QA en esta prueba (no aplicable el caso de blob).

## X. Históricos

Regla de Fase 11AA verificada **intacta**: caso simulado con `piso/muros/ventana(1 pregunta histórica)/enchufes-interruptores`, sin Cielo, `config: null` — abre directamente sin onboarding, 5 checks exactos, **no recibió ninguno de los 3 componentes nuevos de Lote B** pese a que ahora existen en catálogo. El ancla `SPACE_LEVEL2_HISTORICAL_ANCHOR.cocina = "cielo"` se evalúa primero y corta el flujo antes de considerar los 5 componentes configurables — sin cambios necesarios en el mecanismo.

## Y. Resumen/PDF

Resumen del caso de prueba mostró únicamente revisiones reales (respondidas o pendientes) — nunca "Piso no es cerámico" ni "Muros no tienen pintura" como resultado. `GET /pdf/resumen` y `/pdf/detallado` respondieron ambos `200` con `content-type: application/pdf`.

## Z. Ownership

`saveSpaceLevel2ConfigAction` reutilizada sin ningún cambio de lógica de ownership (el único cambio en este archivo es agregar `order` al `data` del `create`, ver sección T) — sigue validando `space.case.userId !== session.user.id`, re-resolviendo `componentKey` contra `getConfigurableComponents(space.spaceTemplate?.key)`, y sin aceptar `question`/`section`/`order` como datos enviados por el cliente (esos campos viven solo en el catálogo del servidor, `config` solo guarda `{components, componentMeta}`). No se repitió la prueba end-to-end de "Usuario B no puede editar Cocina de Usuario A" — ya verificada exhaustivamente en Fase 11Y-P sobre la misma función, sin cambios de ownership en este diff.

## AA. Mobile

375×812: onboarding con TERMINACIONES (3) + EQUIPAMIENTO (2) sin overflow horizontal; panel de edición abierto con los 5 componentes, sin overflow; checklist completo de 19-20 checks sin overflow (`scrollWidth - clientWidth === 0` en todas las pantallas probadas).

## AB. Regresiones

Smoke confirmado: Antejardín→Reja (onboarding sin encabezado de grupo, idéntico a antes), Acceso vehicular→Portón (igual), Cocina Lote A (Ventana/Puerta siguen funcionando dentro de la config completa de Lote B, sección S), Ventana 7/7 (contenido idéntico al publicado), Puerta (reutilizada sin expandir), Cielo/Iluminación (siempre presentes, sin cambios). Departamento/Ampliación/Patio trasero/Terraza/Logia no auditados exhaustivamente de nuevo en esta fase por no tener código compartido con ellos más allá de la generación genérica de elementos, ya cubierta.

## AC. TypeScript

`npx tsc --noEmit` — limpio, sin errores, ejecutado dos veces (tras cambios de código y tras limpieza final).

## AD. ESLint

`npx eslint .` — limpio, sin errores ni warnings.

## AE. Vitest

`npx vitest run` — 10 archivos, 95 tests, todos pasando.

## AF. Build

`npx next build` — compilación exitosa, 29 páginas generadas, sin errores de tipos.

## AG. Casos reales

Comparación exacta contra consulta directa a BD (mismo método que Fase 11AA-P): los 4 casos reales de Jorge (PROPIA, xcxc, las dalias, casa) muestran **cero diferencias** — mismos elementos, mismos conteos de checks, `config` sigue `null` en los 4. Ninguno recibió Cielo/Iluminación (siguen siendo históricos pre-11AA, sin el ancla) y por lo tanto tampoco ningún componente de Lote B.

## AH. Limpieza

Usuario QA (`qa-11ab@obrabien.local`), sus 3 casos de prueba (Config mínima/completa, Reja/Portón, histórico simulado) y sus 0 fotos fueron eliminados de la BD compartida. Todos los scripts `_tmp_11ab_*.ts` fueron eliminados del working tree. Se conserva permanentemente `prisma/db-fixes/fase11ab-cocina-lote-b.ts`.

## AI. Paso pendiente de publicación

Ninguno más allá de commit + push + deploy del código (sección AJ). A diferencia de Cielo/Iluminación (Fase 11AA), estos 3 componentes no requieren ninguna función de activación post-deploy — nunca tuvieron vínculo de catálogo que desacoplar (ver sección L). El catálogo ya aplicado a la BD compartida es 100% inerte hasta que el código de esta fase (que sabe resolver estas 3 keys vía Nivel 2) se publique.

## AJ. Diff final

Modificados: `prisma/seed-inspecciones.ts`, `src/app/(app)/inspecciones/[id]/actions.ts` (solo el `order` en el `create` de `saveSpaceLevel2ConfigAction`), `src/lib/inspecciones/space-config.ts`.
Creado: `prisma/db-fixes/fase11ab-cocina-lote-b.ts`.
No se tocó `module/*`, `diagram-v2/*` (cambios preexistentes de otra sesión, ajenos a esta fase), Radier, ni ningún doc no relacionado. `git diff --stat`: 3 archivos, 306 inserciones, 9 eliminaciones.

## AK. Estado final

Cocina Lote B queda implementado y verificado localmente: Terminaciones (Revestimiento cerámico de piso, Pintura de muro, Revestimiento cerámico de muro) configurables vía Nivel 2 con las 3 preguntas booleanas independientes, agrupadas bajo "TERMINACIONES"; coexisten con Ventana/Puerta bajo "EQUIPAMIENTO DEL RECINTO" (5 decisiones totales); combinaciones de muro (pintura/cerámico/ambos/ninguno) confirmadas sin conflicto; orden visual determinista mediante el nuevo campo genérico `order`; históricos y los 4 casos reales de Jorge permanecen 100% intactos. Muebles de cocina/Lavaplatos/Campana (Lotes C/D de Fase 11Z) quedan sin iniciar.

---

## CONTROL FINAL

- **Archivos creados**: `prisma/db-fixes/fase11ab-cocina-lote-b.ts`, `docs/FASE11AB_INFORME_COCINA_LOTE_B.md`
- **Archivos modificados**: `prisma/seed-inspecciones.ts`, `src/app/(app)/inspecciones/[id]/actions.ts`, `src/lib/inspecciones/space-config.ts`
- **Prisma schema modificado**: NO
- **Migración creada**: NO
- **BD modificada**: SÍ — catálogo aditivo (3 `InspectionElementTemplate`, 5 `InspectionChecklistItem`, 5 `TechnicalArticle`) aplicado vía `prisma/db-fixes/fase11ab-cocina-lote-b.ts`; ningún vínculo `InspectionElementTemplateSpace` creado ni modificado; ningún elemento/check/config existente tocado
- **Commit**: NO
- **Push**: NO
- **Deploy**: NO

**FASE 11AB — COCINA LOTE B IMPLEMENTADO LOCALMENTE**
