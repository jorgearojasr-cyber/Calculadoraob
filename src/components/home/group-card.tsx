import Link from "next/link";
import type { ProjectGroup, ProjectTask } from "@/generated/prisma/client";
import { pluralizeUnit } from "@/lib/pluralize";
import { getGroupCountLabel } from "@/lib/group-colors";

type Group = ProjectGroup & { tasks: ProjectTask[] };

// Ítem de "Todas las categorías" (Home) — restyle fiel a la
// especificación de UI (§3.8/§4.5, 2026-08-05): solo nombre + contador,
// sin ícono ni chevron (antes tenía ambos). La tarjeta sigue siendo el
// mismo Link a /grupos/[slug], con el mismo dato real (group.tasks.length),
// nada de la lógica cambió.
//
// Home ObraBien V2 (2026-09-14, punto 12 del pedido — "evitar textos
// truncados"): en la grilla de 2 columnas de mobile, el layout en fila
// (nombre + contador lado a lado, ambos compitiendo por ~170px) truncaba
// nombres largos a cosas como "Est..." o "Elec..." (bug real encontrado en
// la verificación visual de esta fase). Se apila en columna en mobile
// (nombre completo arriba, contador debajo) y vuelve a fila desde `sm:` en
// adelante, donde las tarjetas tienen más ancho y el layout original no
// truncaba.
export function GroupCard({ group }: { group: Group }) {
  const total = group.tasks.length;
  const countLabel = getGroupCountLabel(group.slug) ?? `${total} ${pluralizeUnit(total, "cálculo")}`;

  return (
    <Link
      href={`/grupos/${group.slug}`}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 rounded-xl px-[18px] py-4 bg-white border border-[#E4E8EF] hover:border-[#002152]/30 transition-colors"
    >
      <span className="text-[15px] font-semibold text-[#10203A]">{group.name}</span>
      <span className="font-mono text-[13px] sm:text-[15px] text-[#7A8496] sm:flex-shrink-0">{countLabel}</span>
    </Link>
  );
}
