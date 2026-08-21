# FASE 19A — DT-04: REFERENCIAS VISUALES BIEN / MAL

## 1. Arquitectura real (investigación)

**Modelo** ([schema.prisma:1601-1636](prisma/schema.prisma)): `InspectionReferenceImage` ya existe completo — `checklistItemId` (FK directa al check del catálogo, no al elemento), `kind: GOOD | BAD` (enum), `url: String`, `alt: String` (obligatorio), `caption: String?` (opcional), `order: Int`. Sin `@@unique([checklistItemId, kind])` a propósito — permite más de una imagen por kind, aunque V1 usa exactamente 1+1. `onDelete: Cascade` desde `InspectionChecklistItem`.

**UI** ([checklist-item-row.tsx:282-296, 581-622](src/components/inspecciones/checklist-item-row.tsx)): ya implementada por completo desde una fase piloto anterior (Fase 11Q) que dejó la UI lista pero sin ninguna imagen real cargada. Botón "Ver ejemplos" (colapsado por defecto) → `ReferenceImagesBlock` → columnas "BIEN"/"MAL" (1 columna en mobile <640px, 2 en desktop, `sm:grid-cols-2`), cada imagen con `<img>` + `alt` + `caption` opcional como `<figcaption>`. Se oculta completo si `referenceImages.length === 0`.

**Hallazgo crítico de arquitectura**: el bloque de referencias solo se renderiza cuando `technicalArticle && hasGuide && (status === null || editingStatus)`, donde `hasGuide = Boolean(technicalArticle?.comoRevisarlo || technicalArticle?.senalesDeProblema)` (línea 123). Es decir: **una referencia visual solo es visible si el check tiene un `TechnicalArticle` vinculado con esas secciones parseadas** — no alcanza con crear la fila `InspectionReferenceImage`. Esto NO se cambia en esta fase (no es un bug, es el diseño ya aprobado en Fase 11L/11Q); se documenta como restricción real que determinó cuáles checks son elegibles.

**Storage**: no existía ningún mecanismo previo (Fase 11Q/11T dejaron los checks preparados pero explícitamente sin imágenes: *"NO crea InspectionReferenceImage — eso queda para una fase posterior"*). Sin precedente de convención de URL.

**PDF** ([inspecciones-report.ts](src/lib/inspecciones-report.ts)): no incluye `referenceImages` en ninguna query — confirmado por grep, 0 referencias al modelo.

**Riesgos identificados**: (1) crear imágenes para checks sin `technicalArticleSlug` sería trabajo desperdiciado (nunca se renderizarían); (2) cualquier defecto de accesibilidad (`alt` vago) ya está prevenido por el propio schema (`alt` obligatorio) pero no por el contenido que se le ponga.

**Implementación propuesta y adoptada**: usar el modelo/UI existentes sin ningún cambio de motor. Elegir solo checks con `technicalArticleSlug` (89 de 92 activos) y priorizar los de mayor valor visual dentro de ese universo. Assets como SVG originales versionados en `public/inspecciones/referencias/`, servidos como archivos estáticos de Next.js.

## 2. No se cambió el motor

Confirmado: 0 cambios en `schema.prisma`, 0 cambios en `checklist-item-row.tsx`/`element-checklist-group.tsx`/`[id]/page.tsx`, 0 nuevas rutas API, 0 nuevo storage (Blob). Los únicos archivos nuevos son: el script de catálogo, su archivo de datos, su test, y los 38 SVG en `public/`.

## 3. Seguridad BD — baseline (BASELINE_PRE_19A)

Lectura read-only sobre `main`: `InspectionCase=5`, `InspectionSpace=34`, `InspectionElement=144`, `InspectionChecklistCheck=260`, `InspectionReferenceImage=0`, catálogo `16/32/93/91/77` — idéntico al cierre de 18B. Backup `pre-15b-healthy-20260820` (`br-hidden-night-aciqyz9o`) confirmado `ready`, no tocado. No se ejecutó ningún reset/seed contra `main`.

## 4-7. Auditoría de los 92 checks activos y criterio de selección

Se auditaron los 92 `InspectionChecklistItem` activos (el ítem #93 es histórico/inactivo, excluido de generación desde Fase 11Q). Clasificación:

| Clasificación | Cantidad | Criterio |
|---|---|---|
| **A** — alto valor visual, implementado | **33** | Defecto principalmente visual, con `technicalArticleSlug`, diferencia GOOD/BAD clara y no engañosa |
| **B** — podría ayudar, no necesaria | 11 | Fugas/daños que en la práctica se detectan mejor durante el uso (agua corriendo) que en una foto estática; o el defecto que ilustran ya queda cubierto conceptualmente por otro par seleccionado (p. ej. "daños/sellos" de cubierta-meson vs. los pares `mueble-danos`/`sello-perimetral` ya elegidos) |
| **C** — no aporta (funcional/dinámico/táctil/sonido) | 45 | Apertura-cierre, accionamiento, encendido eléctrico, sonido/vibración, firmeza al tacto, fuga que requiere uso activo, existencia/no-existencia |
| **D** — engañosa o bloqueada por arquitectura | 3 | Fachada/Reja/Portón: sin `TechnicalArticle` vinculado (decisión honesta de Fase 11B, "sin fuente normativa") → `hasGuide=false` → la imagen nunca se renderizaría en la UI actual. Escribir un artículo nuevo para desbloquearlas excede el alcance de DT-04 (esta fase es solo de referencias visuales, no de contenido de biblioteca nuevo) |

**33 + 11 + 45 + 3 = 92.** No se persiguió ningún porcentaje — el resultado surgió de auditar cada pregunta individualmente contra el criterio de la sección 5 del diseño de la fase.

### Selección A implementada (33 checks → 19 pares únicos de assets, con reutilización legítima cuando el fenómeno visual es idéntico)

| Asset (par GOOD/BAD) | Checks que lo usan | Motivo |
|---|---|---|
| `piso-danos` | Piso: daños visibles | Daño físico directamente visible |
| `piso-desnivel` | Piso: desniveles | Diferencia de altura es visual |
| `muro-fisura` | Muros: fisuras | Grieta es visual |
| `cielo-grietas` | Cielo: manchas/grietas | Visual |
| `cielo-humedad` | Cielo: manchas de humedad | Visual, fenómeno distinto a grieta |
| `pintura-defecto` | Pintura de muro: defectos | Visual |
| `ceramica-quebrada` | Revestimiento cerámico (piso **y** muro): palmetas quebradas | Mismo fenómeno físico (cerámica trisada), reutilizado entre piso/muro |
| `ceramica-esmalte` | Revestimiento cerámico (piso **y** muro): defectos de esmalte | Ídem |
| `vidrio-danos` | Ventana: vidrio dañado; Mampara: vidrios/perfiles dañados | Mismo fenómeno (vidrio rayado/trizado) |
| `vidrio-condensacion` | Ventana: condensación entre vidrios (termopanel) | Visual, específico |
| `sello-perimetral` | Ventana (sello marco-muro), Lavaplatos, Lavamanos, Ducha, Tina, Mampara (sellos), Cubierta de baño, Lavadero — sello continuo/discontinuo | Fenómeno idéntico en los 8: un cordón de sello, continuo o cortado, sin importar el artefacto |
| `ventana-gap` | Ventana: separación hoja-marco | Fenómeno distinto al sello (holgura estructural, no sellante) |
| `marco-danos` | Ventana: marco dañado/deformado | Visual |
| `baranda-danos` | Baranda: daños visibles | Visual |
| `baranda-anclaje` | Baranda: anclaje | Visual |
| `mueble-danos` | Clóset, Muebles de cocina, Mueble de baño: daños visibles | Mismo fenómeno (panel de melamina/madera golpeado), misma familia de mobiliario |
| `loza-trizada` | WC, Tina: daños visibles en loza | Mismo fenómeno (loza/porcelana sanitaria trizada) |
| `mueble-humedad` | Clóset, Mueble de baño: humedad/deformación | Mismo fenómeno (tablero hinchado por humedad) |
| `pavimento-demarcacion` | Estacionamiento: demarcación | Visual, específico |

## 8. Reutilización — criterio aplicado

Reutilizado solo cuando el fenómeno físico es **literalmente el mismo** independiente del artefacto: un sello de silicona continuo/cortado se ve igual en una ventana, un lavaplatos o una tina (`sello-perimetral`, 8 checks); una palmeta cerámica trisada se ve igual en piso o muro (`ceramica-quebrada`/`ceramica-esmalte`); un panel de melamina golpeado se ve igual en un clóset o un mueble de baño (`mueble-danos`). Todos los assets reutilizados usan una ilustración deliberadamente neutra/genérica (sin contexto de recinto específico) para que la reutilización no induzca a confusión — ninguno muestra, por ejemplo, una cocina completa para ilustrar un defecto de dormitorio.

## 9. Estilo visual

Ilustraciones vectoriales SVG esquemáticas (no fotorrealistas — ver sección 18), estilo técnico consistente: mismo `viewBox="0 0 400 300"` en las 38, misma paleta tomada **directamente de `tailwind.config.ts`** (no una paleta nueva): fondo `concrete #F9F9F9`, borde `#E4DED4`, superficie neutra `#DAD3C4`, defectos en `danger #C4122F`, manchas en `caution #D9A21B`, acento de marco "GOOD" en `success-border #9CC0AE`. Sin personas, sin logos, sin marcas de agua, sin texto incrustado en el SVG (todo el texto vive en `alt`/`caption`, renderizado por la UI). Mismo encuadre/escala entre GOOD y BAD de cada par.

## 10. Originalidad / copyright

Las 38 ilustraciones son 100% originales, generadas por código (SVG) específicamente para este proyecto — no se copió ni adaptó ninguna imagen del Manual de Tolerancias CDT/CChC, catálogos comerciales, ni de internet. Cero riesgo de infracción de copyright.

## 11-12. Formato y almacenamiento

`public/inspecciones/referencias/<assetKey>-good.svg` / `-bad.svg` — assets estáticos versionados en el repositorio (no Vercel Blob, no CDN externo, no credenciales, no URLs temporales — exactamente la preferencia de la sección 11 del diseño, y no había ninguna arquitectura previa que obligara otra cosa). Formato SVG: vectorial, tamaño de archivo trivial. **38 archivos, ~23.6 KB en total, ~0.6 KB promedio por archivo** — órdenes de magnitud más liviano que cualquier fotografía, sin ningún riesgo de peso en mobile.

## 13. Pares GOOD/BAD coherentes

Los 19 pares enseñan exactamente el mismo criterio en ambos lados (mismo encuadre, mismo material, solo cambia la presencia/ausencia del defecto específico) — confirmado por QA de matriz (sección 26) y por inspección de una muestra representativa (sección 27).

## 14-15. Texto de apoyo y accesibilidad

`caption` usado en los 33 checks con texto corto y específico (ej. "Sello cortado o discontinuo.", no el artículo completo). `alt` siempre descriptivo y específico (ej. "Ejemplo de sello continuo, sin separaciones visibles."), nunca genérico tipo "imagen buena/mala" — verificado automáticamente por test (`fase19a-referencias-visuales-v1.test.ts`, caso "no alt text uses the vague wording").

## 16. Prudencia BIEN/MAL

Ningún texto de `alt`/`caption` afirma un diagnóstico ("está malo"); todos describen la observación visual concreta ("sello cortado", "palmeta quebrada"), consistente con el lenguaje ya establecido en el resto del checklist.

## 20. Script único de catálogo

[`prisma/db-fixes/fase19a-referencias-visuales-v1.ts`](prisma/db-fixes/fase19a-referencias-visuales-v1.ts) (+ su archivo de datos `*-data.ts`, separado para poder testear la matriz sin ejecutar `main()`). Idempotente vía `findFirst({checklistItemId, kind})` + update/create. **Ejecutado 2 veces contra `main`** (igual que todo script previo de `prisma/db-fixes/`, no requiere aislamiento como sí lo requirió el seed completo de DT-03): ambas corridas terminan con el mismo log, 0 duplicados confirmados. No toca `InspectionCase`/`Space`/`Element`/`Check`/`Observation`.

## 21. Históricos

No se modificó `questionSnapshot`, severidades, respuestas, elementos ni `config` de ningún caso existente. Las referencias son contenido de catálogo puro (llave `checklistItemId`) — un check histórico que reutiliza el mismo `InspectionChecklistItem` activo mostrará la misma ayuda visual que uno nuevo, lo cual es el comportamiento correcto y ya documentado (igual criterio que `TechnicalArticle`, que también es compartido entre casos históricos y nuevos sin que eso altere ningún dato ya persistido).

## 22. UI

No se tocó ningún componente de UI — el mecanismo ya mostraba correctamente GOOD/BAD (columnas separadas, colapsado por defecto) desde el piloto de Fase 11Q. Confirmado en QA funcional (sección 28).

## 23-24. Mobile y performance

Confirmado en 375×812: imagen completa, sin overflow horizontal (`scrollWidth === clientWidth`), 1 columna (breakpoint `sm:` ya existente), imágenes dentro del viewport. Las imágenes solo se piden a red cuando el usuario expande "Ver ejemplos" (render condicional ya existente — no se cargan todas simultáneamente, sin necesidad de lazy-loading adicional). Peso trivial (SVG, <1KB c/u) — no hay escenario de carga masiva real que optimizar.

## 25. PDF

**REFERENCIAS EN PDF = NO.** Razón: el PDF de inspección ya prioriza resultado/hallazgos (Fase 9-10); agregar imágenes educativas lo convertiría en un manual ilustrado, contrario al diseño aprobado. Confirmado que el PDF sigue generándose sin cambios de tamaño ni contenido tras esta fase (mismo tamaño de bytes en el caso de control, sin referencia a `InspectionReferenceImage` en la query).

## 26. QA de matriz (automatizado)

Script ad-hoc post-ejecución (temporal, eliminado al cierre): `InspectionReferenceImage` total = 66 (33×2). **0 duplicados** (mismo `checklistItemId`+`kind`). **33/33 checks con par GOOD/BAD completo** (ni uno con GOOD sin BAD o viceversa). **0 paths rotos** (los 66 `url` resuelven a un archivo real en `public/`).

## 27. QA visual representativo

Validación programática de las 38 imágenes (bien formadas, `naturalWidth > 0` al cargar en navegador real) + inspección de una muestra cubriendo: superficie (`piso-danos`), humedad (`cielo-humedad`, `mueble-humedad`), sello (`sello-perimetral`), ventana (`vidrio-danos`, `ventana-gap`), elemento exterior (`pavimento-demarcacion`), baranda (`baranda-danos`, `baranda-anclaje`), sanitario (`loza-trizada`). Confirmado en cada caso que GOOD/BAD corresponden al fenómeno descrito en su `alt`/`caption` (más elementos visuales — trazos, manchas — presentes en BAD que en GOOD).

## 28-30. QA funcional (caso real, local, usuario `qa-19a@obrabien.local`)

Caso "QA 19A Casa" (Cocina + Terraza, con Baranda activada vía Nivel 2). Confirmado en navegador real:
- **Componente base** (Cocina → Revestimiento cerámico de piso): "Ver ejemplos" visible solo en los checks con referencia, ausente correctamente en Enchufes/Iluminación (sin referencia). Imágenes GOOD/BAD cargan (`naturalWidth > 0`), `alt` correcto.
- **Componente Nivel 2** (Terraza → Baranda, activada tras responder "Sí" en la configuración del espacio): referencias `baranda-danos` y `baranda-anclaje` aparecen correctamente tras generar el componente; `baranda-firmeza` (sin referencia, check táctil) correctamente sin "Ver ejemplos".
- **Checklist → ayuda → referencia → volver → evaluar**: flujo completo probado — se marcó "Tiene un problema" en un check CON referencia visible (palmetas quebradas), el formulario de observación se abrió normalmente junto a las imágenes, severidad por defecto (Media, ya que este check no declara `defaultSeverity`) correcta, hallazgo guardado y persistido (confirmado tras recarga de página: 2/9 revisados, comentario "QA 19A: palmeta trisada" visible).

## 29. Observaciones / N/A

Confirmado sin regresión: marcar "Está bien" (Iluminación, sin referencia), "Tiene un problema" con comentario y severidad (Revestimiento cerámico, con referencia visible simultáneamente) — ambos flujos funcionan idénticos a antes de esta fase. Las referencias no interfieren con el formulario de observación ni con los botones de estado.

## 31. Smoke DT-01/DT-02/PDF (breve, no reabre las fases previas)

Creación de caso: PASS (redirect correcto, espacios/elementos/checks correctos). PDF: `GET /pdf/detallado` → 200, `application/pdf`, sin cambio de comportamiento. No se repitió la matriz completa de 18A/18B — no hubo ninguna señal de regresión.

## 32. Tests

[`prisma/db-fixes/fase19a-referencias-visuales-v1.test.ts`](prisma/db-fixes/fase19a-referencias-visuales-v1.test.ts) — 6 casos sin BD real, contra la matriz de datos (`ROWS`) y el filesystem:
- Sin `(elementKey, question)` duplicado en `ROWS`.
- Todo row declara `alt`/`caption` GOOD y BAD no vacíos (par completo).
- Ningún `alt` usa la redacción vaga prohibida ("imagen buena/mala").
- Todo asset referenciado existe en disco y no está vacío.
- Todo asset es SVG bien formado (abre/cierra correctamente, tags balanceados).
- 0 assets huérfanos en disco (todo archivo generado está referenciado por al menos un row).

`npx vitest run` → **109/109 PASS** (103 previos + 6 nuevos).

## 33. Verificación técnica

`npx tsc --noEmit` → PASS. `npx eslint .` → PASS. `npx vitest run` → 109/109 PASS. `npx next build` → PASS (29 rutas).

## 34. Integridad BD

Único cambio real respecto a `BASELINE_PRE_19A`: `InspectionReferenceImage` 0 → 66. Todo lo demás (`InspectionCase/Space/Element/Check`, catálogo) permanece exactamente igual — confirmado antes y después de la fase, incluida la limpieza QA.

## 35. Limpieza

Usuario `qa-19a@obrabien.local` y caso "QA 19A Casa" eliminados en cascada (foto-blobs best-effort + `InspectionCase.delete`). Todos los scripts temporales (`prisma/db-fixes/_tmp_19a_*.ts`) eliminados. Ningún asset descartado — los 38 SVG generados son exactamente los 38 finales usados por el catálogo (confirmado por el test de "0 huérfanos").

## 36. Matriz final DT-04

```
CHECKS TOTALES AUDITADOS = 92 (activos)

CLASIFICACIÓN:
A — alto valor visual        = 33
B — opcional/poco valor      = 11
C — no aporta (funcional)    = 45
D — bloqueada por arquitectura = 3 (fachada/reja/porton, sin TechnicalArticle)

IMPLEMENTADOS = 33 checks

GOOD images = 33
BAD images  = 33
TOTAL ASSETS = 66 filas InspectionReferenceImage (38 archivos SVG, 19 pares)
```

## 37. Exclusiones explicadas (ejemplos representativos)

- **"¿La iluminación del recinto enciende correctamente...?"** → C: funcional/eléctrico, una foto estática no aporta sobre si enciende.
- **"¿La grifería abre y cierra correctamente, sin quedar goteando?"** (todas las variantes: lavaplatos, lavamanos, ducha) → C: dinámico, requiere accionar la llave.
- **"Al funcionar, ¿presenta vibraciones, golpes o ruidos...?"** (campana, extractor) → C: sonido, no representable visualmente.
- **"¿La baranda se ve firme, sin bamboleo al empujarla?"** → C: principalmente táctil/dinámico (empujar y sentir movimiento), una imagen estática no comunica firmeza.
- **Fachada/Reja/Portón** → D: arquitectónicamente bloqueadas (sin `TechnicalArticle` → `hasGuide=false` → la UI nunca renderizaría la imagen); escribir el artículo excede el alcance de DT-04.
- **"Al dejar correr agua, ¿se observa alguna fuga...?"** (lavaplatos/lavamanos/lavadero/conexión lavadora) → B: en la práctica se detecta mejor observando durante el uso que con una foto fija; se dejó fuera para mantener el conjunto compacto y de alto valor real.

Cero imágenes "decorativas" — cada exclusión tiene una razón concreta, no fue omisión.

## 38. Documento

Este documento (`docs/FASE19A_DT04_REFERENCIAS_VISUALES_V1.md`) consolida arquitectura, auditoría, criterios, implementación, QA e integridad.

## 39. Estado final de deudas

DT-01 = 🟢 CERRADA · DT-02 = 🟢 CERRADA · DT-03 = 🟢 CERRADA · **DT-04 = 🟢 CERRADA**

No hay limitación técnica que impida el cierre — las 3 exclusiones D tienen razón arquitectónica documentada (no una limitación de esta fase), y todas las demás exclusiones (B/C) son decisiones de calidad, no de capacidad.

## 40. Reporte final

```
FASE 19A — DT-04 REFERENCIAS VISUALES

Checks auditados = 92
Checks seleccionados = 33
Checks con par GOOD/BAD = 33/33

Assets GOOD = 33
Assets BAD = 33
Total assets = 66 filas (38 archivos SVG, 19 pares únicos)

Storage = public/inspecciones/referencias/*.svg (estático, versionado en el repo)
Peso total aproximado = ~23.6 KB (38 archivos, ~0.6 KB promedio)

Catálogo:
InspectionReferenceImage antes = 0
después = 66
duplicados = 0

QA:
asociaciones = PASS
archivos = PASS
visual sample = PASS
base component = PASS
Level2 component = PASS
observación = PASS
N/A = PASS
mobile = PASS
performance = PASS
PDF = PASS

REGRESIÓN:
creación = PASS
DT-01 = PASS
DT-02 = PASS
DT-03 = PASS

BD:
integridad = PASS
QA eliminado = PASS

TÉCNICO:
tsc = PASS
eslint = PASS
vitest = 109/109 PASS
build = PASS

Bugs encontrados = 0
Bugs corregidos = 0 (n/a)
Bugs abiertos = 0

DT-04 = CERRADA
GO PUBLICACIÓN = SÍ
```

## 41-42. Cierre

FASE 19A — DT-04 REFERENCIAS VISUALES IMPLEMENTADAS Y QA APROBADO
🟢 100% DE CHECKS AUDITADOS
🟢 REFERENCIAS APLICADAS SOLO DONDE APORTAN VALOR
🟢 PARES BIEN / MAL COMPLETOS
🟢 ASSETS ORIGINALES Y VERSIONADOS
🟢 CATÁLOGO DE REFERENCIAS OPERATIVO
🟢 UI Y MOBILE APROBADOS
🟢 PERFORMANCE VERIFICADA
🟢 OBSERVACIONES / N/A SIN REGRESIÓN
🟢 INTEGRIDAD DE BD VERIFICADA
🟢 TESTS / TSC / ESLINT / BUILD APROBADOS

DT-01 = 🟢
DT-02 = 🟢
DT-03 = 🟢
DT-04 = 🟢

GO PARA PUBLICACIÓN = SÍ

DETENERSE.

NO COMMIT.
NO PUSH.
NO DEPLOY.

La siguiente y única fase será:

FASE 19B — PUBLICAR Y CERRAR DT-04
