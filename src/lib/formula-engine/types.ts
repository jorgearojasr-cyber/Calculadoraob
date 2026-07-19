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
  | { op: "not"; value: DslNode };

export type VariableSource =
  | { type: "QUESTION"; questionKey: string }
  | {
      type: "LOOKUP";
      questionKey: string;
      table: Record<string, DslValue>;
      default?: DslValue | null;
    };

export type Answers = Record<string, string | number>;
