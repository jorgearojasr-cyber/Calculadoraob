import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RegularizationEntry } from "@/components/regularization/regularization-entry";

// Sin ningún link de navegación hacia esta ruta todavía (ver decisión de
// despliegue, Opción C, 2026-08-01) — existe para poder construir y
// probar el módulo de forma incremental, sin exponerlo a usuarios reales
// hasta que exista una experiencia mínima completa (2A + 2B).
export default async function RegularizacionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <RegularizationEntry />
    </div>
  );
}
