import { prisma } from "@/lib/prisma";
import { MaterialsManager } from "@/components/admin/materials-manager";

export const dynamic = "force-dynamic";

export default async function ModuleMaterialsPage({ params }: { params: { id: string } }) {
  const [formulas, materials] = await Promise.all([
    prisma.formula.findMany({
      where: { moduleId: params.id },
      orderBy: { order: "asc" },
      select: { id: true, label: true, unit: true, materialId: true },
    }),
    prisma.material.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <MaterialsManager moduleId={params.id} formulas={formulas} materials={materials} />;
}
