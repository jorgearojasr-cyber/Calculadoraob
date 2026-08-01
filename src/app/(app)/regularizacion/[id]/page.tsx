import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDocumentChecklist } from "@/lib/regularization-documents";
import { RegularizationCaseView } from "@/components/regularization/regularization-case-view";

// Sin ningún link de navegación público todavía (Opción C, igual que
// /regularizacion) — se llega acá solo desde el enlace que deja
// RegularizationEntry tras crear el caso.
export default async function RegularizationCasePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const regCase = await prisma.regularizationCase.findUnique({ where: { id: params.id } });
  if (!regCase || regCase.userId !== session.user.id) return null;

  const initialDocuments =
    regCase.avaluoFiscalPesos !== null
      ? await getVisibleDocumentChecklist(regCase.id, session.user.id)
      : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-xl font-semibold tracking-tight mb-6">{regCase.name}</h1>
      <RegularizationCaseView caseId={regCase.id} initialDocuments={initialDocuments} />
    </div>
  );
}
