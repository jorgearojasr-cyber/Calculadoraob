import Link from "next/link";
import { getCategoryIcon } from "@/lib/category-icons";

// Único lugar que decide qué grupos llevan el indicador de "aviso
// reforzado" (punto carmín) en su chip — ni ProjectGroup ni ProjectTask
// tienen un campo en la base para esto (el riesgo real vive a nivel de
// módulo/norma, no de grupo), así que se declara acá a mano. Si se agrega
// un módulo de alto riesgo a otro grupo en el futuro, hay que sumarlo aquí.
const REINFORCED_WARNING_GROUP_SLUGS = new Set(["agua-y-gas"]);

// Chip de grupo — componente único reusado en la tira de la Home y en la
// fila de "otros grupos" de /grupos/[slug], para que el indicador de aviso
// reforzado no dependa de que cada lugar lo reimplemente por su cuenta.
export function GroupChip({
  slug,
  name,
  icon,
}: {
  slug: string;
  name: string;
  icon: string;
}) {
  const Icon = getCategoryIcon(icon);
  const isReinforced = REINFORCED_WARNING_GROUP_SLUGS.has(slug);

  return (
    <Link
      href={`/grupos/${slug}`}
      className="inline-flex items-center gap-1.5 flex-shrink-0 rounded-full pl-3 pr-3.5 py-2 text-sm font-medium bg-white border border-border text-ink-muted hover:border-safety/40 hover:text-ink transition-colors"
    >
      <Icon className="w-4 h-4" />
      {name}
      {isReinforced && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0"
          role="img"
          aria-label="Aviso reforzado de seguridad"
        />
      )}
    </Link>
  );
}
