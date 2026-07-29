/**
 * Tipos del DSL de fórmulas. Ver docs/formula-dsl.md para la especificación completa.
 */

export type DslValue = number | string | boolean;

export type DslNode =
  | number
  | { str: string }
  | { var: string }
  | { ref: string }
  | { op: "+" | "-" | "*" | "/"; args: DslNode[] }
  | { op: "ceil" | "floor" | "round"; value: DslNode }
  | { op: "ceilTo"; value: DslNode; step: number }
  | { op: "lossFactor"; key: string; value: DslNode }
  | { op: "==" | "!=" | ">" | ">=" | "<" | "<="; args: DslNode[] }
  | { op: "and" | "or"; args: DslNode[] }
  | { op: "not"; value: DslNode }
  | { op: "max" | "min"; args: DslNode[] }
  // Evalúa cada arg en orden y devuelve el primero disponible: para args
  // {ref:...} que apunten a una fórmula cuya condición no se cumplió esta
  // vez (rama no calculada), se salta al siguiente en vez de lanzar error.
  // Permite converger varias fórmulas condicionadas mutuamente excluyentes
  // (ej. una por cada opción de un SELECT) en un único valor downstream.
  | { op: "coalesce"; args: DslNode[] }
  // Verdadero si la Variable existe en el contexto (su Question fue
  // respondida) — a diferencia de {var: key}, NUNCA lanza error si no lo
  // está. Pensado para condicionar una Formula sobre una o más preguntas
  // NUMBER opcionales del wizard (ej. "horas de uso" + "precio kWh" en el
  // circuito eléctrico): sin esto, referenciar {var: key} de una pregunta
  // sin responder lanza "Variable no resuelta" y rompe el cálculo entero.
  | { op: "defined"; key: string };

export type VariableSource =
  | { type: "QUESTION"; questionKey: string }
  | {
      type: "LOOKUP";
      questionKey: string;
      table: Record<string, DslValue>;
      default?: DslValue | null;
    }
  | {
      // Lookup combinando dos preguntas de selección (ej: uso + método de
      // colocación -> grado de hormigón con sufijo). La tabla se indexa con
      // "claveOpcionPrimaria|claveOpcionSecundaria".
      type: "LOOKUP2";
      questionKey: string;
      secondaryQuestionKey: string;
      table: Record<string, DslValue>;
      default?: DslValue | null;
    };

export type Answers = Record<string, string | number>;
