# Módulo Regularización (Ley del Mono) — Auditoría funcional, normativa y de UX

**Fecha:** 2026-08-02
**Tipo de entregable:** diagnóstico completo. **Ningún código fue modificado.**
**Objetivo:** cerrar el diseño funcional y normativo del módulo antes de implementar cualquier cambio, respondiendo los 8 puntos solicitados con evidencia de código y, donde fue posible, contraste contra fuentes normativas reales.

**Nota metodológica sobre las fuentes legales:** no pude acceder directamente al texto oficial de la Ley 20.898 en el sitio de la Biblioteca del Congreso Nacional (bcn.cl / leychile.cl) — la conexión falló en los 2 intentos que hice. Todo lo que se afirma como "normativo" en este documento está corroborado contra **fuentes secundarias profesionales independientes** (guías de oficinas de arquitectura especializadas en regularización, no blogs genéricos), nunca contra el artículo de ley citado directamente. Cada afirmación normativa de este documento indica su nivel de confianza explícitamente. **Nada de esto reemplaza la revisión de `docs/regularizacion-revision-normativa.md` por un profesional con acceso confirmado al texto legal primario** — ese documento sigue siendo el paso obligatorio antes de publicar el módulo como definitivo.

---

## 1. Flujo inicial

### Bug del avalúo fiscal ("No conozco el avalúo fiscal")

**No es un bug de navegación ni una condición no implementada — es un vacío de modelado de datos.** Encontré el mecanismo exacto:

- Cuando el usuario elige "No lo sé", el wizard SÍ avanza correctamente en la sesión actual: `avaluo-fiscal-gate.tsx` guarda `avaluoFiscalPesos: null` y muestra el checklist de inmediato.
- El problema es que **`null` significa dos cosas distintas a la vez**: "el usuario todavía no respondió esta pregunta" y "el usuario respondió que no lo sabe". No existe ningún campo separado (ej. `avaluoFiscalConocido: boolean`) que distinga estos dos casos.
- La página del caso (`regularizacion/[id]/page.tsx`) decide si mostrar el gate o el checklist mirando exactamente ese mismo campo: `avaluoFiscalPesos !== null`. Como "no lo sé" también deja el campo en `null`, **la próxima vez que el usuario recargue la página o vuelva más tarde, el sistema vuelve a mostrarle la pregunta del avalúo como si nunca la hubiera respondido** — un ciclo silencioso, sin ningún mensaje de error visible, que probablemente es exactamente lo que Jorge percibió como "el flujo no continúa correctamente".

**Fix conceptual (para la fase de implementación, no ahora):** agregar un campo que registre explícitamente que la pregunta fue respondida con "no lo sé", separado del valor numérico. Es un cambio de esquema pequeño, no un rediseño.

### Campo Avalúo — formato y validación

Confirmado en código:
- **Sin separador de miles** — el input es un `<input type="text">` plano, el usuario ve el número tal como lo tipea (ej. "45000000", no "45.000.000").
- **"$" se muestra, pero como unidad genérica al lado del campo**, el mismo mecanismo que usa "m²" en otros lados — no está tratado como símbolo de moneda, y en ningún lugar cercano al campo dice "CLP" o "pesos chilenos".
- **Validación mínima**: obligatorio, debe ser un número finito mayor que 0. **Sin máximo, sin sanity-check de rango** (un avalúo de $50 o de $50.000.000.000 pasan igual de válidos) — el mecanismo de "rango típico" que sí usa el m² del wizard general existe en el componente compartido pero nunca se activó para este campo porque el `helpText` no tiene el formato que ese mecanismo espera parsear.

Las 3 mejoras que pide Jorge (separador de miles, indicación de CLP, validación) son perfectamente viables sin tocar lógica de negocio — es una mejora de presentación + un rango de sanity-check razonable (ej. advertir si es menor a $5.000.000 o mayor a $500.000.000, ajustable).

---

## 2. Croquis

Coincido con la apreciación de Jorge: es el punto que más necesita trabajo.

### Estado actual de las herramientas

| Herramienta | Estado |
|---|---|
| Muro, Puerta, Ventana, Cota, Texto (dibujar) | ✅ Implementadas, cada una con su propio hint de uso |
| Borrar elemento seleccionado | ✅ Implementado (botón + tecla Supr/Backspace) |
| Borrar puertas / ventanas específicamente | ⚠️ No existe como acción separada — solo "borrar lo seleccionado" (selecciona un elemento a la vez, sin distinguir tipo) |
| Borrar todo el croquis | ✅ Implementado, con confirmación |
| **Deshacer / rehacer** | ❌ **No existe en absoluto.** No hay pila de historial, ni `Ctrl+Z`, ni ningún mecanismo — la única forma de "deshacer" es borrar y redibujar a mano. |

La ausencia de deshacer/rehacer es probablemente la causa principal de que el editor "se sienta poco intuitivo" — es el atajo que cualquier usuario espera por defecto en una herramienta de dibujo, y su ausencia hace que cualquier error de clic se sienta costoso de corregir.

### Instrucciones antes de dibujar

- Existe un disclaimer ("Este croquis es solo referencial y no corresponde a un plano oficial.") y un hint de texto por herramienta activa (ej. "Hacé clic donde va la puerta.").
- **No existe ninguna explicación de que es una vista en planta**, ni que no es elevación ni vista lateral, ni cómo se representan puertas/ventanas en un plano — exactamente el vacío que Jorge identificó.
- **La escala de la cuadrícula (10 cm por casillero, usada internamente para el "snap" al dibujar) nunca se muestra al usuario** — hoy el usuario dibuja sin saber a qué distancia real equivale cada cuadro.

### Propuesta de mejora (diseño, no implementación)

1. Un panel de instrucciones colapsable (mismo patrón `CollapsibleHelp` ya usado en otras partes del framework, cero componente nuevo) antes del canvas, con exactamente el contenido que propone Jorge: vista en planta, no elevación, puertas/ventanas como en un plano, "cada cuadrícula = 1 metro" (ajustado al valor real de 10 cm si esa sigue siendo la escala, o se sube la escala a 1 m si se simplifica).
2. Deshacer/rehacer: una pila de historial simple (snapshots del array de elementos, no un diff complejo) — el patrón más barato de implementar dado que los elementos ya son datos serializables.
3. Si Jorge quiere "borrar puertas" o "borrar ventanas" como acciones agrupadas (no solo elemento por elemento), eso es una decisión de producto a confirmar antes de implementar — hoy seleccionar y borrar de a uno ya cubre el caso, agregar un "borrar todas las puertas" de un clic es una herramienta adicional, no un fix de algo roto.

---

## 3. Checklist documental — contraste normativo

### Lo que encontré corroborado (2 fuentes secundarias profesionales independientes, no el texto legal primario)

| Criterio | En el código hoy | Contraste |
|---|---|---|
| Tramo A: ≤90 m², avalúo < 1.000 UF | ✅ implementado así | **Coincide** con guía profesional consultada (domap.cl, especializada en regularizaciones Ley 20.898) |
| Tramo B: ≤140 m², avalúo < 2.000 UF | ✅ implementado así | **Coincide** |
| Corte de fecha: construcción anterior al 4 de febrero de 2016 | ✅ implementado así | **Coincide** |
| Los tramos se evalúan con "O" (cualquiera de los dos) | ✅ implementado así | **Coincide** con la estructura descrita en la fuente consultada |
| Definición de "profesional competente" (arquitecto, ingeniero civil, ingeniero constructor, constructor civil) | Aparece solo como texto suelto ("Arquitecto o profesional competente") en 2 documentos del checklist, sin sección propia | **Confirmado contra la definición de la OGUC** (ver punto 5) |

Esto es una buena noticia: los criterios cuantitativos más importantes del módulo (los que Jorge mismo marcó como prioridad #1 en `docs/regularizacion-revision-normativa.md`) **ya estaban implementados correctamente**, según 2 fuentes profesionales independientes que los describen igual. Sigue pendiente la confirmación contra el texto legal primario (Ley 20.898 + OGUC directamente), que no pude completar por el problema de acceso a bcn.cl.

### Hallazgo nuevo, no estaba en el documento de revisión anterior: fecha límite del programa

Encontré, en 2 fuentes independientes, que **la Ley 20.898 tiene fecha de vencimiento**: el plazo para acogerse al procedimiento simplificado fue extendido hasta el **31 de diciembre de 2027** por la Ley 21.725 (2025). **El módulo hoy no menciona esta fecha límite en ningún lado** — ni en pantalla ni en el PDF. Esto es relevante: un usuario que use la herramienta sin saber que el programa tiene fecha de término podría postergar la regularización sin darse cuenta de que corre contra un plazo legal. Recomiendo agregar esto al mensaje legal (punto 6) y confirmarlo contra fuente primaria antes de publicarlo como un hecho — lo marco como **hallazgo a verificar**, no como dato ya confirmado con la misma confianza que los tramos.

### Sobre "¿todos son obligatorios, cuáles dependen del caso?"

Ya está bien resuelto en el diseño actual — el campo `obligatorio` + `dependeDe` en cada uno de los 15 documentos ya modela exactamente esa distinción (11 documentos siempre obligatorios, 4 condicionales). El contenido de CADA documento (si realmente corresponde, si falta alguno, si sobra alguno) sigue pendiente de validación contra fuente primaria — no encontré una fuente que liste los 15 documentos exactos para poder contrastarlos uno a uno; solo pude corroborar los criterios numéricos de elegibilidad.

### Sobre "¿cuándo basta con un croquis vs. cuándo se exigen planos?"

**No encontré una fuente que responda esto con precisión** — es exactamente el tipo de pregunta que depende de la práctica de cada DOM (mencionado como posibilidad en el propio `docs/regularizacion-revision-normativa.md`, sección "Cuándo consultar a un profesional"). El módulo hoy simplifica esto asumiendo que planos de arquitectura son SIEMPRE obligatorios (documento #4, sin condición de aparición) y el croquis es solo una herramienta de apoyo del usuario, nunca un sustituto — eso es consistente con lo que encontré (el croquis del módulo está marcado como "no oficial" en 2 lugares), pero no pude confirmar si existe algún caso donde la DOM acepta un croquis simplificado en vez de planos profesionales completos. **Queda como pregunta abierta para quien haga la revisión normativa formal.**

---

## 4. Límites de aplicación

Con lo investigado, encontré una variable que el módulo **no está considerando hoy y debería**:

- **Destino de la edificación.** La Ley 20.898 se llama textualmente "procedimiento simplificado para la regularización de **viviendas** de autoconstrucción" — es decir, aplica a uso residencial. El cuestionario inicial del módulo (tipo de construcción, año, recepción, m², material) **nunca pregunta el destino/uso de la edificación** — un usuario que quiera regularizar una bodega, un local comercial o un taller podría completar todo el flujo sin que el sistema le advierta que probablemente está fuera del alcance de esta ley específica. Esto es una brecha real, no una hipótesis — el propio nombre de la ley lo indica.
- **Superficie: "recintos habitables, baños y cocina", no toda la superficie construida.** Una de las fuentes consultadas especifica que el límite de 90/140 m² se mide sobre recintos habitables + baños + cocina — no necesariamente toda la huella construida (¿incluye terrazas techadas, bodegas, garajes?). El módulo hoy usa un único campo genérico "m² estimados" sin esa distinción. **Esto necesita confirmación normativa antes de decidir si hay que ajustar la pregunta** — lo marco como hallazgo, no como hecho confirmado (una sola fuente lo menciona así, no lo corroboré en una segunda).
- **Mínimos:** no encontré ninguna referencia a un mínimo de superficie — parece que cualquier tamaño mayor a 0 califica, sujeto a los tramos superiores.
- **Antigüedad:** ya cubierta correctamente (corte de fecha 4-feb-2016), ver sección 3.
- **Tipo de vivienda:** no encontré ninguna distinción normativa por tipo de vivienda (aislada, pareada, departamento, etc.) más allá de "vivienda" como destino general — no until pude confirmar si aplica a copropiedad/departamentos o solo a viviendas unifamiliares.

**Conclusión de esta sección: el destino de la edificación es el hallazgo más importante y más accionable — es una pregunta que falta en el wizard, no un ajuste de un umbral existente.**

---

## 5. Profesional competente

Este punto hoy está **prácticamente ausente** del módulo — confirmado por el código: "profesional competente" solo aparece como texto de relleno en 2 filas del checklist ("dónde se obtiene"), nunca como una sección propia que explique quién puede hacer qué.

Lo que encontré, con una fuente sólida (definición directa de la OGUC, corroborada en 2 fuentes independientes que citan el mismo texto):

> **"Profesional competente"** es el **arquitecto, ingeniero civil, ingeniero constructor o constructor civil**, a quienes, dentro de sus respectivos ámbitos de competencia, corresponda efectuar las tareas u obras referidas en la Ley General de Urbanismo y Construcciones y su Ordenanza (OGUC). Deben estar legalmente habilitados para ejercer, tener patente vigente en la comuna donde trabajan, y quedar individualizados en el permiso.

Puntos importantes para el contenido de esta sección:
- Son **4 categorías exactas** — no una lista abierta de "cualquier profesional habilitado".
- La frase "**dentro de sus respectivos ámbitos de competencia**" implica que no las 4 categorías pueden firmar cualquier cosa por igual (ej. un cálculo estructural probablemente requiere ingeniero civil o estructural específicamente, no cualquiera de los 4) — **esto no lo pude confirmar con el detalle suficiente para escribirlo como regla exacta** en el producto; recomiendo consultar a un arquitecto o revisar la OGUC directamente para esa distinción fina antes de escribir la copy final.
- **Sobre "técnico constructor"**: no encontré ninguna fuente que lo incluya dentro de la definición de "profesional competente" de la OGUC — la definición oficial que encontré son exactamente 4 categorías, y "técnico constructor" no es una de ellas. Esto sugiere que un técnico **no** puede firmar como profesional competente para efectos de la Ley 20.898, pero **no pude confirmarlo con una segunda fuente independiente** ni verificar si existe alguna excepción específica para autoconstrucción/vivienda social (el Registro Nacional de Constructores de Vivienda Social que encontré es un registro distinto, para constructoras, no para técnicos individuales firmando planos). **Este punto queda explícitamente marcado como "no confirmado" — no lo escribas como un hecho en el producto sin validación profesional adicional**, tal como pidió Jorge ("no dejar este punto ambiguo" — la honestidad aquí es reconocer que la ambigüedad existe en lo que pude investigar, no resolverla con una afirmación no verificada).

---

## 6. Mensaje legal

**Ya existe, pero de forma incompleta.** Confirmado en código: 3 textos de disclaimer distintos, en 4 lugares (pantalla de entrada, pantalla de reglas, portada del PDF, editor de croquis) — todos con el mismo espíritu ("esto es orientativo, no reemplaza a un profesional ni a la DOM").

**Vacíos encontrados:**
- **No hay ningún disclaimer en la pantalla del checklist de documentos** — justo donde el usuario podría sentir más confianza de que "ya tiene todo lo necesario".
- **No hay disclaimer en las pantallas de recintos/fotos.**
- **Ninguno de los 3 textos existentes menciona la fecha límite del programa** (31-dic-2027, ver sección 3) — si se confirma ese dato, debería incorporarse acá.

**Propuesta de texto único** (a reemplazar/unificar los 3 existentes, no agregar un 4to distinto):

> Esta herramienta entrega una orientación inicial y no reemplaza la evaluación de un profesional competente ni el pronunciamiento de la Dirección de Obras Municipales correspondiente.

Coincide textualmente con lo que propuso Jorge — recomiendo usarlo tal cual, en TODAS las pantallas del módulo (incluyendo checklist, recintos y fotos, no solo entrada/reglas/PDF/croquis como hoy).

---

## 7. Informe final — de PDF a Informe de Evaluación Preliminar

Estado actual del PDF (confirmado en código, 3 páginas):

| Elemento pedido por Jorge | ¿Existe hoy? |
|---|---|
| Resumen del proyecto | ✅ (datos clave del wizard) |
| Datos ingresados | ✅ |
| Resultado de elegibilidad | ⚠️ Parcial — se muestran los mensajes de las reglas activadas, pero no como un veredicto de elegibilidad claramente diferenciado del resto |
| Riesgos detectados | ❌ Ausente como sección propia — mezclado dentro de los mensajes genéricos de reglas |
| Documentación mínima requerida | ✅ (checklist completo, agrupado por categoría) |
| Observaciones | ❌ Ausente — no hay campo de notas libres del usuario ni del sistema |
| Croquis incorporado | ✅ |
| Fotografías | ✅ |
| Recomendaciones | ❌ Ausente como sección propia |
| Próximos pasos | ❌ Ausente |
| Espacio para firma del propietario | ❌ Ausente |
| Espacio para firma del profesional | ❌ Ausente |

**4 de 12 elementos ya existen, 1 es parcial, 7 están completamente ausentes.** Esto confirma lo que dice Jorge: hoy es un PDF-resumen, no un Informe de Evaluación Preliminar real.

### Propuesta de estructura (diseño, no implementación)

1. **Portada** — nombre del caso, fecha de generación, logo/marca ObraBien, mensaje legal unificado (sección 6).
2. **Resumen ejecutivo** — 1 párrafo: qué se evaluó, resultado general en una frase (ej. "Este proyecto calificaría preliminarmente para la vía simplificada de la Ley 20.898" / "Este proyecto probablemente no califica para la vía simplificada — requiere evaluación directa con la DOM").
3. **Datos del proyecto** — todo lo que ya existe hoy (tipo, material, año, recepción, m², avalúo).
4. **Resultado de elegibilidad preliminar** — sección propia, separada de "observaciones", con el veredicto explícito (califica / no califica / información insuficiente) y los criterios que lo determinaron.
5. **Riesgos detectados** — sección propia (ej. segundo piso en madera, superficie que excede tramo) — hoy mezclada con lo anterior.
6. **Documentación mínima requerida** — el checklist ya existente, sin cambios de contenido.
7. **Recintos** — ya existe, sin cambios.
8. **Croquis** — ya existe, con la aclaración reforzada de vista en planta (sección 2).
9. **Fotografías** — ya existe.
10. **Observaciones** — campo de texto libre (del usuario o generado por el sistema a partir de las respuestas) — nuevo.
11. **Recomendaciones** — texto orientativo genérico (ej. "Te recomendamos agendar una visita con un arquitecto para validar planos antes de iniciar el trámite") — nuevo.
12. **Próximos pasos** — checklist simple de las 3 etapas (ver sección 8) con la etapa actual resaltada — nuevo.
13. **Firmas** — 2 recuadros (propietario / profesional), con espacio para nombre, RUT, fecha y firma manuscrita (el PDF se imprime y se firma a mano, no requiere firma digital) — nuevo.

Esto es compatible con el generador de PDF ya existente (`regularization-pdf.tsx`, basado en `@react-pdf/renderer`) — es una extensión de contenido, no un cambio de tecnología.

---

## 8. Diferenciar las 3 etapas

Hoy el módulo **no comunica explícitamente que existen 3 etapas separadas** — el disclaimer actual dice "no reemplaza la evaluación de un profesional" pero no dibuja el camino completo. Propuesta: un indicador visual simple (ej. 3 pasos con el paso 1 resaltado como "estás aquí"), presente tanto en la app como en el informe:

1. **Evaluación preliminar (ObraBien)** — hasta acá llega la herramienta.
2. **Informe técnico (profesional competente)** — el arquitecto/ingeniero prepara los documentos técnicos reales (planos, memoria, cálculo estructural si aplica).
3. **Tramitación municipal (DOM)** — la Dirección de Obras Municipales revisa y resuelve.

Esto resuelve directamente el riesgo que menciona Jorge ("no debe transmitir la sensación de que el usuario ya tiene toda la documentación lista para ingresar el expediente") — el Informe de Evaluación Preliminar debería decir explícitamente, en su propia portada o resumen, que es el resultado de la ETAPA 1 de 3, no un expediente listo para presentar.

---

## Resumen de hallazgos por prioridad

**Bugs a corregir:**
1. Avalúo fiscal "no lo sé" no persiste como respuesta distinta de "sin responder" — causa que la pregunta reaparezca en visitas futuras.

**Vacíos normativos a verificar antes de implementar (no asumir):**
2. Fecha límite del programa (31-dic-2027) — confirmar contra fuente primaria.
3. Definición exacta de "profesional competente" por tipo de documento (¿cualquiera de los 4 puede firmar cualquier cosa, o cada uno tiene un ámbito específico?).
4. Si "técnico constructor" tiene alguna vía de participación — no encontrada, probablemente no aplica, sin confirmar.
5. Si el límite de 90/140 m² se mide sobre superficie total o solo recintos habitables+baño+cocina.
6. Confirmar los 15 documentos del checklist contra fuente primaria (no se pudo hacer en esta pasada).

**Gap funcional real:**
7. El módulo nunca pregunta el destino/uso de la edificación, pese a que la ley aplica específicamente a "viviendas".

**Mejoras de UX aprobadas para diseñar (sin bloqueo normativo):**
8. Formato de miles + indicador CLP + validación de rango en el campo avalúo.
9. Instrucciones de "vista en planta" + escala de cuadrícula antes del croquis.
10. Deshacer/rehacer en el editor de croquis.
11. Sección "Profesional competente" (con el contenido de la sección 5 de este documento, una vez validado).
12. Mensaje legal unificado en todas las pantallas (incluyendo checklist, recintos, fotos).
13. Rediseño del Informe de Evaluación Preliminar (12 secciones, sección 7).
14. Indicador de las 3 etapas, visible en la app y en el informe.

---

*Este documento es un diagnóstico. No se modificó ningún archivo de código. El siguiente paso, según lo pedido, es cerrar el diseño funcional y normativo completo antes de escribir cualquier implementación — en particular, resolver los 6 vacíos normativos listados arriba con una fuente primaria o un profesional competente antes de que cualquiera de esos puntos se convierta en texto definitivo dentro del producto.*
