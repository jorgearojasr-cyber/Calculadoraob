import Link from "next/link";
import { ArrowRight, Map as MapIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";

// Home ObraBien V2 (2026-09-14, punto 9 del pedido) — da visibilidad real
// a PLANIFICA en el Home: antes de esta fase, `/plan/construir-una-piscina`
// no tenía ninguna superficie que enlazara a él (ver auditoría, "huérfano
// de navegación", docs/product-feature-registry.md). El título/descripción
// se leen de `ProjectPlan` (no se hardcodea el texto), así que si el plan
// cambia de nombre en la BD, esta sección lo refleja solo — no se toca
// `ProjectPlan` ni sus fases (NO TOCAR, punto 20 del pedido), solo se lee
// el primero disponible.
//
// No se confunde con el configurador `piscina-integral` (Module,
// published:false) — este es el plan de fases (ProjectPlan), un camino
// distinto e intencionalmente separado (ver comentario en
// product-features.ts). Si no hay ningún ProjectPlan en la BD, la sección
// se omite completa (mismo criterio que RecentProjects: no mostrar un
// estado vacío grande).
export async function PlanFeaturedSection() {
  // Orden determinista (cierre QA, 2026-09-14): createdAt ya alcanza en la
  // práctica (un solo plan sembrado hoy), pero un empate exacto de
  // createdAt (mismo milisegundo, ej. un seed que crea varios planes en el
  // mismo batch) dejaría el resultado a merced del orden no garantizado de
  // Postgres. Se agrega `id` como desempate — cuid, único y generado en
  // orden de creación, así que ordena igual que createdAt sin empates
  // posibles. Ningún campo nuevo: ambos ya existen en ProjectPlan.
  const plan = await prisma.projectPlan.findFirst({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: { phases: { select: { id: true } } },
  });
  if (!plan) return null;
  const phaseCount = plan.phases.length;

  return (
    <section className="max-w-3xl lg:max-w-6xl mx-auto px-4 sm:px-10 py-5 sm:py-7">
      <p className="font-body text-[12px] font-bold uppercase mb-2.5 text-ds-text-tertiary" style={{ letterSpacing: "0.08em" }}>
        Planifica tu proyecto
      </p>
      <Link
        href={`/plan/${plan.slug}`}
        className="group flex items-center gap-4 sm:gap-6 rounded-[20px] p-5 sm:p-7 border transition-all hover:shadow-[0_12px_28px_rgba(16,32,58,.10)]"
        style={{ backgroundColor: "#EEF3FA", borderColor: "#D8E3F1" }}
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-2xl flex items-center justify-center bg-white shadow-sm">
          <MapIcon className="w-7 h-7 text-safety" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          {phaseCount > 0 && (
            <span
              className="inline-block font-body text-[10px] font-bold uppercase text-white px-[9px] py-[3px] rounded-[5px] mb-1.5"
              style={{ letterSpacing: "0.1em", backgroundColor: "#002152" }}
            >
              Guía por etapas · {phaseCount} {phaseCount === 1 ? "fase" : "fases"}
            </span>
          )}
          <h2 className="font-display font-extrabold text-[17px] sm:text-[19px] text-ds-navy-900">{plan.title}</h2>
          <p className="text-sm text-[#5B6577] mt-0.5 line-clamp-2 sm:truncate">{plan.description}</p>
        </div>
        <span className="hidden sm:inline-flex flex-shrink-0 items-center gap-1.5 text-sm font-bold text-safety">
          Ver plan
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </Link>
    </section>
  );
}
