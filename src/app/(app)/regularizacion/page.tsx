import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { RegularizationEntry } from "@/components/regularization/regularization-entry";

// Fin de la "Opción C" de despliegue (rediseño de Home, 2026-08-01) — la
// tarjeta destacada de Home ahora enlaza acá para cualquier visitante,
// con o sin sesión. Redirige a /login con callbackUrl de vuelta a esta
// misma ruta — mismo patrón ya usado en el resto del módulo (ver
// STALE_SESSION_MESSAGE en regularization-document-checklist-view.tsx),
// en vez de devolver una página en blanco.
export default async function RegularizacionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fregularizacion");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <RegularizationEntry />
    </div>
  );
}
