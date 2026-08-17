# FASE 11P — Piloto Ventana: investigación y diseño de revisiones específicas

Fecha: 2026-08-16
Estado: **investigación y diseño puro, sin implementación**. Cero código, cero Prisma, cero migraciones, cero catálogo, cero `TechnicalArticle`, cero `InspectionReferenceImage`, cero BD, cero commit/push/deploy.

## A. Estado actual

Auditado contra la BD real (no contra lo documentado en fases previas):

- `InspectionElementTemplate` de Ventana: `key: "ventana"`, `label: "Ventana"`, `materialVariantOf: null`, `active: true`.
- **1 solo** `InspectionChecklistItem` activo: `"¿Opera correctamente?"`, `technicalArticleSlug: "ventana-como-revisar-funcionamiento"`.
- Vinculada a **8 `InspectionSpaceTemplate`**: Cocina, Living, Dormitorio, Comedor, Living-comedor, Terraza/Logia, Terraza cerrada, Recinto ampliado — confirma lo dicho en Fase 11M (Ventana aparece en más contextos que ningún otro componente).
- **Cero** filas en `InspectionReferenceImage` (tabla vacía, creada en Fase 11O).
- **Cero** otros `InspectionElementTemplate` relacionados con Ventana — ningún sibling de variante existe hoy (`materialVariantOf` nunca se usó en producción).

Contenido completo actual de `ventana-como-revisar-funcionamiento` (transcrito íntegro, no resumido):

> **Qué revisar**: Si la ventana abre, cierra y traba correctamente, y si sus manillas/mecanismos funcionan sin forzar.
> **Cómo revisarlo**: Abre y cierra la ventana completa varias veces, probando también la traba. Prueba la manilla por separado, sintiendo si se mueve suave o con resistencia. Con la ventana cerrada, mira los bordes con buena luz buscando si se ve luz del día pasando entre el marco y la hoja.
> **Qué debería observarse**: La ventana abre, cierra y traba sin dificultad; la manilla se mueve suave; no debería verse luz del día con la ventana cerrada; paralelismo hoja/marco dentro de ~±2 mm.
> **Qué señales pueden indicar un problema**: se traba/cuesta abrir-cerrar; manilla dura; se ve luz del día; paralelismo claramente disparejo.
> **Por qué importa**: filtraciones de agua/aire futuras.
> **Recomendación**: probar apertura/cierre y manilla por separado, mirar bordes con luz.
> **Fuente**: Manual de Tolerancias CDT (Ficha 13, Ventanas) — paralelismo ±2 mm, sin luz visible con ventana cerrada · catálogo educativo ITO (265 puntos), elemento Ventanas — apertura/cierre/manilla · biblioteca técnica ITO sobre silicona perimetral — prueba visual de luz con ventana cerrada.

**Hallazgo clave**: el artículo actual YA mezcla, en una sola pregunta, 3 revisiones conceptualmente distintas con fuente propia identificable: (1) apertura y cierre del mecanismo, (2) manilla/herrajes, (3) sello hoja-marco (la prueba de luz). Esto confirma directamente la hipótesis de Fase 11M — el contenido para separar en 3 revisiones específicas **ya existe**, solo está comprimido en 1 sola pregunta.

## B. Problema

Ver Fase 11M, sección B — reafirmado: "Ventana — ¿Opera correctamente?" fuerza una sola respuesta para 3 hechos independientes. Un sello roto con vidrio perfecto y manilla perfecta hoy solo puede registrarse como "tiene un problema" genérico, perdiendo cuál de los 3 falló.

## C. Fuentes revisadas

Siguiendo estrictamente la prioridad pedida (1. ITO ya verificadas, 2. Manual de Tolerancias CDT ya utilizado, 3. documentos técnicos oficiales/fabricantes reconocidos, 4. otras fuentes confiables solo si es necesario), y **excluyendo explícitamente** blogs, SEO, foros, Reddit, respuestas de IA y analogías sin respaldo:

| # | Fuente | Tipo | Acceso en esta sesión |
|---|---|---|---|
| 1 | Manual de Tolerancias CDT, Ficha 13 (Ventanas) | Manual técnico ya usado en el proyecto | Ya citado en el artículo existente (paralelismo ±2 mm, sin luz visible). Intento de acceso directo a `tolerancias.cdtchile.net/ventanas/` **falló repetidamente por error de resolución DNS** en este entorno — no se pudo leer el texto completo de la ficha en esta sesión. Se confirmó vía snippets de búsqueda que la ficha cubre además hermeticidad vidrio-marco con método de medición por instrumento graduado, sin obtener los valores numéricos exactos de esa parte. |
| 2 | Catálogo educativo ITO (265 puntos), elemento Ventanas | Fuente interna ya usada en el proyecto (Fases 5B–11K) | No re-verificable vía web (no está indexado públicamente) — se trata como fuente interna ya aprobada en fases anteriores, limitada a lo ya extraído (apertura/cierre/manilla). No se extendió su alcance sin evidencia nueva. |
| 3 | Biblioteca técnica ITO sobre silicona perimetral | Fuente interna ya usada | Igual que el punto 2 — ya cubre la prueba de luz hoja-marco, no se extendió más allá de eso. |
| 4 | NCh 2496 (Instalación de Ventanas en Obra) | Norma chilena oficial | Confirmada su existencia y contenido relevante vía búsqueda (fragmento, no el texto completo de la norma): exige sello perimetral continuo (espuma de poliuretano + sellador de silicona neutra + sello elastomérico) entre marco de ventana y muro, "de forma continua, sin interrupciones ni cortes en las esquinas". **No se leyó el texto completo de la norma** — se recomienda verificación directa del documento antes de publicar (ver sección O). |
| 5 | NCh 888 (Estanqueidad al agua), NCh 892 (Permeabilidad al aire) | Normas chilenas oficiales | Confirmada su existencia vía búsqueda; no se accedió a su contenido técnico detallado en esta sesión — no se usaron para ninguna revisión candidata. |
| 6 | Manual de Tolerancias — Cristalería Reina (vidrio, normas EN-572-8/EN-12150/EN-1279/EN-1096) | Documento técnico de fabricante reconocido | **Accedido y leído completo** vía WebFetch. Contiene distancias de observación (2–3 m), criterios de defectos por tipo de vidrio (float, templado, laminado, termopanel, espejo) con umbrales en mm — pero los umbrales varían significativamente por tipo de vidrio, y es un estándar de control de calidad de fábrica, no una guía de inspección de campo para un vidrio ya instalado. |
| 7 | Portal CDT — "Norma Actualizada: Ventanas de Aluminio, PVC y Vidrio" | Contenido afiliado a CDT | Intento de acceso falló (certificado expirado). No se pudo leer. |
| 8 | Manual de Mantención de Ventanas — Glasstech | Manual técnico de fabricante | Intento de acceso falló (503 Service Unavailable). No se pudo leer. |

**Limitación honesta de esta sesión**: el acceso a internet funcionó en general (confirmado con `google.com`), pero los dominios de CDT (`tolerancias.cdtchile.net`, `cdt.cl`) fallaron de forma consistente por error de DNS/conexión, y 2 fuentes adicionales de fabricantes fallaron por certificado expirado o servidor caído. Esto **no invalida** las fuentes ya citadas y aprobadas en fases anteriores (que se mantienen como base sólida para 3 de las revisiones candidatas), pero sí limita cuánto se pudo *extender* la investigación más allá de lo ya establecido. Se documenta explícitamente en vez de rellenar con contenido no verificado.

## D. Revisiones candidatas

Partiendo de la hipótesis del prompt (sección 2), evaluada revisión por revisión:

1. Vidrio
2. Apertura y cierre
3. Cierre / pestillo / manilla
4. Sellos hoja-marco
5. Sellos vidrio-marco
6. Marco
7. Terminaciones

**Ajuste sobre la hipótesis**: "Cierre / pestillo / manilla" y "Apertura y cierre" se investigaron por separado pero **comparten la misma fuente y el mismo tipo de revisión** (funcional/táctil, sin criterio visual distinto) — el artículo actual ya las trata como 2 aspectos de una misma prueba física (abrir/cerrar + probar la manilla aparte). Se mantienen como 2 revisiones separadas (permiten hallazgos independientes: una ventana puede abrir/cerrar bien con manilla dura, o viceversa) pero con el mismo nivel de fuente. "Sellos vidrio-marco" (el sello que fija el vidrio dentro de la hoja, distinto del sello hoja-marco y del sello marco-muro) **no encontró fuente propia diferenciada** en esta investigación — se descarta como revisión separada por ahora (ver sección O).

## E. Clasificación

| Revisión | Clasificación | Motivo |
|---|---|---|
| Apertura y cierre | 🟢 | Fuente suficiente, ya usada y aprobada (CDT Ficha 13 + ITO 265 puntos), separable del resto sin perder nada. |
| Manilla / pestillo / herrajes | 🟢 | Misma fuente que arriba, ya separable en el artículo actual. |
| Sello hoja-marco (luz visible al cerrar) | 🟢 | Fuente ya usada y aprobada (CDT Ficha 13 + biblioteca ITO sobre silicona perimetral), criterio ya validado en producción. |
| Vidrio (rayas/trizaduras) | 🟡 | Respaldo técnico real (Cristalería Reina, normas EN) pero los umbrales varían por tipo de vidrio no identificable por un usuario común — falta una decisión de simplificación antes de convertirlo en revisión guiada. |
| Sellos perimetrales (marco-muro) | 🟡 | Norma oficial (NCh 2496) confirma el requisito y da un criterio de campo simple y claro ("continuo, sin interrupciones, especialmente en esquinas"), pero no se leyó el texto completo de la norma en esta sesión — falta esa verificación final antes de publicar. |
| Marco (estado físico) | 🔴 | Sin fuente con criterio de aceptación encontrada; además depende fuertemente del material (aluminio/PVC/madera) — requeriría variante, no solo contenido. |
| Terminaciones | 🔴 | Concepto demasiado vago, sin fuente propia distinguible de Marco/Vidrio — no se identificó qué evaluaría que las otras revisiones no cubran ya. |

## F. Revisiones aprobables (lote inmediato)

**3 revisiones 🟢, listas para implementar sin investigación adicional**: Apertura y cierre, Manilla/pestillo/herrajes, Sello hoja-marco.

Las 2 revisiones 🟡 (Vidrio, Sellos perimetrales) quedan documentadas con su contenido conceptual completo (secciones G/H) para acelerar una futura fase, pero **no se recomiendan para el primer lote** — cada una necesita 1 paso de verificación adicional concreto (ver sección O), no una investigación desde cero.

## G. Contenido guiado por revisión (las 3 aprobadas)

### G.1 — Apertura y cierre

- **A. Nombre corto**: Apertura y cierre
- **B. Pregunta al usuario**: ¿La ventana abre y cierra correctamente?
- **C. Qué revisar**: Si el mecanismo de apertura/cierre y la traba funcionan sin dificultad ni resistencia excesiva.
- **D. Cómo revisarlo**: Abre y cierra la ventana completa varias veces, probando también la traba, en toda su carrera de movimiento.
- **E. Qué debería verse**: Abre y cierra sin dificultad, sin necesidad de forzarla; la traba engancha sin resistencia.
- **F. Qué puede ser señal de un problema**: Se traba, cuesta abrir/cerrar, o la traba no engancha bien.
- **G. Por qué importa**: Un mecanismo forzado se desgasta más rápido y puede indicar que la ventana quedó mal instalada o se desalineó.
- **H. Recomendación**: Si cuesta, no forzar — registrar como observación con detalle de en qué punto de la carrera se traba.
- **I. Fuente**: Manual de Tolerancias CDT (Ficha 13, Ventanas); catálogo educativo ITO (265 puntos), elemento Ventanas.
- **J. Tipo de fuente**: Manual técnico ya usado en el proyecto + fuente interna ya aprobada.
- **K. defaultSeverity sugerida**: Sin fundamento suficiente para fijar una por defecto — se deja sin definir (`null`), igual que el resto del catálogo actual.
- **L. ¿Admite referencia visual BIEN/MAL?**: No.
- **M. ¿La imagen aportaría valor real?**: No — es una prueba de movimiento/resistencia, no algo que se vea en una foto estática. Una imagen sería decorativa.

### G.2 — Manilla / pestillo / herrajes

- **A. Nombre corto**: Manilla y herrajes
- **B. Pregunta al usuario**: ¿La manilla y los herrajes funcionan bien?
- **C. Qué revisar**: Si la manilla y los herrajes de la ventana se mueven sin resistencia excesiva ni holgura.
- **D. Cómo revisarlo**: Mueve la manilla por separado (sin abrir la ventana), sintiendo si está firme y se mueve suave.
- **E. Qué debería verse**: Se mueve suave, sin resistencia excesiva ni holgura.
- **F. Qué puede ser señal de un problema**: Manilla floja, dura, o herrajes oxidados/sueltos.
- **G. Por qué importa**: Una manilla dura o floja suele ser el primer síntoma de un ajuste que empeora con el uso.
- **H. Recomendación**: Registrar como observación indicando si está dura, floja, o suena al moverse.
- **I. Fuente**: Manual de Tolerancias CDT (Ficha 13, Ventanas); catálogo educativo ITO (265 puntos), elemento Ventanas.
- **J. Tipo de fuente**: Igual a G.1.
- **K. defaultSeverity sugerida**: Sin fundamento — `null`.
- **L. ¿Admite referencia visual BIEN/MAL?**: No.
- **M. ¿La imagen aportaría valor real?**: No — es una prueba táctil/de resistencia, no visual. Sería decorativa.

### G.3 — Sello hoja-marco

- **A. Nombre corto**: Sello hoja-marco
- **B. Pregunta al usuario**: Con la ventana cerrada, ¿el sello entre la hoja y el marco es continuo?
- **C. Qué revisar**: Si existe continuidad del sello perimetral entre la hoja móvil y el marco fijo cuando la ventana está cerrada.
- **D. Cómo revisarlo**: Con la ventana cerrada, mira los bordes con buena luz (natural o linterna), buscando si se ve luz del día pasando entre el marco y la hoja.
- **E. Qué debería verse**: No debería verse luz del día pasando entre el marco y la hoja con la ventana cerrada.
- **F. Qué puede ser señal de un problema**: Se ve luz del día o se siente corriente de aire con la ventana cerrada.
- **G. Por qué importa**: Un sello discontinuo es una de las causas más comunes de filtraciones de agua o aire con el tiempo — detectarlo ahora es mucho más simple que después de vivir en el lugar.
- **H. Recomendación**: Revisar con la ventana cerrada, en un día con buena luz. Si hay dudas, repetir de noche con una luz encendida adentro y mirando desde afuera.
- **I. Fuente**: Manual de Tolerancias CDT (Ficha 13, Ventanas); biblioteca técnica ITO sobre silicona perimetral.
- **J. Tipo de fuente**: Manual técnico ya usado + fuente interna ya aprobada.
- **K. defaultSeverity sugerida**: Sin fundamento — `null`.
- **L. ¿Admite referencia visual BIEN/MAL?**: **Sí.**
- **M. ¿La imagen aportaría valor real?**: Sí — es exactamente el tipo de defecto que se reconoce por comparación visual directa (continuidad vs. separación), alto valor educativo real, no decorativo.

En los 3 casos se mantiene estrictamente la lógica pedida: **observación → posible señal → recomendación**, nunca "observación → diagnóstico automático". Ningún texto afirma la causa exacta de un defecto — todos usan lenguaje como "puede indicar", "conviene registrarlo", nunca "esto significa que la ventana está mal instalada".

## H. Referencias visuales (contenido conceptual, sin URLs)

Solo se diseña contenido BIEN/MAL para **Sello hoja-marco** (la única de las 3 aprobadas con valor visual real). Vidrio y Sellos perimetrales quedan con su hipótesis de valor visual documentada (ambas "ALTO VALOR" por el mismo motivo — comparación visual directa) para cuando se resuelva su verificación pendiente (sección F), sin contenido BIEN/MAL todavía por no estar aprobadas.

### Sello hoja-marco

**GOOD**
- Alt: "Ventana con sello continuo entre hoja y marco."
- Caption: "Sello continuo, sin separación visible."
- Qué debe mostrar físicamente la fotografía: primer plano de una esquina de la ventana cerrada, con buena luz, mostrando el borde entre hoja y marco completamente continuo, sin ninguna línea de luz visible entre ambos.

**BAD**
- Alt: "Ventana con separación visible entre hoja y marco."
- Caption: "Separación visible en una esquina."
- Qué debe mostrar físicamente la fotografía: primer plano de una esquina donde se vea claramente una línea de luz o una discontinuidad entre la hoja y el marco — idealmente con la luz exterior pasando a través, para que la separación sea inequívoca incluso para alguien sin experiencia.

No se generó ninguna imagen. No se buscó ninguna imagen para rellenar. No se insertó ninguna URL.

## I. Variantes

Investigado si las 3 revisiones aprobadas cambian según aluminio/PVC/madera, corredera/abatible/proyectante, o termopanel/vidrio simple:

- **Apertura y cierre**: el MECANISMO físico sí difiere sustancialmente entre corredera (riel + rodillos) y abatible/proyectante (bisagras/brazos) — en rigor, una guía perfectamente específica describiría cada mecanismo por separado. Sin embargo, el criterio actual ya en producción ("abre y cierra sin dificultad, sin forzar; traba sin forzar") es deliberadamente agnóstico al mecanismo y ya funciona así hace varias fases sin quejas ni ambigüedad reportada. **Decisión**: no crear variante para esta revisión en el piloto — mismo criterio de Fase 11M ("Piso ya funciona bien sin variantes, evitar tocar algo que funciona") aplicado acá. Se documenta como decisión consciente, no como omisión.
- **Manilla/herrajes**: el mecanismo de traba difiere levemente por tipo de apertura, pero el criterio "se mueve suave, sin resistencia ni holgura" es igual de válido en cualquier caso. No requiere variante.
- **Sello hoja-marco**: la superficie de sellado difiere entre corredera (solape en riel) y abatible (compresión perimetral de la hoja contra el marco), pero la prueba de "luz visible con la ventana cerrada" sigue siendo válida y comprensible en ambos casos. No requiere variante para el piloto.

**Conclusión**: ninguna de las 3 revisiones aprobadas necesita variante — el piloto puede implementarse sobre el `InspectionElementTemplate` "ventana" genérico existente, sin tocar `materialVariantOf`. Confirma la hipótesis de Fase 11M en la dirección conservadora: no crear variantes "porque existen distintos tipos de ventana", solo cuando el criterio realmente cambia.

**Marco** (🔴, no aprobada) es la única revisión candidata donde la investigación SÍ confirma que el criterio cambia radicalmente por material (aluminio: corrosión/oxidación; madera: hongos/humedad/pudrición; PVC: decoloración/fragilización UV, deformación térmica) — validando la hipótesis de Fase 11M de que Marco requeriría variante. Como Marco tampoco tiene fuente (🔴), esta fase no necesita resolver el mecanismo de variante todavía.

## J. materialVariantOf

Revisado el campo existente en `InspectionElementTemplate.materialVariantOf: String?` — es una referencia libre (no FK) al `key` de un elemento "padre", pensada para agrupar filas de catálogo que representan variantes del mismo componente.

**Ejemplo conceptual (sin escribir registros)**, si en una fase futura se implementara Marco con variante:

```
ventana-marco-aluminio   (materialVariantOf = "ventana-marco")
  → "¿El marco presenta corrosión o deformación?" (criterio aluminio)
ventana-marco-pvc        (materialVariantOf = "ventana-marco")
  → "¿El marco presenta decoloración o deformación?" (criterio PVC)
ventana-marco-madera     (materialVariantOf = "ventana-marco")
  → "¿El marco presenta hongos, humedad o pudrición?" (criterio madera)
```

**Limitación real encontrada, documentada tal como pidió la fase**: `materialVariantOf` opera a nivel de **todo el `InspectionElementTemplate`** ("Ventana" completa), no a nivel de una sola revisión dentro de ella. Si solo 1 de 6-7 revisiones de Ventana necesitara variante (como es el caso real de Marco), el mecanismo actual obligaría a crear 3 filas completas de "ventana-aluminio"/"ventana-pvc"/"ventana-madera", cada una **duplicando** las 5-6 revisiones universales (vidrio, apertura/cierre, manilla, sello hoja-marco, sellos perimetrales) que en realidad no cambian por material — un desperdicio real de filas de catálogo, ya anticipado como riesgo en Fase 11M sección Z ("Duplicación de InspectionChecklistItem entre variantes").

**No se propone ningún cambio de schema en esta fase** (prohibido explícitamente). Se documenta la limitación para que una fase futura que sí necesite implementar Marco evalúe conscientemente el costo de duplicación antes de proceder, en vez de descubrirlo a mitad de implementación.

## K. Integración Fase 11L

Diseño de cómo se vería Ventana con las 3 revisiones aprobadas usando el componente `ChecklistItemRow` ya publicado, sin ninguna arquitectura visual nueva:

```
VENTANA
0 / 3

¿La ventana abre y cierra correctamente?
Revisa: Si el mecanismo de apertura/cierre y la traba funcionan sin
dificultad ni resistencia excesiva.
Ver cómo revisarlo
🟢 Está bien   🔴 Tiene un problema   🟠 No corresponde

¿La manilla y los herrajes funcionan bien?
Revisa: Si la manilla y los herrajes de la ventana se mueven sin
resistencia excesiva ni holgura.
Ver cómo revisarlo
🟢 Está bien   🔴 Tiene un problema   🟠 No corresponde

Con la ventana cerrada, ¿el sello entre la hoja y el marco es continuo?
Revisa: Si existe continuidad del sello perimetral entre la hoja móvil
y el marco fijo cuando la ventana está cerrada.
[ Ver ejemplos: BIEN / MAL ]
Ver cómo revisarlo
🟢 Está bien   🔴 Tiene un problema   🟠 No corresponde
```

Cada una sigue siendo exactamente 1 `InspectionChecklistItem` → 1 `ChecklistItemRow`, mismo componente, misma guía breve (`deriveGuiaBreve`), mismo expandible "Ver cómo revisarlo", mismos 3 botones de estado con los colores ya publicados en Fase 11L. El progreso de "Ventana" pasa de `1/1` a `0/3` sin ningún cambio de código en `computeProgress` (ya cuenta por check existente, no por un número fijo asumido).

## L. Diseño mobile

Para Sello hoja-marco (la única con referencia visual), el bloque BIEN/MAL propuesto (ver Fase 11M sección O, retomado acá):

```
Revisa: [guía breve]

[ Ver ejemplos: BIEN / MAL ]   ← botón pequeño, colapsado por defecto

Ver cómo revisarlo   ← expandible existente, sin cambios

🟢 Está bien   🔴 Tiene un problema   🟠 No corresponde
```

**Decisión: opción C (botón pequeño "Ver ejemplo"), no A (siempre visible) ni B (dentro del expandible técnico)**. Motivos:
- A (siempre visible) — en 375px, 2 miniaturas lado a lado ocupan espacio permanente en CADA revisión, incluso para alguien que ya sabe qué está buscando — contradice el objetivo central de Fase 11L (jerarquía compacta, colapsado por defecto).
- B (dentro del expandible técnico) — mezclaría contenido educativo visual con el bloque de texto extenso ("Qué revisar"/"Cómo revisarlo"/etc.), perdiendo protagonismo entre 5-6 párrafos de texto.
- **C (botón propio, colapsado)** — mismo patrón ya validado en Fase 11L para "Ver cómo revisarlo": un control chico, con ícono + texto, que no ocupa espacio hasta que se toca. Consistente con el requisito explícito de 375px sin overflow — 2 imágenes lado a lado en un contenedor `grid-cols-2` con `gap` caben cómodamente en 375px si el control está colapsado por defecto y solo se expande a demanda.

## M. Separación referencia/evidencia

Copy propuesto para el botón/etiqueta de las referencias visuales, evaluado contra el riesgo de que el usuario confunda la imagen educativa con una foto de su propia inspección:

- Botón: **"Ver ejemplos"** (no "Ver fotos" — evita sugerir que son fotos de ESTA inspección).
- Encabezado sobre las 2 miniaturas cuando se expande: **"Así puede verse"** (neutro, claramente ilustrativo, no afirma "así se ve tu ventana").
- Etiquetas sobre cada miniatura: **"BIEN"** / **"MAL"** (mayúsculas, cortas, mismo registro visual que ya usan los 3 estados de evaluación — refuerza que son ejemplos de referencia, no evidencia).

La foto real del hallazgo (Fase 11L, sección post-guardado) mantiene su copy actual ("Agrega una foto del problema, si puedes.") sin cambios — vive en un contexto visual completamente distinto (dentro del formulario de hallazgo, después de "Tiene un problema"), nunca en el mismo bloque que las referencias educativas, que viven ANTES de responder. Esta separación de UBICACIÓN (antes de responder vs. dentro del hallazgo) es, en sí misma, la principal barrera contra la confusión — el copy es una segunda capa de refuerzo, no la única.

## N. Matriz final

| Revisión | Pregunta | Fuente | Estado | Variante | Referencia visual | Implementar próximo lote |
|---|---|---|---|---|---|---|
| Apertura y cierre | ¿La ventana abre y cierra correctamente? | CDT Ficha 13 + ITO 265 puntos | 🟢 | No | No (funcional) | **Sí** |
| Manilla / pestillo / herrajes | ¿La manilla y los herrajes funcionan bien? | CDT Ficha 13 + ITO 265 puntos | 🟢 | No | No (funcional) | **Sí** |
| Sello hoja-marco | ¿El sello entre hoja y marco es continuo? | CDT Ficha 13 + biblioteca ITO silicona perimetral | 🟢 | No | **Sí — alto valor** | **Sí** |
| Vidrio | ¿El vidrio presenta rayas o trizaduras? | Manual Cristalería Reina / normas EN (adaptado) | 🟡 | No | Sí (hipótesis) | No — falta decidir criterio simplificado |
| Sellos perimetrales (marco-muro) | ¿El sello entre el marco y el muro es continuo? | NCh 2496 (fragmento confirmado, texto completo no leído) | 🟡 | No | Sí (hipótesis) | No — falta leer la norma completa |
| Marco | ¿El marco está en buen estado? | Sin fuente con criterio de aceptación | 🔴 | **Sí, por material** | No evaluado (sin fuente) | No |
| Terminaciones | — | Sin fuente distinguible de Marco/Vidrio | 🔴 | No evaluado | No evaluado | No |

## O. Elementos rechazados

- **Sellos vidrio-marco** (el sello que fija el vidrio dentro de la hoja) — descartado como revisión separada: no se encontró fuente propia que lo distinga de "Sello hoja-marco" (el perímetro hoja-marco) ni de "Vidrio" (el vidrio en sí). Podría eventualmente resolverse dentro de la revisión de Vidrio una vez esa se apruebe, no como ítem nuevo.
- **Terminaciones** — descartado por vaguedad: no quedó claro qué evaluaría que Marco (estado físico) y Vidrio (estado del cristal) no cubran ya. Sin una definición propia y sin fuente, se descarta en vez de forzar un contenido genérico.
- **Marco** — no descartado permanentemente, pero explícitamente fuera del lote actual: requiere tanto fuente (🔴 hoy) como una decisión de variante por material antes de poder implementarse con el mismo nivel de rigor que las 3 aprobadas.

## P. Riesgos

- **Confundir "adaptado" con "inventado"** en Vidrio: los umbrales de Cristalería Reina son reales pero de un contexto de fábrica, no de inspección de campo — si se implementa sin una simplificación explícita y documentada, se corre el riesgo de citar una fuente real para un criterio que en realidad no dice.
- **Publicar Sellos perimetrales sin leer NCh 2496 completa**: el fragmento encontrado es consistente y específico, pero "consistente con un fragmento de búsqueda" no es lo mismo que "verificado contra el documento" — publicar sin esa lectura rompería la disciplina de fuentes que el proyecto ha mantenido en las 15 fases anteriores.
- **Dependencia de acceso externo**: esta sesión mostró que el dominio oficial de CDT puede no estar disponible en un entorno de ejecución dado — una fase futura que dependa de re-consultar esa fuente debería tener un plan B (PDF ya descargado, captura previa, o acceso desde otro entorno).
- **Presión de completar el lote de 7**: existe el riesgo de que una fase de implementación futura, viendo 7 candidatos ya "investigados", trate los 4 no aprobados (Vidrio, Sellos perimetrales, Marco, Terminaciones) como "casi listos" y los publique sin cerrar sus pendientes — el lote aprobado son 3, no 7, y debe tratarse así explícitamente.

## Q. Próxima implementación propuesta

**Alcance de la siguiente fase (11Q, sugerido, no forzado)**: implementar únicamente las 3 revisiones 🟢 (Apertura y cierre, Manilla/herrajes, Sello hoja-marco) como `InspectionChecklistItem` reemplazando/fraccionando la pregunta actual de Ventana, con sus 3 `TechnicalArticle` correspondientes (reutilizando y fraccionando el contenido ya existente de `ventana-como-revisar-funcionamiento`, no contenido nuevo) — más 2 `InspectionReferenceImage` (GOOD/BAD) para Sello hoja-marco usando el modelo ya creado en Fase 11O. Roadmap posterior (solo nombrado, no investigado en esta fase, tal como pidió la instrucción): replicar el mismo patrón de investigación a Puerta (ya tiene una revisión con fuente sólida, candidato natural siguiente), luego Piso (ya con 2 preguntas, evaluar si necesita más granularidad), Muros/revestimientos, y recién después abordar recintos completos (Cocina, Baño, Dormitorio) y Fachada (que además requiere resolver primero el patrón de sectores múltiples de Fase 11M sección L).

## R. Estado final

Investigación y diseño del piloto Ventana completados: 7 revisiones candidatas evaluadas, 3 aprobadas con fuente suficiente y contenido guiado completo (incluida 1 con diseño conceptual BIEN/MAL), 2 en estado intermedio con un paso de verificación concreto pendiente, 2 descartadas por falta de fuente o de definición propia. Confirmado que ninguna de las 3 aprobadas necesita variante — el piloto puede implementarse sobre el `InspectionElementTemplate` "ventana" existente sin tocar `materialVariantOf`. Documentada una limitación real de `materialVariantOf` (opera a nivel de elemento completo, no de revisión individual) para cuando Marco eventualmente se retome. Diseño de integración UI, mobile y separación referencia/evidencia completos, sin ninguna arquitectura nueva — todo reutiliza `ChecklistItemRow` de Fase 11L tal cual.

Código modificado = 0
Prisma modificado = 0
BD modificada = NO
Commit = NO
Push = NO
Deploy = NO

---

FASE 11P — DISEÑO DEL PILOTO VENTANA COMPLETADO
