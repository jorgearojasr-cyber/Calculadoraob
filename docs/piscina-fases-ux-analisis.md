# Análisis UX — Proyecto "Construir una piscina"

**Fecha:** 03-ago-2026
**Estado:** Propuesta de diseño para validar. **Ningún cambio implementado todavía.**
**Origen:** Prueba de uso real reportada por el usuario, 5 oportunidades a evaluar.

Metodología: para cada punto se investigó primero el estado real del código/datos (motor de fórmulas, preguntas, `module-visual-config.ts`, `plan/[slug]/page.tsx`, `plan-view.tsx`, `result-screen.tsx`) antes de proponer nada — varios puntos ya tienen una solución parcial existente que conviene extender en vez de reemplazar.

---

## 1. Explicar tipo de terreno y su efecto en el cálculo

**Estado actual:** La pregunta "¿Qué tipo de terreno es?" (Tierra normal / Con arcilla o piedras) ya existe en ambos módulos de excavación (rectangular y circular) y **sí afecta el cálculo real**: alimenta un factor de esponjamiento (25% vs. 35%) que determina el volumen de tierra suelta a retirar. Pero la pregunta en sí no tiene `helpText` — la explicación del "por qué" solo vive enterrada en la nota de la fórmula de resultado, no junto a la pregunta donde el usuario decide.

Importante: el modelo actual **solo afecta volumen/material a retirar**, no tiempo ni dificultad ni costo — esos tres no están calculados hoy por ningún módulo. Pedir "explicar cómo afecta tiempo, dificultad y costos" tal como está planteado en el pedido original excede lo que el sistema realmente calcula hoy.

**Impacto en la experiencia:** Alto y de bajo costo — es una pregunta que el usuario ya responde a ciegas; explicarla aumenta la confianza sin tocar ningún cálculo.

**Complejidad de implementación:** Baja. Agregar `helpText` a la pregunta existente (incluso reutilizando el texto que ya existe en la nota de la fórmula) — incluye backfill de datos, sin tocar componentes.

**Riesgos:** Si se promete explícitamente que afecta "tiempo, dificultad y costos" sin que el sistema calcule esas tres cosas, se genera una expectativa falsa. Mitigable siendo honesto en el texto: explicar que afecta cuánto material sobra por retirar (volumen/transporte), y dejar "tiempo y dificultad" como una extensión futura ligada al punto 4 (método de excavación), no resuelta hoy.

**Recomendación:** Implementar ahora el `helpText` honesto sobre el efecto real (volumen/esponjamiento/transporte). Difirir cualquier mención de tiempo/dificultad hasta que el punto 4 (método de excavación) esté decidido, para no prometer algo que no existe todavía.

**Prioridad:** Alta (bajo costo, alto impacto, sin riesgo de romper nada).

---

## 2. Evitar confundir tamaño de piscina terminada con tamaño de excavación

**Estado actual:** Ya existe una aclaración — pero inconsistente entre variantes. La excavación **circular** tiene, solo en el campo "Diámetro", el texto: *"Mide el hoyo terminado, no la piscina. El hoyo va más ancho que la piscina para dejar espacio de moldaje y el espesor del muro."* La excavación **rectangular** no tiene esta aclaración en ningún campo — solo el texto genérico "Mide el hoyo terminado, no la marca en el suelo", que aclara excavación-vs-marca-en-el-suelo pero no excavación-vs-piscina-terminada (que es el problema real reportado).

Además, confirmé que **no hay ni puede haber** vínculo automático de datos entre la piscina y la excavación en el orden actual del plan: la fase de Excavación ocurre *antes* de que exista una piscina guardada (fase 2), a diferencia de la fase 3 ("Terminar el entorno"), que sí hereda medidas de la piscina ya construida vía `ContornoAreaField`. Esto es correcto y refleja el orden real de una obra (se excava antes de construir) — no es un bug de datos, es una limitación de secuencia esperable.

**Impacto en la experiencia:** Alto. Es exactamente el tipo de confusión que lleva a subestimar la excavación y quedarse corto de espacio para moldaje/muro — un error caro de corregir en obra real.

**Complejidad de implementación:** Baja-media.
- Baja: igualar el `helpText` del diámetro circular también en el/los campos de la variante rectangular (largo/ancho), y subir la aclaración a nivel de `groupHelpText` (visible siempre, no solo al abrir un campo) en ambas variantes, no solo circular.
- Media (opcional, mayor valor): agregar una guía activa tipo "si ya sabes las medidas de tu piscina terminada, súmale ~X cm por lado para el molde y muro" — requiere decidir un valor de referencia (¿15 cm? ¿20 cm?) y si se presenta como sugerencia editable o solo como texto.

**Riesgos:** Si se ofrece un valor sugerido de holgura (los "X cm extra") sin marcarlo claramente como aproximado, puede leerse como una recomendación técnica verificada cuando es una práctica general — mismo patrón de advertencia ya usado en otros norms del proyecto (`PRACTICA_GENERAL_NO_VERIFICADA`), que debería reutilizarse aquí también.

**Recomendación:** Hacer ya el fix de consistencia (mismo helpText/groupHelpText en ambas variantes) — bajo riesgo, corrige la confusión reportada. Evaluar la guía activa de holgura sugerida como una iteración separada, marcada explícitamente como práctica general no verificada, igual que el resto de los norms de esponjamiento/dosificación.

**Prioridad:** Alta (el fix de consistencia); Media (la guía de holgura sugerida, como mejora adicional).

---

## 3. Transporte de material — mostrar el supuesto y evaluar selección de camión

**Estado actual:** Solo la variante **rectangular** de excavación tiene cálculo de transporte (la circular no tiene esta pregunta/fórmula en absoluto — inconsistencia entre variantes, independiente de lo pedido). El resultado "Retiro en camión" usa una capacidad de **6 m³ por viaje hardcodeada como literal en la fórmula**, no como pregunta ni como `Variable` configurable. El supuesto está documentado en la nota del norm (*"camión tolva chico (6 m³)... la capacidad real varía por proveedor"*) pero esa nota no se le muestra al usuario en el resultado — el usuario solo ve el número de viajes, sin saber de dónde sale.

**Impacto en la experiencia:** Alto para mostrar el supuesto (transparencia inmediata, bajo costo). Medio-alto para permitir elegir tipo de camión (más control, pero para un cálculo que ya se declara aproximado, el valor marginal de precisión es menor que el de simplicidad).

**Complejidad de implementación:**
- Mostrar el supuesto en el resultado: Baja. Es solo exponer el texto que ya existe en la nota del norm, junto al número de viajes en el resultado (ej. "Retiro en camión: 4 viajes (asumiendo camión tolva chico, 6 m³ por viaje)").
- Permitir elegir tipo de camión: Media. Requiere convertir el literal `6` en una `Variable` tipo LOOKUP igual al patrón ya usado para "tipo de terreno" (mismo mecanismo, ya probado en el código) — técnicamente no es nuevo terreno, es replicar un patrón existente.
- Además, corregir que `excavacion-circular` no tiene esta pregunta/fórmula en absoluto — hoy un usuario de piscina circular ni siquiera ve esta sección.

**Riesgos:** Agregar selección de camión sin datos reales de capacidad por tipo (los actuales ya están marcados como no verificados) puede dar una falsa sensación de precisión ("elegí camión grande, el número debe ser exacto") cuando sigue siendo una aproximación general. Mitigable manteniendo la misma advertencia de "práctica general, no verificado" visible también en la variante con selección.

**Recomendación:** Hacer primero (1) mostrar el supuesto en el resultado y (2) agregar la pregunta/fórmula de transporte también a la variante circular (paridad entre variantes) — ambos de bajo riesgo y encierran el problema real reportado (falta de transparencia). Selección de tipo de camión: evaluarla como mejora posterior, no bloqueante — el valor de dejar elegir 2-3 tamaños de camión es real pero secundario frente a simplemente ser transparente con el supuesto actual.

**Prioridad:** Alta (mostrar supuesto + paridad circular/rectangular); Baja-Media (selección de tipo de camión).

---

## 4. Incorporar método de excavación (manual, retroexcavadora, minicargador)

**Estado actual:** No existe ninguna pregunta de método de excavación en ningún módulo — confirmado. La única "pregunta de método" existente en todo el sistema es para hormigón (premezclado/preparar tú mismo; manual/bomba), en Fundación, Radier y ambas Piscinas. Este es el ítem más nuevo de los 5 — no hay nada parcial que extender.

**Impacto en la experiencia:** Alto potencial (responde una pregunta real de presupuesto: "¿cuánto me demoro/cuesta según cómo lo haga?"), pero es la pieza que más se aleja de lo que la app calcula hoy (volumen de materiales), entrando en terreno de tiempos y costos de mano de obra/maquinaria — un dominio con mucha más variabilidad regional que el resto de los cálculos actuales.

**Complejidad de implementación:** Media-alta.
- Agregar la pregunta en sí (SELECT con 3-4 opciones): baja, mismo patrón de siempre.
- Estimar **tiempo** aproximado por método: requiere una tabla de referencia (m³/hora o similar) por método, y probablemente ajustada también por tipo de terreno (cruce de 2 preguntas ya existentes/nuevas) — complejidad media.
- Estimar **costo** aproximado: alta. A diferencia de material (que tiene un precio de mercado relativamente estable), el costo de mano de obra/arriendo de maquinaria varía mucho por región y proveedor — mayor riesgo de que el número mostrado se perciba como una cotización real.

**Riesgos:** Es el punto de mayor riesgo reputacional de los 5. Un número de "costo aproximado de excavación con retroexcavadora" que resulte muy distinto a una cotización real en la zona del usuario puede dañar la confianza en toda la app, no solo en este módulo — más aún tratándose de maquinaria/mano de obra, no de material con precio de referencia razonablemente estable. Es el mismo patrón de riesgo ya identificado y mitigado en otros norms del proyecto (`PRACTICA_GENERAL_NO_VERIFICADA`, `reinforcedWarning: true`), pero aquí el rango de variación esperable es mayor.

**Recomendación:** Separar en 2 fases si se decide avanzar:
1. Agregar la pregunta de método + una estimación de **tiempo aproximado** (rango de días, con advertencia fuerte de "referencial, no una cotización") — más defendible, menos volátil que un monto en pesos.
2. Evaluar costo en pesos como una iteración posterior, solo si la Fase 1 valida bien con usuarios reales, y siempre con el mismo nivel de advertencia reforzada que ya usa el resto de norms no verificados.

No implementar costo en dinero en la primera pasada sin una fuente de referencia real (ej. tarifas de arriendo de maquinaria de al menos una región) — hacerlo solo con una suposición interna sería el ítem de mayor riesgo de los 5.

**Prioridad:** Media (tiempo aproximado, con advertencia); Baja por ahora (costo en dinero, hasta tener una fuente de referencia real).

---

## 5. Flujo de fases — continuar a la siguiente fase sin romper el concepto de plan

**Estado actual — esto es lo más distinto a la premisa del pedido**: el sistema **ya tiene** un mecanismo de continuidad entre fases, no es cierto que "el usuario termina una fase y solo puede guardar el proyecto":

- Al guardar el resultado de un módulo que viene de un plan, la fase se marca automáticamente como completada y el usuario es redirigido a `/plan/[slug]` (no a "Mis proyectos").
- Ahí aparece un banner "¡Fase lista! Sigue con: [fase siguiente]" — con un botón directo a la fase siguiente, **pero solo si esa fase tiene un único link posible** (porque ya se resolvió la forma rectangular/circular vía `?shape=` desde el inicio del plan).
- Si la fase siguiente tiene más de un link (ej. llegó sin `shape=` resuelto), el usuario debe elegir manualmente entre los botones de esa fase — no hay redirect automático a un módulo específico en ese caso.

El problema real reportado por el usuario, entonces, no es la ausencia total de continuidad, sino 2 fricciones concretas:
(a) Hay una parada intermedia obligatoria en `/plan/[slug]` incluso en el caso feliz (single-link) — un salto de página/contexto en vez de una continuación inmediata desde la propia pantalla de resultado.
(b) En el caso multi-link, no hay ninguna ayuda — el usuario vuelve a elegir desde cero, perdiendo el contexto de "vengo de la fase anterior".

**Impacto en la experiencia:** Alto. Reducir de "resultado → plan → banner → fase siguiente" (3 pantallas) a "resultado → fase siguiente" (1 clic) es el tipo de fricción que un usuario nota de inmediato en el caso más común (single-link).

**Complejidad de implementación:** Media.
- Caso single-link: `ResultScreen` ya tiene todo el contexto (`planContext`, y quien construye el link de la fase siguiente en `plan/[slug]/page.tsx` puede exponerse como prop) — se puede agregar un botón "Guardar y continuar con: [fase siguiente]" directamente ahí, que dispare el mismo `handleSaveProject` y navegue directo al módulo, en vez de pasar por `/plan/[slug]`. Complejidad media porque requiere pasar la info de "próxima fase resuelta" hasta `ResultScreen`, que hoy no la tiene.
- Caso multi-link (forma ambigua): más complejo — requeriría o bien mostrar los mismos botones de elección de forma directamente en `ResultScreen` (duplicando lógica de `plan-view.tsx`), o mantener el flujo actual (pasar por `/plan/[slug]`) solo para este caso. Recomiendo lo segundo para no duplicar la lógica de resolución de forma en 2 componentes.

**Riesgos:** Bajo, siempre que se preserve el botón/flujo actual como respaldo (ej. si el usuario prefiere ver el progreso general del plan antes de seguir, "Guardar como proyecto" simple sigue llevándolo a `/plan/[slug]` igual que hoy — solo se agrega un atajo, no se quita la opción existente). El riesgo principal es de alcance: no romper el concepto de "plan" (checkbox de fases, vista general) por optimizar el camino feliz — mitigable manteniendo `/plan/[slug]` como destino sigue disponible, solo agregando un atajo opcional.

**Recomendación:** Implementar el atajo para el caso single-link (la mayoría de los casos reales, dado que la mayoría de planes resuelven `shape=` desde el inicio) sin tocar el caso multi-link, que mantiene el flujo actual (pasar por `/plan/[slug]`, elegir manualmente). Esto captura la mayor parte del valor con la menor complejidad y sin duplicar lógica de resolución de forma.

**Prioridad:** Alta (atajo caso single-link); no aplica/diferir (caso multi-link, mantener como está).

---

## Resumen de prioridades

| # | Ítem | Prioridad | Complejidad |
|---|---|---|---|
| 1 | HelpText de tipo de terreno (efecto real: volumen/transporte) | Alta | Baja |
| 2 | Consistencia de aclaración excavación-vs-piscina (ambas variantes) | Alta | Baja |
| 3a | Mostrar supuesto de capacidad de camión + paridad circular/rectangular | Alta | Baja |
| 5 | Atajo "continuar a la fase siguiente" (caso single-link) | Alta | Media |
| 2b | Guía activa de holgura sugerida (cm extra) | Media | Media |
| 4a | Método de excavación + tiempo aproximado (con advertencia) | Media | Media-Alta |
| 3b | Selección de tipo de camión | Baja-Media | Media |
| 4b | Costo en dinero por método de excavación | Baja (diferir) | Alta |

Los 4 ítems de prioridad Alta comparten complejidad baja-media y bajo riesgo — candidatos naturales para un primer grupo de implementación, si se aprueba avanzar. Los ítems 4b (costo en dinero) y 3b (selección de camión) quedan como candidatos para una fase posterior, condicionados a validar los anteriores primero.

---

**Sin cambios de código en este documento.** Queda pendiente tu validación de este diseño antes de planificar la implementación.
