"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function toggleShoppingCheckAction(
  materialName: string,
  unit: string,
  checked: boolean
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  await prisma.shoppingListCheck.upsert({
    where: { userId_materialName_unit: { userId: session.user.id, materialName, unit } },
    create: { userId: session.user.id, materialName, unit, checked },
    update: { checked },
  });

  revalidatePath("/lista-compras");
  return {};
}

export async function clearShoppingListAction(): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  await prisma.$transaction([
    prisma.savedProject.updateMany({
      where: { userId: session.user.id, inShoppingList: true },
      data: { inShoppingList: false },
    }),
    prisma.shoppingListCheck.deleteMany({ where: { userId: session.user.id } }),
  ]);

  revalidatePath("/lista-compras");
  revalidatePath("/proyectos");
  return {};
}
