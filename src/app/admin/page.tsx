import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [categoryCount, moduleCount, publishedCount] = await Promise.all([
    prisma.category.count(),
    prisma.module.count(),
    prisma.module.count({ where: { published: true } }),
  ]);
  const draftCount = moduleCount - publishedCount;

  const stats = [
    { label: "Categorías", value: categoryCount, href: "/admin/categorias" },
    { label: "Módulos totales", value: moduleCount, href: "/admin/modulos" },
    { label: "Módulos publicados", value: publishedCount, href: "/admin/modulos" },
    { label: "Módulos en borrador", value: draftCount, href: "/admin/modulos" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl p-5 bg-white border border-border hover:border-ink transition-colors"
          >
            <p className="font-display text-3xl font-semibold">{stat.value}</p>
            <p className="text-xs text-ink-muted mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
