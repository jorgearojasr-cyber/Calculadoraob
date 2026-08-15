import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewInspectionForm } from "@/components/inspecciones/new-inspection-form";

export const dynamic = "force-dynamic";

// Mismo patrón que /regularizacion (RegularizacionPage): redirige a login
// con callbackUrl de vuelta a esta misma ruta en vez de una pantalla en
// blanco, ya que esta es una pantalla de entrada, no un detalle privado.
export default async function NuevaInspeccionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Finspecciones%2Fnueva");

  // Se traen TODOS los templates activos (de cualquier tipoInmueble) en
  // una sola consulta al cargar la página — el formulario filtra por
  // tipoInmueble en el cliente al elegir Casa/Departamento/Ampliación, sin
  // necesitar un segundo viaje al servidor por cada cambio de tipo.
  const spaceTemplates = await prisma.inspectionSpaceTemplate.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <NewInspectionForm spaceTemplates={spaceTemplates} />
    </div>
  );
}
