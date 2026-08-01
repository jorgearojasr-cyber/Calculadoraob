import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateRegularizationRules } from "@/lib/regularization-rules";
import { getVisibleDocumentChecklist } from "@/lib/regularization-documents";
import { RegularizationCarpetaDocument } from "@/lib/regularization-pdf";

// Route Handler, no Server Action — las Server Actions no están
// pensadas para devolver binario para descarga (ver diseño Fase 2E,
// 2026-08-02). Runtime Node por defecto (no Edge): @react-pdf/renderer
// no corre en Edge.
//
// Ownership ANTES de cualquier otra consulta — un GET con un caseId
// ajeno no debe permitir inferir su existencia ni tocar Prisma más allá
// del propio RegularizationCase.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  const regCase = await prisma.regularizationCase.findUnique({ where: { id: params.id } });
  if (!regCase || regCase.userId !== session.user.id) return new NextResponse(null, { status: 404 });

  const [rules, documents, rooms, photos] = await Promise.all([
    evaluateRegularizationRules({
      tipoConstruccion: regCase.tipoConstruccion,
      anioConstruccion: regCase.anioConstruccion,
      recepcionMunicipal: regCase.recepcionMunicipal,
      m2Estimados: regCase.m2Estimados,
      material: regCase.material,
      avaluoFiscalPesos: regCase.avaluoFiscalPesos,
    }),
    getVisibleDocumentChecklist(regCase.id, session.user.id),
    prisma.regularizationRoom.findMany({ where: { caseId: regCase.id }, orderBy: { order: "asc" } }),
    prisma.regularizationPhoto.findMany({ where: { caseId: regCase.id }, orderBy: { createdAt: "asc" } }),
  ]);

  const buffer = await renderToBuffer(
    RegularizationCarpetaDocument({
      regCase: {
        name: regCase.name,
        tipoConstruccion: regCase.tipoConstruccion,
        anioConstruccion: regCase.anioConstruccion,
        recepcionMunicipal: regCase.recepcionMunicipal,
        m2Estimados: regCase.m2Estimados,
        material: regCase.material,
        avaluoFiscalPesos: regCase.avaluoFiscalPesos,
      },
      rules,
      rooms,
      documents,
      photos,
      generatedAt: new Date(),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="regularizacion-${regCase.id}.pdf"`,
    },
  });
}
