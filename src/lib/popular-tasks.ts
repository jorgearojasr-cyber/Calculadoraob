import { prisma } from "@/lib/prisma";
import { getDisplayStepCount } from "@/lib/module-step-count";

// Selección curada a mano (no hay datos reales de popularidad todavía) —
// compartida entre el carrusel del Hero (Home) y, antes del rediseño de
// Home 2026-08-05, la grilla de ExplorationToggle. Una sola fuente de
// verdad para no duplicar la lista ni el mapa de fotos entre componentes.
export const CURATED_TASK_SLUGS = [
  "construir-un-radier",
  "pintar-una-habitacion",
  "instalar-ceramica",
  "cambiar-o-instalar-un-wc",
  "instalar-un-enchufe-reemplazo",
  "construir-una-piscina",
];

export const TASK_IMAGES: Record<string, string> = {
  "cambiar-o-instalar-un-wc": "/images/categorias/wc.png",
  "instalar-un-enchufe-reemplazo": "/images/categorias/enchufe.png",
  "construir-un-radier": "/images/categorias/radier.png",
  "pintar-una-habitacion": "/images/categorias/pintar-habitacion.png",
  "instalar-ceramica": "/images/categorias/ceramica.png",
  "construir-una-piscina": "/images/categorias/piscina.png",
};

// Vacío desde la fase "piscina-integral como experiencia principal"
// (2026-09-04). Antes, "Construir una piscina" no tenía un módulo único
// que representara a "piscina en general", así que este override la
// enlazaba a /grupos/piscinas (el selector de forma con fotos). Ahora la
// ProjectTask tiene un único ProjectTaskModule hacia piscina-integral, así
// que el href genérico `/empezar/${slug}` (ver getPopularTasks abajo) ya
// redirige directo al configurador con el mínimo de clics — sin necesidad
// de un override hardcodeado.
export const TASK_HREF_OVERRIDES: Record<string, string> = {};

export type PopularTaskCard = {
  id: string;
  slug: string;
  name: string;
  href: string;
  image: string | null;
  groupName: string;
  // Único meta-dato real que mostramos en la tarjeta (decisión de
  // producto 2026-08-05): conteo real de preguntas del primer módulo
  // enlazado, no un valor inventado. Sin "minutos estimados" — no existe
  // ninguna fuente real de la que derivarlo. Sin descripción — el campo
  // ProjectTask.description está vacío para 5 de las 6 tareas curadas;
  // mostrarlo solo en la que sí lo tiene se vería inconsistente, así
  // que se omite en las 6 hasta que exista contenido real para todas.
  stepCount: number | null;
};

export async function getPopularTasks(): Promise<PopularTaskCard[]> {
  const raw = await prisma.projectTask.findMany({
    where: { slug: { in: CURATED_TASK_SLUGS } },
    include: {
      group: { select: { name: true, slug: true } },
      moduleLinks: {
        orderBy: { order: "asc" },
        take: 1,
        include: { module: { select: { slug: true, imageUrl: true, _count: { select: { questions: true } } } } },
      },
    },
  });

  return CURATED_TASK_SLUGS.map((slug) => raw.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      href: TASK_HREF_OVERRIDES[t.slug] ?? `/empezar/${t.slug}`,
      // TASK_IMAGES (curada a mano) tiene prioridad mientras exista — es el
      // contenido fotográfico ya cargado hoy; Module.imageUrl es el campo
      // único de fase 2 (todavía vacío), dejado como fallback para que la
      // misma imagen del proyecto se reutilice sola apenas se cargue ahí,
      // sin tocar este archivo de nuevo.
      image: TASK_IMAGES[t.slug] ?? t.moduleLinks[0]?.module.imageUrl ?? null,
      groupName: t.group.name,
      stepCount: getDisplayStepCount(t.moduleLinks[0]?.module.slug, t.moduleLinks[0]?.module._count.questions),
    }));
}
