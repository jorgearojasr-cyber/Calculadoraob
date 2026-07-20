import type { Category } from "@/generated/prisma/client";
import { CategoryGrid } from "./category-grid";

export function CategorySection({ categories }: { categories: Category[] }) {
  return (
    <section id="categorias" className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">
            Categorías
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Cada obra tiene su cálculo
          </h2>
        </div>
      </div>

      <CategoryGrid categories={categories} />
    </section>
  );
}
