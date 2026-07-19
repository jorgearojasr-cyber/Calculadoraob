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
| Referencia a fórmula | `{"ref": "volumen_bruto"}` | Resultado ya calculado de otra `formulas.key` del mismo módulo |
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
- **Visibilidad condicional de preguntas** (pregunta B solo si A = X). El piloto de Radier
  no la necesita — sus 4 preguntas siempre se muestran.

Ambos casos se pueden agregar después como nuevos valores de `source.type` o nuevos `op`
en el árbol de nodos, sin migrar el schema (todo vive en columnas JSON).
