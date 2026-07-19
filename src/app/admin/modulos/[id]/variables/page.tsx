import { prisma } from "@/lib/prisma";
import { VariablesManager } from "@/components/admin/variables-manager";

export const dynamic = "force-dynamic";

export default async function ModuleVariablesPage({ params }: { params: { id: string } }) {
  const [questions, variables] = await Promise.all([
    prisma.question.findMany({
      where: { moduleId: params.id },
      orderBy: { order: "asc" },
      include: { options: { orderBy: { order: "asc" } } },
    }),
    prisma.variable.findMany({ where: { moduleId: params.id }, orderBy: { order: "asc" } }),
  ]);

  return <VariablesManager moduleId={params.id} questions={questions} variables={variables} />;
}
