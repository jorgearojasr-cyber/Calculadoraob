import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

// Fase 7B, Corrección 3 — reemplaza el `return null` (página en blanco)
// que usaba [id]/page.tsx cuando el caso no existe O no le pertenece al
// usuario de la sesión. A propósito NO distingue entre ambos casos (ver
// [id]/page.tsx) — mismo mensaje genérico sea cual sea la razón real,
// para no revelar si el id existe pero es de otro usuario.
export function InspectionNotAvailable() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link href="/inspecciones" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink w-fit mb-5">
        <ArrowLeft className="w-4 h-4" />
        Mis inspecciones
      </Link>
      <div className="rounded-2xl p-10 bg-white border border-border text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-navy/[0.07] mx-auto mb-4">
          <ShieldAlert className="w-6 h-6 text-navy" />
        </div>
        <p className="font-display text-lg font-semibold mb-1">Inspección no disponible</p>
        <p className="text-sm text-ink-muted">Esta inspección no existe o no tienes permisos para acceder a ella.</p>
      </div>
    </div>
  );
}
