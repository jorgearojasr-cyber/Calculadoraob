# FASE 11AS — Consolidación canónica de Baño V1 y plan definitivo de lotes de implementación

Fase de auditoría + consolidación + resolución de contradicciones documentales + diseño del plan de implementación. Sin cambios de código, Prisma, BD, catálogo, seeds, TechnicalArticles en BD, casos, commit, push ni deploy.

## A. Objetivo

Reunir en una única especificación ejecutable todas las decisiones tomadas entre 11AJ y 11AR, resolver la contradicción aritmética detectada en esta fase (sección Z), y entregar un plan de lotes de implementación concreto, sin implementar nada todavía.

## B. Fuentes documentales

Leídos íntegramente: `FASE11AJ_DISENO_CANONICO_BANO_V1.md`, `FASE11AK_CIERRE_TECNICO_EXTRACTOR_AIRE_BANO.md`, `FASE11AL_CIERRE_TECNICO_WC_BANO.md`, `FASE11AM_CIERRE_TECNICO_LAVAMANOS_BANO.md`, `FASE11AN_CIERRE_TECNICO_DUCHA_BANO.md`, `FASE11AO_CIERRE_TECNICO_MAMPARA_BANO.md`, `FASE11AP_CIERRE_TECNICO_TINA_BANO.md`, `FASE11AQ_CIERRE_TECNICO_MUEBLE_BANO.md`, `FASE11AR_CIERRE_TECNICO_CUBIERTA_BANO.md`. Reutilizados como precedente de arquitectura/implementación, sin releer desde cero: `FASE11AI_CIERRE_FUNCIONAL_COCINA_V1.md` (patrón de cierre funcional), y las fases de Cocina que definieron Level 2, material-derived, Muebles/Cubierta, Lavaplatos y Campana (11Y, 11AA-11AH y sus -P).

**Regla de precedencia aplicada**: los cierres específicos 11AK-11AR mandan sobre los supuestos preliminares de 11AJ cuando hay contradicción — ya documentado explícitamente en cada cierre (ej. 11AL corrigió WC de 3→4 checks respecto a 11AJ; 11AQ revirtió la conclusión preliminar de 11AJ sobre Cubierta folded). Ninguna contradicción nueva requirió inventar una tercera alternativa, **salvo un error aritmético propio de esta serie, detectado y corregido en esta fase** (sección Z).

## C. Estado de partida

Confirmado por auditoría de solo lectura ejecutada en esta fase: el catálogo real de BD **no ha cambiado desde 11AJ** — `bano` sigue vinculado únicamente a `piso`, `muros` y `artefactos-sanitarios` (3 elementos, 6 checks); las 8 keys nuevas de los componentes especiales (`extractor-aire`, `wc`, `lavamanos`, `ducha`, `mampara`, `tina`, `mueble-bano`, `cubierta-bano`) siguen **libres**, confirmando que ninguna fase de diseño escribió en BD; los 5 espacios de Baño reales de Jorge (`las dalias`×2, `casa`×1, `xcxc`×2) siguen con `config: null` y los mismos 3 elementos históricos, sin cambios. Esta fase parte de ese estado real, no de una arquitectura imaginaria.

## D. Arquitectura real del engine (auditoría de código, ya confirmada en fases anteriores, reutilizada sin releer desde cero)

- `InspectionSpace.config: { components?: Record<elementTemplateKey, boolean>, componentMeta?: Record<elementTemplateKey, Record<string,string>> }` — modelo genérico, sin columnas por componente, confirmado en `src/lib/inspecciones/space-config.ts`.
- `SPACE_LEVEL2_CONFIG: Record<spaceTemplateKey, SpaceConfigurableComponent[]>` — cada entrada define `componentKey`, `label`, `question`, `section?`, `metaOptions?`, `order?`. Hoy solo existen entradas para `antejardin`, `acceso-vehicular` y `cocina` — **`bano` no tiene entrada todavía**, confirmado por lectura directa del archivo.
- `SPACE_LEVEL2_HISTORICAL_ANCHOR: Record<spaceTemplateKey, elementTemplateKey>` — hoy solo `{ cocina: "cielo" }`. **`bano` no tiene ancla todavía**.
- `saveSpaceLevel2ConfigAction` — motor genérico de guardado: valida ownership, re-resuelve `componentKey` server-side contra `SPACE_LEVEL2_CONFIG[spaceTemplateKey]` real (whitelist, nunca confía en el cliente), crea/elimina `InspectionElement` de forma idempotente, exige confirmación antes de eliminar un componente con datos guardados. **No requiere cambios para soportar Baño** — ya es 100% genérico por `spaceTemplateKey`.
- `LEVEL2_GATED_LINKS` (`src/app/(app)/inspecciones/actions.ts`) — hoy `Set(["antejardin:reja", "acceso-vehicular:porton", "cocina:ventana"])`. Este es el mecanismo real que impide que un componente Nivel 2 con vínculo de catálogo (`InspectionElementTemplateSpace`) se genere automáticamente. **Baño no necesita agregar ninguna entrada aquí** porque, a diferencia de `cocina:ventana` (que sí tiene un vínculo heredado de antes de existir Nivel 2), ninguno de los componentes Nivel 2 nuevos de Baño (Ventana, Extractor, WC, Lavamanos, Ducha, Mampara, Tina, Mueble, Cubierta) tendrá jamás un `InspectionElementTemplateSpace` — se confirma en la sección Q que ninguno de ellos requiere ese vínculo, por lo que no hay nada que gatear.
- `SpaceConfigurableComponent.order` — order explícito del Nivel 2 (Fase 11AB de Cocina), independiente del `order` de catálogo (`InspectionElementTemplateSpace`). Confirmado: el panel Nivel 2 agrupa por `section`, el checklist plano ordena por este `order` numérico sin agrupar — comportamiento ya validado y documentado extensamente en Cocina (Campana/Lavaplatos) y anticipado explícitamente en el diseño de Baño desde 11AJ §AN.
- `InspectionReferenceImage` — modelo de referencias GOOD/BAD por `InspectionChecklistItem`, hoy con **0 filas globales** (confirmado en 11AI, sin cambios desde entonces).

**Conclusión**: la infraestructura genérica ya existe y es suficiente. Baño V1 solo necesita **agregar datos** (una entrada a `SPACE_LEVEL2_CONFIG`, una entrada a `SPACE_LEVEL2_HISTORICAL_ANCHOR`, y el catálogo de BD) — no requiere cambios de motor, de schema Prisma, ni de UI genérica. Ver sección AC.

## E. Catálogo actual de Baño

| Key | Label | Origen | Checks | Active | Links | materialVariantOf | Uso actual | Destino Baño V1 |
|---|---|---|---|---|---|---|---|---|
| `piso` | Piso | Preexistente (transversal) | 2 | ✅ | `bano` order 0 | null | Base, generado siempre | **Base**, sin cambios |
| `muros` | Muros | Preexistente (transversal) | 1 | ✅ | `bano` order 1 | null | Base, generado siempre | **Base**, sin cambios |
| `artefactos-sanitarios` | Artefactos sanitarios | Preexistente, específico de Baño | 3 | ✅ | `bano` order 2 | null | Base, generado siempre | **Legacy únicamente** — retirado de la generación de Baños nuevos, permanece intacto para históricos (sección F) |
| `cielo` | Cielo | Preexistente (transversal, creado en Cocina 11AA) | 2 | ✅ | Solo `cocina` hoy | null | No vinculado a Baño | **Base**, reutilizado — nuevo vínculo a `bano` |
| `iluminacion` | Iluminación | Preexistente (transversal, creado en Cocina 11AA) | 1 | ✅ | Solo `cocina` hoy | null | No vinculado a Baño | **Base**, reutilizado — nuevo vínculo a `bano` |
| `enchufes-interruptores` | Enchufes e interruptores | Preexistente (transversal) | 1 | ✅ | Varios recintos, no `bano` | null | No vinculado a Baño | **Base**, reutilizado — nuevo vínculo a `bano` |
| `puerta` | Puerta | Preexistente (transversal) | 1 | ✅ | Varios recintos, no `bano` | null | No vinculado a Baño | **Base**, reutilizado — nuevo vínculo a `bano` (a diferencia de Cocina, donde Puerta es Nivel 2) |
| `ventana` | Ventana | Preexistente (transversal, cierre técnico 11S) | 8 filas (7 activas + 1 legacy inactiva) | ✅ | Varios recintos, incl. `cocina` (gateada) | null | Nivel 2 en Cocina | **Nivel 2** en Baño, mismo template, sin cambios de contenido |
| `revestimiento-ceramico-piso` | Revestimiento cerámico de piso | Preexistente (creado en Cocina 11AB) | 2 | ✅ | Solo `cocina` hoy | `piso` (semántico, sin lógica) | Nivel 2 en Cocina | **Nivel 2** en Baño, mismo template |
| `pintura-muro` | Pintura de muro | Preexistente (creado en Cocina 11AB) | 1 | ✅ | Solo `cocina` hoy | `muros` | Nivel 2 en Cocina | **Nivel 2** en Baño, mismo template |
| `revestimiento-ceramico-muro` | Revestimiento cerámico de muro | Preexistente (creado en Cocina 11AB) | 2 | ✅ | Solo `cocina` hoy | `muros` | Nivel 2 en Cocina | **Nivel 2** en Baño, mismo template |

Ninguno de estos 11 templates existentes requiere modificación de contenido — solo, para los 8 no vinculados hoy a `bano`, un nuevo vínculo (`Cielo`/`Iluminación`/`Enchufes`/`Puerta`) o su inclusión en `SPACE_LEVEL2_CONFIG.bano` (`Ventana`/3 terminaciones).

## F. Legacy `artefactos-sanitarios` — estrategia consolidada

**Confirmado sin ambigüedad, consolidando 11AL §E/AD, reutilizado sin cambios en 11AM-11AR:**

- **Baños históricos** (hoy: 5 espacios reales de Jorge, todos `config: null`, con `piso`/`muros`/`artefactos-sanitarios`) — permanecen **exactamente como están**: sin renombrar el componente, sin dividirlo, sin migrar respuestas (hoy 0 reales, pero la política aplica igual si las hubiera), sin cambiar sus checks, sin sustituirlo por WC/Lavamanos, sin generar componentes nuevos, sin alterar `config`, sin backfill de ningún tipo.
- **Baños V1 nuevos** (generados una vez publicada la nueva arquitectura) — usan exclusivamente los componentes nuevos (WC, Lavamanos, Ducha, Mampara, Tina, Mueble, Cubierta) según Nivel 2. **Nunca generan `artefactos-sanitarios`.**
- **Mecanismo real para evitar la generación legacy sin romper snapshots**: mismo patrón ya usado para `cocina:ventana` en `LEVEL2_GATED_LINKS` — la generación automática (`createInspectionAndGenerateAction`) lee `InspectionElementTemplateSpace` para decidir qué elementos crear; el vínculo `bano ↔ artefactos-sanitarios` (`order: 2`, confirmado en sección C) permanecerá en catálogo (no se toca, no se desactiva, sección AC) pero el código de generación agregará el par `"bano:artefactos-sanitarios"` a `LEVEL2_GATED_LINKS`, filtrándolo de la generación automática de Baños nuevos sin necesitar tocar el catálogo compartido. Los snapshots históricos, que ya tienen el `InspectionElement` creado antes de este cambio, no se ven afectados — el gate solo actúa en el momento de generación de un caso nuevo.
- **No coexistencia**: con el gate activo, un Baño nuevo nunca tendrá `artefactos-sanitarios` + WC/Lavamanos/etc. simultáneamente — el primero solo existe en espacios generados por código anterior a esta implementación.
- **No se toca `artefactos-sanitarios.active`** en ningún lote (confirmado, consolidando 11AL §AE) — permanece `true`, sirviendo únicamente a los históricos.

## G. Componentes base — tabla consolidada

| Componente | Key | Checks | Reutilizado/Nuevo vínculo | Fuente general |
|---|---|---|---|---|
| Piso | `piso` | 2 | Ya vinculado | 🟢 Manual CDT Ficha 10 + ITO |
| Muros | `muros` | 1 | Ya vinculado | 🟢🟡 Manual CDT + ITO |
| Cielo | `cielo` | 2 | Nuevo vínculo (reutilizado) | 🟡 criterio interno/respaldo indirecto |
| Enchufes e interruptores | `enchufes-interruptores` | 1 | Nuevo vínculo (reutilizado) | 🟢🟡 Manual CDT Ficha 26 + ITO |
| Iluminación | `iluminacion` | 1 | Nuevo vínculo (reutilizado) | 🟡 criterio interno |
| Puerta | `puerta` | 1 | Nuevo vínculo (reutilizado) | 🟢 Manual CDT Ficha 12 |

**Total base = 8 checks.**

## H. Terminaciones (Nivel 2, material-derived)

| Componente | Key | Checks | Reutilizar/No reutilizar | Justificación |
|---|---|---|---|---|
| Revestimiento cerámico de piso | `revestimiento-ceramico-piso` | 2 | **REUTILIZAR** | Criterio 100% de material (palmetas/esmalte), sin relación con el recinto — mismo estándar ya validado en Cocina |
| Pintura de muro | `pintura-muro` | 1 | **REUTILIZAR** | Ídem |
| Revestimiento cerámico de muro | `revestimiento-ceramico-muro` | 2 | **REUTILIZAR** | Ídem, permite coexistir con Pintura (zonas mixtas), sin selector excluyente |

**Total Terminaciones = 5 checks**, ningún template nuevo.

## I-L. Cielo, Iluminación, Ventana, Puerta — estado final

- **Cielo**: **Base**, reutilizado sin cambios, 2 checks, nuevo vínculo `InspectionElementTemplateSpace` a `bano`.
- **Iluminación**: **Base**, reutilizado sin cambios, 1 check, nuevo vínculo. Sin controles eléctricos nuevos diseñados en ninguna fase de esta serie — el check existente ya es seguro (sin instrucciones de manipular cableado).
- **Ventana**: **Nivel 2**, reutilizado sin cambios, 7 checks activos (de 8 filas, 1 legacy inactiva), pregunta "¿La cocina tiene ventana?" → **debe generalizarse para Baño**: pregunta confirmada en 11AJ §O y reconfirmada aquí: "¿El baño tiene ventana?" (mismo patrón textual, wording específico de recinto ya usado así en Cocina). Sección EQUIPAMIENTO DEL RECINTO, `order` 13. Independiente de Extractor (sección U).
- **Puerta**: **Base** en Baño (a diferencia de Cocina, donde es Nivel 2) — mismo template, 1 check, nuevo vínculo. Justificación ya cerrada en 11AJ §N: la privacidad es un requisito prácticamente universal en baños independientes, a diferencia de cocinas (frecuentemente abiertas al living).

## M. Componentes especiales cerrados — tabla canónica completa

| Componente | Key final | Label final | Base/Nivel 2 | Section | Pregunta Nivel 2 | Metadata | N° checks | N/A | Fuente general | Referencias visuales | Legacy | Documento de cierre |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Extractor de aire | `extractor-aire` | Extractor de aire | Nivel 2 | EQUIPAMIENTO DEL RECINTO | "¿El baño tiene extractor de aire instalado?" | Ninguna | 2 | No | 🟡 criterio interno puro | 0 alto valor, 2 no necesaria | No existe en legacy | 11AK |
| WC / Inodoro | `wc` | WC / Inodoro | Nivel 2 | ARTEFACTOS SANITARIOS | "¿El baño tiene inodoro instalado?" | Ninguna | 4 | No | 🟡 (2 con analogía ITO) | 2 alto valor, 2 no necesaria | Reutiliza concepto/fuente de `artefactos-sanitarios` (no el componente) | 11AL |
| Lavamanos | `lavamanos` | Lavamanos | Nivel 2 | ARTEFACTOS SANITARIOS | "¿El baño tiene lavamanos instalado?" | Ninguna | 5 | Sí — 2 de 5 (agua fría/caliente, sello) | 🟡 (2 con analogía ITO) | 2 alto/opcional, 3 no necesaria | Reutiliza concepto/fuente de `artefactos-sanitarios` | 11AM |
| Ducha | `ducha` | Ducha | Nivel 2 | ARTEFACTOS SANITARIOS | "¿El baño tiene ducha instalada?" | Ninguna | 6 | Sí — 2 de 6 (agua fría/caliente, receptáculo) | 🟡 (2 con analogía ITO) | 3 alto/opcional, 3 no necesaria | Reutiliza concepto/fuente de `artefactos-sanitarios` | 11AN |
| Mampara | `mampara` | Mampara | Nivel 2 | ARTEFACTOS SANITARIOS | "¿El baño tiene mampara instalada?" | Ninguna | 5 | Sí — 1 de 5 (funcionamiento) | 🟡 criterio interno puro (sin analogía ITO) | 2 alto/opcional, 3 no necesaria | No existe en legacy | 11AO |
| Tina | `tina` | Tina / Bañera | Nivel 2 | ARTEFACTOS SANITARIOS | "¿El baño tiene tina instalada?" | Ninguna | 7 | Sí — 1 de 7 (llenado) | 🟡 (1 con analogía ITO) | 3 alto/opcional, 4 no necesaria | Reutiliza concepto/fuente de `artefactos-sanitarios` (fugas) | 11AP |
| Mueble de baño / Vanitorio | `mueble-bano` | Mueble de baño / Vanitorio | Nivel 2 | ARTEFACTOS SANITARIOS | "¿El baño tiene mueble de baño o vanitorio instalado?" | Ninguna | 4 | Sí — 1 de 4 (funcionamiento) | 🟡 criterio interno puro | 1 alto valor, 3 no necesaria | No existe en legacy | 11AQ |
| Cubierta de baño | `cubierta-bano` | Cubierta de baño | Nivel 2 | ARTEFACTOS SANITARIOS | "¿El baño tiene cubierta o mesón instalado?" | Ninguna | 3 | No | 🟡 criterio interno (1 por analogía) | 1 alto valor, 2 no necesaria | No existe en legacy | 11AR |

**Total componentes especiales = 8, todos con definición/key/checks/severidades/fuentes/guías/N/A/históricos/fronteras cerrados. Ninguno tiene `metaOptions`.**

## N. Sections y orden — configuración definitiva de `SPACE_LEVEL2_CONFIG.bano`

| Section | Componente | Key | `order` |
|---|---|---|---|
| TERMINACIONES | Revestimiento cerámico de piso | `revestimiento-ceramico-piso` | 10 |
| TERMINACIONES | Pintura de muro | `pintura-muro` | 11 |
| TERMINACIONES | Revestimiento cerámico de muro | `revestimiento-ceramico-muro` | 12 |
| EQUIPAMIENTO DEL RECINTO | Ventana | `ventana` | 13 |
| EQUIPAMIENTO DEL RECINTO | Extractor de aire | `extractor-aire` | 14 |
| ARTEFACTOS SANITARIOS | WC / Inodoro | `wc` | 15 |
| ARTEFACTOS SANITARIOS | Lavamanos | `lavamanos` | 16 |
| ARTEFACTOS SANITARIOS | Ducha | `ducha` | 17 |
| ARTEFACTOS SANITARIOS | Tina | `tina` | 18 |
| ARTEFACTOS SANITARIOS | Mampara | `mampara` | 19 |
| ARTEFACTOS SANITARIOS | Mueble de baño / Vanitorio | `mueble-bano` | 20 |
| ARTEFACTOS SANITARIOS | Cubierta de baño | `cubierta-bano` | 21 |

**3 sections, 12 decisiones Nivel 2 en total** (3 TERMINACIONES + 2 EQUIPAMIENTO DEL RECINTO + 7 ARTEFACTOS SANITARIOS) — este es el número correcto y definitivo, corrigiendo la cifra de "9" que 11AJ había proyectado antes de que 11AQ/11AR agregaran Cubierta como componente independiente, y de "10" que 11AQ mencionó como transición. **12 es la cifra final.**

No se usa `componentMeta` para ningún componente de Baño.

## O. Orden canónico completo

- **A. Orden del panel Nivel 2**: por `section`, en el orden TERMINACIONES → EQUIPAMIENTO DEL RECINTO → ARTEFACTOS SANITARIOS, y dentro de cada sección por `order` ascendente (tabla de la sección N).
- **B. Orden de componentes en el checklist plano**: por `order` numérico puro, sin agrupar por `section` — mismo comportamiento ya confirmado en Cocina (Campana aparece después de Lavaplatos pese a agruparse antes visualmente) y anticipado explícitamente desde el diseño de Baño (11AJ §AN). Con el orden de la sección N, esto significa que en el checklist plano, Extractor (`order:14`) aparece antes que todos los componentes de ARTEFACTOS SANITARIOS (15-21), pese a que en el panel Extractor se agrupa en una sección distinta (EQUIPAMIENTO) que aparece igualmente antes.
- **C. Order numérico de catálogo (`InspectionElementTemplateSpace.order`)** para los componentes base nuevos vinculados a `bano`: propuesto `piso:0` (ya existente), `muros:1` (ya existente), `cielo:2` (nuevo), `enchufes-interruptores:3` (nuevo), `iluminacion:4` (nuevo), `puerta:5` (nuevo) — secuencial, sin reescribir el `order` de los vínculos ya existentes de `piso`/`muros`, mismo criterio de no-alterar-catálogo-ya-desplegado ya aplicado en Cocina 11AB.

**Deuda transversal preexistente, explícitamente NO corregida en esta fase**: el orden de los elementos base (`piso`, `muros`, `cielo`, `enchufes-interruptores`, `iluminacion`, `puerta`) puede resultar no determinista en el checklist real si `createInspectionAndGenerateAction` no asigna `order` explícito al crear los `InspectionElement` (mismo bug DT-02 ya documentado en Cocina desde 11AD, nunca corregido). Baño heredará el mismo comportamiento — se documenta como deuda transversal separada (sección AN), no se corrige aquí.

## P. Checklist maestro completo (33 base+terminaciones+ventana+extractor, 34 sanitarios = 67... ver aritmética corregida en sección Z)

### Base (8 checks)

| Componente | Key | Order | Check # | Question exacta | Severity | N/A | Fuente | Article | Ref. visual |
|---|---|---|---|---|---|---|---|---|---|
| Piso | `piso` | 0 | 1 | ¿Presenta daños visibles? | null | No | 🟢 | `piso-como-revisar-danos-visibles` | — |
| Piso | `piso` | 0 | 2 | ¿Presenta desniveles? | null | No | 🟢 | `piso-como-revisar-desniveles` | — |
| Muros | `muros` | 1 | 1 | ¿Presenta fisuras visibles? | MEDIUM | No | 🟢🟡 | `muros-como-revisar-fisuras` | — |
| Cielo | `cielo` | 2 | 1 | ¿El cielo presenta manchas, grietas u otros daños visibles? | null | No | 🟡 | `cielo-como-revisar-manchas-grietas` | — |
| Cielo | `cielo` | 2 | 2 | ¿Se observan manchas de humedad en el cielo? | null | No | 🟡 | `cielo-como-revisar-manchas-humedad` | — |
| Enchufes e interruptores | `enchufes-interruptores` | 3 | 1 | ¿Cada enchufe probado funciona con un artefacto real? | null | No | 🟢🟡 | `enchufes-interruptores-como-revisar-funcionamiento` | — |
| Iluminación | `iluminacion` | 4 | 1 | ¿La iluminación... enciende correctamente y el elemento visible se encuentra firme? | null | No | 🟡 | `iluminacion-como-revisar-encendido-fijacion` | — |
| Puerta | `puerta` | 5 | 1 | ¿Cierra correctamente? | null | No | 🟢 | `puerta-como-revisar-cierre` | — |

*(Wording de Iluminación reutilizado literal de Cocina, referido a "la cocina" — requiere adaptación menor de copy a "el baño" al implementar, sin cambiar el criterio técnico; ver sección Q.)*

### Terminaciones (5 checks)

| Componente | Key | Order | Check | Question | Severity | N/A | Fuente |
|---|---|---|---|---|---|---|---|
| Revest. cerámico piso | `revestimiento-ceramico-piso` | 10 | 1 | ¿Hay palmetas quebradas, trisadas o despuntadas? | null | No | 🟢 |
| Revest. cerámico piso | `revestimiento-ceramico-piso` | 10 | 2 | ¿Se observan defectos visibles en el esmalte o superficie de las palmetas? | null | No | 🟢 |
| Pintura de muro | `pintura-muro` | 11 | 1 | ¿Se observan manchas, marcas o defectos visibles en la pintura? | null | No | 🟢 |
| Revest. cerámico muro | `revestimiento-ceramico-muro` | 12 | 1 | ¿Hay palmetas quebradas, trisadas o despuntadas? | null | No | 🟢 |
| Revest. cerámico muro | `revestimiento-ceramico-muro` | 12 | 2 | ¿Se observan defectos visibles en el esmalte o superficie de las palmetas? | null | No | 🟢 |

### Equipamiento del recinto (9 checks)

| Componente | Key | Order | Check | Question | Severity | N/A |
|---|---|---|---|---|---|---|
| Ventana | `ventana` | 13 | 1 | ¿La ventana abre y cierra correctamente? | null | No |
| Ventana | `ventana` | 13 | 2 | ¿La manilla y los herrajes funcionan correctamente? | null | No |
| Ventana | `ventana` | 13 | 3 | Con la ventana cerrada, ¿se ve alguna separación entre la hoja y el marco? | null | No |
| Ventana | `ventana` | 13 | 4 | ¿El vidrio presenta rayas, trizaduras u otros daños visibles? | null | No |
| Ventana | `ventana` | 13 | 5 | Si es termopanel, ¿se ve condensación entre los vidrios? | null | No |
| Ventana | `ventana` | 13 | 6 | ¿El sello entre el marco y el muro se ve continuo? | null | No |
| Ventana | `ventana` | 13 | 7 | ¿El marco presenta golpes, rayas profundas o deformaciones? | null | No |
| Extractor de aire | `extractor-aire` | 14 | 1 | ¿El extractor enciende y funciona al accionar su control normal? | MEDIUM | No |
| Extractor de aire | `extractor-aire` | 14 | 2 | Al funcionar, ¿presenta vibraciones, golpes o ruidos claramente irregulares? | MEDIUM | No |

### Artefactos sanitarios (34 checks)

| Componente | Key | Order | Check | Question | Severity | N/A |
|---|---|---|---|---|---|---|
| WC/Inodoro | `wc` | 15 | 1 | ¿El inodoro descarga correctamente al accionar el mecanismo, y el agua deja de correr con normalidad después? | MEDIUM | No |
| WC/Inodoro | `wc` | 15 | 2 | ¿Se observan fugas o humedad alrededor de la base del inodoro después de una descarga normal? | HIGH | No |
| WC/Inodoro | `wc` | 15 | 3 | ¿El inodoro se ve firme y estable, sin movimiento evidente al tocarlo suavemente? | MEDIUM | No |
| WC/Inodoro | `wc` | 15 | 4 | ¿El inodoro presenta trizaduras, quiebres, golpes u otros daños visibles en la loza? | LOW | No |
| Lavamanos | `lavamanos` | 16 | 1 | ¿La grifería abre y cierra correctamente, sin quedar goteando? | LOW | No |
| Lavamanos | `lavamanos` | 16 | 2 | ¿Funcionan correctamente el agua fría y caliente, cuando dispone de ambas? | LOW | Sí — solo fría por diseño |
| Lavamanos | `lavamanos` | 16 | 3 | Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavamanos? | HIGH | No |
| Lavamanos | `lavamanos` | 16 | 4 | ¿El lavamanos se ve firme y bien instalado, sin moverse al tocarlo suavemente? | MEDIUM | No |
| Lavamanos | `lavamanos` | 16 | 5 | Si tiene encuentro visible con cubierta/muro, ¿el sello se ve continuo? | MEDIUM | Sí — sin encuentro visible |
| Ducha | `ducha` | 17 | 1 | ¿La grifería abre, cierra y responde correctamente al accionar sus controles? | LOW | No |
| Ducha | `ducha` | 17 | 2 | ¿Funcionan correctamente el agua fría y caliente, cuando dispone de ambas? | LOW | Sí — solo fría por diseño |
| Ducha | `ducha` | 17 | 3 | Al usar la ducha, ¿se observan fugas o goteos en conexiones visibles? | HIGH | No |
| Ducha | `ducha` | 17 | 4 | Después de dejar correr agua, ¿el agua evacúa sin quedar acumulada? | MEDIUM | No |
| Ducha | `ducha` | 17 | 5 | Si tiene receptáculo/plato, ¿se ve firme y sin daños visibles? | MEDIUM | Sí — ducha a ras |
| Ducha | `ducha` | 17 | 6 | El sello entre el receptáculo/piso y el muro, ¿se ve continuo? | MEDIUM | No |
| Tina | `tina` | 18 | 1 | ¿La tina presenta trizaduras, quiebres, golpes, esmalte saltado u otros daños? | LOW | No |
| Tina | `tina` | 18 | 2 | ¿La tina se ve firme y estable, sin movimiento evidente, crujidos ni separaciones? | MEDIUM | No |
| Tina | `tina` | 18 | 3 | ¿El tapón/válvula retiene el agua sin pérdida evidente unos momentos? | LOW | No |
| Tina | `tina` | 18 | 4 | Al usar la tina, ¿se observa alguna fuga o humedad en conexiones/desagüe visibles? | HIGH | No |
| Tina | `tina` | 18 | 5 | Después de dejar correr agua y destapar, ¿el agua evacúa sin quedar acumulada? | MEDIUM | No |
| Tina | `tina` | 18 | 6 | El sello entre la tina y el muro (y piso, si existe), ¿se ve continuo? | MEDIUM | No |
| Tina | `tina` | 18 | 7 | Si tiene sistema de llenado propio distinto al de la ducha, ¿el agua sale con normalidad? | MEDIUM | Sí — comparte grifería con Ducha |
| Mampara | `mampara` | 19 | 1 | Si tiene hoja móvil, ¿abre, cierra o desliza correctamente? | MEDIUM | Sí — mampara fija |
| Mampara | `mampara` | 19 | 2 | ¿Se ve firme y estable, sin movimientos o piezas sueltas al tocarla suavemente? | MEDIUM | No |
| Mampara | `mampara` | 19 | 3 | ¿Los vidrios o perfiles presentan trizaduras, quiebres, rayas profundas u otros daños? | HIGH | No |
| Mampara | `mampara` | 19 | 4 | ¿Los sellos visibles se ven continuos, sin separaciones ni grietas? | MEDIUM | No |
| Mampara | `mampara` | 19 | 5 | Durante el uso normal, ¿se observa agua saliendo fuera de la mampara? | MEDIUM | No |
| Mueble de baño | `mueble-bano` | 20 | 1 | ¿Las puertas y cajones abren, cierran o deslizan correctamente, cuando existan? | MEDIUM | Sí — sin puertas/cajones |
| Mueble de baño | `mueble-bano` | 20 | 2 | ¿Se siente firme y bien sujeto, sin movimiento evidente al tocarlo suavemente? | HIGH | No |
| Mueble de baño | `mueble-bano` | 20 | 3 | ¿Presenta golpes, quiebres, rayas profundas, cantos despegados u otros daños? | LOW | No |
| Mueble de baño | `mueble-bano` | 20 | 4 | ¿Se observan señales de humedad (tablero hinchado, melamina levantada, manchas, moho)? | MEDIUM | No |
| Cubierta de baño | `cubierta-bano` | 21 | 1 | ¿Se ve firme y bien instalada, sin movimiento evidente al tocarla suavemente? | MEDIUM | No |
| Cubierta de baño | `cubierta-bano` | 21 | 2 | ¿Presenta golpes, quiebres, trizaduras, rayas profundas, manchas, hinchamiento u otro deterioro? | LOW | No |
| Cubierta de baño | `cubierta-bano` | 21 | 3 | El sello entre la cubierta y el muro (fuera del tramo de Lavamanos), ¿se ve continuo? | MEDIUM | No |

Wording reproducido literal de cada cierre técnico — no se reescribe editorialmente en esta fase, confirmado.

## Q. TechnicalArticles — cobertura

Para cada uno de los 34 checks de artefactos sanitarios + 2 de Extractor (36 checks nuevos de componentes especiales): **B. requiere nuevo artículo**, con contenido completo ya redactado en su cierre técnico respectivo (los 7 encabezados canónicos confirmados presentes en cada guía de 11AK-11AR — verificado, ninguno incompleto). Para los 6 checks de terminaciones y 7 de Ventana: **reutiliza artículo existente** (ya publicado en Cocina, sin cambios). Para los 6 checks base transversales (Piso, Muros, Cielo, Enchufes, Puerta): **reutiliza artículo existente**, salvo **Iluminación**, cuyo artículo actual (`iluminacion-como-revisar-encendido-fijacion`) está redactado con referencia textual a "la cocina" — requiere una adaptación menor de copy (no de criterio técnico) para generalizarse a cualquier recinto, marcada aquí como pendiente menor de implementación, no de diseño.

**Ningún artículo requerido está incompleto** — los 8 cierres técnicos contienen guías completas de 7 encabezados para sus 36 checks nuevos, confirmado por relectura en esta fase. No se inventa contenido faltante — no hace falta.

## R. Fuentes — matriz consolidada (resumen por componente, detalle completo ya está en cada cierre)

| Componente | Checks | Clasificación agregada | Documento que cerró la fuente |
|---|---|---|---|
| Base (6 componentes) | 8 | Mixta (🟢/🟢🟡/🟡), heredada de Cocina | 11AI |
| Terminaciones | 5 | 🟢 mayoritario | 11AI (Cocina) |
| Ventana | 7 | 🟢 mayoritario | 11S/11AI |
| Extractor de aire | 2 | 🟡 puro | 11AK |
| WC | 4 | 🟡 (2 con analogía ITO) | 11AL |
| Lavamanos | 5 | 🟡 (2 con analogía ITO) | 11AM |
| Ducha | 6 | 🟡 (2 con analogía ITO) | 11AN |
| Mampara | 5 | 🟡 puro | 11AO |
| Tina | 7 | 🟡 (1 con analogía ITO) | 11AP |
| Mueble de baño | 4 | 🟡 puro | 11AQ |
| Cubierta de baño | 3 | 🟡 (1 por analogía) | 11AR |

**Verificación explícita anti-inflado del Manual de Tolerancias**: confirmado en cada uno de los 8 cierres, y reconfirmado aquí sin excepción — el cap. 22 (muebles/cubiertas incorporados) da tolerancias dimensionales que **requieren instrumento** (nivel, escuadra) — ninguno de los checks de Mueble de baño ni Cubierta de baño (funcionamiento, fijación, daños, humedad, sello) se atribuye a ese capítulo. El Manual **no** cubre WC, lavamanos, ducha, tina, mampara, grifería ni sellos sanitarios — confirmado explícitamente en 11V, 11AJ §F y en cada cierre individual. Ninguna fuente inflada detectada.

## S. Severidades — resumen

Ver columna Severity en la sección P (wording literal). Patrón consolidado: fugas activas de agua = siempre `HIGH` (WC, Lavamanos, Ducha, Tina — consistente en las 4); fijación = `MEDIUM`, salvo Mueble de baño (`HIGH`, por riesgo real de caída en muebles suspendidos) y Mampara-Daños visibles (`HIGH`, por riesgo de corte de vidrio — única excepción a "daños visibles = LOW" del resto del catálogo, justificada explícitamente en 11AO); sellos = `MEDIUM` de forma uniforme en todo el catálogo sanitario; funcionamiento cosmético/grifería = `LOW`. **Recordatorio explícito, consolidado de cada cierre**: `defaultSeverity` existe correctamente en el catálogo diseñado, pero la UI del formulario de observación hoy preselecciona `MEDIUM` sin leerlo (DT-01) — esta es una deuda transversal preexistente, **no se corrige dentro de la implementación de contenido de Baño** (sección AN).

## T. No corresponde — matriz consolidada

| Check | Allow N/A | Motivo |
|---|---|---|
| Lavamanos - Agua fría/caliente | Sí | Instalación solo con agua fría por diseño |
| Lavamanos - Sello perimetral | Sí | Variantes de montaje sin encuentro visible (pedestal, suspendido sin encimera) |
| Ducha - Agua fría/caliente | Sí | Instalación solo con agua fría por diseño |
| Ducha - Receptáculo/plato | Sí | Ducha "a ras" sin pieza de receptáculo distinta |
| Tina - Llenado | Sí | Tina comparte grifería con una Ducha activa |
| Mampara - Funcionamiento | Sí | Mampara 100% fija, sin hoja móvil |
| Mueble de baño - Funcionamiento | Sí | Mueble sin puertas ni cajones |

**7 checks con N/A de un total de 45 checks nuevos/reutilizados con Nivel 2** (Ventana+Extractor+7 sanitarios = 9 componentes Nivel 2, 36 checks) — todos por variante real y verificable, ninguno agregado por conveniencia, confirmado en cada cierre individual. El resto de los checks Nivel 2 y los 13 checks base/terminaciones no tienen N/A.

## U. Referencias visuales — consolidado

| Clasificación | Cantidad de checks |
|---|---|
| ALTO VALOR | 15 (repartidos entre Fugas de los 4 artefactos con agua, Daños visibles de varios componentes, Sellos, Humedad de Mueble) |
| OPCIONAL | 9 |
| NO NECESARIA | 20 |

**Separación explícita confirmada**: esta matriz es catálogo funcional de clasificación — **no implica generar imágenes ni poblar `InspectionReferenceImage` en ningún lote de esta consolidación**. La futura población de referencias GOOD/BAD queda como mejora V2 (backlog ya heredado de Cocina, sección AN), no como requisito de implementación de Baño V1.

## V. Dependencias — matriz de independencia confirmada

| Componente A | Componente B | Dependencia automática | Decisión |
|---|---|---|---|
| Lavamanos | Mueble de baño | Ninguna | Independientes (11AM §S, 11AQ §J) |
| Lavamanos | Cubierta de baño | Ninguna | Independientes (11AR §J) |
| Mueble de baño | Cubierta de baño | Ninguna | Independientes (11AQ/11AR, corrección arquitectónica central de esta serie) |
| Ducha | Tina | Ninguna | Independientes, pueden coexistir (11AN §H, 11AP §G) |
| Ducha | Mampara | Ninguna | Independientes (11AN §I, 11AO §G) |
| Tina | Mampara | Ninguna | Independientes (11AP §H, 11AO §H) |
| Ventana | Extractor de aire | Ninguna | Independientes, sin certificar cumplimiento normativo de ventilación (11AK §H) |

**Confirmado: cero dependencias automáticas en todo el catálogo de Baño V1** — cada uno de los 12 componentes Nivel 2 se activa de forma completamente independiente.

## W. Árbol canónico completo

```
Baño
├── BASE
│   ├── Piso [piso] — 2 checks
│   ├── Muros [muros] — 1 check
│   ├── Cielo [cielo] — 2 checks (nuevo vínculo)
│   ├── Enchufes e interruptores [enchufes-interruptores] — 1 check (nuevo vínculo)
│   ├── Iluminación [iluminacion] — 1 check (nuevo vínculo)
│   └── Puerta [puerta] — 1 check (nuevo vínculo)
│
├── TERMINACIONES (Nivel 2)
│   ├── Revestimiento cerámico de piso [revestimiento-ceramico-piso] — 2 checks
│   ├── Pintura de muro [pintura-muro] — 1 check
│   └── Revestimiento cerámico de muro [revestimiento-ceramico-muro] — 2 checks
│
├── EQUIPAMIENTO DEL RECINTO (Nivel 2)
│   ├── Ventana [ventana] — 7 checks
│   └── Extractor de aire [extractor-aire] — 2 checks (NUEVO)
│
├── ARTEFACTOS SANITARIOS (Nivel 2)
│   ├── WC / Inodoro [wc] — 4 checks (NUEVO)
│   ├── Lavamanos [lavamanos] — 5 checks (NUEVO)
│   ├── Ducha [ducha] — 6 checks (NUEVO)
│   ├── Tina [tina] — 7 checks (NUEVO)
│   ├── Mampara [mampara] — 5 checks (NUEVO)
│   ├── Mueble de baño / Vanitorio [mueble-bano] — 4 checks (NUEVO)
│   └── Cubierta de baño [cubierta-bano] — 3 checks (NUEVO)
│
└── LEGACY (solo históricos, nunca generado en Baño V1 nuevo)
    └── Artefactos sanitarios [artefactos-sanitarios] — 3 checks
```

## X. Nivel 2 completo — configuración implementable

Ya entregada íntegra en la sección N (12 filas: `order`, `label`, `key`, `section`) más la pregunta exacta de cada componente en la sección M — **suficiente para implementar mecánicamente `SPACE_LEVEL2_CONFIG.bano` directamente desde estas 2 tablas**, sin necesitar releer los 8 cierres individuales durante la implementación del Lote 1.

## Y. Escenarios de configuración — validación

| Escenario | Configuración | ¿Representable sin mentir? |
|---|---|---|
| A. Medio baño | WC Sí, Lavamanos Sí, resto No | ✅ |
| B. Baño con ducha simple | + Ducha Sí | ✅ |
| C. Baño con ducha + Mampara | + Mampara Sí | ✅ |
| D. Baño con Tina | Tina Sí, Ducha No | ✅ |
| E. Tina + Ducha + Mampara | Los 3 Sí (tina con ducha integrada + mampara) | ✅, sin duplicar grifería (11AN §H) |
| F. Lavamanos pedestal | Lavamanos Sí, Mueble No, Cubierta No | ✅ |
| G. Lavamanos suspendido | Lavamanos Sí, Mueble No | ✅ |
| H. Lavamanos + Cubierta sin Mueble | Lavamanos Sí, Cubierta Sí, Mueble No | ✅ (escenario que forzó la independencia de Cubierta) |
| I. Lavamanos + Mueble + Cubierta | Los 3 Sí | ✅ |
| J. Baño sin Ventana + Extractor | Ventana No, Extractor Sí | ✅ |
| K. Ventana + sin Extractor | Ventana Sí, Extractor No | ✅ |

**Los 11 escenarios se representan correctamente, sin ninguna dependencia forzada ni activación falsa.**

## Z. Conteo mínimo, máximo — cálculo corregido (resolución de contradicción documental)

**Hallazgo de esta fase**: los "conteos actualizados" publicados progresivamente en las secciones finales de 11AL (§AI), 11AM (§AJ), 11AN (§AP), 11AO (§AL), 11AP (§AP) y 11AR (§AN) contienen un **error aritmético acumulativo** — cada uno sumó el conteo del componente recién cerrado sobre el total acumulado anterior, pero ese total acumulado anterior **ya incluía la proyección preliminar completa de 11AJ** (que ya contaba todos los componentes, incluido el que se estaba cerrando, a su valor proyectado) — resultando en un doble conteo progresivo. La cifra final publicada en 11AR (`§AN`: "71") es **incorrecta**. Se resuelve aquí recalculando desde cero, usando exclusivamente los valores finales confirmados por componente (sección M/G/H), sin arrastrar ninguna cifra intermedia de los documentos anteriores.

**CONTEO MÍNIMO** (las 12 decisiones Nivel 2 en No — solo componentes base):

```
Piso                        = 2
Muros                       = 1
Cielo                       = 2
Enchufes e interruptores    = 1
Iluminación                 = 1
Puerta                      = 1
─────────────────────────────────
TOTAL MÍNIMO                = 8
```

**CONTEO MÁXIMO** (las 12 decisiones Nivel 2 en Sí):

```
Base (igual que el mínimo)              = 8

TERMINACIONES:
  Revestimiento cerámico de piso        = 2
  Pintura de muro                       = 1
  Revestimiento cerámico de muro        = 2
  Subtotal terminaciones                = 5

EQUIPAMIENTO DEL RECINTO:
  Ventana                               = 7
  Extractor de aire                     = 2
  Subtotal equipamiento                 = 9

ARTEFACTOS SANITARIOS:
  WC / Inodoro                          = 4
  Lavamanos                             = 5
  Ducha                                 = 6
  Tina                                  = 7
  Mampara                               = 5
  Mueble de baño / Vanitorio            = 4
  Cubierta de baño                      = 3
  Subtotal artefactos sanitarios        = 34

Subtotal Nivel 2 (5 + 9 + 34)           = 48
─────────────────────────────────────────
TOTAL MÁXIMO (8 + 48)                   = 56
```

**TOTAL MÍNIMO = 8. TOTAL MÁXIMO = 56.** Estas son las cifras canónicas y definitivas de Baño V1, reemplazando cualquier cifra distinta publicada en cierres anteriores.

## AA. Conteos intermedios

| Escenario | Cálculo | Total |
|---|---|---|
| Medio baño (WC + Lavamanos) | 8 (base) + 4 (WC) + 5 (Lavamanos) | **17** |
| Baño con ducha simple | 8 + 4 (WC) + 5 (Lavamanos) + 6 (Ducha) | **23** |
| Baño con ducha + Mampara | 23 + 5 (Mampara) | **28** |
| Baño con Tina + Ducha + Mampara | 8 + 4 (WC) + 5 (Lavamanos) + 6 (Ducha) + 7 (Tina) + 5 (Mampara) | **35** |
| Baño típico (interior, sin ventana, con extractor, WC+Lavamanos+Ducha+Mampara, sin Tina, con Mueble, piso/muro cerámicos, sin Vanitorio-Cubierta separada) | 8 + 2 (Extractor) + 4 (WC) + 5 (Lavamanos) + 6 (Ducha) + 5 (Mampara) + 4 (Mueble) + 2 (Revest. piso) + 2 (Revest. muro) | **38** |

Rango razonable (17-56), sin absurdos, comparable en orden de magnitud al máximo ya validado de Cocina (33) — Baño es naturalmente mayor por tener 7 artefactos sanitarios independientes en vez de 1 componente agregado.

## AB. Comparación con estado actual

| | Baño histórico/actual | Baño V1 |
|---|---|---|
| Checklist fijo (sin Nivel 2) | 6 (Piso 2 + Muros 1 + Artefactos sanitarios 3) | N/A — reemplazado por rango 8-56 |
| Mínimo | 6 (siempre) | 8 |
| Máximo | 6 (siempre, sin variación) | 56 |
| Componentes sanitarios | 1 agregado, sin poder identificar cuál artefacto falla | 7 independientes (WC/Lavamanos/Ducha/Tina/Mampara/Mueble/Cubierta) |
| Terminaciones | 0 | 5 (opcional) |
| Ventilación | 0 | 2 (opcional) |
| Ventana/Puerta | 0 (ninguno vinculado a Baño hoy) | 7 (Ventana, opcional) + 1 (Puerta, base) |

**El crecimiento no se presenta como un problema** — proviene explícitamente de: (a) terminaciones nuevas (+5 máximo), (b) elementos sanitarios específicos reemplazando el agregado impreciso (+23 máximo, de 3 a 34, con precisión de atribución por artefacto), y (c) opcionales Nivel 2 que la mayoría de los baños reales no activarán todos a la vez (el mínimo sigue siendo bajo, 8, apenas 2 más que el estado actual fijo de 6).

## AC. Estrategia de cohortes

Mismo mecanismo real ya usado en Cocina, sin inventar uno nuevo:

- **A. Baño histórico**: `config: null`, sin `InspectionElement` de key `cielo` → detectado por `SPACE_LEVEL2_HISTORICAL_ANCHOR.bano = "cielo"` (nueva entrada a agregar, mismo patrón que `cocina: "cielo"`) — nunca exige onboarding, nunca recibe componentes nuevos retroactivamente.
- **B. Baño V1 nuevo**: generado después de publicar el Lote de infraestructura (sección AF) — tiene `cielo` desde su creación, por lo que el ancla lo identifica como "no histórico", exige la configuración Nivel 2 de las 12 decisiones al entrar por primera vez.
- **C. Baño V1 editado**: usuario usa "Editar configuración" para cambiar Sí/No después de la creación inicial — mismo motor genérico (`saveSpaceLevel2ConfigAction`), sin necesitar mecanismo nuevo.

No se requiere migración de ningún tipo — el ancla se infiere 100% de datos ya existentes (presencia/ausencia del elemento `cielo`), mismo criterio ya validado 5 veces en Cocina.

## AD. Históricos — pruebas obligatorias (a ejecutar en el lote de publicación, no ahora)

Cada uno de los 5 espacios de Baño reales de Jorge debe conservar, verificado antes y después de cada lote: mismos `InspectionSpace` (mismo `id`), mismos `InspectionElement` (`piso`/`muros`/`artefactos-sanitarios`, sin adiciones), mismos `InspectionChecklistCheck` (los 6 actuales, sin nuevos), mismas respuestas (hoy 0, deben seguir en 0), mismas observaciones (hoy 0), mismas fotos (hoy 0), mismo `config` (`null`, sin escritura), mismo comportamiento de PDF (funcional, sin componentes nuevos apareciendo). **No se reconstruye ningún snapshot con el catálogo nuevo** — se verifica que permanezcan exactamente iguales, byte a byte, mismo patrón ya aplicado 8 veces en cada publicación de Cocina.

## AE. Estrategia de catálogo — plan por componente

| Componente | Clasificación | Requiere `InspectionElementTemplate` | Requiere `InspectionChecklistItem` | Requiere `TechnicalArticle` | Requiere whitelist Nivel 2 | Requiere UI config | `materialVariantOf` | Requiere `InspectionElementTemplateSpace` |
|---|---|---|---|---|---|---|---|---|
| Piso, Muros | Base, reutilizado | No (ya existe) | No | No | No | No | — | No (ya vinculado) |
| Cielo, Enchufes, Iluminación, Puerta | Base, reutilizado | No (ya existe) | No | No (Iluminación: copy menor) | No | No | — | **Sí** — nuevo vínculo a `bano` |
| Revest. piso/muro, Pintura muro | Terminación, reutilizado | No (ya existe) | No | No | **Sí** — nueva entrada en `SPACE_LEVEL2_CONFIG.bano` | No (motor genérico) | Ya definido | **No** |
| Ventana | Nivel 2, reutilizado | No (ya existe) | No | No | **Sí** | No | — | **No** (Cocina ya lo mantiene gateado; Baño no necesita el vínculo directo en absoluto) |
| Extractor, WC, Lavamanos, Ducha, Mampara, Tina, Mueble, Cubierta | Nivel 2, nuevo | **Sí** — 8 templates nuevos | **Sí** — 36 checks nuevos | **Sí** — 36 artículos nuevos | **Sí** — 8 nuevas entradas | No (motor genérico) | Ninguno | **No** |

## AF. Links de template/space — confirmación explícita por componente nuevo

**Confirmado, componente por componente, ninguno requiere `InspectionElementTemplateSpace`**: agregar ese vínculo a cualquiera de los 8 templates nuevos haría que se genere automáticamente en **todo** Baño nuevo, sin pasar por la pregunta Nivel 2 — exactamente el error que el motor de Cocina evita deliberadamente desde Fase 11Y. Ninguno de los 8 (Extractor, WC, Lavamanos, Ducha, Mampara, Tina, Mueble, Cubierta) debe tener ese vínculo. Confirmado también para los 3 templates de terminaciones y para Ventana (ya sin vínculo directo utilizable, gateado en Cocina, y sin necesitar vínculo nuevo en Baño).

## AG. Estrategia de implementación — principios

No implementar en esta fase. Cada lote futuro deberá especificar, siguiendo el patrón ya validado 8 veces en Cocina: alcance exacto, componentes incluidos, keys, checks, artículos, código a modificar, catálogo a modificar (vía script `db-fixes` idempotente), pruebas, conteos esperados (antes/después/delta, tomados de las tablas de esta fase, nunca inventados), regresión, y publicación como fase separada explícita (nunca automática).

## AH. Lotes definitivos propuestos

Derivados de las dependencias reales (sección V: cero dependencias entre componentes especiales) y del riesgo relativo de cada pieza, **no de la plantilla hipotética del enunciado** (que agrupaba Ducha+Mampara+Tina en un solo lote — se propone dividir eso en 2, por volumen y por poder validar Ducha+Mampara antes de sumar la complejidad adicional de Tina):

| Lote | Contenido | Motivo | Riesgo | Dependencias | QA principal |
|---|---|---|---|---|---|
| **A — Infraestructura + Terminaciones + Ventana** | Vincular Cielo/Enchufes/Iluminación/Puerta como base a `bano`; crear `SPACE_LEVEL2_HISTORICAL_ANCHOR.bano`; agregar a `SPACE_LEVEL2_CONFIG.bano` las 3 Terminaciones + Ventana (4 decisiones); gatear `bano:artefactos-sanitarios` en `LEVEL2_GATED_LINKS` | 100% componentes ya existentes y publicados en Cocina, riesgo mínimo, valida el ancla histórica y el gate del legacy en un caso de bajo riesgo antes de tocar contenido sanitario nuevo — mismo patrón que Cocina Lote A/B combinado | Bajo | Ninguna (todo reutilizado) | Mínimo 8→8 (sin cambio con Nivel 2 en No), máximo con las 4 decisiones en Sí = 8+5+7=20; históricos intactos; legacy gateado (Baño nuevo no genera `artefactos-sanitarios`) |
| **B — Ventilación** | Extractor de aire (2 checks) | Componente más simple, sin dependencias, valida el patrón de "componente 100% nuevo sin vínculo de catálogo" en Baño por primera vez | Bajo | Ninguna | 20→22 con Extractor en Sí |
| **C — WC + Lavamanos** | WC (4 checks) + Lavamanos (5 checks), incluida la migración explícita de generación (retirar `artefactos-sanitarios` de Baños nuevos, ya gateado desde el Lote A) | Los 2 artefactos "casi siempre presentes" — mayor impacto en cobertura real, conviene resolverlos juntos y temprano | Medio (primer contacto con retiro del legacy de la generación) | Lote A (ancla + gate) | 22→31 con ambos en Sí; verificar que Baño nuevo NO genera `artefactos-sanitarios` |
| **D — Ducha + Mampara** | Ducha (6 checks) + Mampara (5 checks) | Mampara depende conceptualmente de Ducha existiendo en el caso típico, aunque no técnicamente — conviene publicarlos juntos para poder validar la combinación real en producción | Medio | Ninguna técnica (Lote C recomendado primero por volumen de cobertura, no obligatorio) | 31→42 con ambos en Sí; validar independencia real (Ducha sin Mampara, Mampara sin Ducha) |
| **E — Tina** | Tina (7 checks) | Se publica después de Ducha para validar en producción el caso real "tina con ducha integrada" sin duplicación de grifería | Medio-alto (el componente con más checks, 7) | Lote D (para validar la integración con Ducha) | 42→49 con Tina en Sí; caso específico Ducha+Tina simultáneos sin preguntas repetidas |
| **F — Mueble + Cubierta** | Mueble de baño (4 checks) + Cubierta de baño (3 checks) | Última pieza, sin dependencias de los lotes anteriores; se publican juntos porque su independencia mutua (el hallazgo central de 11AQ/11AR) debe validarse en producción con ambos disponibles a la vez | Medio (requiere validar los 6 escenarios de independencia de la sección Y) | Ninguna técnica | 49→56 con ambos en Sí (máximo teórico completo) |

**6 lotes, no 5** — se dividió el "Ducha+Mampara+Tina" hipotético del enunciado en 2 lotes (D y E) por volumen de trabajo de redacción y para aislar el riesgo de la validación de integración Ducha-Tina en su propio lote, en vez de mezclarla con Mampara.

## AI. Dependencias entre lotes

```
Lote A (infraestructura) ──┬──> Lote B (Extractor)
                            ├──> Lote C (WC + Lavamanos)
                            ├──> Lote D (Ducha + Mampara)
                            ├──> Lote E (Tina) [recomendado después de D]
                            └──> Lote F (Mueble + Cubierta)
```

Solo el Lote A es prerrequisito real (ancla histórica + gate del legacy, sin los cuales ningún componente Nivel 2 nuevo puede activarse de forma segura). B, C, D, F no tienen dependencia técnica entre sí — podrían publicarse en cualquier orden después de A. E se recomienda después de D por validación de integración, no por dependencia técnica dura.

## AJ. QA por lote — matriz de configuraciones críticas

Mínimo por lote (sin exigir 2^12 combinaciones exhaustivas):

- Todo en No (mínimo, 8 checks) — 1 vez, al final del Lote A, reutilizado como baseline en todos los lotes siguientes.
- Cada componente especial individualmente en Sí, resto en No — 8 casos (uno por componente, repartidos en su lote correspondiente).
- Combinaciones sanitarias críticas: WC+Lavamanos (Lote C); Ducha+Mampara (Lote D); Ducha+Tina simultáneos, validando ausencia de duplicación de grifería (Lote E); Mueble+Cubierta simultáneos y por separado, validando los 6 escenarios de independencia (Lote F).
- Todo en Sí (máximo, 56 checks) — 1 vez, al cierre del Lote F.

## AK. Regresión obligatoria

- **Cocina**: en cada uno de los 6 lotes, verificar que Cocina conserve mínimo 7, máximo 33, sus 9 decisiones Nivel 2, Muebles/Cubierta/Lavaplatos/Campana intactos, históricos (3 Cocinas reales) sin cambios, edición funcional, PDF funcional — mismo estándar que cada -P de Cocina ya validó, repetido aquí porque Baño reutiliza la misma infraestructura (`saveSpaceLevel2ConfigAction`, `SPACE_LEVEL2_CONFIG`, `LEVEL2_GATED_LINKS`) y un error de whitelist podría romper Cocina sin tocar su código directamente.
- **Otros recintos**: smoke de Dormitorio (o el recinto base más relevante), Antejardín (Reja), Acceso vehicular (Portón) — confirmar que agregar `bano` a `SPACE_LEVEL2_CONFIG` no afecta otras entradas del mismo `Record`.

## AL. Shared DB safety

**Crítico, reconfirmado**: la BD Neon de desarrollo y producción es compartida — cualquier script `db-fixes` ejecutado "localmente" impacta producción de inmediato. Cada uno de los 6 lotes deberá, antes de ejecutar su script de catálogo: (1) probar inercia (crear un Baño con el código viejo desplegado y el catálogo nuevo ya en BD, confirmar que el componente nuevo NO aparece automáticamente); (2) demostrar que el script es aditivo/idempotente (`upsert`/`findFirst`+condicional, mismo patrón usado en los 5 scripts `db-fixes` de Cocina); (3) auditar impacto en casos reales antes de ejecutar (baseline de los 4 casos de Jorge); (4) mantener el commit de código separado de la ejecución del script de catálogo cuando el orden de riesgo lo justifique (mismo patrón ya usado en varias fases de Cocina).

## AM. Idempotencia

Cada script futuro de catálogo debe poder ejecutarse 1, 2 o N veces sin duplicar templates, checks, artículos ni links, y sin alterar históricos — mismo patrón `upsert`(template)/`findFirst`+condicional(checklist items, para preservar `id` estable) ya usado consistentemente en los 8 scripts `db-fixes` de Cocina (11AA-11AH). Cada lote debe incluir una prueba explícita de doble ejecución antes de considerarse listo para publicar.

## AN. Deudas transversales fuera de alcance (no se mezclan con Baño)

- **DT-01**: `defaultSeverity` no preselecciona la UI del formulario de observación. Preexistente, confirmada vigente en cada uno de los 8 cierres técnicos de Baño. No se corrige en ningún lote de contenido de Baño.
- **DT-02**: orders empatados/no deterministas de elementos base (`piso`/`muros`/`cielo`/`enchufes-interruptores`/`iluminacion`/`puerta` en cualquier recinto, incluido Baño). Preexistente desde Cocina 11AD. No se corrige en ningún lote de contenido de Baño.
- **DT-03** (Cocina): seed no reproduce completamente Ventana. Vigente, sin relación directa con Baño salvo que Baño también reutiliza `ventana` — el seed de Baño heredará el mismo problema si no se actualiza en el Lote A; se documenta como extensión de la misma deuda, no como una nueva.
- **DT-04**: referencias visuales, 0 imágenes cargadas globalmente. Vigente, Baño agrega su propio backlog (sección U) al mismo backlog pendiente.

Si se desea corregir cualquiera de estas 4, corresponde una fase transversal independiente futura, no mezclada con los lotes A-F de Baño.

## AO. Plan de publicación

Cada uno de los 6 lotes sigue el mismo ciclo ya validado 8 veces en Cocina, sin publicación automática: **implementación local → QA funcional local → regresión (tsc/eslint/vitest/build) → fase explícita de publicación (auditoría git, catálogo, inercia, baseline, staging, commit quirúrgico, push) → deploy Vercel → smoke test en producción → limpieza de QA → informe de cierre del lote**. Cada lote requiere su propia autorización explícita antes de publicarse — ninguno se publica automáticamente al terminar su implementación local, mismo criterio que cada fase `-P` de Cocina ya exigió.

## AP. Go / No-Go

| Criterio | Estado |
|---|---|
| Arquitectura única, sin contradicciones sin resolver | ✅ — la única contradicción real (aritmética de conteos) se resolvió en esta fase (sección Z) |
| Keys de los 8 componentes especiales confirmadas y libres | ✅ (sección M, reconfirmado por auditoría de esta fase) |
| Preguntas Nivel 2 exactas | ✅ (sección M) |
| Checks exactos, wording literal | ✅ (sección P) |
| Severidades justificadas | ✅ (sección S) |
| N/A definido con precisión | ✅ (sección T) |
| Fuentes clasificadas honestamente, sin inflar Manual | ✅ (sección R) |
| Guías completas de 7 encabezados para los 36 checks nuevos | ✅ (confirmado, ninguna incompleta) |
| Estrategia legacy definida sin ambigüedad | ✅ (sección F) |
| Conteos mínimo/máximo/intermedios cerrados | ✅ (secciones Z/AA, corregidos) |
| Lotes definidos con dependencias y QA | ✅ (secciones AH-AK) |
| Regresión de Cocina y otros recintos contemplada | ✅ (sección AK) |
| Shared DB safety y idempotencia contempladas | ✅ (secciones AL/AM) |

**Ningún criterio pendiente. GO confirmado para iniciar implementación del Lote A.**

## AQ. Estado final

Baño V1 queda consolidado canónicamente en un único documento ejecutable: 8 componentes especiales cerrados técnicamente (Extractor, WC, Lavamanos, Ducha, Mampara, Tina, Mueble, Cubierta) más 6 componentes base y 3 terminaciones y Ventana, todos reutilizados sin cambios de contenido; 12 decisiones Nivel 2 en 3 secciones; checklist maestro completo con wording literal reproducido de cada cierre; conteo mínimo **8** y máximo **56** (corrigiendo el error aritmético acumulativo detectado en los cierres 11AL-11AR, que había llegado a publicar 71 de forma incorrecta); 6 lotes de implementación definidos con dependencias, riesgo, QA y conteos esperados; regresión de Cocina y shared DB safety incorporadas al plan; deudas transversales (DT-01 a DT-04) explícitamente fuera de alcance.

## Resumen operativo

```
BAÑO V1 — ARQUITECTURA FINAL

Base (8 checks):
  Piso(2) · Muros(1) · Cielo(2) · Enchufes e interruptores(1) · Iluminación(1) · Puerta(1)

Nivel 2 (12 decisiones, 3 secciones, 48 checks en máximo):
  TERMINACIONES: Revest. cerámico piso(2) · Pintura muro(1) · Revest. cerámico muro(2)
  EQUIPAMIENTO DEL RECINTO: Ventana(7) · Extractor de aire(2)
  ARTEFACTOS SANITARIOS: WC/Inodoro(4) · Lavamanos(5) · Ducha(6) · Tina(7) · Mampara(5) · Mueble de baño(4) · Cubierta de baño(3)

Componentes reutilizados sin cambios (10):
  piso, muros, cielo, enchufes-interruptores, iluminacion, puerta,
  ventana, revestimiento-ceramico-piso, pintura-muro, revestimiento-ceramico-muro

Componentes nuevos (8):
  extractor-aire, wc, lavamanos, ducha, mampara, tina, mueble-bano, cubierta-bano

Legacy:
  artefactos-sanitarios — congelado para históricos, gateado (nunca generado en Baño V1 nuevo)

Mínimo:
  8 checks

Máximo:
  56 checks

Lotes:
  A. Infraestructura + Terminaciones + Ventana (gate legacy incluido)
  B. Extractor de aire
  C. WC + Lavamanos
  D. Ducha + Mampara
  E. Tina
  F. Mueble de baño + Cubierta de baño

Próxima fase:
  FASE 11AT — IMPLEMENTACIÓN LOCAL LOTE A DE BAÑO V1
```

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AS_CONSOLIDACION_CANONICA_BANO_V1.md`

Archivos modificados: ninguno.

Código = 0
Prisma = 0
BD = NO (solo lectura)
Catálogo = NO
Seed = NO
Commit = NO
Push = NO
Deploy = NO

Confirmado: solo se creó documentación de esta fase — ningún archivo de código, catálogo ni caso fue tocado.

FASE 11AS — BAÑO V1 CONSOLIDADO CANÓNICAMENTE
🟢 ARQUITECTURA FINAL CERRADA
🟢 CONTEOS MÍNIMO Y MÁXIMO CERRADOS
🟢 LOTES DE IMPLEMENTACIÓN DEFINIDOS
🟢 APTO PARA INICIAR IMPLEMENTACIÓN LOCAL DEL LOTE 1

DETENERSE. No implementar todavía. No modificar BD. No publicar.
