import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// Design Spec v1.0 (OBRABIEN.CL, fase "Implementación Design Spec v1.0",
// 2026-09-15) — sección 12 del pedido. Componente base reutilizable para
// las 6 acciones del Home (`QuickActionsGrid`) — antes estaba inline
// dentro de ese componente; se extrae acá porque el pedido pide
// explícitamente "usar ActionCard reutilizable".
//
// Medidas exactas del Spec: min-height 92px, padding 14px, radius 14px
// (ds-card), icon container 36px, icon 18px, sombra ds-card-rest por
// defecto → ds-card-elevated en hover, active: scale .98.
export function ActionCard({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2.5 rounded-ds-card p-[14px] bg-white border border-ds-border shadow-ds-card-rest hover:shadow-ds-card-elevated active:scale-[0.98] transition-all"
      style={{ minHeight: 92 }}
    >
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-ds-navy-100 flex-shrink-0">
        <Icon className="w-[18px] h-[18px] text-ds-navy-900" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <h3 className="font-display font-extrabold text-[15px] text-ds-navy-900 leading-tight">{label}</h3>
        <p className="font-body text-[13px] text-ds-text-secondary mt-0.5 leading-snug">{description}</p>
      </div>
    </Link>
  );
}
