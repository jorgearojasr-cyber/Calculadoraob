import { prisma } from "@/lib/prisma";
import type { CalculateModuleResult } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";

export type ShoppingListLine = {
  materialName: string;
  unit: string;
  quantity: number;
  cost: number | null;
  sourceProjectNames: string[];
  checked: boolean;
};

export type ShoppingListData = {
  lines: ShoppingListLine[];
  totalCost: number;
  anyCost: boolean;
  includedProjectCount: number;
};

// Consolida los materiales de todos los SavedProject con inShoppingList=true
// del usuario, sumando cantidades por (materialName, unit) exactos — el
// nombre ya incluye tipo/medida/espesor cuando aplica (materialLabelTemplate),
// así que dos líneas con el mismo nombre exacto son el mismo producto por
// diseño. No recalcula nada: solo lee los snapshots ya guardados.
export async function getShoppingListData(userId: string): Promise<ShoppingListData> {
  const [projects, checks] = await Promise.all([
    prisma.savedProject.findMany({
      where: { userId, inShoppingList: true },
      select: { id: true, name: true, result: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.shoppingListCheck.findMany({ where: { userId } }),
  ]);

  const checkMap = new Map(checks.map((c) => [`${c.materialName}__${c.unit}`, c.checked]));

  const groups = new Map<
    string,
    { materialName: string; unit: string; quantity: number; cost: number | null; sourceProjectNames: Set<string> }
  >();

  for (const project of projects) {
    const result = project.result as unknown as CalculateModuleResult;
    for (const item of result.results) {
      if (!item.materialName) continue;

      const key = `${item.materialName}__${item.unit}`;
      const existing = groups.get(key);
      const lineCost = item.unitPrice != null ? item.value * item.unitPrice : null;

      if (existing) {
        existing.quantity += item.value;
        if (lineCost != null) existing.cost = (existing.cost ?? 0) + lineCost;
        existing.sourceProjectNames.add(project.name);
      } else {
        groups.set(key, {
          materialName: item.materialName,
          unit: item.unit,
          quantity: item.value,
          cost: lineCost,
          sourceProjectNames: new Set([project.name]),
        });
      }
    }
  }

  const lines: ShoppingListLine[] = Array.from(groups.entries())
    .map(([key, g]) => ({
      materialName: g.materialName,
      unit: g.unit,
      quantity: g.quantity,
      cost: g.cost,
      sourceProjectNames: Array.from(g.sourceProjectNames),
      checked: checkMap.get(key) ?? false,
    }))
    .sort((a, b) => a.materialName.localeCompare(b.materialName, "es"));

  const totalCost = lines.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const anyCost = lines.some((l) => l.cost != null);

  return { lines, totalCost, anyCost, includedProjectCount: projects.length };
}
