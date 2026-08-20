# FASE 12A — DISEÑO INTEGRAL DE DORMITORIO V1

## A. Alcance y método

Esta fase es 100% investigación y diseño. No se escribió código, no se tocó Prisma, no se modificó la BD (solo lecturas). Se auditó el repositorio real (sin asumir nombres de archivo) y la BD compartida (dev/prod) antes de proponer nada.

## B. Archivos relevantes (investigación real)

- `src/app/(app)/inspecciones/actions.ts` — `createInspectionAndGenerateAction`, genera un `InspectionSpace` por cada `spaceSelections` y sus `InspectionElement` vía `InspectionElementTemplateSpace`, filtrando pares gateados en `LEVEL2_GATED_LINKS`. 100% genérico, sin ninguna rama específica de Dormitorio (solo aparece en `VALID_TIPOS_AMPLIACION` y en el cálculo de `bedroomCount`, ambos metadata, no generación).
- `src/lib/inspecciones/space-config.ts` — motor Nivel 2 genérico: `SPACE_LEVEL2_CONFIG` (Record por `spaceTemplate.key`), `SPACE_LEVEL2_HISTORICAL_ANCHOR`, `getConfigurableComponents`, `parseSpaceConfig`, `resolveComponentState`, `needsLevel2Onboarding`. **`dormitorio` no tiene ninguna entrada hoy** — ni en `SPACE_LEVEL2_CONFIG` ni en `SPACE_LEVEL2_HISTORICAL_ANCHOR`.
- `src/app/(app)/inspecciones/[id]/actions.ts` — `saveSpaceLevel2ConfigAction`, mismo motor ya usado por Cocina/Baño, sin ninguna especialización por recinto (resuelve todo contra `getConfigurableComponents(space.spaceTemplate.key)`).
- `src/components/inspecciones/space-level2-panel.tsx` — UI genérica del panel Nivel 2 (secciones, botón Sí/No, edición, confirmación al retirar con datos).
- `prisma/schema.prisma` — modelos `InspectionSpaceTemplate`, `InspectionElementTemplate`, `InspectionElementTemplateSpace`, `InspectionChecklistItem`, `InspectionChecklistCheck`, `TechnicalArticle`, `InspectionReferenceImage`. Confirmado: `InspectionChecklistCheck.questionSnapshot` congela el texto de la pregunta al momento de creación — editar `InspectionChecklistItem.question` a futuro **nunca** altera checks ya generados, solo afecta a los que se creen después del cambio.
- `src/lib/inspecciones-pdf.tsx`, `/api/inspecciones/[id]/pdf/{resumen,detallado}/route.ts` — genéricos, sin lógica por recinto.

## C. Flujo actual (confirmado, no asumido)

1. Al crear un caso, por cada `InspectionSpaceTemplate` seleccionado (incluye `dormitorio`, `repeatable: true`) se crean tantos `InspectionSpace` como el usuario indicó.
2. Para cada espacio, se leen los `InspectionElementTemplateSpace` de ese `spaceTemplateId` (hoy, para `dormitorio`: 5 vínculos) y se genera un `InspectionElement` + sus `InspectionChecklistCheck` por cada uno, salvo que el par `dormitorio:<key>` esté en `LEVEL2_GATED_LINKS` (hoy: ninguno).
3. Como `dormitorio` no tiene entrada en `SPACE_LEVEL2_CONFIG`, `getConfigurableComponents("dormitorio")` devuelve `[]` — el panel Nivel 2 nunca se muestra, y `needsLevel2Onboarding` siempre devuelve `false` para Dormitorio.

## D. Componentes actuales de Dormitorio (auditoría BD, solo lectura)

Vínculos `InspectionElementTemplateSpace` para `spaceTemplate.key = "dormitorio"`:

| order | key | label | checks activos |
|---|---|---|---|
| 0 | `piso` | Piso | 2 |
| 1 | `muros` | Muros | 1 |
| 2 | `puerta` | Puerta | 1 |
| 3 | `ventana` | Ventana | 7 (activos; 1 check legacy inactivo no cuenta) |
| 4 | `enchufes-interruptores` | Enchufes e interruptores | 1 |

**Total actual = 12 checks, 100% siempre-presente (sin ninguna pregunta Nivel 2 hoy).**

**Hallazgo relevante — Dormitorio NO tiene `cielo` ni `iluminacion`** vinculados, a diferencia de Cocina y Baño (ambos sí los tienen como base desde sus respectivos Lote A). Comparado también con Living-comedor (tampoco los tiene: `piso, muros, ventana, enchufes-interruptores`, ni siquiera `puerta`). Esto es una brecha de paridad real, no una decisión de diseño explícita — ningún documento previo la decidió a propósito; simplemente Dormitorio/Living-comedor fueron poblados antes de que Cielo/Iluminación se introdujeran (Fase 11AA, solo para Cocina).

No existe ningún template de tipo "clóset"/"armario"/similar en el catálogo completo (28 `InspectionElementTemplate` auditados, ninguno coincide). Confirmado con `LIKE` conceptual sobre key/label — nada que reutilizar ni que evitar duplicar.

## E. Auditoría de casos reales (6 espacios Dormitorio en BD, todos leídos, ninguno modificado)

Los 6 espacios Dormitorio reales existentes (3 casos, usuarios reales) tienen **exactamente** el mismo patrón: `config = null`, elementos `[enchufes-interruptores, muros, piso, puerta, ventana]` — sin excepción, sin ningún caso "editado" o con estructura distinta. Esto simplifica la clasificación histórica: hoy no existe ningún Dormitorio "V1" ni "V1 editado", todos son 100% pre-Nivel2.

**Clasificación A/B/C (mecanismo ya probado en Cocina/Baño, reutilizado sin cambios):**

- **A. Dormitorio histórico** = espacio sin `InspectionElement` cuyo `elementTemplate.key` sea el ancla (`cielo`, ver sección L). Los 6 espacios reales caen aquí hoy — correcto, porque ninguno tiene `cielo`.
- **B. Dormitorio V1 nuevo** = tiene `cielo` (generado por el código nuevo), `config` puede ser `null` (onboarding pendiente) o tener los 4 componentes resueltos.
- **C. Dormitorio V1 editado** = tiene `cielo` y `config.components` con al menos un valor explícito distinto del default inicial — indistinguible de B a nivel de mecanismo (mismo dato, ambos son "V1 con config resuelta"); la distinción es solo conceptual (B es la primera resolución, C es una edición posterior), el motor no necesita ni debe diferenciarlos.

## F. Riesgos identificados

1. **Brecha Cielo/Iluminación** (sección D) — si no se cierra, Dormitorio V1 seguiría sin revisar cielo/iluminación mientras Cocina y Baño sí lo hacen, una inconsistencia de producto visible en el propio checklist maestro. Se recomienda cerrarla (ver sección I).
2. **Wording hardcodeado "cocina" en el check de Iluminación** — el `InspectionChecklistItem.question` de `iluminacion` dice literalmente *"¿La iluminación de **la cocina** enciende correctamente...?"*. Esto ya afecta a Baño en producción (mismo texto, sin corregir) y afectaría a Dormitorio si se reutiliza sin corregir. El `TechnicalArticle` asociado (`iluminacion-como-revisar-encendido-fijacion`) ya es genérico ("del recinto") — solo el campo `question` tiene el defecto. Ver sección Y (deudas) para el tratamiento propuesto.
3. **Ventana como base, no Nivel 2** — Dormitorio hoy genera Ventana automáticamente para el 100% de los casos (igual que Living-comedor). No hay evidencia de que algún Dormitorio real la necesite opcional. Cambiarla a Nivel 2 sería una decisión de arquitectura nueva, no una continuación de lo existente — fuera del criterio explícito de esta fase (sección G).
4. Ninguno de los 3 hallazgos anteriores es destructivo ni exige migración — los 3 se resuelven con escrituras aditivas o de contenido, nunca con borrado ni reinterpretación de datos históricos.

## G. Ventana — decisión

**Se mantiene como BASE, sin cambios.** Es el estado real actual del sistema (auto-generada, sin gate) tanto para Dormitorio como para Living-comedor. No se convierte en Nivel 2 en este diseño: no hay fuente ni evidencia de que algún Dormitorio real deba carecer de ventana (los 6 casos reales la tienen), y moverla a Nivel 2 sería una expansión de alcance no solicitada (afectaría además a Living-comedor si se tocara el catálogo compartido). Se reutiliza el mismo `InspectionElement Template` `ventana` (7 checks activos) sin ninguna modificación de contenido.

## H. Puerta — decisión

**Se mantiene como BASE, sin cambios.** Ya es base hoy (confirmado en sección D). No se crea `puerta-dormitorio`; se reutiliza `puerta` (1 check) sin modificar.

## I. Cielo e Iluminación — cierre de brecha

Se agregan como BASE nueva de Dormitorio, reutilizando 100% los templates existentes (`cielo`, 2 checks; `iluminacion`, 1 check — sin crear ningún check ni artículo nuevo). Esto replica exactamente el patrón ya validado en Baño Lote A (Fase 11AT): dos vínculos `InspectionElementTemplateSpace` nuevos, cero catálogo nuevo. Se aprovecha además para corregir el wording hardcodeado de `iluminacion` (sección F.2 / Y), porque de lo contrario todo Dormitorio nuevo repetiría el defecto ya presente en Baño.

`cielo` se elige además como ancla histórica (ver sección L) — mismo criterio ya usado en Cocina y Baño: siempre-presente en cualquier Dormitorio generado por el código nuevo, y 100% ausente en los 6 Dormitorios reales existentes.

## J. Terminaciones — reutilización material-derived

Se reutilizan sin ningún cambio los 3 componentes ya usados por Cocina y Baño:

- `revestimiento-ceramico-piso` (2 checks) — "¿El piso es de cerámica o porcelanato?"
- `pintura-muro` (1 check) — "¿Los muros tienen pintura?"
- `revestimiento-ceramico-muro` (2 checks) — "¿Los muros tienen revestimiento cerámico o porcelanato?"

Ningún contenido nuevo: mismos templates, mismos checks, mismos artículos ya publicados. Confirma la tesis original de Fase 11Z/11AB (criterio material-derived, no atado al recinto) — un tercer recinto reutilizándolos sin duplicar es la prueba de que la decisión fue correcta.

No se agrega variante de piso derivada (ej. piso flotante/laminado) en este diseño: no hay template existente para eso y no hay evidencia/mandato de que Dormitorio la necesite más que Cocina o Baño, que tampoco la tienen. Fuera de alcance de V1.

## K. Clóset / Armario empotrado — único componente nuevo

No existe template reutilizable (sección D). Se evaluó como legítimo componente propio de Dormitorio porque cumple los 4 criterios de la sección 10 del enunciado: (a) es parte fija del inmueble cuando existe empotrado a la pared/muro, (b) tiene valor real de inspección (puertas/cajones que no cierran, panel dañado, humedad interior), (c) no está cubierto por ningún otro componente del catálogo, (d) se revisa de forma simple y seguridad doméstica (abrir/cerrar, tocar suavemente).

**Aplicando el aprendizaje de Muebles de Cocina/Baño (no dividir cada bisagra/cajón):** 4 checks, sin subdividir por puerta o cajón individual.

| # | Question | Default severity | N/A | Fuente |
|---|---|---|---|---|
| 1 | ¿Las puertas y/o cajones del clóset abren y cierran correctamente, sin atascarse ni forzar? | MEDIUM | Sí — "si el clóset no tiene cajones, marca No corresponde en esa parte de la pregunta" (mismo patrón ya usado en Mueble de baño) | 🟡 criterio interno |
| 2 | ¿El clóset se siente firme y bien sujeto a la pared, sin bamboleo evidente al empujarlo suavemente? | HIGH | No | 🟡 criterio interno |
| 3 | ¿Presenta daños visibles: golpes, rayas profundas, paneles despegados o quebrados? | LOW | No | 🟡 criterio interno |
| 4 | ¿Se observan manchas de humedad o deformación (hinchazón) en el interior o en las puertas del clóset? | MEDIUM | No | 🟡 criterio interno |

Severidad de Fijación = HIGH replica el mismo criterio ya usado en Mueble de baño/Vanitorio (11AQ): mobiliario empotrado alto y pesado con riesgo real de volcamiento si no está bien anclado.

Ningún check propuesto requiere desmontar, forzar, usar herramientas ni intervenir electricidad — cumple la sección 17 (seguridad).

**Componentes explícitamente descartados** (evaluados y rechazados, no solo omitidos por descuido): calefacción fija (sin evidencia de que exista como elemento fijo estándar en la arquitectura/proyectos reales auditados, sin fuente), detector de humo, aire acondicionado portátil, radiadores móviles, muebles móviles (cama, velador, cómoda, TV), cortinas, persianas no fijas, enchufes USB, domótica — todos excluidos por ser mobiliario/equipamiento del ocupante, no del inmueble, o por falta de método de revisión seguro/fuente.

## L. Históricos

Regla idéntica a Cocina/Baño, sin ningún mecanismo nuevo: `SPACE_LEVEL2_HISTORICAL_ANCHOR.dormitorio = "cielo"`. Un Dormitorio sin `InspectionElement` de key `cielo` se trata como histórico — nunca se le exige onboarding retroactivo, nunca se le hace backfill de `config`, nunca se le agregan componentes nuevos ni se migran sus checks existentes. Los 6 Dormitorios reales de hoy quedan clasificados como históricos automáticamente, sin ninguna migración ni escritura sobre ellos.

## M. Nivel 2 — panel completo de Dormitorio V1

| order | section | label | key | pregunta exacta | default | metadata | delta checks |
|---|---|---|---|---|---|---|---|
| 10 | TERMINACIONES | Revestimiento cerámico de piso | `revestimiento-ceramico-piso` | ¿El piso es de cerámica o porcelanato? | No | — | +2 |
| 11 | TERMINACIONES | Pintura de muro | `pintura-muro` | ¿Los muros tienen pintura? | No | — | +1 |
| 12 | TERMINACIONES | Revestimiento cerámico de muro | `revestimiento-ceramico-muro` | ¿Los muros tienen revestimiento cerámico o porcelanato? | No | — | +2 |
| 13 | EQUIPAMIENTO DEL RECINTO | Clóset / Armario empotrado | `closet` | ¿El dormitorio tiene clóset o armario empotrado instalado? | No | — | +4 |

4 decisiones, sin `metaOptions` en ninguna (ninguna pregunta secundaria aporta valor real — sección 11: "no crear metadata si un simple Sí/No basta"). Ninguna dependencia falsa entre ellas: los 3 componentes de terminaciones y el Clóset son 100% independientes entre sí (activar uno no condiciona ni oculta otro).

## N. Componentes base — tabla final

| key | label | checks | reutilizado/nuevo | fuente del vínculo | order (catálogo) |
|---|---|---|---|---|---|
| `piso` | Piso | 2 | reutilizado, sin cambios | vínculo ya existente | 0 |
| `muros` | Muros | 1 | reutilizado, sin cambios | vínculo ya existente | 1 |
| `puerta` | Puerta | 1 | reutilizado, sin cambios | vínculo ya existente | 2 |
| `ventana` | Ventana | 7 | reutilizado, sin cambios | vínculo ya existente | 3 |
| `enchufes-interruptores` | Enchufes e interruptores | 1 | reutilizado, sin cambios | vínculo ya existente | 4 |
| `cielo` | Cielo | 2 | reutilizado, **vínculo nuevo** | copiar patrón Baño Lote A | 5 |
| `iluminacion` | Iluminación | 1 | reutilizado, **vínculo nuevo** + fix de wording | copiar patrón Baño Lote A | 6 |

**TOTAL BASE = 2+1+1+7+1+2+1 = 15**

## O. Componentes opcionales — tabla final

| key | label | section | pregunta | checks | N/A | reutilizado/nuevo | dependencias |
|---|---|---|---|---|---|---|---|
| `revestimiento-ceramico-piso` | Revestimiento cerámico de piso | TERMINACIONES | ¿El piso es de cerámica o porcelanato? | 2 | No | reutilizado | ninguna |
| `pintura-muro` | Pintura de muro | TERMINACIONES | ¿Los muros tienen pintura? | 1 | No | reutilizado | ninguna |
| `revestimiento-ceramico-muro` | Revestimiento cerámico de muro | TERMINACIONES | ¿Los muros tienen revestimiento cerámico o porcelanato? | 2 | No | reutilizado | ninguna |
| `closet` | Clóset / Armario empotrado | EQUIPAMIENTO DEL RECINTO | ¿El dormitorio tiene clóset o armario empotrado instalado? | 4 | Sí (1 de 4 checks) | **nuevo** | ninguna |

## P. Checklist maestro — TODOS los checks finales de Dormitorio V1

| Componente | Key | Check # | Question | Default severity | Allow N/A | Fuente | TechnicalArticle | Ref. visual | Origen |
|---|---|---|---|---|---|---|---|---|---|
| Piso | `piso` | 1 | ¿Presenta daños visibles? | — (null) | Sí (universal) | 🟡 criterio interno | `piso-como-revisar-danos-visibles` | Opcional | reutilizado |
| Piso | `piso` | 2 | ¿Presenta desniveles? | — (null) | Sí | 🟡 criterio interno | `piso-como-revisar-desniveles` | Opcional | reutilizado |
| Muros | `muros` | 1 | ¿Presenta fisuras visibles? | MEDIUM | Sí | 🟡 criterio interno | `muros-como-revisar-fisuras` | Opcional | reutilizado |
| Puerta | `puerta` | 1 | ¿Cierra correctamente? | — (null) | Sí | 🟡 criterio interno | `puerta-como-revisar-cierre` | Opcional | reutilizado |
| Ventana | `ventana` | 1 | ¿La ventana abre y cierra correctamente? | — (null) | Sí | 🟡 criterio interno | `ventana-apertura-cierre` | Opcional | reutilizado |
| Ventana | `ventana` | 2 | ¿La manilla y los herrajes funcionan correctamente? | — (null) | Sí | 🟡 criterio interno | `ventana-manilla-herrajes` | Opcional | reutilizado |
| Ventana | `ventana` | 3 | Con la ventana cerrada, ¿se ve alguna separación entre la hoja y el marco? | — (null) | Sí | 🟡 criterio interno | `ventana-sello-hoja-marco` | Alto valor | reutilizado |
| Ventana | `ventana` | 4 | ¿El vidrio presenta rayas, trizaduras u otros daños visibles? | — (null) | Sí | 🟡 criterio interno | `ventana-vidrio-danos-visibles` | Alto valor | reutilizado |
| Ventana | `ventana` | 5 | Si la ventana es de termopanel (doble vidrio), ¿se ve condensación o empañamiento ENTRE los vidrios? | — (null) | Sí | 🟡 criterio interno | `ventana-vidrio-condensacion-interna` | Opcional | reutilizado |
| Ventana | `ventana` | 6 | ¿El sello entre el marco de la ventana y el muro se ve continuo, sin separaciones ni grietas? | — (null) | Sí | 🟡 criterio interno | `ventana-sello-marco-muro` | Alto valor | reutilizado |
| Ventana | `ventana` | 7 | ¿El marco de la ventana presenta golpes, rayas profundas o deformaciones visibles? | — (null) | Sí | 🟡 criterio interno | `ventana-marco-danos-visibles` | Opcional | reutilizado |
| Enchufes e interruptores | `enchufes-interruptores` | 1 | ¿Cada enchufe probado funciona con un artefacto real? | — (null) | Sí | 🟡 criterio interno | `enchufes-interruptores-como-revisar-funcionamiento` | No necesaria | reutilizado |
| Cielo | `cielo` | 1 | ¿El cielo presenta manchas, grietas u otros daños visibles? | — (null) | Sí | 🟡 criterio interno | `cielo-como-revisar-manchas-grietas` | Opcional | reutilizado (vínculo nuevo) |
| Cielo | `cielo` | 2 | ¿Se observan manchas de humedad en el cielo? | — (null) | Sí | 🟡 criterio interno | `cielo-como-revisar-manchas-humedad` | Alto valor | reutilizado (vínculo nuevo) |
| Iluminación | `iluminacion` | 1 | ¿La iluminación **del recinto** enciende correctamente y el elemento visible se encuentra firme? *(wording corregido — ver sección Y)* | — (null) | Sí | 🟡 criterio interno | `iluminacion-como-revisar-encendido-fijacion` | No necesaria | reutilizado (vínculo nuevo + fix contenido) |
| Revestimiento cerámico de piso | `revestimiento-ceramico-piso` | 1 | ¿Hay palmetas quebradas, trisadas o despuntadas? | — (null) | Sí | 🟡 criterio interno | `revestimiento-ceramico-piso-palmetas-quebradas` | Alto valor | reutilizado (Nivel 2) |
| Revestimiento cerámico de piso | `revestimiento-ceramico-piso` | 2 | ¿Se observan defectos visibles en el esmalte o superficie de las palmetas? | — (null) | Sí | 🟡 criterio interno | `revestimiento-ceramico-piso-defectos-esmalte` | Opcional | reutilizado (Nivel 2) |
| Pintura de muro | `pintura-muro` | 1 | ¿Se observan manchas, marcas o defectos visibles en la pintura? | — (null) | Sí | 🟡 criterio interno | `pintura-muro-manchas-defectos` | Opcional | reutilizado (Nivel 2) |
| Revestimiento cerámico de muro | `revestimiento-ceramico-muro` | 1 | ¿Hay palmetas quebradas, trisadas o despuntadas? | — (null) | Sí | 🟡 criterio interno | `revestimiento-ceramico-muro-palmetas-quebradas` | Alto valor | reutilizado (Nivel 2) |
| Revestimiento cerámico de muro | `revestimiento-ceramico-muro` | 2 | ¿Se observan defectos visibles en el esmalte o superficie de las palmetas? | — (null) | Sí | 🟡 criterio interno | `revestimiento-ceramico-muro-defectos-esmalte` | Opcional | reutilizado (Nivel 2) |
| Clóset / Armario empotrado | `closet` | 1 | ¿Las puertas y/o cajones del clóset abren y cierran correctamente, sin atascarse ni forzar? | MEDIUM | Sí (si no tiene cajones) | 🟡 criterio interno | `closet-funcionamiento` (nuevo) | Opcional | **nuevo** |
| Clóset / Armario empotrado | `closet` | 2 | ¿El clóset se siente firme y bien sujeto a la pared, sin bamboleo evidente al empujarlo suavemente? | HIGH | No (semánticamente — universal permite marcarlo igual) | 🟡 criterio interno | `closet-fijacion` (nuevo) | Alto valor | **nuevo** |
| Clóset / Armario empotrado | `closet` | 3 | ¿Presenta daños visibles: golpes, rayas profundas, paneles despegados o quebrados? | LOW | No | 🟡 criterio interno | `closet-danos-visibles` (nuevo) | Opcional | **nuevo** |
| Clóset / Armario empotrado | `closet` | 4 | ¿Se observan manchas de humedad o deformación (hinchazón) en el interior o en las puertas del clóset? | MEDIUM | No | 🟡 criterio interno | `closet-humedad-deformacion` (nuevo) | Alto valor | **nuevo** |

**24 checks totales (15 base + 9 opcionales), 4 son contenido nuevo (Clóset), 20 son reutilización 100% sin cambios de contenido, 1 recibe un fix de wording (Iluminación).**

Nota sobre "Allow N/A": en este sistema, "No corresponde" está disponible como acción de UI en **todos** los checks sin excepción (no hay flag de schema que lo gatee) — la columna documenta dónde tiene sentido semántico real usarlo, no una restricción técnica. Solo el check 1 de Clóset tiene un caso de uso N/A explícitamente diseñado (clóset sin cajones); el resto no lo necesita como parte del diseño, aunque la UI no lo bloquee.

## Q. Fuentes — clasificación honesta

Todos los 24 checks son 🟡 (criterio interno/adaptado) — igual que la enorme mayoría de Cocina y Baño. Ninguno cita Manual de Tolerancias, OGUC, LGUC ni NCh como respaldo normativo directo, porque ninguna de las revisiones propuestas (funcionalidad, daños visibles, fijación, humedad superficial) coincide con el alcance de esas fuentes (tolerancias dimensionales instrumentales, no funcionalidad ni fijación de mobiliario). No se infla respaldo normativo en ningún check — mismo estándar aplicado en las 8 fases de cierre técnico de Baño (11AK-11AR).

## R. TechnicalArticles — contenido completo (4 nuevos)

Los 20 checks reutilizados ya tienen artículo publicado (reutilizado sin cambios, ver columna TechnicalArticle en sección P). Se redacta contenido completo para los 4 checks nuevos de Clóset, en el mismo formato de 7 secciones ya usado en Cocina/Baño. No se escribe en BD en esta fase — queda listo para copiar/pegar en el script de 12B.

### `closet-funcionamiento`

```
# Qué revisar
Si las puertas y/o cajones del clóset o armario empotrado abren y cierran correctamente, sin atascarse ni requerir forzar.

# Cómo revisarlo
Abre y cierra cada puerta y cada cajón del clóset con normalidad, sin forzar. Si el clóset no tiene cajones (solo puertas), revisa únicamente las puertas y marca "No corresponde" en la parte de la pregunta referida a cajones.

# Qué debería verse
Cada puerta y cajón desliza o gira con normalidad, cierra sin dejar espacio forzado ni roce excesivo contra el marco o los rieles.

# Qué señales pueden indicar un problema
- Una puerta o cajón se atasca, no cierra completamente o requiere forzar.
- Un cajón se sale del riel o no desliza parejo.
- Bisagras o tiradores sueltos o rotos.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa
Un clóset que no funciona correctamente limita el uso normal del dormitorio y puede empeorar con el uso (desgaste de rieles, bisagras forzadas) si no se corrige a tiempo.

# Recomendación
No fuerces puertas ni cajones atascados. No desarmes bisagras ni rieles. Si algo no funciona, regístralo con una foto y deja que se revise con las herramientas adecuadas.

# Fuente
- **Manual técnico de referencia**: ninguno específico para mobiliario empotrado de dormitorio.
- **Criterio interno**: revisión funcional básica, mismo estándar ya usado en Mueble de baño/Vanitorio (Fase 11AQ) y Muebles de cocina (Fase 11AC).

Sin referencia normativa verificada para esta revisión específica.
```

### `closet-fijacion`

```
# Qué revisar
Si el clóset o armario empotrado se siente firme y bien sujeto a la pared o estructura, sin moverse ni bambolear al empujarlo suavemente.

# Cómo revisarlo
Con el clóset vacío o sin forzar peso adicional, empuja suavemente su parte superior con la mano abierta, sin golpear. Observa si se mueve, se separa de la pared o cruje de forma anormal.

# Qué debería verse
El clóset permanece firme, sin desplazarse ni separarse de la pared al empujarlo suavemente.

# Qué señales pueden indicar un problema
- Movimiento o bamboleo notorio al empujar suavemente.
- Separación visible entre el clóset y la pared.
- Crujidos o ruidos anormales al tocarlo.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa
Un mueble empotrado alto y pesado mal anclado tiene riesgo real de volcamiento, especialmente relevante en un dormitorio. Conviene registrarlo para que se revise y refuerce su fijación.

# Recomendación
No empujes con fuerza ni te cuelgues del mueble para probarlo — un empujón suave basta. No intentes reforzar la fijación tú mismo.

# Fuente
- **Manual técnico de referencia**: ninguno específico.
- **Criterio interno**: mismo estándar de fijación/riesgo de volcamiento ya usado en Mueble de baño/Vanitorio (Fase 11AQ, severidad HIGH por el mismo motivo).

Sin referencia normativa verificada para esta revisión específica.
```

### `closet-danos-visibles`

```
# Qué revisar
Si el clóset presenta daños visibles: golpes, rayas profundas, paneles despegados, quebrados o con bordes astillados.

# Cómo revisarlo
Observa las superficies exteriores e interiores del clóset (puertas, costados, cajones) con buena luz.

# Qué debería verse
Superficies sin golpes, rayas profundas, quiebres ni paneles despegados.

# Qué señales pueden indicar un problema
- Golpes o abolladuras visibles.
- Rayas profundas que atraviesan el acabado.
- Paneles despegados, levantados o quebrados.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa
Un daño visible en el mueble empotrado afecta su apariencia y, si es profundo, puede indicar un problema estructural del panel que conviene registrar a tiempo.

# Recomendación
No intentes reparar ni ocultar el daño. Solo regístralo con una foto clara.

# Fuente
- **Manual técnico de referencia**: ninguno específico.
- **Criterio interno**: mismo estándar de "daños visibles" ya usado transversalmente en Piso, Mueble de baño, Tina, Mampara, entre otros.

Sin referencia normativa verificada para esta revisión específica.
```

### `closet-humedad-deformacion`

```
# Qué revisar
Si se observan manchas de humedad o deformación (hinchazón, ondulación) en el interior del clóset o en sus puertas.

# Cómo revisarlo
Abre el clóset y observa el interior (fondo, laterales) y la cara interior de las puertas, con buena luz. Presta atención especial si el clóset está contra un muro exterior o una zona con antecedentes de humedad.

# Qué debería verse
Superficies interiores secas, sin manchas oscuras, hinchazón ni ondulación del panel.

# Qué señales pueden indicar un problema
- Manchas oscuras o de aspecto húmedo en el interior.
- Paneles hinchados, ondulados o que se sienten blandos al tacto suave.
- Olor a humedad al abrir el clóset.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa
La humedad atrapada en un mueble empotrado contra un muro puede indicar un problema de humedad del muro mismo, además de dañar el mueble y la ropa guardada — conviene registrarlo para que se revise el origen.

# Recomendación
No apliques fuerza sobre paneles hinchados ni intentes secar la zona tú mismo de forma agresiva. Solo regístralo con una foto y ventila el espacio si es posible.

# Fuente
- **Manual técnico de referencia**: ninguno específico.
- **Criterio interno**: mismo estándar de "manchas de humedad" ya usado en Cielo, y de "hinchazón/deformación" ya usado en Mueble de baño (Fase 11AQ).

Sin referencia normativa verificada para esta revisión específica.
```

## S. Seguridad

Los 4 checks nuevos de Clóset cumplen la sección 17: solo observación, abrir/cerrar puertas y cajones normales, empujar suavemente con la mano. Ninguno pide desmontar, forzar, usar herramientas, ni intervenir electricidad o elementos ocultos.

## T. N/A

Definido únicamente donde aporta valor real: el check 1 de Clóset (funcionamiento de puertas/cajones) es el único con un escenario N/A explícitamente diseñado — clósets sin cajones. Ningún otro check nuevo necesita N/A como parte de su diseño (no se usa como parche de un check mal modelado). Los checks reutilizados mantienen su semántica N/A ya establecida en Cocina/Baño sin cambios.

## U. Referencias visuales

Clasificación por check en la columna "Ref. visual" de la sección P. 0 referencias existen hoy en todo el catálogo (confirmado en fases previas, backlog transversal) — esto **no bloquea** Dormitorio V1, igual que no bloqueó Cocina ni Baño. No se generan imágenes en esta fase.

## V. Conteo mínimo y máximo

**MÍNIMO (solo base) = 15**

```
piso(2) + muros(1) + puerta(1) + ventana(7) + enchufes-interruptores(1) + cielo(2) + iluminacion(1) = 15
```

**MÁXIMO (base + todos los opcionales) = 24**

```
15 (base) + revestimiento-ceramico-piso(2) + pintura-muro(1) + revestimiento-ceramico-muro(2) + closet(4) = 15 + 9 = 24
```

## W. Escenarios

| Escenario | Descripción | Total esperado |
|---|---|---|
| A | Mínimo — todas las decisiones Nivel 2 en No | 15 |
| B | "Con Ventana" | No aplica como escenario distinto de A — Ventana es BASE (sección G), siempre presente en A. Se documenta explícitamente esta equivalencia en vez de forzar un escenario artificial. |
| C | Con Clóset (resto en No) | 15 + 4 = 19 |
| D | Con Clóset + Ventana | Idéntico a C (Ventana ya está en la base de C) = 19. Se sustituye por un escenario más útil: **Con Clóset + 1 terminación** (ej. revestimiento cerámico de piso) = 15 + 4 + 2 = 21 |
| E | Todas las opciones activadas (máximo) | 24 |

Escenarios adicionales de independencia (mismo patrón usado en 11AV para Baño): activar solo cada uno de los 4 opcionales por separado debe sumar exactamente su delta sobre 15, y desactivarlo debe restarlo exactamente, sin afectar a los otros 3 ni a la base.

## X. Regresión a verificar en 12B/12C

- Cocina: mínimo 7 / máximo 33, sin cambios.
- Baño: mínimo 8 / máximo 56, sin cambios.
- Living-comedor: sigue sin `cielo`/`iluminacion` (no se toca en este diseño — fuera de alcance de Dormitorio V1; si se decide cerrar la misma brecha para Living-comedor, será una fase propia, no colada dentro de Dormitorio).
- Otros recintos (Antejardín, Acceso vehicular, Estacionamiento, Bodega, Fachada) sin cambios.
- PDFs (resumen + detallado, contenido real no solo status HTTP), ownership, edición Nivel 2 con cancelar/guardar, mobile 375px — mismos mecanismos ya probados, sin motivo para comportarse distinto en Dormitorio.

## Y. Deudas transversales

No se corrige en 12A ninguna de las 4 deudas ya conocidas (DT-01 severidad UI, DT-02 orders base, DT-03 seed incompleto, DT-04 referencias GOOD/BAD) — ninguna es bloqueante para Dormitorio V1 y no se tocan aquí.

**Hallazgo nuevo de esta fase — DT-05 (wording hardcodeado "cocina" en `iluminacion`):** el `InspectionChecklistItem.question` de `iluminacion` dice "la iluminación de **la cocina**...", ya vigente en producción para Cocina y Baño. Como Dormitorio reutilizaría este mismo template como base nueva (sección I), heredaría el mismo defecto de forma directa y visible. Se recomienda **corregir el wording en 12B** (edición de contenido de un `InspectionChecklistItem.question` existente, no un check nuevo) porque:
- Es 100% seguro: `InspectionChecklistCheck.questionSnapshot` ya congela el texto en cada check existente — el fix solo afecta a checks generados después del cambio, nunca reescribe históricos.
- Es de bajo riesgo y alto valor: sin el fix, cada Dormitorio nuevo mostraría literalmente "la iluminación de la cocina" en un dormitorio, un defecto visible para cualquier usuario real.
- No es una migración, no es destructivo, no cambia severidad ni N/A ni estructura — solo el texto de una pregunta.

Se documenta explícitamente para que 12B lo incluya como una línea más del mismo script aditivo, no como una fase separada.

## Z. Plan de implementación 12B (mecánico)

**Archivos probables a modificar:**
- `src/lib/inspecciones/space-config.ts` — agregar entrada `dormitorio` en `SPACE_LEVEL2_CONFIG` (4 decisiones, sección M) y `dormitorio: "cielo"` en `SPACE_LEVEL2_HISTORICAL_ANCHOR`.
- `src/app/(app)/inspecciones/actions.ts` — **sin cambios** (no se necesita ninguna entrada nueva en `LEVEL2_GATED_LINKS`: Ventana/Puerta siguen base sin gate, y Clóset es un template 100% nuevo sin vínculo `InspectionElementTemplateSpace` que gatear).

**Mecanismos a reutilizar (sin crear ninguno nuevo):** `saveSpaceLevel2ConfigAction`, `SpaceLevel2Panel`, `resolveComponentState`/`needsLevel2Onboarding`, protección al retirar componentes con datos, PDFs, ownership.

**Catálogo nuevo:**
- 1 `InspectionElementTemplate` (`closet`, label "Clóset / Armario empotrado").
- 4 `InspectionChecklistItem` (contenido exacto en sección K/P).
- 4 `TechnicalArticle` (contenido exacto en sección R).

**Catálogo reutilizado (sin modificar contenido):** `piso`, `muros`, `puerta`, `ventana`, `enchufes-interruptores`, `revestimiento-ceramico-piso`, `pintura-muro`, `revestimiento-ceramico-muro` — cero escritura sobre estos.

**Catálogo con corrección de contenido (1 UPDATE, no INSERT):** `InspectionChecklistItem.question` de `iluminacion`, de *"¿La iluminación de la cocina enciende correctamente...?"* a *"¿La iluminación del recinto enciende correctamente...?"* (o equivalente genérico) — mismo `id`, mismo `elementTemplateId`, solo cambia el texto.

**Whitelist / gate:** ninguno nuevo (ver arriba).

**Historical gate:** `SPACE_LEVEL2_HISTORICAL_ANCHOR.dormitorio = "cielo"`.

**Scripts:** un único script idempotente `prisma/db-fixes/fase12b-dormitorio-v1.ts`, siguiendo el mismo patrón ya usado en `fase11at-bano-lote-a.ts`/`fase11au-bano-lotes-b-f.ts` — `upsert` en template/artículos, `findFirst`+`create`/`update` en checklist items (preserva `id` estable), `findFirst`+`create`/`update` en los 2 vínculos `InspectionElementTemplateSpace` nuevos (`dormitorio<->cielo`, `dormitorio<->iluminacion`), y un `update` explícito y acotado por `id` para el fix de wording de `iluminacion`. Debe ejecutarse dos veces en 12B/12C para probar idempotencia, exactamente igual que los scripts de Baño.

**Conteos esperados tras 12B:** 1 template nuevo, 4 checks nuevos, 4 artículos nuevos, 2 vínculos `InspectionElementTemplateSpace` nuevos, 1 `InspectionChecklistItem.question` corregido. Catálogo reutilizado sin cambios: 8 templates, 20 checks (de los 24 totales del checklist maestro).

## AA. Preflight BD compartida (exigible antes de escribir en 12B)

Antes de cualquier escritura: preflight read-only (confirmar que `closet` no existe, confirmar vínculos `dormitorio<->cielo`/`dormitorio<->iluminacion` no existen, confirmar los 6 espacios Dormitorio reales siguen sin `cielo` antes y después), lista exacta de filas a crear (1 template + 4 checks + 4 artículos + 2 vínculos + 1 update de contenido, tal como se detalla en la sección Z), scripts 100% aditivos salvo el único `update` de wording (explícitamente acotado por `id`, no por `where` amplio), idempotencia demostrada con 2 ejecuciones, cero modificación de cualquier `InspectionCase`/`InspectionSpace`/`InspectionElement`/`InspectionChecklistCheck` existente.

## AB. Plan QA 12C

Mínimo: Todo No (=15) y Todo Sí (=24) confirmados exactos; 4 deltas individuales (uno por cada opcional); edición de configuración (agregar y quitar, con protección al retirar componentes con datos); cancelar edición sin guardar; una observación real en Clóset; el N/A de "funcionamiento sin cajones"; guías/TechnicalArticle spot-check de los 4 nuevos; PDF resumen y detallado — contenido real (no solo status HTTP), igual que el método usado en 11AV/11AW; mobile 375px; históricos (los 6 Dormitorios reales, antes/después, sin cambios); ownership; regresión Cocina 7/33; regresión Baño 8/56; smoke de otros recintos; `tsc`, `eslint`, `vitest`, `next build`.

## AC. Autocorrección — criterio para 12B/12C

Si aparece un bug menor causado directamente por el trabajo de Dormitorio, se investiga y corrige dentro de la misma fase, sin abrir una fase nueva por cada hallazgo — mismo criterio "modo acelerado" ya usado en 11AU/11AV. Se detiene solo ante riesgo destructivo, contradicción arquitectónica, migración no prevista o impacto histórico real — ninguno de los cuales se anticipa en este diseño (todas las escrituras planeadas son aditivas o un único update de contenido acotado y de bajo riesgo).

## REPORTE FINAL

DORMITORIO V1 — DISEÑO FINAL

Base:
- Piso (2), Muros (1), Puerta (1), Ventana (7), Enchufes e interruptores (1) — reutilizados sin cambios
- Cielo (2), Iluminación (1) — reutilizados, vínculo nuevo (cierra brecha de paridad con Cocina/Baño)

Total base = 15

Nivel 2 (4 decisiones):
- Revestimiento cerámico de piso (+2)
- Pintura de muro (+1)
- Revestimiento cerámico de muro (+2)
- Clóset / Armario empotrado (+4, nuevo)

Decisiones = 4

Reutilizados: piso, muros, puerta, ventana, enchufes-interruptores, cielo, iluminacion, revestimiento-ceramico-piso, pintura-muro, revestimiento-ceramico-muro (10 componentes, 0 contenido nuevo salvo 1 fix de wording en iluminación)

Nuevos: closet (1 componente, 4 checks, 4 artículos)

Checks nuevos: 4

Mínimo: 15

Máximo: 24

Históricos:
estrategia = ancla histórica `cielo` (idéntico mecanismo ya probado en Cocina/Baño), los 6 Dormitorios reales existentes quedan clasificados como históricos automáticamente, sin migración ni backfill.

BD requerida en 12B:
1 template nuevo (`closet`), 4 checks nuevos, 4 artículos nuevos, 2 vínculos `InspectionElementTemplateSpace` nuevos (`dormitorio<->cielo`, `dormitorio<->iluminacion`), 1 corrección de wording (`iluminacion.question`, UPDATE acotado por id). Todo vía script único idempotente, mismo patrón de Baño Lote A/B-F.

Riesgos:
Ninguno destructivo. El único cambio no puramente aditivo (fix de wording de Iluminación) es seguro porque `questionSnapshot` protege los checks ya existentes. Ventana permanece base por decisión explícita de no expandir alcance sin evidencia (sección G) — riesgo de disenso solo si en el futuro se decide que debería ser opcional, lo cual quedaría para una fase propia, no una revisión de este diseño.

Próxima fase:
FASE 12B — IMPLEMENTACIÓN COMPLETA DE DORMITORIO V1

## CONTROL FINAL

Archivos creados: solo esta documentación (`docs/FASE12A_DISENO_INTEGRAL_DORMITORIO_V1.md`).

Código = 0
Prisma = 0
BD = NO WRITES (solo lecturas, confirmado — todos los scripts temporales de auditoría fueron de solo lectura y eliminados al cierre de esta fase)
Catálogo = NO
Commit = NO
Push = NO
Deploy = NO

FASE 12A — DORMITORIO V1 DISEÑADO INTEGRALMENTE
🟢 ARQUITECTURA CERRADA
🟢 CHECKLIST CERRADO
🟢 CONTEOS CERRADOS
🟢 HISTÓRICOS RESUELTOS
🟢 APTO PARA IMPLEMENTACIÓN COMPLETA EN 12B

DETENERSE.

NO IMPLEMENTAR.
NO COMMIT.
NO PUSH.
NO DEPLOY.
