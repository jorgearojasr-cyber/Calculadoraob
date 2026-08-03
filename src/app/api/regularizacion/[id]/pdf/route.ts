import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateRegularizationRules } from "@/lib/regularization-rules";
import { getVisibleDocumentChecklist, getPosteriorDocuments } from "@/lib/regularization-documents";
import { RegularizationCarpetaDocument } from "@/lib/regularization-pdf";
import type { SketchData } from "@/lib/regularization-sketch";

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

  const [rules, documents, documentsPosteriores, rooms, photos, sketch] = await Promise.all([
    evaluateRegularizationRules({
      tipoConstruccion: regCase.tipoConstruccion,
      anioConstruccion: regCase.anioConstruccion,
      recepcionMunicipal: regCase.recepcionMunicipal,
      m2Estimados: regCase.m2Estimados,
      material: regCase.material,
      avaluoFiscalPesos: regCase.avaluoFiscalPesos,
    }),
    getVisibleDocumentChecklist(regCase.id, session.user.id),
    getPosteriorDocuments(),
    prisma.regularizationRoom.findMany({ where: { caseId: regCase.id }, orderBy: { order: "asc" } }),
    prisma.regularizationPhoto.findMany({ where: { caseId: regCase.id }, orderBy: { createdAt: "asc" } }),
    prisma.regularizationSketch.findUnique({ where: { caseId: regCase.id } }),
  ]);

  // Folio simple — identifica el documento en conversaciones con el
  // profesional/DOM ("mira el folio OB-REG-2026-a1b2c3d4"). No es un
  // correlativo transaccional (no hay tabla de secuencia); usa el año de
  // generación + los primeros 8 caracteres del cuid del caso, que ya es
  // único — suficiente para identificar el documento sin agregar estado
  // nuevo en Fase 1.
  const folio = `OB-REG-${new Date().getFullYear()}-${regCase.id.slice(0, 8)}`;

  const buffer = await renderToBuffer(
    RegularizationCarpetaDocument({
      folio,
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
      documentsPosteriores,
      photos,
      sketch: (sketch?.dataJson as unknown as SketchData) ?? null,
      generatedAt: new Date(),
      caseUpdatedAt: regCase.updatedAt,
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
