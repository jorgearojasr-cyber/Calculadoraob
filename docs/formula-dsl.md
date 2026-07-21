# DSL de fórmulas — ObraBien Calcula

Este documento define el formato JSON usado en `variables.source`, `formulas.expression`,
`formulas.condition` y `loss_factors.condition`. Es el "motor de reglas" del que habla
`decisiones-tecnicas.md`: se edita desde la base de datos (o, a futuro, desde el admin
panel), nunca desde código.

## Modelo de dos etapas

1. **Variables**: traducen respuestas del usuario en valores usables (números o texto).
2. **Fórmulas**: árboles aritméticos que combinan variables y otras fórmulas para producir
   resultados (cantidades de materiales, volúmenes, etc.).

Separar estas etapas evita mezclar "¿qué significa esta respuesta?" con "¿cómo se calcula
el resultado?", y permite que un mismo tipo de variable (ej. lookup por opción elegida) se
reutilice en cualquier módulo futuro sin escribir código nuevo.

## 1. `variables.source`

Cada variable tiene un `valueType` (`NUMBER` o `TEXT`) y un `source` con una de estas formas:

### `QUESTION` — valor directo de una respuesta

```json
{ "type": "QUESTION", "questionKey": "largo" }
```

El valor es la respuesta cruda: un número si la pregunta es `NUMBER`, o el `key` de la
opción elegida si la pregunta es `SELECT`.

### `LOOKUP` — mapear una opción elegida a un valor

```json
{
  "type": "LOOKUP",
  "questionKey": "uso",
  "table": {
    "patio_terraza": 8,
    "antepiso_interior": 7,
    "estacionamiento": 10,
    "bodega_industrial": 12
  },
  "default": null
}
```

Toma la opción elegida en `questionKey` y busca su valor en `table`. Si no está, usa
`default`. `table` puede mapear a números o a strings según el `valueType` de la variable
(por eso `tipo_hormigon` y `espesor_cm` son dos variables distintas con el mismo
`questionKey` de origen pero tablas distintas).

Este mecanismo cubre cualquier módulo con el patrón "elige una opción → obtén una
constante" (espesores, dosificaciones, tipos de material, etc.) sin tocar código.

### `LOOKUP2` — mapear una combinación de DOS opciones a un valor

```json
{
  "type": "LOOKUP2",
  "questionKey": "uso",
  "secondaryQuestionKey": "colocacion",
  "table": {
    "patio_terraza|manual_carretilla": "G17-N (equivalente al H20 antiguo)",
    "patio_terraza|bomba": "G17-B (equivalente al H20 antiguo)"
  },
  "default": null
}
```

Igual que `LOOKUP`, pero la clave de la tabla es
`"claveOpciónPrimaria|claveOpciónSecundaria"` — para cuando un valor depende de dos
preguntas de selección a la vez (ej: el código de grado de hormigón depende del uso
**y** del método de colocación). No existe forma de concatenar texto en el DSL de
fórmulas (`formulas.expression` solo evalúa a números), así que si el valor final es
una combinación de dos respuestas, `LOOKUP2` es el mecanismo — no un cálculo.

**Limitación conocida**: el editor de admin todavía no tiene una pantalla para crear
variables `LOOKUP2` (solo `QUESTION` y `LOOKUP` desde el tab Variables) — hoy se crean
por seed/script. Ver `docs/auditoria-normativa.md`.

## 2. `formulas.expression` y `formulas.condition`

Ambos son árboles del mismo DSL de nodos. `expression` debe evaluar a un número.
`condition` (opcional) debe evaluar a un booleano; si está presente y es `false`, la
fórmula se omite en ese cálculo (por ejemplo, las fórmulas de dosificación manual solo
aplican si `metodo_hormigon == "manual"`).

### Nodos

| Nodo | Forma | Descripción |
|---|---|---|
| Número literal | `7` o `0.5` | Número JSON crudo |
| Texto literal | `{"str": "manual"}` | String literal, solo útil en comparaciones |
| Variable | `{"var": "largo"}` | Valor resuelto de una `variables.key` del módulo |
| Referencia a fórmula | `{"ref": "volumen_bruto"}` | Resultado ya calculado de otra `formulas.key` del mismo módulo. El builder visual del admin lo expone como término "Resultado de otra fórmula" (tab Fórmulas) — ya no requiere seed/script. |
| Aritmética | `{"op": "+" \| "-" \| "*" \| "/", "args": [nodo, nodo, ...]}` | 2 o más argumentos; `-` y `/` se aplican de izquierda a derecha |
| Redondeo | `{"op": "ceil" \| "floor" \| "round", "value": nodo}` | Redondeo simple |
| Redondeo a múltiplo | `{"op": "ceilTo", "value": nodo, "step": 0.5}` | Redondea hacia arriba al múltiplo de `step` más cercano |
| Factor de pérdida | `{"op": "lossFactor", "key": "perdida_hormigon", "value": nodo}` | `nodo * (1 + loss_factors[key].percentage)` |
| Comparación (solo en `condition`) | `{"op": "==" \| "!=" \| ">" \| ">=" \| "<" \| "<=", "args": [nodo, nodo]}` | Evalúa a booleano |
| Lógicos (solo en `condition`) | `{"op": "and" \| "or", "args": [bool, bool, ...]}`, `{"op": "not", "value": bool}` | Combinan condiciones |

### Reglas de evaluación

- Las fórmulas de un módulo se evalúan en orden ascendente por `formulas.order`. Un `ref`
  solo puede apuntar a una fórmula con `order` menor (evaluada antes). No se permiten
  referencias circulares.
- Si `condition` es `false`, la fórmula no se agrega al contexto de `ref` — no debe ser
  referenciada por fórmulas posteriores en esa misma rama condicional.
- `formulas.isResult` (booleano) indica si el resultado se muestra al usuario final.
  Fórmulas intermedias (ej. `volumen_bruto`, un paso previo a `volumen_con_perdida`) usan
  `isResult: false` — existen solo para ser referenciadas por otras fórmulas.
- `formulas.note` (opcional) es un texto estático que acompaña al resultado en la UI (ej.
  "Despacho mínimo habitual: 3 m³"). No es parte del cálculo.

### Ejemplo completo — módulo Radier

```json
// formulas.volumen_bruto (isResult: false)
{"op": "*", "args": [
  {"var": "largo"},
  {"var": "ancho"},
  {"op": "/", "args": [{"var": "espesor_cm"}, 100]}
]}

// formulas.volumen_con_perdida (isResult: false)
{"op": "lossFactor", "key": "perdida_hormigon", "value": {"ref": "volumen_bruto"}}

// formulas.volumen_premezclado — condition
{"op": "==", "args": [{"var": "metodo_hormigon"}, {"str": "premezclado"}]}
// formulas.volumen_premezclado — expression
{"op": "ceilTo", "value": {"ref": "volumen_con_perdida"}, "step": 0.5}

// formulas.cemento_manual — condition
{"op": "==", "args": [{"var": "metodo_hormigon"}, {"str": "manual"}]}
// formulas.cemento_manual — expression (bolsas de 25kg, redondeadas hacia arriba)
{"op": "ceil", "value": {"op": "*", "args": [{"ref": "volumen_con_perdida"}, 7]}}
```

## Qué NO cubre esta v1 (a propósito)

- **Interpolación / tablas continuas** (ej. un valor que varía según m² exactos, no según
  una opción discreta). No lo necesita ningún módulo hoy.

Se puede agregar después como nuevo valor de `source.type`, sin migrar el schema (todo
vive en columnas JSON).

## 3. Visibilidad condicional de preguntas (`questions.visibleIfQuestionKey`/`visibleIfValues`)

Una pregunta con `visibleIfQuestionKey` seteado solo se muestra (y solo se pide) cuando
la respuesta a esa otra pregunta del mismo módulo está incluida en `visibleIfValues`
(array de option keys). Si no se cumple, el wizard la salta por completo — no cuenta como
paso ni bloquea el cálculo. `ModuleWizard` recalcula los pasos visibles en cada respuesta
(`buildSteps(questions, answers)`), así que el total de pasos y la barra de progreso se
ajustan dinámicamente.

Patrón "¿sabes el dato exacto?" (usado en Cerámica): dos preguntas con el mismo
`stepGroup`, la primera SELECT con 2 opciones ("No lo sé, usa un promedio" / "Sí, lo
tengo") y la segunda NUMBER — el wizard las detecta automáticamente por ese shape
(`ConditionalRevealStep`) y solo revela/pide el campo numérico si se elige la segunda
opción.

**Gotcha**: si además la pregunta SELECT tiene su propio `visibleIfQuestionKey` (ej.
solo aplica para ciertos tamaños), la pregunta NUMBER agrupada con ella necesita **el
mismo** `visibleIfQuestionKey`/`visibleIfValues` — si no, cuando el SELECT está oculto
la pregunta NUMBER queda "huérfana" (sin su grupo) y el wizard la muestra como paso
propio, sin condición. La visibilidad se filtra antes de agrupar, así que cada pregunta
del grupo debe ser visible por sí sola con el mismo criterio.

**Cuidado al escribir `condition` en fórmulas que dependen de una pregunta
condicionalmente oculta**: `{"var": "x"}` lanza error si `x` nunca se resolvió (pregunta
nunca mostrada/respondida). Siempre antepón un guard con `and` que se evalúe primero —
`args` de `and`/`every` se evalúa en cortocircuito, así que si el guard da `false` el
resto de las cláusulas no se evalúa:

```json
{"op": "and", "args": [
  {"op": "!=", "args": [{"var": "tamano"}, {"str": "personalizada"}]},
  {"op": "==", "args": [{"var": "sabes-tu-dato"}, {"str": "si-lo-tengo"}]}
]}
```

**Limitación conocida**: sin pantalla en el admin todavía (igual que `LOOKUP2`) — se
configura por script. Ver `docs/auditoria-normativa.md`.
