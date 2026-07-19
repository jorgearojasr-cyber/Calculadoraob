/**
 * Traduce entre la representación "amigable" del builder visual del admin
 * (términos + operadores, sin sintaxis libre) y el árbol JSON del DSL real
 * que evalúa src/lib/formula-engine. El admin nunca ve ni edita JSON.
 *
 * Modelo expuesto al admin (más simple que el DSL completo, ver docs/formula-dsl.md):
 *   expresión = term1 [op term2] [op term3] ...   (izquierda a derecha, sin paréntesis)
 *   + factor de pérdida opcional (envuelve el resultado completo)
 *   + redondeo opcional (envuelve lo anterior)
 *   + condición opcional de igualdad ("aplicar solo si variable X = valor Y")
 *
 * Para las fórmulas de Radier esto es matemáticamente equivalente al DSL
 * original (cadenas de multiplicación/división son asociativas), aunque el
 * árbol JSON resultante tiene una forma distinta a la escrita a mano en
 * prisma/seed-radier.ts.
 */

import type { DslNode } from "./formula-engine";

export type BuilderTerm =
  | { kind: "variable"; variableKey: string }
  | { kind: "formula"; formulaKey: string }
  | { kind: "constant"; value: number };

export type BuilderOp = "+" | "-" | "*" | "/";

export type RoundingMode = "none" | "ceil" | "ceilTo0_5" | "ceilTo0_1";

export type BuilderCondition = { variableKey: string; value: string } | null;

export const OP_SYMBOLS: Record<BuilderOp, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };

export const ROUNDING_LABELS: Record<RoundingMode, string> = {
  none: "Sin redondeo",
  ceil: "Hacia arriba (entero)",
  ceilTo0_5: "Hacia arriba al 0.5 más cercano",
  ceilTo0_1: "Hacia arriba al 0.1 más cercano",
};

function termToNode(term: BuilderTerm): DslNode {
  if (term.kind === "variable") return { var: term.variableKey };
  if (term.kind === "formula") return { ref: term.formulaKey };
  return term.value;
}

function nodeToTerm(node: DslNode): BuilderTerm | null {
  if (typeof node === "number") return { kind: "constant", value: node };
  if (typeof node === "object" && node !== null && "var" in node) {
    return { kind: "variable", variableKey: node.var };
  }
  if (typeof node === "object" && node !== null && "ref" in node) {
    return { kind: "formula", formulaKey: node.ref };
  }
  return null;
}

export function compileExpression(terms: BuilderTerm[], ops: BuilderOp[]): DslNode {
  if (terms.length === 0) throw new Error("La fórmula necesita al menos un término.");
  let node = termToNode(terms[0]);
  for (let i = 0; i < ops.length; i++) {
    node = { op: ops[i], args: [node, termToNode(terms[i + 1])] };
  }
  return node;
}

export function decompileExpression(
  node: DslNode
): { terms: BuilderTerm[]; ops: BuilderOp[] } | null {
  const simple = nodeToTerm(node);
  if (simple) return { terms: [simple], ops: [] };

  if (
    typeof node === "object" &&
    node !== null &&
    "op" in node &&
    (node.op === "+" || node.op === "-" || node.op === "*" || node.op === "/") &&
    "args" in node &&
    node.args.length === 2
  ) {
    const [left, right] = node.args;
    const rightTerm = nodeToTerm(right);
    if (!rightTerm) return null;
    const leftResult = decompileExpression(left);
    if (!leftResult) return null;
    return { terms: [...leftResult.terms, rightTerm], ops: [...leftResult.ops, node.op] };
  }

  return null;
}

export function applyModifiers(
  expression: DslNode,
  lossFactorKey: string | null,
  rounding: RoundingMode
): DslNode {
  let node = expression;
  if (lossFactorKey) node = { op: "lossFactor", key: lossFactorKey, value: node };
  if (rounding === "ceil") node = { op: "ceil", value: node };
  if (rounding === "ceilTo0_5") node = { op: "ceilTo", value: node, step: 0.5 };
  if (rounding === "ceilTo0_1") node = { op: "ceilTo", value: node, step: 0.1 };
  return node;
}

export function unwrapModifiers(node: DslNode): {
  expression: DslNode;
  lossFactorKey: string | null;
  rounding: RoundingMode;
} {
  let rounding: RoundingMode = "none";
  let current = node;

  if (typeof current === "object" && current !== null && "op" in current) {
    if (current.op === "ceil") {
      rounding = "ceil";
      current = current.value;
    } else if (current.op === "ceilTo" && current.step === 0.5) {
      rounding = "ceilTo0_5";
      current = current.value;
    } else if (current.op === "ceilTo" && current.step === 0.1) {
      rounding = "ceilTo0_1";
      current = current.value;
    }
  }

  let lossFactorKey: string | null = null;
  if (typeof current === "object" && current !== null && "op" in current && current.op === "lossFactor") {
    lossFactorKey = current.key;
    current = current.value;
  }

  return { expression: current, lossFactorKey, rounding };
}

export function compileCondition(
  condition: BuilderCondition,
  variableValueType: "NUMBER" | "TEXT" | undefined
): DslNode | null {
  if (!condition) return null;
  const valueNode: DslNode =
    variableValueType === "NUMBER" ? Number(condition.value) : { str: condition.value };
  return { op: "==", args: [{ var: condition.variableKey }, valueNode] };
}

export function decompileCondition(node: DslNode | null | undefined): BuilderCondition {
  if (!node) return null;
  if (typeof node === "object" && node !== null && "op" in node && node.op === "==" && node.args.length === 2) {
    const [left, right] = node.args;
    if (typeof left === "object" && left !== null && "var" in left) {
      if (typeof right === "number") return { variableKey: left.var, value: String(right) };
      if (typeof right === "object" && right !== null && "str" in right) {
        return { variableKey: left.var, value: right.str };
      }
    }
  }
  return null;
}

export function describeExpression(
  terms: BuilderTerm[],
  ops: BuilderOp[],
  variableLabels: Record<string, string>,
  formulaLabels: Record<string, string> = {}
): string {
  const parts: string[] = [];
  terms.forEach((term, i) => {
    if (i > 0) parts.push(OP_SYMBOLS[ops[i - 1]]);
    if (term.kind === "variable") parts.push(variableLabels[term.variableKey] ?? term.variableKey);
    else if (term.kind === "formula") parts.push(formulaLabels[term.formulaKey] ?? term.formulaKey);
    else parts.push(String(term.value));
  });
  return parts.join(" ");
}
