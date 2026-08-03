# Release Notes — ObraBien Calcula

Notas de producto por grupo de trabajo cerrado. A diferencia de `BACKLOG_MASTER.md` (seguimiento técnico) y `CHANGELOG.md` (historial de versiones formales), este documento está pensado para leerse sin contexto de desarrollo: qué cambió para el usuario, qué se corrigió, y qué debería revisar QA antes de dar por cerrado el grupo.

---

## V1.1 — Grupo 1 (cerrado 02-ago-2026)

**Mejoras visibles para el usuario**
- Al hacer click en "Calculadoras" o "Proyectos" desde cualquier página, ahora se llega correctamente a la sección "¿Qué quieres construir?" del home, sin quedar tapada por el menú superior.
- El buscador ya no muestra un separador "·" vacío cuando un resultado no tiene descripción cargada (ej. "Construir una piscina", "Construir un radier").

**Correcciones**
- **Pilar / columna:** los campos "Alto" y "Profundidad" aparecían intercambiados en el resumen del proyecto, en el resultado final, en el proyecto guardado y en el texto generado para IA. El cálculo del hormigón nunca estuvo mal — solo la forma en que se mostraban las etiquetas. Corregido.
- **Guía "Instalar una lámpara o plafón de techo":** el aviso de seguridad mencionaba "el interruptor" por error (texto copiado de otra guía). Ahora hace referencia correctamente a la lámpara.

**Cambios internos relevantes**
- Ninguno que afecte el comportamiento fuera de lo anterior — cambios acotados a un componente de home y a dos correcciones de datos puntuales en la base de datos.

**Notas para QA**
- Verificar el scroll a "Calculadoras" tanto en desktop como en mobile, desde al menos 2 páginas distintas al home.
- Verificar Pilar/Columna con valores distintos de Alto y Profundidad en cada superficie (resumen, resultado, proyecto guardado, prompt IA).
- Confirmar que la guía de "Cambiar un interruptor de luz" no se vio afectada (mismo texto, sin tocar).

---

## V1.1 — Grupo 2 (cerrado 02-ago-2026)

**Mejoras visibles para el usuario**
- Al escribir "0" en un campo de medida (largo, ancho, diámetro, etc.), el dibujo y el cálculo en vivo ahora muestran "0" correctamente, en vez de verse como si el campo estuviera vacío.
- El mensaje "Completa todos los campos con un número mayor que 0" ya no queda pegado en pantalla después de corregir el dato — desaparece apenas se empieza a corregir.
- **Radier:** si se ingresa un largo o ancho fuera de lo común (por ejemplo, varios cientos de metros), ahora aparece una advertencia suave — "Eso es inusualmente grande para este dato — ¿es correcto?" — sin bloquear el avance, para ayudar a detectar errores de tipeo.

**Correcciones**
- El comportamiento de arriba (valor "0") aplicaba a cualquier calculadora con campos de medida (Radier, Pilar/Columna, Fundación, Piscinas, y las que usan superficie por largo×ancho como Cerámica) — quedó corregido de forma transversal, no módulo por módulo.

**Cambios internos relevantes**
- Se revisó cada lugar del código que usa la función compartida de conversión de texto a número, para confirmar que el cambio no afecta otros cálculos ya existentes (ninguno lo hacía).

**Notas para QA**
- Probar "0" en Radier, Pilar/Columna, Piscina circular y Cerámica — el valor debe verse reflejado, no en blanco.
- Confirmar que valores negativos siguen sin mostrarse en la vista previa (comportamiento sin cambios, a propósito).
- Confirmar que un valor extremo en Largo/Ancho de Radier muestra la advertencia suave, y que igual se puede continuar si el usuario confirma que el dato es correcto.

---

## V1.1 — Grupo 3 (cerrado 03-ago-2026)

**Mejoras visibles para el usuario**
- **Piscina circular y Excavación circular:** la explicación de cómo se calculó el volumen ahora muestra la fórmula real de un círculo (diámetro y profundidad), en vez de un cálculo tipo "ancho × alto" que no correspondía a la forma de la piscina/excavación. El número mostrado nunca estuvo mal, solo la explicación.
- **Piscina circular y Piscina rectangular:** el primer paso del formulario (antes de preguntar el espesor de los muros) decía "Volumen de hormigón" cuando en realidad ese número es el volumen de agua de la piscina. Ahora dice "Volumen de agua (referencial)". El resultado final del cálculo (que sí distingue agua de hormigón) no cambió.

**Correcciones**
- Ver mejoras arriba — ambas son correcciones de textos/explicaciones, no de cálculos.

**Cambios internos relevantes**
- Durante la implementación se detectó que Piscina rectangular tenía el mismo problema de etiqueta que Piscina circular (reportado originalmente solo para la variante circular) — se corrigió también por ser el mismo defecto en un módulo hermano.

**Notas para QA**
- Verificar Piscina circular, Piscina rectangular y Excavación circular: revisar que el número del primer paso no cambió, solo el texto que lo acompaña.
- Confirmar que Excavación circular (que ya tenía la etiqueta correcta) no quedó con doble texto ni etiqueta duplicada.

---

## V1.1 — Grupo 5 (cerrado 03-ago-2026)

**Mejoras visibles para el usuario**
- **Radier y Pintura:** cuando se llega desde un acceso rápido que ya trae una opción preseleccionada (ej. "Construir un estacionamiento" o "Pintar un muro interior"), ya no aparece el mensaje "¿No sabes cuál elegir?" con una sugerencia distinta a la ya elegida. En su lugar aparece un mensaje de confirmación: "Detectamos que quieres construir este radier para: Estacionamiento. Puedes cambiar esta selección si lo deseas." — la opción sigue siendo 100% editable.

**Correcciones**
- Se revisó el hallazgo BUG-004 ("el parámetro `?tipo=` no preselecciona nada") y se determinó que la conclusión original era incorrecta: la opción sí quedaba correctamente preseleccionada, solo que el mensaje de ayuda que la acompañaba era confuso. Se cierra como "Hipótesis descartada tras verificación" y se documenta el error de auditoría para evitar confusión futura.

**Cambios internos relevantes**
- Se investigó toda la base de datos en busca de otros módulos con el mismo patrón de preselección por query param antes de implementar, para asegurar una solución reutilizable y no específica de Radier. Resultado: solo Radier y Pintura usan este patrón actualmente.

**Notas para QA**
- Verificar Radier vía "Construir un estacionamiento" y Pintura vía su acceso con `?tipo=muro-interior`: debe verse el mensaje de confirmación, no el helper genérico.
- Confirmar que ambos módulos, accedidos SIN el query param (flujo normal), siguen mostrando el helper "¿No sabes cuál elegir?" sin cambios.
- Confirmar que la opción preseleccionada sigue pudiendo cambiarse con normalidad y que el resto del asistente avanza correctamente tras el cambio.

---

## V1.1 — Grupo 4A (cerrado 03-ago-2026)

**Mejoras visibles para el usuario**
- En cualquier calculadora con varios campos de medida en un mismo paso (ej. Pilar/Columna, Fundación), al usar "Cambiar" junto a un campo específico del panel "Tu proyecto", ahora el cursor queda en ese campo puntual — antes siempre quedaba en el primer campo del paso, obligando a buscar manualmente el que se quería corregir.

**Correcciones**
- BUG-003: se confirmó que el problema no era exclusivo de Pilar/Columna — afectaba a los 3 tipos de paso con varios campos agrupados del framework (medidas simples, medidas con profundidad/volumen, y Fundación con sus 5 medidas). Se corrigió una sola vez a nivel del asistente, no módulo por módulo.

**Cambios internos relevantes**
- El asistente ahora recuerda qué campo puntual se pidió editar y se lo pasa al paso correspondiente; ese recuerdo se limpia automáticamente al avanzar, volver o reiniciar, para que nunca interfiera con la navegación normal.

**Notas para QA**
- Probar "Cambiar" sobre cada campo de Pilar/Columna (Ancho, Alto, Profundidad) y confirmar que el cursor queda exactamente en el campo clickeado.
- Probar lo mismo en Fundación (5 campos: Largo, Ancho base, Alto base, Ancho cuello, Alto cuello), incluyendo el último campo (antes nunca podía recibir foco automático).
- Confirmar que la navegación normal (sin usar "Cambiar") sigue enfocando el primer campo del paso, sin cambios.

---

## V1.1 — Grupo 4B (cerrado 03-ago-2026)

**Mejoras visibles para el usuario**
- Si se recarga la página o se vuelve con "atrás" del navegador a mitad de una calculadora, ya no se pierde todo el progreso: al volver a entrar a esa misma calculadora aparece el mensaje "Encontramos un cálculo sin terminar. ¿Quieres continuar donde quedaste?", con las opciones "Continuar" (retoma exactamente donde quedó) o "Comenzar de nuevo" (empieza en blanco). Nunca se retoma sin preguntar.
- El progreso guardado automáticamente se olvida solo a los 30 días, o apenas se termina el cálculo (no vuelve a ofrecerse un cálculo ya completado).

**Correcciones**
- BUG-007: resuelto para todas las calculadoras por igual (mecanismo genérico del asistente, no módulo por módulo).

**Cambios internos relevantes**
- Antes de implementar se detectó que ya existía un guardado en el navegador (localStorage) para el botón "Guardar y seguir después", con una forma de datos distinta al nuevo autoguardado. Se unificaron ambos en un solo mecanismo por calculadora, sin cambiar el comportamiento ya aprobado de "Guardar y seguir después" (ese sigue retomando sin preguntar, a diferencia del autoguardado nuevo, que siempre pregunta).
- Decisión de arquitectura (usuario): solo localStorage del mismo dispositivo/navegador — no hay sincronización entre dispositivos ni borradores compartidos.

**Notas para QA**
- Empezar Pilar/Columna, responder 1-2 pasos, recargar la página (F5) y confirmar que aparece el mensaje de "cálculo sin terminar" — no que se pierde todo ni que se restaura solo.
- Probar "Continuar": debe volver exactamente al paso y los valores donde se quedó.
- Probar "Comenzar de nuevo": debe empezar completamente en blanco, sin rastro del intento anterior.
- Confirmar que "Guardar y seguir después" (link bajo "Siguiente" en pasos con diagrama) sigue funcionando igual que antes: guarda, vuelve a Inicio, y al reabrir la calculadora retoma sin preguntar.
- Confirmar que terminar un cálculo hasta el resultado no deja un "cálculo sin terminar" pendiente si se vuelve a entrar después.

---

## Sprint UX — Proyecto "Construir una piscina" (cerrado 03-ago-2026)

**Mejoras visibles para el usuario**
- **Excavación (rectangular y circular):** la pregunta "¿Qué tipo de terreno es?" ahora explica por qué se pregunta — afecta cuánta tierra sobra al excavar y cuántos viajes de camión hacen falta.
- **Excavación (rectangular y circular):** el mensaje "Mide el hoyo terminado, no la marca en el suelo" ahora también aclara explícitamente que el hoyo va más ancho y profundo que la piscina terminada (espacio para moldaje y muro) — antes esa aclaración solo existía, a medias, en la variante circular.
- **Excavación (rectangular y circular):** el resultado "Retiro en camión" ahora muestra el supuesto usado ("Asumiendo un camión tolva chico, ~6 m³ por viaje — la capacidad real varía según el proveedor"). La variante circular, que antes no calculaba esto en absoluto, ahora lo hace igual que la rectangular.
- **Proyecto "Construir una piscina" (y cualquier plan de fases):** al terminar una fase, la acción principal ya no es solo "Guardar" — ahora es **"Continuar con: [fase siguiente]"**, que guarda y salta directo al cálculo de la fase siguiente. "Guardar proyecto" queda como acción secundaria. En la última fase del plan (sin fase siguiente), el comportamiento no cambia.

**Correcciones**
- Ninguna — este sprint fue enteramente de mejoras UX sobre un flujo ya funcional, no corrección de bugs.

**Cambios internos relevantes**
- El botón "Continuar con: [fase siguiente]" resuelve el destino en el servidor (misma lógica de resolución de forma rectangular/circular que ya usa `/plan/[slug]`, extraída a un archivo compartido `src/lib/plan-shape.ts` para no duplicarla). Cuando la fase siguiente tiene más de un módulo posible sin forma resuelta (ej. la fase "Terminar el entorno", con 4 opciones), el botón cae de vuelta al flujo de siempre (vuelve a `/plan/[slug]` con el banner "Sigue con…") en vez de intentar adivinar.
- Se agregó paridad entre las 2 variantes de excavación (antes la circular no tenía pregunta ni cálculo de retiro en camión) — mismo patrón, sin tocar el cálculo de volumen existente.

**Notas para QA**
- Verificar el helpText de "tipo de terreno" en Excavación rectangular y circular (ícono de información junto a la pregunta).
- Verificar que el texto de aclaración piscina-vs-hoyo aparece igual en ambas variantes de excavación, siempre visible (no hace falta abrir nada).
- Verificar que "Retiro en camión" muestra el texto del supuesto de 6 m³ en ambas variantes, y que la circular ahora sí pregunta "¿Cómo vas a retirar la tierra excavada?".
- Probar el flujo completo del plan "Construir una piscina": Fase 1 (Excavación) → clic en "Continuar con: 2. Construir la piscina" → debe llegar directo al módulo de la piscina (misma forma rectangular/circular elegida), sin pasar por `/plan/[slug]`, y la Fase 1 debe quedar marcada como completada.
- Fase 2 (Piscina) → clic en "Continuar con: 3. Terminar el entorno" → como esa fase tiene 4 módulos posibles, debe caer en `/plan/[slug]` con el banner de siempre, no en un módulo específico.
- Confirmar que un módulo usado FUERA de un plan (sin `?plan=`) sigue mostrando un único botón "Guardar como proyecto", sin cambios.
- Confirmar en mobile (375px) que el botón "Continuar con: [fase]" no genera overflow horizontal.

---
