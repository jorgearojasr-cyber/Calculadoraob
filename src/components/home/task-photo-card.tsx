import Image from "next/image";
import Link from "next/link";
import { getGroupIconClasses } from "@/lib/group-colors";

// Tarjeta con foto para una tarea/opción de "empezar" — foto grande,
// chip con el color del grupo, título, descripción opcional de 1-2
// líneas. Extraída de lo que antes era markup inline en
// exploration-toggle.tsx ("Proyectos más buscados") para reutilizarla
// también en /grupos/[slug] (ver GroupDetailPage) sin duplicar el patrón.
// `description` es opcional a propósito: los proyectos populares de Home
// hoy no tienen descripción cargada y la tarjeta se ve igual sin ella.
export function TaskPhotoCard({
  href,
  imageUrl,
  groupSlug,
  groupName,
  title,
  description,
}: {
  href: string;
  imageUrl: string | null;
  groupSlug: string;
  groupName: string;
  title: string;
  description?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl overflow-hidden bg-white border border-border hover:border-safety/40 hover:-translate-y-0.5 transition-all"
    >
      {imageUrl && (
        <div className="relative w-full aspect-[4/3] bg-concrete">
          <Image src={imageUrl} alt={title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
        </div>
      )}
      <div className="p-4">
        <span
          className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full mb-2 ${getGroupIconClasses(groupSlug)}`}
        >
          {groupName}
        </span>
        <p className="font-semibold text-sm">{title}</p>
        {description && <p className="mt-1 text-xs text-ink-muted leading-snug">{description}</p>}
      </div>
    </Link>
  );
}
