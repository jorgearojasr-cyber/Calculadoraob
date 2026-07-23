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
  | { op: "coalesce"; args: DslNode[] };

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
