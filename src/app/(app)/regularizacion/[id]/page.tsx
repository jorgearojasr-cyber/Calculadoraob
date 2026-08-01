import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDocumentChecklist } from "@/lib/regularization-documents";
import { RegularizationCaseView } from "@/components/regularization/regularization-case-view";
import { RegularizationRoomList } from "@/components/regularization/regularization-room-list";
import { RegularizationPhotoUpload } from "@/components/regularization/regularization-photo-upload";
import { RegularizationSketchEditor } from "@/components/regularization/regularization-sketch-editor";
import type { SketchData } from "@/lib/regularization-sketch";

// Sin ningún link de navegación público todavía (Opción C, igual que
// /regularizacion) — se llega acá solo desde el enlace que deja
// RegularizationEntry tras crear el caso.
//
// Recintos y fotos (Fase 2C) se muestran siempre, independientemente de
// si la compuerta de avalúo fiscal ya fue respondida — no dependen de
// ese dato, y quedan desacoplados del checklist de documentos (decisión
// confirmada 2026-08-02).
export default async function RegularizationCasePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const regCase = await prisma.regularizationCase.findUnique({ where: { id: params.id } });
  if (!regCase || regCase.userId !== session.user.id) return null;

  const [initialDocuments, rooms, photos, sketch] = await Promise.all([
    regCase.avaluoFiscalPesos !== null
      ? getVisibleDocumentChecklist(regCase.id, session.user.id)
      : Promise.resolve(null),
    prisma.regularizationRoom.findMany({ where: { caseId: regCase.id }, orderBy: { order: "asc" } }),
    prisma.regularizationPhoto.findMany({ where: { caseId: regCase.id }, orderBy: { createdAt: "asc" } }),
    prisma.regularizationSketch.findUnique({ where: { caseId: regCase.id } }),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold tracking-tight">{regCase.name}</h1>
        <a
          href={`/api/regularizacion/${regCase.id}/pdf`}
          target="_blank"
          className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-ink flex-shrink-0"
        >
          Descargar carpeta PDF
        </a>
      </div>
      <RegularizationCaseView caseId={regCase.id} initialDocuments={initialDocuments} />
      <RegularizationRoomList caseId={regCase.id} initialRooms={rooms} />
      <RegularizationPhotoUpload caseId={regCase.id} initialPhotos={photos} />
      <RegularizationSketchEditor caseId={regCase.id} initialData={(sketch?.dataJson as unknown as SketchData) ?? null} />
    </div>
  );
}
