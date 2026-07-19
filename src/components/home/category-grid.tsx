"use client";

import { useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import type { Category } from "@/generated/prisma/client";

const INITIAL_VISIBLE = 8;

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.slice(0, visibleCount).map((category) => {
          const Icon = getCategoryIcon(category.icon);
          return (
            <a
              key={category.id}
              href={`/categorias/${category.slug}`}
              className="group relative text-left rounded-2xl p-5 transition-all hover:-translate-y-0.5 bg-white border border-border"
            >
              {category.tag && (
                <span className="absolute top-4 right-4 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FDEDE6] text-safety">
                  {category.tag}
                </span>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-concrete">
                <Icon className="w-5 h-5 text-blueprint" />
              </div>
              <h3 className="font-semibold text-[15px] mb-1">{category.name}</h3>
              <p className="text-xs text-ink-muted">{category.description}</p>
              <ChevronRight className="w-4 h-4 absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity text-blueprint" />
            </a>
          );
        })}
      </div>

      {visibleCount < categories.length && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setVisibleCount(categories.length)}
            className="text-sm font-medium px-6 py-2.5 rounded-full border border-ink inline-flex items-center gap-1.5"
          >
            Ver todas las categorías
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
