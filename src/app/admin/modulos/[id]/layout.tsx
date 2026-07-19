import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuleTabNav } from "@/components/admin/module-tab-nav";

export const dynamic = "force-dynamic";

export default async function ModuleDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const mod = await prisma.module.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, published: true, category: { select: { name: true } } },
  });

  if (!mod) notFound();

  return (
    <div>
      <Link href="/admin/modulos" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4">
        ← Módulos
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{mod.name}</h1>
        <span className="text-xs text-ink-muted">{mod.category.name}</span>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full font-mono ${
            mod.published ? "bg-[#E6F4EA] text-[#1E7A34]" : "bg-[#F1EFE9] text-ink-muted"
          }`}
        >
          {mod.published ? "Publicado" : "Borrador"}
        </span>
      </div>

      <ModuleTabNav moduleId={mod.id} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
