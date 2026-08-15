import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProgressCount } from "@/lib/inspecciones/progress";

// Fase 3: ahora es un link a la vista de checklist de ese espacio
// (?space=<id>, ver [id]/page.tsx) — antes de sola lectura. Muestra
// exactamente lo pedido: nombre, %, "X / Y revisados".
export function InspectionSpaceCard({ href, name, progress }: { href: string; name: string; progress: ProgressCount }) {
  return (
    <Link href={href} className="block rounded-2xl p-5 bg-white border border-border hover:border-safety/40 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-[15px]">{name}</p>
        <ArrowRight className="w-4 h-4 text-ink-faint flex-shrink-0" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="h-1.5 flex-1 max-w-[100px] rounded-full bg-border overflow-hidden mr-3">
          <div className="h-full bg-safety rounded-full" style={{ width: `${progress.percent}%` }} />
        </div>
        <span className="font-display text-sm font-semibold flex-shrink-0">{progress.percent}%</span>
      </div>
      <p className="text-xs text-ink-muted mt-1">
        {progress.answered} / {progress.total} revisados
      </p>
    </Link>
  );
}
