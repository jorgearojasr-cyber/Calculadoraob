import { prisma } from "@/lib/prisma";
import { QuestionsManager } from "@/components/admin/questions-manager";

export const dynamic = "force-dynamic";

export default async function ModuleQuestionsPage({ params }: { params: { id: string } }) {
  const questions = await prisma.question.findMany({
    where: { moduleId: params.id },
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });

  return <QuestionsManager moduleId={params.id} questions={questions} />;
}
