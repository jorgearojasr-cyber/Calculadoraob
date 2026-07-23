import type { Answers, DslNode, DslValue, VariableSource } from "./types";

export function resolveVariables(
  variables: { key: string; source: unknown }[],
  answers: Answers
): Record<string, DslValue> {
  const context: Record<string, DslValue> = {};

  for (const variable of variables) {
    const source = variable.source as VariableSource;

    if (source.type === "QUESTION") {
      const value = answers[source.questionKey];
      if (value !== undefined) context[variable.key] = value;
      continue;
    }

    if (source.type === "LOOKUP") {
      const answerKey = answers[source.questionKey];
      const value = source.table[String(answerKey)] ?? source.default ?? null;
      if (value !== null && value !== undefined) context[variable.key] = value;
      continue;
    }

    if (source.type === "LOOKUP2") {
      const primaryKey = answers[source.questionKey];
      const secondaryKey = answers[source.secondaryQuestionKey];
      const compoundKey = `${primaryKey}|${secondaryKey}`;
      const value = source.table[compoundKey] ?? source.default ?? null;
      if (value !== null && value !== undefined) context[variable.key] = value;
      continue;
    }
  }

  return context;
}

type EvalContext = {
  variables: Record<string, DslValue>;
  formulaResults: Record<string, number>;
  lossFactors: Record<string, { percentage: number }>;
};

function asNumber(value: DslValue, label: string): number {
  if (typeof value !== "number") {
    throw new Error(`Se esperaba un número en "${label}", se obtuvo: ${JSON.stringify(value)}`);
  }
  return value;
}

export function evaluateNode(node: DslNode, ctx: EvalContext): DslValue {
  if (typeof node === "number") return node;

  if ("str" in node) return node.str;

  if ("var" in node) {
    const value = ctx.variables[node.var];
    if (value === undefined) {
      throw new Error(`Variable no resuelta: "${node.var}"`);
    }
    return value;
  }

  if ("ref" in node) {
    const value = ctx.formulaResults[node.ref];
    if (value === undefined) {
      throw new Error(
        `Referencia a fórmula no calculada (¿falta orden o la condición fue falsa?): "${node.ref}"`
      );
    }
    return value;
  }

  switch (node.op) {
    case "+":
    case "-":
    case "*":
    case "/": {
      const values = node.args.map((arg) => asNumber(evaluateNode(arg, ctx), node.op));
      return values.reduce((acc, value) => {
        if (node.op === "+") return acc + value;
        if (node.op === "-") return acc - value;
        if (node.op === "*") return acc * value;
        return acc / value;
      });
    }

    case "ceil":
    case "floor":
    case "round": {
      const value = asNumber(evaluateNode(node.value, ctx), node.op);
      return Math[node.op](value);
    }

    case "ceilTo": {
      const value = asNumber(evaluateNode(node.value, ctx), "ceilTo");
      return Math.ceil(value / node.step) * node.step;
    }

    case "lossFactor": {
      const value = asNumber(evaluateNode(node.value, ctx), "lossFactor");
      const factor = ctx.lossFactors[node.key];
      if (!factor) throw new Error(`Factor de pérdida no encontrado: "${node.key}"`);
      return value * (1 + factor.percentage);
    }

    case "==":
    case "!=":
    case ">":
    case ">=":
    case "<":
    case "<=": {
      const [left, right] = node.args.map((arg) => evaluateNode(arg, ctx));
      if (node.op === "==") return left === right;
      if (node.op === "!=") return left !== right;
      const a = asNumber(left, node.op);
      const b = asNumber(right, node.op);
      if (node.op === ">") return a > b;
      if (node.op === ">=") return a >= b;
      if (node.op === "<") return a < b;
      return a <= b;
    }

    case "and":
      return node.args.every((arg) => evaluateNode(arg, ctx) === true);

    case "or":
      return node.args.some((arg) => evaluateNode(arg, ctx) === true);

    case "not":
      return evaluateNode(node.value, ctx) !== true;

    case "max":
    case "min": {
      const values = node.args.map((arg) => asNumber(evaluateNode(arg, ctx), node.op));
      return node.op === "max" ? Math.max(...values) : Math.min(...values);
    }

    case "coalesce": {
      for (const arg of node.args) {
        if (typeof arg === "object" && arg !== null && "ref" in arg) {
          if (ctx.formulaResults[arg.ref] !== undefined) {
            return ctx.formulaResults[arg.ref];
          }
          continue;
        }
        return evaluateNode(arg, ctx);
      }
      throw new Error(`"coalesce" no encontró ningún valor disponible`);
    }

    default:
      throw new Error(`Operador de DSL desconocido: ${JSON.stringify(node)}`);
  }
}

export function evaluateCondition(node: DslNode | null | undefined, ctx: EvalContext): boolean {
  if (node === null || node === undefined) return true;
  return evaluateNode(node, ctx) === true;
}
