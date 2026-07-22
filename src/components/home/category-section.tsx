import type { Category } from "@/generated/prisma/client";
import { CategoryGrid } from "./category-grid";

// Sección secundaria/discreta — el punto de entrada principal ahora es
// ProjectGroupsSection (Fase 2). Esta queda para quien prefiere navegar
// por rubro técnico en vez de por proyecto.
export function CategorySection({ categories }: { categories: Category[] }) {
  return (
    <section id="categorias" className="max-w-6xl mx-auto px-6 py-10 border-t border-border">
      <div className="mb-6">
        <p className="text-xs text-ink-faint mb-1">¿Prefieres navegar por rubro?</p>
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink-muted">
          Categorías técnicas
        </h2>
      </div>

      <CategoryGrid categories={categories} />
    </section>
  );
}
