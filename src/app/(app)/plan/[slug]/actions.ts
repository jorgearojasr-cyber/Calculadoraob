"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function togglePhaseCompletionAction(
  planSlug: string,
  phaseId: string,
  completed: boolean
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "no-session" };

  await prisma.projectPlanPhaseCompletion.upsert({
    where: { userId_phaseId: { userId: session.user.id, phaseId } },
    create: { userId: session.user.id, phaseId, completed },
    update: { completed },
  });

  revalidatePath(`/plan/${planSlug}`);
  return {};
}
