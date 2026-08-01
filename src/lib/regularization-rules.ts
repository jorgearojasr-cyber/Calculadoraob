import { prisma } from "@/lib/prisma";
import { evaluateCondition } from "@/lib/formula-engine/evaluate";
import type { DslNode, DslValue } from "@/lib/formula-engine/types";

// Contenido normativo pendiente de validación profesional — ver
// prisma/seed-regularization.ts.
//
// Reutiliza el mismo intérprete de condiciones que Formula
// (evaluateCondition) — ninguna regla nueva, ningún cambio al DSL. La
// única pieza propia de este servicio es armar ctx.variables desde
// RegularizationCase + el valor de referencia de Norm("uf-2016-02-04"),
// tal como se diseñó en la decisión de arquitectura 2026-08-01.
export type RegularizationRuleCaseInput = {
  tipoConstruccion: string;
  anioConstruccion: number | null;
  recepcionMunicipal: boolean | null;
  m2Estimados: number;
  material: string;
  avaluoFiscalPesos: number | null;
};

export type RegularizationRuleResult = {
  label: string;
  message: string;
};

// Compartido entre evaluateRegularizationRules (reglas) y
// getVisibleDocumentChecklist (dependeDe de documentos, Fase 2B) — mismo
// ctx.variables para que ambos lean el caso de forma idéntica, sin
// duplicar la construcción del contexto (ver decisión de arquitectura:
// "reglas y checklist deben compartir la misma lógica de negocio").
export async function buildRegularizationContext(input: RegularizationRuleCaseInput) {
  const ufNorm = await prisma.norm.findUnique({ where: { code: "uf-2016-02-04" } });

  const variables: Record<string, DslValue> = {
    tipoConstruccion: input.tipoConstruccion,
    m2Estimados: input.m2Estimados,
    material: input.material,
    uf_2016: ufNorm?.value ?? 0,
  };
  // Los campos nullable solo se agregan al contexto si tienen valor real
  // — {"op":"defined",...} depende de que la clave esté AUSENTE, no de
  // que valga null (mismo criterio que resolveVariables en
  // formula-engine/evaluate.ts para preguntas sin responder).
  if (input.anioConstruccion !== null) variables.anioConstruccion = input.anioConstruccion;
  if (input.recepcionMunicipal !== null) variables.recepcionMunicipal = input.recepcionMunicipal;
  if (input.avaluoFiscalPesos !== null) variables.avaluoFiscalPesos = input.avaluoFiscalPesos;

  return { variables, formulaResults: {}, lossFactors: {} };
}

export async function evaluateRegularizationRules(
  input: RegularizationRuleCaseInput
): Promise<RegularizationRuleResult[]> {
  const ctx = await buildRegularizationContext(input);

  const rules = await prisma.regularizationRule.findMany({
    where: { enabled: true },
    orderBy: { priority: "asc" },
  });

  const results: RegularizationRuleResult[] = [];
  for (const rule of rules) {
    const matches = evaluateCondition(rule.condition as DslNode | null, ctx);
    if (matches) results.push({ label: rule.label, message: rule.message });
  }
  return results;
}
