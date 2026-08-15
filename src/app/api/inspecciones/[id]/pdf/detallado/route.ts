import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { loadInspectionReportData } from "@/lib/inspecciones-report";
import { InspectionDetailedDocument } from "@/lib/inspecciones-pdf";

// Mismo patrón exacto que ../resumen/route.ts — misma función de carga
// de datos (`loadInspectionReportData`), mismo chequeo de ownership,
// solo cambia el Document de @react-pdf/renderer que se renderiza.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  const data = await loadInspectionReportData(params.id, session.user.id);
  if (!data) return new NextResponse(null, { status: 404 });

  const buffer = await renderToBuffer(InspectionDetailedDocument({ data }));

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inspeccion-detallado-${data.caseId}.pdf"`,
    },
  });
}
