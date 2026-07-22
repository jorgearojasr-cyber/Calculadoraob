import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function StartTaskPage({ params }: { params: { taskSlug: string } }) {
  const task = await prisma.projectTask.findUnique({
    where: { slug: params.taskSlug },
    include: {
      moduleLinks: {
        orderBy: { order: "asc" },
        include: { module: { include: { category: true } } },
      },
    },
  });

  if (!task) notFound();

  // Un solo módulo: sin paso intermedio, directo al wizard.
  if (task.moduleLinks.length === 1) {
    const link = task.moduleLinks[0];
    const query = link.presetQuery ? `?${link.presetQuery}` : "";
    redirect(`/categorias/${link.module.category.slug}/${link.module.slug}${query}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pt-8 pb-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mt-6 mb-1">{task.name}</h1>
      <p className="text-sm text-ink-muted mb-8">Elige la opción que mejor se ajusta a tu proyecto</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {task.moduleLinks.map((link) => {
          const query = link.presetQuery ? `?${link.presetQuery}` : "";
          return (
            <Link
              key={link.id}
              href={`/categorias/${link.module.category.slug}/${link.module.slug}${query}`}
              className="group relative text-left rounded-2xl p-5 transition-all hover:-translate-y-0.5 bg-white border border-border hover:border-safety/40"
            >
              {link.label && (
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full mb-2 bg-safety-tint text-safety">
                  {link.label}
                </span>
              )}
              <h3 className="font-semibold text-[15px] mb-1">{link.module.name}</h3>
              <p className="text-xs text-ink-muted">{link.module.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
