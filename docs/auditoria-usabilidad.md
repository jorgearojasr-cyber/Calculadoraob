# Auditoría de usabilidad para no-expertos

Objetivo: evaluar si una dueña de casa o un maestro sin estudios formales entendería
cada módulo de la calculadora sin ayuda externa — no es una revisión técnica de si el
código funciona, sino de si el lenguaje, el flujo y el apoyo visual son comprensibles
para alguien sin conocimiento previo del rubro.

Se llena por tandas, una categoría a la vez. No avanzar a la siguiente categoría sin
revisión.

## Rúbrica

Cada módulo se evalúa en 6 criterios (nota 1-5) más una nota global:

1. **Lenguaje sin jerga técnica** — ¿usa palabras que un maestro básico o una dueña de
   casa entendería sin buscar en internet?
2. **Autocontenido** — ¿la pregunta se explica sola, o asume conocimiento previo que el
   usuario probablemente no tiene?
3. **Diseño visual y comunicación gráfica** — ¿el diagrama comunica bien o es genérico y
   poco claro? ¿falta o sobra apoyo visual? ¿el color comunica riesgo real o es plano/
   decorativo? ¿el módulo se beneficiaría de un video corto (solo si hay una secuencia de
   movimientos/técnica física difícil de capturar en una imagen fija)? ¿los íconos son
   consistentes con el resto de la app?
4. **Resultado explicado, no solo entregado** — ¿el usuario entiende POR QUÉ le salen esos
   números, o es una caja negra? (estándar: la nota de cobertura de cajas/rollos de la
   Tanda B — "Cada caja cubre X m² → para Y m² + Z% de pérdida necesitas N cajas").
5. **Disclaimer proporcional al riesgo real** — ¿advierte fuerte donde corresponde (gas,
   estructural, eléctrico de instalación nueva) y NO sobre-advierte en reemplazos simples?
6. **Flujo lógico** — ¿el orden de preguntas tiene sentido para alguien que nunca ha hecho
   esto, o salta información / pide cosas en un orden confuso? Chequeo específico: ¿alguna
   pregunta requiere contexto/explicación que hoy solo está disponible DESPUÉS, en la guía
   o en "Errores comunes", en vez de en el momento de responder (patrón encontrado en
   Ducha, categoría Baño)?

Veredicto posible: **MANTENER** / **MEJORAR** / **FUSIONAR CON OTRO** / **ELIMINAR**.

## Hallazgo transversal confirmado: severidad visual de disclaimers

Investigado a fondo antes de la categoría 2 (no es un hallazgo de un módulo puntual, se
documenta una sola vez acá). Componente: `src/components/module/norms-disclaimer.tsx`
(`NormsDisclaimer`). **`reinforcedWarning` no se lee en absoluto en este componente** — el
único branching visual (ícono, color de fondo) depende de `verificationStatus`
(`CITADO` vs `PRACTICA_GENERAL_NO_VERIFICADA`), nunca de `reinforcedWarning`. Un aviso de
**gas** con `reinforcedWarning: true` y un aviso de, por ejemplo, un estanque de agua con
`reinforcedWarning: false` se ven **pixel-idénticos** en pantalla (mismo ícono
`TriangleAlert`, mismo fondo `bg-safety-tint`). El único lugar donde `reinforcedWarning`
tiene efecto es `prompt-generator.ts` (texto del prompt de IA, que el usuario ni ve a menos
que haga clic en "Generar prompt para IA"). Es un problema de plataforma, no de un módulo —
se resuelve una sola vez si se decide abordar, no módulo por módulo.

---

# Categoría: Baño

3 módulos. Los 3 comparten un patrón de disclaimer ya trabajado en vueltas anteriores de
esta sesión (pregunta reemplazo/instalación nueva + `aviso-instalacion-nueva` condicionado),
así que ese patrón no se repite como hallazgo por módulo salvo que haya algo puntual.

Nota transversal sobre color (aplica a los 3, no se repite abajo salvo excepción): ver
"Hallazgo transversal confirmado" arriba — `reinforcedWarning` no afecta ningún elemento
visual en pantalla, solo el texto del prompt de IA.

---

## WC (inodoro) (`cambiar-o-instalar-un-wc`)
Categoría: Baño
Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 4/5, Resultado 4/5,
Disclaimer 5/5, Flujo 5/5 — Global: 5/5

Veredicto: **MANTENER**

Motivo: Es el módulo mejor calibrado de la categoría. Lenguaje 100% cotidiano ("¿Tu llave
de paso/flexible actual está en buen estado?" en vez de jerga de gasfitería). El
disclaimer es exactamente proporcional: nada de advertencia fuerte para el reemplazo
simple (norma con `reinforcedWarning: false`), y una nota clara y acotada solo cuando el
usuario elige instalación nueva ("requiere trabajo de gasfitería... consulta a un
gasfíter certificado"). El resultado no necesita explicación de "por qué" porque son
cantidades triviales (1 WC, 1 tubo de silicona) — no hay caja negra que destapar.

Recomendación concreta: Ninguna funcional. Ver recomendación gráfica.

Recomendación gráfica: El apoyo visual actual (ninguno, porque no hay medidas que
ingresar) es suficiente — no hace falta diagrama para elegir entre 2 opciones de texto.
Único detalle menor: la tarjeta "Conexión de agua/desagüe nueva" (el aviso informativo de
instalación nueva) se ve visualmente idéntica a las tarjetas de materiales reales (mismo
borde blanco, mismo tamaño de texto), salvo que no tiene campo de precio — alguien
podría confundirla con un material más a comprar en vez de leerla como una advertencia.
Sugerencia: usar un fondo o borde levemente distinto (ej. el tono `safety-tint` ya usado en
otros banners de la app) para esa tarjeta específica, no para diferenciar severidad sino
para diferenciar "esto es información, no algo que compras".

---

## Lavamanos (`instalar-un-lavamanos`)
Categoría: Baño
Notas: Lenguaje 4/5, Autocontenido 4/5, Visual 3/5, Resultado 2/5,
Disclaimer 4/5, Flujo 3/5 — Global: 3/5

Veredicto: **MEJORAR**

Motivo: Es, en la práctica, una sola pregunta (sobre mueble vs. pedestal) seguida de una
lista fija de 5 materiales — nada varía con cantidades reales del usuario (siempre "1
lavamanos, 1 grifería, 1 sifón, 2 llaves de conexión, 1-2 tubos de silicona"). Esto no es
necesariamente malo (criterio 4 no exige que haya matemática compleja), pero como es una
lista fija sin ninguna cantidad derivada de un dato del usuario, no hay nada que
"explicar" — la caja negra no es un problema de opacidad, es que no hay cálculo real
detrás, y eso hace que el módulo se sienta más como un checklist con un paso extra de
wizard innecesario que como una calculadora. "Vanitorio" en la descripción del módulo
(no en las preguntas, que están bien) es jerga regional que no todos reconocen.

Recomendación concreta: Ninguna funcional urgente — no rompe nada, pero es candidato a
revisar si en algún momento se decide que los módulos deben justificar el paso de wizard
con al menos una cantidad calculada (ej. permitir elegir 1 o 2 lavamanos si el baño tiene
doble lavamanos, algo que si varía la cantidad real).

Recomendación gráfica: Ninguna — no hay medidas que ingresar, no aplica diagrama. Los
íconos de material (si los hay en las tarjetas de resultado) no se revisaron a nivel de
asset individual en esta pasada; serían consistentes al ser el mismo componente que WC y
Ducha.

---

## Ducha (`instalar-una-ducha`)
Categoría: Baño
Notas: Lenguaje 4/5, Autocontenido 3/5, Visual 4/5, Resultado 4/5,
Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: **MEJORAR**

Motivo: El diagrama de ancho×profundidad es correcto y consistente con el resto de la
app (mismo `MeasureDiagram` neutro, gris, con etiquetas claras — ver criterio 3). El punto
débil real es autocontenido: la pregunta "¿Necesitas impermeabilizar los muros de la
ducha?" no explica CUÁNDO hace falta. Un usuario sin experiencia no sabe si su caso
(¿muro de albañilería con cerámica nueva? ¿panel de ducha prefabricado? ¿ya estaba
impermeabilizado de antes?) requiere sí o no. La app SÍ tiene la explicación — pero está
en "Errores comunes" de la guía, que el usuario lee recién en la pantalla de resultado,
después de haber contestado la pregunta a ciegas. La lógica del cálculo (rollos de
membrana condicionados a esta respuesta, con norma `OBRA-IMPERMEABILIZACION-RENDIMIENTOS`
citada en el resultado) está bien y es transparente.

Recomendación concreta: Agregar `helpText` a la pregunta
`necesitas-impermeabilizar-los-muros`, algo como: "Sí, si vas a poner cerámica u otro
revestimiento sobre un muro de albañilería, yeso cartón o similar. No, si tu ducha es un
panel/cabina prefabricada, o si el muro ya está impermeabilizado de una instalación
anterior." — moviendo la explicación del "Errores comunes" (que se puede dejar igual,
sirve como refuerzo) a un lugar donde el usuario la vea ANTES de responder, no después.

Recomendación gráfica: Ninguna para el diagrama de dimensiones (ya es claro). No aplica
video — la ducha no tiene una técnica de aplicación con secuencia de movimientos que un
diagrama estático no pueda capturar (a diferencia de, por ejemplo, aplicar silicona en un
ángulo específico, que sí podría beneficiarse de video si se quisiera ser exhaustivo, pero
es un nivel de detalle que hoy no tiene ningún otro módulo de la app — no lo priorizaría
solo para Ducha sin criterio consistente para el resto).

---

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| WC (inodoro) | 5/5 | MANTENER |
| Lavamanos | 3/5 | MEJORAR |
| Ducha | 4/5 | MEJORAR |

Hallazgo transversal (no específico de un módulo): la severidad del disclaimer no se
comunica con color en ningún módulo de la app — vale la pena decidir en algún momento si
se aborda a nivel de plataforma (fuera del alcance de esta auditoría por categoría).

---

# Categoría: Electricidad

2 módulos. Elegida como tanda 2 porque ambos se tocaron activamente esta sesión (el
rediseño reemplazo/instalación nueva de "Enchufes, interruptores y cableado", y la
verificación del patrón condicional) — vale la pena validar el trabajo reciente bajo esta
misma lupa de usabilidad.

---

## Enchufes, interruptores y cableado (`cable-cajas-y-placas`)
Categoría: Electricidad
Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 3/5, Resultado 4/5,
Disclaimer 5/5, Flujo 5/5 — Global: 4/5

Veredicto: **MANTENER**

Motivo: El disclaimer es el mejor calibrado de toda la auditoría hasta ahora — la propia
guía distingue explícitamente "tú mismo, con cuidado básico" para reemplazo vs. "contrata
a alguien certificado" para cableado nuevo, en vez de un texto único sobre-advirtiendo el
caso simple (revisado y verificado en navegador la vuelta anterior de esta sesión). El
flujo es impecable: la primera pregunta bifurca correctamente el resto del wizard, sin
pedir datos irrelevantes para el caso elegido. Único punto débil: criterio 3 (visual) — ni
el flujo de reemplazo ni el de instalación nueva tienen ningún apoyo gráfico (sin
diagrama, sin ícono distintivo), lo cual es razonable dado que no hay medidas físicas que
representar, pero el contraste entre "Fácil, tú mismo" (reemplazo) e "Difícil, contrata
electricista" (instalación nueva) es un caso donde un ícono o color distinto por rama
ayudaría a que el usuario capte la diferencia de riesgo de un vistazo, no solo leyendo el
texto de la guía.

Recomendación concreta: Ninguna funcional — el copy y el flujo ya están bien.

Recomendación gráfica: Ninguna crítica. Si se quisiera pulir: un ícono o badge distinto
junto al título del resultado según `tipo-trabajo` (ej. un ícono de "check simple" para
reemplazo vs. un ícono de advertencia para instalación nueva) — bajo prioridad, el texto
ya comunica la diferencia correctamente, esto sería un refuerzo, no una corrección de un
problema real.

---

## Calcular consumo eléctrico de un circuito (`calcular-consumo-electrico-de-un-circuito`)
Categoría: Electricidad
Notas: Lenguaje 4/5, Autocontenido 5/5, Visual 4/5, Resultado 3/5,
Disclaimer 5/5, Flujo 4/5 — Global: 4/5

Veredicto: **MANTENER**

Motivo: El punto más fuerte de este módulo es autocontenido (5/5): en vez de solo pedir
"suma la potencia total en Watts" y dejar al usuario adivinar, ofrece una lista
seleccionable de electrodomésticos comunes con su consumo típico (microondas ~1200W,
hervidor ~1800W, etc.) y un contador de "Potencia total" en vivo — resuelve exactamente el
problema de que un usuario no-experto no sabe convertir su realidad ("tengo el
microondas, el hervidor y 5 ampolletas prendidos") a Watts. El disclaimer es proporcional:
`reinforcedWarning: true` con checkbox de confirmación explícito, apropiado para un cálculo
que alimenta una decisión eléctrica real. El punto débil es criterio 4 (resultado
explicado): la pantalla de resultado muestra "Automático sugerido: 16 A" y "Corriente
calculada: 13,64 A" como dos líneas separadas sin conectarlas — el automático sugerido en
realidad NO se deriva de la corriente calculada de este caso puntual, es un valor típico
fijo según el tipo de circuito elegido (iluminación/enchufes/dedicado), y solo si la
corriente calculada supera ese típico aparece un aviso de sobrecarga aparte. Un usuario
no-experto probablemente asume que "automático sugerido" fue calculado a partir de "su"
13,64 A, cuando en realidad es un valor de referencia por categoría — la relación entre
ambos números no se explica en pantalla.

Recomendación concreta: Agregar una frase corta bajo "Automático sugerido" aclarando el
origen del número, ej.: "Valor típico para circuitos de este tipo — si tu corriente
calculada lo supera, te avisamos aparte." Esto conecta explícitamente las dos cifras y
evita que el usuario piense que hay una inconsistencia o que el cálculo "no cuadra".

Recomendación gráfica: Ninguna — no hay medidas físicas que representar con diagrama, y el
selector de electrodomésticos con checkboxes + contador en vivo ya es el apoyo visual
correcto para este caso (sustituye la necesidad de cualquier diagrama). No aplica video —
es una tarea de cálculo/lectura de etiquetas, no una técnica física con secuencia de
movimientos.

---

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Enchufes, interruptores y cableado | 4/5 | MANTENER |
| Calcular consumo eléctrico de un circuito | 4/5 | MANTENER |

Sin hallazgos transversales nuevos en esta tanda (el hallazgo de color de disclaimers ya
quedó documentado una sola vez, arriba del todo).

---

# Categoría: Gas

2 módulos. Elegida como tanda 3 por continuidad temática directa con Electricidad
(sistemas domiciliarios de riesgo real) y porque Calefón a gas se investigó a fondo la
vuelta anterior (condicionamiento de fórmulas) — vale la pena documentarlo bajo esta misma
lupa mientras está fresco.

---

## Cañería de gas visible (`caneria-de-gas-visible`)
Categoría: Gas
Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 3/5, Resultado 3/5,
Disclaimer 5/5, Flujo 4/5 — Global: 4/5

Veredicto: **MANTENER**

Motivo: El disclaimer es el más robusto de toda la auditoría hasta ahora — no es solo
texto, es una **fricción activa**: el botón "Ver resultado" queda visualmente deshabilitado
(gris) hasta que el usuario marca el checkbox de confirmación ("Confirmo que el diámetro y
la especificación... fueron entregados por un instalador de gas certificado SEC"). Es un
patrón de disclaimer proporcional al riesgo real (gas) que ningún otro módulo de las 2
categorías previas usa con esta fuerza — vale la pena replicarlo donde el riesgo lo
justifique. El lenguaje es plano (diámetros en pulgadas "1/2"" / "3/4"", sin jerga de
roscas ni normas de cañería). Punto débil, criterio 4: el resultado dice "1 **tramos**"
(debería decir "1 tramo", plural mal usado cuando la cantidad es 1 — el `unit` de la
Formula es un string fijo "tramos" que no se singulariza). Además, el "resultado
explicado" es débil porque no hay ninguna nota tipo "X metros ÷ Y metros por tramo
comercial = Z tramos" — a diferencia del estándar de cobertura de cajas/rollos de la Tanda
B, acá la cantidad de tramos aparece sin ninguna pista de cómo se llegó a ese número.

Recomendación concreta: (1) Corregir el `unit` de la fórmula `tramos-de-caneria` para que
pluralice correctamente (ej. "tramo" cuando la cantidad es 1, "tramos" cuando es más de 1 —
esto es un problema transversal de formato de unidades, no exclusivo de este módulo, así
que si se aborda conviene revisarlo a nivel de plataforma). (2) Agregar una nota corta al
resultado explicando el criterio de tramo comercial usado (ej. "Tramos de X metros
comerciales, redondeado hacia arriba").

Recomendación gráfica: Ninguna — no hay medidas físicas que representar con diagrama más
allá del número de metros que el usuario ya trae de su instalador. No aplica video.

Nota de alcance (no afecta la nota, es contexto): el público real de este módulo ya tiene
una especificación entregada por un profesional certificado — es más una herramienta de
verificación/presupuesto para alguien que ya habló con su instalador que una calculadora
de descubrimiento para quien no sabe nada del tema. Es un caso de uso válido pero angosto;
no amerita ELIMINAR ni FUSIONAR, solo señalarlo como contexto de audiencia.

---

## Instalar un calefón a gas (`instalar-un-calefon-a-gas`)
Categoría: Gas
Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 3/5, Resultado 4/5,
Disclaimer 5/5, Flujo 5/5 — Global: 5/5

Veredicto: **MANTENER**

Motivo: El mejor módulo evaluado hasta ahora en la auditoría. La primera pregunta traduce
litraje técnico a lenguaje de tamaño de vivienda ("1-2 puntos (departamento chico)", "3-4
puntos (casa mediana)", "5+ puntos (casa grande)") — un usuario no sabe cuántos litros/min
necesita, pero sí sabe qué tan grande es su casa. El flujo reemplazo/instalación nueva ya
fue verificado en navegador la vuelta anterior: ambos casos muestran los mismos 4
materiales de conexión (llave de paso, conexión flexible, sombrerete — confirmado con el
dueño de producto que aplican a ambos casos, no solo instalación nueva) y solo instalación
nueva agrega el aviso de cañería adicional. El disclaimer usa el mismo patrón de checkbox
obligatorio que Cañería de gas visible. Nada que corregir.

Recomendación concreta: Ninguna.

Recomendación gráfica: Ninguna — no hay medidas físicas que representar (la elección es por
categoría de tamaño, no por dimensión numérica). No aplica video — no hay una técnica de
instalación que el usuario mismo ejecute (el disclaimer es explícito en que la instalación
completa la hace un instalador certificado, no el usuario).

---

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Cañería de gas visible | 4/5 | MANTENER |
| Instalar un calefón a gas | 5/5 | MANTENER |

Hallazgo nuevo: pluralización incorrecta de unidades — ver lista acumulada al final del
archivo, sección "Hallazgo transversal: pluralización".

---

# Categoría: Agua

2 módulos. Tanda 4, continuación directa del mismo eje temático que Electricidad y Gas
(sistemas domiciliarios con riesgo real, aunque de menor severidad que gas — daño
material por filtración, no riesgo de vida).

---

## Cañería y conexiones (fittings) (`caneria-y-fittings`)
Categoría: Agua
Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 3/5, Resultado 3/5,
Disclaimer 4/5, Flujo 5/5 — Global: 4/5

Veredicto: **MANTENER**

Motivo: Mismo patrón que Cañería de gas visible (convierte una especificación ya
entregada por un gasfíter a cantidad de material) pero con un detalle bien resuelto que
el módulo de gas no tiene: acá "Tramos de cañería" sí pluraliza correctamente cuando la
cantidad es 1 ("1 tramo de 6m", no "1 tramos") — confirma que la corrección de
pluralización no es sistémica en el código, sino que depende de cómo se escribió el
`unit` en cada Formula individual (ver hallazgo transversal al final). Disclaimer
proporcional: `reinforcedWarning: true` pero sin el checkbox de fricción activa que sí
tiene Gas — decisión razonable dado que una filtración de agua es daño material, no un
riesgo de vida como una fuga de gas; no es sobre-advertencia ni sub-advertencia.

Recomendación concreta: Ninguna funcional urgente. Ver hallazgo de pluralización
("Conexiones y accesorios — 4 unidad" debería decir "4 unidades") en la lista transversal.

Recomendación gráfica: Ninguna — no hay medidas físicas que representar más allá de los
metros que el usuario ya trae de su especificación.

---

## Instalar un estanque acumulador de agua (`instalar-estanque-acumulador-de-agua`)
Categoría: Agua
Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 3/5, Resultado 5/5,
Disclaimer 4/5, Flujo 5/5 — Global: 5/5

Veredicto: **MANTENER**

Motivo: Excelente ejemplo de criterio 4 (resultado explicado): el material "Base o
soporte para el estanque" viene con una nota que explica el POR QUÉ del ítem en vez de
solo entregarlo — "Confirma que la base soporte el peso del estanque lleno, no solo
vacío — 1000L de agua pesan 1000kg" — un dato no obvio (mucha gente subestima el peso del
agua) explicado en el momento exacto donde importa, y reforzado otra vez en "Errores
comunes" de la guía. La pregunta de litraje tiene un ancla relatable ("Para una familia de
4 personas, 1000L suele ser un mínimo razonable de respaldo") en vez de dejar al usuario
adivinar entre 4 números sin contexto. `reinforcedWarning` ya quedó corregido a `true` en
esta sesión (fix de una vuelta anterior) y ahora es consistente con el resto de la
categoría.

Recomendación concreta: Corregir pluralización — "Llave de paso + conexión de entrada y
salida — 3 unidad" debería decir "3 unidades" (ver lista transversal). Es un detalle
menor, no afecta el veredicto.

Recomendación gráfica: Ninguna — no hay medidas físicas que representar (litraje se
elige por categoría, no por dimensión). No aplica video.

---

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Cañería y conexiones (fittings) | 4/5 | MANTENER |
| Instalar un estanque acumulador de agua | 5/5 | MANTENER |

Confirmado con esta tanda: la pluralización NO es un bug transversal de plantilla — es
inconsistente incluso dentro de la misma categoría (Cañería de gas vs. Cañería y agua
usan el mismo patrón de módulo pero uno pluraliza bien y el otro no), lo que apunta a que
cada `Formula.unit` se escribió a mano sin una convención fija. Ver lista acumulada abajo.

---

# Categoría: Impermeabilización

2 módulos. Tanda 5, misma línea de sistemas con riesgo real (filtraciones), y conecta
directo con el módulo "Área de muros" que vimos condicionado dentro de Ducha (categoría
Baño) — acá se audita el módulo genérico de impermeabilización en sí.

---

## Impermeabilización (`impermeabilizacion`)
Categoría: Impermeabilización
Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 3/5,
Disclaimer 4/5, Flujo 5/5 — Global: 4/5

Veredicto: **MANTENER**

Motivo: Diagrama largo×ancho estándar y consistente, con `AreaInputToggle` (ya corregido
el bug de squaring de una vuelta anterior de esta sesión — verificado que preserva los
valores reales). Flujo lógico y sin saltos: qué vas a impermeabilizar → dimensiones → tipo
de producto. Punto débil, criterio 4: el resultado ("3 rollo") no trae ninguna nota de
cobertura (ej. "cada rollo cubre X m² → para Y m² + Z% de pérdida necesitas N rollos"),
a diferencia del estándar fijado en la Tanda B para cajas/rollos — acá el número aparece
sin ninguna pista de cómo se llegó a él, aunque la norma sí está citada
(`OBRA-IMPERMEABILIZACION-RENDIMIENTOS`, `verificationStatus: CITADO`).

Recomendación concreta: Agregar `note` a la Formula `rollos-de-membrana-asfaltica` (y a
`galones-de-pintura-impermeabilizante`) con el criterio de cobertura, mismo patrón que ya
se usa en Cerámica/Porcelanato ("Cada caja cubre X m² → para Y m² + Z% de pérdida
necesitas N cajas"). Pluralización: "3 rollo" debería decir "3 rollos" (agregado a la
lista transversal).

Recomendación gráfica: Ninguna — el diagrama largo×ancho ya es el apoyo correcto. No
aplica video.

---

## Techo inclinado (bajo teja/zinc) (`techo-inclinado-bajo-teja-zinc`)
Categoría: Impermeabilización
Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 4/5,
Disclaimer 2/5, Flujo 5/5 — Global: 3/5

Veredicto: **MEJORAR**

Motivo: El cálculo en sí está bien resuelto (área horizontal → área real de techo
ajustada por inclinación → área con pérdida → rollos, con las 3 primeras cifras visibles
en el resultado — mejor "resultado explicado" que el módulo hermano de Impermeabilización
genérica). El problema real es criterio 5 (disclaimer proporcional al riesgo): **la Guía
práctica de este módulo es copia textual, palabra por palabra, de la guía del módulo
"Impermeabilización" genérico** (mismo `summary`, mismos `stepByStepSummary`,
`commonMistakes` y `safetyRecommendations`). Eso significa que la única advertencia de
seguridad que aparece es sobre el soplete y ventilación al aplicar membrana termofusionada
— **no hay ninguna mención de que este trabajo específico se hace sobre un techo
inclinado**, con el riesgo de altura y de superficie resbaladiza que eso implica (a
diferencia del módulo genérico, que puede aplicar sobre una fundación a nivel de piso).
Comparado con "Techo (cubierta)" o "Aislación térmica bajo cubierta" (categoría
Techumbres, que sí mencionan trabajo en altura y arnés en sus guías — visto de pasada en
turnos anteriores de esta sesión), este módulo se queda corto justo donde más importa:
riesgo de caída, no riesgo del producto que se aplica.

Recomendación concreta: Escribir una guía propia para este módulo (no reutilizar la de
Impermeabilización genérica) que agregue al menos: (1) en `safetyRecommendations`, mención
explícita de trabajo en altura — línea de vida o arnés según la pendiente e inclinación
elegida por el usuario (el módulo ya pregunta "qué tan inclinado" — se puede usar esa
misma respuesta para calibrar el tono de la advertencia, más fuerte en "Muy inclinado"); y
(2) en `commonMistakes`, el riesgo de trabajar sobre una superficie mojada o con rocío
(fieltro asfáltico bajo teja se instala antes de la cubierta final, en una superficie de
madera/OSB que puede estar resbaladiza). Pluralización: "6 rollo" debería decir "6 rollos"
(agregado a la lista transversal).

Recomendación gráfica: Ninguna sobre el diagrama de dimensiones (correcto). Si se quisiera
reforzar el punto de seguridad, un ícono de advertencia distinto (o un color más urgente)
en la sección de Seguridad de la guía ayudaría a que no se lea como el mismo nivel de
riesgo que aplicar membrana en una fundación a nivel de piso — pero esto depende del
hallazgo transversal de color de disclaimers ya documentado, no es exclusivo de este
módulo.

---

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Impermeabilización | 4/5 | MANTENER |
| Techo inclinado (bajo teja/zinc) | 3/5 | MEJORAR |

Hallazgo más importante de esta tanda (no es de pluralización): una guía práctica
reutilizada sin adaptar entre dos módulos con perfiles de riesgo distintos (superficie a
nivel de piso vs. techo inclinado) — el contenido de seguridad no refleja el riesgo real
de la tarea específica. Vale la pena revisar si este patrón (guía copiada literal entre
módulos de la misma categoría) se repite en categorías siguientes.

---

# Categoría: Excavaciones

2 módulos. Tanda 6, elegida a pedido explícito por involucrar trabajo con riesgo físico
directo (excavación, posible espacio confinado/derrumbe) — el tipo de caso que motivó la
revisión del hallazgo de guías no adaptadas antes de continuar.

---

## Excavación (`excavacion`)
Categoría: Excavaciones
Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 4/5,
Disclaimer 5/5, Flujo 5/5 — Global: 5/5

Veredicto: **MANTENER**

Motivo: Guía propia y bien calibrada al riesgo real, no compartida con ningún otro módulo
(confirmado contra el hallazgo transversal de guías — ver abajo, esta categoría no lo
repite). El disclaimer de seguridad es específico y accionable: "En excavaciones profundas
o en terreno poco firme, revisa el riesgo de derrumbe de las paredes antes de que alguien
entre a trabajar dentro" — nombra el riesgo real (derrumbe, espacio confinado al entrar a
la excavación) en vez de una advertencia genérica. El `summary` mismo abre con el consejo
más valioso del módulo (verificar instalaciones subterráneas antes de excavar) en vez de
enterrarlo en la guía.

Recomendación concreta: Ninguna.

Recomendación gráfica: Ninguna — diagrama de 3 campos (largo/ancho/profundidad) ya
consistente con el resto de la app (mismo patrón que Piscina rectangular, Pilar/columna).

---

## Zanja para tuberías (agua/gas/electricidad) (`zanja-para-tuberias`)
Categoría: Excavaciones
Notas: Lenguaje 4/5, Autocontenido 5/5, Visual 3/5, Resultado 5/5,
Disclaimer 4/5, Flujo 5/5 — Global: 5/5

Veredicto: **MANTENER**

Motivo: El mejor ejemplo de criterio 4 (resultado explicado) encontrado en la auditoría
hasta ahora fuera de la Tanda B: el resultado muestra explícitamente "Ancho típico: 0.3" y
"Profundidad típica: 0.6" ANTES del volumen final — el usuario ve el supuesto exacto que
usó el cálculo (una zanja de agua no es lo mismo que una de gas, y la profundidad se elige
automáticamente por tipo de instalación vía tabla, no a ojo). Verifiqué también que la
ausencia de advertencia de derrumbe (a diferencia de "Excavación") es apropiada, no un
descuido: las profundidades de esta tabla van de 0.5m a 0.8m — bajo el umbral típico donde
el riesgo de derrumbe se vuelve significativo, mientras que "Excavación" permite
profundidad libre (puede ser mucho más profunda). Es la primera vez en la auditoría que
confirmo que una diferencia de disclaimer entre dos módulos similares está bien
justificada por el dato real, no por descuido.

Recomendación concreta: Agregar la unidad "m" a "Ancho típico" y "Profundidad típica" en
el resultado (hoy muestran "0.3" y "0.6" sin unidad — se entiende por contexto, pero no es
explícito. Nota: esto es un problema de Formula/Variable sin unidad mostrada, relacionado
pero distinto del hallazgo de pluralización).

Recomendación gráfica: Ninguna — no aplica diagrama (es una medida lineal, no un área;
ancho/profundidad se derivan automáticamente, no se piden).

---

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Excavación | 5/5 | MANTENER |
| Zanja para tuberías (agua/gas/electricidad) | 5/5 | MANTENER |

La mejor tanda evaluada hasta ahora — ningún hallazgo grave, y confirma (con evidencia
directa, no solo inspección de código) que esta categoría no repite el patrón de guía
compartida sin adaptar. Ver sección "Hallazgo transversal: guías no adaptadas" para el
resultado de la revisión retroactiva pedida sobre las categorías 1-4.

---

# Categoría: Albañilería

2 módulos. Tanda 7 — riesgo estructural real (muros de carga, cierres perimetrales) no
auditado aún como categoría completa.

---

## Muro de bloques o ladrillos (`muro-de-bloques-o-ladrillos`)
Categoría: Albañilería
Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 4/5, Resultado 3/5,
Disclaimer 4/5, Flujo 5/5 — Global: 4/5

Veredicto: **MANTENER**

Motivo: El `helpText` de la primera pregunta es uno de los mejores ejemplos de
autocontenido de toda la auditoría — en vez de asumir que el usuario sabe qué tipo de
ladrillo tiene, le dice cómo identificarlo por DÓNDE lo compró ("Si lo compraste en una
ferretería grande... probablemente es el fiscal industrial; si te lo vendió un ladrillero
local... pregunta el espesor exacto"). El disclaimer de seguridad es específico, no
genérico: menciona técnica de levantamiento con las piernas (riesgo ergonómico real de
mover bloques pesados) y andamios en muros altos — verifiqué que este módulo **no**
comparte guía con ningún otro (no aparece en la lista de duplicados), es contenido propio.
Punto débil, criterio 4: ni el cálculo de unidades ni el de mortero (cemento/arena)
explican el criterio usado (ej. cuántas unidades por m², cuánto mortero por unidad) — a
diferencia de Zanja para tuberías (Tanda 6), acá el usuario no ve el supuesto detrás del
número.

Recomendación concreta: Agregar `note` a las fórmulas de unidades y mortero explicando el
rendimiento asumido (ej. "X unidades por m² según el tamaño elegido, + Y% de pérdida por
corte"). Pluralización: "515 unidad" y "6 bolsa" deberían decir "515 unidades" y "6
bolsas" (agregado a la lista transversal).

Recomendación gráfica: Ninguna — diagrama largo×alto con descuento de vanos (puertas/
ventanas) ya es el apoyo correcto y consistente con Pintura/Revestimiento de muro.

---

## Pandereta (placas y pilares prefabricados) (`pandereta`)
Categoría: Albañilería
Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 3/5, Resultado 3/5,
Disclaimer 5/5, Flujo 5/5 — Global: 4/5

Veredicto: **MANTENER**

Motivo: El disclaimer es el más ajustado al riesgo real específico de este sistema
constructivo encontrado hasta ahora en una categoría no eléctrica/gas: "Usa guantes al
manipular las placas prefabricadas — son pesadas y **los bordes pueden lastimar los
dedos**" — nombra el mecanismo de lesión exacto (aplastamiento/corte en los dedos al
manipular placas de hormigón pesadas), no una advertencia genérica de "ten cuidado". Guía
propia, no compartida con Muro de bloques ni con ningún otro módulo, pese a estar en la
misma categoría — buena señal de que el copy se pensó para este sistema específico
(pilares prefabricados tipo Bulldog), no reciclado del módulo de albañilería tradicional
que es conceptualmente distinto (la propia `description` del módulo ya aclara "distinto de
un muro de albañilería tradicional").

Recomendación concreta: Mismo hallazgo de criterio 4 que Muro de bloques — el resultado
("11 pilares", "40 placas" a partir de 20m de cierre) no explica el criterio de espaciado
entre pilares. Pluralización: "11 unidad" y "40 unidad" deberían decir "11 unidades" y "40
unidades" (agregado a la lista transversal).

Recomendación gráfica: Ninguna — no hay medidas de área que representar (es un largo
lineal + altura por catálogo, no una superficie con vanos).

---

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Muro de bloques o ladrillos | 4/5 | MANTENER |
| Pandereta (placas y pilares prefabricados) | 4/5 | MANTENER |

Verifiqué explícitamente contra el hallazgo transversal de guías no adaptadas: **ninguno
de los dos módulos comparte guía** con el otro ni con ningún módulo de otra categoría —
ambos tienen contenido de seguridad propio y calibrado a su sistema constructivo
específico (técnica de levantamiento para bloques pesados; riesgo de aplastamiento de
dedos para placas prefabricadas). Categoría limpia en ese criterio, segunda tanda
consecutiva sin ese patrón (después de Excavaciones). El único hallazgo repetido es de
pluralización — 4 casos nuevos, ver lista acumulada.

---

# Categoría: Techumbres

3 módulos. Tanda 8 — trabajo en altura explícito; ya habíamos visto de pasada que Techo
(cubierta) y Aislación térmica comparten guía bien calibrada (ambas mencionan arnés/línea
de vida) — acá se audita la categoría completa, incluyendo Cercha de techo.

---

## Cercha de techo (`cercha-de-techo`)
Categoría: Techumbres
Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 4/5, Resultado 4/5,
Disclaimer 5/5, Flujo 5/5 — Global: 5/5

Veredicto: **MANTENER**

Motivo: **El disclaimer mejor calibrado de toda la auditoría.** Guía propia (no comparte
`summary` con ningún otro módulo de la app), y en vez de una advertencia genérica de
"trabajo en altura", secuencia el riesgo real con precisión: "Una cercha se revisa entera
antes de subirla, no arriba — el trabajo de precisión va en el suelo; el izaje e
instalación en altura es donde el riesgo físico se dispara". Distingue explícitamente la
etapa segura (armar en el suelo) de la etapa de riesgo (izar e instalar), con
`safetyRecommendations` accionables para cada una ("Nunca trabajes solo en esta etapa" —
específico del momento de izaje, no un genérico "ten cuidado"). Las fórmulas de material
(piezas de madera/perfil metálico) tienen `reinforcedWarning: true`, correctamente —
cercha es elemento estructural/de carga, a diferencia de cubierta o aislación que son no
estructurales.

Recomendación concreta: Ninguna de contenido. Pluralización: "10 pieza" debería decir "10
piezas" (agregado a la lista transversal).

Recomendación gráfica: Ninguna — no hay medidas de área que representar (cantidad de
cerchas + largo lineal, no un rectángulo).

---

## Techo (cubierta) (`cubierta`)
Categoría: Techumbres
Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 5/5,
Disclaimer 4/5, Flujo 5/5 — Global: 5/5

Veredicto: **MANTENER**

Motivo: Junto con Cerámica/Porcelanato de la Tanda B, el mejor ejemplo de criterio 4 fuera
de esa tanda: la fórmula `cubierta` usa `materialLabelTemplate`/`note` interpolado para
mostrar "Cada plancha/unidad cubre 2,7 m² → para 60,72 m² (incluye pérdida por corte)
necesitas 23 unidades" — el usuario ve el supuesto exacto, no solo el número final.
Comparte guía con Aislación térmica (mismo `summary` sobre trabajo en altura), verificado
como justificado: ambos módulos literalmente involucran estar sobre el techo.

Recomendación concreta: Ninguna de contenido. Pluralización: el encabezado del resultado
dice "23 **unidad**" (aunque la nota interpolada debajo, correctamente escrita a mano,
dice "23 unidades") — inconsistencia entre el número/unidad del encabezado (usa
`Formula.unit` sin pluralizar) y el texto de la nota (agregado a la lista transversal).

Recomendación gráfica: Ninguna — diagrama largo×ancho estándar, consistente.

---

## Aislación térmica (bajo cubierta) (`aislacion-termica-bajo-cubierta`)
Categoría: Techumbres
Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 3/5,
Disclaimer 4/5, Flujo 5/5 — Global: 4/5

Veredicto: **MANTENER**

Motivo: Comparte guía con Techo (cubierta) de forma justificada (mismo motivo que arriba).
Diferencia real de criterio 4 dentro del mismo par que comparte guía: a diferencia de
Techo (cubierta), acá las fórmulas `rollos-lana-mineral` y `planchas-poliestireno` **no**
tienen `note` explicando cobertura (verificado en turno anterior de esta sesión: el
resultado muestra "3 rollo" sin ningún detalle de cuántos m² cubre cada rollo) — mismo
módulo hermano, mismo patrón de cálculo (área → pérdida → unidades), pero solo uno de los
dos explica el criterio. Es una inconsistencia de calidad dentro de un par ya identificado
como bien calibrado en disclaimer, no en resultado explicado.

Recomendación concreta: Agregar `note` a ambas fórmulas con el mismo patrón que ya usa
Techo (cubierta) (ej. "Cada rollo cubre X m² → para Y m² necesitas Z rollos"). Pluralización:
"3 rollo" debería decir "3 rollos" (agregado a la lista transversal).

Recomendación gráfica: Ninguna — diagrama largo×ancho estándar.

---

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Cercha de techo | 5/5 | MANTENER |
| Techo (cubierta) | 5/5 | MANTENER |
| Aislación térmica (bajo cubierta) | 4/5 | MANTENER |

Verificación explícita pedida: Techo (cubierta) y Aislación térmica comparten guía — **la
diferencia de disclaimer entre ambos es nula (correctamente idéntica)**, ambos mencionan
arnés/línea de vida por igual, justificado porque ambos involucran estar sobre el techo.
Cercha de techo tiene guía propia, sin compartir con nadie — tercera tanda consecutiva
(Excavaciones, Albañilería, Techumbres) sin encontrar un caso NUEVO de guía no adaptada al
riesgo. La única brecha real de esta tanda es de resultado explicado (Aislación térmica
vs. su módulo hermano), no de disclaimer.

---

# Categoría: Metalcon

2 módulos. Tanda 9 — elegida específicamente para cerrar el hallazgo pendiente de
"Tabique en Metalcon" (guía heredada de Yeso Cartón/Madera sin mencionar riesgo de corte
metálico), auditando la categoría completa.

---

## Tabique en Metalcon (`tabique-en-metalcon`)
Categoría: Metalcon
Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 3/5,
Disclaimer 2/5, Flujo 5/5 — Global: 3/5

Veredicto: **MEJORAR**

Motivo: Confirmado en navegador (no solo en DB) el hallazgo documentado en la tanda
anterior: `safetyRecommendations` es exactamente "Usa gafas y mascarilla al cortar. /
Cuidado con las herramientas eléctricas." — idéntico a Tabiques y cielos (yeso cartón) y
Tabiquería en madera, sin ninguna mención del riesgo distintivo de cortar perfilería de
metal galvanizado (bordes y rebabas filosas). **Lo que hace este hallazgo más serio ahora**
es que el módulo hermano de la misma categoría, "Cielo raso en Metalcon", SÍ tiene el
copy correcto ("Usa guantes — el borde cortado del perfil galvanizado es filoso. / Lentes
de seguridad al taladrar sobre la cabeza, por las virutas metálicas que caen.") — es decir,
alguien ya escribió la advertencia correcta para material Metalcon en esta misma
categoría, y "Tabique en Metalcon" simplemente no la recibió. No es una omisión de
concepto, es una inconsistencia de aplicación dentro de la misma categoría.

Recomendación concreta: Copiar (adaptado al contexto de tabique vertical vs. cielo sobre
la cabeza) el mismo tipo de advertencia de "Cielo raso en Metalcon": guantes al manipular
perfilería cortada, y considerar agregar a `tools` (hoy dice "Sierra", que para Metalcon
debería ser tijera para metal/hojalatera — el módulo hermano ya usa "Tijeras para metal
(hojalatera)" en vez de sierra, otra pista de que la guía de Tabique quedó sin actualizar
al migrar de madera a metal). Pluralización: "13 pieza" (montante), "4 pieza" (canal), "128
unidad" (tornillos) — deberían decir "piezas" y "unidades" (agregado a la lista
transversal).

Recomendación gráfica: Ninguna sobre el diagrama (largo×alto estándar, correcto).

---

## Cielo raso en Metalcon (`cielo-raso-en-metalcon`)
Categoría: Metalcon
Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 4/5, Resultado 4/5,
Disclaimer 5/5, Flujo 5/5 — Global: 5/5

Veredicto: **MANTENER**

Motivo: El mejor contenido de guía encontrado en la categoría, y candidato a plantilla
para corregir a su módulo hermano. No solo tiene seguridad específica del material
(guantes por bordes filosos, lentes por virutas al taladrar sobre la cabeza), sino una
técnica accionable que va más allá de seguridad genérica: "Corta los perfiles con tijera
hojalatera, no con esmeril — el corte con disco quema el galvanizado y ese punto se oxida
antes." Esto es exactamente el tipo de conocimiento de oficio que un maestro sin
experiencia previa en Metalcon necesitaría y no adivinaría solo.

Recomendación concreta: Ninguna de contenido — este módulo es el estándar a igualar.
Pluralización: "8 pieza" (perfil), "3 pieza" (canal perimetral), "168 unidad" (tornillos)
deberían decir "piezas" y "unidades" (agregado a la lista transversal).

Recomendación gráfica: Ninguna — diagrama largo×ancho estándar.

---

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Tabique en Metalcon | 3/5 | MEJORAR |
| Cielo raso en Metalcon | 5/5 | MANTENER |

Verificación explícita pedida sobre disclaimers entre módulos similares: **la diferencia
entre estos dos SÍ es una inconsistencia real, no justificada por ningún dato** — ambos
trabajan el mismo material (perfilería Metalcon), ambos involucran cortarla, y solo uno de
los dos advierte sobre el riesgo de corte. A diferencia de Zanja/Excavación (Tanda 6,
diferencia justificada por profundidad real) o Techo cubierta/Aislación térmica (Tanda 8,
diferencia correctamente nula), acá no hay ninguna razón técnica para que "Cielo raso"
tenga la advertencia y "Tabique" no — es simplemente que uno se escribió a mano después
del otro y no se sincronizaron. Primera vez en la auditoría (excluyendo el caso original de
Techo inclinado) que confirmo una inconsistencia real de disclaimer que amerita MEJORAR.

---

# Categoría: Madera

4 módulos. Tanda 10 — cierra el trío de la guía de tabique compartida (Yeso Cartón /
Madera / Metalcon), auditando "Tabiquería en madera" y el resto de la categoría.

---

## Piso y Terraza en madera (`piso-y-terraza-en-madera`)
Categoría: Madera
Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 4/5, Resultado 4/5,
Disclaimer 4/5, Flujo 5/5 — Global: 4/5

Veredicto: **MANTENER**

Motivo: Guía propia, no compartida con nadie. El `summary` abre con un insight físico no
obvio y bien explicado: "La madera no se pudre por la lluvia que le cae encima, se pudre
por la humedad que queda atrapada sin poder secarse" — justifica por qué importa la
separación entre tablas antes de que el usuario lo lea como una regla arbitraria.
`reinforcedWarning: true` en las fórmulas de estructura, razonable (es una superficie de
tránsito/carga, aunque de menor exigencia que una cercha).

Recomendación concreta: Ninguna de contenido. Pluralización: "14 pieza" (estructura) y "44
tabla" (deck) deberían decir "14 piezas" y "44 tablas" (agregado a la lista transversal).

Recomendación gráfica: Ninguna — diagrama largo×ancho estándar.

---

## Cielo raso con estructura de madera (`cielo-con-estructura-de-madera`)
Categoría: Madera
Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 3/5,
Disclaimer 4/5, Flujo 5/5 — Global: 4/5

Veredicto: **MANTENER**

Motivo: Guía propia, no compartida. `reinforcedWarning: false` en sus fórmulas —
consistente con su naturaleza no estructural (cielo decorativo, a diferencia de la
estructura de un piso/terraza que sí carga peso de tránsito). El `summary` da un motivo
concreto para nivelar bien antes de cerrar ("un cielo raso desnivelado se nota mucho más
que una pared desnivelada, porque la luz lo resalta") en vez de solo indicarlo como regla.

Recomendación concreta: Ninguna urgente — no verifiqué pluralización de este módulo en
vivo en esta tanda (no se navegó), pero por el mismo patrón de `Formula.unit` fijo del
resto de la categoría es probable que "Piezas de estructura" tenga el mismo problema —
queda pendiente de confirmar si se decide auditar con más detalle.

Recomendación gráfica: Ninguna — diagrama largo×ancho estándar.

---

## Madera para cercha u otro uso estructural (`madera-para-cercha-u-otro-uso-estructural`)
Categoría: Madera
Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 3/5, Resultado 4/5,
Disclaimer 5/5, Flujo 5/5 — Global: 5/5

Veredicto: **MANTENER**

Motivo: Un tipo de disclaimer distinto y valioso que no había aparecido antes en la
auditoría: no es sobre riesgo físico al instalador, es sobre **riesgo de falla del
material** — "una pieza del tamaño correcto pero húmeda o con nudos mal ubicados puede
fallar donde una más simple pero sana no fallaría", con pasos concretos para verificarlo
("mira a lo largo para detectar curvatura, descarta piezas con nudos grandes en los puntos
de mayor esfuerzo"). Es el tipo de criterio de selección de material que un maestro con
experiencia aplica automáticamente pero que alguien sin ese entrenamiento no sabría buscar
— autocontenido genuino sobre un riesgo real (falla estructural por material defectuoso),
no solo sobre el uso de la calculadora.

Recomendación concreta: Ninguna de contenido. Pluralización: "18 pieza" debería decir "18
piezas" (agregado a la lista transversal).

Recomendación gráfica: Ninguna — no hay medidas de área (es conversión de especificación
ya dada, como Cañería de gas/agua).

---

## Tabiquería en madera (`tabiqueria-en-madera`)
Categoría: Madera
Notas: Lenguaje 4/5, Autocontenido 4/5, Visual 4/5, Resultado 3/5,
Disclaimer 4/5, Flujo 5/5 — Global: 4/5

Veredicto: **MANTENER**

Motivo: Este es uno de los 3 módulos del grupo de guía compartida ("Un tabique se arma
rápido...", junto con Tabiques y cielos de yeso cartón y Tabique en Metalcon, ya
documentado en el hallazgo transversal). A diferencia de Tabique en Metalcon, **acá la
guía compartida SÍ está bien calibrada** — "Usa gafas y mascarilla al cortar" es la
advertencia correcta para madera (polvo de aserrín, astillas), el riesgo real de este
material coincide con el contenido genérico. No amerita MEJORAR por este motivo (a
diferencia de su análogo en Metalcon).

Recomendación concreta: Ninguna de contenido. Pluralización no verificada en vivo esta
tanda (mismo patrón esperado que el resto de la categoría, por confirmar si se prioriza).

Recomendación gráfica: Ninguna — diagrama largo×alto estándar.

---

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Piso y Terraza en madera | 4/5 | MANTENER |
| Cielo raso con estructura de madera | 4/5 | MANTENER |
| Madera para cercha u otro uso estructural | 5/5 | MANTENER |
| Tabiquería en madera | 4/5 | MANTENER |

Verificación explícita pedida: dentro de la categoría, `reinforcedWarning` distingue
correctamente entre lo estructural (Piso/Terraza, Cercha — `true`) y lo no estructural
(Cielo raso, Tabiquería — `false`), diferencia justificada por la función real de cada
elemento, no arbitraria. Y cierre del hallazgo transversal: confirmado que "Tabiquería en
madera" (a diferencia de "Tabique en Metalcon") SÍ tiene el disclaimer correcto para su
material — la guía compartida del trío solo falla para el caso Metalcon, no para madera ni
yeso cartón. 3 casos nuevos de pluralización.

**Pendiente de tu revisión antes de seguir con la categoría 11.**

---

# Categoría: Acero y Enfierradura

## Enfierradura (enfierradura)

Categoría: Acero y Enfierradura

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 3/5, Disclaimer 5/5, Flujo 3/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: (1) *Resultado explicado*: las fórmulas de barras (Fierro Ø6/8/10/12mm) no tienen
`note` explicando la conversión metros→barras — el resultado muestra "8 barra" sin decir
"cada barra comercial mide 6m → para 44m con traslapo necesitas 8 barras", a diferencia del
estándar de Tanda B (cajas/rollos). (2) *Flujo lógico*: la pregunta "¿Agregamos un % por
traslapos (empalmes entre barras)?" no tiene `helpText` — la explicación de por qué el
traslapo importa ("un traslapo insuficiente es de los errores más comunes y más caros de
corregir una vez colado el hormigón") solo aparece después, en la guía
(`tipsBeforeStart`/`commonMistakes`), no al momento de responder. Mismo patrón que el
hallazgo original de Ducha. (3) *Riesgo de falla de material* (chequeo especial de esta
tanda): pese a ser el módulo más crítico de toda la categoría — la propia guía dice "la
enfierradura es la parte invisible de un elemento de hormigón, pero de eso depende casi
toda su resistencia a largo plazo" — ni "Errores comunes" ni "Seguridad" mencionan
inspeccionar el fierro mismo (picaduras de óxido avanzadas, barras dobladas, diámetro
mezclado) antes de usarlo. Un fierro con corrosión importante pierde sección resistente,
el mismo tipo de riesgo que "Madera para cercha" sí cubre para la madera estructural — acá
falta.

Recomendación concreta: agregar `helpText` a la pregunta de traslapo (ej. "un traslapo
insuficiente debilita la unión entre barras — 10% es el estándar para la mayoría de los
casos"); agregar `note` a las fórmulas de barra explicando la conversión; agregar a
`commonMistakes` o `safetyRecommendations`: "Revisa que las barras no tengan picaduras de
óxido profundas ni estén dobladas antes de usarlas — reducen la sección resistente del
fierro."

Recomendación gráfica: no aplica diagrama (no hay dimensiones geométricas que dibujar, solo
metros lineales); el ícono/color siguen el estándar de la categoría, sin problema.

## Malla electrosoldada (malla-electrosoldada)

Categoría: Acero y Enfierradura

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 4/5, Disclaimer 5/5, Flujo 3/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: (1) *Flujo lógico*: mismo patrón que Enfierradura — la pregunta "¿Necesitas traslapo
entre planchas?" no tiene `helpText`; la explicación de por qué traslapar "al menos un
cuadro completo" solo está en la guía, no al momento de responder. (2) *Riesgo de falla de
material*: ninguna mención de revisar la malla por óxido o alambres doblados/cortados antes
de instalarla, mismo hueco que Enfierradura.

Recomendación concreta: `helpText` en la pregunta de traslapo; agregar a `commonMistakes`:
"Revisa que la malla no tenga óxido avanzado ni alambres doblados o cortados antes de
instalarla."

Recomendación gráfica: el input de m² ya usa `AreaInputToggle` (largo×ancho / m² directo)
con diagrama — consistente con el resto de la app, bien resuelto (mejora respecto a lo
documentado en el DB dump original, que mostraba un campo NUMBER simple; en el navegador ya
está actualizado al patrón estándar).

## Tubo estructural (tubo-estructural)

Categoría: Acero y Enfierradura

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 3/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: (1) *Resultado explicado*: las fórmulas de piezas de 6m no tienen `note` explicando
la conversión metros→piezas ("4 pieza" sin decir "cada pieza comercial mide 6m"). (2)
*Riesgo de falla de material*: la guía cubre muy bien la oxidación interna post-instalación
(extremos sin sellar, "invisible hasta que el daño ya está avanzado") pero no menciona
inspeccionar el tubo en sí por abolladuras o corrosión preexistente antes de cortar o
soldar — un tubo abollado o ya oxidado por fuera compromete su resistencia aunque el peso
calculado sea el correcto.

Recomendación concreta: agregar `note` a las fórmulas de piezas explicando la conversión;
agregar a `commonMistakes`: "Revisa que el tubo no tenga abolladuras ni óxido avanzado antes
de usarlo."

Recomendación gráfica: sin diagrama — apropiado, ya que la selección es por catálogo
(forma/medida/espesor) más metros lineales, no hay geometría que ilustrar.

## Perfil estructural (perfil-estructural)

Categoría: Acero y Enfierradura

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 3/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: (1) *Resultado explicado*: mismo hueco de `note` en las fórmulas de piezas de 6m
que Tubo estructural. (2) *Riesgo de falla de material*: esta es, de las 4, la guía más
orientada a calidad de ejecución — insiste en verificar escuadra, limpiar antes de soldar, y
su frase central ("el perfil se pesa por metro, pero la estructura se sostiene por la
calidad de cada unión") ya apunta en la dirección correcta — pero tampoco menciona
inspeccionar el perfil mismo por alabeo o corrosión antes de usarlo, mismo hueco que los
otros 3 módulos de la categoría.

Recomendación concreta: agregar `note` a las fórmulas de piezas; agregar a
`commonMistakes`: "Revisa que el perfil no venga alabeado ni con óxido avanzado desde la
ferretería."

Recomendación gráfica: sin diagrama — apropiado, mismo caso que Tubo estructural.

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Enfierradura | 4/5 | MEJORAR |
| Malla electrosoldada | 4/5 | MEJORAR |
| Tubo estructural | 4/5 | MEJORAR |
| Perfil estructural | 4/5 | MEJORAR |

**Chequeo especial de esta tanda — riesgo de falla de material:** verificado en los 4
módulos (los únicos módulos genuinamente estructurales fuera de Hormigón/Madera aún no
auditados). Resultado: **ninguno de los 4** incluye contenido sobre inspeccionar el
material de acero en sí (óxido, abolladuras, deformación, picaduras) antes de usarlo
estructuralmente — todos cubren bien la calidad de la *instalación* (traslapos, soldaduras,
sellado de extremos, protección anticorrosiva post-obra) pero no la calidad del *insumo* al
comprarlo o recibirlo. Esto es notable porque Acero y Enfierradura es, de las categorías
auditadas, la más explícitamente estructural de la app — y sin embargo le falta
exactamente el tipo de contenido que "Madera para cercha" (Tanda 10) sí tiene. Se documenta
como hallazgo consistente en los 4 módulos, con recomendación concreta en cada uno.

**Verificación de disclaimer entre módulos similares (instrucción recurrente):**
`reinforcedWarning: true` en Enfierradura y Malla electrosoldada vs. `false` en Tubo y
Perfil estructural. Verificado — **la diferencia está justificada**: Enfierradura y Malla
quedan embebidas e invisibles dentro del hormigón una vez colado (un error ya no es
corregible, la propia guía de Enfierradura lo dice explícitamente: "corregir después del
colado ya no es posible"), mientras que Tubo y Perfil estructural permanecen visibles y
accesibles después de instalados (se puede inspeccionar y corregir una unión soldada
después). Mismo tipo de distinción "invisible/no corregible vs. visible/corregible" que ya
se había confirmado en Zanja vs. Excavación (Tanda 6) y en el split estructural/no
estructural de Madera (Tanda 10) — acá aplicado correctamente de nuevo.

**Guías no adaptadas al riesgo específico:** no se encontró ningún caso nuevo de guía
compartida (`ModuleGuide.summary` idéntico) entre los 4 módulos de esta categoría — cada uno
tiene guía propia, ya reflejando su riesgo particular (recubrimiento/traslapo para
Enfierradura, traslapo/separadores para Malla, oxidación interna para Tubo, calidad de
unión para Perfil). Los 7 grupos de guía compartida documentados en la tabla transversal
siguen siendo la lista completa app-wide.

**Pluralización:** 4 casos nuevos confirmados en navegador — "8 barra" (Enfierradura), "3
plancha" (Malla electrosoldada), "4 pieza" (Tubo estructural), "3 pieza" (Perfil
estructural). Se suman a la tabla transversal.

**Pendiente de tu revisión antes de seguir con la categoría 12.**

---

# Categoría: Hormigón

Categoría más grande de la app (8 módulos) y la más estructural que queda por auditar
(fundaciones, muros, vigas, losas, pilares, escalera, cadena, radier). Antes de los
módulos individuales, dos hallazgos transversales a los 8 que conviene explicar una sola
vez:

**Hallazgo A — falta la pregunta "¿cómo vas a obtener el hormigón?" en 7 de 8 módulos.**
Solo Radier pregunta "¿Cómo vas a obtener el hormigón?" (premezclado en camión mixer vs.
prepararlo tú mismo en obra) y ramifica el resultado según la respuesta. Los otros 7 —
Muro, Losa, Fundación, Viga, Escalera, Cadena y Pilar/columna — **siempre** calculan
bolsas de cemento + arena + gravilla + agua para dosificación manual, sin preguntar nunca
si el usuario va a comprar hormigón premezclado. Confirmado en navegador en Muro (20cm,
estructural) y Pilar: el flujo pasa directo de las dimensiones a "¿Cómo vas a colocar el
hormigón?" (manual/bomba, que es sobre el método de vaciado, no sobre el origen del
material) y entrega bolsas de cemento igual. Esto es particularmente notorio porque **el
patrón de riesgo está invertido**: el hormigón premezclado es más común, y a menudo más
recomendado, justamente en los elementos más críticos (vigas, losas, pilares) donde una
dosificación manual mal hecha es más peligrosa — y son justo esos módulos los que no
preguntan.

**Hallazgo B — chequeo especial de esta tanda (calidad del insumo, no solo de la
instalación).** Ninguno de los 8 módulos menciona el riesgo de calidad del hormigón más
común en obra en Chile: **agregar agua extra al camión mixer o a la mezcla en el sitio**
para que sea más fácil de verter, lo que reduce significativamente la resistencia final.
Las guías cubren muy bien el curado, el vibrado, los tiempos de fraguado y el retiro de
moldaje/puntales — pero no la calidad del hormigón tal como llega o se prepara. Es el
equivalente, para hormigón, del hueco encontrado en "Madera para cercha" (inspeccionar el
insumo antes de usarlo) y en Acero y Enfierradura (Tanda 11) — aquí aplicado a la etapa de
recepción/mezcla en vez de a una inspección visual de una pieza sólida.

## Muro de hormigón armado (muro-de-hormigon-armado)

Categoría: Hormigón

Notas: Lenguaje 5/5, Autocontenido 3/5, Visual 5/5, Resultado 4/5, Disclaimer 4/5, Flujo 3/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: Diagrama largo×alto correcto y consistente con el resto de la app. La guía es
buena y específica (drenaje detrás en muros de contención, vibrado, verticalidad).

**Hallazgo específico de este módulo — falta distinguir muro de contención vs. muro
simple:** el wizard nunca pregunta si el muro va a contener tierra o agua (muro de
contención) o si es un muro divisorio/estructural simple sin esa función. Solo pide
largo/alto/espesor/colocación. Esto importa porque un muro de contención tiene
requerimientos estructurales reales distintos (resistir el empuje de tierra o agua
acumulada, necesitar drenaje detrás) de un muro que no contiene nada — y hoy el cálculo y
la guía tratan ambos casos igual, sin distinguirlos en ningún punto del flujo. La opción
"20cm (muro estructural)" cubre parcialmente la idea de "estructural" pero no la de
"contención" — un muro de 20cm puede ser estructural sin ser de contención, o viceversa.
La propia guía ya reconoce el problema ("si es un muro de contención de terreno, el
diseño... debe determinarlo un ingeniero") pero como advertencia genérica "si aplica", no
como algo que el wizard haya preguntado y sepa si aplica o no al caso real del usuario.

Además, Hallazgo A y B de la tanda aplican de lleno: sin pregunta de obtención del
hormigón, y sin advertencia sobre no agregar agua extra al mezclar/recibir el hormigón —
relevante en un muro que sí puede ser de contención. Confirmado en navegador con 4m×2.4m,
20cm, manual: resultado "15 bolsa" (bug de pluralización, ver tabla transversal).

Recomendación concreta: agregar una pregunta "¿Es un muro de contención de terreno?"
(sí/no) antes o junto a espesor, y usarla para mostrar la advertencia de ingeniería de
forma condicionada en vez de "si aplica"; agregar la pregunta "¿Cómo vas a obtener el
hormigón?" (como Radier); agregar a `commonMistakes` una línea sobre no agregar agua extra
al hormigón en obra.

Recomendación gráfica: ninguna — el diagrama de largo×alto ya es correcto y suficiente.

## Losa (losa)

Categoría: Hormigón

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 4/5, Disclaimer 5/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: Guía sólida y bien enfocada en el riesgo real de una losa (curado, junta fría,
puntales) — "la mayoría de las grietas tempranas no son un problema de resistencia del
hormigón, son un problema de curado" es un buen ejemplo de contenido explicado, no solo
entregado. La pregunta de espesor ya tiene `helpText` correcto ("si tienes un plano
estructural, usa el espesor que indique"). El único punto débil es compartido con toda la
categoría: Hallazgo A (sin pregunta de obtención del hormigón, pese a ser de los módulos
más estructurales) y Hallazgo B (sin advertencia sobre agua extra).

Recomendación concreta: agregar la pregunta de obtención del hormigón; agregar a
`commonMistakes`: "No agregues agua extra al hormigón para que sea más fácil de verter —
reduce su resistencia final aunque parezca más fácil de trabajar."

Recomendación gráfica: ninguna necesaria — no hay geometría 2D que ilustrar más allá de lo
que ya se pregunta (largo/ancho/espesor, con `helpText` en espesor).

## Fundación (cimiento corrido) (fundacion)

Categoría: Hormigón

Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 5/5, Resultado 4/5, Disclaimer 4/5, Flujo 4/5 — Global: 5/5

Veredicto: MANTENER

Motivo: El módulo mejor resuelto de la categoría. La pregunta "¿Para qué es esta
fundación?" con `helpText` en la pregunta del cuello ("el cuello es la parte que queda al
nivel del suelo, generalmente más angosta que la base") es exactamente el patrón correcto
— contexto en el momento en que se necesita, no después. La guía está enfocada en el
riesgo real y específico de una fundación (compactación del fondo, "no falla de inmediato
— falla años después"). Único punto débil: comparte Hallazgo A y B de la tanda (sin
pregunta de obtención, sin advertencia de agua extra), pero al ser el módulo más completo
en los demás criterios se mantiene con Global 5/5 pese a esos huecos transversales.

Recomendación concreta: agregar pregunta de obtención del hormigón; agregar advertencia de
agua extra a `commonMistakes`.

Recomendación gráfica: ninguna — no aplica diagrama geométrico adicional al ya
correctamente resuelto con `helpText`.

## Viga (viga)

Categoría: Hormigón

Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 5/5, Resultado 4/5, Disclaimer 5/5, Flujo 4/5 — Global: 5/5

Veredicto: MANTENER

Motivo: Las dos preguntas de dimensiones ("ancho de la viga" y "alto de la viga") ya
tienen `helpText`: "Si no lo sabes, consulta tu plano o a tu constructor — el tamaño de
una viga estructural depende del cálculo de tu proyecto" — correctamente delega la
decisión estructural a un profesional sin fingir que la calculadora la determina. La guía
es la más enfocada en seguridad estructural real de toda la categoría (puntales, "el
riesgo no es solo estético, es estructural"). Único punto débil: mismo hueco transversal
de obtención del hormigón y de advertencia de agua extra — más relevante acá que en
ningún otro módulo, dado que una viga es de los elementos más sensibles a una mezcla
manual mal hecha.

Recomendación concreta: agregar pregunta de obtención del hormigón (con mayor prioridad
que en el resto de la categoría, dado el riesgo); agregar advertencia de agua extra.

Recomendación gráfica: ninguna necesaria.

## Escalera (escalera)

Categoría: Hormigón

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 4/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: Guía correctamente enfocada en el riesgo real y específico de una escalera
(contrahuellas desiguales, antideslizante) — riesgo de caída al caminar, no riesgo
estructural puro como el resto de la categoría, y la guía lo refleja bien ("la diferencia
se siente al caminar mucho antes de notarse a simple vista"). Comparte el hueco
transversal de obtención del hormigón (aunque menos crítico acá, al ser volúmenes
menores) y no menciona calidad del insumo.

Recomendación concreta: agregar pregunta de obtención del hormigón, con prioridad menor
que en Viga/Losa/Pilar dado el volumen típicamente más chico.

Recomendación gráfica: ninguna necesaria — no hay geometría adicional que ilustrar más
allá de los campos de huella/contrahuella ya presentes con `helpText`.

## Radier (radier)

Categoría: Hormigón

Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 5/5, Resultado 5/5, Disclaimer 5/5, Flujo 5/5 — Global: 5/5

Veredicto: MANTENER

Motivo: El único módulo de la categoría que sí pregunta "¿Cómo vas a obtener el hormigón?"
y ramifica el resultado (premezclado → m³ necesarios; manual → bolsas/arena/gravilla/agua)
— el patrón que debería aplicarse al resto de la categoría. También es el único con
`safetyRecommendations` sobre el hormigón fresco en sí ("no trabajes el hormigón fresco
con la piel expuesta por tiempo prolongado — es cáustico y puede quemar"), y con FAQs
prácticas y bien ubicadas ("¿puedo hacerlo en un día de lluvia?"). Único hueco: tampoco
menciona la advertencia de no agregar agua extra (Hallazgo B), pero es menor comparado con
el resto de sus fortalezas.

Recomendación concreta: agregar a `commonMistakes` la advertencia de no agregar agua extra
al hormigón — el único punto que falta para ser un módulo completo en los 6 criterios.

Recomendación gráfica: ninguna — ya usa el patrón de dimensiones estándar de la app.

## Refuerzo superior del muro (cadena de amarre) (cadena)

Categoría: Hormigón

Notas: Lenguaje 4/5, Autocontenido 4/5, Visual 4/5, Resultado 4/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: Guía centrada en el riesgo sísmico real y específico del elemento —
"el refuerzo superior existe para que el muro completo se comporte como una sola pieza
ante un sismo... una esquina discontinua es el punto exacto donde ese comportamiento
conjunto se rompe primero" es un buen ejemplo de explicar el POR QUÉ, no solo el QUÉ.
Comparte el hueco transversal de obtención del hormigón y de advertencia de agua extra.
Nota de nomenclatura (no es un defecto, solo una observación): el nombre público
("Refuerzo superior del muro (cadena de amarre)") es más claro que el slug/task original
("Cadena"), documentado así en el task list de implementación — la app ya usa el nombre
claro, no hace falta cambiar nada.

Recomendación concreta: agregar pregunta de obtención del hormigón; agregar advertencia de
agua extra.

Recomendación gráfica: ninguna necesaria.

## Pilar / columna (pilar-columna)

Categoría: Hormigón

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 5/5, Disclaimer 5/5, Flujo 4/5 — Global: 5/5

Veredicto: MANTENER

Motivo: Diagrama de 3 dimensiones (ancho×alto×profundidad) correcto y consistente.
Confirmado en navegador con 3 pilares de 20×20cm × 2.4m: la multiplicación por cantidad de
pilares se aplica correctamente en todos los materiales (cemento, arena, gravilla, agua) —
no es un cálculo de un solo pilar mal etiquetado. La recomendación de grado de hormigón
está muy bien explicada y es el mejor ejemplo de "resultado explicado" de toda la
categoría: "Grado recomendado: G20 (equivalente al H25 antiguo), según NCh170:2016 —
pilares suelen ser elementos estructurales críticos, se sugiere no bajar de ese grado."
Único punto débil: mismo hueco transversal de obtención del hormigón y de advertencia de
agua extra que el resto de la categoría — pero el resto del módulo es tan sólido que se
mantiene en Global 5/5.

Recomendación concreta: agregar pregunta de obtención del hormigón; agregar advertencia de
agua extra a `commonMistakes`.

Recomendación gráfica: ninguna — el diagrama de 3 dimensiones ya es correcto.

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Muro de hormigón armado | 4/5 | MEJORAR |
| Losa | 4/5 | MEJORAR |
| Fundación (cimiento corrido) | 5/5 | MANTENER |
| Viga | 5/5 | MANTENER |
| Escalera | 4/5 | MEJORAR |
| Radier | 5/5 | MANTENER |
| Refuerzo superior del muro (cadena de amarre) | 4/5 | MEJORAR |
| Pilar / columna | 5/5 | MANTENER |

**Chequeo especial de esta tanda — riesgo de falla de material (insumo, no solo
instalación):** aplicado a los 8 módulos. Resultado: **ninguno** de los 8 menciona el
riesgo de calidad del hormigón más común en obra en Chile — agregar agua extra a la mezcla
o al camión mixer para facilitar el vaciado, lo que reduce la resistencia final. Es el
mismo tipo de hueco encontrado en Madera (Tanda 10) y Acero y Enfierradura (Tanda 11),
aplicado acá a la etapa de recepción/mezcla del hormigón en vez de a una inspección visual
de una pieza sólida.

**Hallazgo adicional, no buscado pero significativo:** 7 de 8 módulos nunca preguntan
"¿cómo vas a obtener el hormigón?" (premezclado vs. preparación manual en obra) y siempre
entregan dosificación manual (bolsas de cemento/arena/gravilla/agua), incluso en los
elementos más estructuralmente críticos (Viga, Losa, Pilar). Solo Radier — el módulo menos
crítico estructuralmente de los 8 — pregunta y ramifica correctamente. Se documenta como
hallazgo transversal específico de esta categoría (no aplica a otras categorías, por eso
no se agrega a las tablas transversales generales).

**Preguntas sin `helpText` cuyo contexto vive solo en la guía:** no se encontró ningún
caso nuevo en esta tanda — al contrario, Losa (espesor), Fundación (cuello) y Viga
(ancho/alto) son ejemplos de `helpText` bien puesto, el patrón correcto. La única falta de
contexto real encontrada (Muro — si es de contención de terreno) no es un caso de
"explicación en la guía en vez de helpText", porque **no existe la pregunta en absoluto**
— es un hueco de contenido distinto, documentado en el módulo de Muro, no en la tabla
transversal de helpText.

**Guías no adaptadas al riesgo específico:** sin casos nuevos de guía compartida — los 8
módulos de Hormigón tienen guía propia, cada una reflejando bien el riesgo particular del
elemento (drenaje en muros de contención, curado en losas, compactación en fundación,
puntales en viga, contrahuella en escalera, amarre sísmico en cadena, verticalidad en
pilar).

**Pluralización:** 2 casos nuevos confirmados en navegador — "15 bolsa" (Muro de hormigón
armado, 4m×2.4m×20cm) y "3 bolsa" (Pilar/columna, 3 pilares de 20×20cm×2.4m). Se suman a
la tabla transversal. El resto de materiales de hormigón (arena, gravilla en m³; agua en
litro) no mostró el bug porque sus unidades ("m³", "litro") no cambian de forma entre
singular y plural en español.

**Pendiente de tu revisión antes de seguir con la categoría 13.**

---

# Categoría: Piscinas

## Piscina circular (hormigón armado) (piscina-circular-hormigon-armado)

Categoría: Piscinas

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 5/5, Disclaimer 5/5, Flujo 4/5 — Global: 5/5

Veredicto: MANTENER

Motivo: Diagrama de dimensiones correcto y consistente con el resto de la app. Las
preguntas de espesor de muro y de fondo tienen `helpText` excelente y específico ("el
grosor de las paredes verticales... que contiene el agua", "equivalente al radier de una
construcción normal, pero armado para contener agua"). El resultado incluye "Malla de
refuerzo recomendada: 2 capas — doble malla... habitual cuando aumenta la profundidad y el
empuje del agua/terreno", un buen ejemplo del estándar de "resultado explicado" (no solo
la cantidad, también el porqué). El disclaimer (norma `OBRA-PISCINA-DIMENSIONAMIENTO`) es
de los más completos de toda la app: explícitamente pide estudio de mecánica de suelos y
verificación del nivel freático antes de excavar, y aclara que el espesor real debe
confirmarlo un profesional.

**Comparación con el hallazgo A de Hormigón (Tanda 12) — verificado, diseño distinto y
justificado:** a diferencia de los 7 módulos de la categoría Hormigón que siempre entregan
dosificación manual (bolsas de cemento/arena/gravilla) sin preguntar cómo se va a obtener
el hormigón, Piscinas entrega directamente el volumen total en **m³** ("Hormigón: 9 m³"),
sin desglosar en bolsas. Es una diferencia de diseño justificada, no una inconsistencia: en
una piscina el volumen de hormigón es grande y el colado necesita ser continuo, por lo que
en la práctica casi siempre se usa hormigón premezclado — dar el resultado en m³ es
exactamente el dato que se le entrega a un proveedor de hormigón, y evita el problema que sí
tienen los módulos individuales de Hormigón (dosificación manual irrelevante para quien va
a comprar premezclado).

Recomendación concreta: agregar a `commonMistakes` una advertencia sobre no agregar agua
extra al hormigón premezclado en obra (mismo hueco del chequeo de "falta de contexto del
insumo" de esta tanda — ver sección transversal) y, si es hormigón preparado en obra, no
diluir la mezcla para facilitar el vaciado.

Recomendación gráfica: ninguna — el diagrama ya es correcto y suficiente.

## Piscina rectangular (hormigón armado) (piscina-rectangular-hormigon-armado)

Categoría: Piscinas

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 5/5, Disclaimer 5/5, Flujo 4/5 — Global: 5/5

Veredicto: MANTENER

Motivo: Mismos fundamentos que Piscina circular (comparte guía textual idéntica — ya
documentado como caso justificado en la tabla transversal de guías compartidas, mismo
perfil de riesgo). Confirmado en navegador con 6m×3m×1.5m, espesores 20cm, cerámica en
todo el interior: resultado "Hormigón: 9 m³", "Revestimiento: 37 unidad" (bug de
pluralización — ver tabla transversal), "Malla de refuerzo recomendada: 2 capas" con la
misma explicación condicionada a profundidad.

Recomendación concreta: misma que Piscina circular — advertencia de no agregar agua extra
al hormigón.

Recomendación gráfica: ninguna — diagrama de 3 dimensiones (largo×ancho×profundidad)
correcto.

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Piscina circular (hormigón armado) | 5/5 | MANTENER |
| Piscina rectangular (hormigón armado) | 5/5 | MANTENER |

**Chequeo especial de esta tanda — riesgo de falla de material (insumo, no solo
instalación):** aplicado a los 2 módulos. Igual que en Hormigón (Tanda 12), ninguno
advierte sobre no agregar agua extra al hormigón para facilitar el vaciado. Se suma como
tercer caso a la nueva sección transversal "Falta de contexto del insumo" (ver más abajo).
La guía sí cubre "no impermeabilizar bien las juntas" en `commonMistakes`, pero eso es
sobre ejecución (cómo se aplica la impermeabilización), no sobre verificar la calidad del
material de impermeabilización o del hormigón en sí — el mismo tipo de distinción que
motivó este chequeo especial desde Madera (Tanda 10).

**Diferencia de diseño verificada como justificada (instrucción recurrente):** Piscinas
entrega el hormigón en m³ directos en vez de desglosarlo en bolsas de cemento/arena/
gravilla como hace el resto de la categoría Hormigón — justificado porque el volumen es
grande y el colado continuo hace casi universal el uso de hormigón premezclado en piscinas,
a diferencia de elementos más chicos (un pilar, un tramo de cadena) donde mezclar en obra
es más común. Documentado en el módulo de Piscina circular.

**Guías no adaptadas al riesgo específico:** sin casos nuevos — el grupo "piscina
rectangular / piscina circular" ya estaba documentado en la tabla transversal desde el
inicio de la auditoría (mismo perfil de riesgo, guía compartida correctamente).

**Preguntas sin `helpText`:** sin casos nuevos — las preguntas de espesor de muro/fondo son
otro buen ejemplo del patrón correcto (`helpText` específico y útil en el momento).

**Pluralización:** 1 caso nuevo confirmado en navegador — "37 unidad" (Revestimiento,
Piscina rectangular, cerámica en todo el interior). Se suma a la tabla transversal. El
material "Hormigón" (m³) no mostró el bug por la misma razón que arena/gravilla/agua en
Hormigón: su unidad no cambia de forma en español.

**Pendiente de tu revisión antes de seguir con la categoría 14.**

---

# Categoría: Yeso Cartón

Cierra un loose end pendiente desde varias tandas atrás: "Tabiques y cielos" solo se había
visto de pasada como parte del trío de guías compartidas con Madera y Metalcon (Tandas 9 y
10) — nunca se auditó como categoría propia. Ninguno de los 2 módulos es estructural (son
revestimiento/terminación, no la estructura del tabique en sí), así que el chequeo especial
de "riesgo de falla de material" de las últimas tandas no aplica de la misma forma acá —
se nota explícitamente en cada módulo en vez de forzarlo.

## Tabiques y cielos (tabiques-y-cielos)

Categoría: Yeso Cartón

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 4/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: El input de dimensiones ya usa `AreaInputToggle` (largo×alto / m² directo) con
diagrama, consistente con el resto de la app — mejora respecto a lo que mostraba la DB
(un `stepGroup` que hoy ya se renderiza con el componente estándar). Las preguntas de
"¿un lado o ambos lados?" y "¿muro o cielo?" son autocontenidas gracias a los ejemplos
entre paréntesis en las propias opciones (ej. "Un lado (ej. cielo, o tabique contra muro
existente)"), sin necesitar `helpText` aparte. La guía es la ya confirmada como correcta
del trío tabique-compartido (Tandas 9-10): "toda su solidez depende de que la estructura...
quede exactamente a plomo" — enfocada en el riesgo real (plomo, pasadas eléctricas antes de
cerrar). El chequeo de riesgo de falla de material no aplica de forma fuerte acá porque el
módulo no calcula la estructura (montantes/soleras) — esa parte la cubren los módulos de
Metalcon o Madera por separado; "Tabiques y cielos" es solo la capa de planchas y
tornillos, un diseño de separación de responsabilidades razonable, no un hueco. Confirmado
en navegador con 4m×2.4m, ambos lados, muro: "8 plancha" y "1 cajas de 1000" — dos bugs de
pluralización, uno en cada dirección (cantidad>1 con singular, y el patrón original de la
auditoría, cantidad=1 con plural).

Recomendación concreta: ninguna funcional — el único punto a corregir es la
pluralización, ya documentada en la tabla transversal.

Recomendación gráfica: ninguna — el diagrama ya es correcto y consistente.

## Terminar junturas de yeso cartón (terminar-junturas-de-yeso-carton)

Categoría: Yeso Cartón

Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 5/5, Resultado 5/5, Disclaimer 4/5, Flujo 5/5 — Global: 5/5

Veredicto: MANTENER

Motivo: El módulo mejor resuelto de esta tanda, y uno de los mejores de toda la auditoría.
Las dos preguntas tienen `helpText` específico y útil ("Suma el área de todas las caras con
plancha — si el tabique tiene plancha por ambos lados, cuenta ambos"; "Las esquinas
exteriores... llevan esquinero metálico para que no se despostillen"). Los resultados traen
`note` explicativa en dos de los cuatro materiales (pasta: "considera al menos 2-3 manos";
huincha: "se vende en rollos... compra el rollo que cubra este total") — exactamente el
estándar de "resultado explicado" de Tanda B. La guía es muy específica y con contenido de
calidad profesional real (la técnica de "luz rasante" para revisar imperfecciones antes de
pintar, por qué cada mano debe ser más ancha que la anterior). Las FAQ están bien elegidas
y resuelven dudas reales (huincha de papel vs. malla, cuántas manos, si se puede pintar
directo después de lijar). Confirmado en navegador con 40m², 3-4 esquinas: "4 pieza" y "2
hoja" — dos bugs de pluralización más, mismo origen que el resto de la app.

Recomendación concreta: ninguna funcional — el único punto a corregir es la
pluralización.

Recomendación gráfica: ninguna necesaria.

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Tabiques y cielos | 4/5 | MEJORAR |
| Terminar junturas de yeso cartón | 5/5 | MANTENER |

**Chequeo especial de tandas anteriores (riesgo de falla de material):** no aplica de
forma fuerte a esta categoría — ninguno de los 2 módulos es estructural. Se nota
explícitamente en vez de forzar el chequeo, siguiendo el criterio ya usado para módulos no
estructurales en categorías anteriores.

**Guías no adaptadas al riesgo específico:** sin casos nuevos — el trío de tabique
compartido (yeso cartón / madera / Metalcon) ya está completamente cerrado desde la Tanda
10; "Tabiques y cielos" confirma en su propia tanda lo que ya se sabía: su guía es correcta
para el riesgo real de yeso cartón.

**Explicación fuera de lugar (guía en vez de helpText):** sin casos nuevos — ambos módulos
tienen las preguntas bien autocontenidas (ejemplos en las opciones o `helpText` directo).

**Falta de contexto del insumo:** no aplica — ninguno de los 2 módulos es estructural, y no
se identificó un caso equivalente para materiales de terminación (planchas, pasta, huincha).

**Pluralización:** 4 casos nuevos confirmados en navegador — "8 plancha" y "1 cajas de
1000" (Tabiques y cielos, este último es el patrón original de la auditoría: cantidad=1 con
unidad en plural), "4 pieza" y "2 hoja" (Terminar junturas de yeso cartón). Se suman a la
tabla transversal.

**Pendiente de tu revisión antes de seguir con la categoría 15.**

---

# Categoría: Quinchos

Categoría pequeña (2 módulos) que nunca se había auditado formalmente — "Techo de tejas o
policarbonato" solo se había tocado de pasada en una tanda anterior como cierre de un loose
end puntual, y "Estructura y techo" nunca se había revisado.

## Estructura y techo (estructura-y-techo)

Categoría: Quinchos

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 3/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: Diagrama de dimensiones correcto y consistente (mismo componente estándar de la
app). El disclaimer es honesto sobre su propia simplificación: la norma
`OBRA-QUINCHO-ESTRUCTURA` aclara explícitamente "la inclinación del techo se asume fija
(factor 1.15)... no se le pregunta al usuario, a diferencia del módulo Techumbres" — es una
buena práctica de transparencia, no oculta la simplificación. Punto débil: ninguna de las
tres fórmulas de resultado (postes, vigas, cubierta) tiene `note` explicando la conversión
— el resultado muestra "7 pieza de 3m" sin decir "cada viga comercial mide 3m", ni "10
unidad" de cubierta sin decir cuántos m² cubre cada plancha/teja, a diferencia de otros
módulos de la app que sí lo hacen (Piscinas, Terminar junturas de yeso cartón). Confirmado
en navegador con 5m×4m, postes cada 3m, zinc: "6 poste", "7 pieza de 3m", "10 unidad" — los
tres resultados con bug de pluralización.

Recomendación concreta: agregar `note` a las tres fórmulas de resultado explicando la
conversión (largo de pieza comercial para vigas, cobertura por unidad para la cubierta).

Recomendación gráfica: ninguna — el diagrama ya es correcto.

## Techo de tejas o policarbonato (techo-de-tejas-o-policarbonato)

Categoría: Quinchos

Notas: Lenguaje 5/5, Autocontenido 3/5, Visual 5/5, Resultado 3/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: Comparte guía textual idéntica con "Estructura y techo" — ya documentado como caso
justificado en la tabla transversal (ambos módulos involucran trabajo en altura real). El
disclaimer es igual de honesto que el módulo hermano sobre sus simplificaciones. Mismo
hueco de `note` faltante en postes/vigas/planchas.

**Hallazgo específico de este módulo — FAQ desalineada con las opciones reales:** la
pregunta frecuente "¿Qué cubierta dura más?" responde "El zinc es más económico y
duradero; la teja asfáltica se ve mejor pero requiere más mantenimiento" — pero este módulo
**no ofrece zinc como opción** (solo Policarbonato alveolar y Teja asfáltica), y la
respuesta ni siquiera menciona el policarbonato, que es la opción que da nombre al módulo.
Esto viene de compartir la misma guía que "Estructura y techo" (que sí ofrece zinc) sin
adaptar la FAQ a las opciones reales de este módulo — un caso adyacente al patrón de
"guías no adaptadas al riesgo específico" ya documentado, pero aplicado a relevancia de
contenido en vez de a representación de riesgo, así que se documenta acá en vez de forzarlo
en esa tabla. También hay una inconsistencia menor de término entre módulos: "Tejuela
asfáltica" (Estructura y techo) vs. "Teja asfáltica" (este módulo) para lo que la norma
confirma que son los mismos valores de rendimiento — mismo material, dos nombres.
Confirmado en navegador con 5m×4m, policarbonato alveolar: "6 poste", "7 pieza de 3m", "3
plancha" — tres bugs de pluralización más.

Recomendación concreta: reemplazar la FAQ "¿Qué cubierta dura más?" por una que compare
policarbonato alveolar vs. teja asfáltica (las opciones reales de este módulo); unificar
el nombre "teja/tejuela asfáltica" entre ambos módulos de la categoría; agregar `note` a
postes/vigas/planchas.

Recomendación gráfica: ninguna — diagrama correcto.

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Estructura y techo | 4/5 | MEJORAR |
| Techo de tejas o policarbonato | 4/5 | MEJORAR |

**Chequeo especial de tandas anteriores (riesgo de falla de material):** aplica solo
parcialmente y se documenta como "no aplica con fuerza" en vez de forzarlo — los postes y
vigas de un quincho SÍ son elementos estructurales (sostienen un techo, y un poste mal
anclado es justamente el riesgo que la propia guía destaca como el más importante), pero
ninguno de los 2 módulos especifica el material del poste/viga (madera vs. metal), a
diferencia de Acero, Madera u Hormigón, así que no hay un material concreto sobre el cual
recomendar una inspección específica. Se deja anotado como oportunidad menor (ej. "revisa
que el poste no tenga rajaduras u óxido según el material que uses"), no como un hallazgo
del mismo peso que en categorías estructurales de la casa principal.

**Guías no adaptadas al riesgo específico:** sin casos nuevos — el grupo "Estructura y
techo / Techo de tejas o policarbonato" ya estaba documentado como justificado desde el
inicio de la auditoría. Sí se encontró un caso adyacente (FAQ desalineada con las opciones
del módulo, no un problema de riesgo) documentado directamente en el módulo afectado.

**Explicación fuera de lugar (guía en vez de helpText):** sin casos nuevos — las preguntas
de ambos módulos son autocontenidas por los ejemplos en las propias opciones.

**Falta de contexto del insumo:** no aplica con fuerza — ver nota en el chequeo especial
arriba.

**Pluralización:** 6 casos nuevos confirmados en navegador — "6 poste", "7 pieza de 3m",
"10 unidad" (Estructura y techo); "6 poste", "7 pieza de 3m", "3 plancha" (Techo de tejas o
policarbonato). Se suman a la tabla transversal.

**Pendiente de tu revisión antes de seguir con la categoría 16.**

---

# Categoría: Pisos y Revestimientos (Cerámica)

La categoría más grande que quedaba sin auditar como tanda propia (5 módulos). En general
es una de las mejor resueltas de toda la auditoría: el patrón de `note` interpolada
("Cada caja cubre X m² → para Y m² + Z% de pérdida necesitas N cajas") —el estándar que
define esta auditoría desde el principio— está implementado de forma consistente en los 5
módulos, no solo en uno.

## Cerámica (pisos) (ceramica-pisos)

Categoría: Pisos y Revestimientos

Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 5/5, Resultado 5/5, Disclaimer 5/5, Flujo 5/5 — Global: 5/5

Veredicto: MANTENER

Motivo: El mejor ejemplo de "autocontenido" de toda la auditoría: la pregunta "¿Sabes
cuántos m² trae la caja de tu producto específico? (dato impreso en el empaque)" deja
elegir entre un promedio de mercado o el dato real del envase — reconoce explícitamente que
la cobertura varía por fabricante en vez de forzar un promedio como verdad única. El
disclaimer va más allá de lo habitual: cita una referencia real de fabricante (Bekron DA,
Grupo Polpaico, "4-5 m²/saco... el valor de ~4 m²/saco usado aquí es el extremo
conservador") en vez de solo decir "valores no verificados". El resultado de cajas de
cerámica trae la `note` completa con el estándar de la auditoría. Único punto menor: los
resultados secundarios (adhesivo, fragüe) no traen esa misma `note`, a diferencia del
resultado principal — inconsistencia leve, no un defecto real dado que ya están bien
etiquetados con la unidad "saco"/"bolsa".

Recomendación concreta: extender la `note` de conversión también a adhesivo y fragüe, por
consistencia con el resultado principal.

Recomendación gráfica: ninguna — no aplica diagrama adicional (son m² directos con opción
de personalizar cobertura).

## Revestimiento de muro (revestimiento-de-muro)

Categoría: Pisos y Revestimientos

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 5/5, Disclaimer 5/5, Flujo 4/5 — Global: 5/5

Veredicto: MANTENER

Motivo: Comparte la misma guía que Cerámica (pisos) y Porcelanato — ya documentado como
caso justificado (mismo perfil de riesgo: corte de piezas, polvo). El input de alto×largo
usa `AreaInputToggle` con diagrama, consistente con el resto de la app. Único punto
observado: a diferencia de Pintura (que sí permite descontar puertas/ventanas del área), acá
no hay opción de descontar vanos del muro — aceptable para el caso de uso típico
(revestir un muro de baño o cocina, generalmente sin ventanas grandes), pero vale la pena
como mejora menor si se usa para un muro con vanos grandes.

Recomendación concreta: evaluar agregar el mismo descuento de vanos que usa
`AreaInputToggle` en otros módulos (`enableDeduction`), para el caso de un muro con
ventana.

Recomendación gráfica: ninguna — el diagrama ya es correcto.

## Porcelanato (piso) (porcelanato-piso)

Categoría: Pisos y Revestimientos

Notas: Lenguaje 5/5, Autocontenido 5/5, Visual 5/5, Resultado 5/5, Disclaimer 5/5, Flujo 5/5 — Global: 5/5

Veredicto: MANTENER

Motivo: Mismos fundamentos que Cerámica (pisos) — mismo patrón de cobertura personalizable
por producto, mismo tipo de `note` con el estándar de la auditoría, y confirmado que el
material está correctamente nombrado "Porcelanato" en sus resultados (no hereda el nombre
"Cerámica" del módulo del que probablemente se clonó al crearlo) — sin el tipo de bug de
nomenclatura heredada que sí se encontró en Quinchos (Tanda 15, FAQ zinc/policarbonato) o en
Metalcon (Tanda 9, seguridad de corte). Comparte guía con Cerámica y Revestimiento de muro,
correctamente (mismo perfil de riesgo).

Recomendación concreta: ninguna funcional.

Recomendación gráfica: ninguna necesaria.

## Piso SPC (vinílico rígido) (piso-spc-vinilico-rigido)

Categoría: Pisos y Revestimientos

Notas: Lenguaje 5/5, Autocontenido 3/5, Visual 5/5, Resultado 5/5, Disclaimer 5/5, Flujo 3/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: El resultado trae la `note` completa con el estándar de la auditoría tanto para
cajas de piso como para rollos de base acústica. Disclaimer honesto y específico. **Hueco
encontrado — mismo patrón que la Ducha (Tanda 1) y el % de traslapo en Acero (Tanda 11):**
la pregunta "¿Qué tipo de instalación? Recto/Diagonal" no tiene `helpText` ni explica que
la instalación diagonal genera más corte y por lo tanto más pérdida de material — esa
explicación solo vive en la `note` del resultado ("la instalación diagonal genera más
cortes y por eso se asume mayor pérdida"), visible recién después de haber elegido a
ciegas. Es un caso nuevo para la tabla transversal de "explicación fuera de lugar".

Recomendación concreta: agregar `helpText` a la pregunta de tipo de instalación, ej. "La
instalación diagonal se ve mejor en espacios grandes, pero genera más cortes y por lo
tanto necesitas más material (~15% extra vs. ~8% en instalación recta)."

Recomendación gráfica: ninguna necesaria.

## Piso flotante (laminado) (piso-flotante-laminado)

Categoría: Pisos y Revestimientos

Notas: Lenguaje 5/5, Autocontenido 3/5, Visual 5/5, Resultado 5/5, Disclaimer 5/5, Flujo 3/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: Mismos fundamentos que Piso SPC (comparte guía, justificado). Confirmado en
navegador con 6m×4.5m, instalación diagonal: "15 caja" (con `note`: "Cada caja cubre 2,2
m² → para 27 m² + 15% de pérdida necesitas 15 cajas" — la nota interpolada sí pluraliza
correctamente "cajas" y "rollos" dentro del texto, es solo el número destacado arriba
["15 caja"] el que tiene el bug), "3 rollo", "10 pieza" (moldura). Mismo hueco de
`helpText` faltante en "¿Qué tipo de instalación?" que Piso SPC — caso nuevo, mismo patrón,
para la tabla transversal.

Recomendación concreta: mismo `helpText` que Piso SPC en la pregunta de tipo de
instalación.

Recomendación gráfica: ninguna necesaria.

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Cerámica (pisos) | 5/5 | MANTENER |
| Revestimiento de muro | 5/5 | MANTENER |
| Porcelanato (piso) | 5/5 | MANTENER |
| Piso SPC (vinílico rígido) | 4/5 | MEJORAR |
| Piso flotante (laminado) | 4/5 | MEJORAR |

**Contenido heredado irrelevante o inconsistencia de nombre entre módulos:** verificado
específicamente por tu pedido de esta tanda — no se encontró ningún caso nuevo. Porcelanato
(piso) nombra correctamente su material "Porcelanato" (no heredó "Cerámica" del módulo del
que se clonó), a diferencia del caso de Quinchos (Tanda 15). Se documenta la verificación
explícitamente, no solo la ausencia de hallazgos.

**Guías no adaptadas al riesgo específico:** sin casos nuevos — los dos grupos de esta
categoría (Cerámica/Porcelanato/Revestimiento de muro, y Piso flotante/SPC) ya estaban
documentados como justificados desde el inicio de la auditoría.

**Explicación fuera de lugar (guía en vez de helpText):** 2 casos nuevos — la pregunta
"¿Qué tipo de instalación? (Recto/Diagonal)" en Piso SPC y en Piso flotante (laminado) no
explica que la instalación diagonal implica más pérdida de material; esa explicación vive
solo en la `note` del resultado. Se suman a la tabla transversal.

**Falta de contexto del insumo:** no aplica — ninguno de los 5 módulos es estructural,
consistente con el criterio ya usado en Yeso Cartón (Tanda 14).

**Pluralización:** confirmado en navegador — "15 caja", "3 rollo", "10 pieza" (Piso
flotante laminado, instalación diagonal). Por el patrón ya establecido en toda la
categoría (mismas unidades "caja"/"saco"/"bolsa"/"rollo"/"pieza" sin lógica de
pluralización), se asume el mismo bug presente en los demás módulos con resultado >1 o =1;
se documenta el caso confirmado directamente y se anota el patrón para los demás.

**Pendiente de tu revisión antes de seguir con la categoría 17.**

---

# Categoría: Pintura

3 módulos, ninguno auditado antes como tanda propia. Antes de entrar al detalle: se
verificó específicamente si el input de superficie de Pintura había sufrido una regresión
(la pregunta `superficie-final-m2` fue modificada hoy mismo, 2026-07-28, reemplazando lo
que antes eran preguntas fijas de conteo de puertas por un solo campo con `helpText`
"puedes descontar puertas y ventanas"). Confirmado en navegador: **no es una regresión** —
el campo usa el mismo `AreaInputToggle` con descuento de vanos interactivo que el resto de
la app (largo×alto + "Agregar puerta o ventana"), no un campo manual donde el usuario tenga
que restar a mano. Lo que sí quedó desactualizado es el propio `helpText`, que describe el
comportamiento como si fuera manual ("puedes descontar puertas y ventanas") en vez de
describir la función interactiva real — se documenta como hallazgo de contenido
desactualizado en cada módulo afectado, sin forzarlo en las tablas transversales.

## Pintura (pintura)

Categoría: Pintura

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 4/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: El input de superficie usa `AreaInputToggle` con descuento de vanos, correcto y
consistente con el resto de la app. **Hallazgo de contenido desactualizado:** el `helpText`
de la pregunta ("Ingresa largo × alto (puedes descontar puertas y ventanas) o el área ya
calculada en m²") describe el descuento como algo que el usuario calcula, cuando en
realidad hay una sección interactiva "Puertas y ventanas a descontar" que lo hace por él —
texto que probablemente quedó de una versión anterior del campo (antes era manual) y no se
actualizó al migrar al componente interactivo hoy. **Pluralización — patrón de doble
dirección en el mismo módulo:** confirmado en navegador con dos corridas — "3 galón"
(15m² × 3 manos, sin base) muestra cantidad>1 con unidad singular, y "1 manos" (10m², 1
mano) muestra cantidad=1 con unidad en plural — el mismo bug de raíz (unidad fija sin
lógica de pluralización) expresado en ambas direcciones dentro del mismo módulo.

Recomendación concreta: actualizar el `helpText` para reflejar la función interactiva real
(ej. "Ingresa largo × alto — puedes agregar puertas y ventanas para descontarlas
automáticamente, o cambiar a 'm² directo' si ya tienes el área calculada").

Recomendación gráfica: ninguna — el diagrama y el descuento de vanos ya son correctos.

## Pintar una fachada exterior (pintar-fachada-exterior)

Categoría: Pintura

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 4/5, Disclaimer 5/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: Guía propia y específica, no compartida con otro módulo — buen contenido de
seguridad en altura (andamio/arnés) y un buen ejemplo de "resultado explicado": la `note`
del sellador explica cuándo aplicarlo y que hay que dejarlo secar antes de pintar encima.
Mismo hallazgo de `helpText` desactualizado que Pintura (interior) en la pregunta de
superficie — mismo texto heredado, mismo problema. Confirmado en navegador con 30m², 2
manos, primera vez: "2 galón" — bug de pluralización.

Recomendación concreta: mismo ajuste de `helpText` que Pintura (interior).

Recomendación gráfica: ninguna necesaria.

## Preparar y estucar un muro antes de pintar (preparar-y-estucar-un-muro)

Categoría: Pintura

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 5/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: A diferencia de los otros 2 módulos, este SÍ tiene `helpText` null en la pregunta
de área (no hereda el texto desactualizado) — sin el hallazgo de contenido desactualizado
de los módulos hermanos. El resultado de masilla trae `note` explicativa sobre tiempo de
secado; la guía tiene el mejor ejemplo de la categoría de "explicar el porqué, no solo el
qué" (la técnica de luz rasante para detectar imperfecciones). Confirmado en navegador con
30m², estuco completo: "3 hoja" — bug de pluralización.

Recomendación concreta: ninguna funcional más allá de la pluralización.

Recomendación gráfica: ninguna — el input de área directa es apropiado para este caso
(generalmente no se descuentan vanos al estucar toda la superficie).

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Pintura | 4/5 | MEJORAR |
| Pintar una fachada exterior | 4/5 | MEJORAR |
| Preparar y estucar un muro antes de pintar | 4/5 | MEJORAR |

**Contenido heredado desactualizado (no forzado en tablas transversales, por tu
instrucción):** el `helpText` de la pregunta de superficie en Pintura y Pintar fachada
exterior describe un comportamiento manual ("puedes descontar puertas y ventanas") que ya
no aplica — el campo usa `AreaInputToggle` con descuento interactivo real desde hoy mismo.
Documentado en ambos módulos.

**Guías no adaptadas al riesgo específico:** no aplica — los 3 módulos tienen guía propia,
ninguno comparte guía textual con otro.

**Explicación fuera de lugar:** sin casos nuevos — las preguntas de esta tanda están bien
autocontenidas (opciones autodescriptivas o `helpText` presente).

**Falta de contexto del insumo:** no aplica — ninguno de los 3 módulos es estructural.

**Pluralización — con el patrón de "dos textos, uno correcto y otro no" que pediste
vigilar:** no se encontró ese patrón específico esta tanda (a diferencia de Piso flotante
en la Tanda 16, acá los resultados con `note` no repiten el número dentro del texto). Sí se
confirmaron 4 casos nuevos de pluralización simple: "3 galón" y "1 manos" (Pintura, mismo
módulo, ambas direcciones del bug), "2 galón" (Pintar fachada exterior), "3 hoja" (Preparar
y estucar un muro).

**Pendiente de tu revisión antes de seguir con la categoría 18.**

---

# Categoría: Paisajismo

3 módulos. "Siembra por semilla (césped)" ya se había tocado una vez como cierre de loose
end (Tanda 8); "Pasto en rollos" y "Pasto sintético" nunca se habían auditado.

## Pasto en rollos (pasto-en-panes)

Categoría: Paisajismo

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 5/5, Disclaimer 4/5, Flujo 4/5 — Global: 5/5

Veredicto: MANTENER

Motivo: Diagrama con `AreaInputToggle` correcto y consistente. Buen ejemplo de "resultado
explicado": el resultado de tierra de hoja no solo da m³ y su equivalencia en sacos, sino
que agrega "para esta cantidad, normalmente conviene pedirla a granel (por camión) en vez
de en sacos" — consejo de compra práctico, no solo la cifra. Guía enfocada en el riesgo
real (riego las primeras 2 semanas mientras arraiga). Confirmado en navegador con 6m×5m,
rollo 0,5x1m: "63 rollo" y "38 saco de 40L" — bugs de pluralización.

Recomendación concreta: ninguna funcional más allá de la pluralización.

Recomendación gráfica: ninguna — diagrama ya correcto.

## Siembra por semilla (césped) (siembra-por-semilla-cesped)

Categoría: Paisajismo

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 4/5, Disclaimer 5/5, Flujo 4/5 — Global: 5/5

Veredicto: MANTENER

Motivo: También usa `AreaInputToggle`, consistente. El mejor ejemplo de disclaimer
proporcional al riesgo de toda la categoría: `safetyRecommendations` dice explícitamente
"Sin riesgos particulares más allá del trabajo habitual de jardín" — proporcional en vez de
inventar riesgo donde no lo hay, el mismo criterio que ya se había visto bien aplicado en
otras categorías de bajo riesgo. Confirmado en navegador con 50m²: "1,5 kg" y "2,5 kg" — sin
bug de pluralización (kg no cambia de forma en español), a diferencia del resto de la
categoría.

Recomendación concreta: ninguna.

Recomendación gráfica: ninguna necesaria.

## Pasto sintético (pasto-sintetico)

Categoría: Paisajismo

Notas: Lenguaje 5/5, Autocontenido 3/5, Visual 3/5, Resultado 5/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: El resultado trae dos notas explicativas excelentes ("compras más área de la que
realmente cubres... porque el rollo se vende en franjas de ancho fijo y los sobrantes no se
reutilizan de forma práctica") — el mejor ejemplo de "resultado explicado" de la categoría.

**Hallazgo — inconsistencia dentro de la propia categoría:** a diferencia de "Pasto en
rollos" y "Siembra por semilla" (ambos con `AreaInputToggle` y diagrama), este módulo
todavía usa el patrón antiguo de dos campos NUMBER sueltos sin diagrama — confirmado en
navegador, no aparece el toggle "largo × ancho / m² directo" que sí tienen sus dos módulos
hermanos de la misma categoría.

**Hallazgo — guía no adaptada a un riesgo que el propio módulo ofrece:** la pregunta
"¿Vas a instalar una base bajo el pasto?" incluye la opción "Sí, manto de caucho
(amortiguación — **común en áreas de juego infantil**)" — pero ni la guía ni el disclaimer
mencionan que, para juegos infantiles, el espesor de amortiguación necesario depende de la
altura de caída del equipo de juego (un estándar de seguridad real en parques infantiles).
La guía trata esta opción exactamente igual que el pasto sintético decorativo de un jardín
común — incluso la nota del disclaimer, que sí menciona "residencial vs. área de alto
tránsito o juegos infantiles" para el consumo de materiales, no lo hace para la seguridad
de la amortiguación. Se documenta acá, en el módulo, sin forzarlo en la tabla de guías
compartidas (no es un caso de guía duplicada entre módulos, es un riesgo propio del módulo
que su única guía no cubre).

Confirmado en navegador con 10m×4m, rollo de 2m, base de gravilla, con relleno: "140
unidad" (grapas) — bug de pluralización. El resto de resultados (m lineal, m², m³, kg) no
mostró el bug porque esas unidades no cambian de forma en español.

Recomendación concreta: unificar el input de dimensiones con `AreaInputToggle`, como sus
2 módulos hermanos; agregar a `safetyRecommendations` una nota sobre espesor de
amortiguación adecuado según altura de caída cuando la superficie es para juegos
infantiles.

Recomendación gráfica: agregar el diagrama estándar de la app (`MeasureDiagram` vía
`AreaInputToggle`) — hoy es el único módulo de la categoría sin él.

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Pasto en rollos | 5/5 | MANTENER |
| Siembra por semilla (césped) | 5/5 | MANTENER |
| Pasto sintético | 4/5 | MEJORAR |

**Guías no adaptadas al riesgo específico:** sin casos nuevos que encajen en el formato de
la tabla (guía idéntica compartida entre 2+ módulos) — los 3 módulos de esta categoría
tienen guía propia. Sí se encontró un caso adyacente y distinto (Pasto sintético no adapta
su única guía a uno de sus propios riesgos internos, el de amortiguación para juegos
infantiles) — documentado directamente en el módulo, como pediste.

**Explicación fuera de lugar:** sin casos nuevos.

**Falta de contexto del insumo:** no aplica con fuerza — ninguno de los 3 módulos es
estructural. El caso de amortiguación de Pasto sintético es de un tipo distinto (falta de
adaptación a un uso específico, no falta de inspección de un insumo antes de usarlo), por
eso se documentó como hallazgo propio del módulo y no como caso de esta sección.

**Pluralización:** 3 casos nuevos confirmados en navegador — "63 rollo" y "38 saco de 40L"
(Pasto en rollos), "140 unidad" (Pasto sintético, grapas). Siembra por semilla no mostró el
bug (sus unidades, "kg", no cambian de forma).

**Pendiente de tu revisión antes de seguir con la categoría 19 (Exterior, la última).**

---

# Categoría: Exterior

Última categoría de la auditoría. 4 módulos, ninguno auditado antes.

## Sendero peatonal (hacer-un-sendero)

Categoría: Exterior

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 4/5, Disclaimer 5/5, Flujo 4/5 — Global: 5/5

Veredicto: MANTENER

Motivo: Diagrama correcto, `helpText` útil en ancho ("lo típico es entre 0,6 y 1 metro,
para que pase una persona cómoda"). El disclaimer es un buen ejemplo de proporcionalidad
específica: "los senderos peatonales no requieren el mismo espesor ni refuerzo que un
radier vehicular — esta calculadora asume tránsito solo de personas", dejando claro el
límite de uso sin alarmar de más. Confirmado en navegador con 12m×0,8m, piedra laja: "11
m²" — sin bug de pluralización (la unidad no cambia de forma).

Recomendación concreta: ninguna.

Recomendación gráfica: ninguna necesaria.

## Pastelones prefabricados (instalar-pastelones)

Categoría: Exterior

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 3/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: Diagrama/input correcto. Punto débil: la fórmula de "Pastelones" no trae `note`
explicando la conversión (cobertura por unidad según tamaño) — es prácticamente el caso de
manual del estándar de Tanda B (cajas/rollos) y no lo tiene, a diferencia de la mayoría de
los módulos de cobertura-por-unidad ya auditados en otras categorías. Confirmado en
navegador con 10m², pastelón 40x40cm: "68 unidad" — bug de pluralización.

Recomendación concreta: agregar `note` a la fórmula de pastelones (ej. "Cada pastelón de
40x40cm cubre 0,16 m² → para 10 m² + 8% de pérdida necesitas 68 pastelones").

Recomendación gráfica: ninguna necesaria.

## Jardinera de albañilería (hacer-jardineras)

Categoría: Exterior

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 5/5, Resultado 4/5, Disclaimer 4/5, Flujo 4/5 — Global: 4/5

Veredicto: MEJORAR

Motivo: Diagrama de 3 dimensiones correcto. La guía tiene el mejor ejemplo de "valor más
allá del cálculo" de la categoría: el `masterTip` recomienda una capa de gravilla de
drenaje en el fondo "aunque no esté en el cálculo de materiales" — reconoce explícitamente
que el consejo más importante no es lo que la calculadora cuantifica. Confirmado en
navegador con 4m×0,4m×0,4m, bloque de hormigón: "22 unidad" — bug de pluralización.

Recomendación concreta: ninguna funcional más allá de la pluralización.

Recomendación gráfica: ninguna necesaria.

## Riego por goteo (instalar-riego-por-goteo)

Categoría: Exterior

Notas: Lenguaje 5/5, Autocontenido 4/5, Visual 4/5, Resultado 5/5, Disclaimer 5/5, Flujo 5/5 — Global: 5/5

Veredicto: MANTENER

Motivo: El módulo mejor resuelto de la categoría. `helpText` claro en la pregunta de largo
("suma el largo de cada hilera de plantas o el perímetro..."). El resultado de conectores
trae `note` explicando el supuesto ("estimado para rollos típicos de ~6m... la cantidad
real depende del largo del rollo que compres") — honesto sobre su propia limitación. El
disclaimer explica el porqué real (presión de agua cae al final de líneas muy largas) y la
guía refuerza la misma idea con una recomendación concreta (dividir en circuitos). Sin
diagrama, apropiado — es una medida lineal, no un área. Confirmado en navegador con 20m,
goteros cada 30cm, con temporizador: "67 unidad" (goteros) y "4 unidad" (conectores) — bugs
de pluralización; "1 unidad" (tapón, temporizador) correctamente singular.

Recomendación concreta: ninguna funcional.

Recomendación gráfica: ninguna necesaria.

## Resumen de la tanda

| Módulo | Global | Veredicto |
|---|---|---|
| Sendero peatonal | 5/5 | MANTENER |
| Pastelones prefabricados | 4/5 | MEJORAR |
| Jardinera de albañilería | 4/5 | MEJORAR |
| Riego por goteo | 5/5 | MANTENER |

**Guías no adaptadas al riesgo específico:** no aplica — los 4 módulos tienen guía propia,
ninguno comparte guía textual con otro.

**Explicación fuera de lugar:** sin casos nuevos — las preguntas están bien autocontenidas
(`helpText` presente donde hace falta, opciones autodescriptivas donde no).

**Falta de contexto del insumo:** no aplica — ninguno de los 4 módulos es estructural
(sendero, pastelones y jardinera son elementos de patio de baja carga; riego por goteo no
es ni siquiera un elemento físico de carga).

**Pluralización:** 3 casos nuevos confirmados en navegador — "68 unidad" (Pastelones), "22
unidad" (Jardinera), "67 unidad" y "4 unidad" (Riego por goteo, goteros y conectores).
Sendero peatonal no mostró el bug (unidades m²/m³ invariantes).

**Fin de la auditoría por categoría — las 19 categorías del sistema quedan cubiertas.**
Sigue el resumen ejecutivo al final del archivo.

---

## Hallazgo transversal: guías no adaptadas al riesgo específico

Investigación sistemática (no solo inspección visual): agrupé todos los `ModuleGuide` de
la app por `summary` idéntico para encontrar TODOS los casos de guía compartida entre
módulos, más allá de lo que ya se había visto de pasada. Resultado — 7 grupos de módulos
comparten guía textual idéntica en toda la app:

| Guía compartida por | Módulos | ¿Riesgo real distinto sin reflejar? |
|---|---|---|
| "Una piscina es de los proyectos más exigentes..." | Piscina rectangular, Piscina circular | No — mismo perfil de riesgo (excavación + hormigón armado + agua) |
| "Un quincho es carpintería relativamente simple..." | Estructura y techo, Techo de tejas o policarbonato (Quinchos) | No — ambos mencionan trabajo en altura y ambos lo involucran realmente |
| "Instalar cerámica, porcelanato o revestimiento..." | Cerámica (pisos), Revestimiento de muro, Porcelanato (piso) | No — mismo perfil (corte de piezas, polvo, cortes con disco) |
| "El piso flotante y el SPC se instalan por encaje..." | Piso flotante (laminado), Piso SPC | No — mismo perfil, instalación de bajo riesgo |
| "Un tabique se arma rápido..." | Tabiques y cielos (yeso cartón), Tabiquería en madera, Tabique en Metalcon | **Sí — ver detalle abajo** |
| "La techumbre es trabajo en altura..." | Techo (cubierta), Aislación térmica bajo cubierta | No — ambos mencionan arnés/línea de vida explícitamente, correcto para ambos |
| "El 90% de las filtraciones no pasan por el medio..." | Impermeabilización, Techo inclinado (bajo teja/zinc) | **Sí — ya documentado arriba, el hallazgo original** |

**Caso nuevo encontrado: Tabique en Metalcon.** Comparte guía palabra por palabra con
"Tabiques y cielos" (yeso cartón) y "Tabiquería en madera" — `safetyRecommendations: ["Usa
gafas y mascarilla al cortar.", "Cuidado con las herramientas eléctricas."]` en los 3. Esto
es razonable para madera y yeso cartón (el riesgo principal es polvo), pero **Metalcon es
perfilería de metal galvanizado** — cortarla con sierra o cizalla genera bordes y rebabas
metálicas afiladas, un riesgo de corte específico que "gafas y mascarilla" no cubre (no
menciona guantes resistentes a corte, ni el riesgo de rebabas cortantes al manipular los
perfiles). Es menos severo que el caso de Techo inclinado (no hay riesgo de caída de
altura), pero es el mismo patrón: guía genérica heredada que omite el riesgo distintivo
del material específico de este módulo.

Recomendación concreta (no implementada, solo documentada): agregar a
`safetyRecommendations` de Tabique en Metalcon una línea específica sobre bordes/rebabas
cortantes al cortar y manipular perfiles metálicos, y considerar guantes de trabajo en
`tools` (hoy no aparecen en ningún módulo de este grupo).

**Actualización (Tanda 9 — categoría Metalcon):** confirmado en navegador, y agravado. El
módulo hermano "Cielo raso en Metalcon" (misma categoría, mismo material) **sí** tiene el
copy correcto: "Usa guantes — el borde cortado del perfil galvanizado es filoso" y
"Lentes de seguridad al taladrar sobre la cabeza, por las virutas metálicas que caen" en
sus `safetyRecommendations`, además de una técnica correcta en `tools`
("Tijeras para metal (hojalatera)" en vez de "Sierra"). Esto convierte el hallazgo de
"omisión de concepto" a "inconsistencia de aplicación": alguien ya escribió la advertencia
correcta para Metalcon en este mismo proyecto, "Tabique en Metalcon" simplemente no la
recibió al migrar de madera a metal. Recomendación revisada: copiar el patrón de "Cielo
raso en Metalcon" a "Tabique en Metalcon" en vez de escribir contenido nuevo desde cero.

Con Excavaciones (categoría 6), Albañilería (categoría 7) y Techumbres (categoría 8)
confirmadas sin casos NUEVOS de este patrón, y Metalcon (categoría 9) confirmando y
agravando el caso ya conocido de Tabique en Metalcon, quedan por revisar las categorías 10
en adelante.

**Cierre del caso del trío de tabiques (Tanda 10 — categoría Madera):** verificado
"Tabiquería en madera", el tercer módulo del grupo. A diferencia de Metalcon, acá la guía
compartida ("gafas y mascarilla al cortar") **sí es correcta** para el riesgo real de la
madera (polvo/astillas). El grupo completo queda así: yeso cartón ✅ correcto, madera ✅
correcto, Metalcon ❌ incorrecto — confirma que el problema es específico de un módulo
(Metalcon), no del patrón de compartir guía en sí.

**Tanda 11 (categoría Acero y Enfierradura):** sin casos NUEVOS de guía compartida — los 4
módulos (Enfierradura, Malla electrosoldada, Tubo estructural, Perfil estructural) tienen
guía propia, cada una ya reflejando su riesgo particular. Los 7 grupos de la tabla siguen
siendo la lista completa app-wide.

**Tanda 12 (categoría Hormigón):** sin casos NUEVOS — los 8 módulos (Muro, Losa,
Fundación, Viga, Escalera, Radier, Cadena, Pilar/columna) tienen guía propia, cada una bien
enfocada en el riesgo específico del elemento. Los 7 grupos de la tabla siguen siendo la
lista completa app-wide.

**Tanda 13 (categoría Piscinas):** sin casos NUEVOS — el grupo "piscina rectangular /
piscina circular" (guía compartida, mismo perfil de riesgo) ya estaba documentado en la
tabla desde el inicio de la auditoría. Quedan por revisar las categorías 14 en adelante.

---

## Hallazgo transversal: pluralización

Casos encontrados de unidad mal pluralizada frente a la cantidad real (`Formula.unit` es
un string fijo, no se ajusta según el resultado). Se anota aquí, sin arreglar, para decidir
al final de la auditoría completa si es un bug aislado o un patrón que vale la pena
resolver a nivel de plataforma (ej. una función de pluralización compartida en vez de
strings fijos por Formula).

| Módulo | Categoría | Caso | Debería decir |
|---|---|---|---|
| Cañería de gas visible | Gas | "1 tramos" | "1 tramo" |
| Lavamanos | Baño | "2 unidad" (llaves de conexión flexible) | "2 unidades" |
| Enchufes, interruptores y cableado | Electricidad | "18 unidad" (conectores), "12 unidad" (tornillos) — flujo reemplazo | "18 unidades", "12 unidades" |
| Enchufes, interruptores y cableado | Electricidad | "9 caja" (cajas eléctricas), "8 unidad" (placas) — flujo instalación nueva | "9 cajas", "8 unidades" |
| Cañería y conexiones (fittings) | Agua | "4 unidad" (conexiones y accesorios) | "4 unidades" |
| Instalar un estanque acumulador de agua | Agua | "3 unidad" (llave de paso + conexión de entrada y salida) | "3 unidades" |
| Impermeabilización | Impermeabilización | "3 rollo" (rollos de membrana asfáltica) | "3 rollos" |
| Techo inclinado (bajo teja/zinc) | Impermeabilización | "6 rollo" (rollos de fieltro asfáltico) | "6 rollos" |
| Muro de bloques o ladrillos | Albañilería | "515 unidad" (unidades necesarias), "6 bolsa" (cemento) | "515 unidades", "6 bolsas" |
| Pandereta (placas y pilares prefabricados) | Albañilería | "11 unidad" (pilares), "40 unidad" (placas) | "11 unidades", "40 unidades" |
| Cercha de techo | Techumbres | "10 pieza" (piezas necesarias) | "10 piezas" |
| Techo (cubierta) | Techumbres | "23 unidad" en el encabezado (la nota interpolada debajo sí dice "23 unidades" correctamente) | "23 unidades" |
| Aislación térmica (bajo cubierta) | Techumbres | "3 rollo" (rollos necesarios) | "3 rollos" |
| Tabique en Metalcon | Metalcon | "13 pieza" (montante), "4 pieza" (canal), "128 unidad" (tornillos) | "13 piezas", "4 piezas", "128 unidades" |
| Cielo raso en Metalcon | Metalcon | "8 pieza" (perfil), "3 pieza" (canal perimetral), "168 unidad" (tornillos) | "8 piezas", "3 piezas", "168 unidades" |
| Piso y Terraza en madera | Madera | "14 pieza" (estructura), "44 tabla" (deck) | "14 piezas", "44 tablas" |
| Madera para cercha u otro uso estructural | Madera | "18 pieza" (piezas necesarias) | "18 piezas" |
| Enfierradura | Acero y Enfierradura | "8 barra" (barras necesarias) | "8 barras" |
| Malla electrosoldada | Acero y Enfierradura | "3 plancha" (planchas necesarias) | "3 planchas" |
| Tubo estructural | Acero y Enfierradura | "4 pieza" (piezas de 6m) | "4 piezas" |
| Perfil estructural | Acero y Enfierradura | "3 pieza" (piezas de 6m) | "3 piezas" |
| Muro de hormigón armado | Hormigón | "15 bolsa" (cemento) | "15 bolsas" |
| Pilar / columna | Hormigón | "3 bolsa" (cemento, 3 pilares) | "3 bolsas" |
| Piscina rectangular (hormigón armado) | Piscinas | "37 unidad" (revestimiento cerámica) | "37 unidades" |
| Tabiques y cielos | Yeso Cartón | "8 plancha" (planchas necesarias) | "8 planchas" |
| Tabiques y cielos | Yeso Cartón | "1 cajas de 1000" (tornillos, cantidad=1) | "1 caja de 1000" |
| Terminar junturas de yeso cartón | Yeso Cartón | "4 pieza" (esquineros metálicos) | "4 piezas" |
| Terminar junturas de yeso cartón | Yeso Cartón | "2 hoja" (lija fina) | "2 hojas" |
| Estructura y techo | Quinchos | "6 poste", "7 pieza de 3m", "10 unidad" (cubierta) | "6 postes", "7 piezas de 3m", "10 unidades" |
| Techo de tejas o policarbonato | Quinchos | "6 poste", "7 pieza de 3m", "3 plancha" | "6 postes", "7 piezas de 3m", "3 planchas" |
| Piso flotante (laminado) | Pisos y Revestimientos | "15 caja", "3 rollo", "10 pieza" (moldura) | "15 cajas", "3 rollos", "10 piezas" |
| Pintura | Pintura | "3 galón" (envases, cantidad>1) y "1 manos" (cantidad=1) — ambas direcciones del bug en el mismo módulo | "3 galones", "1 mano" |
| Pintar una fachada exterior | Pintura | "2 galón" (pintura exterior) | "2 galones" |
| Preparar y estucar un muro antes de pintar | Pintura | "3 hoja" (lija) | "3 hojas" |
| Pasto en rollos | Paisajismo | "63 rollo", "38 saco de 40L" | "63 rollos", "38 sacos de 40L" |
| Pasto sintético | Paisajismo | "140 unidad" (grapas de fijación) | "140 unidades" |
| Pastelones prefabricados | Exterior | "68 unidad" (pastelones) | "68 unidades" |
| Jardinera de albañilería | Exterior | "22 unidad" (bloques de hormigón) | "22 unidades" |
| Riego por goteo | Exterior | "67 unidad" (goteros), "4 unidad" (conectores) | "67 unidades", "4 unidades" |

Nota: el ejemplo original que motivó esta lista era el caso "cantidad=1 + unidad en
plural" (ej. "1 tramos"). En la práctica, la mayoría de los casos encontrados son el
patrón inverso — "cantidad>1 + unidad en singular" (ej. "2 unidad", "9 caja") — mismo
origen (string de unidad fijo sin lógica de pluralización), dirección opuesta. Se incluyen
ambos en la misma lista porque comparten la misma causa raíz y candidato a fix.

---

## Hallazgo transversal: explicación fuera de lugar (guía en vez de helpText)

Patrón recurrente: una pregunta del wizard requiere contexto para responderse bien (¿cuándo
aplica sí, cuándo aplica no?), pero esa explicación no vive en `helpText` de la pregunta —
vive más adelante, en la guía (`tipsBeforeStart`, `commonMistakes`), que el usuario recién
lee en la pantalla de RESULTADO, después de haber contestado a ciegas. El cálculo en sí es
correcto; el problema es el orden en que la app entrega la información. Se documenta acá
cada caso nuevo a medida que aparece, categoría por categoría.

| Módulo | Categoría | Pregunta sin contexto al momento de responder | Dónde está la explicación hoy |
|---|---|---|---|
| Ducha | Baño | "¿Necesitas impermeabilizar los muros de la ducha?" — no dice cuándo aplica (¿cerámica sobre albañilería? ¿panel prefabricado? ¿ya impermeabilizado?) | "Errores comunes" de la guía, visible solo en el resultado |
| Enfierradura | Acero y Enfierradura | "¿Agregamos un % por traslapos (empalmes entre barras)?" — no explica por qué importa el traslapo | `tipsBeforeStart`/`commonMistakes` de la guía |
| Malla electrosoldada | Acero y Enfierradura | "¿Necesitas traslapo entre planchas?" — no explica que hay que traslapar "al menos un cuadro completo" ni por qué | `tipsBeforeStart` de la guía |
| Piso SPC (vinílico rígido) | Pisos y Revestimientos | "¿Qué tipo de instalación? (Recto/Diagonal)" — no explica que diagonal genera más corte y más pérdida de material | `note` del resultado (norm.note) |
| Piso flotante (laminado) | Pisos y Revestimientos | "¿Qué tipo de instalación? (Recto/Diagonal)" — mismo caso que Piso SPC | `note` del resultado (norm.note) |

Nota: los dos casos de Acero y Enfierradura comparten la misma causa (ambos son variantes
de "% o necesidad de traslapo" en módulos de fierro/malla), pero se listan por separado
porque son preguntas distintas en módulos distintos. Los dos casos de Pisos y
Revestimientos también comparten la misma causa (misma pregunta, mismo módulo de guía
compartida) y se listan por separado por el mismo criterio.

---

## Hallazgo transversal: falta de contexto del insumo

Patrón: en cualquier módulo donde el resultado depende de la calidad de un material o
mezcla (no solo de la cantidad), la guía debería advertir sobre cómo verificar esa calidad
antes de usarlo — no solo sobre cómo instalarlo bien. **Madera es el estándar positivo, no
un hallazgo negativo** — se incluye acá como referencia de lo que las demás categorías
deberían replicar.

| Categoría | Caso | ¿Tiene el contenido? |
|---|---|---|
| Madera (Tanda 10) | "Madera para cercha" enseña a inspeccionar humedad, curvatura y nudos antes de usar la pieza estructuralmente — una pieza mal elegida puede fallar aunque se vea bien. | **Sí — estándar a replicar.** |
| Acero y Enfierradura (Tanda 11) | Ninguno de los 4 módulos (Enfierradura, Malla electrosoldada, Tubo estructural, Perfil estructural) menciona inspeccionar el acero por óxido, picaduras, abolladuras o alabeo antes de usarlo — solo cubren calidad de la instalación (traslapos, soldaduras, sellado). | No — falta en los 4. |
| Hormigón (Tanda 12) | Ninguno de los 8 módulos advierte sobre el riesgo de calidad más común en obra: agregar agua extra a la mezcla o al camión mixer para facilitar el vaciado, lo que reduce la resistencia final. Las guías cubren bien curado y vibrado, pero no la calidad del hormigón tal como llega o se prepara. | No — falta en los 8. |
| Piscinas (Tanda 13) | Mismo caso que Hormigón — ninguno de los 2 módulos (Piscina circular, Piscina rectangular) advierte sobre agua extra en la mezcla. `commonMistakes` sí cubre "no impermeabilizar bien las juntas" (ejecución), pero no la calidad del hormigón o de la membrana/material impermeabilizante en sí. | No — falta en los 2 (mismo hueco que Hormigón, no es un caso nuevo distinto). |

Se documenta acá cada caso nuevo, categoría por categoría, a medida que se hace el chequeo
de "riesgo de falla de material" en módulos estructurales.

---

# Resumen ejecutivo

Las 19 categorías del sistema están cubiertas. Este resumen es solo un ordenamiento de lo
ya documentado arriba — no se implementó ningún fix; sirve para decidir en qué orden
abordar la fase de arreglos.

## Distribución de veredictos

57 módulos evaluados en total.

| Veredicto | Cantidad | % |
|---|---|---|
| MANTENER | 34 | 60% |
| MEJORAR | 23 | 40% |
| FUSIONAR CON OTRO | 0 | 0% |
| ELIMINAR | 0 | 0% |

Ningún módulo llegó a ELIMINAR o FUSIONAR — el problema recurrente de la auditoría no es
contenido redundante o sobrante, es contenido incompleto o desactualizado (pluralización,
guías heredadas sin adaptar, `helpText` faltante o desactualizado, notas explicativas
faltantes en resultados). El 60% en MANTENER indica una base de contenido sólida en general;
el 40% en MEJORAR son en su mayoría fixes puntuales y acotados, no rediseños.

## Los 5 hallazgos de mayor impacto (ordenados por severidad real, no por orden de aparición)

**1. `reinforcedWarning` no tiene ningún efecto visual en pantalla — afecta a toda la app,
incluido Gas.** (`src/components/module/norms-disclaimer.tsx`) El único branching visual
del disclaimer (ícono, color) depende de `verificationStatus`, nunca de
`reinforcedWarning`. Un aviso de **gas** con `reinforcedWarning: true` se ve
pixel-idéntico a un aviso de bajo riesgo con `reinforcedWarning: false` — mismo ícono
`TriangleAlert`, mismo fondo. Es el hallazgo de mayor alcance de toda la auditoría porque
no afecta un módulo puntual: **es la razón por la que ningún otro hallazgo de esta lista se
nota visualmente más grave que uno menor** — el sistema tiene la señal correcta en la base
de datos, pero no la muestra. Se resuelve una sola vez a nivel de componente, no módulo por
módulo.

**2. Techo inclinado (bajo teja/zinc) no advierte sobre el riesgo real de trabajar en
altura.** Su guía es copia textual de la de Impermeabilización genérica (que asume trabajo
a nivel de piso, ej. una fundación) — no menciona arnés, línea de vida, ni el riesgo de
superficie resbaladiza al instalar fieltro asfáltico sobre madera/OSB antes de la cubierta
final. Es un riesgo de caída real y no hipotético (comparar con Techo (cubierta) y
Aislación térmica, que sí mencionan arnés correctamente). Fix conocido y acotado: escribir
guía propia con seguridad de altura, calibrada según la inclinación que ya pregunta el
módulo.

**3. Ningún módulo de Hormigón (8) ni Piscinas (2) advierte sobre agregar agua extra a la
mezcla — el riesgo de calidad de material más común en obra en Chile.** Afecta 10 módulos,
incluidos los más estructuralmente críticos de la app (Viga, Losa, Pilar, Fundación,
piscinas completas). Reduce la resistencia final del hormigón de forma silenciosa — no se
nota hasta que ya está colado. A diferencia del hallazgo #1 (visual) y #2 (un módulo), este
es el de mayor alcance en cantidad de módulos afectados. Fix conocido y acotado: una línea
en `commonMistakes` por módulo (ya redactada como sugerencia en cada tanda correspondiente).

**4. Tabique en Metalcon no advierte sobre bordes y rebabas cortantes del metal
galvanizado — y el fix ya existe en la misma app.** Hereda la guía de seguridad de Madera
("gafas y mascarilla al cortar"), correcta para polvo de madera pero no para el riesgo de
corte de perfilería metálica. El módulo hermano "Cielo raso en Metalcon" (mismo material,
misma categoría) ya tiene el copy correcto ("el borde cortado del perfil galvanizado es
filoso", más "Tijeras para metal" en vez de "Sierra" en herramientas). No hace falta
escribir contenido nuevo — solo copiar el patrón correcto al módulo que no lo recibió.

**5. Pasto sintético no advierte sobre espesor de amortiguación adecuado en áreas de juego
infantil, pese a ofrecer esa opción explícitamente.** La pregunta de base incluye "manto de
caucho... común en áreas de juego infantil", pero ni la guía ni el disclaimer mencionan que
el espesor de amortiguación necesario depende de la altura de caída del equipo de juego —
un estándar real de seguridad infantil, tratado igual que pasto decorativo de jardín. Menor
alcance que los anteriores (un módulo, un caso de uso específico dentro de él), pero
severidad real alta dado que el usuario afectado es un niño.

*(Nota sobre alcance de esta clasificación: el hallazgo original que abrió la auditoría —
Impermeabilización/Techo inclinado, hallazgo #2 arriba — y el de disclaimers visuales,
hallazgo #1, son los dos que motivaron el chequeo sistemático de guías compartidas y de
severidad visual respectivamente; se mantienen arriba en la lista de severidad porque el
riesgo real que documentan sigue siendo el más alto, no por ser los primeros en
encontrarse.)*

## Conteo final de tablas transversales

| Tabla | Casos documentados |
|---|---|
| Guías no adaptadas al riesgo específico | 7 grupos de guía compartida identificados app-wide; 2 confirmados con riesgo real sin reflejar (Impermeabilización/Techo inclinado; trío de tabiques → solo Metalcon) |
| Pluralización | 39 casos (algunos módulos con más de una unidad afectada) |
| Explicación fuera de lugar (guía en vez de `helpText`) | 5 casos |
| Falta de contexto del insumo | 4 entradas (1 estándar positivo — Madera; 3 categorías con el hueco — Acero y Enfierradura, Hormigón, Piscinas) |

Además de estas 4 tablas, quedaron 3 hallazgos de "contenido heredado irrelevante o
inconsistencia de nombre" documentados directamente en su módulo (por instrucción tuya, sin
forzarlos en tablas): la FAQ zinc/policarbonato en "Techo de tejas o policarbonato"
(Quinchos), la inconsistencia "tejuela/teja asfáltica" entre los mismos dos módulos de
Quinchos, y el `helpText` desactualizado de la pregunta de superficie en Pintura y Pintar
fachada exterior (describe descuento manual de vanos cuando ya es automático).

**Pendiente: tu revisión para decidir el orden de la fase de arreglos.**

---

## Grupo B: pendientes de decisión de producto

De los 23 módulos con veredicto MEJORAR, 8 quedaron completamente resueltos por las fases
E1-E4 (Ducha, Techo inclinado, Tabique en Metalcon, Piso SPC, Piso flotante, Tabiques y
cielos, Preparar y estucar un muro, Jardinera de albañilería — su único hallazgo pendiente
era pluralización, ya resuelta de forma centralizada). De los 15 restantes, 10 se
implementaron como Grupo A (ver commits/DB de esta fase).

**Actualización — los 6 casos de Grupo B ya NO están pendientes.** Se documentan abajo tal
como se investigaron originalmente (para que la propuesta y las alternativas descartadas
queden como referencia), pero las 3 decisiones ya se tomaron y se implementaron en sesiones
posteriores:

- **Lavamanos** — ✅ Implementado (Opción A mínima: pregunta "¿Cuántos lavamanos vas a
  instalar?", ver sección abajo para el detalle).
- **Muro de hormigón armado, Losa, Escalera, Refuerzo superior del muro** — ✅
  Implementado (convención "obtención de hormigón", replicada además en Fundación, Viga y
  Pilar/columna aunque esos 3 no eran parte del Grupo B — ver sección abajo).
- **Pasto sintético** — ✅ Cerrado, decisión final: dejar como está sin toggle m² (ver
  sección abajo, ya marcada con su propio ✅).

### Lavamanos (Baño) — investigación a fondo (3 alternativas) — ✅ IMPLEMENTADO

**Estado actual del módulo (verificado en el schema, no solo en el hallazgo original):**
Una sola `Question` (`que-tipo-de-instalacion`, SELECT: `sobre-mueble` / `pedestal`), una
sola `Variable` (`tipo-instalacion`, TEXT, `source: {type: "QUESTION"}`), y 6 `Formula`:

| Formula | Material | Unidad | Expresión actual | Condición |
|---|---|---|---|---|
| `lavamanos` | Lavamanos | unidad | `1` | ninguna |
| `griferia` | Grifería/llave mezcladora | unidad | `1` | ninguna |
| `sifon` | Sifón | unidad | `1` | ninguna |
| `llaves-conexion` | Llaves de conexión flexible | unidad | `2` | ninguna |
| `silicona-sobre-mueble` | Silicona sanitaria | tubo | `2` | `tipo-instalacion == "sobre-mueble"` |
| `silicona-pedestal` | Silicona sanitaria | tubo | `1` | `tipo-instalacion == "pedestal"` |

Ninguna fórmula tiene un literal que dependa de una cantidad real ingresada por el
usuario — todas son constantes fijas (1 o 2), solo la silicona varía según el tipo de
instalación elegido. La guía (`ModuleGuide`) ya tiene una FAQ ("¿Qué diferencia hay entre
un sifón visible y uno oculto?") que **no tiene pregunta correspondiente** en el wizard —
confirma que hay contenido real sin explotar.

**Precio de referencia:** ninguno de los 6 materiales tiene `referencePrice` cargado hoy —
el campo de precio unitario/subtotal en el resultado funciona (el usuario puede tipear su
propio precio), pero no hay nada pre-cargado que perder si se elimina el módulo.

---

#### Opción A — Agregar variable(s) real(es) (recomendada)

**Pregunta nueva:** `cuantos-lavamanos-vas-a-instalar` (SELECT), reemplaza nada, se agrega
como primera pregunta del wizard:
- Opción `uno`: "1 lavamanos"
- Opción `dos`: "2 lavamanos (doble, mueble con dos cubetas)"

**Variable nueva:** `cantidad-lavamanos` (NUMBER), `source: {type: "LOOKUP", questionKey:
"cuantos-lavamanos-vas-a-instalar", table: {uno: 1, dos: 2}}` — este patrón LOOKUP
(SELECT → número vía tabla) ya existe y está probado en producción (ej. `cobertura-m2` en
Pastelones, grado de hormigón en Pilar/columna), no es un mecanismo nuevo.

**Cómo cambia cada fórmula** (multiplicar el literal actual por la variable, en vez de
reemplazarlo):
- `lavamanos`: `1` → `{"var": "cantidad-lavamanos"}`
- `griferia`: `1` → `{"var": "cantidad-lavamanos"}`
- `sifon`: `1` → `{"var": "cantidad-lavamanos"}`
- `llaves-conexion`: `2` → `{"op": "*", "args": [{"var": "cantidad-lavamanos"}, 2]}`
- `silicona-sobre-mueble`: `2` → `{"op": "*", "args": [{"var": "cantidad-lavamanos"}, 2]}`
  (condición sin cambios)
- `silicona-pedestal`: `1` → `{"var": "cantidad-lavamanos"}` (condición sin cambios)

**Mejoras opcionales adicionales** (mismo esfuerzo por pregunta, se pueden sumar o dejar
para después sin bloquear lo anterior):
- `que-tipo-de-sifon` (SELECT: visible / oculto) — no cambia la cantidad, pero resuelve la
  pregunta que la FAQ ya contesta sin que el wizard la haga: usar
  `materialLabelTemplate` en la Formula `sifon` para mostrar "Sifón visible" o "Sifón
  oculto (bajo mueble)" según la respuesta.
- `necesitas-fijar-el-mueble` (SELECT: sí / ya viene instalado) — si "sí", agrega una
  Formula nueva `tacos-tornillos-fijacion` (Material nuevo, cantidad fija ~4-6 unidades,
  condicionada a `tipo-instalacion == "sobre-mueble" AND necesita-fijacion == "si"`) — esta
  sí es una línea de material genuinamente nueva, no solo relabeling.

**Esfuerzo:** BAJO-MEDIO. La versión mínima (solo cantidad de lavamanos) es 1 Question + 1
Variable + editar 6 expresiones existentes — ningún componente de UI nuevo, ningún cambio
de schema, ningún nuevo tipo de pregunta. Con las 2 mejoras opcionales sumadas, sigue
siendo MEDIO (2 preguntas más, 1 Material y 1 Formula nuevos, sin tocar código).

**Gana en honestidad:** total — el resultado pasa a reflejar exactamente lo que el usuario
respondió, dejando de ser una lista fija disfrazada de cálculo.

---

#### Opción B — Replantear como QuickGuide

**Investigación del modelo:** `QuickGuide` (usado hoy por los 5 reemplazos simples de
Electricidad/Agua) no tiene NINGÚN campo de material/cantidad — solo `tools`, `steps`,
`tips`, `commonMistakes`, `masterTip`, `faqs`, `reinforcedWarning`. El contenido actual del
`ModuleGuide` de Lavamanos migraría casi literal: `tools`→`tools`,
`stepByStepSummary`→`steps`, `tipsBeforeStart`→`tips`, `commonMistakes`→`commonMistakes`,
`bestPractice`/`masterTip`→`masterTip`, `faqs`→`faqs`. El wiring de entrada también está
resuelto: `ProjectTask.quickGuideId` ya existe exactamente para este caso (una tarea usa
`moduleLinks` O `quickGuide`, nunca ambos) — cambiar el link de "Instalar un lavamanos" de
Module a QuickGuide es una operación de una línea.

**Costos reales encontrados al leer el código (no obvios sin investigar):**
1. `QuickGuide` no tiene relación con `Category` — `/categorias/[slug]/page.tsx` solo lista
   `category.modules`. Lavamanos **desaparecería por completo** de la página de categoría
   Baño; solo sería alcanzable vía `/empezar/instalar-un-lavamanos` o un link directo.
2. `src/lib/search.ts` no indexa `QuickGuide` en absoluto — Lavamanos desaparecería de la
   barra de búsqueda y de `/buscar`, a menos que se extienda la búsqueda para incluir
   QuickGuides (trabajo adicional no incluido en una conversión "simple").
3. La página `/guias-rapidas/[slug]` no tiene "Guardar como proyecto", ni integración con
   lista de compras, ni "Generar prompt para IA", ni campo de precio unitario/subtotal —
   se pierden 4 funcionalidades que hoy funcionan (aunque sea sobre una lista fija).

**Esfuerzo:** MEDIO. No por el contenido (es casi una copia), sino por decidir qué hacer
con el Module/Formula/Material/Norm existentes (¿se borran? ¿quedan sin publicar?) y,
si se quiere mantener paridad real de descubribilidad, por el trabajo no trivial de sumar
QuickGuide a la página de categoría y a la búsqueda — que hoy no existe.

**Gana en honestidad:** total sobre el frente de "no hay cálculo" — pero pierde
descubribilidad (categoría, búsqueda) y utilidad (precio/lista de compras) salvo que esos
huecos se cierren aparte.

---

#### Opción C — Híbrido mínimo (más barato)

El cambio más chico que agrega UNA variable real sin tocar la estructura del módulo:
pregunta `necesitas-sifon-nuevo` (SELECT: "Sí, necesito uno nuevo" / "No, voy a reutilizar
el que tengo") — caso real y común cuando se cambia solo el lavamanos sobre un mueble que
ya tenía sifón. Variable `necesita-sifon` (TEXT, `source: {type: "QUESTION"}`, igual patrón
que `tipo-instalacion`). Se le agrega `condition: {"op": "==", "args": [{"var":
"necesita-sifon"}, {"str": "si"}]}` a la Formula `sifon` existente (hoy `condition: null`,
incondicional) — cuando la respuesta es "no", esa línea deja de aparecer en el resultado.

**Esfuerzo:** BAJO — la más barata de las 3. 1 Question + 1 Variable + editar 1 condición
en una Formula que ya existe. Ningún Material ni Formula nuevos, ningún cambio de UI.

**Gana en honestidad:** modesto — el módulo sigue sin escalar con una cantidad medida,
pero al menos una línea del resultado deja de estar garantizada siempre, lo que ya es un
paso por encima de "exactamente los mismos 5 ítems sin importar la respuesta".

---

**Recomendación para decidir rápido:** Opción A (versión mínima: solo cantidad de
lavamanos) da el mejor balance esfuerzo/honestidad — convierte el módulo en una
calculadora real por un costo bajo-medio, sin perder nada de lo que ya funciona (precio,
lista de compras, búsqueda, categoría). Opción C es la más barata si se quiere algo hoy
mismo y decidir el resto después. Opción B solo tiene sentido si el criterio de producto
es "no fingir que hay cálculo donde no lo hay" como principio, aceptando el costo de
descubribilidad — no como solución de "menor esfuerzo".

### Convención "obtención de hormigón" — investigación completa y propuesta de generalización — ✅ IMPLEMENTADO

**Estado: implementado en los 7 módulos** (Muro de hormigón armado, Losa, Escalera,
Refuerzo superior del muro, Fundación, Viga, Pilar/columna) siguiendo exactamente el
patrón descrito abajo. Verificado en navegador en 4 de los 7 (Viga en ambas ramas,
Pilar/columna, Fundación, Escalera), confirmando resultado correcto en premezclado y
manual. Sin commit de código posible (contenido de BD).

**Alcance real (más amplio de lo que se había señalado):** revisando las 8 fórmulas de
dosificación de TODA la categoría Hormigón (no solo los 4 módulos con veredicto MEJORAR),
**7 de los 8 módulos carecen de la pregunta "¿Cómo vas a obtener el hormigón?"** — no solo
Muro, Losa, Escalera y Cadena, también **Fundación, Viga y Pilar/columna**, que se habían
quedado en MANTENER en la auditoría original porque sus otros criterios compensaban este
hueco, pero el hueco es igual de real en los 3. Solo Radier lo resuelve.

#### Cómo lo resuelve Radier (patrón ya validado en producción)

Componentes exactos, leídos directo del schema:

1. **Question** `metodo_hormigon` (SELECT), label `"¿Cómo vas a obtener el hormigón?"`,
   opciones `premezclado` = `"Comprarlo premezclado (camión mixer)"` y `manual` =
   `"Prepararlo tú mismo en obra"`.
2. **Variable** `metodo_hormigon` (TEXT), `source: {type: "QUESTION", questionKey:
   "metodo_hormigon"}` — passthrough directo, sin lookup.
3. Los 4 materiales de dosificación manual (`cemento`, `arena`, `gravilla`, `agua`), que en
   Radier se llaman `cemento_manual`/`arena_manual`/`gravilla_manual`/`agua_manual`, llevan
   `condition: {"op": "==", "args": [{"var": "metodo_hormigon"}, {"str": "manual"}]}` — la
   expresión matemática de cada uno NO cambia, solo se le agrega la condición.
4. Una fórmula nueva, `volumen_premezclado` (unit `m³`, `isResult: true`, `condition:
   metodo_hormigon == "premezclado"`), con expresión `{"op": "ceilTo", "step": 0.5,
   "value": {"ref": "volumen_con_perdida"}}` — redondea el volumen neto (el mismo
   `volumen_con_perdida` que ya calcula la dosificación manual) al medio m³ más cercano
   hacia arriba, y trae una `note` con valor real: *"Despacho mínimo habitual de camiones
   mixer: 3 m³. Si tu cálculo da menos, probablemente igual te cobren el mínimo — consulta
   con tu proveedor."*
5. El `Norm` de `volumen_premezclado` es el mismo que ya tenía `volumen_con_perdida` en ese
   módulo (`OBRA-RADIER-ESPESOR-DOSIF`) — no se crea una norma nueva.

Es decir: **el patrón no inventa ningún mecanismo nuevo** — reutiliza `condition` (ya usado
en todas las fórmulas de silicona de Lavamanos, en los grados de hormigón de Pilar, etc.) y
`ceilTo` (ya usado en Radier mismo). Cualquier ingeniero que ya haya tocado una Formula
condicionada en esta app puede replicarlo sin aprender nada nuevo.

#### Estado de los 7 módulos afectados — todos comparten la misma estructura base

Los 7 (Escalera, Fundación, Losa, Muro, Pilar/columna, Cadena, Viga) tienen exactamente el
mismo esqueleto: un `volumen_bruto` (o `volumen_total_bruto` en Pilar, que multiplica por
`cantidad` de pilares primero), luego `volumen_con_perdida` (aplica `lossFactor`), y desde
ahí 4 fórmulas incondicionales `cemento`/`arena`/`gravilla`/`agua` referenciando siempre
`{"ref": "volumen_con_perdida"}`. Esto es clave: **sin importar cómo se calculó el volumen
geométrico río arriba** (rectángulo simple, escalera con número de peldaños, fundación con
base+cuello, o pilares × cantidad), todos convergen al mismo punto de enganche
(`volumen_con_perdida`) antes de dosificar — que es exactamente lo que
`volumen_premezclado` necesita referenciar. La geometría de cada módulo no complica nada.

| Módulo | Dosificación manual (bolsa/m³/m³/litro por m³) | Norm en volumen_con_perdida |
|---|---|---|
| Escalera | 7 / 0.5 / 0.75 / 180 | `OBRA-ESCALERA-APROXIMACION` |
| Fundación | 7 / 0.5 / 0.75 / 180 | `OBRA-HORMIGON-DOSIFICACION-MANUAL` |
| Losa | 7 / 0.5 / 0.75 / 180 | `OBRA-LOSA-CONVERSION` |
| Muro de hormigón armado | 7 / 0.5 / 0.75 / 180 | `OBRA-HORMIGON-DOSIFICACION-MANUAL` |
| Pilar/columna | 7 / 0.5 / 0.75 / 180 | `OBRA-HORMIGON-DOSIFICACION-MANUAL` |
| Cadena | 7 / 0.5 / 0.75 / 180 | `OBRA-HORMIGON-DOSIFICACION-MANUAL` |
| Viga | 7 / 0.5 / 0.75 / 180 | `OBRA-VIGA-CONVERSION` |
| *(Radier, ya resuelto)* | *10 / 0.7 / 0.6 / 100* | `OBRA-RADIER-ESPESOR-DOSIF` |

**Dato no obvio:** los 7 módulos comparten exactamente la misma receta de dosificación
manual entre sí (7 bolsas/m³, etc.) — pero es **distinta** de la de Radier (10 bolsas/m³).
Esto no complica la generalización: cada módulo mantiene su propia aritmética intacta, el
patrón nuevo solo le agrega la condición y la rama premezclada al lado. Es una diferencia
de contenido (el radier usa una dosificación más pobre en cemento, típica de un elemento no
estructural/de menor exigencia), no de mecanismo.

#### ¿Alguna complicación real para generalizar? Ninguna que bloquee

- **Geometría distinta por módulo** (Escalera calcula volumen por peldaños, Fundación por
  base+cuello, Pilar por cantidad×unidad): irrelevante, como se explicó arriba — todas
  convergen en `volumen_con_perdida` antes de dosificar.
- **Los `Norm` de la dosificación varían por módulo** (3 usan uno propio — Escalera, Losa,
  Viga —, los otros 4 comparten `OBRA-HORMIGON-DOSIFICACION-MANUAL`): no es un obstáculo,
  solo una regla a seguir consistentemente: la nueva fórmula `volumen_premezclado` de cada
  módulo debe llevar el mismo `Norm` que ya tiene su propio `volumen_con_perdida` (así lo
  hizo Radier).
- **El campo `order`** de las fórmulas varía por módulo (Pilar empieza en 2 por sus 2 pasos
  previos de volumen, Fundación en 0). Al insertar `volumen_premezclado` justo después de
  `volumen_con_perdida`, hay que recalcular el `order` de las 4 fórmulas de dosificación
  manual existentes (+1 cada una) para que el resultado se vea en el orden correcto — un
  detalle mecánico de implementación, no una decisión de diseño.
- **Radier tiene además fórmulas de malla de refuerzo** (`peso-total-malla-radier`,
  `planchas-malla-radier-*`) que no tienen nada que ver con la dosificación de hormigón —
  se excluyen explícitamente del patrón a replicar, para que quede claro que no hay que
  copiarlas también.

**Conclusión: no existe ninguna diferencia estructural real entre Radier y los 7 módulos
que complique la generalización.** Es el mismo trabajo mecánico repetido 7 veces: 1
`Question` + 1 `Variable` + condicionar 4 `Formula` existentes + agregar 1 `Formula` nueva
— usando literalmente el mismo texto de pregunta/opciones que ya está escrito y probado en
Radier, solo cambiando el `Norm` referenciado y el `order`.

#### ¿Una sola vuelta de implementación, o dividir?

**Recomendación: una sola vuelta para los 7.** La razón no es optimismo — es que el patrón
es tan uniforme (misma pregunta, mismas 2 opciones, mismo mecanismo de condición, mismo
punto de enganche en cada módulo) que dividirlo en varias vueltas no reduce riesgo real,
solo agrega overhead de retomar contexto entre sesiones. Es contenido de base de datos puro
(igual que E2c, que aplicó la misma advertencia a 10 módulos de Hormigón+Piscinas en una
sola pasada sin problemas), no requiere tocar componentes de UI ni el motor de fórmulas.

Sugerencia de ejecución para la próxima vuelta (pura ejecución, sin decisiones pendientes):
un solo script que itere sobre los 7 slugs de módulo, y para cada uno: (1) cree la Question
+ options con el copy exacto de Radier, (2) cree la Variable, (3) actualice el `condition`
de las 4 Formula existentes vía `moduleId_key`, (4) inserte la Formula `volumen_premezclado`
con el `Norm` de `volumen_con_perdida` de ese módulo y el `order` correcto, (5) reordene las
4 fórmulas de dosificación manual. Verificar en navegador al menos 3 módulos completos
(recomendado: Viga o Losa por ser los más críticos, Pilar/columna por tener la geometría
más distinta — cantidad × unidad —, y uno de los 4 que comparten `Norm` genérico) más un
chequeo rápido de que los otros 4 no rompieron nada (tsc limpio + un vistazo al resultado).

**Sobre la pregunta de "muro de contención" en Muro de hormigón armado** (mencionada en la
fase anterior): es un tema aparte, no relacionado con la obtención de hormigón — requiere
una pregunta y un copy de advertencia distintos, específicos de ese módulo. No se incluye
en esta convención; si se decide implementar, es trabajo independiente sobre Muro de
hormigón armado únicamente.

### Pasto sintético (Paisajismo) — hallazgo nuevo durante la implementación de Grupo A — ✅ CERRADO

**Qué pasa:** al investigar la recomendación original del audit ("unificar el input con
`AreaInputToggle`, como sus 2 módulos hermanos"), se descubrió que **ya existe** el
diagrama largo×ancho (`DIMENSION_DIAGRAMS["area-pasto-sintetico"]`, sin `allowAreaToggle`)
— el hallazgo original de "sin diagrama" ya no aplica, quedó resuelto en algún punto previo
de la sesión sin que la auditoría lo reflejara. Lo que SÍ falta, y es la razón real por la
que `allowAreaToggle` no está activado, es que 4 fórmulas del módulo (`costuras-metros`,
`franjas-necesarias`, `metros-lineales-pasto`, `grapas-fijacion`) usan `largo` y `ancho`
por separado, no solo el área — a diferencia de Pasto en rollos y Siembra por semilla,
donde el área es el único dato que importa. Activar el modo "m² directo" reconstruiría un
cuadrado ficticio (lado = √área) para alimentar esas fórmulas, lo que daría un número de
franjas, costuras y grapas incorrecto para cualquier rectángulo que no sea un cuadrado real
— un error silencioso de material, no solo estético.

**Alternativa A — dejarlo como está** (solo largo×ancho, sin toggle a m² directo),
documentando explícitamente en el código (ya hecho, ver comentario en
`question-group-step.tsx`) por qué este módulo es una excepción deliberada al patrón de sus
hermanos. Pro: cero riesgo de cálculo incorrecto. Contra: el usuario que ya sabe el área
total pero no tiene largo/ancho a mano (ej. una superficie irregular que ya midió de otra
forma) no tiene esa opción, a diferencia de en Pasto en rollos.

**Alternativa B — agregar el modo m² directo con una advertencia explícita** de que en ese
modo las franjas/costuras/grapas se estiman de forma aproximada (asumiendo un área
cuadrada), y que el modo largo×ancho da un cálculo más preciso de esos materiales. Pro: da
la opción sin ocultar la limitación. Contra: añade una superficie de confusión — dos modos
con distinto nivel de precisión en el mismo campo es más difícil de explicar bien que
simplemente no ofrecer el modo menos preciso.

---

#### Validación final (re-verificado independientemente contra el schema, no reutilizando la conclusión de la fase anterior)

Se releyeron las 11 fórmulas del módulo directamente desde la base de datos para esta
validación. Confirmado de nuevo, con el detalle exacto de qué usa qué:

- `franjas-necesarias` = `ceil(ancho / ancho-rollo)` — depende SOLO de `ancho`, no de
  `largo`.
- `costuras-metros` = `(franjas-necesarias - 1) × largo` — depende de `largo` directo y de
  `franjas-necesarias` (que a su vez depende de `ancho`).
- `metros-lineales-pasto` = `franjas-necesarias × largo × 1.1` — mismo caso.
- `grapas-fijacion` = `ceil(2 × (largo + ancho) × 5)` — perímetro real, necesita `largo` y
  `ancho` **por separado**, no solo su producto (dos rectángulos con la misma área pero
  proporciones distintas tienen perímetros distintos, y por lo tanto necesitan una cantidad
  distinta de grapas).

Confirmado: si se activa el modo "m² directo" genérico de `AreaInputToggle` (que reparte el
área en un cuadrado ficticio, lado = √área, para ambos campos), las 4 fórmulas de arriba
reciben valores incorrectos para cualquier rectángulo real que no sea cuadrado — esto no es
una hipótesis, es la consecuencia matemática directa de cómo están escritas las fórmulas.
**No hay ninguna forma de activar el modo m² directo simétrico actual sin ese riesgo.**

#### Alternativa C — hallada en esta validación: modo m² directo ASIMÉTRICO (matemáticamente exacto, no aproximado)

Investigando si existe alguna forma seguirla, se encontró una que sí sería exacta (no una
aproximación): mantener `ancho` siempre como un campo real obligatorio (ya lo es hoy), y
ofrecer el toggle únicamente sobre `largo` — "conozco el largo" (entrada directa, como hoy)
vs. "conozco el m² total, no el largo" (se deriva `largo = área ÷ ancho`).

**Por qué es exacto y no una aproximación:** `area-bruta` ya se define como `largo × ancho`
— es la misma relación que ya asume el módulo. Si el usuario da un `ancho` real (medido) y
un área real (medida de otra forma, ej. con una cinta métrica de perímetro o un cálculo
previo), despejar `largo = área ÷ ancho` reproduce el `largo` real exacto — no un cuadrado
ficticio. Todas las fórmulas que dependen de `largo` y `ancho` por separado
(`franjas-necesarias`, `costuras-metros`, `metros-lineales-pasto`, `grapas-fijacion`)
quedarían correctas, sin aproximación, porque siguen recibiendo el `ancho` real y un
`largo` matemáticamente equivalente al real.

**Costo:** esto NO es un toggle simétrico como el que ya existe en `AreaInputToggle` (que
reparte el área por igual entre ambos campos) — requiere un modo nuevo, asimétrico, que hoy
el componente no tiene: un campo siempre numérico directo (`ancho`) y el otro alternando
entre numérico directo y "derivado de área" (`largo`). Es un cambio de código real
(extender `AreaInputToggle` con un tercer modo, o construir un input a medida solo para
este módulo), no una bandera de configuración — esfuerzo MEDIO, acotado a un componente.

**✅ Decisión final (cerrado — no requiere más acción): dejar como está, sin toggle m².**
Razón técnica breve: el toggle m² directo simétrico (Alternativa B) es matemáticamente
incorrecto para este módulo — corrompería `franjas-necesarias`, `costuras-metros`,
`metros-lineales-pasto` y `grapas-fijacion` para cualquier rectángulo no cuadrado — y no se
debe activar. Existe un modo asimétrico exacto (Alternativa C) que sí sería seguro, pero el
esfuerzo de escribir un componente de input nuevo no se justifica frente al beneficio
marginal para un caso de uso poco común: quien mide una superficie rectangular para pasto
sintético casi siempre puede dar largo y ancho por separado (medición directa con huincha),
a diferencia de un muro con vanos irregulares donde "ya tengo el área calculada" es más
común. Si en el futuro llegan pedidos reales de usuarios pidiendo esta opción, la
Alternativa C queda documentada y lista para retomar sin tener que re-investigar nada.
No se implementó nada — este tema queda cerrado tal cual está.
