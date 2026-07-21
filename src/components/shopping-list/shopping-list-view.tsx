"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatQuantity } from "@/lib/format-number";
import { clearShoppingListAction, toggleShoppingCheckAction } from "@/app/(app)/lista-compras/actions";
import type { ShoppingListData, ShoppingListLine } from "@/lib/shopping-list";

const currencyFormatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

export function ShoppingListView({ data }: { data: ShoppingListData }) {
  const router = useRouter();
  const [lines, setLines] = useState<ShoppingListLine[]>(data.lines);
  const [isPending, startTransition] = useTransition();
  const [clearing, setClearing] = useState(false);

  const handleToggleCheck = (line: ShoppingListLine) => {
    const next = !line.checked;
    setLines((prev) =>
      prev.map((l) => (l.materialName === line.materialName && l.unit === line.unit ? { ...l, checked: next } : l))
    );
    startTransition(async () => {
      await toggleShoppingCheckAction(line.materialName, line.unit, next);
    });
  };

  const handleClear = () => {
    if (!window.confirm("¿Vaciar la lista completa? Esto quita todos los proyectos de la lista y borra el estado de comprado.")) {
      return;
    }
    setClearing(true);
    startTransition(async () => {
      await clearShoppingListAction();
      setClearing(false);
      router.refresh();
    });
  };

  if (data.includedProjectCount === 0) {
    return (
      <div className="rounded-2xl p-8 bg-white border border-border text-center">
        <ShoppingCart className="w-8 h-8 text-ink-faint mx-auto mb-3" />
        <p className="text-sm font-medium mb-1">Todavía no tienes proyectos en la lista</p>
        <p className="text-sm text-ink-muted mb-4">
          Ve a{" "}
          <Link href="/proyectos" className="text-safety font-medium hover:underline">
            Mis proyectos
          </Link>{" "}
          y marca &quot;Incluir en lista de compras&quot; en los que quieras consolidar.
        </p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl p-8 bg-white border border-border text-center">
        <ShoppingCart className="w-8 h-8 text-ink-faint mx-auto mb-3" />
        <p className="text-sm font-medium mb-1">Sin materiales que mostrar</p>
        <p className="text-sm text-ink-muted">
          Los {data.includedProjectCount} proyecto(s) incluidos no tienen líneas de material (solo valores
          informativos).
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-ink-muted">
          {data.includedProjectCount} proyecto(s) incluido(s) · {lines.length} material(es)
        </p>
        <button
          onClick={handleClear}
          disabled={isPending}
          className="text-xs font-medium text-safety hover:underline inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {clearing ? "Vaciando…" : "Vaciar lista completa"}
        </button>
      </div>

      <div className="grid gap-3">
        {lines.map((line) => (
          <div
            key={`${line.materialName}__${line.unit}`}
            className={`rounded-2xl p-5 border transition-colors ${
              line.checked ? "bg-concrete border-border" : "bg-white border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={line.checked}
                onChange={() => handleToggleCheck(line)}
                className="mt-1 w-4 h-4 flex-shrink-0"
                aria-label={`Comprado: ${line.materialName}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <span className={`font-medium text-[15px] ${line.checked ? "line-through text-ink-muted" : ""}`}>
                    {line.materialName}
                  </span>
                  <span className="font-display text-xl font-semibold whitespace-nowrap">
                    {formatQuantity(line.quantity)}{" "}
                    <span className="text-sm font-body text-ink-muted">{line.unit}</span>
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-1">de: {line.sourceProjectNames.join(", ")}</p>
                {line.cost != null && (
                  <p className="text-sm font-semibold mt-2">Subtotal: ${currencyFormatter.format(line.cost)}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.anyCost && (
        <div className="mt-4 rounded-2xl p-5 bg-navy/[0.04] border border-navy/20">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-semibold text-[15px]">Total aproximado</span>
            <span className="font-display text-xl font-bold whitespace-nowrap">
              ${currencyFormatter.format(data.totalCost)}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Total aproximado (solo materiales con precio ingresado en al menos un proyecto)
          </p>
        </div>
      )}
    </div>
  );
}
