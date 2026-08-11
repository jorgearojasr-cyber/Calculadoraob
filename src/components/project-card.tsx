import Image from "next/image";
import Link from "next/link";
import { Hammer } from "lucide-react";
import { pluralizeUnit } from "@/lib/pluralize";

// Sistema visual único para toda tarjeta de proyecto/calculadora de la app
// (Fase 1 de homogeneización visual, 07-ago-2026) — reemplaza las
// implementaciones independientes que existían antes en el carrusel de
// Home, /grupos/[slug], /categorias/[slug] y /buscar. Estructura fija:
// imagen 16:9 -> categoría -> título -> pasos + CTA. Solo cambia el
// contenido (categoría/título/pasos/imagen), nunca la estructura — una
// tarjeta sin imagen usa el mismo alto que una con imagen (placeholder,
// nunca el bloque de imagen se omite).
export function ProjectCard({
  href,
  title,
  categoryLabel,
  imageUrl,
  imageAlt,
  stepCount,
  className,
}: {
  href: string;
  title: string;
  categoryLabel: string;
  // null/undefined: todavía no hay foto para este proyecto (fase 2) — se
  // muestra el placeholder, nunca se omite el contenedor de imagen.
  imageUrl?: string | null;
  imageAlt?: string;
  // null: sin dato real de pasos (ej. una tarea que no enlaza a un módulo
  // con preguntas) — se omite el texto en vez de mostrar "0 pasos".
  stepCount?: number | null;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-2xl overflow-hidden bg-white border border-border hover:border-safety/40 hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2${className ? ` ${className}` : ""}`}
    >
      <div className="relative w-full aspect-[16/9] shrink-0 overflow-hidden bg-concrete">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 33vw, 320px"
          />
        ) : (
          <ProjectCardImagePlaceholder />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="w-fit font-mono text-[11px] uppercase tracking-wide text-safety">{categoryLabel}</span>
        {/* min-h reserva el espacio de 2 líneas siempre — un título de 1
            línea y uno de 2 líneas deben producir tarjetas de exactamente
            la misma altura, no solo dentro de la misma fila del grid. */}
        <h3 className="min-h-[2.625rem] text-[15px] font-semibold leading-snug line-clamp-2">{title}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-mono text-xs text-ink-muted">
            {stepCount != null ? `${stepCount} ${pluralizeUnit(stepCount, "paso")}` : ""}
          </span>
          <span className="shrink-0 text-sm font-bold text-action">Calcular →</span>
        </div>
      </div>
    </Link>
  );
}

// Placeholder neutro mientras el proyecto no tiene foto real cargada
// (fase 2, fuera de alcance) — mismo contenedor 16:9, mismo alto, nunca se
// omite ni deja un hueco vacío. Ícono genérico, no una ilustración
// específica del rubro (evita insinuar un estilo fotográfico definitivo
// antes de que se decida en la próxima fase).
function ProjectCardImagePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-concrete" aria-hidden="true">
      <Hammer className="h-7 w-7 text-ink-faint" strokeWidth={1.5} />
    </div>
  );
}
