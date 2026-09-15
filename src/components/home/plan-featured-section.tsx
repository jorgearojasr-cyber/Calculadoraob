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
  const plan = await prisma.projectPlan.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  if (!plan) return null;

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-10 py-6 sm:py-8">
      <p className="font-mono text-[11px] uppercase mb-2 text-[#5B6577]" style={{ letterSpacing: "0.08em" }}>
        Planifica tu proyecto
      </p>
      <Link
        href={`/plan/${plan.slug}`}
        className="group flex items-center gap-4 sm:gap-6 rounded-2xl p-5 sm:p-6 bg-white border border-[#E4E8EF] hover:border-[#002152]/30 transition-colors"
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-2xl flex items-center justify-center bg-navy/[0.07]">
          <MapIcon className="w-6 h-6 text-navy" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[16px] sm:text-[18px] text-[#10203A]">{plan.title}</h2>
          <p className="text-sm text-[#5B6577] mt-0.5 truncate">{plan.description}</p>
        </div>
        <ArrowRight className="w-4 h-4 flex-shrink-0 text-safety opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
      </Link>
    </section>
  );
}
