# Regulariza tu Vivienda — Documento de revisión normativa

**Para:** quien realice el contraste normativo de este módulo — típicamente alguien del propio equipo o un colaborador con acceso a las fuentes oficiales, no necesariamente un arquitecto externo contratado para "aprobar" el módulo.
**Objetivo de este documento:** contrastar el contenido normativo del módulo directamente contra **fuentes oficiales primarias** — el texto de la Ley 20.898, la Ordenanza General de Urbanismo y Construcciones (OGUC), y los formularios e instructivos oficiales del MINVU — en lugar de depender de la interpretación de una sola persona. No requiere conocimientos de programación.
**Estado del módulo:** desarrollo técnico terminado y verificado funcionalmente. Contenido normativo **no contrastado contra fuente oficial todavía** — ese es exactamente el objetivo de este ejercicio.

**Qué es y qué no es este módulo:** el módulo no reemplaza el trabajo de un arquitecto, un ingeniero ni la Dirección de Obras Municipales. Su finalidad es orientar al usuario y ayudarle a entender, de manera preliminar, qué camino podría corresponderle y qué antecedentes probablemente necesitará — nunca un pronunciamiento oficial ni un sustituto de la evaluación que hace la DOM en cada caso concreto.

**Alcance exacto de este ejercicio — léase antes de continuar:** lo que se solicita es contrastar **exclusivamente el contenido normativo** — es decir, si las reglas, los documentos y los criterios numéricos de las secciones 2, 3 y 4 coinciden con el texto vigente de la Ley 20.898, la OGUC y los formularios/instructivos oficiales del MINVU. **No se solicita** revisar ni opinar sobre la implementación técnica, el diseño de la interfaz, la experiencia de usuario, el flujo de pantallas ni ningún otro aspecto de programación o diseño de producto — esos aspectos ya fueron completados y verificados por el equipo de desarrollo y están fuera del alcance de este ejercicio.

**Cuándo consultar a un profesional:** si después de contrastar contra las fuentes oficiales quedan dudas de interpretación, o si algún criterio depende de la práctica habitual de las DOM (que varía entre comunas y no siempre está escrita en la ley), ahí sí corresponde consultar a un profesional con experiencia en regularizaciones — para esos puntos puntuales, no como condición general de validez del módulo completo.

---

## 1. Resumen del funcionamiento completo del módulo

"Regulariza tu Vivienda" es un módulo dentro de la aplicación ObraBien Calcula que guía a un usuario (dueño de una construcción no regularizada, sin conocimientos legales) a través de un proceso orientativo de auto-diagnóstico y organización documental. **No presenta trámites ante ninguna entidad, no genera documentos legales y no reemplaza asesoría profesional** — esto se declara explícitamente al usuario en dos lugares (pantalla y PDF, ver más abajo).

El flujo, en orden:

1. **Cuestionario inicial (5 preguntas):** tipo de construcción, año de construcción (o "no lo sé"), si cuenta con recepción municipal (sí / no / no estoy seguro), metros cuadrados aproximados, material principal.
2. **Evaluación preliminar automática:** con esas respuestas, el sistema evalúa 9 reglas (sección 2) y muestra al usuario los mensajes de las reglas que se activan — orientaciones en lenguaje simple, nunca un veredicto legal.
3. **Avalúo fiscal (opcional en el momento, luego se puede completar):** se pregunta si el usuario conoce el avalúo fiscal de la propiedad. Si lo indica, se usa para refinar la evaluación de las reglas relacionadas con superficie/avalúo.
4. **Checklist de documentos:** se muestra una lista de hasta 15 documentos (sección 3) que el usuario puede ir marcando como "reunidos". Algunos documentos solo aparecen si aplican al caso concreto del usuario (columna "Condición de aparición").
5. **Recintos:** el usuario puede cargar los recintos de la construcción (dormitorio, cocina, etc.) con sus medidas, y el sistema calcula el m² real sumando esos recintos — dato que se muestra junto al m² estimado del cuestionario inicial, sin reemplazarlo.
6. **Fotografías:** el usuario puede subir fotos de la construcción, agrupadas por categoría (fachada, interior, techumbre, etc.), como respaldo documental.
7. **Croquis:** un editor simple donde el usuario puede dibujar un plano referencial (muros, puertas, ventanas, cotas, texto) — explícitamente marcado como no oficial.
8. **Carpeta PDF:** en cualquier momento, el usuario puede descargar un PDF que reúne todo lo anterior (evaluación, recintos, checklist, fotos, croquis) para su propio uso o para llevar a un profesional/la municipalidad.

**Disclaimers ya presentes en el producto** (se mantienen sin cambios, independientemente del resultado de este contraste — se listan solo para que quien haga el contraste confirme que el texto es adecuado):
- En pantalla, durante el uso del croquis: *"Este croquis es solo referencial y no corresponde a un plano oficial."*
- En el PDF, en la portada: *"Esta información constituye una orientación preliminar y no reemplaza la evaluación de un arquitecto ni la resolución de la Dirección de Obras Municipales."*

Ambos textos dejan claro que la herramienta es solo una orientación inicial, que no constituye un pronunciamiento oficial, y que toda regularización debe ser revisada y presentada por un profesional competente cuando corresponda — este criterio se mantiene sin importar lo que arroje el contraste normativo de este documento.

**Lo que el módulo NO hace** (para que quede explícito): no calcula un resultado legal vinculante, no presenta el trámite ante la DOM ni ninguna otra entidad, no genera los documentos técnicos (planos, memoria, cálculo estructural) — solo ayuda a organizar y hacer seguimiento de lo que el usuario debe reunir por su cuenta con los profesionales correspondientes.

---

## 2. Las 9 reglas de evaluación preliminar

Cada regla se evalúa de forma independiente; pueden activarse varias a la vez. El usuario ve el mensaje completo de cada regla activa, nunca solo una etiqueta.

### Regla 1 — Año no informado — pedir verificación
- **Condición lógica:** se activa cuando el usuario no indicó el año de construcción.
- **Mensaje al usuario:** "No indicaste el año de construcción — la antigüedad de la obra es clave para saber qué vía de regularización aplica. Si no tienes certeza, revisa boletas, fotos aéreas antiguas o consulta directamente en la DOM de tu comuna."
- **Objetivo:** evitar que el usuario avance sin darse cuenta de que este dato es importante; orientarlo sobre cómo averiguarlo.
- **Observaciones (contraste con fuente oficial):** ___________________________________________________________

### Regla 2 — Construcción antigua sin recepción — posible vía simplificada
- **Condición lógica:** año informado, **Y** año de construcción **anterior** al 4 de febrero de 2016, **Y** el usuario indicó explícitamente si tiene recepción municipal, **Y** la respuesta fue **"No"**.
- **Mensaje al usuario:** "Tu construcción podría calificar para una vía simplificada de regularización, pensada para obras construidas antes del 4 de febrero de 2016 sin recepción municipal. Esto es solo una orientación inicial — la evaluación definitiva la hace la DOM de tu comuna."
- **Objetivo:** identificar el escenario típico de la "vía simplificada" (Ley 20.898) por fecha y falta de recepción, como primera señal orientativa.
- **Observaciones (contraste con fuente oficial):** ___________________________________________________________

### Regla 3 — Construcción reciente — vía simplificada probablemente no aplica
- **Condición lógica:** año informado **Y** año de construcción **igual o posterior** al 4 de febrero de 2016.
- **Mensaje al usuario:** "Por la fecha de construcción, si es posterior al 4 de febrero de 2016, es probable que la vía simplificada para obras antiguas no aplique en tu caso, y debas seguir el proceso de permiso de edificación regular. Te recomendamos consultar directamente en la DOM de tu comuna."
- **Objetivo:** advertir tempranamente que el caso probablemente no es candidato a la vía simplificada, para no generar expectativas equivocadas.
- **Observaciones (contraste con fuente oficial):** ___________________________________________________________

### Regla 4 — Ya cuenta con recepción municipal
- **Condición lógica:** el usuario indicó explícitamente si tiene recepción municipal, **Y** la respuesta fue **"Sí"**.
- **Mensaje al usuario:** "Indicaste que esta construcción ya cuenta con recepción municipal — si es así, probablemente no necesites este proceso de regularización para esa parte de la obra. Revisa si lo que quieres regularizar es una ampliación posterior no cubierta por esa recepción."
- **Objetivo:** detectar el caso en que el usuario quizás está en el módulo equivocado, o que solo necesita regularizar una ampliación posterior a una recepción ya existente.
- **Observaciones (contraste con fuente oficial):** ___________________________________________________________

### Regla 5 — Elegibilidad preliminar por superficie y avalúo
- **Condición lógica:** el usuario informó el avalúo fiscal, **Y** se cumple **al menos uno** de estos dos tramos:
  - Tramo A: superficie construida ≤ 90 m² **Y** avalúo fiscal < 1.000 UF, o
  - Tramo B: superficie construida ≤ 140 m² **Y** avalúo fiscal < 2.000 UF
  (la UF se valoriza al 4 de febrero de 2016: $25.629,09 — ver sección 4).
- **Mensaje al usuario:** "Según la superficie y el avalúo fiscal declarados, tu proyecto podría calificar preliminarmente para la vía simplificada. Esta información es solo orientativa y la evaluación definitiva corresponde a la Dirección de Obras Municipales."
- **Objetivo:** dar una señal preliminar de elegibilidad por los dos criterios cuantitativos (superficie y avalúo) de la vía simplificada.
- **Observaciones (contraste con fuente oficial):** ___________________________________________________________

### Regla 6 — Segundo piso en madera — atención estructural
- **Condición lógica:** material principal = Madera **Y** tipo de construcción = Segundo piso.
- **Mensaje al usuario:** "Un segundo piso construido en madera suele requerir un informe de cálculo estructural específico, independientemente de la superficie. Considera consultar con un profesional antes de avanzar."
- **Objetivo:** alertar sobre un caso donde puede requerirse respaldo estructural adicional sin importar si califica por tramo.
- **Observaciones (contraste con fuente oficial):** ___________________________________________________________

### Regla 7 — El caso excede los tramos evaluados para la vía simplificada
- **Condición lógica:** el usuario informó el avalúo fiscal, **Y NO** se cumple ninguno de los dos tramos de la Regla 5.
- **Mensaje al usuario:** "Según la superficie y el avalúo fiscal declarados, tu proyecto podría requerir documentación técnica adicional o seguir un procedimiento distinto al de la vía simplificada. Te recomendamos confirmar esta situación directamente con la Dirección de Obras Municipales de tu comuna."
- **Objetivo:** avisar cuando el caso no calza con los tramos cuantitativos, para redirigir al usuario a consultar directamente con la DOM.
- **Observaciones (contraste con fuente oficial):** ___________________________________________________________

### Regla 8 — Avalúo fiscal no informado
- **Condición lógica:** el usuario no ha informado el avalúo fiscal todavía.
- **Mensaje al usuario:** "No indicaste el avalúo fiscal de la propiedad — este dato es necesario para evaluar tu elegibilidad preliminar por superficie y avalúo. Puedes completarlo más adelante, cuando tengas a mano tu Certificado de Avalúo Fiscal (disponible gratis en sii.cl con tu Clave Única o RUT) — mientras tanto, puedes seguir avanzando con el resto del proceso."
- **Objetivo:** informar sin bloquear — el usuario puede seguir usando el resto del módulo aunque no tenga este dato a mano todavía.
- **Observaciones (contraste con fuente oficial):** ___________________________________________________________

### Regla 9 — Recepción municipal no informada
- **Condición lógica:** el usuario no ha indicado si la construcción cuenta con recepción municipal (dejó "No estoy seguro" o no respondió).
- **Mensaje al usuario:** "No indicaste si esta construcción cuenta con recepción municipal — este dato es clave para orientar qué vía de regularización te corresponde. Si no estás seguro, puedes consultarlo en la DOM de tu comuna o revisando los documentos de la propiedad. Mientras tanto, puedes seguir avanzando con el resto del proceso."
- **Objetivo:** mismo criterio que la Regla 8, para el dato de recepción municipal.
- **Observaciones (contraste con fuente oficial):** ___________________________________________________________

**Nota técnica:** las Reglas 1/2/3, las Reglas 8/2/4/9, y la Regla 5/7 están diseñadas para ser mutuamente excluyentes dentro de su propio grupo (nunca se disparan dos reglas contradictorias sobre el mismo dato al mismo tiempo) — esto ya fue verificado en el desarrollo y no requiere revisión normativa, solo se menciona para que quien haga el contraste sepa que la combinación de mensajes que verá un usuario real siempre es coherente.

---

## 3. Los 15 documentos del checklist

"Condición de aparición" describe en qué caso el documento se muestra al usuario en su checklist. Si dice "Siempre", el documento aparece para todos los usuarios sin excepción.

| # | Documento | Categoría | Para qué sirve | Dónde se obtiene | ¿Obligatorio? | Condición de aparición |
|---|---|---|---|---|---|---|
| 1 | Certificado de Informaciones Previas (CIP) | Municipal | Informa la normativa urbanística aplicable al predio (uso de suelo, rasantes, etc.) antes de iniciar el trámite | DOM de la municipalidad correspondiente | Sí | Siempre |
| 2 | Certificado de dominio vigente | Notaría / Conservador de Bienes Raíces | Acredita quién es el propietario actual del predio ante la DOM | Conservador de Bienes Raíces (CBR) de la comuna | Sí | Siempre |
| 3 | Copia de la escritura de la propiedad | Notaría / Conservador de Bienes Raíces | Respalda el dominio junto al certificado de vigencia | Notaría donde se firmó la escritura original, o CBR | Sí | Siempre |
| 4 | Planos de arquitectura (planta, elevaciones, cortes) | Arquitecto / profesional | Documento técnico base de toda regularización — muestra lo construido tal como está | Arquitecto o profesional competente | Sí | Siempre |
| 5 | Memoria explicativa | Arquitecto / profesional | Describe en texto lo construido, materialidad y uso, acompañando los planos | Arquitecto o profesional competente | Sí | Siempre |
| 6 | Especificaciones técnicas | Arquitecto / profesional | Detalla materiales y soluciones constructivas usadas | Arquitecto o profesional competente | No | Solo si el material principal informado es distinto de "Otro" |
| 7 | Informe de cálculo estructural | Arquitecto / profesional | Certifica que la estructura es segura — exigible según tamaño/material | Ingeniero estructural o civil | No | Solo si el caso excede los tramos de superficie/avalúo (Regla 7) **o** si es un segundo piso en madera (Regla 6) |
| 8 | Solicitud de regularización (formulario DOM) | Dirección de Obras (DOM) | Formulario formal que da inicio al trámite ante la Dirección de Obras | DOM de la municipalidad correspondiente | Sí | Siempre |
| 9 | Certificado de recepción municipal anterior (si existe) | Dirección de Obras (DOM) | Acredita qué parte de la propiedad ya cuenta con recepción, para regularizar solo lo nuevo | DOM de la municipalidad correspondiente | No | Solo si el usuario indicó que la construcción **ya cuenta** con recepción municipal |
| 10 | Informe de revisor independiente | Dirección de Obras (DOM) | Exigido en construcciones de mayor envergadura antes de la recepción | Revisor independiente inscrito en el municipio | No | Solo si el caso excede los tramos de superficie/avalúo (mismo criterio que la Regla 7) |
| 11 | Certificado de Recepción Definitiva (resultado del trámite) | Dirección de Obras (DOM) | Documento final que certifica que la construcción quedó regularizada | DOM de la municipalidad correspondiente | Sí | Siempre |
| 12 | Pago de derechos municipales | Municipal | Comprobante de pago asociado al permiso/regularización | Tesorería municipal | Sí | Siempre |
| 13 | Inscripción de la recepción en el Conservador de Bienes Raíces | Notaría / Conservador de Bienes Raíces | Paso final — deja constancia registral de la regularización | Conservador de Bienes Raíces (CBR) de la comuna | Sí | Siempre |
| 14 | Certificado de Avalúo Fiscal, vigente al 4 de febrero de 2016 | Municipal | Fuente oficial del avalúo fiscal del inmueble — el dato que el usuario carga en el sistema sale de este certificado | Servicio de Impuestos Internos (SII), sii.cl con Clave Única o RUT | Sí | Siempre |
| 15 | Declaración simple de no reclamaciones pendientes ante la DOM o el Juzgado de Policía Local | Dirección de Obras (DOM) | Acredita que no existen litigios o reclamos pendientes sobre la propiedad que impidan la regularización | Declaración jurada simple del propio propietario | Sí | Siempre |

**Observaciones generales sobre el checklist (contraste con fuente oficial):**
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________

---

## 4. Tabla de validación de criterios normativos

Esta es la tabla más importante del documento. **Todos los valores aquí listados provienen de fuentes secundarias** (artículos y sitios de arquitectos/corredoras que resumen la Ley 20.898 y su reglamento), **no de la cita directa del artículo legal correspondiente**. Ningún valor de esta tabla debe considerarse confirmado hasta que este apartado quede marcado como contrastado contra fuente oficial.

**Prioridad de revisión — leer antes de la tabla:** dentro de esta tabla, las filas correspondientes a los **tramos de superficie y avalúo fiscal** (90 m² / 1.000 UF y 140 m² / 2.000 UF, incluyendo la forma en que se combinan con "O") son la **prioridad más alta de esta revisión completa**, por encima de cualquier otro criterio del documento. Esos valores son los que determinan si se dispara la Regla #5 ("Elegibilidad preliminar por superficie y avalúo") o la Regla #7 ("El caso excede los tramos evaluados"), que juntas producen **el mensaje central de elegibilidad** que ve el usuario — el resultado más importante que entrega el módulo. Un error en estos dos tramos afecta directamente a todos los usuarios que completan el dato de avalúo fiscal, no solo a un caso puntual. Si quien realiza el contraste dispone de tiempo limitado, debe concentrarlo primero en estas dos filas antes que en el resto de la tabla.

| Criterio usado en el sistema | Dónde se usa | Estado actual | Resultado del contraste |
|---|---|---|---|
| Corte de fecha: 4 de febrero de 2016 | Reglas 2 y 3 (antigüedad de la construcción); nombre del documento #14 | Pendiente de validación — se asume que corresponde a la fecha de publicación de la Ley 20.898 ("Ley del Mono") | ☐ Correcto ☐ Incorrecto — fecha correcta: _______________ |
| Tramo A: superficie ≤ 90 m² | Regla 5 (elegibilidad) y Regla 7 (excede tramo) | Pendiente de validación | ☐ Correcto ☐ Incorrecto — valor correcto: _______________ |
| Tramo A: avalúo fiscal < 1.000 UF | Regla 5 y Regla 7 | Pendiente de validación | ☐ Correcto ☐ Incorrecto — valor correcto: _______________ |
| Tramo B: superficie ≤ 140 m² | Regla 5 y Regla 7 | Pendiente de validación | ☐ Correcto ☐ Incorrecto — valor correcto: _______________ |
| Tramo B: avalúo fiscal < 2.000 UF | Regla 5 y Regla 7 | Pendiente de validación | ☐ Correcto ☐ Incorrecto — valor correcto: _______________ |
| Los tramos A y B se evalúan con "O" (cualquiera de los dos alcanza) | Regla 5 y Regla 7 | Pendiente de validación — se asume que basta con cumplir uno de los dos tramos, no ambos | ☐ Correcto ☐ Incorrecto — corrección: _______________ |
| Recepción municipal (Sí/No/No estoy seguro) como criterio central para orientar la vía de regularización | Reglas 2, 3, 4, 9; Documento #9 | Pendiente de validación — se asume que la ausencia de recepción municipal es condición necesaria de la vía simplificada | ☐ Correcto ☐ Incorrecto — corrección: _______________ |
| Segundo piso en madera exige informe de cálculo estructural, sin importar tramo | Regla 6; Documento #7 | Pendiente de validación | ☐ Correcto ☐ Incorrecto — corrección: _______________ |
| Valor de la UF al 4-feb-2016: $25.629,09 CLP | Cálculo interno de los tramos en UF (Reglas 5 y 7) | **Citado** — verificado contra sii.cl (fuente oficial) y corroborado con valoruf.cl. Este valor específico no depende de que se confirmen los tramos: si los tramos cambian, este dato sigue siendo válido como conversión de UF a pesos para esa fecha exacta. | ☐ Correcto ☐ Incorrecto — valor correcto: _______________ |

**¿Falta algún criterio normativo relevante que el sistema debería estar considerando y hoy no considera?**
___________________________________________________________________________
___________________________________________________________________________

---

## 5. Resultado del contraste normativo y próximos pasos

**Realizado por:** _______________________________________________

**Rol (equipo interno / colaborador / profesional externo, si aplica):** ____________________________

**Fecha del contraste:** ________________________________________________

**Fuentes oficiales efectivamente consultadas** (marcar las que correspondan):

☐ Ley 20.898, texto oficial — artículo(s) revisado(s): ___________________________

☐ OGUC (Ordenanza General de Urbanismo y Construcciones) — artículo(s) revisado(s): ___________________________

☐ Formularios/instructivos oficiales del MINVU — cuál(es): ___________________________

☐ Otra fuente oficial primaria: ___________________________

**Resultado general** (marcar una):

☐ El contenido normativo coincide con las fuentes oficiales consultadas y puede usarse tal como está.

☐ El contenido normativo requiere las correcciones indicadas en las observaciones de este documento antes de poder usarse.

☐ El contenido coincide en general con las fuentes oficiales, pero quedan dudas de interpretación o criterios que dependen de la práctica habitual de las DOM — se recomienda consultar a un profesional con experiencia en regularizaciones **específicamente para esos puntos** (indicar cuáles): ___________________________________________________________

**Observaciones generales adicionales:**
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
