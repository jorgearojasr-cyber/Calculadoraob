import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { NewInspectionForm } from "@/components/inspecciones/new-inspection-form";

export const dynamic = "force-dynamic";

// Mismo patrón que /regularizacion (RegularizacionPage): redirige a login
// con callbackUrl de vuelta a esta misma ruta en vez de una pantalla en
// blanco, ya que esta es una pantalla de entrada, no un detalle privado.
export default async function NuevaInspeccionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Finspecciones%2Fnueva");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <NewInspectionForm />
    </div>
  );
}
