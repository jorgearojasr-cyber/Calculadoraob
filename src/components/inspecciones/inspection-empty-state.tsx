import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";

// Mismo criterio de tarjeta vacía que /galeria (rounded-2xl bg-white
// border border-border, texto centrado) pero con ícono + CTA propio,
// pedido explícitamente como "pantalla vacía atractiva" — mismos tokens,
// sin ningún color ni patrón nuevo.
export function InspectionEmptyState() {
  return (
    <div className="rounded-2xl p-10 bg-white border border-border text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-navy/[0.07] mx-auto mb-4">
        <ClipboardList className="w-6 h-6 text-navy" />
      </div>
      <p className="font-display text-lg font-semibold mb-1">Todavía no tienes inspecciones</p>
      <p className="text-sm text-ink-muted mb-6">
        Crea tu primera inspección para revisar un inmueble espacio por espacio.
      </p>
      <Link
        href="/inspecciones/nueva"
        className="inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold text-white bg-action"
      >
        <Plus className="w-4 h-4" />
        Nueva inspección
      </Link>
    </div>
  );
}
