import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { CalculateModuleResult } from "@/app/(app)/categorias/[slug]/[moduleSlug]/actions";

export const dynamic = "force-dynamic";

export default async function GaleriaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const showcase = await prisma.projectShowcase.findUnique({
    where: { id },
    include: {
      savedProject: { select: { module: { select: { name: true, slug: true, category: { select: { slug: true, name: true } } } }, result: true } },
    },
  });

  // Un proyecto PENDING/REJECTED no debe ser accesible por URL directa —
  // se trata igual que "no existe" para cualquiera que no sea el dueño o un
  // admin (esta ruta pública no diferencia por sesión, así que 404 siempre).
  if (!showcase || showcase.status !== "APPROVED") notFound();

  const calcResult = showcase.savedProject?.result as unknown as CalculateModuleResult | undefined;
  const materials = calcResult?.results.filter((r) => r.materialName && !r.isSecondary) ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 pt-8 pb-20">
      <Link href="/galeria" className="text-sm text-ink-muted hover:text-ink transition-colors">
        ← Proyectos terminados
      </Link>

      <h1 className="font-display text-[22px] font-semibold tracking-tight mt-3 mb-4">{showcase.title}</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-2">Antes</p>
          <div className="grid gap-2">
            {showcase.photosBefore.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element -- URL de Vercel Blob
              <img key={url} src={url} alt="Antes" className="w-full rounded-xl object-cover" />
            ))}
          </div>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-2">Después</p>
          <div className="grid gap-2">
            {showcase.photosAfter.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element -- URL de Vercel Blob
              <img key={url} src={url} alt="Después" className="w-full rounded-xl object-cover" />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-white border border-border">
        <p className="text-base leading-[1.65] text-ink whitespace-pre-line">{showcase.story}</p>
      </div>

      {showcase.savedProject && (
        <div className="mt-4 rounded-2xl p-5 bg-peach border border-border">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1">
            Calculado con ObraBien
          </p>
          <Link
            href={`/categorias/${showcase.savedProject.module.category.slug}/${showcase.savedProject.module.slug}`}
            className="font-semibold text-safety hover:underline"
          >
            {showcase.savedProject.module.name}
          </Link>
          {materials.length > 0 && (
            <ul className="mt-3 grid gap-1 text-sm text-ink-muted">
              {materials.map((m) => (
                <li key={m.key}>
                  {m.materialName} — {m.value} {m.unit}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
