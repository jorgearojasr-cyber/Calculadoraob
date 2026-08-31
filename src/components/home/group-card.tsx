import Link from "next/link";
import type { ProjectGroup, ProjectTask } from "@/generated/prisma/client";
import { pluralizeUnit } from "@/lib/pluralize";
import { getGroupCountLabel } from "@/lib/group-colors";

type Group = ProjectGroup & { tasks: ProjectTask[] };

// Ítem de "Todas las categorías" (Home) — restyle fiel a la
// especificación de UI (§3.8/§4.5, 2026-08-05): solo nombre + contador,
// sin ícono ni chevron (antes tenía ambos). Es un cambio puramente
// visual — la tarjeta sigue siendo el mismo Link a /grupos/[slug], con
// el mismo dato real (group.tasks.length), nada de la lógica cambió.
export function GroupCard({ group }: { group: Group }) {
  const total = group.tasks.length;
  const countLabel = getGroupCountLabel(group.slug) ?? `${total} ${pluralizeUnit(total, "cálculo")}`;

  return (
    <Link
      href={`/grupos/${group.slug}`}
      className="flex items-center justify-between gap-3 rounded-xl px-[18px] py-4 bg-white border border-[#E4E8EF] hover:border-[#002152]/30 transition-colors"
    >
      <span className="text-[15px] font-semibold text-[#10203A] truncate">{group.name}</span>
      <span className="font-mono text-[15px] text-[#7A8496] flex-shrink-0">{countLabel}</span>
    </Link>
  );
}
