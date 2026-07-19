import { evaluateCondition, evaluateNode, resolveVariables } from "./evaluate";
import type { Answers, DslNode, DslValue } from "./types";

export type { Answers, DslNode, DslValue, VariableSource } from "./types";

type FormulaInput = {
  key: string;
  label: string;
  unit: string;
  expression: unknown;
  condition: unknown;
  isResult: boolean;
  note: string | null;
  order: number;
  material: { name: string } | null;
};

type VariableInput = { key: string; label: string; source: unknown; isResult: boolean };
type LossFactorInput = { key: string; percentage: number; condition: unknown };

export type CalculationResult = {
  key: string;
  label: string;
  unit: string;
  value: number;
  note: string | null;
  materialName: string | null;
};

export type InfoResult = {
  key: string;
  label: string;
  value: DslValue;
};

export function calculateModule(input: {
  variables: VariableInput[];
  formulas: FormulaInput[];
  lossFactors: LossFactorInput[];
  answers: Answers;
}): { results: CalculationResult[]; infoResults: InfoResult[]; variables: Record<string, DslValue> } {
  const variables = resolveVariables(input.variables, input.answers);

  const infoResults: InfoResult[] = input.variables
    .filter((v) => v.isResult && variables[v.key] !== undefined)
    .map((v) => ({ key: v.key, label: v.label || v.key, value: variables[v.key] }));

  const lossFactors: Record<string, { percentage: number }> = {};
  for (const factor of input.lossFactors) {
    const applies = evaluateCondition(factor.condition as DslNode | null, {
      variables,
      formulaResults: {},
      lossFactors: {},
    });
    if (applies) lossFactors[factor.key] = { percentage: factor.percentage };
  }

  const formulaResults: Record<string, number> = {};
  const results: CalculationResult[] = [];

  const orderedFormulas = [...input.formulas].sort((a, b) => a.order - b.order);

  for (const formula of orderedFormulas) {
    const ctx = { variables, formulaResults, lossFactors };
    const applies = evaluateCondition(formula.condition as DslNode | null, ctx);
    if (!applies) continue;

    const value = evaluateNode(formula.expression as DslNode, ctx);
    if (typeof value !== "number") {
      throw new Error(`La fórmula "${formula.key}" no evaluó a un número.`);
    }

    formulaResults[formula.key] = value;

    if (formula.isResult) {
      results.push({
        key: formula.key,
        label: formula.label,
        unit: formula.unit,
        value,
        note: formula.note,
        materialName: formula.material?.name ?? null,
      });
    }
  }

  return { results, infoResults, variables };
}
