import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { loadInspectionReportData } from "@/lib/inspecciones-report";
import { InspectionSummaryDocument } from "@/lib/inspecciones-pdf";

// Route Handler, no Server Action — mismo patrón que
// /api/regularizacion/[id]/pdf (no está pensado devolver binario desde
// una Server Action). Runtime Node por defecto: @react-pdf/renderer no
// corre en Edge.
//
// Ownership resuelto DENTRO de loadInspectionReportData, antes de
// cualquier otro trabajo — un caseId ajeno nunca llega a renderizar
// nada ni revela si existe (mismo criterio que <InspectionNotAvailable />,
// Fase 7B): 404 genérico, sin distinguir "no existe" de "no es tuyo".
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  const data = await loadInspectionReportData(params.id, session.user.id);
  if (!data) return new NextResponse(null, { status: 404 });

  const buffer = await renderToBuffer(InspectionSummaryDocument({ data }));

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inspeccion-resumen-${data.caseId}.pdf"`,
    },
  });
}
