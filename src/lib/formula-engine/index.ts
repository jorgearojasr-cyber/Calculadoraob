import { evaluateCondition, evaluateNode, resolveVariables } from "./evaluate";
import { pluralizeUnit } from "../pluralize";
import type { Answers, DslNode, DslValue } from "./types";

export type { Answers, DslNode, DslValue, VariableSource } from "./types";

type FormulaInput = {
  key: string;
  label: string;
  unit: string;
  expression: unknown;
  condition: unknown;
  isResult: boolean;
  isSecondary?: boolean;
  note: string | null;
  order: number;
  material: {
    name: string;
    unit?: string;
    referencePrice?: number | null;
    referencePriceNote?: string | null;
  } | null;
  materialLabelTemplate?: string | null;
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
  /** Resultado secundario/de referencia: se renderiza anidado y más chico dentro de la tarjeta del resultado principal anterior. */
  isSecondary?: boolean;
  /** Precio unitario ingresado por el usuario para este cálculo puntual (no persiste globalmente). */
  unitPrice?: number | null;
  /** Precio de referencia aproximado del material (CLP por unidad, tabla estática) — solo sugerencia editable. */
  referencePrice?: number | null;
  /** Texto visible con fuente y fecha del precio de referencia. */
  referencePriceNote?: string | null;
};

export type InfoResult = {
  key: string;
  label: string;
  value: DslValue;
};

const numberFormatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });
const formatInterpolatedNumber = (value: DslValue): string =>
  typeof value === "number" ? numberFormatter.format(value) : String(value);

type InterpolationContext = {
  variables: Record<string, DslValue>;
  formulaResults: Record<string, number>;
  lossFactors: Record<string, { percentage: number }>;
  // Valor propio de la fórmula que se está armando (recién calculado, aún
  // no necesariamente en formulaResults al momento de interpolar su note).
  ownValue?: number;
  // Unidad (Formula.unit) de la fórmula que se está armando — solo para
  // resolver el token {unit} pluralizado según ownValue.
  ownUnit?: string;
};

// Reemplaza placeholders en una plantilla (materialLabelTemplate o note) con
// valores ya resueltos en este cálculo — usado para mostrar texto explicativo
// dinámico sin hardcodear números en el componente (ej. "Cada caja cubre
// {cobertura-por-caja-m} m² → para {ref:area-m2} m² + {lossFactor:perdida-x}%
// de pérdida necesitas {value} {unit}"). Formas soportadas:
//   {variableKey}     -> variables[variableKey]
//   {ref:formulaKey}  -> formulaResults[formulaKey]
//   {lossFactor:key}  -> lossFactors[key].percentage, como % entero/decimal
//   {value}           -> valor recién calculado de esta misma fórmula
//   {unit}            -> Formula.unit pluralizada según ese mismo valor (vía
//                        pluralizeUnit) — usar esto en vez de escribir la
//                        unidad a mano en la plantilla, para no repetir el
//                        bug de "1 galones" que ya resuelve pluralize.ts en
//                        el resto de la app (valor+unidad de cada resultado).
// Si el placeholder no resuelve a nada (rama condicional no calculada), se
// deja el texto intacto en vez de lanzar — no debería ocurrir si la
// plantilla solo referencia valores garantizados por la condición.
function interpolateTemplate(template: string, ctx: InterpolationContext): string {
  return template.replace(/\{([a-zA-Z0-9_.-]+(?::[a-zA-Z0-9_.-]+)?)\}/g, (match, token: string) => {
    if (token === "value") {
      return ctx.ownValue !== undefined ? formatInterpolatedNumber(ctx.ownValue) : match;
    }
    if (token === "unit") {
      return ctx.ownValue !== undefined && ctx.ownUnit !== undefined
        ? pluralizeUnit(ctx.ownValue, ctx.ownUnit)
        : match;
    }
    if (token.startsWith("ref:")) {
      const value = ctx.formulaResults[token.slice(4)];
      return value !== undefined ? formatInterpolatedNumber(value) : match;
    }
    if (token.startsWith("lossFactor:")) {
      const factor = ctx.lossFactors[token.slice(11)];
      return factor !== undefined ? formatInterpolatedNumber(factor.percentage * 100) : match;
    }
    const value = ctx.variables[token];
    return value !== undefined ? formatInterpolatedNumber(value) : match;
  });
}

export function calculateModule(input: {
  variables: VariableInput[];
  formulas: FormulaInput[];
  lossFactors: LossFactorInput[];
  answers: Answers;
}): {
  results: CalculationResult[];
  infoResults: InfoResult[];
  variables: Record<string, DslValue>;
  // Claves de las fórmulas/pérdidas que realmente se evaluaron en esta
  // corrida (condición verdadera) — permite mostrar solo las normas de la
  // rama ejecutada, no las de todas las ramas del módulo.
  evaluatedFormulaKeys: string[];
  appliedLossFactorKeys: string[];
} {
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
      const interpolationCtx: InterpolationContext = {
        variables,
        formulaResults,
        lossFactors,
        ownValue: value,
        ownUnit: formula.unit,
      };
      const materialName = formula.materialLabelTemplate
        ? interpolateTemplate(formula.materialLabelTemplate, interpolationCtx)
        : formula.material?.name ?? null;
      const note = formula.note ? interpolateTemplate(formula.note, interpolationCtx) : null;

      // El precio de referencia solo aplica si la unidad de esta línea de
      // resultado coincide con la unidad del material (ej. Pintura interior
      // vende el mismo material en galón/cuarto/cuñete sobre un material en
      // litros — ahí un precio por litro daría subtotales incorrectos).
      const hasReferencePrice =
        formula.material?.referencePrice != null && formula.material.unit === formula.unit;

      results.push({
        key: formula.key,
        label: formula.label,
        unit: formula.unit,
        value,
        note,
        materialName,
        isSecondary: formula.isSecondary ?? false,
        referencePrice: hasReferencePrice ? formula.material!.referencePrice : null,
        referencePriceNote: hasReferencePrice ? formula.material!.referencePriceNote ?? null : null,
      });
    }
  }

  return {
    results,
    infoResults,
    variables,
    evaluatedFormulaKeys: Object.keys(formulaResults),
    appliedLossFactorKeys: Object.keys(lossFactors),
  };
}
