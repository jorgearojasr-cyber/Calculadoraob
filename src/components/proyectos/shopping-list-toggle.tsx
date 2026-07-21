"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { toggleShoppingListAction } from "@/app/(app)/proyectos/actions";

export function ShoppingListToggle({ id, initialValue }: { id: string; initialValue: boolean }) {
  const [included, setIncluded] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !included;
    setIncluded(next);
    startTransition(async () => {
      await toggleShoppingListAction(id, next);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
        included
          ? "bg-safety-tint border-safety-border text-safety"
          : "bg-white border-border text-ink-muted hover:border-ink"
      }`}
    >
      {included ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
      {included ? "Quitar de la lista" : "Incluir en lista de compras"}
    </button>
  );
}
