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
      className={`max-w-full inline-flex items-center gap-1.5 font-body text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
        included
          ? "bg-ds-orange-100 border-ds-orange-600/30 text-ds-orange-700"
          : "bg-white border-ds-border text-ds-text-secondary hover:border-ds-navy-900/40"
      }`}
    >
      {included ? <Check className="w-3.5 h-3.5 shrink-0" /> : <ShoppingCart className="w-3.5 h-3.5 shrink-0" />}
      <span className="truncate min-w-0">{included ? "Quitar de la lista" : "Lista de compras"}</span>
    </button>
  );
}
