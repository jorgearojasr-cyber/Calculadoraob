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

type VariableInput = { key: string; source: unknown };
type LossFactorInput = { key: string; percentage: number; condition: unknown };

export type CalculationResult = {
  key: string;
  label: string;
  unit: string;
  value: number;
  note: string | null;
  materialName: string | null;
};

export function calculateModule(input: {
  variables: VariableInput[];
  formulas: FormulaInput[];
  lossFactors: LossFactorInput[];
  answers: Answers;
}): { results: CalculationResult[]; variables: Record<string, DslValue> } {
  const variables = resolveVariables(input.variables, input.answers);

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

  return { results, variables };
}
