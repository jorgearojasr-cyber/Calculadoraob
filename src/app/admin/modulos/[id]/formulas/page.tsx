import { prisma } from "@/lib/prisma";
import { FormulasManager } from "@/components/admin/formulas-manager";
import { decompileCondition, decompileExpression, unwrapModifiers } from "@/lib/formula-builder";
import type { DslNode } from "@/lib/formula-engine";

export const dynamic = "force-dynamic";

export default async function ModuleFormulasPage({ params }: { params: { id: string } }) {
  const [formulas, variables, lossFactors] = await Promise.all([
    prisma.formula.findMany({ where: { moduleId: params.id }, orderBy: { order: "asc" } }),
    prisma.variable.findMany({ where: { moduleId: params.id }, orderBy: { order: "asc" } }),
    prisma.lossFactor.findMany({ where: { moduleId: params.id } }),
  ]);

  const formulaRows = formulas.map((formula) => {
    const { expression, lossFactorKey, rounding } = unwrapModifiers(formula.expression as DslNode);
    const decompiled = decompileExpression(expression);
    const condition = decompileCondition(formula.condition as DslNode | null);

    return {
      id: formula.id,
      label: formula.label,
      unit: formula.unit,
      note: formula.note,
      builder: decompiled ? { terms: decompiled.terms, ops: decompiled.ops, condition, lossFactorKey, rounding } : null,
    };
  });

  return (
    <FormulasManager
      moduleId={params.id}
      formulas={formulaRows}
      variables={variables.map((v) => ({ key: v.key, label: v.label || v.key, valueType: v.valueType }))}
      lossFactors={lossFactors.map((f) => ({ key: f.key, label: f.label, percentage: f.percentage }))}
    />
  );
}
